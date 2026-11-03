"use client";
import React, { useEffect, useRef, useState } from "react";

export function CountUp({
  end,
  duration = 1600,
  suffix = "",
  decimals = 0,
}: {
  end: number;
  duration?: number;
  suffix?: string;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [val, setVal] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let rafId: number | null = null;
    let isMounted = true;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          if (!isMounted) return;
          const p = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 4);
          setVal(end * eased);
          if (p < 1) {
            rafId = requestAnimationFrame(tick);
          } else {
            setVal(end);
          }
        };
        rafId = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      isMounted = false;
      if (rafId) cancelAnimationFrame(rafId);
      io.disconnect();
    };
  }, [end, duration]);

  return (
    <span ref={ref}>
      {val.toFixed(decimals)}
      {suffix}
    </span>
  );
}

