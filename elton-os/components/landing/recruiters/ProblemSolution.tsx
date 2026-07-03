"use client";

import Reveal from "../Reveal";

const PAIN_POINTS = [
  { task: "Formater un CV pour une offre", manual: "30-60 min", prsto: "30 sec", savings: "−98%" },
  { task: "Rédiger une lettre de motivation", manual: "20-30 min", prsto: "30 sec", savings: "−97%" },
  { task: "Vérifier la compatibilité ATS", manual: "10-15 min", prsto: "10 sec", savings: "−98%" },
  { task: "Optimiser LinkedIn du candidat", manual: "30-45 min", prsto: "30 sec", savings: "−98%" },
  { task: "Préparer un brief entretien", manual: "30-45 min", prsto: "5 min", savings: "−88%" },
];

export function ProblemSolution() {
  return (
    <section id="probleme" className="py-28" style={{ background: "rgba(106,143,109,0.03)" }}>
      <div className="max-w-6xl mx-auto px-6">
        <Reveal variant="up" className="text-center mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11.5px] font-semibold tracking-wide mb-5" style={{
            borderColor: "rgba(16,56,38,0.12)", color: "#103826",
            background: "rgba(16,56,38,0.06)",
          }}>
            ✦ Le problème
          </div>
          <h2 className="font-serif text-[clamp(1.875rem,3.5vw,2.875rem)] font-bold tracking-[-0.04em] leading-[1.08] mb-3 text-[#0B1F18]">
            50% de votre temps part en<br />tâches automatisables
          </h2>
          <p className="text-sm max-w-xl mx-auto" style={{ color: "#6A8F6D" }}>
            Les études montrent que les recruteurs passent la moitié de leur semaine
            sur de l&apos;administratif. Pendant ce temps, vos candidats attendent.
          </p>
        </Reveal>

        <div className="max-w-4xl mx-auto">
          {PAIN_POINTS.map((p, i) => (
            <Reveal variant="up" delay={i * 60} key={p.task}>
              <div className="grid grid-cols-[1fr_80px_80px_70px] md:grid-cols-[1fr_120px_120px_90px] gap-2 md:gap-4 items-center py-4 px-5 rounded-xl mb-2" style={{
                background: i % 2 === 0 ? "rgba(16,56,38,0.02)" : "transparent",
              }}>
                <div className="text-sm font-medium" style={{ color: "#0B1F18" }}>{p.task}</div>
                <div className="text-sm text-center" style={{ color: "#A38010" }}>
                  <span className="line-through opacity-60">{p.manual}</span>
                </div>
                <div className="text-sm font-bold text-center" style={{ color: "#103826" }}>{p.prsto}</div>
                <div className="text-[11px] font-bold text-center px-2 py-1 rounded" style={{
                  background: "rgba(16,56,38,0.08)", color: "#103826",
                }}>{p.savings}</div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal variant="up" delay={400}>
          <div className="max-w-3xl mx-auto mt-10 p-6 md:p-8 rounded-2xl text-center" style={{
            background: "rgba(16,56,38,0.03)", border: "1px solid rgba(16,56,38,0.08)",
          }}>
            <div className="text-3xl font-extrabold tracking-tight mb-1" style={{ color: "#0B1F18", fontFamily: "Playfair Display, serif" }}>
              <span style={{ color: "#E4B118" }}>2h à 3h</span> de travail manuel
            </div>
            <div className="text-lg font-medium mb-2" style={{ color: "#6A8F6D" }}>
              par candidat →
            </div>
            <div className="text-3xl font-extrabold tracking-tight" style={{ color: "#103826", fontFamily: "Playfair Display, serif" }}>
              <span style={{ color: "#E4B118" }}>8 minutes</span> avec PRSTO
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
