"use client";

import { Globe, Link as LinkIcon, Briefcase, Zap, Shield, Monitor } from "lucide-react";
import Reveal from "./Reveal";

const PLATFORMS = [
  { name: "LinkedIn", icon: LinkIcon, color: "#0A66C2" },
  { name: "APEC", icon: Briefcase, color: "#E4B118" },
  { name: "Cadremploi", icon: Briefcase, color: "#103826" },
  { name: "HelloWork", icon: Zap, color: "#6A8F6D" },
  { name: "Welcome to the Jungle", icon: Globe, color: "#FFCD00" },
  { name: "Indeed", icon: Briefcase, color: "#2164F3" },
];

export default function ExtensionSection() {
  return (
    <section className="py-28" style={{ background: "#0B1F18" }}>
      <div className="max-w-5xl mx-auto px-6">
        <Reveal variant="up" className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-semibold tracking-wide mb-5"
            style={{ borderColor: "rgba(228,177,24,0.25)", color: "#F2C94C", background: "rgba(228,177,24,0.06)" }}>
            <Monitor size={12} />
            Extension Chrome
          </div>
          <h2 className="font-serif text-[clamp(1.875rem,3.5vw,2.875rem)] font-bold tracking-[-0.04em] leading-[1.08] mb-3 text-white">
            Votre copilote IA<br />sur 6 plateformes d'emploi
          </h2>
          <p className="text-sm max-w-lg mx-auto" style={{ color: "rgba(255,255,255,0.5)" }}>
            Installez l'extension PRSTO Copilot. Quand vous parcourez une offre sur LinkedIn, APEC ou Welcome to the Jungle, l'IA analyse l'offre en temps réel dans un panneau latéral.
          </p>
        </Reveal>

        {/* Platformes supportées */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-12">
          {PLATFORMS.map((p, i) => {
            const Icon = p.icon;
            return (
              <Reveal key={p.name} variant="up" delay={i * 60}>
                <div className="rounded-2xl p-5 text-center transition-all duration-300 hover:-translate-y-1"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center"
                    style={{ background: `${p.color}15`, border: `1px solid ${p.color}30` }}>
                    <Icon size={18} style={{ color: p.color }} />
                  </div>
                  <span className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>{p.name}</span>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Ce que fait l'extension */}
        <div className="grid md:grid-cols-3 gap-5">
          <Reveal variant="up" delay={0}>
            <div className="rounded-2xl p-7 h-full" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(228,177,24,0.15)" }}>
                <Zap size={18} style={{ color: "#E4B118" }} />
              </div>
              <h3 className="text-sm font-bold text-white mb-2">Analyse en temps réel</h3>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                L'IA lit l'offre instantanément et affiche un score de matching avec votre profil, les mots-clés manquants, et les points forts de l'offre.
              </p>
            </div>
          </Reveal>
          <Reveal variant="up" delay={80}>
            <div className="rounded-2xl p-7 h-full" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(228,177,24,0.15)" }}>
                <Shield size={18} style={{ color: "#E4B118" }} />
              </div>
              <h3 className="text-sm font-bold text-white mb-2">Import en 1 clic</h3>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                Importez l'offre dans votre pipeline PRSTO d'un seul clic. Le texte, la société, le titre et le salaire sont extraits automatiquement.
              </p>
            </div>
          </Reveal>
          <Reveal variant="up" delay={160}>
            <div className="rounded-2xl p-7 h-full" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(228,177,24,0.15)" }}>
                <Monitor size={18} style={{ color: "#E4B118" }} />
              </div>
              <h3 className="text-sm font-bold text-white mb-2">Side panel conversationnel</h3>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                Posez des questions sur l'offre directement dans le panneau latéral : « Quelles preuves de mon Proof Vault utiliser ? », « Comment adapter mon CV ? »
              </p>
            </div>
          </Reveal>
        </div>

        {/* CTA */}
        <Reveal variant="up" delay={240} className="text-center mt-10">
          <a href="/dashboard/jobs/importer/extension"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
            style={{ background: "#E4B118", color: "#0B1F18", textDecoration: "none" }}>
            <Monitor size={16} />
            Installer l'extension
          </a>
          <p className="text-[10px] mt-3" style={{ color: "rgba(255,255,255,0.3)" }}>
            Gratuit avec le plan Pro · Chrome et Firefox compatibles
          </p>
        </Reveal>
      </div>
    </section>
  );
}
