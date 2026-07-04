"use client";

import { useRef } from "react";
import Link from "next/link";
import Reveal from "./Reveal";
import ParticleField from "./ParticleField";
import { ClockIcon, DocumentIcon, ChartIcon, MailIcon, SearchIcon, PlayIcon, ArrowRightIcon, SparklesIcon } from "@/components/ui/CustomIcons";

export default function HeroRecruiter() {
  const cardRef = useRef<HTMLDivElement | null>(null);

  function handleTilt(e: React.MouseEvent<HTMLDivElement>) {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(1200px) rotateY(${px * 6}deg) rotateX(${-py * 6}deg) translateZ(0)`;
  }
  function resetTilt() {
    const el = cardRef.current;
    if (el) el.style.transform = "perspective(1200px) rotateY(0) rotateX(0)";
  }

  return (
    <section className="relative overflow-hidden min-h-[95vh] flex items-center">
      <ParticleField density={0.0001} color="228,177,24" />

      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-[-25%] left-[5%] w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(228,177,24,0.08), transparent 65%)", filter: "blur(60px)" }} />
        <div className="absolute bottom-[-20%] right-[8%] w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(106,143,109,0.07), transparent 65%)", filter: "blur(50px)" }} />
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-28 pb-20 md:pt-36 md:pb-24 w-full relative" style={{ zIndex: 2 }}>
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">

          {/* ─── LEFT: TEXT ─── */}
          <div className="relative z-10">
            <Reveal variant="up">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-[11px] font-semibold mb-8 backdrop-blur-md" style={{
                border: "1px solid rgba(228,177,24,0.2)",
                color: "#A38010",
                background: "rgba(228,177,24,0.06)",
              }}>
                <span className="relative flex w-2 h-2">
                  <span className="absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping" style={{ background: "#E4B118" }} />
                  <span className="relative inline-flex w-2 h-2 rounded-full" style={{ background: "#E4B118" }} />
                </span>
                Nouveau — Préparation augmentée par l&apos;IA
              </div>
            </Reveal>

            <Reveal variant="up" delay={80}>
              <h1 className="text-[clamp(2.8rem,6vw,4.5rem)] font-extrabold leading-[1.02] tracking-[-0.045em] mb-6">
                <span className="block text-[#0B1F18]">
                  Préparez.
                </span>
                <span className="block bg-gradient-to-r from-[#E4B118] via-[#F2C94C] to-[#E4B118] bg-clip-text text-transparent">
                  Placez.
                </span>
                <span className="block text-[#0B1F18]">
                  Développez.
                </span>
              </h1>
            </Reveal>

            <Reveal variant="up" delay={160}>
              <p className="text-base md:text-lg leading-relaxed mb-8 max-w-lg" style={{ color: "#50625A" }}>
                CV adapté, lettre sur-mesure, ATS Scanner, LinkedIn Optimizer, Brief Entretien —
                le premier système d&apos;IA qui transforme chaque candidat en placement en 8 minutes.
              </p>
            </Reveal>

            <Reveal variant="up" delay={240}>
              <div className="flex flex-wrap items-center gap-3 mb-8">
                <Link href="/recruiter/dashboard"
                  className="group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                  style={{
                    background: "#103826",
                    color: "#FFFDF8",
                    boxShadow: "0 8px 24px rgba(16,56,38,0.3)",
                    textDecoration: "none",
                  }}>
                  <SparklesIcon size={16} />
                  Essai gratuit 14 jours
                  <ArrowRightIcon size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
                <a href="#demo"
                  className="group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 backdrop-blur-md"
                  style={{
                    border: "1px solid rgba(16,56,38,0.12)",
                    color: "#50625A",
                    background: "rgba(255,253,248,0.6)",
                    textDecoration: "none",
                  }}>
                  <PlayIcon size={15} className="transition-transform duration-300 group-hover:scale-110" />
                  Voir la démo
                </a>
              </div>
            </Reveal>

            <Reveal variant="fade" delay={340}>
              <div className="flex flex-wrap gap-x-8 gap-y-2">
                {[
                  { icon: ClockIcon, label: "8 min par candidat" },
                  { icon: DocumentIcon, label: "CV + Lettre + ATS" },
                  { icon: ChartIcon, label: "+40% de placements" },
                ].map((f) => (
                  <div key={f.label} className="flex items-center gap-2 text-xs font-medium" style={{ color: "#6A8F6D" }}>
                    <f.icon size={14} style={{ color: "#6A8F6D" }} />
                    {f.label}
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          {/* ─── RIGHT: GLASS CARD WITH MOCKUP + PLACEHOLDER ─── */}
          <Reveal variant="left" delay={200} className="relative">
            {/* Floating badges */}
            <div className="lp-float-1 absolute -top-5 -right-3 z-30 rounded-2xl px-5 py-3 backdrop-blur-xl" style={{
              background: "rgba(255,253,248,0.75)",
              border: "1px solid rgba(16,56,38,0.08)",
              boxShadow: "0 20px 40px rgba(16,56,38,0.1)",
            }}>
              <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "#6A8F6D" }}>Temps gagné</div>
              <div className="text-xl font-extrabold tracking-tight" style={{ color: "#103826" }}>−92%</div>
            </div>
            <div className="lp-float-2 absolute -bottom-4 -left-5 z-30 rounded-2xl px-5 py-3 backdrop-blur-xl" style={{
              background: "rgba(255,253,248,0.75)",
              border: "1px solid rgba(16,56,38,0.08)",
              boxShadow: "0 20px 40px rgba(16,56,38,0.1)",
            }}>
              <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "#6A8F6D" }}>Placements</div>
              <div className="text-xl font-extrabold tracking-tight" style={{ color: "#E4B118" }}>+40%</div>
            </div>

            {/* Main glass card */}
            <div
              ref={cardRef}
              onMouseMove={handleTilt}
              onMouseLeave={resetTilt}
              className="relative rounded-3xl overflow-hidden backdrop-blur-xl transition-all duration-200 ease-out"
              style={{
                border: "1px solid rgba(255,253,248,0.3)",
                background: "rgba(255,253,248,0.55)",
                boxShadow: "0 30px 80px rgba(16,56,38,0.1), 0 0 0 1px rgba(255,253,248,0.5)",
                transformStyle: "preserve-3d",
              }}
            >
              <div className="p-1">
                {/* Mockup header */}
                <div className="flex items-center justify-between mb-3 px-5 pt-5">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full" style={{ background: "rgba(220,38,38,0.4)" }} />
                      <div className="w-3 h-3 rounded-full" style={{ background: "rgba(228,177,24,0.4)" }} />
                      <div className="w-3 h-3 rounded-full" style={{ background: "rgba(22,163,74,0.4)" }} />
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#6A8F6D" }}>
                      Dossier candidat · Client Final
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] font-bold px-2.5 py-1.5 rounded-lg backdrop-blur-sm" style={{
                    background: "rgba(16,56,38,0.08)",
                    color: "#103826",
                    border: "1px solid rgba(16,56,38,0.08)",
                  }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#103826" }} />
                    PRSTO IA
                  </div>
                </div>

                {/* Dashboard image */}
                <div id="demo" className="mx-5 mb-4 rounded-2xl overflow-hidden relative flex items-center justify-center" style={{
                  background: "linear-gradient(135deg, rgba(16,56,38,0.04), rgba(228,177,24,0.04))",
                  border: "1px solid rgba(16,56,38,0.06)",
                  aspectRatio: "16/9",
                }}>
                  <img
                    src="/images/prsto/hero-dashboard.png"
                    alt="Dashboard PRSTO"
                    className="w-full h-full object-cover"
                    style={{ display: "block" }}
                  />
                  {/* Decorative scan line */}
                  <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
                    background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(16,56,38,0.1) 2px, rgba(16,56,38,0.1) 4px)",
                  }} />
                </div>

                {/* Quick actions row */}
                <div className="grid grid-cols-3 gap-2.5 px-5 pb-5">
                  {[
                    { icon: DocumentIcon, label: "CV généré", sub: "Prêt", active: true },
                    { icon: MailIcon, label: "Lettre", sub: "Générée", active: true },
                    { icon: SearchIcon, label: "ATS", sub: "92%", active: false },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl p-3 text-center transition-all duration-300 hover:-translate-y-0.5 backdrop-blur-sm" style={{
                      background: "rgba(250,246,239,0.6)",
                      border: `1px solid ${item.active ? "rgba(16,56,38,0.06)" : "rgba(228,177,24,0.1)"}`,
                    }}>
                      <div className="flex justify-center mb-1.5">
                        <item.icon size={18} style={{ color: item.active ? "#103826" : "#A38010" }} />
                      </div>
                      <div className="text-[10.5px] font-semibold truncate" style={{ color: "#0B1F18" }}>{item.label}</div>
                      <div className="text-[8.5px] font-bold mt-0.5 px-1.5 py-0.5 rounded inline-block" style={{
                        background: item.active ? "rgba(16,56,38,0.08)" : "rgba(228,177,24,0.1)",
                        color: item.active ? "#103826" : "#A38010",
                      }}>{item.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
