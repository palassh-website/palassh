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
  Clock,
  MapPin,
  IndianRupee,
  PackageCheck,
  Sparkles,
  ExternalLink,
  RotateCcw,
  Upload,
  Flame,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
} from "lucide-react";
import { FeatureBoundary } from "@/components/shared/FeatureBoundary";
import {
  FlowerProduct,
  INITIAL_FLOWERS,
  INITIAL_PLANS,
  SubscriptionPlan,
  CATALOG_STORAGE_KEY,
  FESTIVE_MODE_STORAGE_KEY,
  getActiveFlowersCatalog,
  getActivePlansCatalog,
  saveActivePlansCatalog,
  getFestiveModeStatus,
  getFestiveDatesList,
  saveFestiveDatesList,
  getTomorrowDateString,
  getNormalPurchaseAllowed,
  saveNormalPurchaseAllowed,
} from "@/features/catalog/types";

interface DispatchRow {
  orderId: string;
  customerName: string;
  societyAndFlat: string;
  slot: string;
  orderType: "SUBSCRIPTION" | "ONE_TIME";
  todaysFlowers: string;
  deliveryNote: string;
  status: "DISPATCH_READY" | "PAUSED_TODAY";
}

const DEMO_DISPATCH_LIST: DispatchRow[] = [
  {
    orderId: "PLS-SUB-849201",
    customerName: "Snehal Deshmukh",
    societyAndFlat: "B-1204, Hiranandani Estate, Thane West - 400607",
    slot: "6:00 AM – 8:00 AM",
    orderType: "SUBSCRIPTION",
    todaysFlowers: "Mixed Sacred Box (Marigold, Chrysanthemum & Red Hibiscus)",
    deliveryNote: "Hang pouch on main door handle (Do not ring bell)",
    status: "DISPATCH_READY",
  },
  {
    orderId: "PLS-SUB-739104",
    customerName: "Mrs. Anjali Joshi",
    societyAndFlat: "A-902, Rustomjee Urbania, Thane West - 400601",
    slot: "6:00 AM – 8:00 AM",
    orderType: "SUBSCRIPTION",
    todaysFlowers: "Only Red Hibiscus (लाल जास्वंद)",
    deliveryNote: "Place inside wooden basket outside door",
    status: "DISPATCH_READY",
  },
  {
    orderId: "PLS-SUB-619823",
    customerName: "Siddharth Nair",
    societyAndFlat: "C-404, Glenmark Residency, Kharegaon, Kalwa - 400605",
    slot: "6:00 AM – 8:00 AM",
    orderType: "SUBSCRIPTION",
    todaysFlowers: "Marigold + Chrysanthemum Mix",
    deliveryNote: "Paused before 8 PM (Out of station)",
    status: "PAUSED_TODAY",
  },
];

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<
    "DISPATCH" | "FLOWERS" | "PRICING" | "FESTIVE_CALENDAR"
  >("DISPATCH");
  const [flowers, setFlowers] = useState<FlowerProduct[]>(INITIAL_FLOWERS);
  const [plans, setPlans] = useState<SubscriptionPlan[]>(INITIAL_PLANS);
  const [dispatchRows, setDispatchRows] =
    useState<DispatchRow[]>(DEMO_DISPATCH_LIST);
  const [festiveMode, setFestiveMode] = useState({
    isFestiveDay: false,
    festivalName: "Festive Puja",
  });
  const [festiveDates, setFestiveDates] = useState<string[]>([]);
  const [normalPurchaseAllowed, setNormalPurchaseAllowed] = useState(true);
  const [toast, setToast] = useState<string>("");

  // Month-Wise Calendar State (Point #5)
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // New Flower Form State (English + Marathi + Photo Upload)
  const [newFlowerName, setNewFlowerName] = useState("");
  const [newFlowerMarathi, setNewFlowerMarathi] = useState("");
  const [newFlowerSubtitle, setNewFlowerSubtitle] = useState("");
  const [newFlowerImage, setNewFlowerImage] = useState("/images/merigold.jpeg");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadStatusNote, setUploadStatusNote] = useState("");
  const [newFlowerDeity, setNewFlowerDeity] = useState(
    "All Daily Puja Rituals"
  );
  const [price100g, setPrice100g] = useState(40);
  const [price250g, setPrice250g] = useState(95);
  const [price500g, setPrice500g] = useState(180);
  const [price1000g, setPrice1000g] = useState(340);

  useEffect(() => {
    setFlowers(getActiveFlowersCatalog());
    setFestiveDates(getFestiveDatesList());
    setFestiveMode(getFestiveModeStatus());
    setPlans(getActivePlansCatalog());
    setNormalPurchaseAllowed(getNormalPurchaseAllowed());

    const syncStoreAccess = () => {
      setNormalPurchaseAllowed(getNormalPurchaseAllowed());
      setFestiveMode(getFestiveModeStatus());
    };
    window.addEventListener("palassh-store-access-updated", syncStoreAccess);
    window.addEventListener("palassh-festive-updated", syncStoreAccess);

    try {
      const liveRows: DispatchRow[] = [];
      const savedSubRaw = localStorage.getItem("palassh_active_subscription");
      if (savedSubRaw) {
        const sub = JSON.parse(savedSubRaw);
        const firstDay = sub.schedule?.[0];
        const isPausedToday =
          sub.status === "PAUSED" ||
          sub.status === "CANCELLED" ||
          firstDay?.status === "PAUSED";
        liveRows.push({
          orderId: sub.orderId,
          customerName: sub.customerName,
          societyAndFlat: sub.address,
          slot: "6:00 AM – 8:00 AM",
          orderType: "SUBSCRIPTION",
          todaysFlowers:
            firstDay?.assignedFlower ||
            sub.defaultFlowers ||
            "Mixed Sacred Box",
          deliveryNote: sub.deliveryNote,
          status: isPausedToday ? "PAUSED_TODAY" : "DISPATCH_READY",
        });
      }

      const savedOneTimeRaw = localStorage.getItem("palassh_onetime_orders");
      if (savedOneTimeRaw) {
        const otList = JSON.parse(savedOneTimeRaw);
        if (Array.isArray(otList)) {
          otList.forEach((ord) => {
            liveRows.push({
              orderId: ord.orderId,
              customerName: ord.customerName || "Direct Customer",
              societyAndFlat: ord.address,
              slot: "6:00 AM – 8:00 AM",
              orderType: "ONE_TIME",
              todaysFlowers: ord.flowerSummary,
              deliveryNote: ord.deliveryNote || "Silent Doorstep Drop",
              status: "DISPATCH_READY",
            });
          });
        }
      }

      if (liveRows.length > 0) {
        setDispatchRows([...liveRows, ...DEMO_DISPATCH_LIST.slice(1)]);
      }
    } catch {
      // Ignore error
    }

    return () => {
      window.removeEventListener("palassh-store-access-updated", syncStoreAccess);
      window.removeEventListener("palassh-festive-updated", syncStoreAccess);
    };
  }, []);

  const showNotice = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4500);
  };

  // Toggle Normal Customer Direct Flower Purchases (Point #New: Separate from Festive)
  const handleToggleNormalPurchase = () => {
    const nextState = !normalPurchaseAllowed;
    setNormalPurchaseAllowed(nextState);
    saveNormalPurchaseAllowed(nextState);
    showNotice(
      nextState
        ? "Normal Shopping ENABLED: Non-subscribers can now purchase loose flowers up to 500g."
        : "Normal Shopping PAUSED: Loose flower orders are now locked exclusively for Weekly & Monthly subscribers!"
    );
  };

  // Toggle Manual Festive Mode
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
      nextState
        ? "Festive Day Mode ON: Direct flower sales locked for non-subscribers; Weekly (2KG) & Monthly (3KG) limits active!"
        : "Festive Manual Toggle OFF."
    );
  };

  // Toggle a specific YYYY-MM-DD date in the Festive Calendar (Point #5)
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
        : `Marked ${dateStr} as a Festive Day! Storefront rules will automatically enforce on this date.`
    );
  };

  // Direct Browser-to-Cloudinary Photo Upload with Instant Base64 Fallback
  const handlePhotoFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setUploadStatusNote("Uploading photo...");

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
          setNewFlowerImage(data.secure_url);
          setUploadStatusNote("Uploaded to Cloudinary CDN!");
          setIsUploadingImage(false);
          return;
        }
      } catch {
        // Fallback to local resized DataURL
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
        const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
        setNewFlowerImage(dataUrl);
        setUploadStatusNote("Photo ready for storefront!");
        setIsUploadingImage(false);
      };
      img.src = String(event.target?.result);
    };
    reader.readAsDataURL(file);
  };

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
        "Plucked fresh at 1:30 AM and delivered in breathable eco-pouches between 6:00 AM – 8:00 AM.",
      imageUrl: newFlowerImage.trim() || "/images/merigold.jpeg",
      basePricePer100g: Number(price100g),
      unitType: "WEIGHT",
      availableWeights: [
        { label: "100g", grams: 100, price: Number(price100g) },
        { label: "250g", grams: 250, price: Number(price250g) },
        { label: "500g", grams: 500, price: Number(price500g) },
        { label: "1000g", grams: 1000, price: Number(price1000g) },
      ],
      inStock: true,
      deityAffinity: newFlowerDeity.trim() || "All Daily Puja Rituals",
    };

    const updated = [...flowers, newFlower];
    setFlowers(updated);
    localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(updated));

    setNewFlowerName("");
    setNewFlowerMarathi("");
    setNewFlowerSubtitle("");
    setUploadStatusNote("");
    showNotice(
      `Added "${newFlower.name} (${newFlower.marathiName})" to Live Catalog!`
    );
  };

  const handleToggleFlowerStock = (id: string) => {
    const updated = flowers.map((f) =>
      f.id === id ? { ...f, inStock: !f.inStock } : f
    );
    setFlowers(updated);
    localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(updated));
    showNotice("Updated flower availability status.");
  };

  const handleRemoveFlower = (id: string, name: string) => {
    if (flowers.length <= 1) {
      alert("At least 1 flower must remain in the catalog.");
      return;
    }
    const updated = flowers.filter((f) => f.id !== id);
    setFlowers(updated);
    localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(updated));
    showNotice(`Removed "${name}" from the flower catalog.`);
  };

  const handleResetCatalog = () => {
    setFlowers(INITIAL_FLOWERS);
    localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(INITIAL_FLOWERS));
    showNotice("Reset catalog to default Marigold, Chrysanthemum & Red Hibiscus.");
  };

  const handleUpdatePlanPrice = (planId: string, newPrice: number) => {
    const updated = plans.map((p) => {
      if (p.id !== planId) return p;
      const count = p.deliveriesCount || 1;
      const perDay = Math.round(newPrice / count);
      return {
        ...p,
        price: newPrice,
        perDayEffectivePrice: perDay,
        shortHighlights: p.shortHighlights?.map((sh) =>
          sh.includes("effective") || sh.includes("/morning")
            ? `${count} Morning Deliveries (₹${perDay}/morning)`
            : sh
        ),
      };
    });
    setPlans(updated);
    saveActivePlansCatalog(updated);
    showNotice(`Updated plan pricing across the entire site.`);
  };

  // Generate calendar grid for current `calendarMonth`
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

  return (
    <FeatureBoundary featureName="ADMIN_DASHBOARD">
      <div className="min-h-screen bg-[#FAF7F2] pb-20">
        {/* Top Admin Header Bar */}
        <header className="bg-[#071C15] border-b border-emerald-900 px-4 py-6 sm:px-6 lg:px-8 text-white">
          <div className="mx-auto max-w-7xl flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-950 border border-amber-400/30 px-3.5 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-300">
                <Sparkles className="h-3 w-3 text-[#F05A36]" />
                <span>PALASSH Operations Command Center</span>
              </div>
              <h1 className="mt-1.5 font-serif text-3xl font-bold text-white">
                Morning 6–8 AM Dispatch & Festive Admin
              </h1>
              <p className="text-xs text-emerald-200/80">
                Hub: Kalwa, Thane (400605) • Serviceable Pincodes: 400601 to 400608
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Normal Customer Shopping Toggle */}
              <button
                type="button"
                onClick={handleToggleNormalPurchase}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
                  normalPurchaseAllowed
                    ? "border border-emerald-600 bg-emerald-950 text-emerald-200 hover:bg-emerald-900"
                    : "bg-[#E8502B] text-white shadow-lg ring-2 ring-orange-400/50"
                }`}
                title="When OFF, loose flowers can only be purchased by Weekly & Monthly subscribers"
              >
                {normalPurchaseAllowed ? (
                  <>
                    <Unlock className="h-4 w-4 text-emerald-400" />
                    <span>Normal Orders: ON (Public)</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 text-amber-300" />
                    <span>Normal Orders: OFF (Subscribers Only)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleToggleFestiveMode}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
                  festiveMode.isFestiveDay
                    ? "bg-amber-400 text-stone-950 shadow-lg"
                    : "border border-emerald-700 bg-emerald-950 text-emerald-200 hover:bg-emerald-900"
                }`}
              >
                <Flame className="h-4 w-4 text-[#E8502B]" />
                <span>
                  Festive Status: {festiveMode.isFestiveDay ? "ACTIVE" : "NORMAL"}
                </span>
              </button>

              <Link
                href="/products"
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-700 bg-emerald-950 px-4 py-2.5 text-xs font-bold text-amber-200"
              >
                <span>All Products Page</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>

              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#E8502B] to-[#D97706] px-4 py-2.5 text-xs font-bold text-white shadow-md"
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
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                6–8 AM Ready for Dispatch
              </span>
              <p className="mt-1 font-serif text-3xl font-bold text-emerald-800">
                {activeDeliveriesCount} Pouches
              </p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                Festive Dates Scheduled
              </span>
              <p className="mt-1 font-serif text-3xl font-bold text-[#E8502B]">
                {festiveDates.length} Days
              </p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                Registered Flowers
              </span>
              <p className="mt-1 font-serif text-3xl font-bold text-stone-900">
                {flowers.length} Varieties
              </p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                Non-Subscriber Orders
              </span>
              <p
                className={`mt-1 font-serif text-lg font-bold ${
                  normalPurchaseAllowed ? "text-emerald-800" : "text-[#E8502B]"
                }`}
              >
                {normalPurchaseAllowed
                  ? festiveMode.isFestiveDay
                    ? "Festive Lock (2KG/3KG)"
                    : "Open (500g Public)"
                  : "Locked (Subscribers Only)"}
              </p>
            </div>
          </div>

          {/* STORE ACCESS & CUSTOMER PURCHASE CONTROL CARD */}
          <div className="rounded-[2rem] border border-stone-200 bg-white p-6 sm:p-7 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1.5 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-900">
                  <Sparkles className="h-3 w-3 text-[#E8502B]" />
                  <span>Store Access Control • Normal Customer Purchases</span>
                </div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
                  Non-Subscriber Direct Flower Purchases
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  {normalPurchaseAllowed
                    ? "🟢 OPEN: Regular customers (without any plan) can browse and purchase loose flower packs (up to 500g). Subscribers can order up to 2–3 KG."
                    : "🔒 SUBSCRIBERS ONLY: Loose flower purchases are disabled for regular non-subscribers. Only active Weekly & Monthly plan subscribers can purchase loose flowers."}
                </p>
                <p className="text-[11px] text-stone-400 italic">
                  Note: This toggle operates separately from Festive Days. Weekly and Monthly subscription plans remain available for purchase at all times.
                </p>
              </div>

              <div className="flex items-center gap-4 bg-[#FAF7F2] border border-stone-200 p-4 rounded-2xl shrink-0">
                <div className="text-right">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Current Mode
                  </span>
                  <span
                    className={`inline-block font-bold text-xs ${
                      normalPurchaseAllowed ? "text-emerald-700" : "text-[#E8502B]"
                    }`}
                  >
                    {normalPurchaseAllowed ? "● ALL SHOPPERS ALLOWED" : "🔒 SUBSCRIBERS ONLY"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleToggleNormalPurchase}
                  className={`relative inline-flex h-8 w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    normalPurchaseAllowed ? "bg-emerald-600" : "bg-[#E8502B]"
                  }`}
                  role="switch"
                  aria-checked={normalPurchaseAllowed}
                  title="Click to toggle non-subscriber purchases"
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      normalPurchaseAllowed ? "translate-x-8" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {toast && (
            <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-300 bg-emerald-50 px-5 py-3.5 text-sm font-bold text-emerald-950 shadow-sm">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>{toast}</span>
            </div>
          )}

          {/* 4 Navigation Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-stone-200 pb-4">
            <button
              type="button"
              onClick={() => setActiveTab("DISPATCH")}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-bold transition cursor-pointer ${
                activeTab === "DISPATCH"
                  ? "bg-[#071C15] text-amber-300 shadow-sm"
                  : "bg-white text-stone-700 border border-stone-200 hover:bg-stone-50"
              }`}
            >
              <Truck className="h-4 w-4 text-[#F05A36]" />
              <span>1. Morning 6–8 AM Dispatch</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("FESTIVE_CALENDAR")}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-bold transition cursor-pointer ${
                activeTab === "FESTIVE_CALENDAR"
                  ? "bg-[#071C15] text-amber-300 shadow-sm"
                  : "bg-white text-stone-700 border border-stone-200 hover:bg-stone-50"
              }`}
            >
              <Calendar className="h-4 w-4 text-[#F05A36]" />
              <span>2. Festive Days Calendar ({festiveDates.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("FLOWERS")}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-bold transition cursor-pointer ${
                activeTab === "FLOWERS"
                  ? "bg-[#071C15] text-amber-300 shadow-sm"
                  : "bg-white text-stone-700 border border-stone-200 hover:bg-stone-50"
              }`}
            >
              <Flower2 className="h-4 w-4 text-[#F05A36]" />
              <span>3. Upload & Manage Flowers ({flowers.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("PRICING")}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-bold transition cursor-pointer ${
                activeTab === "PRICING"
                  ? "bg-[#071C15] text-amber-300 shadow-sm"
                  : "bg-white text-stone-700 border border-stone-200 hover:bg-stone-50"
              }`}
            >
              <IndianRupee className="h-4 w-4 text-[#F05A36]" />
              <span>4. Edit Plan Prices (₹49 / ₹329 / ₹1350)</span>
            </button>
          </div>

          {/* TAB 1: MORNING DISPATCH SHEET */}
          {activeTab === "DISPATCH" && (
            <div className="rounded-[2rem] border border-stone-200 bg-white p-6 sm:p-8 shadow-lg space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-stone-900">
                    Today&apos;s 6:00 AM – 8:00 AM Packing & Dispatch Sheet
                  </h2>
                  <p className="text-xs text-stone-500">
                    Synced with customer subscriptions and one-time gram pack orders across Thane 400601–400608.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 text-xs font-bold text-emerald-900">
                  <PackageCheck className="h-4 w-4 text-emerald-600" />
                  <span>Single Slot: 6:00 AM – 8:00 AM</span>
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                      <th className="py-3 px-4">Order & Type</th>
                      <th className="py-3 px-4">Customer & Society Flat</th>
                      <th className="py-3 px-4">Slot</th>
                      <th className="py-3 px-4">Flowers to Pack</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-xs">
                    {dispatchRows.map((row) => (
                      <tr
                        key={row.orderId}
                        className={
                          row.status === "PAUSED_TODAY"
                            ? "bg-stone-50/80 opacity-65"
                            : "hover:bg-orange-50/20"
                        }
                      >
                        <td className="py-4 px-4 font-bold text-stone-900">
                          <div>#{row.orderId}</div>
                          <span
                            className={`mt-1 inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                              row.orderType === "ONE_TIME"
                                ? "bg-orange-100 text-[#E8502B]"
                                : "bg-emerald-100 text-emerald-900"
                            }`}
                          >
                            {row.orderType}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-bold text-stone-900">
                            {row.customerName}
                          </p>
                          <p className="text-stone-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3 text-[#E8502B] shrink-0" />
                            <span>{row.societyAndFlat}</span>
                          </p>
                          <p className="text-[11px] text-stone-400 italic mt-0.5">
                            Note: {row.deliveryNote}
                          </p>
                        </td>
                        <td className="py-4 px-4 font-semibold text-stone-700">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-emerald-700" />
                            6:00 AM – 8:00 AM
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-block rounded-xl border border-orange-200 bg-[#FAF7F2] px-3 py-1.5 font-bold text-stone-900">
                            {row.todaysFlowers}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {row.status === "DISPATCH_READY" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-900">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                              Pack & Deliver
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-900">
                              <PauseCircle className="h-3.5 w-3.5 text-amber-700" />
                              Paused Today
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: MONTH-WISE FESTIVE DAYS CALENDAR (Point #5) */}
          {activeTab === "FESTIVE_CALENDAR" && (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              {/* Left: Interactive Month-Wise Calendar Grid (7 Cols) */}
              <div className="lg:col-span-7 rounded-[2rem] border border-stone-200 bg-white p-6 sm:p-8 shadow-lg space-y-6">
                <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#E8502B]">
                      Month-Wise Festive Planner
                    </span>
                    <h2 className="font-serif text-2xl font-bold text-stone-900">
                      Select Festive Dates
                    </h2>
                  </div>

                  {/* Month Switcher */}
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
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-[#FAF7F2] hover:bg-stone-100 cursor-pointer"
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
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-[#FAF7F2] hover:bg-stone-100 cursor-pointer"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Days of Week Header */}
                <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-bold uppercase text-stone-400">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (d) => (
                      <div key={d}>{d}</div>
                    )
                  )}
                </div>

                {/* Calendar Cells */}
                <div className="grid grid-cols-7 gap-2">
                  {renderCalendarDays().map((cell) => {
                    if (!cell.day) {
                      return <div key={cell.dateStr} className="h-12" />;
                    }
                    const isMarked = festiveDates.includes(cell.dateStr);
                    const isTomorrow = cell.dateStr === getTomorrowDateString();

                    return (
                      <button
                        key={cell.dateStr}
                        type="button"
                        onClick={() => handleToggleCalendarDate(cell.dateStr)}
                        className={`relative flex flex-col items-center justify-center h-14 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                          isMarked
                            ? "border-2 border-[#E8502B] bg-gradient-to-br from-[#E8502B] to-[#D97706] text-white shadow-md"
                            : "border-stone-200 bg-[#FAF7F2] text-stone-800 hover:border-orange-300 hover:bg-orange-50/50"
                        }`}
                      >
                        <span className="text-sm">{cell.day}</span>
                        {isMarked && (
                          <span className="text-[9px] uppercase tracking-wider text-amber-100">
                            Festive
                          </span>
                        )}
                        {!isMarked && isTomorrow && (
                          <span className="text-[9px] text-emerald-700 font-semibold">
                            Tomorrow
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-stone-100 text-xs text-stone-500">
                  <span>
                    Click any date to mark/unmark it as a Festive Day.
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleCalendarDate(getTomorrowDateString())}
                    className="rounded-xl bg-[#071C15] px-4 py-2 text-xs font-bold text-amber-300 cursor-pointer"
                  >
                    Quick Toggle Tomorrow ({getTomorrowDateString()})
                  </button>
                </div>
              </div>

              {/* Right: Scheduled Festive Dates List & Rules Explanation (5 Cols) */}
              <div className="lg:col-span-5 rounded-[2rem] border border-stone-200 bg-white p-6 sm:p-8 shadow-lg space-y-5 h-fit">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-800">
                    Automated Quota Enforcement
                  </span>
                  <h3 className="font-serif text-2xl font-bold text-stone-900">
                    Marked Festive Dates ({festiveDates.length})
                  </h3>
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                    On every date listed below, normal non-subscribed users are automatically blocked from buying direct flowers, while Weekly subscribers get up to <strong>2 KG</strong> and Monthly subscribers get up to <strong>3 KG</strong>.
                  </p>
                </div>

                {festiveDates.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-stone-200 p-6 text-center text-xs text-stone-400">
                    No festive dates marked yet. Click any date on the calendar to add.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
                    {festiveDates.map((dt) => (
                      <span
                        key={dt}
                        className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-bold text-[#E8502B]"
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

          {/* TAB 3: UPLOAD & MANAGE FLOWERS */}
          {activeTab === "FLOWERS" && (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              <form
                onSubmit={handleAddFlower}
                className="lg:col-span-5 rounded-[2rem] border border-stone-200 bg-white p-6 sm:p-8 shadow-lg space-y-4 h-fit"
              >
                <div className="border-b border-stone-100 pb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#E8502B]">
                    Cloudinary + Local Photo Upload
                  </span>
                  <h3 className="font-serif text-2xl font-bold text-stone-900">
                    Register New Flower
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
                      className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#E8502B] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Marathi Name (मराठी नाव) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. मोगरा"
                      value={newFlowerMarathi}
                      onChange={(e) => setNewFlowerMarathi(e.target.value)}
                      className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#E8502B] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Upload Flower Photo *
                  </label>
                  <div className="flex items-center gap-4 rounded-2xl border-2 border-dashed border-orange-200 bg-[#FAF7F2] p-3.5">
                    <img
                      src={newFlowerImage}
                      alt="Flower Preview"
                      className="h-16 w-16 rounded-xl object-cover border border-stone-200 shrink-0 bg-white"
                    />
                    <div className="flex-1 space-y-1.5">
                      <label className="inline-flex items-center gap-2 rounded-xl bg-[#071C15] px-4 py-2 text-xs font-bold text-amber-200 cursor-pointer hover:bg-emerald-950">
                        <Upload className="h-3.5 w-3.5 text-[#F05A36]" />
                        <span>
                          {isUploadingImage
                            ? "Uploading..."
                            : "Choose Photo from Gallery"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoFileSelect}
                          className="hidden"
                        />
                      </label>
                      {uploadStatusNote && (
                        <p className="text-[11px] font-medium text-emerald-800">
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
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#E8502B] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">
                      100g (₹)
                    </label>
                    <input
                      type="number"
                      required
                      value={price100g}
                      onChange={(e) => setPrice100g(Number(e.target.value))}
                      className="w-full rounded-xl border border-stone-300 px-2.5 py-2 text-sm font-bold text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">
                      250g (₹)
                    </label>
                    <input
                      type="number"
                      required
                      value={price250g}
                      onChange={(e) => setPrice250g(Number(e.target.value))}
                      className="w-full rounded-xl border border-stone-300 px-2.5 py-2 text-sm font-bold text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">
                      500g (₹)
                    </label>
                    <input
                      type="number"
                      required
                      value={price500g}
                      onChange={(e) => setPrice500g(Number(e.target.value))}
                      className="w-full rounded-xl border border-stone-300 px-2.5 py-2 text-sm font-bold text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">
                      1000g (₹)
                    </label>
                    <input
                      type="number"
                      required
                      value={price1000g}
                      onChange={(e) => setPrice1000g(Number(e.target.value))}
                      className="w-full rounded-xl border border-stone-300 px-2.5 py-2 text-sm font-bold text-stone-900"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#E8502B] to-[#D97706] py-3.5 text-xs font-bold text-white shadow-md cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Flower to Storefront</span>
                </button>
              </form>

              <div className="lg:col-span-7 rounded-[2rem] border border-stone-200 bg-white p-6 sm:p-8 shadow-lg space-y-5">
                <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                  <h3 className="font-serif text-2xl font-bold text-stone-900">
                    Registered Flowers ({flowers.length})
                  </h3>
                  <button
                    type="button"
                    onClick={handleResetCatalog}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset Default 3</span>
                  </button>
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
                          className="h-16 w-16 rounded-2xl object-cover border border-stone-200"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-serif text-lg font-bold text-stone-900">
                              {flw.name}
                            </h4>
                            <span className="text-xs font-semibold text-emerald-800">
                              ({flw.marathiName})
                            </span>
                          </div>
                          <p className="text-xs text-stone-500">
                            {flw.subtitle}
                          </p>
                          <p className="text-xs font-bold text-[#E8502B] mt-0.5">
                            {flw.availableWeights
                              .map((w) => `${w.grams}g: ₹${w.price}`)
                              .join(" • ")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleFlowerStock(flw.id)}
                          className="rounded-xl border border-stone-300 px-3 py-2 text-xs font-bold text-stone-700 hover:bg-stone-100 cursor-pointer"
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

          {/* TAB 4: SUBSCRIPTION PLAN PRICING EDITOR */}
          {activeTab === "PRICING" && (
            <div className="rounded-[2rem] border border-stone-200 bg-white p-6 sm:p-8 shadow-lg space-y-6">
              <div>
                <h2 className="font-serif text-2xl font-bold text-stone-900">
                  Subscription Tier Pricing Manager
                </h2>
                <p className="text-xs text-stone-500">
                  Update prepaid prices for One Day Puja Pack (₹49), Weekly (₹329), and Monthly (₹1,350) plans.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className="rounded-2xl border border-stone-200 bg-[#FAF7F2] p-6 space-y-4"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#E8502B]">
                      {plan.deliveriesCount} Morning Deliveries
                    </span>
                    <h3 className="font-serif text-2xl font-bold text-stone-900">
                      {plan.title}
                    </h3>
                    <div>
                      <label className="block text-xs font-bold text-stone-600 mb-1.5">
                        Plan Price (₹ / {plan.billingCycle})
                      </label>
                      <input
                        type="number"
                        value={plan.price}
                        onChange={(e) =>
                          handleUpdatePlanPrice(plan.id, Number(e.target.value))
                        }
                        className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 font-serif text-2xl font-bold text-stone-900 focus:border-[#E8502B] focus:outline-none"
                      />
                    </div>
                    <p className="text-xs font-semibold text-emerald-900">
                      Effective Rate: ₹{plan.perDayEffectivePrice} / morning
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </FeatureBoundary>
  );
}