import { NextRequest, NextResponse } from "next/server";
import { translateLongText, detectLanguage, type TranslationLanguage } from "@/lib/ai/translate";

/**
 * POST /api/translate
 *
 * Body: {
 *   text: string (requis, max 50000 caractères)
 *   targetLang: "en" | "fr" | "es" | "de" | "it" | "pt" | "zh" | "ja" | "ar" (requis)
 *   sourceLang?: même format (optionnel, auto-détection si absent)
 * }
 *
 * Response: { success, translatedText, sourceLanguage, targetLanguage, responseTimeMs }
 *
 * Cas d'usage PRSTO :
 *   - Traduire le CV Maître FR → EN pour postuler US
 *   - Traduire une offre EN → FR pour analyse
 *   - Traduire une lettre de motivation
 *   - Pré-traduire du contenu pour i18n
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const text: string = (body?.text ?? "").toString();
    const targetLang = body?.targetLang as TranslationLanguage;
    const sourceLang = body?.sourceLang as TranslationLanguage | undefined;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Texte vide" },
        { status: 400 }
      );
    }

    if (text.length > 50000) {
      return NextResponse.json(
        { success: false, error: "Texte trop long (max 50000 caractères)" },
        { status: 413 }
      );
    }

    if (!targetLang || !["en", "fr", "es", "de", "it", "pt", "zh", "ja", "ar"].includes(targetLang)) {
      return NextResponse.json(
        { success: false, error: "targetLang invalide (en, fr, es, de, it, pt, zh, ja, ar)" },
        { status: 400 }
      );
    }

    // Auto-détection de la langue source si non précisée
    // Note : pour PRSTO, l'utilisateur est français donc on suppose FR par défaut
    // si la détection hésite. Pour textes > 200 chars, détection plus fiable.
    const detectedSource = sourceLang || (text.length > 200 ? detectLanguage(text) : "fr");

    const result = await translateLongText(text, targetLang, detectedSource);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      translatedText: result.translatedText,
      sourceLanguage: result.sourceLanguage,
      targetLanguage: result.targetLanguage,
      responseTimeMs: result.responseTimeMs,
    });
  } catch (err) {
    console.error("[/api/translate] Error:", err);
    return NextResponse.json(
      { success: false, error: "Erreur interne" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    name: "PRSTO Translate API",
    description: "Traduction ultra-rapide via NVIDIA Riva Translate (4B params, gratuit)",
    model: "nvidia/riva-translate-4b-instruct-v1.1",
    endpoint: "POST /api/translate",
    usage: {
      text: "string (requis, max 50000 chars)",
      targetLang: "en | fr | es | de | it | pt | zh | ja | ar (requis)",
      sourceLang: "optionnel (auto-détection par défaut)",
    },
    languages: ["en", "fr", "es", "de", "it", "pt", "zh", "ja", "ar"],
  });
}
