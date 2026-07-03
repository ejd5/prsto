// ─── TTS (Text-to-Speech) — couche abstraite multi-provider ────────────
// Providers supportés :
//   1. ElevenLabs (premium, voix 100% humaine) — nécessite clé API
//   2. Web Speech API (fallback navigateur, qualité variable)
//
// Architecture :
//   - generateSpeech(text, voice) → retourne un stream/URL audio
//   - Le client (browser) joue l'audio via <audio> ou AudioContext
//
// Pour ajouter un provider : implémenter l'interface TTSProvider.

export interface TTSVoice {
  id: string;
  name: string;
  gender: "male" | "female";
  language: string;
  provider: "elevenlabs" | "web-speech";
  // Pour ElevenLabs : voice_id
  // Pour Web Speech : voiceURI
  voiceId?: string;
}

// Voices prédéfinies pour le Mock Interview Panel Comex
// 5 rôles avec voix différenciées
export const PANEL_VOICES: Record<string, TTSVoice> = {
  ceo: {
    id: "ceo",
    name: "Paul Mercier — CEO",
    gender: "male",
    language: "fr",
    provider: "elevenlabs",
    // Voix ElevenLabs : à remplacer par le voice_id réel quand l'utilisateur aura sa clé
    // "Antoni" = voix masculine française grave et autoritaire
    voiceId: "Antoni",
  },
  cfo: {
    id: "cfo",
    name: "Marie Lefèvre — CFO",
    gender: "female",
    language: "fr",
    provider: "elevenlabs",
    // "Rachel" = voix féminine française claire et analytique
    voiceId: "Rachel",
  },
  drh: {
    id: "drh",
    name: "Ingrid Dubois — DRH",
    gender: "female",
    language: "fr",
    provider: "elevenlabs",
    // "Bella" = voix féminine française chaleureuse
    voiceId: "Bella",
  },
  pair: {
    id: "pair",
    name: "Thomas Bertrand — Pair Comex",
    gender: "male",
    language: "fr",
    provider: "elevenlabs",
    // "Josh" = voix masculine neutre
    voiceId: "Josh",
  },
  investisseur: {
    id: "investisseur",
    name: "David Rousseau — Investisseur",
    gender: "male",
    language: "fr",
    provider: "elevenlabs",
    // "Arnold" = voix masculine grave et posée
    voiceId: "Arnold",
  },
};

export interface TTSResult {
  success: boolean;
  audioBase64?: string; // audio en base64 (data URL) pour ElevenLabs
  audioUrl?: string; // URL pour streaming
  provider: "elevenlabs" | "web-speech";
  error?: string;
  responseTimeMs?: number;
}

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/text-to-speech";

function getElevenLabsApiKey(): string | null {
  return process.env.ELEVENLABS_API_KEY || null;
}

/**
 * Génère un audio via ElevenLabs (voix 100% humaine).
 * Nécessite ELEVENLABS_API_KEY dans .env.local
 *
 * @param text Texte à synthétiser (max 5000 chars pour free tier)
 * @param voiceId ID de la voix ElevenLabs (ex: "Antoni", "Rachel")
 * @returns Audio en base64 (format MP3)
 */
export async function generateSpeechElevenLabs(
  text: string,
  voiceId: string = "Antoni",
): Promise<TTSResult> {
  const startTime = Date.now();
  const apiKey = getElevenLabsApiKey();

  if (!apiKey) {
    return {
      success: false,
      provider: "elevenlabs",
      error: "ELEVENLABS_API_KEY non configurée. Ajoutez-la dans .env.local ou utilisez Web Speech fallback.",
    };
  }

  if (!text || text.trim().length === 0) {
    return { success: false, provider: "elevenlabs", error: "Texte vide" };
  }

  if (text.length > 5000) {
    text = text.slice(0, 5000); // Tronquer pour free tier
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(`${ELEVENLABS_API_URL}/${voiceId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2", // Multilingue (FR/EN/ES)
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      return {
        success: false,
        provider: "elevenlabs",
        error: `HTTP ${response.status}: ${errText.slice(0, 200)}`,
      };
    }

    // Récupérer l'audio en buffer
    const audioBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString("base64");

    return {
      success: true,
      audioBase64,
      provider: "elevenlabs",
      responseTimeMs: Date.now() - startTime,
    };
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return {
      success: false,
      provider: "elevenlabs",
      error: aborted ? "Timeout (30s)" : err instanceof Error ? err.message : "Erreur inconnue",
    };
  }
}

/**
 * Génère un audio via le meilleur provider disponible.
 * 1. ElevenLabs si clé configurée
 * 2. Sinon : retourne un flag pour utiliser Web Speech côté client
 *
 * @param text Texte à synthétiser
 * @param role Rôle du panel (ceo, cfo, drh, pair, investisseur)
 */
export async function generateSpeech(
  text: string,
  role: string,
): Promise<TTSResult> {
  const voice = PANEL_VOICES[role];
  if (!voice) {
    return { success: false, provider: "web-speech", error: "Rôle inconnu" };
  }

  // 1. Essayer ElevenLabs si configuré
  if (voice.provider === "elevenlabs" && getElevenLabsApiKey()) {
    const result = await generateSpeechElevenLabs(text, voice.voiceId || "Antoni");
    if (result.success) return result;
    // Si ElevenLabs échoue, fallback Web Speech
    console.log("[tts] ElevenLabs échec, fallback Web Speech:", result.error);
  }

  // 2. Fallback Web Speech (côté client — on retourne juste le texte + config)
  return {
    success: true,
    provider: "web-speech",
    // Le client utilisera window.speechSynthesis avec la voix correspondante
  };
}

/**
 * Vérifie si ElevenLabs est configuré.
 */
export function isElevenLabsConfigured(): boolean {
  return !!getElevenLabsApiKey();
}

/**
 * Liste les voices ElevenLabs disponibles (pour debugging).
 */
export async function listElevenLabsVoices(): Promise<TTSVoice[] | null> {
  const apiKey = getElevenLabsApiKey();
  if (!apiKey) return null;

  try {
    const response = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: { "xi-api-key": apiKey },
    });
    if (!response.ok) return null;
    const data = await response.json();
    return (data.voices || []).map((v: { voice_id: string; name: string; labels?: { gender?: string; language?: string } }) => ({
      id: v.voice_id,
      name: v.name,
      gender: (v.labels?.gender as "male" | "female") || "male",
      language: v.labels?.language || "fr",
      provider: "elevenlabs" as const,
      voiceId: v.voice_id,
    }));
  } catch {
    return null;
  }
}
