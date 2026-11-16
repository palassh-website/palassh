import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Member Flower Add-On Store",
  description:
    "The PALASSH loose flower add-on store is reserved for active Weekly and Monthly subscribers.",
  robots: { index: false, follow: true },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}