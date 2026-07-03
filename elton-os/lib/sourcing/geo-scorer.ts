import type { GeoPriority, GeoConfig } from "./types";

// Priorités géographiques — tout en français
const GEO_CONFIGS: GeoConfig[] = [
  // Priorité 1 — Marseille / PACA
  {
    priority: 1,
    weight: 1.8,
    cities: ["marseille", "aix-en-provence", "aix", "toulon", "nice", "cannes", "antibes",
      "sophia antipolis", "avignon", "aubagne", "vitrolles", "istres", "martigues",
      "salon-de-provence", "grasse", "fréjus", "la ciotat"],
    regions: ["paca", "provence-alpes-côte d'azur", "provence-alpes-cote d'azur",
      "bouches-du-rhône", "bouches-du-rhone", "var", "vaucluse", "alpes-maritimes",
      "région sud", "region sud", "alpes-de-haute-provence", "corse"],
    countries: [],
  },
  // Priorité 2 — Paris / Île-de-France
  {
    priority: 2,
    weight: 1.4,
    cities: ["paris", "boulogne-billancourt", "la défense", "neuilly-sur-seine",
      "levallois-perret", "nanterre", "courbevoie", "asnières-sur-seine",
      "colombes", "cergy", "saint-denis", "versailles", "issy-les-moulineaux",
      "clichy", "montrouge", "suresnes", "puteaux", "meudon", "roussy"],
    regions: ["île-de-france", "ile-de-france", "idf", "paris 75", "hauts-de-seine",
      "seine-saint-denis", "val-de-marne", "val d'oise", "essonne", "yvelines"],
    countries: [],
  },
  // Priorité 3 — France (hors PACA/IDF)
  {
    priority: 3,
    weight: 1.0,
    cities: ["lyon", "bordeaux", "lille", "nantes", "toulouse", "montpellier", "rennes",
      "strasbourg", "grenoble", "rouen", "dijon", "angers", "clermont-ferrand",
      "orléans", "tours", "le havre", "caen", "reims", "nancy", "limoges",
      "perpignan", "besançon", "pau", "bayonne", "valence", "ajaccio"],
    regions: ["france", "france métropolitaine", "france entière", "remote france"],
    countries: [],
  },
  // Priorité 4 — Étranger / international
  {
    priority: 4,
    weight: 0.5,
    cities: ["genève", "geneve", "zurich", "bruxelles", "luxembourg", "monaco",
      "padre", "padre", "londres", "barcelone", "berlin", "amsterdam",
      "milan", "rome", "madrid", "new york", "san francisco"],
    regions: [],
    countries: ["suisse", "belgique", "luxembourg", "monaco", "europe", "international"],
  },
];

function normalizeLocationText(location: string): string {
  return location
    .normalize("NFD").replace(/[̀-ͯ]/g, "") // enlève accents
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .toLowerCase()
    .trim();
}

export function scoreByLocation(location: string | null): {
  score: number;
  priority: GeoPriority;
  matchedCity: string | null;
} {
  if (!location || location.trim().length === 0) {
    return { score: 40, priority: 3, matchedCity: null }; // France par défaut
  }

  const normalized = normalizeLocationText(location);

  for (const config of GEO_CONFIGS) {
    // Vérifier les villes
    for (const city of config.cities) {
      if (normalized.includes(city)) {
        const baseScore = config.priority === 1 ? 100 :
          config.priority === 2 ? 85 :
          config.priority === 3 ? 60 : 20;
        return { score: baseScore, priority: config.priority, matchedCity: city };
      }
    }
    // Vérifier les régions
    for (const region of config.regions) {
      if (normalized.includes(region)) {
        const baseScore = config.priority === 1 ? 95 :
          config.priority === 2 ? 80 :
          config.priority === 3 ? 55 : 15;
        return { score: baseScore, priority: config.priority, matchedCity: null };
      }
    }
    // Vérifier les pays
    for (const country of config.countries) {
      if (normalized.includes(country)) {
        return { score: 10, priority: 4, matchedCity: null };
      }
    }
  }

  // Fallback: si "remote" est mentionné, priorité France
  if (normalized.includes("remote") || normalized.includes("télétravail") || normalized.includes("teletravail")) {
    return { score: 50, priority: 3, matchedCity: null };
  }

  return { score: 40, priority: 3, matchedCity: null };
}

// Application du poids géographique au score global
export function applyGeoWeight(geoScore: number): number {
  if (geoScore >= 95) return geoScore;       // déjà pondéré
  if (geoScore >= 80) return geoScore;       // IDF
  if (geoScore >= 50) return geoScore;
  if (geoScore >= 20) return geoScore * 0.7; // pénalité international
  return geoScore * 0.5;
}
