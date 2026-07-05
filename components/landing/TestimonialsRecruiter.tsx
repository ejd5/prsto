"use client";

import { useState } from "react";
import Reveal from "./Reveal";

const TESTIMONIALS = [
  {
    quote: "Je préparais mes candidats le soir et le week-end. Maintenant je fais tout pendant que mon café refroidit. Mes clients me disent que mes candidats sont toujours les mieux préparés.",
    name: "Alexandre Martin",
    role: "Recruteur Indépendant — Secteur Tech",
    stat: "+3 placements en 2 mois",
    initial: "AM",
    color: "#103826",
    photo: "/images/prsto/testimonial-alexandre.png",
  },
  {
    quote: "La différence entre un candidat préparé et un candidat envoyé brut, c'est le closing. PRSTO me fait gagner 15-20h par semaine et mon taux de placement a doublé.",
    name: "Sophie Lefèvre",
    role: "Cabinet Lefèvre & Associés",
    stat: "15-20h économisées/semaine",
    initial: "SL",
    color: "#E4B118",
    photo: "/images/prsto/testimonial-sophie.png",
  },
  {
    quote: "J'utilise toujours Manatal pour le suivi, mais PRSTO pour la préparation. C'est le duo gagnant. Mes candidats arrivent briefés, prêts, et ça se voit en entretien.",
    name: "Karim Benali",
    role: "Senior Recruitment Consultant",
    stat: "Taux de placement ×2",
    initial: "KB",
    color: "#6A8F6D",
    photo: "/images/prsto/testimonial-karim.png",
  },
];

export default function TestimonialsRecruiter() {
  const [active, setActive] = useState(0);

  return (
    <section id="temoignages" className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/3 left-[10%] w-80 h-80 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(228,177,24,0.04), transparent 65%)", filter: "blur(50px)" }} />
      </div>
      <div className="max-w-6xl mx-auto px-6 relative" style={{ zIndex: 1 }}>
        <Reveal variant="up" className="text-center mb-14">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-[11px] font-semibold tracking-wide mb-6 backdrop-blur-sm" style={{
            borderColor: "rgba(16,56,38,0.1)",
            color: "#103826",
            background: "rgba(16,56,38,0.04)",
          }}>
            ✦ Témoignages
          </div>
          <h2 className="font-serif text-[clamp(1.8rem,3.5vw,2.8rem)] font-bold tracking-[-0.04em] leading-[1.08] mb-4" style={{ color: "#0B1F18" }}>
            Ils ont transformé leur <span style={{ color: "#E4B118" }}>façon de recruter</span>
          </h2>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} variant="up" delay={i * 100}>
              <div
                className="group relative rounded-3xl p-7 md:p-8 transition-all duration-500 hover:-translate-y-1 h-full flex flex-col backdrop-blur-sm cursor-pointer"
                style={{
                  border: `1px solid ${active === i ? `${t.color}20` : "rgba(16,56,38,0.05)"}`,
                  background: active === i
                    ? `linear-gradient(145deg, rgba(255,253,248,0.8), ${t.color}04)`
                    : "rgba(255,253,248,0.45)",
                  boxShadow: active === i
                    ? `0 20px 60px ${t.color}10`
                    : "0 4px 20px rgba(16,56,38,0.02)",
                }}
                onClick={() => setActive(i)}
              >
                {/* Quote mark */}
                <div className="text-5xl leading-none mb-4 font-serif" style={{ color: `${t.color}20`, fontFamily: "Playfair Display, serif" }}>"</div>

                <p className="text-sm leading-relaxed flex-1 mb-6" style={{ color: "#50625A" }}>
                  {t.quote}
                </p>

                {/* Avatar */}
                <div className="mb-3">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center" style={{
                    border: `1px solid ${t.color}15`,
                  }}>
                    <img
                      src={t.photo}
                      alt={t.name}
                      className="w-full h-full object-cover"
                      style={{ display: "block" }}
                    />
                  </div>
                </div>

                <div>
                  <div className="text-sm font-bold" style={{ color: "#0B1F18" }}>{t.name}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: "#6A8F6D" }}>{t.role}</div>
                </div>

                <div className="mt-4 pt-4 border-t" style={{ borderColor: "rgba(16,56,38,0.04)" }}>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg" style={{
                    background: `${t.color}0a`,
                    color: t.color,
                    border: `1px solid ${t.color}15`,
                  }}>
                    {t.stat}
                  </span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
