// ─── Riva Translate — traduction ultra-rapide via NVIDIA NIM ────────────
// Modèle : nvidia/riva-translate-4b-instruct-v1.1 (4B params, gratuit)
// Utilisé pour :
//   - Traduire le CV Maître FR → EN (pour postuler US)
//   - Traduire les offres EN → FR (pour analyse)
//   - Pré-traduire l'app PRSTO pour i18n next-intl
//
// Avantage vs LLM : 4B params = ultra-rapide (~1-2s vs 25s pour GLM-5.2),
//                  spécialisé en traduction donc qualité supérieure,
//                  coûte 1/10 des tokens d'un LLM généraliste.

import { prisma } from "@/lib/prisma";
import { generateWithDeepSeek } from "@/lib/ai/deepseek";

export type TranslationLanguage = "en" | "fr" | "es" | "de" | "it" | "pt" | "zh" | "ja" | "ar";

// Riva Translate 4B gère bien EN ↔ FR mais mal les autres paires.
// Pour les autres langues, on bascule sur GLM-5.2 (LLM généraliste plus polyglotte).
const RIVA_SUPPORTED_PAIRS = [
  "fr-en", "en-fr",
];

function isRivaSupportedPair(source?: TranslationLanguage, target?: TranslationLanguage): boolean {
  if (!target) return false;
  if (!source) return true; // auto-détection → on essaie Riva d'abord
  return RIVA_SUPPORTED_PAIRS.includes(`${source}-${target}`);
}

/**
 * Fallback : utilise GLM-5.2 pour traduire (plus lent mais polyglotte)
 */
async function translateWithLLM(
  text: string,
  targetLang: TranslationLanguage,
  sourceLang?: TranslationLanguage,
): Promise<TranslationResult> {
  const startTime = Date.now();
  const targetLabel = LANGUAGE_LABELS[targetLang];
  const sourceClause = sourceLang ? `from ${LANGUAGE_LABELS[sourceLang]} ` : "";

  const systemPrompt = `You are a professional translator. Translate the user's text ${sourceClause}to ${targetLabel}. Return only the translation, no explanation, no preamble.`;

  const result = await generateWithDeepSeek({
    systemPrompt,
    userPrompt: text,
    temperature: 0.3,
    maxTokens: Math.min(text.length * 2, 2000),
    timeout: 30000,
  });

  if (!result.success || !result.content) {
    return {
      success: false,
      error: result.error || "LLM translation échec",
    };
  }

  return {
    success: true,
    translatedText: result.content.trim(),
    sourceLanguage: sourceLang || "auto",
    targetLanguage: targetLang,
    responseTimeMs: Date.now() - startTime,
  };
}

export interface TranslationResult {
  success: boolean;
  translatedText?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  error?: string;
  responseTimeMs?: number;
}

const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com";

function getApiKey(): string | null {
  // 1. Essayer la clé spécifique Riva si définie
  const rivaKey = process.env.NVIDIA_RIVA_API_KEY;
  if (rivaKey && rivaKey.trim()) return rivaKey;

  // 2. Sinon utiliser la clé NIM générale (GLM-5.2 etc.)
  const nimKey = process.env.NVIDIA_NIM_API_KEY;
  if (nimKey && nimKey.trim()) return nimKey;

  return null;
}

const LANGUAGE_LABELS: Record<TranslationLanguage, string> = {
  en: "English",
  fr: "French",
  es: "Spanish",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  zh: "Chinese",
  ja: "Japanese",
  ar: "Arabic",
};

/**
 * Traduit un texte via Riva Translate (NVIDIA NIM)
 *
 * @param text Texte à traduire (max ~5000 caractères recommandé)
 * @param targetLang Langue cible (en, fr, es, de, it, pt, zh, ja, ar)
 * @param sourceLang Langue source (détectée automatiquement si non précisée)
 */
