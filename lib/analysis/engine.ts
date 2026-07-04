// ─── PRSTO – Moteur d'analyse heuristique ───
// Fonctionne sans clé API. Tout est local, explicable, anti-hallucination.

import { prisma } from "@/lib/prisma";

// ─── Types ─────────────────────────────────────────────────

export interface JobRequirements {
  roleDetected: string;
  seniority: string;
  responsibilities: string[];
  mandatoryRequirements: string[];
  optionalRequirements: string[];
  salesSkills: string[];
  managementSkills: string[];
  strategicSkills: string[];
  languages: { lang: string; level: string; required: boolean }[];
  internationalDimension: boolean;
  tools: string[];
  sector: string;
  atsKeywords: string[];
  leadershipSignals: string[];
  plSignals: string[];
  transformationSignals: string[];
  risks: string[];
  ambiguityPoints: string[];
  urgency: string;
  salaryIndicated: string | null;
}

export interface CandidateSnapshot {
  fullName: string;
  title: string;
  summary: string;
  yearsExp: number;
  languages: string[];
  sectors: string[];
  functions: string[];
  mobility: string;
  email: string;
  phone: string;
  linkedin: string;
  location: string;
  targetSalary: string;
  skills: { name: string; category: string; level: string }[];
  experiences: {
    company: string; title: string; sector: string; country: string;
    description: string; teamSize: string; revenue: string; budget: string;
    achievements: string[];
  }[];
  proofEntries: { category: string; title: string; value: string; context: string }[];
  cvText: string;
  priorityRoles: string[];
  targetCountries: string[];
}

export interface MatchResult {
  confirmedMatches: { requirement: string; proof: string; source: string }[];
  partialMatches: { requirement: string; evidence: string; gap: string }[];
  gaps: { requirement: string; severity: "critical" | "important" | "minor" }[];
  risks: { description: string; level: "high" | "medium" | "low" }[];
  overqualificationSignals: string[];
  underqualificationSignals: string[];
  strongestProofs: { category: string; proof: string }[];
  missingProofs: string[];
}

export interface ExecutiveScore {
  globalScore: number;
  atsScore: number;
  businessFitScore: number;
  salesLeadershipScore: number;
  executiveSeniorityScore: number;
  internationalFitScore: number;
  languageFitScore: number;
  sectorFitScore: number;
  compensationFitScore: number;
  locationFitScore: number;
  networkStrategyScore: number;
  riskScore: number;
}

export interface AnalysisReport {
  id?: string;
  opportunityId: string;
  summary: string;
  requirements: JobRequirements;
  match: MatchResult;
  score: ExecutiveScore;
  recommendedStrategy: string;
  priority: "HIGH" | "MEDIUM" | "LOW" | "AVOID";
  keywordsAts: string[];
  exigences: string[];
  pointsForts: string[];
  gaps: string[];
  risks: string[];
  matchDetails: Record<string, unknown>;
  aiModel: string;
}

// ─── Pondérations ──────────────────────────────────────────

const WEIGHTS = {
  businessFit: 0.20,
  leadership: 0.20,
  businessResults: 0.15,
  international: 0.15,
  seniority: 0.10,
  sector: 0.08,
  location: 0.05,
  ats: 0.05,
  compensation: 0.02,
};

// ─── Lexiques de détection ─────────────────────────────────

const FRENCH_TITLES = [
  "directeur commercial", "directeur national des ventes", "directeur général",
  "country manager", "general manager", "head of sales", "directeur export",
  "directeur business unit", "directeur régional", "chief revenue officer",
  "vice president sales", "directeur développement", "directeur marché",
  "responsable commercial", "chef des ventes", "directeur d'agence",
];

const ENGLISH_TITLES = [
  "sales director", "national sales director", "general manager", "country manager",
  "head of sales", "export director", "business unit director", "regional director",
  "chief revenue officer", "cro", "vp sales", "vice president sales",
  "market director", "sales manager", "branch director",
];

