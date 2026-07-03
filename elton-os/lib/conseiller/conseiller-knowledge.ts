// ─── PRSTO Knowledge Base — for the Career Coach AI ───

export const APP_NAME = "PRSTO";
export const APP_VERSION = "v2.0";

export interface AppFeature {
  id: string;
  name: string;
  route: string;
  description: string;
  tips: string[];
  related: string[];
}

export interface AppRoute {
  path: string;
  label: string;
  section: string;
  description: string;
}

export const APP_ROUTES: AppRoute[] = [
  { path: "/", label: "Boardroom Dashboard", section: "AI Copilot", description: "Vue d'ensemble avec tableau de bord 3 colonnes." },
  { path: "/analyse", label: "AI Briefing", section: "AI Copilot", description: "Briefing IA quotidien." },
  { path: "/opportunites", label: "Signal Feed", section: "AI Copilot", description: "Flux d'opportunités importées." },
  { path: "/market-radar", label: "Market Watch", section: "AI Copilot", description: "Veille marché." },
  { path: "/entretiens", label: "Interview Studio", section: "Intelligence & Tools", description: "Préparation entretiens 24 sections." },
  { path: "/documents", label: "Documents AI", section: "Intelligence & Tools", description: "Génération CV, lettres, emails." },
  { path: "/performance", label: "Decision Support", section: "Intelligence & Tools", description: "Analytiques performance." },
  { path: "/dashboard/jobs/crm", label: "Recruiter Intel", section: "Intelligence & Tools", description: "CRM recruteur." },
  { path: "/dashboard/jobs/importer/smart-scraper", label: "Web Scraper AI", section: "Intelligence & Tools", description: "Import d'offres." },
  { path: "/conseiller", label: "Conseiller Carriére", section: "Intelligence & Tools", description: "Assistant IA coaching." },
  { path: "/demarrage", label: "Démarrage guidé", section: "Classic Modules", description: "Assistant pas à pas." },
  { path: "/profil", label: "Profil Exécutif", section: "Classic Modules", description: "Profil complet." },
  { path: "/cv-maitre", label: "CV Maître", section: "Classic Modules", description: "CV source unique." },
  { path: "/proof-vault", label: "Proof Vault", section: "Classic Modules", description: "Banque de preuves." },
  { path: "/sources", label: "Sources", section: "Classic Modules", description: "Gestion des sources." },
  { path: "/dashboard/jobs/pipeline", label: "Pipeline", section: "Classic Modules", description: "Kanban candidatures." },
  { path: "/parametres", label: "Paramètres", section: "System", description: "Configuration application." },
  { path: "/guide", label: "Guide complet", section: "System", description: "Documentation complète." },
];

const APP_DESCRIPTION = `PRSTO est un **Boardroom AI Copilot** conçu pour les cadres dirigeants en recherche d'emploi (Directeur Commercial, Country Manager, VP Sales, Directeur Général).

L'application couvre tout le cycle de recherche : sourcing d'offres, scoring intelligent, génération de CV et lettres personnalisés, préparation d'entretiens (24 sections, 6 pitchs), suivi pipeline, CRM recruteur, et pilotage par indicateurs.

Toutes les données sont stockées localement (SQLite) et l'IA peut utiliser DeepSeek ou OpenRouter via une clé API configurable.`;

// ── Local answer engine ──────────────────────────────────
// Answers common questions without calling the AI API.

interface AnswerEntry {
  keywords: string[];
  priority: number;
  getAnswer: () => string;
}

