/*
 * PRSTO — Text Sanitizer
 *
 * Pure functions (no DB, no network). Testable unitairement.
 * Nettoie les sorties IA de tout Markdown, placeholders et artefacts.
 */

/* ─── Sanitize generated content ──────────── */

const PLACEHOLDERS = [
  "[Adresse]", "[Téléphone]", "[Telephone]", "[Email]", "[LinkedIn]", "[Linkedin]",
  "[Ville]", "[Code Postal]", "[Date]", "[Nom]", "[Prénom]", "[Prenom]",
  "[Société]", "[Entreprise]", "[Poste]", "[Salaire]",
];

const CABINET_KEYWORDS = [
  /cabinet\s+(?:de\s+)?recrutement/i,
  /executive\s+search/i,
  /chasseur\s+(?:de\s+)?têtes?/i,
  /head\s*hunter/i,
  /recruitment\s+(?:agency|firm|consultant)/i,
  /consulting\s+rh/i,
  /intérim/i,
  /interim/i,
  /portage\s+salarial/i,
];

export interface SanitizerWarnings {
  markdownRemoved: boolean;
  placeholdersRemoved: string[];
  cleaned: boolean;
}

export function cleanGeneratedApplicationText(text: string): { text: string; warnings: SanitizerWarnings } {
  if (!text) return { text: "", warnings: { markdownRemoved: false, placeholdersRemoved: [], cleaned: false } };

  const warnings: SanitizerWarnings = { markdownRemoved: false, placeholdersRemoved: [], cleaned: true };
  let result = text;

  // 1. Supprimer les blocs ``` code
  if (result.includes("```")) {
    result = result.replace(/```[a-z]*\n[\s\S]*?\n```/g, "").replace(/```[a-z]*/g, "");
    warnings.markdownRemoved = true;
  }

  // 2. Supprimer les titres Markdown ###, ##, #
  if (/^#{1,3}\s/gm.test(result)) {
    result = result.replace(/^#{1,3}\s/gm, "");
    warnings.markdownRemoved = true;
  }

  // 3. Supprimer les **gras**
  if (/\*\*[^*]+\*\*/.test(result)) {
    result = result.replace(/\*\*([^*]+)\*\*/g, "$1");
    warnings.markdownRemoved = true;
  }

  // 4. Supprimer les *italiques*
  if (/\*[^*]+\*/.test(result)) {
    result = result.replace(/\*([^*]+)\*/g, "$1");
    warnings.markdownRemoved = true;
  }

  // 5. Supprimer les --- séparateurs
  if (/^---+$/gm.test(result)) {
    result = result.replace(/^---+$/gm, "");
    warnings.markdownRemoved = true;
  }

  // 6. Supprimer les listes Markdown "- " en début de ligne
  if (/^- /gm.test(result)) {
    result = result.replace(/^- /gm, "• ");
    warnings.markdownRemoved = true;
  }

  // 7. Supprimer les placeholders
  for (const ph of PLACEHOLDERS) {
    if (result.includes(ph)) {
      result = result.replace(new RegExp(ph.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "");
      warnings.placeholdersRemoved.push(ph);
    }
  }

  // 8. Supprimer les textes d'absence inventés par l'IA
  const fakeSectionTexts = [
    "Non renseigné", "Aucune certification mentionnée", "Aucune certification",
    "Aucune formation", "Pas de certification", "Pas de formation",
    "Non spécifié", "Non disponible", "N/A", "Aucune expérience mentionnée",
    "Aucune langue mentionnée",
  ];
  for (const fake of fakeSectionTexts) {
    if (result.includes(fake)) {
      // Supprimer toute la ligne contenant ce texte
      const lines = result.split("\n");
      result = lines.filter((l) => !l.trim().toLowerCase().includes(fake.toLowerCase())).join("\n");
      if (!warnings.placeholdersRemoved.includes(fake)) warnings.placeholdersRemoved.push(fake);
    }
    // Supprimer le mot en tant que titre de section suivi de rien
    const sectionPattern = new RegExp(`^${fake.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "gim");
    if (sectionPattern.test(result)) {
      result = result.replace(sectionPattern, "");
      warnings.placeholdersRemoved.push(fake);
    }
  }

  // 9. Nettoyer les tirets longs décoratifs
  result = result.replace(/[—–]{3,}/g, "—");

  // 9. Réduire les espaces multiples
  if (/ {3,}/.test(result)) {
    result = result.replace(/ {3,}/g, "  ");
  }

  // 10. Réduire les lignes vides excessives (>2 consécutives)
  result = result.replace(/\n{3,}/g, "\n\n");

  // 11. Nettoyer les signatures avec ponctuation bizarre
  result = result.replace(/--+\s*$/gm, "");
  result = result.replace(/^[-–—]{2,}\s*$/gm, "");

  // 12. Supprimer les espaces en début et fin
  result = result.trim();

  return { text: result, warnings };
}

/* ─── Detect cabinet de recrutement ────────── */

export function isCabinetRecrutement(text: string): boolean {
  return CABINET_KEYWORDS.some((re) => re.test(text));
}

/* ─── Clean imported job text ──────────────── */

export function cleanImportedJobText(rawText: string): string {
  if (!rawText) return "";

  let cleaned = rawText;

  // Supprimer les lignes parasites LinkedIn/Indeed
  const noisePatterns = [
    /^.*\b(?:cookies|privacy|terms|conditions|policy|accept|decline)\b.*$/gim,
    /^.*\b(?:sign in|log in|register|join now|apply now|easy apply|save|share|follow)\b.*$/gim,
    /^.*\b(?:people also viewed|similar jobs|recommended for you|more searches)\b.*$/gim,
    /^.*\b(?:formations exclusives|offres similaires|vous pourriez aussi|voir plus)\b.*$/gim,
    /^.*\b(?:© \d{4}|all rights reserved|powered by)\b.*$/gim,
    /^.*\b(?:report this job|job alert|email me jobs|create alert)\b.*$/gim,
    /^.*\b(?:seniority level|employment type|job function|industries)\b[:\s]*$/gim,
    /^.*\b(?:notifications|messaging|network|my items|premium)\b.*$/gim,
    /^.*\b(?:referral|employee referral|hiring manager)\b.*$/gim,
    // LinkedIn UI artifacts
    /^.*\b(?:LinkedIn|LinkedIn Corporation)\b.*$/gim,
    /^.*\b(?:©|All rights reserved|conditions générales)\b.*$/gim,
    // Indeed UI artifacts
    /^.*\b(?:Indeed|© Indeed|Employer|Active|Posted)\b.*$/gim,
  ];

  for (const pattern of noisePatterns) {
    cleaned = cleaned.replace(pattern, "");
  }

  // Supprimer les lignes trop courtes (artefacts UI)
  cleaned = cleaned.split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      if (trimmed.length < 3) return false;
      if (/^\d{1,2}\s*(?:minutes|hours|days?|weeks?)\s*ago$/i.test(trimmed)) return false;
      if (/^\d+\s*(?:applicants?|candidats?)$/i.test(trimmed)) return false;
      return true;
    })
    .join("\n");

  // Réduire les lignes vides excessives
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim();

  return cleaned;
}

