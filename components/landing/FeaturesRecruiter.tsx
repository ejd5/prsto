"use client";

import { useRef, useState } from "react";
import type { FC } from "react";
import Reveal from "./Reveal";
import { DocumentIcon, MailIcon, SearchIcon, ChartIcon, RadarIcon, TargetIcon } from "@/components/ui/CustomIcons";

const FEATURES: {
  icon: FC<{ size?: number; style?: React.CSSProperties }>;
  tag: string;
  title: string;
  desc: string;
  color: string;
  bgAccent: string;
  wide: boolean;
  visual: boolean;
  visualPrompt: string;
}[] = [
  {
    icon: DocumentIcon,
    tag: "FORMAT",
    title: "CV Formatter",
    desc: "Importez le CV et l'offre client — PRSTO génère un CV adapté, formaté ATS, en 30 secondes. Personnalisable par mission.",
    color: "#103826",
    bgAccent: "rgba(16,56,38,0.04)",
    wide: false,
    visual: false,
    visualPrompt: "",
  },
  {
    icon: MailIcon,
    tag: "RÉDACTION",
    title: "Lettre de Motivation",
    desc: "Générez une lettre sur-mesure au nom du cabinet, alignée sur l'offre et le profil du candidat. Ton, arguments, signature.",
    color: "#E4B118",
    bgAccent: "rgba(228,177,24,0.04)",
    wide: true,
    visual: true,
    visualPrompt: "Fenêtre d'édition PRSTO — papier à en-tête du cabinet, lettre générée par IA en typographie sérif élégante, bouton 'Générer' avec glow or #E4B118, fond crème #FAF6EF, aperçu PDF à droite, design minimal premium, tons #FFFDF8 et #103826.",
  },
  {
    icon: SearchIcon,
    tag: "ANALYSE",
    title: "ATS Scanner",
    desc: "Vérifiez que le dossier passera les systèmes de filtrage de l'entreprise cliente avant envoi. Score, mots-clés, recommandations.",
    color: "#6A8F6D",
    bgAccent: "rgba(106,143,109,0.04)",
    wide: false,
    visual: false,
    visualPrompt: "",
  },
  {
    icon: ChartIcon,
    tag: "LINKEDIN",
    title: "LinkedIn Optimizer",
    desc: "Analysez et optimisez le profil LinkedIn du candidat pour maximiser sa visibilité auprès des recruteurs clients. Score SSI ×3.",
    color: "#103826",
    bgAccent: "rgba(16,56,38,0.04)",
    wide: false,
    visual: false,
    visualPrompt: "",
  },
  {
    icon: RadarIcon,
    tag: "RADAR",
    title: "Market Radar",
    desc: "Trouvez en un clic les offres qui matchent le profil de votre candidat sur 17 plateformes. Alertes temps réel.",
    color: "#E4B118",
    bgAccent: "rgba(228,177,24,0.04)",
    wide: true,
    visual: true,
    visualPrompt: "Interface Market Radar PRSTO — grille d'offres emploi venant de 17 plateformes, cartes glassmorphes avec titre/entreprise/salaire/score de match en badge vert #103826, filtres latéraux, badge '3 nouvelles offres' en or #E4B118, fond #FFFDF8, design épuré haut-de-gamme.",
  },
  {
    icon: TargetIcon,
    tag: "PRÉPARATION",
    title: "Brief Entretien",
    desc: "Dossier complet : entreprise, questions probables, pitch personnalisé, stratégie de négociation. Livré en 5 minutes.",
    color: "#6A8F6D",
    bgAccent: "rgba(106,143,109,0.04)",
    wide: false,
    visual: false,
    visualPrompt: "",
  },
];

const VISUAL_IMAGES: Record<string, string> = {
  "Lettre de Motivation": "/images/prsto/feature-lettre.png",
  "Market Radar": "/images/prsto/feature-radar.png",
};

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
    <Reveal variant="up" delay={index * 60} className={f.wide ? "md:col-span-2" : ""}>
      <div
        ref={ref}
        onMouseMove={handleMove}
        className="group relative rounded-3xl p-7 md:p-8 transition-all duration-500 hover:-translate-y-1 h-full overflow-hidden backdrop-blur-sm"
        style={{
          border: "1px solid rgba(16,56,38,0.06)",
          background: "rgba(255,253,248,0.55)",
          boxShadow: "0 4px 24px rgba(16,56,38,0.03)",
        }}
      >
        {/* Luminous border on hover */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background: `radial-gradient(300px circle at var(--mx, 50%) var(--my, 50%), rgba(228,177,24,0.15), transparent 65%)`,
            WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            padding: 1,
          }}
        />

        <div className="relative" style={{ zIndex: 1 }}>
          <div className="flex items-start justify-between mb-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3" style={{
              background: f.bgAccent,
              border: "1px solid rgba(16,56,38,0.06)",
            }}>
              <f.icon size={24} style={{ color: f.color }} />
            </div>
            <span className="text-[9px] font-bold tracking-widest px-3 py-1.5 rounded-full" style={{
              background: `${f.color}0a`,
              color: f.color,
              border: `1px solid ${f.color}15`,
            }}>
              {f.tag}
            </span>
          </div>

          <h3 className="text-lg font-bold mb-2 tracking-tight" style={{ color: "#0B1F18" }}>{f.title}</h3>
          <p className="text-sm leading-relaxed" style={{ color: "#50625A" }}>{f.desc}</p>

          {f.visual && (
            <div className="mt-6 rounded-2xl overflow-hidden relative flex items-center justify-center" style={{
              background: "linear-gradient(135deg, rgba(16,56,38,0.03), rgba(228,177,24,0.03))",
              border: "1px solid rgba(16,56,38,0.05)",
              aspectRatio: "16/10",
            }}>
              <img
                src={VISUAL_IMAGES[f.title]}
                alt={f.title}
                className="w-full h-full object-cover"
                style={{ display: "block" }}
              />
            </div>
          )}
        </div>
      </div>
    </Reveal>
  );
}

export default function FeaturesRecruiter() {
  return (
    <section id="fonctionnalites" className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(106,143,109,0.04), transparent 65%)", filter: "blur(40px)" }} />
      </div>
      <div className="max-w-6xl mx-auto px-6 relative" style={{ zIndex: 1 }}>
        <Reveal variant="up" className="text-center mb-16">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-[11px] font-semibold tracking-wide mb-6 backdrop-blur-sm" style={{
            borderColor: "rgba(228,177,24,0.2)",
            color: "#A38010",
            background: "rgba(228,177,24,0.06)",
          }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#E4B118" }} />
            Fonctionnalités
          </div>
          <h2 className="font-serif text-[clamp(2rem,3.5vw,3rem)] font-bold tracking-[-0.04em] leading-[1.08] mb-4" style={{ color: "#0B1F18" }}>
            Les 6 outils du <span style={{ color: "#E4B118" }}>recruteur augmenté</span>
          </h2>
          <p className="text-sm max-w-lg mx-auto" style={{ color: "#6A8F6D" }}>
            Chaque outil est conçu pour une tâche précise. Pas de bloat. Pas de courbe d&apos;apprentissage.
          </p>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-4 md:gap-5">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} f={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
