import { NextResponse } from "next/server";
import { generateExecutiveContent } from "@/lib/executive/tools";

// POST /api/tools/resignation-letter
// Body: { employeeName, currentRole, company, lastDay, reason?: 'career' | 'personal' | 'conflict' | 'opportunity', gardenLeave?: boolean, nonCompete?: boolean, noticeWeeks?: number, handoverNotes?: string }
// Returns: { letters: [{ type, text }] }
//
// Better than Rezi: generates executive resignation with garden leave + non-compete clauses.
// Rezi's resignation letter is generic. Ours handles the executive specifics:
// - Garden leave (clause de suspension temporaire)
// - Non-compete indemnity
// - Handover plan
// - Board resignation (if board member)
// - Non-disparagement clause
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      employeeName,
      currentRole,
      company,
      lastDay,
      reason = "career",
      gardenLeave = false,
      nonCompete = false,
      noticeWeeks = 12,
      handoverNotes,
      isBoardMember = false,
    } = body as {
      employeeName: string;
      currentRole: string;
      company: string;
      lastDay: string;
      reason?: "career" | "personal" | "conflict" | "opportunity";
      gardenLeave?: boolean;
      nonCompete?: boolean;
      noticeWeeks?: number;
      handoverNotes?: string;
      isBoardMember?: boolean;
    };

    if (!employeeName || !currentRole || !company || !lastDay) {
      return NextResponse.json({ error: "employeeName, currentRole, company, lastDay requis" }, { status: 400 });
    }

    const systemPrompt = `Tu es un juriste RH executive premium.
Génère 2 versions d'une lettre de démission pour un cadre dirigeant (DG, CFO, COO, Country Manager).

VERSIONS:
1. "standard" (200-300 mots): démission formelle, sobre, professionnelle. Mentionne préavis, date de fin, transition.
2. "executive" (300-450 mots): version complète avec clauses spécifiques exec:
   ${gardenLeave ? "- Clause de garden leave (suspension temporaire pendant le préavis)" : ""}
   ${nonCompete ? "- Rappel de la clause de non-compété et indemnité associée" : ""}
   ${isBoardMember ? "- Démission du Conseil d'Administration (mandat social)" : ""}
   - Engagement de non-dénigrement
   - Plan de passation détaillé
   - Remerciements mesurés (pas larmoyant)

RÈGLES:
1. Ton sobre, professionnel, sans émotion excessive
2. Mentionner la date de fin effective
3. Proposer un plan de passation
4. Pas de critique de l'entreprise (même si conflit)
5. Style français, format lettre officielle
6. Date du jour + objet + formule d'appel + corps + formule de politesse

JSON strict:
{
  "letters": [
    { "type": "standard", "text": "..." },
    { "type": "executive", "text": "..." }
  ],
  "legalReminders": [
    "Rappel 1: préavis légal pour cadres dirimants...",
    "Rappel 2:..."
  ]
}`;

    const userPrompt = `Employé: ${employeeName}
Poste: ${currentRole}
Entreprise: ${company}
Date de fin souhaitée: ${lastDay}
Préavis (semaines): ${noticeWeeks}
Raison: ${reason}

Options exec:
- Garden leave: ${gardenLeave ? "OUI" : "non"}
- Non-compète: ${nonCompete ? "OUI" : "non"}
- Membre du Board: ${isBoardMember ? "OUI" : "non"}

${handoverNotes ? `Notes de passation:\n${handoverNotes}\n` : ""}

Génère les 2 versions de la lettre.`;

    const result = await generateExecutiveContent({
      systemPrompt,
      userPrompt,
      maxTokens: 2500,
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
        letters: [{ type: "standard", text: result.content }],
        legalReminders: [],
        provider: result.provider,
      });
    }
  } catch (error) {
    console.error("[resignation-letter] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
