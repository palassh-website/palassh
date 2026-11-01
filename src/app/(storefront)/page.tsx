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
  Leaf,
  ShieldCheck,
  PhoneCall,
  ShoppingBag,
  CheckCircle2,
  MapPin,
  X,
  AlertCircle,
  Send,
  Flame,
  Zap,
  Scale,
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
  getNormalPurchaseAllowed,
  validateDirectFlowerPurchaseLimit,
} from "@/features/catalog/types";

export interface HeroSlideBanner {
  id: string;
  badge: string;
  titleLine1: string;
  titleHighlight: string;
  subtitle: string;
  imageUrl: string;
  primaryBtnText: string;
  primaryBtnHref: string;
  secondaryBtnText: string;
  secondaryBtnHref: string;
  priceTag: string;
}

export function getDynamicHeroBanners(plans: SubscriptionPlan[]): HeroSlideBanner[] {
  const oneDay = plans.find((p) => p.id === "plan-daily") || plans[0] || INITIAL_PLANS[0];
  const weekly = plans.find((p) => p.id === "plan-weekly") || plans[1] || INITIAL_PLANS[1];
  const monthly = plans.find((p) => p.id === "plan-monthly") || plans[2] || INITIAL_PLANS[2];

  const oneDayPrice = `₹${oneDay.price}`;
  const weeklyPrice = `₹${weekly.price}`;
  const monthlyPrice = `₹${monthly.price.toLocaleString("en-IN")}`;

  return [
    {
      id: "slide-1",
      badge: "100% Farm-Fresh • Thane 400601–400608",
      titleLine1: "Sacred Puja Blooms,",
      titleHighlight: "flowers that pray with you.",
      subtitle:
        "Plucked at 1:30 AM from Nashik & Dahanu farms. Zero cold storage. Hung silently on your doorstep every morning between 6:00 AM – 8:00 AM.",
      imageUrl: "/images/hero-banner.jpg",
      primaryBtnText: `Subscriptions From ${oneDayPrice}`,
      primaryBtnHref: "#plans",
      secondaryBtnText: "Shop Fresh Flowers",
      secondaryBtnHref: "#fresh-flowers",
      priceTag: `Plans: ${oneDayPrice} Day • ${weeklyPrice} Week • ${monthlyPrice} Month`,
    },
    {
      id: "slide-2",
      badge: "100% Farm-to-Mandir Purity • Zero Ice Box",
      titleLine1: "Dew-Fresh Marigold,",
      titleHighlight: "Shevanti & Red Hibiscus.",
      subtitle:
        "Order exact gram packs (100g, 250g, 500g) directly or unlock up to 2 KG – 3 KG Festive Day quotas with our Weekly & Monthly subscriptions.",
      imageUrl: "/images/chrysanthemum.jpeg",
      primaryBtnText: "Buy Fresh Flowers Now",
      primaryBtnHref: "/products",
      secondaryBtnText: "Check Society Pincode",
      secondaryBtnHref: "#pincode-check",
      priceTag: "Single Morning Slot: 6:00 AM – 8:00 AM",
    },
    {
      id: "slide-3",
      badge: "SacredGanpati & Devi Offerings",
      titleLine1: "Hand-Picked Crimson",
      titleHighlight: "Hibiscus & Fresh Tulsi.",
      subtitle:
        "Packed in breathable plastic-free pouches at our Kalwa hub so every bud opens fresh on your home altar during morning aarti.",
      imageUrl: "/images/hibiscus.jpeg",
      primaryBtnText: `Start Monthly Plan @ ${monthlyPrice}`,
      primaryBtnHref: "/checkout?plan=monthly-sacred-assortment",
      secondaryBtnText: "View All Blooms",
      secondaryBtnHref: "/products",
      priceTag: "Pause Anytime Before 8:00 PM",
    },
  ];
}

export const DEFAULT_HERO_BANNERS: HeroSlideBanner[] = getDynamicHeroBanners(INITIAL_PLANS);

const SHOP_ADDRESS =
  "6X4X+HJ5 Glenmark Residency, 60 Feet Rd, Kharegaon, Kalwa, Thane, Maharashtra 400605";

