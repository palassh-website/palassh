export interface FlowerProduct {
  id: string;
  slug: string;
  name: string;
  marathiName: string;
  subtitle: string;
  botanicalNote: string;
  imageUrl: string;
  basePricePer100g: number;
  unitType: "WEIGHT" | "COUNT_AND_WEIGHT";
  availableWeights: {
    label: string;
    grams: number;
    price: number;
    mrp?: number;
  }[];
  inStock: boolean;
  isSacredSpecial?: boolean;
  deityAffinity: string;
}

export type PlanWeightGrams = number;
export type PlanDurationCycle = "day" | "week" | "month" | string;

export interface PlanCyclePricing {
  price: number;
  perDay: number;
  mrp?: number;
}

export interface PlanProductVariant {
  id: string;
  srNo: number;
  name: string;
  marathiName: string;
  subtitle: string;
  imageUrl: string;
  pricing: Record<number, Record<string, PlanCyclePricing>>;
}

export type FlowerSelectionMode = "MIXED" | "CUSTOM";

export interface SubscriptionPlan {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  price: number;
  perDayEffectivePrice: number;
  billingCycle: PlanDurationCycle;
  deliveriesCount: number;
  pouchWeight: string;
  mixedPredefinedBreakdown: string;
  badge?: string;
  isPopular?: boolean;
  imageUrl: string;
  flowersIncluded: string[];
  shortHighlights: string[];
  features: string[];
  festiveMaxGramsLimit: number;
}

export interface CartItem {
  id: string;
  flowerId: string;
  flowerName: string;
  marathiName?: string;
  imageUrl: string;
  weightLabel: string;
  grams: 100 | 150;
  unitPrice: number;
  quantity: 1;
  addonDeliveryDate?: string;
}

export type CustomerTier = "NORMAL" | "ONE_DAY" | "WEEKLY" | "MONTHLY";

export function getStrikeThroughMrp(
  sellingPrice: number,
  explicitMrp?: number
): { mrp: number; discountPercent: number; savedAmount: number } {
  if (explicitMrp && explicitMrp > sellingPrice) {
    const saved = explicitMrp - sellingPrice;
    const pct = Math.round((saved / explicitMrp) * 100);
    return { mrp: explicitMrp, discountPercent: pct, savedAmount: saved };
  }
  const rawHigher = sellingPrice * 1.24;
  const roundedMrp =
    sellingPrice < 100
      ? Math.ceil(rawHigher / 5) * 5 + 4
      : Math.ceil(rawHigher / 50) * 50 - 1;
  const finalMrp = Math.max(sellingPrice + 15, roundedMrp);
  const savedAmount = finalMrp - sellingPrice;
  const discountPercent = Math.round((savedAmount / finalMrp) * 100);
  return { mrp: finalMrp, discountPercent, savedAmount };
}

