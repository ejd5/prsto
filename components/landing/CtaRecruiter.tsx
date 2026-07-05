import Link from "next/link";
import Reveal from "./Reveal";
import { SparklesIcon, ArrowRightIcon, LockIcon, ShieldIcon, FileCheckIcon, StarIcon } from "@/components/ui/CustomIcons";

export default function CtaRecruiter() {
  return (
    <section className="pb-28" style={{ paddingTop: "0" }}>
      <div className="max-w-6xl mx-auto px-6">
        <Reveal variant="scale">
          <div className="relative overflow-hidden rounded-3xl py-28 px-8 text-center" style={{
            border: "1px solid rgba(228,177,24,0.12)",
            background: "linear-gradient(145deg, #103826, #082E1E)",
          }}>
            {/* Decorative blobs */}
            <div className="absolute top-[-60%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] pointer-events-none" style={{
              background: "radial-gradient(ellipse, rgba(228,177,24,0.08) 0%, transparent 70%)",
            }} />
            <div className="absolute bottom-[-40%] right-[-20%] w-[400px] h-[400px] pointer-events-none" style={{
              background: "radial-gradient(circle, rgba(106,143,109,0.06) 0%, transparent 70%)",
            }} />

            {/* Subtle particle-like dots */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
              backgroundImage: "radial-gradient(circle, #FFFDF8 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }} />

            <div className="relative z-10">
              <Reveal variant="up">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-semibold mb-6 backdrop-blur-sm" style={{
                  border: "1px solid rgba(228,177,24,0.15)",
                  color: "#E4B118",
                  background: "rgba(228,177,24,0.06)",
                }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#E4B118" }} />
                  14 jours d&apos;essai gratuit
                </div>
              </Reveal>

              <Reveal variant="up" delay={80}>
                <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-extrabold tracking-[-0.04em] mb-4 font-serif" style={{ fontFamily: "Playfair Display, serif", color: "#FFFDF8" }}>
                  Prêt à préparer vos candidats<br />
                  en <span style={{ color: "#E4B118" }}>8 minutes</span> ?
                </h2>
              </Reveal>

              <Reveal variant="up" delay={160}>
                <p className="text-sm mb-8" style={{ color: "rgba(250,246,239,0.5)" }}>
                  Sans carte bancaire. Sans engagement. Résiliez à tout moment.
                </p>
              </Reveal>

              <Reveal variant="up" delay={240}>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/recruiter/dashboard"
                    className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                    style={{
                      background: "#E4B118",
                      color: "#082E1E",
                      boxShadow: "0 8px 24px rgba(228,177,24,0.25)",
                      textDecoration: "none",
                    }}
                  >
                    <SparklesIcon size={16} />
                    Essayer gratuitement
                    <ArrowRightIcon size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                  <a
                    href="#comparatif"
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-medium border transition-all duration-300 hover:-translate-y-0.5 backdrop-blur-sm"
                    style={{
                      borderColor: "rgba(250,246,239,0.12)",
                      color: "rgba(250,246,239,0.55)",
                      textDecoration: "none",
                    }}
                  >
                    Voir le comparatif
                  </a>
                </div>
              </Reveal>

              <Reveal variant="fade" delay={340}>
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8 pt-6 border-t" style={{ borderColor: "rgba(250,246,239,0.06)" }}>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium" style={{ color: "rgba(250,246,239,0.4)" }}>
                    <LockIcon size={12} style={{ color: "#6A8F6D" }} /> Paiement sécurisé
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium" style={{ color: "rgba(250,246,239,0.4)" }}>
                    <ShieldIcon size={12} style={{ color: "#6A8F6D" }} /> SSL 256-bit
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium" style={{ color: "rgba(250,246,239,0.4)" }}>
                    <FileCheckIcon size={12} style={{ color: "#6A8F6D" }} /> Conforme RGPD
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium" style={{ color: "rgba(250,246,239,0.4)" }}>
                    <StarIcon size={12} style={{ color: "#E4B118" }} /> 4.9/5 · 312 avis
                  </span>
                </div>
              </Reveal>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
