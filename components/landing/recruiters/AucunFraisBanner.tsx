"use client";

import { Check } from "lucide-react";

export function AucunFraisBanner() {
  return (
    <section style={{ background: "linear-gradient(90deg, #103826 0%, #082E1E 100%)" }}>
      <div className="max-w-6xl mx-auto px-6 py-5">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-center">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(228,177,24,0.2)" }}>
              <Check size={11} style={{ color: "#E4B118" }} strokeWidth={3} />
            </div>
            <span className="text-sm font-semibold" style={{ color: "#FFFDF8" }}>
              <span style={{ color: "#E4B118" }}>0€</span> de droit d&apos;entrée
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(228,177,24,0.2)" }}>
              <Check size={11} style={{ color: "#E4B118" }} strokeWidth={3} />
            </div>
            <span className="text-sm font-semibold" style={{ color: "#FFFDF8" }}>
              <span style={{ color: "#E4B118" }}>0%</span> de royalties sur vos placements
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(228,177,24,0.2)" }}>
              <Check size={11} style={{ color: "#E4B118" }} strokeWidth={3} />
            </div>
            <span className="text-sm font-semibold" style={{ color: "#FFFDF8" }}>
              Sans engagement, mensuel
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(228,177,24,0.2)" }}>
              <Check size={11} style={{ color: "#E4B118" }} strokeWidth={3} />
            </div>
            <span className="text-sm font-semibold" style={{ color: "#FFFDF8" }}>
              Vous restez 100% chez vous
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
