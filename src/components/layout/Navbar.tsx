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
} from "@/features/catalog/types";

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>(INITIAL_PLANS);
  const [customerTier, setCustomerTier] = useState("NORMAL");

  useEffect(() => {
    const syncNavbarCart = () => {
      setCart(getStoredCart());
      setPlans(getActivePlansCatalog());
      setCustomerTier(getCurrentCustomerTier());
    };

    syncNavbarCart();

    fetch("/api/orders", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.authenticated && data?.customer?.activeTier) {
          setCustomerTier(data.customer.activeTier);
        }
      })
      .catch(() => {});

    const handleOpenDrawer = () => {
      syncNavbarCart();
      setIsCartOpen(true);
    };

    window.addEventListener("palassh-cart-updated", syncNavbarCart);
    window.addEventListener("palassh-plans-updated", syncNavbarCart);
    window.addEventListener("palassh-store-access-updated", syncNavbarCart);
    window.addEventListener("storage", syncNavbarCart);
    window.addEventListener("palassh-open-cart", handleOpenDrawer);

    return () => {
      window.removeEventListener("palassh-cart-updated", syncNavbarCart);
      window.removeEventListener("palassh-plans-updated", syncNavbarCart);
      window.removeEventListener("palassh-store-access-updated", syncNavbarCart);
      window.removeEventListener("storage", syncNavbarCart);
      window.removeEventListener("palassh-open-cart", handleOpenDrawer);
    };
  }, []);

  useEffect(() => {
    if (!isCartOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsCartOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCartOpen]);

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
    { label: "Subscriptions", href: "/#plans" },
    { label: "All Flowers", href: "/products" },
    { label: "About Us", href: "/about" },
    { label: "Check Pincode", href: "/#pincode-check", isPin: true },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full shadow-sm">
        {/* Subtle Solid Terracotta Accent Line */}
        <div className="h-1 w-full bg-[#D95326]" />

        {/* 1. SACRED DEVOTIONAL CROWN BAR (Warm Solid Charcoal #1C1917) */}
        <div className="bg-[#1C1917] px-3 py-1.5 text-stone-200 border-b border-stone-800">
          <div className="mx-auto flex max-w-7xl items-center justify-between text-[10px] sm:text-[11px]">
            <span className="hidden md:inline-flex items-center gap-1.5 text-stone-300 font-medium">
              <Sparkles className="h-3 w-3 text-[#D95326]" />
              <span>Delivery: 6:00 AM To 8:00 AM</span>
            </span>
            <p className="mx-auto md:mx-0 font-serif text-xs sm:text-sm font-bold tracking-[0.16em] text-[#F5D0A9]">
              {pathname === "/"
                ? "॥ जय जय रघुवीर समर्थ ॥"
                : "PALASSH • SACRED PUJA BLOOMS"}
            </p>
            <span className="hidden md:inline-flex items-center gap-1.5 text-stone-300 font-medium">
              <span>100% Farm-Fresh • 1-Day Harvest Buffer</span>
            </span>
          </div>
        </div>

        {/* 2. MAIN NAVBAR (Crisp White & Warm Beige Border — Zero Green) */}
        <div className="bg-white/95 border-b border-[#E6DEC8] backdrop-blur-xl">
          <div className="mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between px-3.5 sm:px-6 lg:px-8 gap-2">
            {/* Left: PALASSH Logo */}
            <Link
              href="/"
              className="flex items-center gap-2.5 sm:gap-3.5 group shrink-0"
            >
              <div className="relative flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl sm:rounded-2xl border border-[#E6DEC8] bg-[#FAF6F0] p-1 shadow-2xs">
                <img
                  src="/images/logo.webp"
                  alt="PALASSH"
                  width={48}
                  height={48}
                  decoding="async"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-lg sm:text-2xl font-bold tracking-[0.14em] leading-none text-[#C84617] drop-shadow-[0_0_8px_rgba(234,88,12,0.45)]">
                  PALASSH
                </span>
                <span className="mt-0.5 sm:mt-1 text-[10px] sm:text-[11px] italic text-[#D95326] font-serif whitespace-nowrap">
                  flowers that pray with you
                </span>
              </div>
            </Link>

            {/* Center: Desktop Navigation Links (Warm Beige Pill Container) */}
            <nav className="hidden xl:flex items-center gap-1 rounded-full border border-[#E6DEC8] bg-[#FAF6F0] p-1.5">
              {navLinks.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold whitespace-nowrap transition ${
                      isActive
                        ? "bg-[#D95326] text-white shadow-2xs"
                        : item.isPin
                        ? "text-[#D95326] hover:bg-[#F3ECE1]"
                        : "text-stone-700 hover:bg-[#F3ECE1] hover:text-stone-900"
                    }`}
                  >
                    {item.isPin && (
                      <MapPin className="h-3.5 w-3.5 text-[#D95326]" />
                    )}
                    {item.href === "/products" && (
                      <Flower2 className="h-3.5 w-3.5 text-[#D95326]" />
                    )}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right: Cart Button + Account/Orders */}
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/account"
                className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-[#E6DEC8] bg-[#FAF6F0] px-3.5 py-2 text-xs font-bold text-stone-800 hover:border-[#D95326] hover:text-[#D95326] whitespace-nowrap transition"
              >
                <User className="h-3.5 w-3.5 text-[#D95326]" />
                <span>My Account</span>
              </Link>

              <Link
                href="/my-orders"
                className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-[#E6DEC8] bg-[#FAF6F0] px-3.5 py-2 text-xs font-bold text-stone-800 hover:border-[#D95326] hover:text-[#D95326] whitespace-nowrap transition"
              >
                <Calendar className="h-3.5 w-3.5 text-[#D95326]" />
                <span>My Orders</span>
              </Link>

              {/* Solid Terracotta Cart Button */}
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-[#D95326] hover:bg-[#BA421B] px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs font-bold text-white shadow-xs transition cursor-pointer whitespace-nowrap"
              >
                <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                <span>Cart</span>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white">
                  {totalCartItems > 0 ? `${totalCartGrams}g` : "0"}
                </span>
              </button>

              {/* Mobile Hamburger Trigger */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="rounded-xl border border-[#E6DEC8] bg-[#FAF6F0] p-2 text-stone-800 xl:hidden hover:bg-[#F3ECE1] cursor-pointer"
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu Drawer */}
          {mobileMenuOpen && (
            <div className="border-t border-[#E6DEC8] bg-[#FAF6F0] px-4 pt-3 pb-5 xl:hidden space-y-2 text-stone-800">
              <div className="grid grid-cols-2 gap-2 pb-2 border-b border-[#E6DEC8]">
                <Link
                  href="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-[#E6DEC8] bg-white py-2.5 text-xs font-bold text-stone-900"
                >
                  <User className="h-3.5 w-3.5 text-[#D95326]" />
                  <span>My Account</span>
                </Link>
                <Link
                  href="/my-orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-[#D95326] py-2.5 text-xs font-bold text-white shadow-2xs"
                >
                  <Calendar className="h-3.5 w-3.5 text-white" />
                  <span>My Orders</span>
                </Link>
              </div>
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-xl px-3.5 py-2.5 text-sm font-semibold hover:bg-[#F3ECE1]"
              >
                Home
              </Link>
              <Link
                href="/#plans"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-xl bg-white border border-[#E6DEC8] px-3.5 py-2.5 text-sm font-bold text-[#D95326]"
              >
                {(() => {
                  const oneDayPrice =
                    plans.find((p) => p.id === "plan-daily")?.price || 45;
                  const weeklyPrice =
                    plans.find((p) => p.id === "plan-weekly")?.price || 299;
                  const monthlyPrice = (
                    plans.find((p) => p.id === "plan-monthly")?.price || 1249
                  ).toLocaleString("en-IN");
                  return `Subscriptions (From ₹${oneDayPrice} / ₹${weeklyPrice} / ₹${monthlyPrice})`;
                })()}
              </Link>
              <Link
                href="/products"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-xl px-3.5 py-2.5 text-sm font-semibold hover:bg-[#F3ECE1]"
              >
                Member Flower Store (/products)
              </Link>
              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-xl px-3.5 py-2.5 text-sm font-semibold hover:bg-[#F3ECE1]"
              >
                About Us & Story
              </Link>
              <Link
                href="/#pincode-check"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#D95326] hover:bg-[#F3ECE1]"
              >
                Verify Thane Pincode (400601–400608)
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* GLOBAL SLIDE-OVER CART DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs">
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-8 sm:pl-10">
            <div className="w-screen max-w-md bg-white p-5 sm:p-7 shadow-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-stone-200 pb-4">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-[#D95326]" />
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

                <div className="mt-4 rounded-2xl border border-[#E6DEC8] bg-[#FAF6F0] p-3.5 text-xs text-stone-800 space-y-1">
                  <p className="font-bold flex items-center justify-between text-stone-900">
                    <span>Member Status: {customerTier}</span>
                    <span>Basket Weight: {totalCartGrams}g</span>
                  </p>
                  <p className="text-[11px] text-stone-600">
                    {customerTier !== "WEEKLY" && customerTier !== "MONTHLY"
                     ? "Weekly & Monthly Subscribers Only: Subscribe to a Weekly or Monthly Plan to unlock 100g/150g loose flower Add-Ons."
                     : `Active Subscriber (${customerTier}): You are eligible for daily 100g/150g loose flower Add-Ons.`}
                  </p>
                </div>

                {cart.length === 0 ? (
                  <div className="py-16 text-center space-y-3">
                    <ShoppingBag className="mx-auto h-11 w-11 text-stone-300" />
                    <p className="text-sm font-medium text-stone-600">
                      Your flower basket is currently empty.
                    </p>
                    <Link
                      href="/#plans"
                      onClick={() => setIsCartOpen(false)}
                      className="inline-block rounded-full bg-[#D95326] hover:bg-[#BA421B] px-6 py-2.5 text-xs font-bold text-white shadow-xs transition"
                    >
                      Explore Subscription Plans
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
                            width={48}
                            height={48}
                            loading="lazy"
                            decoding="async"
                            className="h-12 w-12 rounded-xl object-cover border border-stone-200 shrink-0"
                          />
                          <div>
                            <h4 className="font-serif text-sm font-bold text-stone-900">
                              {item.flowerName}{" "}
                              {item.marathiName && (
                                <span className="text-stone-500 text-xs font-normal">
                                  ({item.marathiName})
                                </span>
                              )}
                            </h4>
                            <span className="inline-block rounded-md bg-[#FAF6F0] border border-[#E6DEC8] px-2 py-0.5 text-[11px] font-bold text-[#D95326] mt-0.5">
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
                <div className="border-t border-stone-200 pt-4 space-y-3.5">
                  <div className="flex items-center justify-between text-base font-bold text-stone-900">
                    <span>Total Payable ({totalCartGrams}g):</span>
                    <span className="font-serif text-2xl text-[#D95326]">
                      ₹{totalCartAmount.toLocaleString("en-IN")}
                    </span>
                  </div>
                  {customerTier !== "WEEKLY" && customerTier !== "MONTHLY" ? (
                    <div className="space-y-2">
                      <div className="rounded-xl border border-[#E6DEC8] bg-[#FFF3EC] p-3 text-xs text-stone-800">
                        <p className="font-bold flex items-center gap-1.5 text-[#D95326]">
                          <Lock className="h-3.5 w-3.5 shrink-0" />
                          <span>Plan Members Only</span>
                        </p>
                        <p className="mt-1 text-[11px] text-stone-600">
                          Only customers who have purchased a 1 Day, Weekly, or
                          Monthly Plan can buy loose flowers.
                        </p>
                      </div>
                      <Link
                        href="/#plans"
                        onClick={() => setIsCartOpen(false)}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#D95326] hover:bg-[#BA421B] py-4 text-sm font-bold text-white shadow-sm cursor-pointer transition"
                      >
                        <Lock className="h-4 w-4" />
                        <span>Choose a Plan First</span>
                      </Link>
                    </div>
                  ) : (
                    <Link
                      href="/checkout?mode=onetime"
                      onClick={() => setIsCartOpen(false)}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 hover:bg-[#D95326] py-4 text-sm font-bold text-white shadow-sm cursor-pointer transition"
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