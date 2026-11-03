"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Lock,
  Sparkles,
  Mail,
} from "lucide-react";
import {
  INITIAL_PLANS,
  SubscriptionPlan,
  CartItem,
  PlanWeightGrams,
  PlanProductVariant,
  getActivePlanVariants,
  getAvailableWeightsForVariants,
  resolvePlanVariantPricing,
  getStoredCart,
  saveStoredCart,
  getCurrentCustomerTier,
  getEarliestDeliveryDateString,
  getActivePlansCatalog,
  getSubscriberAddonWindow,
} from "@/features/catalog/types";
import { checkPincodeAvailability } from "@/features/pincode-checker/pincode.service";
import { FeatureBoundary } from "@/components/shared/FeatureBoundary";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on?: (event: string, handler: (response: any) => void) => void;
    };
  }
}

function loadRazorpayScript(): Promise<boolean> {
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

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const modeParam = searchParams.get("mode");
  const planSlugParam = searchParams.get("plan");
  const dateParam = searchParams.get("date");
  const weightParam = Number(searchParams.get("weight")) || 100;
  const variantIdParam =
    searchParams.get("variantId") || "prod-mixed-marigold";

  const isOneTimeCartCheckout = modeParam === "onetime";

  const [plansList, setPlansList] = useState<SubscriptionPlan[]>(INITIAL_PLANS);
  const [variantsList, setVariantsList] = useState<PlanProductVariant[]>(() =>
    getActivePlanVariants()
  );

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(() => {
    return (
      INITIAL_PLANS.find(
        (p) =>
          p.slug === planSlugParam ||
          p.id === planSlugParam ||
          (planSlugParam === "one-day-puja-pack" && p.billingCycle === "day") ||
          (planSlugParam === "weekly-devotion-pack" &&
            p.billingCycle === "week") ||
          (planSlugParam === "monthly-sacred-assortment" &&
            p.billingCycle === "month")
      ) || INITIAL_PLANS[2]
    );
  });

  const [selectedWeightGrams, setSelectedWeightGrams] =
    useState<PlanWeightGrams>(weightParam);
  const [selectedVariantId, setSelectedVariantId] =
    useState<string>(variantIdParam);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [subScheduledDates, setSubScheduledDates] = useState<string[]>([]);
  const earliestDeliveryDate = getEarliestDeliveryDateString();

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    pincode: "",
    flatWing: "",
    societyName: "",
    startDate:
      dateParam && dateParam >= earliestDeliveryDate
        ? dateParam
        : earliestDeliveryDate,
    deliveryNote: "",
  });

  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [otpNotice, setOtpNotice] = useState("");

  const [pincodeStatus, setPincodeStatus] = useState<{
    checked: boolean;
    serviceable: boolean;
    message: string;
  }>({ checked: false, serviceable: false, message: "" });

  const [isProcessing, setIsProcessing] = useState(false);
  const [formError, setFormError] = useState("");
  const errorRef = useRef<HTMLDivElement | null>(null);
  const [customerTier, setCustomerTier] = useState("NORMAL");

  useEffect(() => {
    if (formError && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [formError]);

  useEffect(() => {
    const syncCheckout = () => {
      const activePlans = getActivePlansCatalog();
      setPlansList(activePlans);
      setVariantsList(getActivePlanVariants());
      const matched = activePlans.find(
        (p) =>
          p.slug === planSlugParam ||
          p.id === planSlugParam ||
          (planSlugParam === "one-day-puja-pack" && p.billingCycle === "day") ||
          (planSlugParam === "weekly-devotion-pack" &&
            p.billingCycle === "week") ||
          (planSlugParam === "monthly-sacred-assortment" &&
            p.billingCycle === "month")
      );
      if (matched) setSelectedPlan(matched);
      const stored = getStoredCart();
      setCartItems(stored);
      if (stored[0]?.addonDeliveryDate && !dateParam) {
        setFormData((prev) => ({
          ...prev,
          startDate: stored[0].addonDeliveryDate || earliestDeliveryDate,
        }));
      }
      setCustomerTier(getCurrentCustomerTier());
    };
    syncCheckout();

    fetch("/api/orders", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.authenticated && data?.customer) {
          const c = data.customer;
          setFormData((prev) => ({
            ...prev,
            fullName: prev.fullName || c.fullName || "",
            phone: prev.phone || c.phone || "",
            email: prev.email || c.email || "",
            pincode: prev.pincode || c.pincode || "",
            flatWing: prev.flatWing || c.flatWing || "",
            societyName: prev.societyName || c.societyName || "",
            deliveryNote: prev.deliveryNote || c.deliveryNote || "",
          }));
          if (c.activeTier) {
            setCustomerTier(c.activeTier);
          }
          if (
            data.activeSubscription &&
            Array.isArray(data.activeSubscription.calendarDays)
          ) {
            const activeDates = data.activeSubscription.calendarDays
              .filter((d: { status: string }) => d.status === "SCHEDULED")
              .map((d: { dateStr: string }) => d.dateStr)
              .sort();
            setSubScheduledDates(activeDates);
            if (isOneTimeCartCheckout && !dateParam) {
              const win = getSubscriberAddonWindow({
                scheduledDatesSorted: activeDates,
                earliestBufferDate: earliestDeliveryDate,
              });
              if (win.eligibleDates[0]) {
                setFormData((prev) => ({
                  ...prev,
                  startDate: win.eligibleDates[0],
                }));
              }
            }
          }
          if (c.email && c.phone) {
            setIsEmailVerified(true);
            setOtpNotice(
              `Verified session active for ${c.email} (+91 ${c.phone}).`
            );
          }
          if (c.pincode) {
            const res = checkPincodeAvailability(c.pincode);
            setPincodeStatus({
              checked: true,
              serviceable: res.serviceable,
              message: res.message,
            });
          }
        }
      })
      .catch(() => {});

    window.addEventListener("palassh-plans-updated", syncCheckout);
    window.addEventListener("storage", syncCheckout);
    return () => {
      window.removeEventListener("palassh-plans-updated", syncCheckout);
      window.removeEventListener("storage", syncCheckout);
    };
  }, [planSlugParam, dateParam, earliestDeliveryDate, isOneTimeCartCheckout]);

  const resolvedPlanSelection = resolvePlanVariantPricing({
    planId: selectedPlan.id,
    billingCycle: selectedPlan.billingCycle,
    weightGrams: selectedWeightGrams,
    productVariantIdOrName: selectedVariantId,
    customDeliveriesCount: selectedPlan.deliveriesCount,
    variantsList,
  });

  const availableWeights = getAvailableWeightsForVariants(variantsList);
  const addonWindow = getSubscriberAddonWindow({
    scheduledDatesSorted: subScheduledDates,
    earliestBufferDate: earliestDeliveryDate,
  });

  const handlePincodeChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 6);
    setFormData((prev) => ({ ...prev, pincode: cleaned }));

    if (cleaned.length === 6) {
      const res = checkPincodeAvailability(cleaned);
      setPincodeStatus({
        checked: true,
        serviceable: res.serviceable,
        message: res.message,
      });
    } else {
      setPincodeStatus({ checked: false, serviceable: false, message: "" });
    }
  };

  const handleSendEmailVerification = async () => {
    setFormError("");
    const cleanedPhone = formData.phone.replace(/\D/g, "");
    if (!formData.email.includes("@") || cleanedPhone.length !== 10) {
      setFormError(
        "Please enter a valid 10-digit WhatsApp number and Email address first to receive your verification code."
      );
      return;
    }

    setIsSendingOtp(true);
    setOtpNotice("Sending 6-digit verification code to your email...");

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose: "CHECKOUT_VERIFY",
          email: formData.email.trim(),
          phone: cleanedPhone,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setFormError(
          data.error ||
            "Could not send verification email. Please verify your email address."
        );
        setOtpNotice("");
        return;
      }

      setOtpSent(true);
      setOtpNotice(
        data.devOtpHint
          ? `Code sent to ${formData.email} (Local Dev Fallback OTP: ${data.devOtpHint})`
          : `6-digit verification code sent to ${formData.email} (Links with +91 ${cleanedPhone}).`
      );
    } catch {
      setFormError("Network error while sending verification email.");
      setOtpNotice("");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyEmailCode = async () => {
    setFormError("");
    if (otpCode.trim().length !== 6) {
      setFormError(
        "Please enter the 6-digit verification code sent to your email."
      );
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email.trim(),
          phone: formData.phone.replace(/\D/g, ""),
          fullName: formData.fullName.trim() || "PALASSH Devotee",
          code: otpCode.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setFormError(
          data.error || "Invalid verification code. Please check your email."
        );
        return;
      }

      setIsEmailVerified(true);
      setOtpSent(false);
      setFormError("");
      if (data.customer?.activeTier) {
        setCustomerTier(data.customer.activeTier);
      }
      setOtpNotice(
        `Verified! ${formData.email} is now permanently linked with +91 ${formData.phone}.`
      );
    } catch {
      setFormError("Network error while verifying OTP code.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const totalCartGrams = cartItems.reduce(
    (acc, i) => acc + (i.grams || 100),
    0
  );
  const totalCartAmount = cartItems.reduce((acc, i) => acc + i.unitPrice, 0);

  const lockedFlowerLabel = `${resolvedPlanSelection.weightGrams}g ${resolvedPlanSelection.variant.name} (${resolvedPlanSelection.variant.marathiName})`;

  const finalizeVerifiedOrderOnServer = async (paymentPayload: {
    razorpayOrderId: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
  }) => {
    const deliveryInstruction =
      formData.deliveryNote.trim() ||
      "Hang pouch on main door handle (Do not ring bell)";

    const verifyRes = await fetch("/api/checkout/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderType: isOneTimeCartCheckout ? "ONE_TIME" : "SUBSCRIPTION",
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        fullName: formData.fullName.trim(),
        flatWing: formData.flatWing.trim(),
        societyName: formData.societyName.trim(),
        pincode: formData.pincode.trim(),
        startDate: formData.startDate,
        deliveryNote: deliveryInstruction,
        planId: selectedPlan.id,
        planSlug: selectedPlan.slug,
        weightGrams: resolvedPlanSelection.weightGrams,
        productVariantId: resolvedPlanSelection.variant.id,
        defaultFlowers: lockedFlowerLabel,
        cartItems: cartItems.slice(0, 1).map((c) => ({
          flowerId: c.flowerId,
          grams: c.grams,
        })),
        ...paymentPayload,
      }),
    });

    const verifyData = await verifyRes.json();
    if (!verifyRes.ok || !verifyData.success) {
      setFormError(verifyData.error || "Failed to confirm order in database.");
      setIsProcessing(false);
      return;
    }

    if (isOneTimeCartCheckout && verifyData.oneTimeOrder) {
      const ord = verifyData.oneTimeOrder;
      const localRecord = {
        orderId: ord.orderId,
        orderType: "ONE_TIME",
        flowerSummary: ord.flowerSummary,
        totalGrams: ord.totalGrams,
        amountPaid: ord.amountPaid,
        deliveryDate: ord.deliveryDate,
        deliverySlot: "6:00 AM – 8:00 AM",
        customerName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: ord.addressSnapshot,
        deliveryNote: ord.deliveryNote,
        status: ord.status,
        createdAt: ord.createdAt,
      };
      try {
        const existingRaw = localStorage.getItem("palassh_onetime_orders");
        const existing = existingRaw ? JSON.parse(existingRaw) : [];
        localStorage.setItem(
          "palassh_onetime_orders",
          JSON.stringify([localRecord, ...existing])
        );
        saveStoredCart([]);
      } catch {
        // Ignore
      }
      router.push("/my-orders?tab=onetime");
      return;
    }

    if (verifyData.subscription) {
      const sub = verifyData.subscription;
      const localSub = {
        id: sub.id,
        orderId: sub.orderId,
        planId: sub.planId,
        planTitle: sub.planTitle,
        pricePaid: sub.pricePaid,
        billingCycle: sub.billingCycle,
        totalDeliveries: sub.totalDeliveries,
        remainingDeliveries: sub.remainingDeliveries,
        maxPausesAllowed: sub.maxPausesAllowed,
        pausesUsedCount: sub.pausesUsedCount,
        status: sub.status,
        startDate: sub.startDate,
        deliverySlot: "6:00 AM – 8:00 AM",
        defaultFlowers: sub.defaultFlowers,
        customerName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: sub.addressSnapshot,
        deliveryNote: sub.deliveryNote,
        calendarDays: Array.isArray(sub.scheduleDays)
          ? sub.scheduleDays.map(
              (d: {
                deliveryDate: string;
                dayNumber: number;
                status: string;
                orderNote?: string;
              }) => ({
                dateStr: d.deliveryDate,
                dayNumber: d.dayNumber,
                status: d.status,
                orderNote: d.orderNote || "",
              })
            )
          : [],
      };
      try {
        localStorage.setItem(
          "palassh_active_subscription",
          JSON.stringify(localSub)
        );
      } catch {
        // Ignore
      }
    }

    router.push("/my-orders?tab=subscription");
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (
      !formData.fullName.trim() ||
      formData.phone.length < 10 ||
      !formData.email.includes("@")
    ) {
      setFormError(
        "Please enter your Full Name, 10-digit WhatsApp Number, and Email Address."
      );
      return;
    }

    if (!isEmailVerified) {
      setFormError(
        "Please verify your Email & Phone number using the 'Send Verification Code' button before completing checkout."
      );
      return;
    }

    if (formData.startDate < earliestDeliveryDate) {
      setFormError(
        `1-Day Farm Buffer Required: Earliest morning delivery available is ${earliestDeliveryDate} (6:00 AM – 8:00 AM).`
      );
      return;
    }

    const pinCheck = checkPincodeAvailability(formData.pincode);
    if (!pinCheck.serviceable) {
      setFormError(
        "We currently deliver only to Thane pincodes 400601 to 400608."
      );
      return;
    }

    if (!formData.flatWing.trim() || !formData.societyName.trim()) {
      setFormError(
        "Please enter your Flat/Wing and Building/Society Name for morning drop."
      );
      return;
    }

    if (isOneTimeCartCheckout) {
      if (customerTier !== "WEEKLY" && customerTier !== "MONTHLY") {
        setFormError(
          "Weekly & Monthly Subscribers Only: Only active Weekly and Monthly subscribers can order 100g/150g loose flower Add-Ons."
        );
        return;
      }
      if (
        subScheduledDates.length > 0 &&
        addonWindow.lockedLastTwoDates.includes(formData.startDate)
      ) {
        setFormError(
          `Final 2 Days Lockout: ${formData.startDate} is within the final 2 delivery days of your subscription. Add-Ons are not allowed on the last 2 days.`
        );
        return;
      }
    }

    setIsProcessing(true);

    try {
      const createRes = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderType: isOneTimeCartCheckout ? "ONE_TIME" : "SUBSCRIPTION",
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          pincode: formData.pincode.trim(),
          startDate: formData.startDate,
          planId: selectedPlan.id,
          planSlug: selectedPlan.slug,
          weightGrams: resolvedPlanSelection.weightGrams,
          productVariantId: resolvedPlanSelection.variant.id,
          defaultFlowers: lockedFlowerLabel,
          cartItems: cartItems.slice(0, 1).map((c) => ({
            flowerId: c.flowerId,
            grams: c.grams,
          })),
        }),
      });

      const createData = await createRes.json();
      if (!createRes.ok || !createData.success) {
        setFormError(
          createData.error || "Could not initialize order on server."
        );
        setIsProcessing(false);
        return;
      }

      if (
        createData.paymentMode === "RAZORPAY_LIVE" &&
        createData.razorpayKeyId
      ) {
        const sdkLoaded = await loadRazorpayScript();
        if (!sdkLoaded || !window.Razorpay) {
          setFormError(
            "Could not load Razorpay payment gateway. Please check your internet connection."
          );
          setIsProcessing(false);
          return;
        }

        const rzp = new window.Razorpay({
          key: createData.razorpayKeyId,
          amount: createData.amountInPaise,
          currency: "INR",
          name: "PALASSH Flowers",
          description: isOneTimeCartCheckout
            ? `Subscriber Add-On (${totalCartGrams}g)`
            : `${selectedPlan.title} (${lockedFlowerLabel})`,
          order_id: createData.razorpayOrderId,
          prefill: {
            name: formData.fullName.trim(),
            email: formData.email.trim(),
            contact: formData.phone.trim(),
          },
          theme: { color: "#D95326" },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            await finalizeVerifiedOrderOnServer({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
          },
          modal: {
            ondismiss: () => {
              setIsProcessing(false);
            },
          },
        });

        rzp.open();
        return;
      }

      await finalizeVerifiedOrderOnServer({
        razorpayOrderId: createData.razorpayOrderId,
        razorpayPaymentId: `pay_sim_${Date.now()}`,
      });
    } catch {
      setFormError("Network error while processing your order.");
      setIsProcessing(false);
    }
  };

  const payableAmount = isOneTimeCartCheckout
    ? totalCartAmount
    : resolvedPlanSelection.price;

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#FAF6F0] py-10 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href={isOneTimeCartCheckout ? "/my-orders" : "/#plans"}
          className="inline-flex items-center gap-2 text-xs font-bold text-stone-600 hover:text-[#D95326] mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>
            {isOneTimeCartCheckout
              ? "Back to My Orders & Add-On Calendar"
              : "Back to Subscription Plans"}
          </span>
        </Link>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* LEFT COLUMN: Form */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl sm:rounded-[2.2rem] border border-[#E6DEC8] bg-white p-5 sm:p-10 shadow-lg space-y-6">
              <div className="border-b border-stone-100 pb-5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F3ECE1] border border-[#E6DEC8] px-3.5 py-1 text-[10px] font-bold uppercase tracking-widest text-[#D95326]">
                  <Sparkles className="h-3 w-3" />
                  <span>
                    {isOneTimeCartCheckout
                      ? "Subscriber Daily Add-On Checkout (100g / 150g)"
                      : "Sacred Plan Checkout (100g / 150g)"}
                  </span>
                </span>
                <h1 className="mt-3 font-serif text-2xl sm:text-4xl font-bold text-stone-900">
                  {isOneTimeCartCheckout
                    ? "Confirm Your 100g / 150g Flower Add-On"
                    : "Confirm Your Morning Flower Plan"}
                </h1>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-[#E6DEC8] bg-[#FAF6F0] p-4 text-stone-900">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-[#D95326] shrink-0" />
                  <div>
                    <p className="text-xs sm:text-sm font-bold">
                      6:00 AM – 8:00 AM (Morning Puja Window)
                    </p>
                    <p className="text-[11px] text-stone-600">
                      1-Day Farm Harvest Buffer • Earliest Date:{" "}
                      <strong>{earliestDeliveryDate}</strong>
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-[#D95326] px-3 py-1 text-[10px] font-bold uppercase text-white shrink-0">
                  6–8 AM Slot
                </span>
              </div>

              {!isOneTimeCartCheckout && (
                <div className="rounded-2xl border border-[#E6DEC8] bg-[#FAF6F0] p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                      Customize Plan, Weight & Flower Variety
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-400 line-through">
                        ₹{resolvedPlanSelection.mrp.toLocaleString("en-IN")}
                      </span>
                      <span className="text-xs font-bold text-[#D95326]">
                        ₹{resolvedPlanSelection.price.toLocaleString("en-IN")}{" "}
                        (Save {resolvedPlanSelection.discountPercent}%)
                      </span>
                    </div>
                  </div>

                  <div
                    className="grid gap-2"
                    style={{
                      gridTemplateColumns: `repeat(${Math.min(
                        plansList.length,
                        3
                      )}, minmax(0, 1fr))`,
                    }}
                  >
                    {plansList.map((pl) => {
                      const active = selectedPlan.id === pl.id;
                      return (
                        <button
                          key={pl.id}
                          type="button"
                          onClick={() => setSelectedPlan(pl)}
                          className={`rounded-xl border py-2.5 px-2 text-xs font-bold transition cursor-pointer ${
                            active
                              ? "border-[#D95326] bg-[#D95326] text-white"
                              : "border-[#E6DEC8] bg-white text-stone-700 hover:border-stone-400"
                          }`}
                        >
                          {pl.title}
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {availableWeights.map((wt) => {
                      const active = resolvedPlanSelection.weightGrams === wt;
                      return (
                        <button
                          key={wt}
                          type="button"
                          onClick={() => setSelectedWeightGrams(wt)}
                          className={`rounded-xl border py-2 text-xs font-bold transition cursor-pointer ${
                            active
                              ? "border-stone-900 bg-stone-900 text-white"
                              : "border-[#E6DEC8] bg-white text-stone-700"
                          }`}
                        >
                          {wt} gms Pouch
                        </button>
                      );
                    })}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      Select Flower Variety ({variantsList.length} Types):
                    </label>
                    <select
                      value={resolvedPlanSelection.variant.id}
                      onChange={(e) => setSelectedVariantId(e.target.value)}
                      className="w-full rounded-xl border border-[#E6DEC8] bg-white px-3.5 py-2.5 text-xs sm:text-sm font-bold text-stone-900 focus:border-[#D95326] focus:outline-none"
                    >
                      {variantsList.map((v) => {
                        const rowP = resolvePlanVariantPricing({
                          planId: selectedPlan.id,
                          billingCycle: selectedPlan.billingCycle,
                          weightGrams: resolvedPlanSelection.weightGrams,
                          productVariantIdOrName: v.id,
                          customDeliveriesCount: selectedPlan.deliveriesCount,
                          variantsList,
                        });
                        return (
                          <option key={v.id} value={v.id}>
                            {v.srNo}. {v.name} ({v.marathiName}) —{" "}
                            {resolvedPlanSelection.weightGrams}g @ ₹
                            {rowP.price.toLocaleString("en-IN")} (MRP ₹
                            {rowP.mrp.toLocaleString("en-IN")})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              )}

              <form onSubmit={handleCheckoutSubmit} className="space-y-5 pt-1">
                <h2 className="font-serif text-xl font-bold text-stone-900">
                  Devotee Contact & Email Verification
                </h2>

                {formError && (
                  <div
                    ref={errorRef}
                    role="alert"
                    aria-live="polite"
                    className="animate-fade-lift-in flex items-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800 shadow-2xs"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      placeholder="e.g. Snehal Deshmukh"
                      className="w-full rounded-xl border border-[#E6DEC8] bg-white px-3.5 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#D95326] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      WhatsApp Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={formData.phone}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          phone: e.target.value.replace(/\D/g, ""),
                        });
                        setIsEmailVerified(false);
                      }}
                      placeholder="e.g. 9820123456"
                      className="w-full rounded-xl border border-[#E6DEC8] bg-white px-3.5 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#D95326] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-[#E6DEC8] bg-[#FAF6F0] p-4 space-y-3">
                  <label className="block text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-[#D95326]" />
                    <span>
                      Email Address (Receives Plan/Add-On Confirmation Receipt) *
                    </span>
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        setIsEmailVerified(false);
                      }}
                      placeholder="e.g. snehal@gmail.com"
                      className="flex-1 rounded-xl border border-[#E6DEC8] bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#D95326] focus:outline-none"
                    />
                    {isEmailVerified ? (
                      <span className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#FFF3EC] border border-[#D95326] px-4 py-2.5 text-xs font-bold text-[#D95326] shrink-0">
                        <CheckCircle2 className="h-4 w-4 text-[#D95326]" />
                        Verified & Linked
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={isSendingOtp}
                        onClick={handleSendEmailVerification}
                        className="rounded-xl bg-stone-900 hover:bg-[#D95326] px-4 py-2.5 text-xs font-bold text-white transition cursor-pointer shrink-0 disabled:opacity-60"
                      >
                        {isSendingOtp
                          ? "Sending OTP..."
                          : otpSent
                          ? "Resend Code"
                          : "Send Verification Code"}
                      </button>
                    )}
                  </div>

                  {otpNotice && (
                    <p className="text-[11px] font-semibold text-stone-700">
                      {otpNotice}
                    </p>
                  )}

                  {otpSent && !isEmailVerified && (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) =>
                          setOtpCode(e.target.value.replace(/\D/g, ""))
                        }
                        placeholder="Enter 6-digit Email OTP"
                        className="w-48 rounded-xl border border-[#E6DEC8] bg-white px-3 py-2 text-xs font-bold tracking-widest text-stone-900"
                      />
                      <button
                        type="button"
                        disabled={isVerifyingOtp}
                        onClick={handleVerifyEmailCode}
                        className="rounded-xl bg-[#D95326] hover:bg-[#BA421B] px-4 py-2 text-xs font-bold text-white cursor-pointer disabled:opacity-60"
                      >
                        {isVerifyingOtp ? "Verifying..." : "Verify OTP"}
                      </button>
                    </div>
                  )}
                </div>

                <h2 className="font-serif text-xl font-bold text-stone-900 pt-2">
                  Thane Society & Doorstep Details
                </h2>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Pincode (400601 to 400608) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={formData.pincode}
                      onChange={(e) => handlePincodeChange(e.target.value)}
                      placeholder="e.g. 400607"
                      className="w-full rounded-xl border border-[#E6DEC8] bg-white px-3.5 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#D95326] focus:outline-none"
                    />
                    {pincodeStatus.checked && (
                      <p
                        className={`mt-1 text-[11px] font-semibold ${
                          pincodeStatus.serviceable
                            ? "text-[#D95326]"
                            : "text-rose-600"
                        }`}
                      >
                        {pincodeStatus.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Building / Society Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.societyName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          societyName: e.target.value,
                        })
                      }
                      placeholder="e.g. Hiranandani Estate, Thane West"
                      className="w-full rounded-xl border border-[#E6DEC8] bg-white px-3.5 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#D95326] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Flat No. & Wing *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.flatWing}
                      onChange={(e) =>
                        setFormData({ ...formData, flatWing: e.target.value })
                      }
                      placeholder="e.g. B-1204"
                      className="w-full rounded-xl border border-[#E6DEC8] bg-white px-3.5 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#D95326] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Silent Drop Instruction (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.deliveryNote}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          deliveryNote: e.target.value,
                        })
                      }
                      placeholder="e.g. Hang pouch on main door handle"
                      className="w-full rounded-xl border border-[#E6DEC8] bg-white px-3.5 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#D95326] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Delivery Date Picker: Enforces 1-Day Buffer + Excludes Last 2 Days of Plan for Add-Ons */}
                <div className="rounded-2xl border border-[#E6DEC8] bg-[#FAF6F0] p-4 space-y-2">
                  <label className="block text-xs font-bold text-stone-800">
                    {isOneTimeCartCheckout
                      ? "Select Add-On Delivery Date (Excludes Final 2 Days of Plan) *"
                      : "First Morning Delivery Date (6:00 AM – 8:00 AM) *"}
                  </label>
                  {isOneTimeCartCheckout &&
                  addonWindow.eligibleDates.length > 0 ? (
                    <select
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                      className="w-full max-w-xs rounded-xl border border-[#E6DEC8] bg-white px-3.5 py-2.5 text-sm font-bold text-stone-900 focus:border-[#D95326] focus:outline-none"
                    >
                      {addonWindow.eligibleDates.map((dt) => (
                        <option key={dt} value={dt}>
                          {dt} (6:00 AM – 8:00 AM)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="relative max-w-xs">
                      <Calendar className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#D95326]" />
                      <input
                        type="date"
                        required
                        min={earliestDeliveryDate}
                        max={
                          isOneTimeCartCheckout &&
                          addonWindow.maxAllowedAddonDate
                            ? addonWindow.maxAllowedAddonDate
                            : undefined
                        }
                        value={formData.startDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            startDate: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-[#E6DEC8] bg-white pl-10 pr-3.5 py-2.5 text-sm font-bold text-stone-900 focus:border-[#D95326] focus:outline-none"
                      />
                    </div>
                  )}
                  <p className="text-[11px] text-stone-500">
                    * 1-Day Farm Harvest Buffer Applied.{" "}
                    {isOneTimeCartCheckout
                      ? "Add-Ons cannot be booked on the final 2 delivery days of your subscription."
                      : "Your one-time confirmation email will include your First & Last delivery dates."}
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-200 space-y-4">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#D95326] hover:bg-[#BA421B] py-4 px-6 text-sm sm:text-base font-bold text-white shadow-md transition cursor-pointer disabled:opacity-60"
                  >
                    <Lock className="h-4 w-4" />
                    <span suppressHydrationWarning>
                      {isProcessing
                        ? "Processing Order..."
                        : `Pay ₹${payableAmount.toLocaleString(
                            "en-IN"
                          )} & Schedule 6–8 AM Delivery`}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN: Summary */}
          <div className="lg:col-span-5">
            <div className="sticky top-28 rounded-3xl sm:rounded-[2.2rem] border border-[#E6DEC8] bg-white p-6 sm:p-8 shadow-lg space-y-5">
              <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                <h2 className="font-serif text-xl font-bold text-stone-900">
                  Order Summary
                </h2>
                <span className="rounded-full bg-[#FAF6F0] border border-[#E6DEC8] px-3 py-1 text-xs font-bold text-[#D95326]">
                  Slot: 6:00 AM – 8:00 AM
                </span>
              </div>

              {isOneTimeCartCheckout ? (
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
                    Subscriber Daily Add-On (Max 1 Pack / Day)
                  </p>
                  {cartItems.slice(0, 1).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-sm border-b border-stone-100 pb-2"
                    >
                      <span>
                        + {item.flowerName} ({item.marathiName}) —{" "}
                        <strong>{item.grams}g</strong>
                      </span>
                      <span className="font-bold text-stone-900">
                        ₹{item.unitPrice}
                      </span>
                    </div>
                  ))}
                  <p className="text-xs text-stone-600">
                    Add-On Delivery Date: <strong>{formData.startDate}</strong>
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-xl font-bold text-stone-900">
                      {selectedPlan.title}
                    </h3>
                    <span className="rounded-lg bg-[#FFF3EC] border border-[#E6DEC8] px-2.5 py-1 text-xs font-bold text-[#D95326]">
                      {resolvedPlanSelection.weightGrams} gms / day
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">
                    {selectedPlan.deliveriesCount} Morning Deliveries • Starts{" "}
                    <strong>{formData.startDate}</strong> (1-Day Buffer Applied)
                  </p>
                  <div className="rounded-xl bg-[#FAF6F0] p-3.5 border border-[#E6DEC8] text-xs text-stone-700 space-y-1.5">
                    <p>
                      <strong>Selected Variety:</strong> {lockedFlowerLabel}
                    </p>
                    <p className="text-[11px] text-[#D95326] font-bold">
                      MRP: ~~₹
                      {resolvedPlanSelection.mrp.toLocaleString("en-IN")}~~ •
                      Offer: ₹
                      {resolvedPlanSelection.price.toLocaleString("en-IN")} (You
                      Save ₹{resolvedPlanSelection.savedAmount})
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2 border-t border-stone-100 pt-4 text-sm">
                <div className="flex justify-between text-stone-600">
                  <span>Morning 6:00 AM – 8:00 AM Delivery</span>
                  <span className="font-bold text-[#D95326]">FREE</span>
                </div>
                <div className="flex justify-between text-base font-bold text-stone-900 pt-2 border-t border-stone-100">
                  <span>Total Payable</span>
                  <span
                    suppressHydrationWarning
                    className="font-serif text-2xl text-[#D95326]"
                  >
                    ₹{payableAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => {
                  const formEl = document.querySelector("form");
                  if (formEl) formEl.requestSubmit();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 hover:bg-[#D95326] py-3.5 px-5 text-xs sm:text-sm font-bold text-white shadow-sm transition cursor-pointer disabled:opacity-60"
              >
                <Lock className="h-4 w-4" />
                <span suppressHydrationWarning>
                  {isProcessing
                    ? "Processing..."
                    : `Pay ₹${payableAmount.toLocaleString("en-IN")} Now`}
                </span>
              </button>

              <div className="rounded-2xl border border-[#E6DEC8] bg-[#FAF6F0] p-4 text-xs text-stone-700 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-stone-900">
                  <ShieldCheck className="h-4 w-4 text-[#D95326]" />
                  100% Farm-Fresh Thane Guarantee
                </p>
                <p className="text-stone-600">
                  Support & WhatsApp Desk: <strong>+91 91670 34671</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckoutSkeleton() {
  return (
    <div className="min-h-screen bg-[#FAF6F0] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 animate-pulse">
      <div className="mx-auto max-w-6xl">
        <div className="h-5 w-32 rounded-lg bg-stone-200/80 mb-6" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-3xl border border-[#E6DEC8] bg-white p-6 sm:p-8 space-y-5 shadow-xs">
              <div className="h-6 w-48 rounded-md bg-stone-200" />
              <div className="h-11 rounded-xl bg-stone-100" />
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-[#E6DEC8] bg-white p-6 sm:p-7 space-y-4 shadow-xs">
              <div className="h-6 w-36 rounded-md bg-stone-200" />
              <div className="h-12 rounded-2xl bg-stone-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <FeatureBoundary featureName="CHECKOUT">
      <Suspense fallback={<CheckoutSkeleton />}>
        <CheckoutContent />
      </Suspense>
    </FeatureBoundary>
  );
}