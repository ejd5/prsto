import { NextRequest, NextResponse } from "next/server";
import { generateSpeech, isElevenLabsConfigured, PANEL_VOICES } from "@/lib/ai/tts";

/**
 * POST /api/tts
 *
 * Body: {
 *   text: string (requis, max 5000 chars)
 *   role: "ceo" | "cfo" | "drh" | "pair" | "investisseur" (requis)
 * }
 *
 * Response:
 *   - Si ElevenLabs configuré : { success, audioBase64, provider: "elevenlabs" }
 *   - Sinon : { success, provider: "web-speech", text, voiceConfig }
 *     → le client utilise window.speechSynthesis
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const text: string = (body?.text ?? "").toString();
    const role: string = (body?.role ?? "").toString();

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "text requis" },
        { status: 400 }
      );
    }

    if (!role || !PANEL_VOICES[role]) {
      return NextResponse.json(
        { success: false, error: `role invalide. Rôles: ${Object.keys(PANEL_VOICES).join(", ")}` },
        { status: 400 }
      );
    }

    const result = await generateSpeech(text, role);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, provider: result.provider },
        { status: 500 }
      );
    }

    // Pour Web Speech : retourner la config pour le client
    if (result.provider === "web-speech") {
      const voice = PANEL_VOICES[role];
      return NextResponse.json({
        success: true,
        provider: "web-speech",
        text,
        voiceConfig: {
          gender: voice.gender,
          language: voice.language,
          rate: 0.95,
          pitch: voice.gender === "female" ? 1.1 : 0.9,
        },
      });
    }

    // Pour ElevenLabs : retourner l'audio en base64
    return NextResponse.json({
      success: true,
      provider: "elevenlabs",
      audioBase64: result.audioBase64,
      responseTimeMs: result.responseTimeMs,
    });
  } catch (err) {
    console.error("[/api/tts] Error:", err);
    return NextResponse.json(
      { success: false, error: "Erreur interne" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    name: "PRSTO TTS API",
    description: "Text-to-Speech pour Mock Interview Panel — ElevenLabs (premium) ou Web Speech (fallback)",
    endpoint: "POST /api/tts",
    usage: {
      text: "string (requis, max 5000 chars)",
      role: '"ceo" | "cfo" | "drh" | "pair" | "investisseur"',
    },
    voices: Object.entries(PANEL_VOICES).map(([id, v]) => ({
      id,
      name: v.name,
      gender: v.gender,
      provider: v.provider,
      voiceId: v.voiceId,
    })),
    elevenLabsConfigured: isElevenLabsConfigured(),
    note: isElevenLabsConfigured()
      ? "ElevenLabs actif — voix 100% humaine"
      : "⚠️ ElevenLabs non configuré. Ajoutez ELEVENLABS_API_KEY dans .env.local pour des voix humaines. Fallback: Web Speech API (qualité variable).",
  });
}
