import { db } from "@/lib/db";
import { logger, startTimer } from "@/lib/logger";

export function getCurrentIstClock(): {
  todayDateStr: string;
  tomorrowDateStr: string;
  dayAfterTomorrowDateStr: string;
  currentHourIst: number;
  currentMinuteIst: number;
  isBefore1145PmIst: boolean;
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
  const rawHh = Number(getPart("hour"));
  const hh = rawHh === 24 ? 0 : rawHh;
  const minStr = getPart("minute");
  const min = Number(minStr);

  const todayDateStr = `${yyyy}-${mm}-${dd}`;

  const formatIstDateOffset = (daysToAdd: number): string => {
    const d = new Date(`${todayDateStr}T00:00:00+05:30`);
    d.setDate(d.getDate() + daysToAdd);
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(d);
    const y = parts.find((p) => p.type === "year")?.value || yyyy;
    const m = parts.find((p) => p.type === "month")?.value || mm;
    const day = parts.find((p) => p.type === "day")?.value || dd;
    return `${y}-${m}-${day}`;
  };

  // Before 11:45 PM IST (i.e. hour < 23, or hour === 23 and minute < 45)
  const isBefore1145PmIst = hh < 23 || (hh === 23 && min < 45);

  return {
    todayDateStr,
    tomorrowDateStr: formatIstDateOffset(1),
    dayAfterTomorrowDateStr: formatIstDateOffset(2),
    currentHourIst: hh,
    currentMinuteIst: min,
    isBefore1145PmIst,
    formattedTimeIst: `${String(hh).padStart(2, "0")}:${minStr} IST`,
  };
}

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

  if (targetDateStr === clock.tomorrowDateStr && clock.currentHourIst >= 20) {
    return {
      allowed: false,
      reason: `8:00 PM Cut-Off Passed (Current time: ${clock.formattedTimeIst}). Tomorrow morning's 6:00 AM – 8:00 AM farm harvest is already locked. You can still modify dates after ${clock.tomorrowDateStr}.`,
    };
  }

  return { allowed: true };
}

