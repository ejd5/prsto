import type { JobConnector, ImportedJob, SearchQuery } from "../types";

const LEVER_BOARDS: string[] = [];

export const leverConnector: JobConnector = {
  id: "lever",
  name: "Lever ATS",
  type: "ats",

  async search(_query: SearchQuery): Promise<ImportedJob[]> {
    // TODO: Lever utilise des sous-domaines comme NOM_ENTREPRISE.lever.co
    // À implémenter : crawler les boards Lever des entreprises cibles
    // Format : https://NOM_ENTREPRISE.lever.co/
    if (LEVER_BOARDS.length === 0) return [];

    const allOffers: ImportedJob[] = [];
    const headers = {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    };

    for (const board of LEVER_BOARDS) {
      try {
        const res = await fetch(board, { headers, signal: AbortSignal.timeout(8000) });
        if (!res.ok) continue;
        const html = await res.text();
        // Lever expose son API JSON sur /postings
        const apiMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({[\s\S]+?});/);
        if (apiMatch) {
          try {
            const state = JSON.parse(apiMatch[1].trim());
            const postings = state?.postings || [];
            for (const posting of postings) {
              allOffers.push({
                source: "lever",
                sourceUrl: posting.hostedUrl || posting.applyUrl || board,
                title: posting.text || posting.title || "",
                company: posting.categories?.team || "",
                location: posting.categories?.location || "",
                description: posting.descriptionPlain || posting.description || "",
                publishedAt: posting.createdAt || undefined,
              });
            }
          } catch { /* skip */ }
        }
      } catch { /* skip */ }
    }

    return allOffers;
  },
};
