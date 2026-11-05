/**
 * Shared types and key helpers for the server-locked payment snapshot.
 *
 * A snapshot is written when a Razorpay order is created (status "CREATED") and
 * flipped to "PAID" in the same database transaction that creates the order.
 *
 * These live here (not in a route.ts file) because Next.js only allows HTTP
 * handlers and route config to be exported from route files.
 */

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

export function getPaymentRefundConfigKey(razorpayPaymentId: string): string {
  return `PAY_REFUND_${razorpayPaymentId}`;
}