export const PLAN_PRODUCT_VARIANTS: PlanProductVariant[] = [
  {
    id: "prod-mixed-marigold",
    srNo: 1,
    name: "Mixed Marigold",
    marathiName: "मिक्स झेंडू",
    subtitle: "Fresh Orange & Yellow Marigold Assortment",
    imageUrl: "/images/merigold.jpeg",
    pricing: {
      100: {
        day: { price: 45, perDay: 45 },
        week: { price: 299, perDay: 43 },
        month: { price: 1249, perDay: 42 },
      },
      150: {
        day: { price: 55, perDay: 55 },
        week: { price: 369, perDay: 53 },
        month: { price: 1529, perDay: 51 },
      },
    },
  },
  {
    id: "prod-orange-marigold",
    srNo: 2,
    name: "Orange Marigold",
    marathiName: "भगवा झेंडू",
    subtitle: "Rich Saffron Temple Marigold Blooms",
    imageUrl: "/images/merigold.jpeg",
    pricing: {
      100: {
        day: { price: 45, perDay: 45 },
        week: { price: 299, perDay: 43 },
        month: { price: 1249, perDay: 42 },
      },
      150: {
        day: { price: 55, perDay: 55 },
        week: { price: 369, perDay: 53 },
        month: { price: 1529, perDay: 51 },
      },
    },
  },
  {
    id: "prod-yellow-marigold",
    srNo: 3,
    name: "Yellow Marigold",
    marathiName: "पिवळा झेंडू",
    subtitle: "Golden Yellow Puja Marigold Blooms",
    imageUrl: "/images/merigold.jpeg",
    pricing: {
      100: {
        day: { price: 45, perDay: 45 },
        week: { price: 299, perDay: 43 },
        month: { price: 1249, perDay: 42 },
      },
      150: {
        day: { price: 55, perDay: 55 },
        week: { price: 369, perDay: 53 },
        month: { price: 1529, perDay: 51 },
      },
    },
  },
  {
    id: "prod-pooja-flower",
    srNo: 4,
    name: "Pooja Flower",
    marathiName: "पूजा फुले (मिक्स)",
    subtitle: "Complete Daily Mandir Assortment with Sacred Blooms",
    imageUrl: "/images/plan-daily.jpg",
    pricing: {
      100: {
        day: { price: 49, perDay: 49 },
        week: { price: 329, perDay: 47 },
        month: { price: 1349, perDay: 45 },
      },
      150: {
        day: { price: 65, perDay: 65 },
        week: { price: 439, perDay: 63 },
        month: { price: 1829, perDay: 61 },
      },
    },
  },
  {
    id: "prod-mixed-shevanti",
    srNo: 5,
    name: "Mixed Shevanti",
    marathiName: "मिक्स शेवंती",
    subtitle: "White & Golden Yellow Chrysanthemum Mix",
    imageUrl: "/images/chrysanthemum.jpeg",
    pricing: {
      100: {
        day: { price: 69, perDay: 69 },
        week: { price: 449, perDay: 64 },
        month: { price: 1899, perDay: 63 },
      },
      150: {
        day: { price: 89, perDay: 89 },
        week: { price: 599, perDay: 86 },
        month: { price: 2529, perDay: 84 },
      },
    },
  },
  {
    id: "prod-white-shevanti",
    srNo: 6,
    name: "White Shevanti",
    marathiName: "पांढरी शेवंती",
    subtitle: "Pure Ivory Temple Shevanti Blooms",
    imageUrl: "/images/chrysanthemum.jpeg",
    pricing: {
      100: {
        day: { price: 69, perDay: 69 },
        week: { price: 449, perDay: 64 },
        month: { price: 1899, perDay: 63 },
      },
      150: {
        day: { price: 89, perDay: 89 },
        week: { price: 599, perDay: 86 },
        month: { price: 2529, perDay: 84 },
      },
    },
  },
  {
    id: "prod-yellow-shevanti",
    srNo: 7,
    name: "Yellow Shevanti",
    marathiName: "पिवळी शेवंती",
    subtitle: "Radiant Golden Shevanti Puja Blooms",
    imageUrl: "/images/chrysanthemum.jpeg",
    pricing: {
      100: {
        day: { price: 69, perDay: 69 },
        week: { price: 449, perDay: 64 },
        month: { price: 1899, perDay: 63 },
      },
      150: {
        day: { price: 89, perDay: 89 },
        week: { price: 599, perDay: 86 },
        month: { price: 2529, perDay: 84 },
      },
    },
  },
];

/**
 * Strictly 100g & 150g Add-On Packs for Weekly & Monthly Subscribers
 */
