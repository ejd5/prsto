import Reveal from "@/components/landing/Reveal";
import GlassCard from "@/components/landing/GlassCard";

const data = [
  { name: "Ladders Career Coaching", price: "$47–$147/mois", includes: "Coaching + CV + LinkedIn + matching (abonnement)" },
  { name: "Ama La Vida Coaching", price: "$200–$500", includes: "Session coaching carrière individuelle 60min" },
  { name: "Big Interview", price: "$49–$99/mois", includes: "Plateforme simulation entretien + feedback (abonnement)" },
  { name: "Interview Igniter", price: "$37–$97", includes: "Accès base 500+ questions + guides PDF (achat unique)" },
  { name: "The Muse Coaching", price: "$99–$299", includes: "Session coaching carrière individuelle 45min" },
  { name: "Wibast Academy", price: "350–700€", includes: "Préparation entretien complète + rewriting CV + suivi 1 mois" },
  { name: "ExecSearches Coaching", price: "$295–$595", includes: "Mock interview + débrief RH expert (1 session)" },
  { name: "Knock'em Dead", price: "£27–£97", includes: "Formation entretien en ligne + modules vidéo" },
  { name: "Careerstone Group", price: "$1 000–$3 000", includes: "Executive coaching + advisory (programme complet)" },
];

