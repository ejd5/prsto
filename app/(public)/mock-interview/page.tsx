"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Mic, Video, BarChart3, Globe, Users, Sparkles, Play, Check, ChevronLeft, ChevronRight, FileText, Brain, Clock, Star, TrendingUp, Briefcase, Eye, Quote } from "lucide-react";
import { LandingHeader, LandingFooter, ScrollProgress } from "@/components/landing";
import Reveal from "@/components/landing/Reveal";

// ─── DATA ─────────────────────────────────────────

const PANEL_MEMBERS = [
  {
    name: "Ingrid Dubois",
    title: "Directrice des Ressources Humaines",
    img: "/branding/portraits/drh-ingrid/ingrid-01.png",
    description: "La DRH évalue avant tout l'adéquation culturelle et le potentiel humain. Elle observe votre capacité à vous intégrer, votre intelligence relationnelle et votre vision du leadership. Elle sait reconnaître les soft skills qui font la différence entre un bon CV et un grand collaborateur. En entretien, elle sera attentive à votre écoute, votre capacité à recevoir des feedbacks et votre vision du management humain.",
    longText: "La Directrice des Ressources Humaines est souvent le premier filtre d'un processus de recrutement. Elle évalue l'adéquation culturelle, le potentiel d'évolution et les soft skills. Elle a vu passer des centaines de profils et sait détecter les candidats qui ont à la fois l'expérience et l'intelligence relationnelle. Elle posera des questions sur votre management, votre gestion des conflits et votre capacité à vous intégrer dans une équipe. Son regard est celui de l'humain avant celui de la fonction.",
    strengths: ["Bienveillance & écoute", "Culture d'entreprise", "Potentiel humain"],
    examples: [
      "Parlez-moi d'un conflit que vous avez résolu au sein de votre équipe.",
      "Comment adaptez-vous votre management à des personnalités très différentes ?",
      "Décrivez une situation où vous avez dû recruter. Qu'avez-vous cherché ?",
    ],
  },
  {
    name: "Paul Mercier",
    title: "CEO / Directeur Général",
    img: "/branding/portraits/ceo-paul/paul-01.png",
    description: "Le CEO juge la vision stratégique, la capacité à prendre des décisions et l'aisance face à un dirigeant. Il teste votre leadership, votre lecture des enjeux business et votre aptitude à défendre vos idées au plus haut niveau. Un entretien avec un CEO est toujours plus exigeant : on ne lui vend pas un CV, on lui vend une vision.",
    longText: "Passer un entretien avec un CEO est un exercice particulier. Il n'attend pas que vous récitiez votre parcours : il veut savoir comment vous pensez, comment vous décidez et comment vous vous positionnez face à l'incertitude. Il vous challengera sur votre vision du marché, votre lecture des tendances et votre capacité à porter des décisions difficiles. C'est l'interlocuteur le plus exigeant du panel, mais aussi celui dont le feu vert est indispensable.",
    strengths: ["Vision stratégique", "Leadership", "Prise de décision"],
    examples: [
      "Où sera votre secteur dans 5 ans ? Quelle stratégie proposez-vous ?",
      "Prenez une décision difficile que vous avez dû imposer. Comment avez-vous fait ?",
      "Si vous deviez choisir entre croissance et rentabilité demain, que décidez-vous ?",
    ],
  },
  {
    name: "John Koffi",
    title: "CTO / Directeur Technique",
    img: "/branding/portraits/cto-john/john-01.png",
    description: "Le CTO examine la rigueur technique, la capacité à innover et à manager une équipe d'ingénieurs. Il évalue votre compréhension des enjeux technologiques et votre aptitude à les traduire en décisions stratégiques. Attention : les réponses vagues ou trop commerciales ne passent pas.",
    longText: "Un entretien avec un Directeur Technique est exigeant sur le fond mais pas uniquement technique. Le CTO évalue votre capacité à recruter et fidéliser des talents tech, votre vision de l'architecture et votre gestion de la dette technique. Mais il regarde aussi votre aptitude à expliquer des sujets complexes à des non-techniciens, votre culture de l'innovation et votre capacité à prioriser dans un environnement contraint.",
    strengths: ["Rigueur technique", "Innovation", "Management d'équipes tech"],
    examples: [
      "Comment gérez-vous la dette technique dans un contexte de croissance rapide ?",
      "Décrivez l'architecture d'un projet dont vous êtes fier.",
      "Comment recrutez-vous et fidélisez-vous vos talents techniques ?",
    ],
  },
  {
    name: "Sabrina Lopez",
    title: "Directrice Marketing",
    img: "/branding/portraits/dirmarketing-sabrina/sabrina-01.png",
    description: "La directrice Marketing évalue la créativité stratégique, l'orientation client et la capacité à incarner une marque. Elle teste votre vision commerciale et votre aptitude à construire un récit convaincant autour de vos projets. Un bon entretien marketing se gagne par des chiffres ET une histoire.",
    longText: "La Directrice Marketing cherche quelqu'un qui combine la rigueur analytique et la créativité. Elle attend des chiffres précis (ROI, CAC, LTV) mais aussi une capacité à raconter une histoire, à incarner la marque et à entraîner une équipe. Elle testera votre connaissance du marché, votre vision de la marque employeur et votre capacité à prioriser des actions dans un budget contraint. C'est un entretien où il faut briller sur le fond comme sur la forme.",
    strengths: ["Créativité stratégique", "Orientation client", "Brand storytelling"],
    examples: [
      "Quelle est la campagne marketing qui vous a le plus marqué et pourquoi ?",
      "Comment mesurez-vous l'impact de vos actions sur la marque employeur ?",
      "Si notre budget était réduit de 30% demain, quelle est votre première décision ?",
    ],
  },
  {
    name: "Lola Petit",
    title: "Responsable RH & Talents",
    img: "/branding/portraits/rhmanager-lola/lola-01.png",
    description: "La responsable RH examine le développement des talents, la gestion de carrière et la marque employeur. Elle sait détecter les profils à fort potentiel et évalue votre capacité à évoluer dans l'organisation. Elle sera votre alliée si vous montrez de la maturité et de l'ambition mesurée.",
    longText: "La Responsable RH & Talents est votre intermédiaire naturel dans le processus. Elle évalue votre adéquation avec la culture de l'entreprise, votre potentiel d'évolution et votre capacité à vous intégrer. Elle posera des questions sur votre parcours, vos motivations réelles et votre vision de votre carrière. Elle sait détecter les candidats qui ont réfléchi à leur projet professionnel de ceux qui subissent leur recherche.",
    strengths: ["Développement des talents", "Gestion de carrière", "Marque employeur"],
    examples: [
      "Comment avez-vous accompagné le développement de vos collaborateurs ?",
      "Qu'est-ce qui vous motive à changer de poste aujourd'hui ?",
      "Décrivez votre management : quels résultats obtenez-vous de vos équipes ?",
    ],
  },
  {
    name: "David Rousseau",
    title: "Membre du Conseil d'Administration",
    img: "/branding/portraits/boardmanager-david/david-01.png",
    description: "Le membre du Conseil apporte une vision transverse et indépendante. Il évalue votre capacité à convaincre un comité exécutif, à présenter des résultats avec impact et à naviguer dans des environnements complexes. Il cherche des dirigeants et non des exécutants.",
    longText: "Un entretien avec un membre du Conseil est souvent le plus stratégique. Il ne rentre pas dans le détail opérationnel : il évalue votre capacité à avoir une vision d'ensemble, à présenter des résultats de manière synthétique et impactante, et à gérer des situations de crise. Il cherche à savoir si vous avez l'étoffe d'un futur membre de comité de direction. Ses questions sont transverses et exigent une maturité de réflexion.",
    strengths: ["Vision transverse", "Impact & persuasion", "Environnements complexes"],
    examples: [
      "Présentez-moi les résultats de votre dernier exercice comme à un Conseil.",
      "Comment gérez-vous une partie prenante qui bloque votre projet ?",
      "Quelle est votre lecture des risques de votre secteur à moyen terme ?",
    ],
  },
];

