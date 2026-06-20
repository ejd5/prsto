import type { JobConnector, ImportedJob, SearchQuery } from "../types";
import { parseJsonLdJobPosting } from "../parsers/jsonld-job-parser";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "fr,fr-FR;q=0.9,en;q=0.8",
};

function slugify(text: string): string {
  return text.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export const linkedinPublicConnector: JobConnector = {
  id: "linkedin-public",
  name: "LinkedIn (pages publiques)",
  type: "html",

  async search(query: SearchQuery): Promise<ImportedJob[]> {
    const keywordSlug = slugify(query.keyword);
    const locationSlug = slugify(query.location);
    const urls = [
      `https://fr.linkedin.com/jobs/${keywordSlug}-emplois-${locationSlug}`,
      `https://fr.linkedin.com/jobs/${keywordSlug}-emplois`,
    ];

    for (const url of urls) {
      try {
        const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(10000), redirect: "follow" });
        if (!res.ok) continue;
        const html = await res.text();
        if (html.length < 500) continue;
        if (html.includes("login") || html.includes("connexion")) {
          // TODO: implémenter Personal Browser Agent pour LinkedIn après connexion
          // Le connecteur actuel ne fonctionne que sur les pages publiques
          continue;
        }
        // Tentative JSON-LD
        const jsonld = parseJsonLdJobPosting(html);
        if (jsonld.length > 0) {
          return jsonld.map(j => ({ ...j, source: "linkedin-public", sourceUrl: url }));
        }
      } catch { /* skip */ }
    }
    return [];
  },
};
