"use client";

import Reveal from "../Reveal";
import Link from "next/link";
import { MapPin, Sparkles, GraduationCap, Star, Medal, Users } from "lucide-react";
import ImgSlot from "../ImgSlot";

export function AccompagnementRecruiter() {
  return (
    <section id="accompagnement" className="py-28">
      <div className="max-w-6xl mx-auto px-6">
        <Reveal variant="up" className="text-center mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11.5px] font-semibold tracking-wide mb-5" style={{
            borderColor: "rgba(228,177,24,0.2)", color: "#A38010",
            background: "rgba(228,177,24,0.06)",
          }}>
            ✦ Votre accompagnateur
          </div>
          <h2 className="font-serif text-[clamp(1.875rem,3.5vw,2.875rem)] font-bold tracking-[-0.04em] leading-[1.08] mb-3 text-[#0B1F18]">
            Vous n&apos;êtes pas seul
          </h2>
          <p className="text-sm max-w-xl mx-auto" style={{ color: "#6A8F6D" }}>
            PRSTO, c&apos;est aussi un accompagnement humain. Elton Duarte met 20+ ans 
            d&apos;expérience en transformation RH à votre service.
          </p>
        </Reveal>

        <Reveal variant="up" delay={50} className="mb-10">
          <ImgSlot
            num={20}
            format="banner"
            prompt="Bannière 'Accompagnement Elton' — photo ou illustration d'un mentor/coach en réunion avec un recruteur. Ambiance bienveillante et professionnelle. Tons chauds."
            promptLong="Bannière accompagnement PRSTO. Composition chaude et humaine. À gauche une main tenant un smartphone avec l'interface PRSTO ouverte. Au milieu un fond flou de bureau chaleureux avec plantes et lumière naturelle. À droite icônes de support (chat 24/7 email téléphone) disposées en triangle avec le mot prioritaire sous forme de rayon doré qui enveloppe le tout. Fond crème #FFFDF8 avec touches de #E4B118. Style editorial warm human-centric."
          />
        </Reveal>

        <div className="grid md:grid-cols-5 gap-5 mb-16">
          {[
            { icon: MapPin, label: "Paris / Lisbonne / Remote", sub: "Présent en Europe" },
            { icon: Medal, label: "20+ ans", sub: "Dans le recrutement et la transformation RH" },
            { icon: GraduationCap, label: "Formateur", sub: "Accompagnement individuel et collectif" },
            { icon: Star, label: "Founder's Circle", sub: "Communauté exclusive de recruteurs" },
            { icon: Users, label: "Réseau", sub: "500+ recruteurs accompagnés" },
          ].map((s, i) => (
            <Reveal variant="up" delay={i * 60} key={s.label}>
              <div className="text-center p-5 rounded-2xl border" style={{
                borderColor: "rgba(16,56,38,0.06)", background: "#FFFDF8",
              }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3" style={{
                  background: "rgba(228,177,24,0.1)", border: "1px solid rgba(228,177,24,0.15)",
                }}>
                  <s.icon size={18} style={{ color: "#A38010" }} />
                </div>
                <div className="text-sm font-bold" style={{ color: "#0B1F18" }}>{s.label}</div>
                <div className="text-[11px]" style={{ color: "#6A8F6D" }}>{s.sub}</div>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Reveal variant="up" delay={80}>
            <div className="rounded-2xl border p-8 h-full" style={{
              borderColor: "rgba(16,56,38,0.06)", background: "#FFFDF8",
            }}>
              <h3 className="text-xl font-bold mb-4 font-serif" style={{ color: "#0B1F18", fontFamily: "Playfair Display, serif" }}>
                L&apos;accompagnement Elton
              </h3>
              <div className="space-y-4">
                {[
                  {
                    title: "Stratégie de positionnement",
                    desc: "Définissez votre niche, votre offre de service et votre proposition de valeur pour vous démarquer sur votre marché.",
                  },
                  {
                    title: "Formation aux outils PRSTO",
                    desc: "Maîtrisez chaque module : CV Formatter, Market Radar, ATS Scanner, LinkedIn Optimizer. Des sessions individuelles ou en petit groupe.",
                  },
                  {
                    title: "Optimisation de votre productivité",
                    desc: "Analysez votre workflow actuel, identifiez les goulets d'étranglement et mettez en place un système qui vous fait gagner 15-20h par mois.",
                  },
                  {
                    title: "Conseil en développement commercial",
                    desc: "Comment trouver vos premiers clients, négocier vos missions, et construire un portefeuille de placements récurrents.",
                  },
                ].map((item) => (
                  <div key={item.title}>
                    <h4 className="text-sm font-bold mb-1" style={{ color: "#103826" }}>{item.title}</h4>
                    <p className="text-sm leading-relaxed" style={{ color: "#50625A" }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal variant="up" delay={120}>
            <div className="rounded-2xl border p-8 h-full" style={{
              borderColor: "rgba(228,177,24,0.12)", background: "rgba(228,177,24,0.03)",
            }}>
              <h3 className="text-xl font-bold mb-4 font-serif" style={{ color: "#0B1F18", fontFamily: "Playfair Display, serif" }}>
                Le Founder&apos;s Circle
              </h3>
              <p className="text-sm leading-relaxed mb-5" style={{ color: "#50625A" }}>
                Une communauté exclusive de recruteurs qui utilisent PRSTO pour construire leur 
                activité. Pas un réseau de franchise mais un groupe de pairs qui partagent leurs 
                expériences, leurs méthodes et leurs succès.
              </p>
              <div className="space-y-3 mb-6">
                {[
                  "Masterclass mensuelles avec Elton",
                  "Partage de deals et recommandations",
                  "Benchmark des meilleures pratiques",
                  "Accès aux bêtas et fonctionnalités en avant-première",
                  "Annuaire privé des membres du cercle",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <span className="mt-0.5 w-[18px] h-[18px] rounded-md flex items-center justify-center flex-shrink-0 text-[8px] font-bold" style={{
                      background: "rgba(228,177,24,0.12)", border: "1px solid rgba(228,177,24,0.2)", color: "#A38010",
                    }}>✓</span>
                    <span className="text-sm" style={{ color: "#0B1F18" }}>{item}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-xl p-5 text-sm text-center" style={{
                background: "rgba(16,56,38,0.03)", border: "1px solid rgba(16,56,38,0.08)",
              }}>
                <div className="font-bold" style={{ color: "#0B1F18" }}>Déjà 500+ recruteurs accompagnés</div>
                <div style={{ color: "#6A8F6D" }}>Rejoignez le cercle dès votre abonnement Pro.</div>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal variant="up" delay={150}>
          <div className="rounded-2xl border p-8 md:p-10 text-center" style={{
            borderColor: "rgba(16,56,38,0.08)", background: "rgba(16,56,38,0.02)",
          }}>
            <div className="max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold mb-3 font-serif" style={{ color: "#0B1F18", fontFamily: "Playfair Display, serif" }}>
                Prêt à passer en mode autonome ?
              </h3>
              <p className="text-sm leading-relaxed mb-6" style={{ color: "#50625A" }}>
                Que vous soyez recruteur indépendant, consultant en transition ou cabinet 
                cherchant à équiper votre équipe, Elton vous reçoit pour un échange 
                de 30 minutes sans engagement. Pas de vente, pas de pression, juste 
                un diagnostic personnalisé de votre situation.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link href="/recruiter/dashboard"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
                  style={{
                    background: "#E4B118", color: "#082E1E",
                    boxShadow: "0 4px 20px rgba(228,177,24,0.25)",
                    textDecoration: "none",
                  }}
                >
                  <Sparkles size={16} />
                  Réserver mon appel découverte
                </Link>
                <a href="mailto:elton@prsto.app"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium border transition-all"
                  style={{
                    borderColor: "rgba(16,56,38,0.15)", color: "#50625A", textDecoration: "none",
                  }}
                >
                  elton@prsto.app
                </a>
              </div>
              <p className="text-xs mt-4" style={{ color: "#6A8F6D" }}>
                Réponse sous 24h. Ou rejoignez directement la communauté dès votre inscription.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
