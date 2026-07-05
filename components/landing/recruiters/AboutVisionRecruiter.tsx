"use client";

import Reveal from "../Reveal";
import { Lightbulb, Target, TrendingUp, Users } from "lucide-react";
import ImgSlot from "../ImgSlot";
import { PrstoLogo } from "../PrstoLogo";

const MILESTONES = [
  {
    year: "2024",
    title: "naît pour les candidats",
    desc: "Un outil pour aider les chercheurs d'emploi à préparer leurs candidatures en 8 minutes. CV, lettre, ATS, LinkedIn, Brief. Le constat est immédiat : les recruteurs nous regardent aussi.",
    showLogo: true,
  },
  {
    year: "2025",
    title: "Le tournant B2B",
    desc: "Les recruteurs indépendants et cabinets nous interpellent : 'Et pour nous ?'. PRSTO devient aussi un outil de préparation de candidats pour les pros du recrutement.",
  },
  {
    year: "2026",
    title: "Recruteur la plateforme autonome",
    desc: "CV Formatter, Lettre, ATS Scanner, LinkedIn Optimizer, Market Radar, Brief Entretien. Un seul abonnement, tous les outils. Et une mission : rendre chaque recruteur autonome.",
    showLogo: true,
  },
];

const VALUES = [
  {
    icon: Target,
    title: "Autonomie avant tout",
    desc: "Nous croyons que chaque recruteur devrait pouvoir travailler à son compte, sans dépendre d'un cabinet, d'une franchise ou d'outils coûteux. La technologie doit libérer, pas enfermer.",
    color: "#103826",
  },
  {
    icon: TrendingUp,
    title: "Plus de placements, moins d'effort",
    desc: "Quand la préparation manuelle tombe de 3h à 8 minutes, vous pouvez traiter 3 à 5 fois plus de candidats. Et vos candidats arrivent mieux préparés, ce qui multiplie votre taux de placement.",
    color: "#E4B118",
  },
  {
    icon: Users,
    title: "Une communauté, pas un réseau",
    desc: "Pas de franchise, pas de redevance. Nous construisons une communauté de recruteurs autonomes qui partagent les mêmes outils, les mêmes standards et une vision commune du recrutement.",
    color: "#6A8F6D",
  },
];