const LEADERSHIP_TERMS = [
  "management", "manager", "diriger", "piloter", "encadrer", "animer", "superviser",
  "lead", "équipe", "team", "coach", "mentor", "développer les talents",
  "transformation", "restructuration", "réorganisation", "fusion", "acquisition",
  "croissance", "growth", "scale", "déploiement", "expansion",
  "p&l", "profit", "loss", "budget", "ca", "chiffre d'affaires", "revenue",
  "résultat", "ebitda", "marge", "rentabilité",
];

const SALES_SKILLS_KEYWORDS = [
  "négociation", "négociation", "prospection", "closing", "signature",
  "grand compte", "key account", "pipeline", "forecast", "crm", "salesforce",
  "hubspot", "business development", "développement commercial",
  "conquête", "fidélisation", "rétention", "upsell", "cross-sell",
  "distribution", "réseau", "partenaire", "revendeur", "canal",
];

const MANAGEMENT_SKILLS_KEYWORDS = [
  "management", "leadership", "animation", "coaching", "recrutement",
  "onboarding", "évaluation", "performance", "kpi", "objectif",
  "organisation", "restructuration", "process", "méthodologie",
];

const STRATEGIC_SKILLS_KEYWORDS = [
  "stratégie", "stratégie", "vision", "roadmap", "plan stratégique",
  "business plan", "business model", "go-to-market", "gtm",
  "positionnement", "différenciation", "avantage concurrentiel",
  "innovation", "disruption", "transformation", "digitalisation",
  "due diligence", "m&a", "fusion", "intégration", "alliance",
];

const LANGUAGES_MAP: Record<string, string[]> = {
  fr: ["français", "french", "francophone", "bilingue français"],
  en: ["anglais", "english", "anglophone", "bilingue anglais", "fluent english", "business english"],
  es: ["espagnol", "spanish", "hispanophone"],
  de: ["allemand", "german", "germanophone"],
  it: ["italien", "italian"],
  pt: ["portugais", "portuguese"],
  nl: ["néerlandais", "dutch", "flamand"],
};

const TOOLS_LIST = [
  "salesforce", "hubspot", "pipedrive", "zoho", "dynamics 365", "sap",
  "oracle", "tableau", "power bi", "looker", "excel", "google analytics",
  "linkedin sales navigator", "outreach", "salesloft", "marketo",
  "hubspot crm", "monday", "notion", "slack", "teams", "zoom",
];

const SECTORS = [
  "industrie", "manufacturing", "santé", "healthcare", "pharma", "pharmaceutique",
  "tech", "saas", "logiciel", "software", "it", "digital", "e-commerce",
  "retail", "distribution", "finance", "banque", "assurance", "banking",
  "énergie", "energy", "telecom", "construction", "btp", "automobile",
  "luxe", "cosmétique", "agroalimentaire", "food", "logistique",
  "conseil", "consulting", "services", "média", "media",
];

const CRM_TOOLS = [
  "salesforce", "hubspot", "pipedrive", "zoho crm", "dynamics 365", "sap crm",
  "oracle crm", "sugar crm", "freshsales", "copper", "nimble",
];

// ─── Helpers ───────────────────────────────────────────────

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsAny(text: string, keywords: string[]): string[] {
  const norm = normalize(text);
  return keywords.filter(kw => norm.includes(normalize(kw)));
}

function scoreRatio(found: number, total: number): number {
  if (total === 0) return 50;
  return Math.round((found / total) * 100);
}

// ─── Extract Job Requirements ──────────────────────────────

