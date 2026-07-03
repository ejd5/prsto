"use client";

import Link from "next/link";
import { ArrowLeft, Users, Briefcase, Shield, Target, Globe } from "lucide-react";

const C = {
  forest: "#103826",
  gold: "#E4B118",
  ivory: "#FAF6EF",
  text: "#0B1F18",
  muted: "rgba(11,31,24,0.55)",
  cardBg: "rgba(16,56,38,0.04)",
  border: "rgba(16,56,38,0.08)",
};

const h1Font = { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, letterSpacing: "-0.03em" };
const h2Font = { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, letterSpacing: "-0.02em" };
const bodyFont = { fontFamily: "'Geist', 'Inter', sans-serif" };

const sections = [
  {
    id: "activer-son-reseau",
    icon: <Users size={20} />,
    title: "Activer son réseau sans être en recherche active",
    summary: "Entretenir et mobiliser son capital relationnel avant même d'avoir besoin d'en faire usage.",
    content: [
      "Le réseau professionnel est comme un jardin : il se cultive en continu, pas seulement en période de récolte. Les dirigeants les plus performants consacrent du temps à leur réseau bien avant d'entamer une recherche. Cette approche préventive transforme chaque relation en ressource mobilisable le moment venu, sans le signal de faiblesse que représenterait une sollicitation urgente.",
      "La règle des 5 % : consacrez 5 % de votre temps hebdomadaire — soit environ deux heures — à des actions réseau à faible intensité : un café avec un pair, un commentaire pertinent sur un article, une introduction désintéressée entre deux contacts. Ces micro-gestes cumulés créent un capital social qui fructifie de façon exponentielle.",
      "PRSTO identifie les moments opportuns pour réactiver une relation sans motif apparent : un anniversaire de collaboration, une actualité du secteur, un mouvement dans l'entreprise du contact. L'IA vous suggère le bon message, au bon moment, avec la bonne tonalité — pour rester présent sans être opportuniste.",
    ],
  },
  {
    id: "chasseurs-de-tetes",
    icon: <Briefcase size={20} />,
    title: "Travailler avec les chasseurs de têtes",
    summary: "Comment être repéré, contacté et recommandé par les cabinets qui placent les dirigeants.",
    content: [
      "Les chasseurs de têtes sont les architectes du marché invisible de l'emploi cadre dirigeant. Leur métier consiste à identifier des profils rares pour des mandats confidentiels. Être dans leur radar est un prérequis pour accéder aux 80 % de postes qui ne seront jamais publiés. Mais comment s'y inscrire sans être en recherche ?",
      "La cartographie des cabinets est votre première brique stratégique. Il existe environ 200 cabinets d'executive search en France, mais seuls 15 à 20 couvrent votre secteur et votre niveau de fonction. PRSTO dresse la liste des cabinets pertinents pour votre profil, identifie les consultants spécialisés dans votre industrie, et suggère une approche personnalisée pour chacun.",
      "L'entretien avec un chasseur de têtes n'est pas un entretien de recrutement. C'est un échange d'information où vous devez démontrer votre expertise sans donner l'impression de chercher activement. PRSTO vous prépare à ces entretiens avec un script adapté : présentation de votre parcours comme une trajectoire ascendante, expression d'une curiosité mesurée pour le marché, et demande de conseil qui flatte l'ego du consultant.",
    ],
  },
  {
    id: "linkedin-avance",
    icon: <Users size={20} />,
    title: "LinkedIn avancé pour dirigeants",
    summary: "Stratégie de contenu, positionnement éditorial et visibilité maîtrisée pour les cadres dirigeants.",
    content: [
      "LinkedIn est devenu le premier outil de veille et de sourcing pour les chasseurs de têtes. Un dirigeant qui n'y est pas visible n'existe pas dans le radar des cabinets. Mais la présence attendue d'un cadre dirigeant diffère radicalement de celle d'un influenceur ou d'un commercial : c'est une présence de fond, pas de volume.",
      "La stratégie de contenu executive privilégie la profondeur à la fréquence. Deux publications par mois, chacune portant une idée forte étayée par une expérience concrète, auront plus d'impact que vingt posts d'actualité sans valeur ajoutée. PRSTO vous aide à structurer votre calendrier éditorial autour de trois piliers : votre expertise métier, votre vision du secteur, et votre leadership culturel.",
      "Le positionnement de profil est votre carte de visite permanente. Il doit répondre en moins de 5 secondes à trois questions : Qui êtes-vous ? Pourquoi êtes-vous légitime ? Qu'apportez-vous de spécifique ? PRSTO analyse votre profil actuel, le compare aux meilleurs profils de dirigeants de votre secteur, et génère des suggestions de reformulation pour chaque section — du titre à la description d'expérience en passant par les recommandations.",
    ],
  },
  {
    id: "cercles-communautes",
    icon: <Target size={20} />,
    title: "Cercles et communautés de dirigeants",
    summary: "Rejoindre les bons cercles où se créent les opportunités au plus haut niveau.",
    content: [
      "Au niveau dirigeant, les opportunités les plus stratégiques naissent dans des cercles restreints où la confiance précède la transaction. Clubs sectoriels, associations d'anciens, cercles de pairs, think tanks : ces communautés sont le théâtre d'échanges qui ne se produisent nulle part ailleurs. Un mandat d'administrateur, une recommandation pour un poste de CEO, une introduction auprès d'un fonds d'investissement — autant de décisions qui se préparent autour d'un dîner entre pairs.",
      "Tous les cercles ne se valent pas. PRSTO évalue pour chaque cercle potentiel sa pertinence pour votre trajectoire : qualité des membres, niveau décisionnel moyen, fréquence des recrutements croisés, et accessibilité réelle. Rejoindre un cercle trop en deçà de votre niveau vous fera perdre du temps ; viser un cercle trop fermé sans introduction est contre-productif.",
      "L'investissement dans un cercle doit être proportionné au retour attendu. Certains cercles exigent une cotisation annuelle élevée mais offrent un accès direct à des décideurs que vous ne rencontreriez pas autrement. D'autres, plus informels, demandent du temps et de la réciprocité. PRSTO vous conseille sur le bon équilibre entre cercles payants et cercles d'influence, et vous aide à préparer votre dossier de candidature pour les plus sélectifs.",
    ],
  },
  {
    id: "mentor-sponsor",
    icon: <Shield size={20} />,
    title: "Mentor et sponsor : différents types de soutien",
    summary: "Comprendre la différence entre mentor, sponsor, coach et conseiller — et activer chaque levier.",
    content: [
      "Beaucoup de dirigeants confondent mentor et sponsor. Pourtant, ces deux rôles sont radicalement différents et complémentaires. Un mentor vous conseille, vous écoute et partage son expérience — il travaille sur vous. Un sponsor parle de vous dans les instances où vous n'êtes pas présent — il travaille pour vous. Sans sponsor, votre progression ralentit. Sans mentor, votre discernement s'émousse.",
      "Le sponsor est le levier le plus sous-utilisé du réseau dirigeant. Un sponsor est une personne en position d'autorité qui engage sa crédibilité pour vous recommander, vous nommer, ou vous défendre dans une décision d'organisation. PRSTO vous aide à identifier vos sponsors potentiels : anciens N+1 devenus administrateurs, collègues promus à des postes clés, ou personnalités influentes avec qui vous avez travaillé. L'IA vous suggère comment cultiver ces relations sans paraître calculateur.",
      "Le mentor, quant à lui, est un compagnon de réflexion. Contrairement au coach (souvent payant et méthodologique), le mentor est généralement bénévole et expérientiel. PRSTO cartographie votre réseau pour détecter les profils de mentors naturels : dirigeants plus expérimentés qui partagent vos valeurs, ont un parcours inspirant, et manifestent une disponibilité pour transmettre. Un bon mentor se reconnaît à sa capacité à poser les bonnes questions plutôt qu'à donner les bonnes réponses.",
    ],
  },
  {
    id: "networking-strategique",
    icon: <Globe size={20} />,
    title: "Networking stratégique : cultiver son réseau sur la durée",
    summary: "Les méthodes des dirigeants qui transforment leur réseau en avantage concurrentiel permanent.",
    content: [
      "Le networking stratégique n'a rien à voir avec la collecte de cartes de visite ou l'accumulation de connexions LinkedIn. C'est une pratique délibérée, mesurée, qui vise à construire un ensemble de relations à haute valeur de réciprocité. Un réseau stratégique se pilote comme un portefeuille d'investissement : diversification, rendement ajusté du risque, et rééquilibrage périodique.",
      "La matrice de pilotage PRSTO classe vos relations selon deux axes : la proximité relationnelle (de la connaissance occasionnelle à l'allié de long terme) et la valeur stratégique (de l'échange d'information à la co-création d'opportunités). Chaque trimestre, PRSTO vous propose un plan d'entretien : 3 relations à renforcer, 2 relations à réactiver, 1 nouvelle relation à initier dans une zone blanche de votre réseau.",
      "L'erreur la plus fréquente est de négliger son réseau en période de stabilité pour le solliciter frénétiquement en période de turbulence. Les dirigeants qui réussissent leurs transitions sont ceux qui ont envoyé des messages sans rien demander, partagé des introductions sans rien attendre, et participé à des événements sans rien négocier. PRSTO vous rappelle que le meilleur moment pour cultiver son réseau, c'est quand vous n'en avez pas besoin.",
    ],
  },
];

