// ─── ELTON OS – Service IA optionnel DeepSeek ───
// S'active uniquement si DEEPSEEK_API_KEY est configuré.
// Fallback automatique vers l'heuristique locale si indisponible.

import { prisma } from "@/lib/prisma";
import type { AnalysisReport } from "./engine";

interface AIConfig {
  provider: string;
  apiKey: string | null;
  baseUrl: string;
  defaultModel: string;
  proModel: string;
  anonymizeBeforeCall: boolean;
}

async function getAIConfig(): Promise<AIConfig | null> {
  try {
    const settings = await prisma.setting.findFirst();
    if (!settings || settings.aiProvider === "none" || !settings.apiKey) return null;
    return {
      provider: settings.aiProvider,
      apiKey: settings.apiKey,
      baseUrl: settings.baseUrl || "https://api.deepseek.com",
      defaultModel: settings.defaultModel || "deepseek-v4-flash",
      proModel: settings.proModel || "deepseek-v4-pro",
      anonymizeBeforeCall: settings.anonymizeBeforeCall || false,
    };
  } catch {
    return null;
  }
}

function anonymizeText(text: string): string {
  return text
    .replace(/[A-Z][a-z]+ [A-Z][a-z]+/g, "[PRÉNOM NOM]")
    .replace(/\b[\w.-]+@[\w.-]+\.\w+\b/g, "[EMAIL]")
    .replace(/\b0[1-9][0-9]{8}\b/g, "[TÉLÉPHONE]")
    .replace(/\b\d{2,3}\s?\d{2,3}\s?\d{2,3}\s?\d{2,3}\b/g, "[TÉLÉPHONE]")
    .replace(/linkedin\.com\/in\/[\w-]+/gi, "[LINKEDIN]");
}

export async function runAIAnalysis(
  rawText: string,
  heuristicReport: AnalysisReport
): Promise<AnalysisReport> {
  const config = await getAIConfig();

  if (!config || !config.apiKey) {
    // Pas de config IA → retourner l'heuristique directement
    return { ...heuristicReport, aiModel: "ELTON-OS Heuristic (no API key)" };
  }

  const textToAnalyze = config.anonymizeBeforeCall ? anonymizeText(rawText) : rawText;

  const prompt = buildAnalysisPrompt(textToAnalyze, heuristicReport);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    const response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.defaultModel,
        messages: [
          { role: "system", content: "Tu es un analyste de recrutement pour dirigeants commerciaux. Réponds UNIQUEMENT en JSON valide, sans markdown, sans commentaires." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 3000,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`DeepSeek API error ${response.status}, fallback heuristique`);
      return { ...heuristicReport, aiModel: `ELTON-OS Heuristic (API error ${response.status})` };
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content;

    if (!aiContent) {
      return { ...heuristicReport, aiModel: "ELTON-OS Heuristic (API empty response)" };
    }

    // Parser la réponse IA et merger avec l'heuristique
    const aiJson = extractJSON(aiContent);
    if (!aiJson) {
      return { ...heuristicReport, aiModel: "ELTON-OS Heuristic (API parse error)" };
    }

    return mergeAIWithHeuristic(aiJson, heuristicReport, config.defaultModel);
  } catch (e: unknown) {
    const err = e as Error;
    console.warn(`AI analysis failed: ${err.message}, fallback heuristique`);
    return { ...heuristicReport, aiModel: `ELTON-OS Heuristic (${err.message?.slice(0, 50) || "error"})` };
  }
}

function extractJSON(text: string): Record<string, unknown> | null {
  // Tenter de parser directement
  try { return JSON.parse(text); } catch { /* continue */ }

  // Tenter d'extraire entre ```json ... ```
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) {
    try { return JSON.parse(codeBlock[1]); } catch { /* continue */ }
  }

  // Tenter de trouver le premier { ... }
  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    try { return JSON.parse(braceMatch[0]); } catch { /* continue */ }
  }

  return null;
}

function mergeAIWithHeuristic(
  aiJson: Record<string, unknown>,
  heuristic: AnalysisReport,
  model: string
): AnalysisReport {
  return {
    ...heuristic,
    summary: (aiJson.summary as string) || heuristic.summary,
    priority: validatePriority(aiJson.priority) || heuristic.priority,
    recommendedStrategy: validateStrategy(aiJson.recommendedStrategy) || heuristic.recommendedStrategy,
    keywordsAts: (aiJson.keywordsAts as string[]) || heuristic.keywordsAts,
    pointsForts: (aiJson.pointsForts as string[]) || heuristic.pointsForts,
    gaps: (aiJson.gaps as string[]) || heuristic.gaps,
    risks: (aiJson.risks as string[]) || heuristic.risks,
    score: {
      ...heuristic.score,
      globalScore: typeof aiJson.globalScore === "number" ? aiJson.globalScore as number : heuristic.score.globalScore,
    },
    matchDetails: { ...heuristic.matchDetails, aiEnhanced: true },
    aiModel: `DeepSeek ${model} + ELTON-OS Heuristic`,
  };
}

function validatePriority(p: unknown): AnalysisReport["priority"] | null {
  if (["HIGH", "MEDIUM", "LOW", "AVOID"].includes(p as string)) return p as AnalysisReport["priority"];
  return null;
}

function validateStrategy(s: unknown): string | null {
  const valid = [
    "CANDIDATURE_DIRECTE", "CANDIDATURE_PLUS_MESSAGE_RECRUTEUR",
    "APPROCHE_RESEAU_AVANT", "CABINET_RECRUTEMENT",
    "CANDIDATURE_SPONTANEE", "EVITER",
  ];
  return valid.includes(s as string) ? s as string : null;
}

function buildAnalysisPrompt(rawText: string, heuristic: AnalysisReport): string {
  return `Analyse cette offre d'emploi pour un dirigeant commercial et retourne UNIQUEMENT un objet JSON.

OFFRE:
${rawText.slice(0, 8000)}

CONTEXTE HEURISTIQUE (base de référence):
- Score global estimé: ${heuristic.score.globalScore}/100
- Rôle détecté: ${heuristic.requirements.roleDetected}
- Matches confirmés: ${heuristic.match.confirmedMatches.length}
- Gaps détectés: ${heuristic.match.gaps.length}

Retourne UNIQUEMENT ce JSON (pas de markdown, pas de texte autour):
{
  "summary": "résumé 2-3 phrases en français",
  "globalScore": nombre 0-100,
  "priority": "HIGH" | "MEDIUM" | "LOW" | "AVOID",
  "recommendedStrategy": "CANDIDATURE_DIRECTE" | "CANDIDATURE_PLUS_MESSAGE_RECRUTEUR" | "APPROCHE_RESEAU_AVANT" | "CABINET_RECRUTEMENT" | "CANDIDATURE_SPONTANEE" | "EVITER",
  "keywordsAts": ["mot1", "mot2", ...5-10 mots-clés],
  "pointsForts": ["point1", "point2", ...3-5 forces du candidat pour ce poste],
  "gaps": ["gap1", "gap2", ...écarts constatés],
  "risks": ["risque1", "risque2", ...risques identifiés]
}`;
}