export const INITIAL_FLOWERS: FlowerProduct[] = [
  {
    id: "flw-mixed-marigold",
    slug: "mixed-marigold",
    name: "Mixed Marigold",
    marathiName: "मिक्स झेंडू",
    subtitle: "Fresh Orange & Golden Yellow Puja Blooms",
    botanicalNote:
      "Plucked at 1:30 AM from farms. Zero cold storage, vibrant petals with rich natural fragrance.",
    imageUrl: "/images/merigold.jpeg",
    basePricePer100g: 45,
    unitType: "WEIGHT",
    availableWeights: [
      { label: "100g", grams: 100, price: 45 },
      { label: "150g", grams: 150, price: 55 },
    ],
    inStock: true,
    deityAffinity: "All Daily Puja & Toran Rituals",
  },
  {
    id: "flw-orange-marigold",
    slug: "orange-marigold",
    name: "Orange Marigold",
    marathiName: "भगवा झेंडू",
    subtitle: "Rich Saffron Temple Marigold Blooms",
    botanicalNote:
      "Hand-picked saffron marigold buds packed in breathable pouches for morning aarti.",
    imageUrl: "/images/merigold.jpeg",
    basePricePer100g: 45,
    unitType: "WEIGHT",
    availableWeights: [
      { label: "100g", grams: 100, price: 45 },
      { label: "150g", grams: 150, price: 55 },
    ],
    inStock: true,
    deityAffinity: "Daily Archana & Toran",
  },
  {
    id: "flw-yellow-marigold",
    slug: "yellow-marigold",
    name: "Yellow Marigold",
    marathiName: "पिवळा झेंडू",
    subtitle: "Golden Yellow Sacred Marigold Blooms",
    botanicalNote: "Bright golden marigold blooms plucked fresh before dawn.",
    imageUrl: "/images/merigold.jpeg",
    basePricePer100g: 45,
    unitType: "WEIGHT",
    availableWeights: [
      { label: "100g", grams: 100, price: 45 },
      { label: "150g", grams: 150, price: 55 },
    ],
    inStock: true,
    deityAffinity: "Daily Puja & Garland Making",
  },
  {
    id: "flw-pooja-flower",
    slug: "pooja-flower",
    name: "Pooja Flower",
    marathiName: "पूजा फुले",
    subtitle: "Sacred Mixed Mandir Puja Assortment",
    botanicalNote:
      "Curated assortment of fresh daily temple flowers for complete morning worship.",
    imageUrl: "/images/hibiscus.jpeg",
    basePricePer100g: 49,
    unitType: "WEIGHT",
    availableWeights: [
      { label: "100g", grams: 100, price: 49 },
      { label: "150g", grams: 150, price: 65 },
    ],
    inStock: true,
    isSacredSpecial: true,
    deityAffinity: "Complete Home Mandir Puja",
  },
  {
    id: "flw-mixed-shevanti",
    slug: "mixed-shevanti",
    name: "Mixed Shevanti",
    marathiName: "मिक्स शेवंती",
    subtitle: "Ivory & Golden Temple Chrysanthemum Mix",
    botanicalNote:
      "Long-lasting premium Shevanti blooms that stay fresh from morning aarti till evening.",
    imageUrl: "/images/chrysanthemum.jpeg",
    basePricePer100g: 69,
    unitType: "WEIGHT",
    availableWeights: [
      { label: "100g", grams: 100, price: 69 },
      { label: "150g", grams: 150, price: 89 },
    ],
    inStock: true,
    deityAffinity: "Goddess Lakshmi & Lord Vishnu Puja",
  },
  {
    id: "flw-white-shevanti",
    slug: "white-shevanti",
    name: "White Shevanti",
    marathiName: "पांढरी शेवंती",
    subtitle: "Pure Ivory White Shevanti Blooms",
    botanicalNote:
      "Farm-fresh white chrysanthemum blooms with serene natural fragrance.",
    imageUrl: "/images/chrysanthemum.jpeg",
    basePricePer100g: 69,
    unitType: "WEIGHT",
    availableWeights: [
      { label: "100g", grams: 100, price: 69 },
      { label: "150g", grams: 150, price: 89 },
    ],
    inStock: true,
    deityAffinity: "Peaceful Morning Archana",
  },
  {
    id: "flw-yellow-shevanti",
    slug: "yellow-shevanti",
    name: "Yellow Shevanti",
    marathiName: "पिवळी शेवंती",
    subtitle: "Golden Yellow Temple Shevanti Blooms",
    botanicalNote:
      "Hand-selected golden Shevanti blooms delivered dew-fresh every morning.",
    imageUrl: "/images/chrysanthemum.jpeg",
    basePricePer100g: 69,
    unitType: "WEIGHT",
    availableWeights: [
      { label: "100g", grams: 100, price: 69 },
      { label: "150g", grams: 150, price: 89 },
    ],
    inStock: true,
    deityAffinity: "Auspicious Festival & Daily Puja",
  },
];

