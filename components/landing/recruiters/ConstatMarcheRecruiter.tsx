"use client";

import Reveal from "../Reveal";
import ImgSlot from "../ImgSlot";
import { PrstoLogo } from "../PrstoLogo";

const EXEMPLES_CONCRETS = [
  {
    title: "Sophie — indépendante depuis 3 ans",
    before: "15h/semaine à formater des CVs et rédiger des lettres. 1 placement par mois. Abonnements : 1 200€/mois.",
    after: "PRSTO Solo : 99$/mois. 3 placements en 2 mois. 8 min par candidat. Elle passe ses journées à accompagner ses candidats.",
    stat: "3x plus de placements",
  },
  {
    title: "Cabinet Martin & Fils — 5 recruteurs",
    before: "LinkedIn Recruiter + ATS + Indeed + rédacteur externe. Facture mensuelle : 4 200€. Coordinations complexes.",
    after: "PRSTO Elite : 349$/mois. Toute l'équipe équipée. Zéro outil externe de préparation. Pipeline consolidé.",
    stat: "−92% de coûts outils",
  },
  {
    title: "Marc — consultant en transition",
    before: "Refusait l'automatisation. 6 mois pour décrocher sa première mission. Stress, burn-out, doute.",
    after: "Accompagnement PRSTO + Founder's Circle. Première mission en 2 semaines. Aujourd'hui : 4 missions simultanées.",
    stat: "De 6 mois à 2 semaines",
  },
];

const MODELS = [
  {
    name: "Success Fee",
    desc: "Le modèle historique. Vous facturez 20 à 35% du salaire annuel brut du candidat placé.",
    typical: "20-35% du salaire brut",
    example: "Sur un placement à 45k€ = 9 000 à 15 750€ de commission",
    pro: "Récompense proportionnelle au placement",
    con: "Paiement unique, pas de revenu récurrent",
    color: "#103826",
  },
  {
    name: "Flat Fee",
    desc: "Forfait fixe par mission, indépendant du salaire. Simple et prévisible.",
    typical: "3 000 à 8 000€ par mission",
    example: "Facturation mensuelle ou à l'étape (présentation, entretien, placement)",
    pro: "Prévisible, facturation simplifiée",
    con: "Plafonné, pas de upside sur les gros salaires",
    color: "#E4B118",
  },
  {
    name: "TJM / Régie",
    desc: "Le recruteur facture au temps passé (journalier ou horaire). Modèle de consultant.",
    typical: "300 à 800€ / jour",
    example: "Mission de 3 mois à 500€/jour = 30 000€",
    pro: "Revenu récurrent stable",
    con: "Pas d'effet levier : vous vendez votre temps",
    color: "#6A8F6D",
  },
  {
    name: "RPO",
    desc: "Recruitment Process Outsourcing. Prise en charge complète du recrutement pour une entreprise.",
    typical: "Forfait mensuel 5 000 à 20 000€",
    example: "Gestion de 5 à 20 postes simultanés en marque blanche",
    pro: "Contrat long terme, volume",
    con: "Très lourd : équipe, process, reporting",
    color: "#103826",
  },
];

const BARRIERS = [
  {
    title: "Coût des outils",
    items: [
      "LinkedIn Recruiter Cloud : 825€/mois",
      "ATS (Bullhorn, Manatal, Recruit CRM) : 50-200€/mois",
      "Sites d'emploi (Indeed, Apec) : 300-500€/annonce",
      "Total mensuel : 1 200 à 2 500€ avant de placer qui que ce soit",
    ],
  },
  {
    title: "Temps perdu en administrative",
    items: [
      "50% du temps en moyenne sur des tâches non stratégiques",
      "CV formatting : 30-60 min par candidat",
      "Lettres de motivation : 20-30 min par candidat",
      "Vérification ATS : 10-15 min par candidat",
    ],
  },
  {
    title: "Fragmentation des outils",
    items: [
      "Un outil pour le CRM, un pour le sourcing, un pour les CV",
      "Aucune intégration entre la préparation et le suivi",
      "Données dispersées, pas de vision consolidée",
      "Courbe d'apprentissage permanente",
    ],
  },
];

