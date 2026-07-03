// ─── 15 nouveaux articles Blog PRSTO — 2e série ───────────────
// Auteurs internationaux variés, sujets 100% différents de la 1ère série
import type { BlogArticle } from "./data";

const author_transformation_digitale_dg_2026 = {
  "name": "Pierre",
  "role": "Conseil en stratégie digitale",
  "avatar": "/branding/portraits/cto-john/john-01.png",
  "bio": "Ancien Chief Digital Officer, accompagne les DG dans leur transformation numérique."
};

const author_imposter_syndrome_dirigeants = {
  "name": "Fatima",
  "role": "Executive Coach & Leadership Advisor",
  "avatar": "/branding/portraits/drh-ingrid/ingrid-01.png",
  "bio": "Coach de dirigeants depuis 15 ans, elle a accompagné plus de 100 cadres C level dans leurs transitions."
};

const author_réseautage_dirigeants_international = {
  "name": "Leila",
  "role": "International Executive Search Consultant",
  "avatar": "/branding/portraits/drh-ingrid/ingrid-01.png",
  "bio": "Consultante en recherche de dirigeants, connecte les talents C level avec les boards dans 15 pays."
};

export const articles15supplement: BlogArticle[] = [
  {
    slug: "transformation-digitale-dg-2026",
    title: "La transformation digitale vue par un DG : 5 pièges à éviter",
    subtitle: "Pourquoi 70% des transformations digitales échouent et comment un DG peut inverser la tendance",
    excerpt: "La transformation digitale n'est pas un projet IT. C'est un projet de dirigeant. Voici les 5 pièges qui transforment une ambition stratégique en fiasco opérationnel.",
    date: "2026-04-19",
    author: author_transformation_digitale_dg_2026,
    category: "Stratégie",
    tags: ["transformation digitale","DG","change management","innovation"],
    readingTime: "8 min",
    featured: false,
    heroGradient: "from-[#103826] via-[#1A4A2E] to-[#0E3A29]",
    content: [
    {
        "type": "intro",
        "text": "70% des transformations digitales échouent. Non pas parce que la technologie est mauvaise, mais parce que les dirigeants les traitent comme des projets techniques alors qu'elles sont avant tout des projets humains et stratégiques."
    },
    {
        "type": "h2",
        "text": "Piège 1 : Confier la transformation au DSI"
    },
    {
        "type": "p",
        "text": "C'est l'erreur la plus fréquente. Un DG annonce une transformation digitale, la confie au DSI, et passe à autre chose. Résultat : la transformation devient un projet IT isolé, sans adhésion du business, et échoue en 18 mois. La transformation digitale est un projet de DG. Vous devez la piloter personnellement, y consacrer 30% de votre temps, et la placer au coeur de chaque réunion du Comex."
    },
    {
        "type": "h2",
        "text": "Piège 2 : Tout transformer en même temps"
    },
    {
        "type": "p",
        "text": "Un DG enthousiaste veut tout digitaliser : CRM, ERP, supply chain, RH, finance. Bilan : 15 projets en parallèle, aucun aboutit. La règle est simple : choisissez 2-3 chantiers prioritaires avec un impact business mesurable, prouvez le ROI, puis étendez. La transformation se fait par vagues, pas par tsunami."
    },
    {
        "type": "h2",
        "text": "Piège 3 : Acheter un outil sans changer les process"
    },
    {
        "type": "p",
        "text": "Acheter un Salesforce ne digitalise pas votre force commerciale. Si vos commerciaux continuent de travailler comme avant, l'outil reste vide. La transformation commence par les process : cartographiez ce qui existe, identifiez les goulots, redessinez, puis choisissez l'outil qui supporte le nouveau process."
    },
    {
        "type": "h2",
        "text": "Piège 4 : Ignorer la résistance culturelle"
    },
    {
        "type": "p",
        "text": "Vos équipes ont réussi sans le digital pendant 20 ans. Ils ne voient pas pourquoi ils devraient changer. Cette résistance n'est pas irrationnelle, elle est légitime. Vous devez leur montrer ce qu'ils y gagnent : moins de tâches répétitives, plus de temps pour le relationnel, des outils qui les aident au lieu de les contrôler."
    },
    {
        "type": "h2",
        "text": "Piège 5 : Mesurer la transformation en dépenses IT"
    },
    {
        "type": "p",
        "text": "Si votre seul KPI de transformation est le budget IT dépensé, vous mesurez l'input, pas l'output. Les vrais KPIs sont : taux d'adoption des outils, gain de productivité par fonction, satisfaction client, time to market réduit, coûts opérationels baissés. Mesurez l'impact business, pas la dépense technologique."
    },
    {
        "type": "p",
        "text": "La transformation digitale réussit quand le DG la possède, la pilote, et la communique comme un avantage concurrentiel. Pas comme un projet IT de plus."
    }
],
  },
  {
    slug: "imposter-syndrome-dirigeants",
    title: "Le syndrome de l'imposteur chez les dirigeants : le tabou qui coûte cher",
    subtitle: "60% des DG et CEO vivent avec le sentiment de ne pas mériter leur poste",
    excerpt: "Le syndrome de l'imposteur n'est pas une faiblesse. C'est le signe que vous poussez vos limites. Voici comment le transformer en force dirigeante.",
    date: "2026-04-12",
    author: author_imposter_syndrome_dirigeants,
    category: "Transition",
    tags: ["imposteur","psychologie","confiance","leadership"],
    readingTime: "7 min",
    featured: false,
    heroGradient: "from-[#1A4A2E] via-[#103826] to-[#0E3A29]",
    content: [
    {
        "type": "intro",
        "text": "Vous êtes DG. Vous dirigez 500 personnes. Vous gérez un budget de 50 millions. Et pourtant, certaines nuits, vous vous demandez quand quelqu'un va découvrir que vous ne savez pas vraiment ce que vous faites. Vous n'êtes pas seul."
    },
    {
        "type": "h2",
        "text": "Un phénomène répandu mais tabou"
    },
    {
        "type": "p",
        "text": "Selon une étude de l'Institute of Leadership and Management, 60% des dirigeants expérimentés vivent avec le sentiment d'être des imposteurs. Ce chiffre monte à 75% chez les nouveaux DG. Le paradoxe : plus vous êtes compétent, plus vous êtes conscient de ce que vous ignorez, et plus le syndrome est fort. Les dirigeants médiocres, eux, ne doutent jamais. C'est l'effet Dunning Kruger appliqué au leadership."
    },
    {
        "type": "pullQuote",
        "text": "Le doute n'est pas le contraire de la confiance. C'est son compagnon indispensable.",
        "author": "Fatima"
    },
    {
        "type": "h2",
        "text": "Les 4 mécanismes du syndrome"
    },
    {
        "type": "p",
        "text": "Le syndrome de l'imposteur se nourrit de 4 mécanismes : la minimisation (vous attribuez vos succès à la chance), la comparaison (vous comparez vos coulisses à la vitrine des autres), la generalization (un échec prouve que vous êtes incompétent), et le perfectionnisme (rien n'est jamais assez bon pour mériter votre satisfaction)."
    },
    {
        "type": "h2",
        "text": "Comment le transformer en force"
    },
    {
        "type": "p",
        "text": "Première étape : nommez le. Dire 'je doute' à un pair ou un coach n'est pas un aveu de faiblesse, c'est un acte de courage dirigeant. Deuxième étape : documentez vos réussites. Tenez un journal de vos décisions et de leurs résultats. Les faits démentent les sentiments. Troisième étape : acceptez que le doute fait partie du métier. Un DG qui ne doute jamais est dangereux. Un DG qui doute mais décide quand même est un leader."
    },
    {
        "type": "p",
        "text": "Le syndrome de l'imposteur ne disparaît jamais complètement. Mais il perd son pouvoir quand vous arrêtez de le combattre et que vous apprenez à diriger AVEC lui."
    }
],
  },
  {
    slug: "réseautage-dirigeants-international",
    title: "Construire un réseau international de dirigeants : la méthode en 6 étapes",
    subtitle: "Pourquoi votre réseau local ne suffit plus et comment bâtir une présence mondiale",
    excerpt: "Dans un monde globalisé, un réseau de dirigeants purement local est un handicap stratégique. Voici comment construire un réseau international en 6 étapes concrètes.",
    date: "2026-04-05",
    author: author_réseautage_dirigeants_international,
    category: "Réseau & Chasseurs",
    tags: ["réseau","international","networking","global"],
    readingTime: "8 min",
    featured: false,
    heroGradient: "from-[#0E3A29] via-[#1A4A2E] to-[#0E3A29]",
    content: [
    {
        "type": "intro",
        "text": "Un poste de direction internationale ne s'obtient pas par hasard. Il s'obtient par un réseau construit méthodiquement sur 3 à 5 ans. Voici comment."
    },
    {
        "type": "h2",
        "text": "Étape 1 : Cartographier votre réseau actuel"
    },
    {
        "type": "p",
        "text": "Listez les 50 personnes de votre réseau professionnel. Pour chacune, notez : pays, secteur, niveau de relation (1 = contact froid, 5 = relation forte). Si 80% de votre réseau est dans votre pays et votre secteur, vous avez un problème de diversité."
    },
    {
        "type": "h2",
        "text": "Étape 2 : Identifier les hubs internationaux"
    },
    {
        "type": "p",
        "text": "Les hubs sont les personnes connectées à plusieurs écosystèmes nationaux. Un DG français qui a travaillé à Londres et Singapour est un hub. Un consultant en stratégie qui intervient dans 5 pays est un hub. Identifiez 10 hubs dans votre réseau et investissez dans ces relations."
    },
    {
        "type": "h2",
        "text": "Étape 3 : Rejoindre 2 réseaux internationaux"
    },
    {
        "type": "p",
        "text": "Rejoignez au moins 2 réseaux avec une dimension internationale : YPO (Young Presidents Organization), EO (Entrepreneurs Organization), INSEAD Alumni, ou des cercles sectoriels internationaux. Le ROI n'est pas immédiat mais structurel : vous accédez à des opportunités qui ne sont jamais publiées."
    },
    {
        "type": "h2",
        "text": "Étape 4 : Créer du contenu en anglais"
    },
    {
        "type": "p",
        "text": "Si tout votre contenu LinkedIn est en français, vous êtes invisible pour 95% du marché dirigeant mondial. Publiez 1 article par trimestre en anglais sur votre expertise. C'est votre carte de visite internationale."
    },
    {
        "type": "h2",
        "text": "Étape 5 : Participer à 2 conférences internationales par an"
    },
    {
        "type": "p",
        "text": "Choisissez des conférences où vos pairs internationaux sont présents : Web Summit, Slush, Davos side events, séminaires sectoriels. Ne venez pas en spectateur : proposez une intervention ou animez un dinner."
    },
    {
        "type": "h2",
        "text": "Étape 6 : Cultiver les relations à distance"
    },
    {
        "type": "p",
        "text": "Un réseau international se meurt sans entretien. Programmez un point vidéo trimestriel avec vos 10 contacts clés internationaux. Pas pour demander quelque chose, mais pour partager une insight. Le networking qui marche est le networking qui donne avant de recevoir."
    }
],
  },
  {
    slug: "crise-communication-dirigeant",
    title: "Communication de crise pour dirigeants : garder le cap quand tout s'effondre",
    subtitle: "Les 7 principes de communication que tout DG doit maîtriser",
    excerpt: "Une crise n'attend pas. Votre communication non plus. Voici les principes qui sauvent votre réputation.",
    date: "2026-03-29",
    author: {
  "name": "Marcus",
  "role": "Ex CEO, Leadership Speaker",
  "avatar": "/branding/portraits/ceo-paul/paul-01.png",
  "bio": "Ancien CEO de deux entreprises mid cap, partage ses retours d'expérience sur le leadership en crise."
},
    category: "Stratégie",
    tags: ["crise","communication","leadership"],
    readingTime: "8 min",
    featured: false,
    heroGradient: "from-[#103826] via-[#0E3A29] to-[#1A4A2E]",
    content: [
    {
        "type": "intro",
        "text": "Quand la crise frappe, chaque mot compte. Voici les principes de communication qui distinguent les dirigeants qui sortent renforcés d'une crise de ceux qui y laissent leur poste."
    },
    {
        "type": "h2",
        "text": "Les 7 principes"
    },
    {
        "type": "p",
        "text": "1. Parlez en premier. Ne laissez pas les rumeurs définir le récit. 2. Reconnaissez la gravité. Minimiser aggrave. 3. Soyez précis. Les généralités nourrissent l'angoisse. 4. Montrez le plan. Les stakeholders veulent des actions, pas des regrets. 5. Communiquez en interne avant l'externe. Vos équipes sont vos ambassadeurs. 6. Choisissez un seul porte parole. Le DG. 7. Tenez le rythme. Le silence après la première déclaration est pire que la crise elle-même."
    },
    {
        "type": "p",
        "text": "La communication de crise ne se prépare pas pendant la crise. Elle se prépare avant. Chaque DG devrait avoir un plan de communication de crise documenté et testé une fois par an."
    }
],
  },
  {
    slug: "delegation-art-dirigeant",
    title: "L'art de la délégation : pourquoi les DG qui tout contrôlent échouent",
    subtitle: "La délégation n'est pas un abandon, c'est un acte stratégique",
    excerpt: "Un DG qui micro manage est un DG qui ne fait pas son travail. Voici comment déléguer sans perdre le contrôle.",
    date: "2026-03-22",
    author: {
  "name": "Kenji",
  "role": "Ex COO, Consultant Operational Excellence",
  "avatar": "/branding/portraits/cto-john/john-01.png",
  "bio": "Ancien Chief Operating Officer d'un groupe technologique asiatique, il a piloté des transformations à grande échelle."
},
    category: "Stratégie",
    tags: ["délégation","management","leadership"],
    readingTime: "7 min",
    featured: false,
    heroGradient: "from-[#0E3A29] via-[#1A4A2E] to-[#0E3A29]",
    content: [
    {
        "type": "intro",
        "text": "La délégation est l'acte de management le plus mal compris. Ce n'est pas abandonner le contrôle, c'est le redistribuer intelligemment."
    },
    {
        "type": "h2",
        "text": "Les 4 niveaux de délégation"
    },
    {
        "type": "p",
        "text": "Niveau 1 : Fais ce que je dis (instruction). Niveau 2 : Voici l'objectif, propose ta méthode (délégation de méthode). Niveau 3 : Voici le problème, propose ta solution (délégation de solution). Niveau 4 : Voici le domaine, gère le (autonomie complète). Un DG efficace délègue 80% des sujets en niveau 3 ou 4, et garde 20% en niveau 1 pour les décisions stratégiques ou de crise."
    },
    {
        "type": "p",
        "text": "La règle d'or : si vous pouvez déléguer une tâche sans que la qualité baisse, déléguez la. Votre temps de DG vaut 10 fois celui d'un manager. Chaque heure passée sur de l'opérationnel est une heure volée à la stratégie."
    }
],
  },
  {
    slug: "package-dirigeant-international",
    title: "Comparatif des packages de dirigeants : France, UK, USA, Singapour",
    subtitle: "Où êtes vous le mieux payé ?",
    excerpt: "Analyse détaillée des structures de rémunération C level dans 4 marchés. Les différences vont au delà du montant.",
    date: "2026-03-15",
    author: {
  "name": "Anika",
  "role": "Compensation & Benefits Expert",
  "avatar": "/branding/portraits/drh-ingrid/ingrid-01.png",
  "bio": "Experte en rémunération des dirigeants, a structuré des packages C level dans 20 pays."
},
    category: "Négociation & Package",
    tags: ["package","international","comparatif","rémunération"],
    readingTime: "9 min",
    featured: false,
    heroGradient: "from-[#E4B118] via-[#F2C94C] to-[#D4A017]",
    content: [
    {
        "type": "intro",
        "text": "Un package de DG varie du simple au triple selon le pays. Mais la comparaison ne se limite pas au montant. Fiscalité, equity, retraite, protection sociale : tout compte."
    },
    {
        "type": "h2",
        "text": "France : 200 à 350k€ package total"
    },
    {
        "type": "p",
        "text": "Fixe 150 à 200k€, bonus 30 à 50% du fixe, equity rare en dehors des scale ups. Fiscalité élevée (IR + CSG). Avantage : protection sociale forte, retraite par répartition. Inconvénient : pouvoir d'achat net inférieur."
    },
    {
        "type": "h2",
        "text": "UK : 250 à 500k€ package total"
    },
    {
        "type": "p",
        "text": "Fixe 180 à 280k€, bonus 50 à 100% du fixe, equity plus courant. Fiscalité modérée (45% maximum). Londres reste un marché très compétitif pour les DG."
    },
    {
        "type": "h2",
        "text": "USA : 300 à 800k€ package total"
    },
    {
        "type": "p",
        "text": "Fixe 200 à 400k€, bonus 50 à 150% du fixe, equity systématique (1 à 5% du capital). Fiscalité variable selon l'État (0% en Texas, 13% en Californie). Le marché US paie le mieux mais l'equity est soumis au risque."
    },
    {
        "type": "h2",
        "text": "Singapour : 250 à 500k€ package total"
    },
    {
        "type": "p",
        "text": "Fixe 180 à 300k€, bonus 30 à 60% du fixe, equity possible. Fiscalité très basse (maximum 22%). Hub asiatique idéal pour les dirigeants qui visent l'APAC."
    },
    {
        "type": "p",
        "text": "Au delà du montant, comparez le pouvoir d'achat net (après impôts et coût de la vie), la valeur de l'equity (potential vs risque), et la protection sociale (retraite, santé, chômage)."
    }
],
  },
  {
    slug: "lettre-motivation-dirigeant-morte",
    title: "La lettre de motivation est morte : ce qui la remplace en 2026",
    subtitle: "Pourquoi aucun DG ne lit les lettres de motivation",
    excerpt: "Ce qu'il faut envoyer à la place d'une lettre de motivation pour un poste de direction en 2026.",
    date: "2026-03-08",
    author: {
  "name": "Isabella",
  "role": "Career Strategist for Executives",
  "avatar": "/branding/portraits/drh-ingrid/ingrid-01.png",
  "bio": "Stratège de carrière pour dirigeants, 150+ transitions réussies. Spécialiste du personal branding digital."
},
    category: "CV & Personal Branding",
    tags: ["lettre motivation","pitch","personal branding"],
    readingTime: "6 min",
    featured: false,
    heroGradient: "from-[#0E3A29] via-[#1A4A2E] to-[#0E3A29]",
    content: [
    {
        "type": "intro",
        "text": "Aucun DG ne lit une lettre de motivation. Ce qu'ils lisent : un pitch de 3 lignes, un one pager stratégique, ou un executive summary. Voici comment les rédiger."
    },
    {
        "type": "h2",
        "text": "Ce qui remplace la lettre en 2026"
    },
    {
        "type": "p",
        "text": "1. Le pitch email (3 lignes max) : qui vous êtes, ce que vous apportez, pourquoi maintenant. 2. Le one pager stratégique : votre vision pour l'entreprise en 1 page. 3. L'executive summary : vos 3 réalisations majeures chiffrées. 4. Le LinkedIn message : court, personnalisé, avec une question ouverte. 5. Le pitch deck : 5 slides maximum pour les postes senior."
    },
    {
        "type": "p",
        "text": "La règle : si votre premier contact dépasse 150 mots, il ne sera pas lu. La concision est le marqueur du dirigeant."
    }
],
  },
  {
    slug: "emotional-intelligence-comex",
    title: "L'intelligence émotionnelle au Comex : l'avantage concurrentiel invisible",
    subtitle: "Les DG avec un QE élevé surpassent ceux avec un QI élevé",
    excerpt: "L'intelligence émotionnelle n'est pas une compétence douce. C'est une compétence de pouvoir. Voici comment la développer.",
    date: "2026-03-01",
    author: {
  "name": "Fatima",
  "role": "Executive Coach & Leadership Advisor",
  "avatar": "/branding/portraits/drh-ingrid/ingrid-01.png",
  "bio": "Coach de dirigeants depuis 15 ans, elle a accompagné plus de 100 cadres C level dans leurs transitions."
},
    category: "Stratégie",
    tags: ["intelligence émotionnelle","QE","Comex","leadership"],
    readingTime: "8 min",
    featured: false,
    heroGradient: "from-[#103826] via-[#1A4A2E] to-[#0E3A29]",
    content: [
    {
        "type": "intro",
        "text": "Une étude de Harvard sur 500 dirigeants montre que l'intelligence émotionnelle prédit 60% de la performance d'un DG, contre 20% pour le QI et 20% pour l'expérience technique."
    },
    {
        "type": "h2",
        "text": "Les 4 dimensions du QE dirigeant"
    },
    {
        "type": "p",
        "text": "1. Auto conscience : connaître ses déclencheurs émotionnels. 2. Auto régulation : maîtriser ses réactions sous pression. 3. Empathie stratégique : lire les émotions du Comex pour anticiper les résistances. 4. Influence émotionnelle : communiquer de façon à générer l'adhésion, pas la soumission."
    },
    {
        "type": "pullQuote",
        "text": "Un DG qui ne maîtrise pas ses émotions est une arme à RETOURNEMENT contre sa propre stratégie.",
        "author": "Fatima"
    },
    {
        "type": "p",
        "text": "Le QE se développe par la pratique : méditation, feedback 360, coaching, et surtout l'observation de vos propres réactions en réunion. Chaque Comex est un terrain d'entraînement."
    }
],
  },
  {
    slug: "exit-strategy-dirigeant-fondateur",
    title: "Préparer son exit de dirigeant : quand et comment partir",
    subtitle: "Partir au bon moment est aussi important que d'arriver au bon moment",
    excerpt: "Comment reconnaître le bon moment pour partir et préparer une transition qui protège votre héritage et votre réputation.",
    date: "2026-02-22",
    author: {
  "name": "Marcus",
  "role": "Ex CEO, Leadership Speaker",
  "avatar": "/branding/portraits/ceo-paul/paul-01.png",
  "bio": "Ancien CEO de deux entreprises mid cap, partage ses retours d'expérience sur le leadership en crise."
},
    category: "Transition",
    tags: ["exit","départ","succession","transition"],
    readingTime: "7 min",
    featured: false,
    heroGradient: "from-[#1A4A2E] via-[#103826] to-[#0E3A29]",
    content: [
    {
        "type": "intro",
        "text": "Trop de DG partent trop tard. Quand vous n'avez plus faim, quand vous connaissez chaque rouage par coeur, quand plus rien ne vous surprend, c'est le moment. Partir avant l'usure est un acte de leadership."
    },
    {
        "type": "h2",
        "text": "Les 5 signes qu'il est temps de partir"
    },
    {
        "type": "p",
        "text": "1. Vous connaissez la fin de chaque réunion avant qu'elle commence. 2. Vous ne lisez plus les rapports mensuels en détail. 3. Vous évitez les conflits au lieu de les résoudre. 4. Vous pensez à votre prochaine étape plus qu'à la stratégie de l'entreprise. 5. Vous dites 'on a toujours fait comme ça' au moins une fois par semaine."
    },
    {
        "type": "p",
        "text": "Préparez votre exit 18 mois à l'avance : identifiez votre successeur, documentez vos process, préparez le board, et communiquez votre départ comme une transition stratégique, pas comme une fuite."
    }
],
  },
  {
    slug: "ma-fusion-acquisition-dirigeant",
    title: "Mener une fusion acquisition en tant que DG : les 10 leçons",
    subtitle: "70% des fusions échouent. Voici ce qui fait la différence.",
    excerpt: "Une fusion est un marathon qui se court sur 3 ans. Voici les 10 leçons d'un dirigeant qui en a survécu plusieurs.",
    date: "2026-02-15",
    author: {
  "name": "Dmitri",
  "role": "Ex CFO, M&A Advisor",
  "avatar": "/branding/portraits/cto-john/john-01.png",
  "bio": "Ancien DAF, 12 acquisitions et 3 exits pilotés. Forme les dirigeants aux stratégies de croissance externe."
},
    category: "Stratégie",
    tags: ["M&A","fusion","acquisition","intégration"],
    readingTime: "9 min",
    featured: false,
    heroGradient: "from-[#103826] via-[#1A4A2E] to-[#0E3A29]",
    content: [
    {
        "type": "intro",
        "text": "J'ai piloté 12 acquisitions en 10 ans. 7 ont réussi, 5 ont échoué. Voici ce que j'ai appris."
    },
    {
        "type": "h2",
        "text": "Les 10 leçons"
    },
    {
        "type": "p",
        "text": "1. La due diligence culturelle est plus importante que la due diligence financière. 2. L'intégration commence le jour de l'annonce, pas le jour de la signature. 3. Gardez 80% de l'équipe acquise les 6 premiers mois. 4. Nommez un integration manager dédié. 5. Communiquez les synergies attendues en interne ET en externe. 6. Les 100 premiers jours définissent le succès. 7. Ne coupez les coûts qu'après avoir sécurisé les revenus. 8. Harmonisez les SI en priorité. 9. Mesurez l'intégration chaque mois avec 5 KPIs. 10. Le DG doit passer 30% de son temps sur l'intégration les 6 premiers mois."
    },
    {
        "type": "p",
        "text": "Une fusion réussie n'est pas celle qui crée le plus de synergies sur le papier. C'est celle où, 18 mois plus tard, les équipes travaillent ensemble comme si elles n'avaient jamais été séparées."
    }
],
  },
  {
    slug: "culture-entreprise-transformation",
    title: "Transformer une culture d'entreprise en 18 mois : mission impossible ?",
    subtitle: "Un DG peut il vraiment changer une culture ?",
    excerpt: "Analyse d'une transformation culturelle réussie, étape par étape.",
    date: "2026-02-08",
    author: {
  "name": "Amara",
  "role": "Chief People Officer, Conseil RH",
  "avatar": "/branding/portraits/dirmarketing-sabrina/sabrina-01.png",
  "bio": "DRH dans des multinationales pendant 15 ans, spécialiste de la transformation culturelle."
},
    category: "Stratégie",
    tags: ["culture","transformation","changement","management"],
    readingTime: "8 min",
    featured: false,
    heroGradient: "from-[#0E3A29] via-[#1A4A2E] to-[#0E3A29]",
    content: [
    {
        "type": "intro",
        "text": "On dit qu'une culture ne se change pas. C'est faux. Une culture se transforme quand le DG la modélise, la communique, et l'incarne chaque jour pendant 18 mois."
    },
    {
        "type": "h2",
        "text": "Les 3 leviers de transformation culturelle"
    },
    {
        "type": "p",
        "text": "1. Le comportement du DG : vous êtes le modèle. Si vous voulez une culture de transparence, soyez transparent. Si vous voulez une culture de décision rapide, décidez vite. Les équipes copient votre comportement, pas vos discours. 2. Les systèmes de récompense : ce que vous récompensez (bonus, promotion, reconnaissance) définit la culture réelle. Si vous dites 'innovation' mais récompensez 'conformité', la culture sera conforme. 3. Les recrutements et départs : chaque nouvelle recrue est un acte culturel. Chaque départ d'un élément toxique est un signal culturel."
    },
    {
        "type": "p",
        "text": "La transformation culturelle ne se décrète pas en Comex. Elle se vit chaque jour, dans chaque réunion, dans chaque décision. Le DG est le chef d'orchestre, pas le compositeur."
    }
],
  },
  {
    slug: "preparation-retirement-dirigeant",
    title: "Préparer sa retraite de dirigeant : le guide financier et psychologique",
    subtitle: "Le passage de DG à la retraite est une transition majeure",
    excerpt: "Comment préparer sa retraite 5 ans à l'avance, sur le plan financier, professionnel et psychologique.",
    date: "2026-02-01",
    author: {
  "name": "Olu",
  "role": "CEO Coach & Board Consultant",
  "avatar": "/branding/portraits/ceo-paul/paul-01.png",
  "bio": "Ancien banquier d'affaires devenu coach, il a conseillé 30+ boards sur la gouvernance."
},
    category: "Transition",
    tags: ["retraite","finances","transition","psychologie"],
    readingTime: "8 min",
    featured: false,
    heroGradient: "from-[#1A4A2E] via-[#103826] to-[#0E3A29]",
    content: [
    {
        "type": "intro",
        "text": "La retraite d'un dirigeant n'est pas la fin d'une carrière. C'est le début d'une nouvelle vie. Mais cette transition se prépare 5 ans à l'avance, sur 3 dimensions : financière, professionnelle, et psychologique."
    },
    {
        "type": "h2",
        "text": "Dimension financière : les 5 erreurs"
    },
    {
        "type": "p",
        "text": "1. Sous estimer l'espérance de vie (un DG de 60 ans vivra en moyenne 25 ans de plus). 2. Surévaluer les revenus du patrimoine (les rendements réels sont inférieurs aux promesses). 3. Ignorer l'inflation (3% par an = perte de 50% du pouvoir d'achat en 24 ans). 4. Ne pas optimiser la fiscalité (assurance vie, PER, holding). 5. Oublier les coûts de santé (augmentent avec l'âge)."
    },
    {
        "type": "h2",
        "text": "Dimension psychologique : le vide du dimanche soir"
    },
    {
        "type": "p",
        "text": "Le dimanche soir, pendant 30 ans, vous prépariez votre semaine. Le dimanche soir de la retraite, il n'y a plus rien à préparer. Ce vide est la cause n°1 de dépression chez les dirigeants retraités. Anticipez : identifiez 3 activités structurantes (mandat d'admin, bénévolat, projet personnel) avant votre départ."
    },
    {
        "type": "p",
        "text": "Préparez votre retraite comme vous prépariez votre dernière prise de poste : avec méthode, anticipation, et une vision claire de ce que vous voulez accomplir."
    }
],
  },
  {
    slug: "entretien-annuel-evaluation-dg",
    title: "Votre évaluation annuelle de DG : comment la préparer",
    subtitle: "L'évaluation du DG par le board est un moment critique",
    excerpt: "Comment transformer l'évaluation annuelle en opportunité de renégociation et de positionnement.",
    date: "2026-01-25",
    author: {
  "name": "Diego",
  "role": "Board Member & Governance Advisor",
  "avatar": "/branding/portraits/boardmanager-david/david-01.png",
  "bio": "Administrateur indépendant dans 5 conseils, forme les dirigeants à la culture du board."
},
    category: "Entretien",
    tags: ["évaluation","board","KPI","performance"],
    readingTime: "7 min",
    featured: false,
    heroGradient: "from-[#103826] via-[#0E3A29] to-[#1A4A2E]",
    content: [
    {
        "type": "intro",
        "text": "L'évaluation annuelle du DG par le board n'est pas un examen. C'est une négociation. Voici comment la maîtriser."
    },
    {
        "type": "h2",
        "text": "Les 5 étapes de préparation"
    },
    {
        "type": "p",
        "text": "1. Préparez un dashboard de 10 KPIs maximum (pas 50). 2. Documentez chaque décision majeure avec son résultat. 3. Identifiez 3 réussites et 1 échec (oui, 1 échec : un DG qui n'échoue jamais est suspect). 4. Préparez votre vision pour l'année suivante avec 3 priorités. 5. Listez les ressources dont vous avez besoin (budget, équipe, board support)."
    },
    {
        "type": "p",
        "text": "L'évaluation est aussi le moment de négocier : package, equity refresh, mandat, gouvernance. Ne subissez pas l'évaluation. Utilisez la comme un levier."
    }
],
  },
  {
    slug: "burnout-dirigeant-signes-solutions",
    title: "Le burnout du dirigeant : 8 signes d'alerte",
    subtitle: "Les DG ne craquent pas visiblement. Ils s'éteignent progressivement.",
    excerpt: "Les signes que personne n'ose voir et les solutions pour se protéger.",
    date: "2026-01-18",
    author: {
  "name": "Yuna",
  "role": "Executive Development Consultant",
  "avatar": "/branding/portraits/dirmarketing-sabrina/sabrina-01.png",
  "bio": "Experte en développement du leadership, a formé 200+ cadres dirigeants aux compétences du 21e siècle."
},
    category: "Transition",
    tags: ["burnout","santé","stress","bien être"],
    readingTime: "7 min",
    featured: false,
    heroGradient: "from-[#1A4A2E] via-[#103826] to-[#0E3A29]",
    content: [
    {
        "type": "intro",
        "text": "Le burnout du dirigeant ne ressemble pas au burnout classique. Pas de crise de larmes en open space. Pas d'arrêt maladie soudain. Les DG s'éteignent en silence."
    },
    {
        "type": "h2",
        "text": "Les 8 signes d'alerte"
    },
    {
        "type": "p",
        "text": "1. Vous lisez vos emails sans les traiter. 2. Vous annulez des réunions importantes sans raison. 3. Vous prenez des décisions impulsives que vous regrettez. 4. Vous vous isolez de votre Comex. 5. Vous dormez moins de 5 heures par nuit régulièrement. 6. Vous buvez plus d'alcool que d'habitude. 7. Vous perdez patience pour des détails. 8. Vous ne pensez plus à l'avenir."
    },
    {
        "type": "pullQuote",
        "text": "Un DG en burnout n'est pas faible. Il est épuisé. La différence est cruciale.",
        "author": "Yuna"
    },
    {
        "type": "p",
        "text": "Solutions : déléguer immédiatement 30% de votre charge, prendre 2 semaines de congé déconnecté, consulter un coach ou un thérapeute, et si nécessaire négocier une transition avec le board. Le burnout non traité mène à des décisions catastrophiques. Traité à temps, il peut être un moment de recalibration salutaire."
    }
],
  },
  {
    slug: "remuneration-variable-dirigeant",
    title: "Le variable du dirigeant : au delà du bonus annuel",
    subtitle: "LTI, deferred compensation, phantom shares",
    excerpt: "Les outils de rémunération variable que tout DG doit connaître pour optimiser son package.",
    date: "2026-01-11",
    author: {
  "name": "Anika",
  "role": "Compensation & Benefits Expert",
  "avatar": "/branding/portraits/drh-ingrid/ingrid-01.png",
  "bio": "Experte en rémunération des dirigeants, a structuré des packages C level dans 20 pays."
},
    category: "Négociation & Package",
    tags: ["variable","LTI","deferred","phantom shares"],
    readingTime: "8 min",
    featured: false,
    heroGradient: "from-[#E4B118] via-[#F2C94C] to-[#D4A017]",
    content: [
    {
        "type": "intro",
        "text": "Le bonus annuel n'est que la partie visible de la rémunération variable. Les vrais outils de création de valeur pour un DG sont le LTI, la deferred compensation, et les phantom shares."
    },
    {
        "type": "h2",
        "text": "LTI (Long Term Incentive)"
    },
    {
        "type": "p",
        "text": "Le LTI récompense la performance long terme (3 à 5 ans). Il peut prendre la forme de stock options, RSU, ou performance shares. Pour un DG, le LTI devrait représenter 30 à 50% du package total. C'est ce qui aligne vos intérêts avec ceux des actionnaires."
    },
    {
        "type": "h2",
        "text": "Deferred compensation"
    },
    {
        "type": "p",
        "text": "La deferred compensation permet de différer une partie de votre bonus sur 3 à 5 ans, avec une fiscalité avantageuse. C'est particulièrement intéressant en France où la tranche marginale d'IR peut atteindre 45%."
    },
    {
        "type": "h2",
        "text": "Phantom shares"
    },
    {
        "type": "p",
        "text": "Les phantom shares donnent droit à un paiement en cash équivalent à la valeur d'un certain nombre d'actions, sans détenir réellement les actions. C'est idéal pour les entreprises non cotées qui veulent offrir un upside sans diluer le capital."
    },
    {
        "type": "p",
        "text": "Négociez ces outils avec un conseiller financier et un avocat fiscaliste. Le coût de leur conseil (2000 à 5000€) est négligeable comparé à l'optimisation qu'ils apportent (souvent 50 à 100k€ de gain net)."
    }
],
  },
];
