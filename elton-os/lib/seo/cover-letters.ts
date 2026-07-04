/**
 * 30 exemples de lettres de motivation executive — par secteur + situation
 * ==============================================================
 * SEO target: "lettre de motivation directeur", "lettre motivation CFO", etc.
 */

export interface CoverLetterExample {
  slug: string;
  title: string;
  category: "Secteur" | "Situation" | "Ton";
  targetRole: string;
  sector?: string;
  summary: string;
  structure: Array<{ part: string; content: string }>;
  fullExample: string;
  tips: string[];
  faq: Array<{ question: string; answer: string }>;
}

export const COVER_LETTER_EXAMPLES: CoverLetterExample[] = [
  // ═══ PAR SECTEUR (12) ═══
  {
    slug: "lettre-motivation-directeur-banque",
    title: "Lettre de motivation Directeur Banque",
    category: "Secteur",
    targetRole: "Directeur Banque / Directeur d'Agence",
    sector: "Banque",
    summary: "Lettre de motivation pour un poste de Directeur en banque. Ton sobre, références au P&L, à la conformité réglementaire (ACPR) et à la gestion des risques.",
    structure: [
      { part: "En-tête", content: "Vos coordonnées + destinataire (Directeur RH ou DG de la banque)" },
      { part: "Objet", content: "Candidature au poste de Directeur [Précisions]" },
      { part: "Accroche", content: "Référence à votre expérience en banque (années + secteur)" },
      { part: "Corps 1", content: "Réalisation marquante chiffrée (P&L, croissance, risques)" },
      { part: "Corps 2", content: "Conformité et gouvernance (ACPR, Bâle, Sapin 2)" },
      { part: "Corps 3", content: "Adéquation avec la banque cible (spécificités, marché)" },
      { part: "Conclusion", content: "Proposition d'échange, disponibilité" },
    ],
    fullExample: `Monsieur le Directeur Général,

Cadre dirigeant avec 18 ans d'expérience dans le secteur bancaire français, j'ai piloté avec succès des P&L de 120 M€ tout en maintenant une conformité irréprochable (ACPR, Bâle III). Chez [Banque précédente], j'ai dirigé une équipe de 85 personnes, réduit le coût du risque de 22% et amélioré le PNB de 18% en 3 ans.

Mon expérience en gouvernance (membre du Comex, reporting Board trimestriel) et en transformation digitale des banques de détail me semble particulièrement alignée avec les défis de [Banque cible], notamment votre ambition de digitalisation à 40% d'ici 2027.

Je serais honoré d'échanger sur ma candidature. Disponible sous 3 mois (préavis standard).

Veuillez agréer, Monsieur le Directeur Général, l'expression de mes salutations distinguées.`,
    tips: [
      "Toujours mentionner la conformité (ACPR, Bâle) — c'est un signal fort en banque",
      "Chiffrer le P&L géré, l'équipe et le coût du risque",
      "Référencer le Comex/Board pour montrer le niveau de gouvernance",
      "Adapter le ton à la banque (banque de détail vs banque d'investissement)",
    ],
    faq: [
      { question: "Faut-il mentionner les certifications AMF ?", answer: "Oui, c'est obligatoire pour exercer en banque. Mentionnez-les dans le CV, pas forcément dans la lettre." },
      { question: "Banque de détail vs banque privée ?", answer: "Ton différent. Banque de détail = volume + P&L. Banque privée = relation + AUM. Adaptez la lettre." },
      { question: "Comment aborder la conformité ?", answer: "Mentionnez les frameworks maîtrisés (Sapin 2, Bâle, ACPR) et les audits passés sans réserve. C'est rassurant." },
    ],
  },
  {
    slug: "lettre-motivation-directeur-assurance",
    title: "Lettre de motivation Directeur Assurance",
    category: "Secteur",
    targetRole: "Directeur Assurance / Directeur Sinistres",
    sector: "Assurance",
    summary: "Lettre pour poste de Direction en assurance. Références à Solvabilité 2, gestion des sinistres, technical P&L.",
    structure: [
      { part: "En-tête", content: "Coordonnées + destinataire (DRH ou DG de la compagnie)" },
      { part: "Objet", content: "Candidature au poste de Directeur [Sinistres/Production/Conformité]" },
      { part: "Accroche", content: "Expérience en assurance (années + lignes de business)" },
      { part: "Corps 1", content: "Réalisation (Solvency 2, combined ratio, sinistralité)" },
      { part: "Corps 2", content: "Gouvernance (Comex, ACPR, Board)" },
      { part: "Corps 3", content: "Adéquation avec la compagnie (lignes, marché)" },
      { part: "Conclusion", content: "Disponibilité et proposition d'échange" },
    ],
    fullExample: `Madame la Directrice Générale,

Directeur Sinistres avec 15 ans d'expérience dans l'assurance IARD, j'ai piloté la transformation de la gestion sinistres de [Compagnie précédente], réduisant le délai moyen de traitement de 35% et le combined ratio de 4 points (de 102% à 98%).

Ma maîtrise du cadre Solvabilité 2 (ORSA, reporting SFCR) et mon expérience de gouvernance (Comex, reporting Board semestriel) me positionnent pour relever les défis de [Compagnie cible], notamment votre projet de digitalisation des sinistres 2026.

Disponible sous 3 mois, je serais heureux d'échanger sur les enjeux de votre direction sinistres.

Je vous prie d'agréer, Madame la Directrice Générale, mes salutations distinguées.`,
    tips: [
      "Le combined ratio est le KPI numéro 1 — chiffrez-le systématiquement",
      "Solvabilité 2 et ORSA sont attendus — mentionnez-les",
      "Précisez les lignes (IARD, Vie, Santé, Prévoyance) pour cibler",
      "ACPR est l'autorité de tutelle — référencez les audits passés",
    ],
    faq: [
      { question: "Combined ratio target ?", answer: "< 100% = profitable. < 95% = excellent. > 105% = problème. Mentionnez le vôtre et la trajectoire." },
      { question: "IARD vs Vie ?", answer: "Marchés très différents. IARD = sinistres fréquents, cycle court. Vie = long-terme, technicité actuelle. Adaptez la lettre." },
      { question: "Faut-il mentionner l'ACNAM ?", answer: "Pour la santé/prévoyance, oui. Pour l'IARD, l'ACPR suffit. Mentionnez l'autorité pertinente." },
    ],
  },
  {
    slug: "lettre-motivation-directeur-industrie",
    title: "Lettre de motivation Directeur Industrie",
    category: "Secteur",
    targetRole: "Directeur Industriel / Directeur Production",
    sector: "Industrie",
    summary: "Lettre pour poste de Direction industrielle. Références Lean, Six Sigma, OEE, HSE, Industrie 4.0.",
    structure: [
      { part: "En-tête", content: "Coordonnées + destinataire (DRH ou DG industriel)" },
      { part: "Objet", content: "Candidature au poste de Directeur Industriel" },
      { part: "Accroche", content: "Expérience industrielle (années + sites gérés)" },
      { part: "Corps 1", content: "Réalisation (OEE,Lean, coûts, qualité)" },
      { part: "Corps 2", content: "HSE et certifications (ISO 45001)" },
      { part: "Corps 3", content: "Industrie 4.0 et transformation" },
      { part: "Conclusion", content: "Disponibilité" },
    ],
    fullExample: `Monsieur le Directeur Général,

Directeur Industriel avec 20 ans d'expérience dans l'industrie automobile et aéronautique, j'ai piloté 4 sites de production (1 200 personnes, CA 280 M€), atteignant un OEE de 82% et zéro accident avec arrêt en 2 ans.

Certifié Black Belt Lean Six Sigma, j'ai déployé l'Industrie 4.0 (IoT, IA prédictive) sur 3 usines, augmentant la disponibilité machines de 12 points. Mon expérience de la transformation industrielle me semble alignée avec les ambitions de [Entreprise cible], notamment votre projet d'extension à [Site cible].

Disponible sous 4 mois (préavis + non-compét), je serais honoré d'échanger.

Veuillez agréer, Monsieur le Directeur Général, mes salutations distinguées.`,
    tips: [
      "OEE (Overall Equipment Effectiveness) est attendu — chiffrez-le",
      "Black Belt Lean Six Sigma = signal fort, mentionnez-le",
      "HSE est crucial — zéro accident est un argument différenciant",
      "Industrie 4.0 est un plus moderne, montrez votre maturité digitale",
    ],
    faq: [
      { question: "Black Belt obligatoire ?", answer: "Pas obligatoire mais très valorisé. Green Belt minimum. Master Black Belt = top tier." },
      { question: "IATF 16949 (auto) ou AS9100 (aéro) ?", answer: "Selon le secteur. Mentionnez la certification sectorielle pertinente. C'est un prérequis." },
      { question: "Industrie 4.0 ?", answer: "Mentionnez IoT, IA prédictive, digital twin si applicable. C'est un différenciateur fort en 2026." },
    ],
  },
  {
    slug: "lettre-motivation-directeur-tech-saas",
    title: "Lettre de motivation Directeur Tech / SaaS",
    category: "Secteur",
    targetRole: "CTO / CPO / VP Engineering SaaS",
    sector: "Tech / SaaS",
    summary: "Lettre pour poste de Direction tech en SaaS. Références ARR, NRR, stack, équipe, scale.",
    structure: [
      { part: "En-tête", content: "Coordonnées + destinataire (CEO ou Founder)" },
      { part: "Objet", content: "Candidature au poste de CTO/VP Engineering" },
      { part: "Accroche", content: "Expérience tech SaaS (années + scale)" },
      { part: "Corps 1", content: "Réalisation (ARR,équipe, stack, time-to-deploy)" },
      { part: "Corps 2", content: "Architecture et scalabilité" },
      { part: "Corps 3", content: "Culture d'équipe et recrutement" },
      { part: "Conclusion", content: "Disponibilité + equity" },
    ],
    fullExample: `Cher [Prénom du CEO],

CTO avec 12 ans d'expérience dans la scale-up SaaS B2B, j'ai construit et piloté l'équipe tech de [Startup précédente] de 8 à 60 ingénieurs, faisant passer l'ARR de 5 M€ à 28 M€ en 36 mois.

J'ai migré le monolithe vers microservices (AWS), réduisant le time-to-deploy de 3 semaines à 4h, et optimisé les coûts cloud de 35% (3 M€/an). Ma maîtrise de stacks modernes (Kubernetes, Snowflake, dbt) et mon expérience de l'hypergrowth SaaS me semblent alignées avec les ambitions de [Startup cible], notamment votre expansion US.

Disponible sous 2 mois, je serais ravi d'échanger sur le poste et la vision technique.

À très vite,
[Votre Prénom]`,
    tips: [
      "ARR et NRR sont les KPIs absolus — chiffrez-les",
      "Time-to-deploy et coûts cloud montrent l'impact opérationnel",
      "Mentionnez la stack sans jargon — focus sur l'impact business",
      "Equity est légitime à mentionner en SaaS, pas en grand groupe",
    ],
    faq: [
      { question: "CTO vs VP Engineering ?", answer: "Le CTO porte la vision technique. Le VP Eng porte l'exécution (équipe, process). Souvent fusionnés en scale-up." },
      { question: "Equity à mentionner ?", answer: "Oui en SaaS/scale-up. Mentionnez 'interested in equity package' si pertinent. Pas en grand groupe." },
      { question: "Faut-il montrer du code ?", answer: "Non. GitHub portfolio oui, mais pas dans la lettre. Concentrez-vous sur l'impact business." },
    ],
  },
  {
    slug: "lettre-motivation-directeur-pharma",
    title: "Lettre de motivation Directeur Pharma",
    category: "Secteur",
    targetRole: "Directeur Pharma / Directeur Médical",
    sector: "Pharma / Santé",
    summary: "Lettre pour poste de Direction en pharma. Références FDA/EMA/ANSM, clinical, regulatory, market access.",
    structure: [
      { part: "En-tête", content: "Coordonnées + destinataire (DG ou DRH pharma)" },
      { part: "Objet", content: "Candidature au poste de Directeur [Médical/Réglementaire/Commercial]" },
      { part: "Accroche", content: "Expérience pharma (années + thérapeutiques)" },
      { part: "Corps 1", content: "Réalisation (lancements, AMM, market access)" },
      { part: "Corps 2", content: "Maîtrise réglementaire (EMA, FDA, ANSM)" },
      { part: "Corps 3", content: "Réseau KOL et partnerships" },
      { part: "Conclusion", content: "Disponibilité" },
    ],
    fullExample: `Monsieur le Directeur Général,

Directeur Médical avec 18 ans d'expérience dans la pharma (oncologie, immunologie), j'ai piloté 5 lancements de blockbuster (CA cumulé 280 M€), obtenu 3 AMM européennes et négocié le market access dans 12 pays.

Ma maîtrise du cadre réglementaire (EMA, FDA, ANSM) et mon réseau de KOL (Key Opinion Leaders) dans l'onco-hématologie me positionnent pour accélérer le pipeline de [Labo cible], notamment votre molécule [X] en Phase 3.

Disponible sous 6 mois (non-compétion pharma), je serais honoré d'échanger.

Veuillez agréer, Monsieur le Directeur Général, mes salutations distinguées.`,
    tips: [
      "AMM (Autorisation Mise sur le Marché) est un signal fort — mentionnez-en",
      "FDA/EMA/ANSM sont les autorités — références obligatoires",
      "KOL network est crucial en médical — mentionnez votre réseau",
      "Non-compétion 6 mois est standard en pharma — anticipé",
    ],
    faq: [
      { question: "Directeur Médical vs Directeur Commercial ?", answer: "Le DM porte la stratégie médicale (KOL, AMM). Le DC porte le business (CA, parts de marché). Les deux coexistent en pharma." },
      { question: "La non-compétion est-elle négociable ?", answer: "Souvent oui, surtout pour les postes seniors. Mentionnez votre disponibilité réelle (garden leave éventuel)." },
      { question: "PhD ou MD requis ?", answer: "Pour Directeur Médical, MD (médecin) est souvent requis. Pour Directeur Réglementaire, PhD ou Doctorat en pharmacie. Pour Directeur Commercial, MBA ou business." },
    ],
  },
  {
    slug: "lettre-motivation-directeur-retail",
    title: "Lettre de motivation Directeur Retail",
    category: "Secteur",
    targetRole: "Directeur Retail / Directeur Omnicanal",
    sector: "Retail / Distribution",
    summary: "Lettre pour poste de Direction retail. Références omnicanal, expansion, même-store-sales, e-commerce.",
    structure: [
      { part: "En-tête", content: "Coordonnées + destinataire (DG ou DRH retail)" },
      { part: "Objet", content: "Candidature au poste de Directeur Retail" },
      { part: "Accroche", content: "Expérience retail (années + formats)" },
      { part: "Corps 1", content: "Réalisation (CA, openings, MSS, e-com)" },
      { part: "Corps 2", content: "Omnicanal et digitalisation" },
      { part: "Corps 3", content: "Équipe terrain et franchise" },
      { part: "Conclusion", content: "Disponibilité" },
    ],
    fullExample: `Madame la Directrice Générale,

Directeur Retail avec 16 ans d'expérience dans la distribution spécialisée (mode, beauté), j'ai piloté 180 points de vente (CA 220 M€), atteignant une croissance du même-store-sales de +8% en 2 ans.

J'ai lancé l'offre e-com (45 M€ CA an 3) et déployé l'omnicanal (click & collect, ship-from-store), augmentant la part digitale à 28%. Mon expérience de la transformation retail me semble alignée avec les défis de [Enseigne cible], notamment votre plan d'expansion Europe Sud.

Disponible sous 3 mois, je serais heureux d'échanger.

Je vous prie d'agréer, Madame la Directrice Générale, mes salutations distinguées.`,
    tips: [
      "MSS (Same-Store-Sales) est le KPI numéro 1 — chiffrez-le",
      "Omnicanal est attendu — mentionnez click&collect, ship-from-store",
      "Citez le nombre de points de vente pilotés",
      "E-commerce est un plus — mentionnez le CA digital",
    ],
    faq: [
      { question: "Directeur Retail vs Directeur Omnicanal ?", answer: "Retail = magasins physiques. Omnicanal = digital + physique. Souvent fusionnés en 2026." },
      { question: "Franchise vs intégré ?", answer: "Ton différent. Franchise = accompagnement franchisés. Intégré = management direct. Adaptez." },
      { question: "Le retail meurt-il ?", answer: "Non, il se transforme. L'omnicanal est clé. Montrez votre capacité à piloter la transformation." },
    ],
  },
  {
    slug: "lettre-motivation-directeur-energie",
    title: "Lettre de motivation Directeur Énergie",
    category: "Secteur",
    targetRole: "Directeur Énergie / Directeur Transition Énergétique",
    sector: "Énergie",
    summary: "Lettre pour poste de Direction en énergie. Références renouvelables, transition, régulation, M&A.",
    structure: [
      { part: "En-tête", content: "Coordonnées + destinataire (DG ou DRH énergie)" },
      { part: "Objet", content: "Candidature au poste de Directeur [Production/Transition/Strategy]" },
      { part: "Accroche", content: "Expérience énergie (années + mix)" },
      { part: "Corps 1", content: "Réalisation (capacité installée, M&A, projets)" },
      { part: "Corps 2", content: "Régulation (CRE, RTE, EU ETS)" },
      { part: "Corps 3", content: "Transition et renouvelables" },
      { part: "Conclusion", content: "Disponibilité" },
    ],
    fullExample: `Monsieur le Directeur Général,

Cadre dirigeant avec 18 ans d'expérience dans le secteur énergétique (renouvelables, gaz, puissance), j'ai piloté le développement de 2.8 GW de capacités solaires et éoliennes en France et en Europe du Sud, CA généré 320 M€.

Ma maîtrise du cadre réglementaire (CRE, RTE, EU ETS) et mon expérience de M&A (5 acquisitions, 480 M€) me positionnent pour accompagner [Énergéticien cible] dans sa transition vers 50% de renouvelables d'ici 2030.

Disponible sous 4 mois, je serais honoré d'échanger sur les enjeux de votre direction.

Veuillez agréer, Monsieur le Directeur Général, mes salutations distinguées.`,
    tips: [
      "Capacité installée (GW/MW) est le KPI clé en renouvelables",
      "Mentionnez le mix énergétique maîtrisé (solaire, éolien, gaz, nucléaire)",
      "Régulateurs : CRE (FR), RTE (réseau), ACER (EU) — références obligatoires",
      "Transition énergétique est centrale en 2026 — montrez votre impact",
    ],
    faq: [
      { question: "Renouvelables vs énergies fossiles ?", answer: "Marchés en transition. Les renouvelables sont en croissance, les fossiles en déclin. Le CV doit montrer l'adaptation." },
      { question: "PPA (Power Purchase Agreement) ?", answer: "Mentionnez les PPAs signés (corporate ou utility). C'est un signal fort en 2026." },
      { question: "Storage (batteries) ?", answer: "Devenu crucial. Mentionnez les projets storage si applicable. C'est un différenciateur." },
    ],
  },
  {
    slug: "lettre-motivation-directeur-conseil",
    title: "Lettre de motivation Directeur Conseil",
    category: "Secteur",
    targetRole: "Partner / Director Cabinet Conseil",
    sector: "Conseil",
    summary: "Lettre pour Partner/Director en cabinet conseil. Références practice, business development, portefeuille clients.",
    structure: [
      { part: "En-tête", content: "Coordonnées + destinataire (Managing Partner ou HR Partner)" },
      { part: "Objet", content: "Candidature au poste de Partner/Director" },
      { part: "Accroche", content: "Expérience conseil (cabinets + grades)" },
      { part: "Corps 1", content: "Practice et portefeuille clients" },
      { part: "Corps 2", content: "Business development (CA généré)" },
      { part: "Corps 3", content: "Leadership d'équipe et mentoring" },
      { part: "Conclusion", content: "Disponibilité + éthique (non-solicit)" },
    ],
    fullExample: `Cher Managing Partner,

Partner chez [Cabinet précédent] pendant 6 ans, j'ai bâti un portefeuille clients de 12 M€ dans le practice Stratégie/Tech pour les CAC40 et PE funds. J'ai dirigé 25 missions stratégiques (transformation, M&A, governance) et promu 4 Managers en Senior Managers.

Mon expertise du sector tech/scale-up et mon réseau fondateurs/VCs (Balderton, Index, Eurazeo) me positionnent pour développer le practice Tech de [Cabinet cible] en France et Europe du Sud.

Disponible sous 6 mois (garden leave), je serais honoré d'échanger sur les opportunités.

Cordialement,
[Votre Prénom]`,
    tips: [
      "CA généré (portefeuille) est le critère numéro 1 — chiffrez-le",
      "Practice et sector expertise sont clés — précisez-les",
      "Réseau clients est un atout différenciant — mentionnez-le",
      "Garden leave est standard en conseil — anticipé",
    ],
    faq: [
      { question: "Partner vs Director ?", answer: "Partner = associé (equity). Director = pre-partner (souvent 1-2 ans avant partner). Le CV doit préciser." },
      { question: "Non-solicitation ?", answer: "Standard 12-24 mois. Mentionnez votre éthique et votre capacité à développer un nouveau portefeuille sans solicitation." },
      { question: "Big 4 vs MBB vs Boutique ?", answer: "MBB (McKinsey, BCG, Bain) = strategy. Big 4 = audit + advisory. Boutique = sectorielle. Adaptez le discours." },
    ],
  },
  {
    slug: "lettre-motivation-directeur-fonds-pe",
    title: "Lettre de motivation Directeur Fonds PE",
    category: "Secteur",
    targetRole: "Director / Partner Private Equity",
    sector: "Private Equity",
    summary: "Lettre pour Director/Partner en PE. Références deals, IRR, MOIC, sourcing, portfolio management.",
    structure: [
      { part: "En-tête", content: "Coordonnées + destinataire (Managing Partner ou HR Partner)" },
      { part: "Objet", content: "Candidature au poste de Director/Partner" },
      { part: "Accroche", content: "Expérience PE (fonds + grades + deals)" },
      { part: "Corps 1", content: "Track record (deals fermés, IRR, MOIC)" },
      { part: "Corps 2", content: "Sourcing et réseau entrepreneurs" },
      { part: "Corps 3", content: "Portfolio management et value creation" },
      { part: "Conclusion", content: "Disponibilité + carried status" },
    ],
    fullExample: `Cher Managing Partner,

Director chez [Fonds précédent] depuis 5 ans, j'ai fermé 7 deals LBO (320 M€ equity) avec un IRR moyen de 28% et MOIC 2.4x. J'ai piloté le sourcing de 280 opportunités/an et le portfolio management de 5 companies (EBITDA +35% en 24 mois).

Mon sector expertise (SaaS, healthcare) et mon réseau d'entrepreneurs (45 CEOs actifs) me positionnent pour développer le practice Tech de [Fonds cible] en France et DACH.

Disponible sous 4 mois (garden leave), carry en cours de vesting chez [Fonds précédent].

Cordialement,
[Votre Prénom]`,
    tips: [
      "IRR et MOIC sont les KPIs absolus — chiffrez-les systématiquement",
      "Equity deployed et deals fermés — soyez précis",
      "Sourcing volume montre l'activité — mentionnez le nombre/opportunités/an",
      "Carry en cours est légitime à mentionner — signal de réussite",
    ],
    faq: [
      { question: "Director vs Partner PE ?", answer: "Director = pre-partner (6-9 ans). Partner = associé (equity + carry). Le CV doit préciser le grade." },
      { question: "Comment présenter les deals ?", answer: "Anonymisez si NDA. Mentionnez : sector, equity size, IRR/MOIC. Le détail vient en entretien." },
      { question: "Le carry est-il à mentionner ?", answer: "Signal positif ('carry vested' ou 'carry in vesting'). Pas le montant. Montre votre réussite passée." },
    ],
  },
  {
    slug: "lettre-motivation-directeur-logistique",
    title: "Lettre de motivation Directeur Logistique",
    category: "Secteur",
    targetRole: "Directeur Logistique / Supply Chain Director",
    sector: "Logistique / Supply Chain",
    summary: "Lettre pour poste de Direction supply chain/logistique. Références S&OP, OTD, inventory, réseau.",
    structure: [
      { part: "En-tête", content: "Coordonnées + destinataire (DG ou DRH supply chain)" },
      { part: "Objet", content: "Candidature au poste de Directeur Supply Chain/Logistique" },
      { part: "Accroche", content: "Expérience supply (années + secteurs)" },
      { part: "Corps 1", content: "Réalisation (OTD, inventaire, coûts)" },
      { part: "Corps 2", content: "S&OP et forecasting" },
      { part: "Corps 3", content: "Réseau logistique et digitalisation" },
      { part: "Conclusion", content: "Disponibilité" },
    ],
    fullExample: `Monsieur le Directeur Général,

Directeur Supply Chain avec 18 ans d'expérience (FMCG, retail), j'ai piloté la supply chain groupe de [Entreprise précédente] (5 pays, 12 sites), atteignant un OTD de 96% (+8 pts) tout en réduisant les stocks de 32% (rotation x1.4).

J'ai déployé le processus S&OP mensuel (forecast accuracy 88%, vs 65%) et restructuré le réseau logistique (économies 8 M€/an). Mon expérience de la transformation supply chain me semble alignée avec les défis de [Entreprise cible], notamment votre projet d'optimisation EMEA.

Disponible sous 3 mois, je serais heureux d'échanger.

Veuillez agréer, Monsieur le Directeur Général, mes salutations distinguées.`,
    tips: [
      "OTD (On-Time Delivery) est le KPI numéro 1 — chiffrez-le",
      "S&OP est attendu — mentionnez la cadence et l'impact",
      "Inventory turnover ou rotation — mentionnez-le",
      "Réseau logistique = warehousing + transport — montrez l'optimisation",
    ],
    faq: [
      { question: "Supply chain vs Logistique ?", answer: "Supply chain = end-to-end (plan, source, make, deliver). Logistique = transport + warehousing. Le CV doit montrer la vision large." },
      { question: "SAP IBP vs Kinaxis vs Blue Yonder ?", answer: "Mentionnez l'outil déployé et l'impact (forecast accuracy, OTD). Évitez le tool-name dropping sans impact." },
      { question: "Lean supply chain ?", answer: "Mentionnez les déploiements Lean (VSM, kaizen, 5S). C'est un signal fort en industrie." },
    ],
  },
  {
    slug: "lettre-motivation-directeur-immobilier",
    title: "Lettre de motivation Directeur Immobilier",
    category: "Secteur",
    targetRole: "Directeur Immobilier / Directeur Asset Management",
    sector: "Immobilier",
    summary: "Lettre pour poste de Direction en immobilier. Références AUM, asset management, development, ESG.",
    structure: [
      { part: "En-tête", content: "Coordonnées + destinataire (DG ou DRH immobilier)" },
      { part: "Objet", content: "Candidature au poste de Directeur [Asset/Investment/Development]" },
      { part: "Accroche", content: "Expérience immobilier (années + asset classes)" },
      { part: "Corps 1", content: "Réalisation (AUM, IRR, value creation)" },
      { part: "Corps 2", content: "ESG et certifications (BREEAM, LEED)" },
      { part: "Corps 3", content: "Réseau brokers et partenaires" },
      { part: "Conclusion", content: "Disponibilité" },
    ],
    fullExample: `Monsieur le Directeur Général,

Directeur Asset Management avec 16 ans d'expérience en immobilier tertiaire (bureaux, logistique), j'ai géré un portefeuille de 1.2 Mds€ AUM, générant un IRR de 14% et une value creation de 180 M€ en 5 ans.

J'ai piloté la stratégie ESG (certification BREEAM Excellent sur 80% du portefeuille) et le repositionnement de 3 actifs stratégiques. Mon expérience de l'asset management me semble alignée avec les ambitions de [Fonds/Entreprise cible], notamment votre stratégie logistique 2026.

Disponible sous 3 mois, je serais honoré d'échanger.

Veuillez agréer, Monsieur le Directeur Général, mes salutations distinguées.`,
    tips: [
      "AUM (Assets Under Management) est le KPI numéro 1 — chiffrez-le",
      "IRR et value creation sont attendus — mentionnez-les",
      "ESG et certifications (BREEAM, LEED, HQE) sont cruciales en 2026",
      "Asset class (bureaux, logistique, retail, résidentiel) — précisez",
    ],
    faq: [
      { question: "Asset Management vs Investment Management ?", answer: "AM = gestion des actifs existants. IM = acquisition/cession. Souvent distincts en immobilier." },
      { question: "BREEAM vs LEED vs HQE ?", answer: "BREEAM (UK/EU), LEED (US/international), HQE (France). Mentionnez celles que vous maîtrisez." },
      { question: "Logistique vs bureaux ?", answer: "Logistique = en vogue (e-commerce). Bureaux = en transformation (hybride). Adaptez le discours." },
    ],
  },
  {
    slug: "lettre-motivation-directeur-public",
    title: "Lettre de motivation Directeur Secteur Public",
    category: "Secteur",
    targetRole: "Directeur Secteur Public / Directeur Général des Services",
    sector: "Public / Parapublic",
    summary: "Lettre pour poste de Direction dans le public. Références service public, gouvernance élus, transformation.",
    structure: [
      { part: "En-tête", content: "Coordonnées + destinataire (Maire, Président, Ministre)" },
      { part: "Objet", content: "Candidature au poste de DGS/DGA" },
      { part: "Accroche", content: "Expérience service public (années + collectivités)" },
      { part: "Corps 1", content: "Réalisation (transformation, services, économies)" },
      { part: "Corps 2", content: "Gouvernance avec élus (conseil municipal, communauté)" },
      { part: "Corps 3", content: "Innovation publique et partenariats" },
      { part: "Conclusion", content: "Disponibilité + mobilité" },
    ],
    fullExample: `Monsieur le Président,

DGA pendant 8 ans dans deux collectivités de taille similaire (50 000 à 200 000 habitants), j'ai piloté la transformation digitale des services (délais réduits de 40%), la mise en conformité (zéro observation CRC), et l'optimisation budgétaire (15 M€ d'économies en 3 ans).

Mon expérience de la gouvernance avec élus (conseils municipaux, communautés de communes) et ma maîtrise du code général des collectivités territoriales me positionnent pour accompagner [Collectivité cible] dans ses ambitions 2026-2030.

Disponible sous 4 mois (mobilité), je serais honoré d'échanger.

Je vous prie d'agréer, Monsieur le Président, l'expression de ma respectueuse considération.`,
    tips: [
      "Le ton est plus formel que le privé — vouvoiement, formules",
      "Maîtrise du CGCT est attendue — référencez-la",
      "Gouvernance avec élus est centrale — mentionnez l'expérience",
      "Mobilité est un plus — le secteur public valorise la mobilité géographique",
    ],
    faq: [
      { question: "DGS vs DGA ?", answer: "DGS = Directeur Général des Services (n°1). DGA = adjoint (n°2). Le CV doit préciser le niveau." },
      { question: "Faut-il passer le concours ?", answer: "Pas obligatoire pour DGS/DGA (postes contractuels). Mais le concours ENA ou INET est valorisé." },
      { question: "Public vs parapublic ?", answer: "Public = collectivités, État. Parapublic = hôpitaux, social, consulaire. Le CV doit préciser." },
    ],
  },

  // ═══ PAR SITUATION (10) ═══
  {
    slug: "lettre-motivation-cadre-transition",
    title: "Lettre de motivation Cadre en Transition",
    category: "Situation",
    targetRole: "Tout poste executive",
    summary: "Lettre pour un cadre en transition (licenciement, démission, fin de mission). Ton positif, focus sur l'avenir.",
    structure: [
      { part: "En-tête", content: "Coordonnées + destinataire" },
      { part: "Objet", content: "Candidature au poste de [Poste]" },
      { part: "Accroche", content: "Expérience cumulée + recherche nouveau défi" },
      { part: "Corps 1", content: "Réalisation passée chiffrée" },
      { part: "Corps 2", content: "Pourquoi ce nouveau poste maintenant" },
      { part: "Corps 3", content: "Adéquation avec la cible" },
      { part: "Conclusion", content: "Disponibilité immédiate" },
    ],
    fullExample: `Monsieur le Directeur Général,

Cadre dirigeant avec 18 ans d'expérience en [Secteur], j'ai piloté [Réalisation majeure chiffrée]. Suite à la réorganisation de [Entreprise précédente], je suis disponible immédiatement pour relever un nouveau défi exécutif.

Mon expérience de [Compétence clé 1] et [Compétence clé 2] me semble particulièrement alignée avec les ambitions de [Entreprise cible], notamment [Projet stratégique]. Je souhaite apporter mon énergie à une organisation en croissance/transformation.

Disponible immédiatement, je serais honoré d'échanger.

Veuillez agréer, Monsieur le Directeur Général, mes salutations distinguées.`,
    tips: [
      "Ne justifiez pas la transition — pas d'excuses ni de détails",
      "Ton positif, focus sur l'avenir et l'apport",
      "Disponibilité immédiate est un atout — mentionnez-la",
      "Réseautage plus efficace que candidature froide en transition",
    ],
    faq: [
      { question: "Faut-il mentionner le licenciement ?", answer: "Non, jamais dans la lettre. Si demandé en entretien, restez factuel ('suite à réorganisation')." },
      { question: "Disponibilité immédiate = signal négatif ?", answer: "Non, c'est un atout pour les recruteurs en urgence. Mentionnez-le positivement." },
      { question: "Combien de temps pour trouver un poste exec ?", answer: "6-12 mois en moyenne. Réseautage + chasseurs de têtes + candidatures directes." },
    ],
  },
  {
    slug: "lettre-motivation-premier-poste-dg",
    title: "Lettre de motivation Premier Poste DG",
    category: "Situation",
    targetRole: "Directeur Général (premier poste)",
    summary: "Lettre pour un premier poste de DG. Montrez votre readiness, vos expériences de leadership transversal.",
    structure: [
      { part: "En-tête", content: "Coordonnées + destinataire (Président/Board)" },
      { part: "Objet", content: "Candidature au poste de Directeur Général" },
      { part: "Accroche", content: "Parcours + readiness DG" },
      { part: "Corps 1", content: "Expérience P&L et leadership transversal" },
      { part: "Corps 2", content: "Vision stratégique pour l'entreprise" },
      { part: "Corps 3", content: "Style de leadership et valeurs" },
      { part: "Conclusion", content: "Disponibilité + proposition d'échange" },
    ],
    fullExample: `Monsieur le Président,

Directeur [Poste actuel] depuis 5 ans chez [Entreprise], j'ai piloté un P&L de 85 M€ et dirigé 120 personnes (8 directs). Mon parcours en [Secteur] et mon expérience de transformation me positionnent pour relever le défi de Direction Générale de [Entreprise cible].

J'ai une vision claire pour [Entreprise cible] : [Vision en 1 phrase]. Mon style de leadership (collaboratif, data-driven) et mes valeurs (intégrité, long-term) me semblent alignés avec la culture de votre groupe.

Disponible sous 6 mois (préavis + non-compét), je serais honoré d'échanger avec le Board.

Veuillez agréer, Monsieur le Président, mes salutations respectueuses.`,
    tips: [
      "Mentionnez votre P&L actuel pour montrer la readiness",
      "Ayez une vision claire (1 phrase) pour l'entreprise cible",
      "Style de leadership et valeurs sont attendus — précisez-les",
      "Le Board recrute pour le fit culturel — montrez-le",
    ],
    faq: [
      { question: "Quel âge pour premier DG ?", answer: "40-50 ans en moyenne. Mais des DG plus jeunes existent (notamment en scale-up). Le CV doit montrer la maturité." },
      { question: "MBA obligatoire ?", answer: "Non mais valorisé (HEC, INSEAD, Harvard). Sinon, montrer un parcours d'expérience solide." },
      { question: "Comment trouver un premier poste DG ?", answer: "Réseautage + chasseurs de têtes (Spencer Stuart, Egon Zehnder) + capitalisme d'impact (LFPI, Raise). Les candidatures directes marchent moins." },
    ],
  },
  {
    slug: "lettre-motivation-cadre-reconversion",
    title: "Lettre de motivation Cadre en Reconversion",
    category: "Situation",
    targetRole: "Nouveau secteur/fonction",
    summary: "Lettre pour un cadre en reconversion sectorielle ou fonctionnelle. Montrez les transferts de compétences.",
    structure: [
      { part: "En-tête", content: "Coordonnées + destinataire" },
      { part: "Objet", content: "Candidature au poste de [Poste]" },
      { part: "Accroche", content: "Expérience passée + pourquoi la reconversion" },
      { part: "Corps 1", content: "Compétences transférables (chiffrées)" },
      { part: "Corps 2", content: "Pourquoi ce secteur/fonction maintenant" },
      { part: "Corps 3", content: "Investissement formation/réseau" },
      { part: "Conclusion", content: "Disponibilité" },
    ],
    fullExample: `Monsieur le Directeur Général,

Cadre dirigeant avec 15 ans d'expérience en [Secteur d'origine], j'ai piloté [Réalisation majeure chiffrée]. Suite à une réflexion personnelle, j'ai choisi de mettre mes compétences au service du [Secteur cible], qui correspond à mes valeurs et aspirations.

Mes compétences transférables (leadership, transformation, P&L management) me semblent particulièrement utiles pour [Défi de l'entreprise cible]. J'ai investi 6 mois pour me former ([Certifications/Formations]) et développer mon réseau dans le secteur.

Disponible sous 3 mois, je serais honoré d'échanger.

Veuillez agréer, Monsieur le Directeur Général, mes salutations distinguées.`,
    tips: [
      "Pas d'excuses — la reconversion est un choix, pas un échec",
      "Compétences transférables chiffrées sont cruciales",
      "Montrez l'investissement formation/réseau dans le nouveau secteur",
      "Ton positif, focus sur ce que vous apportez au nouveau secteur",
    ],
    faq: [
      { question: "La reconversion est-elle un frein ?", answer: "Moins qu'avant. Les recruteurs valorisent la diversité d'expérience. Mais montrez votre investment (formation, réseau)." },
      { question: "Faut-il reformer ?", answer: "Souvent utile (MBA, certifications sectorielles). Mentionnez vos investissements en ce sens." },
      { question: "Comment convaincre ?", answer: "Compétences transférables + investissement formation + réseau dans le secteur. Le triptyque marche." },
    ],
  },
  {
    slug: "lettre-motivation-expatrie-retour",
    title: "Lettre de motivation Cadre Expatrié Retour",
    category: "Situation",
    targetRole: "Poste France après expatriation",
    summary: "Lettre pour un cadre de retour d'expatriation. Mettez en avant l'expérience internationale comme atout.",
    structure: [
      { part: "En-tête", content: "Coordonnées + destinataire" },
      { part: "Objet", content: "Candidature au poste de [Poste]" },
      { part: "Accroche", content: "Expérience internationale (pays + années)" },
      { part: "Corps 1", content: "Réalisation locale chiffrée" },
      { part: "Corps 2", content: "Apport de l'expérience internationale" },
      { part: "Corps 3", content: "Réseau et connaissances locales" },
      { part: "Conclusion", content: "Disponibilité + visa/permis" },
    ],
    fullExample: `Monsieur le Directeur Général,

Cadre dirigeant avec 12 ans d'expérience internationale (Chine 4 ans, Singapour 3 ans, Brésil 2 ans), j'ai piloté [Réalisation majeure chiffrée]. De retour en France pour raisons familiales, je souhaite mettre mon expérience internationale au service de [Entreprise cible].

Mon expérience de marchés émergents (Asie, LATAM) et ma maîtrise de 4 langues (FR, EN, Mandarin, Espagnol) me semblent particulièrement utiles pour [Projet international de l'entreprise]. Mon réseau dans la région [X] est un atout opérationnel.

Disponible sous 3 mois (rapatriement), je serais honoré d'échanger.

Veuillez agréer, Monsieur le Directeur Général, mes salutations distinguées.`,
    tips: [
      "Ne vous excusez pas du retour — c'est un choix positif (familial, etc.)",
      "L'expérience internationale est un atout — valorisez-la",
      "Réseau local (pays d'expatriation) est un plus opérationnel",
      "Mentionnez les langues maîtrisées (avec niveau C1/C2)",
    ],
    faq: [
      { question: "Le retour est-il difficile ?", answer: "Oui, souvent. Le CV doit montrer que l'expérience internationale est un atout (pas une 'parenthèse')." },
      { question: "Comment valoriser l'expatriation ?", answer: "Impact business local chiffré, réseau, langues, marché maîtrisé. L'international est un différenciateur fort." },
      { question: "Faut-il accepter un downgrade ?", answer: "Pas nécessairement. Mais parfois un ajustement salaire (10-20%) est réaliste, surtout si pas de package expat." },
    ],
  },
  {
    slug: "lettre-motivation-internal-application",
    title: "Lettre de motivation Candidature Interne",
    category: "Situation",
    targetRole: "Promotion/mobilité interne",
    summary: "Lettre pour candidature interne (promotion, mobilité). Connaissiez l'entreprise, montrez votre fit.",
    structure: [
      { part: "En-tête", content: "Coordonnées + destinataire (N+2 ou DRH)" },
      { part: "Objet", content: "Candidature interne au poste de [Poste]" },
      { part: "Accroche", content: "Ancienneté + succès actuels" },
      { part: "Corps 1", content: "Réalisation récente chiffrée" },
      { part: "Corps 2", content: "Pourquoi ce nouveau poste" },
      { part: "Corps 3", content: "Plan 100 jours proposé" },
      { part: "Conclusion", content: "Disponibilité + transition" },
    ],
    fullExample: `Monsieur le Directeur Général,

Directeur [Poste actuel] chez [Entreprise] depuis 4 ans, j'ai piloté [Réalisation majeure chiffrée]. Je candidate au poste de [Poste cible] pour accompagner [Entreprise] dans sa nouvelle phase de croissance.

Mon expérience de la maison (connaissance des process, des équipes, du Board) et mes résultats récents (CA +28%, EBITDA +35%) me positionnent pour prendre la responsabilité de [Poste cible]. Mon plan 100 jours serait : [Plan en 3 points].

Disponible sous 3 mois (transition à assurer), je serais honoré d'échanger.

Veuillez agréer, Monsieur le Directeur Général, mes salutations distinguées.`,
    tips: [
      "Connaissance de la maison = atout différenciant",
      "Plan 100 jours est attendu — préparez-le",
      "Références internes (N+1, peers) à mobiliser",
      "Transition à assurer est un signal professionnel",
    ],
    faq: [
      { question: "Faut-il prévenir son N+1 ?", answer: "Oui, c'est la courtoisie. Sinon, le DRH le fera et ce sera mal perçu." },
      { question: "Avantage vs candidat externe ?", answer: "Connaissance maison, fit culturel, rapidité de prise de poste. Mais montrez un œil neuf (pas 'business as usual')." },
      { question: "Comment montrer qu'on ne reste pas dans sa zone de confort ?", answer: "Plan 100 jours avec ruptures assumées. Références à des transformations passées. Le Board veut un renouvellement, pas une continuité." },
    ],
  },
  {
    slug: "lettre-motivation-co-fondateur",
    title: "Lettre de motivation Co-fondateur / C-level Startup",
    category: "Situation",
    targetRole: "Co-fondateur / C-level startup",
    summary: "Lettre pour rejoindre une startup comme cofondateur ou C-level. Ton entrepreneurial, vision partagée.",
    structure: [
      { part: "En-tête", content: "Coordonnées + destinataire (Founder/CEO)" },
      { part: "Objet", content: "Rejoindre [Startup] comme [Poste]" },
      { part: "Accroche", content: "Pourquoi vous, pourquoi maintenant" },
      { part: "Corps 1", content: "Compétences clés pour le stage actuel" },
      { part: "Corps 2", content: "Vision partagée de l'entreprise" },
      { part: "Corps 3", content: "Engagement (equity, salary, time)" },
      { part: "Conclusion", content: "Disponibilité + rencontre" },
    ],
    fullExample: `Cher [Prénom du Founder],

Cadre dirigeant avec 15 ans d'expérience en [Secteur], j'ai suivi [Startup] depuis [Event/Date]. Votre vision [Description] résonne particulièrement avec mes valeurs et mon parcours.

Au-delà des compétences (P&L management, fund-raising, scale international), j'apporterais un réseau de [Type de réseau] et une énergie d'exécution. Mon ambition est de devenir co-fondateur opérationnel, avec un commitment full-time et un alignment equity significatif.

Disponible sous 2 mois, je serais ravi d'échanger en personne.

À très vite,
[Votre Prénom]`,
    tips: [
      "Le ton est direct (tutoiement si founder jeune)",
      "Vision partagée = crucial — montrez que vous avez étudié la startup",
      "Equity + salary expectations transparents",
      "Network effect = atout différenciant pour startups",
    ],
    faq: [
      { question: "Equity vs salaire ?", answer: "Variable selon stage. Pre-seed = equity lourd, salaire bas. Series A+ = salaire marché, equity modéré. Soyez transparent." },
      { question: "Comment convaincre un founder ?", answer: "Vision partagée + compétences complémentaires + network + energy. Le founder cherche un 'co-pilote', pas un exécutant." },
      { question: "Trial period ?", answer: "Souvent 3-6 mois en advisory avant cofondateur. Acceptez-le si la vision aligne." },
    ],
  },
  {
    slug: "lettre-motivation-spontannee",
    title: "Lettre de motivation Spontanée",
    category: "Situation",
    targetRole: "Tout poste executive",
    summary: "Lettre de candidature spontanée. Ton pro, proposition de valeur claire.",
    structure: [
      { part: "En-tête", content: "Coordonnées + destinataire (DG ou CEO)" },
      { part: "Objet", content: "Candidature spontanée - [Votre expertise]" },
      { part: "Accroche", content: "Pourquoi vous écrivez à CETTE entreprise" },
      { part: "Corps 1", content: "Vos compétences clés (chiffrées)" },
      { part: "Corps 2", content: "Comment vous pouvez aider l'entreprise" },
      { part: "Corps 3", content: "Pourquoi maintenant (timing)" },
      { part: "Conclusion", content: "Disponibilité + rencontre" },
    ],
    fullExample: `Monsieur le Directeur Général,

Suivant avec attention le développement de [Entreprise cible], notamment [Projet récent], je souhaite vous proposer ma candidature pour un poste de [Poste] au sein de votre direction [Direction].

Cadre dirigeant avec 18 ans d'expérience en [Secteur], j'ai piloté [Réalisation majeure chiffrée]. Mon expertise en [Compétence 1] et [Compétence 2] me semble particulièrement utile pour [Défi actuel de l'entreprise].

Le timing me semble opportun : [Raison du timing]. Je serais disponible sous 3 mois pour échanger sur les opportunités.

Veuillez agréer, Monsieur le Directeur Général, mes salutations distinguées.`,
    tips: [
      "Adressez-vous au DG/CEO directement, pas au DRH",
      "Montrez que vous connaissez l'entreprise (actualité récente)",
      "Proposition de valeur claire (ce que vous apportez)",
      "Timing est crucial — montrez pourquoi maintenant",
    ],
    faq: [
      { question: "Les candidatures spontanées marchent-elles ?", answer: "Moins que les candidatures sur offre, mais pour les postes exec, elles peuvent créer une opportunité. Visez le DG/CEO." },
      { question: "Relancer ?", answer: "Oui, après 2 semaines. Le DG est saturé — une relance polie montre votre motivation." },
      { question: "Format email ou papier ?", answer: "Email pour rapidité. Papier pour différenciation (rare en 2026). Les deux si possible." },
    ],
  },
  {
    slug: "lettre-motivation-board-member",
    title: "Lettre de motivation Administrateur / Board Member",
    category: "Situation",
    targetRole: "Membre du Conseil d'Administration",
    summary: "Lettre pour poste d'administrateur. Vision governance, indépendance, expertise sectorielle.",
    structure: [
      { part: "En-tête", content: "Coordonnées + destinataire (Président du Board ou Nominating Committee)" },
      { part: "Objet", content: "Candidature au Conseil d'Administration" },
      { part: "Accroche", content: "Pourquoi cette entreprise + votre expertise" },
      { part: "Corps 1", content: "Expérience de gouvernance (boards passés)" },
      { part: "Corps 2", content: "Expertise sectorielle et skills complémentaires" },
      { part: "Corps 3", content: "Indépendance et disponibilité" },
      { part: "Conclusion", content: "Disponibilité + rencontre" },
    ],
    fullExample: `Monsieur le Président,

Cadre dirigeant avec 20 ans d'expérience en [Secteur], j'ai été administrateur de [Nombre] conseils (dont [Companies notables]). Suivant avec attention [Entreprise cible], je souhaite proposer ma candidature à votre Conseil d'Administration.

Mon expertise en [Compétence clé 1] et [Compétence clé 2] me semble complémentaire du board actuel, notamment sur les sujets [Sujet 1] et [Sujet 2]. Mon indépendance (pas de conflit d'intérêt) et ma disponibilité (4 jours/mois) me permettent un commitment significatif.

Disponible pour échanger avec le Nominating Committee, je serais honoré de contribuer à la gouvernance de [Entreprise cible].

Veuillez agréer, Monsieur le Président, l'expression de ma considération distinguée.`,
    tips: [
      "Adressez-vous au Président du Board ou au Nominating Committee",
      "Indépendance est cruciale — précisez l'absence de conflit",
      "Disponibilité en jours/mois (4-6 jours/mois standard)",
      "Skills complémentaires du board actuel — étudiez la composition",
    ],
    faq: [
      { question: "Combien de boards en parallèle ?", answer: "2-3 maximum pour des execs en activité. 4-5 pour des retraités/senior advisors. Au-delà, c'est de la collection." },
      { question: "Rémunération board ?", answer: "Variable selon taille. 5-15k€/réunion en mid-cap. 20-50k€/réunion en SBF120. Stock options souvent." },
      { question: "Comment obtenir un premier board ?", answer: "Réseau + AFJE/AFAI + Women on Boards (si applicable). Les chasseurs spécialisés (Board Prospects, Korn Ferry) aussi." },
    ],
  },
  {
    slug: "lettre-motivation-consultant-independent",
    title: "Lettre de motivation Consultant Indépendant",
    category: "Situation",
    targetRole: "Mission de conseil / Senior Advisor",
    summary: "Lettre pour mission de conseil indépendant. Ton pro, proposition de mission claire.",
    structure: [
      { part: "En-tête", content: "Coordonnées + destinataire (DG ou DAF)" },
      { part: "Objet", content: "Proposition de mission conseil - [Sujet]" },
      { part: "Accroche", content: "Pourquoi vous + pourquoi cette mission" },
      { part: "Corps 1", content: "Compétences clés (chiffrées)" },
      { part: "Corps 2", content: "Proposition de mission (périme, livrables)" },
      { part: "Corps 3", content: "Modalités (TJM, durée)" },
      { part: "Conclusion", content: "Disponibilité + rencontre" },
    ],
    fullExample: `Monsieur le Directeur Général,

Consultant indépendant spécialisé en [Secteur] depuis [Nombre] ans, j'ai accompagné [Nombre] entreprises sur des missions de [Type de missions]. Je vous propose une mission de [Sujet] pour [Entreprise cible].

Mon expertise (P&L management, transformation, M&A) me semble particulièrement utile pour [Défi actuel]. Proposition de mission : 3 mois, livrables [Livrables], TJM [Montant].

Disponible sous 1 mois, je serais honoré d'échanger sur le périmètre exact.

Veuillez agréer, Monsieur le Directeur Général, mes salutations distinguées.`,
    tips: [
      "Proposition de mission concrète (périme, livrables, TJM)",
      "TJM (Taux Journalier Moyen) transparent — facilite la décision",
      "Références clients (anonymisées si NDA) à mentionner",
      "Disponibilité quick = atout pour les missions urgentes",
    ],
    faq: [
      { question: "TJM pour consultant senior ?", answer: "1 200-2 500€ en France selon expertise. Plus à l'international et pour les niches (PE, M&A)." },
      { question: "Portage salariat vs auto-entrepreneur ?", answer: "Portage pour les missions > 30k€. Auto-entrepreneur pour tester. SASU pour le long-terme." },
      { question: "Comment trouver des missions ?", answer: "Réseau (priorité), LinkedIn, plateformes (Malt, Upwork pour international), events sectoriels." },
    ],
  },
  {
    slug: "lettre-motivation-cadre-handicap",
    title: "Lettre de motivation Cadre en Situation de Handicap",
    category: "Situation",
    targetRole: "Tout poste executive",
    summary: "Lettre pour cadre en situation de handicap. Mentionnez la RQTH si pertinent, focus sur les compétences.",
    structure: [
      { part: "En-tête", content: "Coordonnées + destinataire" },
      { part: "Objet", content: "Candidature au poste de [Poste]" },
      { part: "Accroche", content: "Expérience + compétences clés" },
      { part: "Corps 1", content: "Réalisation majeure chiffrée" },
      { part: "Corps 2", content: "Adéquation avec le poste" },
      { part: "Corps 3", content: "Aménagements éventuels (positifs)" },
      { part: "Conclusion", content: "Disponibilité + entretien" },
    ],
    fullExample: `Monsieur le Directeur Général,

Cadre dirigeant avec 15 ans d'expérience en [Secteur], j'ai piloté [Réalisation majeure chiffrée]. Ma candidature au poste de [Poste] s'appuie sur cette expertise et mon envie de contribuer à [Vision de l'entreprise].

Je suis en situation de handicap (RQTH) avec [Aménagement éventuel simple]. Cette situation n'a jamais impacté mes performances et m'a appris une résilience et une adaptabilité que je mets au service de l'entreprise.

Disponible sous 3 mois, je serais honoré d'échanger en entretien.

Veuillez agréer, Monsieur le Directeur Général, mes salutations distinguées.`,
    tips: [
      "Mentionnez la RQTH seulement si utile (aménagements)",
      "Ne vous définissez pas par le handicap — vous êtes un exec avec des compétences",
      "Ton positif, focus sur l'apport",
      "Les entreprises > 20 salariés ont une obligation d'emploi (6%)",
    ],
    faq: [
      { question: "Faut-il mentionner le handicap ?", answer: "Pas obligatoirement dans la lettre. En entretien si aménagements nécessaires. Sinon, à l'embauche (pour bénéficier des aides)." },
      { question: "Le handicap est-il un frein ?", answer: "Moins qu'avant. Les entreprises ont des obligations (OETH 6%). L'Agefiph soutient les aménagements." },
      { question: "Quels aménagements ?", answer: "Variable : horaires, télétravail, ergonomie, etc. L'essentiel est de les présenter comme simples à mettre en place." },
    ],
  },

  // ═══ PAR TON (8) ═══
  {
    slug: "lettre-motivation-board-ready",
    title: "Lettre de motivation Board-Ready",
    category: "Ton",
    targetRole: "Poste DG/C-level adressé au Board",
    summary: "Lettre adressée au Conseil d'Administration. Ton sobre, focus valeur actionnariale, gouvernance.",
    structure: [
      { part: "En-tête", content: "Coordonnées + destinataire (Président du Conseil)" },
      { part: "Objet", content: "Candidature au poste de [DG/CEO/CFO]" },
      { part: "Accroche", content: "Pourquoi vous écrivez au Conseil" },
      { part: "Corps 1", content: "Réalisation majeure chiffrée (valeur actionnariale)" },
      { part: "Corps 2", content: "Vision stratégique pour l'entreprise" },
      { part: "Corps 3", content: "Gouvernance et reporting Board" },
      { part: "Conclusion", content: "Disponibilité + rencontre avec le Conseil" },
    ],
    fullExample: `Monsieur le Président du Conseil d'Administration,

Cadre dirigeant avec 20 ans d'expérience, j'ai piloté chez [Entreprise précédente] une création de valeur de 280 M€ sur 5 ans (multiple x3.2 pour les actionnaires). Je candidate au poste de [DG/CEO] de [Entreprise cible] pour accompagner la prochaine phase de croissance.

Ma vision pour [Entreprise cible] : [Vision stratégique en 1 phrase]. Mon expérience de gouvernance (membre du Comex, reporting Board trimestriel) et ma capacité à aligner exécutif et actionnariat me semblent alignées avec les attentes du Conseil.

Disponible sous 6 mois (préavis + garden leave), je serais honoré d'échanger avec le Nominating Committee.

Veuillez agréer, Monsieur le Président, l'expression de ma respectueuse considération.`,
    tips: [
      "Adressez-vous au Président du Conseil, pas au DRH",
      "Création de valeur actionnariale = KPI clé (multiple, IRR)",
      "Vision stratégique en 1 phrase est cruciale",
      "Garden leave est attendu pour les postes board-ready",
    ],
    faq: [
      { question: "Le Board recrute-t-il directement ?", answer: "Souvent via le Nominating Committee, parfois via chasseurs (Spencer Stuart, Egon Zehnder). Le candidat peut aussi proposer directement." },
      { question: "Qu'attend le Board d'un DG ?", answer: "Vision stratégique, capacité d'exécution, leadership d'équipe, relations actionnaires, intégrité. Le CV doit montrer les 5." },
      { question: "Le Board readineess se mesure comment ?", answer: "Expérience P&L > 100 M€, gouvernance Comex/Board, M&A exécutés, transformations réussies. Les chasseurs évaluent ces critères." },
    ],
  },
  {
    slug: "lettre-motivation-peer-to-peer",
    title: "Lettre de motivation Peer-to-Peer (CEO à CEO)",
    category: "Ton",
    targetRole: "Poste exec adressé au CEO/DG pair",
    summary: "Lettre directe CEO à CEO. Ton collaboratif, focus exécution, livraison, équipes.",
    structure: [
      { part: "En-tête", content: "Coordonnées + destinataire (CEO/DG)" },
      { part: "Objet", content: "Candidature au poste de [Poste]" },
      { part: "Accroche", content: "Pourquoi vous écrivez à ce CEO" },
      { part: "Corps 1", content: "Compétences clés (opérationnelles)" },
      { part: "Corps 2", content: "Collaboration possible (le 'nous')" },
      { part: "Corps 3", content: "Complémentarité avec le CEO" },
      { part: "Conclusion", content: "Disponibilité + rencontre" },
    ],
    fullExample: `Cher [Prénom du CEO],

En tant que dirigeants partageant la même ambition de [Vision commune], je suis convaincu que notre collaboration porterait [Entreprise cible] à un niveau supérieur. Mon expérience en tant que [Poste précédent] chez [Entreprise], notamment [Réalisation chiffrée], me semble complémentaire de vos priorités actuelles.

J'ai toujours admiré votre [Trait admire]. En tant que [Poste cible], je serais ton partenaire opérationnel sur [Domaine], avec une capacité d'exécution éprouvée. Ensemble, nous pouvons [Objectif commun].

Disponible sous 3 mois, je serais ravi de partager un café et d'approfondir.

À très vite,
[Votre Prénom]`,
    tips: [
      "Tutoiement si le CEO est accessible (startups, scale-ups)",
      "Le 'nous' est central — collaboration, pas subordination",
      "Complémentarité avec le CEO est le message clé",
      "Ton direct, pas de formules guindées",
    ],
    faq: [
      { question: "Quand tutoyer ?", answer: "Startups/scale-ups (CEO < 45 ans souvent). Groupes franco-français (AFJE, réseaux). À éviter en grands groupes traditionnels." },
      { question: "Comment trouver le prénom du CEO ?", answer: "LinkedIn, site corporate, articles presse. Si vous ne trouvez pas, 'Cher CEO' ou 'Madame/Monsieur le Directeur Général'." },
      { question: "Le peer-to-peer marche-t-il en France ?", answer: "Moins qu'aux US, mais de plus en plus. Surtout en tech et scale-up. En grands groupes, rester formel." },
    ],
  },
  {
    slug: "lettre-motivation-founder-style",
    title: "Lettre de motivation Founder-Style",
    category: "Ton",
    targetRole: "C-level startup adressée au Founder",
    summary: "Lettre entrepreneuriale au founder. Ton vision, agilité, mise en main.",
    structure: [
      { part: "En-tête", content: "Coordonnées + destinataire (Founder/CEO)" },
      { part: "Objet", content: "Rejoindre [Startup] comme [Poste]" },
      { part: "Accroche", content: "Pourquoi cette startup + ce founder" },
      { part: "Corps 1", content: "Vision partagée (alignement)" },
      { part: "Corps 2", content: "Mise en main (10 jours)" },
      { part: "Corps 3", content: "Commitment (equity, time)" },
      { part: "Conclusion", content: "Disponibilité + call/visio" },
    ],
    fullExample: `Cher [Prénom du Founder],

Votre vision de [Description vision] a toujours été ma source d'inspiration. Mon parcours, marqué par [Réalisation chiffrée alignée], est au service de cette même ambition disruptive.

Rejoindre [Startup] comme [Poste], c'est pour moi l'opportunité de [Objectif personnel aligné]. En 10 jours, je serais opérationnel : [Plan en 3 points]. Mon commitment est total (full-time, equity significatif, salary modéré la 1ère année).

Disponible sous 2 mois, je serais ravi d'échanger sur un appel de 30 min.

À très vite,
[Votre Prénom]`,
    tips: [
      "Le founder cherche un 'co-pilote', pas un exécutant",
      "Vision partagée = crucial — montrez votre alignement",
      "Plan 10 jours = signal d'agilité entrepreneuriale",
      "Equity + salary transparent dès la lettre",
    ],
    faq: [
      { question: "Le founder-style marche-t-il en France ?", answer: "Oui en scale-up/startup. À éviter en grand groupe. Le ton est direct, parfois tutoiement." },
      { question: "Equity à mentionner ?", answer: "Pas le montant exact. 'Equity significatif' ou 'alignment equity attendu' suffit. Le détail vient en discussion." },
      { question: "Le founder répond-il ?", answer: "Souvent oui si la lettre est courte, alignée, et montre votre investment (étude de la startup)." },
    ],
  },
  {
    slug: "lettre-motivation-cold-outreach",
    title: "Lettre de motivation Cold Outreach (LinkedIn)",
    category: "Ton",
    targetRole: "Tout poste executive",
    summary: "Message LinkedIn pour candidature directe. Court, percutant, call-to-action clair.",
    structure: [
      { part: "Subject", content: "[Prénom] - [Sujet en 5 mots]" },
      { part: "Accroche", content: "Pourquoi vous écrivez (en 1 ligne)" },
      { part: "Corps 1", content: "Compétence clé (en 1 ligne)" },
      { part: "Corps 2", content: "Pourquoi l'entreprise (en 1 ligne)" },
      { part: "Call-to-action", content: "Call de 15 min cette semaine ?" },
    ],
    fullExample: `Bonjour [Prénom],

Cadre dirigeant (15 ans en [Secteur]), j'ai vu votre post sur [Sujet]. Votre ambition de [Vision] résonne avec mon expérience en [Compétence clé].

J'aimerais échanger sur d'éventuelles opportunités chez [Entreprise], notamment sur [Sujet]. 15 min cette semaine ?

Mon profil LinkedIn pour contexte : [Lien]

Cordialement,
[Votre Prénom]`,
    tips: [
      "Max 100 mots — les LinkedIn messages longs ne sont pas lus",
      "Référence à un post/actualité récente du destinataire",
      "Call-to-action clair (15 min call)",
      "Suivre avant de contacter augmente le taux de réponse",
    ],
    faq: [
      { question: "Le cold outreach LinkedIn marche-t-il ?", answer: "Oui pour les execs, surtout vers les CEOs/Founders. Taux de réponse 15-25% si bien ciblé." },
      { question: "Quand envoyer ?", answer: "Mardi-jeudi, 9h-11h ou 17h-19h. Éviter lundi matin et vendredi soir." },
      { question: "Relancer ?", answer: "Oui, après 7 jours, max 2 relances. Au-delà, abandonner." },
    ],
  },
  {
    slug: "lettre-motivation-email-court",
    title: "Lettre de motivation Email Court",
    category: "Ton",
    targetRole: "Tout poste executive",
    summary: "Email de motivation court (200-300 mots). Pour candidature directe par email.",
    structure: [
      { part: "Subject", content: "Candidature [Poste] - [Votre Nom]" },
      { part: "Salutation", content: "Madame/Monsieur le Directeur Général," },
      { part: "Accroche", content: "Pourquoi vous + pourquoi ce poste" },
      { part: "Corps 1", content: "Compétences clés (chiffrées)" },
      { part: "Corps 2", content: "Adéquation avec l'entreprise" },
      { part: "Conclusion", content: "Disponibilité + pièce jointe (CV)" },
    ],
    fullExample: `Objet : Candidature [Poste] - [Votre Nom]

Madame la Directrice Générale,

Cadre dirigeant avec 18 ans d'expérience en [Secteur], j'ai piloté [Réalisation majeure chiffrée]. Votre actualité récente sur [Sujet] m'incite à vous proposer ma candidature pour le poste de [Poste].

Mon expertise en [Compétence 1] et [Compétence 2] me semble particulièrement utile pour [Défi actuel de l'entreprise]. Mon CV en pièce jointe détaille mon parcours et mes réalisations.

Disponible sous 3 mois, je serais honoré d'un échange.

Veuillez agréer, Madame la Directrice Générale, mes salutations distinguées.

[Votre Nom]
[Téléphone]
[Email]
[LinkedIn]`,
    tips: [
      "Max 300 mots — les emails longs ne sont pas lus",
      "Objet clair (poste + nom) — pas d'objet mystère",
      "Pièce jointe CV en PDF (pas Word)",
      "Signature complète (nom, tel, LinkedIn)",
    ],
    faq: [
      { question: "Email ou formulaire ?", answer: "Email si possible (plus direct). Formulaire si imposé par l'entreprise. Les 2 si possible." },
      { question: "Objet ?", answer: "Clair et direct : 'Candidature [Poste] - [Nom]'. Pas de créatif, les DG/CEO trient par pertinence." },
      { question: "Pièce jointe ou lien ?", answer: "PDF en pièce jointe (accessibilité). Lien LinkedIn en signature. Les 2 augmentent les chances." },
    ],
  },
  {
    slug: "lettre-motivation-formelle",
    title: "Lettre de motivation Formelle (Grands Groupes)",
    category: "Ton",
    targetRole: "Poste exec en grand groupe traditionnel",
    summary: "Lettre formelle pour grands groupes (CAC40, ETI traditionnelle). Ton sobre, formules classiques.",
    structure: [
      { part: "En-tête", content: "Vos coordonnées (haut) + coordonnées destinataire" },
      { part: "Lieu + date", content: "Paris, le [Date]" },
      { part: "Objet", content: "Objet : Candidature au poste de [Poste]" },
      { part: "Formule d'appel", content: "Monsieur le Directeur Général," },
      { part: "Corps 1", content: "Expérience et réalisation majeure" },
      { part: "Corps 2", content: "Adéquation avec le groupe" },
      { part: "Corps 3", content: "Disponibilité" },
      { part: "Formule de politesse", content: "Je vous prie d'agréer..." },
    ],
    fullExample: `Paris, le 15 janvier 2026

Monsieur le Directeur Général,
[Entreprise cible]
[Adresse]

Objet : Candidature au poste de Directeur [Poste]

Monsieur le Directeur Général,

Cadre dirigeant avec 20 ans d'expérience dans le secteur [Secteur], j'ai piloté chez [Entreprise précédente] un P&L de 180 M€ et dirigé 250 personnes. Mon expérience de la transformation et du M&A (3 acquisitions, 95 M€) me semble alignée avec les ambitions de [Entreprise cible], notamment votre plan stratégique 2026-2029.

Membre du Comex et du Conseil d'Administration de [Entreprise précédente], j'ai contribué à la définition de la stratégie groupe et au reporting Board trimestriel. Mon parcours en [Secteur] et mon réseau institutionnel me positionnent pour relever les défis de votre direction.

Disponible sous 4 mois (préavis + non-compét), je serais honoré de vous rencontrer.

Je vous prie d'agréer, Monsieur le Directeur Général, l'expression de ma respectueuse considération.

[Votre Nom]
[Votre Signature]`,
    tips: [
      "Format papier (lettre officielle) encore valorisé en grands groupes",
      "Formules complètes (appel + politesse)",
      "Adresse et date en haut",
      "Ton sobre, pas de tutoiement",
    ],
    faq: [
      { question: "La lettre papier est-elle encore d'actualité ?", answer: "Oui en grands groupes traditionnels (CAC40, ETI familiale). Email pour les startups/scale-ups." },
      { question: "Faut-il signer manuscritement ?", answer: "Idéalement oui pour la version papier. Pour la version PDF, signature électronique suffit." },
      { question: "Quelle longueur ?", answer: "1 page maximum. Au-delà, les recruteurs ne lisent pas." },
    ],
  },
  {
    slug: "lettre-motivation-moderne",
    title: "Lettre de motivation Moderne (Scale-up)",
    category: "Ton",
    targetRole: "Poste exec en scale-up/tech",
    summary: "Lettre moderne pour scale-up/tech. Ton direct, impact, culture fit.",
    structure: [
      { part: "Subject", content: "Rejoindre [Startup] comme [Poste]" },
      { part: "Accroche", content: "Pourquoi cette startup maintenant" },
      { part: "Corps 1", content: "Impact mesurable (chiffré)" },
      { part: "Corps 2", content: "Culture fit + valeurs" },
      { part: "Corps 3", content: "Plan 30/60/90 jours" },
      { part: "Conclusion", content: "Disponibilité + call" },
    ],
    fullExample: `Hey [Prénom du Founder/CEO],

J'ai vu votre annonce Series B chez [Startup]. Votre mission de [Description mission] résonne particulièrement. 15 ans en [Secteur] dont 5 en scale-up m'ont appris à [Compétence clé].

Chez [Startup précédente], j'ai triplé l'ARR (8 → 25 M€) en 18 mois et construit l'équipe (45 personnes). Mon plan 30/60/90 pour [Startup] serait : [Plan en 3 points].

Culture fit : [Valeur] et [Valeur] sont mes valeurs cardinal. Disponible sous 2 mois, equity + salary alignés sur le marché.

On s'appelle cette semaine ?

[Votre Prénom]`,
    tips: [
      "Ton direct (parfois tutoiement selon startup)",
      "Plan 30/60/90 = signal d'ownership",
      "Culture fit et valeurs = central en scale-up",
      "Disponibilité + compensation transparentes",
    ],
    faq: [
      { question: "Tutoiement ?", answer: "Si la startup culture le permet (LinkedIn/website). En cas de doute, vous vouvoiement." },
      { question: "Equity à mentionner ?", answer: "Pas le montant. 'Equity aligné marché' suffit. Le détail vient en discussion." },
      { question: "Quand relancer ?", answer: "5-7 jours. Max 2 relances. Les founders sont saturés." },
    ],
  },
  {
    slug: "lettre-motivation-courte-percutante",
    title: "Lettre de motivation Courte et Percutante",
    category: "Ton",
    targetRole: "Tout poste executive",
    summary: "Lettre ultra-courte (100-150 mots). Pour capter l'attention immédiatement.",
    structure: [
      { part: "Subject", content: "Candidature [Poste]" },
      { part: "Accroche", content: "Phrase choc en 15 mots" },
      { part: "Corps", content: "3 lignes max : compétences + réalisation + adéquation" },
      { part: "CTA", content: "Call cette semaine ?" },
    ],
    fullExample: `Bonjour [Prénom],

J'ai triplé l'ARR d'une scale-up SaaS en 18 mois (8 → 25 M€). Votre ambition chez [Entreprise cible] m'incite à postuler au poste de [Poste].

15 ans en [Secteur], 45 personnes managées, 2 levées de fonds (45 M€). Dispo sous 2 mois.

15 min cette semaine pour creuser ?

[Votre Prénom]
[LinkedIn]`,
    tips: [
      "Max 100 mots — la brièveté est un signal d'exec",
      "Une phrase choc au début (chiffrée)",
      "3 lignes de compétences/impact suffisent",
      "CTA ultra-clair : call 15 min",
    ],
    faq: [
      { question: "La lettre courte marche-t-elle ?", answer: "Oui pour les execs, surtout en tech/scale-up. Les DG/CEO apprécient la concision." },
      { question: "Et si la lettre longue est demandée ?", answer: "Adaptez-vous. Mais 95% des entreprises n'imposent pas de longueur. Visez 100-200 mots." },
      { question: "Email ou LinkedIn ?", answer: "LinkedIn si pas d'email. Email si possible. Les 2 si vous voulez maximiser." },
    ],
  },
];

// ─── Helpers ────────────────────────────────────────────────
export function getCoverLetterBySlug(slug: string): CoverLetterExample | undefined {
  return COVER_LETTER_EXAMPLES.find((l) => l.slug === slug);
}

export function getAllCoverLetterSlugs(): string[] {
  return COVER_LETTER_EXAMPLES.map((l) => l.slug);
}

export const COVER_LETTER_CATEGORIES: Array<{ id: CoverLetterExample["category"]; label: string; description: string }> = [
  { id: "Secteur", label: "Par secteur", description: "Banque, assurance, industrie, tech, pharma, retail, énergie, etc." },
  { id: "Situation", label: "Par situation", description: "Transition, premier DG, reconversion, retour expat, etc." },
  { id: "Ton", label: "Par ton", description: "Board-ready, peer-to-peer, founder, formelle, moderne, etc." },
];
