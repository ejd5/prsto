"use client";

import { useRef } from "react";
import Reveal from "./Reveal";

const FEATURES = [
  {
    tag: "IA CORE", tagBg: "#F4F4F5", tagColor: "#52525B", icon: "🔍",
    title: "ATS Scanner",
    desc: "Score de compatibilité précis entre votre CV et l'offre cible. Mots-clés manquants, recommandations priorisées, analyse sémantique profonde.",
    wide: true,
    visual: true,
  },
  {
    tag: "PREMIUM", tagBg: "#FEF3C7", tagColor: "#D97706", icon: "📝",
    title: "CV Optimizer",
    desc: "Analyse structurelle, impact des bullet points, adaptation sémantique — CV Maître et CV Adapté en un clic.",
  },
  {
    tag: "LINKEDIN", tagBg: "#F4F4F5", tagColor: "#52525B", icon: "📈",
    title: "LinkedIn Optimizer",
    desc: "Score SSI, optimisation About et expériences, ciblage recruteur. Visibilité ×3.",
  },
  {
    tag: "RADAR", tagBg: "#F4F4F5", tagColor: "#52525B", icon: "📡",
    title: "Market Radar",
    desc: "Cartographie du marché caché. Alertes personnalisées par secteur, rôle et zone géographique, en temps réel.",
  },
  {
    tag: "CRM", tagBg: "#F4F4F5", tagColor: "#52525B", icon: "👥",
    title: "CRM Recruteur",
    desc: "Historique complet de chaque recruteur et chasseur. Pipeline Kanban, relances, notes contextuelles.",
  },
  {
    tag: "STUDIO", tagBg: "#FEF3C7", tagColor: "#D97706", icon: "🎤",
    title: "Interview Studio — Panel",
    desc: "Simulations d'entretien avec un panel IA complet. Questions sur-mesure, analyse posture, audit 5 dimensions.",
  },
];

const ATS_KEYWORDS = [
  { text: "Management d'équipe", hit: true },
  { text: "P&L", hit: true },
  { text: "Go-to-market", hit: true },
  { text: "Agile", hit: false },
  { text: "Transformation", hit: true },
  { text: "SaaS", hit: false },
];

function FeatureCard({ f, index }: { f: (typeof FEATURES)[number]; index: number }) {
  const ref = useRef<HTMLDivElement | null>(null);

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }

  return (
    <Reveal
      variant="up"
      delay={index * 70}
      className={f.wide ? "sm:col-span-2 lg:col-span-2" : ""}
    >
      <div
        ref={ref}
        onMouseMove={handleMove}
        className="rounded-3xl border p-7 transition-all duration-300 hover:-translate-y-1 h-full"
        style={{
          borderColor: "rgba(16,56,38,0.05)",
          background: "#FFFFFF",
          boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
        }}
      >
        <div className="flex flex-col h-full relative" style={{ zIndex: 1 }}>
          <span className="text-[9px] font-bold tracking-widest px-2.5 py-1 rounded-full w-fit mb-5" style={{
            background: f.tagBg,
            color: f.tagColor,
          }}>
            {f.tag}
          </span>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-5 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3" style={{
            background: "#FAF6EF",
            border: "1px solid rgba(16,56,38,0.08)",
          }}>
            {f.icon}
          </div>
          <h3 className="text-base font-bold mb-2 tracking-tight text-[#0B1F18]">{f.title}</h3>
          <p className="text-sm leading-relaxed flex-1" style={{ color: "#6A8F6D" }}>{f.desc}</p>

          {f.visual && (
            <div className="mt-6 p-5 rounded-xl" style={{
              background: "#FAF6EF",
              border: "1px solid rgba(16,56,38,0.06)",
            }}>
              <div className="flex flex-col items-center mb-3">
                <div className="relative w-20 h-20 rounded-full flex items-center justify-center mb-3 transition-transform duration-500 group-hover:scale-105" style={{
                  background: "conic-gradient(#103826 0% 92%, rgba(16,56,38,0.06) 92%)",
                  boxShadow: "0 0 30px rgba(16,56,38,0.15)",
                }}>
                  <div className="absolute w-16 h-16 rounded-full" style={{ background: "#FFFDF8" }} />
                  <span className="relative text-lg font-extrabold z-10" style={{ color: "#103826" }}>92</span>
                </div>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {ATS_KEYWORDS.map((kw) => (
                    <span key={kw.text} className="text-[9px] px-2.5 py-1 rounded-full font-semibold" style={{
                      background: kw.hit ? "#F3F4F6" : "#FEF3C7",
                      color: kw.hit ? "#4B5563" : "#D97706",
                      border: `1px solid ${kw.hit ? "#E5E7EB" : "#FDE68A"}`,
                    }}>
                      {kw.text}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Reveal>
  );
}

export default function FeatureGrid() {
  return (
    <section id="fonctionnalites" className="py-28"
      style={{
        backgroundImage: "url('/features-bg.png')",
        backgroundSize: "100% 100%",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}>
      <div className="max-w-6xl mx-auto px-6">
        <Reveal variant="up" className="text-center mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11.5px] font-semibold tracking-wide mb-5" style={{
            borderColor: "rgba(16,56,38,0.12)", color: "#103826",
            background: "rgba(16,56,38,0.06)",
          }}>
            ✦ Fonctionnalités
          </div>
          <h2 className="font-serif text-[clamp(1.875rem,3.5vw,2.875rem)] font-bold tracking-[-0.04em] leading-[1.08] mb-3 text-[#0B1F18]">
            Tout pour votre recherche<br />au même endroit.
          </h2>
          <p className="text-sm max-w-lg mx-auto" style={{ color: "#6A8F6D" }}>
            6 modules complémentaires, conçus pour chaque étape — de l&apos;analyse ATS à la préparation d&apos;entretien.
          </p>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} f={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
