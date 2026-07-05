/**
 * Filtre de pertinence profil — fonctions pures.
 * Détermine si une offre correspond au profil cible (Directeur Commercial / DG / VP Sales...).
 * Aucun import Prisma, aucun réseau. Testable unitairement.
 */

/* ─── Profil cible ───────────────────────── */

export interface TargetProfile {
  title: string;
  functions: string[];
  sectors: string[];
  location: string;
  yearsExp: number | null;
  languages: string[];
  skills: string[];
}

/* ─── Résultat du filtre ─────────────────── */

export interface ProfileFilterResult {
  shouldKeep: boolean;
  relevanceScore: number;
  reasons: string[];
  rejectionReasons: string[];
  locationPriority: 1 | 2 | 3 | 4; // 1=PACA, 2=IDF, 3=FR/Europe, 4=INTL
}

/* ─── Mots-clés positifs ─────────────────── */

const SENIOR_SALES_TITLES = [
  "directeur commercial", "directeur des ventes", "sales director", "vp sales",
  "head of sales", "chief revenue officer", "cro", "revenue director",
  "country manager", "general manager", "managing director", "directeur général",
  "directeur business development", "business development director",
  "vp business development", "head of business development",
  "commercial director", "sales vice president", "regional sales director",
  "directeur développement commercial", "directeur régional",
  "directeur de business unit", "business unit director",
  "directeur commercial france", "france sales director",
];

const SENIOR_TITLES = [
  "directeur", "director of", "vp ", "vice president", "head of",
  "chief ", "president", "general manager", "country manager",
  "managing director", "svp", "evp", "senior director",
  "senior manager", "c-level", "direction", "partner",
  "responsable", "director,",
];

const COMMERCIAL_KEYWORDS = [
  "sales", "commercial", "ventes", "business development", "revenue",
  "biz dev", "account executive", "key account", "go-to-market", "gtm",
  "partnerships", "business", "client", "croissance", "growth",
  "market", "marché", "expansion", "déploiement",
];

const FRANCE_LOCATIONS = [
  "marseille", "aix", "paca", "provence", "aubagne", "toulon", "nice",
  "sophia antipolis", "avignon", "cannes", "fréjus",
];

const PARIS_LOCATIONS = [
  "paris", "île-de-france", "ile-de-france", "idf", "boulogne",
  "la défense", "nanterre", "saint-denis", "versailles", "montreuil",
  "issy", "neuilly", "levallois", "puteaux", "courbevoie",
];

const FRANCE_KEYWORDS = ["france", "french", "français", "paris", "lyon", "lyonnais"];

const EUROPE_KEYWORDS = [
  "europe", "european", "europe", "remote", "europe de l'ouest",
  "western europe", "emea", "southern europe", "northern europe",
];

/* ─── Postes à rejeter (non direction) ───── */

const REJECT_TITLES = [
  "stage", "stagiaire", "intern", "alternance", "apprenti",
  "graduate", "junior", "entry level", "débutant",
  "sdr", "bdr", "sales development", "business development representative",
  "software engineer", "developer", "data scientist", "data analyst",
  "data engineer", "machine learning", "devops", "site reliability",
  "product manager", "designer", "ux", "ui", "frontend", "backend",
  "fullstack", "infrastructure", "platform", "security engineer",
  "it support", "help desk", "technicien", "administrative",
  "assistant", "coordinateur", "operations associate",
];

/* ─── Helpers ────────────────────────────── */

