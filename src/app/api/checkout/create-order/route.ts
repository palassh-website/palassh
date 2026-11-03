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
    const deliveryDate = String(
      body.startDate || body.deliveryDate || ""
    ).trim();

    if (!email.includes("@") || phone.length !== 10) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Valid verified email and 10-digit WhatsApp number are required.",
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
          error:
            "Please verify your Email & Phone via the 6-digit OTP code before proceeding to payment.",
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

    // Strict integer paise (Razorpay rejects floats or < 100 paise)
    const amountInPaise = Math.round(Number(calc.amountInRupees) * 100);
    if (isNaN(amountInPaise) || amountInPaise < 100) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid order amount. Minimum payable amount is ₹1.",
        },
        { status: 400 }
      );
    }

    const env = getEnvConfig();

    // 3. Create Real Razorpay Order when Keys are Present
    if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
      if (!env.RAZORPAY_KEY_ID.startsWith("rzp_")) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid RAZORPAY_KEY_ID format ("${env.RAZORPAY_KEY_ID.slice(
              0,
              8
            )}..."). It must start with "rzp_live_" or "rzp_test_".`,
          },
          { status: 400 }
        );
      }

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
          receipt: `pls_${Date.now()}`,
          notes: {
            traceId,
            customerEmail: email,
            customerPhone: phone,
            orderType,
          },
        }),
        cache: "no-store",
      });

      const rzpData = await rzpRes.json().catch(() => ({}));

      if (!rzpRes.ok || !rzpData.id) {
        const rzpErrorReason =
          rzpData?.error?.description ||
          rzpData?.error?.reason ||
          rzpData?.error?.code ||
          `HTTP ${rzpRes.status}`;

        logger.error({
          module: "RAZORPAY",
          action: "RAZORPAY_ORDER_CREATE_FAILED",
          traceId,
          durationMs: getElapsed(),
          message: `Razorpay rejected order creation: ${rzpErrorReason}`,
          meta: {
            httpStatus: rzpRes.status,
            keyIdPrefix: env.RAZORPAY_KEY_ID.slice(0, 12),
            amountInPaise,
            razorpayError: rzpData?.error || rzpData,
          },
        });

        return NextResponse.json(
          {
            success: false,
            error: `Razorpay Error: ${rzpErrorReason}`,
          },
          { status: rzpRes.status === 401 ? 401 : 502 }
        );
      }

      logger.info({
        module: "RAZORPAY",
        action: "RAZORPAY_ORDER_CREATED",
        traceId,
        durationMs: getElapsed(),
        message: `Created live Razorpay order ${rzpData.id} for ₹${calc.amountInRupees}`,
      });

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

    return NextResponse.json(
      {
        success: false,
        error:
          "Razorpay API keys (NEXT_PUBLIC_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET) are missing in .env.",
      },
      { status: 500 }
    );
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