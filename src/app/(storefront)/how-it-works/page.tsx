"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
    MapPin,
    Flower2,
    ShieldCheck,
    Clock,
    CalendarCheck,
    Sparkles,
    ArrowRight,
    CheckCircle2,
    PauseCircle,
    ShoppingBag,
    HelpCircle,
    PhoneCall,
} from "lucide-react";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import {
    INITIAL_PLANS,
    SubscriptionPlan,
    getActivePlansCatalog,
} from "@/features/catalog/types";

const STEPS = [
    {
        stepNo: "01",
        badge: "30-Second Pincode Check",
        title: "Verify Your Society in Thane (400601 – 400608)",
        subtitle:
            "We operate a dedicated morning route across Thane West, Thane East, Kalwa, Pokhran, Ghodbunder Road & Balkum.",
        imageUrl: "/images/step-1-pincode.webp",
        icon: MapPin,
        highlights: [
            "Enter your 6-digit Thane pincode (400601 to 400608) to confirm instant route availability.",
            "Direct dispatch from our Kharegaon, Kalwa sorting hub.",
            "Zero delivery fee on all morning subscription plans.",
        ],
        ctaText: "Check Your Pincode",
        ctaHref: "/#pincode-check",
    },
    {
        stepNo: "02",
        badge: "Customize Your Daily Pouch",
        title: "Choose Pouch Weight (100g / 150g), Flower Type & Duration",
        subtitle:
            "Tailor your morning puja basket according to your home mandir's daily needs.",
        imageUrl: "/images/step-2-varieties.webp",
        icon: Flower2,
        highlights: [
            "Pick your daily breathable pouch weight: 100 gms or 150 gms.",
            "Choose from 7 sacred varieties: Mixed, Orange or Yellow Marigold (झेंडू), Pooja Flower Mix (पूजा फुले), or Mixed, White & Yellow Shevanti (शेवंती).",
            "Select your duration: 1 Day Trial (from ₹45), Weekly Pack (7 Mornings), or Monthly Pack (30 Mornings).",
        ],
        ctaText: "Compare Subscription Plans",
        ctaHref: "/#plans",
    },
    {
        stepNo: "03",
        badge: "Order Before 11:45 PM IST",
        title: "Verify via OTP & Complete Secure Prepaid Checkout",
        subtitle:
            "Link your email and WhatsApp number in one click and lock your starting delivery date.",
        imageUrl: "/images/step-3-harvest.webp",
        icon: ShieldCheck,
        highlights: [
            "Book before 11:45 PM IST tonight to receive your first fresh flower pouch tomorrow morning!",
            "100% secure prepaid payment via Razorpay (UPI, GPay, PhonePe, Cards & NetBanking).",
            "Instant one-time confirmation receipt sent to your email with your full delivery schedule.",
        ],
        ctaText: "Go To Checkout",
        ctaHref: "/checkout",
    },
    {
        stepNo: "04",
        badge: "6:00 AM To 8:00 AM Silent Drop",
        title: "Wake Up to Dew-Fresh Blooms on Your Door Handle",
        subtitle:
            "Plucked at 8:00 PM from farms, sorted at 4:00 AM at Kalwa Hub, and hung silently before your morning aarti.",
        imageUrl: "/images/step4.webp",
        icon: Clock,
        highlights: [
            "100% Zero Cold Storage — flowers travel directly from farm to your mandir overnight.",
            "Silent Devotion Protocol: Our riders never ring your doorbell or disturb your morning sleep.",
            "Packed in breathable eco-pouches that keep petals fresh from morning puja till evening.",
        ],
        ctaText: "View Our Supply Chain",
        ctaHref: "/about",
    },
    {
        stepNo: "05",
        badge: "Total Control & Member Perks",
        title: "Unlock Extra Add-On Flowers",
        subtitle:
            "want to buy more flowers ? you can easily purchase when you subscribe weekly or monthly plan.",
        imageUrl: "/images/unlock.webp",
        icon: CalendarCheck,
        highlights: [
            "You can purchase more flowers with your running plan with free delivery charges.",
            "Exclusive Member Flower Store: Active Weekly & Monthly subscribers can order extra 100g or 150g loose flower Add-On packs on any active plan day (except the final delivery day of your plan).",
            "Add custom doorstep instructions anytime from your My Orders dashboard.",
        ],
        ctaText: "Add more Flowers",
        ctaHref: "/products",
    },
];

