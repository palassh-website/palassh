"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { RazorpayButton } from "@/components/checkout/RazorpayButton";

export default function CheckoutDemoPage() {
  const [selectedAmount, setSelectedAmount] = useState<number>(4900); // 4900 paise = ₹49
  const [customRupees, setCustomRupees] = useState<string>("49");
  const [paymentResult, setPaymentResult] = useState<{
    order_id: string;
    payment_id: string;
    signature: string;
  } | null>(null);

  const presets = [
    { label: "₹1 (100 paise - Min test)", paise: 100 },
    { label: "₹49 (One Day Pack)", paise: 4900 },
    { label: "₹329 (Weekly Pack)", paise: 32900 },
    { label: "₹1,350 (Monthly Pack)", paise: 135000 },
  ];

  const handleCustomChange = (val: string) => {
    setCustomRupees(val);
    const num = Number(val);
    if (!isNaN(num) && num > 0) {
      setSelectedAmount(Math.round(num * 100));
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-stone-600 hover:text-[#E8502B]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>

        <div className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8 shadow-xl space-y-6">
          <div className="border-b border-stone-100 pb-4 space-y-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950 px-3 py-1 text-[11px] font-bold text-amber-300">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Razorpay Standard Checkout Test</span>
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
              Test Razorpay Payment
            </h1>
            <p className="text-xs text-stone-500">
              Connected to Test Key: <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-800">rzp_test_Tuuzgr0wvYWHqj</code>
            </p>
          </div>

          {/* Amount Presets */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
              Choose Test Amount
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {presets.map((p) => (
                <button
                  key={p.paise}
                  type="button"
                  onClick={() => {
                    setSelectedAmount(p.paise);
                    setCustomRupees(String(p.paise / 100));
                  }}
                  className={`rounded-xl border p-3 text-left text-xs font-semibold transition ${
                    selectedAmount === p.paise
                      ? "border-[#E8502B] bg-orange-50/50 text-[#E8502B]"
                      : "border-stone-200 bg-white text-stone-700 hover:border-stone-400"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="pt-2">
              <label className="block text-xs text-stone-500 mb-1">
                Or enter custom amount in ₹ (Rupees):
              </label>
              <input
                type="number"
                min="1"
                value={customRupees}
                onChange={(e) => handleCustomChange(e.target.value)}
                className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-sm text-stone-900 focus:border-[#E8502B] focus:outline-none"
                placeholder="Amount in ₹"
              />
            </div>
          </div>

          {/* Payment Button */}
          <div className="pt-2 border-t border-stone-100">
            <RazorpayButton
              amountInPaise={selectedAmount}
              currency="INR"
              prefill={{
                name: "PALASSH Devotee",
                email: "care@palassh.in",
                contact: "9820000000",
              }}
              buttonText={`Pay ₹${(selectedAmount / 100).toFixed(0)} with Razorpay`}
              onSuccess={(res) => {
                setPaymentResult(res);
              }}
              onError={(err) => {
                console.error("Payment error:", err);
              }}
            />
          </div>

          {/* Result details if verified */}
          {paymentResult && (
            <div className="rounded-2xl border border-emerald-300 bg-emerald-50/70 p-4 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-emerald-900">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Verified Payment Details</span>
              </div>
              <p className="text-emerald-800">
                <strong>Razorpay Order ID:</strong> {paymentResult.order_id}
              </p>
              <p className="text-emerald-800">
                <strong>Razorpay Payment ID:</strong> {paymentResult.payment_id}
              </p>
              <p className="text-emerald-800 truncate">
                <strong>HMAC-SHA256 Signature:</strong> {paymentResult.signature}
              </p>
            </div>
          )}

          {/* Architecture Checklist */}
          <div className="rounded-xl border border-stone-100 bg-stone-50 p-4 text-[11px] text-stone-600 space-y-1">
            <p className="font-semibold text-stone-800">Verification Steps Executed:</p>
            <p>1. <code>POST /api/create-order</code> creates Razorpay order (min 100 paise)</p>
            <p>2. Razorpay Standard Web Checkout Modal opens with <code>order_id</code></p>
            <p>3. On success, <code>POST /api/verify-payment</code> verifies HMAC-SHA256 signature with <code>KEY_SECRET</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}

