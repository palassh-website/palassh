import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { getEnvConfig } from "@/lib/env";
import { getActiveCustomerSession, setCustomerSessionCookie } from "@/lib/auth";
import { createTraceId, logger, startTimer } from "@/lib/logger";
import { razorpayBasicAuthHeader } from "@/lib/razorpay";
import {
  LockedPaymentSnapshot,
  getPaymentOrderConfigKey,
  getPaymentUsedConfigKey,
} from "@/lib/payment-snapshot";
import {
  InconsistentFulfillmentError,
  fulfillPaidPayment,
  loadExistingOrderForPaidPayment,
} from "@/features/checkout/fulfillment.service";

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

// Remote database round trips are slow; allow up to 60 s so work is not cut off.
export const maxDuration = 60;

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
      if (!existingResult) {
        // PAID is only ever saved together with the order, so this must not
        // happen. Never answer "success" without an order behind it.
        throw new InconsistentFulfillmentError(
          razorpayOrderId,
          "snapshot is PAID but no order exists"
        );
      }
      return NextResponse.json({
        success: true,
        traceId,
        idempotentReplay: true,
        ...existingResult,
      });
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
    const authHeader = razorpayBasicAuthHeader();

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

    // 9. Create the order through the ONE shared fulfillment path
    //    (the Razorpay webhook uses exactly the same function).
    const result = await fulfillPaidPayment({
      paymentSnapshot,
      razorpayOrderId,
      razorpayPaymentId,
      customer,
      traceId,
    });

    switch (result.kind) {
      case "SUBSCRIPTION_CREATED": {
        await setCustomerSessionCookie({
          customerId: paymentSnapshot.customerId,
          email: customer.email,
          phone: customer.phone,
          fullName: result.finalFullName,
          activeTier: result.activeTier,
        });

        return NextResponse.json({
          success: true,
          traceId,
          orderType: "SUBSCRIPTION",
          subscription: result.subscription,
          activeTier: result.activeTier,
        });
      }

      case "ONE_TIME_CREATED":
        return NextResponse.json({
          success: true,
          traceId,
          orderType: "ONE_TIME",
          oneTimeOrder: result.oneTimeOrder,
        });

      case "ALREADY_FULFILLED":
        return NextResponse.json({
          success: true,
          traceId,
          idempotentReplay: true,
          ...result.existing,
        });

      case "DUPLICATE_ADDON": {
        const dateLabel = paymentSnapshot.deliveryDate;
        return NextResponse.json(
          {
            success: false,
            error: result.refunded
              ? `An Add-On is already confirmed for ${dateLabel}, so this order was not created. Your payment (ID: ${razorpayPaymentId}) has been refunded and will reach your account in 5–7 working days.`
              : `An Add-On is already confirmed for ${dateLabel}, so this order was not created. We could not refund automatically. Please contact support with Payment ID ${razorpayPaymentId} and we will refund you.`,
          },
          { status: 409 }
        );
      }
    }
  } catch (err) {
    logger.error(
      {
        module: "CHECKOUT",
        action:
          err instanceof InconsistentFulfillmentError
            ? "VERIFY_INCONSISTENT_STATE"
            : "VERIFY_ORDER_EXCEPTION",
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
