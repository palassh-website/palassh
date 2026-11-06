import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Clock, MapPin } from "lucide-react";

const SHOP_ADDRESS =
  "6X4X+HJ5 Glenmark Residency, 60 Feet Rd, Kharegaon, Kalwa, Thane, Maharashtra 400605";

const LEGAL_CONTENT: Record<
  string,
  {
    title: string;
    description: string;
    updated: string;
    sections: { heading: string; body: string }[];
  }
> = {
  "privacy-policy": {
    title: "Privacy Policy",
    description:
      "Privacy Policy, data security, and payment protection standards for PALASSH Flowers Thane.",
    updated: "November 2026",
    sections: [
      {
        heading: "1. Information We Collect",
        body: "PALASSH collects your name, phone number, email address, building/society name, flat number, and silent doorstep delivery instructions solely to fulfill your 6:00 AM – 8:00 AM morning puja flower deliveries across Thane (400601–400608).",
      },
      {
        heading: "2. Payment Security",
        body: "All online payments for subscriptions and subscriber Add-On flower purchases are processed securely through Razorpay. PALASSH never stores your card numbers or UPI PINs on our servers.",
      },
      {
        heading: "3. Zero Spam Guarantee",
        body: "We never sell or rent your personal contact details to third-party marketers. Email and WhatsApp notifications are strictly used for OTP verification, order confirmations, and delivery support.",
      },
      {
        heading: "4. About Refunds",
        body: "When a customer subscribes to any prepaid plan, direct cash refunds are not applicable once the subscription schedule is activated.",
      },
      {
        heading: "5. Pause Quota & Delivery Responsibility",
        body: "Weekly plan subscribers can pause up to 2 delivery dates and Monthly plan subscribers can pause up to 5 delivery dates before 8:00 PM. Skipping beyond the allowed pause quota cancels that day's delivery without carry-forward.",
      },
      {
        heading: "6. Flower Quality Replacement",
        body: "If a flower pouch ever arrives damaged, the customer can raise a complaint on WhatsApp (+91 91670 34671) within 2 hours of morning delivery for a free replacement ,replacement may take time .",
      },
    ],
  },
  "terms-and-conditions": {
    title: "Terms & Conditions",
    description:
      "Terms & Conditions governing morning 6–8 AM silent delivery, 1-day farm buffer, and subscription pause rules at PALASSH Flowers Thane.",
    updated: "November 2026",
    sections: [
      {
        heading: "1. Silent Morning Drop Protocol (6:00 AM – 8:00 AM)",
        body: "To respect your family's sleep and peace , PALASSH riders never ring the doorbell or make phone calls during morning delivery hours. Pouches are hung on your main door handle or placed in your designated basket.",
      },
      {
        heading: "2. 1-Day Farm Harvest Buffer & 8:00 PM Cut-Off",
        body: "All new subscriptions and subscriber 100g/150g Add-On orders include a 1-day farm harvest buffer. Subscribers may pause any upcoming delivery day until 8:00 PM the previous evening via the My-Orders portal.",
      },
      {
        heading: "3. Society Access Responsibility",
        body: "Customers must ensure that their housing society security permits morning entry for PALASSH delivery partners between 6:00 AM and 8:00 AM.",
      },
    ],
  },
  "refund-policy": {
    title: "Refund & Cancellation Policy",
    description:
      "Pause carry-forward, freshness replacement, and cancellation policy for PALASSH Flowers Thane.",
    updated: "November 2026",
    sections: [
      {
        heading: "1. 1-Click Pause Carry-Forward",
        body: "Whenever you pause a delivery day before 8:00 PM within your plan quota (2 Weekly / 5 Monthly), zero money is lost. Your paused morning is automatically carried forward to extend your subscription.",
      },
      {
        heading: "2. Freshness Replacement Guarantee",
        body: "Because fresh flowers are perishable botanical items dispatched fresh from farms at 8:00 PM for morning delivery, we do not accept physical returns. However, if your morning pouch arrives damaged, share a photo on WhatsApp (+91 91670 34671) within 2 hours of delivery for a free replacement.",
      },
    ],
  },
  "shipping-policy": {
    title: "Shipping & Morning Delivery Policy",
    description:
      "Serviceable Thane pincodes (400601–400608), 6–8 AM delivery slot, and Kalwa dispatch hub details for PALASSH Flowers.",
    updated: "November 2026",
    sections: [
      {
        heading: "1. Serviceable Thane Pincodes (400601 – 400608)",
        body: "Our delivery is only avilable for 400601 to 400608 pincodes,for now .",
      },
      {
        heading: "2. Delivery Timings & 1-Day Farm Buffer",
        body: "All orders are delivered exclusively in the morning between 6:00 AM and 8:00 AM after a 1-day farm harvest buffer.",
      },
      {
        heading: "3. Dispatch Hub Location",
        body: `All flower pouches are sorted and dispatched fresh from our registered hub at: ${SHOP_ADDRESS}.`,
      },
    ],
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = LEGAL_CONTENT[slug] || LEGAL_CONTENT["terms-and-conditions"];
  return {
    title: doc.title,
    description: doc.description,
    alternates: { canonical: `https://palassh.com/legal/${slug}` },
  };
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = LEGAL_CONTENT[slug] || LEGAL_CONTENT["terms-and-conditions"];

  return (
    <div className="min-h-screen bg-[#FAF6F0] py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-600 hover:text-[#D95326]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home Page </span>
        </Link>

        <div className="rounded-[2.5rem] border border-[#E6DEC8] bg-white p-8 sm:p-12 shadow-md space-y-8">
          <div className="border-b border-stone-100 pb-6 space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1C1917] px-3.5 py-1 text-[10px] font-bold uppercase tracking-widest text-[#F5D0A9]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#D95326]" />
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

          <div className="rounded-2xl border border-[#E6DEC8] bg-[#FAF6F0] p-5 space-y-2 text-xs text-stone-600">
            <div className="flex items-center gap-2 font-bold text-stone-900">
              <MapPin className="h-4 w-4 text-[#D95326]" />
              <span>Registered Operations Hub:</span>
            </div>
            <p>{SHOP_ADDRESS}</p>
            <div className="flex items-center gap-2 pt-1 text-[#D95326] font-semibold">
              <Clock className="h-4 w-4" />
              <span>
                Morning Delivery Slot: 6:00 AM – 8:00 AM • Evening Modification
                Cut-off: 8:00 PM • Support: +91 91670 34671
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}