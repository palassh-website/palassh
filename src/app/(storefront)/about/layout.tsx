import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Story & Kalwa Thane Hub",
  description:
    "How PALASSH sends fresh puja blooms from farms at 8:00 PM, sorts them at our Kalwa hub (400605) and delivers silently between 6:00 AM – 8:00 AM.",
  alternates: { canonical: "https://palassh.com/about" },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}