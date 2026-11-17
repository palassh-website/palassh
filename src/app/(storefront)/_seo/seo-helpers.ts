// Private (underscore-prefixed) folder: Next.js does not turn it into a route.
// Shared SEO helpers for the storefront landing pages.

export const SITE_URL = "https://palassh.com";

/** The indexable landing pages, used for internal cross-linking. */
export const SEO_LANDING_LINKS = [
  {
    href: "/flowers-in-thane",
    label: "Fresh flowers in Thane",
    hint: "Browse the live flower catalogue and order a 1-day pack",
  },
  {
    href: "/pooja-flowers-thane",
    label: "Pooja flowers in Thane",
    hint: "Marigold, Shevanti and pooja flower assortments for morning puja",
  },
  {
    href: "/daily-flower-supplier-thane",
    label: "Daily flower supplier in Thane",
    hint: "Weekly and monthly morning flower delivery plans",
  },
] as const;

export function buildBreadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      ...trail.map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 2,
        name: crumb.name,
        item: `${SITE_URL}${crumb.path}`,
      })),
    ],
  };
}

export function buildFaqSchema(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

/** JSON-LD must not be able to close its own <script> tag. */
export function toJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
