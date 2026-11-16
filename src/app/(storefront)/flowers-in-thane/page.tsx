import type { Metadata } from "next";
import Link from "next/link";
import { getCachedServerStoreConfig } from "@/features/checkout/checkout.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fresh Flowers in Thane | Home Delivery & 1-Day Ordering",
  description:
    "Looking for fresh flowers or flower delivery in Thane? Browse PALASSH's live flower catalogue, order a one-day morning pack or choose a weekly/monthly plan with home delivery.",
  alternates: { canonical: "https://palassh.com/flowers-in-thane" },
};

type FlowerListEntry = {
  id: string;
  name: string;
  marathiName?: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  weights: number[];
  availableInOneDayPlan: boolean;
  availableAsMemberAddOn: boolean;
};

function flowerKey(name: string): string {
  return name.trim().toLocaleLowerCase("en-IN");
}

export default async function FlowersInThanePage() {
  // Read the same database-backed catalogue used by the storefront.
  // New varieties added through the existing admin catalogue appear here
  // without hard-coding another flower name into this page.
  const config = await getCachedServerStoreConfig();
  const flowerMap = new Map<string, FlowerListEntry>();

  for (const variant of config.planVariants) {
    const name = String(variant.name || "").trim();
    if (!name) continue;

    const weights = Object.keys(variant.pricing || {})
      .map(Number)
      .filter((weight) => Number.isFinite(weight) && weight > 0);

    flowerMap.set(flowerKey(name), {
      id: variant.id,
      name,
      marathiName: variant.marathiName,
      subtitle: variant.subtitle,
      imageUrl: variant.imageUrl,
      weights,
      availableInOneDayPlan: true,
      availableAsMemberAddOn: false,
    });
  }

  for (const flower of config.flowers) {
    const name = String(flower.name || "").trim();
    if (!name) continue;

    const key = flowerKey(name);
    const existing = flowerMap.get(key);
    const addOnWeights = (flower.availableWeights || [])
      .map((weight) => Number(weight.grams))
      .filter((weight) => Number.isFinite(weight) && weight > 0);
    const weights = Array.from(
      new Set([...(existing?.weights || []), ...addOnWeights])
    ).sort((a, b) => a - b);

    flowerMap.set(key, {
      id: existing?.id || flower.id,
      name,
      marathiName: flower.marathiName || existing?.marathiName,
      subtitle: flower.subtitle || existing?.subtitle,
      description:
        flower.botanicalNote || existing?.description || flower.subtitle,
      imageUrl: flower.imageUrl || existing?.imageUrl,
      weights,
      availableInOneDayPlan: Boolean(existing?.availableInOneDayPlan),
      availableAsMemberAddOn: true,
    });
  }

  const flowers = Array.from(flowerMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const oneDayPlan = config.plans.find(
    (plan) => plan.deliveriesCount === 1 || plan.billingCycle === "day"
  );

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "PALASSH flower varieties available in Thane",
    itemListElement: flowers.map((flower, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Thing",
        name: flower.name,
        description: flower.subtitle || flower.description || undefined,
      },
    })),
  };

  const itemListJson = JSON.stringify(itemListSchema).replace(/</g, "\\u003c");

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-stone-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: itemListJson }}
      />

      <section className="border-b border-[#E6DEC8] bg-[#1C1917] px-4 py-14 text-white sm:py-20">
        <div className="mx-auto max-w-6xl space-y-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F5D0A9]">
            PALASSH • Fresh Flower Home Delivery
          </p>
          <h1 className="max-w-4xl font-serif text-3xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            Fresh Flowers in Thane, Delivered to Your Home
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-stone-300 sm:text-lg">
            Looking for a flower shop, a local flower supplier near you, or fresh
            flower delivery in Thane? Browse PALASSH&apos;s current flower varieties,
            choose a supported one-day pack or a recurring plan, and get your
            order delivered to your doorstep in our serviceable Thane areas.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              href="/#plans"
              className="rounded-full bg-[#D95326] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#BA421B]"
            >
              Order a 1-Day Flower Pack
            </Link>
            <Link
              href="/#pincode-check"
              className="rounded-full border border-stone-600 bg-white/5 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Check Home Delivery Pincode
            </Link>
          </div>
          <p className="text-xs text-stone-400">
            Morning doorstep delivery: 6:00 AM–8:00 AM • Current service area:
            Thane pincodes 400601–400608
          </p>
        </div>
      </section>

      <section
        id="flower-catalogue"
        className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8"
      >
        <div className="mb-8 max-w-3xl space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D95326]">
            Current Flower Selection
          </p>
          <h2 className="font-serif text-2xl font-bold sm:text-4xl">
            Browse Available Flower Varieties
          </h2>
          <p className="text-sm leading-relaxed text-stone-600">
            This catalogue is built from PALASSH&apos;s active flower and plan
            catalogues. It can include new varieties as they are added, rather
            than being limited to a fixed list of three flowers. Pack sizes and
            ordering options are shown from the live catalogue.
          </p>
        </div>

        {flowers.length === 0 ? (
          <p className="rounded-2xl border border-[#E6DEC8] bg-white p-6 text-sm text-stone-600">
            Flower options are being updated. Please check the one-day plan for
            the latest selection.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {flowers.map((flower) => (
              <article
                key={flower.id}
                className="overflow-hidden rounded-3xl border border-[#E6DEC8] bg-white shadow-sm"
              >
                {flower.imageUrl ? (
                  <img
                    src={flower.imageUrl}
                    alt={`${flower.name} flowers in the PALASSH Thane catalogue`}
                    width={800}
                    height={600}
                    loading="lazy"
                    decoding="async"
                    className="aspect-[4/3] w-full bg-[#F3ECE1] object-cover"
                  />
                ) : null}
                <div className="space-y-3 p-5">
                  <div>
                    <h3 className="font-serif text-xl font-bold">{flower.name}</h3>
                    {flower.marathiName ? (
                      <p className="mt-1 text-sm text-stone-500">
                        {flower.marathiName}
                      </p>
                    ) : null}
                  </div>
                  {flower.subtitle || flower.description ? (
                    <p className="text-sm leading-relaxed text-stone-600">
                      {flower.subtitle || flower.description}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    {flower.availableInOneDayPlan ? (
                      <span className="rounded-full bg-[#FFF3EC] px-3 py-1 text-xs font-semibold text-[#A63D1C]">
                        1-Day Plan
                      </span>
                    ) : null}
                    {flower.availableAsMemberAddOn ? (
                      <span className="rounded-full bg-[#F3ECE1] px-3 py-1 text-xs font-semibold text-stone-700">
                        Weekly/Monthly Member Add-On
                      </span>
                    ) : null}
                  </div>
                  {flower.weights.length > 0 ? (
                    <p className="text-xs font-medium text-stone-500">
                      Listed pack sizes: {flower.weights.map((weight) => `${weight}g`).join(" / ")}
                    </p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
        <p className="mt-5 text-xs text-stone-500">
          Available varieties, pack sizes and member add-on eligibility may
          differ. Confirm the current options in the plan selector before
          checkout.
        </p>
      </section>

      <section className="border-y border-[#E6DEC8] bg-white px-4 py-14 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2 lg:items-center">
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D95326]">
              No Long Commitment Required
            </p>
            <h2 className="font-serif text-2xl font-bold sm:text-4xl">
              Order Flowers for Just One Day
            </h2>
            <p className="text-sm leading-relaxed text-stone-600">
              You do not need to choose a weekly or monthly subscription to
              place a one-day order. Select PALASSH&apos;s 1-Day Plan, choose a flower
              variety and available pack size, and see the final price before
              payment. Weekly and monthly plans are available for customers who
              prefer regular morning deliveries.
            </p>
            {oneDayPlan ? (
              <p className="text-sm font-semibold text-stone-800">
                1-Day Plan starting price: ₹
                {Number(oneDayPlan.price).toLocaleString("en-IN")}.
                <span className="ml-1 font-normal text-stone-500">
                  Final price depends on the selected flower and pack size.
                </span>
              </p>
            ) : null}
            <Link
              href="/#plans"
              className="inline-flex rounded-full bg-[#D95326] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#BA421B]"
            >
              View 1-Day, Weekly & Monthly Plans
            </Link>
          </div>
          <div className="rounded-3xl border border-[#E6DEC8] bg-[#FAF6F0] p-6 sm:p-8">
            <h2 className="font-serif text-xl font-bold sm:text-2xl">
              Flower Home Delivery Across Thane
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-stone-600">
              PALASSH delivers orders to customers&apos; homes in its current
              serviceable Thane areas. Coverage is listed for pincodes
              400601–400608. Enter your pincode in the delivery checker before
              ordering so you can confirm that your society is on an active
              route.
            </p>
            <p className="mt-3 text-sm text-stone-600">
              The regular morning doorstep delivery window is 6:00 AM–8:00 AM.
              Orders placed before the 11:45 PM IST cut-off are scheduled for
              the next available morning according to the checkout calendar.
            </p>
            <Link
              href="/#pincode-check"
              className="mt-5 inline-flex font-semibold text-[#C84617] hover:underline"
            >
              Verify your Thane pincode →
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl space-y-6 px-4 py-14 sm:py-20">
        <h2 className="font-serif text-2xl font-bold sm:text-3xl">
          Frequently Asked Questions About Flower Delivery in Thane
        </h2>
        <div className="space-y-5">
          <div>
            <h3 className="font-semibold">Can I order flowers for only one day?</h3>
            <p className="mt-1 text-sm leading-relaxed text-stone-600">
              Yes. Choose the 1-Day Plan for a single morning delivery. A weekly
              or monthly plan is not required for a one-day order.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Does PALASSH provide flower home delivery in Thane?</h3>
            <p className="mt-1 text-sm leading-relaxed text-stone-600">
              Yes. Home delivery is available on active routes in Thane
              pincodes 400601–400608. Use the pincode checker to confirm your
              exact delivery location.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Which flowers can I order?</h3>
            <p className="mt-1 text-sm leading-relaxed text-stone-600">
              The varieties shown above are read from the active PALASSH
              catalogue. The selection can expand as new flowers are added.
              Options marked 1-Day Plan are available through the one-day plan;
              member add-ons are reserved for eligible Weekly and Monthly
              subscribers.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Can I buy flowers online without visiting a shop?</h3>
            <p className="mt-1 text-sm leading-relaxed text-stone-600">
              Yes. Browse the flower options, choose an eligible plan and pack
              size, verify your pincode, and complete the prepaid checkout
              online.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
