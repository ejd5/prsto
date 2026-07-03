import { NextRequest, NextResponse } from "next/server";
import { generateEmbedding, cosineSimilarity } from "@/lib/ai/embeddings";

/**
 * POST /api/embeddings/similarity
 *
 * Body: { text1: string, text2: string }
 * Response: { success, similarity: number (0-1), interpretation: string }
 *
 * Cas d'usage :
 *   - Comparer 2 offres (déduplication)
 *   - Vérifier si un CV matche une offre
 *   - Évaluer la redondance entre 2 preuves du Proof Vault
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const text1: string = (body?.text1 ?? "").toString();
    const text2: string = (body?.text2 ?? "").toString();

    if (!text1 || !text2) {
      return NextResponse.json(
        { success: false, error: "text1 et text2 requis" },
        { status: 400 }
      );
    }

    // Générer les 2 embeddings en parallèle
    const [r1, r2] = await Promise.all([
      generateEmbedding(text1, "passage"),
      generateEmbedding(text2, "passage"),
    ]);

    if (!r1.success || !r1.embedding || !r2.success || !r2.embedding) {
      return NextResponse.json(
        {
          success: false,
          error: `Embedding échec: ${r1.error || r2.error}`,
        },
        { status: 500 }
      );
    }

    const similarity = cosineSimilarity(r1.embedding, r2.embedding);

    // Interprétation qualitative
    let interpretation: string;
    if (similarity >= 0.85) interpretation = "Quasi identique (doublon probable)";
    else if (similarity >= 0.7) interpretation = "Très similaire (même sujet)";
    else if (similarity >= 0.5) interpretation = "Proche (thématique commune)";
    else if (similarity >= 0.3) interpretation = "Faiblement lié";
    else interpretation = "Différent";

    return NextResponse.json({
      success: true,
      similarity: Number(similarity.toFixed(4)),
      interpretation,
      dimensions: r1.dimensions,
    });
  } catch (err) {
    console.error("[/api/embeddings/similarity] Error:", err);
    return NextResponse.json({ success: false, error: "Erreur interne" }, { status: 500 });
  }
}
