/*
 * Market Radar — Types
 * Pure types, no DB, no network. Testable unitairement.
 */

export type MarketRadarSourceType =
  | "official_api"
  | "ats_public"
  | "career_page"
  | "assisted_url"
  | "manual_clipboard";

export type RadarPriority = "A" | "B" | "C" | "ignore";

export type RadarCandidateStatus =
  | "new"
  | "reviewed"
  | "imported"
  | "ignored"
  | "duplicate";

export interface NormalizedJobPosting {
  externalId?: string;
  source: string;
  sourceType: MarketRadarSourceType;
  sourceUrl: string;
  applyUrl?: string;
  title: string;
  company: string;
  location?: string;
  remote?: string;
  contractType?: string;
  salary?: string;
  description: string;
  publishedAt?: string;
  detectedAts?: string;
}

export interface RadarScore {
  total: number;
  priority: RadarPriority;
  reasons: string[];
  risks: string[];
  matchedKeywords: string[];
  missingKeywords: string[];
}

export interface RadarProfile {
  title?: string | null;
  functions?: string | null;
  sectors?: string | null;
  yearsExp?: number | null;
  location?: string | null;
  mobility?: string | null;
  languages?: string | null;
  targetSalary?: string | null;
  remotePreference?: string | null;
  constraints?: string | null;
  skills?: { name: string; category?: string }[];
  experiences?: { title: string; company: string; sector?: string | null; startDate?: string; endDate?: string | null }[];
}

export function priorityLabel(p: RadarPriority): string {
  return p === "A" ? "Priorité A" : p === "B" ? "Priorité B" : p === "C" ? "Priorité C" : "Hors cible";
}

export function priorityFromScore(total: number): RadarPriority {
  if (total >= 85) return "A";
  if (total >= 70) return "B";
  if (total >= 55) return "C";
  return "ignore";
}
