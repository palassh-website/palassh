import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getActiveCustomerSession } from "@/lib/auth";
import { createTraceId, logger, startTimer } from "@/lib/logger";
import { getCurrentIstClock } from "@/features/orders/orders.service";

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
    const clock = getCurrentIstClock();
    const todayIst = clock.todayDateStr;

    let effectiveTier = customer.activeTier;
    let formattedSub = null;

    if (latestSub) {
      const scheduleDays = latestSub.scheduleDays || [];

      // Count SCHEDULED days that are either in the future (> todayIst)
      // OR today if the 6:00 AM - 8:00 AM morning delivery window hasn't finished yet (currentHourIst < 8)
      const liveRemainingCount = scheduleDays.filter(
        (d) =>
          d.status === "SCHEDULED" &&
          (d.deliveryDate > todayIst ||
            (d.deliveryDate === todayIst && clock.currentHourIst < 8))
      ).length;

      const isEnded =
        latestSub.status !== "ACTIVE" || liveRemainingCount <= 0;

      if (isEnded) {
        if (latestSub.status === "ACTIVE" || latestSub.remainingDeliveries !== 0) {
          await db.subscription.update({
            where: { id: latestSub.id },
            data: { status: "COMPLETED", remainingDeliveries: 0 },
          });
        }
        if (customer.activeTier !== "NORMAL") {
          await db.customer.update({
            where: { id: customer.id },
            data: { activeTier: "NORMAL" },
          });
          effectiveTier = "NORMAL";
        }
      } else {
        // Keep DB remainingDeliveries synced in real time even if midnight cron didn't run
        if (latestSub.remainingDeliveries !== liveRemainingCount) {
          await db.subscription.update({
            where: { id: latestSub.id },
            data: { remainingDeliveries: liveRemainingCount },
          });
        }

        formattedSub = {
          id: latestSub.id,
          orderId: latestSub.orderId,
          planId: latestSub.planId,
          planTitle: latestSub.planTitle,
          pricePaid: latestSub.pricePaid,
          billingCycle: latestSub.billingCycle,
          totalDeliveries: latestSub.totalDeliveries,
          remainingDeliveries: liveRemainingCount,
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
          calendarDays: scheduleDays.map((d) => ({
            dateStr: d.deliveryDate,
            dayNumber: d.dayNumber,
            status: d.status,
            orderNote: d.orderNote || "",
          })),
        };
      }
    } else {
      if (customer.activeTier !== "NORMAL") {
        await db.customer.update({
          where: { id: customer.id },
          data: { activeTier: "NORMAL" },
        });
        effectiveTier = "NORMAL";
      }
    }

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
        activeTier: effectiveTier,
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