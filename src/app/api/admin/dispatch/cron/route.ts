import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createTraceId } from "@/lib/logger";
import { getCurrentIstClock } from "@/features/orders/orders.service";
import { buildDispatchSheetForDate } from "../route";
import { sendAdminDispatchCsvEmail } from "@/lib/mailer";
import { verifyCronApiAuth } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  if (!verifyCronApiAuth(req)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Invalid or missing CRON_SECRET." },
      { status: 401 }
    );
  }

  const traceId = createTraceId("CRON-12AM");
  const clock = getCurrentIstClock();
  const targetDate = clock.todayDateStr;

  // Bug 11 Fix: Reconcile remainingDeliveries and mark finished ACTIVE subscriptions as COMPLETED
  const activeSubs = await db.subscription.findMany({
    where: { status: "ACTIVE" },
    include: {
      scheduleDays: {
        where: { status: "SCHEDULED" },
      },
    },
  });

  for (const sub of activeSubs) {
    const remainingFutureOrToday = sub.scheduleDays.filter(
      (d) => d.deliveryDate >= targetDate
    ).length;

    if (remainingFutureOrToday === 0) {
      await db.subscription.update({
        where: { id: sub.id },
        data: { status: "COMPLETED", remainingDeliveries: 0 },
      });
    } else if (sub.remainingDeliveries !== remainingFutureOrToday) {
      await db.subscription.update({
        where: { id: sub.id },
        data: { remainingDeliveries: remainingFutureOrToday },
      });
    }
  }

  const sheet = await buildDispatchSheetForDate(targetDate);
  const mailRes = await sendAdminDispatchCsvEmail({
    targetDate,
    totalPouches: sheet.totalPouchesReady,
    csvContent: sheet.csvContent,
    traceId,
  });

  return NextResponse.json({
    success: mailRes.sent,
    targetDate,
    reconciledSubscriptionsCount: activeSubs.length,
    totalPouchesReady: sheet.totalPouchesReady,
    emailedTo: mailRes.recipient,
  });
}