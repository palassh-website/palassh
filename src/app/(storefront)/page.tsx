"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Clock,
  CalendarCheck,
  PauseCircle,
  Star,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  PhoneCall,
  ShoppingBag,
  CheckCircle2,
  MapPin,
  AlertCircle,
  Send,
  Zap,
  Lock,
} from "lucide-react";
import { FeatureBoundary } from "@/components/shared/FeatureBoundary";
import { PincodeBox } from "@/features/pincode-checker/components/PincodeBox";
import { PlanCards } from "@/features/catalog/components/PlanCards";
import { ScrollReveal, Tilt3DCard } from "@/components/shared/ScrollReveal";
import { SplitText } from "@/components/shared/SplitText";
import { ScrollProgress } from "@/components/shared/ScrollProgress";
import { Magnetic } from "@/components/shared/Magnetic";
import { StatBar } from "@/components/sections/StatBar";
import { MorningRitual } from "@/components/sections/MorningRitual";
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
  validateDirectFlowerPurchaseLimit,
} from "@/features/catalog/types";
import {
  HeroSlideBanner,
  getDynamicHeroBanners,
  DEFAULT_HERO_BANNERS,
} from "@/features/catalog/hero-banners";


const SHOP_ADDRESS =
  "6X4X+HJ5 Glenmark Residency, 60 Feet Rd, Kharegaon, Kalwa, Thane, Maharashtra 400605";

const FAQS = [
  {
    tag: "11:45 PM Next-Day Cut-Off",
    q: "When will my first morning flower delivery start?",
    a: "If you subscribe before 11:45 PM tonight, your fresh flowers will delivered tomorrow morning between 6:00 AM – 8:00 AM! Orders placed after 11:45 PM will deliver the day after tomorrow.",
  },
  {
    tag: "Member-Only Loose Flower Add-Ons",
    q: "Who can purchase loose flower Add-On packs from the flower store?",
    a: "Loose flower Add-On shopping (100g or 150g packs) is unlocked exclusively for active Weekly and Monthly Plan subscribers (up to 2 days before your plan ends).",
  },
  {
    tag: "7 Varieties in 100g & 150g",
    q: "What flower varieties and weights are available in your plans?",
    a: "We offer 7 sacred varieties—Mixed Marigold, Orange Marigold, Yellow Marigold, Pooja Flower, Mixed Shevanti, White Shevanti, and Yellow Shevanti—available in both 100 gms and 150 gms daily pouches across 1 Day, Weekly, and Monthly plans.",
  },
  {
    tag: "Pause Quota (Weekly vs Monthly)",
    q: "How many deliveries can I pause in the Weekly and Monthly plans?",
    a: "From your My-Orders interactive calendar, Weekly subscribers can pause up to 2 deliveries (which carry forward), and Monthly subscribers can pause up to 5 deliveries before 8:00 PM.",
  },
  {
    tag: "Silent Doorbell-Free Drop",
    q: "How do riders deliver between 6:00 AM – 8:00 AM without disturbing our sleep?",
    a: "We follow a strict Silent Devotion Protocol. Our riders never ring your doorbell or call you in the morning. Your breathable eco-pouch is gently hung on your main door handle.",
  },
]; const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
};

interface CustomerReview {
  id: string;
  name: string;
  society: string;
  rating: number;
  quote: string;
  tag?: string;
}

const INITIAL_REVIEWS: CustomerReview[] = [
  {
    id: "rev-1",
    name: "Mrs. Anjali Joshi",
    society: "Hiranandani Estate, Ghodbunder Rd (400607)",
    rating: 5,
    tag: "150g Monthly Subscriber",
    quote:
      "Every morning at 6:20 AM our 150g pouch of Pooja Flowers is hanging on the door handle. Pure temple fragrance!",
  },
  {
    id: "rev-2",
    name: "Siddharth & Pooja Nair",
    society: "Rustomjee Urbania, Thane West (400601)",
    rating: 5,
    tag: "100g Weekly Subscriber",
    quote:
      "We subscribed to the 100g Mixed Marigold Weekly Pack at ₹299. When we traveled for the weekend, we paused 2 dates effortlessly.",
  },
  {
    id: "rev-3",
    name: "Kulkarni Family",
    society: "Vartak Nagar, Pokhran Rd No. 1 (400606)",
    rating: 5,
    tag: "150g Shevanti Monthly",
    quote:
      "The White and Yellow Shevanti stays radiant on our home mandir from morning aarti till late night. Zero cold storage!",
  },
  {
    id: "rev-4",
    name: "Sneha & Rohan Sawant",
    society: "Piramal Vaikunth, Balkum (400608)",
    rating: 5,
    tag: "1 Day Plan -> Monthly",
    quote:
      "We first tried the ₹45 1-Day Marigold Pack. Seeing the morning quality, we immediately booked the Monthly Pack!",
  },
];