const ANSWER_ENGINE: AnswerEntry[] = [
  {
    keywords: ["a quoi sert", "c'est quoi", "qu'est-ce que", "définition", "presente", "présente", "explique"],
    priority: 10,
    getAnswer: () => `**PRSTO — Boardroom AI Copilot**

${APP_DESCRIPTION}

**Les 4 grandes catégories d'outils :**

**1. AI Copilot** — Tableau de bord, briefing IA quotidien, flux d'opportunités, veille marché
**2. Intelligence & Tools** — Interview Studio (24 sections), Documents AI (CV, lettres), Web Scraper, CRM recruteur, Conseiller Carrière
**3. Modules classiques** — Profil, CV Maître, Proof Vault, Sources, Pipeline
**4. Système** — Paramètres IA, Guide complet

**Par où commencer ?**
1. Complétez votre **Profil** → sidebar > Profil
2. Créez votre **CV Maître** → sidebar > CV Maître
3. Ajoutez vos réalisations dans **Proof Vault** → sidebar > Proof Vault
4. Importez des offres → **Web Scraper AI** dans Intelligence & Tools`,
  },
  {
    keywords: ["profil", "executif", "exécutif", "cv maître", "cv-maitre", "competences", "compétences"],
    priority: 5,
    getAnswer: () => `**Profil Exécutif & CV Maître**

Le **Profil Exécutif** (sidebar > Profil) est la base de tout. Remplissez :
- Titre, secteurs, fonctions cibles
- Compétences, langues, formations
- Mobilité, prétentions salariales

Le **CV Maître** (sidebar > CV Maître) est votre CV source unique. Tous les CV personnalisés générés par Documents AI s'appuient dessus.

**Conseils :**
- Plus votre profil est complet, meilleurs sont les scores de matching et les documents générés
- Ajoutez des réalisations chiffrées dans Proof Vault
- Tenez le CV Maître toujours à jour`,
  },
  {
    keywords: ["entretien", "interview", "pitch", "studio", "préparation"],
    priority: 5,
    getAnswer: () => `**Interview Studio** (sidebar > Entretiens)

Générez une préparation complète depuis une opportunité du pipeline. Vous obtenez **24 sections** :

**Les 6 pitchs** (Pitch Studio) :
- 30 secondes (version éclair)
- 2 minutes (version complète)
- Pitch DC (Directeur Commercial)
- Pitch CM (Country Manager)
- Pitch DNV (Directeur National Ventes)
- Pitch DG (Directeur Général)

**Autres sections :** Contexte entreprise, Motivation, Questions probables (RH/manager/DG), Réponses STAR, Objections, Questions à poser, Négociation, Stratégie, Checklist

Chaque section a sa propre couleur et icône. Marquez la préparation comme "Prête" après révision.`,
  },
  {
    keywords: ["document", "cv", "lettre", "motivation", "email", "linkedin"],
    priority: 5,
    getAnswer: () => `**Documents AI** (sidebar > Documents)

Générez des documents personnalisés pour chaque offre :
- **CV** — adapté à l'offre ciblée, basé sur le CV Maître
- **Lettre de motivation** — français ou anglais
- **Email de relance** — après candidature
- **Message LinkedIn / InMail**
- 10 styles d'écriture (Humain, Corporate, Premium, Direct, etc.)

**Conseil :** Personnalisez chaque document pour l'offre. Utilisez le Proof Vault pour enrichir vos réalisations.`,
  },
  {
    keywords: ["import", "offre", "source", "scraper", "extension"],
    priority: 5,
    getAnswer: () => `**Importer des offres**

3 méthodes :

1. **Web Scraper AI** → Intelligence & Tools > Web Scraper AI
   Collez l'URL d'une offre Welcome to the Jungle, LinkedIn ou Indeed

2. **Extension Chrome** → Intelligence & Tools > Extension Chrome
   Installez l'extension depuis le dossier browser-extension

3. **Sources automatiques** → sidebar > Sources
   Configurez Firecrawl ou des flux RSS

Les offres importées apparaissent dans Signal Feed (sidebar > Signal Feed) et peuvent être scorées automatiquement.`,
  },
  {
    keywords: ["pipeline", "candidature", "suivi", "relance", "kanban"],
    priority: 5,
    getAnswer: () => `**Pipeline** (sidebar > Pipeline)

Kanban de suivi avec 7 colonnes :
1. À postuler
2. Candidature envoyée
3. Relancé
4. Entretien
5. Négociation
6. Signé
7. Archivé

Déplacez les offres par glisser-déposer. Chaque étape déclenche des actions recommandées.

**CRM Recruteur** (Intelligence & Tools > Recruiter Intel) :
Gérez vos contacts recruteurs, interactions et historique des échanges.`,
  },
  {
    keywords: ["score", "analyse", "matching", "briefing", "dashboard"],
    priority: 5,
    getAnswer: () => `**Scoring & Analyse d'offres**

Chaque offre importée peut être **scorée** automatiquement : le score mesure le matching entre votre profil et l'offre (compétences, secteurs, expérience).

**Boardroom Dashboard** (accueil) :
- AI Briefing — briefing quotidien généré par IA
- Signal Feed — opportunités récentes
- Market Watch — veille marché
- Decision Support — métriques de performance

**AI Briefing** (sidebar > AI Briefing) : briefing quotidien personnalisé avec les données réelles de votre recherche.`,
  },
  {
    keywords: ["différence", "différence", "vs", "versus", "comparaison", "comparé", "autre outil", "jobcopilot", "jobalternative"],
    priority: 10,
    getAnswer: () => `**PRSTO est un Boardroom AI Copilot spécialisé pour cadres dirigeants.**

Je suis conçu pour répondre UNIQUEMENT sur PRSTO et ne peux pas comparer avec d'autres outils. Voici ce que PRSTO offre spécifiquement :

**Public ciblé :** Directeurs Commercialux, Country Managers, VP Sales, Directeurs Généraux — cadres dirigeants en recherche d'emploi en France/Europe.

**Fonctionnalités clés :**
- Scoring intelligent des offres (matching profil/offre)
- 24 sections de préparation d'entretien dont 6 pitchs par rôle
- CV Maître + Documents AI (CV, lettres, emails, LinkedIn)
- Proof Vault (banque de preuves)
- Pipeline kanban + CRM recruteur
- Web Scraper AI + Extension Chrome
- Boardroom Dashboard avec AI Briefing quotidien
- Data en local (SQLite) — vos données ne quittent pas votre machine

Si vous voulez des précisions sur une fonctionnalité spécifique d'PRSTO, demandez-moi !`,
  },
  {
    keywords: ["commencer", "démarrage", "debuter", "débuter", "premiers pas", "guide"],
    priority: 5,
    getAnswer: () => `**Par où commencer sur PRSTO ?**

**Étape 1 — Fondations**
- Remplissez votre **Profil Exécutif** (sidebar > Profil)
- Créez votre **CV Maître** (sidebar > CV Maître)
- Ajoutez des réalisations dans **Proof Vault** (sidebar > Proof Vault)

**Étape 2 — Sourcing**
- Importez des offres via **Web Scraper AI**
- Scoriez-les pour voir le matching

**Étape 3 — Candidature**
- Générez CV et lettre personnalisés dans **Documents AI**
- Postulez et suivez dans le **Pipeline**

**Étape 4 — Entretiens**
- Préparez-vous avec **l'Interview Studio** (24 sections)

**Ressources :**
- **Guide complet** (sidebar > Guide complet)
- **Démarrage guidé** (sidebar > Démarrage guidé)`,
  },
  {
    keywords: ["parametre", "paramètres", "configuration", "api", "deepseek", "openrouter", "clé", "key"],
    priority: 5,
    getAnswer: () => `**Paramètres** (sidebar > Paramètres)

Configurez :
- **AI Provider** — DeepSeek ou OpenRouter avec votre clé API
- Timeout, température, modèle par défaut
- Préférences utilisateur
- Ux Mode (style d'interface)

L'IA est utilisée par : AI Briefing, Documents AI, Scoring, Conseiller Carrière, Interview Studio.

Si aucune clé API n'est configurée, l'application fonctionne en mode local avec des fonctionnalités réduites.`,
  },
  {
    keywords: ["proof", "vault", "preuve", "réalisation", "chiffre"],
    priority: 5,
    getAnswer: () => `**Proof Vault** (sidebar > Proof Vault)

Banque de preuves pour stocker vos réalisations professionnelles :
- Résultats chiffrés ("+30% CA", "Équipe de 15 personnes")
- Certifications, diplômes
- Projets clés

Les preuves sont utilisées automatiquement dans :
- Les CV générés par Documents AI
- Les lettres de motivation
- Les 6 pitchs de l'Interview Studio
- Les réponses STAR

**Conseil :** Plus la Proof Vault est riche, meilleurs sont les contenus générés.`,
  },
  {
    keywords: ["conseil", "astuce", "tip", "bonne pratique", "optimiser"],
    priority: 3,
    getAnswer: () => `**Conseils pour optimiser votre utilisation d'PRSTO**

1. **Tenez votre Profil à jour** — c'est la base de tous les scores et documents
2. **Alimentez régulièrement la Proof Vault** — des réalisations chiffrées = des documents percutants
3. **Scoriez chaque offre** — concentrez-vous sur celles avec le meilleur matching
4. **Utilisez les 6 pitchs** — adaptez votre discours selon votre interlocuteur (DC, CM, DNV, DG)
5. **Suivez tout dans le Pipeline** — ne laissez aucune candidature sans suivi
6. **Consultez le Dashboard chaque matin** — le AI Briefing vous donne le la journée
7. **Personnalisez chaque document** — ne postulez jamais avec un CV générique`,
  },
  {
    keywords: ["bonjour", "salut", "hey", "hello", "coucou"],
    priority: 1,
    getAnswer: () => `Bonjour ! 👋 Je suis votre **Conseiller Carrière PRSTO**.

Je suis là pour vous aider à utiliser l'application, vous guider dans votre recherche d'emploi et vous donner des conseils personnalisés.

**Vous pouvez me demander :**
- "À quoi sert PRSTO ?"
- "Par où commencer ?"
- "Comment préparer un entretien ?"
- "Comment importer une offre ?"
- "Conseils pour mon profil"

Ou posez-moi directement votre question !`,
  },
];

