import Reveal from "@/components/landing/Reveal";
import GlassCard from "@/components/landing/GlassCard";

const problems = [
  {
    icon: "🏢",
    title: "Vous préparez vos réponses, pas l'entreprise",
    desc: "Vous passez des heures à peaufiner votre pitch, mais vous ne savez pas exactement ce que l'entreprise cherche, qui vous allez rencontrer, ni comment votre profil répond à LEURS urgences.",
    stat: "70% des échecs de cadres dirigeants dans les 18 mois",
    statSrc: "sont dus à un mauvais fit culturel, pas à un manque de compétences.",
    src: "McKinsey",
  },
  {
    icon: "🎯",
    title: "Vous racontez votre parcours, pas leur problème",
    desc: "Les comités exécutifs n'embauchent pas un CV. Ils embauchent une solution à un problème spécifique. Si votre récit ne répond pas à LEUR contexte, vous serez oublié au profit de quelqu'un qui l'a fait.",
    stat: "Les compétences sociales ont bondi de 30%",
    statSrc: "dans les exigences des recruteurs cadres. La gestion financière a chuté de 40%.",
    src: "Harvard Business School / Russell Reynolds",
  },
  {
    icon: "💰",
    title: "Vous improvisez la négociation",
    desc: "Quand l'offre arrive, la plupart des dirigeants négocient à l'instinct. Sans benchmark, sans talk tracks, sans stratégie. Résultat : ils laissent 15 à 20% sur la table.",
    stat: "Moins d'un dirigeant sur 5",
    statSrc: "prépare sa négociation salariale avec des données de marché.",
    src: "Étude Robert Half 2025",
  },
];

export default function ProblemSection() {
  return (
    <section className="py-20 md:py-28" style={{ background: "rgba(8,8,10,0.5)" }}>
      <div className="max-w-6xl mx-auto px-6">
        <Reveal>
          <div className="text-center mb-14">
            <p className="text-[12px] font-bold uppercase tracking-[0.18em] mb-4"
              style={{ color: "rgba(255,255,255,0.25)" }}>
              Pourquoi les meilleurs échouent
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.03em] mb-4 font-serif" style={{ fontFamily: "Playfair Display, serif" }}>
              3 erreurs qui coûtent le poste
              <br />
              <span style={{ color: "rgba(255,255,255,0.4)" }}>aux cadres dirigeants</span>
            </h2>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-6">
          {problems.map((p, i) => (
            <Reveal key={p.title} delay={100 * i}>
              <GlassCard className="p-8 h-full">
                <span style={{ fontSize: "1.8rem" }}>{p.icon}</span>
                <h3 className="text-[17px] font-bold mt-4 mb-3 tracking-[-0.02em]">{p.title}</h3>
                <p className="text-sm leading-relaxed mb-5" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {p.desc}
                </p>
                <div className="pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <p className="text-[13px] font-semibold" style={{ color: "#F87171" }}>{p.stat}</p>
                  <p className="text-[12px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                    {p.statSrc}
                  </p>
                  <p className="text-[11px] mt-1 font-medium" style={{ color: "rgba(255,255,255,0.2)" }}>
                    Source : {p.src}
                  </p>
                </div>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
