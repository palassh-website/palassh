import { INITIAL_PLANS, SubscriptionPlan } from "@/features/catalog/types";

export interface HeroSlideBanner {
  id: string;
  badge: string;
  titleLine1: string;
  titleHighlight: string;
  subtitle: string;
  imageUrl: string;
  primaryBtnText: string;
  primaryBtnHref: string;
  secondaryBtnText: string;
  secondaryBtnHref: string;
  priceTag: string;
}

export function getDynamicHeroBanners(
  plans: SubscriptionPlan[]
): HeroSlideBanner[] {
  const oneDay =
    plans.find((p) => p.id === "plan-daily") || plans[0] || INITIAL_PLANS[0];
  const weekly =
    plans.find((p) => p.id === "plan-weekly") || plans[1] || INITIAL_PLANS[1];
  const monthly =
    plans.find((p) => p.id === "plan-monthly") || plans[2] || INITIAL_PLANS[2];

  const oneDayPrice = `₹${oneDay.price}`;
  const weeklyPrice = `₹${weekly.price}`;
  const monthlyPrice = `₹${monthly.price.toLocaleString("en-IN")}`;

  return [
    {
      id: "slide-1",
      badge: "Fresh Flower Home Delivery in Thane",
      titleLine1: "Fresh Flowers in Thane",
      titleHighlight: "Delivered to Your Doorstep.",
      subtitle:
        "Browse the available flower varieties, order a one-day morning pack or choose a weekly/monthly plan, and get fresh flowers delivered to your home in serviceable Thane pincodes.",
      imageUrl: "/images/hero-banner.webp",
      primaryBtnText: `Order a 1-Day Pack From ${oneDayPrice}`,
      primaryBtnHref: "#plans",
      secondaryBtnText: "Browse All Flower Varieties",
      secondaryBtnHref: "/flowers-in-thane",
      priceTag: `100g Plans: ${oneDayPrice} Day • ${weeklyPrice} Week • ${monthlyPrice} Month`,
    },
    {
      id: "slide-2",
      badge: "100% Natural • Zero Cold Storage",
      titleLine1: "Fresh Pooja Flowers",
      titleHighlight: "& with Blessings.",
      subtitle:
        "Explore the currently listed flower varieties and choose a supported pack for your next morning home delivery.",
      imageUrl: "/images/chrysanthemum.webp",
      primaryBtnText: "Compare 100g & 150g Plans",
      primaryBtnHref: "#plans",
      secondaryBtnText: "Check Society Pincode",
      secondaryBtnHref: "#pincode-check",
      priceTag: "Single Morning Slot: 6:00 AM – 8:00 AM",
    },
    {
      id: "slide-3",
      badge: "Exclusive Member Flower Store",
      titleLine1: "Subscribe Plan ,",
      titleHighlight: "& Unlock Add on's.",
      subtitle:
        "Subscribe to any Weekly or Monthly Plan to unlock exclusive member access to 100g or 150g extra flower Add-On packs.",
      imageUrl: "/images/hibiscus.webp",
      primaryBtnText: `Start Monthly Plan @ ${monthlyPrice}`,
      primaryBtnHref: "/checkout?plan=monthly-pack",
      secondaryBtnText: "Member Flower Store",
      secondaryBtnHref: "/products",
      priceTag: "Pause Anytime Before 8:00 PM",
    },
  ];
}

export const DEFAULT_HERO_BANNERS: HeroSlideBanner[] =
  getDynamicHeroBanners(INITIAL_PLANS);
