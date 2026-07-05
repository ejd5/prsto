/**
 * Firecrawl Safe Connector — PRSTO V2.6.2
 *
 * Extraction propre de contenu public autorisé via Firecrawl.
 * Refuse les plateformes fermées (LinkedIn, Indeed, APEC),
 * les pages de login, les CAPTCHA, et toute tentative de bypass.
 *
 * Ne contourne jamais une protection. Ne stocke jamais de credentials.
 */

import type {
  ImportedJob,
  ComplianceResult,
  FirecrawlAuditEntry,
  FirecrawlOptions,
  SourceImportMode,
} from "../types";
import {
  detectAtsProvider,
  isLoginAuthPage,
  isCaptchaOrChallengePage,
  containsBypassAttempt,
  isBlockedDomain,
  isUserAssistedDomain,
  isFirecrawlEligibleDomain,
  isCompatibleWithFirecrawl,
} from "../source-capability-scanner";

/* ─── Config from env ─────────────────────── */

function getEnv(key: string): string {
  if (typeof process !== "undefined" && process.env) {
    return process.env[key] || "";
  }
  return "";
}

function getFirecrawlApiKey(): string {
  return getEnv("FIRECRAWL_API_KEY");
}

function isFirecrawlEnabled(): boolean {
  return getEnv("FIRECRAWL_ENABLED") === "true";
}

function getTimeoutMs(): number {
  const v = getEnv("FIRECRAWL_TIMEOUT_MS");
  return v ? parseInt(v, 10) || 30000 : 30000;
}

/* ─── Domain extraction ───────────────────── */

function normalizeDomain(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host;
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] || url;
  }
}

/* ─── Core eligibility check ──────────────── */

/**
 * Vérifie la configuration Firecrawl (clé API + flag activé).
 * Sépare la vérification de config du contrôle d'éligibilité pure.
 */
export function checkFirecrawlConfig(): ComplianceResult | null {
  if (!isFirecrawlEnabled()) {
    return { status: "refused", reasonCode: "refused_missing_api_key", detail: "Firecrawl désactivé (FIRECRAWL_ENABLED=false)." };
  }
  const apiKey = getFirecrawlApiKey();
  if (!apiKey || apiKey.trim().length === 0) {
    return { status: "refused", reasonCode: "refused_missing_api_key", detail: "Clé API Firecrawl absente." };
  }
  return null; // config OK
}

/**
 * Vérifie si Firecrawl peut être utilisé pour une source donnée.
 * Combine le check de config + l'éligibilité de la source.
 */
export function canUseFirecrawlForSource(input: {
  url: string;
  importMode?: SourceImportMode | null;
  html?: string;
}): boolean {
  const configError = checkFirecrawlConfig();
  if (configError) return false;

  const result = classifyFirecrawlEligibility(input.url, input.importMode || null, input.html || "");
  return result.status === "allowed";
}

/**
 * Classification complète de l'éligibilité Firecrawl.
 * Fonction pure — vérifie l'URL, le mode d'import, le HTML, et les règles de sécurité.
 * Ne vérifie PAS la présence de la clé API (c'est le rôle de checkFirecrawlConfig).
 */
export function classifyFirecrawlEligibility(
  url: string,
  importMode: SourceImportMode | null,
  html: string,
): ComplianceResult {
  // 1. Détection bypass
  if (containsBypassAttempt(url)) {
    return { status: "refused", reasonCode: "refused_bypass_attempt", detail: "Tentative de contournement détectée dans l'URL." };
  }

  const domain = normalizeDomain(url);

  // 2. Mode BLOCKED explicite → prioritaire
  if (importMode === "BLOCKED") {
    return { status: "refused", reasonCode: "refused_blocked_domain", detail: `${domain} est sur la liste des domaines bloqués.` };
  }

  // 3. Mode USER_ASSISTED ou domaine user-assisted → refus
  if (importMode === "USER_ASSISTED" || isUserAssistedDomain(domain)) {
    return {
      status: "refused",
      reasonCode: "refused_closed_platform",
      detail: `${domain} est une plateforme fermée. Utilisez l'extension Import Assisté.`,
    };
  }

  // 4. Domaine bloqué → refus
  if (isBlockedDomain(domain)) {
    return { status: "refused", reasonCode: "refused_blocked_domain", detail: `${domain} est sur la liste des domaines bloqués.` };
  }

  // 5. Login / auth pages
  if (isLoginAuthPage(url)) {
    return { status: "refused", reasonCode: "refused_login_required", detail: "Page de connexion ou d'authentification détectée." };
  }

  // 6. CAPTCHA / anti-bot
  if (isCaptchaOrChallengePage(html)) {
    return { status: "refused", reasonCode: "refused_captcha", detail: "Protection anti-bot (CAPTCHA/Cloudflare/DataDome) détectée." };
  }

  // 7. Vérifier éligibilité Firecrawl
  if (!isFirecrawlEligibleDomain(domain)) {
    return {
      status: "refused",
      reasonCode: "refused_blocked_domain",
      detail: `${domain} n'est pas éligible à l'extraction automatique.`,
    };
  }

  // 8. Mode compatible ?
  if (importMode && !isCompatibleWithFirecrawl(importMode) && importMode !== "MANUAL_ONLY") {
    return {
      status: "refused",
      reasonCode: "refused_user_assisted_source",
      detail: `Le mode d'import "${importMode}" n'est pas compatible avec Firecrawl.`,
    };
  }

  // 9. Autorisé
  const reasonCode = importMode === "ATS_PUBLIC" ? "allowed_public_ats"
    : importMode === "AUTO_JSONLD" ? "allowed_jsonld"
    : "allowed_public_careers";

  return { status: "allowed", reasonCode, detail: "Source autorisée pour extraction Firecrawl Safe." };
}

