"use client";

import Reveal from "../Reveal";
import ImgSlot from "../ImgSlot";

const STATS = [
  { num: "15-20h", label: "économisées par mois", sub: "Par recruteur" },
  { num: "8 min", label: "par candidat préparé", sub: "vs 2-3h manuellement" },
  { num: "+40%", label: "de placements", sub: "Candidats mieux préparés" },
  { num: "92%", label: "de taux ATS", sub: "Dossiers qui passent les filtres" },
];

export function RecruitersStats() {
  return (
    <section className="py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s, i) => (
            <Reveal variant="up" delay={i * 80} key={s.num}>
              <div className="text-center p-6 rounded-2xl" style={{
                background: "#FFFDF8", border: "1px solid rgba(16,56,38,0.06)",
              }}>
                <div className="text-3xl md:text-4xl font-extrabold tracking-[-0.03em] mb-1" style={{ color: "#E4B118", fontFamily: "Playfair Display, serif" }}>
                  {s.num}
                </div>
                <div className="text-sm font-semibold" style={{ color: "#0B1F18" }}>{s.label}</div>
                <div className="text-[11px] mt-0.5" style={{ color: "#6A8F6D" }}>{s.sub}</div>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal variant="up" delay={200} className="mt-8">
          <ImgSlot
            num={2}
            format="banner"
            prompt="Graphique progression : ligne descend de 180min à 8min avec point d'impact doré. Data-viz minimaliste."
            promptLong="Bannière décorative large sous les 4 chiffres clés. Graphique de progression montrant le temps gagné une ligne qui descend de 180 min (3h) à 8 min avec un point d'impact doré à 8 min. Fond dégradé subtil entre #0B1F18 et #103826. Trois petits cercles connectés par des lignes fines quelques points de données lumineux une courbe d'efficacité qui monte. Icône d'horloge ou sablier très stylisée dans le coin. Style data-viz minimaliste. Pas de texte."
          />
        </Reveal>
      </div>
    </section>
  );
}
