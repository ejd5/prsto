import Reveal from "@/components/landing/Reveal";
import GlassCard from "@/components/landing/GlassCard";

export default function LinkedInAuditSection() {
  return (
    <section className="py-20 md:py-28" style={{ background: "rgba(8,8,10,0.5)" }}>
      <div className="max-w-6xl mx-auto px-6">
        <Reveal>
          <div className="text-center mb-14">
            <p className="text-[12px] font-bold uppercase tracking-[0.18em] mb-4"
              style={{ color: "rgba(255,255,255,0.25)" }}>
              Bonus inclus
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.03em] mb-4 font-serif" style={{ fontFamily: "Playfair Display, serif" }}>
              Audit LinkedIn
              <br />
              <span className="lp-text-shine" style={{
                background: "linear-gradient(135deg, #E4B118, #F2C94C)",
                backgroundClip: "text", WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                offert dans l&apos;Executive Brief
              </span>
            </h2>
            <p className="mx-auto max-w-lg text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              75% des recruteurs consultent LinkedIn avant un entretien.
              Votre profil doit être irréprochable — et cohérent avec votre dossier.
            </p>
          </div>
        </Reveal>

        <div className="grid lg:grid-cols-2 gap-8 items-center mb-12">
          <Reveal variant="left">
            <div className="space-y-5">
              {[
                { icon: "📝", title: "Titre optimisé", desc: "3 propositions de titre avec mots-clés recruteurs, prêts à copier-coller." },
                { icon: "📖", title: "About réécrit", desc: "Section 'À propos' complète en 1re personne, alignée sur votre objectif." },
                { icon: "📸", title: "Photo & bannière", desc: "Conseils précis sur votre photo et bannière pour maximiser la crédibilité." },
                { icon: "🔑", title: "Mots-clés manquants", desc: "Les termes que les recruteurs recherchent et qui ne sont pas sur votre profil." },
                { icon: "⚡", title: "5 actions rapides", desc: "Priorisées par impact, réalisables en moins de 30 minutes chacune." },
                { icon: "✓", title: "Score LinkedIn", desc: "Note /100 avec détail par section. Objectif : 85+ avant l'entretien." },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3.5">
                  <span style={{ fontSize: "1.2rem", flexShrink: 0, marginTop: "1px" }}>{item.icon}</span>
                  <div>
                    <p className="text-[14px] font-semibold">{item.title}</p>
                    <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.45)" }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal variant="right" delay={100}>
            <GlassCard className="p-7">
              <p className="text-[12px] font-bold uppercase tracking-[0.15em] mb-4"
                style={{ color: "rgba(255,255,255,0.25)" }}>
                Pourquoi c&apos;est crucial
              </p>
              <div className="space-y-4 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                <p>
                  <strong style={{ color: "rgba(255,255,255,0.7)" }}>Avant un entretien, les recruteurs regardent votre LinkedIn.</strong>{' '}
                  C&apos;est systématique. Ils comparent votre profil avec votre CV, vérifient votre
                  présence en ligne, et se font un premier jugement.
                </p>
                <p>
                  <strong style={{ color: "rgba(255,255,255,0.7)" }}>Si votre LinkedIn est à jour, bien écrit et cohérent avec votre dossier,</strong>{' '}
                  vous arrivez en entretien avec une longueur d&apos;avance. Sinon, ça crée un doute inutile.
                </p>
                <p>
                  <strong style={{ color: "rgba(255,255,255,0.7)" }}>L&apos;Executive Brief inclut un audit LinkedIn complet</strong>{' '}
                  qui scanne votre profil, détecte les incohérences, et vous donne des actions concrètes
                  à faire dans la journée.
                </p>
              </div>
              <div className="mt-5 pt-5 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <p className="text-[13px] font-semibold" style={{ color: "#E4B118" }}>
                  Inclus dans l&apos;Executive Brief — pas de supplément
                </p>
              </div>
            </GlassCard>
          </Reveal>
        </div>

        <Reveal>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { stat: "75%", label: "des recruteurs consultent LinkedIn avant un entretien", src: "LinkedIn Talent Solutions" },
              { stat: "14×", label: "plus de vues pour un profil avec photo professionnelle", src: "LinkedIn" },
              { stat: "85+", label: "score LinkedIn cible pour maximiser vos chances", src: "Analyse PRSTO" },
            ].map((s) => (
              <div key={s.stat} className="rounded-xl p-5 text-center border" style={{
                background: "rgba(255,255,255,0.02)",
                borderColor: "rgba(255,255,255,0.05)",
              }}>
                <p className="text-3xl font-extrabold tracking-[-0.03em] mb-1"
                  style={{ color: "#E4B118" }}>{s.stat}</p>
                <p className="text-[13px] leading-snug" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {s.label}
                </p>
                <p className="text-[11px] mt-1.5" style={{ color: "rgba(255,255,255,0.2)" }}>
                  Source : {s.src}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
