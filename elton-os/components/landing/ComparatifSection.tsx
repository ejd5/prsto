"use client";

import Reveal from "./Reveal";

type Row = {
  feature: string;
  prsto: boolean | string;
  others: boolean | string;
};

const ROWS: Row[] = [
  { feature: "Scanner ATS sémantique", prsto: true, others: "Partiel" },
  { feature: "Génération CV adapté par offre", prsto: true, others: false },
  { feature: "Lettre sur-mesure en <10s", prsto: true, others: false },
  { feature: "Coach LinkedIn (Score SSI)", prsto: true, others: false },
  { feature: "Market Radar (marché caché)", prsto: true, others: false },
  { feature: "CRM Recruteur + Pipeline Kanban", prsto: true, others: false },
  { feature: "Panel — simulation panel IA", prsto: true, others: false },
  { feature: "Extension Chrome (17 plateformes)", prsto: true, others: "3-5" },
  { feature: "Local-first · zéro cloud externe", prsto: true, others: false },
];

export default function ComparatifSection() {
  return (
    <section className="py-28">
      <div className="max-w-5xl mx-auto px-6">
        <Reveal variant="up" className="text-center mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11.5px] font-semibold tracking-wide mb-5" style={{
            borderColor: "rgba(16,56,38,0.12)", color: "#103826",
            background: "rgba(16,56,38,0.06)",
          }}>
            ✦ Comparatif
          </div>
          <h2 className="font-serif text-[clamp(1.875rem,3.5vw,2.875rem)] font-bold tracking-[-0.04em] leading-[1.08] mb-3 text-[#0B1F18]">
            PRSTO face aux alternatives.
          </h2>
        </Reveal>

        <Reveal variant="up" delay={120}>
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "rgba(16,56,38,0.08)", background: "#FFFDF8" }}>
            <div className="grid grid-cols-[1fr_100px_100px] gap-0 text-[11px] font-bold uppercase tracking-widest" style={{ background: "rgba(16,56,38,0.03)" }}>
              <div className="p-4 text-left" style={{ color: "#0B1F18" }}>Fonctionnalité</div>
              <div className="p-4 text-center" style={{ color: "#103826" }}>PRSTO</div>
              <div className="p-4 text-center" style={{ color: "#6A8F6D" }}>Autres</div>
            </div>
            {ROWS.map((r, i) => (
              <div key={r.feature} className="grid grid-cols-[1fr_100px_100px] gap-0 text-[13.5px]" style={{
                borderTop: "1px solid rgba(16,56,38,0.06)",
                background: i % 2 === 0 ? "transparent" : "rgba(16,56,38,0.02)",
              }}>
                <div className="p-4" style={{ color: "#0B1F18" }}>{r.feature}</div>
                <div className="p-4 text-center font-semibold" style={{ color: "#103826" }}>
                  {r.prsto === true ? "✓" : r.prsto}
                </div>
                <div className="p-4 text-center" style={{ color: "#6A8F6D" }}>
                  {r.others === false ? "—" : r.others}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
