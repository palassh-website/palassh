import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { getEnvConfig } from "@/lib/env";
import { getActiveCustomerSession, setCustomerSessionCookie } from "@/lib/auth";
import { createTraceId, logger, startTimer } from "@/lib/logger";
import { sendOrderConfirmationEmail } from "@/lib/mailer";
import { buildSubscriptionScheduleRows } from "@/features/checkout/checkout.service";

function verifyRazorpayHmacTimingSafe(params: {
  orderId: string;
  paymentId: string;
  signature: string;
  secret: string;
}): boolean {
  if (
    !params.orderId ||
    !params.paymentId ||
    !params.signature ||
    !params.secret
  ) {
    return false;
  }
  const expectedHex = crypto
    .createHmac("sha256", params.secret)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest("hex");

  const expectedBuf = Buffer.from(expectedHex, "utf8");
  const receivedBuf = Buffer.from(params.signature, "utf8");

  if (expectedBuf.length !== receivedBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}

async function loadExistingOrderForPaidPayment(razorpayOrderId: string) {
  const existingSub = await db.subscription.findUnique({
    where: { razorpayOrderId },
    include: {
      customer: true,
      scheduleDays: { orderBy: { dayNumber: "asc" } },
    },
  });
  if (existingSub) {
    return {
      orderType: "SUBSCRIPTION" as const,
      subscription: existingSub,
      activeTier: existingSub.customer.activeTier,
    };
  }

  const existingOt = await db.oneTimeOrder.findUnique({
    where: { razorpayOrderId },
  });
  if (existingOt) {
    return {
      orderType: "ONE_TIME" as const,
      oneTimeOrder: existingOt,
    };
  }
  return null;
}

export async function POST(req: NextRequest) {
  const traceId = createTraceId("CHK-VERIFY");
  const getElapsed = startTimer();

  try {
    const env = getEnvConfig();
    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment verification is not configured on the server.",
        },
        { status: 500 }
      );
    }

    // Bug 4 Fix: Strictly require authenticated customer session cookie
    const session = await getActiveCustomerSession();
    if (!session?.customerId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Session expired or unauthorized. Please verify your email via OTP first.",
        },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const razorpayOrderId = String(
      body.razorpayOrderId || body.razorpay_order_id || ""
    ).trim();
    const razorpayPaymentId = String(
      body.razorpayPaymentId || body.razorpay_payment_id || ""
    ).trim();
    const razorpaySignature = String(
      body.razorpaySignature || body.razorpay_signature || ""
    ).trim();

    if (
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature ||
      razorpayOrderId.startsWith("order_sim_") ||
      razorpayPaymentId.startsWith("pay_sim_") ||
      !razorpayOrderId.startsWith("order_") ||
      !razorpayPaymentId.startsWith("pay_")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or missing Razorpay payment credentials.",
        },
        { status: 400 }
      );
    }

    const isSignatureValid = verifyRazorpayHmacTimingSafe({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
      secret: env.RAZORPAY_KEY_SECRET,
    });

    if (!isSignatureValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment signature verification failed.",
        },
        { status: 400 }
      );
    }

    const paymentRow = await db.payment.findUnique({
      where: { razorpayOrderId },
      include: { customer: true },
    });

    if (!paymentRow) {
      return NextResponse.json(
        {
          success: false,
          error: "Order session not found. Please initiate checkout again.",
        },
        { status: 400 }
      );
    }

    // Strict Session Ownership Binding
    if (session.customerId !== paymentRow.customerId) {
      return NextResponse.json(
        {
          success: false,
          error: "Customer mismatch for this payment order.",
        },
        { status: 403 }
      );
    }

    if (paymentRow.status === "PAID") {
      if (
        paymentRow.razorpayPaymentId &&
        paymentRow.razorpayPaymentId !== razorpayPaymentId
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "This order was already fulfilled with a different payment.",
          },
          { status: 409 }
        );
      }

      const existingResult = await loadExistingOrderForPaidPayment(
        razorpayOrderId
      );
      if (existingResult) {
        return NextResponse.json({
          success: true,
          traceId,
          idempotentReplay: true,
          ...existingResult,
        });
      }
    }

    const paymentIdUsedElsewhere = await db.payment.findUnique({
      where: { razorpayPaymentId },
    });
    if (
      paymentIdUsedElsewhere &&
      paymentIdUsedElsewhere.id !== paymentRow.id
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "This payment ID has already been used for another order.",
        },
        { status: 409 }
      );
    }

    const authHeader = Buffer.from(
      `${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`
    ).toString("base64");

    let rzpPayment: Record<string, unknown>;
    try {
      const fetchRes = await fetch(
        `https://api.razorpay.com/v1/payments/${encodeURIComponent(
          razorpayPaymentId
        )}`,
        {
          method: "GET",
          headers: { Authorization: `Basic ${authHeader}` },
          cache: "no-store",
          signal: AbortSignal.timeout(6000),
        }
      );

      if (!fetchRes.ok) {
        return NextResponse.json(
          {
            success: false,
            error: "Could not verify payment status with Razorpay server.",
          },
          { status: 502 }
        );
      }
      rzpPayment = await fetchRes.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Razorpay verification request timed out. Please retry.",
        },
        { status: 502 }
      );
    }

    if (
      rzpPayment.order_id !== paymentRow.razorpayOrderId ||
      rzpPayment.currency !== "INR" ||
      Number(rzpPayment.amount) !== paymentRow.amountInPaise
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Paid amount or order ID does not match the server order.",
        },
        { status: 400 }
      );
    }

    let paymentStatus = String(rzpPayment.status || "");
    if (paymentStatus === "authorized") {
      try {
        const capRes = await fetch(
          `https://api.razorpay.com/v1/payments/${encodeURIComponent(
            razorpayPaymentId
          )}/capture`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Basic ${authHeader}`,
            },
            body: JSON.stringify({
              amount: paymentRow.amountInPaise,
              currency: "INR",
            }),
            cache: "no-store",
            signal: AbortSignal.timeout(6000),
          }
        );
        if (!capRes.ok) {
          return NextResponse.json(
            {
              success: false,
              error: "Failed to capture authorized payment with Razorpay.",
            },
            { status: 502 }
          );
        }
        const capData = await capRes.json();
        paymentStatus = String(capData.status || "");
      } catch {
        return NextResponse.json(
          {
            success: false,
            error: "Timed out while capturing payment with Razorpay.",
          },
          { status: 502 }
        );
      }
    }

    if (paymentStatus !== "captured") {
      return NextResponse.json(
        {
          success: false,
          error: `Payment is not captured (current status: ${paymentStatus}).`,
        },
        { status: 400 }
      );
    }

    const finalFullName =
      paymentRow.fullNameSnapshot || paymentRow.customer.fullName;
    const finalFlatWing =
      paymentRow.flatWingSnapshot || paymentRow.customer.flatWing;
    const finalSociety =
      paymentRow.societyNameSnapshot || paymentRow.customer.societyName;
    const finalAddressSnapshot = paymentRow.addressSnapshot;
    const finalDeliveryNote =
      paymentRow.deliveryNoteSnapshot ||
      "Hang pouch on main door handle (Do not ring bell)";

    // 8A. Fulfill ONE_TIME Add-On Order with Atomic Duplicate-Date Guard (Bug 8.2 Fix)
    if (paymentRow.orderType === "ONE_TIME") {
      const publicOrderId = `PLS-ADDON-${Math.floor(
        100000 + Math.random() * 900000
      )}`;

      try {
        const txResult = await db.$transaction(async (tx) => {
          const alreadyBookedAddon = await tx.oneTimeOrder.findFirst({
            where: {
              customerId: paymentRow.customerId,
              deliveryDate: paymentRow.deliveryDate,
              status: { not: "CANCELLED" },
            },
          });

          if (alreadyBookedAddon) {
            throw new Error("DUPLICATE_ADDON_FOR_DATE");
          }

          const claimed = await tx.payment.updateMany({
            where: { id: paymentRow.id, status: "CREATED" },
            data: {
              status: "PAID",
              razorpayPaymentId,
              razorpaySignature,
              createdPublicOrderId: publicOrderId,
              paidAt: new Date(),
            },
          });

          if (claimed.count === 0) {
            return null;
          }

          await tx.customer.update({
            where: { id: paymentRow.customerId },
            data: {
              fullName: finalFullName,
              flatWing: finalFlatWing,
              societyName: finalSociety,
              pincode: paymentRow.pincode,
              deliveryNote: finalDeliveryNote,
            },
          });

          return tx.oneTimeOrder.create({
            data: {
              orderId: publicOrderId,
              customerId: paymentRow.customerId,
              flowerSummary:
                paymentRow.flowerSummarySnapshot || "100g Add-On Flowers",
              itemsJson: paymentRow.cartItemsJson || "[]",
              totalGrams: paymentRow.totalGramsSnapshot || 100,
              amountPaid: paymentRow.amountInRupees,
              deliveryDate: paymentRow.deliveryDate,
              deliverySlot: "6:00 AM – 8:00 AM",
              addressSnapshot: finalAddressSnapshot,
              deliveryNote: finalDeliveryNote,
              status: "CONFIRMED",
              razorpayOrderId,
              razorpayPaymentId,
            },
          });
        });

        if (!txResult) {
          const existing = await loadExistingOrderForPaidPayment(
            razorpayOrderId
          );
          return NextResponse.json({
            success: true,
            traceId,
            idempotentReplay: true,
            ...existing,
          });
        }

        void sendOrderConfirmationEmail({
          toEmail: paymentRow.customer.email,
          customerName: finalFullName,
          phone: paymentRow.customer.phone,
          orderId: txResult.orderId,
          orderType: "ONE_TIME",
          planTitle: `Subscriber Daily Add-On (${txResult.totalGrams}g Pack)`,
          flowerSelection: txResult.flowerSummary,
          amountPaid: txResult.amountPaid,
          totalDeliveries: 1,
          firstDeliveryDate: txResult.deliveryDate,
          lastDeliveryDate: txResult.deliveryDate,
          addressSnapshot: finalAddressSnapshot,
          traceId,
        });

        return NextResponse.json({
          success: true,
          traceId,
          orderType: "ONE_TIME",
          oneTimeOrder: txResult,
        });
      } catch (e) {
        if (e instanceof Error && e.message === "DUPLICATE_ADDON_FOR_DATE") {
          return NextResponse.json(
            {
              success: false,
              error: `An Add-On order is already confirmed for ${paymentRow.deliveryDate}.`,
            },
            { status: 409 }
          );
        }
        throw e;
      }
    }

    // 8B. Fulfill SUBSCRIPTION Order & Mark Older Active Subscriptions as COMPLETED (Bug 8.3 Fix)
    const deliveriesCount = paymentRow.deliveriesCount || 30;
    const billingCycle = paymentRow.billingCycle || "month";
    const isOneDay = deliveriesCount <= 1 || billingCycle === "day";
    const isWeekly =
      !isOneDay && (deliveriesCount <= 7 || billingCycle === "week");
    const maxPausesAllowed = isOneDay
      ? 0
      : isWeekly
      ? 2
      : Math.max(5, Math.floor(deliveriesCount / 6));
    const newActiveTier = isOneDay
      ? "ONE_DAY"
      : isWeekly
      ? "WEEKLY"
      : "MONTHLY";

    const publicSubOrderId = `PLS-SUB-${Math.floor(
      100000 + Math.random() * 900000
    )}`;
    const lockedDefaultFlowers =
      paymentRow.defaultFlowersSnapshot ||
      "100g Mixed Marigold (मिक्स झेंडू)";

    const scheduleRows = buildSubscriptionScheduleRows({
      startDateStr: paymentRow.deliveryDate,
      totalDeliveries: deliveriesCount,
      defaultNote: finalDeliveryNote,
    });

    const firstDeliveryDate =
      scheduleRows[0]?.deliveryDate || paymentRow.deliveryDate;
    const lastDeliveryDate =
      scheduleRows[scheduleRows.length - 1]?.deliveryDate ||
      paymentRow.deliveryDate;

    const createdSubscription = await db.$transaction(async (tx) => {
      const claimed = await tx.payment.updateMany({
        where: { id: paymentRow.id, status: "CREATED" },
        data: {
          status: "PAID",
          razorpayPaymentId,
          razorpaySignature,
          createdPublicOrderId: publicSubOrderId,
          paidAt: new Date(),
        },
      });

      if (claimed.count === 0) {
        return null;
      }

      // Bug 8.3 Fix: Mark any previous ACTIVE subscriptions for this customer as COMPLETED
      await tx.subscription.updateMany({
        where: {
          customerId: paymentRow.customerId,
          status: "ACTIVE",
        },
        data: {
          status: "COMPLETED",
        },
      });

      await tx.customer.update({
        where: { id: paymentRow.customerId },
        data: {
          fullName: finalFullName,
          flatWing: finalFlatWing,
          societyName: finalSociety,
          pincode: paymentRow.pincode,
          deliveryNote: finalDeliveryNote,
          activeTier: newActiveTier,
        },
      });

      return tx.subscription.create({
        data: {
          orderId: publicSubOrderId,
          customerId: paymentRow.customerId,
          planId: paymentRow.planId || "plan-monthly",
          planTitle: paymentRow.planTitle || "Monthly Pack",
          billingCycle,
          pricePaid: paymentRow.amountInRupees,
          totalDeliveries: deliveriesCount,
          remainingDeliveries: deliveriesCount,
          maxPausesAllowed,
          pausesUsedCount: 0,
          status: "ACTIVE",
          startDate: firstDeliveryDate,
          deliverySlot: "6:00 AM – 8:00 AM",
          defaultFlowers: lockedDefaultFlowers,
          addressSnapshot: finalAddressSnapshot,
          deliveryNote: finalDeliveryNote,
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

    if (!createdSubscription) {
      const existing = await loadExistingOrderForPaidPayment(razorpayOrderId);
      return NextResponse.json({
        success: true,
        traceId,
        idempotentReplay: true,
        ...existing,
      });
    }

    await setCustomerSessionCookie({
      customerId: paymentRow.customerId,
      email: paymentRow.customer.email,
      phone: paymentRow.customer.phone,
      fullName: finalFullName,
      activeTier: newActiveTier,
    });

    void sendOrderConfirmationEmail({
      toEmail: paymentRow.customer.email,
      customerName: finalFullName,
      phone: paymentRow.customer.phone,
      orderId: createdSubscription.orderId,
      orderType: "SUBSCRIPTION",
      planTitle: createdSubscription.planTitle,
      flowerSelection: lockedDefaultFlowers,
      amountPaid: createdSubscription.pricePaid,
      totalDeliveries: createdSubscription.totalDeliveries,
      firstDeliveryDate,
      lastDeliveryDate,
      addressSnapshot: finalAddressSnapshot,
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
        error: "Failed to verify and save order. Please contact support.",
      },
      { status: 500 }
    );
  }
}