import { NextRequest, NextResponse } from "next/server";
import { vectorSearch, type EntityType } from "@/lib/ai/embedding-store";

/**
 * POST /api/embeddings/search
 *
 * Body: {
 *   query: string (requis) — texte de recherche sémantique
 *   entityType?: "proof_entry" | "opportunity" | "interview" | "document"
 *   topK?: number (défaut: 5)
 *   threshold?: number (défaut: 0.3)
 * }
 *
 * Response: {
 *   success: boolean,
 *   results: Array<{ entityId, entityType, content, score }>,
 *   responseTimeMs: number
 * }
 *
 * Cas d'usage :
 *   - Le Conseiller IA cherche des preuves pertinentes pour une question
 *   - L'utilisateur cherche "une preuve sur la croissance B2B"
 *   - Trouver des opportunités similaires à une offre cible
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const query: string = (body?.query ?? "").toString();
    const entityType = body?.entityType as EntityType | undefined;
    const topK: number = Math.min(Math.max(parseInt(body?.topK) || 5, 1), 20);
    const threshold: number = Math.min(Math.max(parseFloat(body?.threshold) || 0.3, 0), 1);

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "query requis" },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    const results = await vectorSearch(query, entityType, topK, threshold);

    return NextResponse.json({
      success: true,
      results,
      count: results.length,
      responseTimeMs: Date.now() - startTime,
    });
  } catch (err) {
    console.error("[/api/embeddings/search] Error:", err);
    return NextResponse.json(
      { success: false, error: "Erreur interne" },
      { status: 500 }
    );
  }
}
