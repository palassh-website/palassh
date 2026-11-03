"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Truck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { checkPincodeAvailability, PincodeZone } from "../pincode.service";
import { logger } from "@/lib/logger";

export function PincodeBox() {
  const [pincode, setPincode] = useState("");
  const [status, setStatus] = useState<{
    checked: boolean;
    serviceable: boolean;
    message: string;
    zone?: PincodeZone;
  }>({ checked: false, serviceable: false, message: "" });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("palassh_verified_pincode");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.pincode) {
          const check = checkPincodeAvailability(parsed.pincode);
          if (check.serviceable && check.zone) {
            setPincode(check.zone.pincode);
            setStatus({
              checked: true,
              serviceable: true,
              message: `Delivering to ${check.zone.area} (${check.zone.deliverySlot})`,
              zone: check.zone,
            });
          } else {
            localStorage.removeItem("palassh_verified_pincode");
          }
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  const runValidation = (code: string) => {
    const res = checkPincodeAvailability(code);
    setStatus({
      checked: true,
      serviceable: res.serviceable,
      message: res.message,
      zone: res.zone,
    });

    logger.info({
      module: "PINCODE",
      action: "PINCODE_CHECKED",
      message: `Checked ${code} -> ${res.serviceable}`,
    });

    if (res.serviceable && res.zone) {
      try {
        localStorage.setItem(
          "palassh_verified_pincode",
          JSON.stringify(res.zone)
        );
      } catch {
        // Ignore
      }
    }
  };

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    runValidation(pincode);
  };

  return (
    <section
      id="pincode-check"
      className="relative z-20 mx-auto max-w-6xl px-3.5 sm:px-6"
    >
      <div className="overflow-hidden rounded-3xl sm:rounded-[2rem] border border-[#E6DEC8] bg-white shadow-lg shadow-stone-900/5">
        {/* Top Warm Sand Beige Status Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-[#F3ECE1] px-4 sm:px-6 py-2.5 sm:py-3 text-[11px] sm:text-xs text-stone-800 border-b border-[#E6DEC8]">
          <div className="flex items-center gap-2 font-medium">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#D95326]" />
            </span>
            <span>
              Serviceable Thane Zones:{" "}
              <strong className="text-[#D95326]">
                Pincodes 400601 to 400608
              </strong>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-stone-600">
            <span className="inline-flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-[#D95326]" /> 6:00 AM – 8:00 AM
              Drop
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-[#D95326]" /> Silent
              Bell-Free Hang
            </span>
          </div>
        </div>

        {/* Main Concierge Body */}
        <div className="p-5 sm:p-8 lg:p-10 bg-white">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-5 space-y-1.5">
              <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[#D95326]">
                <Sparkles className="h-3.5 w-3.5 text-[#D95326]" />
                <span>6:00 AM – 8:00 AM Route Check</span>
              </div>
              <h2 className="font-serif text-xl sm:text-3xl font-bold text-stone-900 leading-tight">
                Verify Delivery in Your Society
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Serving Thane pincodes{" "}
                <strong className="text-stone-800">400601 – 400608</strong>.
                Enter your pincode to lock your morning slot.
              </p>
            </div>

            <div className="lg:col-span-7 space-y-3.5">
              <form
                onSubmit={handleCheck}
                className="flex flex-col sm:flex-row gap-2.5 sm:gap-3"
              >
                <div className="relative flex-1">
                  <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2 text-[#D95326]" />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) =>
                      setPincode(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="Enter Pincode (400601 - 400608)"
                    className="w-full rounded-2xl border border-[#E6DEC8] bg-[#FAF6F0] py-3.5 sm:py-4 pl-11 sm:pl-12 pr-4 text-sm font-bold tracking-wide text-stone-900 placeholder:font-normal placeholder:text-stone-400 focus:border-[#D95326] focus:bg-white focus:outline-none transition"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#D95326] hover:bg-[#BA421B] px-7 py-3.5 sm:py-4 text-sm font-bold text-white shadow-sm transition cursor-pointer shrink-0"
                >
                  <span>Verify Pincode</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mr-1">
                  Tap Zone:
                </span>
                {[
                  { label: "Thane West (400601)", code: "400601" },
                  { label: "Naupada (400602)", code: "400602" },
                  { label: "Kalwa Hub (400605)", code: "400605" },
                  { label: "Pokhran / Vartak (400606)", code: "400606" },
                  { label: "Ghodbunder (400607)", code: "400607" },
                  { label: "Balkum / Kolshet (400608)", code: "400608" },
                ].map((pill) => (
                  <button
                    key={pill.code}
                    type="button"
                    onClick={() => {
                      setPincode(pill.code);
                      runValidation(pill.code);
                    }}
                    className={`rounded-full border px-2.5 sm:px-3 py-1 text-[11px] font-medium transition cursor-pointer ${
                      pincode === pill.code
                        ? "border-[#D95326] bg-[#D95326] text-white font-semibold"
                        : "border-[#E6DEC8] bg-[#FAF6F0] text-stone-700 hover:border-[#D95326] hover:text-[#D95326]"
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {status.checked && (
            <div
              role="status"
              className={`animate-fade-lift-in transition-all duration-300 mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border p-4 text-xs sm:text-sm ${
                status.serviceable
                  ? "border-[#E6DEC8] bg-[#FFF3EC] text-stone-900"
                  : "border-rose-200 bg-rose-50/90 text-rose-950"
              }`}
            >
              <div className="flex items-start gap-2.5">
                {status.serviceable ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-[#D95326] mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
                )}
                <div>
                  <p className="font-bold">{status.message}</p>
                  {status.serviceable && (
                    <p className="mt-0.5 text-[11px] text-stone-600">
                      Route Verified • 1-Day Farm Harvest Buffer • Silent
                      Morning Doorstep Hang
                    </p>
                  )}
                </div>
              </div>
              {status.serviceable && (
                <a
                  href="#plans"
                  className="inline-flex items-center justify-center rounded-xl bg-[#D95326] hover:bg-[#BA421B] px-5 py-2.5 text-xs font-bold text-white transition shrink-0"
                >
                  Choose Plan →
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}