export function AboutVisionRecruiter() {
  return (
    <section id="vision" className="py-28">
      <div className="max-w-6xl mx-auto px-6">
        <Reveal variant="up" className="text-center mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11.5px] font-semibold tracking-wide mb-5" style={{
            borderColor: "rgba(16,56,38,0.12)", color: "#103826",
            background: "rgba(16,56,38,0.06)",
          }}>
            ✦ Notre vision
          </div>
          <h2 className="font-serif text-[clamp(1.875rem,3.5vw,2.875rem)] font-bold tracking-[-0.04em] leading-[1.08] mb-3 text-[#0B1F18] flex items-center justify-center gap-3 flex-wrap">
            <span>L&apos;histoire de</span>
            <PrstoLogo size={110} style={{ verticalAlign: "middle" }} />
          </h2>
          <p className="text-sm max-w-xl mx-auto" style={{ color: "#6A8F6D" }}>
            De la frustration d&apos;un marché à une solution qui change la donne.
          </p>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {MILESTONES.map((m, i) => (
            <Reveal variant="up" delay={i * 100} key={m.year}>
              <div className="rounded-2xl border p-7 h-full" style={{
                borderColor: "rgba(16,56,38,0.06)", background: "#FFFDF8",
              }}>
                <div className="text-[11px] font-bold tracking-widest mb-3" style={{ color: "#E4B118" }}>{m.year}</div>
                {('showLogo' in m) && m.showLogo && (
                  <div className="mb-3">
                    <PrstoLogo size={100} />
                  </div>
                )}
                <h3 className="text-base font-bold mb-2" style={{ color: "#0B1F18" }}>{m.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#50625A" }}>{m.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal variant="up" delay={50} className="mb-12">
          <ImgSlot
            num={3}
            format="banner"
            prompt="Timeline visuelle 3 vignettes : 2024 candidat seul → 2025 recruteur+candidat → 2026 écran PRSTO lumineux."
            promptLong="Bannière Notre Vision récit visuel. Composition split en 3 vignettes horizontales comme une timeline. 2024 un candidat seul devant son CV papier tons plus froids. 2025 un recruteur et un candidat qui se serrent la main tons neutres. 2026 un recruteur souriant devant un écran PRSTO lumineux avec plusieurs profils tons chauds dorés. Chaque vignette séparée par une fine ligne dorée #E4B118. Fond global dégradé de #0B1F18 vers #103826. Style narratif cinématique épuré."
          />
        </Reveal>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {VALUES.map((v, i) => (
            <Reveal variant="up" delay={i * 80} key={v.title}>
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{
                  background: `${v.color}12`, border: `1px solid ${v.color}20`,
                }}>
                  <v.icon size={26} style={{ color: v.color }} />
                </div>
                <h3 className="text-base font-bold mb-2" style={{ color: "#0B1F18" }}>{v.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#50625A" }}>{v.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal variant="up" delay={200}>
          <div className="rounded-2xl border overflow-hidden" style={{
            borderColor: "rgba(16,56,38,0.08)", background: "#FFFDF8",
          }}>
            <div className="md:grid md:grid-cols-5 gap-0">
              <div className="p-8 md:p-10 md:col-span-3 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-4 w-fit" style={{
                  borderColor: "rgba(228,177,24,0.2)",
                  background: "rgba(228,177,24,0.08)",
                }}>
                  <Lightbulb size={12} style={{ color: "#A38010" }} />
                  <span className="text-[11px] font-semibold tracking-wide" style={{ color: "#A38010" }}>Pourquoi</span>
                  <PrstoLogo size={50} />
                </div>
                <h3 className="text-2xl font-bold tracking-tight mb-3 font-serif" style={{ color: "#0B1F18", fontFamily: "Playfair Display, serif" }}>
                  Le recrutement est un métier d&apos;accompagnement.
                </h3>
                <p className="text-sm leading-relaxed mb-4" style={{ color: "#50625A" }}>
                  Pourtant, les recruteurs passent leur temps sur des tâches administratives : 
                  formater des CV, rédiger des lettres, vérifier la compatibilité ATS. Du temps 
                  qui devrait être consacré aux candidats et aux clients.
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "#50625A" }}>
                  PRSTO libère le recruteur de la paperasse pour qu&apos;il puisse faire ce 
                  qu&apos;il fait de mieux : <strong style={{ color: "#0B1F18" }}>trouver et placer des talents</strong>.
                  Pas besoin d&apos;être un cabinet de 50 personnes pour avoir des outils professionnels.
                </p>
              </div>
              <div className="md:col-span-2 relative min-h-[200px] md:min-h-full" style={{
                background: "#103826",
              }}>
                <img
                  src="/branding/landing1.png"
                  alt="PRSTO Vision"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-t" style={{ borderColor: "rgba(16,56,38,0.06)" }}>
              {[
                { stat: "10 000+", label: "recruteurs indépendants en France", color: "#103826" },
                { stat: "20+ ans", label: "d'expérience en transformation RH", color: "#E4B118" },
                { stat: "3h → 8 min", label: "temps préparation / candidat", color: "#6A8F6D" },
                { stat: "99$/mois", label: "tous les outils inclus", color: "#103826" },
              ].map((s) => (
                <div key={s.label} className="p-4 md:p-5 text-center" style={{
                  borderRight: "1px solid rgba(16,56,38,0.06)",
                }}>
                  <div className="text-2xl md:text-3xl font-extrabold font-serif mb-0.5" style={{ color: s.color, fontFamily: "Playfair Display, serif" }}>
                    {s.stat}
                  </div>
                  <div className="text-[11px] leading-snup" style={{ color: "#6A8F6D" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
