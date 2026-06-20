export type BrowserPlatform = "linkedin" | "indeed" | "apec";

export type BrowserSessionStatus =
  | "not_configured"
  | "connected"
  | "needs_user_reauth"
  | "blocked"
  | "error";

export interface BrowserSearchConfig {
  id?: string;
  platform: BrowserPlatform;
  searchUrl: string;
  label: string;
  enabled: boolean;
  maxResultsPerRun: number;
  locationPriority?: number;
  scrollEnabled?: boolean;
  maxScrolls?: number;
  scrollDelayMs?: number;
  fetchDetailsEnabled?: boolean;
  maxDetailsPerRun?: number;
  lastRunAt?: Date | string | null;
  lastError?: string | null;
  lastOffersFound?: number;
  lastDetailsFetched?: number;
}

export interface BrowserSearchResult {
  status: "success" | "needs_user_reauth" | "blocked" | "error";
  jobs: BrowserJobBrief[];
  detailsFetched: number;
  scrollsDone: number;
  error?: string;
}

export interface BrowserJobBrief {
  title: string;
  company: string;
  location: string;
  sourceUrl: string;
  description: string;
  publishedAt?: string;
  externalId?: string;
}

export interface PlatformSessionPaths {
  sessionDir: string;
  storageFile: string;
}

export const PLATFORM_LOGIN_URLS: Record<BrowserPlatform, string> = {
  linkedin: "https://www.linkedin.com/login",
  indeed: "https://secure.indeed.com/auth",
  apec: "https://www.apec.fr/candidat.html",
};

export const PLATFORM_LABELS: Record<BrowserPlatform, string> = {
  linkedin: "LinkedIn",
  indeed: "Indeed",
  apec: "APEC",
};

/** Nettoyage basique d'URL pour externalId stable */
export function cleanUrlForId(url: string): string {
  try {
    const u = new URL(url);
    // Supprimer les paramètres de tracking/session connus
    const trackingParams = ["refId", "trackingId", "sessionId", "session_id", "trk", "eBP",
      "showHowYouFit", "origin", "geoId", "position", "pageNum", "f_"];
    trackingParams.forEach(p => u.searchParams.delete(p));
    return u.origin + u.pathname + u.search;
  } catch {
    return url;
  }
}

/** Génère un externalId stable pour une offre browser */
export function makeExternalId(platform: BrowserPlatform, job: BrowserJobBrief): string {
  const cleanUrl = cleanUrlForId(job.sourceUrl);
  const raw = `${cleanUrl}::${job.title}::${job.company}::${job.location}`;
  return `${platform}_browser::${Buffer.from(raw).toString("base64").slice(0, 50)}`;
}
