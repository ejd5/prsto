"use client";

import { type ReactNode, type ElementType } from "react";

type RevealProps = {
  children: ReactNode;
  delay?: number;
  variant?: "up" | "down" | "left" | "right" | "fade" | "scale";
  as?: ElementType;
  className?: string;
  once?: boolean;
};

// Simplified Reveal: always visible (no animation, no IntersectionObserver)
// This prevents content from being hidden when JS doesn't load properly
export default function Reveal({
  children,
  as: Tag = "div",
  className,
}: RevealProps) {
  return (
    <Tag className={className} style={{ opacity: 1, transform: "none" }}>
      {children}
    </Tag>
  );
}
