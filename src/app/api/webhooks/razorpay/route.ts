import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { getEnvConfig } from "@/lib/env";
import { createTraceId, logger, startTimer } from "@/lib/logger";
import {
  LockedPaymentSnapshot,
  getPaymentOrderConfigKey,
} from "@/lib/payment-snapshot";
import {
  InconsistentFulfillmentError,
  fulfillPaidPayment,
  loadExistingOrderForPaidPayment,
} from "@/features/checkout/fulfillment.service";

function verifyWebhookSignatureTimingSafe(
  rawBody: string,
  receivedSignature: string,
  webhookSecret: string
): boolean {
  if (!rawBody || !receivedSignature || !webhookSecret) return false;
  const expectedHex = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  const expectedBuf = Buffer.from(expectedHex, "utf8");
  const receivedBuf = Buffer.from(receivedSignature, "utf8");
  if (expectedBuf.length !== receivedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}

// Remote database round trips are slow; allow up to 60 s so work is not cut off.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const traceId = createTraceId("RZP-WEBHOOK");
  const getElapsed = startTimer();

  try {
    const env = getEnvConfig();
    if (!env.RAZORPAY_WEBHOOK_SECRET) {
      logger.warn({
        module: "RAZORPAY",
        action: "WEBHOOK_SECRET_NOT_CONFIGURED",
        traceId,
        message: "RAZORPAY_WEBHOOK_SECRET is not set in environment variables.",
      });
      return NextResponse.json(
        { success: false, error: "Webhook secret not configured." },
        { status: 500 }
      );
    }

    const signature = req.headers.get("x-razorpay-signature") || "";
    const rawBody = await req.text();

    if (
      !verifyWebhookSignatureTimingSafe(
        rawBody,
        signature,
        env.RAZORPAY_WEBHOOK_SECRET
      )
    ) {
      logger.error({
        module: "RAZORPAY",
        action: "INVALID_WEBHOOK_SIGNATURE",
        traceId,
        durationMs: getElapsed(),
        message: "Rejected Razorpay webhook due to invalid HMAC signature.",
      });
      return NextResponse.json(
        { success: false, error: "Invalid webhook signature." },
        { status: 400 }
      );
    }

    const eventPayload = JSON.parse(rawBody);
    const eventName = String(eventPayload?.event || "");

    // Only process captured payments or paid orders
    if (eventName !== "payment.captured" && eventName !== "order.paid") {
      return NextResponse.json({
        success: true,
        ignored: true,
        event: eventName,
      });
    }

    const paymentEntity = eventPayload?.payload?.payment?.entity;
    const razorpayOrderId = String(paymentEntity?.order_id || "").trim();
    const razorpayPaymentId = String(paymentEntity?.id || "").trim();
    const amountPaidPaise = Number(paymentEntity?.amount || 0);
    const currency = String(paymentEntity?.currency || "");
    const status = String(paymentEntity?.status || "");

    if (!razorpayOrderId || !razorpayPaymentId || status !== "captured") {
      return NextResponse.json({
        success: true,
        ignored: true,
        reason: "Missing order_id/payment_id or status not captured",
      });
    }

    const orderKey = getPaymentOrderConfigKey(razorpayOrderId);
    const paymentConfigRow = await db.storeConfig.findUnique({
      where: { configKey: orderKey },
    });

    if (!paymentConfigRow?.jsonPayload) {
      // create-order stamps every Razorpay order it makes with notes.customerId.
      // A payment carrying that stamp IS ours, so a missing snapshot is a real
      // problem (for example a failed database read). Answer 500 so Razorpay
      // retries instead of us silently dropping a paid order.
      const isOurPayment = Boolean(paymentEntity?.notes?.customerId);
      if (isOurPayment) {
        logger.error({
          module: "RAZORPAY",
          action: "WEBHOOK_SNAPSHOT_MISSING_FOR_OUR_PAYMENT",
          traceId,
          message: `Captured payment ${razorpayPaymentId} for ${razorpayOrderId} was created by this checkout but its snapshot could not be read. Returning 500 so Razorpay retries.`,
        });
        return NextResponse.json(
          { success: false, error: "Order snapshot not readable yet" },
          { status: 500 }
        );
      }

      logger.warn({
        module: "RAZORPAY",
        action: "WEBHOOK_SNAPSHOT_NOT_FOUND",
        traceId,
        message: `Captured payment ${razorpayPaymentId} for ${razorpayOrderId} has no stored order snapshot and no checkout stamp; ignoring (not created by this checkout).`,
      });
      return NextResponse.json({
        success: true,
        ignored: true,
        reason: "Order snapshot not found in StoreConfig",
      });
    }

    const paymentSnapshot = JSON.parse(
      paymentConfigRow.jsonPayload
    ) as LockedPaymentSnapshot;

    // Only acknowledge "already fulfilled" when an order REALLY exists.
    // PAID is saved in the same transaction as the order, so a PAID snapshot
    // without an order is a corrupt state: answer 500 so Razorpay retries and
    // the problem shows up in the logs instead of being silently acknowledged.
    if (paymentSnapshot.status === "PAID") {
      const existing = await loadExistingOrderForPaidPayment(razorpayOrderId);
      if (!existing) {
        throw new InconsistentFulfillmentError(
          razorpayOrderId,
          "snapshot is PAID but no order exists"
        );
      }
      return NextResponse.json({
        success: true,
        alreadyFulfilled: true,
        razorpayOrderId,
      });
    }

    // Verify exact amount and currency
    if (
      currency !== "INR" ||
      amountPaidPaise !== paymentSnapshot.amountInPaise
    ) {
      logger.error({
        module: "RAZORPAY",
        action: "WEBHOOK_AMOUNT_MISMATCH",
        traceId,
        message: `Webhook amount mismatch for ${razorpayOrderId}`,
      });
      return NextResponse.json(
        { success: false, error: "Amount mismatch" },
        { status: 400 }
      );
    }

    const customer = await db.customer.findUnique({
      where: { id: paymentSnapshot.customerId },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );
    }

    // Create the order through the ONE shared fulfillment path
    // (/api/checkout/verify uses exactly the same function).
    const result = await fulfillPaidPayment({
      paymentSnapshot,
      razorpayOrderId,
      razorpayPaymentId,
      customer,
      traceId,
    });

    switch (result.kind) {
      case "SUBSCRIPTION_CREATED":
        logger.info({
          module: "RAZORPAY",
          action: "WEBHOOK_ORDER_FULFILLED",
          traceId,
          durationMs: getElapsed(),
          message: `Webhook recovered & fulfilled subscription ${result.subscription.orderId}`,
        });
        return NextResponse.json({ success: true, fulfilledByWebhook: true });

      case "ONE_TIME_CREATED":
        logger.info({
          module: "RAZORPAY",
          action: "WEBHOOK_ORDER_FULFILLED",
          traceId,
          durationMs: getElapsed(),
          message: `Webhook recovered & fulfilled add-on ${result.oneTimeOrder.orderId}`,
        });
        return NextResponse.json({ success: true, fulfilledByWebhook: true });

      case "ALREADY_FULFILLED":
        // The browser flow won the race; its order is already saved.
        return NextResponse.json({
          success: true,
          alreadyFulfilled: true,
          razorpayOrderId,
        });

      case "DUPLICATE_ADDON":
        if (!result.refunded) {
          // Refund failed: answer 500 so Razorpay retries the webhook and the
          // refund is attempted again (the failure is already logged as CRITICAL).
          return NextResponse.json(
            { success: false, error: "Duplicate add-on refund pending" },
            { status: 500 }
          );
        }
        return NextResponse.json({
          success: true,
          duplicateAddon: true,
          refunded: true,
        });
    }
  } catch (err) {
    logger.error(
      {
        module: "RAZORPAY",
        action:
          err instanceof InconsistentFulfillmentError
            ? "WEBHOOK_INCONSISTENT_STATE"
            : "WEBHOOK_EXCEPTION",
        traceId,
        durationMs: getElapsed(),
        message: "Error processing Razorpay webhook",
      },
      err
    );
    return NextResponse.json(
      { success: false, error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
