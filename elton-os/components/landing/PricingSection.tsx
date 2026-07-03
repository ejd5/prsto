"use client";

import { useState } from "react";
import Image from "next/image";
import Reveal from "./Reveal";

type Period = "semaine" | "mois" | "3mois" | "6mois";

const PERIODS: { key: Period; label: string; price: number; suffix: string; savings: string | null }[] = [
  { key: "semaine", label: "Semaine", price: 9.90, suffix: "/sem", savings: null },
  { key: "mois", label: "Mois", price: 39.90, suffix: "/mois", savings: "−7%" },
  { key: "3mois", label: "3 mois", price: 89.90, suffix: "/3 mois", savings: "−25%" },
  { key: "6mois", label: "6 mois", price: 149.90, suffix: "/6 mois", savings: "−37%" },
];

const FREE_FEATURES = [
  "ATS Scanner (5 analyses / mois)",
  "CV Optimizer (3 optimisations / mois)",
  "Pipeline Kanban basique",
  "Market Radar (lecture seule)",
  "Panel : 1 simulation / mois",
  "1 profil",
];

const PRO_FEATURES = [
  "ATS Scanner illimité",
  "CV Optimizer illimité",
  "LinkedIn Optimizer avancé",
  "Panel (simulations illimitées)",
  "CRM Recruteur + Pipeline Kanban",
  "Market Radar temps réel",
  "Lettres sur-mesure illimitées",
  "Extension Chrome (17 plateformes)",
  "Analyses IA illimitées",
];

const ELITE_FEATURES = [
  "Tout PRSTO+, en illimité",
  "Conseiller IA — second brain (mémoire longue)",
  "Mock Interview Panel complet (5 rôles Comex)",
  "Market Radar temps réel + alertes WhatsApp",
  "Coaching humain 1h/mois avec un ex-DG",
  "Accès anticipé nouvelles sources d'offres",
  "Boardroom Simulator (pitch Comex 100 jours)",
  "Support prioritaire 7j/7",
  "Revue de CV par un coach executive",
];

