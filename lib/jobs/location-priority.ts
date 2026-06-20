import type { LocationPriority, CountryScope } from "./types";

const P1_KEYWORDS = [
  "marseille", "aix-en-provence", "aix en provence", "aix", "provence-alpes-côte d'azur",
  "provence-alpes-cote d'azur", "paca", "bouches-du-rhône", "bouches-du-rhone",
  "toulon", "nice", "cannes", "sophia antipolis", "avignon", "aubagne", "vitrolles",
  "région sud", "region sud", "var", "vaucluse", "alpes-maritimes", "corse",
];

const P2_KEYWORDS = [
  "paris", "île-de-france", "ile-de-france", "idf", "boulogne-billancourt",
  "la défense", "la defense", "neuilly-sur-seine", "levallois-perret",
  "nanterre", "courbevoie", "hauts-de-seine",
];

const P4_KEYWORDS = [
  "suisse", "belgique", "luxembourg", "monaco", "europe", "international",
  "genève", "geneve", "bruxelles", "london", "new york",
];

export function detectLocationPriority(location: string | null): LocationPriority {
  if (!location) return 3;

  const loc = location.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  for (const kw of P1_KEYWORDS) {
    if (loc.includes(kw)) return 1;
  }
  for (const kw of P2_KEYWORDS) {
    if (loc.includes(kw)) return 2;
  }
  for (const kw of P4_KEYWORDS) {
    if (loc.includes(kw)) return 4;
  }
  return 3;
}

export function computeLocationScore(priority: LocationPriority): number {
  switch (priority) {
    case 1: return 100;
    case 2: return 80;
    case 3: return 50;
    case 4: return 15;
  }
}

export function detectCountryScope(location: string | null): CountryScope {
  if (!location) return "france";
  const loc = location.toLowerCase();
  if (loc.includes("suisse") || loc.includes("belgique") || loc.includes("luxembourg") ||
      loc.includes("monaco") || loc.includes("europe") || loc.includes("genève") || loc.includes("geneve")) {
    return "europe";
  }
  if (loc.includes("international") || loc.includes("london") || loc.includes("new york") ||
      loc.includes("remote")) {
    return "international";
  }
  return "france";
}
