import { db } from "@/lib/db";
import { logger, startTimer } from "@/lib/logger";

/**
 * Returns authoritative Indian Standard Time (IST) current YYYY-MM-DD, tomorrow YYYY-MM-DD, and current hour (0-23).
 * Safe on both local Windows/Linux and Vercel UTC serverless containers.
 */
export function getCurrentIstClock(): {
  todayDateStr: string;
  tomorrowDateStr: string;
  currentHourIst: number;
  formattedTimeIst: string;
} {
  const now = new Date();
  const istParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const getPart = (type: string) =>
    istParts.find((p) => p.type === type)?.value || "00";

  const yyyy = getPart("year");
  const mm = getPart("month");
  const dd = getPart("day");
  const hh = Number(getPart("hour"));
  const min = getPart("minute");

  const todayDateStr = `${yyyy}-${mm}-${dd}`;

  // Calculate tomorrow in IST
  const tomorrowDate = new Date(`${todayDateStr}T00:00:00+05:30`);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(tomorrowDate);

  const tY = tParts.find((p) => p.type === "year")?.value || yyyy;
  const tM = tParts.find((p) => p.type === "month")?.value || mm;
  const tD = tParts.find((p) => p.type === "day")?.value || dd;

  return {
    todayDateStr,
    tomorrowDateStr: `${tY}-${tM}-${tD}`,
    currentHourIst: hh === 24 ? 0 : hh,
    formattedTimeIst: `${hh}:${min} IST`,
  };
}

/**
 * Validates whether a target delivery date (YYYY-MM-DD) is eligible for modification before 8:00 PM IST cut-off
 */
export function validateEightPmCutoff(targetDateStr: string): {
  allowed: boolean;
  reason?: string;
} {
  const clock = getCurrentIstClock();

  if (targetDateStr <= clock.todayDateStr) {
    return {
      allowed: false,
      reason: `Deliveries for today (${clock.todayDateStr}) or past dates cannot be modified.`,
    };
  }

  // If user tries to modify tomorrow's delivery at or after 20:00 (8:00 PM IST) tonight
  if (targetDateStr === clock.tomorrowDateStr && clock.currentHourIst >= 20) {
    return {
      allowed: false,
      reason: `8:00 PM Cut-Off Passed (Current time: ${clock.formattedTimeIst}). Tomorrow morning's 6:00 AM – 8:00 AM farm harvest is already locked. You can still modify dates after ${clock.tomorrowDateStr}.`,
    };
  }

  return { allowed: true };
}

/**
 * Helper to add +1 day to a YYYY-MM-DD string
 */
