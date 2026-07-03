import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeChecksum, checkDuplicate } from "@/lib/jobs/dedupe";
import { detectLocationPriority, computeLocationScore, detectCountryScope } from "@/lib/jobs/location-priority";
import { scoreJobLocal } from "@/lib/jobs/deepseek-job-scorer";
import { fetchGreenhouseBoard, fetchLeverBoard, fetchAshbyBoard } from "@/lib/jobs/connectors/public-ats";
import {
  filterJobForTargetProfile,
  type TargetProfile,
} from "@/lib/jobs/profile-filter";
import type { ImportedJob, SourceImportMode } from "@/lib/jobs/types";

/* ─── Auth ────────────────────────────────── */

/**
 * Vérifie si la requête provient d'un environnement exposé publiquement.
 * En localhost (127.0.0.1, ::1, localhost), le token est optionnel.
 * Dès que l'app est exposée, le token est obligatoire.
 */
function isLocalRequest(request: Request): boolean {
  const host = request.headers.get("host") || "";
  // localhost / 127.0.0.1 / ::1 = local
  if (/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host)) return true;
  // Adresse réseau local 192.168.x.x, 10.x.x.x
  if (/^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)) return true;
  // .local mDNS
  if (host.endsWith(".local")) return true;
  return false;
}

function checkAuth(request: Request): "ok" | "missing" | "invalid" {
  // En localhost/dev, le token est optionnel
  if (process.env.NODE_ENV !== "production" && isLocalRequest(request)) return "ok";

  const token = request.headers.get("x-api-token");
  const expected = process.env.SOURCING_CRON_TOKEN;

  // En production ou exposé, le token est obligatoire
  if (!expected) return "missing";
  if (!token) return "missing";
  return token === expected ? "ok" : "invalid";
}

/* ─── Types ───────────────────────────────── */

interface SourcingCronParams {
  dryRun: boolean;
  maxSources: number;
  maxJobsPerSource: number;
  maxTotalJobs: number;
  onlyRecentDays: number;
  minScoreToCreate: number;
}

interface CronReport {
  dryRun: boolean;
  sourcesScanned: number;
  jobsFetched: number;
  rawJobsCreated: number;
  jobsCreated: number;
  duplicatesSkipped: number;
  rejectedByProfile: number;
  rejectedByLocation: number;
  rejectedBySeniority: number;
  scoredJobs: number;
  // International
  acceptedFranceMarket: number;
  acceptedFrenchProfile: number;
  acceptedRemoteFrance: number;
  rejectedInternationalNotCompatible: number;
  topJobs: Array<{
    title: string; company: string; location?: string;
    score: number; source: string; sourceUrl: string; reasons: string[];
    intlTag?: string;
  }>;
  errorsBySource: Record<string, string>;
  skippedSources: string[];
}

interface CronConfig {
  maxSourcesPerRun: number;
  maxJobsPerSource: number;
  maxTotalJobsPerRun: number;
  onlyRecentDays: number;
  minScoreToCreateJob: number;
  minScoreToShowInDashboard: number;
  createRawJobsForLowScore: boolean;
}

const DEFAULT_CRON_CONFIG: CronConfig = {
  maxSourcesPerRun: 12,
  maxJobsPerSource: 30,
  maxTotalJobsPerRun: 200,
  onlyRecentDays: 21,
  minScoreToCreateJob: 55,
  minScoreToShowInDashboard: 65,
  createRawJobsForLowScore: true,
};

/* ─── Helpers ─────────────────────────────── */

function parseSourceId(sourceId: string): { provider: string; company: string } | null {
  if (sourceId.startsWith("greenhouse-")) return { provider: "greenhouse", company: sourceId.replace("greenhouse-", "") };
  if (sourceId.startsWith("lever-")) return { provider: "lever", company: sourceId.replace("lever-", "") };
  if (sourceId.startsWith("ashby-")) return { provider: "ashby", company: sourceId.replace("ashby-", "") };
  return null;
}

