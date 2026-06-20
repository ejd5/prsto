import type { JobConnector, ImportedJob, SearchQuery } from "../types";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "fr,fr-FR;q=0.9,en;q=0.8",
};

export const michaelPageConnector: JobConnector = {
  id: "michael-page",
  name: "Michael Page",
  type: "html",

  async search(query: SearchQuery): Promise<ImportedJob[]> {
    const url = `https://www.michaelpage.fr/jobs/${encodeURIComponent(query.keyword)}`;
    const offers: ImportedJob[] = [];

    try {
      const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(12000), redirect: "follow" });
      if (!res.ok) return [];

      const html = await res.text();
      if (html.length < 500) return [];

      // Vérifier que ce n'est pas une page de login
      if (html.includes("login") || html.includes("connexion")) return [];

      // Extraction via regex des offres Michael Page
      // Michael Page utilise un format semi-structuré
      const jobRegex = /<a[^>]*href="(\/job\/[^"]+)"[^>]*>([\s\S]{10,200}?)<\/a>/gi;
      const jobUrls: string[] = [];
      let m: RegExpExecArray | null;
      while ((m = jobRegex.exec(html)) !== null) {
        const jobUrl = m[1].startsWith("http") ? m[1] : `https://www.michaelpage.fr${m[1]}`;
        if (!jobUrls.includes(jobUrl)) jobUrls.push(jobUrl);
      }

      // Prendre les 5 premières URLs
      const batch = jobUrls.slice(0, 5);
      for (const jobUrl of batch) {
        try {
          const pageRes = await fetch(jobUrl, { headers: HEADERS, signal: AbortSignal.timeout(8000) });
          if (!pageRes.ok) continue;
          const pageHtml = await pageRes.text();

          // Extraction depuis JSON-LD
          const ldMatch = pageHtml.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
          if (ldMatch) {
            try {
              const jsonld = JSON.parse(ldMatch[1].trim());
              if (jsonld["@type"] === "JobPosting") {
                const hiringOrg = jsonld.hiringOrganization || {};
                offers.push({
                  source: "michael-page",
                  sourceUrl: jobUrl,
                  title: jsonld.title || "",
                  company: hiringOrg.name || "",
                  location: jsonld.jobLocation?.address?.addressLocality || jsonld.jobLocation?.addressLocality || "",
                  description: (jsonld.description || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 3000),
                  contractType: /FULL_TIME/i.test(jsonld.employmentType || "") ? "CDI" : jsonld.employmentType || undefined,
                  publishedAt: jsonld.datePosted || undefined,
                  salaryMin: jsonld.baseSalary?.value?.minValue || undefined,
                  salaryMax: jsonld.baseSalary?.value?.maxValue || undefined,
                });
              }
            } catch { /* skip */ }
          }
        } catch { /* skip */ }
      }
    } catch { /* skip */ }

    return offers;
  },
};
