import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fresh Marigold, Shevanti & Pooja Flowers in Thane",
  description:
    "Farm-fresh Marigold, Pooja Flowers and Shevanti in 100g & 150g packs across Thane (400601–400608), delivered between 6:00 AM – 8:00 AM.",
  alternates: { canonical: "https://palassh.com/products" },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}