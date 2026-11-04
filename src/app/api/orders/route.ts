import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getActiveCustomerSession } from "@/lib/auth";
import { createTraceId, logger, startTimer } from "@/lib/logger";

export async function GET() {
  const traceId = createTraceId("ORD-GET");
  const getElapsed = startTimer();

  try {
    // Bug 2 Fix: Use verified HttpOnly JWT session as the ONLY authorization source.
    // Query parameters (?email= or ?phone=) are strictly ignored.
    const session = await getActiveCustomerSession();

    if (!session?.customerId) {
      return NextResponse.json({
        success: true,
        authenticated: false,
        customer: null,
        activeSubscription: null,
        oneTimeOrders: [],
      });
    }

    const customer = await db.customer.findUnique({
      where: {
        id: session.customerId,
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

    if (!customer || !customer.isVerified) {
      return NextResponse.json({
        success: true,
        authenticated: false,
        customer: null,
        activeSubscription: null,
        oneTimeOrders: [],
      });
    }

    const latestSub = customer.subscriptions[0] || null;

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
      message: `Fetched orders for authenticated customer ${customer.id}`,
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