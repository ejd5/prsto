import type { SearchQuery, LocationPriority, CountryScope } from "./types";

const KEYWORDS: string[] = [
  "directeur commercial", "directeur des ventes", "chief sales officer",
  "chief commercial officer", "chief revenue officer", "commercial director",
  "country manager france", "head of sales france", "vp sales france",
  "directeur commercial b2b", "directeur commercial saas",
  "directeur commercial industrie", "directeur commercial service",
  "directeur commercial et marketing", "directeur business development",
  "general manager france", "managing director france", "sales director france",
];

// Localisations par priorité
const LOCATIONS: { location: string; priority: LocationPriority; scope: CountryScope; weight: number }[] = [
  // Priorité 1 — Marseille / PACA
  { location: "Marseille", priority: 1, scope: "france", weight: 10 },
  { location: "Aix-en-Provence", priority: 1, scope: "france", weight: 10 },
  { location: "Provence-Alpes-Côte d'Azur", priority: 1, scope: "france", weight: 9 },
  { location: "Bouches-du-Rhône", priority: 1, scope: "france", weight: 9 },
  { location: "Nice", priority: 1, scope: "france", weight: 8 },
  { location: "Toulon", priority: 1, scope: "france", weight: 8 },
  { location: "Avignon", priority: 1, scope: "france", weight: 7 },
  // Priorité 2 — Paris / IDF
  { location: "Paris", priority: 2, scope: "france", weight: 8 },
  { location: "Île-de-France", priority: 2, scope: "france", weight: 7 },
  { location: "La Défense", priority: 2, scope: "france", weight: 7 },
  // Priorité 3 — France
  { location: "France", priority: 3, scope: "france", weight: 5 },
  { location: "Lyon", priority: 3, scope: "france", weight: 5 },
  { location: "Bordeaux", priority: 3, scope: "france", weight: 5 },
  { location: "Lille", priority: 3, scope: "france", weight: 5 },
  { location: "Nantes", priority: 3, scope: "france", weight: 5 },
  { location: "Toulouse", priority: 3, scope: "france", weight: 5 },
  { location: "Montpellier", priority: 3, scope: "france", weight: 5 },
  // Priorité 4 — International
  { location: "Suisse", priority: 4, scope: "europe", weight: 2 },
  { location: "Belgique", priority: 4, scope: "europe", weight: 2 },
  { location: "Luxembourg", priority: 4, scope: "europe", weight: 2 },
  { location: "Europe", priority: 4, scope: "europe", weight: 1 },
];

const MAX_QUERIES_PER_RUN = 30;

export function planSearches(): SearchQuery[] {
  const queries: SearchQuery[] = [];

  for (const loc of LOCATIONS) {
    for (const kw of KEYWORDS) {
      const priority = loc.priority;
      // Limite le nombre de requêtes par priorité
      if (priority === 1 && queries.filter(q => q.locationPriority === 1).length >= 12) continue;
      if (priority === 2 && queries.filter(q => q.locationPriority === 2).length >= 8) continue;
      if (priority === 3 && queries.filter(q => q.locationPriority === 3).length >= 6) continue;
      if (priority === 4 && queries.filter(q => q.locationPriority === 4).length >= 4) continue;

      queries.push({
        keyword: kw,
        location: loc.location,
        locationPriority: loc.priority,
        seniority: "executive",
        priority: loc.weight,
        remoteAllowed: false,
        countryScope: loc.scope,
      });

      if (queries.length >= MAX_QUERIES_PER_RUN) break;
    }
    if (queries.length >= MAX_QUERIES_PER_RUN) break;
  }

  return queries;
}
