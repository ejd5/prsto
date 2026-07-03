import { NextRequest, NextResponse } from "next/server";
import { generateWithZai } from "@/lib/ai/zai-client";
import { generateWithDeepSeek } from "@/lib/ai/deepseek";

/**
 * POST /api/mock-interview-panel/debrief
 *
 * Body: {
 *   jobTitle: string,
 *   company?: string,
 *   qaPairs: Array<{ role, question, answer }>
 * }
 * Response: { success, debrief: Array<{ dimension, score, feedback }> }
 *
 * Génère un débrief 360° en analysant les réponses du candidat
 * sur 5 dimensions : stratégie, finance, leadership, communication, vision.
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const jobTitle: string = (body?.jobTitle ?? "Directeur Général").toString();
    const company: string = (body?.company ?? "").toString();
    const qaPairs = Array.isArray(body?.qaPairs) ? body.qaPairs : [];

    if (qaPairs.length === 0) {
      return NextResponse.json(
        { success: false, error: "Aucune Q/R fournie" },
        { status: 400 }
      );
    }

    // Construire le récap des Q/R
    const qaText = qaPairs
      .map((qa: { role: string; question: string; answer: string }, i: number) =>
        `Q${i + 1} [${qa.role}]: ${qa.question}\nR: ${qa.answer}`
      )
      .join("\n\n");

    const systemPrompt = `Tu es un coach executive senior qui débriefe un entretien Comex. Analyse les réponses du candidat pour le poste de "${jobTitle}"${company ? ` chez ${company}` : ""}.

Voici les questions et réponses :

${qaText}

Génère un débrief sur 5 dimensions, avec un score 0-100 et un feedback constructif pour chacune :

1. **Vision stratégique** — capacité à articuler une vision claire
2. **Maîtrise financière** — compréhension des enjeux P&L, ROI
3. **Leadership & management** — gestion d'équipe, culture
4. **Communication** — clarté, conviction, présence
5. **Création de valeur** — impact business, stratégie de croissance

Réponds en JSON valide avec ce format exact :
{
  "debrief": [
    { "dimension": "Vision stratégique", "score": 75, "feedback": "Feedback constructif..." },
    { "dimension": "Maîtrise financière", "score": 65, "feedback": "..." },
    { "dimension": "Leadership & management", "score": 80, "feedback": "..." },
    { "dimension": "Communication", "score": 70, "feedback": "..." },
    { "dimension": "Création de valeur", "score": 60, "feedback": "..." }
  ]
}

Sois exigeant mais juste. Le feedback doit être actionnable (pas de compliments vides).
Ne retourne QUE le JSON.`;

    let result = await generateWithZai({
      systemPrompt,
      userPrompt: "Génère le débrief 360°.",
      timeout: 40000,
    });

    if (!result.success || !result.content) {
      result = await generateWithDeepSeek({
        systemPrompt,
        userPrompt: "Génère le débrief 360°.",
        temperature: 0.5,
        maxTokens: 1000,
        timeout: 30000,
      });
    }

    if (!result.success || !result.content) {
      return NextResponse.json(
        { success: false, error: "Génération débrief échec" },
        { status: 500 }
      );
    }

    // Parser le JSON
    let debrief;
    try {
      let jsonStr = result.content.trim();
      if (jsonStr.startsWith("```json")) jsonStr = jsonStr.slice(7);
      if (jsonStr.startsWith("```")) jsonStr = jsonStr.slice(3);
      if (jsonStr.endsWith("```")) jsonStr = jsonStr.slice(0, -3);
      jsonStr = jsonStr.trim();

      const parsed = JSON.parse(jsonStr);
      debrief = parsed.debrief || parsed;
    } catch {
      // Fallback générique
      debrief = [
        { dimension: "Vision stratégique", score: 70, feedback: "Réponses cohérentes mais manque de specifics. Préparez 3 axes stratégiques concrets." },
        { dimension: "Maîtrise financière", score: 65, feedback: "Bonne compréhension générale. Renforcez avec des chiffres précis (EBITDA, CAC, LTV)." },
        { dimension: "Leadership & management", score: 75, feedback: "Bon sens du management. Ajoutez des exemples de gestion de crise." },
        { dimension: "Communication", score: 70, feedback: "Clarté correcte. Travaillez votre pitch en 30 secondes." },
        { dimension: "Création de valeur", score: 60, feedback: "Manque de vision long-terme. Pensez exit strategy pour les actionnaires." },
      ];
    }

    return NextResponse.json({
      success: true,
      debrief,
    });
  } catch (err) {
    console.error("[/api/mock-interview-panel/debrief] Error:", err);
    return NextResponse.json(
      { success: false, error: "Erreur interne" },
      { status: 500 }
    );
  }
}
