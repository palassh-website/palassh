import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { getEnvConfig } from "@/lib/env";
import { createTraceId, logger, startTimer } from "@/lib/logger";
import { setCustomerSessionCookie } from "@/lib/auth";
import { sendOrderConfirmationEmail } from "@/lib/mailer";
import {
  buildSubscriptionScheduleRows,
  validateAndCalculateOrderServerSide,
} from "@/features/checkout/checkout.service";

export async function POST(req: NextRequest) {
  const traceId = createTraceId("CHK-VERIFY");
  const getElapsed = startTimer();

  try {
    const body = await req.json();
    const orderType: "SUBSCRIPTION" | "ONE_TIME" =
      body.orderType === "ONE_TIME" ? "ONE_TIME" : "SUBSCRIPTION";

    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const phone = String(body.phone || "")
      .replace(/\D/g, "")
      .slice(-10);
    const fullName = String(body.fullName || "").trim();
    const flatWing = String(body.flatWing || "").trim();
    const societyName = String(body.societyName || "").trim();
    const pincode = String(body.pincode || "").trim();
    const startDate = String(body.startDate || "").trim();
    const deliveryNote =
      String(body.deliveryNote || "").trim() ||
      "Hang pouch on main door handle (Do not ring bell)";

    const razorpayOrderId = String(body.razorpayOrderId || "");
    const razorpayPaymentId = String(
      body.razorpayPaymentId || `pay_sim_${Date.now()}`
    );
    const razorpaySignature = String(body.razorpaySignature || "");

    const env = getEnvConfig();
    if (
      env.RAZORPAY_KEY_SECRET &&
      !razorpayOrderId.startsWith("order_sim_")
    ) {
      const expectedSignature = crypto
        .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

      if (expectedSignature !== razorpaySignature) {
        return NextResponse.json(
          {
            success: false,
            error: "Payment signature verification failed. Please contact support.",
          },
          { status: 400 }
        );
      }
    }

    const customer = await db.customer.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
      include: {
        subscriptions: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            scheduleDays: {
              where: { status: "SCHEDULED" },
              orderBy: { deliveryDate: "asc" },
            },
          },
        },
      },
    });

    if (!customer || !customer.isVerified) {
      return NextResponse.json(
        {
          success: false,
          error: "Customer email is not verified. Please complete OTP verification first.",
        },
        { status: 403 }
      );
    }

    const activeDbSub = customer.subscriptions[0] || null;
    const authoritativeTier: "NORMAL" | "ONE_DAY" | "WEEKLY" | "MONTHLY" =
      activeDbSub
        ? activeDbSub.totalDeliveries >= 15 ||
          activeDbSub.billingCycle === "month"
          ? "MONTHLY"
          : activeDbSub.totalDeliveries >= 7 ||
            activeDbSub.billingCycle === "week"
          ? "WEEKLY"
          : "ONE_DAY"
        : "NORMAL";

    if (
      orderType === "ONE_TIME" &&
      authoritativeTier !== "WEEKLY" &&
      authoritativeTier !== "MONTHLY"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Security Block: Only active Weekly and Monthly Plan subscribers can book 100g/150g loose flower Add-Ons.",
        },
        { status: 403 }
      );
    }

    const activeSubScheduledDates = activeDbSub
      ? activeDbSub.scheduleDays.map((d) => d.deliveryDate)
      : [];

    const calc = await validateAndCalculateOrderServerSide({
      orderType,
      pincode,
      deliveryDate: startDate,
      customerId: customer.id,
      customerTier: authoritativeTier,
      activeSubScheduledDates,
      planIdOrSlug: body.planId || body.planSlug,
      weightGrams: Number(body.weightGrams) || 100,
      productVariantId: body.productVariantId,
      defaultFlowers: body.defaultFlowers,
      cartItems: body.cartItems,
    });

    if (!calc.valid) {
      return NextResponse.json(
        { success: false, error: calc.error },
        { status: 400 }
      );
    }

    const addressSnapshot = `${flatWing}, ${societyName} - ${pincode}`;

    // Save Subscriber Add-On (ONE_TIME) Order & Send Add-On Confirmation Email with Delivery Date & +919167034671
    if (orderType === "ONE_TIME") {
      const publicOrderId = `PLS-ADDON-${Math.floor(
        100000 + Math.random() * 900000
      )}`;

      const createdOneTime = await db.$transaction(async (tx) => {
        await tx.customer.update({
          where: { id: customer.id },
          data: {
            fullName: fullName || customer.fullName,
            flatWing,
            societyName,
            pincode,
            deliveryNote,
          },
        });

        return tx.oneTimeOrder.create({
          data: {
            orderId: publicOrderId,
            customerId: customer.id,
            flowerSummary: calc.resolvedFlowerSummary || "100g Add-On Flowers",
            itemsJson: JSON.stringify(body.cartItems || []),
            totalGrams: calc.totalGrams,
            amountPaid: calc.amountInRupees,
            deliveryDate: startDate,
            deliverySlot: "6:00 AM – 8:00 AM",
            addressSnapshot,
            deliveryNote,
            status: "CONFIRMED",
            razorpayOrderId,
            razorpayPaymentId,
          },
        });
      });

      // Send Add-On Confirmation Email containing exact Delivery Date & Contact No (+91 91670 34671)
      void sendOrderConfirmationEmail({
        toEmail: customer.email,
        customerName: fullName || customer.fullName,
        phone: customer.phone,
        orderId: createdOneTime.orderId,
        orderType: "ONE_TIME",
        planTitle: `Subscriber Daily Add-On (${calc.totalGrams}g Pack)`,
        flowerSelection: createdOneTime.flowerSummary,
        amountPaid: createdOneTime.amountPaid,
        totalDeliveries: 1,
        firstDeliveryDate: startDate,
        lastDeliveryDate: startDate,
        addressSnapshot,
        traceId,
      });

      return NextResponse.json({
        success: true,
        traceId,
        orderType: "ONE_TIME",
        oneTimeOrder: createdOneTime,
      });
    }

    // Save SUBSCRIPTION + Generate Schedule Days Atomically in MySQL
    const plan = calc.resolvedPlan!;
    const isOneDay = plan.deliveriesCount <= 1 || plan.billingCycle === "day";
    const isWeekly =
      !isOneDay && (plan.deliveriesCount <= 7 || plan.billingCycle === "week");
    const maxPausesAllowed = isOneDay
      ? 0
      : isWeekly
      ? 2
      : Math.max(5, Math.floor(plan.deliveriesCount / 6));
    const newActiveTier = isOneDay
      ? "ONE_DAY"
      : isWeekly
      ? "WEEKLY"
      : "MONTHLY";

    const publicSubOrderId = `PLS-SUB-${Math.floor(
      100000 + Math.random() * 900000
    )}`;
    const lockedDefaultFlowers =
      calc.resolvedFlowerSummary ||
      String(body.defaultFlowers || "").trim() ||
      plan.mixedPredefinedBreakdown;

    const scheduleRows = buildSubscriptionScheduleRows({
      startDateStr: startDate,
      totalDeliveries: plan.deliveriesCount,
      defaultNote: deliveryNote,
    });

    const firstDeliveryDate = scheduleRows[0]?.deliveryDate || startDate;
    const lastDeliveryDate =
      scheduleRows[scheduleRows.length - 1]?.deliveryDate || startDate;

    const createdSubscription = await db.$transaction(async (tx) => {
      await tx.customer.update({
        where: { id: customer.id },
        data: {
          fullName: fullName || customer.fullName,
          flatWing,
          societyName,
          pincode,
          deliveryNote,
          activeTier: newActiveTier,
        },
      });

      return tx.subscription.create({
        data: {
          orderId: publicSubOrderId,
          customerId: customer.id,
          planId: plan.id,
          planTitle: plan.title,
          billingCycle: plan.billingCycle,
          pricePaid: plan.price,
          totalDeliveries: plan.deliveriesCount,
          remainingDeliveries: plan.deliveriesCount,
          maxPausesAllowed,
          pausesUsedCount: 0,
          status: "ACTIVE",
          startDate: firstDeliveryDate,
          deliverySlot: "6:00 AM – 8:00 AM",
          defaultFlowers: lockedDefaultFlowers,
          addressSnapshot,
          deliveryNote,
          razorpayOrderId,
          razorpayPaymentId,
          scheduleDays: {
            create: scheduleRows,
          },
        },
        include: {
          scheduleDays: {
            orderBy: { dayNumber: "asc" },
          },
        },
      });
    });

    await setCustomerSessionCookie({
      customerId: customer.id,
      email: customer.email,
      phone: customer.phone,
      fullName: fullName || customer.fullName,
      activeTier: newActiveTier,
    });

    void sendOrderConfirmationEmail({
      toEmail: customer.email,
      customerName: fullName || customer.fullName,
      phone: customer.phone,
      orderId: createdSubscription.orderId,
      orderType: "SUBSCRIPTION",
      planTitle: plan.title,
      flowerSelection: lockedDefaultFlowers,
      amountPaid: plan.price,
      totalDeliveries: plan.deliveriesCount,
      firstDeliveryDate,
      lastDeliveryDate,
      addressSnapshot,
      traceId,
    });

    return NextResponse.json({
      success: true,
      traceId,
      orderType: "SUBSCRIPTION",
      subscription: createdSubscription,
      activeTier: newActiveTier,
    });
  } catch (err) {
    logger.error(
      {
        module: "CHECKOUT",
        action: "VERIFY_ORDER_EXCEPTION",
        traceId,
        durationMs: getElapsed(),
        message: "Unexpected error in /api/checkout/verify",
      },
      err
    );
    return NextResponse.json(
      {
        success: false,
        traceId,
        error: "Failed to save order in database. Check terminal logs.",
      },
      { status: 500 }
    );
  }
}