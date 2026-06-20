import type { JobConnector, ImportedJob, SearchQuery } from "../types";

const ASHBY_BOARDS: string[] = [];

export const ashbyConnector: JobConnector = {
  id: "ashby",
  name: "Ashby ATS",
  type: "ats",

  async search(_query: SearchQuery): Promise<ImportedJob[]> {
    // TODO: Ashby expose une API publique
    // Documentation : https://developers.ashbyhq.com/reference
    // Format : https://api.ashbyhq.com/posting-api/job-board/NOM_ENTREPRISE
    // À implémenter avec les boards des entreprises cibles
    if (ASHBY_BOARDS.length === 0) return [];

    const allOffers: ImportedJob[] = [];
    for (const board of ASHBY_BOARDS) {
      try {
        const res = await fetch(board, {
          headers: { "User-Agent": "Mozilla/5.0" },
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) continue;
        const data = await res.json();
        const jobs = data.jobs || [];
        for (const job of jobs) {
          allOffers.push({
            source: "ashby",
            sourceUrl: job.applyUrl || "",
            title: job.title || "",
            company: board,
            location: job.location || "",
            description: job.descriptionHtml?.replace(/<[^>]+>/g, "") || job.description || "",
            publishedAt: job.publishedDate || undefined,
          });
        }
      } catch { /* skip */ }
    }

    return allOffers;
  },
};
