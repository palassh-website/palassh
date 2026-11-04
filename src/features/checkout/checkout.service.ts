import { db } from "@/lib/db";
import {
  INITIAL_FLOWERS,
  INITIAL_PLANS,
  PLAN_PRODUCT_VARIANTS,
  FlowerProduct,
  SubscriptionPlan,
  PlanProductVariant,
  resolvePlanVariantPricing,
  getSubscriberAddonWindow,
} from "@/features/catalog/types";
import { checkPincodeAvailability } from "@/features/pincode-checker/pincode.service";
import { getCurrentIstClock } from "@/features/orders/orders.service";

export interface CheckoutCartItemInput {
  flowerId: string;
  grams: number;
}

export function isValidIsoDateString(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const d = new Date(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return false;
  return d.toISOString().slice(0, 10) === dateStr;
}

interface ServerConfigCache {
  expiresAt: number;
  flowers: FlowerProduct[];
  plans: SubscriptionPlan[];
  planVariants: PlanProductVariant[];
  festiveDates: string[];
}

let serverConfigCache: ServerConfigCache | null = null;

export function invalidateServerStoreConfigCache(): void {
  serverConfigCache = null;
}

export async function getCachedServerStoreConfig(): Promise<ServerConfigCache> {
  const now = Date.now();
  if (serverConfigCache && serverConfigCache.expiresAt > now) {
    return serverConfigCache;
  }

  let flowers = INITIAL_FLOWERS;
  let plans = INITIAL_PLANS;
  let planVariants = PLAN_PRODUCT_VARIANTS;
  let festiveDates: string[] = [];

  try {
    const rows = await db.storeConfig.findMany({
      where: {
        configKey: {
          in: [
            "FLOWERS_CATALOG",
            "PLANS_CONFIG",
            "PLAN_VARIANTS_CONFIG",
            "FESTIVE_DATES",
          ],
        },
      },
    });

    for (const row of rows) {
      if (!row.jsonPayload) continue;
      try {
        const parsed = JSON.parse(row.jsonPayload);
        if (
          row.configKey === "FLOWERS_CATALOG" &&
          Array.isArray(parsed) &&
          parsed.length > 0
        ) {
          flowers = parsed;
        } else if (
          row.configKey === "PLANS_CONFIG" &&
          Array.isArray(parsed) &&
          parsed.length > 0
        ) {
          plans = parsed;
        } else if (
          row.configKey === "PLAN_VARIANTS_CONFIG" &&
          Array.isArray(parsed) &&
          parsed.length > 0
        ) {
          planVariants = parsed;
        } else if (
          row.configKey === "FESTIVE_DATES" &&
          Array.isArray(parsed)
        ) {
          festiveDates = parsed;
        }
      } catch {
        // Ignore malformed JSON
      }
    }
  } catch {
    // Fallback to static defaults
  }

  serverConfigCache = {
    expiresAt: now + 60_000,
    flowers,
    plans,
    planVariants,
    festiveDates,
  };

  return serverConfigCache;
}

/**
 * Authoritative 11:45 PM IST Cut-Off Rule:
 * - Before 11:45 PM IST -> Earliest delivery is TOMORROW morning (Today + 1 Day)
 * - At or after 11:45 PM IST -> Earliest delivery is DAY AFTER TOMORROW (Today + 2 Days, 1-day buffer)
 */
export function getServerEarliestDeliveryDateIst(): {
  todayIst: string;
  tomorrowIst: string;
  earliestDeliveryIst: string;
  isBefore1145PmIst: boolean;
  formattedTimeIst: string;
} {
  const clock = getCurrentIstClock();
  const earliestDeliveryIst = clock.isBefore1145PmIst
    ? clock.tomorrowDateStr
    : clock.dayAfterTomorrowDateStr;

  return {
    todayIst: clock.todayDateStr,
    tomorrowIst: clock.tomorrowDateStr,
    earliestDeliveryIst,
    isBefore1145PmIst: clock.isBefore1145PmIst,
    formattedTimeIst: clock.formattedTimeIst,
  };
}

export function buildSubscriptionScheduleRows(params: {
  startDateStr: string;
  totalDeliveries: number;
  defaultNote: string;
}): {
  dayNumber: number;
  deliveryDate: string;
  status: string;
  orderNote: string;
}[] {
  const rows: {
    dayNumber: number;
    deliveryDate: string;
    status: string;
    orderNote: string;
  }[] = [];

  const clock = getCurrentIstClock();
  const isInputValid = isValidIsoDateString(params.startDateStr);

  // Respect the locked snapshot startDateStr as long as it is >= tomorrowDateStr
  // (Prevents the 11:44 PM -> 11:46 PM payment crossover from shifting a valid tomorrow order!)
  const effectiveStartStr =
    isInputValid && params.startDateStr >= clock.tomorrowDateStr
      ? params.startDateStr
      : clock.isBefore1145PmIst
      ? clock.tomorrowDateStr
      : clock.dayAfterTomorrowDateStr;

  const baseDate = new Date(`${effectiveStartStr}T00:00:00Z`);

  for (let i = 0; i < params.totalDeliveries; i++) {
    const d = new Date(baseDate);
    d.setUTCDate(baseDate.getUTCDate() + i);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");

    rows.push({
      dayNumber: i + 1,
      deliveryDate: `${yyyy}-${mm}-${dd}`,
      status: "SCHEDULED",
      orderNote: params.defaultNote,
    });
  }

  return rows;
}

export async function validateAndCalculateOrderServerSide(input: {
  orderType: "SUBSCRIPTION" | "ONE_TIME";
  pincode: string;
  deliveryDate: string;
  customerId?: string;
  customerTier: "NORMAL" | "ONE_DAY" | "WEEKLY" | "MONTHLY";
  activeSubScheduledDates?: string[];
  planIdOrSlug?: string;
  weightGrams?: number;
  productVariantId?: string;
  defaultFlowers?: string;
  cartItems?: CheckoutCartItemInput[];
}): Promise<{
  valid: boolean;
  error?: string;
  amountInRupees: number;
  totalGrams: number;
  resolvedPlan?: SubscriptionPlan;
  resolvedFlowerSummary?: string;
}> {
  // 1. Verify Thane Pincode (400601 - 400608)
  const pinCheck = checkPincodeAvailability(input.pincode);
  if (!pinCheck.serviceable) {
    return {
      valid: false,
      error: pinCheck.message,
      amountInRupees: 0,
      totalGrams: 0,
    };
  }

  // 2. Validate real calendar YYYY-MM-DD
  if (!isValidIsoDateString(input.deliveryDate)) {
    return {
      valid: false,
      error: "Please select a valid calendar delivery date (YYYY-MM-DD).",
      amountInRupees: 0,
      totalGrams: 0,
    };
  }

  // 3. Enforce 11:45 PM IST Cut-Off Rule
  const {
    todayIst,
    tomorrowIst,
    earliestDeliveryIst,
    isBefore1145PmIst,
    formattedTimeIst,
  } = getServerEarliestDeliveryDateIst();

  if (input.deliveryDate < earliestDeliveryIst) {
    return {
      valid: false,
      error: isBefore1145PmIst
        ? `Earliest morning delivery available is tomorrow (${earliestDeliveryIst}, 6:00 AM – 8:00 AM).`
        : `11:45 PM Cut-Off Passed (Current time: ${formattedTimeIst} on ${todayIst}): Orders placed after 11:45 PM have a 1-day farm buffer (${tomorrowIst}), so your earliest morning delivery is ${earliestDeliveryIst} (6:00 AM – 8:00 AM).`,
      amountInRupees: 0,
      totalGrams: 0,
    };
  }

  const config = await getCachedServerStoreConfig();

  // 4. Subscription Plan Validation
  if (input.orderType === "SUBSCRIPTION") {
    const matchedPlan =
      config.plans.find(
        (p) =>
          p.id === input.planIdOrSlug ||
          p.slug === input.planIdOrSlug ||
          (input.planIdOrSlug === "one-day-puja-pack" &&
            p.billingCycle === "day") ||
          (input.planIdOrSlug === "weekly-devotion-pack" &&
            p.billingCycle === "week") ||
          (input.planIdOrSlug === "monthly-sacred-assortment" &&
            p.billingCycle === "month")
      ) || config.plans[0];

    if (!matchedPlan) {
      return {
        valid: false,
        error: "Selected subscription plan is invalid.",
        amountInRupees: 0,
        totalGrams: 0,
      };
    }

    const requestedWeight = Number(input.weightGrams) || 100;
    const resolvedPricing = resolvePlanVariantPricing({
      planId: matchedPlan.id,
      billingCycle: matchedPlan.billingCycle,
      weightGrams: requestedWeight,
      productVariantIdOrName: input.productVariantId || input.defaultFlowers,
      customDeliveriesCount: matchedPlan.deliveriesCount,
      variantsList: config.planVariants,
    });

    const customizedPlan: SubscriptionPlan = {
      ...matchedPlan,
      price: resolvedPricing.price,
      perDayEffectivePrice: resolvedPricing.perDayEffectivePrice,
      pouchWeight: `${resolvedPricing.weightGrams} gms`,
      mixedPredefinedBreakdown: `${resolvedPricing.weightGrams}g ${resolvedPricing.variant.name} (${resolvedPricing.variant.marathiName})`,
    };

    return {
      valid: true,
      amountInRupees: resolvedPricing.price,
      totalGrams: resolvedPricing.weightGrams,
      resolvedPlan: customizedPlan,
      resolvedFlowerSummary: customizedPlan.mixedPredefinedBreakdown,
    };
  }

  // 5. Subscriber Loose Flower Add-On Validation (Strictly WEEKLY or MONTHLY Active Subscribers Only)
  if (input.customerTier !== "WEEKLY" && input.customerTier !== "MONTHLY") {
    return {
      valid: false,
      error:
        "Weekly & Monthly Subscribers Only: Loose flower Add-Ons (100g or 150g) can only be ordered while an active Weekly or Monthly subscription plan is running.",
      amountInRupees: 0,
      totalGrams: 0,
    };
  }

  const scheduledDates = Array.isArray(input.activeSubScheduledDates)
    ? input.activeSubScheduledDates
    : [];
  const windowCheck = getSubscriberAddonWindow({
    scheduledDatesSorted: scheduledDates,
    earliestBufferDate: earliestDeliveryIst,
  });

  if (!windowCheck.canBookAnyAddon) {
    return {
      valid: false,
      error:
        windowCheck.blockReason ||
        "Add-Ons cannot be booked during the final 2 delivery days of your subscription plan.",
      amountInRupees: 0,
      totalGrams: 0,
    };
  }

  if (windowCheck.lockedLastTwoDates.includes(input.deliveryDate)) {
    return {
      valid: false,
      error: `Last 2 Days Lockout: ${input.deliveryDate} is one of the final 2 delivery days of your current plan. Add-Ons are only allowed up to ${windowCheck.maxAllowedAddonDate}.`,
      amountInRupees: 0,
      totalGrams: 0,
    };
  }

  if (!windowCheck.eligibleDates.includes(input.deliveryDate)) {
    return {
      valid: false,
      error: `Invalid Add-On Date: Please select an active scheduled delivery date from your plan between ${windowCheck.eligibleDates[0]} and ${windowCheck.maxAllowedAddonDate}.`,
      amountInRupees: 0,
      totalGrams: 0,
    };
  }

  const items = input.cartItems || [];
  if (items.length === 0) {
    return {
      valid: false,
      error: "Please select a 100g or 150g flower Add-On pack.",
      amountInRupees: 0,
      totalGrams: 0,
    };
  }

  if (items.length > 1) {
    return {
      valid: false,
      error:
        "1 Add-On Pack Per Day Limit: You can book only one single 100g or 150g additional flower pack for a single delivery day.",
      amountInRupees: 0,
      totalGrams: 0,
    };
  }

  const singleItem = items[0];
  const requestedGrams = Number(singleItem.grams);
  if (requestedGrams !== 100 && requestedGrams !== 150) {
    return {
      valid: false,
      error:
        "Add-On Weight Rule: Loose flower Add-Ons are strictly available in 100g or 150g packs only.",
      amountInRupees: 0,
      totalGrams: 0,
    };
  }

  if (input.customerId) {
    const existingAddonOnDate = await db.oneTimeOrder.findFirst({
      where: {
        customerId: input.customerId,
        deliveryDate: input.deliveryDate,
        status: { not: "CANCELLED" },
      },
      select: { orderId: true, flowerSummary: true },
    });

    if (existingAddonOnDate) {
      return {
        valid: false,
        error: `Daily Add-On Limit Reached: You have already booked an Add-On (${existingAddonOnDate.flowerSummary}, Order #${existingAddonOnDate.orderId}) for ${input.deliveryDate}. Only 1 Add-On (100g or 150g) is allowed per day.`,
        amountInRupees: 0,
        totalGrams: 0,
      };
    }
  }

  const flower = config.flowers.find((f) => f.id === singleItem.flowerId);
  if (flower && flower.inStock) {
    const weightPack =
      flower.availableWeights.find((w) => w.grams === requestedGrams) ||
      (requestedGrams === 150
        ? { grams: 150, price: Math.round(flower.basePricePer100g * 1.25) }
        : { grams: 100, price: flower.basePricePer100g });

    return {
      valid: true,
      amountInRupees: weightPack.price,
      totalGrams: requestedGrams,
      resolvedFlowerSummary: `${requestedGrams}g ${flower.name} (${flower.marathiName})`,
    };
  }

  const matchedVar =
    config.planVariants.find((v) => v.id === singleItem.flowerId) ||
    config.planVariants[0];
  const varPrice =
    matchedVar.pricing[requestedGrams]?.day?.price ||
    (requestedGrams === 150 ? 55 : 45);

  return {
    valid: true,
    amountInRupees: varPrice,
    totalGrams: requestedGrams,
    resolvedFlowerSummary: `${requestedGrams}g ${matchedVar.name} (${matchedVar.marathiName})`,
  };
}