export function getLocalAnswer(question: string): string | null {
  const q = question.toLowerCase().trim();

  // ── Gate 1 : si la question est longue ou contient des chiffres/contexte spécifique,
  // on laisse l'IA traiter. La base locale ne doit répondre qu'aux questions VRAIMENT
  // génériques (aides, définitions, démarrage) — pas aux questions de dirigeant
  // spécifiques qui méritent une réponse contextualisée par le second brain IA.
  //
  // Signaux d'une question "spécifique" qui doit aller à l'IA :
  //   - plus de 8 mots OU
  //   - contient des chiffres (350k€, 5 ans, Series B, etc.) OU
  //   - contient un secteur/fonction précis (CEO, DG, scale-up, private equity, etc.) OU
  //   - contient des mots-outils de questionnement approfondi (comment, pourquoi, stratégie, etc.)
  // ──────────────────────────────────────────────────────────────────────────────
  const wordCount = q.split(/\s+/).filter(Boolean).length;
  const hasNumbers = /\d/.test(q);
  const SPECIFIC_SIGNALS = [
    "ceo", "cfo", "coo", "cto", "cmo", "dg ", "directeur général", "country manager",
    "vp ", "vice president", "président", "board", "comex", "codir",
    "series a", "series b", "series c", "scale-up", "scale up", "startup", "scaleup",
    "private equity", "venture", "leveraged", "lbo", "mbo", "due diligence",
    "package", "equity", "bspce", "stock option", "vesting", "cliff",
    "350k", "200k", "500k", "1m€", "2m€", "k€", "m€",
    "négociation", "négocier", "contrepouvoir", "ancrage",
    "stratégie", "stratégique", "strategie", "strategique",
    "pitch", "plan 100 jours", "100 jours", "comex",
    "entretien de", "entretien pour", "entretien avec",
    "cabinet de chasse", "chasseur de tête", "headhunter",
    "linkedin premium", "apec", "cadremploi",
    "réseautage", "networking", "réseau",
    "comment", "pourquoi", "quelle stratégie", "que faire",
    "analyse", "analyse ma", "analyse ma campagne", "bilan",
    "marché caché", "marché de l'emploi",
    "p&l", "ebitda", "arr", "ca", "chiffre d'affaires",
    "réorientation", "reconversion", "transition",
    "demande", "augmentation", "promotion",
    "démission", "préavis", "non-concurrence",
    "lettre de motivation pour", "cv pour", "cv de",
  ];
  const hasSpecificSignal = SPECIFIC_SIGNALS.some(s => q.includes(s));

  // Si la question ressemble à une vraie question de dirigeant → IA
  if (wordCount > 8 || hasNumbers || hasSpecificSignal) {
    return null; // → laisse l'IA prendre le relais
  }

  // ── Gate 2 : pour les questions courtes/génériques, on score par keyword ──
  let best: { entry: AnswerEntry; score: number } | null = null;

  for (const entry of ANSWER_ENGINE) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (q.includes(kw)) {
        score += entry.priority;
      }
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { entry, score };
    }
  }

  if (best) {
    return best.entry.getAnswer();
  }

  return null;
}

