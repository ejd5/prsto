"use server";

import type { NormalizedOffer, ConnectorHealth } from "../types";

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

// URLs connues des pages carrière d'entreprises cibles
const KNOWN_CAREER_PAGES: string[] = [
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

function extractJsonLd(html: string): Record<string, unknown>[] {
  const results: Record<string, unknown>[] = [];
  const regex = /<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(m[1].trim());
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        if (item["@type"] === "JobPosting" || item["@type"] === "ItemList") {
          results.push(item);
        }
      }
    } catch { /* ignore malformed JSON-LD */ }
  }
  return results;
}

function extractJobListingsFromHtml(html: string): string[] {
  const items: string[] = [];
  // Cherche les blocs qui ressemblent à des offres
  const jobRegex = /<a[^>]*href=["']([^"']*(?:job|posting|career|requisition|opening)[^"']*)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = jobRegex.exec(html)) !== null) {
    const url = m[1];
    if (!items.includes(url) && url.length > 10) items.push(url);
  }
  return items;
}

function cleanHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseJobPostingJsonLD(item: Record<string, unknown>): NormalizedOffer | null {
  const title = (item.title as string) || "";
  const hiringOrg = item.hiringOrganization as Record<string, unknown> | undefined;
  const company = (hiringOrg?.name as string) || (item.hiringOrganization as string) || "";
  if (!title || !company) return null;

  const loc = (item.jobLocation as Record<string, unknown>) || {};
  const locAddress = loc.address as Record<string, unknown> | undefined;
  const location = (locAddress?.addressLocality as string) || (loc.addressLocality as string) || "";
  const country = (locAddress?.addressCountry as string) || (loc.addressCountry as string) || "";

  const salary = (item.baseSalary as Record<string, unknown>) || {};
  const salaryVal = salary.value as Record<string, unknown> | undefined;
  const description = (item.description as string) || "";
  const url = (item.url as string) || "";

  return {
    externalId: `jsonld::${url || title + company}`,
    title,
    company,
    location,
    country: country || "FR",
    contractType: (item.employmentType as string) || "",
    remote: "",
    salaryMin: (salaryVal?.minValue as number) || 0,
    salaryMax: (salaryVal?.maxValue as number) || 0,
    salaryCurrency: (salary?.currency as string) || "EUR",
    description: cleanHtml(description).slice(0, 3000),
    sourceName: "JSON-LD JobPosting",
    sourceUrl: url,
    postedAt: (item.datePosted as string) || null,
    applicationUrl: url,
    sourceType: "jsonld",
    raw: description.slice(0, 5000),
  };
}

async function crawlCareerPage(url: string): Promise<NormalizedOffer[]> {
  const offers: NormalizedOffer[] = [];

  try {
    const res = await fetch(url, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(10000),
      redirect: "follow",
    });
    if (!res.ok) return [];

    const html = await res.text();
    if (html.length < 500) return [];

    // Étape 1: JSON-LD JobPosting direct sur la page
    const jsonldItems = extractJsonLd(html);
    for (const item of jsonldItems) {
      if (item["@type"] === "JobPosting") {
        const offer = parseJobPostingJsonLD(item);
        if (offer) offers.push(offer);
      }
      if (item["@type"] === "ItemList" && item.itemListElement) {
        const list = item.itemListElement as Record<string, unknown>[];
        for (const element of list) {
          const posting = (element.item as Record<string, unknown>) || element;
          if (posting["@type"] === "JobPosting") {
            const offer = parseJobPostingJsonLD(posting);
            if (offer) offers.push(offer);
          }
        }
      }
    }

    // Étape 2: Si pas de JSON-LD, crawl les sous-pages d'offres
    if (offers.length === 0) {
      const jobUrls = extractJobListingsFromHtml(html);
      const batchSize = 5;
      const batch = jobUrls.slice(0, batchSize);

      for (const jobUrl of batch) {
        const fullUrl = jobUrl.startsWith("http") ? jobUrl : new URL(jobUrl, url).toString();
        try {
          const subRes = await fetch(fullUrl, {
            headers: BROWSER_HEADERS,
            signal: AbortSignal.timeout(8000),
          });
          if (subRes.ok) {
            const subHtml = await subRes.text();
            const subJsonLd = extractJsonLd(subHtml);
            for (const item of subJsonLd) {
              if (item["@type"] === "JobPosting") {
                const offer = parseJobPostingJsonLD(item);
                if (offer) offers.push(offer);
              }
            }
          }
        } catch { /* skip failed sub-page */ }
      }
    }
  } catch { /* skip failed URL */ }

  return offers;
}

export async function crawlJsonLDSources(
  additionalUrls?: string[]
): Promise<{ offers: NormalizedOffer[]; health: ConnectorHealth }> {
  const urls = [...KNOWN_CAREER_PAGES, ...(additionalUrls || [])];
  const allOffers: NormalizedOffer[] = [];
  let errors = 0;

  // Crawler en parallèle par lots de 3
  const batchSize = 3;
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const results = await Promise.allSettled(batch.map(url => crawlCareerPage(url)));
    for (const result of results) {
      if (result.status === "fulfilled") {
        allOffers.push(...result.value);
      } else {
        errors++;
      }
    }
  }

  return {
    offers: allOffers,
    health: {
      name: "JSON-LD Crawler",
      status: errors === 0 ? "ok" : "error",
      lastRun: new Date().toISOString(),
      lastError: errors > 0 ? `${errors} page(s) en erreur` : null,
      offersFound: allOffers.length,
    },
  };
}

export async function crawlSingleCareerPage(url: string): Promise<NormalizedOffer[]> {
  return crawlCareerPage(url);
}