function RitualBeam() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute left-16 right-16 top-14 hidden h-[3px] md:block"
    >
      <div
        className={`h-full w-full origin-left rounded-full bg-gradient-to-r from-[#D95326] via-[#E6DEC8] to-[#D95326] ${on ? "animate-beam-draw" : "scale-x-0"
          }`}
      />
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [plans, setPlans] = useState<SubscriptionPlan[]>(INITIAL_PLANS);
  const [flowers, setFlowers] = useState<FlowerProduct[]>(INITIAL_FLOWERS);
  const [selectedWeightIdxByFlower, setSelectedWeightIdxByFlower] = useState<
    Record<string, number>
  >({});
  const [upliftedFlowerId, setUpliftedFlowerId] = useState<string | null>(null);
  const reviewsScrollRef = useRef<HTMLDivElement | null>(null);

  const [heroBanners, setHeroBanners] = useState<HeroSlideBanner[]>(() =>
    getDynamicHeroBanners(INITIAL_PLANS)
  );
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [popupToast, setPopupToast] = useState<{
    visible: boolean;
    isError?: boolean;
    title: string;
    subtitle: string;
  }>({ visible: false, title: "", subtitle: "" });
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [reviews, setReviews] = useState<CustomerReview[]>(INITIAL_REVIEWS);
  const [reviewerName, setReviewerName] = useState<string>("");
  const [reviewerSociety, setReviewerSociety] = useState<string>("");
  const [reviewerRating, setReviewerRating] = useState<number>(5);
  const [reviewerQuote, setReviewerQuote] = useState<string>("");
  const [reviewSubmittedMsg, setReviewSubmittedMsg] = useState<string>("");
  const reviewMsgTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [customerTier, setCustomerTier] = useState<
    "NORMAL" | "ONE_DAY" | "WEEKLY" | "MONTHLY"
  >("NORMAL");

  useEffect(() => {
    const syncState = () => {
      const activePlans = getActivePlansCatalog();
      setPlans(activePlans);
      setHeroBanners(getDynamicHeroBanners(activePlans));
      setFlowers(getActiveFlowersCatalog());
      setCart(getStoredCart());
      setCustomerTier(getCurrentCustomerTier());
    };
    syncState();

    window.addEventListener("palassh-cart-updated", syncState);
    window.addEventListener("palassh-plans-updated", syncState);
    window.addEventListener("palassh-store-access-updated", syncState);
    window.addEventListener("storage", syncState);

    try {
      const savedRevs = localStorage.getItem("palassh_customer_reviews_v2");
      if (savedRevs) {
        const parsed = JSON.parse(savedRevs);
        if (Array.isArray(parsed) && parsed.length > 0) setReviews(parsed);
      }
    } catch {
      // Ignore
    }

    return () => {
      window.removeEventListener("palassh-cart-updated", syncState);
      window.removeEventListener("palassh-plans-updated", syncState);
      window.removeEventListener("palassh-store-access-updated", syncState);
      window.removeEventListener("storage", syncState);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (reviewMsgTimerRef.current) clearTimeout(reviewMsgTimerRef.current);
    };
  }, []);

  const scrollToPlans = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const plansEl = document.getElementById("plans");
    if (plansEl) {
      plansEl.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      router.push("/#plans");
    }
  };

  useEffect(() => {
    if (heroBanners.length <= 1) return;
    const timer = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      setCurrentSlide((prev) => (prev + 1) % heroBanners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroBanners.length]);

  const handleHeroNext = () => {
    setCurrentSlide((prev) => (prev + 1) % heroBanners.length);
  };

  const handleHeroPrev = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + heroBanners.length) % heroBanners.length
    );
  };

  const scrollReviewsRow = (direction: "left" | "right") => {
    if (!reviewsScrollRef.current) return;
    const offset = direction === "left" ? -360 : 360;
    reviewsScrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  const handleFlowerAction = (
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
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      setPopupToast({
        visible: true,
        isError: true,
        title: "Weekly & Monthly Subscribers Only",
        subtitle:
          validation.reason ||
          "Subscribe to a Weekly or Monthly Plan to unlock 100g/150g loose flower Add-Ons.",
      });
      toastTimerRef.current = setTimeout(() => {
        setPopupToast((prev) => ({ ...prev, visible: false }));
      }, 5000);
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
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setPopupToast({
      visible: true,
      isError: false,
      title: `${flower.name} (${flower.marathiName}) — ${selectedGrams}g Added!`,
      subtitle: `Total Basket Weight: ${newTotalGrams}g • Tap 'Cart' in Navbar to checkout.`,
    });
    toastTimerRef.current = setTimeout(() => {
      setPopupToast((prev) => ({ ...prev, visible: false }));
    }, 4500);
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim() || !reviewerQuote.trim()) return;

    const newRev: CustomerReview = {
      id: `rev-${Date.now()}`,
      name: reviewerName.trim(),
      society: reviewerSociety.trim() || "Thane Resident (400601–400608)",
      rating: reviewerRating,
      tag: "Verified Devotee",
      quote: reviewerQuote.trim(),
    };

    const updated = [newRev, ...reviews];
    setReviews(updated);
    try {
      localStorage.setItem(
        "palassh_customer_reviews_v2",
        JSON.stringify(updated)
      );
    } catch {
      // Ignore
    }

    setReviewerName("");
    setReviewerSociety("");
    setReviewerQuote("");
    setReviewerRating(5);
    setReviewSubmittedMsg(
      "Thank you! Your review is now live on the swipeable wall above."
    );
    if (reviewMsgTimerRef.current) clearTimeout(reviewMsgTimerRef.current);
    reviewMsgTimerRef.current = setTimeout(
      () => setReviewSubmittedMsg(""),
      5000
    );
  };

  const totalCartItems = cart.length;
  const totalCartAmount = cart.reduce((acc, i) => acc + i.unitPrice, 0);
  const totalCartGrams = cart.reduce((acc, i) => acc + (i.grams || 100), 0);
  const homepageFlowers = flowers.slice(0, 3);

  // Strict Rule: Only active WEEKLY and MONTHLY subscribers can shop loose flower Add-Ons
   const isLockedForNonPlanUser =
    customerTier !== "WEEKLY" && customerTier !== "MONTHLY";
  const activeSlideData = heroBanners[currentSlide] || DEFAULT_HERO_BANNERS[0];

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden bg-[#FAF6F0]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />
      <ScrollProgress />

      {/* NON-INTRUSIVE POPUP TOAST */}
      {popupToast.visible && (
        <div
          className={`animate-toast-in fixed top-24 right-3 left-3 sm:left-auto sm:right-6 z-50 sm:max-w-sm overflow-hidden rounded-2xl border-2 p-4 text-white shadow-2xl ${popupToast.isError
              ? "border-rose-400 bg-rose-950"
              : "border-[#D95326] bg-[#1C1917]"
            }`}
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#F5D0A9]">
              {popupToast.isError ? (
                <AlertCircle className="h-5 w-5 text-rose-300" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-[#D95326]" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-serif text-sm font-bold text-[#F5D0A9]">
                {popupToast.title}
              </p>
              <p className="mt-0.5 text-[11px] text-stone-300">
                {popupToast.subtitle}
              </p>
              {!popupToast.isError && (
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPopupToast((prev) => ({ ...prev, visible: false }));
                      window.dispatchEvent(new Event("palassh-open-cart"));
                    }}
                    className="rounded-lg bg-[#D95326] px-3 py-1.5 text-[11px] font-bold text-white cursor-pointer"
                  >
                    Open Cart ({totalCartGrams}g)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPopupToast((prev) => ({ ...prev, visible: false }))
                    }
                    className="rounded-lg border border-white/20 px-2.5 py-1.5 text-[11px] font-semibold text-stone-300 hover:bg-white/10 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 1. HERO CAROUSEL SLIDER (Warm Espresso Charcoal Overlay — Zero Green) */}
      <FeatureBoundary featureName="HERO">
        <section
          onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchStartX === null) return;
            const delta = e.changedTouches[0].clientX - touchStartX;
            if (delta > 50) handleHeroPrev();
            else if (delta < -50) handleHeroNext();
            setTouchStartX(null);
          }}
          className="relative w-full min-h-[540px] sm:min-h-[620px] lg:min-h-[80vh] flex items-center overflow-hidden bg-[#1C1917]"
        >
          {heroBanners.map((slide, index) => {
            const isActive = index === currentSlide;
            return (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-700 ease-out ${isActive
                    ? "opacity-100 z-10"
                    : "opacity-0 z-0 pointer-events-none"
                  }`}
              >
                <div
                  className={`h-full w-full ${isActive ? "animate-hero-wipe" : ""
                    }`}
                >
                  <img
                    src={slide.imageUrl}
                    alt={slide.titleLine1}
                    width={1600}
                    height={900}
                    loading={index === 0 ? "eager" : "lazy"}
                    decoding="async"
                    fetchPriority={index === 0 ? "high" : "auto"}
                    className="h-full w-full object-cover object-center"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-[#181310]/95 via-[#1C1917]/80 to-black/35" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#181310] via-transparent to-black/30" />
              </div>
            );
          })}

          <div className="relative z-20 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <div
              key={activeSlideData.id}
              className="relative max-w-3xl space-y-6"
            >
              <div className="animate-fade-lift-in">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#F5D0A9]/30 bg-black/45 px-4 py-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-widest text-[#F5D0A9] backdrop-blur-md">
                  <Sparkles className="h-3.5 w-3.5 text-[#D95326] shrink-0" />
                  <span>{activeSlideData.badge}</span>
                </div>
              </div>

              <div className="space-y-1">
                <SplitText
                  as="h1"
                  play
                  mode="words"
                  stagger={50}
                  delay={60}
                  text={activeSlideData.titleLine1}
                  className="font-serif text-4xl font-bold leading-[1.1] tracking-tight text-white drop-shadow-md sm:text-6xl lg:text-7xl"
                />
                <div className="overflow-hidden pb-2">
                  <div
                    className="animate-wipe-right"
                    style={{ animationDelay: "300ms" }}
                  >
                    <span className="block font-serif text-3xl font-normal italic text-[#F5D0A9] sm:text-5xl lg:text-6xl">
                      {activeSlideData.titleHighlight}
                    </span>
                  </div>
                </div>
              </div>

              <p
                className="animate-fade-lift-in max-w-xl text-sm sm:text-base lg:text-lg text-stone-200 leading-relaxed"
                style={{ animationDelay: "460ms" }}
              >
                {activeSlideData.subtitle}
              </p>

              <div
                className="animate-fade-lift-in flex flex-col sm:flex-row sm:items-center gap-3.5 pt-2"
                style={{ animationDelay: "580ms" }}
              >
                <Link
                  href={activeSlideData.primaryBtnHref}
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-[#D95326] hover:bg-[#BA421B] px-8 py-4 text-xs sm:text-sm font-bold text-white shadow-lg transition duration-300"
                >
                  <ShoppingBag className="h-4 w-4 text-white" />
                  <span>{activeSlideData.primaryBtnText}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href={activeSlideData.secondaryBtnHref}
                  className="inline-flex items-center justify-center gap-2.5 rounded-full border border-white/30 bg-white/10 px-7 py-4 text-xs sm:text-sm font-bold text-white backdrop-blur-md transition hover:bg-white hover:text-stone-900"
                >
                  <span>{activeSlideData.secondaryBtnText}</span>
                </Link>
              </div>

              <div
                className="animate-fade-lift-in pt-6 flex items-center justify-end border-t border-white/15"
                style={{ animationDelay: "700ms" }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {heroBanners.map((b, idx) => {
                      const isActive = idx === currentSlide;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setCurrentSlide(idx)}
                          className={`relative h-2 rounded-full overflow-hidden transition-all duration-300 cursor-pointer ${isActive
                              ? "w-11 bg-white/25"
                              : "w-2.5 bg-white/35 hover:bg-white/60"
                            }`}
                          aria-label={`Slide ${idx + 1}`}
                        >
                          {isActive && (
                            <span
                              key={`hero-progress-${currentSlide}`}
                              className="absolute inset-y-0 left-0 h-full rounded-full bg-[#D95326] animate-slide-progress"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleHeroPrev}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-black/40 text-white hover:bg-white hover:text-stone-900 transition cursor-pointer"
                      aria-label="Previous Banner"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleHeroNext}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-black/40 text-white hover:bg-white hover:text-stone-900 transition cursor-pointer"
                      aria-label="Next Banner"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </FeatureBoundary>

      {/* 1B. WARM BEIGE & TERRACOTTA MARQUEE TICKER */}
      <div className="relative z-20 overflow-hidden bg-[#F3ECE1] border-y border-[#E6DEC8] py-3 text-xs font-bold uppercase tracking-[0.2em] text-stone-800">
        <div className="animate-palassh-marquee flex items-center gap-10">
          {[...Array(2)].map((_, copyIdx) => (
            <div key={copyIdx} className="flex items-center gap-10 shrink-0">
              <span className="flex items-center gap-2 text-[#D95326]">
                <Sparkles className="h-3.5 w-3.5" />7 SACRED FLOWER VARIETIES
              </span>
              <span>• 100 GMS & 150 GMS DAILY POUCHES</span>
              <span className="text-[#D95326]">
                • 1-DAY FARM HARVEST BUFFER
              </span>
              <span>• 6:00 AM – 8:00 AM SILENT DOORSTEP DROP</span>
              <span>
                • MIXED MARIGOLD • ORANGE & YELLOW MARIGOLD • POOJA FLOWER •
                SHEVANTI
              </span>
            </div>
          ))}
        </div>
      </div>

      <StatBar />

      {/* 2. PINCODE CONCIERGE DOCK */}
      <div className="py-8 sm:py-12">
        <FeatureBoundary featureName="PINCODE">
          <PincodeBox />
        </FeatureBoundary>
      </div>

      {/* 3. CUSTOMIZABLE 100G & 150G SUBSCRIPTION PLANS (7 FLOWER TYPES) */}
      <FeatureBoundary featureName="CATALOG">
        <ScrollReveal variant="flip">
          <PlanCards plans={plans} />
        </ScrollReveal>
      </FeatureBoundary>

      {/* 4. MEMBER-ONLY LOOSE FLOWER STORE (STRICTLY LOCKED FOR NORMAL NON-PLAN USERS) */}
      <FeatureBoundary featureName="DIRECT_FLOWER_STORE">
        <section
          id="fresh-flowers"
          className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl border-t border-[#E6DEC8]"
        >
          <ScrollReveal variant="blur-scale">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#F3ECE1] border border-[#E6DEC8] px-3.5 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] text-[#D95326]">
                  <Lock className="h-3.5 w-3.5" />
                  <span>Exclusive Plan-Holder Flower Store</span>
                </div>
                <SplitText
                  as="h2"
                  mode="words"
                  stagger={50}
                  text="Extra Loose Flowers for Plan Members"
                  className="font-serif text-3xl sm:text-5xl font-bold text-stone-900"
                />
                <p className="text-xs sm:text-base text-stone-600">
                  Customers who have purchased any{" "}
                  <strong className="text-stone-900">
                    1 Day, Weekly, or Monthly Plan
                  </strong>{" "}
                  can order extra flower weight packs (100g, 150g, 250g, 500g)
                  anytime.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  window.dispatchEvent(new Event("palassh-open-cart"))
                }
                className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-stone-900 px-5 py-3.5 text-xs font-bold text-white shadow-sm hover:bg-[#D95326] transition cursor-pointer shrink-0"
              >
                <ShoppingBag className="h-4 w-4 text-[#F5D0A9]" />
                <span>
                  Flower Basket ({totalCartItems} • {totalCartGrams}g • ₹
                  {totalCartAmount})
                </span>
              </button>
            </div>
          </ScrollReveal>

          {isLockedForNonPlanUser && (
            <ScrollReveal variant="fade-lift">
              <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#E6DEC8] bg-[#FFF3EC] p-5 text-stone-900 shadow-xs">
                <div
                  onClick={(e) => scrollToPlans(e)}
                  className="flex items-center gap-3.5 cursor-pointer group"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D95326] text-white">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-stone-900">
                      Plan Members Only — Normal User Loose Shopping Disabled
                    </p>
                    <p className="text-[11px] text-stone-600 mt-0.5">
                      Subscribe to any 1 Day (from ₹45), Weekly (from ₹299), or
                      Monthly (from ₹1,249) plan above to unlock loose flower
                      shopping!
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => scrollToPlans(e)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#D95326] hover:bg-[#BA421B] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition whitespace-nowrap self-start sm:self-auto shrink-0 cursor-pointer"
                >
                  <span>Choose a Plan First</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </ScrollReveal>
          )}

          <div className="mt-10 sm:mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {homepageFlowers.map((flower, idx) => {
              const selectedIdx = selectedWeightIdxByFlower[flower.id] || 0;
              const selectedWeight =
                flower.availableWeights[selectedIdx] ||
                flower.availableWeights[0];
              const inCartItem = cart.find((c) => c.flowerId === flower.id);
              const isCardUplifted = upliftedFlowerId === flower.id;

              return (
                <ScrollReveal
                  key={flower.id}
                  delayMs={idx * 140}
                  variant="fade-lift"
                >
                  <Tilt3DCard
                    isUplifted={isCardUplifted}
                    onClick={() => {
                      if (isLockedForNonPlanUser) {
                        scrollToPlans();
                        return;
                      }
                      setUpliftedFlowerId((prev) =>
                        prev === flower.id ? null : flower.id
                      );
                    }}
                    className={`group flex flex-col justify-between h-full rounded-[2rem] border bg-white cursor-pointer transition-all duration-300 ${isCardUplifted
                        ? "border-[#D95326] -translate-y-1.5 shadow-xl"
                        : "border-[#E6DEC8] shadow-md hover:border-[#D95326]/60"
                      }`}
                  >
                    <div>
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F3ECE1] rounded-t-[2rem]">
                        <img
                          src={flower.imageUrl}
                          alt={flower.name}
                          width={800}
                          height={600}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/75 via-transparent to-transparent" />

                        <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3.5 py-1 text-[11px] font-bold text-stone-900 shadow-2xs flex items-center gap-1.5">
                          {isLockedForNonPlanUser && (
                            <Lock className="h-3 w-3 text-[#D95326]" />
                          )}
                          <span>
                            {inCartItem
                              ? `In Basket: ${inCartItem.grams}g`
                              : isLockedForNonPlanUser
                                ? "Plan Holders Only"
                                : "Member Stock"}
                          </span>
                        </span>

                        <div className="absolute bottom-3.5 left-4 right-4 flex items-center justify-between text-white">
                          <span className="text-xs font-medium text-stone-200">
                            {flower.deityAffinity}
                          </span>
                          <span className="rounded-lg bg-stone-900/80 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-[#F5D0A9] border border-white/15">
                            6:00 – 8:00 AM
                          </span>
                        </div>
                      </div>

                      <div className="p-6 space-y-4">
                        <div>
                          <div className="flex items-baseline gap-2.5 flex-wrap">
                            <h3 className="font-serif text-2xl font-bold text-stone-900">
                              {flower.name}
                            </h3>
                            <span className="text-xs font-semibold text-stone-700 bg-[#FAF6F0] px-2.5 py-0.5 rounded-md border border-[#E6DEC8]">
                              {flower.marathiName}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-stone-500">
                            {flower.subtitle}
                          </p>
                        </div>

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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedWeightIdxByFlower((prev) => ({
                                      ...prev,
                                      [flower.id]: wIdx,
                                    }));
                                  }}
                                  className={`rounded-xl border py-2 px-1 text-center transition cursor-pointer ${active
                                      ? "border-[#D95326] bg-[#FFF3EC] font-bold text-stone-900"
                                      : "border-[#E6DEC8] bg-[#FAF6F0] text-stone-600 hover:border-[#D95326]"
                                    }`}
                                >
                                  <span className="block text-xs font-bold">
                                    {wt.grams}g
                                  </span>
                                  <span className="block text-[11px] font-semibold text-[#D95326]">
                                    ₹{wt.price}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="px-6 pb-6 pt-1">
                      {isLockedForNonPlanUser ? (
                        <button
                          type="button"
                          onClick={(e) => scrollToPlans(e)}
                          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FAF6F0] border border-[#E6DEC8] hover:border-[#D95326] py-3.5 px-3 text-xs font-bold text-stone-800 hover:text-[#D95326] transition cursor-pointer"
                        >
                          <Lock className="h-3.5 w-3.5 text-[#D95326]" />
                          <span>Plan Members Only • Choose a Plan</span>
                        </button>
                      ) : (
                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFlowerAction(flower, false);
                            }}
                            className="flex items-center justify-center gap-1.5 rounded-2xl border border-stone-900 bg-white py-3.5 px-3 text-xs font-bold text-stone-900 transition hover:bg-stone-900 hover:text-white cursor-pointer"
                          >
                            <ShoppingBag className="h-3.5 w-3.5 text-[#D95326] shrink-0" />
                            <span>Add {selectedWeight.grams}g</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFlowerAction(flower, true);
                            }}
                            className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#D95326] hover:bg-[#BA421B] py-3.5 px-3 text-xs font-bold text-white shadow-xs transition cursor-pointer"
                          >
                            <Zap className="h-3.5 w-3.5 shrink-0" />
                            <span>Buy Now ₹{selectedWeight.price}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </Tilt3DCard>
                </ScrollReveal>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <Magnetic strength={0.2}>
              <Link
                href="/products"
                className="inline-flex items-center gap-2.5 rounded-full bg-stone-900 hover:bg-[#D95326] px-8 py-4 text-xs sm:text-sm font-bold text-white shadow-md transition"
              >
                <span>View All 7 Varieties in Member Store (/products)</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Magnetic>
          </div>
        </section>
      </FeatureBoundary>

      <MorningRitual />

      {/* 5. 3-STEP RITUAL TIMELINE */}
      <section
        id="how-it-works"
        className="relative border-b border-[#E6DEC8] bg-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <ScrollReveal variant="blur-scale">
            <div className="mx-auto max-w-2xl text-center space-y-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF6F0] border border-[#E6DEC8] px-4 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[#D95326]">
                <Sparkles className="h-3 w-3" /> Effortless Devotion
              </span>
              <SplitText
                as="h2"
                mode="words"
                stagger={50}
                text="How Your PALASSH Ritual Works"
                className="font-serif text-3xl sm:text-5xl font-bold text-stone-900"
              />
            </div>
          </ScrollReveal>

          <div className="relative mt-12 sm:mt-16">
            <RitualBeam />
            <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3 relative z-10">
              {[
                {
                  step: "01",
                  icon: CalendarCheck,
                  title: "Pick 100g/150g & Flower Type",
                  desc: "Choose from multiple sacred flower varieties in 100 gms or 150 gms across 1 Day, Weekly, or Monthly plans.",
                },
                {
                  step: "02",
                  icon: Clock,
                  title: " 6:00AM to 8:00AM Drop",
                  desc: "After your purchasing the  flower, our rider silently hangs your fresh flower pouch between 6:00 AM and 8:00 AM next morning .",
                },
                {
                  step: "03",
                  icon: PauseCircle,
                  title: "Pause & Member Store Access",
                  desc: "Pause deliveries before 8:00 PM (2 Weekly / 5 Monthly) and enjoy exclusive member access to extra loose flower shopping.",
                },
              ].map((item, i) => (
                <ScrollReveal
                  key={item.step}
                  delayMs={i * 140}
                  variant="blur-scale"
                >
                  <Tilt3DCard className="group rounded-3xl border border-[#E6DEC8] bg-[#FAF6F0] p-7 sm:p-8 shadow-xs h-full">
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D95326] text-white shadow-xs">
                        <item.icon className="h-6 w-6" />
                      </div>
                      <span className="font-serif text-4xl font-bold text-[#D95326]/25">
                        {item.step}
                      </span>
                    </div>
                    <h3 className="mt-6 font-serif text-xl sm:text-2xl font-bold text-stone-900">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm leading-relaxed text-stone-600">
                      {item.desc}
                    </p>
                  </Tilt3DCard>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. REVIEWS CAROUSEL + INLINE REVIEW FORM + FAQ */}
      <section className="content-visibility-auto py-16 sm:py-24 px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl space-y-16">
        <div>
          <ScrollReveal variant="blur-scale">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F3ECE1] border border-[#E6DEC8] px-3.5 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] text-stone-800">
                  <Star className="h-3.5 w-3.5 fill-[#D95326] text-[#D95326]" />
                  <span>Thane Pincodes 400601–400608</span>
                </span>
                <SplitText
                  as="h2"
                  mode="words"
                  stagger={50}
                  text="Morning Blessings from Thane Families"
                  className="font-serif text-3xl sm:text-4xl font-bold text-stone-900"
                />
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => scrollReviewsRow("left")}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E6DEC8] bg-white text-stone-900 hover:bg-[#F3ECE1] cursor-pointer transition"
                  aria-label="Scroll Reviews Left"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollReviewsRow("right")}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D95326] text-white hover:bg-[#BA421B] cursor-pointer transition"
                  aria-label="Scroll Reviews Right"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </ScrollReveal>

          <div
            ref={reviewsScrollRef}
            className="flex gap-4 sm:gap-6 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="w-[84vw] sm:w-[350px] md:w-[370px] shrink-0 snap-center sm:snap-start flex flex-col justify-between rounded-3xl border border-[#E6DEC8] bg-white p-6 shadow-xs transition-transform duration-300 hover:-translate-y-1 hover:border-[#D95326]"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-[#D95326]">
                      {[...Array(rev.rating || 5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-[#D95326]" />
                      ))}
                    </div>
                    {rev.tag && (
                      <span className="rounded-full bg-[#FAF6F0] border border-[#E6DEC8] px-2.5 py-0.5 text-[10px] font-bold text-stone-700">
                        {rev.tag}
                      </span>
                    )}
                  </div>
                  <p className="mt-4 text-xs sm:text-sm leading-relaxed text-stone-700 italic">
                    &ldquo;{rev.quote}&rdquo;
                  </p>
                </div>

                <div className="mt-5 border-t border-stone-100 pt-3.5 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-serif text-sm sm:text-base font-bold text-stone-900 truncate">
                      {rev.name}
                    </p>
                    <p className="text-[11px] text-[#D95326] font-medium truncate">
                      {rev.society}
                    </p>
                  </div>
                  <ShieldCheck className="h-5 w-5 text-[#D95326] shrink-0" />
                </div>
              </div>
            ))}
          </div>

          {/* INLINE REVIEW FORM (Warm Almond Beige Container) */}
          <ScrollReveal variant="blur-scale">
            <div className="mt-10 overflow-hidden rounded-3xl sm:rounded-[2.5rem] border border-[#E6DEC8] bg-[#F3ECE1] p-5 sm:p-10 text-stone-900 shadow-sm">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
                <div className="lg:col-span-5 space-y-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#E6DEC8] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#D95326]">
                    <Sparkles className="h-3 w-3" />
                    <span>Add Your Blessing</span>
                  </span>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold leading-tight text-stone-900">
                    Share Your PALASSH Morning Experience
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    Your review appears immediately in the Thane Devotee row
                    above.
                  </p>
                </div>

                <form
                  onSubmit={handleSubmitReview}
                  className="lg:col-span-7 rounded-2xl sm:rounded-3xl bg-white border border-[#E6DEC8] p-5 sm:p-7 text-stone-900 shadow-xs space-y-4"
                >
                  {reviewSubmittedMsg && (
                    <div className="flex items-center gap-2 rounded-xl border border-[#D95326] bg-[#FFF3EC] p-3 text-xs font-bold text-stone-900">
                      <CheckCircle2 className="h-4 w-4 text-[#D95326] shrink-0" />
                      <span>{reviewSubmittedMsg}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Mrs. Deshmukh"
                        value={reviewerName}
                        onChange={(e) => setReviewerName(e.target.value)}
                        className="w-full rounded-xl border border-[#E6DEC8] bg-[#FAF6F0] px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#D95326] focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Society & Thane Pincode *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Hiranandani Estate (400607)"
                        value={reviewerSociety}
                        onChange={(e) => setReviewerSociety(e.target.value)}
                        className="w-full rounded-xl border border-[#E6DEC8] bg-[#FAF6F0] px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#D95326] focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Your Experience *
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Tell us about your 100g/150g flower pouch freshness..."
                      value={reviewerQuote}
                      onChange={(e) => setReviewerQuote(e.target.value)}
                      className="w-full rounded-xl border border-[#E6DEC8] bg-[#FAF6F0] p-3 text-sm text-stone-900 focus:border-[#D95326] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#D95326] hover:bg-[#BA421B] py-3.5 text-xs sm:text-sm font-bold text-white shadow-xs cursor-pointer transition"
                  >
                    <Send className="h-4 w-4" />
                    <span>Publish Review</span>
                  </button>
                </form>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* 7. FAQ SECTION */}
        <ScrollReveal variant="flip">
          <div className="content-visibility-auto rounded-3xl sm:rounded-[2.5rem] border border-[#E6DEC8] bg-white p-5 sm:p-10 lg:p-14 shadow-md">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
                <div className="space-y-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#FFF3EC] border border-[#E6DEC8] px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-[#D95326]">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Common Questions</span>
                  </span>
                  <SplitText
                    as="h2"
                    mode="words"
                    stagger={50}
                    text="Everything About Your Morning Flower Ritual."
                    className="font-serif text-2xl sm:text-4xl font-bold text-stone-900 leading-tight"
                  />
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    Clear answers on our 100g & 150g plans, 7 sacred flower
                    varieties, 1-day farm buffer, and member-only shopping.
                  </p>
                </div>

                <div className="rounded-2xl sm:rounded-3xl bg-[#FAF6F0] border border-[#E6DEC8] p-5 sm:p-6 text-stone-900 space-y-2.5">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[#D95326]">
                    Kalwa Dispatch Hub
                  </p>
                  <p className="text-xs text-stone-600 leading-relaxed flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-[#D95326] shrink-0 mt-0.5" />
                    <span>{SHOP_ADDRESS}</span>
                  </p>
                  <div className="pt-2 border-t border-[#E6DEC8]">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-800">
                      <PhoneCall className="h-3.5 w-3.5 text-[#D95326]" />
                      <span>Morning Slot: 6:00 AM – 8:00 AM Daily</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-3">
                {FAQS.map((item, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div
                      key={item.q}
                      className={`overflow-hidden rounded-2xl border transition-all duration-300 ${isOpen
                          ? "border-[#D95326] bg-[#FFF3EC]/40 shadow-xs"
                          : "border-[#E6DEC8] bg-white hover:border-[#D95326]/60"
                        }`}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        className="flex w-full items-center justify-between gap-3 px-4 sm:px-6 py-4 text-left cursor-pointer"
                      >
                        <div className="space-y-1">
                          <span className="inline-block rounded-md bg-[#FAF6F0] border border-[#E6DEC8] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#D95326]">
                            {item.tag}
                          </span>
                          <p className="font-serif text-sm sm:text-base font-bold text-stone-900">
                            {item.q}
                          </p>
                        </div>
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform duration-300 ${isOpen
                              ? "bg-[#D95326] text-white rotate-180"
                              : "bg-[#FAF6F0] text-stone-900"
                            }`}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </div>
                      </button>

                      <div
                        className={`grid transition-all duration-300 ease-out ${isOpen
                            ? "grid-rows-[1fr] opacity-100"
                            : "grid-rows-[0fr] opacity-0"
                          }`}
                      >
                        <div className="overflow-hidden">
                          <div className="border-t border-[#E6DEC8] px-4 sm:px-6 py-4 text-xs sm:text-sm leading-relaxed text-stone-600 bg-white">
                            {item.a}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}