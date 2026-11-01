"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  User,
  MapPin,
  ShieldCheck,
  Calendar,
  Scale,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import {
  CustomerTier,
  INITIAL_PLANS,
  SubscriptionPlan,
  getActivePlansCatalog,
  getCurrentCustomerTier,
  getFestiveModeStatus,
  getNormalPurchaseAllowed,
} from "@/features/catalog/types";
import { SERVICEABLE_PINCODES } from "@/features/pincode-checker/pincode.service";

export default function MyAccountPage() {
  const [profile, setProfile] = useState({
    fullName: "Snehal Deshmukh",
    phone: "9820XXXXXX",
    email: "snehal@example.com",
    flatAndSociety: "B-1204, Hiranandani Estate",
    pincode: "400607",
    dropPreference: "Hang pouch on main door handle (Do not ring bell)",
  });
  const [plans, setPlans] = useState<SubscriptionPlan[]>(INITIAL_PLANS);
  const [tier, setTier] = useState<CustomerTier>("NORMAL");
  const [festive, setFestive] = useState({
    isFestiveDay: false,
    festivalName: "Festive Puja",
  });
  const [normalPurchaseAllowed, setNormalPurchaseAllowed] = useState(true);
  const [savedToast, setSavedToast] = useState("");

  useEffect(() => {
    const sync = () => {
      setPlans(getActivePlansCatalog());
      setTier(getCurrentCustomerTier());
      setFestive(getFestiveModeStatus());
      setNormalPurchaseAllowed(getNormalPurchaseAllowed());
    };
    sync();

    window.addEventListener("palassh-plans-updated", sync);
    window.addEventListener("palassh-store-access-updated", sync);
    window.addEventListener("storage", sync);

    try {
      const savedProfile = localStorage.getItem("palassh_customer_profile_v1");
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      }
    } catch {
      // Ignore error
    }

    return () => {
      window.removeEventListener("palassh-plans-updated", sync);
      window.removeEventListener("palassh-store-access-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem(
        "palassh_customer_profile_v1",
        JSON.stringify(profile)
      );
      const zone = SERVICEABLE_PINCODES[profile.pincode];
      if (zone) {
        localStorage.setItem("palassh_verified_pincode", JSON.stringify(zone));
      }
    } catch {
      // Ignore error
    }
    setSavedToast("Your account profile & default Thane delivery address have been saved!");
    setTimeout(() => setSavedToast(""), 4000);
  };

  // Helper to simulate tier switching for testing Point #7 limits
  const switchDemoTier = (newTier: CustomerTier) => {
    setTier(newTier);
    const oneDayPrice = plans.find((p) => p.id === "plan-daily")?.price || 49;
    const weeklyPrice = plans.find((p) => p.id === "plan-weekly")?.price || 329;
    const monthlyPrice = plans.find((p) => p.id === "plan-monthly")?.price || 1350;

    try {
      if (newTier === "NORMAL") {
        localStorage.removeItem("palassh_active_subscription");
      } else {
        const planData =
          newTier === "MONTHLY"
            ? {
                orderId: "PLS-901234",
                planId: "plan-monthly",
                planTitle: "Monthly Sacred Assortment",
                pricePaid: monthlyPrice,
                billingCycle: "month",
                totalDeliveries: 30,
                remainingDeliveries: 28,
                status: "ACTIVE",
              }
            : newTier === "WEEKLY"
            ? {
                orderId: "PLS-801234",
                planId: "plan-weekly",
                planTitle: "Weekly Devotion Pack",
                pricePaid: weeklyPrice,
                billingCycle: "week",
                totalDeliveries: 7,
                remainingDeliveries: 6,
                status: "ACTIVE",
              }
            : {
                orderId: "PLS-701234",
                planId: "plan-daily",
                planTitle: "One Day Puja Pack",
                pricePaid: oneDayPrice,
                billingCycle: "day",
                totalDeliveries: 1,
                remainingDeliveries: 1,
                status: "ACTIVE",
              };
        localStorage.setItem(
          "palassh_active_subscription",
          JSON.stringify({
            ...planData,
            customerName: profile.fullName,
            address: `${profile.flatAndSociety} - ${profile.pincode}`,
            deliveryNote: profile.dropPreference,
          })
        );
      }
    } catch {
      // Ignore error
    }
    setSavedToast(`Switched active membership tier to ${newTier}!`);
    setTimeout(() => setSavedToast(""), 3500);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#E8502B]">
              Personal Profile & Quotas
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
              My PALASSH Account
            </h1>
            <p className="text-xs sm:text-sm text-stone-500">
              Manage your Thane doorstep address, morning drop preferences, and festive flower quotas.
            </p>
          </div>
          <Link
            href="/my-orders"
            className="inline-flex items-center gap-2 rounded-2xl bg-[#071C15] px-5 py-3 text-xs font-bold text-amber-200 shadow-sm hover:bg-[#0D3528]"
          >
            <Calendar className="h-4 w-4 text-[#F05A36]" />
            <span>Go to My Orders & Pause Planner</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {savedToast && (
          <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-300 bg-emerald-50 px-5 py-3.5 text-sm font-bold text-emerald-950 shadow-sm">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>{savedToast}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left: Membership & Flower Weight Quota Card (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-[2rem] bg-[#071C15] p-7 text-white shadow-xl space-y-5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950 border border-amber-400/30 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-300">
                  <Sparkles className="h-3 w-3 text-[#F05A36]" />
                  <span>Active Tier: {tier}</span>
                </span>
                <Scale className="h-5 w-5 text-amber-300" />
              </div>

              <div>
                <h2 className="font-serif text-2xl font-bold">
                  Your Flower Purchase Quota
                </h2>
                <p className="mt-1 text-xs text-emerald-100/80 leading-relaxed">
                  {(() => {
                    const weeklyPrice = plans.find((p) => p.id === "plan-weekly")?.price || 329;
                    const monthlyPrice = (
                      plans.find((p) => p.id === "plan-monthly")?.price || 1350
                    ).toLocaleString("en-IN");
                    if (tier === "MONTHLY") {
                      return `Monthly Member (₹${monthlyPrice}): You enjoy priority 3 KG (3,000g) combined flower booking on both Normal & Festive days.`;
                    }
                    if (tier === "WEEKLY") {
                      return `Weekly Member (₹${weeklyPrice}): You enjoy up to 2 KG (2,000g) combined flower booking on both Normal & Festive days.`;
                    }
                    return "Normal / One-Day User: Maximum 500g combined on normal days. Festive day direct flower orders require an active Weekly or Monthly subscription.";
                  })()}
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4 text-xs space-y-1.5 border border-white/10">
                <div className="flex justify-between">
                  <span className="text-emerald-200">Normal Day Max Limit:</span>
                  <span className="font-bold text-amber-300">
                    {tier === "MONTHLY"
                      ? "3,000g (3 KG)"
                      : tier === "WEEKLY"
                      ? "2,000g (2 KG)"
                      : "500g"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-200">Festive Day Max Limit:</span>
                  <span className="font-bold text-amber-300">
                    {tier === "MONTHLY"
                      ? "3,000g (3 KG)"
                      : tier === "WEEKLY"
                      ? "2,000g (2 KG)"
                      : "Locked (Subscribers Only)"}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-white/10">
                  <span className="text-emerald-200">Store Festive Mode:</span>
                  <span className="font-bold text-white">
                    {festive.isFestiveDay ? "ON (Festive Day)" : "OFF (Normal Day)"}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-white/10">
                  <span className="text-emerald-200">Non-Subscriber Access:</span>
                  <span
                    className={`font-bold ${
                      normalPurchaseAllowed ? "text-emerald-300" : "text-amber-300"
                    }`}
                  >
                    {normalPurchaseAllowed
                      ? "OPEN (Public Shopping)"
                      : "PAUSED (Subscribers Only)"}
                  </span>
                </div>
              </div>

              {/* Demo Tier Switcher so Client/Sanket can test all 3 limits easily */}
              <div className="pt-2 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  Test Membership Quota Tier:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {(["NORMAL", "WEEKLY", "MONTHLY"] as CustomerTier[]).map(
                    (t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => switchDemoTier(t)}
                        className={`rounded-xl py-2 text-[11px] font-bold transition cursor-pointer ${
                          tier === t
                            ? "bg-[#E8502B] text-white"
                            : "bg-white/10 text-emerald-100 hover:bg-white/20"
                        }`}
                      >
                        {t}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Address & Profile Form (7 Cols) */}
          <form
            onSubmit={handleSaveProfile}
            className="lg:col-span-7 rounded-[2rem] border border-stone-200 bg-white p-6 sm:p-8 shadow-lg space-y-5"
          >
            <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#E8502B]">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold text-stone-900">
                  Saved Doorstep Profile
                </h2>
                <p className="text-xs text-stone-500">
                  Pre-filled automatically during Checkout
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={profile.fullName}
                  onChange={(e) =>
                    setProfile({ ...profile, fullName: e.target.value })
                  }
                  className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#E8502B] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  WhatsApp Mobile
                </label>
                <input
                  type="text"
                  required
                  value={profile.phone}
                  onChange={(e) =>
                    setProfile({ ...profile, phone: e.target.value })
                  }
                  className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#E8502B] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Flat / Wing & Society Name
                </label>
                <input
                  type="text"
                  required
                  value={profile.flatAndSociety}
                  onChange={(e) =>
                    setProfile({ ...profile, flatAndSociety: e.target.value })
                  }
                  className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#E8502B] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Thane Pincode (400601–08)
                </label>
                <select
                  value={profile.pincode}
                  onChange={(e) =>
                    setProfile({ ...profile, pincode: e.target.value })
                  }
                  className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm font-bold text-stone-900 focus:border-[#E8502B] focus:outline-none"
                >
                  {Object.values(SERVICEABLE_PINCODES).map((z) => (
                    <option key={z.pincode} value={z.pincode}>
                      {z.pincode} — {z.area.split("(")[0].trim()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Morning 5–8 AM Silent Drop Preference
              </label>
              <select
                value={profile.dropPreference}
                onChange={(e) =>
                  setProfile({ ...profile, dropPreference: e.target.value })
                }
                className="w-full rounded-xl border border-stone-300 bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#E8502B] focus:outline-none"
              >
                <option value="Hang pouch on main door handle (Do not ring bell)">
                  Hang pouch on main door handle (Do not ring bell)
                </option>
                <option value="Place inside doorstep flower basket (Do not ring bell)">
                  Place inside doorstep flower basket (Do not ring bell)
                </option>
                <option value="Leave with Society Security Guard">
                  Leave with Society Security Guard
                </option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-gradient-to-r from-[#E8502B] to-[#D97706] py-3.5 text-sm font-bold text-white shadow-md hover:brightness-105 cursor-pointer"
            >
              Save Account Preferences
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}