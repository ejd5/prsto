import type { JobConnector, ImportedJob, SearchQuery } from "../types";
import { parseJsonLdJobPosting } from "../parsers/jsonld-job-parser";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

// Pages carrières connues avec JSON-LD JobPosting
const KNOWN_CAREER_PAGES = [
  "https://careers.schneider-electric.com/jobs",
  "https://www.siemens.com/careers",
  "https://careers.legrand.com",
  "https://www.loreal.com/fr/careers",
  "https://careers.danone.com",
  "https://www.sanofi.com/careers",
  "https://careers.airbus.com",
  "https://careers.engie.com",
  "https://jobs.orange.com",
  "https://www.capgemini.com/careers",
  "https://careers.accor.com",
  "https://jobs.totalenergies.com",
  "https://careers.thalesgroup.com",
  "https://careers.safran-group.com",
  "https://jobs.edf.com",
  "https://careers.veolia.com",
  "https://jobs.societegenerale.com",
  "https://careers.bnpparibas.com",
  "https://jobs.axa.com",
  "https://careers.lvmh.com",
];

export const genericJsonLdConnector: JobConnector = {
  id: "generic-jsonld",
  name: "JSON-LD JobPosting Crawler",
  type: "ats",

  async search(_query: SearchQuery): Promise<ImportedJob[]> {
    const allOffers: ImportedJob[] = [];

    for (const url of KNOWN_CAREER_PAGES) {
      try {
        const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(10000), redirect: "follow" });
        if (!res.ok) continue;
        const html = await res.text();
        const offers = parseJsonLdJobPosting(html, "jsonld-crawler");
        allOffers.push(...offers.map(o => ({ ...o, sourceUrl: o.sourceUrl || url })));
      } catch { /* skip */ }
    }

    return allOffers;
  },
};
