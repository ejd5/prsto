"use client";

import Reveal from "../Reveal";
import { PrstoLogo } from "../PrstoLogo";

const ROWS = [
  { task: "CV adapté par offre client", candidate: false, recruiter: true, existing: false },
  { task: "Lettre de motivation personnalisée", candidate: true, recruiter: true, existing: false },
  { task: "ATS Scanner", candidate: true, recruiter: true, existing: "Partiel" },
  { task: "LinkedIn Optimizer", candidate: true, recruiter: true, existing: false },
  { task: "Brief entretien candidat", candidate: true, recruiter: true, existing: false },
  { task: "Market Radar / matching offres", candidate: true, recruiter: true, existing: false },
  { task: "CRM/Suivi de pipeline", candidate: false, recruiter: false, existing: true },
  { task: "Sourcing / scraping LinkedIn", candidate: false, recruiter: false, existing: true },
  { task: "Publication d'offres multi-plateformes", candidate: false, recruiter: false, existing: true },
];

export function ComparatifTable() {
  return (
    <section id="comparatif" className="py-28">
      <div className="max-w-6xl mx-auto px-6">
        <Reveal variant="up" className="text-center mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11.5px] font-semibold tracking-wide mb-5" style={{
            borderColor: "rgba(16,56,38,0.12)", color: "#103826",
            background: "rgba(16,56,38,0.06)",
          }}>
            ✦ Positionnement
          </div>
          <h2 className="font-serif text-[clamp(1.875rem,3.5vw,2.875rem)] font-bold tracking-[-0.04em] leading-[1.08] mb-3 text-[#0B1F18] flex items-center justify-center gap-3 flex-wrap">
            <PrstoLogo size={110} style={{ verticalAlign: "middle" }} />
            <span>vs les ATS traditionnels</span>
          </h2>
          <p className="text-sm max-w-lg mx-auto" style={{ color: "#6A8F6D" }}>
            Nous ne remplaçons pas votre ATS. Nous faisons ce qu&apos;aucun ATS ne fait.
          </p>
        </Reveal>

        <Reveal variant="up" delay={120}>
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "rgba(16,56,38,0.08)", background: "#FFFDF8" }}>
            <div className="grid grid-cols-[1fr_90px_90px_90px] gap-0 text-[10px] font-bold uppercase tracking-widest" style={{ background: "rgba(16,56,38,0.03)" }}>
              <div className="p-4 text-left" style={{ color: "#0B1F18" }}>Fonctionnalité</div>
              <div className="p-3 text-center flex justify-center"><PrstoLogo size={75} /></div>
              <div className="p-3 text-center flex justify-center"><PrstoLogo size={75} /></div>
              <div className="p-4 text-center" style={{ color: "#6A8F6D" }}>ATS existant</div>
            </div>
            {ROWS.map((r, i) => (
              <div key={r.task} className="grid grid-cols-[1fr_90px_90px_90px] gap-0 text-[13px]" style={{
                borderTop: "1px solid rgba(16,56,38,0.06)",
                background: i % 2 === 0 ? "transparent" : "rgba(16,56,38,0.02)",
              }}>
                <div className="p-4" style={{ color: "#0B1F18" }}>{r.task}</div>
                <div className="p-4 text-center font-semibold" style={{ color: r.candidate ? "#103826" : "#ccc" }}>
                  {r.candidate ? "✓" : "—"}
                </div>
                <div className="p-4 text-center font-semibold" style={{ color: r.recruiter ? "#E4B118" : "#ccc" }}>
                  {r.recruiter ? "✓" : "—"}
                </div>
                <div className="p-4 text-center" style={{ color: r.existing ? "#6A8F6D" : "#ccc" }}>
                  {r.existing === true ? "✓" : r.existing || "—"}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-center mt-4" style={{ color: "#6A8F6D" }}>
            PRSTO Recruteur n&apos;est pas un ATS. C&apos;est un <strong>moteur de préparation de candidats</strong>.
            Il se branche sur vos outils existants.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
