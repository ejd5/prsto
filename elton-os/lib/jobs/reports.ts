import { prisma } from "@/lib/prisma";
import { runJobImport } from "./worker";
import { generateJsonWithDeepSeek } from "@/lib/ai/deepseek";
import type { ImportOptions } from "./worker";

export interface JobReport {
  id: string;
  mode: "morning" | "evening" | "manual";
  generatedAt: string;
  lastRun: {
    status: string;
    fetchedCount: number;
    createdCount: number;
    duplicateCount: number;
    startedAt: string;
    finishedAt: string | null;
  } | null;
  connectorStats: Record<string, { fetched: number; created: number; duplicates: number }> | null;
  topPACA: JobOfferBrief[];
  topIDF: JobOfferBrief[];
  topFrance: JobOfferBrief[];
  topInternational: JobOfferBrief[];
  topGlobal: JobOfferBrief[];
  newJobsCount: number;
  duplicateCount: number;
  sourcesInError: string[];
  recommendations: string[];
  /** Statut de la notification (webhook V1) */
  notification?: {
    sent: boolean;
    channels: string[];
    errors?: string[];
    sentAt?: string;
  };
}

interface JobOfferBrief {
  id: string;
  title: string;
  company: string | null;
  location: string | null;
  priorityLabel: string;
  priority: number | null;
  score: number | null;
  matchScore: number | null;
  sourceName: string | null;
  sourceUrl: string | null;
  createdAt: string;
}

function getPriorityLabel(p: number | null): string {
  if (p === 1) return "PACA";
  if (p === 2) return "IDF";
  if (p === 3) return "France";
  if (p === 4) return "Intl";
  return "?";
}

function buildJobBrief(job: {
  id: string; title: string; company: string | null; location: string | null;
  locationPriority: number | null; sourceUrl: string | null; firstSeenAt: Date;
  source: { name: string } | null;
  score: { globalScore: number | null; matchScore: number | null } | null;
}): JobOfferBrief {
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    priorityLabel: getPriorityLabel(job.locationPriority),
    priority: job.locationPriority,
    score: job.score?.globalScore ?? null,
    matchScore: job.score?.matchScore ?? null,
    sourceName: job.source?.name ?? null,
    sourceUrl: job.sourceUrl,
    createdAt: job.firstSeenAt.toISOString(),
  };
}

/**
 * Génère un rapport complet après un import programmé (morning/evening).
 * Si runId est fourni, utilise ce run. Sinon, crée un run et importe.
 */