/* ─── Firecrawl API call ──────────────────── */

interface FirecrawlScrapeResponse {
  success: boolean;
  data?: {
    markdown?: string;
    html?: string;
    title?: string;
    url?: string;
  };
  error?: string;
}

/**
 * Appelle l'API Firecrawl pour extraire le contenu d'une page autorisée.
 * Ne scrape JAMAIS sans vérification préalable de l'éligibilité.
 */
export async function scrapeAllowedPageWithFirecrawl(
  url: string,
  options?: FirecrawlOptions,
): Promise<{ markdown: string; sourceUrl: string; durationMs: number }> {
  const start = Date.now();

  // Vérification config
  const configError = checkFirecrawlConfig();
  if (configError) {
    throw new Error(`Firecrawl refusé : ${configError.detail} (${configError.reasonCode})`);
  }

  // Vérification préalable obligatoire
  const eligibility = classifyFirecrawlEligibility(url, null, "");
  if (eligibility.status !== "allowed") {
    throw new Error(`Firecrawl refusé : ${eligibility.detail} (${eligibility.reasonCode})`);
  }

  const apiKey = options?.apiKey || getFirecrawlApiKey();
  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY non configurée.");
  }

  const timeout = options?.timeoutMs || getTimeoutMs();

  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
        waitFor: 0,
      }),
      signal: AbortSignal.timeout(timeout),
    });

    if (!res.ok) {
      if (res.status === 429) {
        throw new Error("Firecrawl rate limit atteint.");
      }
      throw new Error(`Firecrawl HTTP ${res.status}: ${res.statusText}`);
    }

    const data: FirecrawlScrapeResponse = await res.json();

    if (!data.success) {
      throw new Error(data.error || "Firecrawl extraction échouée.");
    }

    const markdown = data.data?.markdown || "";
    const sourceUrl = data.data?.url || url;

    return { markdown, sourceUrl, durationMs: Date.now() - start };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("rate limit")) {
      throw new Error(`Firecrawl rate limit atteint pour ${url}`);
    }
    if (msg.includes("timeout") || msg.includes("AbortError")) {
      throw new Error(`Firecrawl timeout pour ${url} (${timeout}ms)`);
    }
    throw e;
  }
}

/* ─── Markdown → ImportedJob extraction ───── */

const JOB_TITLE_PATTERNS = [
  /^#+\s+(.+)/m,
  /^(?:Title|Job Title|Poste|Intitulé)[:\s]+(.+)/mi,
];

const COMPANY_PATTERNS = [
  /(?:Company|Entreprise|Organization|Société)[:\s]+(.+)/mi,
];

const LOCATION_PATTERNS = [
  /(?:Location|Lieu|Localisation|Ville|City)[:\s]+(.+)/mi,
  /^locations(.+)/mi,
];

/**
 * Extrait des offres d'emploi depuis un contenu Markdown.
 * Firecrawl retourne le contenu textuel structuré — on parse les blocs.
 */
