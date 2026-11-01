"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MapPin,
  ShoppingBag,
  Menu,
  X,
  User,
  Calendar,
  Flower2,
  Sparkles,
  Trash2,
  ArrowRight,
  Lock,
} from "lucide-react";
import {
  CartItem,
  INITIAL_PLANS,
  SubscriptionPlan,
  getActivePlansCatalog,
  getStoredCart,
  saveStoredCart,
  getCurrentCustomerTier,
  getFestiveModeStatus,
  getNormalPurchaseAllowed,
} from "@/features/catalog/types";

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>(INITIAL_PLANS);
  const [customerTier, setCustomerTier] = useState("NORMAL");
  const [festiveDay, setFestiveDay] = useState(false);
  const [normalPurchaseAllowed, setNormalPurchaseAllowed] = useState(true);

  useEffect(() => {
    const syncNavbarCart = () => {
      setCart(getStoredCart());
      setPlans(getActivePlansCatalog());
      setCustomerTier(getCurrentCustomerTier());
      setFestiveDay(getFestiveModeStatus().isFestiveDay);
      setNormalPurchaseAllowed(getNormalPurchaseAllowed());
    };
    syncNavbarCart();

    const handleOpenDrawer = () => {
      syncNavbarCart();
      setIsCartOpen(true);
    };

    window.addEventListener("palassh-cart-updated", syncNavbarCart);
    window.addEventListener("palassh-festive-updated", syncNavbarCart);
    window.addEventListener("palassh-plans-updated", syncNavbarCart);
    window.addEventListener("palassh-store-access-updated", syncNavbarCart);
    window.addEventListener("storage", syncNavbarCart);
    window.addEventListener("palassh-open-cart", handleOpenDrawer);

    return () => {
      window.removeEventListener("palassh-cart-updated", syncNavbarCart);
      window.removeEventListener("palassh-festive-updated", syncNavbarCart);
      window.removeEventListener("palassh-plans-updated", syncNavbarCart);
      window.removeEventListener("palassh-store-access-updated", syncNavbarCart);
      window.removeEventListener("storage", syncNavbarCart);
      window.removeEventListener("palassh-open-cart", handleOpenDrawer);
    };
  }, []);

  const handleRemoveFromCart = (id: string) => {
    const updated = cart.filter((item) => item.id !== id);
    setCart(updated);
    saveStoredCart(updated);
  };

  const totalCartItems = cart.length;
  const totalCartGrams = cart.reduce((acc, i) => acc + (i.grams || 100), 0);
  const totalCartAmount = cart.reduce((acc, i) => acc + i.unitPrice, 0);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "All Products", href: "/products" },
    { label: "Subscriptions", href: "/#plans" },
    { label: "About Us", href: "/about" },
    { label: "Check Pincode", href: "/#pincode-check", isPin: true },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full shadow-lg shadow-emerald-950/10">
        {/* Sacred Orange to Light-Green Mix Gradient Accent Line */}
        <div className="h-1 w-full bg-gradient-to-r from-[#E8502B] via-amber-400 to-emerald-500" />
        {/* 1. SACRED DEVOTIONAL CROWN BAR ("॥ जय जय रघुवीर समर्थ ॥") */}
        <div className="bg-gradient-to-r from-[#071C15] via-[#0F3828] to-[#071C15] px-3 py-1.5 text-white border-b border-emerald-700/40">
          <div className="mx-auto flex max-w-7xl items-center justify-between text-[10px] sm:text-[11px]">
            <span className="hidden md:inline-flex items-center gap-1.5 text-emerald-200 font-medium">
              <Sparkles className="h-3 w-3 text-amber-300" />
              <span>Thane Delivery: 6:00 AM – 8:00 AM (400601–400608)</span>
            </span>

            <p className="mx-auto md:mx-0 font-serif text-xs sm:text-sm font-bold tracking-[0.16em] text-amber-300">
              {pathname === "/" ? "॥ जय जय रघुवीर समर्थ ॥" : "PALASSH • SACRED PUJA BLOOMS"}
            </p>

            <span className="hidden md:inline-flex items-center gap-1.5 text-emerald-200 font-medium">
              <span>100% Farm-Fresh • Zero Cold Storage</span>
            </span>
          </div>
        </div>

        {/* 2. MAIN NAVBAR WITH CART ON DESKTOP & MOBILE */}
        <div className="bg-[#071C15]/95 border-b border-emerald-800/60 backdrop-blur-xl">
          <div className="mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between px-3.5 sm:px-6 lg:px-8 gap-2">
            {/* Left: PALASSH Logo */}
            <Link href="/" className="flex items-center gap-2.5 sm:gap-3.5 group shrink-0">
              <div className="relative flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl sm:rounded-2xl border border-amber-400/50 bg-white p-1 shadow-sm">
                <img
                  src="/images/logo.jpeg"
                  alt="PALASSH"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-lg sm:text-2xl font-bold tracking-[0.14em] text-white leading-none">
                  PALASSH
                </span>
                <span className="mt-0.5 sm:mt-1 text-[10px] sm:text-[11px] italic text-emerald-300 font-serif whitespace-nowrap">
                  flowers that pray with you
                </span>
              </div>
            </Link>

            {/* Center: Desktop Navigation Links */}
            <nav className="hidden xl:flex items-center gap-1 rounded-full border border-emerald-800 bg-[#0B2B20] p-1.5">
              {navLinks.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold whitespace-nowrap transition ${ isActive ? "bg-gradient-to-r from-[#E8502B] via-amber-500 to-emerald-600 text-white shadow-md shadow-orange-500/20" : item.isPin ? "text-amber-300 hover:bg-emerald-900/80" : "text-emerald-100/90 hover:bg-emerald-900/70 hover:text-white" }`} > {item.isPin && <MapPin className="h-3.5 w-3.5 text-emerald-400" />} {item.href === "/products" && ( <Flower2 className="h-3.5 w-3.5 text-amber-300" /> )} <span>{item.label}</span> </Link> ); })} </nav>  {/* Right: Cart Button (Always Visible on Mobile & Desktop) + Account/Orders */} <div className="flex items-center gap-2 shrink-0"> <Link href="/account" className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-emerald-700/70 bg-[#0B2B20] px-3.5 py-2 text-xs font-bold text-emerald-100 hover:border-emerald-400 hover:text-white whitespace-nowrap transition" > <User className="h-3.5 w-3.5 text-emerald-400" /> <span>My Account</span> </Link>  <Link href="/my-orders" className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-emerald-700/70 bg-[#0B2B20] px-3.5 py-2 text-xs font-bold text-emerald-100 hover:border-emerald-400 hover:text-white whitespace-nowrap transition" > <Calendar className="h-3.5 w-3.5 text-amber-300" /> <span>My Orders</span> </Link>  {/* Dedicated Cart Button in Navbar (Light-Green Shade) */} <button type="button" onClick={() => setIsCartOpen(true)} className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-gradient-to-r from-[#E8502B] via-amber-500 to-emerald-600 px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/25 transition hover:brightness-110 cursor-pointer whitespace-nowrap" > <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-200" /> <span>Cart</span> <span className="rounded-full bg-[#071C15]/80 px-2 py-0.5 text-[10px] font-bold text-amber-300"> {totalCartItems > 0 ? `${totalCartGrams}g` : "0"}
                </span>
              </button>

              {/* Mobile Hamburger Trigger */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="rounded-xl border border-emerald-700 bg-[#0B2B20] p-2 text-amber-200 xl:hidden hover:bg-emerald-900 cursor-pointer"
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu Drawer */}
          {mobileMenuOpen && (
            <div className="border-t border-emerald-800/80 bg-[#071C15] px-4 pt-3 pb-5 xl:hidden space-y-2 text-emerald-100">
              <div className="grid grid-cols-2 gap-2 pb-2 border-b border-emerald-800/60">
                <Link
                  href="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-700 bg-[#0B2B20] py-2.5 text-xs font-bold text-white"
                >
                  <User className="h-3.5 w-3.5 text-emerald-400" />
                  <span>My Account</span>
                </Link>
                <Link
                  href="/my-orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#E8502B] via-amber-500 to-emerald-600 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20"
                >
                  <Calendar className="h-3.5 w-3.5 text-amber-200" />
                  <span>My Orders</span>
                </Link>
              </div>

              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-xl px-3.5 py-2.5 text-sm font-semibold hover:bg-emerald-900/60"
              >
                🏠 Home
              </Link>
              <Link
                href="/products"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-xl bg-emerald-950/90 border border-emerald-700/70 px-3.5 py-2.5 text-sm font-bold text-emerald-300"
              >
                🌺 All Products (/products)
              </Link>
              <Link
                href="/#plans"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-xl px-3.5 py-2.5 text-sm font-semibold hover:bg-emerald-900/60"
              >
                {(() => {
                  const oneDayPrice = plans.find((p) => p.id === "plan-daily")?.price || 49;
                  const weeklyPrice = plans.find((p) => p.id === "plan-weekly")?.price || 329;
                  const monthlyPrice = (
                    plans.find((p) => p.id === "plan-monthly")?.price || 1350
                  ).toLocaleString("en-IN");
                  return `🌸 Subscriptions (₹${oneDayPrice} / ₹${weeklyPrice} / ₹${monthlyPrice})`;
                })()}
              </Link>
              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-xl px-3.5 py-2.5 text-sm font-semibold hover:bg-emerald-900/60"
              >
                📖 About Us & Story
              </Link>
              <Link
                href="/#pincode-check"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-xl px-3.5 py-2.5 text-sm font-semibold text-amber-200 hover:bg-emerald-900/60"
              >
                📍 Verify Thane Pincode (400601–400608)
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* GLOBAL SLIDE-OVER CART DRAWER (Accessible from any page via Navbar Cart Button) */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs">
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-8 sm:pl-10">
            <div className="w-screen max-w-md bg-white p-5 sm:p-7 shadow-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-emerald-700" />
                    <h3 className="font-serif text-lg sm:text-xl font-bold text-stone-900">
                      Your Flower Basket ({totalCartGrams}g)
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCartOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-700 hover:bg-stone-200 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3.5 text-xs text-emerald-950 space-y-1">
                  <p className="font-bold flex items-center justify-between">
                    <span>Tier: {customerTier}</span>
                    <span>Total Weight: {totalCartGrams}g</span>
                  </p>
                  <p className="text-[11px] text-emerald-800">
                    {festiveDay
                      ? "Festive Mode Active: Weekly max 2000g, Monthly max 3000g."
                      : !normalPurchaseAllowed &&
                        (customerTier === "NORMAL" || customerTier === "ONE_DAY")
                      ? "Orders Paused: Direct flower purchases are currently open only to Weekly & Monthly subscribers."
                      : "Normal Days Limit: Up to 500g combined for direct orders."}
                  </p>
                </div>

                {cart.length === 0 ? (
                  <div className="py-16 text-center space-y-3">
                    <ShoppingBag className="mx-auto h-11 w-11 text-stone-300" />
                    <p className="text-sm font-medium text-stone-600">
                      Your flower basket is currently empty.
                    </p>
                    <Link
                      href="/products"
                      onClick={() => setIsCartOpen(false)}
                      className="inline-block rounded-full bg-gradient-to-r from-[#E8502B] via-amber-500 to-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:brightness-105"
                    >
                      Browse Fresh Flowers
                    </Link>
                  </div>
                ) : (
                  <div className="mt-5 divide-y divide-stone-100 max-h-[52vh] overflow-y-auto">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="py-3.5 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={item.imageUrl}
                            alt={item.flowerName}
                            className="h-12 w-12 rounded-xl object-cover border border-stone-200 shrink-0"
                          />
                          <div>
                            <h4 className="font-serif text-sm font-bold text-stone-900">
                              {item.flowerName}{" "}
                              {item.marathiName && (
                                <span className="text-emerald-800 text-xs font-normal">
                                  ({item.marathiName})
                                </span>
                              )}
                            </h4>
                            <span className="inline-block rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-900 mt-0.5">
                              Pack: {item.grams}g • ₹{item.unitPrice}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(item.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer shrink-0"
                          title="Remove Pack"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="border-t border-stone-100 pt-4 space-y-3.5">
                  <div className="flex items-center justify-between text-base font-bold text-stone-900">
                    <span>Total Payable ({totalCartGrams}g):</span>
                    <span className="font-serif text-2xl text-emerald-900">
                      ₹{totalCartAmount.toLocaleString("en-IN")}
                    </span>
                  </div>
                  {!normalPurchaseAllowed &&
                  (customerTier === "NORMAL" || customerTier === "ONE_DAY") ? (
                    <div className="space-y-2">
                      <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">
                        <p className="font-bold flex items-center gap-1.5 text-amber-900">
                          <Lock className="h-3.5 w-3.5 text-[#E8502B] shrink-0" />
                          <span>Subscriber-Only Checkout Active</span>
                        </p>
                        <p className="mt-1 text-[11px] text-amber-800">
                          Loose flower orders are currently reserved for Weekly &amp; Monthly plan members. Subscribe to a plan to complete your order.
                        </p>
                      </div>
                      <Link
                        href="/#plans"
                        onClick={(e) => {
                          setIsCartOpen(false);
                          if (pathname === "/") {
                            e.preventDefault();
                            const el = document.getElementById("plans");
                            if (el) {
                              el.scrollIntoView({ behavior: "smooth", block: "start" });
                            }
                          }
                        }}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#E8502B] via-[#F05A36] to-amber-600 py-4 text-sm font-bold text-white shadow-lg cursor-pointer hover:brightness-105"
                      >
                        <Lock className="h-4 w-4" />
                        <span>Subscribe to Place Flower Order</span>
                      </Link>
                    </div>
                  ) : (
                    <Link
                      href="/checkout?mode=onetime"
                      onClick={() => setIsCartOpen(false)}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 py-4 text-sm font-bold text-white shadow-lg cursor-pointer hover:brightness-105"
                    >
                      <span>Proceed to Checkout (6–8 AM Slot)</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}