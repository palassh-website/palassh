import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getActiveCustomerSession } from "@/lib/auth";
import { createTraceId, logger, startTimer } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const traceId = createTraceId("ORD-GET");
  const getElapsed = startTimer();

  try {
    const session = await getActiveCustomerSession();
    const { searchParams } = new URL(req.url);
    const queryEmail = searchParams.get("email")?.trim().toLowerCase();
    const queryPhone = searchParams
      .get("phone")
      ?.replace(/\D/g, "")
      .slice(-10);

    const lookupEmail = session?.email || queryEmail;
    const lookupPhone = session?.phone || queryPhone;

    if (!lookupEmail && !lookupPhone) {
      return NextResponse.json({
        success: true,
        authenticated: false,
        customer: null,
        activeSubscription: null,
        oneTimeOrders: [],
      });
    }

    const customer = await db.customer.findFirst({
      where: {
        OR: [
          ...(lookupEmail ? [{ email: lookupEmail }] : []),
          ...(lookupPhone ? [{ phone: lookupPhone }] : []),
        ],
      },
      include: {
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            scheduleDays: {
              orderBy: { dayNumber: "asc" },
            },
          },
        },
        oneTimeOrders: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!customer) {
      return NextResponse.json({
        success: true,
        authenticated: false,
        customer: null,
        activeSubscription: null,
        oneTimeOrders: [],
      });
    }

    const latestSub = customer.subscriptions[0] || null;

    // Map scheduleDays to frontend calendarDays format so My-Orders Calendar works seamlessly
    const formattedSub = latestSub
      ? {
          id: latestSub.id,
          orderId: latestSub.orderId,
          planId: latestSub.planId,
          planTitle: latestSub.planTitle,
          pricePaid: latestSub.pricePaid,
          billingCycle: latestSub.billingCycle,
          totalDeliveries: latestSub.totalDeliveries,
          remainingDeliveries: latestSub.remainingDeliveries,
          maxPausesAllowed: latestSub.maxPausesAllowed,
          pausesUsedCount: latestSub.pausesUsedCount,
          status: latestSub.status,
          startDate: latestSub.startDate,
          deliverySlot: latestSub.deliverySlot,
          defaultFlowers: latestSub.defaultFlowers,
          customerName: customer.fullName,
          email: customer.email,
          phone: customer.phone,
          address: latestSub.addressSnapshot,
          deliveryNote: latestSub.deliveryNote || "",
          calendarDays: latestSub.scheduleDays.map((d) => ({
            dateStr: d.deliveryDate,
            dayNumber: d.dayNumber,
            status: d.status,
            orderNote: d.orderNote || "",
          })),
        }
      : null;

    const formattedOneTime = customer.oneTimeOrders.map((ord) => ({
      orderId: ord.orderId,
      orderType: "ONE_TIME",
      flowerSummary: ord.flowerSummary,
      totalGrams: ord.totalGrams,
      amountPaid: ord.amountPaid,
      deliveryDate: ord.deliveryDate,
      deliverySlot: ord.deliverySlot,
      customerName: customer.fullName,
      email: customer.email,
      phone: customer.phone,
      address: ord.addressSnapshot,
      deliveryNote: ord.deliveryNote || "",
      status: ord.status,
      createdAt: ord.createdAt.toISOString(),
    }));

    logger.info({
      module: "ORDERS",
      action: "FETCH_CUSTOMER_ORDERS_OK",
      traceId,
      durationMs: getElapsed(),
      message: `Fetched orders for ${customer.email} (Sub: ${
        formattedSub?.orderId || "NONE"
      }, OneTime: ${formattedOneTime.length})`,
    });

    return NextResponse.json({
      success: true,
      traceId,
      authenticated: true,
      customer: {
        id: customer.id,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
        flatWing: customer.flatWing,
        societyName: customer.societyName,
        pincode: customer.pincode,
        deliveryNote: customer.deliveryNote,
        activeTier: customer.activeTier,
      },
      activeSubscription: formattedSub,
      oneTimeOrders: formattedOneTime,
    });
  } catch (err) {
    logger.error(
      {
        module: "ORDERS",
        action: "FETCH_ORDERS_EXCEPTION",
        traceId,
        durationMs: getElapsed(),
        message: "Failed to fetch customer orders from MySQL",
      },
      err
    );
    return NextResponse.json(
      {
        success: false,
        traceId,
        error: "Could not load orders from database.",
      },
      { status: 500 }
    );
  }
}