export default function PricingSection() {
  const [period, setPeriod] = useState<Period>("mois");
  const [showBriefModal, setShowBriefModal] = useState(false);
  const [showPanelModal, setShowPanelModal] = useState(false);
  
  const active = PERIODS.find((p) => p.key === period)!;

  return (
    <section id="tarifs" className="py-28 relative"
      style={{
        backgroundImage: "url('/pricing-bg.png')",
        backgroundSize: "100% 100%",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}>
      <div className="max-w-6xl mx-auto px-6">
        <Reveal variant="up" className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11.5px] font-semibold tracking-wide mb-5" style={{
            borderColor: "rgba(16,56,38,0.12)", color: "#103826",
            background: "rgba(16,56,38,0.06)",
          }}>
            ✦ Tarifs
          </div>
          <h2 className="font-serif text-[clamp(1.875rem,3.5vw,2.875rem)] font-bold tracking-[-0.04em] leading-[1.08] mb-3 text-[#0B1F18]">
            Investissez dans votre<br />prochaine opportunité.
          </h2>
          <p className="text-sm max-w-lg mx-auto" style={{ color: "#6A8F6D" }}>
            Sans surprise. Sans engagement. Résiliez à tout moment depuis votre compte.
          </p>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto items-start">
          {/* ── Free ── */}
          <Reveal variant="up" delay={0}>
            <div className="rounded-3xl border p-8 flex flex-col h-full transition-all duration-300 hover:-translate-y-1 shadow-sm" style={{
              borderColor: "rgba(16,56,38,0.05)",
              background: "#FFFFFF",
            }}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#6A8F6D" }}>
                Gratuit
              </div>
              <div className="text-5xl font-extrabold tracking-[-0.04em] mb-1 text-[#0B1F18]" style={{ fontFamily: "Playfair Display, serif" }}>
                0€
              </div>
              <p className="text-xs mb-7" style={{ color: "#6A8F6D" }}>
                Pour découvrir PRSTO sans risque.
              </p>
              <div className="h-px mb-6" style={{ background: "rgba(16,56,38,0.06)" }} />
              <ul className="space-y-2.5 mb-7 flex-1">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: "#50625A" }}>
                    <span className="w-[18px] h-[18px] rounded-md flex items-center justify-center flex-shrink-0 text-[9px] font-bold" style={{
                      background: "rgba(16,56,38,0.08)", border: "1px solid rgba(16,56,38,0.12)", color: "#103826",
                    }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a href="/demarrage" className="block text-center py-3 px-6 rounded-xl text-sm font-bold transition-all border" style={{
                borderColor: "rgba(16,56,38,0.15)", color: "#103826", textDecoration: "none",
              }}>
                Commencer gratuitement
              </a>
            </div>
          </Reveal>

          {/* ── PRSTO+ ── */}
          <Reveal variant="up" delay={90}>
            <div className="relative rounded-3xl border p-8 flex flex-col h-full transition-all duration-300 hover:-translate-y-1" style={{
              borderColor: "rgba(228,177,24,0.25)",
              background: "rgba(228,177,24,0.03)",
              boxShadow: "0 20px 60px rgba(228,177,24,0.1)",
            }}>
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9.5px] font-bold tracking-wide mb-3 w-fit" style={{
                background: "rgba(228,177,24,0.1)", border: "1px solid rgba(228,177,24,0.15)", color: "#A38010",
              }}>
                ⚡ Le plus populaire
              </div>

              <div className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#A38010" }}>
                PRSTO+
              </div>

              <div className="flex flex-wrap gap-1 mb-4" style={{ maxWidth: "100%" }}>
                {PERIODS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setPeriod(p.key)}
                    className="text-[10.5px] font-semibold px-2.5 py-1.5 rounded-lg transition-all tracking-tight"
                    style={{
                      background: period === p.key ? "rgba(228,177,24,0.12)" : "rgba(16,56,38,0.03)",
                      color: period === p.key ? "#A38010" : "#6A8F6D",
                      border: `1px solid ${period === p.key ? "rgba(228,177,24,0.2)" : "rgba(16,56,38,0.08)"}`,
                    }}
                  >
                    {p.label}
                    {p.savings && (
                      <span className="ml-1 text-[8.5px] font-bold" style={{ color: "#103826" }}>
                        {p.savings}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="text-5xl font-extrabold tracking-[-0.04em] mb-1 text-[#0B1F18]" style={{ fontFamily: "Playfair Display, serif" }}>
                {active.price.toFixed(2)}€
                <span className="text-xs font-normal text-gray-500 uppercase tracking-wider ml-1">
                  {active.suffix}
                </span>
              </div>
              <p className="text-xs mb-7" style={{ color: "#6A8F6D" }}>
                Accès complet aux modules et intégration IA complète.
              </p>

              <div className="h-px mb-6" style={{ background: "rgba(16,56,38,0.06)" }} />
              <ul className="space-y-2.5 mb-7 flex-1">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: "#50625A" }}>
                    <span className="w-[18px] h-[18px] rounded-md flex items-center justify-center flex-shrink-0 text-[9px] font-bold" style={{
                      background: "rgba(16,56,38,0.08)", border: "1px solid rgba(16,56,38,0.12)", color: "#103826",
                    }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <a href="/demarrage" className="group block text-center py-3 px-6 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5" style={{
                background: "#E4B118", color: "#082E1E",
                border: "none",
                textDecoration: "none",
              }}>
                Souscrire à PRSTO+
              </a>
            </div>
          </Reveal>

          {/* ── Elite (pour dirigeants) ── */}
          <Reveal variant="up" delay={180}>
            <div className="relative rounded-3xl border-2 p-8 flex flex-col h-full transition-all duration-300 hover:-translate-y-1" style={{
              borderColor: "#0E3A29",
              background: "linear-gradient(180deg, #0E3A29 0%, #0B2E21 100%)",
              boxShadow: "0 24px 70px rgba(14,58,41,0.25)",
            }}>
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9.5px] font-bold tracking-wide mb-3 w-fit" style={{
                background: "rgba(228,177,24,0.18)", border: "1px solid rgba(228,177,24,0.35)", color: "#F2C94C",
              }}>
                ★ Pour les DG / CEO en transition
              </div>

              <div className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#F2C94C" }}>
                PRSTO Elite
              </div>

              <div className="text-5xl font-extrabold tracking-[-0.04em] mb-1" style={{ fontFamily: "Playfair Display, serif", color: "#FFFDF8" }}>
                149€
                <span className="text-xs font-normal uppercase tracking-wider ml-1" style={{ color: "rgba(250,246,239,0.5)" }}>
                  /mois
                </span>
              </div>
              <p className="text-xs mb-7" style={{ color: "rgba(250,246,239,0.65)" }}>
                Pour les dirigeants qui pilotent leur campagne comme un projet d'entreprise.
              </p>

              <div className="h-px mb-6" style={{ background: "rgba(250,246,239,0.1)" }} />
              <ul className="space-y-2.5 mb-7 flex-1">
                {ELITE_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: "rgba(250,246,239,0.85)" }}>
                    <span className="w-[18px] h-[18px] rounded-md flex items-center justify-center flex-shrink-0 text-[9px] font-bold" style={{
                      background: "rgba(228,177,24,0.15)", border: "1px solid rgba(228,177,24,0.3)", color: "#F2C94C",
                    }}>★</span>
                    {f}
                  </li>
                ))}
              </ul>

              <a href="/demarrage?plan=elite" className="block text-center py-3 px-6 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5" style={{
                background: "linear-gradient(135deg, #E4B118 0%, #F2C94C 100%)", color: "#082E1E",
                border: "none",
                textDecoration: "none",
                boxShadow: "0 4px 16px rgba(228,177,24,0.4)",
              }}>
                Passer Elite
              </a>
              <p className="text-[10px] text-center mt-3" style={{ color: "rgba(250,246,239,0.4)" }}>
                Sans engagement • Résiliable à tout moment
              </p>
            </div>
          </Reveal>
        </div>

        {/* ── Executive Brief one-shot ── */}
        <Reveal variant="up" delay={90}>
          <div className="max-w-5xl mx-auto mt-6 rounded-2xl border p-6 md:p-8 flex flex-col md:flex-row items-center gap-5 md:gap-8 transition-all duration-300 hover:-translate-y-0.5 group relative" style={{
            borderColor: "rgba(228,177,24,0.3)",
            background: "#0E3A29",
          }}>
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9.5px] font-bold tracking-wide mb-3" style={{
                background: "rgba(228,177,24,0.15)", border: "1px solid rgba(228,177,24,0.25)", color: "#F2B11A",
              }}>
                ⚡ Sans abonnement
              </div>
              <div className="text-xl font-bold tracking-[-0.03em] mb-1" style={{ color: "#FFFDF8" }}>
                Executive Brief
              </div>
              <p className="text-xs" style={{ color: "rgba(250,246,239,0.6)" }}>
                Dossier de préparation entretien complet — livré sous 24h.
              </p>
            </div>
            
            <div className="text-center md:text-right flex-shrink-0">
              <div className="text-3xl font-extrabold tracking-[-0.04em] mb-0.5" style={{ fontFamily: "Playfair Display, serif", color: "#FFFDF8" }}>
                29,90€
                <span className="text-sm font-normal align-baseline" style={{ color: "rgba(250,246,239,0.5)" }}>
                  /une fois
                </span>
              </div>
              <p className="text-[11px] mb-3" style={{ color: "rgba(250,246,239,0.5)" }}>
                15-20 pages · Audit LinkedIn · Kit négociation
              </p>
              
              <div className="flex justify-center md:justify-end gap-2">
                <button
                  onClick={() => setShowBriefModal(true)}
                  className="py-2.5 px-4 rounded-xl text-[13px] font-bold border transition-all"
                  style={{
                    borderColor: "rgba(250,246,239,0.2)", color: "#FFFDF8", background: "rgba(250,246,239,0.05)"
                  }}
                >
                  Aperçu du dossier 🔍
                </button>

                <a href="/prsto/executive-brief" className="inline-block py-2.5 px-6 rounded-xl text-[13px] font-bold transition-all hover:-translate-y-0.5" style={{
                  background: "#E4B118", color: "#082E1E",
                  border: "none", textDecoration: "none",
                }}>
                  Commander
                </a>
              </div>
            </div>
          </div>
        </Reveal>

        {/* ── Panel one-shot ── */}
        <Reveal variant="up" delay={90}>
          <div className="max-w-5xl mx-auto mt-4 rounded-2xl border p-6 md:p-8 flex flex-col md:flex-row items-center gap-5 md:gap-8 transition-all duration-300 hover:-translate-y-0.5 group relative" style={{
            borderColor: "rgba(228,177,24,0.2)",
            background: "#0E3A29",
          }}>
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9.5px] font-bold tracking-wide mb-3" style={{
                background: "rgba(228,177,24,0.15)", border: "1px solid rgba(228,177,24,0.25)", color: "#F2B11A",
              }}>
                ⚡ Sans abonnement
              </div>
              <div className="text-xl font-bold tracking-[-0.03em] mb-1" style={{ color: "#FFFDF8" }}>
                Panel
              </div>
              <p className="text-xs" style={{ color: "rgba(250,246,239,0.6)" }}>
                Simulation d&apos;entretien vidéo avec un panel IA. Questions sur-mesure, analyse posture, audit complet.
              </p>
            </div>
            
            <div className="text-center md:text-right flex-shrink-0">
              <div className="text-3xl font-extrabold tracking-[-0.04em] mb-0.5" style={{ fontFamily: "Playfair Display, serif", color: "#FFFDF8" }}>
                14,90€
                <span className="text-sm font-normal align-baseline" style={{ color: "rgba(250,246,239,0.5)" }}>
                  /session
                </span>
              </div>
              <p className="text-[11px] mb-3" style={{ color: "rgba(250,246,239,0.5)" }}>
                Panel de 6 experts · 8 langues · Audit 5 dimensions
              </p>
              
              <div className="flex justify-center md:justify-end gap-2">
                <button
                  onClick={() => setShowPanelModal(true)}
                  className="py-2.5 px-4 rounded-xl text-[13px] font-bold border transition-all"
                  style={{
                    borderColor: "rgba(250,246,239,0.2)", color: "#FFFDF8", background: "rgba(250,246,239,0.05)"
                  }}
                >
                  Aperçu du simulateur 📺
                </button>

                <a href="/mock-interview" className="inline-block py-2.5 px-6 rounded-xl text-[13px] font-bold transition-all hover:-translate-y-0.5" style={{
                  background: "#E4B118", color: "#082E1E",
                  border: "none", textDecoration: "none",
                }}>
                  Lancer la session
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      {/* ── Global Centered Modal for Executive Brief ── */}
      {showBriefModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#081F15]/80 backdrop-blur-md" onClick={() => setShowBriefModal(false)} />
          <div className="relative w-full max-w-[680px] rounded-3xl border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-250 text-left"
            style={{
              background: "radial-gradient(circle at top, #144431 0%, #081F15 100%)",
              borderColor: "#F2B11A",
              borderWidth: "1.5px",
              color: "#FFFDF8",
            }}>
            
            {/* Close Button */}
            <button
              onClick={() => setShowBriefModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full border flex items-center justify-center transition-all bg-white/5 hover:bg-white/10"
              style={{ borderColor: "rgba(250,246,239,0.2)", color: "#FFFDF8" }}
              aria-label="Fermer"
            >
              ✕
            </button>

            {/* Top Vector Ornaments */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20" style={{
              backgroundImage: "radial-gradient(circle at 10% 20%, rgba(242, 177, 26, 0.15) 0%, transparent 40%)"
            }} />

            <div className="p-8 relative z-10">
              {/* Modal Header */}
              <div className="flex justify-center items-center flex-col text-center mb-6">
                <div className="flex items-center gap-1.5 mb-4">
                  <Image src="/branding/logo-prsto.png" alt="PRSTO" width={110} height={35} style={{ objectFit: "contain", filter: "brightness(0) invert(1)" }} />
                </div>
                <h4 className="font-serif font-semibold text-2xl md:text-3xl tracking-tight leading-tight" style={{ color: "#FFFDF8" }}>
                  Votre avantage décisif.<br/>
                  <span style={{ color: "#F2B11A" }}>Notre expertise exécutive.</span>
                </h4>
                <p className="text-xs max-w-md mt-3 leading-relaxed" style={{ color: "rgba(250, 246, 239, 0.7)" }}>
                  Le Dossier Executive Brief est un livrable stratégique de 15 à 20 pages, conçu spécifiquement pour transformer votre entretien en succès.
                </p>
              </div>

              {/* 4 Pillars Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                  { icon: "🎯", title: "Audit de l'offre", desc: "Analyse complète du poste, des attentes et des enjeux clés." },
                  { icon: "🔍", title: "Questions types", desc: "Questions stratégiques du Conseil et réponses structurées STAR." },
                  { icon: "📊", title: "Analyse financière", desc: "Chiffres clés de l'entreprise et leviers de négociation identifiés." },
                  { icon: "👑", title: "Stratégie de pitch", desc: "Angle d'attaque percutant et plan d'influence pour convaincre le Board." }
                ].map((p, idx) => (
                  <div key={idx} className="p-4 rounded-xl border text-center flex flex-col items-center justify-between" style={{
                    borderColor: "rgba(242,177,26,0.15)",
                    background: "rgba(250,246,239,0.03)"
                  }}>
                    <span className="text-xl mb-2">{p.icon}</span>
                    <strong className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: "#F2B11A" }}>{p.title}</strong>
                    <p className="text-[10px] leading-relaxed text-gray-300">{p.desc}</p>
                  </div>
                ))}
              </div>

              {/* Lower Brief Summary Block */}
              <div className="bg-white/95 rounded-2xl p-5 text-[#0B1F18] border border-[#F2B11A]/20 shadow-inner mb-6">
                <div className="text-[11px] font-bold text-center uppercase tracking-widest text-[#0E3A29] mb-4">Aperçu de votre brief</div>
                
                <div className="flex flex-col md:flex-row items-center gap-5 justify-between">
                  {/* Brief Cover Mockup */}
                  <div className="w-[110px] h-[130px] rounded-lg shadow-md relative overflow-hidden flex-shrink-0 flex flex-col justify-between p-3 text-white" style={{
                    background: "linear-gradient(135deg, #0E3A29 0%, #1F4A34 100%)",
                    border: "1px solid rgba(242, 177, 26, 0.3)"
                  }}>
                    <Image src="/branding/logo-prsto.png" alt="PRSTO" width={60} height={20} style={{ objectFit: "contain", filter: "brightness(0) invert(1)" }} />
                    <div>
                      <strong className="text-[9px] uppercase tracking-wider block text-[#F2B11A]">Executive Brief</strong>
                      <span className="text-[7px] opacity-60">Confidentiel</span>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="flex-1 grid grid-cols-3 gap-3 w-full">
                    <div className="text-center border-r border-gray-100 px-1">
                      <span className="text-lg">📁</span>
                      <strong className="text-xs block mt-1">18</strong>
                      <span className="text-[9px] text-gray-500 uppercase block">Pages</span>
                      <span className="text-[8px] text-gray-400 block mt-0.5 leading-none">Contenu stratégique sur-mesure</span>
                    </div>
                    <div className="text-center border-r border-gray-100 px-1">
                      <span className="text-lg">🎯</span>
                      <strong className="text-xs block mt-1">92%</strong>
                      <span className="text-[9px] text-gray-500 uppercase block">Pertinence</span>
                      <span className="text-[8px] text-gray-400 block mt-0.5 leading-none">Aligné avec le poste et l&apos;entreprise</span>
                    </div>
                    <div className="text-center px-1">
                      <span className="text-lg">⏱️</span>
                      <strong className="text-xs block mt-1">≤ 24h</strong>
                      <span className="text-[9px] text-gray-500 uppercase block">Livraison</span>
                      <span className="text-[8px] text-gray-400 block mt-0.5 leading-none">Livré prêt à l&apos;impression sous 24h</span>
                    </div>
                  </div>
                </div>

                {/* Blockquote Quote */}
                <div className="mt-4 text-center text-[11px] italic text-[#50625A] border-t border-gray-100 pt-3">
                  &ldquo; Un document pensé par des experts pour vous positionner comme le candidat incontournable. &rdquo;
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="space-y-2.5">
                <a href="/prsto/executive-brief" className="w-full text-center py-3 px-6 rounded-xl text-[13px] font-bold transition-all hover:brightness-110 flex items-center justify-center gap-2 shadow-lg" style={{
                  background: "linear-gradient(135deg, #F2B11A 0%, #D49A0E 100%)", color: "#082E1E",
                  border: "none", textDecoration: "none",
                }}>
                  👑 COMMANDER MON EXECUTIVE BRIEF
                  <span className="text-[10px] font-medium opacity-80 block md:inline md:ml-1">— Livré sous 24h — Prêt à l&apos;impression</span>
                </a>

                <button onClick={() => setShowBriefModal(false)} className="w-full text-center py-2.5 px-6 rounded-xl text-[12px] font-bold transition-all bg-transparent hover:bg-white/5 border border-white/20" style={{
                  color: "#FFFDF8",
                }}>
                  Fermer l&apos;aperçu
                </button>
              </div>

              {/* Secure Info bar */}
              <div className="flex justify-center gap-6 mt-4 text-[9px] text-white/50 border-t border-white/5 pt-3">
                <span>🔒 Paiement sécurisé</span>
                <span>•</span>
                <span>Données confidentielles</span>
                <span>•</span>
                <span>Service 100% premium</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Global Centered Modal for Panel Simulator ── */}
      {showPanelModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#081F15]/85 backdrop-blur-md" onClick={() => setShowPanelModal(false)} />
          <div className="relative w-full max-w-[760px] rounded-3xl border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-250 text-left"
            style={{
              background: "radial-gradient(circle at top, #144431 0%, #081F15 100%)",
              borderColor: "#F2B11A",
              borderWidth: "1.5px",
              color: "#FFFDF8",
              boxShadow: "0 25px 60px -15px rgba(8, 31, 21, 0.9)"
            }}>
            
            {/* Close Button */}
            <button
              onClick={() => setShowPanelModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full border flex items-center justify-center transition-all bg-white/5 hover:bg-white/10"
              style={{ borderColor: "rgba(250,246,239,0.2)", color: "#FFFDF8", zIndex: 60 }}
              aria-label="Fermer"
            >
              ✕
            </button>

            {/* Top Vector Ornaments */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20" style={{
              backgroundImage: "radial-gradient(circle at 10% 20%, rgba(242, 177, 26, 0.15) 0%, transparent 40%)"
            }} />

            <div className="p-8 relative z-10">
              {/* Modal Header */}
              <div className="flex justify-center items-center flex-col text-center mb-6">
                <div className="flex items-center gap-1.5 mb-4">
                  <Image src="/branding/logo-prsto.png" alt="PRSTO" width={110} height={35} style={{ objectFit: "contain", filter: "brightness(0) invert(1)" }} />
                </div>
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#F2B11A] bg-[#F2B11A]/10 px-3 py-1 rounded-full border border-[#F2B11A]/20">PRSTO &bull; SIMULATION INTERACTIVE</span>
                </div>
                <h4 className="font-serif font-semibold text-2xl md:text-3xl tracking-tight leading-tight" style={{ color: "#FFFDF8" }}>
                  Simulez un entretien<br/>
                  de recrutement <span style={{ color: "#F2B11A" }}>exigeant</span>
                </h4>
                <p className="text-xs max-w-md mt-2.5 leading-relaxed" style={{ color: "rgba(250, 246, 239, 0.7)" }}>
                  Vivez les conditions réelles d&apos;un comité de direction IA. Préparez-vous, convainquez, et recevez un feedback structuré pour progresser.
                </p>
              </div>

              {/* Central Comparison Block (Candidate VS Board) */}
              <div className="grid md:grid-cols-2 gap-6 items-stretch relative mb-6">
                {/* VS Badge */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-extrabold border bg-[#081F15] z-20 shadow-md hidden md:flex" style={{
                  borderColor: "#F2B11A", color: "#F2B11A"
                }}>
                  VS
                </div>

                {/* Left Side: Candidate Dossier card */}
                <div className="rounded-2xl p-5 border flex flex-col justify-between" style={{
                  borderColor: "rgba(250,246,239,0.08)",
                  background: "rgba(250,246,239,0.03)"
                }}>
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                      <span>📄</span> VOTRE DOSSIER
                    </div>
                    
                    {/* Candidate Identity Mockup */}
                    <div className="bg-[#0B2117] rounded-xl p-4 border border-white/5 shadow-md relative overflow-hidden">
                      <div className="text-[7.5px] uppercase tracking-widest text-[#F2B11A] mb-1 font-bold">Candidat</div>
                      <h5 className="font-semibold text-sm text-white mb-2">Alexandre Martin</h5>
                      
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-300 mb-3">
                        <div className="bg-white/5 p-1.5 rounded flex flex-col">
                          <span className="opacity-60 text-[8px]">Poste Cible</span>
                          <strong className="truncate">DRH Groupe</strong>
                        </div>
                        <div className="bg-white/5 p-1.5 rounded flex flex-col">
                          <span className="opacity-60 text-[8px]">Expérience</span>
                          <strong>12 ans</strong>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        <span className="text-[8px] bg-[#F2B11A]/10 text-[#F2B11A] px-2 py-0.5 rounded border border-[#F2B11A]/20">Culture & Leadership</span>
                        <span className="text-[8px] bg-white/5 text-gray-300 px-2 py-0.5 rounded border border-white/5">Conduite du changement</span>
                      </div>
                    </div>
                  </div>

                  <button className="w-full text-center py-2 px-3 rounded-lg text-[10.5px] font-semibold border border-white/10 bg-white/5 mt-4 transition-all hover:bg-white/10" style={{ color: "#FFFDF8" }}>
                    👁️ Aperçu du dossier
                  </button>
                </div>

                {/* Right Side: Board IA experts */}
                <div className="rounded-2xl p-5 border flex flex-col justify-between" style={{
                  borderColor: "rgba(250,246,239,0.08)",
                  background: "rgba(250,246,239,0.03)"
                }}>
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                      <span>👥</span> VOTRE COMITÉ IA
                    </div>
                    <p className="text-[10px] text-gray-300 mb-4">Un panel d&apos;experts IA vous évalue en conditions réelles.</p>
                    
                    {/* Experts portraits layout */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { img: "/branding/portraits/ceo-paul/paul-01.png", name: "Chasseur de Têtes", label: "Postures & Soft-skills" },
                        { img: "/branding/portraits/drh-ingrid/ingrid-01.png", name: "DRH Groupe", label: "Culture & Leadership" },
                        { img: "/branding/portraits/boardmanager-david/david-01.png", name: "CEO / Président", label: "Stratégie & P&L" }
                      ].map((exp, idx) => (
                        <div key={idx} className="text-center flex flex-col items-center">
                          <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 mb-1.5 relative shadow-md">
                            <Image src={exp.img} alt={exp.name} fill style={{ objectFit: "cover" }} />
                          </div>
                          <strong className="text-[8.5px] block text-white leading-tight truncate w-full">{exp.name}</strong>
                          <span className="text-[7.5px] text-gray-400 block leading-tight truncate w-full mt-0.5">{exp.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Features Bento Bar (UNE SIMULATION COMPLÈTE...) */}
              <div className="text-center mb-5">
                <span className="text-[8.5px] font-bold uppercase tracking-widest text-[#F2B11A]/80 bg-white/5 border border-white/5 px-3 py-1 rounded-full">
                  Une simulation complète. Un feedback actionnable.
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { title: "Panel IA exigeant", badge: "SCÉNARIO & EXPERTS IA DU BOARD", desc: "Affrontez un comité de direction IA multidisciplinaire qui challenge vos réponses en temps réel." },
                  { title: "Analyse vidéo & voix", badge: "ANALYSE AVANCÉE", desc: "Analyse de votre débit de parole, de vos tics de langage et de la structure de vos réponses." },
                  { title: "Rapport de scoring", badge: "RAPPORT ACTIONNABLE", desc: "Recevez un rapport détaillé sur 5 dimensions stratégiques avec des recommandations concrètes." }
                ].map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl border flex flex-col justify-between" style={{
                    borderColor: "rgba(250,246,239,0.06)",
                    background: "rgba(250,246,239,0.02)"
                  }}>
                    <div>
                      <strong className="text-xs block text-white mb-1">{item.title}</strong>
                      <p className="text-[10px] leading-relaxed text-gray-400">{item.desc}</p>
                    </div>
                    <span className="text-[7.5px] font-bold text-[#F2B11A] tracking-wider block mt-3 uppercase">{item.badge}</span>
                  </div>
                ))}
              </div>

              {/* Modal Footer Actions */}
              <div className="space-y-2.5">
                <a href="/mock-interview" className="w-full text-center py-3 px-6 rounded-xl text-[13px] font-bold transition-all hover:brightness-110 flex items-center justify-center gap-2 shadow-lg" style={{
                  background: "linear-gradient(135deg, #F2B11A 0%, #D49A0E 100%)", color: "#082E1E",
                  border: "none", textDecoration: "none",
                }}>
                  ✨ LANCER LA SESSION INTERACTIVE &gt;
                </a>

                <button onClick={() => setShowPanelModal(false)} className="w-full text-center py-2.5 px-6 rounded-xl text-[12px] font-bold transition-all bg-transparent hover:bg-white/5 border border-white/20" style={{
                  color: "#FFFDF8",
                }}>
                  Découvrir le fonctionnement
                </button>
              </div>

              {/* Secure Info bar */}
              <div className="flex justify-center gap-6 mt-4 text-[9px] text-white/50 border-t border-white/5 pt-3">
                <span>🔒 Vos données restent confidentielles et ne sont jamais partagées.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