export const APP_FEATURES: AppFeature[] = [
  {
    id: "boardroom",
    name: "Boardroom Dashboard",
    route: "/",
    description: "Tableau de bord principal avec vue 3 colonnes : AI Briefing, Signal Feed, Market Watch, Recruiter Intel, Decision Support.",
    tips: ["Utilisez le Dashboard chaque matin.", "Les scores de matching aident à prioriser.", "Le AI Briefing est généré automatiquement."],
    related: ["ai-briefing", "opportunites", "performance"],
  },
  {
    id: "ai-briefing",
    name: "AI Briefing",
    route: "/analyse",
    description: "Briefing quotidien généré par IA avec le contexte de votre profil et opportunités.",
    tips: ["Configurez votre clé API pour activer le briefing.", "Consultez-le chaque matin."],
    related: ["boardroom", "parametres"],
  },
  {
    id: "signal-feed",
    name: "Signal Feed",
    route: "/opportunites",
    description: "Flux d'opportunités importées depuis vos sources.",
    tips: ["Importez via Web Scraper ou extension Chrome.", "Scoriez chaque offre.", "Les offres scorées alimentent le pipeline."],
    related: ["web-scraper", "extension", "pipeline"],
  },
  {
    id: "interview-studio",
    name: "Interview Studio",
    route: "/entretiens",
    description: "Préparation complète d'entretiens avec 24 sections générées automatiquement : 6 pitchs, contexte, motivation, questions, réponses STAR, objections, négociation, stratégie, checklist.",
    tips: ["Générez depuis une opportunité du pipeline.", "Les 6 pitchs sont adaptés à chaque rôle.", "Marquez 'Prêt' après révision."],
    related: ["pipeline", "profil", "proof-vault"],
  },
  {
    id: "documents-ai",
    name: "Documents AI",
    route: "/documents",
    description: "Génération de CV personnalisés, lettres de motivation, emails, LinkedIn.",
    tips: ["Personnalisez chaque document pour l'offre.", "10 styles d'écriture disponibles.", "Export PDF ou DOCX."],
    related: ["cv-maitre", "proof-vault", "analyse"],
  },
  {
    id: "web-scraper",
    name: "Web Scraper AI",
    route: "/dashboard/jobs/importer/smart-scraper",
    description: "Import d'offres depuis Welcome to the Jungle, LinkedIn, Indeed.",
    tips: ["Collez l'URL de l'offre.", "Extraction automatique des données.", "Scorez immédiatement après import."],
    related: ["signal-feed", "extension"],
  },
  {
    id: "pipeline",
    name: "Pipeline",
    route: "/dashboard/jobs/pipeline",
    description: "Kanban de suivi : À postuler, Envoyée, Relancé, Entretien, Négociation, Signé, Archivé.",
    tips: ["Déplacez par drag & drop.", "Chaque étape a des actions recommandées.", "Synchronisation Opportunité/Job."],
    related: ["signal-feed", "recruiter-intel", "documents-ai"],
  },
  {
    id: "recruiter-intel",
    name: "Recruiter Intel",
    route: "/dashboard/jobs/crm",
    description: "CRM recruteur : contacts, interactions, historique.",
    tips: ["Ajoutez chaque recruteur rencontré.", "Notez les points clés des échanges."],
    related: ["pipeline"],
  },
  {
    id: "executive-profile",
    name: "Profil Exécutif",
    route: "/profil",
    description: "Profil complet : titre, secteurs, fonctions, compétences, langues, formations.",
    tips: ["Remplissez complètement pour de meilleurs résultats IA.", "Alimente scores et documents."],
    related: ["cv-maitre", "proof-vault", "documents-ai"],
  },
  {
    id: "proof-vault",
    name: "Proof Vault",
    route: "/proof-vault",
    description: "Banque de preuves : réalisations, certifications, chiffres clés.",
    tips: ["Ajoutez des réalisations chiffrées.", "Utilisé dans CV, lettres, pitchs."],
    related: ["cv-maitre", "documents-ai", "interview-studio"],
  },
  {
    id: "settings",
    name: "Paramètres",
    route: "/parametres",
    description: "Configuration : clé API AI, préférences, Ux Mode.",
    tips: ["Configurez votre clé DeepSeek ou OpenRouter.", "Les données sont en SQLite local."],
    related: ["ai-briefing", "profil"],
  },
  {
    id: "guide",
    name: "Guide complet",
    route: "/guide",
    description: "Documentation complète en 22 sections.",
    tips: ["Consultez pour des instructions détaillées.", "Sommaire pour navigation rapide."],
    related: [],
  },
];

export const JOB_SEARCH_PHASES = [
  { phase: "1. Fondations", steps: ["Complétez votre Profil Exécutif", "Créez votre CV Maître", "Alimentez la Proof Vault"], routes: ["/profil", "/cv-maitre", "/proof-vault"] },
  { phase: "2. Sourcing", steps: ["Importez des offres", "Scoriez et priorisez", "Suivez dans le pipeline"], routes: ["/sources", "/dashboard/jobs/importer/smart-scraper", "/opportunites"] },
  { phase: "3. Candidature", steps: ["Générez CV et lettre", "Postulez", "Suivez dans le Pipeline"], routes: ["/documents", "/dashboard/jobs/pipeline"] },
  { phase: "4. Suivi", steps: ["Relancez (CRM)", "Préparez entretiens", "Négociez"], routes: ["/dashboard/jobs/crm", "/entretiens"] },
  { phase: "5. Pilotage", steps: ["Analysez performance", "Ajustez stratégie", "Dashboard quotidien"], routes: ["/performance", "/"] },
];
