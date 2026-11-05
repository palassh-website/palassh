"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Flower2,
  Truck,
  Plus,
  Trash2,
  CheckCircle2,
  PauseCircle,
  MapPin,
  IndianRupee,
  Sparkles,
  ExternalLink,
  RotateCcw,
  Upload,
  Flame,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Lock,
  Layers,
  Download,
  Mail,
  Phone,
  Scale,
} from "lucide-react";
import { FeatureBoundary } from "@/components/shared/FeatureBoundary";
import {
  FlowerProduct,
  INITIAL_FLOWERS,
  INITIAL_PLANS,
  PLAN_PRODUCT_VARIANTS,
  SubscriptionPlan,
  PlanProductVariant,
  FESTIVE_MODE_STORAGE_KEY,
  getActiveFlowersCatalog,
  saveActiveFlowersCatalog,
  getActivePlansCatalog,
  saveActivePlansCatalog,
  getActivePlanVariants,
  saveActivePlanVariants,
  getAvailableWeightsForVariants,
  getFestiveModeStatus,
  getFestiveDatesList,
  saveFestiveDatesList,
  getEarliestDeliveryDateString,
  getTomorrowDateString,
} from "@/features/catalog/types";

interface DispatchRow {
  orderId: string;
  customerName: string;
  phone: string;
  email?: string;
  societyAndFlat: string;
  slot: string;
  orderType: "SUBSCRIPTION" | "ADD_ON_ONLY";
  planTitle?: string;
  dayNumber?: number;
  todaysFlowers: string;
  addOnFlowers?: string; // Shows e.g. "150g Mixed Shevanti (#PLS-ADDON-...)" or "-"
  deliveryNote: string;
  status: "DISPATCH_READY" | "PAUSED_TODAY";
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<
    "DISPATCH" | "PLAN_MATRIX" | "FLOWERS" | "FESTIVE_CALENDAR"
  >("DISPATCH");

  const [flowers, setFlowers] = useState<FlowerProduct[]>(INITIAL_FLOWERS);
  const [plans, setPlans] = useState<SubscriptionPlan[]>(INITIAL_PLANS);
  const [planVariants, setPlanVariants] = useState<PlanProductVariant[]>(
    PLAN_PRODUCT_VARIANTS
  );

  const [dispatchDate, setDispatchDate] = useState<string>(() =>
    getTomorrowDateString()
  );
  const [dispatchRows, setDispatchRows] = useState<DispatchRow[]>([]);
  const [isLoadingDispatch, setIsLoadingDispatch] = useState<boolean>(true);
  const [isEmailingCsv, setIsEmailingCsv] = useState<boolean>(false);

  const [festiveMode, setFestiveMode] = useState({
    isFestiveDay: false,
    festivalName: "Festive Puja",
  });
  const [festiveDates, setFestiveDates] = useState<string[]>([]);
  const [toast, setToast] = useState<string>("");

  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [customNewWeightGrams, setCustomNewWeightGrams] = useState<string>("");

  const [newVarName, setNewVarName] = useState("");
  const [newVarMarathi, setNewVarMarathi] = useState("");
  const [newVarImage, setNewVarImage] = useState("/images/merigold.webp");
  const [isUploadingVarPhoto, setIsUploadingVarPhoto] = useState(false);
  const [varPhotoStatus, setVarPhotoStatus] = useState("");
  const [newVarDay100, setNewVarDay100] = useState(49);
  const [newVarWeek100, setNewVarWeek100] = useState(329);
  const [newVarMonth100, setNewVarMonth100] = useState(1349);
  const [newVarDay150, setNewVarDay150] = useState(65);
  const [newVarWeek150, setNewVarWeek150] = useState(439);
  const [newVarMonth150, setNewVarMonth150] = useState(1829);

  const [newPlanTitle, setNewPlanTitle] = useState("");
  const [newPlanDeliveries, setNewPlanDeliveries] = useState(60);
  const [newPlanBasePrice, setNewPlanBasePrice] = useState(2399);