export function extractJobsFromMarkdown(
  markdown: string,
  sourceUrl: string,
): ImportedJob[] {
  if (!markdown || markdown.trim().length === 0) return [];

  const jobs: ImportedJob[] = [];
  const domain = normalizeDomain(sourceUrl);
  const atsProvider = detectAtsProvider(sourceUrl, markdown);

  // Stratégie 1 : sections délimitées par titres de niveau 1-2
  const topSections = markdown.split(/\n(?=#{1,2}\s+)/);
  const topLevelJobs: ImportedJob[] = [];

  for (let i = 0; i < topSections.length; i++) {
    const section = topSections[i].trim();
    if (section.length < 30) continue;

    const title = extractFirstMatch(section, JOB_TITLE_PATTERNS)
      || (atsProvider ? extractTitleFromSection(section) : "Poste extrait");

    if (/^(about|footer|header|navigation|menu|sidebar)$/i.test(title)) continue;

    topLevelJobs.push({
      source: "firecrawl-safe",
      externalId: `firecrawl::${domain}::${hashString(title + section.slice(0, 100))}`,
      sourceUrl,
      canonicalUrl: sourceUrl,
      title,
      company: extractFirstMatch(section, COMPANY_PATTERNS) || undefined,
      location: extractFirstMatch(section, LOCATION_PATTERNS) || undefined,
      description: cleanMarkdownToText(section).slice(0, 5000),
      functionArea: atsProvider ? extractDepartmentFromSection(section) : undefined,
    });
  }

  // Stratégie 2 : liste d'offres en `- ### [title](url)` (ATS comme Workday)
  const hasListJobs = /- ### \[[^\]]+\]\([^)]+\)/.test(markdown);

  if (hasListJobs) {
    const listPattern = /- ### \[([^\]]+)\]\(([^)]+)\)/g;
    const seen = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = listPattern.exec(markdown)) !== null) {
      const title = match[1].trim();
      const url = match[2];
      if (title.length < 3 || seen.has(title)) continue;
      seen.add(title);
      const afterMatch = markdown.slice(match.index + match[0].length, match.index + match[0].length + 600);
      const location = extractFirstMatch(afterMatch, LOCATION_PATTERNS) || undefined;
      jobs.push({
        source: "firecrawl-safe",
        externalId: `firecrawl::${domain}::${hashString(title)}`,
        sourceUrl: url,
        canonicalUrl: url,
        title,
        company: undefined,
        location,
        description: cleanMarkdownToText(afterMatch).slice(0, 5000),
      });
    }
    return jobs;
  }

  // Stratégie 3 : sections classiques (fallback vers stratégie 1)
  if (topLevelJobs.length > 0) {
    return topLevelJobs;
  }

  // Stratégie 4 : tout le markdown comme une seule offre
  {
    const title = extractFirstMatch(markdown, JOB_TITLE_PATTERNS) || "Poste extrait";
    const company = extractFirstMatch(markdown, COMPANY_PATTERNS) || undefined;
    const location = extractFirstMatch(markdown, LOCATION_PATTERNS) || undefined;
    const description = cleanMarkdownToText(markdown).slice(0, 5000);

    jobs.push({
      source: "firecrawl-safe",
      externalId: `firecrawl::${domain}::${hashString(title + (company || ""))}`,
      sourceUrl,
      canonicalUrl: sourceUrl,
      title,
      company,
      location,
      description,
    });
  }

  return jobs;
}

function extractFirstMatch(text: string, patterns: RegExp[]): string | null {
  for (const p of patterns) {
    p.lastIndex = 0; // reset pour appel déterministe
    const m = p.exec(text);
    if (m?.[1]) {
      return m[1].trim();
    }
  }
  return null;
}

