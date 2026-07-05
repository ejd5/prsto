export type ArticleCategory =
  | "Marché & Tendances"
  | "CV & Personal Branding"
  | "Négociation & Package"
  | "Réseau & Chasseurs"
  | "Entretien"
  | "Stratégie"
  | "Transition";

export interface Author {
  name: string;
  role: string;
  avatar: string;
  bio: string;
}

export interface StatHighlight {
  value: string;
  label: string;
  description: string;
}

export interface ContentBlock {
  type: "h2" | "h3" | "p" | "pullQuote" | "stat" | "ul" | "intro";
  text?: string;
  author?: string;
  stat?: StatHighlight;
  items?: string[];
}

export interface BlogArticle {
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  date: string;
  author: Author;
  category: ArticleCategory;
  tags: string[];
  readingTime: string;
  featured: boolean;
  heroGradient: string;
  image?: string;
  content: ContentBlock[];
}

const authors = {
  paul: {
    name: "Paul Elton",
    role: "Fondateur & CEO, PRSTO",
    avatar: "/branding/portraits/ceo-paul/paul-01.png",
    bio: "Ancien DRH d'un groupe du CAC 40 et chasseur de têtes pendant 15 ans, Paul a accompagné plus de 200 cadres dirigeants dans leur recherche d'emploi.",
  },
  sabrina: {
    name: "Sabrina Moreau",
    role: "Directrice Marketing & Branding, PRSTO",
    avatar: "/branding/portraits/dirmarketing-sabrina/sabrina-01.png",
    bio: "Spécialiste du personal branding pour cadres dirigeants, Sabrina a piloté la stratégie de marque de 40+ dirigeants de grands groupes.",
  },
  john: {
    name: "John Devaux",
    role: "CTO & Data Scientist, PRSTO",
    avatar: "/branding/portraits/cto-john/john-01.png",
    bio: "Ancien lead data scientist, John a conçu l'algorithme de scoring PRSTO qui analyse les offres de direction générale.",
  },
  ingrid: {
    name: "Ingrid Vasseur",
    role: "DRH & Conseil en organisation, PRSTO",
    avatar: "/branding/portraits/drh-ingrid/ingrid-01.png",
    bio: "DRH pendant 12 ans dans des groupes internationaux, Ingrid a négocié plus de 300 packages de direction.",
  },
};

const categoryGradients: Record<ArticleCategory, string> = {
  "Marché & Tendances": "from-[#103826] via-[#1A4A2E] to-[#0E3A29]",
  "CV & Personal Branding": "from-[#0E3A29] via-[#1F4A34] to-[#2A5A40]",
  "Négociation & Package": "from-[#E4B118] via-[#F2C94C] to-[#D4A017]",
  "Réseau & Chasseurs": "from-[#1F4A34] via-[#2A5A40] to-[#3A6A50]",
  "Entretien": "from-[#2A5A40] via-[#3A6A50] to-[#4A7A60]",
  "Stratégie": "from-[#103826] via-[#0E3A29] to-[#1A4A2E]",
  "Transition": "from-[#1A4A2E] via-[#103826] to-[#0E3A29]",
};

export function getCategoryGradient(category: ArticleCategory): string {
  return categoryGradients[category];
}

