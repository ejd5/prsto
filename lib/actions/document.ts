"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { generateDocumentContent } from "@/lib/generation/engine";
import type { DocumentType } from "@/lib/generation/templates";
import { generateWithDeepSeek } from "@/lib/ai/deepseek";
import { validateNoHallucinationEnhanced } from "@/lib/ai/anti-hallucination";
import type { HallucinationAlert } from "@/lib/ai/anti-hallucination";
import { getStylePrompt } from "@/lib/ai/styles";

export async function getDocuments(filters?: {
  opportunityId?: string;
  type?: string;
  validated?: boolean;
}) {
  const where: Record<string, unknown> = {};
  if (filters?.opportunityId) where.opportunityId = filters.opportunityId;
  if (filters?.type) where.type = filters.type;
  if (filters?.validated !== undefined) {
    where.status = filters.validated ? "APPROVED" : { not: "APPROVED" };
  }

  return prisma.document.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      opportunity: { select: { id: true, title: true, company: true, score: true } },
      changeLogs: { orderBy: { createdAt: "desc" }, take: 3 },
    },
  });
}

export async function getDocument(id: string) {
  return prisma.document.findUnique({
    where: { id },
    include: {
      opportunity: {
        select: {
          id: true, title: true, company: true, country: true, score: true,
          pipelineTask: { select: { id: true, column: true, nextStep: true, nextStepDate: true } },
        },
      },
      changeLogs: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function generateDocument(
  opportunityId: string,
  type: DocumentType,
  useAI: boolean = false
) {
  const result = await generateDocumentContent(opportunityId, type, useAI);
  revalidatePath("/documents");
  revalidatePath(`/opportunites/${opportunityId}`);
  return result;
}

export async function updateDocumentContent(id: string, content: string) {
  const existing = await prisma.document.findUnique({ where: { id } });
  if (!existing) throw new Error("Document introuvable");

  const doc = await prisma.document.update({
    where: { id },
    data: { content, version: { increment: 1 }, status: "NEEDS_REVIEW" },
  });

  await prisma.changeLog.create({
    data: {
      documentId: id,
      section: "content",
      field: "content",
      oldValue: existing.content.slice(0, 500),
      newValue: content.slice(0, 500),
      reason: "Édition manuelle du contenu",
      source: "manual",
      risque: "Modification manuelle — vérifier la cohérence avec les données vérifiées",
      statut: "à_vérifier",
    },
  });

  revalidatePath(`/documents/${id}`);
  return doc;
}

export async function approveDocument(id: string) {
  const doc = await prisma.document.update({
    where: { id },
    data: { status: "APPROVED", validatedAt: new Date() },
  });

  await prisma.changeLog.create({
    data: {
      documentId: id,
      section: "validation",
      field: "status",
      oldValue: "NEEDS_REVIEW",
      newValue: "APPROVED",
      reason: "Validation humaine — document approuvé pour export",
      source: "manual",
      risque: null,
      statut: "accepté",
    },
  });

  revalidatePath(`/documents/${id}`);
  revalidatePath("/documents");
  return doc;
}

export async function rejectDocument(id: string) {
  const doc = await prisma.document.update({
    where: { id },
    data: { status: "REJECTED", validatedAt: null },
  });

  await prisma.changeLog.create({
    data: {
      documentId: id,
      section: "validation",
      field: "status",
      oldValue: "DRAFT",
      newValue: "REJECTED",
      reason: "Document refusé — corrections nécessaires",
      source: "manual",
      risque: "Document non conforme — ne pas exporter",
      statut: "refusé",
    },
  });

  revalidatePath(`/documents/${id}`);
  revalidatePath("/documents");
  return doc;
}

export async function deleteDocument(id: string) {
  await prisma.document.delete({ where: { id } });
  revalidatePath("/documents");
}

export async function getDocumentStats() {
  const [total, toValidate, validated] = await Promise.all([
    prisma.document.count(),
    prisma.document.count({ where: { status: { not: "APPROVED" } } }),
    prisma.document.count({ where: { status: "APPROVED" } }),
  ]);
  return { total, toValidate, validated };
}

// ─── IA Premium Document Improvement ──────────────

export async function improveDocumentWithIA(params: {
  documentId: string;
  styleId?: string;
}): Promise<{ success: true; documentId: string; content: string; alerts: HallucinationAlert[] } | { success: false; error: string }> {
  const { documentId, styleId } = params;

  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: { opportunity: { select: { id: true, title: true, company: true } } },
  });
  if (!doc) return { success: false, error: "Document introuvable" };

  // Get candidate profile
  const profile = await prisma.profile.findFirst({
    include: { skills: true, experiences: true, proofEntries: true, cvMaster: true },
  });
  if (!profile) return { success: false, error: "Profil candidat non configuré" };

  const styleInstructions = getStylePrompt(styleId || "humain");

  const docLabel = doc.type.replace(/_/g, " ").toUpperCase();

  const proofSummary = (profile.proofEntries || []).slice(0, 10)
    .map(p => `[${p.category}] ${p.title}: ${p.value}`).join("\n");

  const experiences = (profile.experiences || []).map(e =>
    `- ${e.title} chez ${e.company} (${e.startDate} - ${e.endDate || "présent"})${e.description ? " : " + e.description : ""}`
  ).join("\n");

  const skillsList = (profile.skills || []).map(s => `- ${s.name} (${s.category})`).join("\n");

  const systemPrompt = `Tu es un rédacteur exécutif premium. Tu améliorés un ${docLabel}.
RÈGLE ABSOLUE : n'invente RIEN. Améliore la forme (style, ton, structure, clarté) mais ne modifie pas les faits.
Conserve tous les chiffres, noms d'entreprises, postes et certifications du document original.
${styleInstructions}`;

  const userPrompt = `Améliore ce ${docLabel} pour le poste de ${doc.opportunity?.title || "—"} chez ${doc.opportunity?.company || "—"}.

DOCUMENT ORIGINAL :
${doc.content}

DONNÉES VÉRIFIÉES DU CANDIDAT (Proof Vault) :
${proofSummary}

EXPÉRIENCES VÉRIFIÉES :
${experiences}

COMPÉTENCES VÉRIFIÉES :
${skillsList}

Instructions : améliore le style, le ton, la structure. Ne modifie PAS les faits, chiffres, noms ou certifications.
Conserve tous les éléments factuels du document original.`;

  // Try AI improvement
  const aiResult = await generateWithDeepSeek({
    systemPrompt,
    userPrompt,
    temperature: 0.5,
  });

  if (!aiResult.success || !aiResult.content) {
    return { success: false, error: aiResult.error || "Échec de l'amélioration IA. Le document original est conservé." };
  }

  // Anti-hallucination validation
  const verifiedData = {
    fullName: profile.fullName || "",
    title: profile.title || "",
    skills: (profile.skills || []).map(s => ({ name: s.name, category: s.category })),
    experiences: (profile.experiences || []).map(e => ({
      company: e.company,
      title: e.title,
      country: e.country || null,
      description: e.description || null,
      responsibilities: e.responsibilities || null,
      teamSize: e.teamSize ? Number(e.teamSize) : null,
      revenue: e.revenue || null,
      budget: e.budget || null,
    })),
    education: profile.education || "",
    certifications: profile.certifications || "",
    proofEntries: (profile.proofEntries || []).map(p => ({ category: p.category, title: p.title, value: p.value })),
    masterCVText: profile.cvMaster?.originalText || "",
    profileText: profile.summary || "",
  };

  const halluResult = validateNoHallucinationEnhanced(aiResult.content, verifiedData);

  // Save improved document — always NEEDS_REVIEW after AI
  const oldContent = doc.content.slice(0, 500);
  const updated = await prisma.document.update({
    where: { id: documentId },
    data: {
      content: aiResult.content,
      status: halluResult.canExport ? "NEEDS_REVIEW" : "NEEDS_REVIEW",
      version: { increment: 1 },
    },
  });

  await prisma.changeLog.create({
    data: {
      documentId,
      section: "content",
      field: "content",
      oldValue: oldContent,
      newValue: aiResult.content.slice(0, 500),
      reason: `Amélioration IA premium (style: ${styleId || "humain"}, modèle: ${aiResult.model || "deepseek"})`,
      source: "ai_suggestion",
      risque: halluResult.clean ? null : `${halluResult.criticalCount} alerte(s) critique(s) — validation humaine obligatoire`,
      statut: "à_vérifier",
    },
  });

  revalidatePath(`/documents/${documentId}`);
  revalidatePath("/documents");

  return {
    success: true,
    documentId: updated.id,
    content: aiResult.content,
    alerts: halluResult.alerts,
  };
}

// ─── Compare local vs AI version ──────────────────

export async function compareDocumentVersions(params: {
  documentId: string;
  styleId?: string;
}): Promise<{
  success: true;
  versionLocale: string;
  versionIA: string;
  differences: string;
} | {
  success: false;
  error: string;
}> {
  const { documentId, styleId } = params;

  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: { opportunity: { select: { title: true, company: true } } },
  });
  if (!doc) return { success: false, error: "Document introuvable" };

  // Generate local version using template
  const localResult = await generateDocumentContent(doc.opportunityId, doc.type as DocumentType, false);

  // Get AI improved version
  const iaResult = await improveDocumentWithIA({ documentId, styleId });

  if (!iaResult.success) {
    return { success: false, error: iaResult.error || "Échec de la comparaison" };
  }

  const localContent = localResult.success && localResult.document
    ? (localResult.document as { content: string }).content : "";
  const iaContent = iaResult.content;

  // Simple diff summary
  const localLines = localContent.split("\n").length;
  const iaLines = iaContent.split("\n").length;
  const localWords = localContent.split(/\s+/).length;
  const iaWords = iaContent.split(/\s+/).length;

  const differences = [
    `Version locale : ${localLines} lignes, ${localWords} mots`,
    `Version IA : ${iaLines} lignes, ${iaWords} mots`,
    iaResult.alerts.length > 0
      ? `${iaResult.alerts.length} alerte(s) anti-hallucination à vérifier`
      : "Aucune alerte anti-hallucination détectée",
  ].join(" | ");

  return {
    success: true,
    versionLocale: localContent,
    versionIA: iaContent,
    differences,
  };
}