export const INITIAL_PLANS: SubscriptionPlan[] = [
  {
    id: "plan-daily",
    slug: "1-day-plan",
    title: "1 Day Plan",
    subtitle:
      "Single-day morning trial in 100g or 150g across all 7 flower varieties.",
    price: 45,
    perDayEffectivePrice: 45,
    billingCycle: "day",
    deliveriesCount: 1,
    pouchWeight: "100g / 150g",
    mixedPredefinedBreakdown: "100g Mixed Marigold (मिक्स झेंडू)",
    badge: "1 Day Trial • 100g / 150g",
    isPopular: false,
    imageUrl: "/images/plan-daily.jpg",
    flowersIncluded: [
      "Mixed / Orange / Yellow Marigold (₹45 / ₹55)",
      "Pooja Flower Assortment (₹49 / ₹65)",
      "Mixed / White / Yellow Shevanti (₹69 / ₹89)",
    ],
    shortHighlights: [
      "Choose 100 gms or 150 gms Pouch Weight",
      "All 7 Sacred Flower Varieties Available",
      "1-Day Farm Harvest Buffer Applied",
    ],
    features: [
      "6:00 AM – 8:00 AM Silent Doorstep Drop (No Bell Ringing)",
      "1-Day Farm Harvest Buffer for 100% Zero Cold-Storage Freshness",
      "Upgrade to Weekly or Monthly anytime for Daily Add-On Shopping",
    ],
    festiveMaxGramsLimit: 0,
  },
  {
    id: "plan-weekly",
    slug: "weekly-pack",
    title: "Weekly Pack",
    subtitle:
      "7 sacred mornings in 100g or 150g with up to 2 pauses & Daily Add-On access.",
    price: 299,
    perDayEffectivePrice: 43,
    billingCycle: "week",
    deliveriesCount: 7,
    pouchWeight: "100g / 150g",
    mixedPredefinedBreakdown: "100g Mixed Marigold (मिक्स झेंडू)",
    badge: "7 Mornings • Unlocks Add-Ons",
    isPopular: false,
    imageUrl: "/images/plan-weekly.jpg",
    flowersIncluded: [
      "Marigold Varieties: 100g @ ₹299 | 150g @ ₹369",
      "Pooja Flower: 100g @ ₹329 | 150g @ ₹439",
      "Shevanti Varieties: 100g @ ₹449 | 150g @ ₹599",
    ],
    shortHighlights: [
      "7 Morning Deliveries (100g from ₹299 | 150g from ₹369)",
      "Pause up to 2 Deliveries Before 8:00 PM",
      "Unlocks 100g / 150g Loose Flower Add-Ons",
    ],
    features: [
      "Choose from 7 Flower Varieties in 100g or 150g daily pouches",
      "Pause up to 2 deliveries before 8:00 PM (Days carry forward)",
      "Subscriber Add-On Access: Order 100g or 150g extra flower pack (up to 2 days before plan ends)",
    ],
    festiveMaxGramsLimit: 150,
  },
  {
    id: "plan-monthly",
    slug: "monthly-pack",
    title: "Monthly Pack",
    subtitle:
      "30 days of effortless morning devotion in 100g or 150g with 5 pauses & Add-On access.",
    price: 1249,
    perDayEffectivePrice: 42,
    billingCycle: "month",
    deliveriesCount: 30,
    pouchWeight: "100g / 150g",
    mixedPredefinedBreakdown: "100g Mixed Marigold (मिक्स झेंडू)",
    badge: "Best Value • 30 Mornings",
    isPopular: true,
    imageUrl: "/images/plan-monthly.jpg",
    flowersIncluded: [
      "Marigold Varieties: 100g @ ₹1,249 | 150g @ ₹1,529",
      "Pooja Flower: 100g @ ₹1,349 | 150g @ ₹1,829",
      "Shevanti Varieties: 100g @ ₹1,899 | 150g @ ₹2,529",
    ],
    shortHighlights: [
      "30 Morning Deliveries (100g from ₹1,249 | 150g from ₹1,529)",
      "Full 30-Day Calendar with up to 5 Pauses",
      "Unlocks 100g / 150g Loose Flower Add-Ons",
    ],
    features: [
      "Full 30-Day Interactive Calendar Schedule in My-Orders",
      "Choose 100g or 150g across all 7 Marigold, Pooja & Shevanti varieties",
      "Pause up to 5 deliveries before 8:00 PM (Days carry forward)",
      "Subscriber Add-On Access: Order 100g or 150g extra flower pack (up to 2 days before plan ends)",
    ],
    festiveMaxGramsLimit: 150,
  },
];