export function extractJobRequirements(rawText: string): JobRequirements {
  const text = rawText || "";
  const norm = normalize(text);

  // Détection du rôle
  const allTitles = [...FRENCH_TITLES, ...ENGLISH_TITLES];
  const foundTitles = containsAny(text, allTitles);
  const roleDetected = foundTitles[0] || "Non détecté";

  // Séniorité
  let seniority = "middle";
  if (/directeur|director|vp|vice president|chief|general manager|country manager/i.test(text)) {
    seniority = "executive";
  } else if (/head of|senior|lead|principal|confirmé/i.test(text)) {
    seniority = "senior";
  }

  // Responsabilités extraites
  const responsibilities: string[] = [];
  // Extraction par lignes de tirets
  const bulletLines = text.match(/[•\-\*]\s*(.+?)(?:\n|$)/g);
  if (bulletLines) {
    bulletLines.slice(0, 15).forEach(line => {
      const cleaned = line.replace(/^[•\-\*\s]+/, "").trim();
      if (cleaned.length > 10 && cleaned.length < 300) responsibilities.push(cleaned);
    });
  }

  // Exigences obligatoires
  const mandatoryKeywords = [
    "expérience", "experience", "minimum", "au moins", "obligatoire", "required",
    "indispensable", "must have", "essentiel", "imprératif",
  ];
  const mandatoryLines = text.split(/\n|•|\*|-/).filter(line =>
    mandatoryKeywords.some(kw => line.toLowerCase().includes(kw))
  );
  const mandatoryRequirements = mandatoryLines.slice(0, 10).map(l => l.trim().slice(0, 200));

  // Exigences souhaitées
  const optionalKeywords = ["souhaité", "plus", "atout", "nice to have", "idéalement", "apprécié", "bonus"];
  const optionalLines = text.split(/\n|•|\*|-/).filter(line =>
    optionalKeywords.some(kw => line.toLowerCase().includes(kw))
  );
  const optionalRequirements = optionalLines.slice(0, 8).map(l => l.trim().slice(0, 200));

  // Compétences par catégorie
  const salesSkills = containsAny(text, SALES_SKILLS_KEYWORDS);
  const managementSkills = containsAny(text, MANAGEMENT_SKILLS_KEYWORDS);
  const strategicSkills = containsAny(text, STRATEGIC_SKILLS_KEYWORDS);

  // Langues
  const languages: { lang: string; level: string; required: boolean }[] = [];
  for (const [code, keywords] of Object.entries(LANGUAGES_MAP)) {
    const found = keywords.filter(kw => norm.includes(normalize(kw)));
    if (found.length > 0) {
      const level = norm.includes("bilingue") || norm.includes("fluent") || norm.includes("courant")
        ? "C1/C2" : norm.includes("professionnel") || norm.includes("business") ? "B2" : "B1";
      const required = mandatoryRequirements.some(r =>
        keywords.some(kw => normalize(r).includes(normalize(kw)))
      );
      languages.push({ lang: code, level, required });
    }
  }

  // International
  const internationalTerms = [
    "international", "europe", "global", "multiculturel", "multilingue",
    "export", "filiale", "étranger", "abroad", "worldwide", "plusieurs pays",
  ];
  const internationalDimension = internationalTerms.some(t => norm.includes(t));

  // Outils
  const tools = containsAny(text, TOOLS_LIST);

  // Secteur
  const sectorsFound = containsAny(text, SECTORS);
  const sector = sectorsFound[0] || "Non spécifié";

  // ATS Keywords
  const atsKeywords = [
    ...foundTitles.slice(0, 2),
    ...salesSkills.slice(0, 3),
    ...managementSkills.slice(0, 3),
    ...strategicSkills.slice(0, 2),
    ...tools.slice(0, 2),
    ...sectorsFound.slice(0, 1),
    ...languages.map(l => LANGUAGES_MAP[l.lang]?.[0]).filter(Boolean),
  ].slice(0, 20);

  // Signaux
  const leadershipSignals = containsAny(text, LEADERSHIP_TERMS);
  const plSignals = containsAny(text, ["p&l", "ebitda", "budget", "ca", "chiffre d'affaires", "revenue", "marge", "rentabilité", "résultat"]);
  const transformationSignals = containsAny(text, ["transformation", "restructuration", "réorganisation", "croissance", "scale", "expansion"]);

  // Risques
  const risks: string[] = [];
  if (text.length < 200) risks.push("Offre très courte — informations limitées");
  if (!/salaire|rémunération|salary|compensation|package/i.test(text)) risks.push("Aucune information de rémunération");
  if (foundTitles.length === 0) risks.push("Rôle non clairement identifié");
  if (responsibilities.length < 3) risks.push("Peu de responsabilités listées");
  if (mandatoryRequirements.length === 0) risks.push("Exigences non explicitées");
  if (norm.includes("startup") && norm.includes("créer")) risks.push("Poste de création — risque structurel");

  // Ambiguïtés
  const ambiguityPoints: string[] = [];
  if (/négociable|selon profil|selon expérience|competitive/i.test(text)) ambiguityPoints.push("Rémunération non précisée");
  if (/possibilité|peut être|évolutif/i.test(text)) ambiguityPoints.push("Périmètre du poste flou");

  // Urgence
  let urgency = "standard";
  if (/urgent|immédiat|asap|dès que possible|disponibilité immédiate/i.test(text)) urgency = "high";
  if (/pour septembre|pour janvier|pour le \w+ prochain/i.test(text)) urgency = "planned";

  // Salaire
  const salaryMatch = text.match(/(\d{2,3}[kK]?[\s\-]*[àa]?\s*\d{2,3}[kK]?)/);
  const salaryIndicated = salaryMatch?.[1] || null;

  return {
    roleDetected, seniority, responsibilities, mandatoryRequirements, optionalRequirements,
    salesSkills, managementSkills, strategicSkills, languages, internationalDimension,
    tools, sector, atsKeywords: [...new Set(atsKeywords)],
    leadershipSignals, plSignals, transformationSignals, risks, ambiguityPoints,
    urgency, salaryIndicated,
  };
}