export default function ReseauPage() {
  return (
    <div style={{ background: C.ivory, minHeight: "100vh", ...bodyFont, color: C.text }}>
      <div style={{ background: C.forest }}>
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/prsto/ressources"
              className="flex items-center gap-2 text-sm transition-colors"
              style={{ color: "rgba(255,255,255,0.6)" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.gold}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)"}
            >
              <ArrowLeft size={14} /> Ressources
            </Link>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>|</span>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>PRSTO</span>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-12">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: C.gold }}
          >
            <Users size={20} style={{ color: C.text }} />
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: C.muted }}>
            Guide Réseau
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl mb-5 leading-tight" style={h1Font}>
          Réseau & chasseurs de têtes<br />
          <span style={{ color: C.forest }}>pour cadres dirigeants</span>
        </h1>
        <p className="text-base md:text-lg max-w-2xl leading-relaxed" style={{ color: C.muted, ...bodyFont }}>
          Votre réseau est votre actif le plus précieux — et le plus mal exploité.
          Ce guide vous révèle comment le cultiver, l&apos;activer et le monétiser en
          capital carrière, sans jamais donner l&apos;impression de quémander.
        </p>
      </div>

      {/* Contenu */}
      <div className="max-w-5xl mx-auto px-6 pb-24 space-y-10">
        {sections.map((section, idx) => (
          <article
            key={section.id}
            id={section.id}
            className="rounded-3xl border overflow-hidden"
            style={{
              background: "white",
              borderColor: C.border,
            }}
          >
            <div className="p-8 md:p-10">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(228,177,24,0.15)" }}
                >
                  <span style={{ color: C.gold }}>{section.icon}</span>
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: C.muted }}>
                  {String(idx + 1).padStart(2, "0")}
                </span>
              </div>

              <h2 className="text-2xl md:text-3xl mb-3 leading-tight" style={h2Font}>
                {section.title}
              </h2>

              <p className="text-sm md:text-base mb-6 font-medium" style={{ color: "rgba(16,56,38,0.7)" }}>
                {section.summary}
              </p>

              <div className="space-y-5">
                {section.content.map((paragraph, pi) => (
                  <p
                    key={pi}
                    className="text-[15px] md:text-base leading-[1.8]"
                    style={{ color: pi === 0 ? C.text : C.muted, ...bodyFont }}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Navigation rapide */}
      <div className="max-w-5xl mx-auto px-6 pb-24">
        <div
          className="rounded-3xl border p-8 md:p-10"
          style={{ background: C.forest, borderColor: "rgba(255,255,255,0.08)" }}
        >
          <h2 className="text-xl md:text-2xl mb-6 text-white" style={h2Font}>
            Prêt à activer votre réseau ?
          </h2>
          <p className="text-sm md:text-base mb-8 leading-relaxed" style={{ color: "rgba(255,255,255,0.6)", ...bodyFont }}>
            PRSTO cartographie votre réseau, identifie vos angles morts relationnels et vous guide
            pas à pas pour transformer chaque connexion en levier de carrière.
          </p>
          <Link
            href="/prsto"
            className="inline-flex items-center gap-3 px-7 py-3 rounded-xl text-sm font-bold transition-all"
            style={{ background: C.gold, color: C.text }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "#D09E10";
              el.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = C.gold;
              el.style.transform = "translateY(0)";
            }}
          >
            Découvrir PRSTO →
          </Link>
        </div>
      </div>
    </div>
  );
}