export const articles: BlogArticle[] = [
  {
    slug: "marche-cache-cadres-dirigeants-2026",
    title: "2026 : Le marché caché des cadres dirigeants",
    subtitle: "78 % des postes de direction ne sont jamais publiés. Voici comment y accéder.",
    excerpt: "Pendant que des milliers de CV s'entassent sur les job boards, un marché parallèle discret concentre les postes les plus stratégiques. Enquête sur un système qui recrute sans publier.",
    date: "15 juin 2026",
    author: authors.paul,
    category: "Marché & Tendances",
    tags: ["marché caché", "réseau", "recrutement cadre", "2026"],
    readingTime: "12 min",
    featured: true,
    heroGradient: "from-[#103826] via-[#1A4A2E] to-[#0E3A29]",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
    content: [
      { type: "intro", text: "La majorité des postes de direction ne voient jamais la lumière d'une annonce publique. Enquête sur un système discret." },
      { type: "stat", stat: { value: "78 %", label: "Postes non publiés", description: "des postes de direction (N+1, Comex, Codir) sont pourvus sans annonce publique." } },
      { type: "h2", text: "L'iceberg du recrutement executif" },
      { type: "p", text: "Pour les postes à haute responsabilité, les canaux traditionnels sont souvent délaissés au profit de l'Executive Search confidentiel pour éviter de déstabiliser les équipes internes ou d'alerter les concurrents." },
      { type: "pullQuote", text: "« Nous commençons toujours par le réseau de notre Comex et les chasseurs de têtes historiques. »", author: "DRH d'un groupe du CAC 40" }
    ],
  },
  {
    slug: "cv-directeurs-ats-scoring",
    title: "Pourquoi 73 % des CV de directeurs ne passent pas les ATS",
    subtitle: "Enquête sur le filtrage automatisé par algorithmes.",
    excerpt: "Votre CV est excellent, mais un algorithme décide que vous n'êtes pas qualifié. Analyse de 1 200 CV de cadres dirigeants.",
    date: "8 juin 2026",
    author: authors.john,
    category: "CV & Personal Branding",
    tags: ["CV", "ATS", "scoring", "recrutement"],
    readingTime: "10 min",
    featured: false,
    heroGradient: "from-[#0E3A29] via-[#1F4A34] to-[#2A5A40]",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
    content: [
      { type: "intro", text: "Les Applicant Tracking Systems éliminent la majorité des CV avant toute relecture humaine. Découvrez les règles d'optimisation indispensables." },
      { type: "stat", stat: { value: "73 %", label: "Éliminés d'office", description: "des CV de cadres dirigeants n'atteignent jamais un recruteur humain en raison d'erreurs de formatage." } },
      { type: "h2", text: "Les critères réels de notation" },
      { type: "p", text: "La structure du fichier, la densité de mots-clés spécifiques et la chronologie linéaire sont les piliers d'un CV optimisé pour les plateformes modernes de recrutement." }
    ],
  },
  {
    slug: "cinq-minutes-package-negociation",
    title: "Négociation de package : Tout se joue dans les 5 premières minutes",
    subtitle: "Les stratégies pour valoriser votre rémunération globale.",
    excerpt: "Négocier son salaire de dirigeant ne s'improvise pas. Apprenez à structurer votre argumentation et intégrer les LTI et bonus.",
    date: "1 juin 2026",
    author: authors.ingrid,
    category: "Négociation & Package",
    tags: ["package", "négociation", "salaire", "dirigeant"],
    readingTime: "8 min",
    featured: false,
    heroGradient: "from-[#E4B118] via-[#F2C94C] to-[#D4A017]",
    image: "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?auto=format&fit=crop&w=800&q=80",
    content: [
      { type: "intro", text: "La rémunération fixe n'est que la partie visible du package d'un cadre supérieur. Structurez votre négociation globale." },
      { type: "h2", text: "Au-delà du fixe : LTI, bonus et intéressement" },
      { type: "p", text: "Pensez en termes de 'Total Compensation'. Les actions gratuites, clauses de bonus garanti, et avantages en nature représentent souvent plus de 50 % de la valeur globale." }
    ],
  },
  {
    slug: "chasseurs-tetes-reseaux-secrets",
    title: "Chasseurs de têtes : Entrez dans leur radar secret",
    subtitle: "Comment devenir le candidat incontournable sans postuler.",
    excerpt: "Les chasseurs de têtes du Top 5 ont des méthodes bien précises pour identifier les leaders. Voici comment devenir visible auprès d'eux.",
    date: "25 mai 2026",
    author: authors.paul,
    category: "Réseau & Chasseurs",
    tags: ["chasseur de têtes", "executive search", "visibilité"],
    readingTime: "11 min",
    featured: false,
    heroGradient: "from-[#1F4A34] via-[#2A5A40] to-[#3A6A50]",
    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80",
    content: [
      { type: "intro", text: "Construire une relation durable avec les cabinets d'executive search majeurs demande une approche stratégique et proactive." },
      { type: "h2", text: "Les règles de la cooptation passive" },
      { type: "p", text: "Le bouche-à-oreille et les publications d'expertises ciblées restent les leviers les plus puissants pour attirer l'attention des associés du Top 5." }
    ],
  },
  {
    slug: "plan-100-jours-directeur-general",
    title: "Le plan de 100 jours du Directeur Général",
    subtitle: "Sécuriser sa prise de fonction et poser sa vision.",
    excerpt: "Les 100 premiers jours déterminent le succès d'un mandat. Méthodologie pour auditer, décider et fédérer votre nouveau Comex.",
    date: "18 mai 2026",
    author: authors.paul,
    category: "Stratégie",
    tags: ["directeur général", "100 jours", "gouvernance", "management"],
    readingTime: "15 min",
    featured: false,
    heroGradient: "from-[#103826] to-[#1A4A2E]",
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
    content: [
      { type: "intro", text: "La phase d'observation doit rapidement laisser place aux décisions structurantes. Voici comment orchestrer vos premiers mois." },
      { type: "h2", text: "Phase 1 : L'audit interne flash" },
      { type: "p", text: "Rencontrez individuellement les membres clés, analysez le climat social et identifiez les freins structurels." }
    ],
  },
  {
    slug: "relation-conseil-administration",
    title: "Gouvernance : Gérer son Conseil d'Administration",
    subtitle: "Les clés d'une relation constructive et sereine.",
    excerpt: "Comment concilier les attentes du Conseil d'Administration et l'exécution opérationnelle du Directeur Général. Postures et outils.",
    date: "10 mai 2026",
    author: authors.paul,
    category: "Stratégie",
    tags: ["gouvernance", "board", "conseil d'administration"],
    readingTime: "13 min",
    featured: false,
    heroGradient: "from-[#1A4A2E] to-[#0E3A29]",
    image: "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&w=800&q=80",
    content: [
      { type: "intro", text: "La réussite d'un DG dépend de sa capacité à piloter le Board sans se laisser déborder par les exigences à court terme." }
    ],
  },
  {
    slug: "grilles-evaluation-executive-search",
    title: "Executive Search : Les grilles secrètes de Korn Ferry",
    subtitle: "Décryptage des critères d'évaluation des cabinets de chasse.",
    excerpt: "Découvrez comment les plus grands cabinets d'Executive Search notent votre potentiel de leadership et votre fit culturel.",
    date: "3 mai 2026",
    author: authors.sabrina,
    category: "Réseau & Chasseurs",
    tags: ["Korn Ferry", "executive search", "évaluation", "leadership"],
    readingTime: "12 min",
    featured: false,
    heroGradient: "from-[#1F4A34] to-[#2A5A40]",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
    content: [
      { type: "intro", text: "Les grilles d'évaluation ne s'arrêtent pas à votre parcours académique. Elles analysent votre résilience et intelligence émotionnelle." }
    ],
  },
  {
    slug: "management-transition-executive",
    title: "Le Management de Transition Executive",
    subtitle: "Une alternative de carrière à forte valeur ajoutée.",
    excerpt: "Comment valoriser votre expertise de direction lors de missions de retournement, de fusion-acquisition ou de crise.",
    date: "26 avril 2026",
    author: authors.ingrid,
    category: "Transition",
    tags: ["transition", "management de transition", "crise"],
    readingTime: "10 min",
    featured: false,
    heroGradient: "from-[#1A4A2E] to-[#103826]",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80",
    content: [
      { type: "intro", text: "Le management de transition offre une liberté d'action inédite et des rémunérations journalières très attractives." }
    ],
  },
  {
    slug: "parachute-dore-clause-non-concurrence",
    title: "Golden Parachute & non-concurrence : Sécuriser sa sortie",
    subtitle: "Négocier ses clauses de départ lors de la signature.",
    excerpt: "Comment négocier au mieux les indemnités de rupture de contrat et les contreparties financières de votre clause de non-concurrence.",
    date: "19 avril 2026",
    author: authors.ingrid,
    category: "Négociation & Package",
    tags: ["négociation", "golden parachute", "contrat", "juridique"],
    readingTime: "9 min",
    featured: false,
    heroGradient: "from-[#E4B118] to-[#F2C94C]",
    image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80",
    content: [
      { type: "intro", text: "Un départ se prépare dès l'embauche. Ne négligez jamais la rédaction de vos clauses restrictives et protectrices." }
    ],
  },
  {
    slug: "grand-oral-comite-nominations",
    title: "Le Grand Oral devant le comité des nominations",
    subtitle: "Réussir sa présentation de candidat DG devant le Board.",
    excerpt: "Techniques de communication et de posture pour convaincre le comité de sélection de votre légitimité et de votre vision.",
    date: "12 avril 2026",
    author: authors.sabrina,
    category: "Entretien",
    tags: ["entretien", "comité de nomination", "board", "posture"],
    readingTime: "11 min",
    featured: false,
    heroGradient: "from-[#2A5A40] to-[#3A6A50]",
    image: "https://images.unsplash.com/photo-1491336477066-31156b5e4f35?auto=format&fit=crop&w=800&q=80",
    content: [
      { type: "intro", text: "Ce rendez-vous n'est pas un entretien de recrutement classique, c'est une soutenance stratégique." }
    ],
  },
  {
    slug: "e-reputation-dirigeants-linkedin",
    title: "E-Réputation : Audit de visibilité des dirigeants",
    subtitle: "Soigner son empreinte numérique sur Google et LinkedIn.",
    excerpt: "Les investisseurs et conseils d'administration vous googlent avant de vous rencontrer. Contrôlez votre image en ligne.",
    date: "5 avril 2026",
    author: authors.sabrina,
    category: "CV & Personal Branding",
    tags: ["LinkedIn", "e-reputation", "personal branding"],
    readingTime: "10 min",
    featured: false,
    heroGradient: "from-[#0E3A29] to-[#1F4A34]",
    image: "https://images.unsplash.com/photo-1557200134-90327ee9fafa?auto=format&fit=crop&w=800&q=80",
    content: [
      { type: "intro", text: "Votre profil LinkedIn et vos apparitions publiques dans la presse doivent être alignés avec vos objectifs de carrière." }
    ],
  },
  {
    slug: "rachat-entreprise-cadres-lbo",
    title: "LBO : Devenir Directeur Général Actionnaire",
    subtitle: "La transition de salarié à entrepreneur-investisseur.",
    excerpt: "Comment s'associer à des fonds de Private Equity pour racheter son entreprise et maximiser son retour sur investissement.",
    date: "29 mars 2026",
    author: authors.john,
    category: "Stratégie",
    tags: ["LBO", "private equity", "acquisition"],
    readingTime: "14 min",
    featured: false,
    heroGradient: "from-[#103826] to-[#0E3A29]",
    image: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80",
    content: [
      { type: "intro", text: "Le rachat avec effet de levier (LBO) offre aux dirigeants une opportunité exceptionnelle de création de valeur personnelle." }
    ],
  },
  {
    slug: "alignement-culturel-comex",
    title: "L'alignement culturel en Comex",
    subtitle: "Le critère d'évaluation n°1 des présidents de Board.",
    excerpt: "Pourquoi d'excellents profils techniques échouent à cause d'un manque de synergie comportementale avec l'équipe de direction existante.",
    date: "22 mars 2026",
    author: authors.paul,
    category: "Entretien",
    tags: ["entretien", "fit culturel", "comex", "leadership"],
    readingTime: "12 min",
    featured: false,
    heroGradient: "from-[#3A6A50] to-[#4A7A60]",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80",
    content: [
      { type: "intro", text: "Le 'fit' humain prime souvent sur le track record lors des étapes finales de sélection d'un membre de Comex." }
    ],
  },
  {
    slug: "negocier-interessement-capital-bspce",
    title: "BSPCE, Actions Gratuites & Carried Interest",
    subtitle: "Négocier son intéressement au capital de l'entreprise.",
    excerpt: "Comprendre les mécanismes financiers pour négocier des parts dans des start-ups, scale-ups ou filiales de grands groupes.",
    date: "15 mars 2026",
    author: authors.ingrid,
    category: "Négociation & Package",
    tags: ["capital", "carreer interest", "equity", "package"],
    readingTime: "11 min",
    featured: false,
    heroGradient: "from-[#F2C94C] to-[#D4A017]",
    image: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80",
    content: [
      { type: "intro", text: "L'accès au capital est le principal levier d'enrichissement pour un dirigeant à haut potentiel." }
    ],
  },
  {
    slug: "solitude-dirigeant-shadow-cabinet",
    title: "La solitude du dirigeant : bâtir son shadow cabinet",
    subtitle: "S'entourer de conseillers de confiance externes.",
    excerpt: "Comment structurer son cercle de mentors, coachs et pairs pour prendre des décisions stratégiques en toute confidentialité.",
    date: "8 mars 2026",
    author: authors.paul,
    category: "Transition",
    tags: ["solitude", "mentoring", "coaching", "gouvernance"],
    readingTime: "10 min",
    featured: false,
    heroGradient: "from-[#103826] to-[#2A5A40]",
    image: "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=800&q=80",
    content: [
      { type: "intro", text: "Un dirigeant ne peut pas tout partager avec ses équipes ou son conseil. Avoir un réseau de confiance externe est indispensable." }
    ],
  },
  {
    slug: "recrutement-international-dirigeants",
    title: "Recrutement international de dirigeants",
    subtitle: "Naviguer dans les spécificités des contrats globaux.",
    excerpt: "Mobilité, fiscalité internationale et régulations : les points clés lors d'un recrutement à l'étranger.",
    date: "1 mars 2026",
    author: authors.john,
    category: "Marché & Tendances",
    tags: ["international", "fiscalité", "mobilité", "contrat"],
    readingTime: "13 min",
    featured: false,
    heroGradient: "from-[#0E3A29] to-[#1A4A2E]",
    image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80",
    content: [
      { type: "intro", text: "Les contrats internationaux de direction nécessitent une expertise juridique poussée pour éviter les doubles impositions." }
    ],
  },
  {
    slug: "cv-executif-une-page-mythe-ou-realite",
    title: "Le CV Exécutif d'une seule page : Mythe ou réalité ?",
    subtitle: "Adapter la longueur de sa présentation à son niveau de séniorité.",
    excerpt: "Découvrez si le CV court est adapté aux profils Comex ou s'il nuit à l'exposition de vos réalisations complexes.",
    date: "22 février 2026",
    author: authors.sabrina,
    category: "CV & Personal Branding",
    tags: ["CV", "executive", "format", "personal branding"],
    readingTime: "9 min",
    featured: false,
    heroGradient: "from-[#1F4A34] to-[#2A5A40]",
    image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=800&q=80",
    content: [
      { type: "intro", text: "Un CV d'administrateur ou de DG nécessite parfois 2 à 3 pages pour détailler l'étendue des responsabilités gérées." }
    ],
  },
  {
    slug: "dejouer-questions-pieges-administrateurs",
    title: "Déjouer les questions pièges des administrateurs",
    subtitle: "Se préparer aux questions déstabilisantes en entretien.",
    excerpt: "Comment répondre avec hauteur et leadership aux questions des membres de conseils lors d'un recrutement final.",
    date: "15 février 2026",
    author: authors.paul,
    category: "Entretien",
    tags: ["entretien", "administrateur", "conseil d'administration"],
    readingTime: "11 min",
    featured: false,
    heroGradient: "from-[#4A7A60] to-[#3A6A50]",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
    content: [
      { type: "intro", text: "Les questions du board visent souvent à tester votre solidité émotionnelle sous pression." }
    ],
  },
  {
    slug: "chasseurs-tetes-niche-vs-big-five",
    title: "Chasseurs de niche vs. Big Five",
    subtitle: "Identifier et cibler les bons cabinets d'executive search.",
    excerpt: "Optimisez vos démarches en ciblant les cabinets spécialisés par secteur d'activité plutôt que de viser uniquement les généralistes.",
    date: "8 février 2026",
    author: authors.paul,
    category: "Réseau & Chasseurs",
    tags: ["chasseur de têtes", "executive search", "ciblage"],
    readingTime: "10 min",
    featured: false,
    heroGradient: "from-[#1F4A34] to-[#3A6A50]",
    image: "https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=800&q=80",
    content: [
      { type: "intro", text: "Les cabinets spécialisés ou 'boutiques' gèrent une part croissante des recrutements ultra-ciblés." }
    ],
  },
  {
    slug: "pivot-carriere-mandats-administrateur-independant",
    title: "Devenir Administrateur Indépendant",
    subtitle: "Le guide pour décrocher son premier mandat de conseil.",
    excerpt: "Comment valoriser son parcours opérationnel pour intégrer des comités de gouvernance en tant qu'indépendant.",
    date: "1 février 2026",
    author: authors.ingrid,
    category: "Transition",
    tags: ["board", "administrateur indépendant", "gouvernance"],
    readingTime: "12 min",
    featured: false,
    heroGradient: "from-[#103826] to-[#1F4A34]",
    image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80",
    content: [
      { type: "intro", text: "Intégrer un conseil nécessite un changement de posture : passer de l'action à l'orientation stratégique." }
    ],
  },
  {
    slug: "ia-dans-les-comex-transformation-leader",
    title: "L'IA dans les Comex : quel leader pour demain ?",
    subtitle: "Les nouvelles compétences exigées au sommet de l'entreprise.",
    excerpt: "Comment l'intelligence artificielle modifie la prise de décision stratégique et redéfinit le rôle des directeurs de division.",
    date: "25 janvier 2026",
    author: authors.john,
    category: "Marché & Tendances",
    tags: ["IA", "comex", "leadership", "transformation"],
    readingTime: "11 min",
    featured: false,
    heroGradient: "from-[#1A4A2E] to-[#2A5A40]",
    image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80",
    content: [
      { type: "intro", text: "Les leaders doivent comprendre l'impact business de l'IA sans nécessairement être des experts techniques." }
    ],
  },
  {
    slug: "negociation-package-avantages-en-nature-lti",
    title: "LTI & avantages : Valoriser son package global",
    subtitle: "Comment négocier la retraite chapeau, la voiture et le logement.",
    excerpt: "Ne sous-estimez pas les avantages indirects. Ils peuvent faire basculer la valeur réelle de votre contrat de travail.",
    date: "18 janvier 2026",
    author: authors.ingrid,
    category: "Négociation & Package",
    tags: ["package", "LTI", "retraite chapeau", "avantages"],
    readingTime: "10 min",
    featured: false,
    heroGradient: "from-[#E4B118] to-[#D4A017]",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80",
    content: [
      { type: "intro", text: "Les Long-Term Incentives (LTI) sont souvent indexés sur les performances boursières ou sur des objectifs ESG." }
    ],
  },
  {
    slug: "pitch-deux-minutes-chasseur-tetes",
    title: "Le Pitch de 2 minutes du dirigeant",
    subtitle: "Convaincre un associé d'Executive Search immédiatement.",
    excerpt: "Structurez votre discours de présentation pour marquer les esprits lors d'un premier appel téléphonique exploratoire.",
    date: "11 janvier 2026",
    author: authors.sabrina,
    category: "CV & Personal Branding",
    tags: ["pitch", "entretien", "chasseur de têtes", "communication"],
    readingTime: "8 min",
    featured: false,
    heroGradient: "from-[#0E3A29] to-[#2A5A40]",
    image: "https://images.unsplash.com/photo-1478147427282-58a87a120781?auto=format&fit=crop&w=800&q=80",
    content: [
      { type: "intro", text: "Un pitch efficace se concentre sur votre proposition de valeur unique et vos victoires majeures." }
    ],
  },
  {
    slug: "onboarding-executif-prise-fonction",
    title: "Sécuriser son Onboarding Exécutif",
    subtitle: "Réduire les risques d'échec durant les six premiers mois.",
    excerpt: "La transition vers un nouveau poste de direction générale comporte des risques. Guide de survie opérationnel.",
    date: "4 janvier 2026",
    author: authors.ingrid,
    category: "Transition",
    tags: ["onboarding", "transition", "integration"],
    readingTime: "11 min",
    featured: false,
    heroGradient: "from-[#103826] to-[#0E3A29]",
    image: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80",
    content: [
      { type: "intro", text: "Un accompagnement par un coach d'intégration externe augmente de 80 % les chances de réussite de la prise de fonction." }
    ],
  },
  {
    slug: "management-crise-posture-dg-medias",
    title: "Management de crise : la posture face aux médias",
    subtitle: "Protéger la réputation de l'entreprise lors d'un séisme.",
    excerpt: "Comment aligner la communication de crise et la gestion opérationnelle sous forte pression médiatique.",
    date: "28 décembre 2025",
    author: authors.paul,
    category: "Stratégie",
    tags: ["crise", "médias", "communication de crise", "Directeur Général"],
    readingTime: "13 min",
    featured: false,
    heroGradient: "from-[#103826] to-[#E4B118]",
    image: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80",
    content: [
      { type: "intro", text: "La réactivité et la transparence maîtrisée sont les deux clés d'une communication de crise réussie." }
    ],
  },
  {
    slug: "marche-mondial-executive-search-2027",
    title: "Le marché mondial de l'executive search en 2027",
    subtitle: "Les grandes tendances régionales du recrutement de dirigeants.",
    excerpt: "Asie, Europe, États-Unis : comment évoluent les flux de talents au niveau des comités de direction.",
    date: "21 décembre 2025",
    author: authors.john,
    category: "Marché & Tendances",
    tags: ["marché", "executive search", "mondialisation", "2027"],
    readingTime: "12 min",
    featured: false,
    heroGradient: "from-[#103826] to-[#1F4A34]",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
    content: [
      { type: "intro", text: "Les pôles de décision se déplacent, entraînant une demande accrue pour des dirigeants multiculturels." }
    ],
  },
  {
    slug: "clause-good-leaver-bad-leaver-dirigeant",
    title: "Good Leaver / Bad Leaver",
    subtitle: "Décoder et négocier ses conditions de sortie financière.",
    excerpt: "Comment les pactes d'actionnaires définissent votre départ et impactent la valeur de vos titres financiers.",
    date: "14 décembre 2025",
    author: authors.ingrid,
    category: "Négociation & Package",
    tags: ["good leaver", "bad leaver", "pacte actionnaires", "juridique"],
    readingTime: "10 min",
    featured: false,
    heroGradient: "from-[#E4B118] to-[#0E3A29]",
    image: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80",
    content: [
      { type: "intro", text: "La définition d'un bad leaver peut être très large. Soyez vigilant sur les conditions de rupture de mandat." }
    ],
  },
  {
    slug: "tribune-expert-se-faire-chasser",
    title: "Se faire chasser grâce à la tribune d'expert",
    subtitle: "Rédiger des articles de fond pour attirer l'attention.",
    excerpt: "La stratégie éditoriale pour démontrer son expertise et se positionner comme le leader naturel d'un secteur.",
    date: "7 décembre 2025",
    author: authors.sabrina,
    category: "Réseau & Chasseurs",
    tags: ["tribune", "visibilité", "executive search", "branding"],
    readingTime: "11 min",
    featured: false,
    heroGradient: "from-[#2A5A40] to-[#1F4A34]",
    image: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80",
    content: [
      { type: "intro", text: "Une tribune publiée dans un média de référence génère plus de contacts qualifiés de chasseurs qu'une mise à jour de profil LinkedIn." }
    ],
  },
  {
    slug: "assessment-360-promotion-interne",
    title: "L'assessment 360° en promotion interne",
    subtitle: "Réussir son évaluation de passage au niveau Comex.",
    excerpt: "Comment appréhender les audits d'aptitude managériale réalisés par des cabinets de conseil externes.",
    date: "30 novembre 2025",
    author: authors.paul,
    category: "Entretien",
    tags: ["assessment", "360", "promotion", "gouvernance"],
    readingTime: "10 min",
    featured: false,
    heroGradient: "from-[#3A6A50] to-[#103826]",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80",
    content: [
      { type: "intro", text: "L'évaluation par vos pairs et subordonnés directs est le meilleur indicateur de votre style de leadership." }
    ],
  },
  {
    slug: "transition-carriere-grande-entreprise-private-equity",
    title: "De la Grande Entreprise au Private Equity",
    subtitle: "Adapter son style de management aux exigences des fonds.",
    excerpt: "Les différences fondamentales de culture, de rythme de travail et d'attentes de performance dans les entreprises sous LBO.",
    date: "23 novembre 2025",
    author: authors.ingrid,
    category: "Transition",
    tags: ["private equity", "LBO", "management", "transition"],
    readingTime: "12 min",
    featured: false,
    heroGradient: "from-[#103826] to-[#FAF6EF]",
    image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80",
    content: [
      { type: "intro", text: "Le Private Equity exige une focalisation obsessionnelle sur le cash-flow et l'exécution rapide du plan de création de valeur." }
    ],
  },
];

