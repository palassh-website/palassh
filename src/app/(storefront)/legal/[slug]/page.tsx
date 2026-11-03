import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Clock, MapPin } from "lucide-react";

const SHOP_ADDRESS =
  "6X4X+HJ5 Glenmark residency, 60 Feet Rd, Kharegaon, Kalwa, Thane, Maharashtra 400605";

const LEGAL_CONTENT: Record<
  string,
  {
    title: string;
    updated: string;
    sections: { heading: string; body: string }[];
  }
> = {
  "privacy-policy": {
    title: "Privacy Policy",
    updated: "October 2026",
    sections: [
      {
        heading: "1. Information We Collect",
        body: "PALASSH collects your name,phone number,Email, building/society name, flat number, and silent doorstep delivery instructions solely to fulfill your 6:00 AM – 8:00 AM morning puja flower deliveries across Thane and Mumbai.",
      },
      {
        heading: "2. Payment Security",
        body: "All online payments for one-time flower purchases and recurring subscriptions are processed securely through Razorpay. PALASSH never stores your card numbers or UPI PINs on our servers.",
      },
      {
        heading: "3. Zero Spam Guarantee",
        body: "We never sell or rent your personal contact details to third-party marketers. WhatsApp notifications are strictly used for delivery updates, pause confirmations, and support.",
      },
      {
        heading: "4.About Refund",
        body: "When customer subscribes to any plan , after subscibing then customer cannot ask for direct refund of cash amount ].",
      },
      {
        heading: "5. About Orders and deliveries ",
        body: "When user is on weekly / monthly plan then he /she can pause delivery dates(on weekly plan: upto 2 & on monthly plan : upto 5),after this limit crosses then the responsibility of loss will on customers side ,palassh will not be responsible for this loss",
      },
      {
        heading: "6. About Flower Quanlity",
        body: "Only If the flower is rotten then user can raise complaint and the palassh will send another package to the customer but only if customer raises complaint under 2 hours after the flower are delivered.",
      },
    ],
  },
  "terms-and-conditions": {
    title: "Terms & Conditions",
    updated: "October 2026",
    sections: [
      {
        heading: "1. Silent Morning Drop Protocol (6:00 AM – 8:00 AM)",
        body: "To respect your family's sleep, PALASSH riders never ring the doorbell or make phone calls during morning delivery hours. Pouches are hung on your main door handle or placed in your designated basket.",
      },
      {
        heading: "2. 8:00 PM Evening Cut-Off for Day-Wise Modifications",
        body: "Subscribers may change their pause any upcoming delivery day until 8:00 PM the previous evening via the My-Orders portal.",
      },
      {
        heading: "3. Society Access Responsibility",
        body: "Customers must ensure that their housing society security permits morning entry for PALASSH delivery partners between 6:00 AM and 8:00 AM.",
      },
    ],
  },
  "refund-policy": {
    title: "Refund & Cancellation Policy",
    updated: "October 2026",
    sections: [
      {
        heading: "1. 1-Click Pause Carry-Forward",
        body: "Whenever you pause a delivery day before 8:00 PM, zero money is lost. Your paused morning is automatically carried forward to extend your subscription.",
      },
      {
        heading: "2. Freshness Replacement / Credit",
        body: "Because fresh flowers are perishable botanical items plucked at 1:30 AM, we do not accept physical returns. However, if your morning pouch ever arrives damaged, share a photo on WhatsApp before 10:00 AM for a 100% free replacement delivery the next morning.",
      },
      {
        heading: "3. Subscription Cancellation Refunds",
        body: "If you cancel an active Weekly or Monthly subscription, the pro-rata balance for all remaining unshipped mornings is refunded to your original payment method within 5–7 business days.",
      },
    ],
  },
  "shipping-policy": {
    title: "Shipping & Morning Delivery Policy",
    updated: "October 2026",
    sections: [
      {
        heading: "1. Serviceable Locations",
        body: "We currently deliver across Thane (Kalwa, Kharegaon, Majiwada, Ghodbunder Road, Hiranandani Estate, Pokhran) and select Mumbai suburbs.",
      },
      {
        heading: "2. Delivery Timings",
        body: "All orders (both One-Time Flower Purchases and Subscription Plans) are delivered exclusively in the morning between 6:00 AM and 8:00 AM.",
      },
      {
        heading: "3. Dispatch Hub Location",
        body: `All flower pouches are sorted, misted, and dispatched fresh from our registered hub at: ${SHOP_ADDRESS}.`,
      },
    ],
  },
};

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = LEGAL_CONTENT[slug] || LEGAL_CONTENT["terms-and-conditions"];

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-600 hover:text-[#E8502B]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to PALASSH Storefront</span>
        </Link>

        <div className="rounded-[2.5rem] border border-stone-200 bg-white p-8 sm:p-12 shadow-xl space-y-8">
          <div className="border-b border-stone-100 pb-6 space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950 px-3.5 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-300">
              <ShieldCheck className="h-3.5 w-3.5 text-[#F05A36]" />
              <span>PALASSH Sacred Compliance</span>
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold text-stone-900">
              {doc.title}
            </h1>
            <p className="text-xs text-stone-400">
              Last Updated: {doc.updated}
            </p>
          </div>

          <div className="space-y-6">
            {doc.sections.map((s) => (
              <div key={s.heading} className="space-y-2">
                <h2 className="font-serif text-xl font-bold text-stone-900">
                  {s.heading}
                </h2>
                <p className="text-sm leading-relaxed text-stone-600">
                  {s.body}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-stone-200 bg-[#FAF7F2] p-5 space-y-2 text-xs text-stone-600">
            <div className="flex items-center gap-2 font-bold text-stone-900">
              <MapPin className="h-4 w-4 text-[#E8502B]" />
              <span>Registered Operations Hub:</span>
            </div>
            <p>{SHOP_ADDRESS}</p>
            <div className="flex items-center gap-2 pt-1 text-emerald-900 font-semibold">
              <Clock className="h-4 w-4 text-emerald-700" />
              <span>
                Morning Delivery Slot: 6:00 AM – 8:00 AM • Evening Modification
                Cut-off: 8:00 PM
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}