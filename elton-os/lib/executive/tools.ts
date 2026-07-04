/**
 * PRSTO Executive Tools — Shared library
 * =====================================
 * Better than Rezi because:
 * - Executive-grade prompts (board-ready tone, P&L scope, C-suite signals)
 * - Multi-language (FR/EN/ES) — Rezi is EN only
 * - 35 ATS checkpoints (vs 23 at Rezi) with executive-specific criteria
 * - Industry-aware (private equity, board, C-suite reporting)
 *
 * Used by:
 * - /api/tools/resume-checker
 * - /api/tools/bullet-writer
 * - /api/tools/summary-generator
 * - /api/tools/cover-letter
 * - /api/tools/resignation-letter
 * - /api/tools/resume-agent
 */

// ─── Executive title detection ─────────────────────────────
export const EXECUTIVE_TITLES = [
  // FR
  "directeur général", "dg", "président", "ceo", "cfo", "coo", "cto", "cmo",
  "directeur financier", "directeur opérationnel", "directeur technique",
  "directeur marketing", "directeur commercial", "directeur industriel",
  "directeur rh", "directeur juridique", "directeur sinistres",
  "directeur conformité", "directeur risque", "directeur audit",
  "directeur transformation", "directeur digital", "directeur data",
  "directeur supply chain", "directeur industrie", "directeur production",
  "directeur qualité", "directeur achats", "directeur projet",
  "country manager", "managing director", "general manager",
  "vice-président", "vp", "senior vice president", "svp", "evp",
  "directeur de zone", "directeur région", "directeur filiale",
  "directeur pays", "directeur europe", "directeur amériques",
  "directeur asie", "directeur emea", "directeur apac",
  "associé", "partner", "associé gérant", "gérant",
  "directeur stratégie", "chief strategy officer", "csio",
  "chief digital officer", "cdo", "chief data officer",
  "chief risk officer", "cro", "chief compliance officer",
  "chief human resources officer", "chro",
  // Add more as needed
] as const;

export function isExecutiveContent(text: string): boolean {
  const lower = text.toLowerCase();
  return EXECUTIVE_TITLES.some((t) => lower.includes(t));
}

// ─── Industry vertical detection ────────────────────────────
export const INDUSTRY_SIGNALS: Record<string, string[]> = {
  "Private Equity / VC": ["private equity", "venture", "lbo", "mbo", "leverage", "fund", "portfolio company", "gp", "lp"],
  "Banque / Assurance": ["banque", "assurance", "banking", "insurance", "crédit", "rating", "bâle", "solvency"],
  "Industrie": ["industrie", "manufacturing", "production", "usine", "lean", "six sigma", "supply chain", "industrie 4.0"],
  "Tech / SaaS": ["saas", "cloud", "api", "platform", "scale-up", "series a", "series b", "arr", "mrr", "churn"],
  "Retail / Distribution": ["retail", "distribution", "omnicanal", "e-commerce", "supply", "logistique"],
  "Pharma / Santé": ["pharma", "santé", "medical", "clinical", "regulatory", "fda", "ema", "ansm"],
  "Énergie": ["énergie", "energy", "oil", "gas", "renewable", "solar", "wind", "transition énergétique"],
  "Conseil": ["consulting", "conseil", "strategy", "mckinsey", "bcg", "bain", "big 4", "due diligence"],
  "Telecom / Media": ["telecom", "média", "broadcast", "content", "streaming", "5g", "fiber"],
  "Public / Public-Parapublic": ["ministère", "fonction publique", "service public", "etat", "collectivité"],
};

export function detectIndustries(text: string): string[] {
  const lower = text.toLowerCase();
  return Object.entries(INDUSTRY_SIGNALS)
    .filter(([_, keywords]) => keywords.some((k) => lower.includes(k)))
    .map(([name]) => name);
}

