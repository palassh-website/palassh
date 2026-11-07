"use client";

import React from "react";
import { usePathname } from "next/navigation";

export function WhatsAppFloatingButton() {
  const pathname = usePathname();

  // Do not show inside admin management pages
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const phoneNumber = "7710942605";
  const defaultMessage = encodeURIComponent(
    "Hello PALASSH, I Vistied Your website and i need your help about :"
  );
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${defaultMessage}`;

  return (
    <aside
      aria-label="WhatsApp Support"
      className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 flex items-center gap-2.5"
    >
      {/* Interactive Tooltip on Desktop Hover */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-stone-900/90 backdrop-blur-md px-3.5 py-1.5 text-xs font-semibold text-white shadow-xl border border-white/10 opacity-0 -translate-x-2 transition-all duration-300 hover:opacity-100 hover:translate-x-0 peer-hover:opacity-100 peer-hover:translate-x-0 cursor-pointer pointer-events-auto"
      >
        <span>Chat on WhatsApp</span>
        <span className="text-[10px] text-emerald-400 font-bold">• Online</span>
      </a>

      {/* Floating Action Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with PALASSH on WhatsApp (+917710942605)"
        className="peer group relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-gradient-to-tr from-[#1EBE5D] via-[#25D366] to-[#2BE873] text-white shadow-[0_10px_25px_-5px_rgba(37,211,102,0.55)] transition-all duration-300 hover:scale-110 active:scale-95 border-2 border-white/30 cursor-pointer"
      >
        {/* Subtle breathing radar ring */}
        <span className="absolute -inset-1 rounded-full bg-[#25D366] opacity-30 blur-xs group-hover:opacity-50 transition-opacity animate-pulse pointer-events-none" />

        {/* WhatsApp Official Vector Glyph */}
        <svg
          className="relative h-7 w-7 sm:h-8 sm:w-8 fill-current drop-shadow-md"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </aside>
  );
}

