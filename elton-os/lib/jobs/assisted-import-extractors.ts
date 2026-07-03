/**
 * PRSTO V2.7.2 — Assisted Import Extractors.
 *
 * Pure functions: no DOM access, no network, no browser APIs.
 * Process fixture text to simulate what the extension extracts from the DOM.
 *
 * The actual extension injects content scripts that capture the DOM.
 * These functions mirror the extraction logic for testing and preview.
 */

import { createHash } from "crypto";

/** Hash a URL to a fixed-length unique string for externalId. */
export function hashUrlForExternalId(url: string): string {
  return createHash("sha256").update(url).digest("base64url").slice(0, 32);
}

import type { ImportedJob } from "./types";

/* ─── Platform detection ────────────────────── */

export function detectPlatformFromUrl(url: string): string {
  const host = (url || "").toLowerCase();
  if (host.includes("linkedin.com")) return "linkedin";
  if (host.includes("indeed.com")) return "indeed";
  if (host.includes("apec.fr")) return "apec";
  if (host.includes("greenhouse.io")) return "greenhouse";
  if (host.includes("lever.co")) return "lever";
  if (host.includes("ashbyhq.com")) return "ashby";
  if (host.includes("smartrecruiters.com")) return "smartrecruiters";
  if (host.includes("workable.com")) return "workable";
  if (host.includes("cadremploi.fr")) return "cadremploi";
  if (host.includes("hellowork.com")) return "hellowork";
  if (host.includes("welcometothejungle.com")) return "wttj";
  if (host.includes("michaelpage.fr")) return "michaelpage";
  return "generic";
}

export function platformLabel(platform: string): string {
  const map: Record<string, string> = {
    linkedin: "LinkedIn",
    indeed: "Indeed",
    apec: "APEC",
    greenhouse: "Greenhouse",
    lever: "Lever",
    ashby: "Ashby",
    smartrecruiters: "SmartRecruiters",
    workable: "Workable",
    cadremploi: "Cadremploi",
    hellowork: "HelloWork",
    wttj: "Welcome to the Jungle",
    michaelpage: "Michael Page",
    generic: "Page carrière",
  };
  return map[platform] || platform;
}

/* ─── Confidence scoring ────────────────────── */

export interface ExtractionConfidence {
  score: number; // 0–100
  presentCount: number;
  totalFields: number;
  details: Record<string, boolean>;
}

const REQUIRED_FIELDS = ["title", "company", "description"] as const;
const OPTIONAL_FIELDS = ["location", "applicationUrl", "salaryMin", "postedAt", "contractType", "remotePolicy"] as const;

export function computeExtractionConfidence(job: Partial<ImportedJob>): ExtractionConfidence {
  const details: Record<string, boolean> = {};
  let presentCount = 0;

  for (const f of REQUIRED_FIELDS) {
    const val = job[f as keyof typeof job];
    details[f] = typeof val === "string" ? val.trim().length > 1 : !!val;
    if (details[f]) presentCount++;
  }
  for (const f of OPTIONAL_FIELDS) {
    const val = job[f as keyof typeof job];
    details[f] = typeof val === "string" ? val.trim().length > 1 : !!val;
    if (details[f]) presentCount++;
  }

  const totalFields = REQUIRED_FIELDS.length + OPTIONAL_FIELDS.length;

  // Score: required fields weigh more
  let score = 0;
  if (details.title) score += 35;
  if (details.company) score += 25;
  if (details.description) score += 15;
  if (details.location) score += 10;
  if (details.applicationUrl) score += 5;
  if (details.postedAt) score += 4;
  if (details.salaryMin) score += 3;
  if (details.contractType) score += 2;
  if (details.remotePolicy) score += 1;

  return { score: Math.min(100, score), presentCount, totalFields, details };
}

/* ─── Anti-parasite filters ────────────────── */

const PARASITE_TITLES = [
  "bienvenue", "bienvenue,", "emplois recommandés", "détails de l'emploi",
  "salaire", "type de poste", "lieu", "description du poste",
  "continuer pour postuler", "candidature simplifiée", "candidature",
  "annonce", "enregistrer", "répond souvent sous 3 jours", "urgent",
  "postuler", "sauvegarder", "partager", "signaler",
];

const PARASITE_COMPANIES = [
  "annonce", "candidature simplifiée", "temps plein", "cdi", "cdd",
  "télétravail", "télétravail partiel", "détails de l'emploi",
  "salaire", "lieu", "postuler", "sauvegarder",
];

