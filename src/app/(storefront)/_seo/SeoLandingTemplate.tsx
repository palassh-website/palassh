import Link from "next/link";
import type { SubscriptionPlan } from "@/features/catalog/types";
import { getWhatsAppUrl } from "@/lib/whatsapp";
import {
  SEO_LANDING_LINKS,
  buildBreadcrumbSchema,
  buildFaqSchema,
  toJsonLd,
} from "./seo-helpers";

export type LandingSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type LandingFlower = { name: string; marathiName?: string };

type Props = {
  path: string;
  breadcrumbName: string;
  eyebrow: string;
  h1: string;
  intro: string;
  sections: LandingSection[];
  flowersHeading?: string;
  flowers?: LandingFlower[];
  plans: SubscriptionPlan[];
  plansHeading: string;
  faqs: { q: string; a: string }[];
  /** Hrefs of the other landing pages to link to from this one. */
  relatedHrefs: string[];
  whatsappMessage: string;
};

function planLabel(plan: SubscriptionPlan): string {
  if (plan.billingCycle === "day") return "1 morning delivery";
  return `${plan.deliveriesCount} morning deliveries`;
}

export function SeoLandingTemplate({
  path,
  breadcrumbName,
  eyebrow,
  h1,
  intro,
  sections,
  flowersHeading,
  flowers,
  plans,
  plansHeading,
  faqs,
  relatedHrefs,
  whatsappMessage,
}: Props) {
  const related = SEO_LANDING_LINKS.filter((link) =>
    relatedHrefs.includes(link.href)
  );

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-stone-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: toJsonLd(buildBreadcrumbSchema([{ name: breadcrumbName, path }])),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(buildFaqSchema(faqs)) }}
      />

      <section className="border-b border-[#E6DEC8] bg-[#1C1917] px-4 py-14 text-white sm:py-20">
        <div className="mx-auto max-w-6xl space-y-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F5D0A9]">
            {eyebrow}
          </p>
          <h1 className="max-w-4xl font-serif text-3xl font-bold leading-tight sm:text-5xl">
            {h1}
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-stone-300 sm:text-lg">
            {intro}
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              href="/#plans"
              className="rounded-full bg-[#D95326] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#BA421B]"
            >
              View Plans &amp; Order
            </Link>
            <Link
              href="/#pincode-check"
              className="rounded-full border border-stone-600 bg-white/5 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Check Your Thane Pincode
            </Link>
          </div>
          <p className="text-xs text-stone-400">
            Morning doorstep delivery: 6:00 AM–8:00 AM • Service area: Thane
            pincodes 400601–400608
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl space-y-14 px-4 py-14 sm:py-20">
        {sections.map((section) => (
          <section key={section.heading} className="space-y-3">
            <h2 className="font-serif text-2xl font-bold sm:text-3xl">
              {section.heading}
            </h2>
            {section.paragraphs?.map((text) => (
              <p
                key={text.slice(0, 40)}
                className="text-sm leading-relaxed text-stone-600 sm:text-base"
              >
                {text}
              </p>
            ))}
            {section.bullets ? (
              <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-stone-600 sm:text-base">
                {section.bullets.map((item) => (
                  <li key={item.slice(0, 40)}>{item}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}

        {flowers && flowers.length > 0 ? (
          <section className="space-y-3">
            <h2 className="font-serif text-2xl font-bold sm:text-3xl">
              {flowersHeading}
            </h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {flowers.map((flower) => (
                <li
                  key={flower.name}
                  className="rounded-2xl border border-[#E6DEC8] bg-white px-4 py-3 text-sm"
                >
                  <span className="font-semibold">{flower.name}</span>
                  {flower.marathiName ? (
                    <span className="ml-2 text-stone-500">{flower.marathiName}</span>
                  ) : null}
                </li>
              ))}
            </ul>
            <p className="text-xs text-stone-500">
              Varieties are read from the live PALASSH catalogue, so this list
              follows what is currently available.
            </p>
          </section>
        ) : null}

        {plans.length > 0 ? (
          <section className="space-y-3">
            <h2 className="font-serif text-2xl font-bold sm:text-3xl">
              {plansHeading}
            </h2>
            <div className="overflow-x-auto rounded-2xl border border-[#E6DEC8] bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F3ECE1] text-xs uppercase tracking-wider text-stone-600">
                  <tr>
                    <th className="px-4 py-3">Plan</th>
                    <th className="px-4 py-3">Includes</th>
                    <th className="px-4 py-3">Price from</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan) => (
                    <tr key={plan.id} className="border-t border-[#E6DEC8]">
                      <td className="px-4 py-3 font-semibold">{plan.title}</td>
                      <td className="px-4 py-3 text-stone-600">{planLabel(plan)}</td>
                      <td className="px-4 py-3 font-semibold">
                        ₹{Number(plan.price).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-stone-500">
              Prices come from the live plan catalogue. The final price depends
              on the flower and pack size you pick, and is shown before payment.
            </p>
          </section>
        ) : null}

        <section className="space-y-5">
          <h2 className="font-serif text-2xl font-bold sm:text-3xl">
            Frequently Asked Questions
          </h2>
          {faqs.map((item) => (
            <div key={item.q}>
              <h3 className="font-semibold">{item.q}</h3>
              <p className="mt-1 text-sm leading-relaxed text-stone-600 sm:text-base">
                {item.a}
              </p>
            </div>
          ))}
        </section>

        <section className="space-y-4 rounded-3xl border border-[#E6DEC8] bg-white p-6 sm:p-8">
          <h2 className="font-serif text-xl font-bold sm:text-2xl">
            Explore more from PALASSH
          </h2>
          <ul className="space-y-2 text-sm">
            {related.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="font-semibold text-[#C84617] hover:underline"
                >
                  {link.label}
                </Link>
                <span className="text-stone-500"> — {link.hint}</span>
              </li>
            ))}
            <li>
              <Link
                href="/how-it-works"
                className="font-semibold text-[#C84617] hover:underline"
              >
                How PALASSH works
              </Link>
              <span className="text-stone-500"> — from pincode check to doorstep</span>
            </li>
          </ul>
          <p className="text-sm text-stone-600">
            Questions before you order?{" "}
            <a
              href={getWhatsAppUrl(whatsappMessage)}
              className="font-semibold text-[#C84617] hover:underline"
              rel="noopener"
            >
              Message us on WhatsApp
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
