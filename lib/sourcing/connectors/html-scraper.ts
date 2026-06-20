"use server";

import type { NormalizedOffer, ConnectorHealth } from "../types";

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "fr,fr-FR;q=0.9,en;q=0.8",
};

interface SiteConfig {
  name: string;
  baseUrl: string;
  searchPath: string;
  jobHintPattern: RegExp;
  blocked?: boolean;
}

const SITES: SiteConfig[] = [
  { name: "Michael Page", baseUrl: "https://www.michaelpage.fr", searchPath: "/jobs/", jobHintPattern: /CDI|offre|poste|salaire|Directeur/i },
  { name: "Page Executive", baseUrl: "https://www.pageexecutive.com", searchPath: "/jobs/", jobHintPattern: /executive|director|vp|chief/i },
  { name: "Robert Walters", baseUrl: "https://www.robertwalters.fr", searchPath: "/recherche.html?q=", jobHintPattern: /CDI|offre|poste|salaire|Directeur/i },
  { name: "Hays", baseUrl: "https://www.hays.fr", searchPath: "/recherche/?q=", jobHintPattern: /CDI|offre|poste|salaire/i },
  { name: "APEC", baseUrl: "https://www.apec.fr", searchPath: "/candidat/recherche-emploi.html/emploi?motsCles=", jobHintPattern: /CDI|offre|poste/i, blocked: true },
  { name: "Meteojob", baseUrl: "https://www.meteojob.com", searchPath: "/offres-emploi/", jobHintPattern: /CDI|offre/i, blocked: true },
  { name: "Jobijoba", baseUrl: "https://www.jobijoba.com", searchPath: "/fr/recherche/?q=", jobHintPattern: /CDI|offre/i, blocked: true },
];

function loginIndicators(title: string): boolean {
  return /login|signin|s['']?identifier|connexion|authentification/i.test(title);
}

function extractCleanText(html: string): string {
  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!body) return "";
  return body[1]
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 25000);
}

export async function scrapeSourceUrl(
  sourceName: string,
  searchUrl: string,
  config?: { blocked?: boolean }
): Promise<{ offers: NormalizedOffer[]; error?: string }> {
  if (config?.blocked) {
    return { offers: [], error: `${sourceName} bloque l'accès automatique` };
  }

  try {
    const res = await fetch(searchUrl, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(12000),
      redirect: "follow",
    });

    if (!res.ok) {
      return { offers: [], error: `HTTP ${res.status}` };
    }

    const html = await res.text();
    if (html.length < 200) {
      return { offers: [], error: "Contenu vide" };
    }

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : "";
    if (loginIndicators(title)) {
      return { offers: [], error: "Page de connexion détectée" };
    }

    const cleanText = extractCleanText(html);
    if (cleanText.length < 100) {
      return { offers: [], error: "Sans contenu texte exploitable" };
    }

    return { offers: [], error: undefined, ...{ cleanText } };
  } catch (e: unknown) {
    const err = e as Error;
    return { offers: [], error: err.message?.slice(0, 100) || "Erreur réseau" };
  }
}

export async function scrapeSites(
  keywords: string[]
): Promise<{ offers: NormalizedOffer[]; health: ConnectorHealth }> {
  const allOffers: NormalizedOffer[] = [];
  const errors: string[] = [];

  // Note: les offres sont extraites via DeepSeek après récupération du HTML
  // Ce connecteur récupère le HTML, l'orchestrateur appelle DeepSeek pour l'extraction
  for (const site of SITES) {
    if (site.blocked) {
      errors.push(`${site.name}: bloqué`);
      continue;
    }
    for (const keyword of keywords) {
      const searchUrl = `${site.baseUrl}${site.searchPath}${encodeURIComponent(keyword)}`;
      const result = await scrapeSourceUrl(site.name, searchUrl);
      if (result.error) {
        errors.push(`${site.name} (${keyword}): ${result.error}`);
      }
    }
  }

  return {
    offers: allOffers,
    health: {
      name: "HTML Scraper",
      status: errors.length === SITES.filter(s => !s.blocked).length * keywords.length ? "error" : "ok",
      lastRun: new Date().toISOString(),
      lastError: errors[0] || null,
      offersFound: allOffers.length,
    },
  };
}
