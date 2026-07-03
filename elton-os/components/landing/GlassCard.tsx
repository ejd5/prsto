"use client";

import { useRef, type ReactNode } from "react";

/**
 * Premium glass card with animated luminous border that follows the cursor,
 * spotlight glow, and elevation on hover. Drop-in replacement for a plain
 * bordered div on landing sections.
 */
export default function GlassCard({
  children,
  className,
  featured = false,
  style,
}: {
  children: ReactNode;
  className?: string;
  featured?: boolean;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    el.style.setProperty("--mx", `${x}px`);
    el.style.setProperty("--my", `${y}px`);
    el.style.setProperty("--bp", `${(x / rect.width) * 100}% ${(y / rect.height) * 100}%`);
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      className={`lp-glass-card lp-spotlight group relative rounded-2xl transition-all duration-300 hover:-translate-y-1 ${className ?? ""}`}
      style={{
        border: "1px solid rgba(16,56,38,0.06)",
        background: featured ? "rgba(228,177,24,0.05)" : "#FFFFFF",
        boxShadow: featured
          ? "0 20px 60px rgba(228,177,24,0.12)"
          : "0 10px 40px rgba(16,56,38,0.04)",
        ...style,
      }}
    >
      {/* Animated luminous border layer */}
      <div
        aria-hidden="true"
        className="lp-glass-border pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: featured
            ? "radial-gradient(260px circle at var(--bp), rgba(228,177,24,0.45), transparent 65%)"
            : "radial-gradient(260px circle at var(--bp), rgba(228,177,24,0.30), transparent 65%)",
          WebkitMask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          padding: 1,
        }}
      />
      <div className="relative" style={{ zIndex: 1 }}>{children}</div>
    </div>
  );
}
