import type { Metadata } from "next";
import HomePageClient from "./HomePageClient";

// The homepage UI is a client component, which cannot export metadata.
// This server wrapper owns the homepage canonical (title/description come from the root layout).
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <HomePageClient />;
}
