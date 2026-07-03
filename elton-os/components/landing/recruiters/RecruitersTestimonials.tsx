"use client";

import Reveal from "../Reveal";
import ImgSlot from "../ImgSlot";

const TESTIMONIALS = [
  {
    quote: "Je préparais mes candidats le soir et le week-end. Maintenant je fais tout pendant que mon café refroidit.",
    name: "Alexandre Martin",
    role: "Recruteur Indépendant — Secteur Tech",
    placements: "+3 placements en 2 mois",
    image: "/images/prsto/testimonial-alexandre.png",
  },
  {
    quote: "Mes clients me disent que mes candidats sont toujours les mieux préparés. Ça fait la différence quand tu veux placer un directeur financier.",
    name: "Sophie Lefèvre",
    role: "Cabinet Lefèvre & Associés",
    placements: "15-20h économisées/semaine",
    image: "/images/prsto/testimonial-sophie.png",
  },
  {
    quote: "J'utilise toujours Manatal pour le suivi, mais PRSTO pour la préparation. C'est le duo gagnant.",
    name: "Karim Benali",
    role: "Senior Recruitment Consultant",
    placements: "Taux de placement x2",
    image: "/images/prsto/testimonial-karim.png",
  },
];

export function RecruitersTestimonials() {
  return (
    <section id="temoignages" className="py-28 relative" style={{ background: "rgba(106,143,109,0.03)" }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <ImgSlot
            num={18}
            format="banner"
            className="absolute inset-0 w-full h-full opacity-10"
            prompt="Fond décoratif pour section témoignages — motif subtil, formes géométriques douces, tons vert foncé très clair. Ambiance de confiance et professionnalisme."
            promptLong="Témoignages recruteurs. 3 cartes de témoignages en disposition asymétrique une grande deux petites. Chaque carte a une photo silhouette du recruteur en cercle un nom fictif (Sophie R. Cabinet Martin Marc D.) un extrait de citation 'J'ai réduit mon temps de sourcing de 80%' 'Je recommande PRSTO à tous les indépendants' 'Enfin un outil qui me comprend'. Fond dégradé #0B1F18 vers #103826. Cartes sur fond #FFFDF8. Style magazine editorial citations."
          />
      </div>
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <Reveal variant="up" className="text-center mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11.5px] font-semibold tracking-wide mb-5" style={{
            borderColor: "rgba(16,56,38,0.12)", color: "#103826",
            background: "rgba(16,56,38,0.06)",
          }}>
            ✦ Témoignages
          </div>
          <h2 className="font-serif text-[clamp(1.875rem,3.5vw,2.875rem)] font-bold tracking-[-0.04em] leading-[1.08] mb-3 text-[#0B1F18]">
            Ils nous font confiance
          </h2>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <Reveal variant="up" delay={i * 100} key={t.name}>
              <div className="rounded-2xl border p-7 h-full flex flex-col relative" style={{
                borderColor: "rgba(16,56,38,0.06)", background: "#FFFDF8",
              }}>
                <div className="text-3xl leading-none mb-3" style={{ color: "#E4B118" }}>"</div>
                <p className="text-sm leading-relaxed flex-1 mb-5" style={{ color: "#0B1F18" }}>
                  {t.quote}
                </p>
                <div className="pt-4 border-t flex items-center gap-3" style={{ borderColor: "rgba(16,56,38,0.06)" }}>
                  <img
                    src={t.image}
                    alt={t.name}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    style={{ border: "2px solid rgba(228,177,24,0.15)" }}
                  />
                  <div>
                    <div className="text-sm font-bold" style={{ color: "#0B1F18" }}>{t.name}</div>
                    <div className="text-[11px]" style={{ color: "#6A8F6D" }}>{t.role}</div>
                    <div className="text-[11px] font-semibold mt-0.5" style={{ color: "#103826" }}>{t.placements}</div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
