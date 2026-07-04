import { NextResponse } from "next/server";
import { generateExecutiveContent } from "@/lib/executive/tools";

// POST /api/tools/summary-generator
// Body: { fullName, currentRole, yearsExp, keyAchievements[], targetRole?, industry? }
// Returns: { summary, altVersions: [{ tone, text }] }
//
// Better than Rezi: generates a board-ready executive summary (50-80 words) +
// 2 alternative tones (visionary, operational). Rezi only generates 1 generic.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, currentRole, yearsExp, keyAchievements, targetRole, industry } = body as {
      fullName: string;
      currentRole: string;
      yearsExp: number;
      keyAchievements: string[];
      targetRole?: string;
      industry?: string;
    };

    if (!currentRole || !keyAchievements || keyAchievements.length === 0) {
      return NextResponse.json({ error: "currentRole et keyAchievements requis" }, { status: 400 });
    }

    const systemPrompt = `Tu es un coach career executive premium.
Génère 3 versions de profil/summary pour un CV de cadre dirigeant (CEO, DG, CFO, COO, Country Manager).

RÈGLES:
1. Version "board-ready" (50-80 mots): ton sobre, factuel,导向 board/investors. Pas de superlatifs.
2. Version "visionary" (60-90 mots): ton inspirant, met l'accent sur la stratégie, transformation, impact long-terme.
3. Version "operational" (60-90 mots): ton concret, focus exécution, livrables, métriques.

Chaque version doit inclure:
- Années d'expérience
- Secteur(s) d'expertise
- 1-2 réalisations marquantes (avec chiffres si fournis)
- Portée (international, équipe, P&L)

Style: français, sans "je", sans superlatifs creux ("passionné", "dynamique", "motivé").

JSON strict:
{
  "summary": "version board-ready (50-80 mots)",
  "altVersions": [
    { "tone": "visionary", "text": "..." },
    { "tone": "operational", "text": "..." }
  ]
}`;

    const userPrompt = `Nom: ${fullName || "[non fourni]"}
Poste actuel: ${currentRole}
Années d'expérience: ${yearsExp || "non précisé"}
Secteur: ${industry || "non précisé"}
Poste visé: ${targetRole || "non précisé (CV général exec)"}

Réalisations clés:
${keyAchievements.map((a, i) => `${i + 1}. ${a}`).join("\n")}

Génère le profil exécutif en 3 versions.`;

    const result = await generateExecutiveContent({
      systemPrompt,
      userPrompt,
      maxTokens: 1200,
    });

    if (!result.success || !result.content) {
      return NextResponse.json({ error: result.error || "Échec IA" }, { status: 502 });
    }

    let jsonStr = result.content.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1].trim();

    try {
      const parsed = JSON.parse(jsonStr);
      return NextResponse.json({ ...parsed, provider: result.provider });
    } catch {
      // Fallback: use raw content as summary
      return NextResponse.json({
        summary: result.content.slice(0, 600),
        altVersions: [],
        provider: result.provider,
      });
    }
  } catch (error) {
    console.error("[summary-generator] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
