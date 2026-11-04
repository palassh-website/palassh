"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  Sparkles,
  HeartHandshake,
  ShieldCheck,
  MapPin,
  ArrowRight,
  Flower2,
  Sun,
  CheckCircle2,
  PhoneCall,
} from "lucide-react";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import {
  INITIAL_PLANS,
  SubscriptionPlan,
  getActivePlansCatalog,
} from "@/features/catalog/types";

const SHOP_ADDRESS =
  "6X4X+HJ5 Glenmark Residency, 60 Feet Rd, Kharegaon, Kalwa, Thane, Maharashtra 400605";

export default function AboutUsPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>(INITIAL_PLANS);

  useEffect(() => {
    const sync = () => {
      setPlans(getActivePlansCatalog());
    };
    sync();
    window.addEventListener("palassh-plans-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("palassh-plans-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const oneDay =
    plans.find((p) => p.id === "plan-daily") || plans[0] || INITIAL_PLANS[0];

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#FAF6F0] py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-16 sm:space-y-24">
        {/* 1. HERO STORY BANNER (Warm Solid Charcoal & Almond Beige — Zero Green) */}
        <ScrollReveal>
          <div className="relative overflow-hidden rounded-3xl sm:rounded-[2.5rem] border border-[#E6DEC8] bg-[#1C1917] p-6 sm:p-12 lg:p-16 text-white shadow-xl">
            <div className="pointer-events-none absolute -top-24 -right-20 h-80 w-80 rounded-full bg-[#D95326]/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-20 h-80 w-80 rounded-full bg-[#F5D0A9]/10 blur-3xl" />

            <div className="relative z-10 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-7 space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#F5D0A9]/30 bg-white/10 px-4 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#F5D0A9] backdrop-blur-xs">
                  <Sparkles className="h-3.5 w-3.5 text-[#D95326]" />
                  <span>Thane&apos;s Sacred Flower Concierge</span>
                </div>

                <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold leading-[1.1]">
                  PALASSH:{" "}
                  <span className="block mt-1 text-[#F5D0A9] italic font-normal font-serif">
                   The Founder's Story To Start Palassh
                  </span>
                </h1>

                <p className="text-xs sm:text-base lg:text-lg text-stone-300 leading-relaxed max-w-2xl">
                

We are engineers by profession. Logic, circuits, and plannings were our world. But flowers were always our heart.

What started as a hobby, watering a few plants on our balcony, slowly became a passion.<p></p> The Peace, the Prayer, the Purity that a flower brings we couldn’t find it anywhere else.

And then came Reeva.
<p></p>
Our baby girl. Since she was a few months old, she had only one true love flowers. She would light up, smile, and hold a single flower like it was the whole world. Watching her love for flowers inspired us to take the leap we were always scared to take.
<p></p>
That’s how PALASSH was born.

Reeva is another name for the holy Narmada River. And Palassh, the flame of the forest is the flower that blooms beautifully on the banks of Narmada. For us, it felt like a circle was complete.

Reeva, Narmada, Palash. Our daughter, our roots, and our passion.
<p></p>
Palassh is not just a flower business for us. It is our family’s prayer, made of flowers.

Welcome to Palassh.
Flowers that pray with you.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Link
                    href="/#plans"
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#D95326] hover:bg-[#BA421B] px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-md transition"
                  >
                    <span>Explore Subscriptions (From ₹{oneDay.price})</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-2 rounded-2xl border border-stone-700 bg-stone-900 px-6 py-3.5 text-xs sm:text-sm font-bold text-stone-200 hover:bg-stone-800 transition"
                  >
                    <span>View Member Flower Store</span>
                  </Link>
                </div>
              </div>

              {/* Right Showcase Image Card */}
              <div className="lg:col-span-5">
                <div className="relative mx-auto max-w-sm overflow-hidden rounded-3xl border-4 border-white/15 bg-stone-900 shadow-2xl aspect-[4/3]">
                  <img
                    src="/images/founder.webp"
                    alt="PALASSH Sacred Morning Blooms"
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1C1917] via-transparent to-transparent" />
                  <div className="absolute bottom-3.5 left-3.5 right-3.5 rounded-2xl border border-white/15 bg-black/65 p-3.5 backdrop-blur-md">
                    <p className="font-serif text-sm font-bold text-[#F5D0A9]">
                      The Heads Behind Palassh
                    </p>
                    <p className="text-[11px] text-stone-200">
                      Mrs .Ankita Jagtap  &  Mr. Pratik Jagtap 

                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* 2. THE 4-STAGE MIDNIGHT-TO-MANDIR JOURNEY */}
        <div className="space-y-10">
          <ScrollReveal>
            <div className="text-center max-w-2xl mx-auto space-y-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F3ECE1] border border-[#E6DEC8] px-4 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#D95326]">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Midnight-to-Mandir Supply Chain</span>
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl font-bold text-stone-900">
                How Your Flowers Travel Every Single Night
              </h2>
              <p className="text-xs sm:text-sm text-stone-600">
                While Thane sleeps, our farmers and sorting teams work through
                the night so your morning puja thali is blessed with fresh
                blooms.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                time: "08:00 PM",
                icon: Sparkles,
                title: "Harvesting Process ",
                desc: "Partner farmers hand-pluck fresh flower buds 12 to 15 hours before you order .",
              },
              {
                time: "04:00 AM",
                icon: Flower2,
                title: "Kalwa Hub 100g & 150g Sorting",
                desc: "Blooms arrive at our Kharegaon, Kalwa hub where crushed petals are removed and packed into 100g & 150g breathable pouches.",
              },
              {
                time: "06:00 AM",
                icon: Clock,
                title: "Silent Doorstep Drop",
                desc: "Between 6:00 AM – 8:00 AM, our riders silently hang your flower pouch on your door handle across Thane pincodes 400601–400608.",
              },
              {
                time: "07:00 AM",
                icon: Sun,
                title: "Your Morning Aarti",
                desc: "You open your door to dewy, fragrant temple-grade flowers with complete flexibility to pause before 8:00 PM.",
              },
            ].map((step, i) => (
              <ScrollReveal key={step.time} delayMs={i * 110}>
                <div className="group rounded-3xl border border-[#E6DEC8] bg-white p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-[#D95326] h-full flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-[#D95326] px-3 py-1 text-[11px] font-bold text-white shadow-2xs">
                        {step.time}
                      </span>
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FAF6F0] text-[#D95326] border border-[#E6DEC8]">
                        <step.icon className="h-5 w-5" />
                      </div>
                    </div>
                    <h3 className="font-serif text-xl font-bold text-stone-900">
                      {step.title}
                    </h3>
                    <p className="text-xs sm:text-sm leading-relaxed text-stone-600">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>

        {/* 3. OUR SACRED BOTANICAL COLLECTION */}
        <ScrollReveal>
          <div className="rounded-3xl sm:rounded-[2.5rem] border border-[#E6DEC8] bg-white p-6 sm:p-10 lg:p-12 shadow-md space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-100 pb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#D95326]">
                  7 Sacred Puja Varieties in 100g & 150g
                </span>
                <h2 className="mt-1 font-serif text-2xl sm:text-4xl font-bold text-stone-900">
                  Blooms Curated for Every Deity
                </h2>
              </div>
              <Link
                href="/#plans"
                className="inline-flex items-center gap-2 rounded-full bg-[#D95326] hover:bg-[#BA421B] px-5 py-2.5 text-xs font-bold text-white shadow-xs w-fit transition"
              >
                <span>Compare 100g & 150g Plans</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                {
                  name: "Mixed, Orange & Yellow Marigold",
                  marathi: "झेंडू",
                  image: "/images/merigold.jpeg",
                  deity: "100g from ₹45 | 150g from ₹55",
                  desc: "Rich saffron and golden blooms plucked fresh from Nashik fields for auspicious daily worship and torans.",
                },
                {
                  name: "Pooja Flower Assortment",
                  marathi: "पूजा फुले",
                  image: "/images/hibiscus.jpeg",
                  deity: "100g from ₹49 | 150g from ₹65",
                  desc: "Complete daily home mandir assortment curated for morning archana across all deities.",
                },
                {
                  name: "Mixed, White & Yellow Shevanti",
                  marathi: "शेवंती",
                  image: "/images/chrysanthemum.jpeg",
                  deity: "100g from ₹69 | 150g from ₹89",
                  desc: "Long-lasting ivory and golden chrysanthemum petals that stay radiant on your altar from morning aarti till night.",
                },
              ].map((flw) => (
                <div
                  key={flw.name}
                  className="overflow-hidden rounded-2xl border border-[#E6DEC8] bg-[#FAF6F0] shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-16/10 w-full overflow-hidden bg-[#F3ECE1]">
                      <img
                        src={flw.image}
                        alt={flw.name}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="p-5 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-serif text-lg font-bold text-stone-900">
                          {flw.name}
                        </h3>
                        <span className="rounded-md bg-white border border-[#E6DEC8] px-2.5 py-0.5 text-xs font-bold text-stone-800 shrink-0">
                          {flw.marathi}
                        </span>
                      </div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#D95326]">
                        {flw.deity}
                      </p>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        {flw.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* 4. WHY THANE FAMILIES CHOOSE PALASSH */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            {
              icon: Sparkles,
              title: "100% Altar-Grade Purity",
              desc: "Never stepped on, never stored in ice boxes, and packed in breathable pouches after a 1-day farm harvest buffer.",
            },
            {
              icon: HeartHandshake,
              title: "Interactive Calendar Pause",
              desc: "Traveling out of station? Pause up to 2 deliveries on Weekly plans and 5 deliveries on Monthly plans before 8:00 PM.",
            },
            {
              icon: ShieldCheck,
              title: "Exclusive Member Flower Store",
              desc: "Plan subscribers unlock exclusive member access to order extra loose flower packs up to 2 KG – 3 KG.",
            },
          ].map((item, i) => (
            <ScrollReveal key={item.title} delayMs={i * 120}>
              <div className="rounded-3xl border border-[#E6DEC8] bg-white p-6 sm:p-8 shadow-xs h-full space-y-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D95326] text-white shadow-2xs">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed text-stone-600">
                  {item.desc}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* 5. THANE DISPATCH HUB & FINAL CTA */}
        <ScrollReveal>
          <div className="rounded-3xl sm:rounded-[2.5rem] border border-[#E6DEC8] bg-[#F3ECE1] p-6 sm:p-10 lg:p-12 text-stone-900 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="space-y-3 max-w-xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#E6DEC8] px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-[#D95326]">
                <MapPin className="h-3.5 w-3.5" />
                <span>Thane Dispatch Hub (Pincodes 400601 – 400608)</span>
              </span>
              <h3 className="font-serif text-2xl sm:text-4xl font-bold text-stone-900">
                Sorted Fresh Every Morning in Kalwa, Thane
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                {SHOP_ADDRESS}. Serving Thane West (400601), Naupada (400602),
                Kopri (400603), Wagle Estate (400604), Kalwa (400605), Vartak
                Nagar (400606), Ghodbunder Rd (400607) & Balkum (400608).
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-stone-800 font-semibold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#D95326]" />
                  Single Slot: 6:00 AM – 8:00 AM
                </span>
                <span className="flex items-center gap-1.5">
                  <PhoneCall className="h-4 w-4 text-[#D95326]" />
                  Support: +91 91670 34671
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto shrink-0">
              <Link
                href="/#plans"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#D95326] hover:bg-[#BA421B] px-7 py-4 text-xs sm:text-sm font-bold text-white shadow-md transition"
              >
                <span>Start 1 Day Plan @ ₹{oneDay.price}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/#pincode-check"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#E6DEC8] bg-white px-6 py-4 text-xs sm:text-sm font-bold text-stone-800 hover:border-[#D95326]"
              >
                <span>Check Pincode</span>
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}