// ─── Compare Candidate to Job ──────────────────────────────

export function compareCandidateToJob(reqs: JobRequirements, candidate: CandidateSnapshot): MatchResult {
  const confirmedMatches: MatchResult["confirmedMatches"] = [];
  const partialMatches: MatchResult["partialMatches"] = [];
  const gaps: MatchResult["gaps"] = [];
  const risks: MatchResult["risks"] = [];
  const overqualificationSignals: string[] = [];
  const underqualificationSignals: string[] = [];
  const strongestProofs: MatchResult["strongestProofs"] = [];
  const missingProofs: string[] = [];

  const candidateAllText = normalize([
    candidate.summary, candidate.title,
    ...candidate.experiences.map(e => `${e.title} ${e.description || ""} ${e.achievements?.join(" ") || ""}`),
    candidate.cvText || "",
  ].join(" "));

  // Vérifier exigences obligatoires
  for (const req of mandatoryRequirementsToSkills(reqs)) {
    const normReq = normalize(req);
    const matchedSkill = candidate.skills.find(s => normReq.includes(normalize(s.name)) || normalize(s.name).includes(normReq));
    const inCV = candidateAllText.includes(normReq);

    if (matchedSkill) {
      const proof = candidate.proofEntries.find(p => normalize(p.title).includes(normReq) || normalize(p.value).includes(normReq));
      confirmedMatches.push({
        requirement: req,
        proof: proof ? `${proof.title}: ${proof.value}` : `Compétence ${matchedSkill.name} (${matchedSkill.level})`,
        source: proof ? "proof_vault" : "cv_master",
      });
    } else if (inCV) {
      partialMatches.push({ requirement: req, evidence: "Mentionné dans le CV", gap: "Pas de compétence formalisée" });
    } else {
      gaps.push({ requirement: req, severity: "important" });
    }
  }

  // Langues
  for (const langReq of reqs.languages) {
    const candidateLang = candidate.languages.find(l =>
      normalize(l).includes(normalize(langReq.lang)) ||
      (langReq.lang === "fr" && normalize(l).includes("francais")) ||
      (langReq.lang === "en" && normalize(l).includes("anglais"))
    );
    if (candidateLang) {
      confirmedMatches.push({ requirement: `Langue: ${langReq.lang} (${langReq.level})`, proof: candidateLang, source: "profil" });
    } else if (langReq.required) {
      gaps.push({ requirement: `Langue: ${langReq.lang} (${langReq.level})`, severity: "critical" });
    }
  }

  // Secteur
  if (reqs.sector !== "Non spécifié") {
    const sectorMatch = candidate.sectors.some(s => normalize(s).includes(normalize(reqs.sector)) || normalize(reqs.sector).includes(normalize(s)));
    if (sectorMatch) {
      confirmedMatches.push({ requirement: `Secteur: ${reqs.sector}`, proof: `Expérience en ${reqs.sector}`, source: "profil" });
    } else {
      partialMatches.push({ requirement: `Secteur: ${reqs.sector}`, evidence: "Compétences transférables", gap: "Pas d'expérience directe dans ce secteur" });
    }
  }

  // International
  if (reqs.internationalDimension) {
    const hasInternational = candidate.experiences.some(e => e.country && e.country !== "France") ||
      candidate.languages.length >= 3;
    if (hasInternational) {
      confirmedMatches.push({ requirement: "Dimension internationale", proof: "Expérience multi-pays", source: "experiences" });
    } else {
      gaps.push({ requirement: "Dimension internationale", severity: "important" });
    }
  }

  // Leadership & séniorité
  if (reqs.seniority === "executive" && candidate.yearsExp < 10) {
    underqualificationSignals.push(`Séniorité exécutive demandée mais ${candidate.yearsExp} ans d'expérience`);
  }
  if (reqs.seniority === "middle" && candidate.yearsExp > 15) {
    overqualificationSignals.push(`Poste middle management pour un profil ${candidate.yearsExp}+ ans`);
  }

  // Outils
  for (const tool of reqs.tools) {
    if (candidateAllText.includes(normalize(tool))) {
      confirmedMatches.push({ requirement: `Outil: ${tool}`, proof: `Maîtrise de ${tool}`, source: "cv_master" });
    } else if (CRM_TOOLS.some(crm => normalize(tool).includes(normalize(crm)))) {
      const hasOtherCRM = CRM_TOOLS.some(crm => candidateAllText.includes(normalize(crm)));
      if (hasOtherCRM) {
        partialMatches.push({ requirement: `Outil: ${tool}`, evidence: "Expérience CRM", gap: `${tool} spécifiquement` });
      } else {
        gaps.push({ requirement: `Outil: ${tool}`, severity: "minor" });
      }
    }
  }

  // Proof Vault — preuves fortes
  for (const proof of candidate.proofEntries) {
    if (proof.category === "CA" || proof.category === "croissance" || proof.category === "équipe" || proof.category === "P&L") {
      strongestProofs.push({ category: proof.category, proof: `${proof.title}: ${proof.value}` });
    }
  }

  // Preuves manquantes
  const requiredCategories = ["CA", "croissance", "équipe", "P&L", "ouverture_marché"];
  for (const cat of requiredCategories) {
    if (!candidate.proofEntries.some(p => p.category === cat)) {
      missingProofs.push(cat);
    }
  }

  // Risques globaux
  if (gaps.filter(g => g.severity === "critical").length >= 2) {
    risks.push({ description: "Plusieurs compétences critiques manquantes", level: "high" });
  }
  if (overqualificationSignals.length >= 2) {
    risks.push({ description: "Risque de surqualification — le poste peut être perçu comme un step-down", level: "medium" });
  }

  return {
    confirmedMatches, partialMatches, gaps, risks,
    overqualificationSignals, underqualificationSignals,
    strongestProofs, missingProofs,
  };
}

