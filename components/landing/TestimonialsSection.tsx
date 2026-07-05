"use client";

import Reveal from "./Reveal";

const TESTIMONIALS = [
  {
    initials: "SM", name: "Sébastien M.", role: "VP Sales, Scale-up · Paris",
    quote: "Le CRM Recruteur est un game changer. Je ne perds plus le fil de mes échanges avec les chasseurs. J'ai décroché 3 entretiens en 10 jours.",
  },
  {
    initials: "CL", name: "Caroline L.", role: "Country Manager, Retail · Lyon",
    quote: "Avant j'utilisais 4 outils différents. Maintenant tout est dans PRSTO. Un gain de temps monumental — et des résultats concrets.",
  },
  {
    initials: "PB", name: "Pierre B.", role: "Directeur Commercial, Industrie",
    quote: "L'ATS Scanner m'a ouvert les yeux : mes CV n'étaient pas optimisés. Résultat : 3× plus d'entretiens en 3 semaines. Incroyable.",
  },
  {
    initials: "AM", name: "Amélie R.", role: "Head of Sales, SaaS · Bordeaux",
    quote: "Interview Studio m'a préparée à des questions que je n'avais jamais anticipées. J'ai abordé mes entretiens avec une confiance totale.",
  },
  {
    initials: "TG", name: "Thomas G.", role: "Directeur Général, Industrie",
    quote: "Le Market Radar m'a révélé des opportunités que je n'aurais jamais trouvées seul. Un poste décroché via le marché caché.",
  },
];

function Card({ t }: { t: (typeof TESTIMONIALS)[number] }) {
  return (
    <div
      className="rounded-3xl border p-7 flex flex-col w-[340px] flex-shrink-0 mx-2.5 transition-all duration-300 hover:-translate-y-1 shadow-sm"
      style={{ borderColor: "rgba(16,56,38,0.05)", background: "#FFFFFF" }}
    >
      <div className="flex gap-0.5 mb-4" style={{ color: "#E4B118" }}>
        {[...Array(5)].map((_, n) => <span key={n} className="text-xs">★</span>)}
      </div>
      <blockquote className="text-[13.5px] leading-relaxed flex-1 mb-5" style={{ color: "#50625A" }}>
        « {t.quote} »
      </blockquote>
      <div className="flex items-center gap-2.5">
        <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{
          background: "rgba(16,56,38,0.1)",
          border: "1px solid rgba(16,56,38,0.15)",
          color: "#103826",
        }}>
          {t.initials}
        </div>
        <div>
          <div className="text-sm font-semibold" style={{ color: "#0B1F18" }}>{t.name}</div>
          <div className="text-[11px]" style={{ color: "#6A8F6D" }}>{t.role}</div>
        </div>
      </div>
    </div>
  );
}

export default function TestimonialsSection() {
  const loop = [...TESTIMONIALS, ...TESTIMONIALS];

  return (
    <section id="temoignages" className="py-28 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <Reveal variant="up" className="text-center mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11.5px] font-semibold tracking-wide mb-5" style={{
            borderColor: "rgba(16,56,38,0.12)", color: "#103826",
            background: "rgba(16,56,38,0.06)",
          }}>
            ✦ Témoignages
          </div>
          <h2 className="font-serif text-[clamp(1.875rem,3.5vw,2.875rem)] font-bold tracking-[-0.04em] leading-[1.08] mb-3 text-[#0B1F18]">
            Rejoint par des centaines<br />de cadres dirigeants.
          </h2>
        </Reveal>
      </div>

      <div className="relative" style={{
        maskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)",
        WebkitMaskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)",
      }}>
        <div className="lp-marquee-track py-2">
          {loop.map((t, i) => (
            <Card key={i} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
}
