import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fresh Marigold (झेंडू), Shevanti & Pooja Flowers (100g / 150g) in Thane",
  description:
    "Order 100g and 150g farm-fresh Mixed Marigold, Orange & Yellow Marigold, Pooja Flowers, and White & Yellow Shevanti in Thane (400601–400608). Delivered between 6:00 AM – 8:00 AM.",
  alternates: { canonical: "https://palassh.com/products" },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}