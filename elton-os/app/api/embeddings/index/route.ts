import { NextRequest, NextResponse } from "next/server";
import { indexAllProofs, indexAllOpportunities, getEmbeddingStats } from "@/lib/ai/embedding-store";

/**
 * POST /api/embeddings/index
 *
 * Body: {
 *   action: "index_proofs" | "index_opportunities" | "stats" | "index_all"
 * }
 *
 * Cas d'usage :
 *   - Bouton "Réindexer le Proof Vault" dans /proof-vault
 *   - Cron de réindexation nocturne
 *   - Stats pour afficher le nombre d'éléments indexés
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const action: string = body?.action || "stats";

    if (action === "stats") {
      const stats = await getEmbeddingStats();
      return NextResponse.json({ success: true, ...stats });
    }

    if (action === "index_proofs") {
      const result = await indexAllProofs();
      return NextResponse.json({
        success: result.success,
        indexed: result.indexed,
        errors: result.errors,
        message: `${result.indexed} preuves indexées`,
      });
    }

    if (action === "index_opportunities") {
      const result = await indexAllOpportunities();
      return NextResponse.json({
        success: result.success,
        indexed: result.indexed,
        errors: result.errors,
        message: `${result.indexed} opportunités indexées`,
      });
    }

    if (action === "index_all") {
      const [proofsResult, oppsResult] = await Promise.all([
        indexAllProofs(),
        indexAllOpportunities(),
      ]);

      return NextResponse.json({
        success: true,
        proofs: { indexed: proofsResult.indexed, errors: proofsResult.errors },
        opportunities: { indexed: oppsResult.indexed, errors: oppsResult.errors },
        message: `${proofsResult.indexed} preuves + ${oppsResult.indexed} opportunités indexées`,
      });
    }

    return NextResponse.json(
      { success: false, error: "Action invalide (stats | index_proofs | index_opportunities | index_all)" },
      { status: 400 }
    );
  } catch (err) {
    console.error("[/api/embeddings/index] Error:", err);
    return NextResponse.json(
      { success: false, error: "Erreur interne" },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Retourne les stats par défaut
  try {
    const stats = await getEmbeddingStats();
    return NextResponse.json({
      success: true,
      ...stats,
      message: "Index des embeddings PRSTO",
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Erreur" }, { status: 500 });
  }
}
