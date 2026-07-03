import { generateJsonWithDeepSeek } from "@/lib/ai/deepseek";

const EXECUTIVE_PROFILE = `Cadre dirigeant commercial en France, orientation direction commerciale, revenue, transformation commerciale, B2B, SaaS, services, industrie, management d'équipes, croissance, grands comptes, stratégie go-to-market.

Postes ciblés : Directeur Commercial, Directeur des Ventes, Head of Sales, VP Sales, CSO, CCO, CRO, Country Manager France, Directeur Business Development, General Manager.

Localisation : Marseille / Aix-en-Provence / PACA = maximum. Paris / IDF = secondaire. Autre France = acceptable. International = exceptionnel uniquement.`;

const SCORING_PROMPT = `Tu es un assistant RH expert en scoring d'offres d'emploi pour cadres dirigeants.

Profil cible : ${EXECUTIVE_PROFILE}

Analyse cette offre et retourne un score JSON structuré.

RÈGLES DE SCORING :
- executiveScore (0-100) : le poste correspond-il à un rôle de cadre dirigeant commercial ?
- matchScore (0-100) : adéquation avec le profil cible (secteur, poste, taille d'entreprise)
- locationScore (0-100) : Marseille/Aix/PACA = 90-100, Paris/IDF = 70-85, autre France = 40-65, international = 5-20
- salaryScore (0-100) : si salaire mentionné et cohérent avec un poste de directeur (120k€+) = 70+
- freshnessScore (0-100) : si date publiée récente (< 30 jours) = 80+, sinon décroît
- companyScore (0-100) : entreprise connue, secteur pertinent = plus haut
- riskScore (0-100) : inversé. Plus bas = mieux. Drapeaux rouges : CDD, interim, startup non financée, turn-over élevé, mission courte
- globalScore (0-100) : moyenne pondérée. Poids : executive 30%, match 25%, location 25%, salary 10%, freshness 5%, company 5%

reasons : liste des points forts (max 3)
redFlags : liste des points faibles ou risques (max 3)
recommendedAction : "apply" si globalScore >= 75, "shortlist" si >= 55, "review" si >= 35, "skip" si < 35

Réponds UNIQUEMENT en JSON.`;

export interface DeepSeekScore {
  executiveScore: number;
  matchScore: number;
  locationScore: number;
  salaryScore: number;
  freshnessScore: number;
  companyScore: number;
  riskScore: number;
  globalScore: number;
  reasons: string[];
  redFlags: string[];
  recommendedAction: "apply" | "shortlist" | "review" | "skip";
}

const FALLBACK_SCORE: DeepSeekScore = {
  executiveScore: 50,
  matchScore: 50,
  locationScore: 50,
  salaryScore: 0,
  freshnessScore: 50,
  companyScore: 50,
  riskScore: 50,
  globalScore: 40,
  reasons: ["Score non évalué par DeepSeek"],
  redFlags: [],
  recommendedAction: "review",
};

export async function scoreJob(job: {
  title: string;
  company?: string | null;
  location?: string | null;
  description?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  contractType?: string | null;
  publishedAt?: Date | string | null;
}): Promise<DeepSeekScore> {
  try {
    const result = await generateJsonWithDeepSeek<DeepSeekScore>({
      systemPrompt: SCORING_PROMPT,
      userPrompt: `Offre à scorer :
Titre : ${job.title}
Entreprise : ${job.company || "non précisé"}
Localisation : ${job.location || "non précisée"}
Type de contrat : ${job.contractType || "non précisé"}
Salaire : ${job.salaryMin || "?"} - ${job.salaryMax || "?"} €
Description : ${(job.description || "").slice(0, 1500)}`,
      temperature: 0.2,
    });

    if (result.success && result.data) {
      return {
        executiveScore: result.data.executiveScore ?? FALLBACK_SCORE.executiveScore,
        matchScore: result.data.matchScore ?? FALLBACK_SCORE.matchScore,
        locationScore: result.data.locationScore ?? FALLBACK_SCORE.locationScore,
        salaryScore: result.data.salaryScore ?? FALLBACK_SCORE.salaryScore,
        freshnessScore: result.data.freshnessScore ?? FALLBACK_SCORE.freshnessScore,
        companyScore: result.data.companyScore ?? FALLBACK_SCORE.companyScore,
        riskScore: result.data.riskScore ?? FALLBACK_SCORE.riskScore,
        globalScore: result.data.globalScore ?? FALLBACK_SCORE.globalScore,
        reasons: result.data.reasons || FALLBACK_SCORE.reasons,
        redFlags: result.data.redFlags || [],
        recommendedAction: result.data.recommendedAction || FALLBACK_SCORE.recommendedAction,
      };
    }
  } catch { /* fallback */ }

  return FALLBACK_SCORE;
}

// Fallback local sans DeepSeek
export function scoreJobLocal(job: {
  title: string;
  location?: string | null;
  description?: string | null;
}): DeepSeekScore {
  const titleLower = job.title.toLowerCase();
  const locLower = (job.location || "").toLowerCase();
  const descLower = (job.description || "").toLowerCase();

  // Détection de score exécutif
  const execKeywords = ["directeur", "director", "vp ", "chief", "head of", "manager", "country manager", "general manager"];
  const execScore = execKeywords.some(k => titleLower.includes(k)) ? 70 : 30;

  // Score géographique
  const pacaMatch = ["marseille", "aix", "paca", "bouches", "toulon", "nice", "côte", "cote", "sud"];
  const parisMatch = ["paris", "idf", "défense", "defense", "neuilly", "boulogne"];
  const locScore = pacaMatch.some(k => locLower.includes(k)) ? 100 :
    parisMatch.some(k => locLower.includes(k)) ? 80 :
    locLower.includes("france") ? 50 : 15;

  // Match score (est-ce que le poste ressemble à ce qu'on cherche)
  const matchKw = ["commercial", "sales", "business", "vente", "ventes", "revenue", "croissance", "growth", "stratégie", "strategie", "b2b", "saas", "industrie", "service"];
  const matchCount = matchKw.filter(k => titleLower.includes(k) || descLower.includes(k)).length;
  const matchScore = Math.min(30 + matchCount * 10, 100);

  const globalScore = Math.round(execScore * 0.35 + matchScore * 0.25 + locScore * 0.25 + 15);

  return {
    executiveScore: execScore,
    matchScore,
    locationScore: locScore,
    salaryScore: 0,
    freshnessScore: 50,
    companyScore: 50,
    riskScore: 30,
    globalScore,
    reasons: globalScore >= 60 ? ["Poste cadre dirigeant détecté", "Localisation favorable"] : [],
    redFlags: globalScore < 40 ? ["Poste peu aligné avec le profil cible"] : [],
    recommendedAction: globalScore >= 75 ? "apply" : globalScore >= 55 ? "shortlist" : globalScore >= 35 ? "review" : "skip",
  };
}
