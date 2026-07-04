import { NextResponse } from "next/server";
import { generateExecutiveContent } from "@/lib/executive/tools";

// POST /api/tools/cover-letter
// Body: { applicantName, currentRole, targetRole, company, jobDescription, keyAchievements[], tone: 'board' | 'peer' | 'founder' }
// Returns: { letters: [{ tone, text }] }
//
// Better than Rezi: generates 3 distinct tones (board-ready, peer-to-peer, founder-style).
// Rezi only generates 1 generic cover letter.
// Executive cover letters are NOT generic — they show strategic fit + cultural fit + value creation thesis.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      applicantName,
      currentRole,
      targetRole,
      company,
      jobDescription,
      keyAchievements,
      tone = "all",
    } = body as {
      applicantName: string;
      currentRole: string;
      targetRole: string;
      company: string;
      jobDescription?: string;
      keyAchievements?: string[];
      tone?: "board" | "peer" | "founder" | "all";
    };

    if (!targetRole || !company) {
      return NextResponse.json({ error: "targetRole et company requis" }, { status: 400 });
    }

    const tones = tone === "all" ? ["board", "peer", "founder"] : [tone];

    const systemPrompt = `Tu es un ghostwriter de lettres de motivation pour cadres dirigeants (CEO, DG, CFO, COO, Country Manager).
Génère ${tones.length === 1 ? "1 lettre" : "3 lettres"} de motivation pour un poste exécutif.

TONS:
- "board" (300-400 mots): adressée au board/Conseil. Ton sobre, focus valeur actionnariale, gouvernance, alignement stratégique. Référence aux décisions du Board, KPIs financiers, création de valeur long-terme.
- "peer" (300-400 mots): adressée au CEO/DG (recruteur pair). Ton direct, focus opérationnel, livraison, équipes, culture. Référence au "nous", "ensemble", collaboration.
- "founder" (300-400 mots): adressée au fondateur/actionnaire majoritaire. Ton entrepreneurial, vision partagée, agilité, mise en main. Référence à la vision, au cap, à la croissance.

RÈGLES:
1. Pas de "Madame, Monsieur," — adresser directement (Monsieur le Président, Cher [Prénom], etc.)
2. Pas de formules creuses ("je suis passionné", "dynamique", "motivé")
3. Mentionner 1-2 réalisations chiffrées
4. Montrer la compréhension de l'entreprise/secteur
5. Proposer une "value creation thesis" en 1 phrase
6. Ton français, sans "je" excessif (max 3 "je" par lettre)

JSON strict:
{
  "letters": [
    { "tone": "board", "text": "..." },
    { "tone": "peer", "text": "..." },
    { "tone": "founder", "text": "..." }
  ]
}`;

    const userPrompt = `Candidat: ${applicantName || "[non fourni]"}
Poste actuel: ${currentRole || "non précisé"}
Poste visé: ${targetRole}
Entreprise: ${company}

${jobDescription ? `Offre:\n${jobDescription.slice(0, 2500)}\n` : ""}

${keyAchievements && keyAchievements.length > 0 ? `Réalisations clés:\n${keyAchievements.map((a, i) => `${i + 1}. ${a}`).join("\n")}\n` : ""}

Génère ${tones.length} lettre(s) au ton: ${tones.join(", ")}.`;

    const result = await generateExecutiveContent({
      systemPrompt,
      userPrompt,
      maxTokens: 3000,
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
      return NextResponse.json({
        letters: [{ tone: tones[0], text: result.content }],
        provider: result.provider,
      });
    }
  } catch (error) {
    console.error("[cover-letter] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