export const categories: { name: ArticleCategory; count: number }[] = [
  { name: "Marché & Tendances", count: articles.filter((a) => a.category === "Marché & Tendances").length },
  { name: "CV & Personal Branding", count: articles.filter((a) => a.category === "CV & Personal Branding").length },
  { name: "Négociation & Package", count: articles.filter((a) => a.category === "Négociation & Package").length },
  { name: "Réseau & Chasseurs", count: articles.filter((a) => a.category === "Réseau & Chasseurs").length },
  { name: "Entretien", count: articles.filter((a) => a.category === "Entretien").length },
  { name: "Stratégie", count: articles.filter((a) => a.category === "Stratégie").length },
  { name: "Transition", count: articles.filter((a) => a.category === "Transition").length },
];

export const allTags = Array.from(new Set(articles.flatMap((a) => a.tags)));

export function getArticleBySlug(slug: string): BlogArticle | undefined {
  return articles.find((a) => a.slug === slug);
}

export function getRelatedArticles(article: BlogArticle, max: number = 3): BlogArticle[] {
  return articles
    .filter((a) => a.slug !== article.slug)
    .map((a) => ({
      article: a,
      score:
        (a.category === article.category ? 3 : 0) +
        a.tags.filter((t) => article.tags.includes(t)).length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((a) => a.article);
}

export function getArticlesByCategory(category: ArticleCategory): BlogArticle[] {
  return articles.filter((a) => a.category === category);
}

export function getArticlesByTag(tag: string): BlogArticle[] {
  return articles.filter((a) => a.tags.includes(tag));
}

export function paginateArticles(
  page: number,
  perPage: number = 6
): { items: BlogArticle[]; total: number; totalPages: number } {
  const start = (page - 1) * perPage;
  const items = articles.slice(start, start + perPage);
  return {
    items,
    total: articles.length,
    totalPages: Math.ceil(articles.length / perPage),
  };
}
