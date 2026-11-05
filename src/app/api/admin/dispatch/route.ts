import { NextRequest, NextResponse } from "next/server";
import { buildDispatchSheetForDate } from "@/features/dispatch/dispatch.service";
import { createTraceId, logger, startTimer } from "@/lib/logger";
import { getCurrentIstClock } from "@/features/orders/orders.service";
import { sendAdminDispatchCsvEmail } from "@/lib/mailer";
import { verifyAdminApiAuth } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const authError = await verifyAdminApiAuth();
  if (authError) return authError;
  const traceId = createTraceId("ADM-DISPATCH");
  const getElapsed = startTimer();

  try {
    const { searchParams } = new URL(req.url);
    const clock = getCurrentIstClock();

    const defaultTargetDate =
      clock.currentHourIst >= 8 ? clock.tomorrowDateStr : clock.todayDateStr;
    const targetDate = searchParams.get("date")?.trim() || defaultTargetDate;
    const format = searchParams.get("format")?.trim().toLowerCase();

    const sheet = await buildDispatchSheetForDate(targetDate);

    if (format === "csv") {
      return new NextResponse(sheet.csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="PALASSH-Dispatch-${targetDate}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      traceId,
      durationMs: getElapsed(),
      targetDate,
      todayDateIst: clock.todayDateStr,
      tomorrowDateIst: clock.tomorrowDateStr,
      totalPouchesReady: sheet.totalPouchesReady,
      dispatchRows: sheet.dispatchRows,
    });
  } catch (err) {
    logger.error(
      {
        module: "ADMIN_DASHBOARD",
        action: "DISPATCH_SHEET_ERROR",
        traceId,
        durationMs: getElapsed(),
        message: "Failed to load morning dispatch sheet from MySQL",
      },
      err
    );
    return NextResponse.json(
      {
        success: false,
        traceId,
        error: "Could not query dispatch sheet from database.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authError = await verifyAdminApiAuth();
  if (authError) return authError;
  const traceId = createTraceId("ADM-CSV-MAIL");
  try {
    const body = await req.json().catch(() => ({}));
    const clock = getCurrentIstClock();
    const targetDate = String(body.date || clock.todayDateStr).trim();

    const sheet = await buildDispatchSheetForDate(targetDate);
    const mailRes = await sendAdminDispatchCsvEmail({
      targetDate,
      totalPouches: sheet.totalPouchesReady,
      csvContent: sheet.csvContent,
      traceId,
    });

    if (!mailRes.sent) {
      return NextResponse.json(
        {
          success: false,
          error: mailRes.errorReason || "Could not email dispatch CSV.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Dispatch Excel (.CSV) for ${targetDate} emailed to ${mailRes.recipient}!`,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to send dispatch sheet email." },
      { status: 500 }
    );
  }
}