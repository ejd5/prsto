// ─── Embedding Store — gestion des embeddings en base pour RAG ────────────
// Utilise la table Prisma `Embedding` pour stocker les vecteurs
// des preuves, opportunités, entretiens. Permet la recherche sémantique.

import { prisma } from "@/lib/prisma";
import {
  generateEmbedding,
  cosineSimilarity,
  deserializeEmbedding,
  serializeEmbedding,
} from "@/lib/ai/embeddings";

export type EntityType = "proof_entry" | "opportunity" | "interview" | "document";

export interface VectorSearchResult {
  entityId: string;
  entityType: EntityType;
  content: string;
  score: number;
}

/**
 * Vectorise une entité et stocke l'embedding en base.
 * Si l'entité a déjà un embedding, on le met à jour.
 *
 * @param entityType Type d'entité (proof_entry, opportunity, etc.)
 * @param entityId ID de l'entité
 * @param content Texte à vectoriser (max 8000 chars)
 */
export async function indexEntity(
  entityType: EntityType,
  entityId: string,
  content: string,
): Promise<{ success: boolean; error?: string }> {
  if (!content || content.trim().length === 0) {
    return { success: false, error: "Contenu vide" };
  }

  // Tronquer à 8000 caractères (limite du modèle d'embeddings)
  const truncated = content.slice(0, 8000);

  const result = await generateEmbedding(truncated, "passage");
  if (!result.success || !result.embedding) {
    return { success: false, error: result.error };
  }

  // Upsert dans la base
  await prisma.embedding.upsert({
    where: {
      entityType_entityId: { entityType, entityId },
    },
    update: {
      content: truncated,
      embedding: serializeEmbedding(result.embedding),
      dimensions: result.dimensions,
      updatedAt: new Date(),
    },
    create: {
      entityType,
      entityId,
      content: truncated,
      embedding: serializeEmbedding(result.embedding),
      dimensions: result.dimensions,
    },
  });

  return { success: true };
}

/**
 * Supprime l'embedding d'une entité.
 */
export async function removeEntityFromIndex(
  entityType: EntityType,
  entityId: string,
): Promise<void> {
  await prisma.embedding.deleteMany({
    where: { entityType, entityId },
  });
}

/**
 * Recherche sémantique : trouve les entités les plus similaires à une requête.
 *
 * @param query Texte de recherche (ex: "trouve une preuve sur la croissance B2B")
 * @param entityType Filtrer par type d'entité (optionnel)
 * @param topK Nombre de résultats (défaut: 5)
 * @param threshold Score minimum (défaut: 0.3)
 */
export async function vectorSearch(
  query: string,
  entityType?: EntityType,
  topK: number = 5,
  threshold: number = 0.3,
): Promise<VectorSearchResult[]> {
  // 1. Vectoriser la requête
  const queryResult = await generateEmbedding(query, "query");
  if (!queryResult.success || !queryResult.embedding) {
    return [];
  }

  // 2. Récupérer tous les embeddings candidats depuis la base
  const where: { entityType?: EntityType } = {};
  if (entityType) where.entityType = entityType;

  const candidates = await prisma.embedding.findMany({ where });

  if (candidates.length === 0) {
    return [];
  }

  // 3. Calculer la similarité cosinus pour chaque candidat
  const scored = candidates.map((c) => {
    const embedding = deserializeEmbedding(c.embedding);
    const score = cosineSimilarity(queryResult.embedding!, embedding);
    return {
      entityId: c.entityId,
      entityType: c.entityType as EntityType,
      content: c.content,
      score,
    };
  });

  // 4. Filtrer par seuil et trier
  return scored
    .filter((s) => s.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/**
 * Indexe toutes les preuves du Proof Vault.
 * À appeler quand l'utilisateur ajoute/modifie une preuve,
 * ou via un bouton "Réindexer le Proof Vault".
 */
export async function indexAllProofs(): Promise<{
  success: boolean;
  indexed: number;
  errors: string[];
}> {
  const proofs = await prisma.proofEntry.findMany();
  const errors: string[] = [];
  let indexed = 0;

  for (const proof of proofs) {
    const content = `${proof.title} [${proof.category}]${proof.value ? ` → ${proof.value}` : ""}${proof.context ? ` | ${proof.context}` : ""}`;

    const result = await indexEntity("proof_entry", proof.id, content);
    if (result.success) {
      indexed++;
    } else {
      errors.push(`Preuve ${proof.id}: ${result.error}`);
    }
  }

  return { success: true, indexed, errors };
}

/**
 * Indexe toutes les opportunités (rawText).
 */
export async function indexAllOpportunities(): Promise<{
  success: boolean;
  indexed: number;
  errors: string[];
}> {
  const opportunities = await prisma.opportunity.findMany({
    where: { rawText: { not: "" } },
    select: { id: true, title: true, company: true, rawText: true },
  });

  const errors: string[] = [];
  let indexed = 0;

  for (const opp of opportunities) {
    const content = `${opp.title} @ ${opp.company}\n\n${opp.rawText.slice(0, 7000)}`;
    const result = await indexEntity("opportunity", opp.id, content);
    if (result.success) {
      indexed++;
    } else {
      errors.push(`Opportunité ${opp.id}: ${result.error}`);
    }
  }

  return { success: true, indexed, errors };
}

/**
 * Statistiques sur l'index des embeddings.
 */
export async function getEmbeddingStats(): Promise<{
  total: number;
  byType: Record<string, number>;
}> {
  const embeddings = await prisma.embedding.findMany({
    select: { entityType: true },
  });

  const byType: Record<string, number> = {};
  for (const e of embeddings) {
    byType[e.entityType] = (byType[e.entityType] || 0) + 1;
  }

  return { total: embeddings.length, byType };
}
