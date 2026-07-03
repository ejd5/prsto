/**
 * POST /api/extension/score
 * Quick match scoring (non-streaming)
 */

import { NextRequest, NextResponse } from "next/server";
import { generateJsonWithDeepSeek } from "@/lib/ai/deepseek";

const SCORE_SYSTEM_PROMPT = `Tu es un expert en recrutement de cadres dirigeants chez PRSTO, le copilote carrière IA premium. Tu évalues la compatibilité entre un candidat type (cadre dirigeant) et une offre d'emploi.

Analyse l'offre fournie et retourne un SCORE OBJECTIF sur 6 dimensions (note /100), UNIQUEMENT basé sur ce que l'offre demande et ce qu'un cadre dirigeant type peut offrir. Ne mens pas, n'invente pas, ne flatte pas.

Retourne UNIQUEMENT un JSON valide :
{
  "global": 75,
  "breakdown": {
    "role": 70, "seniority": 80, "location": 85,
    "sector": 70, "skills": 75, "atsCompatibility": 70
  },
  "strengths": ["Force 1", "Force 2"],
  "gaps": ["Gap 1", "Gap 2"],
  "atsKeywordsMissing": ["mot-cle 1", "mot-cle 2"],
  "oneLineVerdict": "Bonne compatibilité, 2 points à retravailler.",
  "recommendation": "postuler"
}`;

export async function POST(req: NextRequest) {
  try {
    const { offer } = await req.json();
    if (!offer?.title || !offer?.description) {
      return NextResponse.json(
        { error: "Offer title and description required" },
        { status: 400 }
      );
    }

    const offerText = buildOfferPrompt(offer);

    const result = await generateJsonWithDeepSeek({
      systemPrompt: SCORE_SYSTEM_PROMPT,
      userPrompt: `Offre à analyser :\n\n${offerText}`,
      temperature: 0.3,
    });

    if (!result.success || !result.data) {
      return NextResponse.json({
        global: 0,
        breakdown: { role: 0, seniority: 0, location: 0, sector: 0, skills: 0, atsCompatibility: 0 },
        strengths: [],
        gaps: [],
        atsKeywordsMissing: [],
        oneLineVerdict: "Impossible d'analyser cette offre.",
        recommendation: "passer",
        error: result.error,
      });
    }

    return NextResponse.json(result.data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Scoring failed" },
      { status: 500 }
    );
  }
}

function buildOfferPrompt(offer: any): string {
  return [
    `Titre : ${offer.title || "N/A"}`,
    `Entreprise : ${offer.company || "N/A"}`,
    `Lieu : ${offer.location || "N/A"}`,
    `Salaire : ${offer.salary || "N/A"}`,
    `Contrat : ${offer.contractType || "N/A"}`,
    `Description : ${(offer.description || "").slice(0, 5000)}`,
  ].join("\n");
}
