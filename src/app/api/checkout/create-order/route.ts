import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getEnvConfig } from "@/lib/env";
import { getActiveCustomerSession } from "@/lib/auth";
import { createTraceId, logger, startTimer } from "@/lib/logger";
import { validateAndCalculateOrderServerSide } from "@/features/checkout/checkout.service";

export interface LockedPaymentSnapshot {
  razorpayOrderId: string;
  customerId: string;
  orderType: "SUBSCRIPTION" | "ONE_TIME";
  status: "CREATED" | "PAID";
  amountInRupees: number;
  amountInPaise: number;
  currency: "INR";
  pincode: string;
  deliveryDate: string;
  fullNameSnapshot: string;
  flatWingSnapshot: string;
  societyNameSnapshot: string;
  addressSnapshot: string;
  deliveryNoteSnapshot: string;
  planId?: string;
  planSlug?: string;
  planTitle?: string;
  billingCycle?: string;
  deliveriesCount?: number;
  weightGrams?: number;
  productVariantId?: string;
  defaultFlowersSnapshot?: string;
  cartItemsJson?: string;
  flowerSummarySnapshot?: string;
  totalGramsSnapshot?: number;
  razorpayPaymentId?: string;
  createdPublicOrderId?: string;
  createdAt: string;
  paidAt?: string;
}

export function getPaymentOrderConfigKey(razorpayOrderId: string): string {
  return `PAY_INTENT_${razorpayOrderId}`;
}

export function getPaymentUsedConfigKey(razorpayPaymentId: string): string {
  return `PAY_USED_${razorpayPaymentId}`;
}