export const CATALOG_STORAGE_KEY = "palassh_flowers_catalog_v8";
export const CART_STORAGE_KEY = "palassh_flower_cart_v8";
export const FESTIVE_MODE_STORAGE_KEY = "palassh_festive_mode_v8";
export const FESTIVE_DATES_STORAGE_KEY = "palassh_festive_dates_v8";
export const PLANS_STORAGE_KEY = "palassh_plans_v8";
export const PLAN_VARIANTS_STORAGE_KEY = "palassh_plan_variants_v8";
export const NORMAL_PURCHASE_STORAGE_KEY = "palassh_normal_purchase_allowed_v8";

let hasHydratedFromServer = false;

export async function hydrateStoreCatalogFromServer(force = false): Promise<void> {
  if (typeof window === "undefined") return;
  if (hasHydratedFromServer && !force) return;
  hasHydratedFromServer = true;

  try {
    const res = await fetch("/api/admin/catalog", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    if (!data.success) return;

    if (Array.isArray(data.flowers) && data.flowers.length > 0) {
      localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(data.flowers));
    }
    if (Array.isArray(data.plans) && data.plans.length > 0) {
      localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(data.plans));
      window.dispatchEvent(new Event("palassh-plans-updated"));
    }
    if (Array.isArray(data.planVariants) && data.planVariants.length > 0) {
      localStorage.setItem(
        PLAN_VARIANTS_STORAGE_KEY,
        JSON.stringify(data.planVariants)
      );
      window.dispatchEvent(new Event("palassh-plans-updated"));
    }
    if (Array.isArray(data.festiveDates)) {
      localStorage.setItem(
        FESTIVE_DATES_STORAGE_KEY,
        JSON.stringify(data.festiveDates)
      );
      window.dispatchEvent(new Event("palassh-festive-updated"));
    }
  } catch {
    // Fallback gracefully
  }
}

export function getActivePlanVariants(): PlanProductVariant[] {
  if (typeof window === "undefined") return PLAN_PRODUCT_VARIANTS;
  void hydrateStoreCatalogFromServer();
  try {
    const saved = localStorage.getItem(PLAN_VARIANTS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Ignore
  }
  return PLAN_PRODUCT_VARIANTS;
}

export function saveActivePlanVariants(variants: PlanProductVariant[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PLAN_VARIANTS_STORAGE_KEY, JSON.stringify(variants));
    window.dispatchEvent(new Event("palassh-plans-updated"));
    fetch("/api/admin/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planVariants: variants }),
    }).catch(() => {});
  } catch {
    // Ignore
  }
}

export function getAvailableWeightsForVariants(
  variants: PlanProductVariant[] = PLAN_PRODUCT_VARIANTS
): number[] {
  const weightSet = new Set<number>([100, 150]);
  variants.forEach((v) => {
    Object.keys(v.pricing || {}).forEach((k) => {
      const num = Number(k);
      if (!isNaN(num) && num > 0) weightSet.add(num);
    });
  });
  return Array.from(weightSet).sort((a, b) => a - b);
}

export function resolvePlanVariantPricing(params: {
  planId?: string;
  billingCycle: PlanDurationCycle;
  weightGrams: PlanWeightGrams;
  productVariantIdOrName?: string;
  customDeliveriesCount?: number;
  variantsList?: PlanProductVariant[];
}): {
  variant: PlanProductVariant;
  weightGrams: PlanWeightGrams;
  price: number;
  mrp: number;
  discountPercent: number;
  savedAmount: number;
  perDayEffectivePrice: number;
  deliveriesCount: number;
} {
  const list =
    params.variantsList && params.variantsList.length > 0
      ? params.variantsList
      : getActivePlanVariants();

  const needle = String(params.productVariantIdOrName || "")
    .trim()
    .toLowerCase();

  const matched =
    list.find(
      (v) =>
        v.id.toLowerCase() === needle ||
        v.name.toLowerCase() === needle ||
        needle.includes(v.name.toLowerCase())
    ) ||
    list[0] ||
    PLAN_PRODUCT_VARIANTS[0];

  const availableWeights = Object.keys(matched.pricing).map(Number);
  const requestedWeight = Number(params.weightGrams) || 100;
  const resolvedWeight = availableWeights.includes(requestedWeight)
    ? requestedWeight
    : availableWeights[0] || 100;

  const weightObj =
    matched.pricing[resolvedWeight] ||
    matched.pricing[100] ||
    PLAN_PRODUCT_VARIANTS[0].pricing[100];

  const deliveriesCount =
    params.customDeliveriesCount ||
    (params.billingCycle === "day"
      ? 1
      : params.billingCycle === "week"
      ? 7
      : 30);

  let tierPrice: PlanCyclePricing | undefined =
    (params.planId ? weightObj[params.planId] : undefined) ||
    weightObj[params.billingCycle];

  if (!tierPrice) {
    const baseMonthPerDay = weightObj.month?.perDay || 42;
    const calculatedPrice = Math.round(baseMonthPerDay * deliveriesCount);
    tierPrice = {
      price: calculatedPrice,
      perDay: baseMonthPerDay,
    };
  }

  const perDayEffective =
    deliveriesCount > 0
      ? Math.max(1, Math.round(tierPrice.price / deliveriesCount))
      : tierPrice.perDay;

  const discountInfo = getStrikeThroughMrp(tierPrice.price, tierPrice.mrp);

  return {
    variant: matched,
    weightGrams: resolvedWeight,
    price: tierPrice.price,
    mrp: discountInfo.mrp,
    discountPercent: discountInfo.discountPercent,
    savedAmount: discountInfo.savedAmount,
    perDayEffectivePrice: perDayEffective,
    deliveriesCount,
  };
}

