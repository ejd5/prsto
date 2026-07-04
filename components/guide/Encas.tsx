"use client";

import { type ReactNode } from "react";

type EncasProps = {
  variant?: "tip" | "warning" | "info" | "stat" | "chiffre" | "pratique" | "piege" | "gold" | "success";
  title?: string;
  children: ReactNode;
  big?: string;
  label?: string;
};

const VARIANT_STYLES: Record<NonNullable<EncasProps["variant"]>, { border: string; bg: string; text: string; icon: string }> = {
  tip: {
    border: "#6A8F6D",
    bg: "rgba(106,143,109,0.08)",
    text: "#103826",
    icon: "💡",
  },
  warning: {
    border: "#b91c1c",
    bg: "rgba(185,28,28,0.06)",
    text: "#7f1d1d",
    icon: "⚠",
  },
  info: {
    border: "#2563eb",
    bg: "rgba(37,99,235,0.06)",
    text: "#1e3a8a",
    icon: "ℹ",
  },
  stat: {
    border: "#E4B118",
    bg: "rgba(228,177,24,0.08)",
    text: "#A38010",
    icon: "★",
  },
  chiffre: {
    border: "#E4B118",
    bg: "rgba(228,177,24,0.10)",
    text: "#A38010",
    icon: "#",
  },
  pratique: {
    border: "#103826",
    bg: "rgba(16,56,38,0.05)",
    text: "#103826",
    icon: "✓",
  },
  piege: {
    border: "#dc2626",
    bg: "rgba(220,38,38,0.06)",
    text: "#7f1d1d",
    icon: "✗",
  },
  gold: {
    border: "#E4B118",
    bg: "linear-gradient(135deg, rgba(228,177,24,0.10), rgba(228,177,24,0.04))",
    text: "#A38010",
    icon: "★",
  },
  success: {
    border: "#103826",
    bg: "rgba(16,56,38,0.06)",
    text: "#103826",
    icon: "✓",
  },
};

const VARIANT_TITLES: Record<NonNullable<EncasProps["variant"]>, string> = {
  tip: "Astuce",
  warning: "Attention",
  info: "À savoir",
  stat: "Chiffre clé",
  chiffre: "Chiffre clé",
  pratique: "En pratique",
  piege: "Piège à éviter",
  gold: "Bon à savoir",
  success: "Conseil pratique",
};

export default function Encas({ variant = "tip", title, children, big, label }: EncasProps) {
  const style = VARIANT_STYLES[variant];
  const finalTitle = title ?? VARIANT_TITLES[variant];

  if (variant === "chiffre" || variant === "stat") {
    return (
      <div
        className="my-6 rounded-xl border p-6 flex items-center gap-5"
        style={{
          borderColor: style.border,
          background: style.bg,
          borderLeftWidth: "4px",
        }}
      >
        <div
          className="text-5xl font-black flex-shrink-0"
          style={{ color: style.text, fontFamily: "Playfair Display, serif" }}
        >
          {big}
        </div>
        <div className="flex-1">
          {label && (
            <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: style.text }}>
              {label}
            </div>
          )}
          <div className="text-sm leading-relaxed" style={{ color: "#0B1F18" }}>
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="my-5 rounded-lg p-4"
      style={{
        borderLeft: `3px solid ${style.border}`,
        background: style.bg,
        borderTop: "1px solid rgba(0,0,0,0.04)",
        borderRight: "1px solid rgba(0,0,0,0.04)",
        borderBottom: "1px solid rgba(0,0,0,0.04)",
        borderRadius: "0 8px 8px 0",
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base" style={{ color: style.text }}>{style.icon}</span>
        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: style.text }}>
          {finalTitle}
        </span>
      </div>
      <div className="text-sm leading-relaxed" style={{ color: "#0B1F18" }}>
        {children}
      </div>
    </div>
  );
}
