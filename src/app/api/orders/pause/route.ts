import { NextRequest, NextResponse } from "next/server";
import { getActiveCustomerSession } from "@/lib/auth";
import { createTraceId, logger, startTimer } from "@/lib/logger";
import { mutateSubscriptionCalendarDay } from "@/features/orders/orders.service";

export async function POST(req: NextRequest) {
  const traceId = createTraceId("ORD-PAUSE");
  const getElapsed = startTimer();

  try {
    // Bug 3 Fix: Require valid authenticated customer session
    const session = await getActiveCustomerSession();
    if (!session?.customerId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please verify your account via Email OTP to modify your delivery schedule.",
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const orderIdOrSubId = String(
      body.subscriptionId || body.orderId || ""
    ).trim();
    const targetDateStr = String(
      body.dateStr || body.deliveryDate || ""
    ).trim();
    const action: "TOGGLE_PAUSE_OR_CANCEL" | "UPDATE_NOTE" =
      body.action === "UPDATE_NOTE"
        ? "UPDATE_NOTE"
        : "TOGGLE_PAUSE_OR_CANCEL";

    if (!orderIdOrSubId || !targetDateStr) {
      return NextResponse.json(
        {
          success: false,
          error:
            "subscriptionId/orderId and target dateStr (YYYY-MM-DD) are required.",
        },
        { status: 400 }
      );
    }

    const result = await mutateSubscriptionCalendarDay({
      customerId: session.customerId,
      subscriptionIdOrOrderId: orderIdOrSubId,
      targetDateStr,
      action,
      orderNote: body.orderNote,
      traceId,
    });

    if (!result.success || !result.subscription) {
      return NextResponse.json(
        {
          success: false,
          traceId,
          error: result.error || "Could not update delivery date.",
        },
        { status: result.status || 400 }
      );
    }

    const updated = result.subscription;

    return NextResponse.json({
      success: true,
      traceId,
      durationMs: getElapsed(),
      message: result.message,
      subscription: {
        id: updated.id,
        orderId: updated.orderId,
        planId: updated.planId,
        planTitle: updated.planTitle,
        pricePaid: updated.pricePaid,
        billingCycle: updated.billingCycle,
        totalDeliveries: updated.totalDeliveries,
        remainingDeliveries: updated.remainingDeliveries,
        maxPausesAllowed: updated.maxPausesAllowed,
        pausesUsedCount: updated.pausesUsedCount,
        status: updated.status,
        startDate: updated.startDate,
        deliverySlot: updated.deliverySlot,
        defaultFlowers: updated.defaultFlowers,
        address: updated.addressSnapshot,
        deliveryNote: updated.deliveryNote || "",
        calendarDays: updated.scheduleDays.map((d) => ({
          dateStr: d.deliveryDate,
          dayNumber: d.dayNumber,
          status: d.status,
          orderNote: d.orderNote || "",
        })),
      },
    });
  } catch (err) {
    logger.error(
      {
        module: "ORDERS",
        action: "PAUSE_ROUTE_EXCEPTION",
        traceId,
        durationMs: getElapsed(),
        message: "Unexpected error in /api/orders/pause",
      },
      err
    );
    return NextResponse.json(
      {
        success: false,
        traceId,
        error: "Server error while updating your delivery schedule.",
      },
      { status: 500 }
    );
  }
}