export function getNormalPurchaseAllowed(): boolean {
  return false;
}

export function saveNormalPurchaseAllowed(_allowed: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(NORMAL_PURCHASE_STORAGE_KEY, "false");
  window.dispatchEvent(new Event("palassh-store-access-updated"));
}

export function getActivePlansCatalog(): SubscriptionPlan[] {
  if (typeof window === "undefined") return INITIAL_PLANS;
  void hydrateStoreCatalogFromServer();
  try {
    const saved = localStorage.getItem(PLANS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Fallback
  }
  return INITIAL_PLANS;
}

export function saveActivePlansCatalog(plans: SubscriptionPlan[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(plans));
    window.dispatchEvent(new Event("palassh-plans-updated"));
    fetch("/api/admin/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plans }),
    }).catch(() => {});
  } catch {
    // Ignore
  }
}

export function getActiveFlowersCatalog(): FlowerProduct[] {
  if (typeof window === "undefined") return INITIAL_FLOWERS;
  void hydrateStoreCatalogFromServer();
  try {
    const saved = localStorage.getItem(CATALOG_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Fallback
  }
  return INITIAL_FLOWERS;
}

export function saveActiveFlowersCatalog(flowers: FlowerProduct[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(flowers));
    fetch("/api/admin/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flowers }),
    }).catch(() => {});
  } catch {
    // Ignore
  }
}

export function getStoredCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Ignore
  }
  return [];
}

export function saveStoredCart(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("palassh-cart-updated"));
  } catch {
    // Ignore
  }
}

export function getFestiveDatesList(): string[] {
  if (typeof window === "undefined") return [];
  void hydrateStoreCatalogFromServer();
  try {
    const saved = localStorage.getItem(FESTIVE_DATES_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Ignore
  }
  return [];
}

export function saveFestiveDatesList(dates: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FESTIVE_DATES_STORAGE_KEY, JSON.stringify(dates));
    window.dispatchEvent(new Event("palassh-festive-updated"));
    fetch("/api/admin/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ festiveDates: dates }),
    }).catch(() => {});
  } catch {
    // Ignore
  }
}

export function getTomorrowDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function getEarliestDeliveryDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function getFestiveModeStatus(targetDateStr?: string): {
  isFestiveDay: boolean;
  festivalName: string;
  matchedDate?: string;
} {
  if (typeof window === "undefined") {
    return { isFestiveDay: false, festivalName: "Festive Puja" };
  }
  try {
    const checkDate = targetDateStr || getEarliestDeliveryDateString();
    const todayStr = new Date().toISOString().split("T")[0];
    const calDates = getFestiveDatesList();

    if (calDates.includes(checkDate) || calDates.includes(todayStr)) {
      return {
        isFestiveDay: true,
        festivalName: `Festive Calendar Date (${
          calDates.includes(checkDate) ? checkDate : todayStr
        })`,
        matchedDate: checkDate,
      };
    }

    const saved = localStorage.getItem(FESTIVE_MODE_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.isFestiveDay) return parsed;
    }
  } catch {
    // Ignore
  }
  return { isFestiveDay: false, festivalName: "Festive Puja" };
}