export function isParasiteTitle(text: string | null | undefined): boolean {
  if (!text || text.trim().length < 2) return true;
  const cleaned = text.trim().toLowerCase();
  return PARASITE_TITLES.some((p) => cleaned === p || cleaned.startsWith(p + ",") || cleaned.startsWith(p + " "));
}

export function isParasiteCompany(text: string | null | undefined): boolean {
  if (!text || text.trim().length < 2) return false;
  const cleaned = text.trim().toLowerCase();
  return PARASITE_COMPANIES.some((p) => cleaned === p);
}

export function cleanLocationText(text: string | null | undefined, company?: string): string {
  if (!text || text.trim().length < 1) return "";
  let cleaned = text.trim();
  // Remove company name if merged with location (e.g. "Uptoo13000 Marseille")
  if (company && company.length > 1) {
    const pattern = new RegExp("^" + company.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*", "i");
    cleaned = cleaned.replace(pattern, "");
  }
  // Separate "Télétravail partiel" / "Télétravail" from location
  cleaned = cleaned.replace(/\s*[,—–-]?\s*Télétravail\s*(partiel)?$/i, "");
  return cleaned.trim();
}

/* ─── Text cleaning ─────────────────────────── */

export function cleanVisibleText(text: string): string {
  if (!text) return "";
  let cleaned = text;
  const patterns = [
    /^.*\b(?:cookies|privacy|accept all|manage preferences)\b.*$/gim,
    /^.*\b(?:sign in|log in|register now|join now|easy apply|save|share|follow)\b.*$/gim,
    /^.*(?:© \d{4}|\b(?:all rights reserved|powered by)).*$/gim,
    /^.*\b(?:LinkedIn|LinkedIn Corporation)\b.*$/gim,
    /^.*\b(?:© Indeed|Active \d+|Posted \d+|Employer)\b.*$/gim,
    /^.*\b(?:conditions générales|politique de confidentialité)\b.*$/gim,
  ];
  for (const p of patterns) {
    cleaned = cleaned.replace(p, "");
  }
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim();
  return cleaned.slice(0, 5000);
}

/* ─── Validation ────────────────────────────── */

export interface AssistedImportPayload {
  platform: string;
  sourceUrl: string;
  visibleOnly: boolean;
  jobs: Partial<ImportedJob>[];
}

export interface ValidationResult {
  valid: boolean;
  reasonCode?: string;
  message?: string;
}

export function validateAssistedImportPayload(payload: AssistedImportPayload): ValidationResult {
  if (!payload.sourceUrl) {
    return { valid: false, reasonCode: "assisted_missing_required_fields", message: "URL source manquante." };
  }
  if (!payload.jobs || payload.jobs.length === 0) {
    return { valid: false, reasonCode: "assisted_missing_required_fields", message: "Aucune offre à importer." };
  }
  if (payload.jobs.length > 10) {
    return { valid: false, reasonCode: "assisted_missing_required_fields", message: "Maximum 10 offres par import." };
  }
  for (let i = 0; i < payload.jobs.length; i++) {
    const j = payload.jobs[i];
    if (!j.title || j.title.trim().length < 3) {
      return { valid: false, reasonCode: "assisted_missing_required_fields", message: `Offre ${i + 1} : titre manquant.` };
    }
    if (!j.sourceUrl && !payload.sourceUrl) {
      return { valid: false, reasonCode: "assisted_missing_required_fields", message: `Offre ${i + 1} : URL manquante.` };
    }
  }
  return { valid: true };
}

/* ─── Login / CAPTCHA detection (DOM text) ──── */

const LOGIN_CAPTCHA_PATTERNS = [
  /sign in to view/i, /log in to apply/i, /login required/i,
  /please sign in/i, /connectez-vous/i, /identifiez-vous/i,
  /captcha/i, /recaptcha/i, /hcaptcha/i,
  /verify you are human/i, /prouvez que vous n'êtes pas un robot/i,
  /cloudflare/i, /just a moment/i, /checking your browser/i,
];

export function isLoginOrCaptchaVisible(visibleText: string): boolean {
  return LOGIN_CAPTCHA_PATTERNS.some((p) => p.test(visibleText));
}

/* ─── Platform-specific extractors ──────────── */

/**
 * Extract a single job from a LinkedIn job page DOM text.
 * LinkedIn job pages have structured selectors:
 * - .job-details-jobs-unified-top-card__job-title for title
 * - .job-details-jobs-unified-top-card__company-name for company
 * - .job-details-jobs-unified-top-card__primary-description-container for description
 * etc.
 *
 * The extension captures textContent/innerText from these selectors.
 * This function processes the captured text blocks.
 */
export function extractLinkedInJobPosting(rawData: {
  pageTitle: string;
  jobTitleText: string;
  companyText: string;
  locationText: string;
  descriptionText: string;
  url: string;
  postedAt?: string;
  employmentType?: string;
}): ImportedJob {
  return {
    source: "linkedin",
    externalId: `linkedin::${hashUrlForExternalId(rawData.url)}`,
    sourceUrl: rawData.url,
    title: rawData.jobTitleText || rawData.pageTitle.split(" | ")[0] || "",
    company: rawData.companyText || "",
    location: rawData.locationText || "",
    description: cleanVisibleText(rawData.descriptionText || ""),
    publishedAt: rawData.postedAt,
    contractType: rawData.employmentType || undefined,
  };
}

/**
 * Extract a single job from an Indeed job page DOM text.
 */
export function extractIndeedJobPosting(rawData: {
  pageTitle: string;
  jobTitleText: string;
  companyText: string;
  locationText: string;
  descriptionText: string;
  url: string;
  salaryText?: string;
  postedAt?: string;
  employmentType?: string;
  remotePolicy?: string;
}): ImportedJob {
  let title = rawData.jobTitleText || rawData.pageTitle.split(" - ")[0] || "";
  let company = rawData.companyText || "";
  let location = rawData.locationText || "";

  // Anti-parasite filtering
  if (isParasiteTitle(title)) {
    // Try fallback from page title
    const pageTitlePart = rawData.pageTitle.split(" - ")[0]?.trim() || "";
    if (!isParasiteTitle(pageTitlePart)) title = pageTitlePart;
    else title = "";
  }
  if (isParasiteCompany(company)) company = "";

  // Clean merged company+location
  location = cleanLocationText(location, company || undefined);

  // Salary: handle range like "De 65000 € à 89000 € par an"
  const salaryParts = rawData.salaryText?.includes("à") ? rawData.salaryText.split("à") : null;
  const salaryMin = salaryParts ? parseSalaryFromText(salaryParts[0]) : rawData.salaryText ? parseSalaryFromText(rawData.salaryText) : undefined;
  const salaryMax = salaryParts?.[1] ? parseSalaryFromText(salaryParts[1]) : undefined;

  return {
    source: "indeed",
    externalId: `indeed::${hashUrlForExternalId(rawData.url)}`,
    sourceUrl: rawData.url,
    title,
    company,
    location,
    description: cleanVisibleText(rawData.descriptionText || ""),
    salaryMin,
    salaryMax,
    currency: salaryMin ? "EUR" : undefined,
    publishedAt: rawData.postedAt,
    contractType: rawData.employmentType || undefined,
    remotePolicy: rawData.remotePolicy || undefined,
  };
}

/**
 * Extract a single job from an APEC job page DOM text.
 */
export function extractApecJobPosting(rawData: {
  pageTitle: string;
  jobTitleText: string;
  companyText: string;
  locationText: string;
  descriptionText: string;
  url: string;
  contractType?: string;
  salaryText?: string;
  postedAt?: string;
}): ImportedJob {
  const salaryParts = rawData.salaryText?.includes("à") ? rawData.salaryText.split("à") : null;
  const salaryMin = salaryParts ? parseSalaryFromText(salaryParts[0]) : rawData.salaryText ? parseSalaryFromText(rawData.salaryText) : undefined;
  const salaryMax = salaryParts?.[1] ? parseSalaryFromText(salaryParts[1]) : undefined;
  return {
    source: "apec",
    externalId: `apec::${hashUrlForExternalId(rawData.url)}`,
    sourceUrl: rawData.url,
    title: rawData.jobTitleText || rawData.pageTitle.split(" - ")[0] || "",
    company: rawData.companyText || "",
    location: rawData.locationText || "",
    description: cleanVisibleText(rawData.descriptionText || ""),
    contractType: rawData.contractType || undefined,
    salaryMin,
    salaryMax,
    currency: "EUR",
    publishedAt: rawData.postedAt,
  };
}

/* ─── List mode card extraction ────────────── */

export interface JobCard {
  title: string;
  company: string;
  location: string;
  url?: string;
  platform: string;
  extractionConfidence: ExtractionConfidence;
  warnings: string[];
}

/**
 * Extract visible job cards from a LinkedIn search/list page.
 * Each card is a block of text from a visible job listing element.
 */
export function extractLinkedInJobCards(
  cards: Array<{
    title: string;
    company: string;
    location: string;
    url?: string;
  }>,
): JobCard[] {
  const results: JobCard[] = [];
  for (const c of cards.slice(0, 10)) {
    const job: Partial<ImportedJob> = { title: c.title, company: c.company, location: c.location, sourceUrl: c.url };
    const confidence = computeExtractionConfidence(job);
    const warnings: string[] = [];
    if (!c.url) warnings.push("URL de l'offre non détectée — vous devrez la renseigner manuellement.");
    results.push({
      title: c.title,
      company: c.company,
      location: c.location,
      url: c.url,
      platform: "linkedin",
      extractionConfidence: confidence,
      warnings,
    });
  }
  return results;
}

/**
 * Extract visible job cards from an Indeed search/list page.
 */
export function extractIndeedJobCards(
  cards: Array<{
    title: string;
    company: string;
    location: string;
    url?: string;
  }>,
): JobCard[] {
  return cards.slice(0, 10).map((c) => {
    const job: Partial<ImportedJob> = { title: c.title, company: c.company, location: c.location, sourceUrl: c.url };
    const confidence = computeExtractionConfidence(job);
    const warnings: string[] = [];
    if (!c.url) warnings.push("URL de l'offre non détectée.");
    return { title: c.title, company: c.company, location: c.location, url: c.url, platform: "indeed", extractionConfidence: confidence, warnings };
  });
}

/**
 * Extract visible job cards from an APEC search/list page.
 */
export function extractApecJobCards(
  cards: Array<{
    title: string;
    company: string;
    location: string;
    url?: string;
    contractType?: string;
    salaryText?: string;
  }>,
): JobCard[] {
  return cards.slice(0, 10).map((c) => {
    const job: Partial<ImportedJob> = { title: c.title, company: c.company, location: c.location, sourceUrl: c.url, contractType: c.contractType };
    const confidence = computeExtractionConfidence(job);
    const warnings: string[] = [];
    if (!c.company || c.company.length < 2) warnings.push("Entreprise non détectée.");
    return { title: c.title, company: c.company, location: c.location, url: c.url, platform: "apec", extractionConfidence: confidence, warnings };
  });
}

/* ─── Build preview for extension response ──── */

export interface AssistedImportPreview {
  platform: string;
  sourceUrl: string;
  visibleOnly: boolean;
  extractionMethod: string;
  isLoginOrCaptchaVisible: boolean;
  jobs: Array<{
    job: ImportedJob;
    confidence: ExtractionConfidence;
    warnings: string[];
    duplicate?: { isDuplicate: boolean; existingId?: string };
  }>;
}

export function buildAssistedImportPreview(
  platform: string,
  sourceUrl: string,
  jobs: ImportedJob[],
  duplicates: Record<string, string | null>,
): AssistedImportPreview {
  return {
    platform,
    sourceUrl,
    visibleOnly: true,
    extractionMethod: "USER_ASSISTED_EXTENSION",
    isLoginOrCaptchaVisible: false,
    jobs: jobs.map((j) => ({
      job: j,
      confidence: computeExtractionConfidence(j),
      warnings: [],
      duplicate: duplicates[j.externalId || ""]
        ? { isDuplicate: true, existingId: duplicates[j.externalId || ""]! }
        : { isDuplicate: false },
    })),
  };
}

/* ─── Helpers ───────────────────────────────── */

function parseSalaryFromText(text: string): number | undefined {
  if (!text) return undefined;
  const cleaned = text.replace(/[^\d.,]/g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  if (isNaN(num) || num < 1500) return undefined;
  if (num < 25) return num * 1000; // "24k" → 24000
  return num;
}

/* ─── Reason codes ──────────────────────────── */

export const ASSISTED_REASON_CODES = {
  assisted_visible_job_imported: "Offre unique importée via l'extension Chrome (extraction visible uniquement).",
  assisted_visible_list_imported: "Offres en liste importées via l'extension Chrome (extraction visible uniquement).",
  assisted_duplicate_skipped: "Doublon — cette offre existe déjà dans PRSTO.",
  assisted_missing_required_fields: "Champs obligatoires manquants (titre, entreprise, URL).",
  blocked_login_or_captcha_visible: "Import assisté impossible — page de login ou CAPTCHA visible.",
  refused_server_side_closed_platform_fetch: "Tentative de fetch serveur vers une plateforme fermée — refusé.",
  refused_auto_scrape_closed_platform: "Tentative de scraping automatique d'une plateforme fermée — refusé.",
} as const;
