"use client";

import Link from "next/link";
import { ArrowLeft, Eye, Target, Briefcase, Layers, Clock, Shield, RefreshCw } from "lucide-react";

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
    id: "confidentielle",
    icon: <Eye size={20} />,
    title: "Recherche d'emploi confidentielle",
    summary: "Comment mener une recherche de poste de direction sans alerter son employeur actuel.",
    content: [
      "La confidentialité est le premier pilier d'une recherche executive réussie. Un dirigeant qui cherche un nouveau poste sans avoir sécurisé sa sortie expose sa position actuelle et son pouvoir de négociation. PRSTO a été conçu autour de ce principe fondateur : votre employeur actuel ne doit jamais découvrir vos intentions avant que vous n'ayez décidé de lui communiquer.",
      "Les règles d'or d'une recherche discrète : ne jamais publier son CV sur les job boards publics, paramétrer les alertes de recrutement sur des adresses dédiées, utiliser des espaces de travail physiques distincts pour les entretiens, et surtout — ne pas connecter ses réseaux professionnels à sa recherche. PRSTO vous permet de gérer l'intégralité de votre démarche depuis un environnement cloisonné, sans fuite possible.",
      "La signature digitale est un autre angle mort. Un profil LinkedIn consulté depuis le siège, une connexion à une base de données de chasseurs de têtes en heures de bureau, un appel Teams avec un cabinet concurrent : autant de signaux faibles qu'un DSI ou un RSSI peut détecter. Nos recommandations incluent l'utilisation systématique d'un VPN, d'un navigateur dédié, et d'une plage horaire définie pour les activités de recherche.",
    ],
  },
  {
    id: "chasseurs-de-tetes",
    icon: <Briefcase size={20} />,
    title: "Travailler avec les chasseurs de têtes",
    summary: "Optimiser sa relation avec les cabinets de recrutement executive search.",
    content: [
      "Les chasseurs de têtes sont les gardiens du marché caché. Un mandat de recherche executive est rarement publié : il est confié à un cabinet qui dispose déjà d'un vivier de candidats qualifiés. Votre objectif n'est pas de postuler, mais d'être dans le radar des bons cabinets avant même qu'un mandat ne soit ouvert.",
      "La règle des 3 cercles : cultivez un réseau de chasseurs dans votre secteur (cercle 1), dans des secteurs adjacents (cercle 2), et dans des fonctions connexes (cercle 3). Un DAF recherché par un cabinet spécialisé en finance sera contacté dans les 48 heures. Un DAF présent dans le fichier d'un cabinet généraliste attendra trois semaines. PRSTO cartographie votre réseau de cabinets et identifie les maillons manquants.",
      "Préparez votre 'executive summary' oral et écrit. Un chasseur de têtes prend 30 secondes pour décider si vous méritez un entretien. Votre pitch doit contenir : votre dernière fonction, le périmètre budgétaire, la taille d'équipe, l'impact généré (en chiffres), et votre mobilité géographique. Entraînez-vous avec le STAR Simulator PRSTO jusqu'à ce que ces éléments sortent naturellement.",
    ],
  },
  {
    id: "marche-cache",
    icon: <Layers size={20} />,
    title: "Le marché caché de l'emploi cadre dirigeant",
    summary: "85% des postes de direction ne sont jamais publiés. Voici comment y accéder.",
    content: [
      "Le marché visible de l'emploi cadre dirigeant — offres publiées sur LinkedIn, Indeed, APEC — ne représente que 15 à 20% des recrutements réels au niveau Comex et N-1. Les 80% restants constituent le marché caché : des postes pourvus par cooptation, approche directe de cabinet, ou mobilité interne avant même qu'une offre ne soit rédigée.",
      "Les trois portes d'entrée du marché caché : le réseau personnel (50% des placements), les approches directes de cabinets de chasse (30%), et les recommandations d'administrateurs ou d'investisseurs (20%). Un dirigeant qui passe 80% de son temps à répondre à des offres publiques combat sur le mauvais terrain.",
      "PRSTO analyse votre positionnement et construit un plan de pénétration du marché caché : identification des 50 entreprises cibles, cartographie des relations d'accès, activation des prescripteurs naturels, et séquençage des prises de contact. L'IA PRSTO sait quel administrateur a siégé avec qui, quel investisseur a récemment refinancé une entreprise de votre secteur, et quel cabinet vient de perdre un mandat concurrent.",
    ],
  },
  {
    id: "multisectorielle",
    icon: <Target size={20} />,
    title: "Stratégie de recherche multisectorielle",
    summary: "Étendre son champ de recherche sans diluer son positionnement.",
    content: [
      "La spécialisation sectorielle est un atout, mais elle devient une prison quand elle vous empêche de voir des opportunités dans des secteurs adjacents. Un directeur marketing dans le luxe possède des compétences parfaitement transférables dans l'hôtellerie haut de gamme, les services financiers premium, ou les technologies B2B orientées expérience client.",
      "La matrice de transférabilité PRSTO évalue pour chaque compétence-clé son niveau d'exportabilité dans 12 clusters sectoriels. Vous découvrirez peut-être que votre expertise en gestion de crise dans l'agroalimentaire est extrêmement valorisée dans la fintech en période de scale-up, ou que votre expérience en transformation digitale dans la distribution est précisément ce que recherchent les cabinets de conseil en stratégie.",
      "L'objectif n'est pas de postuler partout, mais d'ouvrir 2 à 3 fronts sectoriels cohérents. Un dirigeant qui cible 3 secteurs avec une approche personnalisée obtient 4 fois plus de rendez-vous qu'un candidat qui envoie le même CV générique à 200 entreprises. PRSTO génère des versions adaptées de votre executive brief pour chaque cluster, en ajustant le storytelling sans trahir votre authenticité.",
    ],
  },
  {
    id: "timing",
    icon: <Clock size={20} />,
    title: "Timing de la recherche",
    summary: "Quand quitter son poste ? Les cycles du marché executive.",
    content: [
      "Le timing est la variable la plus sous-estimée d'une recherche de poste de direction. Quitter trop tôt vous expose à une négociation affaiblie. Quitter trop tard vous expose à un départ contraint. La fenêtre optimale se situe entre le moment où vous êtes encore en position de force — vos résultats sont bons, votre réseau est actif — et le moment où les signaux internes deviennent défavorables.",
      "Les cycles du marché executive sont saisonniers : janvier-mars est le pic des mandats de recrutement (les budgets sont votés), avril-juin reste actif pour les remplacements, juillet-août est atone, septembre-octobre connaît un second pic, novembre-décembre est réservé aux négociations finales. Une recherche initiée en janvier trouve sa conclusion en 4 à 6 mois. Une recherche initiée en juillet peut s'étendre sur 9 mois.",
      "PRSTO vous aide à modéliser votre timeline idéale : analyse de votre situation contractuelle (préavis, clause de non-concurrence, indemnités), estimation de la durée de recherche par niveau de poste, simulation financière de la période de transition, et recommandations sur le mois optimal d'activation de votre recherche. Certains de nos utilisateurs planifient leur départ 12 à 18 mois à l'avance.",
    ],
  },
  {
    id: "career-cushioning",
    icon: <Shield size={20} />,
    title: "Career Cushioning",
    summary: "Anticiper les coups durs sans paralyser sa performance.",
    content: [
      "Le career cushioning est la version executive du principe de précaution. Il ne s'agit pas de chercher activement un nouveau poste, mais de maintenir un filet de sécurité permanent : réseau entretenu, CV actualisé, visibilité digitale maîtrisée, et mandats d'administrateur qui diversifient votre exposition professionnelle.",
      "Un dirigeant qui pratique le career cushioning consacre 2 heures par semaine à son 'capital carrière' : un déjeuner avec un chasseur de têtes, une intervention dans une conférence, la mise à jour de son executive brief PRSTO, la participation à un cercle de pairs. Ces micro-investissements transforment un départ potentiellement subi en transition maîtrisée.",
      "Les signaux d'alerte précoce sont rarement brutaux : un périmètre réduit, une invitation en moins au Comex, un budget revu à la baisse, un sponsor historique qui quitte l'entreprise. PRSTO détecte ces signaux faibles dans votre environnement professionnel et vous alerte quand le moment est venu d'activer votre réseau. Le career cushioning, c'est l'art de préparer la suite sans quitter le présent.",
    ],
  },
  {
    id: "management-transition",
    icon: <RefreshCw size={20} />,
    title: "Management de transition",
    summary: "Le rebond executive par les missions temporaires de direction.",
    content: [
      "Le management de transition s'est imposé comme une voie légitime et prestigieuse pour les cadres dirigeants. Que ce soit pour occuper une fonction de CEO interim, piloter un turnaround, ou accompagner une levée de fonds, les missions de transition offrent une visibilité unique sur des situations à fort impact — et un revenu qui dépasse souvent celui d'un poste permanent.",
      "Pour un dirigeant en recherche, une mission de transition est un multiplicateur de valeur : vous démontrez votre capacité à produire des résultats immédiats dans un environnement inconnu, vous élargissez votre réseau à vitesse accélérée (un comité d'administration complet en 6 mois), et vous transformez un 'trou' de CV en expérience valorisée.",
      "Les cabinets spécialisés en management de transition (Volt, Eres, Diot, etc.) recrutent exclusivement des profils ayant fait leurs preuves en situation de crise. PRSTO vous aide à préparer votre dossier de candidature pour ces cabinets : récit de vos missions les plus marquantes, références vérifiées, et disponibilité clarifiée. Une mission de transition bien menée débouche dans 40% des cas sur une proposition de poste permanent.",
    ],
  },
];

export default function StrategiePage() {
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
            <Target size={20} style={{ color: C.text }} />
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: C.muted }}>
            Guide Stratégique
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl mb-5 leading-tight" style={h1Font}>
          Stratégie de recherche<br />
          <span style={{ color: C.forest }}>pour cadres dirigeants</span>
        </h1>
        <p className="text-base md:text-lg max-w-2xl leading-relaxed" style={{ color: C.muted, ...bodyFont }}>
          La recherche d&apos;un poste de direction ne s&apos;improvise pas. Elle obéit à des règles, des cycles et des
          canaux spécifiques que seuls les initiés maîtrisent. Ce guide vous ouvre les coulisses du marché executive.
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
            Prêt à structurer votre recherche ?
          </h2>
          <p className="text-sm md:text-base mb-8 leading-relaxed" style={{ color: "rgba(255,255,255,0.6)", ...bodyFont }}>
            PRSTO vous accompagne à chaque étape : scoring d&apos;opportunités, préparation d&apos;entretiens,
            négociation, et gestion confidentielle de votre candidature.
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