export async function generateJobReport(
  mode: "morning" | "evening" | "manual",
  runId?: string,
  importOptions?: Partial<ImportOptions>
): Promise<JobReport> {
  // Si pas de runId fourni, lancer un import d'abord
  let targetRunId = runId;

  if (!targetRunId) {
    const opts: ImportOptions = {
      mode,
      dryRun: importOptions?.dryRun ?? false,
      source: importOptions?.source ?? "all",
      maxPages: importOptions?.maxPages ?? 2,
      maxJobsPerRun: importOptions?.maxJobsPerRun ?? 250,
    };
    const result = await runJobImport(opts);
    targetRunId = result.runId;
  }

  // Récupérer le run
  const lastRun = targetRunId
    ? await prisma.jobSearchRun.findUnique({
        where: { id: targetRunId },
      })
    : await prisma.jobSearchRun.findFirst({
        where: { mode },
        orderBy: { startedAt: "desc" },
      });

  // Récupérer les jobs créés depuis le début du run
  const runStart = lastRun?.startedAt || new Date(0);
  const recentJobs = await prisma.job.findMany({
    where: {
      OR: [
        { firstSeenAt: { gte: runStart } },
        { lastSeenAt: { gte: runStart } },
      ],
    },
    include: { score: true, source: { select: { name: true } } },
    orderBy: [{ locationPriority: "asc" }, { score: { globalScore: "desc" } }],
    take: 50,
  });

  // Trier par priorité
  const topPACA = recentJobs.filter(j => j.locationPriority === 1).slice(0, 5).map(buildJobBrief);
  const topIDF = recentJobs.filter(j => j.locationPriority === 2).slice(0, 5).map(buildJobBrief);
  const topFrance = recentJobs.filter(j => (j.locationPriority === 3 || !j.locationPriority)).slice(0, 5).map(buildJobBrief);
  const topInternational = recentJobs.filter(j => j.locationPriority === 4).slice(0, 5).map(buildJobBrief);

  // Top global (tous, triés par score)
  const topGlobal = [...recentJobs]
    .sort((a, b) => (b.score?.globalScore ?? 0) - (a.score?.globalScore ?? 0))
    .slice(0, 10)
    .map(buildJobBrief);

  // Connector stats
  let connectorStats: Record<string, { fetched: number; created: number; duplicates: number }> | null = null;
  if (lastRun?.logsJson) {
    try {
      const logs = JSON.parse(lastRun.logsJson);
      connectorStats = logs.connectorStats || null;
    } catch { /* ignore */ }
  }

  // Notification status depuis logsJson
  let notification: JobReport["notification"] = undefined;
  if (lastRun?.logsJson) {
    try {
      const logs = JSON.parse(lastRun.logsJson);
      if (logs.notification) {
        notification = logs.notification;
      }
    } catch { /* ignore */ }
  }

  // Recommandations
  const recommendations: string[] = [];
  if (topPACA.length > 0) recommendations.push(`${topPACA.length} offre(s) prioritaire(s) en PACA à examiner.`);
  if (topIDF.length > 0) recommendations.push(`${topIDF.length} offre(s) en Île-de-France.`);
  if (topFrance.length === 0 && topPACA.length === 0) recommendations.push("Aucune nouvelle offre détectée. Vérifiez les sources.");
  if (lastRun && lastRun.fetchedCount === 0) recommendations.push("Aucune offre récupérée lors du dernier import. Vérifiez les connecteurs.");

  // Sources en erreur
  const sourcesInError: string[] = [];
  if (connectorStats) {
    for (const [name, stats] of Object.entries(connectorStats)) {
      if (stats.fetched === 0 && stats.created === 0) {
        sourcesInError.push(name);
      }
    }
  }
  if (lastRun?.errorMessage) {
    sourcesInError.push(...lastRun.errorMessage.split("; ").filter(Boolean));
  }

  // Résumé DeepSeek (optionnel)
  if (lastRun && lastRun.fetchedCount > 0 && topPACA.length + topIDF.length + topFrance.length > 0) {
    try {
      const stats = {
        dernierRun: { status: lastRun.status, trouvées: lastRun.fetchedCount, nouvelles: lastRun.createdCount, doublons: lastRun.duplicateCount },
        topPACA: topPACA.map(j => ({ titre: j.title, entreprise: j.company, lieu: j.location, score: j.score })),
        topIDF: topIDF.map(j => ({ titre: j.title, entreprise: j.company, lieu: j.location, score: j.score })),
      };
      const result = await generateJsonWithDeepSeek<{ rapport: string }>({
        systemPrompt: "Génère un résumé professionnel concis (3-5 lignes) sur les nouvelles offres d'emploi.",
        userPrompt: `Rapport ${mode === "morning" ? "matinal" : mode === "evening" ? "de fin d'après-midi" : "manuel"} : ${JSON.stringify(stats)}`,
        temperature: 0.3,
      });
      if (result.success && result.data?.rapport) {
        recommendations.unshift(result.data.rapport);
      }
    } catch { /* fallback */ }
  }

  return {
    id: lastRun?.id || "no-run",
    mode: (lastRun?.mode as "morning" | "evening" | "manual") || mode,
    generatedAt: new Date().toISOString(),
    lastRun: lastRun ? {
      status: lastRun.status,
      fetchedCount: lastRun.fetchedCount,
      createdCount: lastRun.createdCount,
      duplicateCount: lastRun.duplicateCount,
      startedAt: lastRun.startedAt.toISOString(),
      finishedAt: lastRun.finishedAt?.toISOString() || null,
    } : null,
    connectorStats,
    topPACA,
    topIDF,
    topFrance,
    topInternational,
    topGlobal,
    newJobsCount: lastRun?.createdCount || 0,
    duplicateCount: lastRun?.duplicateCount || 0,
    sourcesInError: [...new Set(sourcesInError)],
    recommendations,
    notification,
  };
}

/**
 * Lance un import programmé et génère le rapport correspondant.
 * Utilisé par les routes cron matin/soir.
 */
export async function runScheduledJobImport(
  mode: "morning" | "evening",
  options?: { maxPages?: number; maxJobsPerRun?: number }
): Promise<JobReport> {
  return generateJobReport(mode, undefined, {
    dryRun: false,
    source: "all",
    maxPages: options?.maxPages ?? 2,
    maxJobsPerRun: options?.maxJobsPerRun ?? 250,
  });
}
