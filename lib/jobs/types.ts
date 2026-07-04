export type LocationPriority = 1 | 2 | 3 | 4;
export type CountryScope = "france" | "europe" | "international";
export type CronRunMode = "morning" | "evening" | "manual";

/* ─── Source capability types ────────────── */

export type SourceImportMode =
  | "API_OFFICIAL"
  | "ATS_PUBLIC"
  | "PUBLIC_CAREERS"
  | "AUTO_API"
  | "AUTO_ATS"
  | "AUTO_JSONLD"
  | "AUTO_RSS"
  | "AUTO_PUBLIC_CAREERS"
  | "AUTO_FIRECRAWL_SAFE"
  | "USER_ASSISTED"
  | "MANUAL_ONLY"
  | "BLOCKED";

export type ComplianceStatus =
  | "allowed"
  | "refused"
  | "user_assisted_required"
  | "blocked"
  | "error";

export type ReasonCode =
  | "allowed_public_ats"
  | "allowed_public_careers"
  | "allowed_jsonld"
  | "refused_closed_platform"
  | "refused_login_required"
  | "refused_captcha"
  | "refused_blocked_domain"
  | "refused_user_assisted_source"
  | "refused_bypass_attempt"
  | "refused_missing_api_key"
  | "refused_poor_extraction_quality"
  | "error_firecrawl_rate_limit"
  | "error_firecrawl_timeout"
  | "error_parse_failed";

export type PlatformType =
  | "ats"
  | "job_board"
  | "career_page"
  | "aggregator"
  | "social_network";

export interface SourceCapability {
  sourceId: string;
  name: string;
  url: string;
  domain: string;
  platformType: PlatformType;
  importMode: SourceImportMode;
  supportsApi: boolean;
  supportsRss: boolean;
  supportsSitemap: boolean;
  supportsJsonLd: boolean;
  supportsAtsEndpoint: boolean;
  requiresBrowser: boolean;
  blocksServerFetch: boolean;
  requiresUserAction: boolean;
  lastCheckedAt: string | null;
  lastStatus: string | null;
  notes: string | null;
}

export interface ScannerResult {
  domain: string;
  statusCode: number;
  atsProvider: string | null;
  jsonldJobCount: number;
  hasRss: boolean;
  hasSitemap: boolean;
  isBlocked: boolean;
}

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
  applicationUrl?: string;
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

/* ─── Firecrawl Safe / Compliance ─────────── */

export interface ComplianceResult {
  status: ComplianceStatus;
  reasonCode: ReasonCode;
  detail: string;
  extractedJobs?: ImportedJob[];
}

export interface FirecrawlAuditEntry {
  timestamp: string;
  actor: string;
  sourceUrl: string;
  normalizedDomain: string;
  scannerDecision: SourceImportMode;
  connector: string;
  extractionMethod: string;
  status: ComplianceStatus;
  reasonCode: ReasonCode;
  jobFingerprint?: string;
  durationMs: number;
  jobsExtracted: number;
  errors: string[];
  extractionQuality?: {
    validJobs: number;
    noiseSkipped: number;
    invalidJobs: number;
    qualityStatus: string;
    suspectedNoiseTitles: string[];
  };
}

export interface FirecrawlOptions {
  maxPages?: number;
  timeoutMs?: number;
  apiKey?: string;
}

export interface FirecrawlExtractionResult {
  markdown: string;
  sourceUrl: string;
  jobs: ImportedJob[];
  auditRef: string;
  durationMs: number;
}
