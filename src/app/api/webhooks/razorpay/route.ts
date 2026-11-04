import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { getEnvConfig } from "@/lib/env";
import { createTraceId, logger, startTimer } from "@/lib/logger";
import { sendOrderConfirmationEmail } from "@/lib/mailer";
import { buildSubscriptionScheduleRows } from "@/features/checkout/checkout.service";
import {
  LockedPaymentSnapshot,
  getPaymentOrderConfigKey,
  getPaymentUsedConfigKey,
} from "../../checkout/create-order/route";

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
      return NextResponse.json({
        success: true,
        ignored: true,
        reason: "Order snapshot not found in StoreConfig",
      });
    }

    const paymentSnapshot = JSON.parse(
      paymentConfigRow.jsonPayload
    ) as LockedPaymentSnapshot;

    // Already fulfilled by /api/checkout/verify -> Return 200 OK idempotently
    if (paymentSnapshot.status === "PAID") {
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

    const usedPaymentKey = getPaymentUsedConfigKey(razorpayPaymentId);
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

    // Case A: Fulfill ONE_TIME Add-On Order via Webhook
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

      const createdAddon = await db.$transaction(async (tx) => {
        const claimed = await tx.storeConfig.updateMany({
          where: {
            configKey: orderKey,
            jsonPayload: { contains: '"status":"CREATED"' },
          },
          data: { jsonPayload: JSON.stringify(paidSnapshot) },
        });
        if (claimed.count === 0) return null;

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

      if (createdAddon) {
        void sendOrderConfirmationEmail({
          toEmail: customer.email,
          customerName: finalFullName,
          phone: customer.phone,
          orderId: createdAddon.orderId,
          orderType: "ONE_TIME",
          planTitle: `Subscriber Daily Add-On (${createdAddon.totalGrams}g Pack)`,
          flowerSelection: createdAddon.flowerSummary,
          amountPaid: createdAddon.amountPaid,
          totalDeliveries: 1,
          firstDeliveryDate: createdAddon.deliveryDate,
          lastDeliveryDate: createdAddon.deliveryDate,
          addressSnapshot: finalAddressSnapshot,
          traceId,
        });
      }

      return NextResponse.json({
        success: true,
        fulfilledByWebhook: Boolean(createdAddon),
      });
    }

    // Case B: Fulfill SUBSCRIPTION Order via Webhook
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

    const createdSub = await db.$transaction(async (tx) => {
      const claimed = await tx.storeConfig.updateMany({
        where: {
          configKey: orderKey,
          jsonPayload: { contains: '"status":"CREATED"' },
        },
        data: { jsonPayload: JSON.stringify(paidSubSnapshot) },
      });
      if (claimed.count === 0) return null;

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

      await tx.subscription.updateMany({
        where: { customerId: paymentSnapshot.customerId, status: "ACTIVE" },
        data: { status: "COMPLETED" },
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
          scheduleDays: { create: scheduleRows },
        },
      });
    });

    if (createdSub) {
      logger.info({
        module: "RAZORPAY",
        action: "WEBHOOK_ORDER_FULFILLED",
        traceId,
        durationMs: getElapsed(),
        message: `Webhook recovered & fulfilled subscription ${createdSub.orderId}`,
      });

      void sendOrderConfirmationEmail({
        toEmail: customer.email,
        customerName: finalFullName,
        phone: customer.phone,
        orderId: createdSub.orderId,
        orderType: "SUBSCRIPTION",
        planTitle: createdSub.planTitle,
        flowerSelection: lockedDefaultFlowers,
        amountPaid: createdSub.pricePaid,
        totalDeliveries: createdSub.totalDeliveries,
        firstDeliveryDate,
        lastDeliveryDate,
        addressSnapshot: finalAddressSnapshot,
        traceId,
      });
    }

    return NextResponse.json({
      success: true,
      fulfilledByWebhook: Boolean(createdSub),
    });
  } catch (err) {
    logger.error(
      {
        module: "RAZORPAY",
        action: "WEBHOOK_EXCEPTION",
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