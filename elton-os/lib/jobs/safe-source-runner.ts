import { prisma } from "@/lib/prisma";
import {
  classifyFirecrawlEligibility,
  checkFirecrawlConfig,
  scrapeAllowedPageWithFirecrawl,
  extractJobsFromMarkdown,
  normalizeFirecrawlJobs,
} from "@/lib/jobs/connectors/firecrawl-safe";
import { computeChecksum, checkDuplicate } from "@/lib/jobs/dedupe";
import { scoreJobLocal } from "@/lib/jobs/deepseek-job-scorer";
import { detectLocationPriority, detectCountryScope, computeLocationScore } from "@/lib/jobs/location-priority";
import { analyzeJobFit, serializeAnalysis } from "@/lib/jobs/semantic-matcher";
import { extractDomain } from "@/lib/jobs/source-capability-scanner";
import { chooseIngestionStrategy, isNativeStrategy, runIngestionStrategy } from "@/lib/jobs/ingestion-router";
import type { IngestionStrategy } from "@/lib/jobs/ingestion-router";
import type { JobInput, ProfileInput } from "@/lib/jobs/semantic-matcher";
import type { ImportedJob, FirecrawlAuditEntry } from "@/lib/jobs/types";

export const ConsecutiveErrorThreshold = 3;

export interface RunSafeSourceOptions {
  action: "preview" | "import";
  maxJobs?: number; // override per-source maxJobsPerRun
}

export interface ExtractionQuality {
  validJobs: number;
  invalidJobs: number;
  noiseSkipped: number;
  invalidRatio: number; // 0–1
  qualityStatus: "clean" | "warning" | "poor";
  shouldDisableSource: boolean;
  suspectedNoiseTitles: string[];
}

export interface SafeRunResult {
  success: boolean;
  action: "preview" | "import";
  sourceId: string;
  sourceLabel: string;
  complianceStatus: string;
  reasonCode: string;
  message?: string;
  jobs?: ImportedJob[];
  audit?: FirecrawlAuditEntry;
  stats: {
    jobsFound: number;
    jobsImported: number;
    duplicates: number;
    skipped: number;
    invalid: number;
    semanticScoredCount: number;
  };
  warnings: Array<{ index: number; title: string; warnings: string[] }>;
  extractionQuality?: ExtractionQuality;
  durationMs: number;
  error?: string;
}

/* ─── Quality gates ─────────────────────────── */

export function validateJob(offer: ImportedJob): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  if (!offer.title || offer.title.trim().length === 0) return { valid: false, warnings: ["Titre absent"] };
  if (!offer.sourceUrl && !offer.applicationUrl) return { valid: false, warnings: ["sourceUrl et applicationUrl absents"] };
  if (!offer.company || offer.company.trim().length === 0) return { valid: false, warnings: ["Entreprise absente"] };
  const descLen = (offer.description || "").trim().length;
  if (descLen < 50) warnings.push("Description très courte (< 50 caractères)");
  if (descLen < 200) warnings.push("Description limitée (< 200 caractères)");
  if (!offer.location || offer.location.trim().length === 0) warnings.push("Localisation non détectée");
  if (!offer.applicationUrl) warnings.push("URL de candidature absente");
  if (offer.salaryMin != null && offer.salaryMax != null && offer.salaryMin > offer.salaryMax) {
    warnings.push("Salaire incohérent (min > max)");
  }
  return { valid: true, warnings };
}

/* ─── Company inference ──────────────────────── */

/**
 * Stratégie multi-niveaux pour inférer le nom d'entreprise quand absent de l'extraction.
 * Les boards ATS (Greenhouse, Lever, etc.) n'ont pas de label "Company:" par offre.
 */
