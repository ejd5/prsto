"use client";

import { useState } from "react";
import Reveal from "./Reveal";

const FAQ_ITEMS = [
  {
    q: "PRSTO postule-t-il automatiquement à ma place ?",
    r: "Non, jamais. PRSTO n'envoie aucune candidature sans votre action directe. Vous générez, vous relisez, vous envoyez. L'IA vous assiste, elle ne vous remplace pas. Contrôle humain total à chaque étape.",
  },
  {
    q: "Mes données sont-elles en sécurité ?",
    r: "Oui. Architecture local-first. Chiffrement AES-256 au repos. Les appels IA sont anonymisés. Aucune donnée sensible n'est revendue ou partagée avec des tiers.",
  },
  {
    q: "Puis-je résilier à tout moment ?",
    r: "Oui, depuis votre espace compte, sans justification et sans frais de résiliation. Vous conservez toutes vos données exportées au format standard.",
  },
  {
    q: "Faut-il des compétences techniques pour utiliser PRSTO ?",
    r: "Absolument pas. L'interface est conçue pour être intuitive. Si vous savez utiliser LinkedIn et Gmail, vous savez utiliser PRSTO. Guidage pas à pas inclus.",
  },
  {
    q: "Quelle est la différence entre l'offre gratuite et les offres payantes ?",
    r: "La version gratuite inclut l'ATS Scanner (5 analyses/mois) et le CV Optimizer (3 optimisations/mois). Les offres payantes débloquent le nombre d'analyses illimité, le CRM Recruteur, l'Interview Studio, le Market Radar et l'extension Chrome complète.",
  },
];

function Item({ q, r, open, onToggle }: { q: string; r: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="border-b" style={{ borderColor: "rgba(16,56,38,0.08)" }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-5 text-left text-[15px] font-semibold transition-colors"
        style={{ color: "#0B1F18", background: "transparent", border: "none", cursor: "pointer" }}
      >
        {q}
        <span className={`flex-shrink-0 ml-4 transition-transform duration-200 text-lg ${open ? "rotate-45" : ""}`} style={{ color: "#E4B118" }}>+</span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? "max-h-96 pb-5" : "max-h-0"}`}
        style={{ color: "#50625A" }}>
        <p className="text-sm leading-relaxed">{r}</p>
      </div>
    </div>
  );
}

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-28">
      <div className="max-w-3xl mx-auto px-6">
        <Reveal variant="up" className="text-center mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11.5px] font-semibold tracking-wide mb-5" style={{
            borderColor: "rgba(16,56,38,0.12)", color: "#103826",
            background: "rgba(16,56,38,0.06)",
          }}>
            ✦ FAQ
          </div>
          <h2 className="font-serif text-[clamp(1.875rem,3.5vw,2.875rem)] font-bold tracking-[-0.04em] leading-[1.08] mb-3 text-[#0B1F18]">
            Questions fréquentes.
          </h2>
        </Reveal>

        <Reveal variant="up" delay={120}>
          {FAQ_ITEMS.map((item, i) => (
            <Item key={i} q={item.q} r={item.r} open={openIndex === i} onToggle={() => setOpenIndex(openIndex === i ? null : i)} />
          ))}
        </Reveal>
      </div>
    </section>
  );
}