const FAQS = [
  {
    tag: "Morning Delivery Slot",
    q: "What is your exact morning flower delivery timing across Thane?",
    a: "All PALASSH deliveries arrive in a single guaranteed morning window between 6:00 AM – 8:00 AM across Thane pincodes 400601 to 400608, right in time for your morning home mandir aarti.",
  },
  {
    tag: "Direct Buying & Weight Limits",
    q: "How much flower weight can I order directly without a subscription?",
    a: "On normal days, direct a-la-carte customers can order up to a combined maximum of 500g across all flowers. Simply select your preferred gram pack (100g, 250g, or 500g) and click Add or Buy Now.",
  },
  {
    tag: "Festive Day Rules & Quotas",
    q: "Why is direct flower buying locked for normal users on Festive Days?",
    a: "During high-demand festivals (Ganeshotsav, Diwali, Dasara, Sankashti, Gudi Padwa), our farm harvest is prioritized for our active subscribers. Weekly subscribers can book up to 2 KG (2,000g) combined, and Monthly subscribers can book up to 3 KG (3,000g) combined.",
  },
  {
    tag: "Pause Quota (Weekly vs Monthly)",
    q: "How many deliveries can I pause in the Weekly and Monthly plans?",
    a: "From your My-Orders interactive calendar, Weekly subscribers can pause up to 2 deliveries (which carry forward), and Monthly subscribers can pause up to 5 deliveries. Skipping beyond your pause limit cancels that day's delivery.",
  },
  {
    tag: "Silent Doorbell-Free Drop",
    q: "How do riders deliver between 6:00 AM – 8:00 AM without disturbing our sleep?",
    a: "We follow a strict Silent Devotion Protocol. Our riders never ring your doorbell or call you in the morning. Your breathable eco-pouch is gently hung on your main door handle or placed inside your doorstep basket.",
  },
  {
    tag: "Zero Cold Storage Promise",
    q: "How are PALASSH blooms fresher than local station market flowers?",
    a: "Market flowers are typically 3 to 4 days old and stored in ice boxes, causing them to wilt by noon. PALASSH flowers are harvested at 1:30 AM in Nashik and Dahanu farms, sorted at our Kalwa hub at 4:00 AM, and delivered fresh to your door between 6:00 AM – 8:00 AM.",
  },
];

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
    tag: "Monthly Subscriber",
    quote:
      "Every morning at 6:20 AM our breathable pouch of Marigold (झेंडू), Shevanti, and Red Hibiscus is hanging on the door handle. Pure temple fragrance!",
  },
  {
    id: "rev-2",
    name: "Siddharth & Pooja Nair",
    society: "Rustomjee Urbania, Thane West (400601)",
    rating: 5,
    tag: "Weekly Subscriber",
    quote:
      "When we went to Lonavala for the weekend, we clicked those 2 dates on our My-Orders calendar at 7 PM and paused them effortlessly.",
  },
  {
    id: "rev-3",
    name: "Kulkarni Family",
    society: "Vartak Nagar, Pokhran Rd No. 1 (400606)",
    rating: 5,
    tag: "Monthly Subscriber",
    quote:
      "During Sankashti, non-subscribers couldn't find fresh flowers anywhere, but our Monthly plan gave us a 3 KG festive quota at farm prices. Zero cold storage!",
  },
  {
    id: "rev-4",
    name: "Dr. Mahesh Deshpande",
    society: "Panchpakhadi, Naupada (400602)",
    rating: 5,
    tag: "Monthly Subscriber",
    quote:
      "By 6:30 AM every single day, the pouch is silently hung on our door handle. The Marigold (झेंडू) and Tulsi leaves look like they were just plucked from a garden.",
  },
  {
    id: "rev-5",
    name: "Sneha & Rohan Sawant",
    society: "Piramal Vaikunth, Balkum (400608)",
    rating: 5,
    tag: "One Day Trial -> Monthly",
    quote:
      "We first tried the ₹49 One Day Puja Pack just to test the quality. Within 2 days we upgraded to the ₹1,350 Monthly Sacred Assortment. Unbeatable freshness!",
  },
  {
    id: "rev-6",
    name: "Mrs. Vandana Patwardhan",
    society: "Kopri Colony, Thane East (400603)",
    rating: 5,
    tag: "Weekly Subscriber",
    quote:
      "The Chrysanthemum (शेवंती) blooms stay fresh on our home mandir from 7 AM aarti until night. Even my mother-in-law is amazed by the temple-grade quality.",
  },
  {
    id: "rev-7",
    name: "Abhijit Gokhale",
    society: "Raymond Ten X Habitat, Pokhran Rd (400606)",
    rating: 5,
    tag: "Direct & Weekly",
    quote:
      "No more rushing to the station flower market before office! The 6:00 AM – 8:00 AM window is super punctual and the eco-pouch keeps the buds dewy.",
  },
  {
    id: "rev-8",
    name: "Meenal & Pradeep Shinde",
    society: "Glenmark Residency, Kharegaon, Kalwa (400605)",
    rating: 5,
    tag: "Monthly Subscriber",
    quote:
      "Knowing that our flowers come straight from Nashik farms to the Kalwa hub every midnight gives us complete confidence in their purity for daily puja.",
  },
];

