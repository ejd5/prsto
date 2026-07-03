"use client";

import { useEffect, useRef, useState } from "react";

type ImgSlotProps = {
  num: number;
  prompt: string;
  promptLong: string;
  className?: string;
  format?: "banner" | "square" | "vertical" | "wide";
};

const FORMAT_LABELS: Record<string, string> = {
  banner: "3:1 — 2400×800px",
  square: "1:1 — 1200×1200px",
  vertical: "3:4 — 1200×1600px",
  wide: "4:3 — 1600×1200px",
};

const FORMAT_CLASSES: Record<string, string> = {
  banner: "aspect-[3/1]",
  square: "aspect-square",
  vertical: "aspect-[3/4]",
  wide: "aspect-[4/3]",
};

export default function ImgSlot({ num, prompt, promptLong, className = "", format = "banner" }: ImgSlotProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  const imgRef = useRef<HTMLImageElement>(null);
  const src = `/recuperer/img-${String(num).padStart(2, "0")}.png`;

  useEffect(() => {
    const img = new Image();
    img.onload = () => setStatus("loaded");
    img.onerror = () => setStatus("error");
    img.src = src;
    return () => { img.onload = null; img.onerror = null; };
  }, [src]);

  return (
    <div
      className={`rounded-2xl overflow-hidden relative ${FORMAT_CLASSES[format]} ${className}`}
      style={{
        background: status === "loaded" ? "transparent" : "#0B1F18",
        border: status === "loaded" ? "none" : "1px solid rgba(228,177,24,0.15)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
      }}
    >
      {status === "loaded" && (
        <img
          ref={imgRef}
          src={src}
          alt={prompt}
          className="w-full h-full object-cover"
        />
      )}

      {status !== "loaded" && (
        <div className="absolute inset-0 flex flex-col p-4 overflow-y-auto">
          <div className="flex items-center gap-2 mb-2 flex-shrink-0">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{
                background: "rgba(228,177,24,0.15)",
                border: "1px solid rgba(228,177,24,0.2)",
                color: "#E4B118",
              }}
            >
              {num}
            </div>
            <span
              className="text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex-shrink-0"
              style={{
                background: "rgba(106,143,109,0.2)",
                color: "#6A8F6D",
                border: "1px solid rgba(106,143,109,0.15)",
              }}
            >
              {FORMAT_LABELS[format]}
            </span>
          </div>
          <p
            className="text-[10px] leading-snug font-medium mb-2 flex-shrink-0"
            style={{ color: "rgba(250,246,239,0.7)" }}
          >
            <span style={{ color: "#E4B118" }}>Prompt :</span> {prompt}
          </p>
          <p
            className="text-[8px] leading-relaxed whitespace-pre-wrap"
            style={{ color: "rgba(250,246,239,0.45)" }}
          >
            {promptLong}
          </p>
        </div>
      )}
    </div>
  );
}
