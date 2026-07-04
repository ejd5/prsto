"use client";

import { useState } from "react";
import Reveal from "../Reveal";
import Link from "next/link";
import ImgSlot from "../ImgSlot";

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
    partenaire: false,
  },
  {
    id: "pro",
    name: "Pro",
    name_partner: "Pro ★ Partenaire",
    desc: "Pour le petit cabinet",
    monthlyPrice: 199,
    yearlyPrice: 169,
    features: [
      "25 candidats actifs",
      "Jusqu'à 3 utilisateurs",
      "Tout Solo +",
      "Templates d'équipe",
      "Co-branding documents",
      "Lien privé candidat",
      "Statut Partenaire PRSTO éligible",
    ],
    cta: "Essayer Pro",
    popular: true,
    partenaire: true,
  },
  {
    id: "elite",
    name: "Elite ★ Partenaire",
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
      "Statut Partenaire PRSTO inclus",
      "Page dédiée sur prsto.io",
      "Account manager dédié",
    ],
    cta: "Essayer Elite",
    popular: false,
    partenaire: true,
  },
];

export function RecruitersPricing() {
  const [period, setPeriod] = useState<Period>("mois");

  return (
    <section id="tarifs" className="py-28 relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <ImgSlot
          num={19}
          format="banner"
          className="absolute inset-0 w-full h-full opacity-5"
          prompt="Fond décoratif pour section tarifs — formes géométriques, cercles, lignes. Tons dorés très légers sur fond transparent. Ambiance premium."
          promptLong="Bannière prix PRSTO. Minimaliste premium. Chiffre énorme 99$ en doré #E4B118 au centre sur fond #0B1F18 profonds. En dessous en tout petit 'par mois tout compris' en #6A8F6D. À gauche petite colonne fine 3 ticks sans texte (icônes check). À droite mention 'Annulation à tout moment' en gris très discret tout petit. Style Apple pricing page épuré luxueux silencieux."
        />
      </div>
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <Reveal variant="up" className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11.5px] font-semibold tracking-wide mb-5" style={{
            borderColor: "rgba(16,56,38,0.12)", color: "#103826",
            background: "rgba(16,56,38,0.06)",
          }}>
            ✦ Tarifs Recruteurs
          </div>
          <h2 className="font-serif text-[clamp(1.875rem,3.5vw,2.875rem)] font-bold tracking-[-0.04em] leading-[1.08] mb-3 text-[#0B1F18]">
            Investissez dans vos placements
          </h2>
          <p className="text-sm max-w-lg mx-auto" style={{ color: "#6A8F6D" }}>
            1 placement en plus par an = PRSTO rentable 20x. Résiliez à tout moment.
          </p>
        </Reveal>

        <Reveal variant="up" className="flex justify-center mb-10">
          <div className="inline-flex rounded-xl border p-1" style={{
            borderColor: "rgba(16,56,38,0.1)", background: "#FAF6EF",
          }}>
            <button
              onClick={() => setPeriod("mois")}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: period === "mois" ? "#103826" : "transparent",
                color: period === "mois" ? "#FFFDF8" : "#50625A",
              }}
            >
              Mensuel
            </button>
            <button
              onClick={() => setPeriod("an")}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: period === "an" ? "#103826" : "transparent",
                color: period === "an" ? "#FFFDF8" : "#50625A",
              }}
            >
              Annuel
              <span className="ml-1.5 text-[10px] font-bold" style={{ color: period === "an" ? "#E4B118" : "#6A8F6D" }}>−20%</span>
            </button>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto items-start">
          {PLANS.map((plan, i) => {
            const price = period === "mois" ? plan.monthlyPrice : plan.yearlyPrice;
            return (
              <Reveal variant="up" delay={i * 90} key={plan.id}>
                <div className={`relative rounded-3xl border p-8 flex flex-col h-full transition-all duration-300 hover:-translate-y-1 ${
                  plan.popular ? "shadow-lg" : "shadow-sm"
                }`} style={{
                  borderColor: plan.popular ? "rgba(228,177,24,0.25)" : "rgba(16,56,38,0.05)",
                  background: plan.popular ? "rgba(228,177,24,0.03)" : "#FFFFFF",
                  boxShadow: plan.popular ? "0 20px 60px rgba(228,177,24,0.1)" : undefined,
                }}>
                  {plan.popular && (
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9.5px] font-bold tracking-wide mb-3 w-fit" style={{
                      background: "rgba(228,177,24,0.1)", border: "1px solid rgba(228,177,24,0.15)", color: "#A38010",
                    }}>
                      ⚡ Le plus populaire
                    </div>
                  )}

                  <div className="text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-2" style={{
                    color: plan.popular ? "#A38010" : "#6A8F6D",
                  }}>
                    {plan.name}
                    {plan.partenaire && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold" style={{
                        background: "rgba(228,177,24,0.15)", color: "#A38010",
                        border: "1px solid rgba(228,177,24,0.25)",
                      }}>
                        ★ Partenaire
                      </span>
                    )}
                  </div>
                  <p className="text-xs mb-4" style={{ color: "#6A8F6D" }}>{plan.desc}</p>

                  <div className="text-5xl font-extrabold tracking-[-0.04em] mb-0.5 text-[#0B1F18]" style={{ fontFamily: "Playfair Display, serif" }}>
                    {price}$
                    <span className="text-sm font-normal align-baseline" style={{ color: "#6A8F6D" }}>
                      /{period === "mois" ? "mois" : "mois"}
                    </span>
                  </div>

                  {period === "an" && (
                    <div className="text-[11px] font-medium mb-4" style={{ color: "#103826" }}>
                      Soit {(price * 12).toFixed(0)}$/an — économisez {((plan.monthlyPrice - price) * 12).toFixed(0)}$
                    </div>
                  )}
                  {period === "mois" && <div className="mb-4" />}

                  <div className="h-px mb-6" style={{ background: "rgba(16,56,38,0.06)" }} />
                  <ul className="space-y-2.5 mb-7 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: "#50625A" }}>
                        <span className="w-[18px] h-[18px] rounded-md flex items-center justify-center flex-shrink-0 text-[9px] font-bold" style={{
                          background: "rgba(16,56,38,0.08)", border: "1px solid rgba(16,56,38,0.12)", color: "#103826",
                        }}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link href="/recruiter/dashboard"
                    className={`block text-center py-3 px-6 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5 ${
                      plan.popular ? "" : "border"
                    }`}
                    style={{
                      background: plan.popular ? "#E4B118" : "transparent",
                      color: plan.popular ? "#082E1E" : "#103826",
                      borderColor: plan.popular ? "transparent" : "rgba(16,56,38,0.15)",
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

        <Reveal variant="up" delay={90}>
          <div className="max-w-5xl mx-auto mt-6 rounded-2xl border p-6 text-center" style={{
            borderColor: "rgba(16,56,38,0.06)", background: "rgba(16,56,38,0.02)",
          }}>
            <p className="text-sm" style={{ color: "#50625A" }}>
              <strong style={{ color: "#0B1F18" }}>Vous êtes un grand cabinet ou un réseau ?</strong>{" "}
              Nous avons des offres sur mesure avec candidats illimités, API dédiée et support prioritaire.
            </p>
            <a href="/contact" className="inline-block mt-3 text-sm font-bold" style={{ color: "#103826", textDecoration: "underline" }}>
              Contactez-nous →
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