// ─── Quantified achievement detection ───────────────────────
export function detectQuantifiedAchievements(text: string): {
  count: number;
  samples: string[];
  hasRevenueImpact: boolean;
  hasTeamSize: boolean;
  hasPnL: boolean;
} {
  const lines = text.split(/[\n•·|\-\u2022]/).map((l) => l.trim()).filter(Boolean);

  // Patterns: €X, $X, X M€, X%, X K€, X millions, X milliards, X personnes, X collaborateurs
  const numberPattern = /(\d[\d\s.,]*)\s*(m€|k€|€|mds|millions?|milliards?| billions?|%|M\b|bn\b|k\b|\$|euros?|dollars?|personnes?|collaborateurs?|salariés?|employés?|clients?|pays|régions?|filiales?)/i;

  const matched = lines.filter((l) => numberPattern.test(l));
  const samples = matched.slice(0, 5);

  const hasRevenueImpact = /(\d[\d\s.,]*)\s*(m€|k€|€|mds|millions?|milliards?|billions?|\$|euros?|dollars?|arr|mrr|ca|chiffre d'affaires|revenue|ebitda|ebit)/i.test(text);
  const hasTeamSize = /(\d[\d\s.,]*)\s*(personnes?|collaborateurs?|salariés?|employés?|reports?|directs?|indirects?)/i.test(text);
  const hasPnL = /(p&l|profit and loss|compte de résultat|résultat opérationnel|ebitda|ebit|marge|profitabilité)/i.test(text);

  return {
    count: matched.length,
    samples,
    hasRevenueImpact,
    hasTeamSize,
    hasPnL,
  };
}

// ─── 35 ATS checkpoints (executive-grade) ───────────────────
// Better than Rezi's 23 — adds 12 executive-specific criteria
export interface CheckpointResult {
  id: string;
  category: "format" | "structure" | "content" | "executive" | "ats";
  label: string;
  status: "pass" | "warn" | "fail";
  score: number; // 0-100
  message: string;
  recommendation?: string;
  weight: number; // importance multiplier
}

export const CHECKPOINT_CATEGORIES = {
  format: { label: "Format", icon: "FileText", color: "#3B82F6" },
  structure: { label: "Structure", icon: "List", color: "#8B5CF6" },
  content: { label: "Contenu", icon: "AlignLeft", color: "#10B981" },
  executive: { label: "Signaux exécutifs", icon: "Crown", color: "#F59E0B" },
  ats: { label: "Compatibilité ATS", icon: "ScanLine", color: "#EF4444" },
} as const;

// ─── Language detection ─────────────────────────────────────
export function detectLanguage(text: string): "fr" | "en" | "es" | "other" {
  const lower = text.toLowerCase();
  const frSignals = [" le ", " la ", " les ", " des ", " une ", " et ", " dans ", " pour ", " avec ", " expérience ", " directeur "];
  const enSignals = [" the ", " and ", " of ", " to ", " in ", " for ", " with ", " experience ", " director ", " management "];
  const esSignals = [" el ", " la ", " los ", " las ", " y ", " de ", " para ", " con ", " experiencia ", " director "];

  const frCount = frSignals.filter((s) => lower.includes(s)).length;
  const enCount = enSignals.filter((s) => lower.includes(s)).length;
  const esCount = esSignals.filter((s) => lower.includes(s)).length;

  if (frCount >= enCount && frCount >= esCount && frCount > 0) return "fr";
  if (esCount > enCount && esCount > 0) return "es";
  if (enCount > 0) return "en";
  return "other";
}

// ─── IA generation helper (Z.AI primary, DeepSeek fallback) ─
export async function generateExecutiveContent(params: {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  language?: "fr" | "en" | "es";
}): Promise<{ success: boolean; content?: string; error?: string; provider?: string }> {
  // Try Z.AI first (more reliable)
  try {
    const { generateWithZai } = await import("@/lib/ai/zai-client");
    const result = await generateWithZai({
      systemPrompt: params.systemPrompt,
      userPrompt: params.userPrompt,
      timeout: 45000,
    });
    if (result.success && result.content) {
      return { success: true, content: result.content, provider: "zai" };
    }
  } catch (e) {
    console.error("[executive-tools] ZAI failed:", e);
  }

  // Fallback: DeepSeek (NVIDIA NIM)
  try {
    const { generateWithDeepSeek } = await import("@/lib/ai/deepseek");
    const result = await generateWithDeepSeek({
      systemPrompt: params.systemPrompt,
      userPrompt: params.userPrompt,
      maxTokens: params.maxTokens || 2000,
      timeout: 45000,
    });
    if (result.success && result.content) {
      return { success: true, content: result.content, provider: "deepseek" };
    }
    return { success: false, error: result.error || "DeepSeek failed" };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

// ─── 35-point ATS analysis (no IA, pure rules engine) ──────
// This is faster + cheaper than asking IA, and more reliable.
// IA is used only for the executive-grade recommendations.
export function analyzeResume35Points(text: string): CheckpointResult[] {
  const results: CheckpointResult[] = [];
  const lower = text.toLowerCase();
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  // ═══ FORMAT (6 points) ═══
  results.push({
    id: "fmt_length",
    category: "format",
    label: "Longueur du CV (1-2 pages pour exec)",
    status: wordCount < 300 ? "fail" : wordCount > 1200 ? "warn" : "pass",
    score: wordCount < 300 ? 20 : wordCount > 1200 ? 60 : 100,
    message: `${wordCount} mots détectés. Cible executive: 400-900 mots (1-2 pages).`,
    recommendation: wordCount < 300 ? "Ajouter plus de détail sur les réalisations" : wordCount > 1200 ? "Condenser en 2 pages max" : undefined,
    weight: 1.2,
  });

  results.push({
    id: "fmt_no_tables",
    category: "format",
    label: "Absence de tableaux (cassent l'ATS)",
    status: /\|.*\|.*\|.*\|/.test(text) ? "fail" : "pass",
    score: /\|.*\|.*\|.*\|/.test(text) ? 0 : 100,
    message: /\|.*\|.*\|.*\|/.test(text) ? "Tableaux détectés — l'ATS ne parse pas correctement" : "Aucun tableau, ATS-friendly",
    recommendation: /\|.*\|.*\|.*\|/.test(text) ? "Remplacer les tableaux par des listes à puces" : undefined,
    weight: 1.5,
  });

  results.push({
    id: "fmt_no_images",
    category: "format",
    label: "Absence d'images/photos",
    status: /\[image|photo|\.png|\.jpg|\.jpeg/i.test(text) ? "warn" : "pass",
    score: /\[image|photo|\.png|\.jpg|\.jpeg/i.test(text) ? 50 : 100,
    message: /\[image|photo|\.png|\.jpg|\.jpeg/i.test(text) ? "Images détectées — ignorées par l'ATS" : "Aucune image, ATS-friendly",
    weight: 1.0,
  });

  results.push({
    id: "fmt_no_special_chars",
    category: "format",
    label: "Pas de caractères spéciaux exotiques",
    status: /[★◆●▲■✓✔→➤]/.test(text) ? "warn" : "pass",
    score: /[★◆●▲■✓✔→➤]/.test(text) ? 60 : 100,
    message: /[★◆●▲■✓✔→➤]/.test(text) ? "Caractères spéciaux détectés — peuvent corrompre l'extraction ATS" : "Caractères standards, ATS-friendly",
    recommendation: /[★◆●▲■✓✔→➤]/.test(text) ? "Remplacer par des puces standards (- ou •)" : undefined,
    weight: 0.8,
  });

  results.push({
    id: "fmt_section_caps",
    category: "format",
    label: "Titres de sections en MAJUSCULES",
    status: /EXPERIENCE|EXPÉRIENCE|FORMATION|COMPÉTENCES|SKILLS|EDUCATION/.test(text) ? "pass" : "warn",
    score: /EXPERIENCE|EXPÉRIENCE|FORMATION|COMPÉTENCES|SKILLS|EDUCATION/.test(text) ? 100 : 60,
    message: /EXPERIENCE|EXPÉRIENCE|FORMATION|COMPÉTENCES|SKILLS|EDUCATION/.test(text) ? "Titres en majuscules détectés — bonne pratique ATS" : "Titres de sections non standardisés",
    recommendation: /EXPERIENCE|EXPÉRIENCE|FORMATION|COMPÉTENCES|SKILLS|EDUCATION/.test(text) ? undefined : "Mettre les titres de sections en MAJUSCULES",
    weight: 0.7,
  });

  results.push({
    id: "fmt_contact_block",
    category: "format",
    label: "Bloc de contact (email + téléphone)",
    status: /@/.test(text) && /(\+|\d{2}[\s\.]?\d{2})/.test(text) ? "pass" : "fail",
    score: /@/.test(text) && /(\+|\d{2}[\s\.]?\d{2})/.test(text) ? 100 : 30,
    message: /@/.test(text) && /(\+|\d{2}[\s\.]?\d{2})/.test(text) ? "Email + téléphone détectés" : "Coordonnées de contact incomplètes",
    recommendation: !(/@/.test(text) && /(\+|\d{2}[\s\.]?\d{2})/.test(text)) ? "Ajouter email professionnel + téléphone" : undefined,
    weight: 1.3,
  });

  // ═══ STRUCTURE (8 points) ═══
  const hasSummary = /profil|summary|à propos|about|profil professionnel/i.test(text);
  results.push({
    id: "str_summary",
    category: "structure",
    label: "Section Profil / Summary",
    status: hasSummary ? "pass" : "fail",
    score: hasSummary ? 100 : 20,
    message: hasSummary ? "Section profil détectée" : "Aucune section profil/summary — essentielle pour un exec",
    recommendation: !hasSummary ? "Ajouter une section 'PROFIL' de 3-5 lignes en haut du CV" : undefined,
    weight: 1.4,
  });

  const hasExperience = /expérience|experience|parcours|career/i.test(text);
  results.push({
    id: "str_experience",
    category: "structure",
    label: "Section Expérience",
    status: hasExperience ? "pass" : "fail",
    score: hasExperience ? 100 : 0,
    message: hasExperience ? "Section expérience détectée" : "Aucune section expérience",
    recommendation: !hasExperience ? "Ajouter une section 'EXPÉRIENCE PROFESSIONNELLE'" : undefined,
    weight: 1.8,
  });

  const hasEducation = /formation|education|diplôme|diploma|degree|école|school|university|université/i.test(text);
  results.push({
    id: "str_education",
    category: "structure",
    label: "Section Formation",
    status: hasEducation ? "pass" : "warn",
    score: hasEducation ? 100 : 50,
    message: hasEducation ? "Section formation détectée" : "Aucune section formation — attendue pour un exec",
    recommendation: !hasEducation ? "Ajouter une section 'FORMATION'" : undefined,
    weight: 0.9,
  });

  const hasSkills = /compétences|skills|expertise|domaines/i.test(text);
  results.push({
    id: "str_skills",
    category: "structure",
    label: "Section Compétences",
    status: hasSkills ? "pass" : "warn",
    score: hasSkills ? 100 : 60,
    message: hasSkills ? "Section compétences détectée" : "Aucune section compétences",
    recommendation: !hasSkills ? "Ajouter une section 'COMPÉTENCES CLÉS'" : undefined,
    weight: 0.8,
  });

  const hasLanguages = /langues|languages|bilingue|fluent|courant|toeic|toefl|cervantès/i.test(text);
  results.push({
    id: "str_languages",
    category: "structure",
    label: "Section Langues (international)",
    status: hasLanguages ? "pass" : "warn",
    score: hasLanguages ? 100 : 50,
    message: hasLanguages ? "Section langues détectée — atout international" : "Aucune section langues — attendue pour un exec international",
    recommendation: !hasLanguages ? "Ajouter une section 'LANGUES' (FR/EN/ES minimum)" : undefined,
    weight: 0.7,
  });

  const hasBulletPoints = /[•\-–]/.test(text);
  results.push({
    id: "str_bullets",
    category: "structure",
    label: "Puces pour les réalisations",
    status: hasBulletPoints ? "pass" : "warn",
    score: hasBulletPoints ? 100 : 50,
    message: hasBulletPoints ? "Puces détectées — bonne lisibilité" : "Pas de puces — texte brut moins lisible",
    weight: 0.8,
  });

  const hasDates = /(19|20)\d{2}|janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre|january|february|march|april|may|june|july|august|september|october|november|december/i.test(text);
  results.push({
    id: "str_dates",
    category: "structure",
    label: "Dates d'emploi lisibles",
    status: hasDates ? "pass" : "fail",
    score: hasDates ? 100 : 30,
    message: hasDates ? "Dates détectées — bonne chronologie" : "Aucune date lisible",
    weight: 1.2,
  });

  const hasCompanyNames = lines.filter((l) => /[A-Z][a-zA-Z&]+\s*(S\.A\.|SA|SAS|Group|Groupe|Inc|Ltd|GmbH|Corp)?/.test(l)).length >= 2;
  results.push({
    id: "str_companies",
    category: "structure",
    label: "Noms d'entre identifiables",
    status: hasCompanyNames ? "pass" : "warn",
    score: hasCompanyNames ? 100 : 60,
    message: hasCompanyNames ? "Noms d'entreprises détectés" : "Noms d'entre peu visibles",
    weight: 0.9,
  });

  // ═══ CONTENT (8 points) ═══
  const quant = detectQuantifiedAchievements(text);
  results.push({
    id: "cnt_quantified",
    category: "content",
    label: "Réalisations chiffrées (3+ attendues)",
    status: quant.count >= 3 ? "pass" : quant.count >= 1 ? "warn" : "fail",
    score: Math.min(100, quant.count * 25),
    message: `${quant.count} réalisation(s) chiffrée(s) détectée(s). Cible exec: 3+ par poste.`,
    recommendation: quant.count < 3 ? "Ajouter des métriques: %, M€, nombre de personnes, pays, etc." : undefined,
    weight: 1.8,
  });

  results.push({
    id: "cnt_revenue",
    category: "content",
    label: "Impact financier mentionné",
    status: quant.hasRevenueImpact ? "pass" : "warn",
    score: quant.hasRevenueImpact ? 100 : 40,
    message: quant.hasRevenueImpact ? "Impact financier mentionné — signal fort" : "Aucun impact chiffré (CA, EBITDA, marge)",
    recommendation: !quant.hasRevenueImpact ? "Ajouter des montants: 'CA de X M€', 'EBITDA +Y%'" : undefined,
    weight: 1.5,
  });

  results.push({
    id: "cnt_team_size",
    category: "content",
    label: "Taille d'équipe mentionnée",
    status: quant.hasTeamSize ? "pass" : "warn",
    score: quant.hasTeamSize ? 100 : 40,
    message: quant.hasTeamSize ? "Taille d'équipe mentionnée" : "Aucune mention de la taille d'équipe managée",
    recommendation: !quant.hasTeamSize ? "Préciser: 'Management de X personnes (Y directs, Z indirects)'" : undefined,
    weight: 1.3,
  });

  results.push({
    id: "cnt_pnl",
    category: "content",
    label: "P&L / responsabilité financière",
    status: quant.hasPnL ? "pass" : "warn",
    score: quant.hasPnL ? 100 : 40,
    message: quant.hasPnL ? "Responsabilité P&L mentionnée" : "Aucune mention de P&L, EBITDA, marge — attendu pour un exec",
    recommendation: !quant.hasPnL ? "Préciser la responsabilité financière: 'P&L de X M€', 'EBITDA +Y%'" : undefined,
    weight: 1.4,
  });

  // Action verbs
  const actionVerbs = ["dirigé", "piloté", "transformé", "créé", "lancé", "optimisé", "structuré", "industrialisé", "négocié", "accompagné", "managed", "led", "built", "launched", "transformed", "drove", "spearheaded", "architected", "scaled", "delivered"];
  const verbCount = actionVerbs.filter((v) => lower.includes(v)).length;
  results.push({
    id: "cnt_action_verbs",
    category: "content",
    label: "Verbes d'action forts",
    status: verbCount >= 5 ? "pass" : verbCount >= 2 ? "warn" : "fail",
    score: Math.min(100, verbCount * 15),
    message: `${verbCount} verbe(s) d'action fort(s) détecté(s). Cible: 5+.`,
    recommendation: verbCount < 5 ? "Utiliser: dirigé, piloté, transformé, lancé, optimisé..." : undefined,
    weight: 1.1,
  });

  // No first person
  const firstPersonCount = (text.match(/\bje\s+\w+/gi) || []).length;
  results.push({
    id: "cnt_no_first_person",
    category: "content",
    label: "Pas de 'je' (ton exec impersonnel)",
    status: firstPersonCount === 0 ? "pass" : firstPersonCount <= 3 ? "warn" : "fail",
    score: firstPersonCount === 0 ? 100 : Math.max(20, 100 - firstPersonCount * 15),
    message: `${firstPersonCount} occurrence(s) de 'je'. Style exec: impersonnel.`,
    recommendation: firstPersonCount > 0 ? "Remplacer 'j'ai dirigé' par 'Dirigé' (forme implicative)" : undefined,
    weight: 0.9,
  });

  // No typos (basic check on common confusions)
  const typoPatterns = [/est\s+une\s+[a-z]+\s+avec/i, /donc\s+qui/i, /cela\s+dit\s+que/i, /je\s+suis\s+un/i];
  const typoCount = typoPatterns.filter((p) => p.test(lower)).length;
  results.push({
    id: "cnt_no_typos",
    category: "content",
    label: "Absence de fautes basiques",
    status: typoCount === 0 ? "pass" : "warn",
    score: typoCount === 0 ? 100 : 60,
    message: typoCount === 0 ? "Aucune faute basique détectée" : `${typoCount} pattern(s) suspect(s)`,
    weight: 1.0,
  });

  // LinkedIn URL
  const hasLinkedIn = /linkedin\.com\/in\//i.test(text);
  results.push({
    id: "cnt_linkedin",
    category: "content",
    label: "Lien LinkedIn",
    status: hasLinkedIn ? "pass" : "warn",
    score: hasLinkedIn ? 100 : 60,
    message: hasLinkedIn ? "Lien LinkedIn détecté" : "Pas de lien LinkedIn — attendu pour un exec",
    recommendation: !hasLinkedIn ? "Ajouter votre URL LinkedIn dans le bloc contact" : undefined,
    weight: 0.7,
  });

  // ═══ EXECUTIVE SIGNALS (10 points) — ce qui différencie PRSTO de Rezi ═══
  // Ces checks n'existent pas chez Rezi car ils ne ciblent pas les execs

  const isExec = isExecutiveContent(text);
  results.push({
    id: "exe_title",
    category: "executive",
    label: "Titre exécutif présent (DG/CFO/COO/CMO/CTO/CMO/Country Manager)",
    status: isExec ? "pass" : "fail",
    score: isExec ? 100 : 30,
    message: isExec ? "Titre exécutif détecté" : "Aucun titre exécutif reconnu",
    recommendation: !isExec ? "Clarifier le titre: 'Directeur Général', 'CFO', 'Country Manager'..." : undefined,
    weight: 1.7,
  });

  // Board / governance signals
  const hasBoard = /comité de direction|codir|comité exécutif|comex|board|conseil d'administration|board of directors|governance/i.test(text);
  results.push({
    id: "exe_board",
    category: "executive",
    label: "Signaux gouvernance (CoDir / Board / Comex)",
    status: hasBoard ? "pass" : "warn",
    score: hasBoard ? 100 : 40,
    message: hasBoard ? "Gouvernance mentionnée (CoDir/Board/Comex)" : "Aucune mention de gouvernance — attendu pour un exec",
    recommendation: !hasBoard ? "Préciser: 'Membre du CoDir', 'Rapport au Board', 'Présentation au Comex'" : undefined,
    weight: 1.2,
  });

  // International scope
  const hasInternational = /international|global|monde|europe|emea|apac|amériques|asie|pays|région|filiale|subsidiary/i.test(text);
  results.push({
    id: "exe_international",
    category: "executive",
    label: "Portée internationale",
    status: hasInternational ? "pass" : "warn",
    score: hasInternational ? 100 : 50,
    message: hasInternational ? "Portée internationale mentionnée" : "Aucune mention internationale",
    recommendation: !hasInternational ? "Préciser: 'Périmètre X pays', 'Zone EMEA', 'Filiale Y'" : undefined,
    weight: 1.1,
  });

  // M&A / transformations
  const hasMA = /acquisition|fusion|intégration|merger|acquisition|turnaround|transformation|restructuration|croissance externe|M&A/i.test(text);
  results.push({
    id: "exe_ma",
    category: "executive",
    label: "M&A / transformation (signal fort exec)",
    status: hasMA ? "pass" : "warn",
    score: hasMA ? 100 : 50,
    message: hasMA ? "Opération M&A / transformation mentionnée" : "Aucune mention M&A / transformation",
    recommendation: !hasMA ? "Si pertinent: mentionner acquisitions, fusions, restructurations menées" : undefined,
    weight: 1.0,
  });

  // Stakeholders (board / investors / regulators)
  const hasStakeholders = /investisseurs|actionnaires|fonds|board|comité d'audit|régulateur|autorité|stakeholder|shareholder/i.test(text);
  results.push({
    id: "exe_stakeholders",
    category: "executive",
    label: "Parties prenantes stratégiques",
    status: hasStakeholders ? "pass" : "warn",
    score: hasStakeholders ? 100 : 50,
    message: hasStakeholders ? "Parties prenantes stratégiques mentionnées" : "Aucune mention investors/board/régulateurs",
    recommendation: !hasStakeholders ? "Préciser: 'Reporting aux investisseurs', 'Présentation au Board'" : undefined,
    weight: 0.9,
  });

  // Strategy signals
  const hasStrategy = /stratégie|strategic|business plan|plan stratégique|vision|roadmap|feuille de route|5 ans|3 ans/i.test(text);
  results.push({
    id: "exe_strategy",
    category: "executive",
    label: "Vision stratégique",
    status: hasStrategy ? "pass" : "warn",
    score: hasStrategy ? 100 : 50,
    message: hasStrategy ? "Signaux stratégiques détectés" : "Aucune mention de stratégie / vision",
    recommendation: !hasStrategy ? "Ajouter: 'Définition de la stratégie 3 ans', 'Plan stratégique'" : undefined,
    weight: 1.0,
  });

  // Industry vertical
  const industries = detectIndustries(text);
  results.push({
    id: "exe_industry",
    category: "executive",
    label: "Secteur d'expertise identifiable",
    status: industries.length >= 1 ? "pass" : "warn",
    score: industries.length >= 1 ? 100 : 50,
    message: industries.length >= 1 ? `Secteur(x) détecté(s): ${industries.join(", ")}` : "Aucun secteur clair",
    weight: 0.8,
  });

  // Education tier
  const hasTopSchool = /hec|essec|essec|escp|polytechnique|xa|ens|insead|harvard|stanford|mit|wharton|columbia|london business school|imd|imd|esade|ie business/i.test(text);
  results.push({
    id: "exe_education_tier",
    category: "executive",
    label: "École tier-1 (HEC/INSEAD/Polytechnique...)",
    status: hasTopSchool ? "pass" : "warn",
    score: hasTopSchool ? 100 : 60,
    message: hasTopSchool ? "École tier-1 détectée" : "École non reconnue comme tier-1 (ou non mentionnée)",
    recommendation: !hasTopSchool ? "Si applicable, mentionner le nom de l'école" : undefined,
    weight: 0.7,
  });

  // Certifications
  const hasCertifications = /mba|cfa|chartered|cpa|acca|six sigma|pmp|certif/i.test(text);
  results.push({
    id: "exe_certifications",
    category: "executive",
    label: "Certifications (MBA/CFA/...)",
    status: hasCertifications ? "pass" : "warn",
    score: hasCertifications ? 100 : 60,
    message: hasCertifications ? "Certifications détectées" : "Aucune certification mentionnée",
    weight: 0.6,
  });

  // Awards / recognition
  const hasAwards = /prix|award|récompense|distinction|nominé|élu|best|top|forbes|capital|challenges/i.test(text);
  results.push({
    id: "exe_awards",
    category: "executive",
    label: "Reconnaissance / prix",
    status: hasAwards ? "pass" : "warn",
    score: hasAwards ? 100 : 70,
    message: hasAwards ? "Reconnaissance mentionnée" : "Aucune mention de prix/récompense",
    weight: 0.5,
  });

  // ═══ ATS COMPATIBILITY (3 points) ═══
  // Check for ATS-breaking patterns
  const hasColumns = /\t.*\t.*\t/.test(text) || (text.split("\n")[0] || "").split(/\s{2,}/).length > 3;
  results.push({
    id: "ats_no_columns",
    category: "ats",
    label: "Pas de colonnes multiples",
    status: hasColumns ? "warn" : "pass",
    score: hasColumns ? 50 : 100,
    message: hasColumns ? "Colonnes détectées — l'ATS lit en linéaire" : "Mise en page linéaire, ATS-friendly",
    weight: 1.3,
  });

  // Headers/footers (we can't detect reliably from text, assume OK)
  results.push({
    id: "ats_no_headers_footers",
    category: "ats",
    label: "Pas d'infos dans en-têtes/pieds de page",
    status: "pass",
    score: 90,
    message: "Vérification manuelle: ne placez pas d'infos clés dans en-têtes/pieds de page",
    weight: 0.6,
  });

  // Standard section names
  const standardSections = ["expérience", "experience", "formation", "education", "compétences", "skills", "profil", "summary"].filter((s) => lower.includes(s));
  results.push({
    id: "ats_standard_sections",
    category: "ats",
    label: "Noms de sections standards",
    status: standardSections.length >= 3 ? "pass" : standardSections.length >= 1 ? "warn" : "fail",
    score: Math.min(100, standardSections.length * 25),
    message: `${standardSections.length} section(s) standard(s) détectée(s)`,
    recommendation: standardSections.length < 3 ? "Utiliser: EXPÉRIENCE, FORMATION, COMPÉTENCES, PROFIL" : undefined,
    weight: 1.0,
  });

  return results;
}

// ─── Compute global score ───────────────────────────────────
export function computeGlobalScore(results: CheckpointResult[]): {
  global: number;
  byCategory: Record<string, { score: number; passed: number; warned: number; failed: number }>;
} {
  const totalWeight = results.reduce((sum, r) => sum + r.weight, 0);
  const weightedSum = results.reduce((sum, r) => sum + r.score * r.weight, 0);
  const global = Math.round(weightedSum / totalWeight);

  const byCategory: Record<string, { score: number; passed: number; warned: number; failed: number }> = {};
  for (const r of results) {
    if (!byCategory[r.category]) {
      byCategory[r.category] = { score: 0, passed: 0, warned: 0, failed: 0 };
    }
    if (r.status === "pass") byCategory[r.category].passed++;
    if (r.status === "warn") byCategory[r.category].warned++;
    if (r.status === "fail") byCategory[r.category].failed++;
  }

  // Compute category scores
  for (const cat of Object.keys(byCategory)) {
    const catResults = results.filter((r) => r.category === cat);
    const catWeight = catResults.reduce((s, r) => s + r.weight, 0);
    const catSum = catResults.reduce((s, r) => s + r.score * r.weight, 0);
    byCategory[cat].score = Math.round(catSum / catWeight);
  }

  return { global, byCategory };
}