export function getCurrentCustomerTier(): CustomerTier {
  if (typeof window === "undefined") return "NORMAL";
  try {
    const savedSub = localStorage.getItem("palassh_active_subscription");
    if (savedSub) {
      const parsed = JSON.parse(savedSub);
      if (parsed && parsed.orderId && parsed.status === "ACTIVE") {
        if (
          parsed.planId === "plan-monthly" ||
          parsed.billingCycle === "month" ||
          Number(parsed.totalDeliveries) >= 15
        ) {
          return "MONTHLY";
        }
        if (
          parsed.planId === "plan-weekly" ||
          parsed.billingCycle === "week" ||
          Number(parsed.totalDeliveries) >= 7
        ) {
          return "WEEKLY";
        }
        return "ONE_DAY";
      }
    }
  } catch {
    // Ignore
  }
  return "NORMAL";
}

/**
 * Evaluates whether a Weekly/Monthly subscriber's active subscription is eligible for Add-Ons
 * and returns the list of valid delivery dates:
 * - Must be WEEKLY or MONTHLY active plan.
 * - Date must be >= earliestBufferDate (Today + 2 Days for 1-day farm buffer).
 * - Date CANNOT be in the last 2 scheduled delivery days of the plan!
 */
export function getSubscriberAddonWindow(params: {
  scheduledDatesSorted: string[];
  earliestBufferDate: string;
}): {
  canBookAnyAddon: boolean;
  eligibleDates: string[];
  lockedLastTwoDates: string[];
  maxAllowedAddonDate: string | null;
  blockReason?: string;
} {
  const dates = [...params.scheduledDatesSorted].sort();
  if (dates.length <= 2) {
    return {
      canBookAnyAddon: false,
      eligibleDates: [],
      lockedLastTwoDates: dates,
      maxAllowedAddonDate: null,
      blockReason:
        "Add-Ons Locked: Less than 3 deliveries remain in your subscription plan.",
    };
  }

  // Last 2 scheduled delivery dates of the plan are strictly locked for Add-Ons
  const lockedLastTwoDates = dates.slice(-2);
  const datesExcludingLastTwo = dates.slice(0, -2);
  const maxAllowedAddonDate =
    datesExcludingLastTwo[datesExcludingLastTwo.length - 1] || null;

  // Filter by 1-Day Farm Buffer (date >= Today + 2 Days)
  const eligibleDates = datesExcludingLastTwo.filter(
    (d) => d >= params.earliestBufferDate
  );

  if (eligibleDates.length === 0) {
    return {
      canBookAnyAddon: false,
      eligibleDates: [],
      lockedLastTwoDates,
      maxAllowedAddonDate,
      blockReason:
        "Add-On Window Closed: Your subscription is in its final 2 delivery days (or within the 1-day harvest buffer of the last 2 days). Renew your plan to book new Add-Ons!",
    };
  }

  return {
    canBookAnyAddon: true,
    eligibleDates,
    lockedLastTwoDates,
    maxAllowedAddonDate,
  };
}

/**
 * Strict Client & Server Add-On Purchase Rule:
 * - Only WEEKLY & MONTHLY subscribers can buy loose flower Add-Ons.
 * - Only 1 single pack of 100g OR 150g is allowed per day!
 */
export function validateDirectFlowerPurchaseLimit(
  currentCartGramsExcludingThisFlower: number,
  selectedPackGrams: number,
  tier: CustomerTier,
  _isFestiveDay?: boolean
): { allowed: boolean; maxGrams: number; reason?: string } {
  if (tier !== "WEEKLY" && tier !== "MONTHLY") {
    return {
      allowed: false,
      maxGrams: 0,
      reason:
        "Weekly & Monthly Subscribers Only: Additional loose flower Add-Ons (100g or 150g) are exclusively available for active Weekly & Monthly Plan subscribers.",
    };
  }

  if (selectedPackGrams !== 100 && selectedPackGrams !== 150) {
    return {
      allowed: false,
      maxGrams: 150,
      reason:
        "Add-On Weight Rule: You can only select either a 100g or 150g pack per day.",
    };
  }

  if (currentCartGramsExcludingThisFlower > 0) {
    return {
      allowed: false,
      maxGrams: 150,
      reason:
        "1 Pack Per Day Limit: You can add only one single 100g or 150g additional flower pack per day.",
    };
  }

  return { allowed: true, maxGrams: 150 };
}