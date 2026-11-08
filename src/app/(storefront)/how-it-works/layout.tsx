import type { Metadata } from "next";

// how-it-works/page.tsx is a client component, so its metadata lives here.
// Without this file the page reused the homepage title and had no canonical.
export const metadata: Metadata = {
  title: "How Our Puja Flower Subscription Works in Thane",
  description:
    "Check your Thane pincode, choose a 1 Day, Weekly or Monthly plan and get fresh puja flowers at your door between 6:00 AM – 8:00 AM.",
  alternates: { canonical: "https://palassh.com/how-it-works" },
};

export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