/* ─── Parse imported job ───────────────────── */

export interface ParsedImportedJob {
  title: string;
  company: string;
  location: string;
  sector: string;
  description: string;
  requirements: string;
  salary: string;
  contractType: string;
  sourceName: string;
  isCabinet: boolean;
  quality: "good" | "partial" | "weak";
  qualityIssues: string[];
}

export function parseImportedJobText(rawText: string, sourceUrl?: string): ParsedImportedJob {
  const cleaned = cleanImportedJobText(rawText);
  const qualityIssues: string[] = [];

  // Détection plateforme
  let sourceName = "Import manuel";
  if (sourceUrl?.includes("linkedin.com")) sourceName = "LinkedIn";
  else if (sourceUrl?.includes("indeed.com")) sourceName = "Indeed";
  else if (sourceUrl?.includes("apec.fr")) sourceName = "APEC";

  const isCabinet = sourceName !== "Import manuel" ? false : isCabinetRecrutement(cleaned);

  // Extraire le titre (première ligne significative)
  const lines = cleaned.split("\n").filter((l) => l.trim().length > 5);
  let title = lines[0]?.trim() || "";
  // Si le titre contient "|" ou "—" avec trop de contexte, couper
  const pipeSep = title.indexOf("|");
  const dashSep = title.indexOf("—");
  if (dashSep > 30) title = title.slice(0, dashSep).trim();
  else if (pipeSep > 30) title = title.slice(0, pipeSep).trim();
  title = title.slice(0, 200);

  // Détection entreprise
  const companyPatterns = [
    /(?:chez|at|entreprise|company|société|recruteur\s*[:]?)\s+([A-ZÀ-ÿ][A-Za-zÀ-ÿ0-9\s&\.\-]{2,50})/i,
    /([A-ZÀ-ÿ][A-Za-zÀ-ÿ0-9\s&\.\-]{3,50})\s*(?:recrute|recherche|hiring|is looking|—)/i,
  ];
  let company = "";
  for (const p of companyPatterns) {
    const m = p.exec(cleaned);
    if (m?.[1]) { company = m[1].trim(); break; }
  }
  // Si pas trouvé par les regex, utiliser la 2e ligne
  if (!company && lines.length > 1) {
    const candidate = lines[1]?.trim() || "";
    if (candidate.length >= 2 && !/(?:H\/F|F\/H|CDI|CDD|Stage|Manager|Directeur|Responsable|Chef)/i.test(candidate)) {
      company = candidate.slice(0, 200);
    }
  }

  // Détection localisation
  const locMatch = cleaned.match(/(?:Paris|Lyon|Marseille|Bordeaux|Nantes|Lille|Toulouse|Nice|Strasbourg|Montpellier|Rennes|Remote|Télétravail|Full.remote|France|Europe|International)/gi);
  const location = locMatch ? [...new Set(locMatch)].join(", ").slice(0, 200) : "";

  // Détection secteur (première mention après "secteur" ou "industry")
  const sectorMatch = cleaned.match(/(?:secteur|industry|domaine)\s*[:;]\s*([A-Za-zÀ-ÿ\s&,]{3,60})/i);
  const sector = sectorMatch?.[1]?.trim().slice(0, 100) || "";

  // Séparer description et requirements
  const reqSplit = cleaned.search(/(?:profil recherché|requirements?|qualifications?|compétences? requises?|your profile|what we'?re looking for|about you|ce que nous recherchons)/i);
  let description = cleaned;
  let requirements = "";
  if (reqSplit > 0) {
    description = cleaned.slice(0, reqSplit).trim();
    requirements = cleaned.slice(reqSplit).trim().slice(0, 3000);
  }

  // Détection salaire
  const salMatch = cleaned.match(/(?:salaire|salary|rémunération|package|compensation)\s*[:;]?\s*(?:de\s+)?([\d\s.,]*[kK€EUR]?\s*(?:[–\-àto]+\s*[\d\s.,]*[kK€EUR]?)?)/i);
  const salary = salMatch?.[1]?.trim() || "";

  // Détection contrat
  let contractType = "";
  if (/CDI/i.test(cleaned)) contractType = "CDI";
  else if (/CDD/i.test(cleaned)) contractType = "CDD";
  else if (/Freelance|Indépendant|Consultant/i.test(cleaned)) contractType = "Freelance";
  else if (/Stage/i.test(cleaned)) contractType = "Stage";

  // Évaluation qualité
  if (!title) qualityIssues.push("Titre manquant");
  if (!company) qualityIssues.push("Entreprise non détectée");
  if (cleaned.length < 300) qualityIssues.push("Description trop courte (< 300 caractères)");
  if (cleaned.length < 1500 && cleaned.length >= 300) qualityIssues.push("Description partielle");
  const quality: "good" | "partial" | "weak" = qualityIssues.length === 0 ? "good"
    : qualityIssues.length <= 2 ? "partial" : "weak";

  return {
    title,
    company,
    location,
    sector,
    description: description.slice(0, 5000),
    requirements: requirements.slice(0, 3000),
    salary,
    contractType,
    sourceName,
    isCabinet,
    quality,
    qualityIssues,
  };
}

/**
 * Détecte le contenu stale / échec de génération dans un texte.
 * Les fallbacks locaux (buildLocalResume/buildLocalLetter) ne produisent jamais "Échec",
 * donc tout texte contenant ces marqueurs est un artefact d'avant V2.7.3.
 */
export function isStaleContent(text: string | null | undefined): boolean {
  if (!text || text.length < 5) return false;
  return /(?:^|\s)Échec(?:\s|$)/i.test(text);
}
