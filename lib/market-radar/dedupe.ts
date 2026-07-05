/*
 * Market Radar — Deduplication
 * Pure function comparing a radar candidate against existing opportunities.
 * Inspiré de lib/jobs/dedupe.ts — même logique, ciblée Market Radar.
 */

import type { NormalizedJobPosting } from "./types";

function normalizeTitle(t: string): string {
  return t.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

function normalizeCompany(c: string): string {
  return c.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

export type RadarDedupResult =
  | "new"
  | "duplicate_exact"
  | "duplicate_probable"
  | "duplicate_similar";

export interface RadarDedupCheck {
  status: RadarDedupResult;
  existingExternalId?: string;
  existingSourceUrl?: string;
  reason?: string;
}

export function detectRadarDuplicate(
  candidate: NormalizedJobPosting,
  existingItems: { externalId?: string | null; sourceUrl?: string | null; title: string; company?: string | null; location?: string | null }[]
): RadarDedupCheck {
  // Priority 1: externalId exact match
  if (candidate.externalId) {
    const byExternal = existingItems.find(
      (e) => e.externalId && e.externalId.toLowerCase().trim() === candidate.externalId?.toLowerCase().trim()
    );
    if (byExternal) {
      return { status: "duplicate_exact", existingExternalId: byExternal.externalId || undefined, reason: "Même externalId" };
    }
  }

  // Priority 2: sourceUrl exact match
  if (candidate.sourceUrl) {
    const byUrl = existingItems.find(
      (e) => e.sourceUrl && e.sourceUrl.toLowerCase().trim() === candidate.sourceUrl.toLowerCase().trim()
    );
    if (byUrl) {
      return { status: "duplicate_exact", existingSourceUrl: candidate.sourceUrl, reason: "Même source URL" };
    }
  }

  // Priority 3: title + company fuzzy match
  const candTitle = normalizeTitle(candidate.title);
  const candCompany = normalizeCompany(candidate.company);

  for (const existing of existingItems) {
    const exTitle = normalizeTitle(existing.title);
    const exCompany = normalizeCompany(existing.company || "");

    // Même titre et même entreprise
    if (candTitle === exTitle && candCompany === exCompany) {
      return { status: "duplicate_exact", reason: "Même titre + entreprise" };
    }

    // Titre très similaire (edit distance simple) et même entreprise
    if (candCompany === exCompany && titleSimilarity(candidate.title, existing.title) >= 0.75) {
      return { status: "duplicate_probable", reason: "Titre similaire + même entreprise" };
    }

    // Titre similaire et entreprise similaire
    if (titleSimilarity(candidate.title, existing.title) >= 0.65 && candCompany.length > 2 && exCompany.length > 2 && candCompany === exCompany) {
      return { status: "duplicate_similar", reason: "Titre et entreprise proches" };
    }
  }

  return { status: "new" };
}

/* ─── Title Similarity (Jaccard-like) ─── */
function titleSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter((w) => w.length > 2));
  const wordsB = new Set(b.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter((w) => w.length > 2));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)));
  const union = new Set([...wordsA, ...wordsB]);
  return intersection.size / union.size;
}
