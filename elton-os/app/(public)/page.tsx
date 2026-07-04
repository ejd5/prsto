"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Crown, Building2, ArrowRight, Sparkles, Zap, Shield, Clock, TrendingUp, Check, BarChart3 } from "lucide-react";

const LHH_COMPARISON = [
  { criteria: "Disponibilité", lhh: "9h-18h, sur RDV", prsto: "24/7, instantané" },
  { criteria: "Analyse CV", lhh: "2-3 semaines (consultant)", prsto: "5 secondes (IA 35 points)" },
  { criteria: "Coût entreprise", lhh: "5 000-15 000€ par mission", prsto: "499€/mois illimité" },
  { criteria: "Approche", lhh: "Subjective (1 consultant)", prsto: "Data-driven (IA + RAG)" },
  { criteria: "Outils", lhh: "PDFs + entretiens", prsto: "13 outils executive-grade" },
  { criteria: "Confidentialité", lhh: "Limitée (consultant)", prsto: "Totale (100% digital)" },
];

const AUDIENCES = [
  {
    id: "executive",
    label: "Cadre Dirigeant",
    title: "Vous êtes cadre dirigeant",
    icon: Crown,
    color: "#E4B118",
    gradient: "linear-gradient(135deg, #082E1E 0%, #103826 100%)",
    pitch: "DG, CEO, CFO, COO, Country Manager — votre prochain poste de direction se prépare, ne se trouve pas.",
    cta: "Entrer dans l'espace Cadre Dirigeant",
    href: "/prsto",
    features: [
      "18 outils executive-grade (CV Master, ATS Scanner, Mock Interview Panel, Conseiller IA)",
      "Scoring IA 7 dimensions sur chaque opportunité",
      "Pipeline de candidatures structuré (6 à 18 mois de process)",
      "Conseiller IA avec mémoire RAG (votre second brain carrière)",
    ],
  },
  {
    id: "enterprise",
    label: "Entreprise",
    title: "Vous êtes une entreprise",
    icon: Building2,
    color: "#1E40AF",
    gradient: "linear-gradient(135deg, #1E3A8A 0%, #1E40AF 100%)",
    pitch: "Cabinets de recrutement, business schools, coaches, outplacement — proposez PRSTO en white-label à vos candidats.",
    cta: "Entrer dans l'espace Entreprise",
    href: "/prsto/enterprise",
    features: [
      "White-label complet (logo, couleurs, subdomain)",
      "13 outils IA executive-grade multi-langue (FR/EN/ES)",
      "Dashboard admin avec invitations et analytics",
      "70% de commission sur tous les paiements générés",
    ],
  },
];

