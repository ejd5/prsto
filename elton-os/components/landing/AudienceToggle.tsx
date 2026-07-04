"use client";

import { useState } from "react";
import Link from "next/link";
import { Crown, Building2, X, ArrowRight } from "lucide-react";

/**
 * AudienceToggle — bandeau supérieur style LHH
 * ============================================
 * Affiché tout en haut de la home page. Permet au visiteur de choisir
 * son espace : Cadre Dirigeant (page actuelle) ou Entreprise (redirige).
 *
 * Inspiré du site LHH qui propose 3 espaces dans la top nav.
 * PRSTO en propose 2 (Cadre Dirigeant par défaut + Entreprise).
 *
 * Dismissible — si le user clique sur X, le bandeau disparaît (localStorage).
 */
export function AudienceToggle() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      className="sticky top-0 z-50 w-full"
      style={{
        background: "linear-gradient(135deg, #082E1E 0%, #103826 100%)",
        borderBottom: "1px solid rgba(228,177,24,0.2)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Left: prompt */}
        <div className="flex items-center gap-2 text-xs md:text-sm flex-1 min-w-0">
          <span
            className="hidden sm:inline-flex font-mono uppercase tracking-wide"
            style={{ color: "#F2C94C" }}
          >
            Votre espace :
          </span>
        </div>

        {/* Center: 2 buttons */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Cadre Dirigeant — current page */}
          <div
            className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold"
            style={{
              background: "rgba(228,177,24,0.15)",
              border: "1px solid rgba(228,177,24,0.4)",
              color: "#F2C94C",
            }}
          >
            <Crown size={13} />
            <span className="hidden sm:inline">Cadre Dirigeant</span>
            <span className="sm:hidden">Cadre</span>
            <span
              className="hidden md:inline text-[10px] font-mono opacity-60 ml-1"
              style={{ color: "#F2C94C" }}
            >
              (vous y êtes)
            </span>
          </div>

          {/* Entreprise — link to /prsto/enterprise */}
          <Link
            href="/prsto/enterprise"
            className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all hover:scale-105"
            style={{
              background: "transparent",
              border: "1px solid rgba(250,246,239,0.3)",
              color: "#FAF6EF",
            }}
          >
            <Building2 size={13} />
            <span className="hidden sm:inline">Entreprise</span>
            <span className="sm:hidden">Ent.</span>
            <ArrowRight size={11} className="hidden sm:inline" />
          </Link>
        </div>

        {/* Right: dismiss */}
        <button
          onClick={() => setDismissed(true)}
          className="ml-2 p-1 rounded-full transition-colors hover:bg-white/10"
          style={{ color: "rgba(250,246,239,0.5)" }}
          aria-label="Fermer"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
