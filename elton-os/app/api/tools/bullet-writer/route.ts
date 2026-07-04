import { NextResponse } from "next/server";
import { generateExecutiveContent, isExecutiveContent } from "@/lib/executive/tools";

// POST /api/tools/bullet-writer
// Body: { role, company, briefDescription, industry?, targetRole? }
// Returns: { bullets: Array<{ text, type, impact }> }
//
// Better than Rezi: generates EXECUTIVE-grade bullets with P&L, team, board, M&A signals.
// Rezi's bullets are generic ("managed team of 5"). Ours are exec-grade
// ("Dirigé une équipe de 120 personnes (15 directs), P&L de 85 M€, croissance EBITDA +32% sur 18 mois").
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { role, company, briefDescription, industry, targetRole } = body as {
      role: string;
      company: string;
      briefDescription: string;
      industry?: string;
      targetRole?: string;
    };

    if (!role || !company || !briefDescription) {
      return NextResponse.json({ error: "role, company et briefDescription requis" }, { status: 400 });
    }

    if (briefDescription.trim().length < 20) {
      return NextResponse.json({ error: "Description trop courte (min 20 caractères)" }, { status: 400 });
    }

    const isExec = isExecutiveContent(role) || isExecutiveContent(briefDescription);

    const systemPrompt = `Tu es un ghostwriter executive premium spécialisé CV de cadres dirigeants (CEO, DG, CFO, COO, Country Manager).
Génère 5 bullets de CV exécutifs à partir du brief fourni.

RÈGLES STRICTES:
1. Chaque bullet commence par un verbe fort (Dirigé, Piloté, Transformé, Lancé, Industrialisé, Négocié…)
2. Chaque bullet doit inclure au moins UN de ces signaux exec:
   - Impact financier chiffré (M€, %, EBITDA, CA, marge)
   - Taille d'équipe (X personnes, Y directs)
   - Portée (pays, zones, filiales)
   - Gouvernance (CoDir, Board, Comex)
   - M&A / transformation
   - Stakeholders (investisseurs, fonds, régulateurs)
3. PAS de "je", PAS de fluff, PAS de mots vagues
4. Style: sobre, factuel, en français
5. Chaque bullet max 25 mots

Réponds en JSON strict:
{
  "bullets": [
    {
      "text": "Dirigé...",
      "type": "financial" | "leadership" | "strategy" | "transformation" | "stakeholder",
      "impact": "haute" | "moyenne" | "standard"
    }
  ]
}`;

    const userPrompt = `Poste: ${role}
Entreprise: ${company}
Secteur: ${industry || "non précisé"}
Poste visé: ${targetRole || "non précisé (CV général exec)"}

Brief de l'expérience:
${briefDescription}

${isExec ? "✓ Poste exécutif détecté — utiliser un ton board-ready" : "⚠ Poste non exécutif reconnu — adapter le ton"}

Génère 5 bullets exécutifs percutants.`;

    const result = await generateExecutiveContent({
      systemPrompt,
      userPrompt,
      maxTokens: 1500,
    });

    if (!result.success || !result.content) {
      return NextResponse.json(
        { error: result.error || "Échec de génération IA" },
        { status: 502 }
      );
    }

    // Parse JSON (handle markdown code blocks)
    let jsonStr = result.content.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1].trim();

    let parsed: { bullets?: Array<{ text: string; type: string; impact: string }> };
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      // Fallback: extract bullets manually
      const lines = result.content.split("\n").filter((l) => l.trim().startsWith("-") || l.trim().startsWith("•") || /^\d/.test(l.trim()));
      parsed = {
        bullets: lines.slice(0, 5).map((l) => ({
          text: l.replace(/^[-•\d\.\s]+/, "").trim(),
          type: "general",
          impact: "standard",
        })),
      };
    }

    return NextResponse.json({
      bullets: parsed.bullets || [],
      isExecutive: isExec,
      provider: result.provider,
    });
  } catch (error) {
    console.error("[bullet-writer] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
