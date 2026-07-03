export interface RoleDefinition {
  title: string;
  keywords: string[];
  weight: number; // 0-1
}

// Rôles exécutifs cibles avec mots-clés de détection
const EXECUTIVE_ROLES: RoleDefinition[] = [
  { title: "Directeur Commercial", keywords: ["directeur commercial", "dir commercial", "directeur des ventes",
    "sales director", "directeur du développement commercial", "directeur commercial france"], weight: 1.0 },
  { title: "Directeur des Ventes", keywords: ["directeur des ventes", "sales director", "directeur vente",
    "head of sales france", "responsable des ventes france"], weight: 0.95 },
  { title: "Head of Sales", keywords: ["head of sales", "head of sales france", "sales head",
    "head of sales europe", "vp sales france"], weight: 0.9 },
  { title: "VP Sales", keywords: ["vp sales", "vice president sales", "vice-président commerce",
    "vice-président commercial", "vice president sales france"], weight: 0.9 },
  { title: "Chief Sales Officer", keywords: ["chief sales officer", "cso", "directeur général commercial"], weight: 0.85 },
  { title: "Chief Commercial Officer", keywords: ["chief commercial officer", "cco", "directeur commercial groupe"], weight: 0.85 },
  { title: "Chief Revenue Officer", keywords: ["chief revenue officer", "cro", "directeur de la croissance des revenus", "revenue director"], weight: 0.85 },
  { title: "Country Manager", keywords: ["country manager", "country manager france", "general manager france",
    "directeur france", "directeur général france", "france country manager"], weight: 0.95 },
  { title: "Directeur Commercial & Marketing", keywords: ["directeur commercial marketing",
    "directeur commercial et marketing", "directrice commerciale marketing", "directeur marketing vente"], weight: 0.8 },
  { title: "Directeur Business Development", keywords: ["directeur business development",
    "business development director", "directeur développement commercial", "head of business development",
    "directeur développement business"], weight: 0.85 },
  { title: "Directeur Général", keywords: ["directeur général", "directeur general",
    "ceo", "président directeur général", "dg", "directeur général délégué",
    "directrice générale", "managing director"], weight: 0.8 },
  { title: "Directeur Régional", keywords: ["directeur régional", "regional director",
    "regional sales director", "directeur régional des ventes"], weight: 0.75 },
];

function normalizeTitleForMatching(title: string): string {
  // Nettoie le titre pour le matching
  return title
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function scoreByTitle(title: string | null, priorityRoleNames: string[]): {
  score: number;
  matchedRoles: string[];
} {
  if (!title) return { score: 0, matchedRoles: [] };

  const normalized = normalizeTitleForMatching(title);
  const matchedRoles: string[] = [];
  let bestScore = 0;

  for (const role of EXECUTIVE_ROLES) {
    for (const keyword of role.keywords) {
      const normalizedKeyword = normalizeTitleForMatching(keyword);
      // Match exact ou contient
      if (normalized.includes(normalizedKeyword)) {
        matchedRoles.push(role.title);
        let score = role.weight * 100;

        // Booste si le rôle est dans les priorités utilisateur
        if (priorityRoleNames.some(p => normalizeTitleForMatching(p).includes(normalizedKeyword))) {
          score = Math.min(score * 1.2, 100);
        }

        bestScore = Math.max(bestScore, score);
        break; // Un seul match par rôle suffit
      }
    }
  }

  // Fallback titre générique
  if (bestScore === 0) {
    const genericSalesKeywords = ["sales", "commercial", "business", "vente", "ventes", "account",
      "client", "marché", "marché", "prospection", "portefeuille", "négociation"];
    const matchCount = genericSalesKeywords.filter(k => normalized.includes(k)).length;
    if (matchCount >= 2) {
      bestScore = 40 + matchCount * 5;
      matchedRoles.push("Poste commercial / vente");
    }
  }

  return {
    score: Math.round(bestScore),
    matchedRoles: [...new Set(matchedRoles)],
  };
}
