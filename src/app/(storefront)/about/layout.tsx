import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Midnight-to-Mandir Story & Kalwa Thane Hub",
  description:
    "Learn how PALASSH harvests fresh puja blooms at 1:30 AM from Nashik & Dahanu farms, sorts 100g & 150g pouches at our Kalwa Thane hub (400605), and delivers silently between 6:00 AM – 8:00 AM.",
  alternates: { canonical: "https://palassh.com/about" },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}