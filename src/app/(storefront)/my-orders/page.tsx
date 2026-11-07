"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  PauseCircle,
  PlayCircle,
  XCircle,
  Calendar,
  MapPin,
  CheckCircle2,
  Sparkles,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Lock,
  Mail,
  FileText,
  AlertTriangle,
  ArrowRight,
  KeyRound,
  X,
  PlusCircle,
} from "lucide-react";
import { FeatureBoundary } from "@/components/shared/FeatureBoundary";
import {
  FlowerProduct,
  INITIAL_FLOWERS,
  getActiveFlowersCatalog,
  saveStoredCart,
  getEarliestDeliveryDateString,
  getSubscriberAddonWindow,
} from "@/features/catalog/types";

interface CalendarDeliveryDay {
  dateStr: string;
  dayNumber: number;
  status: "SCHEDULED" | "PAUSED" | "CANCELLED";
  orderNote: string;
}

interface ActiveSubscription {
  id?: string;
  orderId: string;
  planId: string;
  planTitle: string;
  pricePaid: number;
  billingCycle: string;
  totalDeliveries: number;
  remainingDeliveries: number;
  maxPausesAllowed: number;
  pausesUsedCount: number;
  status: "ACTIVE" | "PAUSED" | "CANCELLED";
  startDate: string;
  deliverySlot: string;
  defaultFlowers: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  deliveryNote: string;
  calendarDays: CalendarDeliveryDay[];
}

interface OneTimeOrderRecord {
  orderId: string;
  orderType: "ONE_TIME";
  flowerSummary: string;
  totalGrams: number;
  amountPaid: number;
  deliveryDate: string;
  deliverySlot: string;
  customerName: string;
  email?: string;
  phone: string;
  address: string;
  deliveryNote: string;
  status: string;
  createdAt: string;
}

function MyOrdersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTabParam = searchParams.get("tab");

  const [activeSubTab, setActiveSubTab] = useState<"SUBSCRIPTION" | "ONETIME">(
    initialTabParam === "onetime" ? "ONETIME" : "SUBSCRIPTION"
  );

  const [sub, setSub] = useState<ActiveSubscription | null>(null);
  const [oneTimeOrders, setOneTimeOrders] = useState<OneTimeOrderRecord[]>([]);
  const [flowers, setFlowers] = useState<FlowerProduct[]>(INITIAL_FLOWERS);
  const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(true);
  const [isMutatingServer, setIsMutatingServer] = useState(false);

  // Quick Add-On Builder State right inside My-Orders Calendar
  const [addonFlowerId, setAddonFlowerId] = useState<string>(
    INITIAL_FLOWERS[0]?.id || "flw-mixed-marigold"
  );
  const [addonWeightGrams, setAddonWeightGrams] = useState<100 | 150>(100);

  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [selectedDateStr, setSelectedDateStr] = useState<string>("");
  const [noteInput, setNoteInput] = useState<string>("");
  const [toast, setToast] = useState<string>("");
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [resolvedLoginEmail, setResolvedLoginEmail] = useState("");
  const [otpSentToEmail, setOtpSentToEmail] = useState("");
  const [enteredOtp, setEnteredOtp] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const showToastMsg = (msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = setTimeout(() => setToast(""), 5000);
  };

  const applyFetchedSubscription = (fetchedSub: ActiveSubscription | null) => {
    setSub(fetchedSub);
    if (fetchedSub) {
      localStorage.setItem(
        "palassh_active_subscription",
        JSON.stringify(fetchedSub)
      );
      const firstDay = fetchedSub.calendarDays?.[0];
      if (firstDay) {
        setSelectedDateStr(firstDay.dateStr);
        setNoteInput(firstDay.orderNote || fetchedSub.deliveryNote || "");
        const firstDateObj = new Date(`${firstDay.dateStr}T00:00:00`);
        if (!isNaN(firstDateObj.getTime())) {
          setCalendarMonth(
            new Date(firstDateObj.getFullYear(), firstDateObj.getMonth(), 1)
          );
        }
      }
    } else {
      localStorage.removeItem("palassh_active_subscription");
    }
  };

  useEffect(() => {
    const activeFlw = getActiveFlowersCatalog().filter((f) => f.inStock);
    if (activeFlw.length > 0) {
      setFlowers(activeFlw);
      setAddonFlowerId(activeFlw[0].id);
    }

    setIsLoadingOrders(true);
    fetch("/api/orders", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && data?.authenticated) {
          applyFetchedSubscription(data.activeSubscription || null);
          if (Array.isArray(data.oneTimeOrders)) {
            setOneTimeOrders(data.oneTimeOrders);
            localStorage.setItem(
              "palassh_onetime_orders",
              JSON.stringify(data.oneTimeOrders)
            );
          }
        } else {
          const savedSub = localStorage.getItem("palassh_active_subscription");
          if (savedSub) {
            const parsed = JSON.parse(savedSub);
            if (
              parsed &&
              parsed.orderId &&
              !String(parsed.orderId).includes("849201")
            ) {
              applyFetchedSubscription(parsed);
            }
          }
          const savedOt = localStorage.getItem("palassh_onetime_orders");
          if (savedOt) {
            const parsedOt = JSON.parse(savedOt);
            if (Array.isArray(parsedOt)) {
              setOneTimeOrders(
                parsedOt.filter((o) => !String(o.orderId).includes("512098"))
              );
            }
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsLoadingOrders(false);
      });
  }, []);

  const persistSub = (updated: ActiveSubscription, message: string) => {
    setSub(updated);
    showToastMsg(message);
    try {
      localStorage.setItem(
        "palassh_active_subscription",
        JSON.stringify(updated)
      );
    } catch {
      // Ignore
    }
  };

  const handleSelectDateOnCalendar = (dateStr: string) => {
    if (!sub) return;
    setSelectedDateStr(dateStr);
    const matched = sub.calendarDays.find((d) => d.dateStr === dateStr);
    if (matched) {
      setNoteInput(matched.orderNote || sub.deliveryNote);
    }
  };

  const handleSaveDateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sub) return;
    setIsMutatingServer(true);

    try {
      const res = await fetch("/api/orders/pause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: sub.orderId,
          subscriptionId: sub.id,
          dateStr: selectedDateStr,
          action: "UPDATE_NOTE",
          orderNote: noteInput.trim(),
        }),
      });
      const data = await res.json();

      if (res.ok && data.success && data.subscription) {
        persistSub(
          { ...sub, ...data.subscription },
          data.message || `Saved delivery note for ${selectedDateStr}!`
        );
        return;
      }
      if (data.error) {
        showToastMsg(data.error);
      }
    } catch {
      showToastMsg("Network error while saving note.");
    } finally {
      setIsMutatingServer(false);
    }
  };

  const handlePauseOrCancelSelectedDate = async () => {
    if (!sub) return;
    const targetDay = sub.calendarDays.find(
      (d) => d.dateStr === selectedDateStr
    );
    if (!targetDay || targetDay.status === "CANCELLED") return;

    setIsMutatingServer(true);
    try {
      const res = await fetch("/api/orders/pause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: sub.orderId,
          subscriptionId: sub.id,
          dateStr: selectedDateStr,
          action: "TOGGLE_PAUSE_OR_CANCEL",
        }),
      });
      const data = await res.json();

      if (res.ok && data.success && data.subscription) {
        persistSub(
          { ...sub, ...data.subscription },
          data.message || `Updated delivery status for ${selectedDateStr}.`
        );
        return;
      }

      if (data.error) {
        showToastMsg(data.error);
      }
    } catch {
      showToastMsg("Network error while updating delivery schedule.");
    } finally {
      setIsMutatingServer(false);
    }
  };

  // Direct 1-Click Subscriber Add-On Checkout for Selected Calendar Date (100g or 150g Only)
  const handleBookAddonForDate = (targetDate: string) => {
    const flw =
      flowers.find((f) => f.id === addonFlowerId) ||
      flowers[0] ||
      INITIAL_FLOWERS[0];
    const weightPack =
      flw.availableWeights.find((w) => w.grams === addonWeightGrams) || {
        grams: addonWeightGrams,
        price: addonWeightGrams === 150 ? 55 : 45,
      };

    saveStoredCart([
      {
        id: `${flw.id}-${addonWeightGrams}`,
        flowerId: flw.id,
        flowerName: flw.name,
        marathiName: flw.marathiName,
        imageUrl: flw.imageUrl,
        weightLabel: `${addonWeightGrams}g`,
        grams: addonWeightGrams,
        unitPrice: weightPack.price,
        quantity: 1,
        addonDeliveryDate: targetDate,
      },
    ]);

    router.push(
      `/checkout?mode=onetime&date=${encodeURIComponent(targetDate)}`
    );
  };

  const renderMonthCells = () => {
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

  const handleSendLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    if (!loginIdentifier.trim()) return;

    setIsAuthLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose: "LOGIN_SYNC",
          identifier: loginIdentifier.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setLoginError(
          data.error || "No registered account found for this phone or email."
        );
        return;
      }

      setResolvedLoginEmail(data.email);
      setOtpSentToEmail(
        data.devOtpHint
          ? `${data.maskedEmail} (Dev OTP: ${data.devOtpHint})`
          : data.maskedEmail
      );
    } catch {
      setLoginError("Network error while requesting verification OTP.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleVerifyLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    if (enteredOtp.length !== 6) {
      setLoginError("Please enter the 6-digit verification code.");
      return;
    }

    setIsAuthLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resolvedLoginEmail || loginIdentifier.trim(),
          code: enteredOtp.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setLoginError(data.error || "Invalid OTP code.");
        return;
      }

      const ordRes = await fetch("/api/orders", { cache: "no-store" });
      const ordData = await ordRes.json();
      applyFetchedSubscription(ordData?.activeSubscription || null);
      if (Array.isArray(ordData?.oneTimeOrders)) {
        setOneTimeOrders(ordData.oneTimeOrders);
        localStorage.setItem(
          "palassh_onetime_orders",
          JSON.stringify(ordData.oneTimeOrders)
        );
      }

      setIsLoginModalOpen(false);
      setOtpSentToEmail("");
      setEnteredOtp("");
      showToastMsg(
        "Verified via Email OTP! Your live subscription & delivery calendar are now synced."
      );
    } catch {
      setLoginError("Network error while verifying OTP.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const earliestBufferDate = getEarliestDeliveryDateString();
  const isWeeklyOrMonthlySub =
    sub &&
    sub.status === "ACTIVE" &&
    (sub.totalDeliveries >= 7 ||
      sub.billingCycle === "week" ||
      sub.billingCycle === "month");

  const scheduledDatesSorted = sub
    ? sub.calendarDays
        .filter((d) => d.status === "SCHEDULED")
        .map((d) => d.dateStr)
        .sort()
    : [];

  const addonWindow = getSubscriberAddonWindow({
    scheduledDatesSorted,
    earliestBufferDate,
  });

  const activeSelectedDayObj = sub?.calendarDays.find(
    (d) => d.dateStr === selectedDateStr
  );
  const pausesRemaining = sub
    ? Math.max(0, sub.maxPausesAllowed - sub.pausesUsedCount)
    : 0;

  const existingAddOnForSelectedDate = oneTimeOrders.find(
    (o) => o.deliveryDate === selectedDateStr && o.status !== "CANCELLED"
  );

  const selectedAddonFlowerObj =
    flowers.find((f) => f.id === addonFlowerId) ||
    flowers[0] ||
    INITIAL_FLOWERS[0];
  const selectedAddonPrice =
    selectedAddonFlowerObj.availableWeights.find(
      (w) => w.grams === addonWeightGrams
    )?.price || (addonWeightGrams === 150 ? 55 : 45);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#FAF6F0] py-10 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Top Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between border-b border-[#E6DEC8] pb-6">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1C1917] px-3.5 py-1 text-[10px] font-bold uppercase tracking-widest text-[#F5D0A9]">
                <Sparkles className="h-3 w-3 text-[#D95326]" />
                <span>Subscriber Calendar & Daily Add-On Desk</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setLoginError("");
                  setIsLoginModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#E6DEC8] bg-white px-3 py-1 text-[11px] font-bold text-[#D95326] hover:border-[#D95326] cursor-pointer"
              >
                <Mail className="h-3 w-3" />
                <span>Sync Account via Email / Phone OTP</span>
              </button>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
              My Orders, Calendar & Loose Flower Add-Ons
            </h1>
            <p className="text-xs sm:text-sm text-stone-600">
              Tap any delivery date below to pause deliveries or book an extra{" "}
              <strong className="text-[#D95326]">100g / 150g Add-On Pack</strong>{" "}
              (with 1-day farm buffer, up to 1 day before your plan ends).
            </p>
          </div>

          <div className="inline-flex rounded-2xl border border-[#E6DEC8] bg-white p-1.5 shadow-2xs self-start">
            <button
              type="button"
              onClick={() => setActiveSubTab("SUBSCRIPTION")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
                activeSubTab === "SUBSCRIPTION"
                  ? "bg-[#D95326] text-white shadow-2xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>1. Subscription & Add-On Calendar</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab("ONETIME")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
                activeSubTab === "ONETIME"
                  ? "bg-[#D95326] text-white shadow-2xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>2. Booked Add-Ons ({oneTimeOrders.length})</span>
            </button>
          </div>
        </div>

        {toast && (
          <div className="flex items-center gap-2.5 rounded-2xl border border-[#D95326] bg-[#FFF3EC] p-4 text-xs sm:text-sm font-bold text-stone-900 shadow-2xs">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-[#D95326]" />
            <span>{toast}</span>
          </div>
        )}

        {isLoadingOrders ? (
          <div className="rounded-3xl border border-[#E6DEC8] bg-white p-12 text-center text-xs font-bold text-stone-500">
            Loading your live subscription & delivery calendar from database...
          </div>
        ) : activeSubTab === "SUBSCRIPTION" ? (
          !sub ? (
            <div className="rounded-3xl border border-[#E6DEC8] bg-white p-8 sm:p-12 text-center shadow-sm space-y-5 max-w-2xl mx-auto">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF3EC] text-[#D95326]">
                <Calendar className="h-7 w-7" />
              </div>
              <div className="space-y-2">
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
                  No Active Subscription Found on This Device
                </h2>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  Subscribe to a Weekly or Monthly Plan in 100g or 150g to unlock
                  your interactive morning calendar and Daily Loose Flower
                  Add-Ons.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link
                  href="/#plans"
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#D95326] hover:bg-[#BA421B] px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-sm transition"
                >
                  <span>Explore 100g & 150g Plans</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => setIsLoginModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-[#E6DEC8] bg-[#FAF6F0] px-6 py-3.5 text-xs sm:text-sm font-bold text-stone-800 hover:border-[#D95326] cursor-pointer"
                >
                  <Mail className="h-4 w-4 text-[#D95326]" />
                  <span>Sync Existing Account via Email OTP</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Top Subscription Summary + Dedicated Subscriber Add-On Bar */}
              <div className="overflow-hidden rounded-3xl sm:rounded-[2.2rem] border border-[#E6DEC8] bg-white shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-[#1C1917] px-5 sm:px-7 py-4 text-white">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-xs font-bold text-[#F5D0A9]">
                      Order #{sub.orderId}
                    </span>
                    <span className="rounded-full bg-white/10 border border-white/15 px-3 py-0.5 text-[11px] font-bold text-white">
                      Slot: 6:00 AM – 8:00 AM
                    </span>
                    <span className="rounded-full bg-[#D95326] px-3 py-0.5 text-[11px] font-bold text-white">
                      Status: {sub.status}
                    </span>
                    <span className="rounded-full bg-white/10 border border-white/15 px-3 py-0.5 text-[11px] font-bold text-[#F5D0A9]">
                      Pauses Used: {sub.pausesUsedCount} /{" "}
                      {sub.maxPausesAllowed}
                    </span>
                  </div>

                  {isWeeklyOrMonthlySub && addonWindow.canBookAnyAddon && (
                    <Link
                      href="/products"
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#D95326] hover:bg-[#BA421B] px-4 py-1.5 text-xs font-bold text-white transition"
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      <span>Browse Full Add-On Flower Store (100g / 150g)</span>
                    </Link>
                  )}
                </div>

                <div className="p-5 sm:p-7 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
                  <div className="lg:col-span-7 space-y-2">
                    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
                      {sub.planTitle} (₹{sub.pricePaid.toLocaleString("en-IN")})
                    </h2>
                    <div className="inline-flex items-center gap-2 rounded-xl border border-[#E6DEC8] bg-[#FAF6F0] px-3.5 py-2 text-xs text-stone-800">
                      <Lock className="h-3.5 w-3.5 text-[#D95326] shrink-0" />
                      <span>
                        <strong>Daily Plan Pouch:</strong> {sub.defaultFlowers}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 flex items-center gap-1.5 pt-1">
                      <MapPin className="h-3.5 w-3.5 text-[#D95326] shrink-0" />
                      <span>
                        {sub.customerName} ({sub.email}) — {sub.address}
                      </span>
                    </p>
                  </div>

                  <div className="lg:col-span-5 rounded-2xl border border-[#E6DEC8] bg-[#FAF6F0] p-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-stone-900">
                      <span>Add-On & Schedule Window:</span>
                      <span className="text-[#D95326]">
                        {pausesRemaining} Pauses Left
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-600 leading-relaxed">
                      • First Delivery:{" "}
                      <strong>
                        {sub.calendarDays[0]?.dateStr || sub.startDate}
                      </strong>{" "}
                      • Last Delivery:{" "}
                      <strong>
                        {sub.calendarDays[sub.calendarDays.length - 1]
                          ?.dateStr || sub.startDate}
                      </strong>
                      <br />•{" "}
                      {isWeeklyOrMonthlySub ? (
                        addonWindow.canBookAnyAddon ? (
                          <span>
                            Add-Ons (100g/150g) open up to{" "}
                            <strong className="text-[#D95326]">
                              {addonWindow.maxAllowedAddonDate}
                            </strong>{" "}
                            (Final 1 day locked).
                          </span>
                        ) : (
                          <span className="text-rose-700 font-semibold">
                            {addonWindow.blockReason}
                          </span>
                        )
                      ) : (
                        <span>
                          Upgrade to Weekly or Monthly plan to unlock 100g/150g
                          daily Add-Ons.
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* MONTH-WISE CALENDAR + CLICKABLE DATE ACTION & ADD-ON CARD */}
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                <div className="lg:col-span-7 rounded-3xl sm:rounded-[2.2rem] border border-[#E6DEC8] bg-white p-5 sm:p-8 shadow-md space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#D95326]">
                        Interactive Monthly View
                      </span>
                      <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
                        Your Morning Deliveries & Add-Ons
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
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
                      <span className="font-serif text-sm sm:text-base font-bold text-stone-900 min-w-[130px] text-center">
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

                  <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold text-stone-600">
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-md bg-[#D95326] inline-block" />
                      Scheduled (6–8 AM)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-md bg-stone-900 inline-block" />
                      + Add-On Booked
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-md bg-stone-400 inline-block" />
                      Paused
                    </span>
                  </div>

                  <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center text-[10px] sm:text-[11px] font-bold uppercase text-stone-400">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                      (d) => (
                        <div key={d}>{d}</div>
                      )
                    )}
                  </div>

                  <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                    {renderMonthCells().map((cell) => {
                      if (!cell.day) {
                        return (
                          <div key={cell.dateStr} className="h-12 sm:h-14" />
                        );
                      }
                      const deliveryDay = sub.calendarDays.find(
                        (d) => d.dateStr === cell.dateStr
                      );
                      const isSelected = selectedDateStr === cell.dateStr;
                      const hasAddOnOnCell = oneTimeOrders.some(
                        (o) =>
                          o.deliveryDate === cell.dateStr &&
                          o.status !== "CANCELLED"
                      );

                      if (!deliveryDay) {
                        return (
                          <div
                            key={cell.dateStr}
                            className="flex flex-col items-center justify-center h-12 sm:h-14 rounded-xl border border-stone-100 bg-stone-50/50 text-xs text-stone-300 select-none"
                          >
                            <span>{cell.day}</span>
                          </div>
                        );
                      }

                      const statusClasses =
                        deliveryDay.status === "SCHEDULED"
                          ? "border-[#D95326]/50 bg-[#FFF3EC] text-stone-900 hover:bg-[#F3ECE1]"
                          : deliveryDay.status === "PAUSED"
                          ? "border-stone-400 bg-stone-200 text-stone-800"
                          : "border-rose-300 bg-rose-50 text-rose-800 line-through";

                      return (
                        <button
                          key={cell.dateStr}
                          type="button"
                          onClick={() =>
                            handleSelectDateOnCalendar(cell.dateStr)
                          }
                          className={`relative flex flex-col items-center justify-center h-12 sm:h-14 rounded-xl sm:rounded-2xl border text-xs font-bold transition cursor-pointer ${statusClasses} ${
                            isSelected
                              ? "ring-2 ring-[#D95326] ring-offset-2 scale-105 shadow-sm"
                              : ""
                          }`}
                        >
                          <span className="text-sm font-bold">{cell.day}</span>
                          <span className="text-[8px] uppercase tracking-tighter text-[#D95326]">
                            {hasAddOnOnCell
                              ? "+ ADD-ON"
                              : deliveryDay.status === "SCHEDULED"
                              ? `Day ${deliveryDay.dayNumber}`
                              : deliveryDay.status}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Date Action Card + Dedicated Subscriber Add-On Panel (5 Cols) */}
                <div className="lg:col-span-5">
                  <div className="sticky top-28 rounded-3xl sm:rounded-[2.2rem] border border-[#E6DEC8] bg-white p-6 sm:p-8 shadow-md space-y-6">
                    {activeSelectedDayObj ? (
                      <>
                        <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-4">
                          <div>
                            <span className="inline-block rounded-lg bg-[#1C1917] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#F5D0A9]">
                              Delivery Day #{activeSelectedDayObj.dayNumber}
                            </span>
                            <h3 className="mt-2 font-serif text-2xl font-bold text-stone-900">
                              {new Date(
                                `${activeSelectedDayObj.dateStr}T00:00:00`
                              ).toLocaleDateString("en-IN", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </h3>
                            <p className="text-xs text-stone-500 mt-0.5">
                              Morning Window: 6:00 AM – 8:00 AM
                            </p>
                          </div>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              activeSelectedDayObj.status === "SCHEDULED"
                                ? "bg-[#FFF3EC] text-[#D95326]"
                                : activeSelectedDayObj.status === "PAUSED"
                                ? "bg-stone-200 text-stone-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {activeSelectedDayObj.status}
                          </span>
                        </div>

                        <div className="rounded-2xl border border-[#E6DEC8] bg-[#FAF6F0] p-4 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
                            <Lock className="h-3 w-3 text-[#D95326]" />
                            Daily Plan Pouch
                          </span>
                          <p className="text-xs font-bold text-stone-900 leading-relaxed">
                            {sub.defaultFlowers}
                          </p>
                        </div>

                        {/* DEDICATED SUBSCRIBER LOOSE FLOWER ADD-ON PANEL (100g / 150g Only) */}
                        {isWeeklyOrMonthlySub &&
                          activeSelectedDayObj.status === "SCHEDULED" && (
                            <div className="rounded-2xl border-2 border-[#D95326]/40 bg-[#FFF3EC]/70 p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-[#D95326] flex items-center gap-1.5">
                                  <PlusCircle className="h-3.5 w-3.5" />
                                  <span>
                                    Extra Loose Flower Add-On (100g / 150g)
                                  </span>
                                </span>
                              </div>

                              {existingAddOnForSelectedDate ? (
                                <div className="rounded-xl bg-white border border-[#E6DEC8] p-3 text-xs space-y-1">
                                  <p className="font-bold text-stone-900">
                                    ✓ Add-On Booked for{" "}
                                    {activeSelectedDayObj.dateStr}:
                                  </p>
                                  <p className="text-[#D95326] font-bold">
                                    + {existingAddOnForSelectedDate.flowerSummary}{" "}
                                    (Paid ₹
                                    {existingAddOnForSelectedDate.amountPaid})
                                  </p>
                                  <p className="text-[10px] text-stone-500">
                                    Max 1 Add-On pack (100g or 150g) allowed per
                                    day.
                                  </p>
                                </div>
                              ) : addonWindow.lockedLastTwoDates.includes(
                                  activeSelectedDayObj.dateStr
                                ) ? (
                                <div className="rounded-xl bg-white border border-[#E6DEC8] p-3 text-xs text-stone-600 flex items-start gap-2">
                                  <Lock className="h-4 w-4 text-[#D95326] shrink-0 mt-0.5" />
                                  <span>
                                    <strong>Final 1 Day Lockout:</strong>{" "}
                                    {activeSelectedDayObj.dateStr} is within the
                                    final 2 delivery days of your subscription.
                                    Add-Ons are locked on the last day.
                                  </span>
                                </div>
                              ) : activeSelectedDayObj.dateStr <
                                earliestBufferDate ? (
                                <div className="rounded-xl bg-white border border-[#E6DEC8] p-3 text-xs text-stone-600 flex items-start gap-2">
                                  <Lock className="h-4 w-4 text-[#D95326] shrink-0 mt-0.5" />
                                  <span>
                                    <strong>1-Day Farm Buffer Passed:</strong>{" "}
                                    Add-Ons require a 1-day farm harvest buffer
                                    (earliest eligible date:{" "}
                                    <strong>{earliestBufferDate}</strong>).
                                  </span>
                                </div>
                              ) : (
                                <div className="space-y-2.5">
                                  <div className="grid grid-cols-2 gap-2">
                                    {([100, 150] as const).map((wt) => (
                                      <button
                                        key={wt}
                                        type="button"
                                        onClick={() => setAddonWeightGrams(wt)}
                                        className={`rounded-xl py-2 text-xs font-bold transition cursor-pointer ${
                                          addonWeightGrams === wt
                                            ? "bg-stone-900 text-white"
                                            : "bg-white border border-[#E6DEC8] text-stone-700"
                                        }`}
                                      >
                                        + {wt} gms Pack
                                      </button>
                                    ))}
                                  </div>

                                  <select
                                    value={addonFlowerId}
                                    onChange={(e) =>
                                      setAddonFlowerId(e.target.value)
                                    }
                                    className="w-full rounded-xl border border-[#E6DEC8] bg-white px-3 py-2 text-xs font-bold text-stone-900 focus:border-[#D95326] focus:outline-none"
                                  >
                                    {flowers.map((f) => {
                                      const p =
                                        f.availableWeights.find(
                                          (w) => w.grams === addonWeightGrams
                                        )?.price ||
                                        (addonWeightGrams === 150 ? 55 : 45);
                                      return (
                                        <option key={f.id} value={f.id}>
                                          {f.name} ({f.marathiName}) —{" "}
                                          {addonWeightGrams}g @ ₹{p}
                                        </option>
                                      );
                                    })}
                                  </select>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleBookAddonForDate(
                                        activeSelectedDayObj.dateStr
                                      )
                                    }
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#D95326] hover:bg-[#BA421B] py-2.5 text-xs font-bold text-white shadow-2xs cursor-pointer transition"
                                  >
                                    <PlusCircle className="h-3.5 w-3.5" />
                                    <span>
                                      Book {addonWeightGrams}g Add-On for{" "}
                                      {activeSelectedDayObj.dateStr} (₹
                                      {selectedAddonPrice})
                                    </span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                        <form onSubmit={handleSaveDateNote} className="space-y-3">
                          <label className="block text-xs font-bold text-stone-700 flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-[#D95326]" />
                            <span>
                              Order / Doorstep Note for This Date (Optional)
                            </span>
                          </label>
                          <textarea
                            rows={2}
                            value={noteInput}
                            onChange={(e) => setNoteInput(e.target.value)}
                            placeholder="e.g. Leave pouch with security guard today..."
                            className="w-full rounded-xl border border-[#E6DEC8] bg-[#FAF6F0] p-3 text-xs sm:text-sm text-stone-900 focus:border-[#D95326] focus:bg-white focus:outline-none"
                          />
                          <button
                            type="submit"
                            disabled={isMutatingServer}
                            className="rounded-xl border border-[#E6DEC8] bg-[#FAF6F0] px-4 py-2 text-xs font-bold text-stone-800 hover:border-[#D95326] cursor-pointer disabled:opacity-60"
                          >
                            Save Note for {activeSelectedDayObj.dateStr}
                          </button>
                        </form>

                        <div className="border-t border-stone-100 pt-5 space-y-3">
                          {activeSelectedDayObj.status === "SCHEDULED" &&
                            pausesRemaining === 0 && (
                              <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-[11px] font-semibold text-rose-900">
                                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                                <span>
                                  You have used all{" "}
                                  <strong>
                                    {sub.maxPausesAllowed} allowed pauses
                                  </strong>
                                  . Skipping this date will{" "}
                                  <strong>CANCEL</strong> the delivery without
                                  carry-forward.
                                </span>
                              </div>
                            )}

                          {activeSelectedDayObj.status === "CANCELLED" ? (
                            <div className="rounded-2xl bg-rose-100 py-3.5 text-center text-xs font-bold text-rose-900">
                              This Delivery Was Cancelled (Quota Exceeded)
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={isMutatingServer}
                              onClick={handlePauseOrCancelSelectedDate}
                              className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-xs sm:text-sm font-bold text-white shadow-sm transition cursor-pointer disabled:opacity-60 ${
                                activeSelectedDayObj.status === "PAUSED"
                                  ? "bg-stone-900 hover:bg-stone-800"
                                  : pausesRemaining > 0
                                  ? "bg-[#D95326] hover:bg-[#BA421B]"
                                  : "bg-rose-600 hover:bg-rose-700"
                              }`}
                            >
                              {activeSelectedDayObj.status === "PAUSED" ? (
                                <>
                                  <PlayCircle className="h-4 w-4" />
                                  <span>
                                    Resume Delivery for{" "}
                                    {activeSelectedDayObj.dateStr}
                                  </span>
                                </>
                              ) : pausesRemaining > 0 ? (
                                <>
                                  <PauseCircle className="h-4 w-4" />
                                  <span>
                                    Pause This Date ({pausesRemaining} of{" "}
                                    {sub.maxPausesAllowed} Pauses Left)
                                  </span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4" />
                                  <span>
                                    Cancel Delivery (Pause Limit Reached)
                                  </span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="py-12 text-center text-xs text-stone-500">
                        Click any highlighted delivery date digit on the
                        calendar to manage that day&apos;s delivery or book a
                        100g/150g Add-On.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        ) : (
          /* SUB-TAB 2: BOOKED SUBSCRIBER ADD-ONS */
          <div className="rounded-3xl sm:rounded-[2.2rem] border border-[#E6DEC8] bg-white p-6 sm:p-8 shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#D95326]">
                  Subscriber Add-On History (100g & 150g Packs)
                </span>
                <h2 className="font-serif text-2xl font-bold text-stone-900">
                  Booked Loose Flower Add-Ons ({oneTimeOrders.length})
                </h2>
              </div>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-2xl bg-[#D95326] hover:bg-[#BA421B] px-5 py-3 text-xs font-bold text-white shadow-2xs transition"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Book New 100g / 150g Add-On</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {oneTimeOrders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#E6DEC8] bg-[#FAF6F0] p-10 text-center text-xs text-stone-500">
                No additional 100g/150g flower Add-Ons booked yet.
              </div>
            ) : (
              <div className="space-y-4">
                {oneTimeOrders.map((ord) => (
                  <div
                    key={ord.orderId}
                    className="rounded-2xl border border-[#E6DEC8] bg-[#FAF6F0] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="rounded-lg bg-[#1C1917] px-3 py-1 text-xs font-bold text-[#F5D0A9]">
                          #{ord.orderId}
                        </span>
                        <span className="rounded-full bg-[#FFF3EC] border border-[#E6DEC8] px-3 py-0.5 text-[11px] font-bold text-[#D95326]">
                          {ord.status} • {ord.totalGrams}g Add-On
                        </span>
                        <span className="text-xs font-semibold text-stone-600">
                          Delivery Date: <strong>{ord.deliveryDate}</strong>{" "}
                          (6:00 AM – 8:00 AM)
                        </span>
                      </div>
                      <p className="font-serif text-lg font-bold text-stone-900 pt-1">
                        + {ord.flowerSummary}
                      </p>
                      <p className="text-xs text-stone-600 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-[#D95326] shrink-0" />
                        <span>
                          {ord.customerName} — {ord.address} ({ord.deliveryNote}
                          )
                        </span>
                      </p>
                    </div>

                    <div className="text-left md:text-right shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-[#E6DEC8]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                        Amount Paid
                      </span>
                      <span className="font-serif text-2xl font-bold text-[#D95326]">
                        ₹{ord.amountPaid}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* LIVE MULTI-DEVICE EMAIL / PHONE OTP LOGIN MODAL */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-3xl border border-[#E6DEC8] bg-white p-6 sm:p-8 shadow-2xl space-y-5">
            <button
              type="button"
              onClick={() => {
                setIsLoginModalOpen(false);
                setOtpSentToEmail("");
                setLoginError("");
              }}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-700 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF6F0] border border-[#E6DEC8] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#D95326]">
                <KeyRound className="h-3 w-3" />
                <span>Multi-Device Email OTP Sync</span>
              </span>
              <h3 className="font-serif text-2xl font-bold text-stone-900">
                Access Your Subscription
              </h3>
              <p className="text-xs text-stone-500">
                Enter your registered 10-digit Phone Number or Email. We will
                send a 6-digit verification code to your linked Email.
              </p>
            </div>

            {loginError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-800">
                {loginError}
              </div>
            )}

            {!otpSentToEmail ? (
              <form onSubmit={handleSendLoginOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Registered Phone Number OR Email *
                  </label>
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="e.g. 9820123456 or your@email.com"
                    className="w-full rounded-xl border border-[#E6DEC8] px-3.5 py-3 text-sm text-stone-900 focus:border-[#D95326] focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full rounded-2xl bg-[#D95326] hover:bg-[#BA421B] py-3.5 text-xs font-bold text-white shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {isAuthLoading
                    ? "Looking up Account..."
                    : "Send OTP to Linked Email"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyLoginOtp} className="space-y-4">
                <div className="rounded-xl bg-[#FFF3EC] border border-[#E6DEC8] p-3 text-xs text-stone-900">
                  Verification code sent to <strong>{otpSentToEmail}</strong>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Enter 6-Digit Email Verification Code *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={enteredOtp}
                    onChange={(e) =>
                      setEnteredOtp(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="e.g. 482910"
                    className="w-full rounded-xl border border-[#E6DEC8] px-3.5 py-3 text-center tracking-[0.3em] font-bold text-base text-stone-900 focus:border-[#D95326] focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full rounded-2xl bg-stone-900 hover:bg-[#D95326] py-3.5 text-xs font-bold text-white shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {isAuthLoading
                    ? "Verifying..."
                    : "Verify & Sync My Subscription"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MyOrdersPage() {
  return (
    <FeatureBoundary featureName="ORDERS">
      <Suspense
        fallback={
          <div className="p-12 text-center text-sm text-stone-500">
            Loading Delivery Calendar...
          </div>
        }
      >
        <MyOrdersContent />
      </Suspense>
    </FeatureBoundary>
  );
}