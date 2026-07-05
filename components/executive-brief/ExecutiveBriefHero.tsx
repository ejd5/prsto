import Link from "next/link";
import Reveal from "@/components/landing/Reveal";

export default function ExecutiveBriefHero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28"
      style={{
        backgroundImage: "url('/hero-premium.png')",
        backgroundSize: "100% 100%",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}>
      <div aria-hidden="true"
        className="lp-aurora pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] md:w-[900px] h-[500px] rounded-full opacity-30"
        style={{
          background: "radial-gradient(ellipse, rgba(228,177,24,0.20), transparent 65%)",
        }}
      />
      <div className="relative max-w-6xl mx-auto px-6 text-center">
        <Reveal>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] font-semibold mb-8"
            style={{ background: "rgba(239,68,68,0.12)", color: "#F87171", border: "1px solid rgba(239,68,68,0.2)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 lp-pulse" />
            Entretien dans moins de 7 jours ?
          </div>
        </Reveal>

        <Reveal delay={80}>
          <h1 className="font-extrabold leading-[1.05] tracking-[-0.04em] mb-6 font-serif"
            style={{ fontSize: "clamp(2.2rem, 5.5vw, 4rem)", fontFamily: "Playfair Display, serif" }}>
            Vous avez un entretien
            <br />
            <span className="lp-text-shine" style={{
              background: "linear-gradient(135deg, #E4B118, #F2C94C, #E4B118)",
              backgroundClip: "text", WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              dans les prochains jours
            </span>
            <br />
            On prépare tout pour vous.
          </h1>
        </Reveal>

        <Reveal delay={160}>
          <p className="mx-auto max-w-2xl text-lg md:text-xl leading-relaxed mb-10"
            style={{ color: "#50625A" }}>
            Conçu par des professionnels du recrutement cumulant <strong style={{ color: "#0B1F18" }}>plus de 20 années d&apos;expérience</strong>{' '}
            en cabinet de chasse de têtes et en RH. Amplifié par l&apos;intelligence artificielle
            pour une précision et une rapidité inégalées.
          </p>
        </Reveal>
        <Reveal delay={200}>
          <div className="mx-auto max-w-2xl flex flex-wrap justify-center gap-3 mb-10">
            {["Analyse CV vs JD", "Company Intelligence", "20 questions STAR", "Plan 30-60-90", "Kit négociation", "Audit LinkedIn", "Email remerciement", "Checklist jour J"].map((tag) => (
              <span key={tag} className="px-3 py-1.5 rounded-lg text-[12px] font-medium"
                style={{ background: "#FFFFFF", border: "1px solid rgba(16,56,38,0.1)", color: "#50625A" }}>
                {tag}
              </span>
            ))}
          </div>
        </Reveal>

        <Reveal delay={240}>
          <Link
            href="/prsto/executive-brief/commander"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-[15px] font-bold transition-all hover:scale-[1.03] active:scale-[0.98]"
            style={{
              background: "#103826", // Forest green CTA
              color: "#FFFDF8", textDecoration: "none",
              boxShadow: "0 8px 30px rgba(16,56,38,0.25)",
            }}>
            Commander l&apos;Executive Brief — 29,90€
            <span style={{ fontSize: "18px" }}>→</span>
          </Link>
        </Reveal>

        <Reveal delay={320}>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-[13px] font-medium"
            style={{ color: "#6A8F6D" }}>
            <span className="flex items-center gap-1.5">
              <span style={{ color: "#22c55e" }}>✓</span> Téléchargement immédiat
            </span>
            <span className="flex items-center gap-1.5">
              <span style={{ color: "#22c55e" }}>✓</span> PDF 15-20 pages
            </span>
            <span className="flex items-center gap-1.5">
              <span style={{ color: "#22c55e" }}>✓</span> 100% personnalisé
            </span>
            <span className="flex items-center gap-1.5">
              <span style={{ color: "#22c55e" }}>✓</span> Pas d&apos;abonnement
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
