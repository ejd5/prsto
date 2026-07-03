import { NextRequest, NextResponse } from "next/server";
import {
  generateEmbedding,
  generateEmbeddingsBatch,
  cosineSimilarity,
} from "@/lib/ai/embeddings";

/**
 * POST /api/embeddings
 *
 * Body: {
 *   texts: string[] (requis, max 100 textes)
 *   inputType?: "query" | "passage" (défaut: "passage")
 *   model?: string (défaut: nvidia/nv-embedqa-e5-v5)
 * }
 *
 * Response: { success, embeddings, dimensions, count, responseTimeMs }
 *
 * Cas d'usage :
 *   - Vectoriser une preuve du Proof Vault pour recherche sémantique
 *   - Vectoriser une question du Conseiller pour RAG
 *   - Comparer 2 textes (similarité cosinus)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const texts: string[] = Array.isArray(body?.texts) ? body.texts : [];
    const inputType = (body?.inputType === "query" ? "query" : "passage") as "query" | "passage";
    const model = body?.model || "nvidia/nv-embedqa-e5-v5";

    if (texts.length === 0) {
      return NextResponse.json(
        { success: false, error: "texts[] requis" },
        { status: 400 }
      );
    }

    if (texts.length === 1) {
      const result = await generateEmbedding(texts[0], inputType, model);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 500 });
      }
      return NextResponse.json({
        success: true,
        embeddings: [result.embedding],
        dimensions: result.dimensions,
        count: 1,
        responseTimeMs: result.responseTimeMs,
      });
    }

    const result = await generateEmbeddingsBatch(texts, inputType, model);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      embeddings: result.embeddings,
      dimensions: result.dimensions,
      count: result.count,
      responseTimeMs: result.responseTimeMs,
    });
  } catch (err) {
    console.error("[/api/embeddings] Error:", err);
    return NextResponse.json({ success: false, error: "Erreur interne" }, { status: 500 });
  }
}

/**
 * POST /api/embeddings/similarity
 * Body: { text1, text2 }
 * Response: { success, similarity (0-1) }
 */
export async function GET() {
  return NextResponse.json({
    name: "PRSTO Embeddings API",
    description: "Vectorisation via NVIDIA NV-Embedqa (1024 dims, gratuit) — pour le second brain RAG",
    model: "nvidia/nv-embedqa-e5-v5",
    endpoint: "POST /api/embeddings",
    usage: {
      texts: "string[] (requis, max 100)",
      inputType: '"query" | "passage" (défaut: passage)',
      model: "optionnel",
    },
    dimensions: 1024,
    useCases: [
      "Vectoriser les preuves du Proof Vault pour recherche sémantique",
      "Vectoriser les entretiens passés pour mémoire longue du Conseiller",
      "Déduplication intelligente des candidatures (similarité cosinus)",
      "Trouver des offres similaires à une offre cible",
    ],
  });
}
