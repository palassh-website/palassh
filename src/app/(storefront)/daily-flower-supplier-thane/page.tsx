import type { Metadata } from "next";
import { getCachedServerStoreConfig } from "@/features/checkout/checkout.service";
import { SeoLandingTemplate } from "../_seo/SeoLandingTemplate";

export const revalidate = 3600;

const PATH = "/daily-flower-supplier-thane";

export const metadata: Metadata = {
  title: "Daily Flower Supplier in Thane | Morning Flower Subscription",
  description:
    "Get fresh flowers every morning in Thane. PALASSH is a daily flower supplier with 1-day, weekly and monthly plans, silent 6–8 AM doorstep delivery and pause options.",
  alternates: { canonical: `https://palassh.com${PATH}` },
};

const FAQS = [
  {
    q: "How does a daily flower supply work with PALASSH?",
    a: "You choose a Weekly or Monthly plan, a flower and a pack size, and pay online. A fresh pouch is then delivered to your door every morning between 6:00 AM and 8:00 AM for the length of the plan.",
  },
  {
    q: "Do I have to commit to a long subscription?",
    a: "No. The 1 Day Plan is a single morning delivery, so you can try the flowers once. Weekly and monthly plans are for people who want flowers every morning.",
  },
  {
    q: "Can I pause deliveries when I travel?",
    a: "Yes. From your My Orders calendar, Weekly subscribers can pause up to 2 deliveries and Monthly subscribers up to 5, as long as the pause is made before 8:00 PM.",
  },
  {
    q: "Can I buy extra flowers on top of my daily pack?",
    a: "Active Weekly and Monthly subscribers can buy extra 100g or 150g flower add-on packs from the member store. The 1 Day Plan does not include add-on access.",
  },
  {
    q: "Which parts of Thane do you supply?",
    a: "Thane pincodes 400601 to 400608, including Thane West, Ghodbunder Road, Kalwa, Pokhran Road, Naupada and Balkum. Check your pincode on the home page before ordering.",
  },
];

export default async function DailyFlowerSupplierThanePage() {
  const config = await getCachedServerStoreConfig();
  const flowers = config.flowers
    .filter((flower) => flower.inStock !== false && flower.name)
    .map((flower) => ({
      name: String(flower.name).trim(),
      marathiName: flower.marathiName || undefined,
    }));

  return (
    <SeoLandingTemplate
      path={PATH}
      breadcrumbName="Daily Flower Supplier in Thane"
      eyebrow="PALASSH • Daily Morning Flower Supply"
      h1="Daily Flower Supplier in Thane: Fresh Flowers at Your Door Every Morning"
      intro="Stop buying flowers one trip at a time. PALASSH supplies fresh flowers to homes across Thane every morning between 6:00 AM and 8:00 AM, on a plan you can start for one day, one week or one month."
      sections={[
        {
          heading: "What a daily flower supply from PALASSH includes",
          bullets: [
            "A fresh pouch of flowers at your door every morning, 6:00 AM to 8:00 AM.",
            "Silent delivery: the pouch is hung on your door handle, with no bell and no phone call.",
            "100g or 150g packs, with the flower variety chosen when you subscribe.",
            "Pause options: up to 2 pauses on a Weekly plan and up to 5 on a Monthly plan.",
            "Extra add-on packs for Weekly and Monthly subscribers.",
          ],
        },
        {
          heading: "Why subscribe instead of buying flowers every day",
          paragraphs: [
            "A subscription removes the daily errand. Flowers leave the farm the evening before and are delivered the next morning without cold storage, so you get a fresh pack even on days you cannot get to a market or shop.",
            "If you are not sure yet, start with the 1 Day Plan. If the quality suits you, a weekly or monthly plan works out cheaper per day than ordering single days.",
          ],
        },
        {
          heading: "Need a different quantity?",
          paragraphs: [
            "PALASSH plans are built around 100g and 150g packs. If you need something different, such as a larger quantity, send us a message on WhatsApp and we will tell you what is possible.",
          ],
        },
      ]}
      flowersHeading="Flowers available for daily delivery"
      flowers={flowers}
      plans={config.plans}
      plansHeading="Daily, weekly and monthly flower plans"
      faqs={FAQS}
      relatedHrefs={["/flowers-in-thane", "/pooja-flowers-thane"]}
      whatsappMessage="Hi PALASSH, I would like to know about daily flower supply in Thane."
    />
  );
}