function getNextDayString(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function mutateSubscriptionCalendarDay(params: {
  customerId: string;
  subscriptionIdOrOrderId: string;
  targetDateStr: string;
  action: "TOGGLE_PAUSE_OR_CANCEL" | "UPDATE_NOTE";
  orderNote?: string;
  traceId: string;
}) {
  const getElapsed = startTimer();

  if (!params.customerId) {
    return {
      success: false,
      status: 401,
      error: "Authentication required to modify subscription schedule.",
    };
  }

  const sub = await db.subscription.findFirst({
    where: {
      customerId: params.customerId,
      OR: [
        { id: params.subscriptionIdOrOrderId },
        { orderId: params.subscriptionIdOrOrderId },
      ],
    },
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
      error: "Subscription not found or does not belong to your account.",
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

  // 3A. Handle Optional Doorstep Order Note Update
  if (params.action === "UPDATE_NOTE") {
    const cleanedNote = String(params.orderNote || "")
      .trim()
      .slice(0, 250);
    await db.dailyDeliverySchedule.update({
      where: { id: targetRow.id },
      data: { orderNote: cleanedNote },
    });

    const refreshed = await db.subscription.findUnique({
      where: { id: sub.id },
      include: { scheduleDays: { orderBy: { dayNumber: "asc" } } },
    });

    return {
      success: true,
      message: `Saved delivery note for ${params.targetDateStr}!`,
      subscription: refreshed,
    };
  }

  if (targetRow.status === "CANCELLED") {
    return {
      success: false,
      status: 400,
      error:
        "This delivery date was already cancelled after exceeding your pause quota and cannot be resumed.",
    };
  }

  // Case I: Day is currently PAUSED -> Atomically RESUME to SCHEDULED & delete only the latest SCHEDULED carry-forward row (Bug 6 & Bug 7 Fix)
  if (targetRow.status === "PAUSED") {
    try {
      const updatedSub = await db.$transaction(async (tx) => {
        const dayClaim = await tx.dailyDeliverySchedule.updateMany({
          where: { id: targetRow.id, status: "PAUSED" },
          data: { status: "SCHEDULED" },
        });

        if (dayClaim.count === 0) {
          throw new Error("CONCURRENT_MODIFICATION");
        }

        // Bug 7 Fix: Find the latest SCHEDULED carry-forward row (not targetRow) so we never delete a PAUSED or CANCELLED row
        const allRows = await tx.dailyDeliverySchedule.findMany({
          where: { subscriptionId: sub.id },
          orderBy: { deliveryDate: "desc" },
        });

        if (allRows.length > sub.totalDeliveries) {
          const tailScheduledRow = allRows.find(
            (r) => r.status === "SCHEDULED" && r.id !== targetRow.id
          );
          if (tailScheduledRow) {
            await tx.dailyDeliverySchedule.delete({
              where: { id: tailScheduledRow.id },
            });
          }
        }

        await tx.subscription.updateMany({
          where: { id: sub.id, pausesUsedCount: { gt: 0 } },
          data: { pausesUsedCount: { decrement: 1 } },
        });

        return tx.subscription.findUniqueOrThrow({
          where: { id: sub.id },
          include: { scheduleDays: { orderBy: { dayNumber: "asc" } } },
        });
      });

      return {
        success: true,
        message: `Resumed morning 6:00 AM – 8:00 AM delivery for ${params.targetDateStr}!`,
        subscription: updatedSub,
      };
    } catch {
      return {
        success: false,
        status: 409,
        error: "Schedule was modified concurrently. Please refresh and try again.",
      };
    }
  }

  // Case II & III: Day is SCHEDULED -> Atomically claim pause quota OR cancel if quota exhausted (Bug 6 Fix)
  try {
    const txOutcome = await db.$transaction(async (tx) => {
      // 1. Atomically transition targetRow from SCHEDULED -> PAUSED first
      const dayClaim = await tx.dailyDeliverySchedule.updateMany({
        where: { id: targetRow.id, status: "SCHEDULED" },
        data: { status: "PAUSED" },
      });

      if (dayClaim.count === 0) {
        throw new Error("CONCURRENT_MODIFICATION");
      }

      // 2. Try to atomically claim 1 pause from remaining quota (pausesUsedCount < maxPausesAllowed)
      const quotaClaim = await tx.subscription.updateMany({
        where: {
          id: sub.id,
          customerId: params.customerId,
          pausesUsedCount: { lt: sub.maxPausesAllowed },
        },
        data: {
          pausesUsedCount: { increment: 1 },
        },
      });

      if (quotaClaim.count === 1) {
        // Quota was available -> Create carry-forward SCHEDULED day after current latest deliveryDate
        const latestDay = await tx.dailyDeliverySchedule.findFirst({
          where: { subscriptionId: sub.id },
          orderBy: { deliveryDate: "desc" },
        });

        const carryForwardDateStr = getNextDayString(
          latestDay ? latestDay.deliveryDate : params.targetDateStr
        );
        const nextDayNumber =
          (latestDay ? latestDay.dayNumber : sub.totalDeliveries) + 1;

        await tx.dailyDeliverySchedule.create({
          data: {
            subscriptionId: sub.id,
            dayNumber: nextDayNumber,
            deliveryDate: carryForwardDateStr,
            status: "SCHEDULED",
            orderNote: sub.deliveryNote,
          },
        });

        const refreshed = await tx.subscription.findUniqueOrThrow({
          where: { id: sub.id },
          include: { scheduleDays: { orderBy: { dayNumber: "asc" } } },
        });

        return {
          mode: "PAUSED_CARRIED_FORWARD" as const,
          carryForwardDateStr,
          subscription: refreshed,
        };
      }

      // Quota was already exhausted -> Convert targetRow to CANCELLED and decrement remainingDeliveries
      await tx.dailyDeliverySchedule.update({
        where: { id: targetRow.id },
        data: { status: "CANCELLED" },
      });

      await tx.subscription.updateMany({
        where: { id: sub.id, remainingDeliveries: { gt: 0 } },
        data: { remainingDeliveries: { decrement: 1 } },
      });

      const refreshed = await tx.subscription.findUniqueOrThrow({
        where: { id: sub.id },
        include: { scheduleDays: { orderBy: { dayNumber: "asc" } } },
      });

      return {
        mode: "CANCELLED_QUOTA_EXCEEDED" as const,
        carryForwardDateStr: "",
        subscription: refreshed,
      };
    });

    if (txOutcome.mode === "PAUSED_CARRIED_FORWARD") {
      return {
        success: true,
        message: `Paused ${params.targetDateStr} (${txOutcome.subscription.pausesUsedCount}/${txOutcome.subscription.maxPausesAllowed} pauses used). Your morning delivery is carried forward to ${txOutcome.carryForwardDateStr}!`,
        subscription: txOutcome.subscription,
      };
    }

    return {
      success: true,
      message: `Pause limit (${txOutcome.subscription.maxPausesAllowed}/${txOutcome.subscription.maxPausesAllowed}) reached. Delivery for ${params.targetDateStr} has been CANCELLED without carry-forward.`,
      subscription: txOutcome.subscription,
    };
  } catch {
    return {
      success: false,
      status: 409,
      error: "Schedule was modified concurrently. Please refresh and try again.",
    };
  }
}