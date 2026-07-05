"use client";

import { useState } from "react";
import Link from "next/link";
import Reveal from "./Reveal";
import { BoltIcon } from "@/components/ui/CustomIcons";

type Period = "mois" | "an";

const PLANS = [
  {
    id: "solo",
    name: "Solo",
    desc: "Pour le recruteur indépendant",
    monthlyPrice: 99,
    yearlyPrice: 79,
    features: [
      "5 candidats actifs",
      "CV Formatter illimité",
      "Lettres de motivation",
      "ATS Scanner",
      "LinkedIn Optimizer",
      "Market Radar",
      "Brief entretien",
    ],
    cta: "Essayer Solo",
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    desc: "Pour le petit cabinet",
    monthlyPrice: 199,
    yearlyPrice: 169,
    features: [
      "25 candidats actifs",
      "Jusqu'à 3 utilisateurs",
      "Tout Solo +",
      "Templates d'équipe",
      "Marque blanche (logo)",
      "Lien privé candidat",
      "Support prioritaire",
    ],
    cta: "Essayer Pro",
    popular: true,
  },
  {
    id: "elite",
    name: "Elite",
    desc: "Pour le cabinet en croissance",
    monthlyPrice: 349,
    yearlyPrice: 299,
    features: [
      "100 candidats actifs",
      "Jusqu'à 10 utilisateurs",
      "Tout Pro +",
      "API accessible",
      "Export bulk",
      "Dashboard consolidé",
      "Account manager dédié",
    ],
    cta: "Essayer Elite",
    popular: false,
  },
];

