"use client";

import { useEffect, useState } from "react";
import Reveal from "./Reveal";

const SCREENS = [
  {
    key: "ats",
    badge: "ATS Scanner",
    color: "#103826",
    title: "Analyse de compatibilité",
    lines: [
      { label: "Score global", value: "92%", color: "#103826" },
      { label: "Mots-clés manquants", value: "3", color: "#E4B118" },
      { label: "Impact sémantique", value: "Élevé", color: "#6A8F6D" },
    ],
    chips: [
      { t: "P&L", ok: true },
      { t: "Go-to-market", ok: true },
      { t: "Management", ok: true },
      { t: "Agile", ok: false },
    ],
  },
  {
    key: "cv",
    badge: "CV Optimizer",
    color: "#E4B118",
    title: "CV adapté généré",
    lines: [
      { label: "Bullet points", value: "12", color: "#E4B118" },
      { label: "Impact moyen", value: "8.4/10", color: "#6A8F6D" },
      { label: "Temps de génération", value: "15s", color: "#103826" },
    ],
    chips: [
      { t: "Director", ok: true },
      { t: "Revenue", ok: true },
      { t: "Strategy", ok: true },
      { t: "Team 25+", ok: true },
    ],
  },
  {
    key: "lettre",
    badge: "Lettre sur-mesure",
    color: "#1F4A34",
    title: "Générée en 8 secondes",
    lines: [
      { label: "Ton détecté", value: "Directeur", color: "#1F4A34" },
      { label: "Personnalisation", value: "92%", color: "#103826" },
      { label: "Longueur", value: "Optimale", color: "#E4B118" },
    ],
    chips: [
      { t: "Madame", ok: true },
      { t: "Vos défis", ok: true },
      { t: "Q1 2026", ok: true },
      { t: "Cordial", ok: true },
    ],
  },
];

export default function ProductMockup() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const id = setInterval(() => {
      setActive((a) => (a + 1) % SCREENS.length);
    }, 4200);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="py-24">
      <div className="max-w-5xl mx-auto px-6">
        <Reveal variant="up" className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11.5px] font-semibold tracking-wide mb-5" style={{
            borderColor: "rgba(16,56,38,0.12)", color: "#103826",
            background: "rgba(16,56,38,0.06)",
          }}>
            ✦ Aperçu produit
          </div>
          <h2 className="font-serif text-[clamp(1.875rem,3.5vw,2.875rem)] font-bold tracking-[-0.04em] leading-[1.08] mb-3 text-[#0B1F18]">
            Trois gestes, zéro friction.
          </h2>
          <p className="text-sm max-w-lg mx-auto" style={{ color: "#6A8F6D" }}>
            Importez l&apos;offre, laissez l&apos;IA analyser, générez. Voici ce que vous voyez.
          </p>
        </Reveal>

        <Reveal variant="scale" delay={120}>
          <div className="relative">
            <div
              className="rounded-2xl border overflow-hidden mx-auto max-w-2xl"
              style={{
                borderColor: "rgba(16,56,38,0.08)",
                background: "#FFFDF8",
                boxShadow: "0 20px 60px rgba(16,56,38,0.08)",
              }}
            >
              <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "rgba(16,56,38,0.06)" }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#f43f5e" }} />
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#E4B118" }} />
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#103826" }} />
                <span className="ml-3 text-[11px] font-semibold" style={{ color: "#6A8F6D" }}>
                  prsto.app
                </span>
                <div className="ml-auto flex gap-1.5">
                  {SCREENS.map((s, i) => (
                    <button
                      key={s.key}
                      onClick={() => setActive(i)}
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{
                        width: i === active ? 22 : 8,
                        background: i === active ? s.color : "rgba(16,56,38,0.15)",
                      }}
                      aria-label={s.badge}
                    />
                  ))}
                </div>
              </div>

              <div className="p-6 md:p-8">
                {SCREENS.map((s, i) => (
                  <div
                    key={s.key}
                    className="transition-all duration-500"
                    style={{
                      display: i === active ? "block" : "none",
                      opacity: i === active ? 1 : 0,
                      transform: i === active ? "translateY(0)" : "translateY(8px)",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-5">
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full" style={{
                        background: `${s.color}15`, color: s.color,
                      }}>
                        {s.badge}
                      </span>
                      <span className="w-[6px] h-[6px] rounded-full" style={{ background: s.color }} />
                    </div>
                    <h3 className="text-xl font-bold tracking-tight mb-5" style={{ color: "#0B1F18" }}>{s.title}</h3>

                    <div className="space-y-2 mb-5">
                      {s.lines.map((l) => (
                        <div key={l.label} className="flex items-center justify-between p-3 rounded-xl" style={{
                          background: "#FAF6EF",
                          border: "1px solid rgba(16,56,38,0.06)",
                        }}>
                          <span className="text-[12.5px]" style={{ color: "#6A8F6D" }}>{l.label}</span>
                          <span className="text-[14px] font-bold" style={{ color: l.color }}>{l.value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {s.chips.map((c) => (
                        <span key={c.t} className="text-[10px] px-2 py-1 rounded-full font-semibold" style={{
                          background: c.ok ? "rgba(16,56,38,0.08)" : "rgba(228,177,24,0.08)",
                          color: c.ok ? "#103826" : "#A38010",
                          border: `1px solid ${c.ok ? "rgba(16,56,38,0.1)" : "rgba(228,177,24,0.1)"}`,
                        }}>
                          {c.t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