const FEATURES = [
  {
    icon: Users,
    title: "Panel de 6 experts",
    desc: "DRH, CEO, CTO, Marketing, RH, Conseil : un comité de direction complet vous fait passer l'entretien. Chaque membre vous évalue selon ses propres critères : compétences humaines pour la DRH, vision stratégique pour le CEO, rigueur technique pour le CTO. Vous obtenez une évaluation 360 degrés qu'aucun coach seul ne peut vous offrir.",
    detail: "Contrairement à une préparation classique où un unique consultant vous prépare, Panel vous confronte à 6 regards différents. Chaque profil a ses propres attentes, ses propres questions, sa propre manière d'évaluer. C'est exactement ce qui vous attend dans un vrai processus de recrutement.",
  },
  {
    icon: Globe,
    title: "8 langues disponibles",
    desc: "Français, English, Español, Deutsch, Português, العربية, 日本語, Italiano. Les questions, vos réponses et l'audit final sont intégralement dans la langue que vous choisissez.",
    detail: "Idéal pour préparer un entretien dans une langue étrangère. Vous pouvez simuler un entretien en anglais avec un panel anglophone, recevoir vos questions et votre audit dans la même langue. Les non-dits, les expressions, le ton : tout est adapté à la culture professionnelle de la langue choisie.",
  },
  {
    icon: Mic,
    title: "Reconnaissance vocale instantanée",
    desc: "Parlez naturellement, notre outil écoute et retranscrit votre réponse en temps réel. Aucun enregistrement audio n'est conservé : votre voix reste sur votre appareil.",
    detail: "Vous n'avez pas à taper vos réponses. Vous parlez comme dans un vrai entretien. Notre outil capture vos mots, les structure et les analyse. Vous pouvez aussi répondre par écrit si vous préférez, mais la voix reste le mode le plus naturel et le plus proche des conditions réelles.",
  },
  {
    icon: BarChart3,
    title: "Analyse multidimensionnelle",
    desc: "Votre prestation est évaluée sur 5 axes notés de 0 à 20. Chaque note est accompagnée d'une preuve concrète tirée de votre entretien : une citation, un extrait, une observation.",
    detail: "Structure : utilisation de la méthode STAR, logique du discours, clarté de l'exposé. Concision : impact et densité de vos réponses, capacité à aller à l'essentiel. Impact : utilisation des chiffres clés, storytelling, capacité à convaincre. Posture : contact visuel, maintien, gestuelle analysés via votre webcam. Aisance orale : fluidité, hésitations, rythme. Chaque note est justifiée par un extrait de votre entretien.",
  },
  {
    icon: Video,
    title: "Analyse de votre présence",
    desc: "Votre webcam permet à notre outil d'analyser votre langage corporel : contact visuel, maintien, gestuelle. Ces indicateurs sont intégrés à votre audit pour une vision complète de votre prestation.",
    detail: "55% de l'impact d'un entretien est non-verbal. Votre regard, votre posture, vos gestes en disent autant que vos mots. Notre outil détecte si vous soutenez le regard, si votre maintien est assuré, si votre gestuelle est naturelle ou crispée. Sans rien enregistrer, tout est analysé en temps réel.",
  },
  {
    icon: FileText,
    title: "Audit complet livré sous 12 à 24h",
    desc: "Après votre simulation, un rapport détaillé vous est envoyé par email. Score global, 5 dimensions notées, forces identifiées, axes d'amélioration et recommandations personnalisées.",
    detail: "Un cabinet de recrutement met 1 à 2 semaines à vous faire un retour. Panel vous livre un audit structuré en moins de 24h. Le rapport est conçu pour être exploité immédiatement : vous savez exactement sur quoi travailler avant votre prochain entretien. Format PDF, imprimable, partageable avec votre coach.",
  },
];

const STEPS = [
  { step: "1", icon: FileText, title: "Remplissez votre questionnaire", desc: "Poste visé, entreprise, points forts. Indiquez avec quel membre du panel vous êtes en contact ou souhaitez vous entraîner. Notre outil analyse votre situation pour préparer une simulation sur-mesure." },
  { step: "2", icon: Brain, title: "Notre outil génère les questions", desc: "À partir de votre profil et du poste ciblé, notre IA propriétaire crée un questionnaire d'entretien personnalisé, paramétré en collaboration avec de véritables experts du recrutement. Chaque question est adaptée au membre du panel qui la posera." },
  { step: "3", icon: Users, title: "Simulation en conditions réelles", desc: "Le membre du panel choisi vous fait passer l'entretien. Questions, relances, suivi : une vraie conversation professionnelle. Si vous préparez plusieurs entretiens, vous pouvez enchaîner les simulations avec différents profils." },
  { step: "4", icon: Clock, title: "Recevez votre audit sous 12 à 24h", desc: "Score global sur 100, analyse détaillée des 5 dimensions, forces, axes d'amélioration et recommandations. Un rapport complet livré par email pour préparer sereinement votre prochain entretien." },
];

