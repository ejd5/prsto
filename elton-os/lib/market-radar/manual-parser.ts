/*
 * Market Radar — Manual Parser (copier-coller)
 * Pure functions. No DB, no network.
 * Ne jamais inventer. Marquer warnings si incertain.
 */

export interface ManualPreview {
  title: string;
  company: string;
  location?: string;
  description: string;
  sourceUrl?: string;
  contractType?: string;
  salary?: string;
  warnings: string[];
  confidence: "high" | "medium" | "low";
}

export function extractLikelyTitle(text: string): string {
  if (!text) return "";
  const lines = text.split(/\n/).filter((l) => l.trim().length > 5);
  // Première ligne non-vide qui ressemble à un titre de poste
  for (const line of lines) {
    const t = line.trim();
    if (/(?:H\/F|F\/H|CDI|CDD|Stage|Manager|Directeur|Director|Responsable|Chef|Head|VP|Chief|Consultant)/i.test(t) && t.length < 150) {
      return t.replace(/\s*[\|—\-–·•].*$/, "").trim().slice(0, 200);
    }
  }
  // Fallback : première ligne significative
  return lines[0]?.trim().slice(0, 200) || "";
}

export function extractLikelyCompany(text: string): string {
  if (!text) return "";
  const patterns = [
    /(?:chez|at|entreprise|company|société|recruteur\s*[:]?)\s+([A-ZÀ-ÿ][A-Za-zÀ-ÿ0-9\s&\.\-]{2,50})/i,
    /([A-ZÀ-ÿ][A-Za-zÀ-ÿ0-9\s&\.\-]{3,50})\s*(?:recrute|recherche|hiring)/i,
  ];
  for (const p of patterns) {
    const m = p.exec(text);
    if (m?.[1]) return m[1].trim().slice(0, 200);
  }
  // Fallback : 2e ligne
  const lines = text.split(/\n/).filter((l) => l.trim().length > 3);
  if (lines.length > 1) {
    const candidate = lines[1]?.trim() || "";
    if (!/(?:H\/F|F\/H|CDI|CDD|Stage|Manager|Directeur)/i.test(candidate)) {
      return candidate.slice(0, 200);
    }
  }
  return "";
}

export function extractLikelyLocation(text: string): string | undefined {
  const cities = /(?:Paris|Lyon|Marseille|Bordeaux|Nantes|Lille|Toulouse|Nice|Strasbourg|Montpellier|Rennes|Remote|Télétravail|Full.remote|France|Europe|International)/gi;
  const matches = text.match(cities);
  if (!matches) return undefined;
  const unique = [...new Set(matches)];
  return unique.join(", ").slice(0, 200);
}

export function parseManualJobText(rawText: string, sourceUrl?: string): ManualPreview {
  const warnings: string[] = [];
  if (!rawText || rawText.trim().length < 50) {
    return { title: "", company: "", description: rawText || "", warnings: ["Texte trop court (< 50 caractères)"], confidence: "low" };
  }

  const title = extractLikelyTitle(rawText);
  const company = extractLikelyCompany(rawText);
  const location = extractLikelyLocation(rawText);

  if (!title) warnings.push("Titre non détecté — à compléter manuellement");
  if (!company) warnings.push("Entreprise non détectée — à compléter manuellement");

  // Contrat
  let contractType: string | undefined;
  if (/CDI/i.test(rawText)) contractType = "CDI";
  else if (/CDD/i.test(rawText)) contractType = "CDD";
  else if (/Stage/i.test(rawText)) contractType = "Stage";
  else if (/Freelance|Indépendant/i.test(rawText)) contractType = "Freelance";

  // Salaire
  const salMatch = rawText.match(/(?:salaire|salary|rémunération|package)\s*[:;]?\s*(?:de\s+)?([\d\s.,]*[kK€EUR]?\s*(?:[–\-àto]+\s*[\d\s.,]*[kK€EUR]?)?)/i);
  const salary = salMatch?.[1]?.trim() || undefined;

  // Confidence
  let confidence: "high" | "medium" | "low" = "high";
  if (warnings.length >= 2) confidence = "low";
  else if (warnings.length === 1) confidence = "medium";

  return {
    title,
    company,
    location,
    description: rawText.trim().slice(0, 10000),
    sourceUrl: sourceUrl || undefined,
    contractType,
    salary,
    warnings,
    confidence,
  };
}
