"use client";

import type { ReactNode } from "react";
import Reveal from "../Reveal";
import ImgSlot from "../ImgSlot";
import { PrstoLogo } from "../PrstoLogo";

const HEADERS = ["", "Indépendant seul", "Cabinet d'exécution", "Franchise / Réseau", "Autonome"];

const COLORS = ["#6A8F6D", "#103826", "#A38010", "#E4B118"];

type Row = {
  label: string;
  tooltip?: string;
  values: (string | ReactNode)[];
};

const ROWS: Row[] = [
  {
    label: "Coût outils mensuel",
    tooltip: "LinkedIn Recruiter + ATS + sites emploi",
    values: ["825€ à 2 500€", "1 500€ à 4 000€", "Inclus (franchise)", "99$ à 349$"],
  },
  {
    label: "Commission reversée",
    values: ["100% pour vous", "50-70% pour vous", "60-80% au cabinet", "100% pour vous"],
  },
  {
    label: "Redevance mensuelle",
    values: ["Aucune", "Aucune", "500€ à 2 000€", "Aucune"],
  },
  {
    label: "Autonomie",
    values: ["Totale", "Limitée (process)", "Cadre défini", "Totale + outils"],
  },
  {
    label: "Marque personnelle",
    values: ["À construire seul", "Marque du cabinet", "Marque du réseau", <span key="m-prsto" className="inline-flex items-center gap-1"><span>La vôtre +</span><PrstoLogo size={55} style={{ verticalAlign: "middle" }} /></span>],
  },
  {
    label: "Temps administratif",
    values: ["50% du temps", "Variable (support)", "Partiellement allégé", "8 min/candidat"],
  },
  {
    label: "Formation / coaching",
    values: ["Aucun (payant)", "Interne", "Inclus (franchise)", "Accompagnement Elton"],
  },
  {
    label: "Outils de préparation",
    values: ["Aucun (manuel)", "Partiels", "Standards du réseau", "CV, Lettre, ATS, LinkedIn, Brief"],
  },
  {
    label: "Support technique",
    values: ["Aucun", "IT interne", "Support réseau", "Prioritaire (Pro/Elite)"],
  },
  {
    label: "Contrat / engagement",
    values: ["Aucun", "CDI ou freelance", "1-3 ans", "Mensuel, sans engagement"],
  },
  {
    label: "ROI sur 12 mois",
    values: ["Variable (outils)", "60-80k€ (10 placements)", "50-70k€ (après redevance)", "Jusqu'à 150k€ (sans frais)"],
  },
];

