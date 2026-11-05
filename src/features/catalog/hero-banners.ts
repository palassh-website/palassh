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
      badge: "100g & 150g Daily Pouches • Thane 400601–400608",
      titleLine1: "Sacred Puja Blooms,",
      titleHighlight: "flowers that pray with you.",
      subtitle:
        "Choose from 7 sacred flower varieties in 100 gms or 150 gms across 1 Day, Weekly, and Monthly plans. Hung silently between 6:00 AM – 8:00 AM.",
      imageUrl: "/images/hero-banner.webp",
      primaryBtnText: `Explore Plans From ${oneDayPrice}`,
      primaryBtnHref: "#plans",
      secondaryBtnText: "View 7 Flower Varieties",
      secondaryBtnHref: "#plans",
      priceTag: `100g Plans: ${oneDayPrice} Day • ${weeklyPrice} Week • ${monthlyPrice} Month`,
    },
    {
      id: "slide-2",
      badge: "1-Day Farm Harvest Buffer • Zero Cold Storage",
      titleLine1: "Marigold, Pooja Flowers",
      titleHighlight: "& Temple Shevanti.",
      subtitle:
        "Mixed Marigold, Orange Marigold, Yellow Marigold, Pooja Flowers, and White & Yellow Shevanti plucked fresh at 8:00 PM.",
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
      titleLine1: "Subscribe Once,",
      titleHighlight: "Unlock Loose Shopping.",
      subtitle:
        "Subscribe to any Weekly or Monthly Plan to unlock exclusive member access to 100g or 150g daily loose flower Add-On packs.",
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
