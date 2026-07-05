/**
 * Languages Normalizer
 * Deduplicates, normalizes levels, and produces a clean language list.
 */

export interface NormalizedLanguage {
  language: string;
  level: string;
}

const LEVEL_MAP: Record<string, string> = {
  natif: "natif",
  native: "natif",
  "langue maternelle": "natif",
  courant: "courant",
  fluent: "courant",
  bilingue: "courant",
  professionnel: "professionnel",
  "business fluent": "professionnel",
  avance: "professionnel",
  intermediaire: "intermédiaire",
  intermediate: "intermédiaire",
  notions: "notions",
  basic: "notions",
  scolaire: "notions",
};

const LEVEL_ORDER: Record<string, number> = {
  natif: 5,
  courant: 4,
  professionnel: 3,
  intermédiaire: 2,
  notions: 1,
};

const CANONICAL_NAMES: Record<string, string> = {
  français: "Français",
  french: "Français",
  fr: "Français",
  anglais: "Anglais",
  english: "Anglais",
  en: "Anglais",
  espagnol: "Espagnol",
  spanish: "Espagnol",
  es: "Espagnol",
  portugais: "Portugais",
  portuguese: "Portugais",
  pt: "Portugais",
  allemand: "Allemand",
  german: "Allemand",
  de: "Allemand",
  italien: "Italien",
  italian: "Italien",
  it: "Italien",
  chinois: "Chinois",
  chinese: "Chinois",
  zh: "Chinois",
  arabe: "Arabe",
  arabic: "Arabe",
  ar: "Arabe",
  russe: "Russe",
  russian: "Russe",
  ru: "Russe",
  neerlandais: "Néerlandais",
  dutch: "Néerlandais",
  nl: "Néerlandais",
  japonais: "Japonais",
  japanese: "Japonais",
  ja: "Japonais",
};

function normalizeKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function resolveCanonical(raw: string): string {
  return CANONICAL_NAMES[normalizeKey(raw)] || raw;
}

function parseLangEntry(raw: string): NormalizedLanguage | null {
  if (!raw || raw.trim().length < 2) return null;
  const clean = raw.trim();
  const m = clean.match(/^(.+?)\s*[\(（\-\–\—]\s*(.+?)\s*[\)）]?\s*$/);
  if (m) {
    const lang = m[1].trim();
    const levelRaw = m[2].trim().toLowerCase();
    const level = LEVEL_MAP[levelRaw] || levelRaw;
    if (lang.length > 1) return { language: resolveCanonical(lang), level };
  }
  return { language: resolveCanonical(clean), level: "a preciser" };
}

function dedupKey(lang: string): string {
  return normalizeKey(resolveCanonical(lang));
}

export function normalizeLanguages(input: (string | NormalizedLanguage)[]): NormalizedLanguage[] {
  const seen = new Map<string, NormalizedLanguage>();

  for (const item of input) {
    let entries: NormalizedLanguage[] = [];

    if (typeof item === "string") {
      try {
        const parsed = JSON.parse(item);
        if (Array.isArray(parsed)) {
          entries = normalizeLanguages(parsed);
        } else {
          const e = parseLangEntry(item);
          if (e) entries = [e];
        }
      } catch {
        const e = parseLangEntry(item);
        if (e) entries = [e];
      }
    } else if (item && typeof item === "object" && "language" in item) {
      entries = [{ language: resolveCanonical(item.language), level: item.level || "a preciser" }];
    }

    for (const entry of entries) {
      const key = dedupKey(entry.language);
      if (!seen.has(key)) {
        seen.set(key, entry);
      } else {
        const existing = seen.get(key)!;
        const eo = LEVEL_ORDER[existing.level] || 0;
        const no = LEVEL_ORDER[entry.level] || 0;
        if (no > eo) seen.set(key, entry);
      }
    }
  }

  return Array.from(seen.values()).sort((a, b) => {
    const ao = LEVEL_ORDER[a.level] || 0;
    const bo = LEVEL_ORDER[b.level] || 0;
    if (ao !== bo) return bo - ao;
    return a.language.localeCompare(b.language);
  });
}

export function renderLanguages(langs: NormalizedLanguage[]): string {
  return langs.map((l) => `${l.language} — ${l.level}`).join(", ");
}