const FAQ = [
  { q: "Comment fonctionne Panel ?", a: "Vous remplissez un questionnaire sur le poste visé et l'entreprise. Vous indiquez avec quel profil vous êtes en contact (DRH, CEO, CTO...). Notre IA propriétaire (différente de ChatGPT) génère des questions adaptées, paramétrées avec l'aide d'experts du recrutement. La simulation se déroule avec le membre du panel correspondant. Après la session, vous recevez un audit complet sous 12 à 24h." },
  { q: "Quelle est la différence entre Panel et ChatGPT ou une IA généraliste ?", a: "ChatGPT peut simuler un entretien, mais ses questions sont génériques et son analyse superficielle. Panel utilise un algorithme propriétaire développé spécifiquement pour la simulation d'entretiens cadres, paramétré en collaboration avec des DRH, des chasseurs de têtes et des experts du recrutement. Notre IA analyse 5 dimensions précises, rebondit sur vos réponses avec des relances contextuelles et produit un audit structuré avec des preuves concrètes. Elle est conçue pour un seul usage : vous préparer à un entretien de direction." },
  { q: "Les simulations remplacent-elles un véritable entretien ?", a: "Non. Une simulation Panel ne remplace pas un vrai entretien avec un recruteur. Mais elle s'en approche au point que nos utilisateurs nous rapportent des résultats quasi identiques en termes de questions posées et de niveau d'exigence. L'avantage est que vous pouvez vous entraîner plusieurs fois, sans attendre des semaines pour obtenir un rendez-vous, et recevoir un audit objectif en 24h au lieu d'un retour parfois vague plusieurs semaines après." },
  { q: "Puis-je préparer plusieurs entretiens avec des profils différents ?", a: "Oui. Si vous avez un premier entretien avec la DRH et un second avec le CEO, vous pouvez faire deux simulations distinctes. Chaque simulation est adaptée au poste et à l'interlocuteur. PRSTO+ vous permet jusqu'à 4 simulations par mois." },
  { q: "Comment sont choisis les membres du panel ?", a: "Vous nous indiquez avec qui vous allez passer votre entretien réel (DRH, CEO, CTO, etc.). Notre outil sélectionne automatiquement le profil correspondant. Si vous avez plusieurs entretiens avec des interlocuteurs différents, nous vous suggérons une simulation pour chaque profil, avec un questionnaire dédié." },
  { q: "En quoi Panel est-il plus pertinent qu'un cabinet de recrutement ?", a: "Un cabinet de recrutement vous prépare à un entretien spécifique, mais le coût est élevé (500 à 1 500€) et le rendez-vous est unique. Panel vous offre une simulation avec un panel pluridisciplinaire, une analyse objective de votre prestation (posture, regard, structure des réponses) et un rapport détaillé livré en 12 à 24h, pour 19,90€. Vous pouvez multiplier les simulations sans vous ruiner." },
  { q: "Quel est l'avantage par rapport aux plateformes de préparation en ligne (49€/mois et plus) ?", a: "Les plateformes traditionnelles proposent souvent des cours vidéo génériques ou des simulations basiques sans analyse personnalisée. Panel est le seul outil qui combine un panel pluridisciplinaire, une analyse 5 dimensions avec preuves concrètes, une détection du langage corporel et un audit livré en 24h. Et contrairement à ces abonnements mensuels, vous pouvez acheter une session unique à 19,90€ sans engagement." },
  { q: "L'audio est-il enregistré ou conservé ?", a: "Non. Tout le traitement vocal se fait en temps réel sur votre appareil. Aucun fichier audio n'est conservé sur nos serveurs. Votre confidentialité est totale." },
  { q: "Puis-je passer une simulation sans webcam ?", a: "Oui. La webcam est optionnelle. Sans elle, vous ne bénéficiez pas de l'analyse de posture et de regard, mais les autres dimensions (structure, concision, impact, aisance orale) sont toujours évaluées." },
  { q: "Que contient le rapport d'audit ?", a: "Un score global sur 100. Une note détaillée sur 5 dimensions : structure, concision, impact, posture, aisance orale. Chaque note est justifiée par une preuve concrète extraite de votre réponse. 3 forces identifiées avec des exemples. 3 axes d'amélioration avec des recommandations précises. Livré par email en PDF." },
  { q: "Puis-je partager mon audit avec un recruteur ou un coach ?", a: "Oui, le rapport est conçu pour être partagé. Vous pouvez le télécharger en PDF et l'envoyer à votre coach, votre conseiller ou le garder pour votre suivi personnel." },
  { q: "Est-ce pertinent pour une promotion interne ?", a: "Très pertinent. Les entretiens de promotion interne sont souvent les plus stressants : vous connaissez l'entreprise, mais vous changez de niveau et d'interlocuteurs. Panel vous confronte à des profils que vous n'avez pas l'habitude de côtoyer (Conseil, CEO)." },
  { q: "Quelle est la différence entre la session unique (19,90€) et PRSTO+ (9,90€/sem) ?", a: "La session unique est un paiement ponctuel : vous achetez 1 simulation, vous recevez votre audit, sans engagement ni abonnement. Idéal si vous préparez un seul entretien. PRSTO+ est un abonnement hebdomadaire qui inclut jusqu'à 4 simulations par mois, l'accès à tous les outils PRSTO (ATS Scanner illimité, CV Optimizer, CRM Recruteur, Market Radar, LinkedIn Optimizer, Extension Chrome) et une priorité sur les délais d'audit. Si vous êtes en recherche active, PRSTO+ est plus économique. Si vous avez un unique entretien à préparer, la session unique suffit." },
  { q: "Puis-je essayer avant d'acheter ?", a: "Chaque simulation est personnalisée en fonction de votre profil, ce qui la rend unique. Nous ne proposons pas de version d'essai gratuite, mais vous pouvez acheter une session unique à 19,90€ sans engagement." },
  { q: "Combien de temps dure une simulation ?", a: "Entre 20 et 35 minutes selon le nombre de questions et la longueur de vos réponses. Vous pouvez interrompre à tout moment et reprendre plus tard." },
  { q: "Puis-je refaire une simulation avec le même profil ?", a: "Oui. Notre outil se souvient des questions déjà posées et génère un nouveau jeu de questions à chaque fois. Vous pouvez vous entraîner plusieurs fois sans répéter les mêmes réponses." },
];

const USE_CASES = [
  {
    icon: Briefcase,
    title: "Recherche active",
    desc: "Vous multipliez les entretiens avec différents recruteurs. Chaque simulation vous prépare à un interlocuteur spécifique. Vous suivez votre progression dans le temps grâce aux audits successifs.",
    stats: "68% des utilisateurs en recherche active recommandent Panel après 2 simulations",
  },
  {
    icon: TrendingUp,
    title: "Promotion interne",
    desc: "Vous changez de niveau et d'interlocuteurs. Vous devez convaincre un Comex, un Conseil, des pairs que vous ne fréquentiez pas. Panel vous confronte à ces profils avant le grand jour.",
    stats: "+40% de confiance déclarée après une simulation de promotion",
  },
  {
    icon: Globe,
    title: "Entretien en langue étrangère",
    desc: "Vous passez un entretien en anglais, allemand, espagnol ou italien. Il faut la justesse des termes, le ton, les expressions professionnelles. Panel vous entraîne dans la langue cible avec un audit dans cette même langue.",
    stats: "7 langues disponibles au choix pour les entretiens internationaux",
  },
  {
    icon: Eye,
    title: "Retour après un échec",
    desc: "Un entretien ne s'est pas passé comme prévu ? Vous ne savez pas ce qui a coincé ? Panel vous donne une analyse objective pour identifier précisément ce qui n'a pas fonctionné.",
    stats: "3 axes d'amélioration concrets identifiés après 1 simulation",
  },
];

const TESTIMONIALS = [
  {
    name: "Laurent D.",
    role: "Directeur Financier, cabinet de conseil",
    text: "J'avais un entretien avec le Directeur Général d'un groupe du CAC 40. La simulation avec Paul Mercier (CEO) m'a préparé à des questions que je n'avais pas anticipées, notamment sur la vision stratégique à 5 ans. Résultat : j'ai eu le poste. L'audit m'a aussi révélé que je parlais trop vite quand j'étais stressé, un détail que personne ne m'avait jamais dit.",
    score: "Promu après 2 simulations",
  },
  {
    name: "Sophie M.",
    role: "Directrice Marketing, start-up scale-up",
    text: "Je préparais un entretien en anglais pour un poste de CMO Europe. La simulation avec Sabrina Lopez m'a énormément aidée, non seulement sur le fond mais aussi sur la justesse des termes professionnels en anglais. L'audit a mis en lumière que j'utilisais trop de mots de remplissage, un feedback que j'ai pu corriger avant l'entretien réel.",
    score: "Préparation entretien international",
  },
  {
    name: "Marc K.",
    role: "CTO, groupe industriel",
    text: "Je passais un entretien avec un comité de direction : DRH, CEO et un membre du Conseil. J'ai fait trois simulations avec les profils correspondants. Chaque simulation m'a préparé à un angle différent. La DRH m'a challengé sur le management, le CEO sur la stratégie IT, le Conseil sur la gouvernance. Le jour J, j'étais prêt pour chaque interlocuteur.",
    score: "3 simulations, 3 profils",
  },
  {
    name: "Catherine R.",
    role: "RH Directrice, secteur bancaire",
    text: "J'accompagne des candidats et j'ai voulu tester Panel moi-même avant de le recommander. La qualité d'analyse du rapport m'a bluffée : bien plus précise et factuelle que les retours que je fais moi-même après un entretien. Depuis, je le recommande à tous mes candidats en préparation.",
    score: "Recommandé par une RH",
  },
];

