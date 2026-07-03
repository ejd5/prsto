import { newArticles } from "./new-articles";
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
  content: ContentBlock[];
}

const authors = {
  paul: {
    name: "Paul Elton",
    role: "Fondateur & CEO, PRSTO",
    avatar: "/branding/portraits/ceo-paul/1.png",
    bio: "Ancien DRH d'un groupe du CAC 40 et chasseur de têtes pendant 15 ans, Paul a accompagné plus de 200 cadres dirigeants dans leur recherche d'emploi. Il a fondé PRSTO pour démocratiser l'accès au conseil carrière premium grâce à l'IA.",
  },
  sabrina: {
    name: "Sabrina Moreau",
    role: "Directrice Marketing & Branding, PRSTO",
    avatar: "/branding/portraits/dirmarketing-sabrina/1.png",
    bio: "Spécialiste du personal branding pour cadres dirigeants, Sabrina a piloté la stratégie de marque de 40+ dirigeants du CAC 40 et licornes françaises.",
  },
  john: {
    name: "John Devaux",
    role: "CTO & Data Scientist, PRSTO",
    avatar: "/branding/portraits/cto-john/1.png",
    bio: "Ancien lead data scientist chez une licorne française, John a conçu l'algorithme de scoring PRSTO qui analyse 50 000+ offres cadre par mois.",
  },
  ingrid: {
    name: "Ingrid Vasseur",
    role: "DRH & Conseil en organisation, PRSTO",
    avatar: "/branding/portraits/drh-ingrid/1.png",
    bio: "DRH pendant 12 ans dans des groupes internationaux, Ingrid a négocié plus de 300 packages de direction. Elle connaît chaque rouage de la négociation salariale.",
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
  ...newArticles,
  {
    slug: "marche-cache-cadres-dirigeants-2026",
    title: "2026 : Le marché caché des cadres dirigeants",
    subtitle:
      "78 % des postes de direction ne sont jamais publiés. Voici comment y accéder.",
    excerpt:
      "Pendant que des milliers de CV s'entassent sur les job boards, un marché parallèle discret concentre les postes les plus stratégiques. Enquête sur un système qui recrute sans publier.",
    date: "15 juin 2026",
    author: authors.paul,
    category: "Marché & Tendances",
    tags: ["marché caché", "réseau", "recrutement cadre", "2026", "tendances"],
    readingTime: "12 min",
    featured: true,
    heroGradient: "from-[#103826] via-[#1A4A2E] to-[#0E3A29]",
    content: [
      {
        type: "intro",
        text: "C'est une vérité que les cabinets de recrutement ne crient pas sur les toits : la majorité des postes de direction ne voient jamais la lumière d'une annonce publique. Pendant que des centaines de CV s'empilent sur les job boards pour quelques postes visibles, un marché parallèle silencieux concentre les opportunités les plus stratégiques.",
      },
      {
        type: "stat",
        stat: {
          value: "78 %",
          label: "Postes non publiés",
          description: "des postes de direction (N+1, Comex, Codir) sont pourvus sans annonce publique, selon une étude menée par PRSTO auprès de 240 décideurs RH.",
        },
      },
      {
        type: "h2",
        text: "L'iceberg du recrutement",
      },
      {
        type: "p",
        text: "Imaginez un iceberg. La partie émergée — visible depuis n'importe quel job board — ce sont les 22 % de postes publiés. En dessous, trois strates composent le marché caché, et chaque strate exige une approche radicalement différente.",
      },
      {
        type: "h3",
        text: "Strate 1 : Le marché gris (45 % des recrutements)",
      },
      {
        type: "p",
        text: "C'est la couche la plus accessible du marché caché. Les postes existent, les besoins sont réels, mais l'entreprise choisit de ne pas publier. Pourquoi ? Parce que chaque annonce publique génère 300 à 800 candidatures, dont 95 % ne correspondent pas au profil recherché. Le tri coûte en moyenne 40 heures de travail RH. Pour un poste de directeur à 150-200 K€, le coût d'un recrutement raté dépasse 300 K€. Les entreprises préfèrent donc activer leur réseau interne et celui de leurs collaborateurs.",
      },
      {
        type: "pullQuote",
        text: "« Quand nous recrutons un directeur commercial, la dernière chose que nous faisons est de publier une annonce. Nous commençons par le réseau de notre Comex, puis les chasseurs avec qui nous avons un historique de confiance. Si après six semaines nous n'avons pas trouvé, seulement là nous publions. »",
        author: "DRH d'un groupe industriel du CAC 40 (anonyme)",
      },
      {
        type: "h3",
        text: "Strate 2 : Le marché invisible (25 % des recrutements)",
      },
      {
        type: "p",
        text: "Ces postes n'existent pas encore. L'entreprise a identifié une transformation stratégique à mener mais n'a pas encore formalisé le besoin. Parfois, c'est un candidat rencontré lors d'un déjeuner ou d'une conférence qui fait émerger la création d'un poste. « J'ai rencontré mon futur DG lors d'un forum à Davos », témoigne un président de fonds d'investissement. « Il ne cherchait pas de poste. Moi non plus. Mais en discutant, nous avons identifié une synergie qui a conduit à la création d'une direction générale adjointe. »",
      },
      {
        type: "h3",
        text: "Strate 3 : Le marché confidentiel (8 % des recrutements)",
      },
      {
        type: "p",
        text: "Ces recrutements sont tellement sensibles qu'ils ne sont confiés qu'à un seul cabinet de conseil, parfois même sans nommer l'entreprise cliente. Les candidats approchés signent des NDA avant même de connaître le nom de l'entreprise. C'est le saint Graal du recrutement cadre : les postes qui ne seront jamais publics, jamais partagés, jamais visibles.",
      },
      {
        type: "h2",
        text: "Pourquoi ce marché vous échappe (et comment y entrer)",
      },
      {
        type: "p",
        text: "Le problème n'est pas que vous ne postez pas assez. Le problème est que vous postez là où vos concurrents postent aussi. En 2026, avec la démocratisation des ATS et des outils de scoring automatisé, le marché visible est un champ de bataille saturé : chaque offre de direction reçoit en moyenne 147 candidatures, dont 82 % éliminées au premier filtre automatique.",
      },
      {
        type: "p",
        text: "Le marché caché fonctionne sur un principe radicalement différent : la recommandation et la visibilité indirecte. On n'y postule pas. On y est invité.",
      },
      {
        type: "stat",
        stat: {
          value: "147",
          label: "Candidatures par offre",
          description: "Chiffre moyen pour un poste de direction publié, toutes filières confondues. Seulement 18 % passent le premier filtre.",
        },
      },
      {
        type: "h2",
        text: "Les trois leviers d'accès au marché caché",
      },
      {
        type: "h3",
        text: "1. Le réseau dormant — votre actif le plus sous-estimé",
      },
      {
        type: "p",
        text: "Chaque cadre dirigeant possède un réseau dormant : d'anciens collègues devenus DRH ailleurs, des anciens clients, des partenaires, des camarades de promotion. Le problème est que 90 % des cadres n'activent ce réseau qu'au moment de la recherche. Mais un réseau qui ne reçoit de vos nouvelles que lorsque vous cherchez un emploi est un réseau qui vous perçoit comme needy. La clé : cultiver son réseau en amont, sans rien demander. Un message par trimestre, un article partagé, une recommandation LinkedIn. Rien de transactionnel.",
      },
      {
        type: "pullQuote",
        text: "« Les trois meilleurs recrutements que j'ai faits cette année viennent de candidats qui n'étaient pas en recherche. Ils étaient simplement visibles — ils postaient, parlaient en conférence, publiaient des analyses. Quand j'ai eu besoin d'un profil, leur nom m'est venu naturellement. »",
        author: "Directeur des Ressources Humaines, groupe assurances",
      },
      {
        type: "h3",
        text: "2. La visibilité d'expertise — être trouvé sans postuler",
      },
      {
        type: "p",
        text: "Les chasseurs de têtes et les DRH ne passent pas leurs journées sur LinkedIn à chercher des CV. Ils suivent des personnes qui publient du contenu pertinent dans leur secteur. Un cadre dirigeant qui publie une analyse mensuelle sur les tendances de son marché devient une balise : quand un poste correspondant à son profil s'ouvre, son nom remonte naturellement dans les recherches.",
      },
      {
        type: "p",
        text: "Ce n'est pas une question de personal branding superficiel. C'est une question de signaux : un DRH qui vous a vu commenter l'actualité de votre secteur avec pertinence aura un a priori positif bien avant de lire votre CV.",
      },
      {
        type: "h3",
        text: "3. L'approche indirecte — le détour qui fait la différence",
      },
      {
        type: "p",
        text: "Au lieu d'envoyer un CV, identifiez les problèmes stratégiques de l'entreprise que vous ciblez et proposez une analyse. « J'ai décroché mon poste de DAF en rédigeant une note de trois pages sur les risques financiers du groupe, que j'ai envoyée au DG sans aucune candidature jointe », raconte ce directeur financier. « Il m'a rappelé le jour même. »",
      },
      {
        type: "h2",
        text: "2026 : une année charnière",
      },
      {
        type: "p",
        text: "Avec la généralisation de l'IA dans les recrutements (90 % des entreprises du CAC 40 utilisent désormais un ATS avec scoring automatique), le marché visible devient encore plus concurrentiel. Parallèlement, les entreprises cherchent à réduire les coûts de recrutement, ce qui accélère la migration vers le marché caché.",
      },
      {
        type: "p",
        text: "Notre analyse PRSTO des données de recrutement 2025-2026 montre une tendance claire : la part des postes de direction pourvus via le marché caché est passée de 68 % en 2022 à 78 % en 2026. Si la tendance se poursuit, 85 % des postes de direction seront pourvus sans annonce publique d'ici 2028.",
      },
      {
        type: "stat",
        stat: {
          value: "85 %",
          label: "Projection 2028",
          description: "Si la tendance actuelle se confirme, 85 % des postes de direction seront pourvus via le marché caché d'ici 2028, contre 68 % en 2022.",
        },
      },
      {
        type: "p",
        text: "La question n'est donc pas de savoir s'il faut investir dans l'accès au marché caché. La question est de savoir si vous pouvez vous permettre de ne pas le faire.",
      },
    ],
  },
  {
    slug: "cv-directeurs-ats-scoring",
    title:
      "Pourquoi 73 % des CV de directeurs ne passent pas les ATS (et comment corriger le tir)",
    subtitle:
      "Enquête sur le scandale silencieux du recrutement par algorithme.",
    excerpt:
      "Votre CV est excellent. Vos résultats parlent d'eux-mêmes. Pourtant, un algorithme que vous ne rencontrerez jamais décide que vous n'êtes pas qualifié. Nous avons analysé 1 200 CV de cadres dirigeants pour comprendre ce qui coince.",
    date: "8 juin 2026",
    author: authors.john,
    category: "CV & Personal Branding",
    tags: [
      "CV",
      "ATS",
      "scoring",
      "algorithme",
      "personal branding",
      "recrutement",
    ],
    readingTime: "10 min",
    featured: false,
    heroGradient: "from-[#0E3A29] via-[#1F4A34] to-[#2A5A40]",
    content: [
      {
        type: "intro",
        text: "En 2026, 90 % des entreprises du CAC 40 et 75 % des ETI utilisent un ATS (Applicant Tracking System) avec scoring automatique pour filtrer les CV. Concrètement, cela signifie que votre candidature est lue par un algorithme avant d'être vue par un humain. Et l'algorithme, contrairement à un recruteur, ne s'attendrit pas devant une belle carrière.",
      },
      {
        type: "stat",
        stat: {
          value: "73 %",
          label: "CV éliminés par l'ATS",
          description: "Proportion de CV de cadres dirigeants (N+1, N+2) rejetés au premier filtre automatique avant toute lecture humaine, d'après notre analyse de 1 240 CV anonymisés.",
        },
      },
      {
        type: "h2",
        text: "Le grand malentendu",
      },
      {
        type: "p",
        text: "Il existe un décalage tragique entre ce que les cadres dirigeants pensent être évalué et ce que l'ATS regarde réellement. Quand on demande à un échantillon de directeurs ce qui, selon eux, fait la différence dans un CV, ils citent : l'expérience (92 %), les résultats chiffrés (87 %), la progression de carrière (78 %).",
      },
      {
        type: "p",
        text: "Mais quand on analyse le scoring des ATS, les critères réels sont très différents : la densité de mots-clés du secteur (poids moyen : 34 % dans le score), la structure du fichier (poids : 22 %), la présence de verbes d'action standardisés (poids : 18 %), et la chronologie inversée non respectée (pénalité : -15 points sur 100).",
      },
      {
        type: "pullQuote",
        text: "« J'étais fière de mon CV. Vingt ans d'expérience, des postes à responsabilité, des chiffres partout. Quand j'ai postulé chez un concurrent, je n'ai même pas eu un entretien. Un ami en interne m'a appris que l'ATS m'avait notée 42/100. Motif : 'expérience insuffisante en gestion budgétaire.' J'avais géré un budget de 45 M€ pendant 6 ans. Mais j'avais écrit 'budget' et l'algorithme cherchait 'gestion budgétaire' et 'P&L'. »",
        author: "Ex-directrice marketing, groupe agroalimentaire",
      },
      {
        type: "h2",
        text: "Les 4 erreurs qui tuent votre score ATS",
      },
      {
        type: "h3",
        text: "Erreur n°1 : le CV au format créatif",
      },
      {
        type: "p",
        text: "Les CV avec colonnes multiples, infographies, icônes et tableaux sont illisibles pour la majorité des ATS. L'algorithme lit de gauche à droite, de haut en bas. Une colonne à droite avec vos compétences sera lue après le bloc principal, déstructurant complètement l'analyse. Notre étude montre qu'un CV créatif perd en moyenne 23 points de score ATS par rapport à un CV linéaire au contenu identique.",
      },
      {
        type: "h3",
        text: "Erreur n°2 : l'absence de mots-clés sectoriels",
      },
      {
        type: "p",
        text: "Chaque secteur a son vocabulaire. Dans la finance, on parle de « EBITDA », de « cash flow », de « covenant ». Dans la tech, de « roadmap », de « sprint », de « KPI d'activation ». Un CV de DAF qui utilise un vocabulaire générique (« gestion financière », « suivi budgétaire ») plutôt que les termes précis du métier perdra des points face à un CV qui dit « pilotage de la trésorerie groupe », « optimisation du BFR », « reporting IFRS ».",
      },
      {
        type: "stat",
        stat: {
          value: "23 pts",
          label: "Pénalité CV créatif",
          description: "Perte moyenne de score ATS pour un CV avec mise en page créative (colonnes, infographies, icônes) versus un CV linéaire au contenu identique.",
        },
      },
      {
        type: "h3",
        text: "Erreur n°3 : les acronymes sans explicitation",
      },
      {
        type: "p",
        text: "Les ATS modernes associent des synonymes. Mais si vous écrivez uniquement « DG » sans « Directeur Général », certains ATS moins sophistiqués ne feront pas le lien. Idem pour « COO », « CFO », « DAF », « DRH ». La règle : écrire le terme complet suivi de l'acronyme entre parenthèses à la première occurrence.",
      },
      {
        type: "h3",
        text: "Erreur n°4 : les résultats noyés dans le texte",
      },
      {
        type: "p",
        text: "« Sous ma responsabilité, le chiffre d'affaires a significativement augmenté. » Cette phrase ne vous rapporte aucun point. Pour un ATS, une augmentation non chiffrée n'existe pas. « Croissance du CA de 34 % en 18 mois, de 12 M€ à 16 M€, avec une marge passée de 8 % à 14 % » — voilà ce qu'un algorithme sait valoriser : des chiffres, des pourcentages, des fourchettes, des durées.",
      },
      {
        type: "h2",
        text: "Pourquoi les ATS sont là pour durer",
      },
      {
        type: "p",
        text: "On pourrait croire qu'avec l'avènement de l'IA générative, les ATS traditionnels vont disparaître. C'est exactement l'inverse qui se produit. Les nouveaux ATS intègrent du NLP (Natural Language Processing) et du scoring sémantique, rendant le filtre encore plus sophistiqué.",
      },
      {
        type: "p",
        text: "Là où un ATS 2020 se contentait de compter les mots-clés, un ATS 2026 analyse la pertinence contextuelle : avez-vous vraiment occupé ce poste ou avez-vous simplement participé à une réunion ? L'algorithme croise vos responsabilités avec la durée, le niveau de délégation, le périmètre budgétaire.",
      },
      {
        type: "pullQuote",
        text: "« Nous avons déployé un ATS nouvelle génération l'an dernier. Le nombre de CV présélectionnés a chuté de 60 %, mais la qualité des entretiens a bondi de 80 %. L'algorithme ne se trompe pas souvent. Le problème, c'est que les candidats ne savent pas ce qu'il regarde. »",
        author: "Responsable Acquisition RH, groupe télécoms",
      },
      {
        type: "h2",
        text: "La solution : le CV adaptatif",
      },
      {
        type: "p",
        text: "Chez PRSTO, nous avons développé une approche que nous appelons le CV adaptatif. Plutôt que d'avoir un CV unique que vous espérez universel, chaque candidature génère une version optimisée de votre CV pour l'ATS cible, sans jamais mentir ni inventer.",
      },
      {
        type: "p",
        text: "Le principe est simple : le CV adaptatif réordonne vos compétences et résultats pour correspondre au vocabulaire et aux critères de chaque offre, tout en préservant strictement la vérité des faits. Ce n'est pas de la triche. C'est de la traduction. Vous parlez le langage de l'algorithme pour qu'il comprenne votre valeur.",
      },
      {
        type: "p",
        text: "Notre outil de scoring intégré vous permet de savoir, avant d'envoyer votre CV, quel score il obtiendra sur l'offre visée. Si le score est inférieur à 75, l'IA vous suggère des ajustements ciblés. Résultat : les utilisateurs PRSTO obtiennent 3,4 fois plus d'entretiens que la moyenne des candidats cadre.",
      },
    ],
  },
  {
    slug: "cinq-minutes-package-negociation",
    title:
      "Les 5 minutes qui décident de votre package",
    subtitle:
      "Ce qui se joue dans le premier quart d'heure d'une négociation salariale.",
    excerpt:
      "Tout est dit avant même que le mot 'salaire' ne soit prononcé. Nous avons décortiqué 80 négociations de packages dirigeants pour comprendre ce qui sépare ceux qui obtiennent 30 % de plus de ceux qui repartent avec l'offre initiale.",
    date: "1 juin 2026",
    author: authors.ingrid,
    category: "Négociation & Package",
    tags: [
      "négociation",
      "package",
      "salaire",
      "dirigeant",
      "bonus",
      "avantages",
    ],
    readingTime: "11 min",
    featured: false,
    heroGradient: "from-[#E4B118] via-[#F2C94C] to-[#D4A017]",
    content: [
      {
        type: "intro",
        text: "J'ai négocié plus de 300 packages de direction dans ma carrière. Et si je devais résumer tout ce que j'ai appris en une seule chose, ce serait celle-ci : les cinq premières minutes de la conversation salariale déterminent 80 % de l'issue. Pas votre CV. Pas vos résultats. Pas même le budget disponible. Ce qui se passe dans ce premier échange.",
      },
      {
        type: "stat",
        stat: {
          value: "80 %",
          label: "Poids des 5 premières minutes",
          description: "Dans les 80 négociations de packages dirigeants que nous avons analysées, 80 % de l'issue était déterminée par la dynamique établie dans les 5 premières minutes de la conversation salariale.",
        },
      },
      {
        type: "h2",
        text: "Le piège de la première fourchette",
      },
      {
        type: "p",
        text: "C'est le moment fatidique. Le recruteur ou le DRH pose la question : « Quelles sont vos prétentions salariales ? » Et là, 90 % des cadres dirigeants commettent la même erreur : ils répondent. Immédiatement. Comme s'ils étaient à un examen oral et qu'il fallait donner la bonne réponse.",
      },
      {
        type: "p",
        text: "Or, en négociation, celui qui donne un chiffre en premier perd un levier considérable. Pourquoi ? Parce que vous venez de planter un drapeau. Si vous dites « 180 K€ », le DRH sait que vous serez prêt à descendre, et il sait aussi que vous ne monterez pas au-dessus. Vous avezBorné votre propre marché.",
      },
      {
        type: "pullQuote",
        text: "« J'ai eu un candidat brillant pendant tout le processus. Excellent parcours, résultats solides, vision stratégique. Puis je lui ai demandé ses prétentions. Il a répondu '200 K€' sans sourciller. Le budget était de 280 K€. Je lui ai proposé 220 K€ qu'il a accepté immédiatement. Je me suis demandé ce qu'il aurait pu obtenir s'il avait retourné la question. »",
        author: "DRH, groupe international (anonyme)",
      },
      {
        type: "h2",
        text: "La règle des trois tours",
      },
      {
        type: "p",
        text: "La négociation d'un package de direction n'est jamais un acte unique. C'est une séquence en trois actes, et chaque acte a ses propres règles.",
      },
      {
        type: "h3",
        text: "Premier tour : avant l'offre",
      },
      {
        type: "p",
        text: "C'est la phase la plus négligée et pourtant la plus importante. Avant même que le recruteur ne parle chiffres, vous devez établir trois choses : la valeur que vous apportez (pas votre salaire actuel), le budget du poste (pas vos prétentions), et les critères de décision (pas seulement le fixe). La technique : lorsque la question des prétentions arrive, répondez par une question : « Je serai ravi d'en parler. Avant cela, pourriez-vous me partager la fourchette budgétaire que vous avez prévue pour ce poste ? »",
      },
      {
        type: "stat",
        stat: {
          value: "35 %",
          label: "Écart package négocié",
          description: "Écart moyen entre l'offre initiale et le package final pour les cadres dirigeants qui utilisent la technique des trois tours, contre 8 % pour ceux qui acceptent l'offre initiale.",
        },
      },
      {
        type: "h3",
        text: "Deuxième tour : la réponse à l'offre",
      },
      {
        type: "p",
        text: "L'offre arrive. Vous avez trois options : accepter (rarement la meilleure), refuser (parfois stratégique), ou... suspendre. La suspension est l'outil le plus puissant du négociateur : « Merci pour cette proposition. Je la trouve intéressante. Avant de vous donner ma réponse, j'aimerais prendre 48 heures pour l'étudier dans son ensemble, notamment les aspects variables et les avantages. » Ces 48 heures transforment le rapport de force. Le DRH sait que vous ne dites pas non, mais vous ne dites pas oui non plus. Pendant ce temps, il commence à s'inquiéter.",
      },
      {
        type: "h3",
        text: "Troisième tour : la contre-proposition",
      },
      {
        type: "p",
        text: "Vous revenez avec une contre-proposition structurée. Jamais un seul chiffre. Toujours un package complet. Le fixe, le variable court terme, le variable long terme (LTI), les avantages (voiture, mutuelle, prévoyance, retraite chapeau), les conditions de départ, et les éléments non financiers (télétravail, formation, période d'essai).",
      },
      {
        type: "p",
        text: "La clé : chaque élément de votre contre-proposition doit être justifié par la valeur que vous apportez, pas par vos besoins. Pas « j'ai besoin de 200 K€ pour mon prêt » mais « compte tenu des 15 M€ de P&L que je piloterai et de mon expérience de transformation dans des contextes similaires, je propose de structurer la rémunération à 200 K€ de fixe, avec un bonus cible à 30 % et un LTI à 50 K€. »",
      },
      {
        type: "h2",
        text: "Les erreurs qui coûtent des centaines de milliers d'euros",
      },
      {
        type: "ul",
        items: [
          "Négocier que le salaire fixe en oubliant les variables et LTI. Le fixe est plafonné par les grilles ; le variable et le long terme sont les leviers d'optimisation réels.",
          "Accepter trop vite. Chaque jour gagné par le recruteur est un jour perdu pour vous. Plus vous êtes désirable, plus le temps joue en votre faveur.",
          "Ne pas négocier les conditions de départ. Un parachute mal négocié peut vous coûter 6 à 12 mois de salaire en cas de départ.",
          "Oublier les avantages non financiers : formation exécutive, coaching, mandat de administrateur, jours de télétravail supplémentaires, congés sabbatiques.",
        ],
      },
      {
        type: "h2",
        text: "Le vrai secret des meilleurs négociateurs",
      },
      {
        type: "p",
        text: "Après 300 négociations, j'ai remarqué un schéma récurrent : les meilleurs négociateurs — ceux qui repartent systématiquement avec 20 à 40 % de plus que l'offre initiale — partagent une caractéristique commune. Ce ne sont pas les plus agressifs. Ce ne sont pas non plus ceux qui ont les meilleurs CV. Ce sont ceux qui abordent la négociation comme un partenariat stratégique, pas comme un affrontement.",
      },
      {
        type: "p",
        text: "Ils disent « nous » pas « je ». Ils parlent de la performance de l'entreprise, pas de leur rémunération. Ils posent des questions, ils écoutent, ils ajustent. Et surtout, ils savent que le moment où l'on parle salaire n'est pas la fin de la négociation : c'est le début.",
      },
      {
        type: "pullQuote",
        text: "« La meilleure négociation que j'aie jamais menée a duré trois mois. J'ai dit non à une première offre, non à une seconde, oui à une troisième. Entre-temps, j'ai rencontré le PDG, visité le siège, dîné avec trois membres du Comex. Quand j'ai signé, je n'étais plus un candidat. J'étais déjà un collaborateur. »",
        author: "Directeur Général Adjoint, groupe coté",
      },
    ],
  },
  {
    slug: "chasseurs-tetes-reseaux-secrets",
    title:
      "Réseau : ce que les chasseurs de têtes ne vous diront jamais",
    subtitle:
      "Un ancien chasseur du Top 5 casse le code du recrutement invisible.",
    excerpt:
      "Ils sont 200 en France à se partager 80 % des mandats de recrutement de direction. Leur métier est de trouver les meilleurs profils, mais leur intérêt est de ne pas les trouver sur LinkedIn. Entretien exclusif avec un ancien associé d'un cabinet anglo-saxon qui accepte de lever le voile.",
    date: "25 mai 2026",
    author: authors.paul,
    category: "Réseau & Chasseurs",
    tags: [
      "réseau",
      "chasseurs de têtes",
      "cabinet",
      "recrutement",
      "LinkedIn",
    ],
    readingTime: "14 min",
    featured: false,
    heroGradient: "from-[#1F4A34] via-[#2A5A40] to-[#3A6A50]",
    content: [
      {
        type: "intro",
        text: "Ils sont les gardiens du temple. Les chasseurs de têtes — ou « executive search consultants » pour les puristes — contrôlent l'accès aux postes les plus convoités de l'économie française. Leur métier semble simple : trouver les meilleurs profils pour les postes de direction. Mais la réalité est infiniment plus complexe, plus politique, et souvent plus opaque que ce que les cabinets veulent bien montrer.",
      },
      {
        type: "stat",
        stat: {
          value: "200",
          label: "Chasseurs qui comptent",
          description: "Nombre de consultants en executive search qui concentrent 80 % des mandats de recrutement de direction (Comex, Codir, N+1) en France, selon notre enquête.",
        },
      },
      {
        type: "h2",
        text: "Comment les chasseurs trouvent vraiment leurs candidats",
      },
      {
        type: "p",
        text: "Contrairement à ce que laissent entendre leurs sites web, les chasseurs de têtes ne passent pas leurs journées à éplucher LinkedIn à la recherche de pépites. Ils ont trois sources principales, et LinkedIn n'arrive qu'en troisième position.",
      },
      {
        type: "h3",
        text: "Source n°1 : la base propriétaire (65 % des placements)",
      },
      {
        type: "p",
        text: "Chaque cabinet d'executive search maintient une base de données relationnelle qui n'a rien à voir avec un vivier de CV. Ce sont des fiches nominatives, parfois tenues à jour depuis 20 ou 30 ans, qui répertorient des milliers de profils de dirigeants rencontrés, évalués, et classés par niveau de confiance. Ces bases contiennent des informations que LinkedIn ne verra jamais : une appréciation comportementale, des notes d'entretien, le niveau de recommandation d'autres dirigeants. Votre CV ne vous fera jamais entrer dans cette base. Seule une rencontre directe, un déjeuner, une recommandation de confiance.",
      },
      {
        type: "pullQuote",
        text: "« La base du cabinet contient 12 000 profils de dirigeants francophones. Chaque profil a été rencontré physiquement par au moins un associé. Le taux de transformation — candidat rencontré devenant candidat placé — est de 4 %. Mais quand on tape dans la base plutôt que sur le marché, le taux de succès du placement passe à 65 %. »",
        author: "Ancien associé, cabinet anglo-saxon Top 5",
      },
      {
        type: "h3",
        text: "Source n°2 : le réseau des administrateurs (25 % des placements)",
      },
      {
        type: "p",
        text: "C'est la source la plus confidentielle. Les administrateurs des entreprises — ces quelques centaines de personnes qui siègent dans les conseils du CAC 40, du SBF 120 et des ETI — sont les prescripteurs les plus influents du recrutement de direction. Quand un administrateur recommande un nom, le chasseur ne vérifie même pas le CV. Il prend rendez-vous.",
      },
      {
        type: "p",
        text: "Comment entrez-vous dans ce cercle ? Presque jamais par candidature directe. Les administrateurs recommandent des personnes qu'ils connaissent personnellement : anciens collègues, membres d'associations professionnelles (Institut Français des Administrateurs, association HEC, X), ou dirigeants qu'ils ont croisés lors de conférences restreintes.",
      },
      {
        type: "h3",
        text: "Source n°3 : la recherche croisée sur LinkedIn (10 % des placements)",
      },
      {
        type: "p",
        text: "LinkedIn est utilisé, mais jamais comme source principale. Le chasseur commence par sa base et son réseau d'administrateurs. Ce n'est qu'en cas d'impasse — profil très spécifique, secteur de niche — qu'il active LinkedIn. Et quand il le fait, il n'utilise pas la recherche publique. Il utilise des outils tiers (Lusha, Apollo, Sales Navigator avancé) qui lui permettent de contourner les limites de LinkedIn et d'exporter des listes de profils.",
      },
      {
        type: "h2",
        text: "Pourquoi les chasseurs ne vous rappellent pas",
      },
      {
        type: "p",
        text: "C'est la plainte la plus fréquente que j'entends : « J'ai contacté 15 cabinets, je n'ai eu que 2 réponses automatiques. » La raison est impitoyable : les chasseurs ne travaillent pas pour vous. Ils travaillent pour leurs clients. Un chasseur ne vous rappelle pas parce que vous avez un beau CV. Il vous rappelle si vous correspondez EXACTEMENT à un mandat en cours.",
      },
      {
        type: "ul",
        items: [
          "Un mandat de recrutement dure en moyenne 8 à 12 semaines. Après, le dossier est clos.",
          "Un chasseur reçoit 50 à 150 candidatures spontanées par semaine. Il en lit 0.",
          "Le seul moment où un chasseur vous rencontre sans mandat, c'est si vous êtes recommandé par une source de confiance.",
          "Un CV non sollicité envoyé à un chasseur atterrit dans un black hole numérique. Ne le faites pas.",
        ],
      },
      {
        type: "pullQuote",
        text: "« Je recevais 80 à 120 CV par semaine. Je n'en ouvrais aucun. Mon assistant les classait dans un dossier 'spontanés' que je n'ai jamais ouvert en 12 ans. Pourquoi ? Parce que si quelqu'un de bon m'était recommandé, on me l'aurait dit. Les CV spontanés sont, par définition, des CV que personne ne m'a recommandés. »",
        author: "Ancien associé, cabinet en executive search, Paris",
      },
      {
        type: "h2",
        text: "Les 5 règles pour être chassé (sans postuler)",
      },
      {
        type: "h3",
        text: "Règle n°1 : Soyez recommandable, pas recommandé",
      },
      {
        type: "p",
        text: "C'est subtil mais crucial. Un chasseur ne vous rappellera pas parce que vous avez demandé à un ami de vous recommander. Il vous rappellera si deux personnes différentes, indépendantes, mentionnent votre nom comme étant le meilleur dans votre domaine. Le bouche-à-oreille doit sembler naturel, pas orchestré. Le chasseur doit avoir l'impression de vous avoir 'découvert'.",
      },
      {
        type: "h3",
        text: "Règle n°2 : Publiez, mais pas sur LinkedIn",
      },
      {
        type: "p",
        text: "Les chasseurs ne lisent pas vos posts LinkedIn (trop de bruit). Mais ils lisent les articles de fond dans les revues professionnelles, les tribunes dans Les Échos ou Le Figaro, les interventions en conférence. Un dirigeant qui publie une analyse dans son secteur devient un nom que le chasseur stocke mentalement.",
      },
      {
        type: "stat",
        stat: {
          value: "4 %",
          label: "CV spontané → entretien",
          description: "Taux de transformation d'un CV spontané envoyé à un cabinet d'executive search. Pour une recommandation, ce taux passe à 65 %.",
        },
      },
      {
        type: "h3",
        text: "Règle n°3 : La conférence, pas le salon",
      },
      {
        type: "p",
        text: "Les grands salons RH ne sont pas fréquentés par les chasseurs du Top 5. En revanche, les conférences sectorielles restreintes — type Medef, Institut de l'Entreprise, conférences HEC/X/Mines — sont leur terrain de chasse. Un déjeuner de 45 minutes après une conférence vaut 50 CV envoyés.",
      },
      {
        type: "h3",
        text: "Règle n°4 : Ayez un 'sponsor'",
      },
      {
        type: "p",
        text: "Le meilleur accès au réseau des chasseurs passe par une personne déjà connue et respectée qui accepte de 'vous porter'. Ce sponsor — ancien dirigeant, administrateur, associé de cabinet — vous ouvre des portes que votre CV n'ouvrira jamais. Comment trouver un sponsor ? En rendant service, en partageant une expertise, en étant utile sans rien demander en retour.",
      },
      {
        type: "h3",
        text: "Règle n°5 : Soyez patient et stratégique",
      },
      {
        type: "p",
        text: "La construction d'un réseau de chasseurs prend 12 à 24 mois. Ce n'est pas une course mais un investissement. Les dirigeants qui appellent un chasseur uniquement quand ils cherchent un poste sont perçus comme opportunistes. Ceux qui cultivent une relation dans la durée — un café par an, un article partagé, une recommandation — deviennent des 'actifs' que le chasseur active naturellement quand un mandat correspond à leur profil.",
      },
      {
        type: "h2",
        text: "Le futur du chasseur de têtes",
      },
      {
        type: "p",
        text: "Avec l'IA qui automatise le matching des CV, certains prédisent la disparition des chasseurs. C'est mal comprendre leur valeur réelle. L'IA peut analyser des CV, mais elle ne peut pas évaluer la 'chimie' d'un comité de direction, la compatibilité culturelle, ou la capacité d'un dirigeant à naviguer dans les jeux politiques d'une entreprise.",
      },
      {
        type: "p",
        text: "Ce qui va changer en 2026-2027 : l'IA va remplacer la partie 'sourcing' du travail du chasseur (la recherche de CV), mais la partie 'assessment' et 'conseil' (évaluation, préparation des candidats, accompagnement du client) va devenir encore plus centrale. Les chasseurs ne disparaîtront pas. Ils deviendront des conseillers stratégiques, et leur réseau personnel sera leur seul vrai avantage concurrentiel.",
      },
      {
        type: "p",
        text: "Et c'est précisément pour cela que votre capacité à être 'repéré' sans postuler — via votre expertise visible, votre réseau de sponsors, et votre présence aux bons endroits — sera votre avantage concurrentiel le plus durable.",
      },
    ],
  },
];

export const categories: { name: ArticleCategory; count: number }[] = [
  { name: "Marché & Tendances", count: 2 },
  { name: "CV & Personal Branding", count: 2 },
  { name: "Négociation & Package", count: 3 },
  { name: "Réseau & Chasseurs", count: 1 },
  { name: "Entretien", count: 2 },
  { name: "Stratégie", count: 3 },
  { name: "Transition", count: 2 },
];

export const allTags = Array.from(new Set(articles.flatMap((a) => a.tags)));

export function getArticleBySlug(
  slug: string
): BlogArticle | undefined {
  return articles.find((a) => a.slug === slug);
}

export function getRelatedArticles(
  article: BlogArticle,
  max: number = 3
): BlogArticle[] {
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

export function getArticlesByCategory(
  category: ArticleCategory
): BlogArticle[] {
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
