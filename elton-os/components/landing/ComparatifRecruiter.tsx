"use client";

import Reveal from "./Reveal";

const ROWS = [
  { task: "CV adapté par offre client", prsto: true, ats: false },
  { task: "Lettre de motivation personnalisée", prsto: true, ats: false },
  { task: "ATS Scanner sémantique", prsto: true, ats: "Partiel" },
  { task: "LinkedIn Optimizer", prsto: true, ats: false },
  { task: "Brief entretien candidat", prsto: true, ats: false },
  { task: "Market Radar / matching offres", prsto: true, ats: false },
  { task: "CRM / Suivi de pipeline", prsto: false, ats: true },
  { task: "Sourcing / scraping LinkedIn", prsto: false, ats: true },
  { task: "Publication d'offres multi-plateformes", prsto: false, ats: true },
];

export default function ComparatifRecruiter() {
  return (
    <section id="comparatif" className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(106,143,109,0.03), transparent 65%)", filter: "blur(40px)" }} />
      </div>
      <div className="max-w-5xl mx-auto px-6 relative" style={{ zIndex: 1 }}>
        <Reveal variant="up" className="text-center mb-14">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-[11px] font-semibold tracking-wide mb-6 backdrop-blur-sm" style={{
            borderColor: "rgba(228,177,24,0.15)",
            color: "#A38010",
            background: "rgba(228,177,24,0.06)",
          }}>
            ✦ Positionnement
          </div>
          <h2 className="font-serif text-[clamp(1.8rem,3.5vw,2.8rem)] font-bold tracking-[-0.04em] leading-[1.08] mb-4" style={{ color: "#0B1F18" }}>
            PRSTO vs les ATS traditionnels
          </h2>
          <p className="text-sm max-w-xl mx-auto" style={{ color: "#6A8F6D" }}>
            Nous ne remplaçons pas votre ATS. Nous faisons ce qu&apos;aucun ATS ne fait : <strong>préparer vos candidats</strong>.
          </p>
        </Reveal>

        <Reveal variant="up" delay={120}>
          <div className="rounded-3xl overflow-hidden backdrop-blur-sm" style={{
            border: "1px solid rgba(16,56,38,0.06)",
            background: "rgba(255,253,248,0.5)",
            boxShadow: "0 8px 32px rgba(16,56,38,0.03)",
          }}>
            {/* Header */}
            <div className="grid grid-cols-[1fr_100px_100px] gap-0" style={{ background: "rgba(16,56,38,0.02)" }}>
              <div className="p-4 md:p-5 text-left">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#0B1F18" }}>Fonctionnalité</span>
              </div>
              <div className="p-4 md:p-5 text-center">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#E4B118" }}>PRSTO</span>
              </div>
              <div className="p-4 md:p-5 text-center">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#6A8F6D" }}>ATS</span>
              </div>
            </div>

            {/* Rows */}
            {ROWS.map((r, i) => (
              <div key={r.task} className="grid grid-cols-[1fr_100px_100px] gap-0 items-center transition-colors duration-200 hover:bg-[rgba(228,177,24,0.02)]" style={{
                borderTop: "1px solid rgba(16,56,38,0.04)",
                background: i % 2 === 0 ? "transparent" : "rgba(16,56,38,0.01)",
              }}>
                <div className="p-4 md:p-5 text-sm" style={{ color: "#0B1F18" }}>{r.task}</div>
                <div className="p-4 md:p-5 text-center">
                  {typeof r.prsto === "string" ? (
                    <span className="text-xs font-medium px-2 py-1 rounded-lg" style={{ color: "#103826", background: "rgba(16,56,38,0.06)" }}>{r.prsto}</span>
                  ) : r.prsto ? (
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-sm font-bold" style={{ background: "rgba(16,56,38,0.08)", color: "#103826" }}>✓</span>
                  ) : (
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-sm" style={{ color: "rgba(80,98,90,0.2)" }}>—</span>
                  )}
                </div>
                <div className="p-4 md:p-5 text-center">
                  {typeof r.ats === "string" ? (
                    <span className="text-xs font-medium px-2 py-1 rounded-lg" style={{ color: "#6A8F6D", background: "rgba(106,143,109,0.08)" }}>{r.ats}</span>
                  ) : r.ats ? (
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-sm font-bold" style={{ background: "rgba(106,143,109,0.08)", color: "#6A8F6D" }}>✓</span>
                  ) : (
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-sm" style={{ color: "rgba(80,98,90,0.2)" }}>—</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-center mt-5 max-w-2xl mx-auto" style={{ color: "#6A8F6D" }}>
            PRSTO n&apos;est pas un ATS — c&apos;est un <strong style={{ color: "#0B1F18" }}>moteur de préparation de candidats</strong>.
            Il se branche sur vos outils existants et double votre taux de placement.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
