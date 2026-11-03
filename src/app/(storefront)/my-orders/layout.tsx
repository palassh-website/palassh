import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Orders, Delivery Calendar & Daily Add-Ons",
  robots: { index: false, follow: false },
};

export default function MyOrdersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}