function clean(s: string): string {
  return (s || "")
    .replace(/<[^>]+>/g, " ")   // strip HTML tags
    .replace(/&[a-z]+;/g, " ")  // strip HTML entities
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")       // normalize whitespace
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

/* ─── Classification ─────────────────────── */

function classifyLocation(
  location: string | undefined | null,
): { priority: 1 | 2 | 3 | 4; label: string } {
  const loc = clean(location || "");
  if (!loc) return { priority: 3, label: "Non spécifiée" };

  if (containsAny(loc, FRANCE_LOCATIONS)) return { priority: 1, label: "PACA" };
  if (containsAny(loc, PARIS_LOCATIONS)) return { priority: 2, label: "IDF" };
  if (containsAny(loc, FRANCE_KEYWORDS)) return { priority: 2, label: "France" };
  if (containsAny(loc, EUROPE_KEYWORDS)) return { priority: 3, label: "Europe/Remote" };
  return { priority: 4, label: "International" };
}

function isSeniorRole(title: string): boolean {
  return containsAny(title, SENIOR_SALES_TITLES);
}

function isRejectedTitle(title: string): boolean {
  return containsAny(title, REJECT_TITLES);
}

function hasCommercialAspect(title: string, description: string): boolean {
  const full = `${title} ${description}`;
  return containsAny(full, COMMERCIAL_KEYWORDS);
}

function hasManagementScope(title: string, description: string): boolean {
  const full = `${title} ${description}`;
  const mgr = ["manage", "management", "équipe", "team", "lead", "p&l", "revenue", "budget",
    "responsable", "direction", "direct", "supervis", "coach", "mentor",
    "organisation", "strategy", "stratégie", "déploiement"];
  return containsAny(full, mgr);
}

/* ─── International compatibility ────────── */

const FRANCE_MARKET_KEYWORDS = [
  "france", "french market", "market france", "marché français",
  "french-speaking", "francophone", "french native", "native french",
  "french clients", "clients français", "bilingual french english",
  "country manager france", "sales director france", "head of sales france",
  "directeur commercial france", "emea france", "western europe france",
  "southern europe france", "europe de l'ouest france",
  "french language", "réseau français", "business development france",
  "french speaker", "fluent french", "french fluency",
];

const REMOTE_FRANCE_KEYWORDS = [
  "remote from france", "based in france", "candidates based in france",
  "remote europe", "remote emea", "work from anywhere in europe",
  "eu remote", "europe remote", "fully remote within europe",
  "france-based remote", "remote-friendly for france",
  "remote depuis la france", "télétravail depuis la france",
  // PAS de standalone "remote" ou "télétravail" — trop large
];

const INTERNATIONAL_REJECT_KEYWORDS = [
  "us only", "uk only", "germany only", "spain only",
  "must be based in london", "must be based in berlin",
  "must be based in new york", "must be based in san francisco",
  "relocation required", "onsite", "on-site only",
  "hybrid london", "hybrid berlin", "hybrid new york",
  "local candidates only", "german native required",
  "spanish native required", "dutch native required",
  "must reside in the us", "must reside in the uk",
  "must be located in", "work authorization required",
];

// Localisations explicitement hors France/Europe sans intérêt
const INTERNATIONAL_LOCATION_REJECT = [
  "united states", "usa", "brazil", "india", "china", "japan",
  "australia", "canada", "mexico", "singapore", "dubai",
  "saudi arabia", "south africa", "argentina", "chile", "colombia",
  "south korea", "taiwan", "indonesia", "philippines", "vietnam",
  "thailand", "malaysia", "israel", "turkey", "russia", "ukraine",
];

export interface InternationalCompatibility {
  isInternational: boolean;
  isFranceMarket: boolean;
  isFrenchProfileRequired: boolean;
  isRemoteFromFranceCompatible: boolean;
  shouldKeepInternational: boolean;
  reasons: string[];
  rejectionReasons: string[];
  adjustedLocationScore: number;
}

export function detectInternationalCompatibility(
  title: string,
  description: string,
  location: string | null | undefined,
): InternationalCompatibility {
  const fullText = clean(`${title} ${description || ""} ${location || ""}`);
  const loc = clean(location || "");
  const reasons: string[] = [];
  const rejections: string[] = [];

  // 1. Est-ce international ?
  const isFrance = containsAny(loc, FRANCE_LOCATIONS) ||
    containsAny(loc, PARIS_LOCATIONS) ||
    containsAny(loc, ["france", "french", "paris", "lyon", "marseille", "aix", "idf", "île-de-france", "ile-de-france"]);
  const isEurope = containsAny(loc, EUROPE_KEYWORDS) ||
    containsAny(fullText, ["emea", "europe", "european"]);
  const isInternational = !isFrance && !isEurope &&
    (loc.length > 0) &&
    !containsAny(loc, ["remote", "télétravail", "teletravail", "france", "paris", "lyon", "marseille"]);

  if (!isInternational && isFrance) {
    return {
      isInternational: false,
      isFranceMarket: true,
      isFrenchProfileRequired: false,
      isRemoteFromFranceCompatible: false,
      shouldKeepInternational: true,
      reasons: ["Poste France ou localisé France"],
      rejectionReasons: [],
      adjustedLocationScore: 25,
    };
  }

  if (!isInternational && !isFrance && !isEurope && loc.length === 0) {
    // Pas de localisation → neutre
    return {
      isInternational: false, isFranceMarket: false, isFrenchProfileRequired: false,
      isRemoteFromFranceCompatible: false, shouldKeepInternational: true,
      reasons: [], rejectionReasons: [], adjustedLocationScore: 12,
    };
  }

  // 2. Détection critères positifs
  const isFranceMarket = containsAny(fullText, FRANCE_MARKET_KEYWORDS);
  const isFrenchProfileRequired = containsAny(fullText, [
    "french speaker", "fluent french", "french native", "native french",
    "french language mandatory", "bilingual french", "francophone",
    "french fluency", "french required",
  ]);
  const isRemoteFromFranceCompatible = containsAny(fullText, REMOTE_FRANCE_KEYWORDS);

  if (isFranceMarket) reasons.push("Marché France / francophone détecté");
  if (isFrenchProfileRequired) reasons.push("Profil français/francophone requis");
  if (isRemoteFromFranceCompatible) reasons.push("Remote compatible France");

  // 3. Détection critères négatifs (description + localisation)
  const hasRejectionKeyword = containsAny(fullText, INTERNATIONAL_REJECT_KEYWORDS);

  if (hasRejectionKeyword) {
    const matched = INTERNATIONAL_REJECT_KEYWORDS.filter((kw) => fullText.includes(clean(kw)));
    rejections.push(`Restriction locale incompatible : ${matched.slice(0, 3).join(", ")}`);
  }

  // Localisation explicitement hors France/Europe = rejet sauf marché France
  const hasForeignLocation = containsAny(loc, INTERNATIONAL_LOCATION_REJECT);
  if (hasForeignLocation && !isFranceMarket) {
    const matched = INTERNATIONAL_LOCATION_REJECT.filter((kw) => loc.includes(clean(kw)));
    rejections.push(`Localisation hors France/Europe : ${matched.slice(0, 2).join(", ")}`);
  }

  // 4. Décision
  const shouldKeepInternational =
    (isFranceMarket || isFrenchProfileRequired || isRemoteFromFranceCompatible) &&
    (!hasRejectionKeyword || isFranceMarket || isFrenchProfileRequired) &&
    (!(hasForeignLocation && !isFranceMarket)); // rejeter si localisation hors zone sauf marché France

  // 5. Score localisation ajusté
  let adjustedLocationScore = 0;
  if (isFrance) {
    adjustedLocationScore = 25;
  } else if (isFranceMarket || isFrenchProfileRequired) {
    adjustedLocationScore = 18; // Cible France → score proche IDF
  } else if (isRemoteFromFranceCompatible) {
    adjustedLocationScore = 15; // Remote Europe → bon score
  } else if (isInternational && shouldKeepInternational) {
    adjustedLocationScore = 8; // International compatible → faible
  } else {
    adjustedLocationScore = 3; // International non compatible → très faible
  }

  return {
    isInternational: isInternational || isEurope,
    isFranceMarket,
    isFrenchProfileRequired,
    isRemoteFromFranceCompatible,
    shouldKeepInternational,
    reasons,
    rejectionReasons: rejections,
    adjustedLocationScore,
  };
}

/* ─── Fonction principale ────────────────── */

export function filterJobForTargetProfile(
  title: string,
  description: string,
  location: string | null | undefined,
  target: TargetProfile,
): ProfileFilterResult {
  const reasons: string[] = [];
  const rejections: string[] = [];
  let score = 0;

  const t = clean(title);
  const d = clean(description || "");
  const loc = location || "";

  // 1. REJET immédiat : stage / junior / technique pur
  if (isRejectedTitle(title)) {
    const matched = REJECT_TITLES.filter((kw) => clean(title).includes(clean(kw)));
    return {
      shouldKeep: false,
      relevanceScore: 0,
      reasons: [],
      rejectionReasons: [`Poste exclu : ${matched.slice(0, 3).join(", ")}`],
      locationPriority: classifyLocation(location).priority,
    };
  }

  // 2. Titre senior (35 points max)
  if (isSeniorRole(title)) {
    score += 35;
    reasons.push("Poste de direction commerciale (35/35)");
  } else if (containsAny(title, SENIOR_TITLES)) {
    const matched = SENIOR_TITLES.filter((kw) => clean(title).includes(clean(kw)));
    score += 25;
    reasons.push(`Terme senior : ${matched.slice(0, 3).join(", ")} (25/35)`);
  } else if (hasCommercialAspect(title, description)) {
    // Poste commercial mais pas direction → acceptable si management scope
    if (hasManagementScope(title, description)) {
      score += 15;
      reasons.push("Poste commercial avec scope management (15/35)");
    } else {
      score += 8;
      rejections.push("Poste commercial sans direction");
    }
  } else {
    // Ni senior ni commercial → probablement pas pertinent
    rejections.push("Ni direction ni commercial");
  }

  // 3. Localisation (25 points) — priorité France, filtre international
  const intl = detectInternationalCompatibility(title, description, location);

  if (intl.isInternational) {
    // Appliquer le score ajusté selon la compatibilité internationale
    score += intl.adjustedLocationScore;
    if (intl.reasons.length > 0) {
      reasons.push(`International : ${intl.reasons.join("; ")} (${intl.adjustedLocationScore}/25)`);
    }
    if (intl.rejectionReasons.length > 0) {
      rejections.push(...intl.rejectionReasons);
    }

    // Rejet si international non compatible
    if (!intl.shouldKeepInternational) {
      reasons.length = 0; // effacer les raisons précédentes
      const locPriority = classifyLocation(location).priority;
      return {
        shouldKeep: false,
        relevanceScore: Math.min(score, 100),
        reasons: [],
        rejectionReasons: [...rejections, "Poste international non compatible : ne cible pas le marché français, ni un profil francophone, ni un poste remote depuis la France"],
        locationPriority: locPriority,
      };
    }
  } else {
    // Scoring localisation classique
    const locClass = classifyLocation(location);
    if (locClass.priority === 1) {
      score += 25;
      reasons.push(`Localisation prioritaire : PACA (25/25)`);
    } else if (locClass.priority === 2) {
      score += 18;
      reasons.push(`Localisation compatible : ${locClass.label} (18/25)`);
    } else if (locClass.priority === 3) {
      score += 12;
      reasons.push(`Europe / Remote (12/25)`);
    } else {
      score += 5;
      rejections.push(`Localisation éloignée : ${locClass.label} (5/25)`);
    }
  }

  // 4. Scope management / P&L (20 points)
  if (hasManagementScope(title, description)) {
    const mgmtScore = Math.min(20, countMatches(`${title} ${description}`, [
      "équipe", "team", "p&l", "revenue", "budget", "direction", "strategy",
      "déploiement", "organisation", "management", "manage",
    ]) * 3 + 5);
    score += mgmtScore;
    reasons.push(`Scope management détecté (${mgmtScore}/20)`);
  } else {
    rejections.push("Pas de scope management détecté");
  }

  // 5. Secteurs compatibles (10 points)
  if (target.sectors.length > 0) {
    const full = `${title} ${description}`;
    const matched = target.sectors.filter((s) => clean(full).includes(clean(s)));
    if (matched.length > 0) {
      const sectorScore = Math.min(10, matched.length * 5);
      score += sectorScore;
      reasons.push(`Secteur(s) : ${matched.join(", ")} (${sectorScore}/10)`);
    }
  }

  // 6. Bonus expérience / seniorité (10 points)
  if (target.yearsExp && target.yearsExp >= 15) {
    score += 10;
    reasons.push("Expérience senior (10/10)");
  } else if (target.yearsExp && target.yearsExp >= 10) {
    score += 5;
  }

  // Décision
  const locPriority = classifyLocation(location).priority;
  score = Math.min(100, score);
  const shouldKeep = score >= 55;

  return {
    shouldKeep,
    relevanceScore: score,
    reasons,
    rejectionReasons: rejections,
    locationPriority: locPriority,
  };
}

/**
 * Applique le filtre profil à une liste d'offres brutes.
 * Retourne les offres gardées et les statistiques de rejet.
 */
export interface BatchFilterResult {
  kept: Array<{
    title: string;
    company: string;
    location?: string;
    relevanceScore: number;
    reasons: string[];
    locationPriority: 1 | 2 | 3 | 4;
  }>;
  rejected: number;
  rejectedReasons: Record<string, number>;
}

export function batchFilterJobs(
  jobs: Array<{ title: string; description: string; location?: string | null; company?: string | null }>,
  target: TargetProfile,
): BatchFilterResult {
  const kept: BatchFilterResult["kept"] = [];
  let rejected = 0;
  const rejectedReasons: Record<string, number> = {};

  for (const job of jobs) {
    const result = filterJobForTargetProfile(
      job.title || "",
      job.description || "",
      job.location,
      target,
    );

    if (result.shouldKeep) {
      kept.push({
        title: job.title,
        company: job.company || "",
        location: job.location || undefined,
        relevanceScore: result.relevanceScore,
        reasons: result.reasons,
        locationPriority: result.locationPriority,
      });
    } else {
      rejected++;
      for (const r of result.rejectionReasons) {
        rejectedReasons[r] = (rejectedReasons[r] || 0) + 1;
      }
    }
  }

  return { kept, rejected, rejectedReasons };
}