const COMPARISON_ROWS = [
  { label: "Questions adaptées à votre poste et à votre profil", panel: true, cabinet: true, concurrent: false, seul: false },
  { label: "Panel pluridisciplinaire (DRH, CEO, CTO, Marketing...)", panel: true, cabinet: false, concurrent: false, seul: false },
  { label: "Analyse du langage corporel (posture, regard)", panel: true, cabinet: false, concurrent: false, seul: false },
  { label: "Audit structuré 5 dimensions avec preuves concrètes", panel: true, cabinet: false, concurrent: false, seul: false },
  { label: "Algorithme propriétaire PRSTO (vs IA générique)", panel: true, cabinet: "N/A", concurrent: false, seul: false },
  { label: "Rebond et relances sur vos réponses", panel: true, cabinet: true, concurrent: true, seul: false },
  { label: "Disponible 24h/7, sans rendez-vous", panel: true, cabinet: false, concurrent: true, seul: true },
  { label: "Rapport livré sous 12 à 24h", panel: true, cabinet: false, concurrent: "Sous 48-72h", seul: false },
  { label: "Multiples simulations sans coût additionnel", panel: true, cabinet: false, concurrent: false, seul: true },
  { label: "Délai pour obtenir un rendez-vous", panel: "Immédiat", cabinet: "1 à 3 semaines", concurrent: "Immédiat", seul: "Immédiat" },
  { label: "Prix", panel: "19,90€ simulation ou 9,90€/sem", cabinet: "500 à 1 500€", concurrent: "49€/mois et plus", seul: "Gratuit (limité)" },
];

// ─── COMPONENT ─────────────────────────────────────

