import { after } from "next/server";
import type {
  Customer,
  DailyDeliverySchedule,
  OneTimeOrder,
  Subscription,
} from "@prisma/client";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { sendOrderConfirmationEmail } from "@/lib/mailer";
import { refundRazorpayPayment } from "@/lib/razorpay";
import {
  LockedPaymentSnapshot,
  getPaymentOrderConfigKey,
  getPaymentRefundConfigKey,
  getPaymentUsedConfigKey,
} from "@/lib/payment-snapshot";
import { buildSubscriptionScheduleRows } from "@/features/checkout/checkout.service";

/**
 * SINGLE source of truth for turning a verified, captured Razorpay payment into
 * an order. Both /api/checkout/verify (browser) and /api/webhooks/razorpay
 * (Razorpay server) call this, so the two paths can never drift apart.
 *
 * Safety model:
 *  - The snapshot flips CREATED -> PAID inside the SAME database transaction that
 *    creates the order. Either both happen or neither does, so a PAID snapshot
 *    always has an order behind it.
 *  - The flip is a compare-and-swap, so when verify and webhook race, exactly one
 *    wins and the loser gets the winner's order back (ALREADY_FULFILLED).
 */

const FULFILLMENT_TX_OPTIONS = { maxWait: 15_000, timeout: 45_000 } as const;

export type ExistingFulfilledOrder =
  | {
      orderType: "SUBSCRIPTION";
      subscription: Subscription & {
        customer: Customer;
        scheduleDays: DailyDeliverySchedule[];
      };
      activeTier: string;
    }
  | {
      orderType: "ONE_TIME";
      oneTimeOrder: OneTimeOrder;
    };

export type FulfillmentResult =
  | {
      kind: "SUBSCRIPTION_CREATED";
      subscription: Subscription & { scheduleDays: DailyDeliverySchedule[] };
      activeTier: "ONE_DAY" | "WEEKLY" | "MONTHLY";
      finalFullName: string;
    }
  | { kind: "ONE_TIME_CREATED"; oneTimeOrder: OneTimeOrder }
  | { kind: "ALREADY_FULFILLED"; existing: ExistingFulfilledOrder }
  | { kind: "DUPLICATE_ADDON"; refunded: boolean };

/**
 * Thrown when a snapshot is marked PAID but no order exists for it, or when the
 * claim was lost but the winner's order cannot be found. This should never
 * happen; callers must NOT acknowledge the payment as fulfilled when it does.
 */
export class InconsistentFulfillmentError extends Error {
  constructor(public readonly razorpayOrderId: string, detail: string) {
    super(`Inconsistent fulfillment state for ${razorpayOrderId}: ${detail}`);
    this.name = "InconsistentFulfillmentError";
  }
}

class DuplicateAddonError extends Error {
  constructor() {
    super("DUPLICATE_ADDON_FOR_DATE");
    this.name = "DuplicateAddonError";
  }
}

export async function loadExistingOrderForPaidPayment(
  razorpayOrderId: string
): Promise<ExistingFulfilledOrder | null> {
  const existingSub = await db.subscription.findFirst({
    where: { razorpayOrderId },
    include: {
      customer: true,
      scheduleDays: { orderBy: { dayNumber: "asc" } },
    },
  });
  if (existingSub) {
    return {
      orderType: "SUBSCRIPTION",
      subscription: existingSub,
      activeTier: existingSub.customer.activeTier,
    };
  }

  const existingOt = await db.oneTimeOrder.findFirst({
    where: { razorpayOrderId },
  });
  if (existingOt) {
    return { orderType: "ONE_TIME", oneTimeOrder: existingOt };
  }
  return null;
}

/**
 * Refunds a payment we cannot fulfil (duplicate add-on for the same date).
 * Claims a refund marker first so concurrent callers never refund twice.
 * Returns true when the money is (or already was) on its way back.
 */
async function refundUnfulfillablePayment(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  amountInPaise: number;
  traceId: string;
}): Promise<boolean> {
  const refundKey = getPaymentRefundConfigKey(params.razorpayPaymentId);

  try {
    await db.storeConfig.create({
      data: {
        configKey: refundKey,
        jsonPayload: JSON.stringify({
          razorpayOrderId: params.razorpayOrderId,
          razorpayPaymentId: params.razorpayPaymentId,
          amountInPaise: params.amountInPaise,
          reason: "DUPLICATE_ADDON_FOR_DATE",
          claimedAt: new Date().toISOString(),
        }),
      },
    });
  } catch {
    // Marker already exists: another request already owns this refund.
    return true;
  }

  const result = await refundRazorpayPayment({
    paymentId: params.razorpayPaymentId,
    amountInPaise: params.amountInPaise,
    notes: {
      reason: "Duplicate add-on for delivery date",
      razorpayOrderId: params.razorpayOrderId,
    },
  });

  if (!result.ok) {
    // Release the marker so a retry can attempt the refund again.
    await db.storeConfig
      .delete({ where: { configKey: refundKey } })
      .catch(() => undefined);
    logger.error({
      module: "RAZORPAY",
      action: "DUPLICATE_ADDON_REFUND_FAILED_MANUAL_ACTION_REQUIRED",
      traceId: params.traceId,
      message: `CRITICAL: customer paid ${params.razorpayPaymentId} (order ${params.razorpayOrderId}) but no order was created and the auto-refund failed: ${result.reason}. Refund it from the Razorpay dashboard.`,
    });
    return false;
  }

  logger.warn({
    module: "RAZORPAY",
    action: "DUPLICATE_ADDON_AUTO_REFUNDED",
    traceId: params.traceId,
    message: `Refunded ${params.razorpayPaymentId} (${result.refundId}) because an add-on already exists for that date.`,
  });
  return true;
}

