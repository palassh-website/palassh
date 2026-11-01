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
  }[];
  inStock: boolean;
  isSacredSpecial?: boolean;
  deityAffinity: string;
}

export type FlowerSelectionMode = "MIXED" | "CUSTOM";

export interface SubscriptionPlan {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  price: number;
  perDayEffectivePrice: number;
  billingCycle: "day" | "week" | "month";
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
  grams: number;
  unitPrice: number;
  quantity: 1; // Strictly locked to 1 (No quantity loophole)
}

export type CustomerTier = "NORMAL" | "ONE_DAY" | "WEEKLY" | "MONTHLY";

// Weight labels strictly show grams only as requested (Point #9)
export const INITIAL_FLOWERS: FlowerProduct[] = [
  {
    id: "flw-marigold",
    slug: "marigold",
    name: "Marigold",
    marathiName: "झेंडू",
    subtitle: "Fresh Saffron & Golden Puja Blooms",
    botanicalNote:
      "Plucked at 1:30 AM from Nashik farms. Zero cold storage, vibrant petals with rich natural fragrance for daily archana and toran.",
    imageUrl: "/images/merigold.jpeg",
    basePricePer100g: 35,
    unitType: "WEIGHT",
    availableWeights: [
      { label: "100g", grams: 100, price: 35 },
      { label: "250g", grams: 250, price: 80 },
      { label: "500g", grams: 500, price: 150 },
      { label: "1000g", grams: 1000, price: 290 },
    ],
    inStock: true,
    deityAffinity: "All Daily Puja & Toran Rituals",
  },
  {
    id: "flw-chrysanthemum",
    slug: "chrysanthemum",
    name: "Chrysanthemum",
    marathiName: "शेवंती",
    subtitle: "Ivory & Golden Temple Blooms",
    botanicalNote:
      "Long-lasting premium blooms that stay dew-fresh in your home mandir from early morning aarti until late evening.",
    imageUrl: "/images/chrysanthemum.jpeg",
    basePricePer100g: 45,
    unitType: "WEIGHT",
    availableWeights: [
      { label: "100g", grams: 100, price: 45 },
      { label: "250g", grams: 250, price: 105 },
      { label: "500g", grams: 500, price: 195 },
      { label: "1000g", grams: 1000, price: 380 },
    ],
    inStock: true,
    deityAffinity: "Goddess Lakshmi & Lord Vishnu Puja",
  },
  {
    id: "flw-hibiscus",
    slug: "red-hibiscus",
    name: "Red Hibiscus",
    marathiName: "लाल जास्वंद",
    subtitle: "Sacred Crimson Buds for Ganpati & Devi",
    botanicalNote:
      "Hand-picked Dahanu crimson buds packed in breathable eco-pouches so every bloom opens fresh during your morning prayers.",
    imageUrl: "/images/hibiscus.jpeg",
    basePricePer100g: 50,
    unitType: "COUNT_AND_WEIGHT",
    availableWeights: [
      { label: "100g", grams: 100, price: 50 },
      { label: "250g", grams: 250, price: 115 },
      { label: "500g", grams: 500, price: 210 },
      { label: "1000g", grams: 1000, price: 400 },
    ],
    inStock: true,
    isSacredSpecial: true,
    deityAffinity: "Lord Ganesha & Goddess Durga Puja",
  },
];

