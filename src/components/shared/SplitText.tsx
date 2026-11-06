"use client";

import React, { useEffect, useRef, useState } from "react";

interface SplitTextProps {
  text: string;
  as?: "h1" | "h2" | "h3" | "span" | "p" | "div";
  mode?: "words" | "chars";
  /** ms between each word */
  stagger?: number;
  /** ms before the first word */
  delay?: number;
  className?: string;
  /** Force-play immediately (hero). Omit to auto-play on scroll. */
  play?: boolean;
}

export function SplitText({
  text,
  as = "span",
  mode = "words",
  stagger = 60,
  delay = 0,
  className = "",
  play,
}: SplitTextProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (play !== undefined) return; // externally controlled
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);

    return () => {
      io.disconnect();
    };
  }, [play]);

  const isPlaying = play !== undefined ? play : inView;
  const Tag = as as unknown as React.ComponentType<any>;
  const words = text.split(" ");
  let index = 0;
  // aria-label is only valid on elements with a role (headings here); on a
  // plain span/p/div it is ignored, so hiding the split words there would
  // make the text disappear for screen readers.
  const isHeading = as === "h1" || as === "h2" || as === "h3";

  return (
    <Tag
      ref={ref}
      aria-label={isHeading ? text : undefined}
      data-play={isPlaying ? "true" : "false"}
      className={`split-root ${className}`}
      style={
        {
          "--split-stagger": `${stagger}ms`,
          "--split-delay": `${delay}ms`,
        } as React.CSSProperties
      }
    >
      <span aria-hidden={isHeading ? true : undefined}>
        {words.map((word, wi) => (
          <React.Fragment key={`${word}-${wi}`}>
            {mode === "chars" ? (
              <span className="split-chunk">
                {word.split("").map((ch, ci) => (
                  <span key={ci} className="split-word">
                    <span style={{ "--i": index++ } as React.CSSProperties}>
                      {ch}
                    </span>
                  </span>
                ))}
              </span>
            ) : (
              <span className="split-word">
                <span style={{ "--i": index++ } as React.CSSProperties}>
                  {word}
                </span>
              </span>
            )}
            {wi < words.length - 1 ? " " : null}
          </React.Fragment>
        ))}
      </span>
    </Tag>
  );
}