function isRecent(publishedAt: string | undefined | null, maxDays: number): boolean {
  if (!publishedAt) return true;
  try {
    const date = new Date(publishedAt);
    if (isNaN(date.getTime())) return true;
    const cutoff = new Date(Date.now() - maxDays * 24 * 60 * 60 * 1000);
    return date >= cutoff;
  } catch { return true; }
}

async function buildTargetProfile(): Promise<TargetProfile> {
  const profile = await prisma.profile.findFirst({
    include: { skills: true },
  });

  if (!profile) {
    return {
      title: "Directeur Commercial",
      functions: ["Directeur Commercial", "Directeur Général"],
      sectors: ["Industrie", "SaaS", "Distribution B2B"],
      location: "Aix en Provence, France",
      yearsExp: 20,
      languages: ["Français", "Anglais"],
      skills: [],
    };
  }

  let functions: string[] = [];
  try { functions = JSON.parse(profile.functions || "[]"); } catch { functions = []; }
  let sectors: string[] = [];
  try { sectors = JSON.parse(profile.sectors || "[]"); } catch { sectors = []; }
  let languages: string[] = [];
  try { languages = JSON.parse(profile.languages || "[]"); } catch { languages = []; }

  return {
    title: profile.title || "Directeur Commercial",
    functions,
    sectors,
    location: profile.location || "",
    yearsExp: profile.yearsExp || null,
    languages,
    skills: (profile.skills || []).map((s) => s.name),
  };
}

async function fetchAndFilterSource(
  sourceId: string,
  params: SourcingCronParams,
  target: TargetProfile,
): Promise<{
  kept: ImportedJob[];
  fetched: number;
  filtered: number;
  error?: string;
  intlAccepted: number;
  intlRejected: number;
}> {
  const parsed = parseSourceId(sourceId);
  if (!parsed) return { kept: [], fetched: 0, filtered: 0, intlAccepted: 0, intlRejected: 0, error: "SourceId non reconnue" };

  let offers: ImportedJob[] = [];
  try {
    switch (parsed.provider) {
      case "greenhouse": offers = await fetchGreenhouseBoard(parsed.company); break;
      case "lever": offers = await fetchLeverBoard(parsed.company); break;
      case "ashby": offers = await fetchAshbyBoard(parsed.company); break;
    }
  } catch (e: unknown) {
    return { kept: [], fetched: 0, filtered: 0, intlAccepted: 0, intlRejected: 0, error: (e as Error).message };
  }

  // Filtrer par date
  const recent = offers.filter((o) => isRecent(o.publishedAt, params.onlyRecentDays));

  // Appliquer filtre profil (avec règle internationale)
  const kept: ImportedJob[] = [];
  let intlAccepted = 0;
  let intlRejected = 0;
  for (const offer of recent) {
    const result = filterJobForTargetProfile(
      offer.title,
      offer.description || "",
      offer.location,
      target,
    );

    // Détection internationale
    const { detectInternationalCompatibility } = await import("@/lib/jobs/profile-filter");
    const intl = detectInternationalCompatibility(
      offer.title,
      offer.description || "",
      offer.location,
    );

    if (intl.isInternational) {
      if (result.shouldKeep) intlAccepted++;
      else intlRejected++;
    }

    if (result.shouldKeep && result.relevanceScore >= params.minScoreToCreate) {
      kept.push(offer);
    }
  }

  return {
    kept: kept.slice(0, params.maxJobsPerSource),
    fetched: offers.length,
    filtered: kept.length,
    intlAccepted,
    intlRejected,
  };
}

/* ─── Endpoint ────────────────────────────── */

export async function GET() {
  return NextResponse.json({
    endpoint: "Cron Sourcing PRSTO V2.2.3",
    method: "POST pour lancer le cron quotidien",
    params: "dryRun, maxSources, maxJobsPerSource, maxTotalJobs",
    auth: process.env.SOURCING_CRON_TOKEN ? "Token configuré" : "Token non configuré",
    env: process.env.NODE_ENV || "development",
    config: DEFAULT_CRON_CONFIG,
  });
}

