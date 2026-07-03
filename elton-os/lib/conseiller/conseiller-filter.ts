// ─── Filtre anti off-topic pour le Conseiller PRSTO ────────────────
// Liste blanche de sujets autorisés : PRSTO + recherche d'emploi cadre dirigeant.
// Ce fichier NE contient PAS "use server" car isTopicAllowed est synchrone.

const ALLOWED_TOPICS = [
  "prsto", "elton os", "elton", "boardroom", "application", "appli", "outil", "logiciel",
  "recherche d'emploi", "recherche emploi", "job search", "candidature", "postuler",
  "entretien", "interview", "pitch", "recruteur", "recrutement", "chasseur",
  "cv", "curriculum", "lettre de motivation", "cover letter", "email", "linkedin",
  "profil", "compétence", "skill", "langue", "formation", "diplôme", "certification",
  "salaire", "rémunération", "négociation", "package", "prétention",
  "offre", "opportunité", "job", "poste", "mission", "stage", "cdi", "cdd",
  "pipeline", "kanban", "suivi", "relance", "workflow",
  "score", "matching", "analyse", "briefing", "dashboard", "tableau de bord",
  "import", "scraper", "extension", "chrome", "source", "firecrawl",
  "proof vault", "preuve", "réalisation", "résultat",
  "cv maître", "cv-maitre", "template", "modèle", "style", "document",
  "marché", "marché de l'emploi", "marché du travail", "secteur", "industrie",
  "carrière", "carriere", "mobilité", "transition", "reconversion",
  "coach", "conseil", "conseiller", "guide", "aide", "tutoriel",
  "paramètre", "parametre", "configuration", "api", "deepseek", "openrouter", "nim", "nvidia",
  "stratégie", "strategie", "plan", "objectif", "priorité",
  "réseau", "reseau", "contact", "crm", "relation",
  "test", "évaluation", "assessment", "compétence technique",
  "contrat", "période d'essai", "préavis", "démission",
  "simulation", "scenario", "plan d'action",
  "motivation", "objection", "point fort", "point faible",
  "checklist", "logistique", "préparation", "organisation",
  "question", "réponse", "reponse", "star", "méthode",
  "mail", "inmail", "message", "communication",
  "métier", "metier", "fonction", "poste", "role",
  "savoir-être", "soft skill", "hard skill",
  "marché caché", "marché visible", "ciblage", "cibler",
  "taux", "conversion", "indicateur", "kpi", "performance",
  "bonjour", "salut", "merci", "au revoir", "rebonjour",
  // Termes dirigeant élargis
  "ceo", "cfo", "coo", "cto", "cmo", "dg ", "directeur général", "country manager",
  "vice president", "président", "board", "comex", "codir",
  "series", "scale-up", "scale up", "startup", "scaleup",
  "private equity", "venture", "lbo", "mbo", "due diligence",
  "equity", "bspce", "stock option", "vesting", "cliff",
  "package", "négociation", "négocier",
  "cabinet de chasse", "chasseur de tête", "headhunter",
  "réseautage", "networking",
  "p&l", "ebitda", "arr", "chiffre d'affaires",
  "réorientation", "reconversion", "transition",
  "demande", "augmentation", "promotion",
  "démission", "préavis", "non-concurrence",
  // International / visa / expatriation
  "usa", "états-unis", "etats-unis", "américain", "americain", "us ", "new york", "san francisco",
  "uk", "london", "londres", "angleterre", "royaume-uni",
  "suisse", "belgique", "luxembourg", "allemagne", "dubai", "dubaï", "singapour",
  "international", "international", "expatriation", "expatrié", "expatriation",
  "visa", "h1b", "l1", "e2", "green card", "greencard", "sponsor", "parrainage",
  "mobilité internationale", "relocation", "expat",
  "français à l'étranger", "francais a l'etranger", "french abroad",
];

export function isTopicAllowed(question: string): boolean {
  const q = question.toLowerCase().trim();
  if (q.length < 3) return true;
  for (const topic of ALLOWED_TOPICS) {
    if (q.includes(topic)) return true;
  }
  return false;
}
