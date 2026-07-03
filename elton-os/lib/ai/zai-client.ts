// ─── Z.AI SDK Fallback — utilisé quand NVIDIA NIM est rate-limité (429) ───
// Le SDK z-ai-web-dev-sdk est gratuit et sans rate limit strict.
// On l'utilise en plan B pour garantir la disponibilité du Conseiller.
//
// Note : Z.AI ne supporte pas max_tokens directement, mais on peut
// demander au modèle (via le system prompt) de limiter sa réponse.
// Le système amont tronquera si nécessaire.

import ZAI from "z-ai-web-dev-sdk";

export interface ZaiGenerateResult {
  success: boolean;
  content?: string;
  error?: string;
}

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;

async function getZai() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

export async function generateWithZai(params: {
  systemPrompt: string;
  userPrompt: string;
  timeout?: number;
}): Promise<ZaiGenerateResult> {
  try {
    const zai = await getZai();

    // Ajouter une contrainte de longueur au system prompt pour rester sous 50s
    // Z.AI ne supporte pas max_tokens, donc on guide le modèle via le prompt.
    const constrainedSystemPrompt = `${params.systemPrompt}

# CONTRAINTE DE LONGUEUR STRICTE
Génère une réponse entre 500 et 700 mots maximum. Si tu dépasses, termine par :
"👉 **Tapez "continue" pour les sources détaillées et le plan 30/60/90 jours.**"`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: constrainedSystemPrompt },
        { role: "user", content: params.userPrompt },
      ],
      thinking: { type: "disabled" },
    });

    const content = completion.choices?.[0]?.message?.content;
    if (!content || content.trim().length === 0) {
      return { success: false, error: "Réponse vide" };
    }

    return { success: true, content };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur inconnue",
    };
  }
}
