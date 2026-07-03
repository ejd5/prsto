/**
 * Matching sémantique explicable — fonctions pures.
 * Évalue l'adéquation d'une offre au profil cadre dirigeant commercial.
 * Local uniquement (pas de DeepSeek, pas d'embeddings).
 * Architecture prête pour extension embeddings / IA ultérieure.
 */
/* ─── Types ───────────────────────────────── */

export type RecommendationLevel = "highly_recommended" | "recommended" | "possible" | "low_priority" | "reject";
export type Action = "apply_now" | "shortlist" | "review_manually" | "archive" | "reject";

export interface DimensionScore {
  score: number;       // 0-100
  weight: number;      // e.g. 0.25
  weightedScore: number; // score * weight
  label: string;
  reason: string;
}

export interface Signal {
  type: "positive" | "risk" | "missing";
  label: string;
  detail: string;
  dimension: string;
}

export interface JobFitAnalysis {
  overallScore: number;
  confidence: number; // 0-100
  recommendation: RecommendationLevel;
  recommendedAction: Action;
  scores: {
    roleFit: number;
    seniorityFit: number;
    locationFit: number;
    sectorFit: number;
    languageFit: number;
    compensationFit: number;
    companyFit: number;
    applicationReadiness: number;
    risk: number; // higher = more risk
  };
  positiveSignals: Signal[];
  riskSignals: Signal[];
  missingSignals: Signal[];
  explanation: string;
  suggestedCvAngle: string;
  suggestedCoverLetterAngle: string;
  interviewPrepAngle: string;
}

export interface JobInput {
  title: string;
  company?: string | null;
  location?: string | null;
  locationPriority?: number | null;
  countryScope?: string | null;
  remotePolicy?: string | null;
  contractType?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  seniority?: string | null;
  functionArea?: string | null;
  sector?: string | null;
  description?: string | null;
}

export interface ProfileInput {
  fullName: string;
  title: string;
  summary?: string | null;
  location?: string | null;
  mobility?: string | null;
  languages?: string | null;
  yearsExp?: number | null;
  sectors?: string | null;
  functions?: string | null;
  remotePreference?: string | null;
  targetSalary?: string | null;
  constraints?: string | null;
}

export interface SemanticOptions {
  strictLocationFilter?: boolean;
}

/* ─── Keyword sets ──────────────────────────── */

const POSITIVE_TITLE_KEYWORDS = [
  "directeur commercial", "directeur des ventes", "sales director",
  "head of sales", "vp sales", "vice president sales",
  "chief revenue officer", "cro", "revenue director",
  "country manager", "general manager", "managing director",
  "directeur business development", "business development director",
  "commercial director", "regional sales director",
  "directeur de business unit", "business unit director",
  "directeur general", "chief commercial officer", "cco",
  "sales vice president", "directeur developpement",
  "head of business development", "vp business development",
  "directeur regional", "directeur commercial france",
  "france sales director", "sales lead", "revenue lead",
  "directeur developpement commercial", "directeur export",
  "sales manager", "responsable commercial", "sales team lead",
  "global sales director", "emea sales director", "europe sales director",
];

const NEGATIVE_LOCATION_KEYWORDS = [
  "us only", "united states only", "usa only",
  "uk only", "united kingdom only", "gb only",
  "brazil only", "india only", "japan only",
  "germany only", "spain only", "italy only",
  "must be based in london", "must be based in new york",
  "must reside in the us", "must reside in the uk",
  "relocation required", "must relocate",
  "onsite", "on-site only", "no remote",
];

const REMOTE_FRANCE_KEYWORDS = [
  "remote from france", "based in france", "candidates based in france",
  "remote europe", "remote emea", "work from anywhere in europe",
  "eu remote", "europe remote", "fully remote within europe",
  "france-based remote", "remote depuis la france",
  "teletravail depuis la france", "teletravail en france",
];

const FRANCE_PACA_KEYWORDS = [
  "marseille", "aix-en-provence", "aix", "nice", "toulon", "cannes",
  "avignon", "sophia antipolis", "paca", "cote d'azur",
  "provence", "var", "bouches-du-rhone", "vaucluse", "alpes-maritimes",
];

const FRANCE_IDF_KEYWORDS = [
  "paris", "ile-de-france", "idf", "boulogne", "la defense",
  "saint-denis", "nanterre", "versailles", "montreuil",
  "issy-les-moulineaux", "levallois", "neuilly",
];

const FRANCE_KEYWORDS = [
  "france", "french", "francais", "francophone",
  "lyon", "lille", "bordeaux", "toulouse", "nantes", "strasbourg",
  "rennes", "montpellier", "grenoble", "dijon",
];

const EUROPE_KEYWORDS = [
  "europe", "european", "emea", "eu ", "ue ",
  "switzerland", "belgium", "luxembourg", "netherlands",
  "germany", "spain", "italy", "uk", "united kingdom",
  "remote", "teletravail", "wfh", "work from home",
];

const SENIORITY_KEYWORDS = [
  "directeur", "director", "vp ", "vice president", "head of",
  "chief ", "president", "general manager", "country manager",
  "managing director", "svp", "evp", "senior director",
  "senior manager", "c-level", "c-suite", "direction",
  "partner", "executive", "lead ",
];