export async function POST(request: Request) {
  const auth = checkAuth(request);
  if (auth !== "ok") {
    return NextResponse.json({ error: auth === "missing" ? "Token manquant" : "Token invalide" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const params: SourcingCronParams = {
    dryRun: body.dryRun === true,
    maxSources: Math.min(12, parseInt(body.maxSources as string || "12") || 12),
    maxJobsPerSource: Math.min(50, parseInt(body.maxJobsPerSource as string || "30") || 30),
    maxTotalJobs: Math.min(500, parseInt(body.maxTotalJobs as string || "200") || 200),
    onlyRecentDays: parseInt(body.onlyRecentDays as string || "21") || 21,
    minScoreToCreate: parseInt(body.minScoreToCreate as string || "55") || 55,
  };

  const report: CronReport = {
    dryRun: params.dryRun,
    sourcesScanned: 0,
    jobsFetched: 0,
    rawJobsCreated: 0,
    jobsCreated: 0,
    duplicatesSkipped: 0,
    rejectedByProfile: 0,
    rejectedByLocation: 0,
    rejectedBySeniority: 0,
    scoredJobs: 0,
    acceptedFranceMarket: 0,
    acceptedFrenchProfile: 0,
    acceptedRemoteFrance: 0,
    rejectedInternationalNotCompatible: 0,
    topJobs: [],
    errorsBySource: {},
    skippedSources: [],
  };

  try {
    // 1. Charger le profil cible
    const target = await buildTargetProfile();

    // 2. Lister les sources READY_FOR_CRON
    const allSources = await prisma.importSource.findMany({
      where: { enabled: true },
    });

    const cronSources: Array<{ sourceId: string; importMode: SourceImportMode }> = [];
    for (const src of allSources) {
      if (!src.configJson) continue;
      try {
        const cap = JSON.parse(src.configJson);
        const mode = (cap.importMode || "") as SourceImportMode;
        if (mode.startsWith("AUTO_")) {
          cronSources.push({ sourceId: src.name, importMode: mode });
        } else {
          report.skippedSources.push(`${src.name} (${mode})`);
        }
      } catch { /* ignore */ }
    }

    // Limiter le nombre de sources
    const sourcesToRun = cronSources.slice(0, params.maxSources);
    report.sourcesScanned = sourcesToRun.length;

    // 3. Fetch et filtrer chaque source
    let totalCreated = 0;
    for (const { sourceId } of sourcesToRun) {
      if (totalCreated >= params.maxTotalJobs) break;

      const result = await fetchAndFilterSource(sourceId, params, target);
      report.jobsFetched += result.fetched;

      if (result.error) {
        report.errorsBySource[sourceId] = result.error;
        continue;
      }

      report.rejectedByProfile += Math.max(0, result.fetched - result.filtered);
      report.acceptedFranceMarket += result.intlAccepted;
      report.rejectedInternationalNotCompatible += result.intlRejected;

      if (params.dryRun) continue;

      // Créer les Jobs pour les offres filtrées
      for (const offer of result.kept) {
        if (totalCreated >= params.maxTotalJobs) break;

        try {
          let importSrc = await prisma.importSource.findUnique({ where: { name: sourceId } });
          if (!importSrc) {
            importSrc = await prisma.importSource.create({
              data: { name: sourceId, type: "ats", enabled: true },
            });
          }

          // Déduplication
          const dedup = await checkDuplicate(
            offer.externalId, offer.sourceUrl,
            offer.title, offer.company, offer.location,
          );
          if (dedup.status !== "new") {
            if (dedup.existingId) {
              await prisma.job.update({ where: { id: dedup.existingId }, data: { lastSeenAt: new Date() } });
            }
            report.duplicatesSkipped++;
            continue;
          }

          const locPriority = detectLocationPriority(offer.location || null);
          const countryScope = detectCountryScope(offer.location || null);
          const checksum = computeChecksum(offer.title, offer.company || "", offer.location || "");

          const job = await prisma.job.create({
            data: {
              sourceId: importSrc.id,
              externalId: offer.externalId,
              sourceUrl: offer.sourceUrl,
              title: offer.title,
              company: offer.company,
              location: offer.location,
              locationPriority: locPriority,
              countryScope,
              remotePolicy: offer.remotePolicy,
              contractType: offer.contractType,
              salaryMin: offer.salaryMin,
              salaryMax: offer.salaryMax,
              description: offer.description,
              publishedAt: offer.publishedAt ? new Date(offer.publishedAt) : undefined,
              checksum,
              status: "new",
            },
          });

          // Scoring
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
              locationScore: scoreData.locationScore || computeLocationScore(locPriority),
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

          report.scoredJobs++;
          totalCreated++;
          report.jobsCreated++;

          // Top jobs
          if (report.topJobs.length < 10 && (scoreData.globalScore || 0) >= 55) {
            report.topJobs.push({
              title: offer.title,
              company: offer.company || "",
              location: offer.location,
              score: scoreData.globalScore || 0,
              source: sourceId,
              sourceUrl: offer.sourceUrl,
              reasons: scoreData.reasons || [],
            });
          }
        } catch (e: unknown) {
          report.errorsBySource[sourceId] = (e as Error).message?.slice(0, 120);
        }
      }

      // Mettre à jour lastRunAt sur ImportSource
      if (!params.dryRun) {
        try {
          await prisma.importSource.update({
            where: { name: sourceId },
            data: { lastRunAt: new Date(), status: "ok" },
          });
        } catch { /* ignore */ }
      }
    }

    // Trier top jobs par score
    report.topJobs.sort((a, b) => b.score - a.score);

    // Anti-pollution : si une source a un volume anormal, logger
    const ANOMALY_THRESHOLD = 500;
    if (report.jobsFetched > ANOMALY_THRESHOLD * 2 && !params.dryRun) {
      report.errorsBySource["_anti_pollution"] = `Volume anormalement élevé: ${report.jobsFetched} offres. Vérifier les sources.`;
    }

    // Notification webhook (optionnelle)
    const webhookUrl = process.env.JOB_REPORT_WEBHOOK_URL;
    if (webhookUrl && !params.dryRun) {
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            version: "v2.2.4",
            timestamp: new Date().toISOString(),
            sourcesScanned: report.sourcesScanned,
            jobsFetched: report.jobsFetched,
            jobsCreated: report.jobsCreated,
            duplicatesSkipped: report.duplicatesSkipped,
            rejectedByProfile: report.rejectedByProfile,
            scoredJobs: report.scoredJobs,
            topJobs: report.topJobs.slice(0, 5),
            errorsBySource: report.errorsBySource,
          }),
          signal: AbortSignal.timeout(10000),
        });
      } catch { /* webhook silencieux en cas d'échec */ }
    }

    // Créer un JobSearchRun pour historique
    if (!params.dryRun) {
      try {
        await prisma.jobSearchRun.create({
          data: {
            mode: "morning",
            status: report.errorsBySource && Object.keys(report.errorsBySource).length > 0 ? "partial" : report.jobsCreated > 0 ? "success" : "success",
            fetchedCount: report.jobsFetched,
            createdCount: report.jobsCreated,
            duplicateCount: report.duplicatesSkipped,
            rejectedCount: report.rejectedByProfile,
            logsJson: JSON.stringify({
              version: "v2.2.5",
              config: params,
              sourcesScanned: report.sourcesScanned,
              rejectedByProfile: report.rejectedByProfile,
              scoredJobs: report.scoredJobs,
              intlAccepted: report.acceptedFranceMarket,
              intlRejected: report.rejectedInternationalNotCompatible,
              topJobs: report.topJobs.slice(0, 10),
              errorsBySource: report.errorsBySource,
              skippedSources: report.skippedSources,
            }),
          },
        });
      } catch { /* ignore */ }
    }

    return NextResponse.json({ success: true, ...report });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message, ...report }, { status: 500 });
  }
}