export default function RouterHomePage() {
  const [selectedAudience, setSelectedAudience] = useState<"executive" | "enterprise" | null>(null);

  // Smooth scroll to audience details when selected
  useEffect(() => {
    if (selectedAudience) {
      const el = document.getElementById(`audience-${selectedAudience}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [selectedAudience]);

  return (
    <div className="min-h-screen" style={{ background: "var(--prsto-ivory)" }}>
      {/* ═══ HERO — Dark forest with 2 audience buttons ═══ */}
      <section
        className="relative overflow-hidden min-h-screen flex items-center justify-center py-20 px-4"
        style={{ background: "linear-gradient(135deg, #082E1E 0%, #103826 50%, #0B1F18 100%)" }}
      >
        {/* Aurora effects */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div
            className="absolute top-[-20%] left-[10%] w-[520px] h-[520px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(228,177,24,0.18), transparent 65%)", filter: "blur(50px)" }}
          />
          <div
            className="absolute bottom-[-15%] right-[5%] w-[460px] h-[460px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(106,143,109,0.15), transparent 65%)", filter: "blur(50px)" }}
          />
          <div
            className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(30,64,175,0.10), transparent 65%)", filter: "blur(60px)" }}
          />
        </div>

        <div className="max-w-5xl mx-auto relative text-center" style={{ zIndex: 2 }}>
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Image
              src="/branding/logo-prsto.png"
              alt="PRSTO"
              width={200}
              height={60}
              style={{ objectFit: "contain", filter: "brightness(0) invert(1)" }}
              priority
            />
          </div>

          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
            style={{
              background: "rgba(228,177,24,0.1)",
              border: "1px solid rgba(228,177,24,0.3)",
            }}
          >
            <Sparkles size={14} style={{ color: "#E4B118" }} />
            <span className="text-xs font-mono uppercase tracking-widest" style={{ color: "#F2C94C" }}>
              Copilote carrière IA · Premium · 100% digital
            </span>
          </div>

          {/* Headline */}
          <h1
            className="font-serif text-4xl md:text-6xl mb-5 leading-tight"
            style={{ fontFamily: "Playfair Display, serif", color: "#FAF6EF" }}
          >
            Votre carrière de cadre dirigeant,
            <br />
            <span
              className="bg-gradient-to-r from-[#E4B118] via-[#F2C94C] to-[#E4B118] bg-clip-text text-transparent"
              style={{ textShadow: "0 0 30px rgba(228,177,24,0.3)" }}
            >
              pilotée par l'IA.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base md:text-lg mb-12 max-w-2xl mx-auto" style={{ color: "rgba(250,246,239,0.75)" }}>
            PRSTO est le copilote carrière IA premium pour cadres dirigeants et les organisations qui les accompagnent.
            Choisissez votre espace pour continuer.
          </p>

          {/* 2 audience buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">
            {AUDIENCES.map((audience) => {
              const Icon = audience.icon;
              return (
                <Link
                  key={audience.id}
                  href={audience.href}
                  onClick={() => setSelectedAudience(audience.id as "executive" | "enterprise")}
                  className="group p-7 rounded-2xl transition-all hover:scale-[1.02] hover:shadow-2xl text-left"
                  style={{
                    background: "rgba(250,246,239,0.05)",
                    border: "1px solid rgba(250,246,239,0.15)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${audience.color}25` }}
                    >
                      <Icon size={22} style={{ color: audience.color }} />
                    </div>
                    <div>
                      <div
                        className="text-[10px] font-mono uppercase tracking-wide"
                        style={{ color: "rgba(250,246,239,0.5)" }}
                      >
                        Espace
                      </div>
                      <div
                        className="font-serif text-xl"
                        style={{ fontFamily: "Playfair Display, serif", color: "#FAF6EF" }}
                      >
                        {audience.label}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm mb-5" style={{ color: "rgba(250,246,239,0.7)" }}>
                    {audience.pitch}
                  </p>
                  <div
                    className="flex items-center gap-2 text-sm font-semibold transition-transform group-hover:translate-x-1"
                    style={{ color: audience.color }}
                  >
                    {audience.cta}
                    <ArrowRight size={14} />
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Trust signals */}
          <div className="mt-14 flex flex-wrap justify-center gap-x-8 gap-y-3 text-xs" style={{ color: "rgba(250,246,239,0.4)" }}>
            <div className="flex items-center gap-2">
              <Zap size={12} style={{ color: "#E4B118" }} />
              <span>13 outils IA</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 size={12} style={{ color: "#E4B118" }} />
              <span>35 points ATS</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={12} style={{ color: "#E4B118" }} />
              <span>24/7 instantané</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield size={12} style={{ color: "#E4B118" }} />
              <span>RGPD</span>
            </div>
            <div className="flex items-center gap-2">
              <Crown size={12} style={{ color: "#E4B118" }} />
              <span>Executive-grade</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ QUI SOMMES-NOUS ═══ */}
      <section className="py-20 px-4" style={{ background: "var(--prsto-white)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4"
              style={{ background: "rgba(228,177,24,0.1)" }}
            >
              <Crown size={12} style={{ color: "#E4B118" }} />
              <span className="text-xs font-mono uppercase tracking-wide" style={{ color: "#A38010" }}>
                Qui sommes-nous
              </span>
            </div>
            <h2
              className="font-serif text-3xl md:text-4xl mb-5"
              style={{ fontFamily: "Playfair Display, serif", color: "var(--prsto-forest)" }}
            >
              Le copilote carrière IA premium
              <br />
              pour cadres dirigeants.
            </h2>
            <p className="text-base max-w-3xl mx-auto" style={{ color: "var(--texte-secondaire)" }}>
              PRSTO est une plateforme 100% digitale qui met l'intelligence artificielle au service des cadres dirigeants
              (DG, CEO, CFO, COO, Country Manager) et des organisations qui les accompagnent (cabinets de recrutement,
              business schools, coaches, outplacement). Pas de consultants, pas de rendez-vous physiques, pas d'attente.
              Juste 13 outils IA executive-grade, disponibles 24/7, à un prix accessible.
            </p>
          </div>

          {/* 3 piliers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {[
              {
                icon: Zap,
                title: "Instantané",
                description: "5 secondes pour analyser un CV, 30 secondes pour générer une lettre, 2 minutes pour un mock interview. L'IA ne dort pas.",
                color: "#E4B118",
              },
              {
                icon: Crown,
                title: "Executive-grade",
                description: "Pensé pour les cadres dirigeants, pas pour les chercheurs d'emploi génériques. 12 signaux exec que les autres ignorent.",
                color: "#1E40AF",
              },
              {
                icon: TrendingUp,
                title: "Data-driven",
                description: "Chaque décision s'appuie sur vos données (RAG 1024-dim). Pas d'avis subjectif d'un consultant. Juste des faits chiffrés.",
                color: "#10B981",
              },
            ].map((pilier, i) => {
              const Icon = pilier.icon;
              return (
                <div
                  key={i}
                  className="p-6 rounded-2xl text-center"
                  style={{ background: "var(--prsto-ivory)", border: "1px solid var(--prsto-border)" }}
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: `${pilier.color}15` }}
                  >
                    <Icon size={24} style={{ color: pilier.color }} />
                  </div>
                  <h3
                    className="font-serif text-xl mb-2"
                    style={{ fontFamily: "Playfair Display, serif", color: "var(--prsto-forest)" }}
                  >
                    {pilier.title}
                  </h3>
                  <p className="text-sm" style={{ color: "var(--texte-secondaire)" }}>
                    {pilier.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ AUDIENCE DETAILS ═══ */}
      {AUDIENCES.map((audience) => {
        const Icon = audience.icon;
        return (
          <section
            key={audience.id}
            id={`audience-${audience.id}`}
            className="py-20 px-4"
            style={{ background: audience.id === "executive" ? "var(--prsto-ivory)" : "var(--prsto-white)" }}
          >
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                {/* Left: Pitch */}
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ background: `${audience.color}15` }}
                    >
                      <Icon size={22} style={{ color: audience.color }} />
                    </div>
                    <div>
                      <div className="text-xs font-mono uppercase tracking-wide" style={{ color: "var(--texte-tertiaire)" }}>
                        Espace
                      </div>
                      <h2
                        className="font-serif text-3xl"
                        style={{ fontFamily: "Playfair Display, serif", color: "var(--prsto-forest)" }}
                      >
                        {audience.label}
                      </h2>
                    </div>
                  </div>
                  <p className="text-base mb-6" style={{ color: "var(--texte-secondaire)" }}>
                    {audience.pitch}
                  </p>
                  <ul className="space-y-3 mb-8">
                    {audience.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm" style={{ color: "var(--texte)" }}>
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: audience.color }}
                        >
                          <Check size={12} style={{ color: "#FFF" }} />
                        </div>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={audience.href}
                    className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-semibold transition-transform hover:scale-105"
                    style={{
                      background: audience.id === "executive"
                        ? "var(--prsto-forest)"
                        : "linear-gradient(135deg, #1E40AF, #1E3A8A)",
                      color: "#FAF6EF",
                    }}
                  >
                    {audience.cta}
                    <ArrowRight size={14} />
                  </Link>
                </div>

                {/* Right: Visual */}
                <div
                  className="rounded-3xl p-8 relative overflow-hidden"
                  style={{ background: audience.gradient, minHeight: 320 }}
                >
                  <div className="absolute inset-0 pointer-events-none">
                    <div
                      className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] rounded-full"
                      style={{ background: `radial-gradient(circle, ${audience.color}40, transparent 65%)`, filter: "blur(40px)" }}
                    />
                  </div>
                  <div className="relative" style={{ zIndex: 2 }}>
                    <Icon size={48} style={{ color: audience.color }} />
                    <div className="mt-6 space-y-3">
                      {audience.id === "executive" ? (
                        <>
                          <div className="p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.08)" }}>
                            <div className="text-xs font-mono uppercase mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                              Score offre
                            </div>
                            <div className="text-2xl font-bold" style={{ color: "#E4B118" }}>87/100</div>
                          </div>
                          <div className="p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.08)" }}>
                            <div className="text-xs font-mono uppercase mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                              CV ATS
                            </div>
                            <div className="text-2xl font-bold" style={{ color: "#10B981" }}>35/35 ✓</div>
                          </div>
                          <div className="p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.08)" }}>
                            <div className="text-xs font-mono uppercase mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                              Entretiens préparés
                            </div>
                            <div className="text-2xl font-bold" style={{ color: "#FAF6EF" }}>5 rôles Comex</div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.08)" }}>
                            <div className="text-xs font-mono uppercase mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                              Membres actifs
                            </div>
                            <div className="text-2xl font-bold" style={{ color: "#FAF6EF" }}>100 sièges</div>
                          </div>
                          <div className="p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.08)" }}>
                            <div className="text-xs font-mono uppercase mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                              Commission
                            </div>
                            <div className="text-2xl font-bold" style={{ color: "#10B981" }}>70%</div>
                          </div>
                          <div className="p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.08)" }}>
                            <div className="text-xs font-mono uppercase mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                              White-label
                            </div>
                            <div className="text-2xl font-bold" style={{ color: "#E4B118" }}>Logo + couleurs</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })}

      {/* ═══ DIFFÉRENCIATION vs LHH ═══ */}
      <section
        className="py-20 px-4"
        style={{ background: "linear-gradient(135deg, #082E1E 0%, #103826 100%)" }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4"
              style={{ background: "rgba(228,177,24,0.1)", border: "1px solid rgba(228,177,24,0.3)" }}
            >
              <Zap size={12} style={{ color: "#E4B118" }} />
              <span className="text-xs font-mono uppercase tracking-wide" style={{ color: "#F2C94C" }}>
                Pourquoi PRSTO vs cabinets traditionnels
              </span>
            </div>
            <h2
              className="font-serif text-3xl md:text-4xl mb-3"
              style={{ fontFamily: "Playfair Display, serif", color: "#FAF6EF" }}
            >
              L'IA premium vs le cabinet physique
            </h2>
            <p className="text-sm max-w-2xl mx-auto" style={{ color: "rgba(250,246,239,0.7)" }}>
              LHH, Michael Page, Page Executive : 350 collaborateurs, des semaines d'attente, des coûts de 5 000-15 000€ par mission.
              PRSTO : 13 outils IA, 5 secondes, 499€/mois. Voilà la différence.
            </p>
          </div>

          <div className="rounded-3xl overflow-hidden" style={{ background: "rgba(250,246,239,0.05)", border: "1px solid rgba(250,246,239,0.1)" }}>
            <div className="grid grid-cols-3 text-sm">
              {/* Header */}
              <div className="p-5" style={{ background: "rgba(250,246,239,0.05)" }}>
                <span className="text-xs font-mono uppercase tracking-wide" style={{ color: "rgba(250,246,239,0.5)" }}>
                  Critère
                </span>
              </div>
              <div className="p-5 text-center" style={{ background: "rgba(250,246,239,0.05)" }}>
                <span className="text-xs font-mono uppercase tracking-wide" style={{ color: "rgba(250,246,239,0.5)" }}>
                  Cabinet traditionnel (LHH)
                </span>
              </div>
              <div className="p-5 text-center" style={{ background: "rgba(228,177,24,0.08)" }}>
                <span className="text-xs font-mono uppercase tracking-wide" style={{ color: "#F2C94C" }}>
                  ✦ PRSTO
                </span>
              </div>

              {LHH_COMPARISON.map((row, i) => (
                <div key={i} className="contents">
                  <div className="p-4 border-t font-medium" style={{ borderColor: "rgba(250,246,239,0.1)", color: "#FAF6EF" }}>
                    {row.criteria}
                  </div>
                  <div className="p-4 border-t text-center" style={{ borderColor: "rgba(250,246,239,0.1)", color: "rgba(250,246,239,0.6)" }}>
                    {row.lhh}
                  </div>
                  <div
                    className="p-4 border-t text-center font-semibold"
                    style={{ borderColor: "rgba(250,246,239,0.1)", color: "#FAF6EF", background: "rgba(228,177,24,0.04)" }}
                  >
                    {row.prsto}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-10">
            <Link
              href="/prsto"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-semibold transition-transform hover:scale-105"
              style={{ background: "linear-gradient(135deg, #E4B118, #F2C94C)", color: "#082E1E" }}
            >
              <Sparkles size={16} />
              Découvrir PRSTO
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="py-10 px-4 text-center" style={{ background: "var(--prsto-white)", borderTop: "1px solid var(--prsto-border)" }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-4">
            <Image
              src="/branding/logo-prsto.png"
              alt="PRSTO"
              width={140}
              height={42}
              style={{ objectFit: "contain" }}
            />
          </div>
          <p className="text-xs mb-4" style={{ color: "var(--texte-tertiaire)" }}>
            PRSTO — Le copilote carrière IA premium pour cadres dirigeants. 100% digital, 100% IA, 100% executive-grade.
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs" style={{ color: "var(--texte-tertiaire)" }}>
            <Link href="/prsto" className="hover:underline" style={{ color: "var(--prsto-forest)" }}>
              Espace Cadre Dirigeant
            </Link>
            <Link href="/prsto/enterprise" className="hover:underline" style={{ color: "var(--prsto-forest)" }}>
              Espace Entreprise
            </Link>
            <Link href="/prsto/manifeste" className="hover:underline" style={{ color: "var(--prsto-forest)" }}>
              Manifeste
            </Link>
            <Link href="/prsto/blog" className="hover:underline" style={{ color: "var(--prsto-forest)" }}>
              Blog
            </Link>
            <Link href="/login" className="hover:underline" style={{ color: "var(--prsto-forest)" }}>
              Connexion
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
