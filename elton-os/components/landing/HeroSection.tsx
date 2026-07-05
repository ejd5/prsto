"use client";

import Link from "next/link";
import { Sparkles, Eye, Cpu, Shield, BarChart3, Bell, Crown } from "lucide-react";

const FEATURES = [
  { icon: Cpu, label: "Scoring IA 7 dimensions" },
  { icon: Shield, label: "Zéro envoi automatique" },
  { icon: BarChart3, label: "Pipeline & Analytics" },
  { icon: Bell, label: "Relances intelligentes" },
];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden min-h-[92vh] flex items-center justify-center"
      style={{ background: "linear-gradient(135deg, #FAF6EF 0%, #F5F0E8 100%)" }}>
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "url('/hero-prsto-visuel.png')",
        backgroundSize: "cover", backgroundRepeat: "no-repeat", backgroundPosition: "center",
        opacity: 0.55,
      }} aria-hidden="true" />
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="lp-aurora absolute top-[-20%] left-[10%] w-[520px] h-[520px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(228,177,24,0.18), transparent 65%)", filter: "blur(40px)" }} />
        <div className="lp-aurora absolute bottom-[-15%] right-[5%] w-[460px] h-[460px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(106,143,109,0.15), transparent 65%)", filter: "blur(40px)", animationDelay: "-7s" }} />
      </div>
      <div className="max-w-4xl mx-auto px-6 py-16 w-full relative text-center" style={{ zIndex: 2 }}>
        <div><div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-medium mb-6" style={{ borderColor: "rgba(228,177,24,0.25)", color: "#A38010", background: "rgba(228,177,24,0.08)" }}>
          <Crown size={11} style={{ color: "#E4B118" }} />Le copilote carrière IA des cadres dirigeants — DG, CEO, COO, CFO, Country Manager</div></div>
        <div><h1 className="text-[clamp(2.25rem,5vw,3.8rem)] font-extrabold leading-[1.02] tracking-[-0.04em] mb-5 font-serif" style={{ fontFamily: "Playfair Display, serif" }}>
          <span className="block text-[#0B1F18]" style={{ textShadow: "0 1px 2px rgba(255,255,255,1), 0 2px 8px rgba(255,255,255,1), 0 4px 16px rgba(255,255,255,0.95), 0 8px 40px rgba(255,253,248,0.95)" }}>Votre prochain poste</span>
          <span className="block" style={{ color: "#E4B118", textShadow: "0 1px 3px rgba(11,31,24,0.25), 0 0 24px rgba(228,177,24,0.18)" }}>de direction se mérite.</span>
          <span className="block text-[#0B1F18]" style={{ textShadow: "0 1px 2px rgba(255,255,255,1), 0 2px 8px rgba(255,255,255,1), 0 4px 16px rgba(255,255,255,0.95), 0 8px 40px rgba(255,253,248,0.95)" }}>PRSTO vous donne les 18 outils pour le décrocher.</span>
        </h1></div>
        <div><p className="text-base md:text-lg leading-relaxed mb-8 max-w-2xl mx-auto font-medium" style={{ color: "#103826", textShadow: "0 1px 2px rgba(255,255,255,1), 0 2px 8px rgba(255,255,255,0.95), 0 4px 20px rgba(255,253,248,0.95)" }}>
          Un process de recrutement de dirigeant dure <strong style={{ color: "#E4B118" }}>6 à 18 mois</strong>, traverse 7 à 12 étapes, mobilise 15 à 30 interlocuteurs. Les outils généralistes ne sont pas calibrés pour ça. PRSTO, si. CV Maître, ATS Scanner, Mock Interview Panel, Conseiller IA, Market Radar, CRM Recruteur — un seul cockpit.</p></div>
        <div><div className="flex flex-wrap items-center justify-center gap-3 mb-4">
          <Link href="/demarrage" className="group inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5" style={{ background: "#103826", color: "#FFFDF8", boxShadow: "0 4px 16px rgba(16,56,38,0.25)", textDecoration: "none" }}>
            <Sparkles size={15} />Commencer gratuitement<svg className="transition-transform group-hover:translate-x-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></Link>
          <a href="/dashboard/jobs?demo=true" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium border transition-all" style={{ borderColor: "rgba(16,56,38,0.15)", color: "#50625A", textDecoration: "none" }}>
            <Eye size={15} />Voir la démo</a></div>
          <Link href="/prsto/executive-brief" className="inline-flex items-center gap-1.5 text-xs font-semibold transition-colors" style={{ color: "#103826", textShadow: "0 0 4px #fff, 0 0 12px rgba(255,255,255,0.6)", textDecoration: "none" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#E4B118" }} />Pour les dirigeants uniquement. Pas pour la masse. →</Link></div>
        <div><div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          {FEATURES.map((f) => (<div key={f.label} className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#103826", textShadow: "0 0 4px #fff, 0 0 12px rgba(255,255,255,0.6)" }}>
            <f.icon size={13} style={{ color: "#E4B118" }} />{f.label}</div>))}
        </div></div>
      </div>
    </section>
  );
}
