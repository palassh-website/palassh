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
    default: "Fresh Flowers in Thane | Home Delivery & 1-Day Orders | PALASSH",
    template: "%s | PALASSH",
  },
  description:
    "Order fresh flowers online in Thane with home delivery. Explore the live flower catalogue, choose a one-day morning pack or a weekly/monthly plan, and check your delivery pincode.",
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
    "vartak nagar pokhran road flower delivery",
    "balkum kolshet road morning puja flowers",
    "पूजा फुले ठाणे होम डिलिव्हरी",
    "झेंडू शेवंती पूजा फुले ठाणे",
  ],
  authors: [{ name: "PALASSH Flowers Thane", url: "https://palassh.com" }],
  creator: "PALASSH Flowers",
  publisher: "PALASSH Flowers",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://palassh.com",
    siteName: "PALASSH Flowers Thane",
    title: "PALASSH — Fresh Flowers & Home Delivery in Thane",
    description:
      "Browse available flower varieties, order a one-day pack or choose a recurring plan, and get fresh flowers delivered to your home in serviceable Thane pincodes.",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "PALASSH Sacred Morning Puja Flowers Thane",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PALASSH | Fresh Flowers with Home Delivery in Thane",
    description:
      "Explore the live flower catalogue and order a one-day morning pack or a weekly/monthly plan with home delivery in serviceable Thane pincodes.",
    images: ["/images/og-image.jpg"],
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
    apple: "/apple-touch-icon.png",
  },
};

const THANE_LOCAL_BUSINESS_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Florist",
  "@id": "https://palassh.com/#florist",
  name: "PALASSH Flowers",
  alternateName: [
    "PALASSH — flowers that pray with you",
    "Palassh Flowers Thane",
    "Palassh Puja Flowers",
  ],
  url: "https://palassh.com",
  logo: "https://palassh.com/images/logo.webp",
  image: "https://palassh.com/images/hero-banner.webp",
  description:
    "Local flower ordering and home-delivery service in Thane, Maharashtra, with a live catalogue of fresh flower varieties and one-day, weekly and monthly morning delivery options in serviceable pincodes.",
  telephone: "+917710942605",
  email: "care@palassh.com",
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
    { "@type": "City", name: "Thane" },
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

// Helps Google show "PALASSH" as the site name and tie the brand to this site.
const WEBSITE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://palassh.com/#website",
  url: "https://palassh.com",
  name: "PALASSH",
  alternateName: ["Palassh Flowers", "Palassh Flowers Thane"],
  inLanguage: "en-IN",
  publisher: { "@id": "https://palassh.com/#florist" },
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(THANE_LOCAL_BUSINESS_SCHEMA),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(WEBSITE_SCHEMA),
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