export function ConstatMarcheRecruiter() {
  return (
    <section id="constat" className="py-28" style={{ background: "rgba(106,143,109,0.03)" }}>
      <div className="max-w-6xl mx-auto px-6">
        <Reveal variant="up" className="text-center mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11.5px] font-semibold tracking-wide mb-5" style={{
            borderColor: "rgba(228,177,24,0.2)", color: "#A38010",
            background: "rgba(228,177,24,0.06)",
          }}>
            ✦ Le constat
          </div>
          <h2 className="font-serif text-[clamp(1.875rem,3.5vw,2.875rem)] font-bold tracking-[-0.04em] leading-[1.08] mb-3 text-[#0B1F18]">
            Pourquoi le recrutement<br />indépendant coûte si cher
          </h2>
          <p className="text-sm max-w-xl mx-auto" style={{ color: "#6A8F6D" }}>
            Le marché du recrutement en France pèse plusieurs milliards. Pourtant, les indépendants 
            et petits cabinets n&apos;ont jamais eu accès à des outils vraiment adaptés.
          </p>
        </Reveal>

        <Reveal variant="up" delay={50} className="mb-12">
          <ImgSlot
            num={4}
            format="banner"
            prompt="Barres horizontales : LinkedIn 825€, ATS 200€, Sites 500€ en gris → PRSTO 99$ en doré. Total barré."
            promptLong="Graphique coût mensuel du recruteur indépendant. Barres horizontales comparant LinkedIn Recruiter Cloud 825€ en gris-roux, ATS 200€ en gris, Sites emploi 500€ en gris, PRSTO 99$ en doré #E4B118 brillant. Chaque barre a une pastille icon correspondante. À droite un total 1200-2500€ barré avec une grosse croix fine remplacé par 99$ en doré. Fond #FAF6EF très clair. Style Bloomberg TradingView data-driven propre percutant."
          />
        </Reveal>

        <div className="grid md:grid-cols-3 gap-5 mb-20">
          {BARRIERS.map((b, i) => (
            <Reveal variant="up" delay={i * 80} key={b.title}>
              <div className="rounded-2xl border p-7 h-full" style={{
                borderColor: "rgba(16,56,38,0.06)", background: "#FFFDF8",
              }}>
                <div className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: "#A38010" }}>
                  ⚠ {b.title}
                </div>
                <ul className="space-y-2.5">
                  {b.items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-0.5 w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ background: "#A38010" }} />
                      <span className="text-sm leading-snug" style={{ color: "#50625A" }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Exemples concrets — Avant / Après */}
        <Reveal variant="up" className="text-center mb-10">
          <h3 className="font-serif text-[clamp(1.375rem,2.2vw,1.875rem)] font-bold tracking-[-0.03em] mb-3 text-[#0B1F18] flex items-center justify-center gap-2 flex-wrap">
            <span>Avant</span>
            <PrstoLogo size={85} style={{ verticalAlign: "middle" }} />
            <span>/ Après</span>
            <PrstoLogo size={85} style={{ verticalAlign: "middle" }} />
          </h3>
          <p className="text-sm max-w-xl mx-auto" style={{ color: "#6A8F6D" }}>
            Des cas réels de recruteurs qui ont changé leur façon de travailler.
          </p>
        </Reveal>

        <div className="space-y-6 mb-20">
          {EXEMPLES_CONCRETS.map((ex, i) => (
            <Reveal variant="up" delay={i * 100} key={ex.title}>
              <div className="rounded-2xl border overflow-hidden" style={{
                borderColor: "rgba(16,56,38,0.06)", background: "#FFFDF8",
              }}>
                <div className="md:grid md:grid-cols-5 gap-0">
                  <div className="md:col-span-3 p-6 md:p-8">
                    <div className="text-sm font-bold mb-3" style={{ color: "#0B1F18" }}>{ex.title}</div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-xl p-4" style={{
                        background: "rgba(228,177,24,0.05)", border: "1px solid rgba(228,177,24,0.1)",
                      }}>
                        <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#A38010" }}>Avant</div>
                        <p className="text-sm leading-relaxed" style={{ color: "#50625A" }}>{ex.before}</p>
                      </div>
                      <div className="rounded-xl p-4" style={{
                        background: "rgba(16,56,38,0.05)", border: "1px solid rgba(16,56,38,0.1)",
                      }}>
                        <div className="text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1" style={{ color: "#103826" }}>
                          <span>Après</span>
                          <PrstoLogo size={40} style={{ verticalAlign: "middle" }} />
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color: "#50625A" }}>{ex.after}</p>
                      </div>
                    </div>
                  </div>
                  <div className="md:col-span-2 flex items-center justify-center p-6" style={{
                    background: "rgba(16,56,38,0.02)",
                  }}>
                    <div className="text-center">
                      <div className="text-lg font-extrabold font-serif" style={{ color: "#E4B118", fontFamily: "Playfair Display, serif" }}>
                        {ex.stat}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal variant="up" delay={50} className="mb-12">
          <ImgSlot
            num={5}
            format="banner"
            prompt="Split-screen : gauche bureau sombre/désordre/recruteur fatigué — droite bureau rangé/écran PRSTO lumineux/recruteur souriant."
            promptLong="Split-screen Avant vs Après PRSTO style narratif. Moitié gauche Avant bureau sombre désordre une tasse de café froid un écran avec 15 onglets ouverts tête d'un recruteur fatigué les mains dans les cheveux. Tons bleu-gris froid éclairage dur. Moitié droite Après même bureau mais rangé un écran PRSTO ouvert lumineux le recruteur souriant un candidat sur un appel vidéo. Tons chauds dorés éclairage doux. Au centre une transition du gris vers le doré. Pas de texte. Style cinématographique contraste fort."
          />
        </Reveal>

        <Reveal variant="up" className="text-center mb-12">
          <h3 className="font-serif text-[clamp(1.375rem,2.5vw,2rem)] font-bold tracking-[-0.03em] mb-3 text-[#0B1F18]">
            Les 4 modèles économiques du recrutement
          </h3>
          <p className="text-sm max-w-xl mx-auto" style={{ color: "#6A8F6D" }}>
            Chaque modèle a ses avantages et ses contraintes. Le choix dépend de votre marché, 
            de votre clientèle et de votre appétence au risque.
          </p>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-5">
          {MODELS.map((m, i) => (
            <Reveal variant="up" delay={i * 80} key={m.name}>
              <div className="rounded-2xl border p-7 h-full" style={{
                borderColor: "rgba(16,56,38,0.06)", background: "#FFFDF8",
              }}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-base font-bold" style={{ color: "#0B1F18" }}>{m.name}</h4>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{
                    background: `${m.color}12`, color: m.color, border: `1px solid ${m.color}20`,
                  }}>{m.typical}</span>
                </div>
                <p className="text-sm leading-relaxed mb-4" style={{ color: "#50625A" }}>{m.desc}</p>
                <div className="rounded-lg p-3 mb-2 text-xs" style={{
                  background: "rgba(16,56,38,0.03)", border: "1px solid rgba(16,56,38,0.06)",
                }}>
                  <span className="font-medium" style={{ color: "#0B1F18" }}>📌 Exemple : </span>
                  <span style={{ color: "#50625A" }}>{m.example}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="rounded-lg p-2.5 text-[11px]" style={{
                    background: "rgba(16,56,38,0.05)", border: "1px solid rgba(16,56,38,0.08)",
                  }}>
                    <span className="font-bold" style={{ color: "#103826" }}>✓ {m.pro.split(" ")[0]}</span>
                    <span style={{ color: "#50625A" }}> {m.pro.replace(/^[^ ]+ /, "")}</span>
                  </div>
                  <div className="rounded-lg p-2.5 text-[11px]" style={{
                    background: "rgba(228,177,24,0.05)", border: "1px solid rgba(228,177,24,0.12)",
                  }}>
                    <span className="font-bold" style={{ color: "#A38010" }}>⚠ {m.con.split(" ")[0]}</span>
                    <span style={{ color: "#50625A" }}> {m.con.replace(/^[^ ]+ /, "")}</span>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal variant="up" delay={50} className="mt-12">
          <ImgSlot
            num={6}
            format="banner"
            prompt="4 cartes alignées : Success Fee (% 20-35%), Flat Fee (€ 3-8k), TJM (300-800€/j), RPO (5-20k€/mois). Fond #103826."
            promptLong="Infographie des 4 modèles de recrutement. 4 cartes alignées horizontalement Success Fee icône pourcent + 20-35%. Flat Fee icône forfait + 3-8k€. TJM Régie icône calendrier + 300-800€/j. RPO icône building + 5-20k€/mois. Chaque carte a un fond #FFFDF8 avec bordure fine. Les 4 cartes sont posées sur un fond #103826. Titre discret Les 4 voies en haut à gauche en doré. Style conseil consulting McKinsey meets presentation design."
          />
        </Reveal>

        <Reveal variant="up" delay={300}>
          <div className="mt-10 p-7 rounded-2xl text-center" style={{
            background: "rgba(16,56,38,0.02)", border: "1px solid rgba(16,56,38,0.08)",
          }}>
            <p className="text-sm leading-relaxed" style={{ color: "#50625A" }}>
              <strong style={{ color: "#0B1F18" }}>Le vrai problème ?</strong> Quel que soit le modèle, 
              les outils de base (LinkedIn Recruiter + ATS + sites d&apos;emploi) coûtent au minimum{" "}
              <strong style={{ color: "#E4B118" }}>1 200€/mois</strong>. Ajoutez la préparation 
              manuelle des candidats (15-20h/semaine), et chaque placement vous coûte bien plus que 
              ce que vous pensez.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
