export type LocationPriority = 1 | 2 | 3 | 4;
export type CountryScope = "france" | "europe" | "international";
export type ImportMode = "morning" | "evening" | "manual";

export interface SearchQuery {
  keyword: string;
  location: string;
  locationPriority: LocationPriority;
  seniority: "executive" | "senior" | "leadership";
  priority: number;
  remoteAllowed: boolean;
  countryScope: CountryScope;
}

export interface ImportedJob {
  source: string;
  externalId?: string;
  sourceUrl: string;
  canonicalUrl?: string;
  title: string;
  company?: string;
  location?: string;
  locationPriority?: LocationPriority;
  countryScope?: CountryScope;
  remotePolicy?: string;
  contractType?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  seniority?: string;
  functionArea?: string;
  sector?: string;
  description?: string;
  publishedAt?: string;
  rawHtml?: string;
  rawJson?: unknown;
}

export interface JobConnector {
  id: string;
  name: string;
  type: "api" | "html" | "ats" | "browser" | "aggregator";
  search(query: SearchQuery): Promise<ImportedJob[]>;
  fetchDetail?(job: ImportedJob): Promise<ImportedJob>;
}

export interface ScoredJob {
  executiveScore: number;
  matchScore: number;
  locationScore: number;
  salaryScore: number;
  freshnessScore: number;
  companyScore: number;
  riskScore: number;
  globalScore: number;
  reasons: string[];
  redFlags: string[];
  recommendedAction: "apply" | "shortlist" | "review" | "skip";
}
