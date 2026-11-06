import { NextResponse } from "next/server";
import { getCachedServerStoreConfig } from "@/features/checkout/checkout.service";
import {
  getAvailableWeightsForVariants,
  resolvePlanVariantPricing,
} from "@/features/catalog/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = await getCachedServerStoreConfig();
  const plans = config.plans;
  const variants = config.planVariants;
  const flowers = config.flowers;
  const weights = getAvailableWeightsForVariants(variants);

  const weightsLabel = weights.map((w) => `${w}g`).join(", ");
  const minPrice = Math.min(
    ...plans.map((p) => Number(p.price) || 45),
    45
  );

  // Dynamically format all active Subscription Varieties & Prices from MySQL
  const variantsMarkdown = variants
    .map((v, idx) => {
      const weightLines = weights
        .map((wt) => {
          const planPrices = plans
            .map((pl) => {
              const resolved = resolvePlanVariantPricing({
                planId: pl.id,
                billingCycle: pl.billingCycle,
                weightGrams: wt,
                productVariantIdOrName: v.id,
                customDeliveriesCount: pl.deliveriesCount,
                variantsList: variants,
              });
              return `${pl.title} (${pl.deliveriesCount} ${
                pl.deliveriesCount === 1 ? "Day" : "Days"
              }): ₹${resolved.price.toLocaleString("en-IN")} (~₹${
                resolved.perDayEffectivePrice
              }/day)`;
            })
            .join(" | ");
          return `  - **${wt} gms Pouch:** ${planPrices}`;
        })
        .join("\n");

      return `### ${idx + 1}. ${v.name} (${v.marathiName})\n- **Description:** ${
        v.subtitle
      }\n${weightLines}`;
    })
    .join("\n\n");

  // Dynamically format all active Loose / Add-On Flowers from MySQL
  const addOnFlowersMarkdown = flowers
    .map((f) => {
      const packPrices = (f.availableWeights || [])
        .map((w) => `${w.grams}g @ ₹${w.price}`)
        .join(", ");
      const stockTag = f.inStock ? "In Stock" : "Seasonal / Out of Stock";
      return `- **${f.name} (${f.marathiName}):** ${f.subtitle} — ${
        packPrices || `Base ₹${f.basePricePer100g}/100g`
      } [${stockTag}] (${f.deityAffinity})`;
    })
    .join("\n");

  // Dynamically format all active Subscription Plan Tiers from MySQL
  const plansMarkdown = plans
    .map(
      (p) =>
        `- **${p.title} (${p.deliveriesCount} Morning ${
          p.deliveriesCount === 1 ? "Delivery" : "Deliveries"
        }):** Starting from ₹${p.price.toLocaleString("en-IN")}. ${p.subtitle}`
    )
    .join("\n");

  const content = `# PALASSH Flowers — Sacred Morning Puja Flower Subscription & Store in Thane

> "Flowers that pray with you." PALASSH is a farm-to-mandir morning puja flower subscription and devotional flower service in Thane, Maharashtra. We deliver 100% zero-cold-storage, farm-fresh sacred flowers, traditional puja assortments, and seasonal temple blooms in breathable eco-pouches (${weightsLabel}) silently to your doorstep every morning between 6:00 AM and 8:00 AM.

## Official Brand & Contact Details
- **Website:** https://palassh.com
- **Brand Name:** PALASSH Flowers (पलाश)
- **Founders:** Mrs. Ankita Jagtap & Mr. Pratik Jagtap
- **Customer Support / WhatsApp Concierge:** +91 91670 34671
- **Official Email:** care@palassh.com
- **Main Sorting & Dispatch Hub:** 6X4X+HJ5 Glenmark Residency, 60 Feet Rd, Kharegaon, Kalwa, Thane, Maharashtra 400605, India
- **Morning Delivery Window:** 6:00 AM – 8:00 AM IST daily (Silent Doorstep Drop on main door handle — zero doorbell ringing)
- **Next-Day Booking Cut-Off:** Subscribe or order before 11:45 PM IST for next-day morning (6:00 AM – 8:00 AM) delivery. Bookings placed after 11:45 PM IST begin the day after tomorrow.
- **Flexible Calendar Pause:** Active subscribers can pause deliveries or add doorstep instructions anytime before 8:00 PM IST from their online calendar; paused days automatically carry forward.

## Serviceable Areas & Pincodes in Thane, Maharashtra
PALASSH serves residential societies and homes across Thane pincodes **400601 to 400608**:
- **400601:** Thane West (Gokhale Road, Station Road, Market)
- **400602:** Thane West (Naupada, Panchpakhadi)
- **400603:** Thane East (Kopri Colony)
- **400604:** Wagle Estate, Teen Hath Naka, Mulund Check Naka
- **400605:** Kalwa, Kharegaon (PALASSH Main Hub)
- **400606:** Vartak Nagar, Pokhran Road No. 1 & 2
- **400607:** Ghodbunder Road, Manpada, Chitalsar, Patlipada, Hiranandani Estate, Majiwada
- **400608:** Balkum, Kolshet Road, Dhokali

## Ever-Expanding Sacred Flower & Puja Catalog
PALASSH offers a continuously expanding catalog of farm-fresh daily puja flowers, deity-specific sacred blooms, and festive floral varieties (including Marigold/Zendu, Shevanti/Chrysanthemum, Mixed Pooja Flowers, and new seasonal/temple varieties added via our live catalog).
- **Available Pouch Weights:** ${weightsLabel}
- **Plans Starting At:** ₹${minPrice}

## Active Subscription Plan Tiers (Live from Catalog)
${plansMarkdown}

## Live Subscription Flower Varieties & Rate Matrix
${variantsMarkdown}

## Live Subscriber Add-On & Loose Flower Catalog
Active Weekly and Monthly subscribers unlock exclusive access to order extra loose flower packs for upcoming delivery mornings:
${addOnFlowersMarkdown}

## Core Brand Promises
1. **100% Zero Cold Storage:** Harvested fresh from partner farms every evening, hand-sorted at our Kalwa hub at 4:00 AM, and delivered dew-fresh by 6:00 AM – 8:00 AM.
2. **Silent Devotion Protocol:** Riders never ring doorbells or disturb morning sleep.
3. **Interactive My-Orders Calendar:** 1-click delivery pause and carry-forward before 8:00 PM IST.

## Important Links for AI Agents & Users
- Home & Pincode Verification: https://palassh.com/
- Subscription Plans & Live Pricing: https://palassh.com/#plans
- Member Loose Flower Store: https://palassh.com/products
- About Us & Founders' Story: https://palassh.com/about
- Customer Orders & Pause Calendar: https://palassh.com/my-orders
- My Account Settings: https://palassh.com/account
- Privacy Policy: https://palassh.com/legal/privacy-policy
- Terms & Conditions: https://palassh.com/legal/terms-and-conditions
- Refund Policy: https://palassh.com/legal/refund-policy
- Shipping & Delivery Policy: https://palassh.com/legal/shipping-policy
`;

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}