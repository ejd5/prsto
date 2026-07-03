// ─── NVIDIA Embeddings — vectorisation pour le second brain RAG ────────────
// Modèles disponibles :
//   - nvidia/nv-embedqa-e5-v5 (1024 dims, recommandé pour QA)
//   - nvidia/nv-embed-v1 (4096 dims, plus précis mais plus lourd)
//   - nvidia/embed-qa-4 (1024 dims, alternative)
//   - baai/bge-m3 (1024 dims, multilingue)
//
// Cas d'usage PRSTO :
//   1. Vectoriser chaque preuve du Proof Vault → recherche sémantique
//      "trouve-moi une preuve sur la croissance B2B"
//   2. Vectoriser les entretiens passés → le Conseiller peut citer
//      "dans votre entretien LVMH du 15/03, vous avez dit..."
//   3. Vectoriser les candidatures → déduplication intelligente
//   4. Vectoriser les offres scorées → trouver des offres similaires
//
// Note : Pour la similarité cosinus, on stocke les embeddings en base
// (table Prisma `Embedding`) et on calcule la distance côté serveur.

export interface EmbeddingResult {
  success: boolean;
  embedding?: number[];
  dimensions?: number;
  error?: string;
  responseTimeMs?: number;
}

export interface BatchEmbeddingResult {
  success: boolean;
  embeddings?: number[][];
  dimensions?: number;
  count?: number;
  error?: string;
  responseTimeMs?: number;
}

const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com";

// Modèle par défaut : nv-embedqa-e5-v5 (1024 dims, équilibré précision/perf)
const DEFAULT_MODEL = "nvidia/nv-embedqa-e5-v5";

function getApiKey(): string | null {
  return process.env.NVIDIA_NIM_API_KEY || process.env.NVIDIA_RIVA_API_KEY || null;
}

/**
 * Génère l'embedding d'un texte unique.
 *
 * @param text Texte à vectoriser (max ~8000 caractères)
 * @param inputType "query" (pour rechercher) ou "passage" (pour stocker)
 * @param model Modèle d'embedding (défaut: nvidia/nv-embedqa-e5-v5)
 */
export async function generateEmbedding(
  text: string,
  inputType: "query" | "passage" = "passage",
  model: string = DEFAULT_MODEL,
): Promise<EmbeddingResult> {
  const startTime = Date.now();
  const apiKey = getApiKey();

  if (!apiKey) {
    return {
      success: false,
      error: "Clé API NVIDIA NIM non configurée",
    };
  }

  if (!text || text.trim().length === 0) {
    return { success: false, error: "Texte vide" };
  }

  if (text.length > 8000) {
    // Tronquer plutôt que rejeter — l'embedding reste pertinent
    text = text.slice(0, 8000);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(`${NVIDIA_BASE_URL}/v1/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: [text],
        input_type: inputType,
        encoding_format: "float",
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
    const embedding = data?.data?.[0]?.embedding;

    if (!Array.isArray(embedding) || embedding.length === 0) {
      return { success: false, error: "Embedding vide" };
    }

    return {
      success: true,
      embedding,
      dimensions: embedding.length,
      responseTimeMs: Date.now() - startTime,
    };
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return {
      success: false,
      error: aborted ? "Timeout (15s)" : err instanceof Error ? err.message : "Erreur inconnue",
    };
  }
}

/**
 * Génère les embeddings d'un batch de textes (plus efficace que generateEmbedding en boucle).
 *
 * @param texts Tableau de textes (max 100 par batch)
 * @param inputType "query" ou "passage"
 */
export async function generateEmbeddingsBatch(
  texts: string[],
  inputType: "query" | "passage" = "passage",
  model: string = DEFAULT_MODEL,
): Promise<BatchEmbeddingResult> {
  const startTime = Date.now();
  const apiKey = getApiKey();

  if (!apiKey) {
    return { success: false, error: "Clé API NVIDIA NIM non configurée" };
  }

  if (!texts || texts.length === 0) {
    return { success: false, error: "Liste de textes vide" };
  }

  if (texts.length > 100) {
    return { success: false, error: "Trop de textes (max 100 par batch)" };
  }

  // Tronquer les textes trop longs
  const truncated = texts.map((t) => (t.length > 8000 ? t.slice(0, 8000) : t));

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(`${NVIDIA_BASE_URL}/v1/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: truncated,
        input_type: inputType,
        encoding_format: "float",
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
    const embeddings: number[][] = (data?.data || [])
      .sort((a: { index: number }, b: { index: number }) => a.index - b.index)
      .map((item: { embedding: number[] }) => item.embedding);

    if (embeddings.length === 0) {
      return { success: false, error: "Aucun embedding retourné" };
    }

    return {
      success: true,
      embeddings,
      dimensions: embeddings[0].length,
      count: embeddings.length,
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
 * Calcule la similarité cosinus entre 2 embeddings.
 * Retourne un score entre 0 (totalement différent) et 1 (identique).
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Dimensions incompatibles: ${a.length} vs ${b.length}`);
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

/**
 * Trouve les N embeddings les plus similaires à une requête.
 *
 * @param queryEmbedding Embedding de la requête
 * @param candidates Tableau d'embeddings candidats (avec leur metadata)
 * @param topK Nombre de résultats à retourner
 * @param threshold Score minimum (0-1) pour être inclus
 */
export function findSimilar<T>(
  queryEmbedding: number[],
  candidates: Array<{ embedding: number[]; data: T }>,
  topK: number = 5,
  threshold: number = 0.3,
): Array<{ data: T; score: number }> {
  const scored = candidates.map((c) => ({
    data: c.data,
    score: cosineSimilarity(queryEmbedding, c.embedding),
  }));

  return scored
    .filter((s) => s.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/**
 * Sérialise un embedding pour stockage en base (JSON string).
 */
export function serializeEmbedding(embedding: number[]): string {
  return JSON.stringify(embedding);
}

/**
 * Désérialise un embedding depuis le stockage base.
 */
export function deserializeEmbedding(serialized: string): number[] {
  try {
    return JSON.parse(serialized);
  } catch {
    return [];
  }
}