/** Sends the confirmation email after the response, so serverless can't drop it. */
function sendConfirmationAfterResponse(
  params: Parameters<typeof sendOrderConfirmationEmail>[0]
): void {
  after(async () => {
    try {
      await sendOrderConfirmationEmail(params);
    } catch (err) {
      logger.error(
        {
          module: "SMTP_MAILER",
          action: "ORDER_EMAIL_AFTER_RESPONSE_FAILED",
          traceId: params.traceId,
          message: `Could not send confirmation email for ${params.orderId}`,
        },
        err
      );
    }
  });
}

export async function fulfillPaidPayment(params: {
  paymentSnapshot: LockedPaymentSnapshot;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  customer: Customer;
  traceId: string;
}): Promise<FulfillmentResult> {
  const { paymentSnapshot, razorpayOrderId, razorpayPaymentId, customer, traceId } =
    params;

  const orderKey = getPaymentOrderConfigKey(razorpayOrderId);
  const usedPaymentKey = getPaymentUsedConfigKey(razorpayPaymentId);

  const finalFullName = paymentSnapshot.fullNameSnapshot || customer.fullName;
  const finalFlatWing = paymentSnapshot.flatWingSnapshot || customer.flatWing;
  const finalSociety =
    paymentSnapshot.societyNameSnapshot || customer.societyName;
  const finalAddressSnapshot = paymentSnapshot.addressSnapshot;
  const finalDeliveryNote =
    paymentSnapshot.deliveryNoteSnapshot ||
    "Hang pouch on main door handle (Do not ring bell)";

  const alreadyFulfilled = async (): Promise<FulfillmentResult> => {
    const existing = await loadExistingOrderForPaidPayment(razorpayOrderId);
    if (!existing) {
      // We lost the claim, yet no order is visible. Never report success here.
      throw new InconsistentFulfillmentError(
        razorpayOrderId,
        "claim lost but no order found"
      );
    }
    return { kind: "ALREADY_FULFILLED", existing };
  };

  // ───────────────────────── ONE_TIME add-on ─────────────────────────
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

    let created: OneTimeOrder | null;
    try {
      created = await db.$transaction(async (tx) => {
        // 1) Claim FIRST (CREATED -> PAID). Whoever loses the race stops here.
        const claimed = await tx.storeConfig.updateMany({
          where: {
            configKey: orderKey,
            jsonPayload: { contains: '"status":"CREATED"' },
          },
          data: { jsonPayload: JSON.stringify(paidSnapshot) },
        });
        if (claimed.count === 0) return null;

        // 2) Only the claim-holder checks for a duplicate. A throw rolls the
        //    claim back too, so the snapshot stays CREATED.
        const alreadyBookedAddon = await tx.oneTimeOrder.findFirst({
          where: {
            customerId: paymentSnapshot.customerId,
            deliveryDate: paymentSnapshot.deliveryDate,
            status: { not: "CANCELLED" },
            NOT: { razorpayOrderId },
          },
        });
        if (alreadyBookedAddon) throw new DuplicateAddonError();

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
      }, FULFILLMENT_TX_OPTIONS);
    } catch (err) {
      if (err instanceof DuplicateAddonError) {
        const refunded = await refundUnfulfillablePayment({
          razorpayOrderId,
          razorpayPaymentId,
          amountInPaise: paymentSnapshot.amountInPaise,
          traceId,
        });
        if (refunded) {
          await db.storeConfig
            .update({
              where: { configKey: orderKey },
              data: {
                jsonPayload: JSON.stringify({
                  ...paymentSnapshot,
                  status: "PAID",
                  razorpayPaymentId,
                  paidAt: new Date().toISOString(),
                }),
              },
            })
            .catch(() => undefined);
        }
        return { kind: "DUPLICATE_ADDON", refunded };
      }
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        (err as { code?: string }).code === "P2002"
      ) {
        return alreadyFulfilled();
      }
      throw err;
    }

    if (!created) return alreadyFulfilled();

    sendConfirmationAfterResponse({
      toEmail: customer.email,
      customerName: finalFullName,
      phone: customer.phone,
      orderId: created.orderId,
      orderType: "ONE_TIME",
      planTitle: `Subscriber Daily Add-On (${created.totalGrams}g Pack)`,
      flowerSelection: created.flowerSummary,
      amountPaid: created.amountPaid,
      totalDeliveries: 1,
      firstDeliveryDate: created.deliveryDate,
      lastDeliveryDate: created.deliveryDate,
      addressSnapshot: finalAddressSnapshot,
      traceId,
    });

    return { kind: "ONE_TIME_CREATED", oneTimeOrder: created };
  }

  // ───────────────────────── SUBSCRIPTION ─────────────────────────
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
  const newActiveTier: "ONE_DAY" | "WEEKLY" | "MONTHLY" = isOneDay
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

    // Older ACTIVE subscriptions for this customer are superseded by this one.
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
        // One bulk INSERT for all delivery days instead of one query per day:
        // fewer round trips to the remote database inside the transaction.
        scheduleDays: { createMany: { data: scheduleRows } },
      },
      include: { scheduleDays: { orderBy: { dayNumber: "asc" } } },
    });
  }, FULFILLMENT_TX_OPTIONS);

  if (!createdSubscription) return alreadyFulfilled();

  sendConfirmationAfterResponse({
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

  return {
    kind: "SUBSCRIPTION_CREATED",
    subscription: createdSubscription,
    activeTier: newActiveTier,
    finalFullName,
  };
}