export default function PanelLandingPage() {
  const [currentProfile, setCurrentProfile] = useState(0);
  const carouselTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const startCarousel = useCallback(() => {
    if (carouselTimerRef.current) clearInterval(carouselTimerRef.current);
    carouselTimerRef.current = setInterval(() => {
      setCurrentProfile((p) => (p + 1) % PANEL_MEMBERS.length);
    }, 12000);
  }, []);

  const stopCarousel = useCallback(() => {
    if (carouselTimerRef.current) {
      clearInterval(carouselTimerRef.current);
      carouselTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isPaused) startCarousel();
    else stopCarousel();
    return stopCarousel;
  }, [isPaused, startCarousel, stopCarousel]);

  const profile = PANEL_MEMBERS[currentProfile];
  const prevProfile = () => { setCurrentProfile((p) => (p === 0 ? PANEL_MEMBERS.length - 1 : p - 1)); };
  const nextProfile = () => { setCurrentProfile((p) => (p + 1) % PANEL_MEMBERS.length); };

  return (
    <div
      className="landing-page min-h-screen"
      style={{
        background: "#FAF6EF",
        color: "#0B1F18",
        fontFamily: "Inter, Inter Tight, ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <ScrollProgress />
      <LandingHeader />

      <main>
        {/* ═══════════════════════════════════════════
             HERO
           ═══════════════════════════════════════════ */}
        <section className="relative overflow-hidden min-h-[85vh] flex items-center">
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute top-[-20%] left-[10%] w-[520px] h-[520px] rounded-full"
              style={{ background: "radial-gradient(circle, rgba(16,56,38,0.08), transparent 65%)", filter: "blur(40px)" }} />
            <div className="absolute bottom-[-15%] right-[5%] w-[460px] h-[460px] rounded-full"
              style={{ background: "radial-gradient(circle, rgba(228,177,24,0.08), transparent 65%)", filter: "blur(40px)" }} />
          </div>

          <div className="max-w-6xl mx-auto px-6 pt-28 pb-16 md:pt-36 md:pb-20 w-full relative" style={{ zIndex: 2 }}>
            <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
              <div>
                <Reveal variant="up">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-medium mb-6" style={{
                    borderColor: "rgba(16,56,38,0.15)", color: "#103826",
                    background: "rgba(16,56,38,0.06)",
                  }}>
                    <Sparkles size={12} />
                    Simulation d&apos;entretien par IA
                  </div>
                </Reveal>

                <Reveal variant="up" delay={80}>
                  <h1 className="text-[clamp(2.5rem,5.5vw,4.25rem)] font-extrabold leading-[1.02] tracking-[-0.04em] mb-3" style={{ fontFamily: "Playfair Display, serif" }}>
                    <span className="block text-[#0B1F18]">
                      L&apos;entretien simulé
                    </span>
                    <span className="block bg-gradient-to-r from-[#103826] via-[#6A8F6D] to-[#103826] bg-clip-text text-transparent">
                      par ceux qui recrutent.
                    </span>
                  </h1>
                </Reveal>

                <Reveal variant="up" delay={160}>
                  <p className="text-base leading-relaxed mb-6 max-w-lg" style={{ color: "#50625A" }}>
                    DRH, CEO, CTO, Marketing, RH, Conseil : 6 profils d&apos;experts vous préparent à votre entretien.
                    Vous indiquez qui vous allez rencontrer, nous simulons l&apos;entretien avec le profil correspondant.
                    Questions sur-mesure, analyse de votre prestation, audit livré sous 12 à 24h.
                  </p>
                </Reveal>

                <Reveal variant="up" delay={200}>
                  <div className="flex flex-wrap items-center gap-2 mb-6 text-xs" style={{ color: "#6A8F6D" }}>
                    <span className="flex items-center gap-1"><Check size={12} /> Questions personnalisées</span>
                    <span className="w-1 h-1 rounded-full bg-[#6A8F6D]" />
                    <span className="flex items-center gap-1"><Check size={12} /> Analyse 5 dimensions</span>
                    <span className="w-1 h-1 rounded-full bg-[#6A8F6D]" />
                    <span className="flex items-center gap-1"><Check size={12} /> Audit 12-24h</span>
                  </div>
                </Reveal>

                <Reveal variant="up" delay={240}>
                  <div className="flex flex-wrap items-center gap-3">
                    <Link href="/mock-interview/setup"
                      className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5 shadow-lg"
                      style={{ background: "#103826", color: "#FFFDF8" }}
                    >
                      <Play size={16} />
                      Commencer ma simulation
                    </Link>
                    <Link href="#pricing"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all border hover:-translate-y-0.5"
                      style={{ borderColor: "rgba(16,56,38,0.15)", color: "#103826" }}
                    >
                      Voir les tarifs
                    </Link>
                  </div>
                </Reveal>
              </div>

              {/* ── Carrousel automatique ── */}
              <Reveal variant="scale" delay={120} className="hidden md:block">
                <div
                  className="relative"
                  onMouseEnter={() => setIsPaused(true)}
                  onMouseLeave={() => setIsPaused(false)}
                >
                  <div className="rounded-2xl border p-6 transition-opacity duration-300 h-[400px]" style={{
                    borderColor: "rgba(16,56,38,0.06)",
                    background: "#FFFFFF",
                  }}>
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-[110px] h-[110px] rounded-xl overflow-hidden shadow-md flex-shrink-0">
                        <img src={profile.img} alt={profile.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-[#103826]">{profile.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#6A8F6D" }}>{profile.title}</p>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed mb-4" style={{ color: "#50625A" }}>
                      {profile.longText}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {profile.strengths.map((s) => (
                        <span key={s} className="text-[11px] font-medium px-2.5 py-1 rounded-full" style={{
                          background: "rgba(16,56,38,0.06)",
                          color: "#103826",
                        }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-3 mt-5">
                    <button onClick={prevProfile} className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-[#103826]/10" style={{ color: "#103826" }}>
                      <ChevronLeft size={18} />
                    </button>
                    <div className="flex items-center gap-1.5">
                      {PANEL_MEMBERS.map((_, i) => (
                        <button key={i} onClick={() => setCurrentProfile(i)} className="h-2 rounded-full transition-all" style={{
                          width: i === currentProfile ? "20px" : "8px",
                          background: i === currentProfile ? "#103826" : "rgba(16,56,38,0.15)",
                        }} />
                      ))}
                    </div>
                    <button onClick={nextProfile} className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-[#103826]/10" style={{ color: "#103826" }}>
                      <ChevronRight size={18} />
                    </button>
                  </div>
                  <p className="text-[11px] text-center mt-3" style={{ color: "#6A8F6D" }}>
                    Survolez la carte pour mettre en pause
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
             SCHÉMA DU PROCESSUS
           ═══════════════════════════════════════════ */}
        <section className="py-20" style={{ background: "rgba(16,56,38,0.02)" }}>
          <div className="max-w-6xl mx-auto px-6">
            <Reveal variant="up" className="text-center mb-12">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11.5px] font-semibold tracking-wide mb-4" style={{
                borderColor: "rgba(16,56,38,0.12)", color: "#103826",
                background: "rgba(16,56,38,0.06)",
              }}>
                ✦ Le processus
              </div>
              <h2 className="font-serif text-[clamp(1.875rem,3.5vw,2.875rem)] font-bold tracking-[-0.04em] leading-[1.08] text-[#0B1F18]">
                De votre questionnaire à votre audit
              </h2>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-0 relative">
              {[
                { label: "Questionnaire", icon: FileText, color: "#103826" },
                { label: "Analyse IA", icon: Brain, color: "#6A8F6D" },
                { label: "Matching profil", icon: Users, color: "#103826" },
                { label: "Simulation", icon: Mic, color: "#6A8F6D" },
                { label: "Audit 12-24h", icon: Clock, color: "#103826" },
              ].map((step, i) => (
                <Reveal key={step.label} variant="up" delay={i * 60}>
                  <div className="flex flex-col items-center text-center px-3 py-6 relative">
                    {i < 4 && (
                      <div className="hidden md:block absolute top-[38px] left-[60%] w-[80%] h-[2px]" style={{
                        background: "linear-gradient(to right, rgba(16,56,38,0.2), rgba(16,56,38,0.05))",
                      }} />
                    )}
                    <div className="w-[50px] h-[50px] rounded-2xl flex items-center justify-center mb-4" style={{
                      background: step.color === "#103826" ? "rgba(16,56,38,0.08)" : "rgba(106,143,109,0.08)",
                    }}>
                      <step.icon size={22} color={step.color} />
                    </div>
                    <p className="text-sm font-semibold text-[#103826]">{step.label}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal variant="up" delay={300} className="mt-8">
              <div className="rounded-2xl border p-5 max-w-2xl mx-auto" style={{
                borderColor: "rgba(16,56,38,0.06)",
                background: "#FFFFFF",
              }}>
                <p className="text-sm text-center leading-relaxed" style={{ color: "#50625A" }}>
                  <strong className="text-[#103826]">Exemple concret :</strong> Vous postulez à un poste de Directeur Marketing chez LVMH.
                  Vous indiquez que vous avez un entretien avec la DRH dans 10 jours.
                  Notre outil génère 6 questions sur-mesure, Ingrid Dubois (DRH) vous les pose,
                  et vous recevez votre audit complet sous 24h.
                  Après l&apos;entretien réel, si on vous annonce un second round avec le CEO,
                  vous refaites une simulation avec Paul Mercier.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
             NOTRE IA
           ═══════════════════════════════════════════ */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <Reveal variant="up">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11.5px] font-semibold tracking-wide mb-4" style={{
                borderColor: "rgba(16,56,38,0.12)", color: "#103826",
                background: "rgba(16,56,38,0.06)",
              }}>
                <Brain size={12} /> Notre technologie
              </div>
              <h2 className="font-serif text-[clamp(1.5rem,3vw,2.5rem)] font-bold tracking-[-0.04em] leading-[1.08] mb-6 text-[#0B1F18]">
                Une IA propriétaire, pas un simple chatbot
              </h2>
              <div className="max-w-2xl mx-auto space-y-4 text-sm leading-relaxed text-left" style={{ color: "#50625A" }}>
                <p>
                  Contrairement à ChatGPT ou aux assistants généralistes, Panel utilise un algorithme développé spécifiquement
                  pour la simulation d&apos;entretiens cadres dirigeants. Cet algorithme a été paramétré en collaboration avec
                  des DRH, des chasseurs de têtes et des experts du recrutement. Il ne se contente pas de poser des questions
                  génériques : il analyse votre profil, le poste visé et l&apos;entreprise pour générer des questions contextuelles
                  et adaptées.
                </p>
                <p>
                  Les simulations sont générées par intelligence artificielle. Elles n&apos;ont pas vocation à remplacer
                  un véritable entretien avec un recruteur. Mais nos utilisateurs nous rapportent des résultats
                  <strong style={{ color: "#103826" }}> quasi identiques aux entretiens réels</strong>, avec un niveau d&apos;exigence
                  et une pertinence des questions qui surpassent souvent les préparations traditionnelles.
                </p>
                <p>
                  L&apos;avantage décisif : quand vous avez un entretien dans les prochains jours, vous ne pouvez pas
                  toujours obtenir un rendez-vous avec un coach ou un cabinet en si peu de temps. Panel est disponible
                  24h/7, sans rendez-vous, et vous livre un audit complet en 12 à 24h.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
             À QUI S'ADRESSE PANEL
           ═══════════════════════════════════════════ */}
        <section className="py-24" style={{ background: "rgba(16,56,38,0.02)" }}>
          <div className="max-w-6xl mx-auto px-6">
            <Reveal variant="up" className="text-center mb-14">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11.5px] font-semibold tracking-wide mb-4" style={{
                borderColor: "rgba(16,56,38,0.12)", color: "#103826",
                background: "rgba(16,56,38,0.06)",
              }}>
                ✦ À qui ça s&apos;adresse
              </div>
              <h2 className="font-serif text-[clamp(1.875rem,3.5vw,2.875rem)] font-bold tracking-[-0.04em] leading-[1.08] text-[#0B1F18]">
                Chaque situation a son entretien
              </h2>
            </Reveal>

            <div className="grid md:grid-cols-2 gap-5 max-w-5xl mx-auto">
              {USE_CASES.map((u, i) => (
                <Reveal key={u.title} variant="up" delay={i * 60}>
                  <div className="rounded-2xl border p-6 h-full transition-all duration-300 hover:-translate-y-1" style={{
                    borderColor: "rgba(16,56,38,0.06)",
                    background: "#FFFFFF",
                  }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{
                      background: "rgba(16,56,38,0.08)",
                    }}>
                      <u.icon size={18} color="#103826" />
                    </div>
                    <h3 className="font-semibold text-[#103826] mb-2">{u.title}</h3>
                    <p className="text-sm leading-relaxed mb-3" style={{ color: "#50625A" }}>{u.desc}</p>
                    <p className="text-xs font-medium" style={{ color: "#6A8F6D" }}>{u.stats}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
             EXEMPLES DE QUESTIONS PAR PROFIL
           ═══════════════════════════════════════════ */}
        <section className="py-24">
          <div className="max-w-6xl mx-auto px-6">
            <Reveal variant="up" className="text-center mb-14">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11.5px] font-semibold tracking-wide mb-4" style={{
                borderColor: "rgba(16,56,38,0.12)", color: "#103826",
                background: "rgba(16,56,38,0.06)",
              }}>
                ✦ Questions types
              </div>
              <h2 className="font-serif text-[clamp(1.875rem,3.5vw,2.875rem)] font-bold tracking-[-0.04em] leading-[1.08] text-[#0B1F18]">
                Ce que chaque expert va vous demander
              </h2>
              <p className="text-sm mt-3 max-w-lg mx-auto" style={{ color: "#50625A" }}>
                Chaque membre du panel pose des questions adaptées à son expertise et à ce qu&apos;il cherche à évaluer.
                Ces questions sont générées par notre algorithme propriétaire, paramétré avec des experts du recrutement.
              </p>
            </Reveal>

            <div className="grid md:grid-cols-3 gap-5">
              {PANEL_MEMBERS.map((p, i) => (
                <Reveal key={p.name} variant="up" delay={i * 60}>
                  <div className="rounded-2xl border overflow-hidden h-full" style={{
                    borderColor: "rgba(16,56,38,0.06)",
                    background: "#FFFFFF",
                  }}>
                    <div className="flex items-center gap-4 p-4 border-b" style={{ borderColor: "rgba(16,56,38,0.06)" }}>
                      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                        <img src={p.img} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#103826]">{p.name}</p>
                        <p className="text-[11px]" style={{ color: "#6A8F6D" }}>{p.title}</p>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      {p.examples.map((ex, j) => (
                        <div key={j} className="flex items-start gap-2 text-sm leading-relaxed" style={{ color: "#50625A" }}>
                          <Quote size={12} className="flex-shrink-0 mt-0.5" style={{ color: "#6A8F6D" }} />
                          <span>&ldquo;{ex}&rdquo;</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal variant="up" delay={300} className="mt-8 text-center">
              <p className="text-sm max-w-xl mx-auto" style={{ color: "#6A8F6D" }}>
                Ces questions sont générées automatiquement par notre algorithme propriétaire PRSTO en fonction de votre poste visé,
                de l&apos;entreprise et de vos points forts. Contrairement à ChatGPT, elles sont paramétrées par des experts
                du recrutement et calibrées pour chaque profil de panel. Chaque simulation est unique.
              </p>
            </Reveal>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
             TÉMOIGNAGES
           ═══════════════════════════════════════════ */}
        <section className="py-24" style={{ background: "rgba(16,56,38,0.02)" }}>
          <div className="max-w-6xl mx-auto px-6">
            <Reveal variant="up" className="text-center mb-14">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11.5px] font-semibold tracking-wide mb-4" style={{
                borderColor: "rgba(16,56,38,0.12)", color: "#103826",
                background: "rgba(16,56,38,0.06)",
              }}>
                <Star size={12} /> Témoignages
              </div>
              <h2 className="font-serif text-[clamp(1.875rem,3.5vw,2.875rem)] font-bold tracking-[-0.04em] leading-[1.08] text-[#0B1F18]">
                Ils ont passé l&apos;entretien
              </h2>
            </Reveal>

            <div className="grid md:grid-cols-2 gap-5">
              {TESTIMONIALS.map((t, i) => (
                <Reveal key={t.name} variant="up" delay={i * 60}>
                  <div className="rounded-2xl border p-6 h-full" style={{
                    borderColor: "rgba(16,56,38,0.06)",
                    background: "#FFFFFF",
                  }}>
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(5)].map((_, s) => (
                        <Star key={s} size={12} color="#E4B118" fill="#E4B118" />
                      ))}
                    </div>
                    <p className="text-sm leading-relaxed mb-5" style={{ color: "#50625A" }}>
                      &ldquo;{t.text}&rdquo;
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#103826]">{t.name}</p>
                        <p className="text-xs" style={{ color: "#6A8F6D" }}>{t.role}</p>
                      </div>
                      <span className="text-[11px] font-medium px-2.5 py-1 rounded-full" style={{
                        background: "rgba(16,56,38,0.06)",
                        color: "#103826",
                      }}>
                        {t.score}
                      </span>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
             COMMENT LE PANEL EST CHOISI
           ═══════════════════════════════════════════ */}
        <section className="py-24">
          <div className="max-w-6xl mx-auto px-6">
            <Reveal variant="up" className="text-center mb-14">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11.5px] font-semibold tracking-wide mb-4" style={{
                borderColor: "rgba(16,56,38,0.12)", color: "#103826",
                background: "rgba(16,56,38,0.06)",
              }}>
                ✦ Votre panel
              </div>
              <h2 className="font-serif text-[clamp(1.875rem,3.5vw,2.875rem)] font-bold tracking-[-0.04em] leading-[1.08] text-[#0B1F18]">
                Des experts qui vous ressemblent
              </h2>
              <p className="text-sm mt-3 max-w-xl mx-auto" style={{ color: "#50625A" }}>
                Vous ne choisissez pas un membre du panel au hasard. Vous nous dites qui vous allez rencontrer
                et nous simulons l&apos;entretien avec le profil correspondant.
              </p>
            </Reveal>

            <div className="max-w-3xl mx-auto space-y-5">
              {[
                {
                  step: "1",
                  title: "Indiquez qui vous allez rencontrer",
                  desc: "DRH, CEO, CTO, Directeur Marketing, Responsable RH, Membre du Conseil : vous précisez avec quel profil vous avez un entretien à venir (ou souhaitez vous entraîner). Notre outil adapte les questions en fonction de l'interlocuteur.",
                },
                {
                  step: "2",
                  title: "Notre outil vous associe au bon profil",
                  desc: "En fonction de votre réponse, nous activons le membre du panel correspondant. Ses questions, son ton et ses critères d'évaluation sont calibrés pour son expertise. Une DRH ne pose pas les mêmes questions qu'un CEO.",
                },
                {
                  step: "3",
                  title: "Un entretien, un profil",
                  desc: "Chaque simulation correspond à un interlocuteur précis. Si vous préparez plusieurs entretiens (DRH + CEO par exemple), vous pouvez faire une simulation pour chaque profil avec un questionnaire dédié.",
                },
                {
                  step: "4",
                  title: "Suggestions pour la suite",
                  desc: "Après votre simulation, si votre recherche implique d'autres interlocuteurs, nous vous suggérons de préparer un nouvel entretien avec le profil correspondant. Chaque simulation est indépendante et adaptée à son propre contexte.",
                },
              ].map((item, i) => (
                <Reveal key={item.step} variant="up" delay={i * 60}>
                  <div className="flex items-start gap-4 rounded-2xl border p-5" style={{
                    borderColor: "rgba(16,56,38,0.06)",
                    background: "#FFFFFF",
                  }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0" style={{
                      background: "rgba(16,56,38,0.08)",
                      color: "#103826",
                    }}>
                      {item.step}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#103826] mb-1">{item.title}</h3>
                      <p className="text-sm leading-relaxed" style={{ color: "#50625A" }}>{item.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
             FEATURES DÉTAILLÉES
           ═══════════════════════════════════════════ */}
        <section className="py-24" style={{ background: "rgba(16,56,38,0.02)" }}>
          <div className="max-w-6xl mx-auto px-6">
            <Reveal variant="up" className="text-center mb-14">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11.5px] font-semibold tracking-wide mb-4" style={{
                borderColor: "rgba(16,56,38,0.12)", color: "#103826",
                background: "rgba(16,56,38,0.06)",
              }}>
                ✦ Pourquoi Panel
              </div>
              <h2 className="font-serif text-[clamp(1.875rem,3.5vw,2.875rem)] font-bold tracking-[-0.04em] leading-[1.08] text-[#0B1F18]">
                Une simulation qui va plus loin
              </h2>
              <p className="text-sm mt-3 max-w-lg mx-auto" style={{ color: "#50625A" }}>
                Ce qui rend Panel unique, ce n&apos;est pas la technologie : ce sont les détails qui font la différence
                entre une préparation superficielle et un vrai entraînement.
              </p>
            </Reveal>

            <div className="grid md:grid-cols-3 gap-5">
              {FEATURES.map((f, i) => (
                <Reveal key={f.title} variant="up" delay={i * 60}>
                  <div className="rounded-2xl border p-6 h-full transition-all duration-300 hover:-translate-y-1" style={{
                    borderColor: "rgba(16,56,38,0.06)",
                    background: "#FFFFFF",
                  }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{
                      background: "rgba(16,56,38,0.08)",
                    }}>
                      <f.icon size={18} color="#103826" />
                    </div>
                    <h3 className="font-semibold text-[#103826] mb-2">{f.title}</h3>
                    <p className="text-sm leading-relaxed mb-3" style={{ color: "#50625A" }}>{f.desc}</p>
                    <p className="text-xs leading-relaxed" style={{ color: "#6A8F6D" }}>{f.detail}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
             TABLEAU COMPARATIF
           ═══════════════════════════════════════════ */}
        <section className="py-24">
          <div className="max-w-6xl mx-auto px-6">
            <Reveal variant="up" className="text-center mb-14">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11.5px] font-semibold tracking-wide mb-4" style={{
                borderColor: "rgba(16,56,38,0.12)", color: "#103826",
                background: "rgba(16,56,38,0.06)",
              }}>
                ✦ Comparatif
              </div>
              <h2 className="font-serif text-[clamp(1.875rem,3.5vw,2.875rem)] font-bold tracking-[-0.04em] leading-[1.08] text-[#0B1F18]">
                Panel face aux alternatives
              </h2>
              <p className="text-sm mt-3 max-w-lg mx-auto" style={{ color: "#50625A" }}>
                Voici comment notre simulation se positionne par rapport aux solutions existantes sur le marché.
              </p>
            </Reveal>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left p-3 font-semibold text-[#103826]" style={{ width: "28%" }}></th>
                    <th className="text-center p-3 font-bold text-[#103826] rounded-t-xl" style={{ background: "rgba(16,56,38,0.06)", width: "18%" }}>
                      Panel
                    </th>
                    <th className="text-center p-3 font-semibold rounded-t-xl" style={{ background: "rgba(16,56,38,0.03)", color: "#6A8F6D", width: "18%" }}>
                      Cabinet recrutement
                    </th>
                    <th className="text-center p-3 font-semibold rounded-t-xl" style={{ background: "rgba(16,56,38,0.03)", color: "#6A8F6D", width: "18%" }}>
                      Solution en ligne (abonnement)
                    </th>
                    <th className="text-center p-3 font-semibold rounded-t-xl" style={{ background: "rgba(16,56,38,0.03)", color: "#6A8F6D", width: "18%" }}>
                      Entraînement seul
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROWS.map((row, i) => (
                    <tr key={row.label} style={{
                      borderBottom: "1px solid rgba(16,56,38,0.06)",
                      background: i % 2 === 0 ? "transparent" : "rgba(16,56,38,0.02)",
                    }}>
                      <td className="p-3" style={{ color: "#50625A" }}>{row.label}</td>
                      <td className="text-center p-3">{renderCell(row.panel)}</td>
                      <td className="text-center p-3">{renderCell(row.cabinet)}</td>
                      <td className="text-center p-3">{renderCell(row.concurrent)}</td>
                      <td className="text-center p-3">{renderCell(row.seul)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Reveal variant="up" delay={200} className="mt-8 max-w-2xl mx-auto">
              <div className="rounded-2xl border p-5" style={{
                borderColor: "rgba(16,56,38,0.06)",
                background: "#FFFFFF",
              }}>
                <p className="text-sm leading-relaxed text-center" style={{ color: "#50625A" }}>
                  <strong className="text-[#103826]">En résumé :</strong> Un cabinet vous offre un regard expert mais à un coût élevé (500 à 1 500€) et sur un seul rendez-vous.
                  Les plateformes en ligne proposent des abonnements à 49€/mois et plus pour des contenus souvent génériques.
                  Les outils gratuits (ChatGPT, etc.) sont limités et sans analyse personnalisée.
                  <strong className="text-[#103826]"> Panel est le seul outil qui combine un panel pluridisciplinaire, un algorithme propriétaire, une analyse 5 dimensions avec preuves,
                  et un rapport livré en 24h, à partir de 19,90€ la simulation ou 9,90€/semaine en abonnement.</strong>
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
             PRICING
           ═══════════════════════════════════════════ */}
        <section id="pricing" className="py-24" style={{ background: "rgba(16,56,38,0.02)" }}>
          <div className="max-w-6xl mx-auto px-6">
            <Reveal variant="up" className="text-center mb-14">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11.5px] font-semibold tracking-wide mb-4" style={{
                borderColor: "rgba(16,56,38,0.12)", color: "#103826",
                background: "rgba(16,56,38,0.06)",
              }}>
                ✦ Tarifs
              </div>
              <h2 className="font-serif text-[clamp(1.875rem,3.5vw,2.875rem)] font-bold tracking-[-0.04em] leading-[1.08] text-[#0B1F18]">
                Prêt à passer l&apos;entretien ?
              </h2>
            </Reveal>

            <div className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
              {/* PRSTO+ */}
              <Reveal variant="up" delay={0}>
                <div className="relative rounded-3xl border p-8 flex flex-col h-full" style={{
                  borderColor: "rgba(228,177,24,0.25)",
                  background: "rgba(228,177,24,0.03)",
                  boxShadow: "0 20px 60px rgba(228,177,24,0.1)",
                }}>
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9.5px] font-bold tracking-wide mb-3 w-fit" style={{
                    background: "rgba(228,177,24,0.1)", border: "1px solid rgba(228,177,24,0.15)", color: "#A38010",
                  }}>
                    ⚡ Le plus populaire
                  </div>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#A38010" }}>
                    PRSTO+
                  </div>
                  <div className="text-5xl font-extrabold tracking-[-0.04em] mb-0.5 text-[#0B1F18]" style={{ fontFamily: "Playfair Display, serif" }}>
                    9,90€
                    <span className="text-sm font-normal align-baseline" style={{ color: "#6A8F6D" }}>
                      /sem
                    </span>
                  </div>
                  <p className="text-xs mb-6" style={{ color: "#6A8F6D" }}>
                    Abonnement hebdomadaire : l&apos;arsenal complet pour votre recherche active.
                  </p>
                  <div className="h-px mb-5" style={{ background: "rgba(16,56,38,0.06)" }} />
                  <ul className="space-y-2.5 mb-7 flex-1">
                    {[
                      "Jusqu'à 4 simulations Panel par mois",
                      "Questions sur-mesure pour chaque simulation",
                      "Analyse posture et regard incluse",
                      "Audit 5 dimensions livré sous 12 à 24h",
                      "ATS Scanner illimité",
                      "CV Optimizer illimité",
                      "LinkedIn Optimizer avancé",
                      "CRM Recruteur + Pipeline",
                    ].map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: "#50625A" }}>
                        <Check size={14} color="#A38010" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/demarrage"
                    className="block text-center py-3 px-6 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
                    style={{ background: "#E4B118", color: "#082E1E" }}
                  >
                    Souscrire à PRSTO+
                  </Link>
                  <p className="text-[11px] text-center mt-3" style={{ color: "#6A8F6D" }}>
                    Résiliable à tout moment. Engagement libre.
                  </p>
                </div>
              </Reveal>

              {/* Session unique */}
              <Reveal variant="up" delay={90}>
                <div className="rounded-3xl border p-8 flex flex-col h-full" style={{
                  borderColor: "rgba(16,56,38,0.05)",
                  background: "#FFFFFF",
                }}>
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9.5px] font-bold tracking-wide mb-3 w-fit" style={{
                    background: "rgba(16,56,38,0.08)", border: "1px solid rgba(16,56,38,0.1)", color: "#103826",
                  }}>
                    ⚡ Sans abonnement
                  </div>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#6A8F6D" }}>
                    Session unique
                  </div>
                  <div className="text-5xl font-extrabold tracking-[-0.04em] mb-0.5 text-[#0B1F18]" style={{ fontFamily: "Playfair Display, serif" }}>
                    19,90€
                    <span className="text-sm font-normal align-baseline" style={{ color: "#6A8F6D" }}>
                      /simulation
                    </span>
                  </div>
                  <p className="text-xs mb-6" style={{ color: "#6A8F6D" }}>
                    Paiement unique : idéal pour un entretien ponctuel. Aucun engagement.
                  </p>
                  <div className="h-px mb-5" style={{ background: "rgba(16,56,38,0.06)" }} />
                  <ul className="space-y-2.5 mb-7 flex-1">
                    {[
                      "1 simulation complète",
                      "Choix du profil correspondant à votre entretien",
                      "Questions sur-mesure générées pour vous",
                      "Analyse posture et regard incluse",
                      "Audit 5 dimensions détaillé",
                      "Rapport PDF livré sous 12 à 24h",
                    ].map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: "#50625A" }}>
                        <Check size={14} color="#6A8F6D" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/mock-interview/setup"
                    className="block text-center py-3 px-6 rounded-xl text-sm font-bold transition-all border"
                    style={{ borderColor: "rgba(16,56,38,0.15)", color: "#103826" }}
                  >
                    Acheter une session
                  </Link>
                </div>
              </Reveal>
            </div>

            <Reveal variant="up" delay={180} className="mt-8">
              <div className="max-w-3xl mx-auto rounded-2xl border p-6 text-left" style={{
                borderColor: "rgba(16,56,38,0.06)",
                background: "#FFFFFF",
              }}>
                <h3 className="font-semibold text-[#103826] mb-3 text-sm">Comment choisir ?</h3>
                <div className="space-y-3 text-sm" style={{ color: "#50625A" }}>
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5" style={{ background: "rgba(228,177,24,0.1)", color: "#A38010" }}>1</span>
                    <div>
                      <strong style={{ color: "#103826" }}>Vous préparez un seul entretien ponctuel ?</strong>
                      <p>La session unique à 19,90€ est la solution. Vous achetez une simulation, vous recevez votre audit, vous ne payez plus rien. Pas d'abonnement à gérer, pas d'engagement.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5" style={{ background: "rgba(228,177,24,0.1)", color: "#A38010" }}>2</span>
                    <div>
                      <strong style={{ color: "#103826" }}>Vous êtes en recherche active et multipliez les entretiens ?</strong>
                      <p>PRSTO+ à 9,90€/semaine est plus économique : jusqu'à 4 simulations par mois, plus tous les outils PRSTO (ATS Scanner, CV Optimizer, CRM Recruteur, Market Radar). L'abonnement inclut l'ensemble de la suite PRSTO, pas seulement Panel.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5" style={{ background: "rgba(228,177,24,0.1)", color: "#A38010" }}>3</span>
                    <div>
                      <strong style={{ color: "#103826" }}>Seulement besoin d'un entraînement, pas de la suite complète ?</strong>
                      <p>Si vous avez déjà un CV et des lettres de motivation à jour et que seul l'entraînement à l'entretien vous intéresse, la session unique est le choix le plus ciblé. Vous payez uniquement pour la simulation et l'audit, pas pour des outils dont vous n'avez pas besoin. À 19,90€, c'est l'investissement le plus rentable pour un entretien ponctuel.</p>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
             FAQ
           ═══════════════════════════════════════════ */}
        <section className="py-24">
          <div className="max-w-3xl mx-auto px-6">
            <Reveal variant="up" className="text-center mb-12">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11.5px] font-semibold tracking-wide mb-4" style={{
                borderColor: "rgba(16,56,38,0.12)", color: "#103826",
                background: "rgba(16,56,38,0.06)",
              }}>
                ✦ FAQ
              </div>
              <h2 className="font-serif text-[clamp(1.5rem,3vw,2.5rem)] font-bold tracking-[-0.04em] text-[#0B1F18]">
                Toutes les réponses à vos questions
              </h2>
            </Reveal>

            <div className="space-y-3">
              {FAQ.map((item, i) => (
                <Reveal key={item.q} variant="up" delay={i * 40}>
                  <details className="group rounded-2xl border overflow-hidden transition-all" style={{
                    borderColor: "rgba(16,56,38,0.06)",
                    background: "#FFFFFF",
                  }}>
                    <summary className="flex items-center justify-between p-5 cursor-pointer list-none font-medium text-sm text-[#103826]">
                      {item.q}
                      <span className="text-[#6A8F6D] transition-transform group-open:rotate-180 text-lg">▼</span>
                    </summary>
                    <div className="px-5 pb-5 text-sm leading-relaxed" style={{ color: "#50625A" }}>
                      {item.a}
                    </div>
                  </details>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
             FINAL CTA
           ═══════════════════════════════════════════ */}
        <section className="py-24" style={{ background: "rgba(16,56,38,0.02)" }}>
          <div className="max-w-3xl mx-auto px-6 text-center">
            <Reveal variant="up">
              <h2 className="font-serif text-[clamp(1.875rem,3.5vw,2.875rem)] font-bold tracking-[-0.04em] leading-[1.08] mb-4 text-[#0B1F18]">
                Prêt à réussir votre prochain entretien ?
              </h2>
              <p className="text-sm mb-8 max-w-md mx-auto" style={{ color: "#50625A" }}>
                Simulation personnalisée avec un expert du panel, analyse 5 dimensions,
                rapport complet livré sous 12 à 24h.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link href="/mock-interview/setup"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold transition-all hover:-translate-y-0.5 shadow-lg"
                  style={{ background: "#103826", color: "#FFFDF8" }}
                >
                  <Play size={18} />
                  Commencer ma simulation
                </Link>
                <Link href="#pricing"
                  className="inline-flex items-center gap-2 px-6 py-4 rounded-xl text-sm font-bold transition-all border hover:-translate-y-0.5"
                  style={{ borderColor: "rgba(16,56,38,0.15)", color: "#103826" }}
                >
                  Voir les tarifs
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}

function renderCell(value: boolean | string): string {
  if (typeof value === "boolean") {
    return value ? "✅" : "❌";
  }
  return value;
}