// ─── IA Quality Check ───────────────────────────

export async function qualityCheckWithIA(params: {
  documentContent: string;
  offerTitle?: string;
  documentType?: string;
}): Promise<{
  success: true;
  localScore: number;
  iaScore: number;
  iaAxes: Array<{ nom: string; note: number; pointFort: string; suggestion: string }>;
  iaForces: string[];
  iaAmeliorations: string[];
  iaVerdict: string;
  divergences: string[];
} | { success: false; error: string }> {
  const { documentContent, offerTitle, documentType } = params;

  if (!documentContent || documentContent.trim().length < 30) {
    return { success: false, error: "Texte trop court (min. 30 caractères)" };
  }

  // Get local score for comparison
  const { evaluateDocumentQuality } = await import("@/lib/quality-check/engine");
  const localResult = evaluateDocumentQuality({
    text: documentContent.trim(),
    offerTitle: offerTitle || undefined,
  });

  // Build IA prompt using the quality_check template
  const prompts = (await import("@/lib/ai/prompts")).getPremiumPrompts();
  const qcPrompt = prompts.find(p => p.name === "quality_check");
  if (!qcPrompt) return { success: false, error: "Prompt quality_check introuvable" };

  const systemPrompt = qcPrompt.systemPrompt;
  const userPrompt = qcPrompt.content
    .replace("{{documentContent}}", documentContent)
    .replace("{{offerTitle}}", offerTitle || "Non spécifié")
    .replace("{{documentType}}", documentType || "Document");

  const aiResult = await generateWithDeepSeek({
    systemPrompt,
    userPrompt,
    temperature: 0.3,
  });

  if (!aiResult.success || !aiResult.content) {
    return { success: false, error: aiResult.error || "Échec de l'analyse IA. L'analyse locale reste disponible." };
  }

  // Parse AI response
  let parsed: {
    scoreGlobal?: number;
    axes?: Array<{ nom: string; note: number; pointFort: string; suggestion: string }>;
    forces?: string[];
    ameliorations?: string[];
    verdict?: string;
  };
  try {
    const cleaned = aiResult.content.replace(/```json\n?|\n?```/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    // Try to extract JSON from the response
    const match = aiResult.content.match(/\{[\s\S]*\}/);
    if (!match) return { success: false, error: "Format IA non reconnu. L'analyse locale reste disponible." };
    try { parsed = JSON.parse(match[0]); } catch {
      return { success: false, error: "Format IA non reconnu. L'analyse locale reste disponible." };
    }
  }

  const iaScore = parsed.scoreGlobal || 0;
  const iaAxes = parsed.axes || [];
  const iaForces = parsed.forces || [];
  const iaAmeliorations = parsed.ameliorations || [];
  const iaVerdict = parsed.verdict || "Non évalué";

  // Compute divergences between local and AI scores
  const divergences: string[] = [];
  const diff = Math.abs(localResult.overall - iaScore);
  if (diff >= 20) {
    divergences.push(`Écart important (${diff} pts) entre l'évaluation locale (${localResult.overall}/100) et IA (${iaScore}/100).`);
  }
  if (diff >= 10 && diff < 20) {
    divergences.push(`Écart modéré (${diff} pts) entre l'évaluation locale (${localResult.overall}/100) et IA (${iaScore}/100).`);
  }
  if (iaAxes.length > 0) {
    const lowAxes = iaAxes.filter(a => a.note < 10);
    if (lowAxes.length > 0) {
      divergences.push(`${lowAxes.length} axe(s) noté(s) < 10/20 par l'IA : ${lowAxes.map(a => a.nom).join(", ")}.`);
    }
  }
  if (iaVerdict === "À_RETRAVAILLER" && localResult.overall >= 70) {
    divergences.push("L'IA juge le document à retravailler alors que l'analyse locale le juge bon. Vérifier les suggestions IA.");
  }

  return {
    success: true,
    localScore: localResult.overall,
    iaScore,
    iaAxes,
    iaForces,
    iaAmeliorations,
    iaVerdict,
    divergences,
  };
}
