import type { Metadata, Viewport } from "next";
import { Fraunces, Inter_Tight } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FeatureBoundary } from "@/components/shared/FeatureBoundary";
import { WhatsAppFloatingButton } from "@/components/shared/WhatsAppFloatingButton";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  axes: ["SOFT", "WONK", "opsz"],
  display: "swap",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#FAF6F0",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://palassh.com"),
  title: {
    default:
      "PALASSH | Fresh Puja Flower Subscription in Thane (6:00 AM – 8:00 AM Delivery)",
    template: "%s | PALASSH Sacred Puja Flowers Thane",
  },
  description:
    "Flowers that pray with you. Subscribe to 100g & 150g daily farm-fresh Puja Flowers in Thane (400601–400608). Mixed Marigold (झेंडू), Pooja Flowers & Shevanti (शेवंती) delivered silently between 6:00 AM – 8:00 AM across Thane West, Ghodbunder Road, Naupada, Pokhran, Kalwa & Balkum. Plans starting at ₹45.",
  keywords: [
    "puja flower delivery thane",
    "daily pooja flowers subscription thane west",
    "fresh flowers for puja ghodbunder road thane",
    "morning 6 am flower delivery thane",
    "palassh flowers thane",
    "marigold zendu delivery thane 400601 400607",
    "shevanti pooja flowers hiranandani estate thane",
    "monthly puja flower subscription thane",
    "weekly pooja flower pack thane",
    "fresh mandir flowers kalwa kharegaon naupada",
    "wartak nagar pokhran road flower delivery",
    "balkum kolshet road morning puja flowers",
    "पूजा फुले ठाणे होम डिलिव्हरी",
    "झेंडू शेवंती पूजा फुले ठाणे",
  ],
  authors: [{ name: "PALASSH Flowers Thane", url: "https://palassh.com" }],
  creator: "PALASSH Flowers",
  publisher: "PALASSH Flowers",
  alternates: {
    canonical: "https://palassh.com",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://palassh.com",
    siteName: "PALASSH Flowers Thane",
    title:
      "PALASSH — Farm-Fresh Morning Puja Flower Subscription in Thane (400601–400608)",
    description:
      "100g & 150g breathable pouches of fresh Marigold (झेंडू), Pooja Flowers & Shevanti (शेवंती) dispatched from farms at 8:00 PM and hung silently on your doorstep between 6:00 AM – 8:00 AM across Thane.",
    images: [
      {
        url: "/images/hero-banner.webp",
        width: 1200,
        height: 630,
        alt: "PALASSH Sacred Morning Puja Flowers Thane",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PALASSH | Morning 6–8 AM Puja Flower Subscription in Thane",
    description:
      "100% Zero Cold Storage farm-fresh puja flowers delivered daily across Thane pincodes 400601 to 400608. 1 Day, Weekly & Monthly plans from ₹45.",
    images: ["/images/hero-banner.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/images/logo.webp",
    apple: "/images/logo.webp",
  },
};

const THANE_LOCAL_BUSINESS_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Florist",
  "@id": "https://palassh.com/#florist",
  name: "PALASSH Flowers",
  alternateName: "PALASSH — flowers that pray with you",
  url: "https://palassh.com",
  logo: "https://palassh.com/images/logo.webp",
  image: "https://palassh.com/images/hero-banner.webp",
  description:
    "Farm-to-Mandir morning puja flower subscription service in Thane delivering 100g and 150g pouches of Mixed Marigold, Orange Marigold, Yellow Marigold, Pooja Flowers, and White & Yellow Shevanti between 6:00 AM and 8:00 AM.",
  telephone: "+919167034671",
  email: "care@palassh.com",
  priceRange: "₹45 - ₹2529",
  address: {
    "@type": "PostalAddress",
    streetAddress:
      "6X4X+HJ5 Glenmark Residency, 60 Feet Rd, Kharegaon, Kalwa",
    addressLocality: "Thane",
    addressRegion: "Maharashtra",
    postalCode: "400605",
    addressCountry: "IN",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 19.2008,
    longitude: 73.0035,
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: "06:00",
      closes: "20:00",
    },
  ],
  areaServed: [
    { "@type": "PostalCodeSpecification", postalCode: "400601", addressCountry: "IN" },
    { "@type": "PostalCodeSpecification", postalCode: "400602", addressCountry: "IN" },
    { "@type": "PostalCodeSpecification", postalCode: "400603", addressCountry: "IN" },
    { "@type": "PostalCodeSpecification", postalCode: "400604", addressCountry: "IN" },
    { "@type": "PostalCodeSpecification", postalCode: "400605", addressCountry: "IN" },
    { "@type": "PostalCodeSpecification", postalCode: "400606", addressCountry: "IN" },
    { "@type": "PostalCodeSpecification", postalCode: "400607", addressCountry: "IN" },
    { "@type": "PostalCodeSpecification", postalCode: "400608", addressCountry: "IN" },
  ],
  sameAs: [
    "https://www.instagram.com/palassh_flowers",
    "https://www.youtube.com/@Palassh-Flowers",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${interTight.variable} font-sans scroll-smooth`}
    >
      <head>
        <link
          rel="preload"
          as="image"
          href="/images/hero-banner.webp"
          type="image/webp"
          // @ts-expect-error fetchpriority is standard HTML
          fetchpriority="high"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(THANE_LOCAL_BUSINESS_SCHEMA),
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[#FAF6F0] text-stone-900 antialiased selection:bg-[#FFF3EC] selection:text-[#D95326] font-sans">
        <FeatureBoundary featureName="LAYOUT">
          <Navbar />
        </FeatureBoundary>
        <main className="flex-1">{children}</main>
        <WhatsAppFloatingButton />
        <FeatureBoundary featureName="LAYOUT">
          <Footer />
        </FeatureBoundary>
      </body>
    </html>
  );
}