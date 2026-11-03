"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  User,
  Calendar,
  Scale,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Lock,
} from "lucide-react";
import {
  CustomerTier,
  getCurrentCustomerTier,
  getFestiveModeStatus,
} from "@/features/catalog/types";
import { SERVICEABLE_PINCODES } from "@/features/pincode-checker/pincode.service";

export default function MyAccountPage() {
  // Point #7: Zero Mock Data — Starts clean and hydrates from real MySQL /api/orders session
  const [profile, setProfile] = useState({
    fullName: "",
    phone: "",
    email: "",
    flatAndSociety: "",
    pincode: "400605",
    dropPreference: "Hang pouch on main door handle (Do not ring bell)",
  });

  const [tier, setTier] = useState<CustomerTier>("NORMAL");
  const [festive, setFestive] = useState({
    isFestiveDay: false,
    festivalName: "Festive Puja",
  });
  const [savedToast, setSavedToast] = useState("");
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    setTier(getCurrentCustomerTier());
    setFestive(getFestiveModeStatus());

    try {
      const savedProfile = localStorage.getItem("palassh_customer_profile_v2");
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      }
    } catch {
      // Ignore
    }

    // Hydrate real authenticated customer profile & activeTier from MySQL
    fetch("/api/orders", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.authenticated && data?.customer) {
          const c = data.customer;
          setProfile({
            fullName: c.fullName || "",
            phone: c.phone || "",
            email: c.email || "",
            flatAndSociety: [c.flatWing, c.societyName]
              .filter(Boolean)
              .join(", "),
            pincode: c.pincode || "400605",
            dropPreference:
              c.deliveryNote ||
              "Hang pouch on main door handle (Do not ring bell)",
          });
          if (c.activeTier) {
            setTier(c.activeTier);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem(
        "palassh_customer_profile_v2",
        JSON.stringify(profile)
      );
      const zone = SERVICEABLE_PINCODES[profile.pincode];
      if (zone) {
        localStorage.setItem(
          "palassh_verified_pincode",
          JSON.stringify(zone)
        );
      }
    } catch {
      // Ignore
    }
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setSavedToast(
      "Your doorstep profile & default Thane delivery preferences have been saved!"
    );
    toastTimerRef.current = setTimeout(() => setSavedToast(""), 4000);
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E6DEC8] pb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#D95326]">
              Personal Profile & Member Quotas
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
              My PALASSH Account
            </h1>
            <p className="text-xs sm:text-sm text-stone-600">
              Manage your Thane doorstep address, morning drop preferences, and
              plan membership status.
            </p>
          </div>

          <Link
            href="/my-orders"
            className="inline-flex items-center gap-2 rounded-2xl bg-stone-900 hover:bg-[#D95326] px-5 py-3 text-xs font-bold text-white shadow-xs transition"
          >
            <Calendar className="h-4 w-4 text-[#F5D0A9]" />
            <span>Go to My Orders & Calendar</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {savedToast && (
          <div className="flex items-center gap-2.5 rounded-2xl border border-[#D95326] bg-[#FFF3EC] px-5 py-3.5 text-sm font-bold text-stone-900 shadow-2xs">
            <CheckCircle2 className="h-5 w-5 text-[#D95326] shrink-0" />
            <span>{savedToast}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left: Membership & Flower Weight Quota Card (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-[2rem] border border-[#E6DEC8] bg-[#1C1917] p-7 text-white shadow-lg space-y-5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-900 border border-stone-700 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#F5D0A9]">
                  <Sparkles className="h-3 w-3 text-[#D95326]" />
                  <span>Active Tier: {tier}</span>
                </span>
                <Scale className="h-5 w-5 text-[#F5D0A9]" />
              </div>

              <div>
                <h2 className="font-serif text-2xl font-bold">
                  Member Shopping Eligibility
                </h2>
                <p className="mt-1 text-xs text-stone-300 leading-relaxed">
                  {tier === "MONTHLY"
                    ? "Monthly Plan Member: You enjoy priority 3 KG (3,000g) extra loose flower shopping on both Normal & Festive days."
                    : tier === "WEEKLY"
                    ? "Weekly Plan Member: You enjoy up to 2 KG (2,000g) extra loose flower shopping on both Normal & Festive days."
                    : tier === "ONE_DAY"
                    ? "1-Day Plan Member: You can order up to 500g extra loose flowers on normal days."
                    : "Non-Plan Visitor: Loose flower shopping is locked. Purchase any 1 Day, Weekly, or Monthly Plan to unlock member shopping."}
                </p>
              </div>

              <div className="rounded-2xl bg-white/5 p-4 text-xs space-y-2 border border-white/10">
                <div className="flex justify-between">
                  <span className="text-stone-400">Loose Flower Store:</span>
                  <span className="font-bold text-[#F5D0A9]">
                    {tier === "NORMAL"
                      ? "Locked (Plan Required)"
                      : "Unlocked (Active Member)"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Your Max Order Quota:</span>
                  <span className="font-bold text-white">
                    {tier === "MONTHLY"
                      ? "3,000g (3 KG)"
                      : tier === "WEEKLY"
                      ? "2,000g (2 KG)"
                      : tier === "ONE_DAY"
                      ? "500g"
                      : "0g (Subscribe First)"}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-white/10">
                  <span className="text-stone-400">Store Festive Mode:</span>
                  <span className="font-bold text-white">
                    {festive.isFestiveDay
                      ? "ON (Festive Day)"
                      : "OFF (Normal Day)"}
                  </span>
                </div>
              </div>

              {tier === "NORMAL" && (
                <Link
                  href="/#plans"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#D95326] hover:bg-[#BA421B] py-3.5 text-xs font-bold text-white shadow-sm transition"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>Choose a 100g / 150g Plan to Activate</span>
                </Link>
              )}
            </div>
          </div>

          {/* Right: Address & Profile Form (7 Cols) */}
          <form
            onSubmit={handleSaveProfile}
            className="lg:col-span-7 rounded-[2rem] border border-[#E6DEC8] bg-white p-6 sm:p-8 shadow-md space-y-5"
          >
            <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF3EC] text-[#D95326]">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold text-stone-900">
                  Saved Doorstep Profile
                </h2>
                <p className="text-xs text-stone-500">
                  Synced automatically with your verified checkout details
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
                  placeholder="Enter your full name"
                  value={profile.fullName}
                  onChange={(e) =>
                    setProfile({ ...profile, fullName: e.target.value })
                  }
                  className="w-full rounded-xl border border-[#E6DEC8] px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#D95326] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  WhatsApp Mobile
                </label>
                <input
                  type="text"
                  required
                  placeholder="10-digit WhatsApp number"
                  value={profile.phone}
                  onChange={(e) =>
                    setProfile({ ...profile, phone: e.target.value })
                  }
                  className="w-full rounded-xl border border-[#E6DEC8] px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#D95326] focus:outline-none"
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
                  placeholder="e.g. Flat 402, Glenmark Residency"
                  value={profile.flatAndSociety}
                  onChange={(e) =>
                    setProfile({ ...profile, flatAndSociety: e.target.value })
                  }
                  className="w-full rounded-xl border border-[#E6DEC8] px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#D95326] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Thane Pincode (400601–400608)
                </label>
                <select
                  value={profile.pincode}
                  onChange={(e) =>
                    setProfile({ ...profile, pincode: e.target.value })
                  }
                  className="w-full rounded-xl border border-[#E6DEC8] bg-white px-3 py-2.5 text-sm font-bold text-stone-900 focus:border-[#D95326] focus:outline-none"
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
                Morning 6–8 AM Silent Drop Preference
              </label>
              <select
                value={profile.dropPreference}
                onChange={(e) =>
                  setProfile({ ...profile, dropPreference: e.target.value })
                }
                className="w-full rounded-xl border border-[#E6DEC8] bg-[#FAF6F0] px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#D95326] focus:outline-none"
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
              className="w-full rounded-2xl bg-[#D95326] hover:bg-[#BA421B] py-3.5 text-sm font-bold text-white shadow-sm transition cursor-pointer"
            >
              Save Account Preferences
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}