export default function ValueSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-6">
        <Reveal>
          <div className="text-center mb-14">
            <p className="text-[12px] font-bold uppercase tracking-[0.18em] mb-4"
              style={{ color: "rgba(255,255,255,0.25)" }}>
              La transparence avant tout
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.03em] mb-4 font-serif" style={{ fontFamily: "Playfair Display, serif" }}>
              Pourquoi 29,90€ quand les prestations
              <br />
              <span style={{ color: "#F87171" }}>coûtent 37€ à 3 000€</span>
              <span style={{ color: "rgba(255,255,255,0.4)" }}> ?</span>
            </h2>
          </div>
        </Reveal>

        <div className="grid lg:grid-cols-2 gap-8 items-start mb-16">
          <Reveal variant="left">
            <GlassCard className="p-8">
              <h3 className="text-lg font-bold mb-4 tracking-[-0.02em]">Ce que vous coûte une préparation classique</h3>
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {data.map((d) => (
                  <div key={d.name} className="flex items-center justify-between py-2.5 border-b text-sm"
                    style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                    <div className="min-w-0 flex-1">
                      <span className="font-medium">{d.name}</span>
                      <p className="text-[12px] mt-0.5 pr-2" style={{ color: "rgba(255,255,255,0.35)" }}>
                        {d.includes}
                      </p>
                    </div>
                    <span className="font-bold whitespace-nowrap ml-3 shrink-0" style={{ color: "#F87171" }}>
                      {d.price}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[13px] mt-5 font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>
                Sources publiques (sites officiels, 2025-2026)
              </p>
            </GlassCard>
          </Reveal>

          <div className="space-y-6">
            <Reveal variant="right" delay={100}>
              <GlassCard className="p-7" featured>
                <div className="flex items-start gap-4">
                  <span className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shrink-0"
                    style={{ background: "rgba(228,177,24,0.15)", color: "#E4B118" }}>
                    1
                  </span>
                  <div>
                    <h4 className="text-[15px] font-bold mb-1">Vous achetez un résultat, pas un temps de parole</h4>
                    <p className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                      Un coach vend ses heures. Vous achetez des rendez-vous, pas une préparation. Résultat :
                      une séance d&apos;1h à 400€ où vous parlez la moitié du temps.
                    </p>
                    <div className="mt-3 pt-3 border-t text-[13px]" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                      <span className="font-semibold" style={{ color: "#E4B118" }}>Concret :</span>{' '}
                      <span style={{ color: "rgba(255,255,255,0.45)" }}>
                        Avec 29,90€, vous obtenez l&apos;équivalent de 15h de travail de préparation.
                        Soit <strong style={{ color: "rgba(255,255,255,0.7)" }}>2€/heure de préparation</strong>,
                        contre 200-500€/h pour une séance de coaching classique.
                      </span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </Reveal>

            <Reveal variant="right" delay={200}>
              <GlassCard className="p-7" featured>
                <div className="flex items-start gap-4">
                  <span className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shrink-0"
                    style={{ background: "rgba(228,177,24,0.15)", color: "#E4B118" }}>
                    2
                  </span>
                  <div>
                    <h4 className="text-[15px] font-bold mb-1">13 livrables, pas juste des « conseils »</h4>
                    <p className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                      Un coach vous donne des pistes d&apos;amélioration orales. Nous vous livrons 13 sections
                      écrites, détaillées, prêtes à imprimer et à emporter en entretien.
                    </p>
                    <div className="mt-3 pt-3 border-t text-[13px]" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                      <span className="font-semibold" style={{ color: "#E4B118" }}>Exemple :</span>{' '}
                      <span style={{ color: "rgba(255,255,255,0.45)" }}>
                        Nos clients arrivent en entretien avec leur plan 30-60-90 imprimé, leurs 20
                        questions STAR préparées, et leur kit négociation en main. Les recruteurs le
                        remarquent immédiatement. Certains ont eu un retour positif dès le lendemain.
                      </span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </Reveal>

            <Reveal variant="right" delay={300}>
              <GlassCard className="p-7" featured>
                <div className="flex items-start gap-4">
                  <span className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shrink-0"
                    style={{ background: "rgba(228,177,24,0.15)", color: "#E4B118" }}>
                    3
                  </span>
                  <div>
                    <h4 className="text-[15px] font-bold mb-1">Un investissement à retour immédiat</h4>
                    <p className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                      Un cadre dirigeant gagne entre 80k€ et 250k€ par an. L&apos;Executive Brief coûte
                      29,90€. C&apos;est <strong style={{ color: "rgba(255,255,255,0.7)" }}>0,01% de votre salaire annuel</strong> pour maximiser un
                      entretien qui peut faire varier votre rémunération de 15 à 30k€.
                    </p>
                    <div className="mt-3 pt-3 border-t text-[13px]" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                      <span className="font-semibold" style={{ color: "#E4B118" }}>Conseil :</span>{' '}
                      <span style={{ color: "rgba(255,255,255,0.45)" }}>
                        Si vous passez un entretien dans les 7 jours, chaque jour sans préparation vous
                        coûte en moyenne <strong style={{ color: "rgba(255,255,255,0.7)" }}>5 à 10% de chances en moins</strong> d&apos;être retenu.
                        Un dossier solide en 24h change la donne.
                      </span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </Reveal>

            <Reveal variant="right" delay={100}>
              <GlassCard className="p-7" featured>
                <div className="flex items-start gap-4">
                  <span className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shrink-0"
                    style={{ background: "rgba(228,177,24,0.15)", color: "#E4B118" }}>
                    4
                  </span>
                  <div>
                    <h4 className="text-[15px] font-bold mb-1">20 ans d&apos;expertise recrutement + IA</h4>
                    <p className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                      L&apos;Executive Brief est conçu par des professionnels du recrutement, de la chasse
                      de têtes, des RH, mais aussi de la direction commerciale et de la direction
                      générale. Cette pluralité d&apos;expériences permet une <strong style={{ color: "rgba(255,255,255,0.7)" }}>vision à 360°</strong> de
                      votre candidature — du recruteur qui reçoit votre CV au comité exécutif qui
                      prend la décision finale.
                    </p>
                    <div className="mt-3 pt-3 border-t text-[13px]" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                      <span className="font-semibold" style={{ color: "#E4B118" }}>Le résultat :</span>{' '}
                      <span style={{ color: "rgba(255,255,255,0.45)" }}>
                        L&apos;efficacité d&apos;un coach expert, amplifiée par l&apos;intelligence artificielle,
                        pour un coût 50 à 100 fois inférieur. Le meilleur des deux mondes.
                      </span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </Reveal>
          </div>
        </div>

        <Reveal>
          <div className="rounded-2xl p-8 md:p-10 text-center border" style={{
            background: "rgba(228,177,24,0.03)",
            borderColor: "rgba(228,177,24,0.12)",
          }}>
            <p className="text-[15px] font-medium mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>
              En résumé
            </p>
            <p className="text-xl md:text-2xl font-bold tracking-[-0.02em] mb-4">
              Les services de préparation vous coûtent 37€ à 3 000€ pour du temps de parole.
              <br />
              <span className="lp-text-shine" style={{
                background: "linear-gradient(135deg, #E4B118, #F2C94C)",
                backgroundClip: "text", WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                L&apos;Executive Brief vous livre l&apos;équivalent de 15h de préparation en 24h pour 29,90€.
              </span>
            </p>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
              Pas d&apos;abonnement. Pas de rendez-vous. Juste un dossier prêt à imprimer.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