const FAQS = [
    {
        q: "What if I travel out of Thane for a few days?",
        a: "Simply open the 'My Orders' page and tap the date you want to pause before 8:00 PM the previous evening. Your delivery for that morning will be paused and automatically added to the end of your subscription calendar.",
    },
    {
        q: "When does my first delivery start after I subscribe?",
        a: "If you complete your booking before 11:45 PM IST tonight, your first morning delivery arrives tomorrow between 6:00 AM and 8:00 AM. Bookings placed after 11:45 PM start the day after tomorrow.",
    },
    {
        q: "How do Subscriber Loose Flower Add-Ons work?",
        a: "When you have an active Weekly (7-Day) or Monthly (30-Day) subscription, you unlock our Member Flower Store (/products). You can book 1 extra pack (100g or 150g) per day for any scheduled delivery date right up to the second-last day of your plan (Add-Ons are locked only on the final delivery day of your plan).",
    },
    {
        q: "Will the delivery rider ring my doorbell at 6:00 AM?",
        a: "Never. We follow a strict Silent Drop protocol. Your flower pouch is gently hung on your main door handle or placed in your basket between 6:00 AM and 8:00 AM without ringing the bell.",
    },
];

export default function HowSubscriptionWorksPage() {
    const [plans, setPlans] = useState<SubscriptionPlan[]>(INITIAL_PLANS);

    useEffect(() => {
        const sync = () => setPlans(getActivePlansCatalog());
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
        <div className="min-h-screen w-full overflow-x-hidden bg-[#FAF6F0] py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl space-y-16 sm:space-y-24">
                {/* 1. HERO HEADER */}
                <ScrollReveal>
                    <div className="relative overflow-hidden rounded-3xl sm:rounded-[2.5rem] border border-[#E6DEC8] bg-[#1C1917] p-6 sm:p-12 lg:p-16 text-center text-white shadow-xl">
                        <div className="pointer-events-none absolute -top-24 left-1/3 h-72 w-72 rounded-full bg-[#D95326]/20 blur-3xl" />
                        <div className="relative z-10 mx-auto max-w-3xl space-y-4">
                            <span className="inline-flex items-center gap-2 rounded-full border border-[#F5D0A9]/30 bg-white/10 px-4 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#F5D0A9]">
                                <Sparkles className="h-3.5 w-3.5 text-[#D95326]" />
                                <span>Simple 5-Step Morning Ritual</span>
                            </span>
                            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold leading-[1.12]">
                                How PALASSH{" "}
                                <span className="italic font-normal text-[#F5D0A9]">
                                    Subscription Works
                                </span>
                            </h1>
                            <p className="text-xs sm:text-base text-stone-300 leading-relaxed max-w-2xl mx-auto">
                                From evening farm harvest to a silent 6:00 AM – 8:00 AM drop on
                                your doorstep—here is how we bring fresh puja flowers to your
                                home mandir every single morning.
                            </p>
                            <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
                                <Link
                                    href="/#plans"
                                    className="inline-flex items-center gap-2 rounded-full bg-[#D95326] hover:bg-[#BA421B] px-7 py-3.5 text-xs sm:text-sm font-bold text-white shadow-md transition"
                                >
                                    <span>Explore Plans (From ₹{oneDay.price})</span>
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                                <Link
                                    href="/#pincode-check"
                                    className="inline-flex items-center gap-2 rounded-full border border-stone-700 bg-stone-900 px-6 py-3.5 text-xs sm:text-sm font-bold text-stone-200 hover:bg-stone-800 transition"
                                >
                                    <MapPin className="h-4 w-4 text-[#D95326]" />
                                    <span>Check Thane Pincode</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </ScrollReveal>

                {/* 2. VISUAL ZIG-ZAG STEP-BY-STEP GUIDE (With Images & Clear Bullets) */}
                <div className="space-y-10 sm:space-y-14">
                    {STEPS.map((step, index) => {
                        const IconComp = step.icon;
                        const isReversed = index % 2 === 1;
                        return (
                            <ScrollReveal key={step.stepNo} delayMs={index * 80}>
                                <div className="overflow-hidden rounded-3xl sm:rounded-[2.25rem] border border-[#E6DEC8] bg-white p-5 sm:p-8 lg:p-10 shadow-md">
                                    <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-12 lg:items-center">
                                        {/* Image Showcase Column */}
                                        <div
                                            className={`lg:col-span-5 ${isReversed ? "lg:order-2" : "lg:order-1"
                                                }`}
                                        >
                                            <div className="relative aspect-16/10 sm:aspect-4/3 w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-[#E6DEC8] bg-[#F3ECE1]">
                                                <img
                                                    src={step.imageUrl}
                                                    alt={step.title}
                                                    loading={index < 2 ? "eager" : "lazy"}
                                                    decoding="async"
                                                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-transparent to-transparent" />
                                                <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-[#1C1917]/90 backdrop-blur-md px-3.5 py-1.5 text-xs font-bold text-[#F5D0A9] border border-white/15">
                                                    <span>STEP {step.stepNo}</span>
                                                </div>
                                                <div className="absolute bottom-3.5 left-4 right-4 flex items-center justify-between text-white">
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#D95326] px-3 py-1 text-[11px] font-bold shadow-xs">
                                                        <IconComp className="h-3.5 w-3.5" />
                                                        <span>{step.badge}</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Text & Bullet Explanation Column */}
                                        <div
                                            className={`lg:col-span-7 space-y-4 sm:space-y-5 ${isReversed ? "lg:order-1" : "lg:order-2"
                                                }`}
                                        >
                                            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#D95326]">
                                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFF3EC] border border-[#D95326]/30 font-serif text-sm">
                                                    {step.stepNo}
                                                </span>
                                                <span>{step.badge}</span>
                                            </div>

                                            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 leading-tight">
                                                {step.title}
                                            </h2>

                                            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                                                {step.subtitle}
                                            </p>

                                            <ul className="space-y-2.5 pt-1">
                                                {step.highlights.map((point, idx) => (
                                                    <li
                                                        key={idx}
                                                        className="flex items-start gap-2.5 text-xs sm:text-sm text-stone-800"
                                                    >
                                                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-[#D95326] shrink-0 mt-0.5" />
                                                        <span className="leading-relaxed">{point}</span>
                                                    </li>
                                                ))}
                                            </ul>

                                            <div className="pt-2">
                                                <Link
                                                    href={step.ctaHref}
                                                    className="inline-flex items-center gap-2 rounded-2xl bg-[#FAF6F0] hover:bg-[#D95326] text-stone-900 hover:text-white border border-[#E6DEC8] hover:border-[#D95326] px-5 py-3 text-xs font-bold transition"
                                                >
                                                    <span>{step.ctaText}</span>
                                                    <ArrowRight className="h-3.5 w-3.5" />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </ScrollReveal>
                        );
                    })}
                </div>

                {/* 3. QUICK PLAN COMPARISON SNAPSHOT */}
                <ScrollReveal>
                    <div className="rounded-3xl sm:rounded-[2.5rem] border border-[#E6DEC8] bg-[#F3ECE1] p-6 sm:p-10 lg:p-12 space-y-8">
                        <div className="text-center max-w-2xl mx-auto space-y-2">
                            <span className="text-[11px] font-bold uppercase tracking-widest text-[#D95326]">
                                Choose Your Rhythm
                            </span>
                            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-stone-900">
                                3 Flexible Subscription Tiers
                            </h2>
                            <p className="text-xs sm:text-sm text-stone-600">
                                Available in 100 gms and 150 gms daily pouches across all 7
                                sacred flower varieties.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            {[
                                {
                                    title: oneDay.title,
                                    days: "1 Morning Trial",
                                    price: `From ₹${oneDay.price}`,
                                    pauses: "Single-Day Trial Drop",
                                    addons: "Upgrade anytime for Add-Ons",
                                    highlight: false,
                                },
                                {
                                    title: weekly.title,
                                    days: "7 Morning Deliveries",
                                    price: `From ₹${weekly.price}`,
                                    pauses: "Up to 2 Calendar Pauses (Carry-Forward)",
                                    addons: "Unlocks 100g/150g Add-Ons (Till 2nd Last Day)",
                                    highlight: false,
                                },
                                {
                                    title: monthly.title,
                                    days: "30 Morning Deliveries",
                                    price: `From ₹${monthly.price.toLocaleString("en-IN")}`,
                                    pauses: "Up to 5 Calendar Pauses (Carry-Forward)",
                                    addons: "Unlocks 100g/150g Add-Ons (Till 2nd Last Day)",
                                    highlight: true,
                                },
                            ].map((card) => (
                                <div
                                    key={card.title}
                                    className={`rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-5 ${card.highlight
                                            ? "border-2 border-[#D95326] bg-white shadow-xl"
                                            : "border border-[#E6DEC8] bg-white shadow-xs"
                                        }`}
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="rounded-full bg-[#FAF6F0] border border-[#E6DEC8] px-3 py-1 text-[11px] font-bold text-stone-800">
                                                {card.days}
                                            </span>
                                            {card.highlight && (
                                                <span className="rounded-full bg-[#D95326] px-3 py-1 text-[10px] font-bold uppercase text-white">
                                                    Best Value
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-serif text-2xl font-bold text-stone-900">
                                            {card.title}
                                        </h3>
                                        <p className="font-serif text-3xl font-bold text-[#D95326]">
                                            {card.price}
                                        </p>
                                        <div className="space-y-2 pt-2 border-t border-stone-100 text-xs text-stone-700">
                                            <p className="flex items-center gap-2">
                                                <PauseCircle className="h-4 w-4 text-[#D95326] shrink-0" />
                                                <span>{card.pauses}</span>
                                            </p>
                                            <p className="flex items-center gap-2">
                                                <ShoppingBag className="h-4 w-4 text-[#D95326] shrink-0" />
                                                <span>{card.addons}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <Link
                                        href="/#plans"
                                        className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-xs font-bold transition ${card.highlight
                                                ? "bg-[#D95326] hover:bg-[#BA421B] text-white"
                                                : "bg-stone-900 hover:bg-[#D95326] text-white"
                                            }`}
                                    >
                                        <span>Select {card.title}</span>
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </ScrollReveal>

                {/* 4. FREQUENTLY ASKED QUESTIONS */}
                <ScrollReveal>
                    <div className="rounded-3xl sm:rounded-[2.5rem] border border-[#E6DEC8] bg-white p-6 sm:p-10 lg:p-12 shadow-sm space-y-6">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#D95326]">
                            <HelpCircle className="h-4 w-4" />
                            <span>Got Questions?</span>
                        </div>
                        <h2 className="font-serif text-2xl sm:text-4xl font-bold text-stone-900">
                            Subscription Rules Made Simple
                        </h2>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 pt-2">
                            {FAQS.map((item) => (
                                <div
                                    key={item.q}
                                    className="rounded-2xl border border-[#E6DEC8] bg-[#FAF6F0] p-5 space-y-2"
                                >
                                    <h3 className="font-serif text-base sm:text-lg font-bold text-stone-900">
                                        {item.q}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                                        {item.a}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-[#E6DEC8] bg-[#FFF3EC] p-5">
                            <div className="space-y-0.5 text-center sm:text-left">
                                <p className="font-serif text-base font-bold text-stone-900">
                                    Still need help choosing your morning flower plan?
                                </p>
                                <p className="text-xs text-stone-600">
                                    Chat directly with our Thane operations desk on WhatsApp.
                                </p>
                            </div>
                            <a
                                href="https://wa.me/7710942605"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-xl bg-[#D95326] hover:bg-[#BA421B] px-5 py-3 text-xs font-bold text-white shadow-xs shrink-0 transition"
                            >
                                <PhoneCall className="h-4 w-4" />
                                <span>WhatsApp +917710942605</span>
                            </a>
                        </div>
                    </div>
                </ScrollReveal>
            </div>
        </div>
    );
}