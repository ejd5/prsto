export function normalizeTitle(raw: string): string {
  let t = raw.trim();

  // Supprime suffixe CDI/CDD/Freelance
  t = t.replace(/\s*[-–—|]\s*(CDI|CDD|Freelance|Stage|Alternance|Interim|Int.rim|H\/F|F\/H)\s*/gi, " ");

  // Supprime " - ", "—" en début/fin
  t = t.replace(/^[-–—\s]+/g, "").replace(/[-–—\s]+$/g, "");

  // Supprime "Recherche un/une" en préfixe
  t = t.replace(/^(Recherchons?\s+(un|une)\s+)(Un\s+)?/i, "");

  // Supprime "H/F" en fin
  t = t.replace(/\s*\(?\s*(H\/F|F\/H)\s*\)?\s*$/gi, "");

  // Supprime parenthèses vides
  t = t.replace(/\(\s*\)/g, "");

  return t.trim();
}

export function normalizeCompany(raw: string): string {
  let c = raw.trim();

  // Supprime les suffixes juridiques
  c = c.replace(/\s*(SAS|SA|SARL|EURL|SASU|GmbH|Ltd|Inc|LLC|Corp|Group|PLC|BV|SL)\s*$/i, "");

  // Supprime " - " et ce qui suit si trop long
  const dashIdx = c.search(/[-–—]/);
  if (dashIdx > 0 && c.length > dashIdx + 20) {
    c = c.slice(0, dashIdx).trim();
  }

  return c.trim();
}

export function normalizeLocation(raw: string): { city: string | null; country: string | null } {
  if (!raw) return { city: null, country: null };

  const loc = raw.trim();

  // Pattern "Ville, Pays" ou "Ville - Pays"
  const parts = loc.split(/[,–—]/).map(s => s.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { city: parts[0], country: parts[parts.length - 1] };
  }

  // Vérifie si c'est une ville française connue
  const frCities = ["paris", "marseille", "lyon", "bordeaux", "lille", "nantes", "toulouse",
    "montpellier", "rennes", "strasbourg", "grenoble", "aix-en-provence", "nice", "toulon",
    "cannes", "boulogne-billancourt", "nanterre", "vitrolles", "avignon", "aubagne"];
  const lower = loc.toLowerCase();
  for (const city of frCities) {
    if (lower.includes(city)) return { city: loc, country: "France" };
  }

  return { city: loc, country: null };
}

export function dedupKey(title: string, company: string): string {
  const normalized = normalizeTitle(title).toLowerCase().replace(/[^a-z0-9]/g, "");
  const normalizedComp = normalizeCompany(company).toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${normalized}_${normalizedComp}`;
}

export function generateExternalId(sourceName: string, sourceUrl: string, title: string): string {
  if (sourceUrl) {
    return `${sourceName}::${sourceUrl}`;
  }
  return `${sourceName}::${dedupKey(title, "")}`;
}
