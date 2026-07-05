/**
 * Connecteur unifié pour tous les ATS publics.
 * Greenhouse, Lever, Ashby, SmartRecruiters
 *
 * Utilise les API JSON publiques de chaque ATS (pas de scraping HTML).
 * Les APIs sont publiques, sans authentification, et exposent les offres d'emploi.
 */

import type { JobConnector, ImportedJob, SearchQuery } from "../types";

const USER_AGENT = "PRSTO/1.0 (personal job search assistant; +https://prsto.example.com)";
const TIMEOUT = 15000;
const MAX_PER_SOURCE = 60;

/* ─── Greenhouse ─────────────────────────── */

interface GreenhouseJob {
  id: number;
  title: string;
  company_name: string;
  absolute_url: string;
  location: { name: string };
  first_published: string;
  content?: string;
  departments?: Array<{ name: string }>;
  offices?: Array<{ name: string }>;
}

export async function fetchGreenhouseBoard(company: string): Promise<ImportedJob[]> {
  try {
    const url = `https://api.greenhouse.io/v1/boards/${company}/jobs?content=true`;
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(TIMEOUT),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const jobs: GreenhouseJob[] = data.jobs || [];
    return jobs.map((j) => ({
      title: j.title,
      company: j.company_name || company,
      location: j.location?.name || undefined,
      description: j.content ? stripHtml(j.content).slice(0, 5000) : `${j.title} — ${j.company_name}`,
      sourceUrl: j.absolute_url,
      canonicalUrl: j.absolute_url,
      source: "greenhouse",
      externalId: `greenhouse::${j.id}`,
      publishedAt: j.first_published || undefined,
      functionArea: j.departments?.map(d => d.name).join(", ") || undefined,
    }));
  } catch {
    return [];
  }
}

/* ─── Lever ──────────────────────────────── */

interface LeverPosting {
  id: string;
  text: string;
  categories: {
    commitment?: string;
    location?: string;
    team?: string;
    allLocations?: string[];
  };
  descriptionPlain: string;
  hostedUrl: string;
  applyUrl: string;
  createdAt: number;
}

export async function fetchLeverBoard(company: string): Promise<ImportedJob[]> {
  try {
    const url = `https://api.lever.co/v0/postings/${company}?mode=json`;
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(TIMEOUT),
    });
    if (!res.ok) return [];
    const data: LeverPosting[] | { ok?: boolean; error?: string } = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map((j) => ({
      title: j.text,
      company,
      location: j.categories?.location || j.categories?.allLocations?.join(", ") || undefined,
      description: j.descriptionPlain?.slice(0, 5000) || j.text,
      sourceUrl: j.applyUrl || j.hostedUrl,
      canonicalUrl: j.hostedUrl,
      source: "lever",
      externalId: `lever::${company}::${j.id}`,
      contractType: j.categories?.commitment || undefined,
      publishedAt: j.createdAt ? new Date(j.createdAt).toISOString() : undefined,
    }));
  } catch {
    return [];
  }
}

/* ─── Ashby ──────────────────────────────── */

interface AshbyJob {
  id: string;
  title: string;
  location: string;
  department?: string;
  employmentType?: string;
  publishedAt?: string;
  isRemote?: boolean;
  workplaceType?: string;
  jobUrl: string;
  applyUrl: string;
  descriptionPlain: string;
}

export async function fetchAshbyBoard(company: string): Promise<ImportedJob[]> {
  try {
    const url = `https://api.ashbyhq.com/posting-api/job-board/${company}`;
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(TIMEOUT),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const jobs: AshbyJob[] = data.jobs || [];
    return jobs.map((j) => ({
      title: j.title,
      company,
      location: j.location || undefined,
      description: j.descriptionPlain?.slice(0, 5000) || j.title,
      sourceUrl: j.applyUrl || j.jobUrl,
      canonicalUrl: j.jobUrl,
      source: "ashby",
      externalId: `ashby::${company}::${j.id}`,
      contractType: j.employmentType || undefined,
      remotePolicy: j.isRemote ? "remote" : j.workplaceType || undefined,
      publishedAt: j.publishedAt || undefined,
    }));
  } catch {
    return [];
  }
}

/* ─── SmartRecruiters ────────────────────── */

export async function fetchSmartRecruitersBoard(companyId: string, displayName: string): Promise<ImportedJob[]> {
  try {
    const url = `https://api.smartrecruiters.com/v1/companies/${companyId}/postings?limit=100`;
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(TIMEOUT),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const jobs: Array<{
      id: string;
      name: string;
      company: { name: string };
      location: { city?: string; country?: string; text?: string };
      typeOfEmployment?: { label: string };
      releasedDate?: string;
      applyUrl?: string;
      jobAd: { sections: { text: string } };
    }> = data.content || [];
    return jobs.map((j) => ({
      title: j.name,
      company: j.company?.name || displayName,
      location: j.location?.text || j.location?.city || undefined,
      description: extractSmartRecruitersDescription(j),
      sourceUrl: j.applyUrl || `https://jobs.smartrecruiters.com/${companyId}/${j.id}`,
      source: "smartrecruiters",
      externalId: `sr::${companyId}::${j.id}`,
      contractType: j.typeOfEmployment?.label || undefined,
      publishedAt: j.releasedDate || undefined,
    }));
  } catch {
    return [];
  }
}

function extractSmartRecruitersDescription(job: {
  jobAd?: { sections?: { text?: string } };
}): string {
  try {
    return stripHtml(job.jobAd?.sections?.text || "").slice(0, 5000);
  } catch {
    return "";
  }
}

