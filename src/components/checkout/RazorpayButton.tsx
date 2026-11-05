"use client";

import React, { useState } from "react";

interface RazorpayButtonProps {
  amountInPaise?: number; // e.g. 100 paise = ₹1, 4900 paise = ₹49
  currency?: string;
  notes?: Record<string, string>;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  buttonText?: string;
  className?: string;
  onSuccess?: (data: {
    order_id: string;
    payment_id: string;
    signature: string;
  }) => void;
  onError?: (error: string) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on?: (event: string, handler: (response: any) => void) => void;
    };
  }
}

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function RazorpayButton({
  amountInPaise = 5000, // ₹50 default
  currency = "INR",
  notes,
  prefill = {
    name: "Devotee",
    email: "care@palassh.in",
    contact: "9820000000",
  },
  buttonText,
  className,
  onSuccess,
  onError,
}: RazorpayButtonProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleCheckout = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // 1. Ensure Razorpay checkout.js script is loaded
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error(
          "Could not load Razorpay SDK. Please check your internet connection."
        );
      }

      // 2. Call backend /api/create-order
      const createOrderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountInPaise,
          currency,
          receipt: `rcpt_${Date.now()}`,
          notes,
        }),
      });

      const orderData = await createOrderRes.json();

      if (!createOrderRes.ok || !orderData.order_id) {
        throw new Error(orderData.error || "Failed to create Razorpay order.");
      }

      // 3. Open Razorpay Standard Checkout Modal
      const razorpayKey =
        orderData.key_id ||
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      if (!razorpayKey) {
        throw new Error("Razorpay Key ID is not configured on the client.");
      }

      const options = {
        key: razorpayKey,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "PALASSH Flowers",
        description: `Order #${orderData.order_id}`,
        order_id: orderData.order_id,
        prefill: {
          name: prefill.name || "",
          email: prefill.email || "",
          contact: prefill.contact || "",
        },
        theme: {
          color: "#E8502B",
        },
        handler: async function (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) {
          try {
            // 4. Send payment credentials to backend /api/verify-payment
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(
                verifyData.error || "Payment signature verification failed."
              );
            }

            setSuccessMsg(
              `Payment verified successfully! Payment ID: ${response.razorpay_payment_id}`
            );
            if (onSuccess) {
              onSuccess({
                order_id: response.razorpay_order_id,
                payment_id: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              });
            }
          } catch (err: any) {
            const msg = err?.message || "Verification failed.";
            setErrorMsg(msg);
            if (onError) onError(msg);
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            setErrorMsg("Payment cancelled by user.");
            if (onError) onError("Payment cancelled by user.");
          },
        },
      };

      const rzpInstance = new window.Razorpay(options);

      // Handle payment failure event
      rzpInstance.on?.("payment.failed", function (response: any) {
        setLoading(false);
        const failureReason =
          response?.error?.description ||
          response?.error?.reason ||
          "Payment failed or was declined.";
        setErrorMsg(failureReason);
        if (onError) onError(failureReason);
      });

      rzpInstance.open();
    } catch (err: any) {
      setLoading(false);
      const msg = err?.message || "An unexpected error occurred.";
      setErrorMsg(msg);
      if (onError) onError(msg);
    }
  };

  const displayAmount = (amountInPaise / 100).toFixed(0);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading}
        className={
          className ||
          "inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#E8502B] to-[#D94824] px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:brightness-110 active:scale-95 disabled:opacity-60 cursor-pointer"
        }
      >
        {loading ? (
          <span>Connecting to Razorpay...</span>
        ) : (
          <span>
            {buttonText || `Pay ₹${displayAmount} with Razorpay`}
          </span>
        )}
      </button>

      {errorMsg && (
        <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2.5">
          ⚠️ {errorMsg}
        </p>
      )}

      {successMsg && (
        <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
          ✅ {successMsg}
        </p>
      )}
    </div>
  );
}