function getNextDayString(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Executes Pause, Resume, Direct Cancel (when Pause Quota is exhausted), or Order Note update in MySQL
 */
export async function mutateSubscriptionCalendarDay(params: {
  subscriptionId: string;
  targetDateStr: string;
  action: "TOGGLE_PAUSE_OR_CANCEL" | "UPDATE_NOTE";
  orderNote?: string;
  traceId: string;
}) {
  const getElapsed = startTimer();

  // 1. Load Subscription and all its Calendar Schedule Days
  const sub = await db.subscription.findUnique({
    where: { id: params.subscriptionId },
    include: {
      scheduleDays: {
        orderBy: { dayNumber: "asc" },
      },
    },
  });

  if (!sub) {
    return {
      success: false,
      status: 404,
      error: "Subscription not found in database.",
    };
  }

  const targetRow = sub.scheduleDays.find(
    (d) => d.deliveryDate === params.targetDateStr
  );

  if (!targetRow) {
    return {
      success: false,
      status: 404,
      error: `Date ${params.targetDateStr} is not part of this subscription schedule.`,
    };
  }

  // 2. Enforce 8:00 PM IST Evening Cut-Off
  const cutoff = validateEightPmCutoff(params.targetDateStr);
  if (!cutoff.allowed) {
    logger.warn({
      module: "ORDERS",
      action: "CUTOFF_8PM_BLOCKED",
      traceId: params.traceId,
      durationMs: getElapsed(),
      message: cutoff.reason || "8 PM cut-off passed",
      meta: { subscriptionId: sub.orderId, targetDateStr: params.targetDateStr },
    });
    return {
      success: false,
      status: 400,
      error: cutoff.reason,
    };
  }

  // 3A. Handle Optional Doorstep Order Note Update for that specific date
  if (params.action === "UPDATE_NOTE") {
    const cleanedNote = String(params.orderNote || "").trim();
    await db.dailyDeliverySchedule.update({
      where: { id: targetRow.id },
      data: { orderNote: cleanedNote },
    });

    const refreshed = await db.subscription.findUnique({
      where: { id: sub.id },
      include: { scheduleDays: { orderBy: { dayNumber: "asc" } } },
    });

    logger.info({
      module: "ORDERS",
      action: "DATE_NOTE_UPDATED",
      traceId: params.traceId,
      durationMs: getElapsed(),
      message: `Updated delivery note for ${params.targetDateStr} on ${sub.orderId}`,
    });

    return {
      success: true,
      message: `Saved delivery note for ${params.targetDateStr}!`,
      subscription: refreshed,
    };
  }

  // 3B. Handle Pause / Resume / Quota-Exceeded Direct Cancel
  if (targetRow.status === "CANCELLED") {
    return {
      success: false,
      status: 400,
      error: "This delivery date was already cancelled after exceeding your pause quota and cannot be resumed.",
    };
  }

  // Case I: Day is currently PAUSED -> RESUME it back to SCHEDULED & remove the last carry-forward day
  if (targetRow.status === "PAUSED") {
    const lastDay = sub.scheduleDays[sub.scheduleDays.length - 1];

    const updatedSub = await db.$transaction(async (tx) => {
      await tx.dailyDeliverySchedule.update({
        where: { id: targetRow.id },
        data: { status: "SCHEDULED" },
      });

      // Remove the extra carried-forward day at the tail if schedule length exceeds totalDeliveries
      if (
        sub.scheduleDays.length > sub.totalDeliveries &&
        lastDay &&
        lastDay.id !== targetRow.id
      ) {
        await tx.dailyDeliverySchedule.delete({
          where: { id: lastDay.id },
        });
      }

      const newPausesUsed = Math.max(0, sub.pausesUsedCount - 1);
      return tx.subscription.update({
        where: { id: sub.id },
        data: { pausesUsedCount: newPausesUsed },
        include: { scheduleDays: { orderBy: { dayNumber: "asc" } } },
      });
    });

    logger.info({
      module: "ORDERS",
      action: "DELIVERY_DATE_RESUMED",
      traceId: params.traceId,
      durationMs: getElapsed(),
      message: `Resumed delivery for ${params.targetDateStr} on ${sub.orderId}`,
    });

    return {
      success: true,
      message: `Resumed morning 6:00 AM – 8:00 AM delivery for ${params.targetDateStr}!`,
      subscription: updatedSub,
    };
  }

  // Case II: Day is SCHEDULED and user has remaining pauses (Weekly <= 2, Monthly <= 5) -> PAUSE & Carry Forward (+1 day)
  if (sub.pausesUsedCount < sub.maxPausesAllowed) {
    const lastDay = sub.scheduleDays[sub.scheduleDays.length - 1];
    const carryForwardDateStr = getNextDayString(
      lastDay ? lastDay.deliveryDate : params.targetDateStr
    );
    const nextDayNumber = (lastDay ? lastDay.dayNumber : sub.totalDeliveries) + 1;
    const newPausesCount = sub.pausesUsedCount + 1;

    const updatedSub = await db.$transaction(async (tx) => {
      await tx.dailyDeliverySchedule.update({
        where: { id: targetRow.id },
        data: { status: "PAUSED" },
      });

      await tx.dailyDeliverySchedule.create({
        data: {
          subscriptionId: sub.id,
          dayNumber: nextDayNumber,
          deliveryDate: carryForwardDateStr,
          status: "SCHEDULED",
          orderNote: sub.deliveryNote,
        },
      });

      return tx.subscription.update({
        where: { id: sub.id },
        data: { pausesUsedCount: newPausesCount },
        include: { scheduleDays: { orderBy: { dayNumber: "asc" } } },
      });
    });

    logger.info({
      module: "ORDERS",
      action: "DELIVERY_DATE_PAUSED_CARRIED_FORWARD",
      traceId: params.traceId,
      durationMs: getElapsed(),
      message: `Paused ${params.targetDateStr} (${newPausesCount}/${sub.maxPausesAllowed}) -> Carried forward to ${carryForwardDateStr}`,
    });

    return {
      success: true,
      message: `Paused ${params.targetDateStr} (${newPausesCount}/${sub.maxPausesAllowed} pauses used). Your morning delivery is carried forward to ${carryForwardDateStr}!`,
      subscription: updatedSub,
    };
  }

  // Case III: Pause Quota Exhausted (3rd+ on Weekly, 6th+ on Monthly) -> Direct CANCEL (No carry-forward)
  const newRemaining = Math.max(0, sub.remainingDeliveries - 1);

  const updatedSub = await db.$transaction(async (tx) => {
    await tx.dailyDeliverySchedule.update({
      where: { id: targetRow.id },
      data: { status: "CANCELLED" },
    });

    return tx.subscription.update({
      where: { id: sub.id },
      data: { remainingDeliveries: newRemaining },
      include: { scheduleDays: { orderBy: { dayNumber: "asc" } } },
    });
  });

  logger.warn({
    module: "ORDERS",
    action: "DELIVERY_CANCELLED_QUOTA_EXCEEDED",
    traceId: params.traceId,
    durationMs: getElapsed(),
    message: `Pause quota (${sub.maxPausesAllowed}) exceeded on ${sub.orderId}. Directly cancelled ${params.targetDateStr}.`,
  });

  return {
    success: true,
    message: `Pause limit (${sub.maxPausesAllowed}/${sub.maxPausesAllowed}) reached. Delivery for ${params.targetDateStr} has been CANCELLED without carry-forward.`,
    subscription: updatedSub,
  };
}