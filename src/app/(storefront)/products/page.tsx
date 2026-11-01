"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Flame,
  X,
  Scale,
  Zap,
  Lock,
} from "lucide-react";
import { FeatureBoundary } from "@/components/shared/FeatureBoundary";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import {
  FlowerProduct,
  INITIAL_FLOWERS,
  INITIAL_PLANS,
  SubscriptionPlan,
  CartItem,
  getActiveFlowersCatalog,
  getActivePlansCatalog,
  getStoredCart,
  saveStoredCart,
  getCurrentCustomerTier,
  getFestiveModeStatus,
  getNormalPurchaseAllowed,
  validateDirectFlowerPurchaseLimit,
} from "@/features/catalog/types";

export default function AllProductsPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<SubscriptionPlan[]>(INITIAL_PLANS);
  const [flowers, setFlowers] = useState<FlowerProduct[]>(INITIAL_FLOWERS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedWeightIdxByFlower, setSelectedWeightIdxByFlower] = useState<
    Record<string, number>
  >({});

  const [customerTier, setCustomerTier] = useState<
    "NORMAL" | "ONE_DAY" | "WEEKLY" | "MONTHLY"
  >("NORMAL");
  const [festiveStatus, setFestiveStatus] = useState({
    isFestiveDay: false,
    festivalName: "Festive Puja",
  });
  const [normalPurchaseAllowed, setNormalPurchaseAllowed] = useState(true);

  const [popupToast, setPopupToast] = useState<{
    visible: boolean;
    isError?: boolean;
    title: string;
    subtitle: string;
  }>({ visible: false, title: "", subtitle: "" });

  useEffect(() => {
    const syncAll = () => {
      setPlans(getActivePlansCatalog());
      setFlowers(getActiveFlowersCatalog());
      setCart(getStoredCart());
      setCustomerTier(getCurrentCustomerTier());
      setFestiveStatus(getFestiveModeStatus());
      setNormalPurchaseAllowed(getNormalPurchaseAllowed());
    };
    syncAll();
    window.addEventListener("palassh-cart-updated", syncAll);
    window.addEventListener("palassh-festive-updated", syncAll);
    window.addEventListener("palassh-plans-updated", syncAll);
    window.addEventListener("palassh-store-access-updated", syncAll);
    window.addEventListener("storage", syncAll);
    return () => {
      window.removeEventListener("palassh-cart-updated", syncAll);
      window.removeEventListener("palassh-festive-updated", syncAll);
      window.removeEventListener("palassh-plans-updated", syncAll);
      window.removeEventListener("palassh-store-access-updated", syncAll);
      window.removeEventListener("storage", syncAll);
    };
  }, []);

  const addOrReplaceFlowerInCart = (
    flower: FlowerProduct,
    redirectToCheckout: boolean
  ) => {
    const weightIdx = selectedWeightIdxByFlower[flower.id] || 0;
    const weightObj =
      flower.availableWeights[weightIdx] || flower.availableWeights[0];
    const selectedGrams = weightObj.grams || 100;

    const otherFlowersGrams = cart
      .filter((item) => item.flowerId !== flower.id)
      .reduce((acc, i) => acc + (i.grams || 100), 0);

    const tier = getCurrentCustomerTier();
    const festive = getFestiveModeStatus();

    const validation = validateDirectFlowerPurchaseLimit(
      otherFlowersGrams,
      selectedGrams,
      tier,
      festive.isFestiveDay
    );

    if (!validation.allowed) {
      setPopupToast({
        visible: true,
        isError: true,
        title: "Purchase Restricted / Quota Limit",
        subtitle: validation.reason || "Limit exceeded.",
      });
      setTimeout(
        () => setPopupToast((prev) => ({ ...prev, visible: false })),
        5500
      );
      return;
    }

    const updatedCart = cart.filter((item) => item.flowerId !== flower.id);
    updatedCart.push({
      id: `${flower.id}-${selectedGrams}`,
      flowerId: flower.id,
      flowerName: flower.name,
      marathiName: flower.marathiName,
      imageUrl: flower.imageUrl,
      weightLabel: `${selectedGrams}g`,
      grams: selectedGrams,
      unitPrice: weightObj.price,
      quantity: 1,
    });

    setCart(updatedCart);
    saveStoredCart(updatedCart);

    if (redirectToCheckout) {
      router.push("/checkout?mode=onetime");
      return;
    }

    const newTotalGrams = otherFlowersGrams + selectedGrams;
    setPopupToast({
      visible: true,
      isError: false,
      title: `${flower.name} (${flower.marathiName}) — ${selectedGrams}g Added!`,
      subtitle: `Combined Basket Weight: ${newTotalGrams}g • Morning 6:00 AM – 8:00 AM Slot`,
    });
    setTimeout(
      () => setPopupToast((prev) => ({ ...prev, visible: false })),
      4000
    );
  };

  const totalCartGrams = cart.reduce((acc, i) => acc + (i.grams || 100), 0);
  const totalCartAmount = cart.reduce((acc, i) => acc + i.unitPrice, 0);
  const isNormalUser =
    customerTier === "NORMAL" || customerTier === "ONE_DAY";
  const isNormalLockedOnFestive =
    festiveStatus.isFestiveDay && isNormalUser;
  const isNormalPurchaseBlocked =
    !normalPurchaseAllowed && isNormalUser;

  return (
    <FeatureBoundary featureName="ALL_PRODUCTS">
      <div className="min-h-screen w-full overflow-x-hidden bg-[#FAF7F2] py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
        {/* POPUP NOTIFICATION TOAST */}
        {popupToast.visible && (
          <div
            className={`fixed top-24 right-3 left-3 sm:left-auto sm:right-6 z-50 sm:max-w-sm rounded-2xl border-2 p-4 text-white shadow-2xl transition-all ${
              popupToast.isError
                ? "border-rose-400 bg-rose-950"
                : "border-amber-400 bg-[#071C15]"
            }`}
          >
            <div className="flex items-start gap-3">
              {popupToast.isError ? (
                <AlertCircle className="h-5 w-5 text-rose-300 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-amber-300 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-serif text-sm font-bold">
                  {popupToast.title}
                </p>
                <p className="mt-1 text-xs text-stone-200 leading-relaxed">
                  {popupToast.subtitle}
                </p>
                {!popupToast.isError && (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPopupToast((prev) => ({ ...prev, visible: false }));
                        window.dispatchEvent(new Event("palassh-open-cart"));
                      }}
                      className="rounded-lg bg-gradient-to-r from-[#E8502B] to-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white cursor-pointer"
                    >
                      Open Cart ({totalCartGrams}g)
                    </button>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() =>
                  setPopupToast((prev) => ({ ...prev, visible: false }))
                }
                className="text-stone-300 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <div className="mx-auto max-w-7xl space-y-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-orange-200/70 pb-8">
            <div className="space-y-2 max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#071C15] px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-amber-300">
                <Sparkles className="h-3.5 w-3.5 text-[#F05A36]" />
                <span>Thane Farm-to-Mandir Catalog (400601–400608)</span>
              </span>
              <h1 className="font-serif text-3xl sm:text-5xl font-bold text-stone-900">
                All Sacred Puja Flowers
              </h1>
              <p className="text-xs sm:text-sm text-stone-600">
                Select your exact weight in grams (<strong className="text-stone-900">100g, 250g, 500g, 1000g</strong>) and either Add to Cart or click <strong className="text-[#E8502B]">Buy Now</strong> for instant checkout.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(new Event("palassh-open-cart"))
              }
              className="inline-flex items-center justify-center gap-3 rounded-2xl bg-[#071C15] px-6 py-4 text-xs font-bold text-amber-200 shadow-xl hover:bg-emerald-950 cursor-pointer shrink-0"
            >
              <ShoppingBag className="h-4 w-4 text-[#F05A36]" />
              <span>
                Flower Basket ({cart.length} • {totalCartGrams}g • ₹
                {totalCartAmount})
              </span>
            </button>
          </div>

          {/* Festive Day Strict Lock Banner */}
          {festiveStatus.isFestiveDay && (
            <div
              className={`rounded-3xl border-2 p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                isNormalLockedOnFestive
                  ? "border-rose-400 bg-rose-950 text-white"
                  : "border-amber-400 bg-[#071C15] text-white"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <Flame className="h-6 w-6 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-serif text-lg sm:text-xl font-bold text-amber-200">
                    {isNormalLockedOnFestive
                      ? "🔒 Festive Day Lock Active — Subscribers Only"
                      : `✨ Festive Quota Unlocked (${customerTier} Member)`}
                  </p>
                  <p className="text-xs sm:text-sm text-stone-200">
                    {isNormalLockedOnFestive
                      ? "Direct flower purchases are locked for non-subscribers on Festive Days so our Weekly (up to 2 KG) and Monthly (up to 3 KG) members receive guaranteed morning blooms."
                      : `Your active ${customerTier} subscription entitles you to book up to ${
                          customerTier === "MONTHLY" ? "3 KG (3000g)" : "2 KG (2000g)"
                        } combined across all flowers!`}
                  </p>
                </div>
              </div>
              {isNormalLockedOnFestive && (
                <Link
                  href="/#plans"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#E8502B] to-emerald-600 px-6 py-3.5 text-xs font-bold text-white shadow-lg shrink-0"
                >
                  {(() => {
                    const weeklyPrice = plans.find((p) => p.id === "plan-weekly")?.price || 329;
                    const monthlyPrice = (
                      plans.find((p) => p.id === "plan-monthly")?.price || 1350
                    ).toLocaleString("en-IN");
                    return <span>Subscribe to Weekly (₹{weeklyPrice}) / Monthly (₹{monthlyPrice})</span>;
                  })()}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          )}

          {/* Non-Subscriber Purchases Paused Banner */}
          {!festiveStatus.isFestiveDay && isNormalPurchaseBlocked && (
            <div className="rounded-3xl border-2 border-amber-500/70 bg-[#071C15] p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <Lock className="h-6 w-6 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-serif text-lg sm:text-xl font-bold text-amber-200">
                    🔒 Subscriber-Exclusive Orders Active
                  </p>
                  <p className="text-xs sm:text-sm text-stone-200">
                    Loose flower purchases are currently open exclusively to Weekly and Monthly subscribers. Please choose a subscription plan to unlock fresh morning deliveries.
                  </p>
                </div>
              </div>
              <Link
                href="/#plans"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#E8502B] to-amber-500 px-6 py-3.5 text-xs font-bold text-white shadow-lg shrink-0 hover:brightness-110"
              >
                <span>View Subscription Plans</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}

          {!festiveStatus.isFestiveDay && !isNormalUser && !normalPurchaseAllowed && (
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-[#071C15] px-4 py-2 text-xs font-bold text-emerald-200">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Subscriber Access Active ({customerTier}): Your member quota is unlocked for direct flower orders.</span>
            </div>
          )}

          {/* All Flowers Grid */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {flowers.map((flower, idx) => {
              const selectedIdx = selectedWeightIdxByFlower[flower.id] || 0;
              const selectedWeight =
                flower.availableWeights[selectedIdx] ||
                flower.availableWeights[0];
              const existingInCart = cart.find(
                (c) => c.flowerId === flower.id
              );

              return (
                <ScrollReveal key={flower.id} delayMs={(idx % 3) * 110}>
                  <div className="flex flex-col justify-between h-full overflow-hidden rounded-[2.2rem] border border-stone-200/90 bg-white shadow-[0_16px_40px_-12px_rgba(28,22,19,0.08)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_22px_45px_-12px_rgba(28,22,19,0.14)] hover:border-[#E8502B]/60">
                    <div>
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
                        <img
                          src={flower.imageUrl}
                          alt={flower.name}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#071C15]/85 via-transparent to-transparent" />
                        <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3.5 py-1 text-[11px] font-bold text-emerald-950 shadow-sm flex items-center gap-1.5">
                          {(isNormalPurchaseBlocked || isNormalLockedOnFestive) && (
                            <Lock className="h-3 w-3 text-[#E8502B]" />
                          )}
                          <span>
                            {!flower.inStock
                              ? "Out of Stock"
                              : isNormalPurchaseBlocked || isNormalLockedOnFestive
                              ? "Subscribers Only"
                              : "Fresh Farm Stock"}
                          </span>
                        </span>
                        {existingInCart && (
                          <span className="absolute right-4 top-4 rounded-full bg-[#E8502B] px-3 py-1 text-[11px] font-bold text-white shadow-sm">
                            In Cart: {existingInCart.grams}g
                          </span>
                        )}
                        <div className="absolute bottom-3.5 left-4 right-4 flex items-center justify-between text-white">
                          <span className="text-xs font-medium text-emerald-100">
                            {flower.deityAffinity}
                          </span>
                          <span className="rounded-lg bg-black/50 backdrop-blur-md px-3 py-1 text-xs font-bold text-amber-300 border border-white/15">
                            6:00 – 8:00 AM
                          </span>
                        </div>
                      </div>

                      <div className="p-6 space-y-4">
                        <div>
                          <div className="flex items-baseline gap-2.5">
                            <h2 className="font-serif text-2xl font-bold text-stone-900">
                              {flower.name}
                            </h2>
                            <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-900">
                              {flower.marathiName}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-stone-500">
                            {flower.subtitle}
                          </p>
                        </div>

                        {/* Strictly Grams Selector Only */}
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2">
                            Select Weight (Grams Only):
                          </label>
                          <div className="grid grid-cols-4 gap-2">
                            {flower.availableWeights.map((wt, wIdx) => {
                              const active = selectedIdx === wIdx;
                              return (
                                <button
                                  key={wt.grams}
                                  type="button"
                                  onClick={() =>
                                    setSelectedWeightIdxByFlower((prev) => ({
                                      ...prev,
                                      [flower.id]: wIdx,
                                    }))
                                  }
                                  className={`rounded-xl border py-2.5 px-1 text-center transition cursor-pointer ${
                                    active
                                      ? "border-2 border-[#E8502B] bg-orange-50/70 font-bold text-stone-900"
                                      : "border-stone-200 bg-[#FAF7F2] text-stone-600 hover:border-orange-300"
                                  }`}
                                >
                                  <span className="block text-xs font-bold">
                                    {wt.grams}g
                                  </span>
                                  <span className="block text-[11px] font-semibold text-[#E8502B]">
                                    ₹{wt.price}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Dual Action Buttons: 1. Add to Cart + 2. Buy Now (Direct Checkout) OR Subscribe CTA */}
                    <div className="px-6 pb-6 pt-2">
                      {!flower.inStock ? (
                        <button
                          type="button"
                          disabled
                          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-200 py-4 text-xs font-bold text-stone-500 cursor-not-allowed"
                        >
                          <Scale className="h-4 w-4" />
                          <span>Currently Out of Stock</span>
                        </button>
                      ) : isNormalLockedOnFestive ? (
                        <Link
                          href="/#plans"
                          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-stone-900 via-[#071C15] to-emerald-950 border border-amber-400/50 py-4 text-xs font-bold text-amber-300 shadow-md hover:brightness-110 transition cursor-pointer"
                          title="Locked on Festive Day • Click to view Subscription Plans"
                        >
                          <Lock className="h-4 w-4 text-amber-300" />
                          <span>Locked on Festive Day • View Plans</span>
                        </Link>
                      ) : isNormalPurchaseBlocked ? (
                        <Link
                          href="/#plans"
                          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#E8502B] via-[#F05A36] to-amber-600 py-4 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition hover:brightness-110 cursor-pointer"
                          title="Locked for Non-Subscribers • Click to view Subscription Plans"
                        >
                          <Lock className="h-4 w-4" />
                          <span>Subscribe to Order Flowers</span>
                        </Link>
                      ) : (
                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() =>
                              addOrReplaceFlowerInCart(flower, false)
                            }
                            className="flex items-center justify-center gap-1.5 rounded-2xl border-2 border-[#071C15] bg-white py-3.5 px-3 text-xs font-bold text-[#071C15] transition hover:bg-[#071C15] hover:text-amber-200 cursor-pointer"
                          >
                            <ShoppingBag className="h-3.5 w-3.5 text-[#E8502B] shrink-0" />
                            <span>Add {selectedWeight.grams}g</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              addOrReplaceFlowerInCart(flower, true)
                            }
                            className="flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-[#E8502B] via-[#F05A36] to-emerald-600 py-3.5 px-3 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition hover:brightness-110 cursor-pointer"
                          >
                            <Zap className="h-3.5 w-3.5 shrink-0" />
                            <span>Buy Now • ₹{selectedWeight.price}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </div>
    </FeatureBoundary>
  );
}