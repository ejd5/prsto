import Link from "next/link";
import { Sparkles, Lock, ShieldCheck, FileCheck2 } from "lucide-react";
import Reveal from "../Reveal";
import ImgSlot from "../ImgSlot";
import { PrstoLogo } from "../PrstoLogo";

export function RecruitersCta() {
  return (
    <section className="pb-28" style={{ paddingTop: "0" }}>
      <div className="max-w-6xl mx-auto px-6">
        <Reveal variant="scale">
        <div className="relative overflow-hidden rounded-2xl border py-24 px-8 text-center" style={{
          borderColor: "rgba(228,177,24,0.15)",
          background: "linear-gradient(145deg, #103826, #082E1E)",
        }}>
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
            <ImgSlot
              num={21}
              format="banner"
              className="absolute inset-0 w-full h-full"
              prompt="Fond décoratif CTA — formes abstraites, lignes de connexion, points lumineux. Ambiance 'réseau/community'. Tons dorés et verts foncés."
              promptLong="Bannière CTA finale PRSTO. Composition large et inspirante. Recruteur de dos regardant un écran PRSTO géant qui illumine la pièce. L'écran montre le dashboard avec les 4 chiffres clés 94 candidats 12 entretiens 8 min matching 99$. L'éclairage de l'écran chauffe l'environnement tons #E4B118. Fond de pièce sobre #0B1F18. Reflet du logo PRSTO sur le sol. Style cinématique épique large format inspirant. Apple Keynote vibe."
            />
          </div>

          <div className="relative z-10">
            <div className="flex justify-center mb-5">
              <PrstoLogo size={120} />
            </div>
            <h2 className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-extrabold tracking-[-0.04em] mb-3 font-serif" style={{ fontFamily: "Playfair Display, serif", color: "#FFFDF8" }}>
              Prêt à préparer vos candidats<br />en 8 minutes ?
            </h2>
            <p className="text-sm mb-8" style={{ color: "rgba(250,246,239,0.55)" }}>
              14 jours d&apos;essai gratuit. Sans carte bancaire. Sans engagement.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/recruiter/dashboard" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5" style={{
                background: "#E4B118", color: "#082E1E",
                boxShadow: "0 4px 20px rgba(228,177,24,0.3)",
                textDecoration: "none",
              }}>
                <Sparkles size={16} />
                Essayer gratuitement →
              </Link>
              <a href="#comparatif" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium border transition-all" style={{
                borderColor: "rgba(250,246,239,0.15)", color: "rgba(250,246,239,0.6)", textDecoration: "none",
              }}>
                Voir le comparatif
              </a>
            </div>

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
