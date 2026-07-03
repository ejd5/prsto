export type GeoPriority = 1 | 2 | 3 | 4;
export type JobSourceType = "api" | "html" | "jsonld" | "ats" | "browser";
export type ConnectorStatus = "ok" | "needs_user_reauth" | "blocked" | "error" | "unconfigured";

export interface GeoConfig {
  priority: GeoPriority;
  weight: number;
  cities: string[];
  regions: string[];
  countries: string[];
}

export interface NormalizedOffer {
  externalId: string;
  title: string;
  company: string;
  location: string;
  country: string;
  contractType: string;
  remote: string;
  salaryMin: number;
  salaryMax: number;
  salaryCurrency: string;
  description: string;
  sourceName: string;
  sourceUrl: string;
  postedAt: string | null;
  applicationUrl: string | null;
  sourceType: JobSourceType;
  raw: string;
}

export interface ScoredOffer extends NormalizedOffer {
  geoScore: number;
  roleScore: number;
  globalScore: number;
  geoPriority: GeoPriority;
  matchedRoles: string[];
  matchedCity: string | null;
}

export interface SourcingRunResult {
  id: string;
  status: "running" | "completed" | "failed";
  sourcesAttempted: number;
  sourcesSucceeded: number;
  offersFound: number;
  offersNew: number;
  offersDuplicates: number;
  errors: string[];
  summary: string;
}

export interface ConnectorHealth {
  name: string;
  status: ConnectorStatus;
  lastRun: string | null;
  lastError: string | null;
  offersFound: number;
}