export const INITIAL_PLANS: SubscriptionPlan[] = [
  {
    id: "plan-daily",
    slug: "one-day-puja-pack",
    title: "One Day Puja Pack",
    subtitle: "Single-day morning trial ritual with farm-fresh sacred blooms.",
    price: 49,
    perDayEffectivePrice: 49,
    billingCycle: "day",
    deliveriesCount: 1,
    pouchWeight: "100g – 120g",
    mixedPredefinedBreakdown:
      "40g Marigold (झेंडू) + 40g Chrysanthemum (शेवंती) + 2 Red Hibiscus (लाल जास्वंद) + Sacred Tulsi",
    badge: "One Day Trial",
    isPopular: false,
    imageUrl: "/images/plan-daily.jpg",
    flowersIncluded: [
      "Marigold (झेंडू)",
      "Chrysanthemum (शेवंती)",
      "Red Hibiscus (जास्वंद)",
      "Fresh Tulsi",
    ],
    shortHighlights: [
      "100g – 120g Dew-Fresh Morning Pouch",
      "5:00 AM – 8:00 AM Silent Doorstep Drop",
    ],
    features: [
      "6:00 AM – 8:00 AM Silent Doorstep Drop (No Bell Ringing)",
      "Zero Cold-Storage • Plucked at 1:30 AM from Farms",
      "Includes complimentary sacred Tulsi leaves",
    ],
    festiveMaxGramsLimit: 0,
  },
  {
    id: "plan-weekly",
    slug: "weekly-devotion-pack",
    title: "Weekly Devotion Pack",
    subtitle: "7 sacred mornings with day-by-day flower & pause control.",
    price: 329,
    perDayEffectivePrice: 47,
    billingCycle: "week",
    deliveriesCount: 7,
    pouchWeight: "125g + Garland",
    mixedPredefinedBreakdown:
      "50g Marigold (झेंडू) + 50g Chrysanthemum (शेवंती) + 3 Red Hibiscus (लाल जास्वंद) + Sacred Garland",
    badge: "Festive 2 KG Access",
    isPopular: false,
    imageUrl: "/images/plan-weekly.jpg",
    flowersIncluded: [
      "Marigold (झेंडू)",
      "Chrysanthemum (शेवंती)",
      "Red Hibiscus (जास्वंद)",
      "Hand-Strung Garland",
    ],
    shortHighlights: [
      "7 Morning Deliveries (₹47/morning effective)",
      "Unlock up to 2 KG Flower Booking on Festive Days",
    ],
    features: [
      "Exclusive Festive Access: Buy up to 2 KG combined flowers on festivals",
      "Modify next day's flower or Pause before 8:00 PM",
      "Paused days automatically carry forward",
    ],
    festiveMaxGramsLimit: 2000,
  },
  {
    id: "plan-monthly",
    slug: "monthly-sacred-assortment",
    title: "Monthly Sacred Assortment",
    subtitle: "Complete 30-day peace of mind with priority festive flower quota.",
    price: 1350,
    perDayEffectivePrice: 45,
    billingCycle: "month",
    deliveriesCount: 30,
    pouchWeight: "150g + Festival Lotus",
    mixedPredefinedBreakdown:
      "60g Marigold (झेंडू) + 50g Chrysanthemum (शेवंती) + 4 Red Hibiscus (लाल जास्वंद) + Belpatra & Tulsi",
    badge: "Most Loved • 3 KG Festive Quota",
    isPopular: true,
    imageUrl: "/images/plan-monthly.jpg",
    flowersIncluded: [
      "Marigold (झेंडू)",
      "Chrysanthemum (शेवंती)",
      "Red Hibiscus (जास्वंद)",
      "Festival Lotus & Belpatra",
    ],
    shortHighlights: [
      "30 Morning Deliveries (Only ₹45/morning)",
      "Priority 3 KG Flower Quota on Festive Days & Unlimited Pauses",
    ],
    features: [
      "Full 30-Day Interactive Checkbox Schedule in My-Orders",
      "Priority Festive Quota: Buy up to 3 KG combined flowers on festivals",
      "Unlimited 1-Click Pause before 8 PM (Days carry forward)",
      "Complimentary Gifts on special Days ",
    ],
    festiveMaxGramsLimit: 3000,
  },
];

