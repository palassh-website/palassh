import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getEnvConfig } from "@/lib/env";
import { createTraceId, logger, startTimer } from "@/lib/logger";
import { validateAndCalculateOrderServerSide } from "@/features/checkout/checkout.service";

export async function POST(req: NextRequest) {
  const traceId = createTraceId("CHK-CREATE");
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
    const pincode = String(body.pincode || "").trim();
    const deliveryDate = String(body.startDate || body.deliveryDate || "").trim();

    if (!email.includes("@") || phone.length !== 10) {
      return NextResponse.json(
        {
          success: false,
          error: "Valid verified email and 10-digit WhatsApp number are required.",
        },
        { status: 400 }
      );
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
      logger.warn({
        module: "CHECKOUT",
        action: "UNVERIFIED_CUSTOMER_BLOCKED",
        traceId,
        durationMs: getElapsed(),
        message: `Checkout blocked because ${email} / ${phone} has not completed Email OTP verification.`,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Please verify your Email & Phone via the 6-digit OTP code before proceeding to payment.",
        },
        { status: 403 }
      );
    }

    const activeSub = customer.subscriptions[0] || null;
    const resolvedTier: "NORMAL" | "ONE_DAY" | "WEEKLY" | "MONTHLY" = activeSub
      ? activeSub.totalDeliveries >= 15 || activeSub.billingCycle === "month"
        ? "MONTHLY"
        : activeSub.totalDeliveries >= 7 || activeSub.billingCycle === "week"
        ? "WEEKLY"
        : "ONE_DAY"
      : "NORMAL";

    const activeSubScheduledDates = activeSub
      ? activeSub.scheduleDays.map((d) => d.deliveryDate)
      : [];

    const calc = await validateAndCalculateOrderServerSide({
      orderType,
      pincode,
      deliveryDate,
      customerId: customer.id,
      customerTier: resolvedTier,
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

    const amountInPaise = calc.amountInRupees * 100;
    const env = getEnvConfig();

    if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
      const authHeader = Buffer.from(
        `${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`
      ).toString("base64");

      const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${authHeader}`,
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: "INR",
          receipt: `palassh_${Date.now()}`,
          notes: {
            traceId,
            customerEmail: email,
            customerPhone: phone,
            orderType,
          },
        }),
      });

      const rzpData = await rzpRes.json();

      if (!rzpRes.ok || !rzpData.id) {
        return NextResponse.json(
          {
            success: false,
            error: "Payment gateway initialization failed. Please check Razorpay keys.",
          },
          { status: 502 }
        );
      }

      return NextResponse.json({
        success: true,
        traceId,
        paymentMode: "RAZORPAY_LIVE",
        razorpayKeyId: env.RAZORPAY_KEY_ID,
        razorpayOrderId: rzpData.id,
        amountInRupees: calc.amountInRupees,
        amountInPaise,
      });
    }

    const simulatedOrderId = `order_sim_${Date.now()}`;
    return NextResponse.json({
      success: true,
      traceId,
      paymentMode: "DEV_SIMULATED",
      razorpayOrderId: simulatedOrderId,
      amountInRupees: calc.amountInRupees,
      amountInPaise,
    });
  } catch (err) {
    logger.error(
      {
        module: "CHECKOUT",
        action: "CREATE_ORDER_EXCEPTION",
        traceId,
        durationMs: getElapsed(),
        message: "Unexpected error in /api/checkout/create-order",
      },
      err
    );
    return NextResponse.json(
      {
        success: false,
        traceId,
        error: "Server error while preparing your order.",
      },
      { status: 500 }
    );
  }
}