/**
 * Animated ritual timeline beam: draws across on scroll-in, then loops a
 * travelling energy pulse. Kept as a standalone component so it mounts once.
 */
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
        className={`h-full w-full origin-left rounded-full bg-gradient-to-r from-[#E8502B] via-amber-400 to-emerald-600 ${
          on ? "animate-beam-draw" : "scale-x-0"
        }`}
      />
      {on && (
        <span className="animate-beam-travel absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-amber-200 shadow-[0_0_20px_7px_rgba(251,191,36,0.6)]" />
      )}
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

  // Full-Screen Movable Hero Carousel State
  const [heroBanners, setHeroBanners] = useState<HeroSlideBanner[]>(() =>
    getDynamicHeroBanners(INITIAL_PLANS)
  );
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Cart & Popup Toast State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [popupToast, setPopupToast] = useState<{
    visible: boolean;
    isError?: boolean;
    title: string;
    subtitle: string;
  }>({ visible: false, title: "", subtitle: "" });

  // Customer Reviews State
  const [reviews, setReviews] = useState<CustomerReview[]>(INITIAL_REVIEWS);
  const [reviewerName, setReviewerName] = useState<string>("");
  const [reviewerSociety, setReviewerSociety] = useState<string>("");
  const [reviewerRating, setReviewerRating] = useState<number>(5);
  const [reviewerQuote, setReviewerQuote] = useState<string>("");
  const [reviewSubmittedMsg, setReviewSubmittedMsg] = useState<string>("");

  // Tier, Festive & Store Access State
  const [customerTier, setCustomerTier] = useState<
    "NORMAL" | "ONE_DAY" | "WEEKLY" | "MONTHLY"
  >("NORMAL");
  const [festiveStatus, setFestiveStatus] = useState({
    isFestiveDay: false,
    festivalName: "Festive Puja",
  });
  const [normalPurchaseAllowed, setNormalPurchaseAllowed] = useState(true);

  useEffect(() => {
    const syncState = () => {
      const activePlans = getActivePlansCatalog();
      setPlans(activePlans);
      setHeroBanners(getDynamicHeroBanners(activePlans));
      setFlowers(getActiveFlowersCatalog());
      setCart(getStoredCart());
      setCustomerTier(getCurrentCustomerTier());
      setFestiveStatus(getFestiveModeStatus());
      setNormalPurchaseAllowed(getNormalPurchaseAllowed());
    };
    syncState();

    window.addEventListener("palassh-cart-updated", syncState);
    window.addEventListener("palassh-festive-updated", syncState);
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
      // Ignore error
    }

    return () => {
      window.removeEventListener("palassh-cart-updated", syncState);
      window.removeEventListener("palassh-festive-updated", syncState);
      window.removeEventListener("palassh-plans-updated", syncState);
      window.removeEventListener("palassh-store-access-updated", syncState);
      window.removeEventListener("storage", syncState);
    };
  }, []);

  // Ensure page load/reload always stays at top (never auto-scrolls on refresh)
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#plans") {
      try {
        window.history.replaceState(null, "", window.location.pathname);
      } catch {}
    }
  }, []);

  // Dedicated instant smooth scroll to Subscription Plans section ONLY when user explicitly clicks
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

  // Auto-advance Full-Screen Hero Carousel every 6 seconds
  useEffect(() => {
    if (heroBanners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroBanners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroBanners.length, currentSlide]);

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

  // Supports both "Add to Cart" (Popup Toast) & "Buy Now" (Direct Checkout Redirect)
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
      setPopupToast({
        visible: true,
        isError: true,
        title: "Weight Quota / Festive Restriction",
        subtitle: validation.reason || "Weight limit exceeded.",
      });
      setTimeout(() => {
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
    setPopupToast({
      visible: true,
      isError: false,
      title: `${flower.name} (${flower.marathiName}) — ${selectedGrams}g Added!`,
      subtitle: `Total Basket Weight: ${newTotalGrams}g • Tap 'Cart' in Navbar to checkout.`,
    });
    setTimeout(() => {
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
      // Ignore error
    }
    setReviewerName("");
    setReviewerSociety("");
    setReviewerQuote("");
    setReviewerRating(5);
    setReviewSubmittedMsg(
      "Thank you! Your review is now live on the swipeable wall above."
    );
    setTimeout(() => setReviewSubmittedMsg(""), 5000);
  };

  const totalCartItems = cart.length;
  const totalCartAmount = cart.reduce((acc, i) => acc + i.unitPrice, 0);
  const totalCartGrams = cart.reduce((acc, i) => acc + (i.grams || 100), 0);
  const homepageFlowers = flowers.slice(0, 3);
  const isNormalUser =
    customerTier === "NORMAL" || customerTier === "ONE_DAY";
  const isNormalLockedOnFestive =
    festiveStatus.isFestiveDay && isNormalUser;
  const isNormalPurchaseBlocked =
    !normalPurchaseAllowed && isNormalUser;

  const activeSlideData = heroBanners[currentSlide] || DEFAULT_HERO_BANNERS[0];

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden bg-[#FAF7F2]">
      <ScrollProgress />

      {/* NON-INTRUSIVE POPUP TOAST */}
      {popupToast.visible && (
        <div
          className={`animate-toast-in fixed top-24 right-3 left-3 sm:left-auto sm:right-6 z-50 sm:max-w-sm overflow-hidden rounded-2xl border-2 p-4 text-white shadow-2xl ${
            popupToast.isError
              ? "border-rose-400 bg-rose-950"
              : "border-emerald-400/80 bg-[#071C15]"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-amber-300">
              {popupToast.isError ? (
                <AlertCircle className="h-5 w-5 text-rose-300" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-serif text-sm font-bold text-amber-200">
                {popupToast.title}
              </p>
              <p className="mt-0.5 text-[11px] text-emerald-100/85">
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
                    className="rounded-lg bg-gradient-to-r from-[#E8502B] to-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white cursor-pointer"
                  >
                    Open Cart ({totalCartGrams}g)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPopupToast((prev) => ({ ...prev, visible: false }))
                    }
                    className="rounded-lg border border-white/20 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-200 hover:bg-white/10 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Draining timer — signals when the toast disappears */}
          <div className="absolute inset-x-0 bottom-0 h-[3px]">
            <div
              className={`animate-toast-drain h-full w-full ${
                popupToast.isError
                  ? "bg-gradient-to-r from-rose-400 to-rose-200"
                  : "bg-gradient-to-r from-amber-400 to-emerald-400"
              }`}
            />
          </div>
        </div>
      )}

      {/* 1. FULL-SCREEN MOVABLE KEN-BURNS HERO CAROUSEL SLIDER */}
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
          className="relative w-full min-h-[540px] sm:min-h-[640px] lg:min-h-[82vh] flex items-center overflow-hidden bg-[#05150F] grain"
        >
          {/* Background Slides with Ken Burns + clip-path wipe */}
          {heroBanners.map((slide, index) => {
            const isActive = index === currentSlide;
            return (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                  isActive
                    ? "opacity-100 z-10"
                    : "opacity-0 z-0 pointer-events-none"
                }`}
              >
                <div
                  className={`h-full w-full ${
                    isActive ? "animate-hero-wipe" : ""
                  }`}
                >
                  <img
                    src={slide.imageUrl}
                    alt={slide.titleLine1}
                    className={`h-full w-full object-cover object-center ${
                      isActive ? "animate-ken-burns" : "scale-105"
                    }`}
                  />
                </div>
                {/* Multi-layered Cinematic Luxury Scrim */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#04120C]/95 via-[#071C15]/80 to-black/35" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#04120C] via-transparent to-black/30" />
              </div>
            );
          })}

          {/* Living aurora — organic, slow drifting color orbs */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[5] overflow-hidden"
          >
            <div className="animate-aurora absolute -left-24 top-10 h-[26rem] w-[26rem] rounded-full bg-[#E8502B]/12 blur-[110px]" />
            <div
              className="animate-aurora absolute right-[-10%] top-1/3 h-[30rem] w-[30rem] rounded-full bg-emerald-500/10 blur-[130px]"
              style={{ animationDelay: "-7s", animationDuration: "26s" }}
            />
            <div
              className="animate-aurora absolute bottom-[-15%] left-1/3 h-[22rem] w-[22rem] rounded-full bg-amber-400/12 blur-[110px]"
              style={{ animationDelay: "-14s", animationDuration: "23s" }}
            />
          </div>

          {/* Foreground Choreographed Content */}
          <div className="relative z-20 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <div key={activeSlideData.id} className="relative max-w-3xl space-y-6">
              {/* 0ms — Floating Badge */}
              <div className="animate-fade-lift-in">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-black/45 px-4 py-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-widest text-amber-300 backdrop-blur-md">
                  <Leaf className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>{activeSlideData.badge}</span>
                </div>
              </div>

              {/* 80ms — word-by-word 3D mask rise + 340ms clip-wipe gradient */}
              <div className="space-y-1">
                <SplitText
                  as="h1"
                  play
                  mode="words"
                  stagger={58}
                  delay={80}
                  text={activeSlideData.titleLine1}
                  className="font-serif text-4xl font-bold leading-[1.1] tracking-tight text-white drop-shadow-md sm:text-6xl lg:text-7xl"
                />

                <div className="overflow-hidden pb-2">
                  <div
                    className="animate-wipe-right"
                    style={{ animationDelay: "340ms" }}
                  >
                    <span className="block animate-gradient-pan bg-gradient-to-r from-[#FF7A59] via-amber-300 to-emerald-300 bg-[length:220%_auto] bg-clip-text font-serif text-3xl font-normal italic text-transparent sm:text-5xl lg:text-6xl">
                      {activeSlideData.titleHighlight}
                    </span>
                  </div>
                </div>
              </div>

              {/* 520ms — Subtitle */}
              <p
                className="animate-fade-lift-in max-w-xl text-sm sm:text-base lg:text-lg text-emerald-50/90 leading-relaxed"
                style={{ animationDelay: "520ms" }}
              >
                {activeSlideData.subtitle}
              </p>

              {/* 660ms — CTAs */}
              <div
                className="animate-fade-lift-in flex flex-col sm:flex-row sm:items-center gap-3.5 pt-2"
                style={{ animationDelay: "660ms" }}
              >
                <Link
                  href={activeSlideData.primaryBtnHref}
                  className="group relative overflow-hidden inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#E8502B] via-[#F05A36] to-emerald-600 px-8 py-4 text-xs sm:text-sm font-bold text-white shadow-[0_20px_50px_-10px_rgba(232,80,43,0.55)] transition duration-300"
                >
                  <span className="pointer-events-none absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-[150%] transition-transform duration-700 group-hover:translate-x-[250%]" />
                  <ShoppingBag className="h-4 w-4 text-amber-200" />
                  <span>{activeSlideData.primaryBtnText}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href={activeSlideData.secondaryBtnHref}
                  className="inline-flex items-center justify-center gap-2.5 rounded-full border border-emerald-400/50 bg-white/10 px-7 py-4 text-xs sm:text-sm font-bold text-white backdrop-blur-md transition hover:bg-white hover:text-[#071C15]"
                >
                  <span>{activeSlideData.secondaryBtnText}</span>
                </Link>
              </div>

              {/* 800ms — Bottom Bar: Carousel Indicators & Prev/Next Controls */}
              <div
                className="animate-fade-lift-in pt-6 flex items-center justify-end border-t border-white/15"
                style={{ animationDelay: "800ms" }}
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
                          className={`relative h-2 rounded-full overflow-hidden transition-all duration-300 cursor-pointer ${
                            isActive
                              ? "w-11 bg-white/25"
                              : "w-2.5 bg-white/35 hover:bg-white/60"
                          }`}
                          aria-label={`Slide ${idx + 1}`}
                        >
                          {isActive && (
                            <span
                              key={`hero-progress-${currentSlide}`}
                              className="absolute inset-y-0 left-0 h-full rounded-full bg-amber-300 animate-slide-progress"
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

      {/* 1B. SEAMLESS INFINITE BOTANICAL MARQUEE TICKER */}
      <div className="relative z-20 overflow-hidden bg-[#071C15] border-y border-emerald-800/70 py-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-200 grain">
        <div className="animate-palassh-marquee flex items-center gap-10">
          {[...Array(2)].map((_, copyIdx) => (
            <div key={copyIdx} className="flex items-center gap-10 shrink-0">
              <span className="flex items-center gap-2 text-amber-300">
                <Sparkles className="h-3.5 w-3.5 text-[#F05A36]" />
                SACRED PUJA BLOOMS
              </span>
              <span>• DAILY FARM HARVEST</span>
              <span className="text-emerald-400">• 100% ZERO COLD STORAGE</span>
              <span>• 6:00 AM – 8:00 AM SILENT DOORSTEP DROP</span>
              <span className="text-amber-300">
                • MARIGOLD (झेंडू) • CHRYSANTHEMUM (शेवंती) • RED HIBISCUS (लाल
                जास्वंद)
              </span>
              <span>• SERVING THANE</span>
            </div>
          ))}
        </div>
      </div>

      {/* STAT COUNTER BAR (PHASE 6) */}
      <StatBar />

      {/* 2. PINCODE CONCIERGE DOCK */}
      <div className="py-8 sm:py-12">
        <FeatureBoundary featureName="PINCODE">
          <PincodeBox />
        </FeatureBoundary>
      </div>

      {/* 3. 3D PERSPECTIVE TILT FLOWER STORE WITH DIRECT "ADD" + "BUY NOW" */}
      <FeatureBoundary featureName="DIRECT_FLOWER_STORE">
        <section
          id="fresh-flowers"
          className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl border-b border-stone-200"
        >
          <ScrollReveal variant="blur-scale">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-stone-100 border border-stone-200 px-3.5 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] text-stone-900">
                  <ShoppingBag className="h-3.5 w-3.5 text-[#E8502B]" />
                  <span>Interactive 3D Botanical Showcase</span>
                </div>
                <SplitText
                  as="h2"
                  mode="words"
                  stagger={55}
                  text="Shop Sacred Puja Flowers"
                  className="font-serif text-3xl sm:text-5xl font-bold text-stone-900"
                />
                <p className="text-xs sm:text-base text-stone-600">
                  Pick your exact gram pack (
                  <strong className="text-stone-900">
                    100g, 250g, 500g, 1000g
                  </strong>
                  ) and either add to basket or click{" "}
                  <strong className="text-[#E8502B]">Buy Now</strong> for
                  instant checkout.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  window.dispatchEvent(new Event("palassh-open-cart"))
                }
                className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#071C15] via-emerald-900 to-[#071C15] px-5 py-3.5 text-xs font-bold text-amber-200 shadow-lg hover:brightness-110 cursor-pointer shrink-0"
              >
                <ShoppingBag className="h-4 w-4 text-[#F05A36]" />
                <span className="inline-flex items-center gap-1">
                  <span>Flower Basket (</span>
                  <span
                    key={totalCartItems}
                    className="animate-badge-bump inline-block"
                  >
                    {totalCartItems}
                  </span>
                  <span>
                    • {totalCartGrams}g • ₹{totalCartAmount})
                  </span>
                </span>
              </button>
            </div>
          </ScrollReveal>

          {festiveStatus.isFestiveDay && (
            <ScrollReveal variant="fade-lift">
              <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-400 bg-[#071C15] px-5 py-4 text-white shadow-xl grain">
                <div className="flex items-center gap-2.5">
                  <Flame className="h-5 w-5 text-amber-400 shrink-0" />
                  <p className="text-xs sm:text-sm text-emerald-100">
                    <strong className="text-amber-300">
                      Festive Mode Active:
                    </strong>{" "}
                    Direct flower purchases are reserved for Weekly (max 2 KG) &
                    Monthly (max 3 KG) subscribers.
                  </p>
                </div>
                {isNormalLockedOnFestive && (
                  <button
                    type="button"
                    onClick={(e) => scrollToPlans(e)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-4 py-2 text-xs font-bold text-stone-950 shadow-md transition hover:bg-amber-300 whitespace-nowrap cursor-pointer shrink-0 self-start sm:self-auto"
                  >
                    <Lock className="h-3.5 w-3.5 text-[#E8502B]" />
                    <span>View Subscription Plans</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </ScrollReveal>
          )}

          {!festiveStatus.isFestiveDay && isNormalPurchaseBlocked && (
            <ScrollReveal variant="fade-lift">
              <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-amber-500/60 bg-[#071C15] p-5 text-white shadow-xl grain">
                <div
                  onClick={(e) => scrollToPlans(e)}
                  className="flex items-center gap-3.5 cursor-pointer group"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/20 text-amber-300 group-hover:scale-105 transition">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-emerald-100">
                      <strong className="text-amber-300 font-serif text-sm sm:text-base">
                        Subscriber-Exclusive Orders:
                      </strong>{" "}
                      Direct loose flower orders are currently reserved for Weekly &amp; Monthly plan members.
                    </p>
                    <p className="text-[11px] text-emerald-200/70 mt-0.5">
                      Subscribe to a Weekly or Monthly plan to order fresh daily flowers and unlock up to 2 KG – 3 KG quotas!
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => scrollToPlans(e)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#E8502B] to-amber-500 px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:brightness-110 whitespace-nowrap self-start sm:self-auto shrink-0 cursor-pointer"
                >
                  <span>View Subscription Plans</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </ScrollReveal>
          )}

          {!festiveStatus.isFestiveDay && !isNormalUser && !normalPurchaseAllowed && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-[#071C15] px-4 py-2 text-xs font-bold text-emerald-200">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Subscriber Access Active ({customerTier}): Your member quota is unlocked for direct flower orders.</span>
            </div>
          )}

          {/* 3 Homepage Flower Cards with 3D flip-in, tilt, dual buttons */}
          <div className="mt-10 sm:mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
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
                  delayMs={idx * 160}
                  variant="fade-lift"
                >
                  <Tilt3DCard
                    isUplifted={isCardUplifted}
                    onClick={() => {
                      if (isNormalPurchaseBlocked || isNormalLockedOnFestive) {
                        scrollToPlans();
                        return;
                      }
                      setUpliftedFlowerId((prev) =>
                        prev === flower.id ? null : flower.id
                      );
                    }}
                    className={`group flex flex-col justify-between h-full rounded-[2.2rem] border bg-white cursor-pointer transition-all duration-300 ${
                      isCardUplifted
                        ? "border-[#E8502B] -translate-y-2 shadow-[0_24px_50px_-10px_rgba(232,80,43,0.18)]"
                        : "border-stone-200/90 shadow-[0_16px_40px_-12px_rgba(28,22,19,0.08)] hover:border-[#E8502B]/60 hover:-translate-y-1.5 hover:shadow-[0_22px_45px_-12px_rgba(28,22,19,0.14)]"
                    }`}
                  >
                    <div>
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
                        <img
                          src={flower.imageUrl}
                          alt={flower.name}
                          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#071C15]/85 via-transparent to-transparent" />
                        <span
                          onClick={(e) => {
                            if (isNormalPurchaseBlocked || isNormalLockedOnFestive) {
                              scrollToPlans(e);
                            }
                          }}
                          className={`absolute left-4 top-4 rounded-full px-3.5 py-1 text-[11px] font-bold shadow-xs flex items-center gap-1.5 transition ${
                            isNormalPurchaseBlocked || isNormalLockedOnFestive
                              ? "bg-amber-300 text-stone-950 hover:bg-amber-400 cursor-pointer"
                              : "bg-white/95 text-emerald-950"
                          }`}
                        >
                          {(isNormalPurchaseBlocked || isNormalLockedOnFestive) && (
                            <Lock className="h-3 w-3 text-[#E8502B]" />
                          )}
                          <span>
                            {inCartItem
                              ? `In Basket: ${inCartItem.grams}g`
                              : isNormalPurchaseBlocked || isNormalLockedOnFestive
                              ? "Subscribers Only"
                              : "Fresh Farm Stock"}
                          </span>
                        </span>
                        <div className="absolute bottom-3.5 left-4 right-4 flex items-center justify-between text-white">
                          <span className="text-xs font-medium text-emerald-100">
                            {flower.deityAffinity}
                          </span>
                          <span className="rounded-lg bg-black/55 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-amber-300 border border-white/15">
                            6:00 – 8:00 AM
                          </span>
                        </div>
                      </div>

                      <div className="p-6 space-y-4">
                        <div>
                          <div className="flex items-baseline gap-2.5 flex-wrap">
                            <h3 className="font-serif text-2xl font-bold text-stone-900 group-hover:text-[#E8502B] transition">
                              {flower.name}
                            </h3>
                            <span className="text-xs font-semibold text-stone-800 bg-stone-100 px-2.5 py-0.5 rounded-md border border-stone-200">
                              {flower.marathiName}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-stone-500">
                            {flower.subtitle}
                          </p>
                        </div>

                        {/* Direct Gram Pack Selector on Card */}
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
                                    setUpliftedFlowerId(flower.id);
                                  }}
                                  className={`rounded-xl border py-2 px-1 text-center transition cursor-pointer ${
                                    active
                                      ? "border-2 border-[#E8502B] bg-orange-50/70 font-bold text-stone-900 shadow-2xs"
                                      : "border-stone-200 bg-[#FAF7F2] text-stone-600 hover:border-[#E8502B]"
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

                    {/* Dual Action Buttons: Add Pack + Buy Now OR Subscriber Exclusive CTA */}
                    <div className="px-6 pb-6 pt-1 relative z-30">
                      {!flower.inStock ? (
                        <button
                          type="button"
                          disabled
                          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-200 py-3.5 text-xs font-bold text-stone-500 cursor-not-allowed"
                        >
                          <span>Out of Stock</span>
                        </button>
                      ) : isNormalLockedOnFestive ? (
                        <button
                          type="button"
                          onClick={(e) => scrollToPlans(e)}
                          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-stone-900 via-[#071C15] to-emerald-950 border border-amber-400/50 py-3.5 px-3 text-xs font-bold text-amber-300 shadow-md hover:brightness-110 transition cursor-pointer"
                          title="Locked on Festive Day • Click to view Subscription Plans"
                        >
                          <Lock className="h-3.5 w-3.5 text-amber-300" />
                          <span>Locked on Festive Day • View Plans</span>
                        </button>
                      ) : isNormalPurchaseBlocked ? (
                        <button
                          type="button"
                          onClick={(e) => scrollToPlans(e)}
                          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#E8502B] via-[#F05A36] to-amber-600 py-3.5 px-3 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition hover:brightness-110 cursor-pointer"
                          title="Locked for Non-Subscribers • Click to view Subscription Plans"
                        >
                          <Lock className="h-3.5 w-3.5" />
                          <span>Subscribe to Order Flowers</span>
                        </button>
                      ) : (
                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUpliftedFlowerId(flower.id);
                              handleFlowerAction(flower, false);
                            }}
                            className="flex items-center justify-center gap-1.5 rounded-2xl border-2 border-[#071C15] bg-white py-3.5 px-3 text-xs font-bold text-[#071C15] transition hover:bg-[#071C15] hover:text-amber-200 cursor-pointer"
                          >
                            <ShoppingBag className="h-3.5 w-3.5 text-[#E8502B] shrink-0" />
                            <span>Add {selectedWeight.grams}g</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUpliftedFlowerId(flower.id);
                              handleFlowerAction(flower, true);
                            }}
                            className="flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-[#E8502B] via-[#F05A36] to-emerald-600 py-3.5 px-3 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition hover:brightness-110 cursor-pointer"
                          >
                            <Zap className="h-3.5 w-3.5 shrink-0" />
                            <span>Buy Now • ₹{selectedWeight.price}</span>
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
                className="inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-[#E8502B] via-[#F05A36] to-emerald-600 px-8 py-4 text-xs sm:text-sm font-bold text-white shadow-xl shadow-orange-500/20 transition hover:scale-[1.02]"
              >
                <span>Explore Full Flower Catalog (/products)</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Magnetic>
          </div>
        </section>
      </FeatureBoundary>

      {/* 4. CUSTOMIZABLE SUBSCRIPTION PLANS */}
      <FeatureBoundary featureName="CATALOG">
        <ScrollReveal variant="flip">
          <PlanCards plans={plans} />
        </ScrollReveal>
      </FeatureBoundary>

      {/* SIGNATURE MOMENT: HORIZONTAL MORNING RITUAL TIMELINE (PHASE 7) */}
      <MorningRitual />

      {/* 5. INTERACTIVE 3-STEP RITUAL TIMELINE WITH DRAWN BEAM + TRAVEL PULSE */}
      <section
        id="how-it-works"
        className="relative border-y border-stone-200 bg-gradient-to-b from-white via-[#FFFDFB] to-[#FAF7F2] py-16 sm:py-24 px-4 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <ScrollReveal variant="blur-scale">
            <div className="mx-auto max-w-2xl text-center space-y-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 border border-stone-200 px-4 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-stone-900">
                <Sparkles className="h-3 w-3 text-[#E8502B]" /> Effortless
                Devotion
              </span>
              <SplitText
                as="h2"
                mode="words"
                stagger={55}
                text="How Your PALASSH Ritual Works"
                className="font-serif text-3xl sm:text-5xl font-bold text-stone-900"
              />
            </div>
          </ScrollReveal>

          <div className="relative mt-12 sm:mt-16">
            {/* Animated connecting beam */}
            <RitualBeam />

            <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3 relative z-10">
              {(() => {
                const oneDayPrice = plans.find((p) => p.id === "plan-daily")?.price || 49;
                const weeklyPrice = plans.find((p) => p.id === "plan-weekly")?.price || 329;
                const monthlyPrice = (
                  plans.find((p) => p.id === "plan-monthly")?.price || 1350
                ).toLocaleString("en-IN");

                return [
                  {
                    step: "01",
                    icon: CalendarCheck,
                    title: "Choose Plan or Weight Pack",
                    desc: `Subscribe to One Day (₹${oneDayPrice}), Weekly (₹${weeklyPrice}), Monthly (₹${monthlyPrice}) or buy individual flower weight packs (up to 500g).`,
                  },
                  {
                    step: "02",
                    icon: Clock,
                    title: "6–8 AM Silent Doorstep Drop",
                    desc: "Every morning between 6:00 AM and 8:00 AM, our rider hangs your breathable flower pouch on your door without ringing the bell.",
                  },
                  {
                    step: "03",
                    icon: PauseCircle,
                    title: "Interactive Calendar Pause",
                    desc: "Traveling out of Thane? Tap any date on your My-Orders calendar before 8:00 PM to pause (2 Weekly / 5 Monthly pauses).",
                  },
                ].map((item, i) => (
                  <ScrollReveal
                    key={item.step}
                    delayMs={i * 150}
                    variant="blur-scale"
                  >
                    <Tilt3DCard className="group rounded-3xl sm:rounded-[2rem] border border-orange-200/70 bg-white p-7 sm:p-8 shadow-lg h-full">
                      <div className="flex items-center justify-between">
                        <div
                          className="animate-pop-in flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8502B] to-emerald-600 text-white shadow-md"
                          style={{ animationDelay: `${i * 150 + 220}ms` }}
                        >
                          <item.icon className="h-6 w-6" />
                        </div>
                        <span className="font-serif text-4xl font-bold bg-gradient-to-b from-[#E8502B]/30 to-emerald-700/20 bg-clip-text text-transparent">
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
                ));
              })()}
            </div>
          </div>
        </div>
      </section>

      {/* 6. SINGLE-LINE HORIZONTAL SWIPEABLE REVIEWS CAROUSEL + INLINE REVIEW FORM */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl space-y-16">
        <div>
          <ScrollReveal variant="blur-scale">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 border border-stone-200 px-3.5 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] text-stone-900">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                  <span>Swipe Left / Right • Thane Pincodes 400601–400608</span>
                </span>
                <SplitText
                  as="h2"
                  mode="words"
                  stagger={55}
                  text="Morning Blessings from Thane Families"
                  className="font-serif text-3xl sm:text-4xl font-bold text-stone-900"
                />
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => scrollReviewsRow("left")}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-900 hover:bg-stone-100 cursor-pointer shadow-2xs transition"
                  aria-label="Scroll Reviews Left"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollReviewsRow("right")}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-[#E8502B] to-emerald-600 text-white hover:brightness-105 cursor-pointer shadow-sm transition"
                  aria-label="Scroll Reviews Right"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </ScrollReveal>

          {/* SINGLE-LINE HORIZONTAL SWIPEABLE CARDS CONTAINER */}
          <div
            ref={reviewsScrollRef}
            className="flex gap-4 sm:gap-6 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="w-[84vw] sm:w-[350px] md:w-[370px] shrink-0 snap-center sm:snap-start flex flex-col justify-between rounded-3xl border border-orange-200/80 bg-white p-6 shadow-md transition-transform duration-300 hover:-translate-y-1.5 hover:border-[#E8502B]"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-amber-500">
                      {[...Array(rev.rating || 5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400" />
                      ))}
                    </div>
                    {rev.tag && (
                      <span className="rounded-full bg-stone-100 border border-stone-200 px-2.5 py-0.5 text-[10px] font-bold text-stone-800">
                        {rev.tag}
                      </span>
                    )}
                  </div>
                  <p className="mt-4 text-xs sm:text-sm leading-relaxed text-stone-700 italic">
                    “{rev.quote}”
                  </p>
                </div>

                <div className="mt-5 border-t border-stone-100 pt-3.5 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-serif text-sm sm:text-base font-bold text-stone-900 truncate">
                      {rev.name}
                    </p>
                    <p className="text-[11px] text-emerald-800 font-medium truncate">
                      {rev.society}
                    </p>
                  </div>
                  <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                </div>
              </div>
            ))}
          </div>

          {/* DEDICATED INLINE REVIEW SUBMISSION SECTION */}
          <ScrollReveal variant="blur-scale">
            <div className="mt-10 overflow-hidden rounded-3xl sm:rounded-[2.5rem] border border-emerald-800/30 bg-gradient-to-br from-[#071C15] via-[#0B2B20] to-[#071C15] p-5 sm:p-10 text-white shadow-xl grain">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
                <div className="lg:col-span-5 space-y-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-900/80 border border-emerald-600 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-300">
                    <Sparkles className="h-3 w-3 text-[#F05A36]" />
                    <span>Add Your Blessing</span>
                  </span>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold leading-tight">
                    Share Your PALASSH Morning Experience
                  </h3>
                  <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
                    Your review appears immediately in the swipeable Thane
                    Devotee row above.
                  </p>
                </div>

                <form
                  onSubmit={handleSubmitReview}
                  className="lg:col-span-7 rounded-2xl sm:rounded-3xl bg-white p-5 sm:p-7 text-stone-900 shadow-lg space-y-4"
                >
                  {reviewSubmittedMsg && (
                    <div className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs font-bold text-emerald-900">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>{reviewSubmittedMsg}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Full Name *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="e.g. Mrs. Deshmukh"
                          value={reviewerName}
                          onChange={(e) => setReviewerName(e.target.value)}
                          className="peer w-full rounded-xl border border-stone-300 bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#E8502B] focus:bg-white focus:outline-none transition"
                        />
                        <span className="pointer-events-none absolute bottom-0 left-0 h-[2px] w-full origin-left scale-x-0 bg-[#E8502B] transition-transform duration-300 peer-focus:scale-x-100" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Society & Thane Pincode *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="e.g. Hiranandani Estate (400607)"
                          value={reviewerSociety}
                          onChange={(e) => setReviewerSociety(e.target.value)}
                          className="peer w-full rounded-xl border border-stone-300 bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#E8502B] focus:bg-white focus:outline-none transition"
                        />
                        <span className="pointer-events-none absolute bottom-0 left-0 h-[2px] w-full origin-left scale-x-0 bg-[#E8502B] transition-transform duration-300 peer-focus:scale-x-100" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Rating
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewerRating(star)}
                          className={`h-8 w-10 rounded-lg border flex items-center justify-center text-sm font-bold transition cursor-pointer ${
                            reviewerRating >= star
                              ? "border-amber-400 bg-amber-50 text-amber-500"
                              : "border-stone-200 bg-white text-stone-300"
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Your Experience *
                    </label>
                    <div className="relative">
                      <textarea
                        required
                        rows={2}
                        placeholder="Tell us about the morning flower freshness or 6–8 AM silent delivery..."
                        value={reviewerQuote}
                        onChange={(e) => setReviewerQuote(e.target.value)}
                        className="peer w-full rounded-xl border border-stone-300 bg-[#FAF7F2] p-3 text-sm text-stone-900 focus:border-[#E8502B] focus:bg-white focus:outline-none transition"
                      />
                      <span className="pointer-events-none absolute bottom-0 left-0 h-[2px] w-full origin-left scale-x-0 bg-[#E8502B] transition-transform duration-300 peer-focus:scale-x-100" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#E8502B] via-[#F05A36] to-emerald-600 py-3.5 text-xs sm:text-sm font-bold text-white shadow-md hover:brightness-105 cursor-pointer"
                  >
                    <Send className="h-4 w-4" />
                    <span>Publish Review</span>
                  </button>
                </form>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* 7. SMOOTH GRID-ACCORDION FAQ SECTION */}
        <ScrollReveal variant="flip">
          <div className="rounded-3xl sm:rounded-[2.5rem] border border-emerald-900/15 bg-white p-5 sm:p-10 lg:p-14 shadow-xl">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
                <div className="space-y-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 border border-orange-200 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-[#E8502B]">
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
                    Clear answers on our 6:00 AM – 8:00 AM delivery slot, 500g
                    normal limits, Festive 2 KG / 3 KG subscriber quotas, and
                    calendar pauses.
                  </p>
                </div>

                <div className="rounded-2xl sm:rounded-3xl bg-[#071C15] p-5 sm:p-6 text-white space-y-2.5 grain">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-amber-300">
                    Kalwa Dispatch Hub
                  </p>
                  <p className="text-xs text-emerald-100/85 leading-relaxed flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-[#F05A36] shrink-0 mt-0.5" />
                    <span>{SHOP_ADDRESS}</span>
                  </p>
                  <div className="pt-2 border-t border-white/10">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-200">
                      <PhoneCall className="h-3.5 w-3.5 text-emerald-400" />
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
                      className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
                        isOpen
                          ? "border-[#E8502B] bg-orange-50/15 shadow-md"
                          : "border-stone-200 bg-white hover:border-[#E8502B]/60"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        className="flex w-full items-center justify-between gap-3 px-4 sm:px-6 py-4 text-left cursor-pointer"
                      >
                        <div className="space-y-1">
                          <span className="inline-block rounded-md bg-stone-100 border border-stone-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-stone-700">
                            {item.tag}
                          </span>
                          <p className="font-serif text-sm sm:text-base font-bold text-stone-900">
                            {item.q}
                          </p>
                        </div>
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform duration-300 ${
                            isOpen
                              ? "bg-[#E8502B] text-white rotate-180"
                              : "bg-stone-100 text-stone-900"
                          }`}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </div>
                      </button>

                      {/* Smooth CSS Grid Height Animation */}
                      <div
                        className={`grid transition-all duration-300 ease-out ${
                          isOpen
                            ? "grid-rows-[1fr] opacity-100"
                            : "grid-rows-[0fr] opacity-0"
                        }`}
                      >
                        <div className="overflow-hidden">
                          <div className="border-t border-stone-100 px-4 sm:px-6 py-4 text-xs sm:text-sm leading-relaxed text-stone-600 bg-white">
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