export const CATALOG_STORAGE_KEY = "palassh_flowers_catalog_v4";
export const CART_STORAGE_KEY = "palassh_flower_cart_v3";
export const FESTIVE_MODE_STORAGE_KEY = "palassh_festive_mode_v2";
export const FESTIVE_DATES_STORAGE_KEY = "palassh_festive_dates_v1";
export const PLANS_STORAGE_KEY = "palassh_plans_v2";
export const NORMAL_PURCHASE_STORAGE_KEY = "palassh_normal_purchase_allowed_v1";

/**
 * Returns whether normal / non-subscriber users are allowed to purchase loose flowers.
 * Defaults to true.
 * When false, ONLY Weekly and Monthly plan subscribers can purchase loose flowers.
 */
export function getNormalPurchaseAllowed(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const saved = localStorage.getItem(NORMAL_PURCHASE_STORAGE_KEY);
    if (saved !== null) {
      return saved === "true";
    }
  } catch {
    // Ignore error
  }
  return true;
}

export function saveNormalPurchaseAllowed(allowed: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(NORMAL_PURCHASE_STORAGE_KEY, String(allowed));
    window.dispatchEvent(new Event("palassh-store-access-updated"));
    // Background sync to API if available
    fetch("/api/admin/store-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ normalPurchaseAllowed: allowed }),
    }).catch(() => {});
  } catch {
    // Ignore error
  }
}

export function getActivePlansCatalog(): SubscriptionPlan[] {
  if (typeof window === "undefined") return INITIAL_PLANS;
  try {
    const saved = localStorage.getItem(PLANS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Fallback to default catalog
  }
  return INITIAL_PLANS;
}

export function saveActivePlansCatalog(plans: SubscriptionPlan[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(plans));
    window.dispatchEvent(new Event("palassh-plans-updated"));
    // Background sync to API if available
    fetch("/api/admin/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plans }),
    }).catch(() => {});
  } catch {
    // Ignore storage error
  }
}

export function getActiveFlowersCatalog(): FlowerProduct[] {
  if (typeof window === "undefined") return INITIAL_FLOWERS;
  try {
    const saved = localStorage.getItem(CATALOG_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Fallback to default catalog
  }
  return INITIAL_FLOWERS;
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
    // Ignore storage error
  }
  return [];
}

export function saveStoredCart(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("palassh-cart-updated"));
  } catch {
    // Ignore storage error
  }
}

// Returns array of YYYY-MM-DD strings marked as Festive Days by Admin Calendar
export function getFestiveDatesList(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(FESTIVE_DATES_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Ignore error
  }
  return [];
}

