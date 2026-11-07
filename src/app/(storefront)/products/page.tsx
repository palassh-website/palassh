"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  X,
  Scale,
  Zap,
  Lock,
  Calendar,
} from "lucide-react";
import { FeatureBoundary } from "@/components/shared/FeatureBoundary";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import {
  FlowerProduct,
  INITIAL_FLOWERS,
  CartItem,
  getActiveFlowersCatalog,
  getStoredCart,
  saveStoredCart,
  getCurrentCustomerTier,
  getEarliestDeliveryDateString,
  getSubscriberAddonWindow,
  buildDirectFlowerCheckoutUrl,
  buildPlanCheckoutUrl,
} from "@/features/catalog/types";

export default function AllProductsPage() {
  const router = useRouter();
  const [flowers, setFlowers] = useState<FlowerProduct[]>(INITIAL_FLOWERS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedWeightByFlower, setSelectedWeightByFlower] = useState<
    Record<string, 100 | 150>
  >({});
  const [customerTier, setCustomerTier] = useState<
    "NORMAL" | "ONE_DAY" | "WEEKLY" | "MONTHLY"
  >("NORMAL");

  const earliestBufferDate = getEarliestDeliveryDateString();
  const [scheduledDates, setScheduledDates] = useState<string[]>([]);
  const [selectedAddonDate, setSelectedAddonDate] =
    useState<string>(earliestBufferDate);

  const [popupToast, setPopupToast] = useState<{
    visible: boolean;
    isError?: boolean;
    title: string;
    subtitle: string;
  }>({ visible: false, title: "", subtitle: "" });
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const syncAll = () => {
      setFlowers(getActiveFlowersCatalog());
      setCart(getStoredCart());
      setCustomerTier(getCurrentCustomerTier());

      try {
        const savedSub = localStorage.getItem("palassh_active_subscription");
        if (savedSub) {
          const parsed = JSON.parse(savedSub);
          if (Array.isArray(parsed?.calendarDays)) {
            const activeDates = parsed.calendarDays
              .filter((d: { status: string }) => d.status === "SCHEDULED")
              .map((d: { dateStr: string }) => d.dateStr)
              .sort();
            setScheduledDates(activeDates);
            const win = getSubscriberAddonWindow({
              scheduledDatesSorted: activeDates,
              earliestBufferDate,
            });
            if (win.eligibleDates[0]) {
              setSelectedAddonDate(win.eligibleDates[0]);
            }
          }
        }
      } catch {
        // Ignore
      }
    };
    syncAll();

    fetch("/api/orders", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.authenticated && data?.customer?.activeTier) {
          setCustomerTier(data.customer.activeTier);
        }
        if (
          data?.activeSubscription &&
          Array.isArray(data.activeSubscription.calendarDays)
        ) {
          const activeDates = data.activeSubscription.calendarDays
            .filter((d: { status: string }) => d.status === "SCHEDULED")
            .map((d: { dateStr: string }) => d.dateStr)
            .sort();
          setScheduledDates(activeDates);
          const win = getSubscriberAddonWindow({
            scheduledDatesSorted: activeDates,
            earliestBufferDate,
          });
          if (win.eligibleDates[0]) {
            setSelectedAddonDate(win.eligibleDates[0]);
          }
        }
      })
      .catch(() => {});

    window.addEventListener("palassh-cart-updated", syncAll);
    window.addEventListener("storage", syncAll);
    return () => {
      window.removeEventListener("palassh-cart-updated", syncAll);
      window.removeEventListener("storage", syncAll);
    };
  }, [earliestBufferDate]);

  const isWeeklyOrMonthly =
    customerTier === "WEEKLY" || customerTier === "MONTHLY";
  const addonWindow = getSubscriberAddonWindow({
    scheduledDatesSorted: scheduledDates,
    earliestBufferDate,
  });

  const handleSelectSingleDailyAddon = (
    flower: FlowerProduct,
    redirectToCheckout: boolean
  ) => {
    if (!isWeeklyOrMonthly) {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      setPopupToast({
        visible: true,
        isError: true,
        title: "Weekly & Monthly Subscribers Only",
        subtitle:
          "Only active Weekly & Monthly Plan subscribers can order 100g/150g loose flower Add-Ons.",
      });
      toastTimerRef.current = setTimeout(
        () => setPopupToast((prev) => ({ ...prev, visible: false })),
        5000
      );
      return;
    }

    if (scheduledDates.length > 0 && !addonWindow.canBookAnyAddon) {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      setPopupToast({
        visible: true,
        isError: true,
        title: "Add-On Window Closed (Last Day Rule)",
        subtitle:
          addonWindow.blockReason ||
          "Add-Ons cannot be booked during the last day of your plan.",
      });
      toastTimerRef.current = setTimeout(
        () => setPopupToast((prev) => ({ ...prev, visible: false })),
        5500
      );
      return;
    }

    const selectedGrams: 100 | 150 =
      selectedWeightByFlower[flower.id] === 150 ? 150 : 100;
    const weightObj =
      flower.availableWeights.find((w) => w.grams === selectedGrams) || {
        grams: selectedGrams,
        price: selectedGrams === 150 ? 55 : 45,
      };

    // Strict Rule: Only 1 single 100g or 150g Add-On pack allowed per day (replaces any previous item in basket)
    const singleItemCart: CartItem[] = [
      {
        id: `${flower.id}-${selectedGrams}`,
        flowerId: flower.id,
        flowerName: flower.name,
        marathiName: flower.marathiName,
        imageUrl: flower.imageUrl,
        weightLabel: `${selectedGrams}g`,
        grams: selectedGrams,
        unitPrice: weightObj.price,
        quantity: 1,
        addonDeliveryDate: selectedAddonDate,
      },
    ];

    setCart(singleItemCart);
    saveStoredCart(singleItemCart);

    if (redirectToCheckout) {
      router.push(
        `/checkout?mode=onetime&date=${encodeURIComponent(selectedAddonDate)}`
      );
      return;
    }

    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setPopupToast({
      visible: true,
      isError: false,
      title: `${selectedGrams}g ${flower.name} (${flower.marathiName}) Selected!`,
      subtitle: `Daily Add-On for ${selectedAddonDate} (6:00 AM – 8:00 AM). Limit: 1 Pack (100g or 150g) per day.`,
    });
    toastTimerRef.current = setTimeout(
      () => setPopupToast((prev) => ({ ...prev, visible: false })),
      4500
    );
  };

  const totalCartGrams = cart.reduce((acc, i) => acc + (i.grams || 100), 0);
  const totalCartAmount = cart.reduce((acc, i) => acc + i.unitPrice, 0);

  return (
    <FeatureBoundary featureName="ALL_PRODUCTS">
      <div className="min-h-screen w-full overflow-x-hidden bg-[#FAF6F0] py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
        {popupToast.visible && (
          <div
            className={`animate-toast-in fixed top-24 right-3 left-3 sm:left-auto sm:right-6 z-50 sm:max-w-sm rounded-2xl border-2 p-4 text-white shadow-2xl transition-all ${
              popupToast.isError
                ? "border-rose-400 bg-rose-950"
                : "border-[#D95326] bg-[#1C1917]"
            }`}
          >
            <div className="flex items-start gap-3">
              {popupToast.isError ? (
                <AlertCircle className="h-5 w-5 text-rose-300 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-[#D95326] shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-serif text-sm font-bold text-[#F5D0A9]">
                  {popupToast.title}
                </p>
                <p className="mt-1 text-xs text-stone-200 leading-relaxed">
                  {popupToast.subtitle}
                </p>
                {!popupToast.isError && (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/checkout?mode=onetime&date=${encodeURIComponent(
                            selectedAddonDate
                          )}`
                        )
                      }
                      className="rounded-lg bg-[#D95326] px-3 py-1.5 text-[11px] font-bold text-white cursor-pointer"
                    >
                      Checkout Add-On ({totalCartGrams}g)
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
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#E6DEC8] pb-8">
            <div className="space-y-2 max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#F3ECE1] border border-[#E6DEC8] px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-[#D95326]">
                <Sparkles className="h-3.5 w-3.5" />
                <span>
                  Weekly & Monthly Subscriber Add-On Store (100g & 150g)
                </span>
              </span>
              <h1 className="font-serif text-3xl sm:text-5xl font-bold text-stone-900">
                Daily Loose Flower Add-Ons
              </h1>
              <p className="text-xs sm:text-sm text-stone-600">
                Active{" "}
                <strong className="text-stone-900">
                  Weekly & Monthly Plan subscribers
                </strong>{" "}
                can order <strong className="text-[#D95326]">100 gms</strong> or{" "}
                <strong className="text-[#D95326]">150 gms</strong> additional
                loose flowers per day (with 1-day farm buffer, up to 1 day
                before plan ends).
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(new Event("palassh-open-cart"))
              }
              className="inline-flex items-center justify-center gap-3 rounded-2xl bg-stone-900 px-6 py-4 text-xs font-bold text-white shadow-md hover:bg-[#D95326] transition cursor-pointer shrink-0"
            >
              <ShoppingBag className="h-4 w-4 text-[#F5D0A9]" />
              <span>
                Selected Add-On ({totalCartGrams}g • ₹{totalCartAmount})
              </span>
            </button>
          </div>

          {/* Subscriber Eligibility & Date Selector Banner */}
          {!isWeeklyOrMonthly ? (
            <div className="rounded-3xl border border-[#D95326] bg-[#FFF3EC] p-6 text-stone-900 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <Lock className="h-6 w-6 text-[#D95326] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-serif text-lg sm:text-xl font-bold text-[#D95326]">
                    Weekly & Monthly Subscribers Only — Add-On Store Locked
                  </p>
                  <p className="text-xs sm:text-sm text-stone-600">
                    Additional 100g & 150g loose flower Add-Ons are available
                    exclusively while an active Weekly (7-Day) or Monthly
                    (30-Day) Plan is running. Already subscribed? Sync your
                    account in My Orders!
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => router.push(buildPlanCheckoutUrl("plan-weekly"))}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#D95326] hover:bg-[#BA421B] px-6 py-3.5 text-xs font-bold text-white shadow-sm transition cursor-pointer"
                >
                  <span>Subscribe to Weekly / Monthly Plan</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <Link
                  href="/my-orders"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#E6DEC8] bg-white px-5 py-3.5 text-xs font-bold text-stone-800 hover:border-[#D95326]"
                >
                  <span>Sync My Orders</span>
                </Link>
              </div>
            </div>
          ) : scheduledDates.length > 0 && !addonWindow.canBookAnyAddon ? (
            <div className="rounded-3xl border border-rose-300 bg-rose-50 p-6 text-rose-950 shadow-xs flex items-start gap-3.5">
              <Lock className="h-6 w-6 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-serif text-lg font-bold text-rose-900">
                  Final 1 Day Lockout — Add-On Window Closed for Current Plan
                </p>
                <p className="text-xs sm:text-sm text-rose-800">
                  {addonWindow.blockReason}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-[#E6DEC8] bg-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF3EC] text-[#D95326]">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-stone-900">
                    Active {customerTier} Subscriber • Select Add-On Delivery
                    Date:
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Next Morning Delivery Avilable • Final day of your plan (
                    {addonWindow.lockedLastTwoDates.join(", ") || "last day"}
                    ) are automatically excluded.
                  </p>
                </div>
              </div>

              {addonWindow.eligibleDates.length > 0 && (
                <select
                  value={selectedAddonDate}
                  onChange={(e) => setSelectedAddonDate(e.target.value)}
                  className="rounded-xl border border-[#D95326] bg-[#FFF3EC] px-4 py-2.5 text-xs font-bold text-stone-900 focus:outline-none"
                >
                  {addonWindow.eligibleDates.map((dt) => (
                    <option key={dt} value={dt}>
                      Deliver on {dt} (6:00 AM – 8:00 AM)
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* All Flowers Grid (Strictly 100g & 150g Selector) */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {flowers.map((flower, idx) => {
              const selectedGrams: 100 | 150 =
                selectedWeightByFlower[flower.id] === 150 ? 150 : 100;
              const price100 =
                flower.availableWeights.find((w) => w.grams === 100)?.price ||
                45;
              const price150 =
                flower.availableWeights.find((w) => w.grams === 150)?.price ||
                55;
              const currentPrice = selectedGrams === 150 ? price150 : price100;
              const existingInCart = cart.find((c) => c.flowerId === flower.id);
              const isLocked =
                !isWeeklyOrMonthly ||
                (scheduledDates.length > 0 && !addonWindow.canBookAnyAddon);

              return (
                <ScrollReveal key={flower.id} delayMs={(idx % 3) * 100}>
                  <div className="flex flex-col justify-between h-full overflow-hidden rounded-[2rem] border border-[#E6DEC8] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-[#D95326]/60">
                    <div>
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F3ECE1]">
                        <img
                          src={flower.imageUrl}
                          alt={flower.name}
                          width={800}
                          height={600}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/75 via-transparent to-transparent" />

                        <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3.5 py-1 text-[11px] font-bold text-stone-900 shadow-2xs flex items-center gap-1.5">
                          {isLocked && (
                            <Lock className="h-3 w-3 text-[#D95326]" />
                          )}
                          <span>
                            {!flower.inStock
                              ? "Out of Stock"
                              : isLocked
                              ? "Weekly/Monthly Only"
                              : "100g / 150g Add-On"}
                          </span>
                        </span>

                        {existingInCart && (
                          <span className="absolute right-4 top-4 rounded-full bg-[#D95326] px-3 py-1 text-[11px] font-bold text-white shadow-2xs">
                            Selected: {existingInCart.grams}g
                          </span>
                        )}

                        <div className="absolute bottom-3.5 left-4 right-4 flex items-center justify-between text-white">
                          <span className="text-xs font-medium text-stone-200">
                            {flower.deityAffinity}
                          </span>
                          <span className="rounded-lg bg-stone-900/80 backdrop-blur-md px-3 py-1 text-xs font-bold text-[#F5D0A9] border border-white/15">
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
                            <span className="rounded-md bg-[#FAF6F0] border border-[#E6DEC8] px-2.5 py-0.5 text-xs font-semibold text-stone-700">
                              {flower.marathiName}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-stone-500">
                            {flower.subtitle}
                          </p>
                        </div>

                        {/* Strictly 100g OR 150g Daily Add-On Weight Selector */}
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2">
                            Select Daily Add-On Weight (Max 1 Pack / Day):
                          </label>
                          <div className="grid grid-cols-2 gap-2.5">
                            {[
                              { grams: 100 as const, price: price100 },
                              { grams: 150 as const, price: price150 },
                            ].map((wt) => {
                              const active = selectedGrams === wt.grams;
                              return (
                                <button
                                  key={wt.grams}
                                  type="button"
                                  onClick={() =>
                                    setSelectedWeightByFlower((prev) => ({
                                      ...prev,
                                      [flower.id]: wt.grams,
                                    }))
                                  }
                                  className={`rounded-xl border py-2.5 px-2 text-center transition cursor-pointer ${
                                    active
                                      ? "border-[#D95326] bg-[#FFF3EC] font-bold text-stone-900"
                                      : "border-[#E6DEC8] bg-[#FAF6F0] text-stone-600 hover:border-[#D95326]"
                                  }`}
                                >
                                  <span className="block text-xs font-bold">
                                    {wt.grams} gms
                                  </span>
                                  <span className="block text-xs font-semibold text-[#D95326]">
                                    ₹{wt.price}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

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
                      ) : isLocked ? (
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              buildDirectFlowerCheckoutUrl({
                                flower,
                                grams: selectedGrams,
                              })
                            )
                          }
                          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FAF6F0] border border-[#E6DEC8] hover:border-[#D95326] py-4 text-xs font-bold text-stone-800 hover:text-[#D95326] transition cursor-pointer"
                        >
                          <ShoppingBag className="h-4 w-4 text-[#D95326]" />
                          <span>
                            {isWeeklyOrMonthly
                              ? `Add-Ons Closed • Renew with ${selectedGrams}g`
                              : `Subscribe & Order ${selectedGrams}g`}
                          </span>
                        </button>
                      ) : (
                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() =>
                              handleSelectSingleDailyAddon(flower, false)
                            }
                            className="flex items-center justify-center gap-1.5 rounded-2xl border border-stone-900 bg-white py-3.5 px-3 text-xs font-bold text-stone-900 transition hover:bg-stone-900 hover:text-white cursor-pointer"
                          >
                            <ShoppingBag className="h-3.5 w-3.5 text-[#D95326] shrink-0" />
                            <span>Select {selectedGrams}g</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleSelectSingleDailyAddon(flower, true)
                            }
                            className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#D95326] hover:bg-[#BA421B] py-3.5 px-3 text-xs font-bold text-white shadow-xs transition cursor-pointer"
                          >
                            <Zap className="h-3.5 w-3.5 shrink-0" />
                            <span>Book Add-On ₹{currentPrice}</span>
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