// Titres qui ne sont PAS de la direction commerciale, même s'ils contiennent
// "sales" ou "commercial". Ce sont des rôles IC ou middle management.
// Note: "account manager" seul = non-direction, mais "key account manager" = direction.
const NON_DIRECTION_TITLES = [
  "account executive",
  "account manager",
  "sales development",
  "business development representative", "sdr", "bdr",
  "customer success manager", "customer success representative",
  "sales representative", "commercial terrain", "commercial itinerant",
  "sales enablement", "sales operations", "sales ops",
];

// Si le titre contient un de ces mots-clés, on considère que c'est un rôle
// de niveau direction même si NON_DIRECTION_TITLES matche (ex: Key Account Manager)
const DIRECTION_OVERRIDE_KEYWORDS = [
  "key account", "grand compte", "grands comptes",
  "enterprise account executive", "senior account executive",
  "strategic account", "global account",
];

const COMMERCE_KEYWORDS = [
  "commercial", "sales", "ventes", "business development",
  "revenue", "biz dev", "account executive", "key account",
  "go-to-market", "gtm", "partnerships", "business",
  "client", "croissance", "growth", "market", "marche",
  "expansion", "deploiement", "negoce", "distribution",
];

/* ─── Helpers ────────────────────────────────── */

function clean(s: string): string {
  return (s || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/g, " ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function containsAny(text: string, keywords: string[]): boolean {
  const t = clean(text);
  return keywords.some((kw) => t.includes(clean(kw)));
}

function countMatches(text: string, keywords: string[]): number {
  const t = clean(text);
  return keywords.filter((kw) => t.includes(clean(kw))).length;
}

function containsWordAny(text: string, keywords: string[]): boolean {
  const t = " " + clean(text) + " ";
  return keywords.some((kw) => {
    const w = clean(kw);
    // Word boundary check: surrounded by space, punctuation, or string boundary
    const idx = t.indexOf(w);
    if (idx === -1) return false;
    const before = t[idx - 1];
    const after = t[idx + w.length];
    return (before === " " || before === undefined) && (after === " " || after === "." || after === "," || after === ";" || after === ":" || after === "!" || after === "?" || after === ")" || after === undefined);
  });
}

function safeParseJsonArray(val: string | null | undefined): string[] {
  if (!val) return [];
  try { const parsed = JSON.parse(val); return Array.isArray(parsed) ? parsed : []; }
  catch { return []; }
}

function buildFullText(job: JobInput): string {
  return [job.title, job.description, job.functionArea, job.sector]
    .filter(Boolean).join(" ");
}

function dim(score: number, weight: number, label: string, reason: string): DimensionScore {
  return { score, weight, weightedScore: Math.round(score * weight), label, reason };
}

function estimateYearsFromText(text: string): number | null {
  const cleaned = clean(text);
  const patterns = [
    /(\d+)\+?\s*(ans?|years?)(\s+d')?(\s+exp[eé]rience)?/gi,
    /(?:minimum\s+)?(\d+)\s*(ans?|years?)\s+(?:d')?(?:exp[eé]rience|of\s+experience)/gi,
    /exp[eé]rience\s+(?:de\s+)?(\d+)\s*(ans?|years?)/gi,
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(cleaned);
    if (match) {
      const years = parseInt(match[1], 10);
      if (years >= 1 && years <= 50) return years;
    }
  }
  // Heuristic: if seniority keywords present, assume 10+ years expected
  if (containsAny(text, SENIORITY_KEYWORDS)) return 10;
  return null;
}

/* ─── Dimension scoring ──────────────────────── */

function computeRoleFit(job: JobInput, _profile: ProfileInput): DimensionScore {
  const fullText = buildFullText(job);
  const titleClean = clean(job.title);

  // Non-direction title penalty — ces titres ne sont pas des postes de direction
  // même s'ils contiennent "sales", "account", "manager", etc.
  const hasDirectionOverride = containsAny(titleClean, DIRECTION_OVERRIDE_KEYWORDS);
  const isNonDirectionTitle = !hasDirectionOverride && containsWordAny(titleClean, NON_DIRECTION_TITLES);
  if (isNonDirectionTitle) {
    return dim(25, 0.25, "Role Fit", "Titre non-direction (AE, SDR, CSM, etc.) — hors périmètre exécutif");
  }

  // Direct positive title match
  const positiveTitleMatches = countMatches(titleClean, POSITIVE_TITLE_KEYWORDS);
  if (positiveTitleMatches >= 2) {
    return dim(95, 0.25, "Role Fit", `Titre correspond à plusieurs mots-clés direction commerciale (${positiveTitleMatches} correspondances)`);
  }
  if (positiveTitleMatches === 1) {
    return dim(82, 0.25, "Role Fit", "Titre avec mot-clé direction commerciale détecté");
  }

  // Check for director-level title without commerce keywords
  const hasDirectorKeyword = containsAny(titleClean, ["directeur", "director", "head of", "vp ", "chief "]);
  const hasCommerceKeyword = containsAny(fullText, COMMERCE_KEYWORDS);

  if (hasDirectorKeyword && hasCommerceKeyword) {
    return dim(65, 0.25, "Role Fit", "Poste de direction avec composante commerciale");
  }
  if (hasDirectorKeyword) {
    return dim(45, 0.25, "Role Fit", "Poste de direction sans aspect commercial explicite");
  }

  // Check for commerce keywords in full text
  const commerceMatches = countMatches(fullText, COMMERCE_KEYWORDS);
  if (commerceMatches >= 3) {
    return dim(55, 0.25, "Role Fit", `Plusieurs mots-clés commerce/business détectés (${commerceMatches})`);
  }
  if (commerceMatches >= 1) {
    return dim(35, 0.25, "Role Fit", "Quelques mots-clés commerce/business détectés");
  }

  return dim(15, 0.25, "Role Fit", "Aucun mot-clé direction commerciale détecté dans le titre");
}

function computeSeniorityFit(job: JobInput, profile: ProfileInput): DimensionScore {
  const fullText = buildFullText(job);
  const hasSeniorityKeyword = containsAny(fullText, SENIORITY_KEYWORDS);
  const requiredYears = estimateYearsFromText(fullText);
  const candidateYears = profile.yearsExp || 20;

  if (requiredYears && candidateYears >= requiredYears + 5) {
    return dim(92, 0.20, "Seniority Fit", `Expérience requise (${requiredYears} ans) largement dépassée (${candidateYears} ans)`);
  }
  if (requiredYears && candidateYears >= requiredYears) {
    return dim(80, 0.20, "Seniority Fit", `Expérience requise (${requiredYears} ans) satisfaite (${candidateYears} ans)`);
  }
  if (requiredYears && candidateYears >= requiredYears - 2) {
    return dim(55, 0.20, "Seniority Fit", `Expérience proche du requis (${candidateYears} vs ${requiredYears} ans)`);
  }
  if (hasSeniorityKeyword) {
    return dim(75, 0.20, "Seniority Fit", "Poste de niveau direction/senior détecté");
  }
  if (candidateYears >= 15) {
    return dim(60, 0.20, "Seniority Fit", "Profil très senior, poste sans exigence explicite");
  }
  return dim(50, 0.20, "Seniority Fit", "Pas d'indicateur de séniorité dans l'offre");
}

function computeLocationFit(job: JobInput, profile: ProfileInput): DimensionScore {
  const locClean = clean(job.location || "");
  const mobility = safeParseJsonArray(profile.mobility);
  const fullText = buildFullText(job);

  // PACA
  if (containsAny(locClean, FRANCE_PACA_KEYWORDS)) {
    return dim(98, 0.15, "Location Fit", "Poste en région PACA — correspondance parfaite");
  }

  // IDF
  if (containsAny(locClean, FRANCE_IDF_KEYWORDS)) {
    const hasIDFMobility = mobility.some((m) => clean(m).includes("idf") || clean(m).includes("paris") || clean(m).includes("ile-de-france"));
    if (hasIDFMobility || mobility.length === 0) {
      return dim(88, 0.15, "Location Fit", "Poste en Île-de-France — zone acceptée");
    }
    return dim(70, 0.15, "Location Fit", "Poste en IDF — mobilité à confirmer");
  }

  // France
  if (containsAny(locClean, FRANCE_KEYWORDS)) {
    return dim(82, 0.15, "Location Fit", "Poste en France — compatible");
  }

  // Europe / remote
  if (containsAny(locClean, EUROPE_KEYWORDS) || containsAny(fullText, REMOTE_FRANCE_KEYWORDS)) {
    return dim(75, 0.15, "Location Fit", "Poste Europe/Remote — potentiellement compatible");
  }

  // Remote compatible
  if (job.remotePolicy && containsAny(job.remotePolicy, ["remote"]) && containsAny(fullText, REMOTE_FRANCE_KEYWORDS)) {
    return dim(72, 0.15, "Location Fit", "Remote avec mention France possible");
  }

  // International
  if (!locClean || locClean.length < 2) {
    return dim(40, 0.15, "Location Fit", "Localisation non spécifiée");
  }

  return dim(30, 0.15, "Location Fit", `Localisation non couverte (${job.location})`);
}

function computeSectorFit(job: JobInput, profile: ProfileInput): DimensionScore {
  const profileSectors = safeParseJsonArray(profile.sectors);
  const fullText = buildFullText(job);

  if (profileSectors.length === 0) {
    return dim(50, 0.10, "Sector Fit", "Pas de secteurs configurés dans le profil");
  }

  const matchCount = profileSectors.filter((s) => clean(fullText).includes(clean(s))).length;
  if (matchCount >= 2) {
    return dim(90, 0.10, "Sector Fit", `${matchCount} secteurs du profil détectés dans l'offre`);
  }
  if (matchCount === 1) {
    return dim(70, 0.10, "Sector Fit", "1 secteur du profil détecté dans l'offre");
  }

  // Check for commerce/business sector alignment
  if (containsAny(fullText, COMMERCE_KEYWORDS)) {
    const commerceSectors = profileSectors.filter((s) => clean(s).includes("commerce") || clean(s).includes("vente") || clean(s).includes("business") || clean(s).includes("distribution"));
    if (commerceSectors.length > 0) {
      return dim(65, 0.10, "Sector Fit", "Alignement sectoriel commerce/business");
    }
  }

  return dim(35, 0.10, "Sector Fit", "Aucun secteur du profil détecté dans l'offre");
}

function computeLanguageFit(job: JobInput, profile: ProfileInput): DimensionScore {
  const fullText = buildFullText(job);
  const profileLanguages = safeParseJsonArray(profile.languages).map((l) => clean(l));

  if (profileLanguages.length === 0) {
    return dim(70, 0.10, "Language Fit", "Langues du profil non configurées — score neutre");
  }

  // Detect language requirements in job text
  const englishRequired = /(?:english|anglais)\s*(?:is\s+)?(?:required|mandatory|obligatoire|must|fluent|courant|bilingue)/i.test(fullText) ||
    containsAny(fullText, ["english speaking", "english proficiency", "maitrise de l'anglais"]);

  const frenchRequired = containsAny(fullText, ["francais", "french speaking", "francophone", "maitrise du francais"]);

  const hasEnglish = profileLanguages.some((l) => l.includes("anglais") || l.includes("english"));
  const hasFrench = profileLanguages.some((l) => l.includes("francais") || l.includes("french"));

  if (englishRequired && hasEnglish) {
    return dim(90, 0.10, "Language Fit", "Anglais requis et présent dans le profil");
  }
  if (frenchRequired && hasFrench) {
    return dim(90, 0.10, "Language Fit", "Français requis et présent dans le profil");
  }
  if (!englishRequired && !frenchRequired) {
    return dim(80, 0.10, "Language Fit", "Aucune exigence linguistique explicite");
  }
  if (englishRequired && !hasEnglish) {
    return dim(25, 0.10, "Language Fit", "Anglais requis mais absent du profil");
  }
  if (frenchRequired && !hasFrench) {
    return dim(25, 0.10, "Language Fit", "Français requis mais absent du profil");
  }

  return dim(60, 0.10, "Language Fit", "Exigences linguistiques partiellement satisfaites");
}

function computeCompensationFit(job: JobInput, profile: ProfileInput): DimensionScore {
  const targetSalary = profile.targetSalary;
  const jobMin = job.salaryMin;
  const jobMax = job.salaryMax;

  if (!targetSalary) {
    return dim(50, 0.05, "Rémunération", "Prétentions salariales non configurées");
  }
  if (!jobMin && !jobMax) {
    return dim(55, 0.05, "Rémunération", "Salaire non mentionné dans l'offre");
  }

  // Parse target salary range (e.g., "100000-140000")
  const targetMatch = targetSalary.match(/(\d+)\s*[-–àto]\s*(\d+)/i);
  if (!targetMatch) {
    return dim(55, 0.05, "Rémunération", "Fourchette de prétentions non parsable");
  }

  const targetMin = parseInt(targetMatch[1], 10);
  const targetMax = parseInt(targetMatch[2], 10);

  const offerMin = jobMin || jobMax || 0;
  const offerMax = jobMax || jobMin || 0;

  // Overlap check
  if (offerMax >= targetMin && offerMin <= targetMax) {
    return dim(85, 0.05, "Rémunération", "Fourchette salariale dans les prétentions");
  }
  if (offerMax < targetMin) {
    return dim(30, 0.05, "Rémunération", "Salaire proposé inférieur aux prétentions");
  }
  if (offerMin > targetMax * 1.2) {
    return dim(90, 0.05, "Rémunération", "Salaire proposé supérieur aux prétentions");
  }

  return dim(60, 0.05, "Rémunération", "Adéquation salariale partielle");
}

function computeCompanyFit(job: JobInput, _profile: ProfileInput): DimensionScore {
  const company = job.company || "";
  const contract = job.contractType || "";
  const fullText = buildFullText(job);

  let score = 50;
  const reasons: string[] = [];

  if (company.length > 0) {
    score += 15;
    reasons.push("Entreprise identifiée");
  } else {
    reasons.push("Entreprise non spécifiée");
  }

  if (containsAny(contract, ["cdi", "permanent", "full-time", "full time", "temps plein"])) {
    score += 15;
    reasons.push("CDI / temps plein");
  }

  if (containsAny(fullText, ["startup", "scale-up", "scaleup", "licorne", "hypercroissance"])) {
    score += 10;
    reasons.push("Contexte croissance/scale-up");
  }

  if (containsAny(fullText, ["grand groupe", "cac 40", "sbf 120", "multinationale", "fortune 500"])) {
    score += 10;
    reasons.push("Grand groupe / corporate");
  }

  return dim(Math.min(100, score), 0.08, "Company Fit", reasons.join(" — "));
}

function computeApplicationReadiness(job: JobInput, _profile: ProfileInput): DimensionScore {
  const desc = job.description || "";

  if (!desc || desc.trim().length < 50) {
    return dim(25, 0.07, "Préparation", "Description trop courte (< 50 caractères) — évaluation limitée");
  }

  let score = 60;

  if (desc.length > 500) score += 15;
  if (desc.length > 1500) score += 10;

  // Check for actionable elements
  if (containsAny(desc, ["responsabilit", "mission", "role", "profil recherche", "requirements", "qualifications"])) {
    score += 10;
  }

  return dim(Math.min(100, score), 0.07, "Préparation", score >= 80 ? "Description détaillée — bon support de candidature" : "Description suffisante pour évaluation");
}

function computeRisk(job: JobInput, _profile: ProfileInput): DimensionScore {
  const fullText = clean(buildFullText(job));
  let riskScore = 0;
  const reasons: string[] = [];

  // Junior/entry-level risk
  if (containsWordAny(fullText, ["stage de", "stage en", "offre de stage", "recherche stage", "stagiaire", "intern", "alternance", "apprenti", "graduate", "entry level", "entry-level", "debutant"])) {
    riskScore += 40;
    reasons.push("Poste junior/stage/alternance détecté");
  }

  // SDR/BDR risk
  if (containsWordAny(fullText, ["sdr", "bdr", "sales development representative", "business development representative", "sales representative junior", "commercial junior"])) {
    riskScore += 35;
    reasons.push("Poste SDR/BDR — sous le niveau direction");
  }

  // Technical risk
  if (containsWordAny(fullText, ["software engineer", "developer", "data scientist", "data engineer", "devops", "frontend", "backend", "fullstack", "machine learning"])) {
    riskScore += 35;
    reasons.push("Poste technique hors profil commercial/direction");
  }

  // International risk
  if (job.locationPriority === 4 && (job.remotePolicy !== "remote" || containsAny(fullText, ["onsite", "on-site", "no remote"]))) {
    riskScore += 30;
    reasons.push("Poste international incompatible");
  }

  // No description risk
  const desc = job.description || "";
  if (!desc || desc.trim().length < 50) {
    riskScore += 20;
    reasons.push("Description absente ou très courte");
  }

  if (!job.company || job.company.trim().length === 0) {
    riskScore += 10;
    reasons.push("Entreprise inconnue");
  }

  const score = Math.min(100, riskScore);
  return dim(score, 0.0, "Risk", reasons.length > 0 ? reasons.join(" — ") : "Pas de risque majeur détecté");
}

/* ─── Signal detection ──────────────────────── */

function detectPositiveSignals(job: JobInput, _profile: ProfileInput, dimensions: DimensionScore[]): Signal[] {
  const signals: Signal[] = [];
  const fullText = clean(buildFullText(job));

  // Role
  if (containsAny(job.title, POSITIVE_TITLE_KEYWORDS)) {
    signals.push({ type: "positive", label: "Titre direction commerciale", detail: clean(job.title), dimension: "roleFit" });
  }

  // Seniority
  if (containsAny(fullText, ["directeur", "director", "vp ", "head of", "country manager"])) {
    signals.push({ type: "positive", label: "Poste de direction", detail: "Niveau hiérarchique exécutif", dimension: "seniorityFit" });
  }
  if (containsAny(fullText, ["p&l", "comite de direction", "comex", "board", "reporting to ceo"])) {
    signals.push({ type: "positive", label: "P&L / Gouvernance", detail: "Responsabilité P&L ou rattachement COMEX/CEO", dimension: "seniorityFit" });
  }

  // Scope
  if (containsAny(fullText, ["management equipe", "pilotage equipe", "team management"])) {
    signals.push({ type: "positive", label: "Management d'équipe", detail: "Responsabilité de management", dimension: "roleFit" });
  }
  if (containsAny(fullText, ["strategie commerciale", "sales strategy", "go-to-market"])) {
    signals.push({ type: "positive", label: "Stratégie commerciale", detail: "Responsabilité stratégique", dimension: "roleFit" });
  }
  if (containsAny(fullText, ["developpement international", "international expansion", "marche francais", "french market"])) {
    signals.push({ type: "positive", label: "Développement international / marché français", detail: "Périmètre international ou France", dimension: "roleFit" });
  }
  if (containsAny(fullText, ["grands comptes", "key account", "enterprise sales"])) {
    signals.push({ type: "positive", label: "Grands comptes / Enterprise", detail: "Focus grands comptes", dimension: "sectorFit" });
  }

  // Location
  if (containsAny(clean(job.location || ""), FRANCE_PACA_KEYWORDS)) {
    signals.push({ type: "positive", label: "PACA / Sud", detail: "Localisation prioritaire", dimension: "locationFit" });
  }
  if (containsAny(clean(job.location || ""), FRANCE_IDF_KEYWORDS)) {
    signals.push({ type: "positive", label: "Paris / IDF", detail: "Zone acceptée", dimension: "locationFit" });
  }
  if (containsAny(fullText, REMOTE_FRANCE_KEYWORDS)) {
    signals.push({ type: "positive", label: "Remote France compatible", detail: "Télétravail depuis la France possible", dimension: "locationFit" });
  }

  // High-scoring dimensions
  for (const d of dimensions) {
    if (d.score >= 80 && d.label !== "Risk") {
      signals.push({ type: "positive", label: `${d.label} — ${d.score}/100`, detail: d.reason, dimension: d.label.toLowerCase() });
    }
  }

  // Deduplicate
  return dedupeSignals(signals);
}

function detectRiskSignals(job: JobInput, _profile: ProfileInput): Signal[] {
  const signals: Signal[] = [];
  const fullText = clean(buildFullText(job));

  if (containsWordAny(fullText, ["stage de", "stage en", "offre de stage", "recherche stage", "stagiaire", "intern", "alternance", "apprenti"])) {
    signals.push({ type: "risk", label: "Stage / Alternance", detail: "Poste non cadre — incompatible avec un profil exécutif", dimension: "roleFit" });
  }
  if (containsWordAny(fullText, ["junior", "entry level", "entry-level", "debutant", "graduate"])) {
    signals.push({ type: "risk", label: "Poste junior", detail: "Niveau junior — sous le niveau direction", dimension: "seniorityFit" });
  }
  if (containsWordAny(fullText, ["sdr", "bdr", "sales development representative"])) {
    signals.push({ type: "risk", label: "SDR / BDR", detail: "Rôle de prospection junior, pas un poste de direction", dimension: "roleFit" });
  }
  if (containsWordAny(fullText, ["software engineer", "developer", "data scientist", "devops"])) {
    signals.push({ type: "risk", label: "Poste technique", detail: "Rôle technique non aligné avec le profil commercial", dimension: "roleFit" });
  }
  if (containsAny(fullText, NEGATIVE_LOCATION_KEYWORDS)) {
    signals.push({ type: "risk", label: "Localisation incompatible", detail: "Restriction géographique excluant la France/l'Europe", dimension: "locationFit" });
  }
  if (job.remotePolicy === "remote" && !containsAny(fullText, REMOTE_FRANCE_KEYWORDS) && !containsAny(fullText, ["emea", "europe"])) {
    signals.push({ type: "risk", label: "Remote hors France/Europe", detail: "Poste remote sans compatibilité France/EMEA explicite", dimension: "locationFit" });
  }
  if (!job.description || job.description.trim().length < 100) {
    signals.push({ type: "risk", label: "Description pauvre", detail: "Moins de 100 caractères — évaluation limitée", dimension: "applicationReadiness" });
  }
  if (job.locationPriority === 4 && !containsAny(fullText, REMOTE_FRANCE_KEYWORDS)) {
    signals.push({ type: "risk", label: "International hors périmètre", detail: "Poste hors France/Europe sans compatibilité remote", dimension: "locationFit" });
  }

  return dedupeSignals(signals);
}

function generateMissingSignals(job: JobInput, _profile: ProfileInput): Signal[] {
  const signals: Signal[] = [];

  if (!job.description || job.description.trim().length < 100) {
    signals.push({ type: "missing", label: "Description détaillée", detail: "Impossible d'évaluer correctement sans description complète", dimension: "applicationReadiness" });
  }
  if (!job.company || job.company.trim().length === 0) {
    signals.push({ type: "missing", label: "Nom de l'entreprise", detail: "Entreprise non spécifiée — impossible d'évaluer le secteur", dimension: "companyFit" });
  }
  if (!job.salaryMin && !job.salaryMax) {
    signals.push({ type: "missing", label: "Fourchette salariale", detail: "Salaire non mentionné — adéquation rémunération inconnue", dimension: "compensationFit" });
  }
  if (!job.location || job.location.trim().length === 0) {
    signals.push({ type: "missing", label: "Localisation", detail: "Localisation non spécifiée", dimension: "locationFit" });
  }
  if (!job.contractType || job.contractType.trim().length === 0) {
    signals.push({ type: "missing", label: "Type de contrat", detail: "CDI/CDD/Freelance non précisé", dimension: "companyFit" });
  }

  return signals;
}

function dedupeSignals(signals: Signal[]): Signal[] {
  const seen = new Set<string>();
  return signals.filter((s) => {
    const key = `${s.label}|${s.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/* ─── Risk caps ──────────────────────────────── */

function applyRiskCaps(
  analysis: JobFitAnalysis,
  job: JobInput,
  options: SemanticOptions,
): JobFitAnalysis {
  const fullText = clean(buildFullText(job));
  const strictLocation = options.strictLocationFilter !== false; // default true
  let maxScore = 100;

  // 1. Stage / alternance / junior → max 30
  if (containsWordAny(fullText, ["stage de", "stage en", "offre de stage", "recherche stage", "stagiaire", "intern", "alternance", "apprenti", "graduate", "entry level", "entry-level", "debutant"])) {
    maxScore = Math.min(maxScore, 30);
  }

  // 2. SDR / BDR / junior sales → aussi max 30
  if (containsWordAny(fullText, ["sdr", "bdr", "sales development representative", "business development representative", "sales representative junior", "commercial junior"])) {
    maxScore = Math.min(maxScore, 30);
  }

  // 3. Technical role outside target → max 35
  if (containsWordAny(fullText, ["software engineer", "developer", "data scientist", "data engineer", "devops", "frontend", "backend", "fullstack", "machine learning"])) {
    maxScore = Math.min(maxScore, 35);
  }

  // 4. International incompatible → max 40
  if (job.locationPriority === 4 && !containsAny(fullText, REMOTE_FRANCE_KEYWORDS) && !containsAny(fullText, ["french market", "marche francais", "french-speaking", "francophone", "emea", "europe"])) {
    maxScore = Math.min(maxScore, 40);
  }

  // 5. Remote-only outside France/Europe → reject
  if (strictLocation) {
    const isRemoteOnly = job.remotePolicy === "remote" || containsAny(fullText, ["remote only", "fully remote", "100% remote", "remote first"]);
    const hasFranceCompat = containsAny(fullText, REMOTE_FRANCE_KEYWORDS) || containsAny(fullText, ["emea", "europe", "france"]);
    const isIntl = job.locationPriority === 4 || containsAny(fullText, NEGATIVE_LOCATION_KEYWORDS);

    if (isRemoteOnly && isIntl && !hasFranceCompat) {
      analysis.overallScore = 0;
      analysis.recommendation = "reject";
      analysis.recommendedAction = "reject";
      if (!analysis.riskSignals.some((s) => s.label === "Remote hors France/Europe")) {
        analysis.riskSignals.push({ type: "risk", label: "Remote hors France/Europe", detail: "Poste remote sans compatibilité France/EMEA explicite", dimension: "locationFit" });
      }
      return analysis;
    }
  }

  // 6. Empty description → max 60, confidence reduced
  if (!job.description || job.description.trim().length < 50) {
    maxScore = Math.min(maxScore, 60);
  }

  // Apply the cap
  if (analysis.overallScore > maxScore) {
    analysis.overallScore = maxScore;
  }

  return analysis;
}

/* ─── Confidence ─────────────────────────────── */

function computeConfidence(job: JobInput, profile: ProfileInput): number {
  let confidence = 30; // base

  if (job.description && job.description.trim().length >= 100) confidence += 25;
  if (job.description && job.description.trim().length >= 500) confidence += 15;
  if (profile.sectors && safeParseJsonArray(profile.sectors).length > 0) confidence += 10;
  if (profile.languages && safeParseJsonArray(profile.languages).length > 0) confidence += 8;
  if (profile.yearsExp && profile.yearsExp > 0) confidence += 8;
  if (job.salaryMin || job.salaryMax) confidence += 6;
  if (job.company && job.company.trim().length > 0) confidence += 5;
  if (profile.location && profile.location.trim().length > 0) confidence += 3;

  return Math.min(100, confidence);
}

/* ─── Explanation & angles ───────────────────── */

function generateExplanation(analysis: JobFitAnalysis, _job: JobInput, _profile: ProfileInput): string {
  const lines: string[] = [];
  const dims: [string, number][] = [
    ["Adéquation rôle", analysis.scores.roleFit],
    ["Séniorité", analysis.scores.seniorityFit],
    ["Localisation", analysis.scores.locationFit],
    ["Secteur", analysis.scores.sectorFit],
    ["Langues", analysis.scores.languageFit],
    ["Entreprise", analysis.scores.companyFit],
    ["Rémunération", analysis.scores.compensationFit],
    ["Préparation", analysis.scores.applicationReadiness],
  ];

  const strongDim = dims.filter(([, s]) => s >= 75).map(([n]) => n);
  const weakDim = dims.filter(([, s]) => s < 40).map(([n]) => n);

  if (strongDim.length > 0) {
    lines.push(`Points forts: ${strongDim.slice(0, 3).join(", ")}.`);
  }
  if (weakDim.length > 0) {
    lines.push(`Points d'attention: ${weakDim.slice(0, 3).join(", ")}.`);
  }
  if (analysis.positiveSignals.length > 0) {
    lines.push(`Signaux positifs: ${analysis.positiveSignals.slice(0, 3).map((s) => s.label).join(", ")}.`);
  }
  if (analysis.riskSignals.length > 0) {
    lines.push(`Risques: ${analysis.riskSignals.slice(0, 2).map((s) => s.label).join(", ")}.`);
  }
  lines.push(`Recommandation: ${mapRecommendationLabel(analysis.recommendation)}.`);

  return lines.join(" ");
}

function generateCvAngle(analysis: JobFitAnalysis, profile: ProfileInput): string {
  const angles: string[] = [];

  if (analysis.scores.roleFit >= 70) {
    angles.push(`Mettre en avant le titre "${profile.title}" et l'expérience en direction commerciale.`);
  }
  if (analysis.positiveSignals.some((s) => s.label.includes("international"))) {
    angles.push("Valoriser l'expérience internationale et le pilotage d'équipes multiculturelles.");
  }
  if (analysis.positiveSignals.some((s) => s.label.includes("Grands comptes") || s.label.includes("Enterprise"))) {
    angles.push("Mettre en avant les réalisations en gestion de grands comptes et comptes stratégiques.");
  }
  if (analysis.riskSignals.some((s) => s.dimension === "sectorFit")) {
    angles.push("Souligner la transférabilité des compétences commerciales à travers différents secteurs.");
  }
  if (analysis.scores.seniorityFit >= 75) {
    angles.push("Insister sur les résultats chiffrés de pilotage d'équipe et de croissance.");
  }

  if (angles.length === 0) {
    angles.push(`CV orienté direction commerciale — mettre en avant le leadership, les résultats et la vision stratégique.`);
  }

  return angles.join(" ");
}

function generateCoverLetterAngle(analysis: JobFitAnalysis, job: JobInput, _profile: ProfileInput): string {
  const angles: string[] = [];
  const company = job.company || "votre entreprise";

  if (analysis.scores.roleFit >= 75) {
    angles.push(`Lettre ciblée sur l'adéquation parfaite entre le profil et le poste de ${job.title || "direction commerciale"}.`);
  }
  if (analysis.positiveSignals.some((s) => s.label.includes("international"))) {
    angles.push(`Mentionner l'expérience en développement international et la connaissance des marchés multiculturels.`);
  }
  if (analysis.riskSignals.some((s) => s.dimension === "sectorFit")) {
    angles.push(`Expliquer comment l'expérience dans d'autres secteurs apporte un regard neuf et des best practices transférables à ${company}.`);
  }
  if (analysis.riskSignals.some((s) => s.dimension === "locationFit")) {
    angles.push(`Rester prudent sur la localisation — mentionner la mobilité et la flexibilité sans s'engager.`);
  }
  if (analysis.scores.companyFit >= 70) {
    angles.push(`Démontrer une connaissance de ${company} et de son marché pour crédibiliser la candidature.`);
  }

  if (angles.length === 0) {
    angles.push(`Lettre de motivation structurée : introduction, valeur ajoutée, adéquation au poste, proposition de rencontre.`);
  }

  return angles.join(" ");
}

function generateInterviewAngle(analysis: JobFitAnalysis, _job: JobInput, profile: ProfileInput): string {
  const angles: string[] = [];

  if (analysis.scores.roleFit >= 75) {
    angles.push("Préparer des exemples concrets de réalisations en direction commerciale (STAR).");
  }
  if (analysis.positiveSignals.some((s) => s.label.includes("P&L"))) {
    angles.push("Préparer des chiffres précis sur le P&L, la croissance et les résultats d'équipe.");
  }
  if (analysis.riskSignals.some((s) => s.dimension === "sectorFit")) {
    angles.push("Anticiper la question de l'expérience sectorielle — préparer des arguments de transférabilité.");
  }
  if (analysis.riskSignals.some((s) => s.dimension === "locationFit")) {
    angles.push("Préparer une réponse sur la mobilité / le télétravail sans en faire un point de blocage.");
  }
  if (analysis.scores.languageFit >= 80) {
    angles.push(`Prêt pour un entretien en français et en anglais — ${profile.languages ? "langues maîtrisées" : "vérifier les exigences"}.`);
  }

  if (angles.length === 0) {
    angles.push("Préparation standard : pitch 30s, parcours, réalisations, questions à poser, négociation salariale.");
  }

  return angles.join(" ");
}

/* ─── Recommendation ─────────────────────────── */

export function recommendApplicationAction(input: { overallScore: number }): Action {
  if (input.overallScore >= 75) return "apply_now";
  if (input.overallScore >= 55) return "shortlist";
  if (input.overallScore >= 35) return "review_manually";
  return "reject";
}

function mapActionToRecommendation(action: Action, score: number): RecommendationLevel {
  if (action === "apply_now" && score >= 85) return "highly_recommended";
  if (action === "apply_now") return "recommended";
  if (action === "shortlist") return "possible";
  if (action === "review_manually") return "low_priority";
  return "reject";
}

function mapRecommendationLabel(r: RecommendationLevel): string {
  const labels: Record<RecommendationLevel, string> = {
    highly_recommended: "Hautement recommandé",
    recommended: "Recommandé",
    possible: "Possible",
    low_priority: "Priorité basse",
    reject: "Rejeté",
  };
  return labels[r] || r;
}

/* ─── Main orchestration ─────────────────────── */

export function analyzeJobFit(
  job: JobInput,
  profile: ProfileInput,
  options: SemanticOptions = {},
): JobFitAnalysis {
  const roleFit = computeRoleFit(job, profile);
  const seniorityFit = computeSeniorityFit(job, profile);
  const locationFit = computeLocationFit(job, profile);
  const sectorFit = computeSectorFit(job, profile);
  const languageFit = computeLanguageFit(job, profile);
  const compensationFit = computeCompensationFit(job, profile);
  const companyFit = computeCompanyFit(job, profile);
  const applicationReadiness = computeApplicationReadiness(job, profile);
  const risk = computeRisk(job, profile);

  const allDims = [roleFit, seniorityFit, locationFit, sectorFit, languageFit, compensationFit, companyFit, applicationReadiness];

  const overallScore = Math.round(allDims.reduce((sum, d) => sum + d.weightedScore, 0));

  const analysis: JobFitAnalysis = {
    overallScore,
    confidence: computeConfidence(job, profile),
    scores: {
      roleFit: roleFit.score,
      seniorityFit: seniorityFit.score,
      locationFit: locationFit.score,
      sectorFit: sectorFit.score,
      languageFit: languageFit.score,
      compensationFit: compensationFit.score,
      companyFit: companyFit.score,
      applicationReadiness: applicationReadiness.score,
      risk: risk.score,
    },
    positiveSignals: detectPositiveSignals(job, profile, allDims),
    riskSignals: detectRiskSignals(job, profile),
    missingSignals: generateMissingSignals(job, profile),
    explanation: "",
    suggestedCvAngle: "",
    suggestedCoverLetterAngle: "",
    interviewPrepAngle: "",
    recommendation: "low_priority",
    recommendedAction: "review_manually",
  };

  // Apply risk caps
  const capped = applyRiskCaps(analysis, job, options);

  // Recommendation from final score
  capped.recommendedAction = recommendApplicationAction(capped);
  capped.recommendation = mapActionToRecommendation(capped.recommendedAction, capped.overallScore);

  // Generate explanations and angles
  capped.explanation = generateExplanation(capped, job, profile);
  capped.suggestedCvAngle = generateCvAngle(capped, profile);
  capped.suggestedCoverLetterAngle = generateCoverLetterAngle(capped, job, profile);
  capped.interviewPrepAngle = generateInterviewAngle(capped, job, profile);

  return capped;
}

export function computeSemanticFitScore(input: { overallScore: number }): number {
  return input.overallScore;
}

export function explainJobFit(input: JobFitAnalysis): string[] {
  return input.explanation.split(". ").filter(Boolean);
}

export function detectFitRisks(input: JobFitAnalysis): string[] {
  return input.riskSignals.map((s) => `${s.label}: ${s.detail}`);
}

export function detectMissingSignals(input: JobFitAnalysis): string[] {
  return input.missingSignals.map((s) => `${s.label}: ${s.detail}`);
}

/* ─── Serialization helper (for DB storage) ─── */

export function serializeAnalysis(a: JobFitAnalysis) {
  return {
    overallScore: a.overallScore,
    confidence: a.confidence,
    recommendation: a.recommendation,
    recommendedAction: a.recommendedAction,
    positiveSignals: a.positiveSignals.map((s) => s.label),
    riskSignals: a.riskSignals.map((s) => s.label),
    missingSignals: a.missingSignals.map((s) => s.label),
    explanation: a.explanation,
    suggestedCvAngle: a.suggestedCvAngle,
    suggestedCoverLetterAngle: a.suggestedCoverLetterAngle,
    interviewPrepAngle: a.interviewPrepAngle,
    scores: a.scores,
  };
}
