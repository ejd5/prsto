/**
 * Moteur de déduplication d'offres — PRSTO
 * Détection de doublons basée sur similarité textuelle et structurelle.
 * Aucune suppression/fusion automatique — validation humaine obligatoire.
 */

// ─── Normalisation ────────────────────────────────

const STOP_WORDS_FR = ["le", "la", "les", "de", "du", "des", "et", "en", "un", "une", "pour", "sur", "dans", "avec", "par", "au", "aux", "ou", "h/f", "f/h"];
const STOP_WORDS_EN = ["the", "a", "an", "and", "or", "in", "of", "for", "to", "with", "by", "on", "at", "is", "be", "m/f", "f/m"];

export function normalizeJobTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s\-]/g, "")
    .replace(/[-_/]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(w => !STOP_WORDS_FR.includes(w) && !STOP_WORDS_EN.includes(w) && w.length > 1)
    .sort()
    .join(" ");
}

export function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b(sas?|sa|sarl|eurl|llc|ltd|inc|corp|gmbh|bv|nv|plc|spa|group|groupe|holding)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeLocation(loc: string): string {
  if (!loc) return "";
  return loc
    .toLowerCase()
    .replace(/[^\w\s\-]/g, "")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b(region|région|area|zone|paris\s+area|ile\s+de\s+france|idf)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Empreinte ────────────────────────────────────

export function createDescriptionFingerprint(rawText: string): string {
  const cleaned = rawText
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = cleaned.split(" ").filter(w =>
    w.length > 2 &&
    !STOP_WORDS_FR.includes(w) &&
    !STOP_WORDS_EN.includes(w)
  );

  const freq: Record<string, number> = {};
  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
  }

  // Top 20 most frequent meaningful words → fingerprint
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([w]) => w)
    .sort()
    .join("|");
}

// ─── Similarité textuelle (Jaccard) ───────────────

function jaccardSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const setA = new Set(a.split(/\s+/));
  const setB = new Set(b.split(/\s+/));
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

function fingerprintSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const setA = new Set(a.split("|"));
  const setB = new Set(b.split("|"));
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

// ─── Score global ─────────────────────────────────

export interface SimilarityResult {
  score: number;
  breakdown: {
    company: number;    // 25 pts max
    title: number;      // 20 pts max
    location: number;   // 15 pts max
    description: number; // 25 pts max
    keywords: number;   // 10 pts max
    contract: number;   // 5 pts max
  };
  status: "CONFIRMED_DUPLICATE" | "PROBABLE_DUPLICATE" | "SIMILAR" | "UNIQUE";
}

export function calculateOpportunitySimilarity(a: {
  normalizedTitle: string;
  normalizedCompany: string;
  normalizedLocation: string;
  descriptionFingerprint: string;
  keywords?: string; // JSON array from analysis
  contractType?: string | null;
}, b: {
  normalizedTitle: string;
  normalizedCompany: string;
  normalizedLocation: string;
  descriptionFingerprint: string;
  keywords?: string;
  contractType?: string | null;
}): SimilarityResult {
  // Company similarity (25 pts)
  const companySim = a.normalizedCompany === b.normalizedCompany
    ? 1.0
    : jaccardSimilarity(a.normalizedCompany, b.normalizedCompany);
  const companyScore = Math.round(companySim * 25);

  // Title similarity (20 pts)
  const titleSim = jaccardSimilarity(a.normalizedTitle, b.normalizedTitle);
  const titleScore = Math.round(titleSim * 20);

  // Location similarity (15 pts)
  const locSim = a.normalizedLocation && b.normalizedLocation
    ? jaccardSimilarity(a.normalizedLocation, b.normalizedLocation)
    : 0;
  const locationScore = Math.round(locSim * 15);

  // Description fingerprint similarity (25 pts)
  const descSim = fingerprintSimilarity(a.descriptionFingerprint, b.descriptionFingerprint);
  const descriptionScore = Math.round(descSim * 25);

  // Keywords similarity (10 pts)
  let keywordsScore = 0;
  if (a.keywords && b.keywords) {
    try {
      const kwA = typeof a.keywords === "string" ? JSON.parse(a.keywords) : a.keywords;
      const kwB = typeof b.keywords === "string" ? JSON.parse(b.keywords) : b.keywords;
      if (Array.isArray(kwA) && Array.isArray(kwB)) {
        const setA = new Set(kwA.map((k: string) => k.toLowerCase()));
        const setB = new Set(kwB.map((k: string) => k.toLowerCase()));
        const intersection = new Set([...setA].filter(x => setB.has(x)));
        const union = new Set([...setA, ...setB]);
        keywordsScore = union.size === 0 ? 0 : Math.round((intersection.size / union.size) * 10);
      }
    } catch { /* ignore parse errors */ }
  }

  // Contract type similarity (5 pts)
  const contractScore = a.contractType && b.contractType && a.contractType === b.contractType ? 5 : 0;

  const total = companyScore + titleScore + locationScore + descriptionScore + keywordsScore + contractScore;

  let status: SimilarityResult["status"];
  if (total >= 95) status = "CONFIRMED_DUPLICATE";
  else if (total >= 75) status = "PROBABLE_DUPLICATE";
  else if (total >= 50) status = "SIMILAR";
  else status = "UNIQUE";

  return {
    score: total,
    breakdown: {
      company: companyScore,
      title: titleScore,
      location: locationScore,
      description: descriptionScore,
      keywords: keywordsScore,
      contract: contractScore,
    },
    status,
  };
}

// ─── Détection par lot ────────────────────────────

export interface OppForDedup {
  id: string;
  title: string;
  company: string;
  normalizedTitle: string;
  normalizedCompany: string;
  normalizedLocation: string;
  descriptionFingerprint: string;
  keywords?: string;
  contractType?: string | null;
  duplicateStatus: string;
  duplicateGroupId?: string | null;
  duplicateScore?: number | null;
}

export function detectDuplicates(newOpp: OppForDedup, existingOpps: OppForDedup[]): {
  matches: { opp: OppForDedup; result: SimilarityResult }[];
  highestScore: number;
  highestStatus: SimilarityResult["status"];
} {
  const matches: { opp: OppForDedup; result: SimilarityResult }[] = [];

  for (const existing of existingOpps) {
    if (existing.id === newOpp.id) continue;
    if (existing.duplicateStatus === "IGNORED") continue;

    const result = calculateOpportunitySimilarity(newOpp, existing);
    if (result.score >= 50) {
      matches.push({ opp: existing, result });
    }
  }

  matches.sort((a, b) => b.result.score - a.result.score);

  const highestScore = matches.length > 0 ? matches[0].result.score : 0;
  let highestStatus: SimilarityResult["status"] = "UNIQUE";
  if (highestScore >= 95) highestStatus = "CONFIRMED_DUPLICATE";
  else if (highestScore >= 75) highestStatus = "PROBABLE_DUPLICATE";
  else if (highestScore >= 50) highestStatus = "SIMILAR";

  return { matches, highestScore, highestStatus };
}