export function inferCompanyNameFromSource(
  source: { label: string; normalizedDomain: string; atsVendor?: string | null },
  job: { company?: string },
): string | undefined {
  // 1. Conserver le company explicite du job s'il semble valide
  if (job.company && job.company.trim().length >= 2) return job.company.trim();

  // 2. Extraire du label avec séparateurs standards : "Stripe — Greenhouse"
  for (const sep of [" — ", " - ", " | "]) {
    const parts = source.label.split(sep);
    if (parts.length >= 2 && parts[0].trim().length >= 2) return parts[0].trim();
  }

  // 3. ATS vendor metadata
  const atsVendor = source.atsVendor?.toLowerCase();
  if (atsVendor && atsVendor !== "greenhouse" && atsVendor !== "lever" && atsVendor !== "ashby" && atsVendor !== "workable") {
    return source.atsVendor!;
  }

  // 4. Inférer depuis le domaine : stripe.com → Stripe
  const domain = source.normalizedDomain || "";
  const domainName = domain.replace(/^(boards\.|jobs\.|careers?\.|apply\.|www\.)/, "").split(".")[0];
  if (domainName && domainName.length >= 2 && !/^(com|org|net|io|fr|co|uk|de)$/.test(domainName)) {
    // PascalCase depuis le sous-domaine
    return domainName.charAt(0).toUpperCase() + domainName.slice(1);
  }

  return undefined;
}

/* ─── Noise filter ───────────────────────────── */

const NOISE_TITLE_PATTERNS = [
  /^all\s+jobs$/i, /^jobs$/i, /^careers$/i, /^open\s+positions$/i, /^current\s+openings$/i,
  /^showing\s+\d+.*results/i, /^showing\s+results/i,
  /^search$/i, /^search\s+jobs$/i, /^search\s+openings$/i,
  /^filter$/i, /^filters$/i, /^department$/i, /^departments$/i,
  /^location$/i, /^locations$/i, /^office$/i, /^offices$/i,
  /^team$/i, /^teams$/i, /^remote$/i, /^on-?site$/i, /^hybrid$/i,
  /^view\s+all\s+jobs$/i, /^no\s+jobs\s+found$/i, /^loading$/i, /^apply$/i,
  /^sort\s+by$/i, /^relevance$/i, /^newest$/i, /^oldest$/i,
  /^page\s+\d+$/i, /^next$/i, /^previous$/i,
  /^reset$/i, /^clear\s+filters$/i,
  /^results$/i, /^open\s+jobs$/i,
  /^\d+\s+jobs?\s+found$/i,
];

/**
 * Vérifie si un titre ressemble à un vrai titre d'offre ou à du chrome UI.
 * Les chaînes courtes/génériques sont bloquées.
 * Les titres longs (> 30 chars) contenant des mots-clés sont toujours valides.
 */
export function isLikelyJobTitle(title: string): boolean {
  const trimmed = title.trim();

  // Empty or very short titles → pass through, validateJob will handle them
  if (trimmed.length === 0) return true;
  if (trimmed.length < 3) return true;

  // Vérification insensible à la casse contre les patterns parasites
  // On vérifie TOUJOURS les patterns, même pour les chaînes longues
  // (ex: "Showing 1-10 results out of total 226 open jobs" = 52 chars)
  for (const pattern of NOISE_TITLE_PATTERNS) {
    if (pattern.test(trimmed)) return false;
  }

  // Titres longs qui ne matchent aucun pattern → réels
  if (trimmed.length > 30) return true;

  // Titre très court et générique
  if (trimmed.length <= 5 && /^(jobs|teams|apply|login|signin|sign.?up|about|home|blog|help|menu)$/i.test(trimmed)) return false;

  return true;
}

/* ─── Extraction quality scoring ────────────── */

export function computeExtractionQuality(
  rawCount: number,
  noiseSkipped: number,
  invalidCount: number,
  noiseTitles: string[],
): ExtractionQuality {
  const totalValid = rawCount - noiseSkipped - invalidCount;
  const totalProcessed = rawCount - noiseSkipped;
  const invalidRatio = totalProcessed > 0 ? invalidCount / totalProcessed : 0;
  const noiseRatio = rawCount > 0 ? noiseSkipped / rawCount : 0;

  let qualityStatus: ExtractionQuality["qualityStatus"];
  if (invalidRatio >= 0.5 || noiseRatio >= 0.5) {
    qualityStatus = "poor";
  } else if (invalidRatio >= 0.2 || noiseRatio >= 0.2) {
    qualityStatus = "warning";
  } else {
    qualityStatus = "clean";
  }

  const shouldDisableSource = qualityStatus === "poor" && totalValid === 0;

  return {
    validJobs: totalValid,
    invalidJobs: invalidCount,
    noiseSkipped,
    invalidRatio,
    qualityStatus,
    shouldDisableSource,
    suspectedNoiseTitles: noiseTitles.slice(0, 20),
  };
}