function extractTitleFromSection(section: string): string {
  // Prend le premier heading de la section
  const m = section.match(/^#{1,3}\s+(.+)/m);
  if (m?.[1]) return m[1].trim();

  // Sinon, la première ligne qui ressemble à un titre
  const lines = section.split("\n").filter(l => l.trim().length > 5);
  for (const line of lines) {
    const cleaned = line.replace(/^[*#\-]+\s*/, "").trim();
    if (cleaned.length > 5 && cleaned.length < 120) return cleaned;
  }
  return "Poste extrait";
}

function extractDepartmentFromSection(section: string): string | undefined {
  const m = section.match(/(?:Department|Département|Team|Équipe|Function|Fonction)[:\s]+([^,\n]+)/i);
  return m?.[1]?.trim() || undefined;
}

function cleanMarkdownToText(md: string): string {
  return md
    .replace(/^#{1,6}\s+/gm, "")          // Remove heading markers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Links → text
    .replace(/[*_~`>|]/g, "")             // Remove formatting
    .replace(/!\[.*?\]\([^)]+\)/g, "")     // Remove images
    .replace(/\n{3,}/g, "\n\n")           // Normalize newlines
    .replace(/\s+/g, " ")
    .trim();
}

function hashString(s: string): string {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    const chr = s.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

/* ─── Normalisation ───────────────────────── */

/**
 * Normalise les offres extraites par Firecrawl.
 * Applique les mappings de champs vers ImportedJob.
 */
export function normalizeFirecrawlJobs(
  rawJobs: ImportedJob[],
  context: { sourceUrl: string; domain: string },
): ImportedJob[] {
  return rawJobs.map((j) => {
    // Résoudre les URLs relatives en absolues
    let applicationUrl = j.sourceUrl || context.sourceUrl;
    if (applicationUrl.startsWith("/")) {
      try {
        const base = new URL(context.sourceUrl);
        applicationUrl = `${base.origin}${applicationUrl}`;
      } catch {
        // garder l'URL relative
      }
    }

    return {
      source: "firecrawl-safe",
      externalId: j.externalId || `firecrawl::${context.domain}::${hashString(j.title + (j.company || ""))}`,
      sourceUrl: applicationUrl,
      canonicalUrl: j.canonicalUrl || context.sourceUrl,
      title: j.title || "Sans titre",
      company: j.company || undefined,
      location: j.location || undefined,
      remotePolicy: j.remotePolicy || undefined,
      contractType: j.contractType || undefined,
      salaryMin: j.salaryMin,
      salaryMax: j.salaryMax,
      currency: j.currency || "EUR",
      seniority: j.seniority || undefined,
      functionArea: j.functionArea || undefined,
      sector: j.sector || undefined,
      description: j.description?.slice(0, 5000),
      publishedAt: j.publishedAt || undefined,
    };
  });
}

/* ─── Audit log ───────────────────────────── */

/**
 * Crée une entrée de log d'audit pour une tentative Firecrawl.
 */
export function createFirecrawlAuditLog(event: {
  sourceUrl: string;
  importMode: SourceImportMode | null;
  status: string;
  reasonCode: string;
  jobsExtracted: number;
  durationMs: number;
  errors: string[];
}): FirecrawlAuditEntry {
  return {
    timestamp: new Date().toISOString(),
    actor: "firecrawl-safe",
    sourceUrl: event.sourceUrl,
    normalizedDomain: normalizeDomain(event.sourceUrl),
    scannerDecision: event.importMode || "MANUAL_ONLY",
    connector: "firecrawl-safe",
    extractionMethod: "firecrawl_v1_scrape",
    status: event.status as FirecrawlAuditEntry["status"],
    reasonCode: event.reasonCode as FirecrawlAuditEntry["reasonCode"],
    durationMs: event.durationMs,
    jobsExtracted: event.jobsExtracted,
    errors: event.errors,
  };
}

/* ─── Main extraction flow ────────────────── */

/**
 * Flux complet d'extraction Firecrawl Safe.
 * 1. Vérifie l'éligibilité
 * 2. Appelle Firecrawl
 * 3. Extrait les offres du Markdown
 * 4. Normalise
 * 5. Retourne les offres + audit
 */
export async function runFirecrawlExtraction(
  url: string,
  importMode: SourceImportMode | null = null,
): Promise<{
  jobs: ImportedJob[];
  audit: FirecrawlAuditEntry;
  eligibility: ComplianceResult;
}> {
  const start = Date.now();

  // Étape 0 : vérification config
  const configError = checkFirecrawlConfig();
  if (configError) {
    const audit = createFirecrawlAuditLog({
      sourceUrl: url,
      importMode,
      status: configError.status,
      reasonCode: configError.reasonCode,
      jobsExtracted: 0,
      durationMs: Date.now() - start,
      errors: [configError.detail],
    });
    return { jobs: [], audit, eligibility: configError };
  }

  // Étape 1 : vérification éligibilité
  const eligibility = classifyFirecrawlEligibility(url, importMode, "");

  if (eligibility.status !== "allowed") {
    const audit = createFirecrawlAuditLog({
      sourceUrl: url,
      importMode,
      status: eligibility.status,
      reasonCode: eligibility.reasonCode,
      jobsExtracted: 0,
      durationMs: Date.now() - start,
      errors: [eligibility.detail],
    });
    return { jobs: [], audit, eligibility };
  }

  // Étape 2 : extraction Firecrawl
  try {
    const { markdown, sourceUrl: resolvedUrl, durationMs } = await scrapeAllowedPageWithFirecrawl(url);

    // Étape 3 : extraction des offres depuis le Markdown
    const rawJobs = extractJobsFromMarkdown(markdown, resolvedUrl);

    // Étape 4 : normalisation
    const domain = normalizeDomain(resolvedUrl);
    const jobs = normalizeFirecrawlJobs(rawJobs, { sourceUrl: resolvedUrl, domain });

    // Étape 5 : audit
    const audit = createFirecrawlAuditLog({
      sourceUrl: url,
      importMode,
      status: "allowed",
      reasonCode: eligibility.reasonCode,
      jobsExtracted: jobs.length,
      durationMs,
      errors: [],
    });

    return { jobs, audit, eligibility };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    let reasonCode: FirecrawlAuditEntry["reasonCode"] = "error_parse_failed";
    if (msg.includes("rate limit")) reasonCode = "error_firecrawl_rate_limit";
    else if (msg.includes("timeout")) reasonCode = "error_firecrawl_timeout";

    const audit = createFirecrawlAuditLog({
      sourceUrl: url,
      importMode,
      status: "error",
      reasonCode,
      jobsExtracted: 0,
      durationMs: Date.now() - start,
      errors: [msg],
    });

    return { jobs: [], audit, eligibility };
  }
}