export function saveFestiveDatesList(dates: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FESTIVE_DATES_STORAGE_KEY, JSON.stringify(dates));
    window.dispatchEvent(new Event("palassh-festive-updated"));
  } catch {
    // Ignore error
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

export function getFestiveModeStatus(targetDateStr?: string): {
  isFestiveDay: boolean;
  festivalName: string;
  matchedDate?: string;
} {
  if (typeof window === "undefined") {
    return { isFestiveDay: false, festivalName: "Festive Puja" };
  }
  try {
    const checkDate = targetDateStr || getTomorrowDateString();
    const todayStr = new Date().toISOString().split("T")[0];
    const calDates = getFestiveDatesList();

    // Check if today or tomorrow's delivery date is marked in Admin Festive Calendar
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
    // Ignore error
  }
  return { isFestiveDay: false, festivalName: "Festive Puja" };
}

export function getCurrentCustomerTier(): CustomerTier {
  if (typeof window === "undefined") return "NORMAL";
  try {
    const savedSub = localStorage.getItem("palassh_active_subscription");
    if (savedSub) {
      const parsed = JSON.parse(savedSub);
      if (parsed.status === "ACTIVE") {
        if (
          parsed.planId === "plan-monthly" ||
          parsed.billingCycle === "month" ||
          String(parsed.planTitle).toLowerCase().includes("month")
        ) {
          return "MONTHLY";
        }
        if (
          parsed.planId === "plan-weekly" ||
          parsed.billingCycle === "week" ||
          String(parsed.planTitle).toLowerCase().includes("week")
        ) {
          return "WEEKLY";
        }
        return "ONE_DAY";
      }
    }
  } catch {
    // Ignore storage error
  }
  return "NORMAL";
}

/**
 * Enforces Point #2, #7, and #9 + Store Access Toggle:
 * - Admin Normal Purchase Toggle: If OFF, non-subscribers (NORMAL / ONE_DAY) CANNOT buy loose flowers.
 *   Only Weekly & Monthly subscribers can purchase flowers.
 * - Festive Days (from Calendar or Toggle): Normal/One-Day users CANNOT buy direct flowers.
 *   Weekly = max 2000g (2 KG) combined. Monthly = max 3000g (3 KG) combined.
 * - Normal Days (when toggle is ON): Normal/One-Day user max 500g combined. Weekly = 2000g, Monthly = 3000g.
 */
export function validateDirectFlowerPurchaseLimit(
  currentCartGramsExcludingThisFlower: number,
  selectedPackGrams: number,
  tier: CustomerTier,
  isFestiveDay: boolean,
  normalPurchaseAllowedOverride?: boolean
): { allowed: boolean; maxGrams: number; reason?: string } {
  const projectedTotal =
    currentCartGramsExcludingThisFlower + selectedPackGrams;

  // 1. Separate Admin Normal User Purchase Control
  const isNormalAllowed =
    normalPurchaseAllowedOverride !== undefined
      ? normalPurchaseAllowedOverride
      : getNormalPurchaseAllowed();

  if (!isNormalAllowed && tier !== "WEEKLY" && tier !== "MONTHLY") {
    return {
      allowed: false,
      maxGrams: 0,
      reason:
        "Non-Subscriber Orders Paused: Loose flower purchases are currently reserved exclusively for Weekly & Monthly subscribers. Please subscribe to a plan to start ordering.",
    };
  }

  // 2. Festive Day Rules
  if (isFestiveDay) {
    if (tier === "NORMAL" || tier === "ONE_DAY") {
      return {
        allowed: false,
        maxGrams: 0,
        reason:
          "Festive Day Restriction: Direct flower purchases on Festive Days are exclusively reserved for our Weekly (up to 2 KG) & Monthly (up to 3 KG) subscribers.",
      };
    }
    const maxFestive = tier === "MONTHLY" ? 3000 : 2000;
    if (projectedTotal > maxFestive) {
      return {
        allowed: false,
        maxGrams: maxFestive,
        reason: `Festive Quota Exceeded: Your ${tier} plan allows up to ${
          maxFestive / 1000
        } KG (${maxFestive}g) combined across all flowers. Other flowers in cart: ${currentCartGramsExcludingThisFlower}g.`,
      };
    }
    return { allowed: true, maxGrams: maxFestive };
  }

  // 3. Normal Day Rules
  const maxNormal =
    tier === "MONTHLY" ? 3000 : tier === "WEEKLY" ? 2000 : 500;

  if (projectedTotal > maxNormal) {
    const plans = getActivePlansCatalog();
    const weeklyPrice = plans.find((p) => p.id === "plan-weekly")?.price || 329;
    const monthlyPrice = (
      plans.find((p) => p.id === "plan-monthly")?.price || 1350
    ).toLocaleString("en-IN");

    return {
      allowed: false,
      maxGrams: maxNormal,
      reason:
        maxNormal === 500
          ? `Direct orders have a strict maximum limit of 500g combined (Other flowers in cart: ${currentCartGramsExcludingThisFlower}g). Subscribe to Weekly (₹${weeklyPrice}) or Monthly (₹${monthlyPrice}) for 2 KG – 3 KG limits!`
          : `Your ${tier} plan allows up to ${maxNormal}g combined per order.`,
    };
  }

  return { allowed: true, maxGrams: maxNormal };
}