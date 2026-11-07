"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import {
  INITIAL_PLANS,
  SubscriptionPlan,
  getActivePlansCatalog,
} from "@/features/catalog/types";

export function Footer() {
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
  const weekly =
    plans.find((p) => p.id === "plan-weekly") || plans[1] || INITIAL_PLANS[1];
  const monthly =
    plans.find((p) => p.id === "plan-monthly") || plans[2] || INITIAL_PLANS[2];

  return (
    <footer className="relative bg-[#1C1917] text-stone-300 overflow-hidden">
      {/* Subtle Solid Terracotta Top Line */}
      <div className="h-1.5 w-full bg-[#D95326]" />

      <div className="relative mx-auto max-w-7xl px-4 pt-16 pb-10 sm:px-6 lg:px-8">
        {/* Top Warm Beige & Charcoal CTA Banner */}
        <div className="relative z-10 mb-16 rounded-[2rem] border border-stone-700/80 bg-[#26211E] p-8 sm:p-10 shadow-xl">
          <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div className="space-y-2 max-w-xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-900 border border-stone-700 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-[#F5D0A9]">
                <Sparkles className="h-3.5 w-3.5 text-[#D95326]" /> Thane&apos;s
                Sacred Flower Concierge
              </span>
              <h3 className="font-serif text-2xl sm:text-4xl font-bold text-white">
                Bring Divine Fragrance to Your 6 AM Puja.
              </h3>
              <p className="text-xs sm:text-sm text-stone-300">
                100g & 150g daily pouches across 7 sacred flower varieties in
                Thane pincodes 400601 to 400608.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/#plans"
                className="inline-flex items-center gap-2 rounded-full bg-[#D95326] hover:bg-[#BA421B] px-7 py-4 text-xs sm:text-sm font-bold text-white shadow-md transition"
              >
                <span>Plans from ₹{oneDay.price}/day</span>
                <ArrowUpRight className="h-4 w-4 text-white" />
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-full border border-stone-600 bg-stone-800/70 px-6 py-4 text-xs sm:text-sm font-bold text-stone-200 hover:bg-stone-800 transition"
              >
                <span>View Member Store</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Main 4-Column Wrapper */}
        <div className="relative">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center select-none overflow-hidden"
          >
            <p
              style={{
                WebkitTextStroke: "1px rgba(245, 208, 169, 0.08)",
              }}
              className="font-serif text-[13.5vw] leading-none font-bold tracking-[0.18em] text-white/[0.03]"
            >
              PALASSH
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-12 pb-12 border-b border-stone-800">
            {/* Col 1: Brand Identity */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 overflow-hidden rounded-xl bg-white p-1 shadow-sm">
                  <img
                    src="/images/logo.webp"
                    alt="PALASSH"
                    width={44}
                    height={44}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <span className="font-serif text-2xl font-bold tracking-[0.15em] text-white block leading-none">
                    PALASSH
                  </span>
                  <span className="text-[11px] italic text-[#F5D0A9] font-serif">
                    flowers that pray with you
                  </span>
                </div>
              </div>

              <div className="pt-2 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#F5D0A9]">
                  Follow Us
                </h4>
                <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 max-w-xs">
                  <a
                    href="https://www.youtube.com/@Palassh-Flowers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between rounded-xl border border-stone-800 bg-stone-900/60 p-2.5 px-3 transition hover:border-[#D95326]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-800 text-[#D95326]">
                        <svg
                          className="h-4 w-4 fill-current"
                          viewBox="0 0 24 24"
                        >
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                        </svg>
                      </div>
                      <div>
                        <span className="block text-sm font-semibold text-white">
                          YouTube
                        </span>
                        <span className="block text-xs text-stone-400">
                          @Palassh-Flowers
                        </span>
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-stone-500 group-hover:text-white transition" />
                  </a>

                  <a
                    href="https://www.instagram.com/palassh_flowers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between rounded-xl border border-stone-800 bg-stone-900/60 p-2.5 px-3 transition hover:border-[#D95326]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-800 text-[#D95326]">
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect
                            width="20"
                            height="20"
                            x="2"
                            y="2"
                            rx="5"
                            ry="5"
                          />
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                        </svg>
                      </div>
                      <div>
                        <span className="block text-sm font-semibold text-white">
                          Instagram
                        </span>
                        <span className="block text-xs text-stone-400">
                          @palassh_flowers
                        </span>
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-stone-500 group-hover:text-white transition" />
                  </a>
                </div>
              </div>
            </div>

            {/* Col 2: Sacred Subscriptions */}
            <div className="lg:col-span-3 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#F5D0A9]">
                100g & 150g Subscriptions
              </h4>
              <ul className="space-y-3 text-sm text-stone-300">
                <li>
                  <Link
                    href="/checkout?plan=1-day-plan"
                    className="hover:text-white transition flex items-center justify-between max-w-[230px]"
                  >
                    <span>1 Day Plan (100g / 150g)</span>
                    <span className="text-xs font-bold text-[#F5D0A9]">
                      From ₹{oneDay.price}
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/checkout?plan=weekly-pack"
                    className="hover:text-white transition flex items-center justify-between max-w-[230px]"
                  >
                    <span>Weekly Pack (7 Days)</span>
                    <span className="text-xs font-bold text-[#F5D0A9]">
                      From ₹{weekly.price}
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/checkout?plan=monthly-pack"
                    className="hover:text-white transition flex items-center justify-between max-w-[230px]"
                  >
                    <span>Monthly Pack (30 Days)</span>
                    <span className="text-xs font-bold text-[#F5D0A9]">
                      From ₹{monthly.price.toLocaleString("en-IN")}
                    </span>
                  </Link>
                </li>
                <li className="pt-1">
                  <Link
                    href="/#plans"
                    className="inline-flex items-center gap-1.5 text-[#D95326] font-semibold hover:text-white"
                  >
                    <span>→ Compare All 7 Varieties</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Quick Links & Legal */}
            <div className="lg:col-span-2 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#F5D0A9]">
                Explore & Legal
              </h4>
              <ul className="space-y-3 text-sm text-stone-300">
                <li>
                  <Link href="/about" className="hover:text-white transition">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/account" className="hover:text-white transition">
                    My Account
                  </Link>
                </li>
                <li>
                  <Link
                    href="/my-orders"
                    className="hover:text-white transition"
                  >
                    My Orders & Pause
                  </Link>
                </li>
                <li>
                  <Link
                    href="/legal/privacy-policy"
                    className="hover:text-white transition"
                  >
                    Privacy & Terms
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Thane Dispatch Hub */}
            <div className="lg:col-span-3 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#F5D0A9]">
                Thane Dispatch Hub
              </h4>
              <ul className="space-y-3.5 text-sm text-stone-300">
                <li className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 shrink-0 text-[#D95326] mt-1" />
                  <span>
                    6X4X+HJ5 Glenmark Residency, 60 Feet Rd, Kharegaon, Kalwa,
                    Thane - 400605 (Serving 400601–400608)
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Clock className="h-4 w-4 shrink-0 text-[#F5D0A9]" />
                  <span>Morning Drop: 6:00 AM – 8:00 AM</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="h-4 w-4 shrink-0 text-[#F5D0A9]" />
                  <span>+917710942605 (WhatsApp Desk)</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="h-4 w-4 shrink-0 text-[#D95326]" />
                  <span>care@palassh.com</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-6 flex flex-col items-center justify-between gap-4 text-xs text-stone-400 sm:flex-row">
          <p>
            © {new Date().getFullYear()} PALASSH Flowers. Crafted for Sacred
            Morning Devotion.
          </p>
          <div className="flex items-center gap-2 rounded-full border border-stone-800 bg-stone-900 px-4 py-1.5 text-stone-300">
            <ShieldCheck className="h-4 w-4 text-[#D95326]" />
            <span>
              100% Secure Prepaid Checkout via Razorpay (UPI • Cards •
              NetBanking)
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}