// ─── Calculate Executive Match Score ────────────────────────

export function calculateExecutiveMatchScore(
  reqs: JobRequirements,
  candidate: CandidateSnapshot,
  match: MatchResult
): ExecutiveScore {
  const totalMandatory = reqs.mandatoryRequirements.length || 1;
  const mandatoryMet = match.confirmedMatches.filter(m =>
    reqs.mandatoryRequirements.some(r => normalize(r).includes(normalize(m.requirement)))
  ).length;

  // ATS Score — keyword match
  const atsMet = reqs.atsKeywords.filter(kw => {
    const allText = [candidate.cvText, candidate.summary, ...candidate.experiences.map(e => e.description || "")].join(" ");
    return normalize(allText).includes(normalize(kw));
  }).length;
  const atsScore = scoreRatio(atsMet, reqs.atsKeywords.length || 1);

  // Business Fit — sector + mandatory match
  const businessFitScore = Math.round((mandatoryMet / totalMandatory) * 70 + (reqs.sector !== "Non spécifié" ? 30 : 0));

  // Sales Leadership — sales + management skills
  const salesMet = match.confirmedMatches.filter(m =>
    reqs.salesSkills.some(s => normalize(m.requirement).includes(normalize(s)))
  ).length;
  const mgmtMet = match.confirmedMatches.filter(m =>
    reqs.managementSkills.some(s => normalize(m.requirement).includes(normalize(s)))
  ).length;
  const salesLeadershipScore = scoreRatio(salesMet + mgmtMet, (reqs.salesSkills.length + reqs.managementSkills.length) || 1);

  // Executive Seniority
  let executiveSeniorityScore = 50;
  if (reqs.seniority === "executive" && candidate.yearsExp >= 15) executiveSeniorityScore = 90;
  else if (reqs.seniority === "executive" && candidate.yearsExp >= 10) executiveSeniorityScore = 75;
  else if (reqs.seniority === "senior" && candidate.yearsExp >= 8) executiveSeniorityScore = 85;
  else if (reqs.seniority === "middle" && candidate.yearsExp >= 5) executiveSeniorityScore = 80;
  else if (candidate.yearsExp < 5) executiveSeniorityScore = 30;

  // International Fit
  let internationalFitScore = 50;
  if (!reqs.internationalDimension) {
    internationalFitScore = 80;
  } else {
    const intlExp = candidate.experiences.filter(e => e.country && e.country !== "France").length;
    if (intlExp >= 3 && candidate.languages.length >= 3) internationalFitScore = 95;
    else if (intlExp >= 1 && candidate.languages.length >= 2) internationalFitScore = 80;
    else if (intlExp >= 1) internationalFitScore = 65;
    else internationalFitScore = 35;
  }

  // Language Fit
  let languageFitScore = 50;
  if (reqs.languages.length === 0) {
    languageFitScore = 85;
  } else {
    const codeToName: Record<string, string[]> = {
      fr: ["francais", "français"],
      en: ["anglais", "english"],
      es: ["espagnol", "spanish"],
      de: ["allemand", "german"],
      it: ["italien", "italian"],
      pt: ["portugais", "portuguese"],
      nl: ["neerlandais", "néerlandais", "dutch"],
    };
    const langsMet = reqs.languages.filter(lr => {
      const names = codeToName[lr.lang] || [lr.lang];
      return candidate.languages.some(cl =>
        names.some(n => normalize(cl).includes(n) || normalize(cl).includes(lr.lang))
      );
    }).length;
    const langsRequired = reqs.languages.filter(l => l.required).length;
    if (langsRequired === 0) languageFitScore = 85;
    else if (langsMet >= langsRequired) languageFitScore = 90;
    else languageFitScore = Math.round((langsMet / Math.max(langsRequired, 1)) * 100);
  }

  // Sector Fit
  let sectorFitScore = 50;
  if (reqs.sector === "Non spécifié") {
    sectorFitScore = 75;
  } else {
    const sectorMatch = candidate.sectors.some(s => normalize(s).includes(normalize(reqs.sector)));
    if (sectorMatch) sectorFitScore = 90;
    else {
      const relatedExp = candidate.experiences.some(e =>
        e.sector && (normalize(e.sector).includes(normalize(reqs.sector)) || normalize(reqs.sector).includes(normalize(e.sector)))
      );
      sectorFitScore = relatedExp ? 65 : 35;
    }
  }

  // Compensation Fit
  let compensationFitScore = 50;
  if (!reqs.salaryIndicated && !candidate.targetSalary) {
    compensationFitScore = 70;
  } else {
    compensationFitScore = 65; // Sans parsing précis, neutre
  }

  // Location Fit
  let locationFitScore = 50;
  if (candidate.mobility) {
    const mobility = normalize(candidate.mobility);
    if (mobility.includes("international") || mobility.includes("monde")) locationFitScore = 90;
    else if (mobility.split(",").length >= 3) locationFitScore = 80;
    else if (mobility.length > 5) locationFitScore = 70;
  }

  // Network Strategy Score — basé sur Proof Vault + CV qualité
  let networkStrategyScore = 50;
  const proofCount = candidate.proofEntries.length;
  const strongProofs = match.strongestProofs.length;
  if (proofCount >= 10 && strongProofs >= 4) networkStrategyScore = 90;
  else if (proofCount >= 5 && strongProofs >= 2) networkStrategyScore = 75;
  else if (proofCount >= 3) networkStrategyScore = 60;

  // Risk Score — inversé : plus de gaps = score plus bas
  const gapPenalty = match.gaps.filter(g => g.severity === "critical").length * 10 +
    match.gaps.filter(g => g.severity === "important").length * 5;
  const riskScore = Math.max(10, 80 - gapPenalty);

  // Global Score — pondéré
  const globalScore = Math.round(
    businessFitScore * WEIGHTS.businessFit +
    salesLeadershipScore * WEIGHTS.leadership +
    networkStrategyScore * WEIGHTS.businessResults +
    internationalFitScore * WEIGHTS.international +
    executiveSeniorityScore * WEIGHTS.seniority +
    sectorFitScore * WEIGHTS.sector +
    locationFitScore * WEIGHTS.location +
    atsScore * WEIGHTS.ats +
    compensationFitScore * WEIGHTS.compensation
  );

  return {
    globalScore: Math.min(100, Math.max(0, globalScore)),
    atsScore, businessFitScore, salesLeadershipScore,
    executiveSeniorityScore, internationalFitScore, languageFitScore,
    sectorFitScore, compensationFitScore, locationFitScore,
    networkStrategyScore, riskScore,
  };
}

