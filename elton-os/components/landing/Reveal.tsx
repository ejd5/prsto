"use client";

import { useEffect, useRef, useState, type ReactNode, type ElementType } from "react";

type RevealProps = {
  children: ReactNode;
  /** Delay before the animation starts, in ms */
  delay?: number;
  /** Animation direction / variant */
  variant?: "up" | "down" | "left" | "right" | "fade" | "scale";
  /** Element tag to render */
  as?: ElementType;
  className?: string;
  /** Trigger only once (default true) */
  once?: boolean;
};

const VARIANTS: Record<NonNullable<RevealProps["variant"]>, string> = {
  up: "translateY(28px)",
  down: "translateY(-28px)",
  left: "translateX(28px)",
  right: "translateX(-28px)",
  fade: "translateY(0)",
  scale: "scale(0.96)",
};

export default function Reveal({
  children,
  delay = 0,
  variant = "up",
  as: Tag = "div",
  className,
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced-motion preference — show immediately
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }

    // If the element is ALREADY in the viewport on mount (hero section case),
    // show it immediately without waiting for observer
    const rect = el.getBoundingClientRect();
    const viewportH = window.innerHeight;
    if (rect.top < viewportH && rect.bottom > 0) {
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }

    // Fallback: force visible after 1500ms even if observer never fires
    const fallbackTimer = setTimeout(() => setVisible(true), 1500);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) observer.disconnect();
          } else if (!once) {
            setVisible(false);
          }
        });
      },
      { threshold: 0.05, rootMargin: "0px 0px -8% 0px" }
    );

    observer.observe(el);
    return () => {
      clearTimeout(fallbackTimer);
      observer.disconnect();
    };
  }, [once]);

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : VARIANTS[variant],
        transition: `opacity 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </Tag>
  );
}