export async function POST(req: NextRequest) {
  const traceId = createTraceId("CHK-CREATE");
  const getElapsed = startTimer();

  try {
    // 1. Fail Closed if Razorpay Credentials are Missing
    const env = getEnvConfig();
    if (
      !env.RAZORPAY_KEY_ID ||
      !env.RAZORPAY_KEY_SECRET ||
      !env.RAZORPAY_KEY_ID.startsWith("rzp_")
    ) {
      logger.error({
        module: "RAZORPAY",
        action: "RAZORPAY_KEYS_MISSING_FAIL_CLOSED",
        traceId,
        durationMs: getElapsed(),
        message:
          "Checkout blocked because RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not configured.",
      });
      return NextResponse.json(
        {
          success: false,
          error: "Payment gateway is not configured on the server.",
        },
        { status: 500 }
      );
    }

    // 2. Require Verified Customer Session Cookie
    const session = await getActiveCustomerSession();
    if (!session?.customerId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please verify your Email & Phone via the 6-digit OTP code before proceeding to payment.",
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const orderType: "SUBSCRIPTION" | "ONE_TIME" =
      body.orderType === "ONE_TIME" ? "ONE_TIME" : "SUBSCRIPTION";

    const fullName = String(body.fullName || session.fullName || "").trim();
    const flatWing = String(body.flatWing || "").trim();
    const societyName = String(body.societyName || "").trim();
    const pincode = String(body.pincode || "").trim();
    const deliveryDate = String(
      body.startDate || body.deliveryDate || ""
    ).trim();
    const deliveryNote =
      String(body.deliveryNote || "").trim() ||
      "Hang pouch on main door handle (Do not ring bell)";

    const customer = await db.customer.findUnique({
      where: { id: session.customerId },
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
          error:
            "Please verify your Email & Phone via the 6-digit OTP code before proceeding to payment.",
        },
        { status: 403 }
      );
    }

    const activeSub = customer.subscriptions[0] || null;
    const activeSubScheduledDates = activeSub
      ? activeSub.scheduleDays.map((d) => d.deliveryDate)
      : [];

    // Ensure subscription still has at least 1 upcoming scheduled delivery date
    const hasUpcomingDeliveries = activeSubScheduledDates.some(
      (dateStr) => dateStr >= deliveryDate || dateStr >= new Date().toISOString().slice(0, 10)
    );

    const resolvedTier: "NORMAL" | "ONE_DAY" | "WEEKLY" | "MONTHLY" =
      activeSub && hasUpcomingDeliveries
        ? activeSub.totalDeliveries >= 15 || activeSub.billingCycle === "month"
          ? "MONTHLY"
          : activeSub.totalDeliveries >= 7 || activeSub.billingCycle === "week"
          ? "WEEKLY"
          : "ONE_DAY"
        : "NORMAL";
    // 3. Authoritative Server-Side Price & Eligibility Calculation
    const requestedWeight = Number(body.weightGrams) || 100;
    const calc = await validateAndCalculateOrderServerSide({
      orderType,
      pincode,
      deliveryDate,
      customerId: customer.id,
      customerTier: resolvedTier,
      activeSubScheduledDates,
      planIdOrSlug: body.planId || body.planSlug,
      weightGrams: requestedWeight,
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

    // 4. Create Razorpay Order via Server-to-Server API
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
          customerId: customer.id,
          orderType,
          deliveryDate,
        },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    const rzpData = await rzpRes.json().catch(() => ({}));

    if (!rzpRes.ok || !rzpData.id) {
      const rzpErrorReason =
        rzpData?.error?.description ||
        rzpData?.error?.reason ||
        `HTTP ${rzpRes.status}`;

      logger.error({
        module: "RAZORPAY",
        action: "RAZORPAY_ORDER_CREATE_FAILED",
        traceId,
        durationMs: getElapsed(),
        message: `Razorpay rejected order creation: ${rzpErrorReason}`,
      });

      return NextResponse.json(
        {
          success: false,
          error: `Razorpay Error: ${rzpErrorReason}`,
        },
        { status: 502 }
      );
    }

    const razorpayOrderId = String(rzpData.id);
    const effectiveFullName =
      fullName || customer.fullName || "PALASSH Devotee";
    const effectiveFlatWing = flatWing || customer.flatWing || "";
    const effectiveSociety = societyName || customer.societyName || "";
    const addressSnapshot = `${effectiveFlatWing}, ${effectiveSociety} - ${pincode}`;

    const snapshot: LockedPaymentSnapshot = {
      razorpayOrderId,
      customerId: customer.id,
      orderType,
      status: "CREATED",
      amountInRupees: calc.amountInRupees,
      amountInPaise,
      currency: "INR",
      pincode,
      deliveryDate,
      fullNameSnapshot: effectiveFullName,
      flatWingSnapshot: effectiveFlatWing,
      societyNameSnapshot: effectiveSociety,
      addressSnapshot,
      deliveryNoteSnapshot: deliveryNote,
      createdAt: new Date().toISOString(),
      ...(orderType === "SUBSCRIPTION" && calc.resolvedPlan
        ? {
            planId: calc.resolvedPlan.id,
            planSlug: calc.resolvedPlan.slug,
            planTitle: calc.resolvedPlan.title,
            billingCycle: calc.resolvedPlan.billingCycle,
            deliveriesCount: calc.resolvedPlan.deliveriesCount,
            weightGrams: calc.totalGrams,
            productVariantId: String(body.productVariantId || ""),
            defaultFlowersSnapshot:
              calc.resolvedFlowerSummary ||
              calc.resolvedPlan.mixedPredefinedBreakdown,
          }
        : {
            cartItemsJson: JSON.stringify(
              Array.isArray(body.cartItems) ? body.cartItems.slice(0, 1) : []
            ),
            flowerSummarySnapshot:
              calc.resolvedFlowerSummary || "100g Add-On Flowers",
            totalGramsSnapshot: calc.totalGrams,
          }),
    };

    // 5. Persist Immutable Pending Payment Snapshot in MySQL StoreConfig (Primary Key locked)
    await db.storeConfig.upsert({
      where: { configKey: getPaymentOrderConfigKey(razorpayOrderId) },
      update: { jsonPayload: JSON.stringify(snapshot) },
      create: {
        configKey: getPaymentOrderConfigKey(razorpayOrderId),
        jsonPayload: JSON.stringify(snapshot),
      },
    });

    logger.info({
      module: "RAZORPAY",
      action: "PAYMENT_INTENT_LOCKED",
      traceId,
      durationMs: getElapsed(),
      message: `Locked Payment snapshot for Razorpay order ${razorpayOrderId} (₹${calc.amountInRupees})`,
    });

    return NextResponse.json({
      success: true,
      traceId,
      paymentMode: "RAZORPAY_LIVE",
      razorpayKeyId: env.RAZORPAY_KEY_ID,
      razorpayOrderId,
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
        error:
          "Payment gateway connection timed out or failed. Please try again.",
      },
      { status: 502 }
    );
  }
}