"use client";

import { useUxMode } from "@/lib/ux-mode";

export default function UxModeToggle() {
  const { mode, toggle, isExpert } = useUxMode();

  return (
    <button
      onClick={toggle}
      aria-label={isExpert ? "Passer en mode simple" : "Passer en mode expert"}
      title={isExpert ? "Mode Expert — cliquer pour Mode Simple" : "Mode Simple — cliquer pour Mode Expert"}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
      style={{
        background: isExpert ? "rgba(200,166,78,0.15)" : "rgba(200,166,78,0.08)",
        border: `1px solid ${isExpert ? "rgba(200,166,78,0.4)" : "rgba(200,166,78,0.2)"}`,
        color: "var(--or)",
      }}
    >
      <span className="hidden sm:inline">{isExpert ? "🧠 Expert" : "🌱 Simple"}</span>
      <span className="sm:hidden">{isExpert ? "Exp" : "Sim"}</span>
    </button>
  );
}
