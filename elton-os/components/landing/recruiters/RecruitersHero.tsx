"use client";

import Link from "next/link";
import { Briefcase, ArrowRight, Sparkles } from "lucide-react";
import Reveal from "../Reveal";
import ImgSlot from "../ImgSlot";

export function RecruitersHero() {
  return (
    <section className="relative overflow-hidden min-h-[90vh] flex items-center">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-[-20%] left-[10%] w-[520px] h-[520px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(228,177,24,0.10), transparent 65%)", filter: "blur(40px)" }} />
        <div className="absolute bottom-[-15%] right-[5%] w-[460px] h-[460px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(106,143,109,0.08), transparent 65%)", filter: "blur(40px)" }} />
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-28 pb-16 md:pt-36 md:pb-20 w-full relative" style={{ zIndex: 2 }}>
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div className="relative z-10">
            <Reveal variant="up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-medium mb-6" style={{
                borderColor: "rgba(228,177,24,0.25)", color: "#A38010",
                background: "rgba(228,177,24,0.08)",
              }}>
                <Briefcase size={12} />
                Pour cabinets & recruteurs indépendants
              </div>
            </Reveal>

            <Reveal variant="up" delay={80}>
              <h1 className="text-[clamp(2.2rem,4.8vw,3.75rem)] font-extrabold leading-[1.05] tracking-[-0.04em] mb-5 font-serif" style={{ fontFamily: "Playfair Display, serif" }}>
                <span className="block text-[#0B1F18]">
                  Vous passez 3 heures à préparer un seul candidat.
                </span>
                <span className="block bg-gradient-to-r from-[#E4B118] via-[#F2C94C] to-[#E4B118] bg-clip-text text-transparent">
                  Et si ça prenait 8 minutes ?
                </span>
              </h1>
            </Reveal>

            <Reveal variant="up" delay={160}>
              <p className="text-base leading-relaxed mb-8 max-w-lg" style={{ color: "#50625A" }}>
                En moyenne, un recruteur passe 2 à 3 heures par candidat entre le reformatage du CV, la rédaction de la lettre de motivation, la vérification ATS, l&apos;audit LinkedIn et la préparation du brief d&apos;entretien. Multiplié par dix candidats en portefeuille, c&apos;est 25 heures perdues chaque semaine, du temps qui devrait être consacré à la relation client et au closing. PRSTO automatise l&apos;intégralité de cette chaîne en 8 minutes. Importez le CV du candidat, collez l&apos;offre client, et laissez l&apos;IA générer un dossier complet, formaté, prêt à envoyer. CV, lettre, scan ATS, audit LinkedIn, brief entretien : tout est prêt avant que votre café ne refroidisse.
              </p>
            </Reveal>

            <Reveal variant="up" delay={240}>
              <div className="flex flex-wrap items-center gap-3 mb-10">
                <Link href="/recruiter/dashboard"
                  className="group inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
                  style={{
                    background: "#103826", color: "#FFFDF8",
                    boxShadow: "0 4px 16px rgba(16,56,38,0.25)",
                    textDecoration: "none",
                  }}>
                  <Sparkles size={15} />
                  Découvrir l&apos;offre Pro
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
                <a href="#comparatif"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium border transition-all"
                  style={{ borderColor: "rgba(16,56,38,0.15)", color: "#50625A", textDecoration: "none" }}
                >
                  Voir le comparatif
                </a>
              </div>
            </Reveal>

            <Reveal variant="fade" delay={340}>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {[
                  { icon: "⏱️", label: "8 min par candidat" },
                  { icon: "📄", label: "CV + Lettre + ATS" },
                  { icon: "🤝", label: "Placement 2x plus rapide" },
                ].map((f) => (
                  <div key={f.label} className="flex items-center gap-1.5 text-xs" style={{ color: "#6A8F6D" }}>
                    <span>{f.icon}</span>
                    {f.label}
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          <Reveal variant="left" delay={200} className="relative">
            <ImgSlot
              num={1}
              format="vertical"
              prompt="Dashboard PRSTO vu de 3/4, dossier candidat ouvert, CV formaté à gauche, analyse ATS score 92% à droite."
              promptLong="Grand format vertical partie droite du hero. Interface PRSTO vue de 3/4 écran de dashboard avec dossier candidat ouvert. On voit un CV formaté élégant à gauche une analyse ATS avec score 92% à droite une barre latérale avec le logo PRSTO (un P stylisé ou un éclair). Ambiance premium professionnelle confiante. Dominante vert profond #0B1F18 avec accents dorés #E4B118. Éclairage doux. PAS de texte lisible. PAS de personnage. Juste l'interface. Style Apple-meets-banking."
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
