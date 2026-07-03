import { NextRequest, NextResponse } from "next/server";
import { askConseiller } from "@/lib/conseiller/conseiller-engine";

/**
 * POST /api/conseiller/ask
 *
 * Body: { message: string, history?: Array<{role: "user"|"assistant", content: string}> }
 * Response: { content: string, source: "ai" | "local" | "no_key" | "error" | "blocked" }
 *
 * Le Conseiller IA est le "second brain" de PRSTO. Il répond aux questions
 * du dirigeant sur sa campagne de recherche d'emploi, ses candidatures,
 * ses entretiens, son CV, sa stratégie — et reste dans son périmètre
 * (anti off-topic via liste blanche dans conseiller-engine.ts).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const message: string = (body?.message ?? "").toString().trim();
    const history: Array<{ role: "user" | "assistant"; content: string }> = Array.isArray(body?.history)
      ? body.history
          .filter((h: unknown): h is { role: "user" | "assistant"; content: string } =>
            typeof h === "object" && h !== null &&
            (h as { role: unknown }).role !== undefined &&
            typeof (h as { content: unknown }).content === "string"
          )
          .slice(-10) // on garde au max les 10 derniers messages pour limiter le payload
      : [];

    if (!message) {
      return NextResponse.json(
        { error: "Message vide.", content: "", source: "error" },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: "Message trop long (max 2000 caractères).", content: "", source: "error" },
        { status: 413 }
      );
    }

    const result = await askConseiller(message, history);

    return NextResponse.json({
      content: result.content,
      source: result.source,
    });
  } catch (err) {
    console.error("[/api/conseiller/ask] Error:", err);
    return NextResponse.json(
      {
        error: "Erreur interne du Conseiller. Réessayez dans un instant.",
        content: "Désolé, une erreur technique vient de se produire. Pouvez-vous reformuler votre question ?",
        source: "error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    name: "Conseiller PRSTO",
    description: "Second brain IA pour dirigeants — répond aux questions sur la campagne de recherche d'emploi.",
    endpoint: "POST /api/conseiller/ask",
    usage: { message: "string (requis, max 2000 chars)", history: "Array<{role, content}> (optionnel, max 10 messages)" },
  });
}