/* ─── HTML stripping util ────────────────── */

function stripHtml(html: string): string {
  // Remove HTML tags, decode entities, normalize whitespace
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&[a-z]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* ─── Companies vérifiées actives ───────── */

const GREENHOUSE_COMPANIES = [
  "stripe",
  "airbnb",
  "databricks",
  "figma",
  "doctolib",
  "robinhood",
  "coinbase",
  "brex",
];

const LEVER_COMPANIES = [
  "palantir",
];

const ASHBY_COMPANIES = [
  "linear",
  "perplexity",
  "cursor",
];

const SMART_RECRUITERS_COMPANIES: Array<{ id: string; name: string }> = [
  // Les IDs SmartRecruiters sont souvent différents des noms de marque.
  // À compléter quand on trouve les bons IDs pour les boîtes françaises.
];

/* ─── Executive keyword filter ───────────── */

const EXECUTIVE_KEYWORDS = [
  "director", "directeur", "head of", "vp ", "vice president",
  "chief ", "president", "senior director", "executive",
  "general manager", "country manager", "managing director",
  "svp", "evp", "c-suite", "cfo", "coo", "ceo", "cto", "cmo",
  "cro", "cpo", "president", "partner", "senior manager",
  "leadership", "strategy", "business development",
  "sales director", "sales manager", "engineering manager",
];

function isExecutiveRole(title: string): boolean {
  const lower = title.toLowerCase();
  return EXECUTIVE_KEYWORDS.some((kw) => lower.includes(kw));
}

/* ─── Keyword cleaning ───────────────────── */

/**
 * Le worker encode la pagination dans le keyword sous la forme :
 * "Directeur Commercial::page=1&range=1"
 * On nettoie pour récupérer le vrai mot-clé.
 */
function cleanKeyword(raw: string): string {
  const idx = raw.indexOf("::page=");
  return idx >= 0 ? raw.slice(0, idx).trim() : raw.trim();
}

/**
 * Le worker itère sur BROAD_KEYWORDS (Directeur Commercial, Directeur des Ventes, etc.).
 * Ces mots-clés sont en français et ne matchent pas les titres anglais des ATS.
 * Pour les ATS publics, on ignore le keyword et on retourne tous les postes executive.
 */
function isBroadKeyword(kw: string): boolean {
  const broad = [
    "directeur commercial", "directeur des ventes", "head of sales",
    "country manager france", "directeur business development",
  ];
  return broad.includes(kw);
}

/* ─── Main connector ─────────────────────── */

// Cache pour éviter de re-fetch les mêmes boards pour chaque BROAD_KEYWORD.
let cachedResults: ImportedJob[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 120000; // 2 minutes

export const publicAtsConnector: JobConnector = {
  id: "public-ats",
  name: "ATS publics (Greenhouse, Lever, etc.)",
  type: "ats",

  async search(query: SearchQuery): Promise<ImportedJob[]> {
    const rawKeyword = cleanKeyword(query.keyword?.toLowerCase() || "");

    // Utiliser le cache si dispo (le worker appelle search() pour chaque BROAD_KEYWORD)
    const now = Date.now();
    if (cachedResults && (now - cacheTimestamp) < CACHE_TTL) {
      // Appliquer le filtre keyword uniquement si ce n'est pas un broad keyword
      if (isBroadKeyword(rawKeyword) || !rawKeyword) return cachedResults;
      return cachedResults.filter(j =>
        j.title.toLowerCase().includes(rawKeyword) ||
        (j.description || "").toLowerCase().includes(rawKeyword)
      );
    }

    const all: ImportedJob[] = [];

    // Greenhouse — fetch in parallel batches of 4 to avoid rate limits
    const ghCompanies = GREENHOUSE_COMPANIES;
    for (let i = 0; i < ghCompanies.length; i += 4) {
      if (all.length >= MAX_PER_SOURCE) break;
      const batch = ghCompanies.slice(i, i + 4);
      const results = await Promise.all(batch.map((c) => fetchGreenhouseBoard(c)));
      for (const jobs of results) {
        all.push(...jobs.filter(j => isExecutiveRole(j.title)));
      }
    }

    // Lever
    if (all.length < MAX_PER_SOURCE) {
      for (const c of LEVER_COMPANIES) {
        const jobs = await fetchLeverBoard(c);
        all.push(...jobs.filter(j => isExecutiveRole(j.title)));
        if (all.length >= MAX_PER_SOURCE) break;
      }
    }

    // Ashby
    if (all.length < MAX_PER_SOURCE) {
      for (const c of ASHBY_COMPANIES) {
        const jobs = await fetchAshbyBoard(c);
        all.push(...jobs.filter(j => isExecutiveRole(j.title)));
        if (all.length >= MAX_PER_SOURCE) break;
      }
    }

    // SmartRecruiters
    if (all.length < MAX_PER_SOURCE) {
      for (const { id, name } of SMART_RECRUITERS_COMPANIES) {
        const jobs = await fetchSmartRecruitersBoard(id, name);
        all.push(...jobs.filter(j => isExecutiveRole(j.title)));
        if (all.length >= MAX_PER_SOURCE) break;
      }
    }

    // Mettre en cache
    cachedResults = all.slice(0, MAX_PER_SOURCE);
    cacheTimestamp = now;

    // Appliquer le filtre keyword si ce n'est pas un broad keyword
    if (isBroadKeyword(rawKeyword) || !rawKeyword) return cachedResults;
    return cachedResults.filter(j =>
      j.title.toLowerCase().includes(rawKeyword) ||
      (j.description || "").toLowerCase().includes(rawKeyword)
    );
  },
};