export async function translateText(
  text: string,
  targetLang: TranslationLanguage,
  sourceLang?: TranslationLanguage,
): Promise<TranslationResult> {
  if (!text || text.trim().length === 0) {
    return { success: false, error: "Texte vide" };
  }

  if (text.length > 10000) {
    return {
      success: false,
      error: "Texte trop long (max 10000 caractères). Découpez en plusieurs morceaux.",
    };
  }

  // ── Stratégie : Riva pour EN↔FR (rapide), LLM pour les autres paires ──
  if (!isRivaSupportedPair(sourceLang, targetLang)) {
    // Paire non supportée par Riva → utiliser GLM-5.2 directement
    return translateWithLLM(text, targetLang, sourceLang);
  }

  // ── Riva Translate (EN ↔ FR) ──
  const startTime = Date.now();
  const apiKey = getApiKey();

  if (!apiKey) {
    return {
      success: false,
      error: "Clé API NVIDIA NIM non configurée. Ajoutez NVIDIA_NIM_API_KEY dans .env.local",
    };
  }

  const targetLabel = LANGUAGE_LABELS[targetLang];
  const sourceLabel = sourceLang ? LANGUAGE_LABELS[sourceLang] : null;

  // Format minimaliste pour Riva Translate 4B
  const prompt = sourceLabel
    ? `${sourceLabel} to ${targetLabel}: ${text}`
    : `Translate to ${targetLabel}: ${text}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(`${NVIDIA_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "nvidia/riva-translate-4b-instruct-v1.1",
        messages: [{ role: "user", content: prompt }],
        max_tokens: Math.min(text.length * 2, 4000),
        temperature: 0.3,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      return {
        success: false,
        error: `HTTP ${response.status}: ${errText.slice(0, 200)}`,
      };
    }

    const data = await response.json();
    let translatedText = data?.choices?.[0]?.message?.content?.trim();

    if (!translatedText) {
      return { success: false, error: "Réponse vide du modèle" };
    }

    // ── Post-traitement : nettoyer les labels recopiés par le modèle ──
    // Riva Translate 4B a parfois tendance à recopier le prompt dans sa réponse.
    // On supprime les patterns communs.
    const cleanPatterns = [
      /^(Source language|Langue source|Fuente|Idioma de origen)[:\s].+$/im,
      /^(Target language|Langue cible|Idioma de destino)[:\s].+$/im,
      /^(Text|Texte|Texto)[:\s]/im,
      /^(Translation|Traduction|Traducción)[:\s]/im,
      /^Translate to .+?:\s*/i,
      /^\w+ to \w+:\s*/i,
    ];
    for (const pattern of cleanPatterns) {
      translatedText = translatedText.replace(pattern, "").trim();
    }

    // Si après nettoyage la réponse est vide ou trop courte, c'est probablement
    // que le modèle a mal répondu — on garde la réponse originale
    if (translatedText.length < 3) {
      translatedText = data?.choices?.[0]?.message?.content?.trim() || "";
    }

    return {
      success: true,
      translatedText,
      sourceLanguage: sourceLang || "auto",
      targetLanguage: targetLang,
      responseTimeMs: Date.now() - startTime,
    };
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return {
      success: false,
      error: aborted ? "Timeout (30s)" : err instanceof Error ? err.message : "Erreur inconnue",
    };
  }
}

/**
 * Traduit un texte long en le découpant en chunks (paragraphe par paragraphe)
 * pour respecter la limite de 10000 caractères.
 */
export async function translateLongText(
  text: string,
  targetLang: TranslationLanguage,
  sourceLang?: TranslationLanguage,
): Promise<TranslationResult> {
  if (text.length <= 10000) {
    return translateText(text, targetLang, sourceLang);
  }

  // Découper par paragraphes
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const para of paragraphs) {
    if ((currentChunk + "\n\n" + para).length > 9000) {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = para;
    } else {
      currentChunk = currentChunk ? currentChunk + "\n\n" + para : para;
    }
  }
  if (currentChunk) chunks.push(currentChunk);

  const translations: string[] = [];
  for (const chunk of chunks) {
    const result = await translateText(chunk, targetLang, sourceLang);
    if (!result.success || !result.translatedText) {
      return {
        success: false,
        error: `Échec sur un chunk: ${result.error}`,
      };
    }
    translations.push(result.translatedText);
  }

  return {
    success: true,
    translatedText: translations.join("\n\n"),
    sourceLanguage: sourceLang || "auto",
    targetLanguage: targetLang,
  };
}

/**
 * Détecte la langue d'un texte (basique — pour utilisation avancée,
 * on utiliserait un modèle spécialisé comme gliner-pii ou fasttext)
 */
export function detectLanguage(text: string): TranslationLanguage {
  const sample = text.toLowerCase().slice(0, 500);

  // Détection basique par mots fréquents
  const indicators: Record<TranslationLanguage, string[]> = {
    fr: ["le ", "la ", "les ", "un ", "une ", "des ", "et ", "de ", "que ", "avec ", "pour ", "dans "],
    en: ["the ", "and ", "of ", "to ", "in ", "is ", "for ", "with ", "that ", "this ", "are "],
    es: ["el ", "la ", "los ", "las ", "un ", "una ", "y ", "de ", "que ", "con ", "para "],
    de: ["der ", "die ", "das ", "und ", "von ", "mit ", "für ", "ist ", "ein ", "eine "],
    it: ["il ", "la ", "le ", "i ", "gli ", "un ", "una ", "e ", "di ", "che ", "con "],
    pt: ["o ", "a ", "os ", "as ", "um ", "uma ", "e ", "de ", "que ", "com ", "para "],
    zh: [],
    ja: [],
    ar: [],
  };

  let bestLang: TranslationLanguage = "en";
  let bestScore = 0;

  for (const [lang, words] of Object.entries(indicators)) {
    let score = 0;
    for (const w of words) {
      const matches = sample.split(w).length - 1;
      score += matches;
    }
    if (score > bestScore) {
      bestScore = score;
      bestLang = lang as TranslationLanguage;
    }
  }

  return bestLang;
}
