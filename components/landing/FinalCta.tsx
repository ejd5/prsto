import Link from "next/link";
import { Sparkles, Lock, ShieldCheck, FileCheck2 } from "lucide-react";
import Reveal from "./Reveal";

export default function FinalCta() {
  return (
    <section className="pb-28" style={{ paddingTop: "0" }}>
      <div className="max-w-6xl mx-auto px-6">
        <Reveal variant="scale">
        <div className="relative overflow-hidden rounded-2xl border py-24 px-8 text-center" style={{
          borderColor: "rgba(228,177,24,0.15)",
          backgroundImage: "url('/cta-bg.png')",
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}>
          <div className="absolute top-[-60%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none" style={{
            background: "radial-gradient(ellipse, rgba(228,177,24,0.10) 0%, transparent 70%)",
          }} />

          <div className="relative z-10">
            <h2 className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-extrabold tracking-[-0.04em] mb-3 font-serif" style={{ fontFamily: "Playfair Display, serif", color: "#FFFDF8" }}>
              Prêt à reprendre le contrôle<br />de votre carrière ?
            </h2>
            <p className="text-sm mb-4" style={{ color: "rgba(250,246,239,0.55)" }}>
               Accès illimité à toutes les fonctionnalités. IA entraînée sur 50 000+ offres cadre.
             </p>
             <p className="text-sm mb-4" style={{ color: "rgba(250,246,239,0.45)" }}>
               Sans engagement.
             </p>
             <br />
             <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/demarrage" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5" style={{
                background: "#E4B118", color: "#082E1E",
                boxShadow: "0 4px 20px rgba(228,177,24,0.3)",
                textDecoration: "none",
              }}>
                <Sparkles size={16} />
                Commencer gratuitement →
              </Link>
              <a href="#fonctionnalites" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium border transition-all" style={{
                borderColor: "rgba(250,246,239,0.15)", color: "rgba(250,246,239,0.6)", textDecoration: "none",
              }}>
                Voir les fonctionnalités
              </a>
            </div>
            <p className="text-[11.5px] mt-5" style={{ color: "rgba(250,246,239,0.35)" }}>
              +300 cadres dirigeants nous ont déjà rejoints ce mois-ci.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-7 pt-6 border-t" style={{ borderColor: "rgba(250,246,239,0.08)" }}>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium" style={{ color: "rgba(250,246,239,0.5)" }}>
                <Lock size={12} style={{ color: "#6A8F6D" }} /> Paiement sécurisé
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium" style={{ color: "rgba(250,246,239,0.5)" }}>
                <ShieldCheck size={12} style={{ color: "#6A8F6D" }} /> SSL 256-bit
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium" style={{ color: "rgba(250,246,239,0.5)" }}>
                <FileCheck2 size={12} style={{ color: "#6A8F6D" }} /> Conforme RGPD
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium" style={{ color: "rgba(250,246,239,0.5)" }}>
                <span style={{ color: "#E4B118" }}>★ 4.9/5</span> 312 avis
              </span>
            </div>
          </div>
        </div>
        </Reveal>
      </div>
    </section>
  );
}
