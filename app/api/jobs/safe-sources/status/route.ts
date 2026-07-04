import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ConsecutiveErrorThreshold } from "@/lib/jobs/safe-source-runner";

function checkAuth(request: Request): "ok" | "missing" | "invalid" {
  if (process.env.NODE_ENV !== "production") return "ok";
  const token = request.headers.get("x-api-token");
  const expected = process.env.SOURCING_CRON_TOKEN;
  if (!expected) return "ok";
  if (!token) return "missing";
  return token === expected ? "ok" : "invalid";
}

export async function GET(request: Request) {
  const auth = checkAuth(request);
  if (auth !== "ok") {
    return NextResponse.json(
      { error: auth === "missing" ? "Token manquant" : "Token invalide" },
      { status: 401 },
    );
  }

  try {
    const safeSourcesRunEnabled = process.env.SAFE_SOURCES_RUN_ENABLED === "true";
    const safeSourcesCronEnabled = process.env.SAFE_SOURCES_CRON_ENABLED === "true";
    const firecrawlEnabled = process.env.FIRECRAWL_ENABLED === "true";
    const firecrawlKey = (process.env.FIRECRAWL_API_KEY || "").trim();
    const firecrawlConfigured = firecrawlKey.length > 0;

    const firecrawlDailyMaxRequests = parseInt(process.env.FIRECRAWL_DAILY_MAX_REQUESTS || "25", 10);
    const firecrawlDailyMaxJobsImported = parseInt(process.env.FIRECRAWL_DAILY_MAX_JOBS_IMPORTED || "100", 10);
    const safeSourcesMaxPerRun = parseInt(process.env.SAFE_SOURCES_MAX_PER_RUN || "5", 10);
    const safeSourcesMaxJobsPerSource = parseInt(process.env.SAFE_SOURCES_MAX_JOBS_PER_SOURCE || "20", 10);

    const allSources = await prisma.safeJobSource.findMany();
    const sourcesTotal = allSources.length;
    const sourcesEnabled = allSources.filter((s) => s.enabled).length;
    const sourcesBlockedByConsecutiveErrors = allSources.filter(
      (s) => s.consecutiveErrors >= ConsecutiveErrorThreshold,
    ).length;

    // Daily usage counters
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todaysSafeRuns = await prisma.jobSearchRun.findMany({
      where: { startedAt: { gte: todayStart } },
      select: { logsJson: true },
    });
    let dailyRequestsUsed = 0;
    let dailyJobsImportedUsed = 0;
    for (const run of todaysSafeRuns) {
      if (!run.logsJson) continue;
      try {
        const logs = JSON.parse(run.logsJson);
        if (logs.safeSourceId) {
          dailyRequestsUsed++;
          dailyJobsImportedUsed += logs.jobsImported || 0;
        }
      } catch { /* skip */ }
    }

    return NextResponse.json({
      success: true,
      config: {
        safeSourcesRunEnabled,
        safeSourcesCronEnabled,
        firecrawlEnabled,
        firecrawlConfigured,
        firecrawlDailyMaxRequests,
        firecrawlDailyMaxJobsImported,
        safeSourcesMaxPerRun,
        safeSourcesMaxJobsPerSource,
        sourcesTotal,
        sourcesEnabled,
        sourcesBlockedByConsecutiveErrors,
        dailyRequestsUsed,
        dailyJobsImportedUsed,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