// ─── Strategy ──────────────────────────────────────────────

export function generateRecommendedStrategy(score: ExecutiveScore, match: MatchResult): { strategy: string; priority: "HIGH" | "MEDIUM" | "LOW" | "AVOID" } {
  const criticalGaps = match.gaps.filter(g => g.severity === "critical").length;

  let strategy: string;
  let priority: "HIGH" | "MEDIUM" | "LOW" | "AVOID";

  if (score.globalScore >= 80 && criticalGaps === 0) {
    strategy = "CANDIDATURE_DIRECTE";
    priority = "HIGH";
  } else if (score.globalScore >= 65 && criticalGaps <= 1) {
    strategy = "CANDIDATURE_PLUS_MESSAGE_RECRUTEUR";
    priority = "HIGH";
  } else if (score.globalScore >= 50 && criticalGaps <= 2) {
    strategy = "APPROCHE_RESEAU_AVANT";
    priority = "MEDIUM";
  } else if (score.globalScore >= 35) {
    strategy = "CABINET_RECRUTEMENT";
    priority = "LOW";
  } else if (score.globalScore >= 20) {
    strategy = "CANDIDATURE_SPONTANEE";
    priority = "LOW";
  } else {
    strategy = "EVITER";
    priority = "AVOID";
  }

  return { strategy, priority };
}

