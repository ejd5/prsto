/**
 * POST /api/extension/chat
 * Streaming chat — SSE (Server-Sent Events) for the extension side panel
 */

import { NextRequest } from "next/server";
import { generateWithDeepSeek, getDeepSeekConfig } from "@/lib/ai/deepseek";

const COPILOT_SYSTEM_PROMPT = `Tu es PRSTO Copilot, le copilote carrière IA premium pour cadres dirigeants (DG, DAF, DRH, Directeurs Marketing, Directeurs Commerciaux, etc.). Tu aides un cadre dirigeant à analyser une offre d'emploi et à optimiser sa candidature.

Règles :
- Parle en français professionnel, concis, direct.
- Jamais de flatterie, jamais d'invention.
- Si des infos manquent, dis-le honnêtement.
- Tes réponses sont structurées : section par section, avec des emojis pour la lisibilité.
- Ton ton est celui d'un conseiller de confiance, pas d'un chatbot générique.
- Tu connais les ATS (systèmes de tri automatique des CV), les attentes des chasseurs de têtes, les standards de rémunération des cadres dirigeants en France.

Contexte par défaut : un cadre dirigeant en recherche active, avec 10-20 ans d'expérience, qui cherche un poste à responsabilité dans son secteur.`;

export async function POST(req: NextRequest) {
  const config = await getDeepSeekConfig();
  if (!config) {
    return new Response(
      "data: " +
        JSON.stringify({
          type: "error",
          error: "Aucune clé IA configurée. Configurez DeepSeek, OpenRouter ou NVIDIA NIM dans les paramètres PRSTO.",
        }),
      { status: 500, headers: { "Content-Type": "text/event-stream" } }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response("data: " + JSON.stringify({ type: "error", error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "text/event-stream" },
    });
  }

  const { action, offer, message, history } = body || {};

  if (action !== "analyze" && action !== "chat") {
    return new Response(
      "data: " +
        JSON.stringify({ type: "error", error: "Action must be 'analyze' or 'chat'" }),
      { status: 400, headers: { "Content-Type": "text/event-stream" } }
    );
  }

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: COPILOT_SYSTEM_PROMPT },
  ];

  // Add conversation history (last 8 messages)
  if (history && Array.isArray(history)) {
    for (const h of history.slice(-8)) {
      if (h.role === "user" || h.role === "assistant") {
        messages.push({ role: h.role, content: h.content });
      }
    }
  }

  // Build user prompt
  let userPrompt: string;

  if (action === "analyze" && offer) {
    userPrompt = buildAnalysisPrompt(offer);
  } else if (action === "chat" && message) {
    if (offer?.title) {
      userPrompt = `Contexte de l'offre en cours :
Titre : ${offer.title}
Entreprise : ${offer.company || "Non spécifiée"}
Lieu : ${offer.location || "Non spécifié"}
Salaire : ${offer.salary || "Non spécifié"}
Contrat : ${offer.contractType || "N/A"}
Description (extrait) : ${(offer.description || "").slice(0, 3000)}

Question du candidat : ${message}`;
    } else {
      userPrompt = message;
    }
  } else {
    userPrompt = "Bonjour, peux-tu m'aider à analyser une offre d'emploi ?";
  }

  messages.push({ role: "user", content: userPrompt });

  const encoder = new TextEncoder();
  let aborted = false;
  let fullText = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = await generateWithDeepSeek({
          systemPrompt: messages[0].content,
          userPrompt: userPrompt,
          temperature: config.temperature,
          maxTokens: 2000,
          timeout: 60000,
        });

        if (!result.success || !result.content) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", error: result.error || "Échec de l'analyse IA" })}\n\n`
            )
          );
        } else {
          fullText = result.content;

          // Stream in chunks of ~80 chars for smooth streaming in side panel
          let index = 0;
          const chunkSize = 80;

          while (index < fullText.length) {
            if (aborted) break;
            const chunk = fullText.slice(index, index + chunkSize);
            index += chunkSize;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ delta: chunk })}\n\n`)
            );
            await sleep(30);
          }
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err: any) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", error: err.message || "Stream error" })}\n\n`
          )
        );
        controller.close();
      }
    },
    cancel() {
      aborted = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

function buildAnalysisPrompt(offer: any): string {
  const desc = (offer.description || "").slice(0, 5000);

  return `Analyse cette offre d'emploi pour un cadre dirigeant :

📋 **Titre :** ${offer.title || "N/A"}
🏢 **Entreprise :** ${offer.company || "N/A"}
📍 **Lieu :** ${offer.location || "N/A"}
💰 **Salaire :** ${offer.salary || "Non spécifié"}
📝 **Contrat :** ${offer.contractType || "N/A"}

📄 **Description :**
${desc}

---

Réponds avec cette structure :

🔍 **Analyse Express**
Résumé en 2-3 phrases de ce que cherche vraiment cette entreprise.

📊 **Score de compatibilité estimé** (informel, basé sur un profil cadre dirigeant standard)

✅ **Points forts** (2-3 forces de l'offre pour le candidat)

⚠️ **Points de vigilance** (2-3 points à creuser)

🔑 **Mots-clés ATS essentiels** à inclure dans le CV (liste de 5-10)

💡 **Conseil tactique** (une action concrète que le candidat peut faire maintenant)

Sois honnête, direct, utile. Pas de langue de bois.`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