async function checkDailyCostLimits(): Promise<{ allowed: boolean; reasonCode: string; message: string }> {
  const maxRequests = parseInt(process.env.FIRECRAWL_DAILY_MAX_REQUESTS || "25", 10);
  const maxJobs = parseInt(process.env.FIRECRAWL_DAILY_MAX_JOBS_IMPORTED || "100", 10);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todaysSafeRuns = await prisma.jobSearchRun.findMany({
    where: { startedAt: { gte: todayStart } },
    select: { logsJson: true },
  });

  let dailyRequests = 0;
  let dailyJobsImported = 0;

  for (const run of todaysSafeRuns) {
    if (!run.logsJson) continue;
    try {
      const logs = JSON.parse(run.logsJson);
      if (logs.safeSourceId) {
        dailyRequests++;
        dailyJobsImported += logs.jobsImported || 0;
      }
    } catch { /* skip unparseable */ }
  }

  if (dailyRequests >= maxRequests) {
    return {
      allowed: false,
      reasonCode: "refused_daily_limit_reached",
      message: `Limite quotidienne de requêtes Firecrawl atteinte (${dailyRequests}/${maxRequests}). Réessayez demain.`,
    };
  }

  if (dailyJobsImported >= maxJobs) {
    return {
      allowed: false,
      reasonCode: "refused_daily_limit_reached",
      message: `Limite quotidienne d'offres importées atteinte (${dailyJobsImported}/${maxJobs}). Réessayez demain.`,
    };
  }

  return { allowed: true, reasonCode: "", message: "" };
}