// ─── Utilitaires ───────────────────────────────────────────

function mandatoryRequirementsToSkills(reqs: JobRequirements): string[] {
  if (reqs.mandatoryRequirements.length > 0) return reqs.mandatoryRequirements;
  // Fallback: extraire des compétences des responsabilités
  return reqs.responsibilities.slice(0, 8);
}

export function extractAtsKeywords(reqs: JobRequirements): string[] {
  return reqs.atsKeywords;
}

export function detectRisksAndGaps(reqs: JobRequirements, match: MatchResult): { risks: string[]; gaps: string[] } {
  return {
    risks: [...reqs.risks, ...match.risks.map(r => r.description)],
    gaps: match.gaps.map(g => `${g.requirement} [${g.severity}]`),
  };
}

export function summarizeJobOffer(rawText: string, reqs: JobRequirements): string {
  const sentences = rawText.replace(/\n/g, " ").split(/[.!?]+/).filter(s => s.trim().length > 20);
  const summaryParts: string[] = [];

  if (reqs.roleDetected && reqs.roleDetected !== "Non détecté") {
    summaryParts.push(`Poste de ${reqs.roleDetected}`);
  }
  if (reqs.sector !== "Non spécifié") {
    summaryParts.push(`dans le secteur ${reqs.sector}`);
  }
  if (reqs.seniority === "executive") summaryParts.push("— niveau direction générale");
  if (reqs.internationalDimension) summaryParts.push("avec dimension internationale");
  if (reqs.languages.length > 0) {
    summaryParts.push(`(${reqs.languages.map(l => l.lang.toUpperCase()).join(", ")} requis)`);
  }
  if (reqs.salaryIndicated) summaryParts.push(`— ${reqs.salaryIndicated}`);

  if (summaryParts.length === 0 && sentences.length > 0) {
    return sentences.slice(0, 3).join(". ") + ".";
  }

  return summaryParts.join(" ") + ".";
}

