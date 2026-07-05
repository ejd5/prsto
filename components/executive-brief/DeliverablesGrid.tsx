import Reveal from "@/components/landing/Reveal";
import GlassCard from "@/components/landing/GlassCard";

const items = [
  { icon: "📋", title: "Analyse CV vs JD", desc: "Nous comparons votre CV avec la description du poste sur 15 dimensions : adéquation des compétences (match), lacunes (miss), surqualifications (overkill), mots-clés manquants, score ATS estimé, et plan correctif priorisé. C'est l'étape que tout cabinet de recrutement réalise avant de proposer un candidat." },
  { icon: "🏢", title: "Company Intelligence", desc: "Stratégie, santé financière, culture, actualités 30 jours, concurrents." },
  { icon: "👤", title: "Profilage intervieweurs", desc: "1 à 3 profils : parcours, style d'évaluation, questions probables, pièges." },
  { icon: "❓", title: "20 questions STAR", desc: "Classées par thème : vision, leadership, métier, culture, pression." },
  { icon: "⚠️", title: "Questions pièges", desc: "10 questions difficiles avec script de retournement et framework de réponse." },
  { icon: "🎯", title: "Questions à poser", desc: "8 questions taguées par intervieweur avec plan d'attaque." },
  { icon: "📅", title: "Plan 30-60-90 jours", desc: "Vos 3 premiers mois détaillés. Les comités de direction adorent ça." },
  { icon: "💶", title: "Kit négociation", desc: "Benchmark marché, talk tracks, arguments equity/bonus/avantages." },
  { icon: "✉️", title: "Email de remerciement", desc: "Modèle personnalisé pour l'après-entretien, avec arguments clés et ton professionnel." },
  { icon: "📧", title: "5 templates email", desc: "Merci, clarification, suivi, négociation, relance — personnalisables." },
  { icon: "✅", title: "Checklist jour J", desc: "Documents, tenue, timing, sujets à couvrir, questions à ne pas oublier." },
  { icon: "📄", title: "PDF 15-20 pages", desc: "Imprimable + version Board 1 page. Téléchargement immédiat, prêt à emporter." },
  { icon: "🔗", title: "Audit LinkedIn", desc: "Titre, About, photo, mots-clés, score /100. 75% des recruteurs le consultent." },
];

export default function DeliverablesGrid() {
  return (
    <section id="contenu" className="py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-6">
        <Reveal>
          <div className="text-center mb-14">
            <p className="text-[12px] font-bold uppercase tracking-[0.18em] mb-4"
              style={{ color: "#6A8F6D" }}>
              Les 13 livrables
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.03em] mb-4 font-serif" style={{ fontFamily: "Playfair Display, serif" }}>
              Tout ce que contient
              <br />
              <span className="lp-text-shine" style={{
                background: "linear-gradient(135deg, #E4B118, #F2C94C)",
                backgroundClip: "text", WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                l&apos;Executive Brief
              </span>
            </h2>
            <p className="mx-auto max-w-xl text-sm" style={{ color: "#50625A" }}>
                Pas un template générique. Chaque section est construite sur mesure par des
                professionnels du recrutement — experts RH et chasseurs de têtes — qui analysent
                votre CV, l&apos;annonce, l&apos;entreprise ciblée et votre LinkedIn.
              </p>
          </div>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, i) => (
            <Reveal key={item.title} delay={60 * i}>
              <GlassCard className="p-5 h-full">
                <div className="flex items-start gap-3.5">
                  <span style={{ fontSize: "1.3rem", marginTop: "2px", flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <h3 className="text-[14px] font-bold mb-1" style={{ color: "#0B1F18" }}>{item.title}</h3>
                    <p className="text-[13px] leading-relaxed" style={{ color: "#50625A" }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
