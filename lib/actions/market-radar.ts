"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { normalizeJobPosting } from "@/lib/market-radar/normalizer";
import { classifySource } from "@/lib/market-radar/source-classifier";
import { scoreJobAgainstProfile } from "@/lib/market-radar/scoring";
import { detectRadarDuplicate } from "@/lib/market-radar/dedupe";
import { parseManualJobText } from "@/lib/market-radar/manual-parser";
import type { NormalizedJobPosting, RadarScore, RadarProfile } from "@/lib/market-radar/types";

/* ═══════════════════════════════════════════════
   CRUD Market Radar (legacy, unchanged)
   ═══════════════════════════════════════════════ */

export async function getMarketRadars() {
  return prisma.marketRadar.findMany({
    include: { jobSource: { select: { name: true, url: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function generateMarketRadar(jobSourceId: string, role: string, country: string, searchUrl: string) {
  const entry = await prisma.marketRadar.create({ data: { jobSourceId, role, country, searchUrl } });
  revalidatePath("/sources");
  return entry;
}

export async function deleteMarketRadar(id: string) {
  await prisma.marketRadar.delete({ where: { id } });
  revalidatePath("/sources");
}

/* ═══════════════════════════════════════════════
   RadarCandidate — Core
   ═══════════════════════════════════════════════ */

async function getProfile(): Promise<RadarProfile | null> {
  const p = await prisma.profile.findFirst({
    include: { skills: true, experiences: { orderBy: { startDate: "desc" }, take: 10 } },
  });
  if (!p) return null;
  return {
    title: p.title,
    functions: p.functions,
    sectors: p.sectors,
    yearsExp: p.yearsExp,
    location: p.location,
    mobility: p.mobility,
    languages: p.languages,
    targetSalary: p.targetSalary,
    remotePreference: p.remotePreference,
    constraints: p.constraints,
    skills: p.skills.map((s) => ({ name: s.name, category: s.category })),
    experiences: p.experiences.map((e) => ({ title: e.title, company: e.company, sector: e.sector, startDate: e.startDate, endDate: e.endDate })),
  };
}

/** 1. Normalise, score, dédoublonne et stocke un RadarCandidate. Ne crée JAMAIS d'Opportunity. */
export async function createRadarCandidate(input: {
  title?: string; company?: string; location?: string; description?: string;
  sourceUrl?: string; applyUrl?: string; salary?: string; contractType?: string;
  remote?: string; publishedAt?: string; source?: string; externalId?: string;
}) {
  const normalized = normalizeJobPosting({ ...input, sourceType: classifySource(input.sourceUrl || "") });
  if ("invalid" in normalized) return { success: false, error: normalized.reason };

  // Scoring
  const profile = await getProfile();
  const cvMaster = await prisma.cVMaster.findFirst();
  const score = scoreJobAgainstProfile(normalized, profile, cvMaster?.originalText);

  // Dup check
  const jobs = await prisma.job.findMany({
    select: { externalId: true, sourceUrl: true, title: true, company: true, location: true },
  });
  const existingRadar = await prisma.radarCandidate.findMany({
    select: { externalId: true, sourceUrl: true, title: true, company: true, location: true },
  });
  const dupResult = detectRadarDuplicate(normalized, [...jobs, ...existingRadar]);

  const candidate = await prisma.radarCandidate.create({
    data: {
      source: normalized.source,
      sourceType: normalized.sourceType,
      sourceUrl: normalized.sourceUrl,
      applyUrl: normalized.applyUrl,
      externalId: normalized.externalId,
      title: normalized.title,
      company: normalized.company,
      location: normalized.location,
      remote: normalized.remote,
      contractType: normalized.contractType,
      salary: normalized.salary,
      description: normalized.description,
      publishedAt: normalized.publishedAt ? new Date(normalized.publishedAt) : undefined,
      detectedAts: normalized.detectedAts,
      score: score.total,
      priority: score.priority,
      reasonsJson: JSON.stringify(score.reasons),
      risksJson: JSON.stringify(score.risks),
      matchedKeywordsJson: JSON.stringify(score.matchedKeywords),
      missingKeywordsJson: JSON.stringify(score.missingKeywords),
      duplicateStatus: dupResult.status !== "new" ? dupResult.status : null,
      duplicateOfId: dupResult.status !== "new" ? (dupResult.existingExternalId || dupResult.existingSourceUrl) : null,
      status: dupResult.status !== "new" ? "duplicate" : "new",
    },
  });

  revalidatePath("/market-radar");
  return { success: true, candidateId: candidate.id, score, duplicate: dupResult };
}

/** 2. Liste les RadarCandidate avec filtres. */
export async function listRadarCandidates(filters?: {
  status?: string; priority?: string; source?: string; search?: string; limit?: number;
}) {
  const where: Record<string, unknown> = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.priority) where.priority = filters.priority;
  if (filters?.source) where.source = filters.source;
  if (filters?.search) {
    const q = filters.search;
    where.OR = [
      { title: { contains: q } },
      { company: { contains: q } },
      { description: { contains: q } },
    ];
  }
  return prisma.radarCandidate.findMany({
    where,
    orderBy: [{ score: "desc" }, { createdAt: "desc" }],
    take: filters?.limit || 50,
  });
}

/** 3. Récupère un RadarCandidate par ID. */
export async function getRadarCandidate(id: string) {
  return prisma.radarCandidate.findUnique({ where: { id } });
}

/** 4. Marque un candidat comme ignoré. */
export async function ignoreRadarCandidate(id: string) {
  await prisma.radarCandidate.update({ where: { id }, data: { status: "ignored" } });
  revalidatePath("/market-radar");
  return { success: true };
}

/** 5. Marque un candidat comme doublon. */
export async function markRadarCandidateDuplicate(id: string, duplicateOfId?: string) {
  await prisma.radarCandidate.update({
    where: { id },
    data: { status: "duplicate", duplicateOfId, duplicateStatus: "duplicate_exact" },
  });
  revalidatePath("/market-radar");
  return { success: true };
}

/** 6. Marque comme revu. */
export async function markRadarCandidateReviewed(id: string) {
  await prisma.radarCandidate.update({ where: { id }, data: { status: "reviewed" } });
  revalidatePath("/market-radar");
  return { success: true };
}

/** 7. Importe un RadarCandidate vers Job (nouveau modèle — action humaine uniquement). */
export async function importRadarCandidateToOpportunity(candidateId: string) {
  const candidate = await prisma.radarCandidate.findUnique({ where: { id: candidateId } });
  if (!candidate) return { success: false, error: "Candidat radar introuvable" };

  // Si déjà importé, retourner l'ID existant
  if (candidate.status === "imported" && candidate.importedOpportunityId) {
    const existingJob = await prisma.job.findUnique({ where: { id: candidate.importedOpportunityId } });
    if (existingJob) return { success: true, jobId: existingJob.id, alreadyImported: true };
    // Si le job n'existe plus, on continue pour le recréer
  }

  // Re-vérifier doublon avant import (sauf son propre externalId radar::)
  const externalIds = [candidate.externalId, `radar::${candidateId}`].filter(Boolean) as string[];
  const existing = await prisma.job.findFirst({
    where: {
      OR: [
        ...externalIds.map((eid) => ({ externalId: eid })),
        candidate.sourceUrl ? { sourceUrl: candidate.sourceUrl } : ({} as Record<string, unknown>),
      ].filter((o) => Object.keys(o).length > 0),
    },
  });
  if (existing) {
    await prisma.radarCandidate.update({
      where: { id: candidateId },
      data: { status: "duplicate", duplicateStatus: "duplicate_exact", duplicateOfId: existing.id },
    });
    return { success: false, error: "Doublon détecté — cette annonce existe déjà", existingId: existing.id };
  }

  // Trouver ou créer source d'import
  let source = await prisma.importSource.findFirst({ where: { name: candidate.source } });
  if (!source) {
    source = await prisma.importSource.create({ data: { name: candidate.source, type: "browser", enabled: true } });
  }

  // Extraire salaire min/max
  let salaryMin: number | null = null;
  let salaryMax: number | null = null;
  if (candidate.salary) {
    const nums = candidate.salary.match(/(\d{2,3}(?:\s?\d{3})?)/g);
    if (nums && nums.length >= 2) { salaryMin = parseInt(nums[0].replace(/\s/g, "")); salaryMax = parseInt(nums[1].replace(/\s/g, "")); }
    else if (nums && nums.length === 1) { salaryMin = parseInt(nums[0].replace(/\s/g, "")); }
  }

  // Créer le JOB (pas une Opportunity) — apparaît dans /dashboard/jobs
  const job = await prisma.job.create({
    data: {
      title: candidate.title.slice(0, 200),
      company: candidate.company.slice(0, 200),
      location: candidate.location?.slice(0, 200) || null,
      sourceUrl: candidate.sourceUrl.slice(0, 500),
      description: candidate.description.slice(0, 5000),
      contractType: candidate.contractType || null,
      salaryMin, salaryMax,
      sourceId: source.id,
      externalId: candidate.externalId || `radar::${candidate.id}`,
      status: "new",
      firstSeenAt: new Date(),
      lastSeenAt: new Date(),
    },
  });

  // Mettre à jour le candidat
  await prisma.radarCandidate.update({
    where: { id: candidateId },
    data: { status: "imported", importedOpportunityId: job.id },
  });

  revalidatePath("/market-radar");
  revalidatePath("/dashboard/jobs");
  return { success: true, jobId: job.id };
}

/** 8. Preview d'un texte collé — retourne NormalizedJobPosting + score, sans sauvegarder. */
export async function previewManualJobText(rawText: string, sourceUrl?: string) {
  const parsed = parseManualJobText(rawText, sourceUrl);
  if (parsed.confidence === "low" && !parsed.title) {
    return { success: false, error: "Texte trop court ou illisible", warnings: parsed.warnings };
  }

  const normalized = normalizeJobPosting({
    title: parsed.title,
    company: parsed.company,
    location: parsed.location,
    description: parsed.description,
    sourceUrl: sourceUrl || parsed.sourceUrl,
    contractType: parsed.contractType,
    salary: parsed.salary,
    sourceType: classifySource(sourceUrl || ""),
  });

  if ("invalid" in normalized) {
    return { success: false, error: normalized.reason, warnings: parsed.warnings, preview: parsed };
  }

  const profile = await getProfile();
  const cvMaster = await prisma.cVMaster.findFirst();
  const score = scoreJobAgainstProfile(normalized, profile, cvMaster?.originalText);

  return { success: true, normalized, score, preview: parsed };
}

/** 9. Crée un RadarCandidate depuis un texte collé. */
export async function createCandidateFromManualText(rawText: string, sourceUrl?: string) {
  const parsed = parseManualJobText(rawText, sourceUrl);
  return createRadarCandidate({
    title: parsed.title,
    company: parsed.company,
    location: parsed.location,
    description: parsed.description,
    sourceUrl: sourceUrl || parsed.sourceUrl,
    contractType: parsed.contractType,
    salary: parsed.salary,
  });
}

/** 10. Preview URL assistée — classifie et retourne des instructions. */
export async function previewAssistedUrl(url: string) {
  const sourceType = classifySource(url);

  if (sourceType === "assisted_url") {
    return {
      success: true,
      status: "assisted_required",
      sourceType,
      message: "Cette source limite l'extraction automatique. Copiez-collez le texte de l'annonce pour l'importer dans PRSTO.",
    };
  }

  return {
    success: true,
    status: "ok",
    sourceType,
    message: sourceType === "ats_public"
      ? "Source ATS publique — extraction possible."
      : sourceType === "official_api"
        ? "API officielle — import disponible."
        : "Site carrière — extraction limitée. Privilégiez le copier-coller.",
  };
}