export default function PricingRecruiter() {
  const [period, setPeriod] = useState<Period>("mois");

  return (
    <section id="tarifs" className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-1/3 w-96 h-96 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(228,177,24,0.04), transparent 65%)", filter: "blur(60px)" }} />
      </div>
      <div className="max-w-6xl mx-auto px-6 relative" style={{ zIndex: 1 }}>
        <Reveal variant="up" className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-[11px] font-semibold tracking-wide mb-6 backdrop-blur-sm" style={{
            borderColor: "rgba(228,177,24,0.15)",
            color: "#A38010",
            background: "rgba(228,177,24,0.06)",
          }}>
            ✦ Tarifs
          </div>
          <h2 className="font-serif text-[clamp(1.8rem,3.5vw,2.8rem)] font-bold tracking-[-0.04em] leading-[1.08] mb-4" style={{ color: "#0B1F18" }}>
            Investissez dans vos <span style={{ color: "#E4B118" }}>placements</span>
          </h2>
          <p className="text-sm max-w-lg mx-auto" style={{ color: "#6A8F6D" }}>
            1 placement en plus par an = PRSTO rentable 20x. Résiliez à tout moment.
          </p>
        </Reveal>

        {/* Toggle monthly/yearly */}
        <Reveal variant="up" className="flex justify-center mb-12">
          <div className="inline-flex rounded-2xl p-1.5 backdrop-blur-sm" style={{
            border: "1px solid rgba(16,56,38,0.06)",
            background: "rgba(255,253,248,0.5)",
          }}>
            <button
              onClick={() => setPeriod("mois")}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300"
              style={{
                background: period === "mois" ? "#103826" : "transparent",
                color: period === "mois" ? "#FFFDF8" : "#50625A",
                boxShadow: period === "mois" ? "0 4px 12px rgba(16,56,38,0.2)" : "none",
              }}
            >
              Mensuel
            </button>
            <button
              onClick={() => setPeriod("an")}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300"
              style={{
                background: period === "an" ? "#103826" : "transparent",
                color: period === "an" ? "#FFFDF8" : "#50625A",
                boxShadow: period === "an" ? "0 4px 12px rgba(16,56,38,0.2)" : "none",
              }}
            >
              Annuel
              <span className="ml-1.5 text-[10px] font-bold" style={{ color: period === "an" ? "#E4B118" : "#6A8F6D" }}>−20%</span>
            </button>
          </div>
        </Reveal>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto items-start">
          {PLANS.map((plan, i) => {
            const price = period === "mois" ? plan.monthlyPrice : plan.yearlyPrice;
            return (
              <Reveal variant="up" delay={i * 90} key={plan.id}>
                <div
                  className={`group relative rounded-3xl p-8 flex flex-col h-full transition-all duration-500 hover:-translate-y-1 backdrop-blur-sm ${
                    plan.popular ? "shadow-xl" : ""
                  }`}
                  style={{
                    border: plan.popular
                      ? "1px solid rgba(228,177,24,0.2)"
                      : "1px solid rgba(16,56,38,0.06)",
                    background: plan.popular
                      ? "rgba(255,253,248,0.7)"
                      : "rgba(255,253,248,0.45)",
                    boxShadow: plan.popular
                      ? "0 20px 60px rgba(228,177,24,0.12)"
                      : "0 4px 20px rgba(16,56,38,0.02)",
                  }}
                >
                  {/* Luminous border for popular */}
                  {plan.popular && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                      style={{
                        background: "radial-gradient(300px circle at var(--mx, 50%) var(--my, 50%), rgba(228,177,24,0.15), transparent 65%)",
                        WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                        WebkitMaskComposite: "xor",
                        maskComposite: "exclude",
                        padding: 1,
                      }}
                    />
                  )}

                  {plan.popular && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-bold tracking-wide mb-4 w-fit" style={{
                        background: "rgba(228,177,24,0.1)",
                        border: "1px solid rgba(228,177,24,0.15)",
                        color: "#A38010",
                      }}>
                        <BoltIcon size={12} style={{ color: "#E4B118" }} /> Le plus populaire
                      </div>
                  )}

                  <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: plan.popular ? "#A38010" : "#6A8F6D" }}>
                    {plan.name}
                  </div>
                  <p className="text-xs mb-5" style={{ color: "#6A8F6D" }}>{plan.desc}</p>

                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-5xl font-extrabold tracking-[-0.04em]" style={{ color: "#0B1F18", fontFamily: "Playfair Display, serif" }}>
                      {price}$
                    </span>
                    <span className="text-sm" style={{ color: "#6A8F6D" }}>/mois</span>
                  </div>

                  {period === "an" && (
                    <div className="text-[11px] font-medium mb-4" style={{ color: "#103826" }}>
                      Soit {(price * 12).toFixed(0)}$/an — économisez {((plan.monthlyPrice - price) * 12).toFixed(0)}$
                    </div>
                  )}
                  {period === "mois" && <div className="mb-4" />}

                  <div className="h-px mb-6" style={{ background: "rgba(16,56,38,0.06)" }} />

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-3 text-sm" style={{ color: "#50625A" }}>
                        <span className="w-[18px] h-[18px] rounded-lg flex items-center justify-center flex-shrink-0 text-[8px] font-bold" style={{
                          background: "rgba(16,56,38,0.08)",
                          border: "1px solid rgba(16,56,38,0.1)",
                          color: "#103826",
                        }}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/recruiter/dashboard"
                    className={`block text-center py-3.5 px-6 rounded-xl text-sm font-bold transition-all duration-300 hover:-translate-y-0.5 ${
                      plan.popular ? "hover:shadow-lg" : ""
                    }`}
                    style={{
                      background: plan.popular ? "#E4B118" : "rgba(16,56,38,0.06)",
                      color: plan.popular ? "#082E1E" : "#103826",
                      border: plan.popular ? "none" : "1px solid rgba(16,56,38,0.08)",
                      textDecoration: "none",
                    }}
                  >
                    {plan.cta} →
                  </Link>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Enterprise note */}
        <Reveal variant="up" delay={90}>
          <div className="max-w-5xl mx-auto mt-6 rounded-2xl p-6 text-center backdrop-blur-sm" style={{
            border: "1px solid rgba(16,56,38,0.04)",
            background: "rgba(255,253,248,0.3)",
          }}>
            <p className="text-sm" style={{ color: "#50625A" }}>
              <strong style={{ color: "#0B1F18" }}>Vous êtes un grand cabinet ou un réseau ?</strong>{" "}
              Nous avons des offres sur mesure avec candidats illimités, API dédiée et support prioritaire.
            </p>
            <a href="/contact" className="inline-block mt-3 text-sm font-bold transition-colors hover:text-[#A38010]" style={{ color: "#103826" }}>
              Contactez-nous →
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