  const [newFlowerName, setNewFlowerName] = useState("");
  const [newFlowerMarathi, setNewFlowerMarathi] = useState("");
  const [newFlowerSubtitle, setNewFlowerSubtitle] = useState("");
  const [newFlowerImage, setNewFlowerImage] = useState("/images/merigold.webp");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadStatusNote, setUploadStatusNote] = useState("");
  const [price100g, setPrice100g] = useState(45);
  const [price150g, setPrice150g] = useState(55);

  const loadLiveDispatchForDate = async (targetDate: string) => {
    setIsLoadingDispatch(true);
    try {
      const res = await fetch(
        `/api/admin/dispatch?date=${encodeURIComponent(targetDate)}`,
        { cache: "no-store" }
      );
      if (res.status === 401 || res.status === 403) {
        window.location.href = "/admin/login";
        return;
      }
      const data = await res.json();
      if (data?.success && Array.isArray(data.dispatchRows)) {
        setDispatchRows(data.dispatchRows);
        if (data.targetDate) setDispatchDate(data.targetDate);
      } else {
        setDispatchRows([]);
      }
    } catch {
      setDispatchRows([]);
    } finally {
      setIsLoadingDispatch(false);
    }
  };

  useEffect(() => {
    setFlowers(getActiveFlowersCatalog());
    setFestiveDates(getFestiveDatesList());
    setFestiveMode(getFestiveModeStatus());
    setPlans(getActivePlansCatalog());
    setPlanVariants(getActivePlanVariants());

    void loadLiveDispatchForDate(dispatchDate);

    const syncAll = () => {
      setPlans(getActivePlansCatalog());
      setPlanVariants(getActivePlanVariants());
      setFestiveMode(getFestiveModeStatus());
    };
    window.addEventListener("palassh-plans-updated", syncAll);
    window.addEventListener("palassh-festive-updated", syncAll);

    return () => {
      window.removeEventListener("palassh-plans-updated", syncAll);
      window.removeEventListener("palassh-festive-updated", syncAll);
    };
  }, []);

  const showNotice = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 5000);
  };

  // Optimized Cloudinary Uploader: Injects f_auto,q_auto,w_800 so 25 monthly credits NEVER run out
  const uploadPhotoToCloudinaryOrDataUrl = async (
    file: File,
    onLoading: (b: boolean) => void,
    onNote: (s: string) => void,
    onResultUrl: (url: string) => void
  ) => {
    onLoading(true);
    onNote("Uploading photo...");

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (cloudName && uploadPreset) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", uploadPreset);

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          {
            method: "POST",
            body: formData,
          }
        );
        const data = await res.json();
        if (data.secure_url) {
          // Inject automatic WebP/AVIF & 800px resize transformation to save 85% bandwidth credits
          const optimizedUrl = String(data.secure_url).replace(
            "/upload/",
            "/upload/f_auto,q_auto,w_800/"
          );
          onResultUrl(optimizedUrl);
          onNote("Uploaded to Cloudinary CDN (Auto-WebP Optimized)!");
          onLoading(false);
          return;
        }
      } catch {
        // Fallback to local compressed DataURL
      }
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 640;
        let width = img.width;
        let height = img.height;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.84);
        onResultUrl(dataUrl);
        onNote("Photo compressed & ready!");
        onLoading(false);
      };
      img.src = String(event.target?.result);
    };
    reader.readAsDataURL(file);
  };

  const availableWeights = getAvailableWeightsForVariants(planVariants);

  const getVariantPriceForPlan = (
    variant: PlanProductVariant,
    weightGrams: number,
    plan: SubscriptionPlan
  ): number => {
    const wObj = variant.pricing[weightGrams] || variant.pricing[100] || {};
    const exactEntry = wObj[plan.id] || wObj[plan.billingCycle];
    if (exactEntry && typeof exactEntry.price === "number") {
      return exactEntry.price;
    }
    const basePerDay = wObj.month?.perDay || 42;
    return Math.round(basePerDay * (plan.deliveriesCount || 30));
  };

  const handleUpdateVariantMatrixPrice = (
    variantId: string,
    weightGrams: number,
    plan: SubscriptionPlan,
    newPrice: number
  ) => {
    const daysCount = Math.max(1, plan.deliveriesCount || 1);
    const perDay = Math.max(1, Math.round(newPrice / daysCount));

    const updated = planVariants.map((v) => {
      if (v.id !== variantId) return v;
      const currentWeightObj = v.pricing[weightGrams] || {};
      const nextWeightObj: Record<
        string,
        { price: number; perDay: number }
      > = {
        ...currentWeightObj,
        [plan.id]: { price: newPrice, perDay },
      };
      if (
        plan.id === "plan-daily" ||
        plan.id === "plan-weekly" ||
        plan.id === "plan-monthly"
      ) {
        nextWeightObj[plan.billingCycle] = { price: newPrice, perDay };
      }

      return {
        ...v,
        pricing: {
          ...v.pricing,
          [weightGrams]: nextWeightObj,
        },
      };
    });

    setPlanVariants(updated);
    saveActivePlanVariants(updated);
    showNotice(
      `Updated ${weightGrams}g • ${plan.title} price to ₹${newPrice} in MySQL!`
    );
  };

  const handleAddWeightTierToPlans = (e: React.FormEvent) => {
    e.preventDefault();
    const newWt = Number(customNewWeightGrams);
    if (isNaN(newWt) || newWt < 50 || newWt > 5000) {
      showNotice("Please enter a valid weight in grams (e.g., 200, 250, 500).");
      return;
    }
    if (availableWeights.includes(newWt)) {
      showNotice(`${newWt}g weight tier already exists in the matrix.`);
      return;
    }

    const ratio = newWt / 100;
    const updated = planVariants.map((v) => {
      const base100 = v.pricing[100] || PLAN_PRODUCT_VARIANTS[0].pricing[100];
      const newTierMap: Record<string, { price: number; perDay: number }> = {};

      plans.forEach((pl) => {
        const basePrice100 = getVariantPriceForPlan(v, 100, pl);
        const scaledPrice = Math.round(basePrice100 * ratio);
        const perDay = Math.max(
          1,
          Math.round(scaledPrice / Math.max(1, pl.deliveriesCount))
        );
        newTierMap[pl.id] = { price: scaledPrice, perDay };
        newTierMap[pl.billingCycle] = { price: scaledPrice, perDay };
      });

      if (!newTierMap.day) {
        const p = Math.round((base100.day?.price || 45) * ratio);
        newTierMap.day = { price: p, perDay: p };
      }
      if (!newTierMap.week) {
        const p = Math.round((base100.week?.price || 299) * ratio);
        newTierMap.week = { price: p, perDay: Math.round(p / 7) };
      }
      if (!newTierMap.month) {
        const p = Math.round((base100.month?.price || 1249) * ratio);
        newTierMap.month = { price: p, perDay: Math.round(p / 30) };
      }

      return {
        ...v,
        pricing: {
          ...v.pricing,
          [newWt]: newTierMap,
        },
      };
    });

    setPlanVariants(updated);
    saveActivePlanVariants(updated);
    setCustomNewWeightGrams("");
    showNotice(
      `Added ${newWt} gms weight column across all plans & varieties!`
    );
  };

  const handleRemoveWeightTier = (wtToRemove: number) => {
    if (availableWeights.length <= 1) return;
    const updated = planVariants.map((v) => {
      const copy = { ...v.pricing };
      delete copy[wtToRemove];
      return { ...v, pricing: copy };
    });
    setPlanVariants(updated);
    saveActivePlanVariants(updated);
    showNotice(`Removed ${wtToRemove}g weight tier from plans.`);
  };

  const handleAddPlanVariant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVarName.trim()) return;

    const slug = newVarName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");

    const pricingByWeight: Record<
      number,
      Record<string, { price: number; perDay: number }>
    > = {};

    availableWeights.forEach((wt) => {
      const is150 = wt === 150;
      const ratio = wt / 100;
      const dPrice = is150
        ? Number(newVarDay150)
        : Math.round(Number(newVarDay100) * ratio);
      const wPrice = is150
        ? Number(newVarWeek150)
        : Math.round(Number(newVarWeek100) * ratio);
      const mPrice = is150
        ? Number(newVarMonth150)
        : Math.round(Number(newVarMonth100) * ratio);

      const planMap: Record<string, { price: number; perDay: number }> = {
        day: { price: dPrice, perDay: dPrice },
        week: { price: wPrice, perDay: Math.round(wPrice / 7) },
        month: { price: mPrice, perDay: Math.round(mPrice / 30) },
      };

      plans.forEach((pl) => {
        if (pl.deliveriesCount === 1) {
          planMap[pl.id] = { price: dPrice, perDay: dPrice };
        } else if (pl.deliveriesCount === 7) {
          planMap[pl.id] = { price: wPrice, perDay: Math.round(wPrice / 7) };
        } else if (pl.deliveriesCount === 30) {
          planMap[pl.id] = { price: mPrice, perDay: Math.round(mPrice / 30) };
        } else {
          const perDay = Math.round(mPrice / 30);
          const customTotal = perDay * pl.deliveriesCount;
          planMap[pl.id] = { price: customTotal, perDay };
        }
      });

      pricingByWeight[wt] = planMap;
    });

    const newVariant: PlanProductVariant = {
      id: `prod-${slug}-${Date.now()}`,
      srNo: planVariants.length + 1,
      name: newVarName.trim(),
      marathiName: newVarMarathi.trim() || "पूजा फुले",
      subtitle: "Fresh Farm-Plucked Morning Puja Blooms",
      imageUrl: newVarImage.trim() || "/images/merigold.webp",
      pricing: pricingByWeight,
    };

    const updated = [...planVariants, newVariant];
    setPlanVariants(updated);
    saveActivePlanVariants(updated);
    setNewVarName("");
    setNewVarMarathi("");
    setVarPhotoStatus("");
    showNotice(
      `Added "${newVariant.name}" with photo & pricing across all plans!`
    );
  };

  const handleRemovePlanVariant = (id: string, name: string) => {
    if (planVariants.length <= 1) return;
    const updated = planVariants
      .filter((v) => v.id !== id)
      .map((v, idx) => ({ ...v, srNo: idx + 1 }));
    setPlanVariants(updated);
    saveActivePlanVariants(updated);
    showNotice(`Removed "${name}" from Plan Varieties.`);
  };

  const handleAddCustomPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanTitle.trim()) return;

    const slug = newPlanTitle
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
    const count = Math.max(1, Number(newPlanDeliveries) || 60);
    const price = Math.max(1, Number(newPlanBasePrice) || 2399);
    const perDay = Math.max(1, Math.round(price / count));
    const newPlanId = `plan-${slug}-${Date.now()}`;

    const createdPlan: SubscriptionPlan = {
      id: newPlanId,
      slug,
      title: newPlanTitle.trim(),
      subtitle: `${count} sacred mornings across all flower varieties with 1-Day Farm Buffer.`,
      price,
      perDayEffectivePrice: perDay,
      billingCycle: count === 1 ? "day" : count <= 7 ? "week" : "month",
      deliveriesCount: count,
      pouchWeight: availableWeights.map((w) => `${w}g`).join(" / "),
      mixedPredefinedBreakdown: "100g Mixed Marigold (मिक्स झेंडू)",
      badge: `${count} Mornings Plan`,
      isPopular: false,
      imageUrl: "/images/monthly.webp",
      flowersIncluded: ["All Sacred Flower Varieties Available"],
      shortHighlights: [
        `${count} Morning Deliveries (From ₹${perDay}/day)`,
        `Available in ${availableWeights.map((w) => `${w}g`).join(", ")} Pouches`,
        "Unlocks Daily 100g / 150g Add-On Flower Shopping",
      ],
      features: [
        "6:00 AM – 8:00 AM Silent Doorstep Drop",
        "1-Day Farm Harvest Buffer for Zero Cold-Storage Freshness",
        "Unlocks Subscriber Add-On Flower Store (100g / 150g)",
      ],
      festiveMaxGramsLimit: 150,
    };

    const updatedVariants = planVariants.map((v) => {
      const nextPricing = { ...v.pricing };
      availableWeights.forEach((wt) => {
        const wObj = { ...(nextPricing[wt] || {}) };
        const baseMonthPerDay =
          wObj.month?.perDay || Math.round(price / count);
        const autoPrice = Math.round(baseMonthPerDay * count * (wt / 100));
        wObj[newPlanId] = {
          price: autoPrice,
          perDay: Math.max(1, Math.round(autoPrice / count)),
        };
        nextPricing[wt] = wObj;
      });
      return { ...v, pricing: nextPricing };
    });

    const updatedPlans = [...plans, createdPlan];
    setPlans(updatedPlans);
    setPlanVariants(updatedVariants);
    saveActivePlansCatalog(updatedPlans);
    saveActivePlanVariants(updatedVariants);

    setNewPlanTitle("");
    showNotice(
      `Published "${createdPlan.title}"! Its editable price columns are now live in the table above.`
    );
  };

  const handleRemovePlan = (id: string, title: string) => {
    if (plans.length <= 1) return;
    const updated = plans.filter((p) => p.id !== id);
    setPlans(updated);
    saveActivePlansCatalog(updated);
    showNotice(`Removed plan "${title}".`);
  };

  const handleToggleFestiveMode = () => {
    const nextState = !festiveMode.isFestiveDay;
    const updated = {
      isFestiveDay: nextState,
      festivalName: "Festive Day Override",
    };
    localStorage.setItem(FESTIVE_MODE_STORAGE_KEY, JSON.stringify(updated));
    setFestiveMode(getFestiveModeStatus());
    window.dispatchEvent(new Event("palassh-festive-updated"));
    showNotice(
      nextState ? "Festive Day Mode ON!" : "Festive Manual Toggle OFF."
    );
  };

  const handleToggleCalendarDate = (dateStr: string) => {
    const exists = festiveDates.includes(dateStr);
    const updated = exists
      ? festiveDates.filter((d) => d !== dateStr)
      : [...festiveDates, dateStr].sort();
    setFestiveDates(updated);
    saveFestiveDatesList(updated);
    setFestiveMode(getFestiveModeStatus());
    showNotice(
      exists
        ? `Removed ${dateStr} from Festive Calendar.`
        : `Marked ${dateStr} as a Festive Day in MySQL!`
    );
  };

  // Add Member Add-On Flower (Strictly 100g & 150g Packs)
  const handleAddFlower = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlowerName.trim()) return;

    const slug = newFlowerName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");

    const newFlower: FlowerProduct = {
      id: `flw-${Date.now()}`,
      slug,
      name: newFlowerName.trim(),
      marathiName: newFlowerMarathi.trim() || "पूजा फुले",
      subtitle:
        newFlowerSubtitle.trim() || "Fresh Farm-Plucked Sacred Puja Blooms",
      botanicalNote:
        "Plucked fresh at 8:00 PM and delivered in breathable eco-pouches between 6:00 AM – 8:00 AM.",
      imageUrl: newFlowerImage.trim() || "/images/merigold.webp",
      basePricePer100g: Number(price100g),
      unitType: "WEIGHT",
      availableWeights: [
        { label: "100g", grams: 100, price: Number(price100g) },
        { label: "150g", grams: 150, price: Number(price150g) },
      ],
      inStock: true,
      deityAffinity: "All Daily Puja Rituals",
    };

    const updated = [...flowers, newFlower];
    setFlowers(updated);
    saveActiveFlowersCatalog(updated);
    setNewFlowerName("");
    setNewFlowerMarathi("");
    setNewFlowerSubtitle("");
    setUploadStatusNote("");
    showNotice(
      `Added "${newFlower.name} (${newFlower.marathiName})" (100g & 150g) to Subscriber Add-On Catalog!`
    );
  };

  const handleToggleFlowerStock = (id: string) => {
    const updated = flowers.map((f) =>
      f.id === id ? { ...f, inStock: !f.inStock } : f
    );
    setFlowers(updated);
    saveActiveFlowersCatalog(updated);
    showNotice("Updated flower stock status in MySQL.");
  };

  const handleRemoveFlower = (id: string, name: string) => {
    if (flowers.length <= 1) return;
    const updated = flowers.filter((f) => f.id !== id);
    setFlowers(updated);
    saveActiveFlowersCatalog(updated);
    showNotice(`Removed "${name}" from Add-On Flower Catalog.`);
  };

  const handleResetAllDefaults = () => {
    setFlowers(INITIAL_FLOWERS);
    saveActiveFlowersCatalog(INITIAL_FLOWERS);
    setPlans(INITIAL_PLANS);
    saveActivePlansCatalog(INITIAL_PLANS);
    setPlanVariants(PLAN_PRODUCT_VARIANTS);
    saveActivePlanVariants(PLAN_PRODUCT_VARIANTS);
    showNotice(
      "Reset Plans & 7 Flower Varieties to Client Excel Sheet Defaults (100g & 150g)!"
    );
  };

  const handleEmailCsvToAdmin = async () => {
    setIsEmailingCsv(true);
    try {
      const res = await fetch("/api/admin/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dispatchDate }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotice(data.message);
      } else {
        showNotice(data.error || "Could not email CSV. Check SMTP settings.");
      }
    } catch {
      showNotice("Network error while emailing CSV.");
    } finally {
      setIsEmailingCsv(false);
    }
  };

  const renderCalendarDays = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: { day: number | null; dateStr: string }[] = [];
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({ day: null, dateStr: `empty-${i}` });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const mm = String(month + 1).padStart(2, "0");
      const dd = String(d).padStart(2, "0");
      cells.push({ day: d, dateStr: `${year}-${mm}-${dd}` });
    }
    return cells;
  };

  const activeDeliveriesCount = dispatchRows.filter(
    (r) => r.status === "DISPATCH_READY"
  ).length;
  const activeAddOnsCount = dispatchRows.filter(
    (r) => r.addOnFlowers && r.addOnFlowers !== "-"
  ).length;

  return (
    <FeatureBoundary featureName="ADMIN_DASHBOARD">
      <div className="min-h-screen bg-[#FAF6F0] pb-20">
        <header className="bg-[#1C1917] border-b border-stone-800 px-4 py-6 sm:px-6 lg:px-8 text-white">
          <div className="mx-auto max-w-7xl flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-stone-900 border border-stone-700 px-3.5 py-1 text-[10px] font-bold uppercase tracking-widest text-[#F5D0A9]">
                <Sparkles className="h-3 w-3 text-[#D95326]" />
                <span>PALASSH Live Operations Center</span>
              </div>
              <h1 className="mt-1.5 font-serif text-2xl sm:text-3xl font-bold text-white">
                Morning 6–8 AM Dispatch, Add-Ons & Plan Matrix
              </h1>
              <p className="text-xs text-stone-400">
                100% Live MySQL Data • Includes Subscriber Add-On Column (100g /
                150g) & Midnight Excel Export
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-stone-800 border border-stone-700 px-3.5 py-2.5 text-xs font-bold text-[#F5D0A9]">
                <Lock className="h-3.5 w-3.5 text-[#D95326]" />
                <span>Add-Ons: Weekly/Monthly Subscribers Only</span>
              </span>

              <button
                type="button"
                onClick={handleToggleFestiveMode}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition cursor-pointer ${festiveMode.isFestiveDay
                    ? "bg-[#D95326] text-white shadow-sm"
                    : "border border-stone-700 bg-stone-900 text-stone-300 hover:bg-stone-800"
                  }`}
              >
                <Flame className="h-4 w-4 text-[#F5D0A9]" />
                <span>
                  Festive Status:{" "}
                  {festiveMode.isFestiveDay ? "ACTIVE" : "NORMAL"}
                </span>
              </button>

              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#D95326] hover:bg-[#BA421B] px-4 py-2.5 text-xs font-bold text-white shadow-sm"
              >
                <span>Storefront</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
          {/* Quick KPI Strip */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-[#E6DEC8] bg-white p-5 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                Ready for Dispatch ({dispatchDate})
              </span>
              <p className="mt-1 font-serif text-3xl font-bold text-stone-900">
                {activeDeliveriesCount} Pouches
              </p>
            </div>
            <div className="rounded-2xl border border-[#E6DEC8] bg-white p-5 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                Subscriber Add-Ons ({dispatchDate})
              </span>
              <p className="mt-1 font-serif text-3xl font-bold text-[#D95326]">
                {activeAddOnsCount} Add-Ons
              </p>
              <span className="text-[10px] text-stone-500">
                (100g / 150g Extra Packs)
              </span>
            </div>
            <div className="rounded-2xl border border-[#E6DEC8] bg-white p-5 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                Earliest New Booking Start
              </span>
              <p className="mt-1 font-serif text-2xl font-bold text-stone-900">
                {getEarliestDeliveryDateString()}
              </p>
              <span className="text-[10px] text-stone-500">
                (1-Day Farm Buffer Applied)
              </span>
            </div>
            <div className="rounded-2xl border border-[#E6DEC8] bg-white p-5 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                12:00 AM Midnight Cron
              </span>
              <p className="mt-1 font-serif text-lg font-bold text-[#D95326]">
                Auto-Email Excel CSV
              </p>
              <span className="text-[10px] text-stone-500">
                Daily to Admin Email
              </span>
            </div>
          </div>

          {toast && (
            <div className="flex items-center gap-2.5 rounded-2xl border border-[#D95326] bg-[#FFF3EC] px-5 py-3.5 text-sm font-bold text-stone-900 shadow-xs">
              <CheckCircle2 className="h-5 w-5 text-[#D95326] shrink-0" />
              <span>{toast}</span>
            </div>
          )}

          {/* 4 Navigation Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-[#E6DEC8] pb-4">
            <button
              type="button"
              onClick={() => setActiveTab("DISPATCH")}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-bold transition cursor-pointer ${activeTab === "DISPATCH"
                  ? "bg-[#D95326] text-white shadow-xs"
                  : "bg-white text-stone-700 border border-[#E6DEC8] hover:bg-[#F3ECE1]"
                }`}
            >
              <Truck className="h-4 w-4" />
              <span>
                1. Live 6–8 AM Dispatch & Add-Ons ({dispatchRows.length})
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("PLAN_MATRIX")}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-bold transition cursor-pointer ${activeTab === "PLAN_MATRIX"
                  ? "bg-[#D95326] text-white shadow-xs"
                  : "bg-white text-stone-700 border border-[#E6DEC8] hover:bg-[#F3ECE1]"
                }`}
            >
              <IndianRupee className="h-4 w-4" />
              <span>
                2. Dynamic Plan Matrix, Weights & Varieties (
                {planVariants.length})
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("FLOWERS")}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-bold transition cursor-pointer ${activeTab === "FLOWERS"
                  ? "bg-[#D95326] text-white shadow-xs"
                  : "bg-white text-stone-700 border border-[#E6DEC8] hover:bg-[#F3ECE1]"
                }`}
            >
              <Flower2 className="h-4 w-4" />
              <span>3. Subscriber Add-On Flowers ({flowers.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("FESTIVE_CALENDAR")}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-bold transition cursor-pointer ${activeTab === "FESTIVE_CALENDAR"
                  ? "bg-[#D95326] text-white shadow-xs"
                  : "bg-white text-stone-700 border border-[#E6DEC8] hover:bg-[#F3ECE1]"
                }`}
            >
              <Calendar className="h-4 w-4" />
              <span>4. Festive Days Calendar ({festiveDates.length})</span>
            </button>
          </div>

          {/* TAB 1: LIVE MYSQL MORNING DISPATCH SHEET WITH DEDICATED "ADD-ON" COLUMN */}
          {activeTab === "DISPATCH" && (
            <div className="rounded-[2rem] border border-[#E6DEC8] bg-white p-6 sm:p-8 shadow-md space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-100 pb-5">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-stone-900">
                    Live 6:00 AM – 8:00 AM Packing & Add-On Dispatch Sheet
                  </h2>
                  <p className="text-xs text-stone-500">
                    Shows each subscriber&apos;s daily plan pouch + any
                    additional 100g/150g Add-On booked for {dispatchDate} (or{" "}
                    <strong>-</strong> if no Add-On).
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex items-center gap-2 rounded-xl border border-[#E6DEC8] bg-[#FAF6F0] px-3 py-2">
                    <Calendar className="h-4 w-4 text-[#D95326]" />
                    <input
                      type="date"
                      value={dispatchDate}
                      onChange={(e) => {
                        setDispatchDate(e.target.value);
                        void loadLiveDispatchForDate(e.target.value);
                      }}
                      className="bg-transparent text-xs font-bold text-stone-900 focus:outline-none"
                    />
                  </div>

                  <a
                    href={`/api/admin/dispatch?date=${encodeURIComponent(
                      dispatchDate
                    )}&format=csv`}
                    download={`PALASSH-Dispatch-${dispatchDate}.csv`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#D95326] hover:bg-[#BA421B] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download Excel (.CSV)</span>
                  </a>

                  <button
                    type="button"
                    disabled={isEmailingCsv}
                    onClick={handleEmailCsvToAdmin}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition cursor-pointer disabled:opacity-60"
                  >
                    <Mail className="h-3.5 w-3.5 text-[#F5D0A9]" />
                    <span>
                      {isEmailingCsv
                        ? "Sending Email..."
                        : "Email Excel to Admin"}
                    </span>
                  </button>
                </div>
              </div>

              {isLoadingDispatch ? (
                <div className="py-16 text-center text-xs font-bold text-stone-500">
                  Loading live orders & Add-Ons from Hostinger MySQL for{" "}
                  {dispatchDate}...
                </div>
              ) : dispatchRows.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#E6DEC8] bg-[#FAF6F0] p-12 text-center space-y-2">
                  <Truck className="mx-auto h-8 w-8 text-stone-400" />
                  <p className="font-serif text-lg font-bold text-stone-800">
                    No Deliveries Scheduled for {dispatchDate} Yet
                  </p>
                  <p className="text-xs text-stone-500 max-w-md mx-auto">
                    As soon as a customer purchases a plan or books a 100g/150g
                    Add-On for {dispatchDate}, it will appear here and in your
                    downloadable Excel (.CSV) file.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-stone-200 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                        <th className="py-3 px-4">Order & Plan</th>
                        <th className="py-3 px-4">Customer & Phone Number</th>
                        <th className="py-3 px-4">Society Flat & Note</th>
                        <th className="py-3 px-4">Plan Pouch</th>
                        <th className="py-3 px-4">Add-On (100g / 150g)</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-xs">
                      {dispatchRows.map((row) => {
                        const hasAddOn =
                          row.addOnFlowers && row.addOnFlowers !== "-";
                        return (
                          <tr
                            key={`${row.orderId}-${row.dayNumber || 1}`}
                            className={
                              row.status === "PAUSED_TODAY"
                                ? "bg-stone-50/80 opacity-65"
                                : "hover:bg-[#FAF6F0]/60"
                            }
                          >
                            <td className="py-4 px-4 font-bold text-stone-900">
                              <div>#{row.orderId}</div>
                              <span className="mt-1 inline-block rounded bg-[#FFF3EC] border border-[#E6DEC8] px-2 py-0.5 text-[10px] font-bold text-[#D95326]">
                                {row.planTitle || row.orderType}{" "}
                                {row.dayNumber ? `• Day #${row.dayNumber}` : ""}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <p className="font-bold text-stone-900">
                                {row.customerName}
                              </p>
                              <a
                                href={`tel:+91${row.phone}`}
                                className="inline-flex items-center gap-1 text-[#D95326] font-bold mt-0.5 hover:underline"
                              >
                                <Phone className="h-3 w-3" />
                                <span>+91 {row.phone}</span>
                              </a>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-stone-700 font-semibold flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-[#D95326] shrink-0" />
                                <span>{row.societyAndFlat}</span>
                              </p>
                              <p className="text-[11px] text-stone-500 italic mt-0.5">
                                Note: {row.deliveryNote}
                              </p>
                            </td>
                            <td className="py-4 px-4">
                              <span className="inline-block rounded-xl border border-[#E6DEC8] bg-[#FAF6F0] px-3 py-1.5 font-bold text-stone-900">
                                {row.todaysFlowers}
                              </span>
                            </td>
                            {/* DEDICATED ADD-ON COLUMN (Shows Add-On or "-" Dash) */}
                            <td className="py-4 px-4">
                              {hasAddOn ? (
                                <span className="inline-block rounded-xl border border-[#D95326] bg-[#FFF3EC] px-3 py-1.5 font-bold text-[#D95326]">
                                  + {row.addOnFlowers}
                                </span>
                              ) : (
                                <span className="font-bold text-stone-400 px-2">
                                  -
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              {row.status === "DISPATCH_READY" ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF3EC] border border-[#D95326]/40 px-3 py-1 text-[11px] font-bold text-[#D95326]">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Pack & Deliver (6–8 AM)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-stone-200 px-3 py-1 text-[11px] font-bold text-stone-700">
                                  <PauseCircle className="h-3.5 w-3.5" />
                                  Paused Today
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DYNAMIC PLANS × DYNAMIC WEIGHTS × VARIETIES MATRIX */}
          {activeTab === "PLAN_MATRIX" && (
            <div className="space-y-8">
              <div className="rounded-[2rem] border border-[#E6DEC8] bg-white p-6 sm:p-8 shadow-md space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-100 pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#D95326]">
                      Dynamic Multi-Weight & Multi-Plan Rate Matrix
                    </span>
                    <h2 className="font-serif text-2xl font-bold text-stone-900">
                      Edit Prices Across All Plans ({plans.length} Plans ×{" "}
                      {availableWeights.length} Weights)
                    </h2>
                    <p className="text-xs text-stone-500">
                      Every new plan (e.g. 2 Months Plan) or new weight (e.g.
                      250g) you add below automatically appears as an editable
                      column here!
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <form
                      onSubmit={handleAddWeightTierToPlans}
                      className="flex items-center gap-1.5"
                    >
                      <input
                        type="number"
                        placeholder="Add Weight (e.g. 250)"
                        value={customNewWeightGrams}
                        onChange={(e) =>
                          setCustomNewWeightGrams(e.target.value)
                        }
                        className="w-40 rounded-xl border border-[#E6DEC8] bg-[#FAF6F0] px-3 py-2 text-xs font-bold text-stone-900 focus:border-[#D95326] focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 rounded-xl bg-stone-900 hover:bg-[#D95326] px-3.5 py-2 text-xs font-bold text-white transition cursor-pointer"
                      >
                        <Scale className="h-3.5 w-3.5" />
                        <span>+ Add Weight</span>
                      </button>
                    </form>

                    <button
                      type="button"
                      onClick={handleResetAllDefaults}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#E6DEC8] bg-[#FAF6F0] px-3.5 py-2 text-xs font-bold text-stone-700 hover:bg-[#F3ECE1] cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reset Excel Defaults</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold uppercase text-stone-400">
                    Active Weight Columns:
                  </span>
                  {availableWeights.map((wt) => (
                    <span
                      key={wt}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#E6DEC8] bg-[#FAF6F0] px-3 py-1 text-xs font-bold text-stone-800"
                    >
                      <span>{wt} gms</span>
                      {availableWeights.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveWeightTier(wt)}
                          className="text-stone-400 hover:text-rose-600 cursor-pointer"
                          title={`Remove ${wt}g tier`}
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#E6DEC8] bg-[#FAF6F0] text-[10px] font-bold uppercase text-stone-600">
                        <th className="py-3 px-3 min-w-[180px]">
                          Sr. & Flower Variety
                        </th>
                        {availableWeights.map((wt, wIdx) =>
                          plans.map((pl, pIdx) => (
                            <th
                              key={`${wt}-${pl.id}`}
                              className={`py-3 px-2 min-w-[105px] ${wIdx > 0 && pIdx === 0
                                  ? "border-l-2 border-[#D95326]/30"
                                  : ""
                                }`}
                            >
                              <span className="block text-[#D95326]">
                                {wt}G
                              </span>
                              <span className="block text-stone-800 truncate">
                                {pl.title}
                              </span>
                            </th>
                          ))
                        )}
                        <th className="py-3 px-2">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {planVariants.map((v) => (
                        <tr key={v.id} className="hover:bg-[#FAF6F0]/50">
                          <td className="py-3 px-3 font-bold text-stone-900">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={v.imageUrl || "/images/merigold.webp"}
                                alt={v.name}
                                className="h-10 w-10 rounded-lg object-cover border border-[#E6DEC8] shrink-0"
                              />
                              <div>
                                <span>
                                  {v.srNo}. {v.name}
                                </span>
                                <span className="block text-[10px] font-normal text-stone-500">
                                  ({v.marathiName})
                                </span>
                              </div>
                            </div>
                          </td>
                          {availableWeights.map((wt, wIdx) =>
                            plans.map((pl, pIdx) => {
                              const currentPrice = getVariantPriceForPlan(
                                v,
                                wt,
                                pl
                              );
                              return (
                                <td
                                  key={`${v.id}-${wt}-${pl.id}`}
                                  className={`py-2 px-2 ${wIdx > 0 && pIdx === 0
                                      ? "border-l-2 border-[#D95326]/30"
                                      : ""
                                    }`}
                                >
                                  <input
                                    type="number"
                                    value={currentPrice}
                                    onChange={(e) =>
                                      handleUpdateVariantMatrixPrice(
                                        v.id,
                                        wt,
                                        pl,
                                        Number(e.target.value)
                                      )
                                    }
                                    className={`w-20 rounded-lg border border-[#E6DEC8] px-2 py-1.5 font-bold focus:border-[#D95326] focus:outline-none ${wIdx % 2 === 1
                                        ? "bg-[#FAF6F0] text-[#D95326]"
                                        : "bg-white text-stone-900"
                                      }`}
                                  />
                                </td>
                              );
                            })
                          )}
                          <td className="py-2 px-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleRemovePlanVariant(v.id, v.name)
                              }
                              className="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100 cursor-pointer"
                              title="Delete Variety"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                <form
                  onSubmit={handleAddPlanVariant}
                  className="lg:col-span-6 rounded-[2rem] border border-[#E6DEC8] bg-white p-6 sm:p-8 shadow-md space-y-4"
                >
                  <div className="border-b border-stone-100 pb-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#D95326]">
                      Cloudinary CDN + Gallery Photo Upload
                    </span>
                    <h3 className="font-serif text-xl font-bold text-stone-900">
                      Add New Flower Variety to Plans
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Variety Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Red Hibiscus Pack"
                        value={newVarName}
                        onChange={(e) => setNewVarName(e.target.value)}
                        className="w-full rounded-xl border border-[#E6DEC8] px-3 py-2 text-xs text-stone-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Marathi Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. लाल जास्वंद"
                        value={newVarMarathi}
                        onChange={(e) => setNewVarMarathi(e.target.value)}
                        className="w-full rounded-xl border border-[#E6DEC8] px-3 py-2 text-xs text-stone-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Upload Variety Photo (Cloudinary / Gallery) *
                    </label>
                    <div className="flex items-center gap-4 rounded-2xl border-2 border-dashed border-[#E6DEC8] bg-[#FAF6F0] p-3">
                      <img
                        src={newVarImage}
                        alt="Variety Preview"
                        className="h-14 w-14 rounded-xl object-cover border border-stone-200 bg-white shrink-0"
                      />
                      <div className="flex-1 space-y-1">
                        <label className="inline-flex items-center gap-2 rounded-xl bg-stone-900 hover:bg-[#D95326] px-3.5 py-2 text-xs font-bold text-white cursor-pointer transition">
                          <Upload className="h-3.5 w-3.5" />
                          <span>
                            {isUploadingVarPhoto
                              ? "Uploading..."
                              : "Choose Variety Photo"}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                void uploadPhotoToCloudinaryOrDataUrl(
                                  file,
                                  setIsUploadingVarPhoto,
                                  setVarPhotoStatus,
                                  setNewVarImage
                                );
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                        {varPhotoStatus && (
                          <p className="text-[11px] font-semibold text-[#D95326]">
                            {varPhotoStatus}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] font-bold uppercase text-stone-500 pt-1">
                    100 gms Base Prices (1 Day / Weekly / Monthly):
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      required
                      value={newVarDay100}
                      onChange={(e) => setNewVarDay100(Number(e.target.value))}
                      placeholder="1 Day ₹"
                      className="rounded-xl border border-[#E6DEC8] px-3 py-2 text-xs font-bold"
                    />
                    <input
                      type="number"
                      required
                      value={newVarWeek100}
                      onChange={(e) => setNewVarWeek100(Number(e.target.value))}
                      placeholder="Weekly ₹"
                      className="rounded-xl border border-[#E6DEC8] px-3 py-2 text-xs font-bold"
                    />
                    <input
                      type="number"
                      required
                      value={newVarMonth100}
                      onChange={(e) =>
                        setNewVarMonth100(Number(e.target.value))
                      }
                      placeholder="Monthly ₹"
                      className="rounded-xl border border-[#E6DEC8] px-3 py-2 text-xs font-bold"
                    />
                  </div>

                  <p className="text-[11px] font-bold uppercase text-stone-500 pt-1">
                    150 gms Base Prices (1 Day / Weekly / Monthly):
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      required
                      value={newVarDay150}
                      onChange={(e) => setNewVarDay150(Number(e.target.value))}
                      placeholder="1 Day ₹"
                      className="rounded-xl border border-[#E6DEC8] bg-[#FAF6F0] px-3 py-2 text-xs font-bold"
                    />
                    <input
                      type="number"
                      required
                      value={newVarWeek150}
                      onChange={(e) => setNewVarWeek150(Number(e.target.value))}
                      placeholder="Weekly ₹"
                      className="rounded-xl border border-[#E6DEC8] bg-[#FAF6F0] px-3 py-2 text-xs font-bold"
                    />
                    <input
                      type="number"
                      required
                      value={newVarMonth150}
                      onChange={(e) =>
                        setNewVarMonth150(Number(e.target.value))
                      }
                      placeholder="Monthly ₹"
                      className="rounded-xl border border-[#E6DEC8] bg-[#FAF6F0] px-3 py-2 text-xs font-bold"
                    />
                  </div>

                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#D95326] hover:bg-[#BA421B] py-3.5 text-xs font-bold text-white shadow-sm cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Variety with Photo to All Plans</span>
                  </button>
                </form>

                <div className="lg:col-span-6 rounded-[2rem] border border-[#E6DEC8] bg-white p-6 sm:p-8 shadow-md space-y-5">
                  <form onSubmit={handleAddCustomPlan} className="space-y-4">
                    <div className="border-b border-stone-100 pb-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#D95326]">
                        Custom Plan Tier Builder
                      </span>
                      <h3 className="font-serif text-xl font-bold text-stone-900">
                        Add New Subscription Plan Tier (e.g. 2 Months Plan)
                      </h3>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        When you publish a plan here, a dedicated price column
                        for it automatically appears in the matrix table above!
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Plan Title *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 2 Months Plan"
                          value={newPlanTitle}
                          onChange={(e) => setNewPlanTitle(e.target.value)}
                          className="w-full rounded-xl border border-[#E6DEC8] px-3 py-2.5 text-xs text-stone-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Deliveries Count (Days) *
                        </label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={newPlanDeliveries}
                          onChange={(e) =>
                            setNewPlanDeliveries(Number(e.target.value))
                          }
                          className="w-full rounded-xl border border-[#E6DEC8] px-3 py-2.5 text-xs font-bold text-stone-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Starting 100g Price for This Plan (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        value={newPlanBasePrice}
                        onChange={(e) =>
                          setNewPlanBasePrice(Number(e.target.value))
                        }
                        className="w-full rounded-xl border border-[#E6DEC8] px-3 py-2.5 text-xs font-bold text-stone-900"
                      />
                    </div>

                    <button
                      type="submit"
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 hover:bg-[#D95326] py-3.5 text-xs font-bold text-white shadow-sm cursor-pointer transition"
                    >
                      <Layers className="h-4 w-4" />
                      <span>Publish New Plan & Add Matrix Columns</span>
                    </button>
                  </form>

                  <div className="border-t border-stone-100 pt-4 space-y-2">
                    <p className="text-[11px] font-bold uppercase text-stone-400">
                      Active Plan Tiers ({plans.length}):
                    </p>
                    {plans.map((pl) => (
                      <div
                        key={pl.id}
                        className="flex items-center justify-between rounded-xl border border-[#E6DEC8] bg-[#FAF6F0] px-3.5 py-2.5 text-xs"
                      >
                        <div>
                          <span className="font-bold text-stone-900">
                            {pl.title}
                          </span>{" "}
                          <span className="text-stone-500">
                            ({pl.deliveriesCount} mornings • From ₹{pl.price})
                          </span>
                        </div>
                        {plans.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePlan(pl.id, pl.title)}
                            className="text-rose-600 hover:underline font-bold cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: UPLOAD & MANAGE SUBSCRIBER ADD-ON FLOWERS (100g & 150g) */}
          {activeTab === "FLOWERS" && (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              <form
                onSubmit={handleAddFlower}
                className="lg:col-span-5 rounded-[2rem] border border-[#E6DEC8] bg-white p-6 sm:p-8 shadow-md space-y-4 h-fit"
              >
                <div className="border-b border-stone-100 pb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#D95326]">
                    Cloudinary + Gallery Upload (100g & 150g Packs)
                  </span>
                  <h3 className="font-serif text-2xl font-bold text-stone-900">
                    Register Subscriber Add-On Flower
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      English Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mogra / Jasmine"
                      value={newFlowerName}
                      onChange={(e) => setNewFlowerName(e.target.value)}
                      className="w-full rounded-xl border border-[#E6DEC8] px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#D95326] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Marathi Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. मोगरा"
                      value={newFlowerMarathi}
                      onChange={(e) => setNewFlowerMarathi(e.target.value)}
                      className="w-full rounded-xl border border-[#E6DEC8] px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#D95326] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Upload Flower Photo *
                  </label>
                  <div className="flex items-center gap-4 rounded-2xl border-2 border-dashed border-[#E6DEC8] bg-[#FAF6F0] p-3.5">
                    <img
                      src={newFlowerImage}
                      alt="Flower Preview"
                      loading="lazy"
                      decoding="async"
                      className="h-16 w-16 rounded-xl object-cover border border-stone-200 shrink-0 bg-white"
                    />
                    <div className="flex-1 space-y-1.5">
                      <label className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2 text-xs font-bold text-white cursor-pointer hover:bg-[#D95326]">
                        <Upload className="h-3.5 w-3.5" />
                        <span>
                          {isUploadingImage
                            ? "Uploading..."
                            : "Choose Photo from Gallery"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              void uploadPhotoToCloudinaryOrDataUrl(
                                file,
                                setIsUploadingImage,
                                setUploadStatusNote,
                                setNewFlowerImage
                              );
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                      {uploadStatusNote && (
                        <p className="text-[11px] font-medium text-[#D95326]">
                          {uploadStatusNote}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Short Subtitle *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fragrant Morning Temple Buds"
                    value={newFlowerSubtitle}
                    onChange={(e) => setNewFlowerSubtitle(e.target.value)}
                    className="w-full rounded-xl border border-[#E6DEC8] px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#D95326] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">
                      100g Add-On Price (₹)
                    </label>
                    <input
                      type="number"
                      required
                      value={price100g}
                      onChange={(e) => setPrice100g(Number(e.target.value))}
                      className="w-full rounded-xl border border-[#E6DEC8] px-3 py-2 text-sm font-bold text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">
                      150g Add-On Price (₹)
                    </label>
                    <input
                      type="number"
                      required
                      value={price150g}
                      onChange={(e) => setPrice150g(Number(e.target.value))}
                      className="w-full rounded-xl border border-[#E6DEC8] px-3 py-2 text-sm font-bold text-stone-900"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#D95326] hover:bg-[#BA421B] py-3.5 text-xs font-bold text-white shadow-sm cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Flower to Add-On Catalog</span>
                </button>
              </form>

              <div className="lg:col-span-7 rounded-[2rem] border border-[#E6DEC8] bg-white p-6 sm:p-8 shadow-md space-y-5">
                <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                  <h3 className="font-serif text-2xl font-bold text-stone-900">
                    Registered Add-On Flowers ({flowers.length})
                  </h3>
                </div>

                <div className="divide-y divide-stone-100">
                  {flowers.map((flw) => (
                    <div
                      key={flw.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4"
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={flw.imageUrl}
                          alt={flw.name}
                          loading="lazy"
                          decoding="async"
                          className="h-16 w-16 rounded-2xl object-cover border border-stone-200"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-serif text-lg font-bold text-stone-900">
                              {flw.name}
                            </h4>
                            <span className="text-xs font-semibold text-stone-500">
                              ({flw.marathiName})
                            </span>
                          </div>
                          <p className="text-xs text-stone-500">
                            {flw.subtitle}
                          </p>
                          <p className="text-xs font-bold text-[#D95326] mt-0.5">
                            {flw.availableWeights
                              .filter((w) => w.grams === 100 || w.grams === 150)
                              .map((w) => `${w.grams}g: ₹${w.price}`)
                              .join(" • ")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleFlowerStock(flw.id)}
                          className="rounded-xl border border-[#E6DEC8] bg-[#FAF6F0] px-3 py-2 text-xs font-bold text-stone-700 hover:bg-[#F3ECE1] cursor-pointer"
                        >
                          {flw.inStock ? "Mark Out of Stock" : "Mark In Stock"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveFlower(flw.id, flw.name)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MONTH-WISE FESTIVE DAYS CALENDAR */}
          {activeTab === "FESTIVE_CALENDAR" && (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              <div className="lg:col-span-7 rounded-[2rem] border border-[#E6DEC8] bg-white p-6 sm:p-8 shadow-md space-y-6">
                <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#D95326]">
                      Month-Wise Festive Planner
                    </span>
                    <h2 className="font-serif text-2xl font-bold text-stone-900">
                      Select Festive Dates
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCalendarMonth(
                          new Date(
                            calendarMonth.getFullYear(),
                            calendarMonth.getMonth() - 1,
                            1
                          )
                        )
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E6DEC8] bg-[#FAF6F0] hover:bg-[#F3ECE1] cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="font-serif text-base font-bold text-stone-900 min-w-[140px] text-center">
                      {calendarMonth.toLocaleDateString("en-IN", {
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setCalendarMonth(
                          new Date(
                            calendarMonth.getFullYear(),
                            calendarMonth.getMonth() + 1,
                            1
                          )
                        )
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E6DEC8] bg-[#FAF6F0] hover:bg-[#F3ECE1] cursor-pointer"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-bold uppercase text-stone-400">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (d) => (
                      <div key={d}>{d}</div>
                    )
                  )}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {renderCalendarDays().map((cell) => {
                    if (!cell.day) {
                      return <div key={cell.dateStr} className="h-12" />;
                    }
                    const isMarked = festiveDates.includes(cell.dateStr);
                    return (
                      <button
                        key={cell.dateStr}
                        type="button"
                        onClick={() => handleToggleCalendarDate(cell.dateStr)}
                        className={`relative flex flex-col items-center justify-center h-14 rounded-2xl border text-xs font-bold transition cursor-pointer ${isMarked
                            ? "border-[#D95326] bg-[#D95326] text-white shadow-xs"
                            : "border-[#E6DEC8] bg-[#FAF6F0] text-stone-800 hover:border-[#D95326]"
                          }`}
                      >
                        <span className="text-sm">{cell.day}</span>
                        {isMarked && (
                          <span className="text-[9px] uppercase tracking-wider text-white/90">
                            Festive
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="lg:col-span-5 rounded-[2rem] border border-[#E6DEC8] bg-white p-6 sm:p-8 shadow-md space-y-5 h-fit">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#D95326]">
                    Festive Schedule
                  </span>
                  <h3 className="font-serif text-2xl font-bold text-stone-900">
                    Marked Festive Dates ({festiveDates.length})
                  </h3>
                </div>

                {festiveDates.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#E6DEC8] p-6 text-center text-xs text-stone-400">
                    No festive dates marked yet.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
                    {festiveDates.map((dt) => (
                      <span
                        key={dt}
                        className="inline-flex items-center gap-2 rounded-xl border border-[#E6DEC8] bg-[#FFF3EC] px-3 py-1.5 text-xs font-bold text-[#D95326]"
                      >
                        <Flame className="h-3.5 w-3.5" />
                        <span>{dt}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleCalendarDate(dt)}
                          className="ml-1 text-stone-400 hover:text-rose-600 cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </FeatureBoundary>
  );
}