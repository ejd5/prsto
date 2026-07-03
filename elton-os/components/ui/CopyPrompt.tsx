"use client";

import { useState, useCallback } from "react";

export default function CopyPrompt({ prompt, compact }: { prompt: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = prompt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  }, [prompt]);

  if (compact) {
    return (
      <button
        onClick={copy}
        className="inline-flex items-center gap-1.5 text-[9px] font-medium px-2 py-1 rounded-full backdrop-blur-sm cursor-pointer transition-all duration-300 hover:scale-105 whitespace-nowrap"
        style={{
          background: copied ? "rgba(22,163,74,0.1)" : "rgba(228,177,24,0.08)",
          color: copied ? "#16A34A" : "#A38010",
          border: `1px solid ${copied ? "rgba(22,163,74,0.15)" : "rgba(228,177,24,0.15)"}`,
        }}
        title="Cliquer pour copier le prompt"
      >
        {copied ? "✓ Copié" : "+ Prompt"}
      </button>
    );
  }

  return (
    <button
      onClick={copy}
      className="w-full h-full absolute inset-0 flex flex-col items-center justify-center gap-1.5 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
      title="Cliquer pour copier le prompt"
      style={{ zIndex: 5 }}
    >
      <p className="text-[10px] leading-relaxed max-w-[85%] text-center" style={{ color: "#50625A" }}>
        {prompt}
      </p>
      <span
        className="text-[9px] font-medium px-2.5 py-1.5 rounded-full backdrop-blur-sm transition-all duration-300"
        style={{
          background: copied ? "rgba(22,163,74,0.1)" : "rgba(228,177,24,0.08)",
          color: copied ? "#16A34A" : "#A38010",
          border: `1px solid ${copied ? "rgba(22,163,74,0.15)" : "rgba(228,177,24,0.15)"}`,
          boxShadow: copied ? "0 0 12px rgba(22,163,74,0.15)" : "none",
        }}
      >
        {copied ? "✓ Prompt copié !" : "📋 Cliquer pour générer cette image"}
      </span>
    </button>
  );
}