// ─── API principale : analyse complète ─────────────────────

export async function buildCandidateSnapshot(): Promise<CandidateSnapshot | null> {
  const profile = await prisma.profile.findFirst({
    include: {
      skills: true,
      experiences: true,
      proofEntries: { where: { usableForCV: true } },
      cvMaster: true,
    },
  });
  if (!profile) return null;

  const priorityRoles = await prisma.priorityRole.findMany({ where: { active: true } });
  const targetCountries = await prisma.targetCountry.findMany({ where: { active: true } });

  return {
    fullName: profile.fullName,
    title: profile.title,
    summary: profile.summary,
    email: profile.email || "",
    phone: profile.phone || "",
    linkedin: profile.linkedin || "",
    yearsExp: profile.yearsExp || 0,
    languages: safeJsonParse(profile.languages),
    sectors: safeJsonParse(profile.sectors),
    functions: safeJsonParse(profile.functions),
    mobility: profile.mobility || "",
    location: profile.location || "",
    targetSalary: profile.targetSalary || "",
    skills: profile.skills.map(s => ({ name: s.name, category: s.category, level: s.level })),
    experiences: profile.experiences.map(e => ({
      company: e.company, title: e.title, sector: e.sector || "",
      country: e.country || "", description: e.description || "",
      teamSize: e.teamSize || "", revenue: e.revenue || "", budget: e.budget || "",
      achievements: safeJsonParse(e.achievements),
    })),
    proofEntries: profile.proofEntries.map(p => ({
      category: p.category, title: p.title, value: p.value, context: p.context || "",
    })),
    cvText: profile.cvMaster?.originalText || "",
    priorityRoles: priorityRoles.map(r => r.name),
    targetCountries: targetCountries.map(c => c.name),
  };
}

export function runFullAnalysis(rawText: string, candidate: CandidateSnapshot): AnalysisReport {
  const requirements = extractJobRequirements(rawText);
  const match = compareCandidateToJob(requirements, candidate);
  const score = calculateExecutiveMatchScore(requirements, candidate, match);
  const { strategy, priority } = generateRecommendedStrategy(score, match);
  const { risks, gaps } = detectRisksAndGaps(requirements, match);
  const summary = summarizeJobOffer(rawText, requirements);

  return {
    opportunityId: "",
    summary,
    requirements,
    match,
    score,
    recommendedStrategy: strategy,
    priority,
    keywordsAts: requirements.atsKeywords,
    exigences: requirements.mandatoryRequirements,
    pointsForts: match.confirmedMatches.map(m => m.requirement),
    gaps,
    risks,
    matchDetails: {
      confirmedCount: match.confirmedMatches.length,
      partialCount: match.partialMatches.length,
      gapCount: match.gaps.length,
      strongestProofs: match.strongestProofs,
      overqualified: match.overqualificationSignals,
    },
    aiModel: "PRSTO Heuristic Engine v1.0",
  };
}

function safeJsonParse(input: string | null | undefined): string[] {
  if (!input) return [];
  try { return JSON.parse(input); } catch { return input.split(",").map(s => s.trim()).filter(Boolean); }
}
