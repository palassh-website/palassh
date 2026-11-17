import type { Metadata } from "next";
import { getCachedServerStoreConfig } from "@/features/checkout/checkout.service";
import { SeoLandingTemplate } from "../_seo/SeoLandingTemplate";

// Catalogue is read through the cached server config; ISR keeps the page
// static for crawlers and refreshes it hourly.
export const revalidate = 3600;

const PATH = "/pooja-flowers-thane";

export const metadata: Metadata = {
  title: "Pooja Flowers in Thane | Fresh Marigold & Shevanti Delivery",
  description:
    "Order fresh pooja flowers in Thane: marigold (झेंडू), shevanti (शेवंती) and pooja flower packs, delivered to your door between 6 AM and 8 AM across pincodes 400601–400608.",
  alternates: { canonical: `https://palassh.com${PATH}` },
};

const FAQS = [
  {
    q: "Where can I buy fresh pooja flowers in Thane without going to the market?",
    a: "PALASSH delivers fresh marigold, shevanti and pooja flower packs to homes in Thane pincodes 400601 to 400608. You pick a plan online, and the pouch is left on your door handle in the morning, ready for your puja.",
  },
  {
    q: "Which pooja flowers do you deliver?",
    a: "The varieties currently listed on this page, including marigold (झेंडू), shevanti (शेवंती) and a mixed pooja flower assortment, in 100g and 150g packs. The list follows the live catalogue, so it grows when new flowers are added.",
  },
  {
    q: "How fresh are the flowers when they arrive?",
    a: "Flowers are sent from the farm at 8:00 PM the previous evening and delivered between 6:00 AM and 8:00 AM. PALASSH does not use cold storage.",
  },
  {
    q: "Can I order pooja flowers for just one day, for example before a festival?",
    a: "Yes. The 1 Day Plan is a single morning delivery with no subscription. If you order before 11:45 PM, delivery is scheduled for the next available morning, according to the checkout calendar.",
  },
  {
    q: "Will the delivery person ring the bell?",
    a: "No. Deliveries follow a silent drop: riders do not ring the bell or call in the morning. The pouch is hung on your main door handle.",
  },
];

export default async function PoojaFlowersThanePage() {
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
      breadcrumbName="Pooja Flowers in Thane"
      eyebrow="PALASSH • Morning Puja Flower Delivery"
      h1="Fresh Pooja Flowers in Thane, Delivered Before Your Morning Puja"
      intro="Marigold, shevanti and pooja flower packs, sent from the farm the evening before and left at your door between 6:00 AM and 8:00 AM. Order for one day or set up a weekly or monthly plan."
      sections={[
        {
          heading: "Pooja flowers delivered to your door in Thane",
          paragraphs: [
            "A daily puja needs flowers early, and fresh ones. PALASSH brings them to you instead: choose a pack size, check that your pincode is on a delivery route, and the flowers arrive in a breathable pouch before your morning aarti.",
            "You can start with a single day to see the quality, then move to a weekly or monthly plan if you want flowers every morning without ordering each time.",
          ],
        },
        {
          heading: "How ordering pooja flowers works",
          bullets: [
            "Enter your 6-digit pincode to confirm we deliver to your society.",
            "Pick a 1 Day, Weekly or Monthly plan, then a flower and a 100g or 150g pack.",
            "Pay online at checkout. Plans are prepaid.",
            "Receive the pouch on your door handle between 6:00 AM and 8:00 AM, with no bell and no phone call.",
          ],
        },
        {
          heading: "Where we deliver pooja flowers in Thane",
          paragraphs: [
            "Delivery covers Thane pincodes 400601 to 400608, including Thane West, Ghodbunder Road, Kalwa, Pokhran Road, Naupada and Balkum. Our hub is in Kalwa (400605). Use the pincode checker on the home page to confirm your exact route before you order.",
          ],
        },
      ]}
      flowersHeading="Pooja flowers you can order right now"
      flowers={flowers}
      plans={config.plans}
      plansHeading="Plans for pooja flower delivery"
      faqs={FAQS}
      relatedHrefs={["/flowers-in-thane", "/daily-flower-supplier-thane"]}
      whatsappMessage="Hi PALASSH, I would like to know about pooja flower delivery in Thane."
    />
  );
}
