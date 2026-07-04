import { NextResponse } from "next/server";
import { generateExecutiveContent } from "@/lib/executive/tools";

// POST /api/tools/resume-agent
// Body: { conversation: [{ role: 'agent' | 'user', content }], profile?: { fullName, currentRole, yearsExp, targetRole? }, cvDraft?: string }
// Returns: { reply, suggestedSection?, isComplete?, extractedData? }
//
// Better than Rezi: PRSTO's Resume Agent is a CONVERSATIONAL agent that interviews
// the executive about their career (achievements, scope, P&L, leadership) and
// progressively builds the CV Master. Rezi's "AI Resume Agent" is just a
// prompt-based one-shot generator.
//
// This endpoint is called turn-by-turn. Each user message triggers an agent reply
// that either:
// - Asks the next probing question (deeper than Rezi's "what's your job title?")
// - Confirms a piece of info and updates the extracted profile
// - Detects completion signals and signals ready-to-generate
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { conversation, profile, cvDraft } = body as {
      conversation: Array<{ role: "agent" | "user"; content: string }>;
      profile?: {
        fullName?: string;
        currentRole?: string;
        yearsExp?: number;
        targetRole?: string;
        industry?: string;
        keyAchievements?: string[];
        education?: string;
        languages?: string[];
      };
      cvDraft?: string;
    };

    if (!conversation || conversation.length === 0) {
      return NextResponse.json({ error: "Conversation vide" }, { status: 400 });
    }

    const isFirstTurn = conversation.length === 1 && conversation[0].role === "user";
    const turnCount = conversation.filter((m) => m.role === "user").length;

    const systemPrompt = `Tu es PRSTO Agent CV, un agent conversationnel premium qui interview un cadre dirigeant (CEO, DG, CFO, COO, Country Manager) pour construire son CV Master de façon incrémentale.

PHILOSOPHIE:
- Tu mènes une conversation type "executive interview" (pas un formulaire)
- Tu poses des questions ouvertes mais ciblées sur: P&L scope, team size, board reporting, M&A, transformations, international scope, strategic decisions, stakeholder management
- Tu creuses les réalisations: "Combien de M€ ?", "Combien de pays ?", "Combien de reports directs ?"
- Tu proposes des reformulations executive-grade quand l'utilisateur donne une info floue
- Tu signales quand tu as assez d'infos pour générer une section du CV

PROGRESSION (en 5-7 tours):
1. Tour 1-2: Comprendre le poste actuel + scope (équipe, budget, portée)
2. Tour 3-4: Réalisations marquantes chiffrées (M&A, transformation, croissance)
3. Tour 5: Parcours antérieur (postes clés précédents)
4. Tour 6: Formation + certifications + langues
5. Tour 7: Validation finale → signal isComplete=true

RÈGLES:
- 1 question à la fois (pas de liste de questions)
- Max 80 mots par message
- Ton: coach career premium, français, sobre mais engageant
- Quand tu détectes une info-clé (chiffre, scope, réalisation), confirme-la en la reformulant en langage exec
- Si l'utilisateur donne une réponse vague ("j'ai fait des transformations"), creuse: "Pouvez-vous me donner un exemple concret avec un chiffre d'impact ?"

JSON STRICT en réponse:
{
  "reply": "ton message à l'utilisateur (max 80 mots)",
  "suggestedSection": "summary" | "experience" | "education" | "skills" | null,
  "isComplete": false,
  "extractedData": {
    "currentRole": "...",
    "company": "...",
    "teamSize": "...",
    "pnlScope": "...",
    "achievements": ["..."],
    "internationalScope": "..."
  }
}

Pour le PREMIER tour (l'utilisateur vient de dire bonjour ou a donné son nom), réponds en demandant quel poste il occupe actuellement et depuis combien de temps, en ton coach exec premium.`;

    const conversationText = conversation.map((m) => `${m.role === "agent" ? "PRSTO Agent" : "Executive"}: ${m.content}`).join("\n");

    const userPrompt = `Profil déjà extrait:
${profile ? JSON.stringify(profile, null, 2) : "(aucun encore)"}

${cvDraft ? `Brouillon CV actuel:\n${cvDraft.slice(0, 1500)}\n` : ""}

Conversation:
${conversationText}

Tour actuel: ${turnCount + 1}

Réponds en respectant le format JSON strict.`;

    const result = await generateExecutiveContent({
      systemPrompt,
      userPrompt,
      maxTokens: 800,
    });

    if (!result.success || !result.content) {
      return NextResponse.json({ error: result.error || "Échec IA" }, { status: 502 });
    }

    let jsonStr = result.content.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonStr.startsWith("```")) {
      const m = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (m) jsonStr = m[1].trim();
    }

    try {
      const parsed = JSON.parse(jsonStr);
      return NextResponse.json({
        ...parsed,
        provider: result.provider,
        turnCount: turnCount + 1,
      });
    } catch {
      // Fallback: use raw text as reply
      return NextResponse.json({
        reply: result.content.slice(0, 500),
        suggestedSection: null,
        isComplete: turnCount >= 7,
        extractedData: profile || {},
        provider: result.provider,
        turnCount: turnCount + 1,
      });
    }
  } catch (error) {
    console.error("[resume-agent] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
