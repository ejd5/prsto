"use client";

import type { FC } from "react";
import Reveal from "./Reveal";
import { ProfileIcon, ClipboardIcon, BoltIcon, RocketIcon } from "@/components/ui/CustomIcons";

const STEPS: {
  num: string;
  icon: FC<{ size?: number; style?: React.CSSProperties }>;
  title: string;
  desc: string;
  color: string;
  img: string;
}[] = [
  {
    num: "01",
    icon: ProfileIcon,
    title: "Ajoutez un candidat",
    desc: "Importez son CV ou connectez son profil LinkedIn. PRSTO analyse son profil, ses compétences et son positionnement en 5 secondes.",
    color: "#103826",
    img: "/images/prsto/workflow-etape1.png",
  },
  {
    num: "02",
    icon: ClipboardIcon,
    title: "Collez l'offre client",
    desc: "L'URL ou le texte de l'offre. PRSTO identifie les mots-clés, les exigences cachées et les pièges ATS à éviter.",
    color: "#E4B118",
    img: "/images/prsto/workflow-etape2.png",
  },
  {
    num: "03",
    icon: BoltIcon,
    title: "Générez le dossier",
    desc: "CV adapté, lettre, analyse ATS, optimisation LinkedIn, brief entretien — tout est prêt en 8 minutes chrono.",
    color: "#6A8F6D",
    img: "/images/prsto/workflow-etape3.png",
  },
  {
    num: "04",
    icon: RocketIcon,
    title: "Placez votre candidat",
    desc: "Partagez le dossier complet via un lien privé. Votre candidat arrive préparé, vous gagnez le placement.",
    color: "#E4B118",
    img: "/images/prsto/workflow-etape4.png",
  },
];

export default function WorkflowRecruiter() {
  return (
    <section className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/3 left-0 w-72 h-72 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(228,177,24,0.04), transparent 65%)", filter: "blur(40px)" }} />
        <div className="absolute bottom-1/3 right-0 w-72 h-72 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(16,56,38,0.04), transparent 65%)", filter: "blur(40px)" }} />
      </div>
      <div className="max-w-6xl mx-auto px-6 relative" style={{ zIndex: 1 }}>
        <Reveal variant="up" className="text-center mb-16">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-[11px] font-semibold tracking-wide mb-6 backdrop-blur-sm" style={{
            borderColor: "rgba(16,56,38,0.1)",
            color: "#103826",
            background: "rgba(16,56,38,0.04)",
          }}>
            ✦ Workflow
          </div>
          <h2 className="font-serif text-[clamp(2rem,3.5vw,3rem)] font-bold tracking-[-0.04em] leading-[1.08] mb-4" style={{ color: "#0B1F18" }}>
            De l&apos;import au placement<br />en <span style={{ color: "#E4B118" }}>8 minutes</span>
          </h2>
          <p className="text-sm max-w-lg mx-auto" style={{ color: "#6A8F6D" }}>
            Pas de formation. Pas de manuel. Ton workflow tient en 4 étapes.
          </p>
        </Reveal>

        <div className="space-y-12 md:space-y-20">
          {STEPS.map((s, i) => {
            const isReversed = i % 2 === 1;
            return (
              <Reveal key={s.num} variant="up" delay={i * 80}>
                <div className="grid md:grid-cols-2 gap-6 md:gap-10 items-center">
                  {/* Text side */}
                  <div className={isReversed ? "md:order-2" : "md:order-1"}>
                    <div className="flex items-center gap-4 mb-5">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{
                          background: `${s.color}0a`,
                          border: `1px solid ${s.color}15`,
                        }}>
                          <s.icon size={28} style={{ color: s.color }} />
                        </div>
                        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold" style={{
                          background: s.color,
                          color: "#FFFDF8",
                          boxShadow: `0 4px 12px ${s.color}30`,
                        }}>
                          {s.num}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold tracking-widest" style={{ color: s.color }}>
                          ÉTAPE {s.num}
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold tracking-tight" style={{ color: "#0B1F18" }}>{s.title}</h3>
                      </div>
                    </div>
                    <p className="text-sm md:text-base leading-relaxed" style={{ color: "#50625A" }}>{s.desc}</p>
                  </div>

                  {/* Image side */}
                  <div className={`relative rounded-2xl overflow-hidden flex items-center justify-center ${isReversed ? "md:order-1" : "md:order-2"}`} style={{
                    border: "1px solid rgba(16,56,38,0.05)",
                    aspectRatio: "4/3",
                    background: "rgba(255,253,248,0.3)",
                    boxShadow: "0 8px 32px rgba(16,56,38,0.04)",
                  }}>
                    <img
                      src={s.img}
                      alt={`Étape ${s.num} : ${s.title}`}
                      className="w-full h-full object-cover"
                      style={{ display: "block" }}
                    />
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