export async function runSafeJobSource(
  sourceId: string,
  options: RunSafeSourceOptions = { action: "preview" },
): Promise<SafeRunResult> {
  const startedAt = Date.now();

  // 1. Load SafeJobSource
  const source = await prisma.safeJobSource.findUnique({ where: { id: sourceId } });
  if (!source) {
    return {
      success: false,
      action: options.action,
      sourceId,
      sourceLabel: "",
      complianceStatus: "error",
      reasonCode: "error_parse_failed",
      message: "Source introuvable.",
      stats: { jobsFound: 0, jobsImported: 0, duplicates: 0, skipped: 0, invalid: 0, semanticScoredCount: 0 },
      warnings: [],
      durationMs: Date.now() - startedAt,
      error: "SafeJobSource not found",
    };
  }

  // Kill switch global — bloque tous les runs (manuel + cron)
  const runsEnabled = process.env.SAFE_SOURCES_RUN_ENABLED === "true";
  if (!runsEnabled) {
    return {
      success: false,
      action: options.action,
      sourceId: source.id,
      sourceLabel: source.label,
      complianceStatus: "refused",
      reasonCode: "refused_run_disabled",
      message: "Safe Sources runs désactivés par configuration (SAFE_SOURCES_RUN_ENABLED=false). Activez dans .env pour lancer les runs.",
      stats: { jobsFound: 0, jobsImported: 0, duplicates: 0, skipped: 0, invalid: 0, semanticScoredCount: 0 },
      warnings: [],
      durationMs: Date.now() - startedAt,
      error: "Runs disabled by SAFE_SOURCES_RUN_ENABLED",
    };
  }

  if (!source.enabled) {
    return {
      success: false,
      action: options.action,
      sourceId: source.id,
      sourceLabel: source.label,
      complianceStatus: "refused",
      reasonCode: "refused_missing_api_key",
      message: "Source désactivée.",
      stats: { jobsFound: 0, jobsImported: 0, duplicates: 0, skipped: 0, invalid: 0, semanticScoredCount: 0 },
      warnings: [],
      durationMs: Date.now() - startedAt,
      error: "Source is disabled",
    };
  }

  // 2. Reclassify URL
  const eligibility = classifyFirecrawlEligibility(source.url, null, "");
  if (eligibility.status !== "allowed") {
    await prisma.safeJobSource.update({
      where: { id: source.id },
      data: {
        lastStatus: "refused",
        lastReasonCode: eligibility.reasonCode,
        lastError: eligibility.detail,
        lastRunAt: new Date(),
        consecutiveErrors: { increment: 1 },
      },
    });
    return {
      success: false,
      action: options.action,
      sourceId: source.id,
      sourceLabel: source.label,
      complianceStatus: eligibility.status,
      reasonCode: eligibility.reasonCode,
      message: eligibility.detail,
      stats: { jobsFound: 0, jobsImported: 0, duplicates: 0, skipped: 0, invalid: 0, semanticScoredCount: 0 },
      warnings: [],
      durationMs: Date.now() - startedAt,
      error: eligibility.detail,
    };
  }

  // 2b. Choose ingestion strategy
  const strategy = chooseIngestionStrategy({
    importMode: source.importMode,
    atsVendor: source.atsVendor,
    normalizedDomain: source.normalizedDomain,
    url: source.url,
    label: source.label,
  });

  // 2c. Refuse blocked/user-assisted sources
  if (!strategy.canAutoImport) {
    const refuseReasonCode = strategy.strategy === "BLOCKED" ? "refused_blocked_domain" as const : "refused_user_assisted_source" as const;
    await prisma.safeJobSource.update({
      where: { id: source.id },
      data: {
        lastStatus: "refused",
        lastReasonCode: refuseReasonCode,
        lastError: strategy.reason,
        lastRunAt: new Date(),
        consecutiveErrors: { increment: 1 },
      },
    });
    return {
      success: false,
      action: options.action,
      sourceId: source.id,
      sourceLabel: source.label,
      complianceStatus: strategy.strategy === "BLOCKED" ? "blocked" : "refused",
      reasonCode: refuseReasonCode,
      message: strategy.reason,
      stats: { jobsFound: 0, jobsImported: 0, duplicates: 0, skipped: 0, invalid: 0, semanticScoredCount: 0 },
      warnings: [],
      durationMs: Date.now() - startedAt,
      error: strategy.reason,
    };
  }

  // 3. Extraction — native strategy first, Firecrawl as fallback
  const maxJobs = options.maxJobs ?? source.maxJobsPerRun;
  const domain = extractDomain(source.url);
  let normalizedJobs: ImportedJob[] | null = null;
  let usedIngestionStrategy: IngestionStrategy = strategy.strategy;
  let usedFallback = false;
  let fallbackReason: string | undefined;

  if (isNativeStrategy(strategy.strategy)) {
    const nativeResult = await runIngestionStrategy(
      { id: source.id, url: source.url, normalizedDomain: source.normalizedDomain, atsVendor: source.atsVendor, label: source.label },
      strategy.strategy,
      strategy.atsCompany,
    );
    if (nativeResult.jobs.length > 0) {
      normalizedJobs = nativeResult.jobs;
      usedIngestionStrategy = nativeResult.strategy;
      usedFallback = nativeResult.usedFallback;
      fallbackReason = nativeResult.fallbackReason;
    }
  }

  // Firecrawl fallback (or primary if strategy is FIRECRAWL_SAFE)
  if (normalizedJobs === null) {
    const configCheck = checkFirecrawlConfig();
    if (configCheck) {
      return {
        success: false,
        action: options.action,
        sourceId: source.id,
        sourceLabel: source.label,
        complianceStatus: configCheck.status,
        reasonCode: configCheck.reasonCode,
        message: configCheck.detail,
        stats: { jobsFound: 0, jobsImported: 0, duplicates: 0, skipped: 0, invalid: 0, semanticScoredCount: 0 },
        warnings: [],
        durationMs: Date.now() - startedAt,
        error: configCheck.detail,
      };
    }

    // Cost guard — daily Firecrawl limits (import only)
    if (options.action === "import") {
      const costCheck = await checkDailyCostLimits();
      if (!costCheck.allowed) {
        return {
          success: false,
          action: options.action,
          sourceId: source.id,
          sourceLabel: source.label,
          complianceStatus: "refused",
          reasonCode: costCheck.reasonCode,
          message: costCheck.message,
          stats: { jobsFound: 0, jobsImported: 0, duplicates: 0, skipped: 0, invalid: 0, semanticScoredCount: 0 },
          warnings: [],
          durationMs: Date.now() - startedAt,
          error: costCheck.message,
        };
      }
    }

    let scrapeResult: { markdown: string; sourceUrl: string; durationMs: number };
    try {
      scrapeResult = await scrapeAllowedPageWithFirecrawl(source.url, {
        maxPages: source.maxPagesPerRun,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      await prisma.safeJobSource.update({
        where: { id: source.id },
        data: {
          lastStatus: "failed",
          lastReasonCode: "error_firecrawl_timeout",
          lastError: msg.replace(/fc-[a-zA-Z0-9]+/g, "***"),
          lastRunAt: new Date(),
          consecutiveErrors: { increment: 1 },
        },
      });
      return {
        success: false,
        action: options.action,
        sourceId: source.id,
        sourceLabel: source.label,
        complianceStatus: "error",
        reasonCode: "error_firecrawl_timeout",
        message: `Échec extraction : ${msg.replace(/fc-[a-zA-Z0-9]+/g, "***")}`,
        stats: { jobsFound: 0, jobsImported: 0, duplicates: 0, skipped: 0, invalid: 0, semanticScoredCount: 0 },
        warnings: [],
        durationMs: Date.now() - startedAt,
        error: msg.replace(/fc-[a-zA-Z0-9]+/g, "***"),
      };
    }

    const rawJobs = extractJobsFromMarkdown(scrapeResult.markdown, source.url);
    normalizedJobs = normalizeFirecrawlJobs(rawJobs, { sourceUrl: source.url, domain });
    usedFallback = isNativeStrategy(strategy.strategy);
    fallbackReason = usedFallback ? `La stratégie native ${strategy.strategy} n'a retourné aucun résultat. Fallback Firecrawl.` : undefined;
  }

  // 6b. Inférer l'entreprise depuis les métadonnées de la source si absente
  for (const job of normalizedJobs) {
    const inferred = inferCompanyNameFromSource(
      { label: source.label, normalizedDomain: source.normalizedDomain, atsVendor: source.atsVendor },
      { company: job.company },
    );
    if (inferred && !job.company) {
      job.company = inferred;
    }
  }

  // 6c. Noise filter — identifier les titres parasites (chrome UI)
  const noiseTitles: string[] = [];
  let noiseSkipped = 0;
  const filteredJobs: ImportedJob[] = [];
  for (const job of normalizedJobs) {
    if (isLikelyJobTitle(job.title)) {
      filteredJobs.push(job);
    } else {
      noiseTitles.push(job.title);
      noiseSkipped++;
    }
  }

  // 7. Quality filter + limit
  const validJobs: ImportedJob[] = [];
  let invalid = 0;
  const allWarnings: SafeRunResult["warnings"] = [];

  for (let i = 0; i < filteredJobs.length && validJobs.length < maxJobs; i++) {
    const job = filteredJobs[i];
    const validation = validateJob(job);
    if (!validation.valid) {
      invalid++;
      continue;
    }
    if (validation.warnings.length > 0) {
      allWarnings.push({ index: i, title: job.title, warnings: validation.warnings });
    }
    validJobs.push(job);
  }

  const jobsFound = normalizedJobs.length;

  // 7b. Extraction quality score
  const extractionQuality = computeExtractionQuality(jobsFound, noiseSkipped, invalid, noiseTitles);

  // 8. Build audit
  const auditEntry: FirecrawlAuditEntry = {
    timestamp: new Date().toISOString(),
    actor: "safe-source-runner",
    sourceUrl: source.url,
    normalizedDomain: domain,
    scannerDecision: source.importMode as FirecrawlAuditEntry["scannerDecision"],
    connector: usedIngestionStrategy,
    extractionMethod: usedIngestionStrategy.startsWith("ATS_NATIVE_") || usedIngestionStrategy === "JSONLD_NATIVE" ? "native_api" : "firecrawl_v1_scrape",
    status: "allowed",
    reasonCode: extractionQuality.qualityStatus === "poor" ? "refused_poor_extraction_quality" : eligibility.reasonCode,
    jobsExtracted: jobsFound,
    durationMs: Date.now() - startedAt,
    errors: [],
    extractionQuality: {
      validJobs: extractionQuality.validJobs,
      noiseSkipped: extractionQuality.noiseSkipped,
      invalidJobs: extractionQuality.invalidJobs,
      qualityStatus: extractionQuality.qualityStatus,
      suspectedNoiseTitles: extractionQuality.suspectedNoiseTitles.slice(0, 10),
    },
  };

  // Preview mode: no DB writes
  if (options.action === "preview") {
    await prisma.safeJobSource.update({
      where: { id: source.id },
      data: {
        lastRunAt: new Date(),
        lastStatus: "success",
        lastReasonCode: eligibility.reasonCode,
        lastJobsFound: jobsFound,
        lastJobsImported: 0,
        lastError: null,
        consecutiveErrors: 0,
      },
    });

    return {
      success: true,
      action: "preview",
      sourceId: source.id,
      sourceLabel: source.label,
      complianceStatus: "allowed",
      reasonCode: eligibility.reasonCode,
      jobs: validJobs,
      audit: auditEntry,
      stats: {
        jobsFound,
        jobsImported: 0,
        duplicates: 0,
        skipped: noiseSkipped,
        invalid,
        semanticScoredCount: 0,
      },
      warnings: allWarnings,
      extractionQuality,
      durationMs: Date.now() - startedAt,
    };
  }

  // 9. Import mode: guard against poor extraction
  if (extractionQuality.shouldDisableSource || (validJobs.length === 0 && noiseSkipped > 0)) {
    await prisma.safeJobSource.update({
      where: { id: source.id },
      data: {
        lastStatus: "refused",
        lastReasonCode: "refused_poor_extraction_quality",
        lastError: `Extraction pauvre : ${noiseSkipped} bruit, ${invalid} invalide, ${validJobs.length} valide`,
        lastRunAt: new Date(),
        consecutiveErrors: { increment: 1 },
      },
    });
    return {
      success: false,
      action: "import",
      sourceId: source.id,
      sourceLabel: source.label,
      complianceStatus: "refused",
      reasonCode: "refused_poor_extraction_quality",
      message: `Extraction de qualité insuffisante (${noiseSkipped} entrées parasites, ${invalid} invalides, ${validJobs.length} valides). Vérifiez la source.`,
      stats: { jobsFound, jobsImported: 0, duplicates: 0, skipped: noiseSkipped, invalid, semanticScoredCount: 0 },
      warnings: allWarnings,
      extractionQuality,
      durationMs: Date.now() - startedAt,
      error: `Poor extraction quality: ${noiseSkipped} noise entries, ${invalid} invalid`,
    };
  }

  // 10. Import mode: create DB records
  let importSource = await prisma.importSource.findUnique({
    where: { name: "Firecrawl Safe" },
  });
  if (!importSource) {
    importSource = await prisma.importSource.create({
      data: { name: "Firecrawl Safe", type: "firecrawl-safe", status: "ok" },
    });
  }

  const profile = await prisma.profile.findFirst({
    include: { skills: true, experiences: { orderBy: { startDate: "desc" }, take: 5 } },
  });

  let imported = 0;
  let duplicates = 0;
  let semanticScoredCount = 0;

  for (const offer of validJobs) {
    const checksum = computeChecksum(offer.title, offer.company || "", offer.location || "");

    // RawJob
    await prisma.rawJob.create({
      data: {
        sourceId: importSource.id,
        externalId: offer.externalId,
        sourceUrl: offer.sourceUrl,
        rawTitle: offer.title,
        rawCompany: offer.company,
        rawLocation: offer.location,
        rawDescription: offer.description,
        rawPayloadJson: null,
        checksum,
      },
    });

    // Dedup
    const dup = await checkDuplicate(offer.externalId, offer.sourceUrl, offer.title, offer.company, offer.location);
    if (dup.status !== "new") {
      if (dup.existingId) {
        await prisma.job.update({
          where: { id: dup.existingId },
          data: { lastSeenAt: new Date() },
        });
      }
      duplicates++;
      continue;
    }

    // Location
    const locationPriority = detectLocationPriority(offer.location || null);
    const countryScope = detectCountryScope(offer.location || null);

    // Job
    const job = await prisma.job.create({
      data: {
        sourceId: importSource.id,
        externalId: offer.externalId,
        sourceUrl: offer.sourceUrl,
        canonicalUrl: offer.canonicalUrl || offer.sourceUrl,
        title: offer.title,
        company: offer.company,
        location: offer.location,
        locationPriority,
        countryScope,
        remotePolicy: offer.remotePolicy,
        contractType: offer.contractType,
        salaryMin: offer.salaryMin,
        salaryMax: offer.salaryMax,
        seniority: offer.seniority,
        description: offer.description,
        publishedAt: offer.publishedAt ? new Date(offer.publishedAt) : undefined,
        checksum,
        status: "new",
      },
    });

    // Score
    const scoreData = scoreJobLocal({
      title: offer.title,
      location: offer.location,
      description: offer.description,
    });

    await prisma.jobScore.create({
      data: {
        jobId: job.id,
        executiveScore: scoreData.executiveScore,
        matchScore: scoreData.matchScore,
        locationScore: scoreData.locationScore || computeLocationScore(locationPriority),
        salaryScore: scoreData.salaryScore,
        freshnessScore: scoreData.freshnessScore,
        companyScore: scoreData.companyScore,
        riskScore: scoreData.riskScore,
        globalScore: scoreData.globalScore,
        reasonsJson: JSON.stringify(scoreData.reasons),
        redFlagsJson: JSON.stringify(scoreData.redFlags),
        recommendedAction: scoreData.recommendedAction,
      },
    });

    // Semantic matching
    if (profile) {
      try {
        const jobInput: JobInput = {
          title: offer.title,
          company: offer.company,
          location: offer.location,
          locationPriority,
          countryScope,
          remotePolicy: offer.remotePolicy,
          contractType: offer.contractType,
          salaryMin: offer.salaryMin ?? null,
          salaryMax: offer.salaryMax ?? null,
          seniority: offer.seniority ?? null,
          functionArea: offer.functionArea ?? null,
          sector: offer.sector ?? null,
          description: offer.description,
        };
        const p = profile as unknown as Record<string, unknown>;
        const profileInput: ProfileInput = {
          fullName: (p.fullName as string) ?? profile.title,
          title: profile.title,
          summary: (p.summary as string) ?? null,
          location: profile.location,
          mobility: profile.mobility,
          languages: (p.languages as string) ?? null,
          yearsExp: profile.yearsExp as number | null,
          sectors: profile.sectors,
          functions: (p.functions as string) ?? null,
          remotePreference: (p.remotePreference as string) ?? null,
          targetSalary: (p.targetSalary as string) ?? null,
          constraints: (p.constraints as string) ?? null,
        };
        const analysis = analyzeJobFit(jobInput, profileInput);
        const serialized = serializeAnalysis(analysis);
        await prisma.jobScore.update({
          where: { jobId: job.id },
          data: {
            semanticScore: analysis.overallScore,
            semanticConfidence: analysis.confidence,
            semanticAnalysisJson: JSON.stringify(serialized),
            recommendation: analysis.recommendation,
          },
        });
        semanticScoredCount++;
      } catch {
        // Semantic matching failure must not break import
      }
    }

    imported++;
  }

  // 10. Create JobSearchRun audit
  await prisma.jobSearchRun.create({
    data: {
      sourceId: importSource.id,
      mode: "manual",
      status: imported > 0 ? "success" : "partial",
      startedAt: new Date(startedAt),
      finishedAt: new Date(),
      fetchedCount: jobsFound,
      createdCount: imported,
      duplicateCount: duplicates,
      rejectedCount: invalid,
      errorMessage: null,
      logsJson: JSON.stringify({
        safeSourceId: source.id,
        safeSourceLabel: source.label,
        sourceUrl: source.url,
        normalizedDomain: auditEntry.normalizedDomain,
        scannerDecision: auditEntry.scannerDecision,
        connector: auditEntry.connector,
        ingestionStrategy: usedIngestionStrategy,
        usedFallback,
        fallbackReason: fallbackReason || null,
        complianceStatus: auditEntry.status,
        reasonCode: auditEntry.reasonCode,
        jobsFound,
        jobsImported: imported,
        duplicates,
        skipped: noiseSkipped,
        invalid,
        durationMs: Date.now() - startedAt,
        semanticScoredCount,
        extractionQuality: {
          qualityStatus: extractionQuality.qualityStatus,
          noiseSkipped: extractionQuality.noiseSkipped,
          invalidJobs: extractionQuality.invalidJobs,
          validJobs: extractionQuality.validJobs,
          suspectedNoiseTitles: extractionQuality.suspectedNoiseTitles.slice(0, 5),
        },
        errors: auditEntry.errors,
        timestamp: auditEntry.timestamp,
      }),
    },
  });

  // 11. Update SafeJobSource stats
  const duration = Date.now() - startedAt;
  await prisma.safeJobSource.update({
    where: { id: source.id },
    data: {
      lastRunAt: new Date(),
      lastStatus: imported > 0 ? "success" : "partial",
      lastReasonCode: eligibility.reasonCode,
      lastJobsFound: jobsFound,
      lastJobsImported: imported,
      lastError: null,
      consecutiveErrors: 0,
    },
  });

  return {
    success: true,
    action: "import",
    sourceId: source.id,
    sourceLabel: source.label,
    complianceStatus: "allowed",
    reasonCode: eligibility.reasonCode,
    jobs: validJobs,
    audit: { ...auditEntry, durationMs: duration },
    stats: {
      jobsFound,
      jobsImported: imported,
      duplicates,
      skipped: noiseSkipped,
      invalid,
      semanticScoredCount,
    },
    warnings: allWarnings,
    extractionQuality,
    durationMs: duration,
  };
}

export async function runAllEnabledSafeSources(
  action: "preview" | "import" = "import",
): Promise<SafeRunResult[]> {
  // Kill switch global
  if (process.env.SAFE_SOURCES_RUN_ENABLED !== "true") {
    return [{
      success: false,
      action,
      sourceId: "__all__",
      sourceLabel: "Toutes les sources",
      complianceStatus: "refused",
      reasonCode: "refused_run_disabled",
      message: "Safe Sources runs désactivés par configuration (SAFE_SOURCES_RUN_ENABLED=false).",
      stats: { jobsFound: 0, jobsImported: 0, duplicates: 0, skipped: 0, invalid: 0, semanticScoredCount: 0 },
      warnings: [],
      durationMs: 0,
      error: "Runs disabled by SAFE_SOURCES_RUN_ENABLED",
    }];
  }

  const maxPerRun = parseInt(process.env.SAFE_SOURCES_MAX_PER_RUN || "5", 10);
  const defaultMaxJobs = parseInt(process.env.SAFE_SOURCES_MAX_JOBS_PER_SOURCE || "20", 10);

  const sources = await prisma.safeJobSource.findMany({
    where: { enabled: true },
    orderBy: { updatedAt: "desc" },
    take: maxPerRun,
  });

  const results: SafeRunResult[] = [];
  for (const source of sources) {
    if (source.consecutiveErrors >= ConsecutiveErrorThreshold) {
      results.push({
        success: false,
        action,
        sourceId: source.id,
        sourceLabel: source.label,
        complianceStatus: "error",
        reasonCode: "error_consecutive_failures",
        message: `${ConsecutiveErrorThreshold} erreurs consécutives — source ignorée. Corrigez et réactivez.`,
        stats: { jobsFound: 0, jobsImported: 0, duplicates: 0, skipped: 0, invalid: 0, semanticScoredCount: 0 },
        warnings: [],
        durationMs: 0,
        error: `Skipped: ${source.consecutiveErrors} consecutive errors`,
      });
      continue;
    }
    const result = await runSafeJobSource(source.id, {
      action,
      maxJobs: Math.min(source.maxJobsPerRun, defaultMaxJobs),
    });
    results.push(result);
  }

  return results;
}
