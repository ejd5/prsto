import { prisma } from "@/lib/prisma";
import { runBrowserSearch } from "../browser-agent/browser-agent";
import { getSessionAge, sessionExists } from "../browser-agent/session-store";
import type { ImportedJob, SearchQuery } from "../types";

const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24h

export const browserAgentConnector = {
  id: "browser-agent",
  name: "Browser Agent",
  type: "browser" as const,

  async search(_query: SearchQuery): Promise<ImportedJob[]> {
    return [];
  },

  async runAllSearches(): Promise<{ offers: ImportedJob[]; totals: Record<string, { found: number; details: number }> }> {
    const configs = await prisma.browserSearchConfig.findMany({
      where: { enabled: true },
    });
    if (configs.length === 0) return { offers: [], totals: {} };

    const allJobs: ImportedJob[] = [];
    const totals: Record<string, { found: number; details: number }> = {};

    for (const config of configs) {
      const platform = config.platform as "linkedin" | "indeed" | "apec";

      // Vérifier session
      if (!sessionExists(platform)) {
        await prisma.browserSearchConfig.update({
          where: { id: config.id },
          data: { lastError: "Session non configurée, lastOffersFound: 0, lastDetailsFetched: 0" },
        });
        continue;
      }
      const age = getSessionAge(platform);
      if (age && age > SESSION_MAX_AGE_MS) {
        await prisma.browserSearchConfig.update({
          where: { id: config.id },
          data: { lastError: "Session expirée" },
        });
        continue;
      }

      const result = await runBrowserSearch({
        id: config.id,
        platform,
        searchUrl: config.searchUrl,
        label: config.label,
        enabled: config.enabled,
        maxResultsPerRun: config.maxResultsPerRun,
        locationPriority: config.locationPriority ?? undefined,
        scrollEnabled: config.scrollEnabled,
        maxScrolls: config.maxScrolls,
        scrollDelayMs: config.scrollDelayMs,
        fetchDetailsEnabled: config.fetchDetailsEnabled,
        maxDetailsPerRun: config.maxDetailsPerRun,
      });

      // Mettre à jour la config
      await prisma.browserSearchConfig.update({
        where: { id: config.id },
        data: {
          lastRunAt: new Date(),
          lastError: result.error || null,
          lastOffersFound: result.jobs.length,
          lastDetailsFetched: result.detailsFetched,
        },
      });

      // Initialiser les totaux
      if (!totals[`${config.platform}_browser`]) {
        totals[`${config.platform}_browser`] = { found: 0, details: 0 };
      }
      totals[`${config.platform}_browser`].found += result.jobs.length;
      totals[`${config.platform}_browser`].details += result.detailsFetched;

      // Mapper vers ImportedJob
      for (const job of result.jobs) {
        allJobs.push({
          source: `${config.platform}_browser`,
          externalId: job.externalId || `${config.platform}_browser::${Buffer.from(job.sourceUrl || job.title + job.company).toString("base64").slice(0, 40)}`,
          sourceUrl: job.sourceUrl,
          title: job.title,
          company: job.company,
          location: job.location,
          description: job.description || undefined,
          publishedAt: job.publishedAt || undefined,
        });
      }
    }

    return { offers: allJobs, totals };
  },
};