export function ComparatifModelesRecruiter() {
  return (
    <section id="comparatif-modeles" className="py-28" style={{ background: "#FAF6EF" }}>
      <div className="max-w-6xl mx-auto px-6">
        <Reveal variant="up" className="text-center mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11.5px] font-semibold tracking-wide mb-5" style={{
            borderColor: "rgba(228,177,24,0.2)", color: "#A38010",
            background: "rgba(228,177,24,0.06)",
          }}>
            ✦ Comparaison détaillée
          </div>
          <h2 className="font-serif text-[clamp(1.875rem,3.5vw,2.875rem)] font-bold tracking-[-0.04em] leading-[1.08] mb-3 text-[#0B1F18]">
            Les 4 voies pour exercer<br />le recrutement en 2026
          </h2>
          <p className="text-sm max-w-xl mx-auto" style={{ color: "#6A8F6D" }}>
            Indépendant, cabinet, franchise ou autonome avec PRSTO : chaque modèle a ses 
            avantages. Voici un comparatif sans filtre.
          </p>
        </Reveal>

        <Reveal variant="up" delay={80}>
          <div className="rounded-2xl border overflow-hidden" style={{
            borderColor: "rgba(16,56,38,0.08)", background: "#FFFDF8",
          }}>
            <div className="grid grid-cols-[140px_1fr_1fr_1fr_1fr] gap-0 text-[10px] font-bold uppercase tracking-widest" style={{
              background: "rgba(16,56,38,0.03)",
            }}>
              {HEADERS.map((h, i) => (
                <div key={h} className="p-4 text-center" style={{
                  color: i === 0 ? "#0B1F18" : COLORS[i - 1],
                  textAlign: i === 0 ? "left" : "center",
                }}>
                  {i === HEADERS.length - 1 ? <PrstoLogo size={85} /> : h}
                </div>
              ))}
            </div>
            {ROWS.map((row, i) => (
              <div key={row.label} className="grid grid-cols-[140px_1fr_1fr_1fr_1fr] gap-0" style={{
                borderTop: "1px solid rgba(16,56,38,0.05)",
                background: i % 2 === 0 ? "transparent" : "rgba(16,56,38,0.02)",
              }}>
                <div className="p-3.5 text-[12px] font-semibold flex items-center gap-1" style={{ color: "#0B1F18" }}>
                  {row.label}
                  {row.tooltip && (
                    <span className="text-[9px] font-normal cursor-help" style={{ color: "#6A8F6D" }} title={row.tooltip}>
                      ⓘ
                    </span>
                  )}
                </div>
                {row.values.map((val, j) => {
                  const isBest = j === row.values.length - 1;
                  return (
                    <div key={`${row.label}-${j}`} className="p-3.5 text-[12px] text-center flex items-center justify-center min-h-[48px]" style={{
                      color: isBest ? COLORS[3] : "#50625A",
                      fontWeight: isBest ? 700 : 400,
                    }}>
                      {val}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal variant="up" delay={80} className="mt-12 mb-8">
          <ImgSlot
            num={7}
            format="banner"
            prompt="4 colonnes comparées : Success Fee 20-35%, Flat Fee 3-8k€, Régie 300-800€/j, RPO 5-20k€/mois."
            promptLong="Comparatif des 4 modèles en tableau graphique. 4 colonnes avec en-têtes Success Fee (icône % vert) Flat Fee (icône forfait bleu) Régie TJM (icône calendrier orange) RPO (icône building violet). Lignes Coût Risque Flexibilité Autonomie Temps. Chaque case colorée du vert au rouge. Tout en bas Total sur 1 an les 3 premiers modèles explosent PRSTO reste à 1188€. Fond #0B1F18. Style Bloomberg terminal data-driven punchy."
          />
        </Reveal>

        <div className="grid md:grid-cols-2 gap-6">
          <Reveal variant="up" delay={100}>
            <div className="rounded-2xl border p-7" style={{
              borderColor: "rgba(16,56,38,0.06)", background: "#FFFDF8",
            }}>
              <h3 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: "#0B1F18" }}>
                <span className="text-lg">💸</span> Le coût caché de l&apos;indépendance
              </h3>
              <div className="space-y-3">
                {[
                  ["LinkedIn Recruiter Cloud", "825€", "/mois"],
                  ["ATS (Manatal, Recruit CRM)", "50-200€", "/mois"],
                  ["Sites d'emploi (Indeed, Apec)", "300-500€", "/annonce"],
                  ["Rédacteur CV externalisé", "200-500€", "/candidat"],
                  ["Formation continue", "1 000-3 000€", "/an"],
                  ["Comptable / juridique", "150-400€", "/mois"],
                ].map(([tool, price, unit]) => (
                  <div key={tool} className="flex items-center justify-between py-1.5">
                    <span className="text-sm" style={{ color: "#50625A" }}>{tool}</span>
                    <span className="text-sm font-bold" style={{ color: "#0B1F18" }}>
                      {price}
                      <span className="text-[10px] font-normal" style={{ color: "#6A8F6D" }}>{unit}</span>
                    </span>
                  </div>
                ))}
                <div className="pt-3 border-t flex items-center justify-between" style={{ borderColor: "rgba(16,56,38,0.08)" }}>
                  <span className="text-sm font-bold" style={{ color: "#0B1F18" }}>Total mensuel estimé</span>
                  <span className="text-lg font-extrabold" style={{ color: "#A38010", fontFamily: "Playfair Display, serif" }}>
                    1 200€ – 2 500€+
                  </span>
                </div>
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-sm font-bold flex items-center gap-1.5" style={{ color: "#0B1F18" }}>
                    <span>Avec</span>
                    <PrstoLogo size={55} style={{ verticalAlign: "middle" }} />
                  </span>
                  <span className="text-lg font-extrabold" style={{ color: "#103826", fontFamily: "Playfair Display, serif" }}>
                    99$ – 349$
                  </span>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal variant="up" delay={150}>
            <div className="rounded-2xl border p-7 h-full" style={{
              borderColor: "rgba(228,177,24,0.12)", background: "rgba(228,177,24,0.03)",
            }}>
              <h3 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: "#0B1F18" }}>
                <span className="text-lg">🚀</span> Pourquoi passer en mode autonome
              </h3>
              <div className="space-y-4">
                {[
                  {
                    title: "Liberté géographique",
                    desc: "Pas de bureau imposé, pas de zone d'exclusivité. Travaillez depuis n'importe où, pour n'importe quel client.",
                  },
                  {
                    title: "Pas de plafond de verre",
                    desc: "Quand vous ne reversez pas 20-40% de vos commissions, chaque placement vous rapporte 100%. Votre revenu dépend de vous, pas d'un seuil de franchise.",
                  },
                  {
                    title: "Outils professionnels à prix indépendant",
                    desc: "PRSTO vous donne les mêmes outils qu'un cabinet de 50 personnes pour le prix d'un abonnement SaaS. ATS Scanner, LinkedIn Optimizer, Market Radar : tout est inclus.",
                  },
                  {
                    title: "Accompagnement sans redevance",
                    desc: "Formation, coaching, stratégie : Elton vous accompagne personnellement. Pas de frais cachés, pas d'engagement long terme.",
                  },
                ].map((item) => (
                  <div key={item.title}>
                    <h4 className="text-sm font-bold mb-1" style={{ color: "#0B1F18" }}>{item.title}</h4>
                    <p className="text-xs leading-relaxed" style={{ color: "#50625A" }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
