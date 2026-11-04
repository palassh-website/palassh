"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  ShoppingBag,
  Zap,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const SLIDES = [
  {
    time: "8:00 PM",
    title: "Dispatch From Farms",
    subtitle: "1-Day Harvest Buffer",
    desc: "Hand-plucked by farmers at the coolest hour before dawn after your 1-day booking buffer. Zero cold storage, 100% natural dew.",
    icon: Sparkles,
  },
  {
    time: "4:00 AM",
    title: "Reaches Kalwa Hub",
    subtitle: "100g & 150g Pouches Sorted",
    desc: "Sorted flower-by-flower into exact 100 gms and 150 gms breathable pouches across all 7 sacred varieties.",
    icon: ShoppingBag,
  },
  {
    time: "6:00 AM",
    title: "Silent Dispatch",
    subtitle: "Riders On Route",
    desc: "Doorstep delivery riders leave across Thane pincodes 400601–400608 without a single doorbell ring.",
    icon: Zap,
  },
  {
    time: "8:00 AM",
    title: "Your Doorstep",
    subtitle: "Hung For Morning Aarti",
    desc: "Fresh, fragrant sacred blooms ready on your door handle before your morning home mandir puja starts.",
    icon: MapPin,
  },
];

export function MorningRitual() {
  const [activeIdx, setActiveIdx] = useState(0);
  const sectionRef = useRef<HTMLElement | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    let isThrottled = false;
    let accumulatedDelta = 0;
    let resetTimer: ReturnType<typeof setTimeout> | null = null;

    const handleWheel = (e: WheelEvent) => {
      const delta =
        Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;

      if (resetTimer) clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        accumulatedDelta = 0;
      }, 300);

      if (delta > 0) {
        if (activeIdx < SLIDES.length - 1) {
          e.preventDefault();
          accumulatedDelta += delta;
          if (!isThrottled && accumulatedDelta >= 80) {
            isThrottled = true;
            accumulatedDelta = 0;
            setActiveIdx((prev) => Math.min(prev + 1, SLIDES.length - 1));
            setTimeout(() => {
              isThrottled = false;
            }, 850);
          }
        }
      } else if (delta < 0) {
        if (activeIdx > 0) {
          e.preventDefault();
          accumulatedDelta += delta;
          if (!isThrottled && accumulatedDelta <= -80) {
            isThrottled = true;
            accumulatedDelta = 0;
            setActiveIdx((prev) => Math.max(prev - 1, 0));
            setTimeout(() => {
              isThrottled = false;
            }, 850);
          }
        }
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheel);
      if (resetTimer) clearTimeout(resetTimer);
    };
  }, [activeIdx]);

  const handlePrev = () => {
    setActiveIdx((prev) => Math.max(prev - 1, 0));
  };

  const handleNext = () => {
    setActiveIdx((prev) => Math.min(prev + 1, SLIDES.length - 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    if (deltaX < -40 && activeIdx < SLIDES.length - 1) {
      setActiveIdx((prev) => prev + 1);
    } else if (deltaX > 40 && activeIdx > 0) {
      setActiveIdx((prev) => prev - 1);
    }
    setTouchStartX(null);
  };

  return (
    <section
      ref={sectionRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full bg-[#F3ECE1] py-12 sm:py-16 border-y border-[#E6DEC8] text-stone-900 select-none"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 pb-6 border-b border-[#E6DEC8]">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#E6DEC8] bg-white px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-[#D95326]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Farm-To-Mandir Journey</span>
            </span>
            <span className="hidden sm:inline-block text-[11px] font-medium text-stone-500 uppercase tracking-wider">
              Scroll Or Tap To Scrub
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-stone-600">
              Stage <strong className="text-[#D95326]">{activeIdx + 1}</strong>{" "}
              of {SLIDES.length}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrev}
                disabled={activeIdx === 0}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E6DEC8] bg-white text-stone-800 hover:bg-[#D95326] hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                aria-label="Previous Milestone"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={activeIdx === SLIDES.length - 1}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E6DEC8] bg-white text-stone-800 hover:bg-[#D95326] hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                aria-label="Next Milestone"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden py-8 sm:py-10">
          <div
            className="flex will-change-transform"
            style={{
              transform: `translate3d(-${activeIdx * 100}%, 0, 0)`,
              transition: "transform 750ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            {SLIDES.map((s, i) => {
              const IconComp = s.icon;
              return (
                <div
                  key={i}
                  className="w-full shrink-0 flex flex-col items-center justify-center text-center px-4"
                >
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#D95326] border border-[#E6DEC8] shadow-sm">
                    <IconComp className="h-7 w-7" />
                  </div>
                  <div className="font-serif text-5xl sm:text-7xl lg:text-8xl font-bold text-[#D95326] tracking-tight leading-none mb-2">
                    {s.time}
                  </div>
                  <h3 className="font-serif text-2xl sm:text-4xl text-stone-900 font-bold">
                    {s.title}
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm font-semibold uppercase tracking-widest text-stone-500">
                    {s.subtitle}
                  </p>
                  <p className="mt-3 text-xs sm:text-base text-stone-600 max-w-lg leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-4 pb-2">
          <div className="max-w-2xl mx-auto relative px-4">
            <div className="absolute top-4 left-6 right-6 h-1 bg-[#E6DEC8] rounded-full" />
            <div
              className="absolute top-4 left-6 h-1 bg-[#D95326] rounded-full transition-all duration-750 ease-out"
              style={{
                width: `calc(${(activeIdx / (SLIDES.length - 1)) * 100
                  }% - 12px)`,
              }}
            />

            <div className="relative flex items-center justify-between z-10">
              {SLIDES.map((s, i) => {
                const isPassed = i <= activeIdx;
                const isCurrent = i === activeIdx;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveIdx(i)}
                    className="group flex flex-col items-center cursor-pointer transition focus:outline-none"
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300 ${isCurrent
                          ? "bg-[#D95326] border-[#D95326] text-white scale-110 shadow-sm font-bold text-xs"
                          : isPassed
                            ? "bg-stone-900 border-stone-900 text-white text-xs font-semibold"
                            : "bg-white border-[#E6DEC8] text-stone-400 text-xs"
                        }`}
                    >
                      {i + 1}
                    </div>
                    <span
                      className={`mt-2 text-[11px] sm:text-xs font-bold transition-colors ${isCurrent
                          ? "text-[#D95326]"
                          : isPassed
                            ? "text-stone-900"
                            : "text-stone-400"
                        }`}
                    >
                      {s.time}
                    </span>
                    <span className="hidden sm:block text-[10px] text-stone-500 truncate max-w-[90px]">
                      {s.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}