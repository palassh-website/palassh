"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Flower2, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { FeatureBoundary } from "@/components/shared/FeatureBoundary";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@palassh.in");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        router.push("/admin");
        router.refresh();
        return;
      }

      const data = await res.json().catch(() => ({}));
      setError(
        data.error ||
          "Invalid admin credentials. Please check your password and try again."
      );
    } catch {
      setError("Network error while connecting to PALASSH auth server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <FeatureBoundary featureName="ADMIN_LOGIN">
      <div className="min-h-screen bg-[#071C15] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Ambient Saffron & Gold Glow */}
        <div className="pointer-events-none absolute -top-24 left-1/4 h-96 w-96 rounded-full bg-[#E8502B]/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-10 right-1/4 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl" />

        <div className="relative mx-auto w-full max-w-md">
          <div className="text-center space-y-2">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-emerald-950/90 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-300">
              <Flower2 className="h-3.5 w-3.5 text-[#F05A36]" />
              <span>PALASSH Operations Concierge</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white">
              Admin Portal Login
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/75">
              Manage 6:00 AM – 8:00 AM Dispatch, Flower Catalog & Subscription
              Pricing
            </p>
          </div>

          <div className="mt-8 rounded-[2rem] border border-emerald-800/80 bg-[#FAF7F2] p-8 shadow-2xl">
            {error && (
              <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-800">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  Admin Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 focus:border-[#E8502B] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  Admin Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 focus:border-[#E8502B] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#E8502B] via-[#F05A36] to-[#D97706] py-4 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition hover:brightness-105 cursor-pointer"
              >
                <Lock className="h-4 w-4" />
                <span>
                  {loading ? "Verifying Credentials..." : "Sign In to Admin Desk"}
                </span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-6 border-t border-stone-200 pt-4 flex items-center justify-between text-xs text-stone-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-700" />
                Protected by Edge JWT
              </span>
              <Link
                href="/"
                className="font-bold text-[#E8502B] hover:underline"
              >
                ← Back to Storefront
              </Link>
            </div>
          </div>
        </div>
      </div>
    </FeatureBoundary>
  );
}   