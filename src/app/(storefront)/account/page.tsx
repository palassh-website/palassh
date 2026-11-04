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
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import {
  CustomerTier,
  getCurrentCustomerTier,
  getFestiveModeStatus,
} from "@/features/catalog/types";
import { SERVICEABLE_PINCODES } from "@/features/pincode-checker/pincode.service";

export default function MyAccountPage() {
  const [profile, setProfile] = useState({
    fullName: "",
    phone: "",
    email: "",
    flatWing: "",
    societyName: "",
    pincode: "400605",
    dropPreference: "Hang pouch on main door handle (Do not ring bell)",
  });

  const [tier, setTier] = useState<CustomerTier>("NORMAL");
  const [festive, setFestive] = useState({
    isFestiveDay: false,
    festivalName: "Festive Puja",
  });
  const [savedToast, setSavedToast] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
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
        const parsed = JSON.parse(savedProfile);
        setProfile((prev) => ({
          ...prev,
          ...parsed,
        }));
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
            flatWing: c.flatWing || "",
            societyName: c.societyName || "",
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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsSaving(true);

    try {
      const res = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: profile.fullName,
          flatWing: profile.flatWing,
          societyName: profile.societyName,
          pincode: profile.pincode,
          deliveryNote: profile.dropPreference,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(
          data.error || "Could not save preferences. Please try again."
        );
        setIsSaving(false);
        return;
      }

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

      window.dispatchEvent(new Event("palassh-store-access-updated"));

      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      setSavedToast(
        "Your doorstep profile & delivery preferences have been permanently updated!"
      );
      toastTimerRef.current = setTimeout(() => setSavedToast(""), 4000);
    } catch {
      setErrorMessage(
        "Network error while saving profile. Please check your internet connection."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const isWeeklyOrMonthly = tier === "WEEKLY" || tier === "MONTHLY";

  return (
    <div className="min-h-screen bg-[#FAF6F0] py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E6DEC8] pb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#D95326]">
              Personal Profile & Member Status
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
              My PALASSH Account
            </h1>
            <p className="text-xs sm:text-sm text-stone-600">
              Manage your Thane doorstep address, morning drop note, and plan membership status.
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

        {errorMessage && (
          <div className="flex items-center gap-2.5 rounded-2xl border border-rose-300 bg-rose-50 px-5 py-3.5 text-sm font-bold text-rose-800 shadow-2xs">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
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
                    ? "Monthly Plan Subscriber: You enjoy unlocked access to 100g or 150g daily loose flower Add-On packs for any scheduled morning."
                    : tier === "WEEKLY"
                    ? "Weekly Plan Subscriber: You enjoy unlocked access to 100g or 150g daily loose flower Add-On packs for any scheduled morning."
                    : tier === "ONE_DAY"
                    ? "1-Day Trial Member: Loose flower Add-On packs are reserved for active Weekly and Monthly subscribers. Upgrade to Weekly or Monthly anytime to unlock daily Add-Ons."
                    : "Non-Subscriber / Plan Ended: You have no active subscription running. Choose a Weekly or Monthly Plan to unlock member morning deliveries & loose flower Add-On shopping."}
                </p>
              </div>

              <div className="rounded-2xl bg-white/5 p-4 text-xs space-y-2 border border-white/10">
                <div className="flex justify-between">
                  <span className="text-stone-400">Loose Flower Store:</span>
                  <span
                    className={`font-bold ${
                      isWeeklyOrMonthly ? "text-[#F5D0A9]" : "text-stone-400"
                    }`}
                  >
                    {isWeeklyOrMonthly
                      ? "Unlocked (Active Subscriber)"
                      : tier === "ONE_DAY"
                      ? "Locked (Weekly / Monthly Only)"
                      : "Locked (Plan Required)"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Your Max Order Quota:</span>
                  <span className="font-bold text-white">
                    {isWeeklyOrMonthly
                      ? "100g / 150g Daily Add-On Pack"
                      : tier === "ONE_DAY"
                      ? "0g (Trial Pack Active)"
                      : "0g (No Active Plan)"}
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
                  <span>Choose a Weekly or Monthly Plan to Activate</span>
                </Link>
              )}

              {tier === "ONE_DAY" && (
                <Link
                  href="/#plans"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#D95326] hover:bg-[#BA421B] py-3.5 text-xs font-bold text-white shadow-sm transition"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Upgrade to Weekly or Monthly to Unlock Add-Ons</span>
                </Link>
              )}

              {isWeeklyOrMonthly && (
                <Link
                  href="/products"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#D95326] hover:bg-[#BA421B] py-3.5 text-xs font-bold text-white shadow-sm transition"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                  <span>Shop Member Add-On Flowers</span>
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
                  Full Name *
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-stone-700">
                    WhatsApp Mobile
                  </label>
                  <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-500">
                    <ShieldCheck className="h-3 w-3 text-[#D95326]" />
                    Locked (Security)
                  </span>
                </div>
                <input
                  type="text"
                  disabled
                  readOnly
                  value={profile.phone}
                  className="w-full rounded-xl border border-stone-200 bg-stone-100 px-3.5 py-2.5 text-sm font-medium text-stone-500 cursor-not-allowed select-none"
                />
                <p className="mt-1 text-[11px] text-stone-400">
                  Phone is permanently bound to your verified OTP account.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Flat No. & Wing *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. B-1204"
                  value={profile.flatWing}
                  onChange={(e) =>
                    setProfile({ ...profile, flatWing: e.target.value })
                  }
                  className="w-full rounded-xl border border-[#E6DEC8] px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#D95326] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Building / Society Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hiranandani Estate, Thane West"
                  value={profile.societyName}
                  onChange={(e) =>
                    setProfile({ ...profile, societyName: e.target.value })
                  }
                  className="w-full rounded-xl border border-[#E6DEC8] px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#D95326] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Thane Pincode (400601–400608) *
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

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Drop Note
              </label>
              <input
                type="text"
                value={profile.dropPreference}
                onChange={(e) =>
                  setProfile({ ...profile, dropPreference: e.target.value })
                }
                placeholder="e.g. Hang pouch on main door handle (Do not ring bell)"
                className="w-full rounded-xl border border-[#E6DEC8] bg-white px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#D95326] focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-stone-500">
                Directly linked with checkout drop instructions and followed by your 6:00 AM – 8:00 AM delivery rider.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full rounded-2xl bg-[#D95326] hover:bg-[#BA421B] py-3.5 text-sm font-bold text-white shadow-sm transition cursor-pointer disabled:opacity-60"
            >
              {isSaving ? "Saving Preferences..." : "Save Account Preferences"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
