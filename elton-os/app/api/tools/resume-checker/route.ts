import { NextResponse } from "next/server";
import { analyzeResume35Points, computeGlobalScore, detectLanguage, detectIndustries } from "@/lib/executive/tools";
import { generateExecutiveContent } from "@/lib/executive/tools";

// POST /api/tools/resume-checker
// Body: { resumeText: string, jobDescription?: string }
// Returns: { score, checkpoints, categories, recommendations, industryInsights }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { resumeText, jobDescription } = body as { resumeText: string; jobDescription?: string };

    if (!resumeText || resumeText.trim().length < 50) {
      return NextResponse.json(
        { error: "Texte du CV trop court (minimum 50 caractères)" },
        { status: 400 }
      );
    }

    // 1. Run 35-point rules engine (instant)
    const checkpoints = analyzeResume35Points(resumeText);
    const { global, byCategory } = computeGlobalScore(checkpoints);
    const language = detectLanguage(resumeText);
    const industries = detectIndustries(resumeText);

    // 2. Generate executive-grade recommendations via IA (better than Rezi's static tips)
    const failingChecks = checkpoints.filter((c) => c.status === "fail" || c.status === "warn").slice(0, 8);
    const recsText = failingChecks.map((c) => `- ${c.label}: ${c.message}`).join("\n");

    const systemPrompt = `Tu es un coach career executive premium (cible: CEO, DG, CFO, COO, Country Manager).
Tu analyses un CV de cadre dirigeant et génères 3 à 5 recommandations STRATÉGIQUES (pas cosmétiques) pour l'améliorer.
Style: direct, professional, en français. Pas de fluff. Chaque reco doit être actionable en moins de 30 min.
Réponds en JSON strict avec ce format:
{
  "recommendations": [
    { "priority": "haute", "title": "...", "rationale": "...", "action": "..." }
  ],
  "executiveSummary": "Diagnostic en 2 phrases",
  "competitiveVsPeers": "Comment ce CV se compare aux autres cadres dirigeants de même niveau"
}`;

    const userPrompt = `CV à analyser:
${resumeText.slice(0, 4000)}

${jobDescription ? `Offre visée:\n${jobDescription.slice(0, 2000)}` : ""}

Points faibles détectés par l'analyse automatique:
${recsText}

Secteur(x) détecté(s): ${industries.join(", ") || "non identifié"}
Langue: ${language}

Génère 3-5 recommandations exécutives stratégiques.`;

    let aiAnalysis: { recommendations?: unknown[]; executiveSummary?: string; competitiveVsPeers?: string } | null = null;
    try {
      const result = await generateExecutiveContent({
        systemPrompt,
        userPrompt,
        maxTokens: 1500,
      });
      if (result.success && result.content) {
        // Try to parse JSON (handle markdown code blocks)
        let jsonStr = result.content.trim();
        const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) jsonStr = jsonMatch[1].trim();
        aiAnalysis = JSON.parse(jsonStr);
      }
    } catch (e) {
      console.error("[resume-checker] IA analysis failed:", e);
    }

    // 3. Compute Rezi comparison bonus
    const reziComparison = {
      reziPoints: 23,
      prstoPoints: 35,
      extraPoints: 12,
      extras: [
        "Titre exécutif (DG/CFO/COO/Country Manager)",
        "Signaux gouvernance (CoDir/Board/Comex)",
        "Portée internationale",
        "M&A / transformation",
        "Parties prenantes stratégiques",
        "Vision stratégique",
        "Secteur d'expertise identifiable",
        "École tier-1",
        "Certifications (MBA/CFA)",
        "Reconnaissance / prix",
        "Impact financier (CA/EBITDA)",
        "Taille d'équipe managée",
      ],
    };

    return NextResponse.json({
      score: global,
      maxScore: 100,
      grade: global >= 85 ? "A" : global >= 70 ? "B" : global >= 55 ? "C" : global >= 40 ? "D" : "E",
      checkpoints,
      byCategory,
      detectedLanguage: language,
      detectedIndustries: industries,
      aiRecommendations: aiAnalysis?.recommendations || [],
      aiExecutiveSummary: aiAnalysis?.executiveSummary || null,
      aiCompetitiveVsPeers: aiAnalysis?.competitiveVsPeers || null,
      reziComparison,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[resume-checker] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'analyse", detail: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
