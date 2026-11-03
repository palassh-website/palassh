import { NextResponse } from "next/server";
import { createTraceId } from "@/lib/logger";
import { getCurrentIstClock } from "@/features/orders/orders.service";
import { buildDispatchSheetForDate } from "../route";
import { sendAdminDispatchCsvEmail } from "@/lib/mailer";

export async function GET() {
  const traceId = createTraceId("CRON-12AM");
  const clock = getCurrentIstClock();
  // At 12:00 AM midnight IST, todayDateStr is the morning that starts in 6 hours
  const targetDate = clock.todayDateStr;

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
    totalPouchesReady: sheet.totalPouchesReady,
    emailedTo: mailRes.recipient,
  });
}