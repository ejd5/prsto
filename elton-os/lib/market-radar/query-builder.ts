/*
 * Market Radar — Query Builder
 * Pure function. Builds search queries from profile + CV master data.
 * Fallback local if data is partial.
 */

import type { RadarProfile } from "./types";

const FALLBACK_QUERIES = [
  "Directeur Commercial",
  "Directeur Commercial France",
  "Directeur Général",
  "Country Manager",
  "Sales Director",
  "Head of Sales",
  "VP Sales",
  "Directeur BU",
  "Directeur Développement",
  "Management de transition commercial",
];

export function buildSearchQueriesFromProfile(
  profile?: RadarProfile | null,
  cvMasterText?: string | null
): string[] {
  const queries: string[] = [];
  const p = profile;

  // Titres depuis profil
  if (p?.title && p.title.trim().length > 2) {
    queries.push(p.title.trim());
    queries.push(`${p.title.trim()} France`);
  }

  // Fonctions du profil
  if (p?.functions) {
    try {
      const funcs: string[] = JSON.parse(p.functions);
      for (const f of funcs) {
        const trimmed = f.trim();
        if (trimmed.length > 3 && !queries.includes(trimmed)) {
          queries.push(trimmed);
          queries.push(`${trimmed} France`);
        }
      }
    } catch { /* ignore */ }
  }

  // Langues → international
  if (p?.languages) {
    try {
      const langs: string[] = JSON.parse(p.languages);
      const hasEnglish = langs.some((l) => /anglais|english/i.test(l));
      if (hasEnglish) {
        queries.push("Sales Director Europe");
        queries.push("Commercial Director Europe");
        queries.push("Country Manager Europe");
      }
    } catch { /* ignore */ }
  }

  // Secteurs → requêtes sectorielles
  if (p?.sectors) {
    try {
      const sectors: string[] = JSON.parse(p.sectors);
      for (const s of sectors.slice(0, 3)) {
        const trimmed = s.trim();
        if (trimmed.length > 3) {
          queries.push(`${p?.title || "Directeur"} ${trimmed}`);
        }
      }
    } catch { /* ignore */ }
  }

  // Expériences récentes → titres additionnels
  if (p?.experiences) {
    for (const exp of p.experiences.slice(0, 5)) {
      if (exp.title && exp.title.trim().length > 5) {
        const t = exp.title.trim();
        if (!queries.includes(t)) queries.push(t);
      }
    }
  }

  // Déduplication et limite
  const unique = [...new Set(queries)].filter((q) => q.length > 5 && q.length < 120);

  // Si pas assez de requêtes, compléter avec fallback
  if (unique.length < 5) {
    for (const fallback of FALLBACK_QUERIES) {
      if (!unique.includes(fallback)) unique.push(fallback);
    }
  }

  return unique.slice(0, 20);
}
