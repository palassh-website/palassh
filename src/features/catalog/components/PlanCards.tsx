"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Check,
  Flower2,
  ArrowUpRight,
  Clock,
  Scale,
  Eye,
  X,
  Sparkles,
  ShieldCheck,
  Tag,
} from "lucide-react";
import {
  INITIAL_PLANS,
  SubscriptionPlan,
  PLAN_PRODUCT_VARIANTS,
  PlanWeightGrams,
  PlanProductVariant,
  getActivePlanVariants,
  getAvailableWeightsForVariants,
  resolvePlanVariantPricing,
  getActivePlansCatalog,
} from "../types";
import { ScrollReveal } from "@/components/shared/ScrollReveal";

interface PlanSelectionState {
  weightGrams: PlanWeightGrams;
  productVariantId: string;
}

export function PlanCards({
  plans: propPlans,
}: {
  plans?: SubscriptionPlan[];
}) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>(
    propPlans || INITIAL_PLANS
  );
  const [variants, setVariants] = useState<PlanProductVariant[]>(
    PLAN_PRODUCT_VARIANTS
  );
  const [activeDetailPlan, setActiveDetailPlan] =
    useState<SubscriptionPlan | null>(null);

  const [selections, setSelections] = useState<
    Record<string, PlanSelectionState>
  >({
    "plan-daily": {
      weightGrams: 100,
      productVariantId: "prod-mixed-marigold",
    },
    "plan-weekly": {
      weightGrams: 100,
      productVariantId: "prod-mixed-marigold",
    },
    "plan-monthly": {
      weightGrams: 100,
      productVariantId: "prod-mixed-marigold",
    },
  });

  useEffect(() => {
    if (!activeDetailPlan) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveDetailPlan(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeDetailPlan]);

  useEffect(() => {
    const syncCatalog = () => {
      const latestPlans =
        propPlans && propPlans.length > 0
          ? propPlans
          : getActivePlansCatalog();
      const latestVariants = getActivePlanVariants();
      setPlans(latestPlans);
      setVariants(latestVariants);
    };
    syncCatalog();
    window.addEventListener("palassh-plans-updated", syncCatalog);
    window.addEventListener("storage", syncCatalog);
    return () => {
      window.removeEventListener("palassh-plans-updated", syncCatalog);
      window.removeEventListener("storage", syncCatalog);
    };
  }, [propPlans]);

  const availableWeights = getAvailableWeightsForVariants(variants);

  const setCardWeight = (planId: string, weightGrams: PlanWeightGrams) => {
    setSelections((prev) => ({
      ...prev,
      [planId]: {
        ...(prev[planId] || {
          weightGrams: 100,
          productVariantId:
            variants[0]?.id || "prod-mixed-marigold",
        }),
        weightGrams,
      },
    }));
  };

  const setAllCardsWeight = (weightGrams: PlanWeightGrams) => {
    setSelections((prev) => {
      const next: Record<string, PlanSelectionState> = { ...prev };
      plans.forEach((p) => {
        next[p.id] = {
          productVariantId:
            prev[p.id]?.productVariantId ||
            variants[0]?.id ||
            "prod-mixed-marigold",
          weightGrams,
        };
      });
      return next;
    });
  };

  const setCardProductVariant = (planId: string, productVariantId: string) => {
    setSelections((prev) => ({
      ...prev,
      [planId]: {
        weightGrams: prev[planId]?.weightGrams || 100,
        productVariantId,
      },
    }));
  };

  const buildCheckoutUrl = (plan: SubscriptionPlan) => {
    const sel = selections[plan.id] || {
      weightGrams: availableWeights[0] || 100,
      productVariantId: variants[0]?.id || "prod-mixed-marigold",
    };
    const resolved = resolvePlanVariantPricing({
      planId: plan.id,
      billingCycle: plan.billingCycle,
      weightGrams: sel.weightGrams,
      productVariantIdOrName: sel.productVariantId,
      customDeliveriesCount: plan.deliveriesCount,
      variantsList: variants,
    });

    const query = new URLSearchParams({
      plan: plan.slug,
      weight: String(resolved.weightGrams),
      variantId: resolved.variant.id,
      flowers: `${resolved.weightGrams}g ${resolved.variant.name} (${resolved.variant.marathiName})`,
    }).toString();
    return `/checkout?${query}`;
  };

  const currentGlobalWeight =
    selections[plans[0]?.id || "plan-monthly"]?.weightGrams ||
    availableWeights[0] ||
    100;

  return (
    <section
      id="plans"
      className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl"
    >
      <ScrollReveal>
        <div className="mx-auto max-w-3xl text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E6DEC8] bg-[#F3ECE1] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-stone-800">
            <Flower2 className="h-3.5 w-3.5 text-[#D95326]" />
            <span>
              Sacred Morning Subscriptions •{" "}
              {availableWeights.map((w) => `${w}g`).join(" & ")}
            </span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-stone-900">
            Choose Your Puja Plan & Flower Type
          </h2>
          <p className="text-sm sm:text-base text-stone-600 max-w-2xl mx-auto">
            Select your daily pouch weight (
            <strong className="text-stone-900">
              {availableWeights.map((w) => `${w} gms`).join(" / ")}
            </strong>
            ) and pick from{" "}
            <strong className="text-[#D95326]">
              {variants.length} sacred flower varieties
            </strong>{" "}
            with special member savings.
          </p>

          {/* Global Weight Switcher (Supports 100g, 150g + any custom weight Admin adds) */}
          <div className="pt-2 flex items-center justify-center">
            <div className="inline-flex flex-wrap items-center justify-center gap-1 rounded-2xl border border-[#E6DEC8] bg-white p-1.5 shadow-2xs">
              {availableWeights.map((wt) => (
                <button
                  key={wt}
                  type="button"
                  onClick={() => setAllCardsWeight(wt)}
                  className={`rounded-xl px-5 py-2.5 text-xs font-bold transition cursor-pointer ${
                    currentGlobalWeight === wt
                      ? "bg-[#D95326] text-white shadow-2xs"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  {wt} gms Pouch Plans
                </button>
              ))}
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Dynamic Grid of All Active Plans */}
      <div className="mt-12 sm:mt-14 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 lg:items-stretch">
        {plans.map((plan, idx) => {
          const isPopular = plan.isPopular;
          const sel = selections[plan.id] || {
            weightGrams: availableWeights[0] || 100,
            productVariantId: variants[0]?.id || "prod-mixed-marigold",
          };
          const resolved = resolvePlanVariantPricing({
            planId: plan.id,
            billingCycle: plan.billingCycle,
            weightGrams: sel.weightGrams,
            productVariantIdOrName: sel.productVariantId,
            customDeliveriesCount: plan.deliveriesCount,
            variantsList: variants,
          });

          return (
            <ScrollReveal key={plan.id} delayMs={idx * 110}>
              <div
                className={`group relative flex flex-col h-full overflow-hidden rounded-[2rem] transition-all duration-300 ${
                  isPopular
                    ? "border-2 border-[#D95326] bg-white text-stone-900 shadow-xl shadow-stone-900/10 lg:-translate-y-2"
                    : "border border-[#E6DEC8] bg-white text-stone-900 shadow-md shadow-stone-900/5 hover:border-[#D95326]/60 hover:shadow-lg"
                }`}
              >
                {isPopular && (
                  <div className="bg-[#D95326] py-2 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-white">
                    Most Popular • Best Value Plan
                  </div>
                )}

                {/* Image Showcase */}
                <div
                  onClick={() => setActiveDetailPlan(plan)}
                  className="relative aspect-16/9 w-full overflow-hidden bg-[#F3ECE1] cursor-pointer"
                >
                  <img
                    src={
                      plan.id === "plan-monthly" || plan.slug === "monthly-pack"
                        ? "/images/monthly.webp"
                        : resolved.variant.imageUrl || plan.imageUrl
                    }
                    alt={plan.title}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/75 via-stone-950/20 to-transparent" />

                  <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3.5 py-1 text-[11px] font-bold text-stone-900 shadow-2xs">
                    {plan.deliveriesCount}{" "}
                    {plan.deliveriesCount === 1 ? "Morning" : "Mornings"}
                  </span>

                  {/* Savings Discount Pill on Top Right */}
                  <span className="absolute right-4 top-4 rounded-full bg-[#D95326] px-3 py-1 text-[11px] font-bold text-white shadow-2xs flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    <span>Save {resolved.discountPercent}%</span>
                  </span>

                  <div className="absolute bottom-3.5 left-4 right-4 flex items-center justify-between text-white">
                    <div className="flex items-center gap-1.5 rounded-full bg-stone-900/80 backdrop-blur-md px-3 py-1 text-[11px] font-semibold border border-white/20">
                      <Scale className="h-3 w-3 text-[#F5D0A9]" />
                      <span>{resolved.weightGrams} gms / morning</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-stone-900/80 backdrop-blur-md px-3 py-1 text-[11px] font-semibold text-[#F5D0A9] border border-white/15">
                      <Clock className="h-3 w-3 text-[#F5D0A9]" />
                      <span>6:00 – 8:00 AM</span>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="flex flex-1 flex-col justify-between p-6 sm:p-7">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-serif text-2xl font-bold text-stone-900">
                        {plan.title}
                      </h3>
                      <p className="mt-1 text-xs text-stone-500 leading-relaxed">
                        {plan.subtitle}
                      </p>
                    </div>

                    {/* Step 1 on Card: Dynamic Weight Selector */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                        1. Select Daily Weight:
                      </label>
                      <div
                        className="grid gap-1.5 rounded-xl bg-[#FAF6F0] p-1 border border-[#E6DEC8]"
                        style={{
                          gridTemplateColumns: `repeat(${Math.min(
                            availableWeights.length,
                            4
                          )}, minmax(0, 1fr))`,
                        }}
                      >
                        {availableWeights.map((wt) => {
                          const active = resolved.weightGrams === wt;
                          return (
                            <button
                              key={wt}
                              type="button"
                              onClick={() => setCardWeight(plan.id, wt)}
                              className={`rounded-lg py-2 text-xs font-bold transition cursor-pointer ${
                                active
                                  ? "bg-stone-900 text-white shadow-2xs"
                                  : "text-stone-600 hover:text-stone-900"
                              }`}
                            >
                              {wt}g
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Step 2 on Card: Flower Varieties Selector with Strikethrough MRP */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                        2. Choose Flower Type ({variants.length} Varieties):
                      </label>
                      <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
                        {variants.map((v) => {
                          const isSelected = resolved.variant.id === v.id;
                          const itemPricing = resolvePlanVariantPricing({
                            planId: plan.id,
                            billingCycle: plan.billingCycle,
                            weightGrams: resolved.weightGrams,
                            productVariantIdOrName: v.id,
                            customDeliveriesCount: plan.deliveriesCount,
                            variantsList: variants,
                          });

                          return (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() =>
                                setCardProductVariant(plan.id, v.id)
                              }
                              className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left text-xs transition cursor-pointer ${
                                isSelected
                                  ? "border-[#D95326] bg-[#FFF3EC] text-stone-900 font-bold"
                                  : "border-[#E6DEC8] bg-[#FAF6F0]/60 text-stone-700 hover:border-stone-400"
                              }`}
                            >
                              <span className="truncate pr-2">
                                {v.srNo}. {v.name}{" "}
                                <span className="text-[11px] text-stone-500 font-normal">
                                  ({v.marathiName})
                                </span>
                              </span>
                              <span className="shrink-0 flex items-center gap-1.5">
                                <span className="text-[11px] text-stone-400 line-through font-normal">
                                  ₹{itemPricing.mrp.toLocaleString("en-IN")}
                                </span>
                                <span className="font-bold text-[#D95326]">
                                  ₹{itemPricing.price.toLocaleString("en-IN")}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Dynamic Calculated Price Box with Crossed-Out MRP & Savings Badge */}
                    <div className="rounded-2xl border border-[#E6DEC8] bg-[#FAF6F0] p-4 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500 block">
                          {resolved.weightGrams}g • {resolved.variant.name}
                        </span>
                        <div className="flex items-baseline gap-2 mt-0.5 flex-wrap">
                          <span className="text-sm font-semibold text-stone-400 line-through">
                            ₹{resolved.mrp.toLocaleString("en-IN")}
                          </span>
                          <span className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
                            ₹{resolved.price.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <span className="inline-block mt-1 text-[11px] font-bold text-[#D95326]">
                          You Save ₹{resolved.savedAmount.toLocaleString("en-IN")}{" "}
                          ({resolved.discountPercent}% OFF)
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="inline-block rounded-lg bg-[#D95326] px-2.5 py-1 text-xs font-bold text-white">
                          ₹{resolved.perDayEffectivePrice} / day
                        </span>
                        <p className="mt-1 text-[11px] font-semibold text-stone-600">
                          {plan.deliveriesCount}{" "}
                          {plan.deliveriesCount === 1
                            ? "Morning Drop"
                            : "Morning Drops"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 space-y-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveDetailPlan(plan)}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#E6DEC8] bg-[#FAF6F0] py-3 text-xs font-bold text-stone-800 hover:border-[#D95326] hover:text-[#D95326] transition cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>
                        Compare All {variants.length} Prices & Discounts
                      </span>
                    </button>

                    <Link
                      href={buildCheckoutUrl(plan)}
                      className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold transition ${
                        isPopular
                          ? "bg-[#D95326] hover:bg-[#BA421B] text-white shadow-md"
                          : "bg-stone-900 text-white hover:bg-[#D95326]"
                      }`}
                    >
                      <span>
                        Subscribe • ₹{resolved.price.toLocaleString("en-IN")}
                      </span>
                      <span className="text-xs font-normal text-white/75 line-through">
                        ₹{resolved.mrp.toLocaleString("en-IN")}
                      </span>
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          );
        })}
      </div>

      {/* PLAN FULL DETAIL & DISCOUNT RATE CARD MODAL */}
      {activeDetailPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-[#E6DEC8] bg-white p-6 sm:p-8 shadow-2xl">
            <button
              type="button"
              onClick={() => setActiveDetailPlan(null)}
              className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-stone-700 hover:bg-stone-200 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {(() => {
              const sel = selections[activeDetailPlan.id] || {
                weightGrams: availableWeights[0] || 100,
                productVariantId: variants[0]?.id || "prod-mixed-marigold",
              };
              const resolved = resolvePlanVariantPricing({
                planId: activeDetailPlan.id,
                billingCycle: activeDetailPlan.billingCycle,
                weightGrams: sel.weightGrams,
                productVariantIdOrName: sel.productVariantId,
                customDeliveriesCount: activeDetailPlan.deliveriesCount,
                variantsList: variants,
              });

              return (
                <div className="space-y-6">
                  <div className="border-b border-stone-100 pb-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#F3ECE1] border border-[#E6DEC8] px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#D95326]">
                      <Sparkles className="h-3 w-3" />
                      <span>
                        {activeDetailPlan.deliveriesCount} Morning Deliveries •
                        6:00 AM – 8:00 AM
                      </span>
                    </span>
                    <h3 className="mt-1.5 font-serif text-2xl sm:text-3xl font-bold text-stone-900">
                      {activeDetailPlan.title} — Special Member Rate Card
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Select your daily pouch weight and flower variety below:
                    </p>
                  </div>

                  {/* Weight Tabs inside Modal */}
                  <div className="flex flex-wrap items-center gap-2">
                    {availableWeights.map((wt) => (
                      <button
                        key={wt}
                        type="button"
                        onClick={() => setCardWeight(activeDetailPlan.id, wt)}
                        className={`rounded-xl px-5 py-2.5 text-xs font-bold transition cursor-pointer ${
                          resolved.weightGrams === wt
                            ? "bg-[#D95326] text-white"
                            : "border border-[#E6DEC8] bg-[#FAF6F0] text-stone-700"
                        }`}
                      >
                        {wt} gms Daily Pouch
                      </button>
                    ))}
                  </div>

                  {/* All Products Table for Active Plan with Strikethrough MRP */}
                  <div className="rounded-2xl border border-[#E6DEC8] bg-[#FAF6F0] p-4 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-stone-500 pb-1 border-b border-[#E6DEC8]">
                      <span>Flower Variety ({resolved.weightGrams} gms)</span>
                      <span>{activeDetailPlan.title} Offer Price</span>
                    </div>
                    {variants.map((v: PlanProductVariant) => {
                      const isChecked = resolved.variant.id === v.id;
                      const rowPricing = resolvePlanVariantPricing({
                        planId: activeDetailPlan.id,
                        billingCycle: activeDetailPlan.billingCycle,
                        weightGrams: resolved.weightGrams,
                        productVariantIdOrName: v.id,
                        customDeliveriesCount:
                          activeDetailPlan.deliveriesCount,
                        variantsList: variants,
                      });

                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() =>
                            setCardProductVariant(activeDetailPlan.id, v.id)
                          }
                          className={`flex w-full items-center justify-between rounded-xl border p-3 text-left text-xs transition cursor-pointer ${
                            isChecked
                              ? "border-[#D95326] bg-white text-stone-900 shadow-2xs"
                              : "border-transparent bg-white/60 text-stone-700 hover:bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                                isChecked
                                  ? "border-[#D95326] bg-[#D95326] text-white"
                                  : "border-stone-400 bg-white"
                              }`}
                            >
                              {isChecked && (
                                <Check className="h-2.5 w-2.5 stroke-[3]" />
                              )}
                            </span>
                            <div>
                              <span className="font-bold">
                                {v.srNo}. {v.name}
                              </span>{" "}
                              <span className="text-stone-500">
                                ({v.marathiName})
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <span className="text-xs text-stone-400 line-through">
                                ₹{rowPricing.mrp.toLocaleString("en-IN")}
                              </span>
                              <span className="font-serif text-base font-bold text-[#D95326]">
                                ₹{rowPricing.price.toLocaleString("en-IN")}
                              </span>
                            </div>
                            <span className="block text-[10px] text-stone-500">
                              ₹{rowPricing.perDayEffectivePrice}/day • Save{" "}
                              {rowPricing.discountPercent}%
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Modal Footer CTA */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-stone-100 pt-4">
                    <div className="flex items-center gap-2 text-xs text-stone-600">
                      <ShieldCheck className="h-4 w-4 text-[#D95326]" />
                      <span>
                        Selected:{" "}
                        <strong>
                          {resolved.weightGrams}g {resolved.variant.name}
                        </strong>{" "}
                        (Save ₹{resolved.savedAmount})
                      </span>
                    </div>
                    <Link
                      href={buildCheckoutUrl(activeDetailPlan)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-[#D95326] hover:bg-[#BA421B] px-8 py-4 text-sm font-bold text-white shadow-md transition"
                    >
                      <span>
                        Proceed to Subscribe • ₹
                        {resolved.price.toLocaleString("en-IN")}
                      </span>
                      <span className="text-xs font-normal text-white/75 line-through">
                        ₹{resolved.mrp.toLocaleString("en-IN")}
                      </span>
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </section>
  );
}