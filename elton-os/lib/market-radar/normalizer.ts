/*
 * Market Radar — Normalizer
 * Pure functions. No DB, no network. Testable unitairement.
 * Ne jamais inventer titre/entreprise. Si absent → erreur typée.
 */

import type { NormalizedJobPosting, MarketRadarSourceType } from "./types";

export interface NormalizeError {
  invalid: true;
  reason: string;
}

export type NormalizeResult = NormalizedJobPosting | NormalizeError;

export function sanitizeJobDescription(text: string): string {
  if (!text) return "";
  const cleaned = text
    // Remove HTML
    .replace(/<[^>]+>/g, " ")
    // Remove Markdown artifacts
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^#{1,3}\s/gm, "")
    .replace(/^---+$/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Collapse spaces but preserve line breaks
    .replace(/[^\S\n]+/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return cleaned;
}

export function normalizeJobTitle(title: string): string {
  if (!title || !title.trim()) return "";
  return title
    .replace(/\(H\/F\)|\(F\/H\)|\bH\/F\b|\bF\/H\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

export function normalizeCompanyName(company: string): string {
  if (!company || !company.trim()) return "";
  return company
    .replace(/\s*\(?[A-Z]{2,3}\)?\s*$/, "") // remove country codes like (FR)
    .replace(/\s+(?:Inc|Ltd|LLC|SAS|SA|GmbH|BV|SL|SARL|SRL|Corp)\.?\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

export function normalizeLocation(location?: string): string | undefined {
  if (!location || !location.trim()) return undefined;
  const loc = location
    .replace(/\s*\(.*?\)\s*/, " ") // remove parenthetical
    .replace(/\s*[,;]\s*FR$/, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
  return loc || undefined;
}

export function normalizeJobPosting(input: {
  title?: string;
  company?: string;
  location?: string;
  description?: string;
  sourceUrl?: string;
  applyUrl?: string;
  salary?: string;
  contractType?: string;
  remote?: string;
  publishedAt?: string;
  source?: string;
  sourceType?: MarketRadarSourceType;
  externalId?: string;
  detectedAts?: string;
}): NormalizeResult {
  const title = normalizeJobTitle(input.title || "");
  const company = normalizeCompanyName(input.company || "");

  if (!title) return { invalid: true, reason: "Titre manquant" };
  if (!company) return { invalid: true, reason: "Entreprise manquante" };

  const description = sanitizeJobDescription(input.description || "");
  if (description.length < 50) return { invalid: true, reason: "Description trop courte (< 50 caractères)" };

  return {
    externalId: input.externalId || undefined,
    source: input.source || "inconnue",
    sourceType: input.sourceType || "career_page",
    sourceUrl: input.sourceUrl || "",
    applyUrl: input.applyUrl || undefined,
    title,
    company,
    location: normalizeLocation(input.location),
    remote: input.remote || undefined,
    contractType: input.contractType || undefined,
    salary: input.salary || undefined,
    description,
    publishedAt: input.publishedAt || undefined,
    detectedAts: input.detectedAts || undefined,
  };
}
