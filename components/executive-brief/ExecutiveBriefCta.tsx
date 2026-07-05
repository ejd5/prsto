import Link from "next/link";
import Reveal from "@/components/landing/Reveal";

export default function ExecutiveBriefCta() {
  return (
    <section id="commander" className="py-20 md:py-28" style={{ background: "rgba(8,8,10,0.5)" }}>
      <div className="max-w-6xl mx-auto px-6 text-center">
        <Reveal>
          <div className="rounded-2xl p-10 md:p-16 border relative overflow-hidden" style={{
            borderColor: "rgba(228,177,24,0.15)",
            background: "radial-gradient(ellipse at center, rgba(228,177,24,0.04), transparent 65%)",
          }}>
            <div aria-hidden="true"
              className="lp-aurora pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20"
              style={{
                background: "radial-gradient(ellipse, rgba(228,177,24,0.15), transparent 65%)",
              }}
            />

            <div className="relative">
              <p className="text-[12px] font-bold uppercase tracking-[0.18em] mb-4"
                style={{ color: "rgba(255,255,255,0.25)" }}>
                Prêt à maximiser vos chances ?
              </p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.03em] mb-4 font-serif" style={{ fontFamily: "Playfair Display, serif" }}>
                Commandez votre Executive Brief
                <br />
                <span className="lp-text-shine" style={{
                  background: "linear-gradient(135deg, #E4B118, #F2C94C)",
                  backgroundClip: "text", WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}>
                  téléchargement immédiat
                </span>
              </h2>
              <p className="text-sm mb-8" style={{ color: "rgba(255,255,255,0.4)" }}>
                Pas d&apos;abonnement. Pas de rendez-vous. Un dossier prêt à imprimer.
              </p>

              <Link
                href="/prsto/executive-brief/commander"
                className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl text-[16px] font-bold transition-all hover:scale-[1.03] active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, #E4B118, #C49A14)",
                  color: "#000", textDecoration: "none",
                  boxShadow: "0 8px 40px rgba(228,177,24,0.25)",
                }}>
                Commander 29,90€
                <span style={{ fontSize: "18px" }}>→</span>
              </Link>

              <div className="flex flex-wrap items-center justify-center gap-5 mt-8 text-[12px]"
                style={{ color: "rgba(255,255,255,0.3)" }}>
                <span className="flex items-center gap-1.5">
                  <span style={{ color: "#22c55e" }}>✓</span> Téléchargement immédiat
                </span>
                <span className="flex items-center gap-1.5">
                  <span style={{ color: "#22c55e" }}>✓</span> PDF personnalisé IA
                </span>
                <span className="flex items-center gap-1.5">
                  <span style={{ color: "#22c55e" }}>✓</span> Pas d&apos;abonnement
                </span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
