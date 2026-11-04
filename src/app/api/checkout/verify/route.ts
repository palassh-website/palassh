import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { getEnvConfig } from "@/lib/env";
import { getActiveCustomerSession, setCustomerSessionCookie } from "@/lib/auth";
import { createTraceId, logger, startTimer } from "@/lib/logger";
import { sendOrderConfirmationEmail } from "@/lib/mailer";
import { buildSubscriptionScheduleRows } from "@/features/checkout/checkout.service";
import {
  LockedPaymentSnapshot,
  getPaymentOrderConfigKey,
  getPaymentUsedConfigKey,
} from "../create-order/route";

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
  const existingSub = await db.subscription.findFirst({
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

  const existingOt = await db.oneTimeOrder.findFirst({
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
    // 1. Fail Closed if Razorpay Keys are Missing
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

    // 2. Require Verified Customer Session Cookie
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

    // 3. Reject Missing or Simulated IDs Immediately
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

    // 4. Timing-Safe HMAC-SHA256 Signature Check
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

    // 5. Load Server-Locked Payment Snapshot from StoreConfig
    const orderKey = getPaymentOrderConfigKey(razorpayOrderId);
    const paymentConfigRow = await db.storeConfig.findUnique({
      where: { configKey: orderKey },
    });

    if (!paymentConfigRow?.jsonPayload) {
      return NextResponse.json(
        {
          success: false,
          error: "Order session not found. Please initiate checkout again.",
        },
        { status: 400 }
      );
    }

    let paymentSnapshot: LockedPaymentSnapshot;
    try {
      paymentSnapshot = JSON.parse(
        paymentConfigRow.jsonPayload
      ) as LockedPaymentSnapshot;
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Corrupted order session.",
        },
        { status: 400 }
      );
    }

    // 6. Verify Customer Ownership
    if (session.customerId !== paymentSnapshot.customerId) {
      return NextResponse.json(
        {
          success: false,
          error: "Customer mismatch for this payment order.",
        },
        { status: 403 }
      );
    }

    const customer = await db.customer.findUnique({
      where: { id: paymentSnapshot.customerId },
    });

    if (!customer || !customer.isVerified) {
      return NextResponse.json(
        {
          success: false,
          error: "Verified customer record not found.",
        },
        { status: 403 }
      );
    }

    // 7. Fast Idempotent Return if Already Paid with the Same razorpayPaymentId
    if (paymentSnapshot.status === "PAID") {
      if (
        paymentSnapshot.razorpayPaymentId &&
        paymentSnapshot.razorpayPaymentId !== razorpayPaymentId
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

    // Ensure razorpayPaymentId has never been used on ANY other order (Subscription or Add-On)
    const usedPaymentKey = getPaymentUsedConfigKey(razorpayPaymentId);
    const usedElsewhere = await db.storeConfig.findUnique({
      where: { configKey: usedPaymentKey },
    });
    if (usedElsewhere) {
      const usedMeta = JSON.parse(usedElsewhere.jsonPayload || "{}") as {
        razorpayOrderId?: string;
      };
      if (usedMeta.razorpayOrderId !== razorpayOrderId) {
        return NextResponse.json(
          {
            success: false,
            error: "This payment ID has already been used for another order.",
          },
          { status: 409 }
        );
      }
    }

    // 8. Server-to-Server Confirmation with Razorpay API (Outside DB Transaction)
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
      rzpPayment.order_id !== paymentSnapshot.razorpayOrderId ||
      rzpPayment.currency !== "INR" ||
      Number(rzpPayment.amount) !== paymentSnapshot.amountInPaise
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
              amount: paymentSnapshot.amountInPaise,
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
      paymentSnapshot.fullNameSnapshot || customer.fullName;
    const finalFlatWing =
      paymentSnapshot.flatWingSnapshot || customer.flatWing;
    const finalSociety =
      paymentSnapshot.societyNameSnapshot || customer.societyName;
    const finalAddressSnapshot = paymentSnapshot.addressSnapshot;
    const finalDeliveryNote =
      paymentSnapshot.deliveryNoteSnapshot ||
      "Hang pouch on main door handle (Do not ring bell)";

    // 9A. Fulfill ONE_TIME Add-On Order with Atomic Compare-And-Swap Lock
    if (paymentSnapshot.orderType === "ONE_TIME") {
      const publicOrderId = `PLS-ADDON-${Math.floor(
        100000 + Math.random() * 900000
      )}`;

      const paidSnapshot: LockedPaymentSnapshot = {
        ...paymentSnapshot,
        status: "PAID",
        razorpayPaymentId,
        createdPublicOrderId: publicOrderId,
        paidAt: new Date().toISOString(),
      };

      try {
        const txResult = await db.$transaction(async (tx) => {
          const alreadyBookedAddon = await tx.oneTimeOrder.findFirst({
            where: {
              customerId: paymentSnapshot.customerId,
              deliveryDate: paymentSnapshot.deliveryDate,
              status: { not: "CANCELLED" },
            },
          });

          if (alreadyBookedAddon) {
            throw new Error("DUPLICATE_ADDON_FOR_DATE");
          }

          // Atomic Compare-And-Swap: Only transition if still in CREATED state
          const claimed = await tx.storeConfig.updateMany({
            where: {
              configKey: orderKey,
              jsonPayload: { contains: '"status":"CREATED"' },
            },
            data: {
              jsonPayload: JSON.stringify(paidSnapshot),
            },
          });

          if (claimed.count === 0) {
            return null;
          }

          // Lock razorpayPaymentId globally via Primary Key configKey
          await tx.storeConfig.create({
            data: {
              configKey: usedPaymentKey,
              jsonPayload: JSON.stringify({
                razorpayOrderId,
                razorpayPaymentId,
                publicOrderId,
                paidAt: paidSnapshot.paidAt,
              }),
            },
          });

          await tx.customer.update({
            where: { id: paymentSnapshot.customerId },
            data: {
              fullName: finalFullName,
              flatWing: finalFlatWing,
              societyName: finalSociety,
              pincode: paymentSnapshot.pincode,
              deliveryNote: finalDeliveryNote,
            },
          });

          return tx.oneTimeOrder.create({
            data: {
              orderId: publicOrderId,
              customerId: paymentSnapshot.customerId,
              flowerSummary:
                paymentSnapshot.flowerSummarySnapshot || "100g Add-On Flowers",
              itemsJson: paymentSnapshot.cartItemsJson || "[]",
              totalGrams: paymentSnapshot.totalGramsSnapshot || 100,
              amountPaid: paymentSnapshot.amountInRupees,
              deliveryDate: paymentSnapshot.deliveryDate,
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
          toEmail: customer.email,
          customerName: finalFullName,
          phone: customer.phone,
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
              error: `An Add-On order is already confirmed for ${paymentSnapshot.deliveryDate}.`,
            },
            { status: 409 }
          );
        }
        throw e;
      }
    }

    // 9B. Fulfill SUBSCRIPTION Order strictly from Stored Snapshot
    const deliveriesCount = paymentSnapshot.deliveriesCount || 30;
    const billingCycle = paymentSnapshot.billingCycle || "month";
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
      paymentSnapshot.defaultFlowersSnapshot ||
      "100g Mixed Marigold (मिक्स झेंडू)";

    const scheduleRows = buildSubscriptionScheduleRows({
      startDateStr: paymentSnapshot.deliveryDate,
      totalDeliveries: deliveriesCount,
      defaultNote: finalDeliveryNote,
    });

    const firstDeliveryDate =
      scheduleRows[0]?.deliveryDate || paymentSnapshot.deliveryDate;
    const lastDeliveryDate =
      scheduleRows[scheduleRows.length - 1]?.deliveryDate ||
      paymentSnapshot.deliveryDate;

    const paidSubSnapshot: LockedPaymentSnapshot = {
      ...paymentSnapshot,
      status: "PAID",
      razorpayPaymentId,
      createdPublicOrderId: publicSubOrderId,
      paidAt: new Date().toISOString(),
    };

    const createdSubscription = await db.$transaction(async (tx) => {
      // Atomic Compare-And-Swap: CREATED -> PAID
      const claimed = await tx.storeConfig.updateMany({
        where: {
          configKey: orderKey,
          jsonPayload: { contains: '"status":"CREATED"' },
        },
        data: {
          jsonPayload: JSON.stringify(paidSubSnapshot),
        },
      });

      if (claimed.count === 0) {
        return null;
      }

      // Lock razorpayPaymentId globally via Primary Key configKey
      await tx.storeConfig.create({
        data: {
          configKey: usedPaymentKey,
          jsonPayload: JSON.stringify({
            razorpayOrderId,
            razorpayPaymentId,
            publicOrderId: publicSubOrderId,
            paidAt: paidSubSnapshot.paidAt,
          }),
        },
      });

      // Mark any older ACTIVE subscriptions for this customer as COMPLETED
      await tx.subscription.updateMany({
        where: {
          customerId: paymentSnapshot.customerId,
          status: "ACTIVE",
        },
        data: {
          status: "COMPLETED",
        },
      });

      await tx.customer.update({
        where: { id: paymentSnapshot.customerId },
        data: {
          fullName: finalFullName,
          flatWing: finalFlatWing,
          societyName: finalSociety,
          pincode: paymentSnapshot.pincode,
          deliveryNote: finalDeliveryNote,
          activeTier: newActiveTier,
        },
      });

      return tx.subscription.create({
        data: {
          orderId: publicSubOrderId,
          customerId: paymentSnapshot.customerId,
          planId: paymentSnapshot.planId || "plan-monthly",
          planTitle: paymentSnapshot.planTitle || "Monthly Pack",
          billingCycle,
          pricePaid: paymentSnapshot.amountInRupees,
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
      customerId: paymentSnapshot.customerId,
      email: customer.email,
      phone: customer.phone,
      fullName: finalFullName,
      activeTier: newActiveTier,
    });

    void sendOrderConfirmationEmail({
      toEmail: customer.email,
      customerName: finalFullName,
      phone: customer.phone,
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