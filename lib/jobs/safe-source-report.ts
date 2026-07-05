import { prisma } from "@/lib/prisma";

export interface SafeSourceDailyReport {
  generatedAt: string;
  period: { from: string; to: string };
  sourcesRun: number;
  jobsFound: number;
  jobsImported: number;
  duplicates: number;
  skipped: number;
  invalid: number;
  errors: number;
  semanticScoredCount: number;
  topImported: Array<{
    title: string;
    company: string;
    location: string;
    locationPriority: number | null;
    globalScore: number | null;
    semanticScore: number | null;
    recommendation: string | null;
    sourceLabel: string;
    jobId: string;
  }>;
  sourcesInError: Array<{
    label: string;
    lastStatus: string | null;
    lastError: string | null;
    lastReasonCode: string | null;
    consecutiveErrors: number;
  }>;
  refusalSummary: Array<{ reasonCode: string; count: number }>;
  auditEntries: Array<{
    sourceLabel: string;
    reasonCode: string;
    jobsFound: number;
    jobsImported: number;
    durationMs: number;
  }>;
}

export async function generateSafeSourceDailyReport(): Promise<SafeSourceDailyReport> {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // All sources that have run
  const allSources = await prisma.safeJobSource.findMany({
    orderBy: { updatedAt: "desc" },
  });

  const recentlyRun = allSources.filter(
    (s) => s.lastRunAt && new Date(s.lastRunAt) >= twentyFourHoursAgo,
  );

  // Aggregate stats from sources
  const jobsFound = recentlyRun.reduce((sum, s) => sum + s.lastJobsFound, 0);
  const jobsImported = recentlyRun.reduce((sum, s) => sum + s.lastJobsImported, 0);
  const sourcesInError = allSources
    .filter((s) => s.lastStatus === "failed" || s.lastStatus === "refused" || s.lastError)
    .map((s) => ({
      label: s.label,
      lastStatus: s.lastStatus,
      lastError: s.lastError,
      lastReasonCode: s.lastReasonCode,
      consecutiveErrors: s.consecutiveErrors,
    }));

  // Audit entries from JobSearchRun logs
  const recentRuns = await prisma.jobSearchRun.findMany({
    where: { startedAt: { gte: twentyFourHoursAgo } },
    orderBy: { startedAt: "desc" },
    take: 100,
  });

  const auditEntries = recentRuns
    .filter((r) => {
      if (!r.logsJson) return false;
      try {
        const logs = JSON.parse(r.logsJson);
        return !!logs.safeSourceId;
      } catch { return false; }
    })
    .map((r) => {
      const logs = JSON.parse(r.logsJson!);
      return {
        sourceLabel: logs.safeSourceLabel || "inconnu",
        reasonCode: logs.reasonCode || "inconnu",
        jobsFound: logs.jobsFound || 0,
        jobsImported: logs.jobsImported || 0,
        durationMs: logs.durationMs || 0,
      };
    });

  // Refusal summary from reason codes
  const refusalMap = new Map<string, number>();
  for (const s of allSources) {
    if (s.lastReasonCode && s.lastStatus === "refused") {
      refusalMap.set(s.lastReasonCode, (refusalMap.get(s.lastReasonCode) || 0) + 1);
    }
  }
  const refusalSummary = Array.from(refusalMap.entries()).map(([reasonCode, count]) => ({
    reasonCode,
    count,
  }));

  // Duplicates/invalid from recent JobSearchRun logs
  let duplicates = 0;
  let totalSkipped = 0;
  let invalid = 0;
  let semanticScoredCountVal = 0;
  for (const r of recentRuns) {
    if (!r.logsJson) continue;
    try {
      const logs = JSON.parse(r.logsJson);
      if (logs.safeSourceId) {
        duplicates += logs.duplicates || 0;
        totalSkipped += logs.skipped || 0;
        invalid += logs.invalid || 0;
        semanticScoredCountVal += logs.semanticScoredCount || 0;
      }
    } catch { /* skip unparseable */ }
  }

  // Top imported jobs with semantic scores
  const firecrawlSource = await prisma.importSource.findUnique({
    where: { name: "Firecrawl Safe" },
  });

  let topImported: SafeSourceDailyReport["topImported"] = [];
  if (firecrawlSource) {
    const recentJobs = await prisma.job.findMany({
      where: {
        sourceId: firecrawlSource.id,
        firstSeenAt: { gte: twentyFourHoursAgo },
      },
      include: { score: true },
      orderBy: { firstSeenAt: "desc" },
      take: 50,
    });

    topImported = recentJobs
      .filter((j) => j.score)
      .sort((a, b) => {
        const sa = a.score!.semanticScore ?? 0;
        const sb = b.score!.semanticScore ?? 0;
        return sb - sa;
      })
      .slice(0, 10)
      .map((j) => ({
        title: j.title,
        company: j.company || "Inconnue",
        location: j.location || "Inconnue",
        locationPriority: j.locationPriority,
        globalScore: j.score?.globalScore ?? null,
        semanticScore: j.score?.semanticScore ?? null,
        recommendation: j.score?.recommendation ?? null,
        sourceLabel: "Firecrawl Safe",
        jobId: j.id,
      }));
  }

  return {
    generatedAt: now.toISOString(),
    period: { from: twentyFourHoursAgo.toISOString(), to: now.toISOString() },
    sourcesRun: recentlyRun.length,
    jobsFound,
    jobsImported,
    duplicates,
    skipped: totalSkipped,
    invalid,
    errors: sourcesInError.length,
    semanticScoredCount: semanticScoredCountVal,
    topImported,
    sourcesInError,
    refusalSummary,
    auditEntries,
  };
}
