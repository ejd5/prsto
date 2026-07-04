"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type OpportunityData = {
  title: string;
  company: string;
  location: string;
  country: string;
  sourceUrl: string;
  sourceName: string;
  jobSourceId: string;
  rawText: string;
  salaryMin: number;
  salaryMax: number;
  salaryCurrency: string;
  contractType: string;
  remote: string;
  status: string;
  priority: number;
  notes: string;
};

export async function getOpportunities(filters?: {
  status?: string;
  country?: string;
  sourceName?: string;
  priority?: number;
  remote?: string;
  search?: string;
  duplicateStatus?: string;
}) {
  const where: Record<string, unknown> = {};
  if (filters?.status && filters.status !== "tous") where.status = filters.status;
  if (filters?.country && filters.country !== "tous") where.country = filters.country;
  if (filters?.sourceName && filters.sourceName !== "tous") where.sourceName = filters.sourceName;
  if (filters?.priority !== undefined && filters.priority !== -1) where.priority = filters.priority;
  if (filters?.remote && filters.remote !== "tous") where.remote = filters.remote;
  if (filters?.duplicateStatus) where.duplicateStatus = filters.duplicateStatus;
  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search } },
      { company: { contains: filters.search } },
      { rawText: { contains: filters.search } },
    ];
  }
  return prisma.opportunity.findMany({
    where,
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    include: {
      jobSource: { select: { name: true } },
      analysis: { select: { scoreGlobal: true } },
      _count: { select: { documents: true } },
    },
  });
}

export async function getOpportunity(id: string) {
  return prisma.opportunity.findUnique({
    where: { id },
    include: {
      jobSource: { select: { name: true, url: true } },
      analysis: true,
      documents: true,
      pipelineTask: true,
    },
  });
}

export async function addOpportunity(data: OpportunityData) {
  const opp = await prisma.opportunity.create({
    data: { ...data, jobSourceId: data.jobSourceId || null },
  });
  revalidatePath("/opportunites");
  return opp;
}

export async function updateOpportunity(id: string, data: Partial<OpportunityData>) {
  const opp = await prisma.opportunity.update({
    where: { id },
    data: { ...data, jobSourceId: data.jobSourceId || undefined },
  });
  revalidatePath("/opportunites");
  revalidatePath(`/opportunites/${id}`);
  return opp;
}

export async function deleteOpportunity(id: string) {
  await prisma.opportunity.delete({ where: { id } });
  revalidatePath("/opportunites");
}

export async function getOpportunityStats() {
  const [total, nouveau, aAnalyser, postule, entretien, offre, refus, archive] = await Promise.all([
    prisma.opportunity.count(),
    prisma.opportunity.count({ where: { status: "nouveau" } }),
    prisma.opportunity.count({ where: { status: "analyse" } }),
    prisma.opportunity.count({ where: { status: "postule" } }),
    prisma.opportunity.count({ where: { status: "entretien" } }),
    prisma.opportunity.count({ where: { status: "offre" } }),
    prisma.opportunity.count({ where: { status: "refus" } }),
    prisma.opportunity.count({ where: { status: "archive" } }),
  ]);
  return { total, nouveau, aAnalyser, postule, entretien, offre, refus, archive };
}

// ─── Priorisation ────────────────────────────────

export interface PrioritizedOpportunity {
  id: string;
  title: string;
  company: string;
  country: string | null;
  location: string | null;
  status: string;
  priority: number;
  sourceName: string | null;
  contractType: string | null;
  duplicateStatus: string;
  duplicateScore: number | null;
  scoreGlobal: number | null;
  businessFit: number | null;
  leadershipFit: number | null;
  internationalFit: number | null;
  seniorityFit: number | null;
  riskLevel: number | null; // 0 = low risk, 10 = high risk
  inPipeline: boolean;
  pipelineColumn: string | null;
  hasDocument: boolean;
  hasApprovedDocument: boolean;
  hasRelance: boolean;
  relanceScheduled: boolean;
  createdAt: string;
  priorityScore: number; // 0-100 composite
  recommendation: "POSTULER" | "ANALYSER" | "PREPARER" | "RELANCER" | "ATTENDRE" | "ARCHIVER";
  recommendationLabel: string;
}

export async function getPrioritizedOpportunities(filters?: {
  country?: string;
  search?: string;
  onlyActionable?: boolean;
}): Promise<PrioritizedOpportunity[]> {
  const where: Record<string, unknown> = {};
  if (filters?.country && filters.country !== "tous") where.country = filters.country;
  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search } },
      { company: { contains: filters.search } },
    ];
  }
  // Exclude archived/refused from prioritization by default
  if (filters?.onlyActionable !== false) {
    where.status = { notIn: ["refus", "archive"] };
  }

  const opps = await prisma.opportunity.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      analysis: true,
      pipelineTask: true,
      documents: { select: { id: true, status: true } },
      relances: { select: { id: true, status: true, scheduledDate: true } },
    },
  });

  return opps.map((o) => {
    const analysis = o.analysis;
    const matchDetails: Record<string, unknown> = analysis?.matchDetails
      ? (typeof analysis.matchDetails === "string" ? JSON.parse(analysis.matchDetails) : analysis.matchDetails) as unknown as Record<string, unknown>
      : {};

    const scoreGlobal = analysis?.scoreGlobal ?? null;
    const businessFit = (matchDetails?.businessFitScore as number | null) ?? null;
    const leadershipFit = (matchDetails?.salesLeadershipScore as number | null) ?? null;
    const internationalFit = (matchDetails?.internationalFitScore as number | null) ?? null;
    const seniorityFit = (matchDetails?.executiveSeniorityScore as number | null) ?? null;
    const riskLevel = (matchDetails?.riskScore as number | null) ?? null;

    const inPipeline = !!o.pipelineTask;
    const pipelineColumn = o.pipelineTask?.column ?? null;
    const hasDocument = o.documents.length > 0;
    const hasApprovedDocument = o.documents.some((d: { status: string }) => d.status === "APPROVED");
    const hasRelance = o.relances.length > 0;
    const relanceScheduled = o.relances.some((r: { status: string; scheduledDate: Date | null }) => r.status !== "envoyé" && r.scheduledDate);

    // Composite priority score (0-100)
    let score = 0;
    if (scoreGlobal !== null) score += scoreGlobal * 0.25;
    score += o.priority === 1 ? 15 : 0;
    if (riskLevel !== null) score += (10 - riskLevel) * 1.5; // lower risk = higher score
    if (businessFit !== null) score += businessFit / 2;
    if (leadershipFit !== null) score += leadershipFit / 2;
    if (internationalFit !== null) score += internationalFit / 3;
    if (seniorityFit !== null) score += seniorityFit / 3;
    if (inPipeline) score += 5;
    if (hasApprovedDocument) score += 8;
    if (hasRelance && !relanceScheduled) score += 2;
    if (relanceScheduled) score += 4;
    if (o.duplicateStatus === "PROBABLE_DUPLICATE" || o.duplicateStatus === "CONFIRMED_DUPLICATE") score -= 10;

    const priorityScore = Math.max(0, Math.min(100, Math.round(score)));

    // Recommendation
    let recommendation: PrioritizedOpportunity["recommendation"] = "ANALYSER";
    let recommendationLabel = "À analyser";

    if (hasApprovedDocument && relanceScheduled) {
      recommendation = "ATTENDRE";
      recommendationLabel = "Relance en cours — attendre";
    } else if (hasApprovedDocument && inPipeline && !hasRelance) {
      recommendation = "RELANCER";
      recommendationLabel = "Relance à prévoir";
    } else if (hasApprovedDocument && inPipeline) {
      recommendation = "POSTULER";
      recommendationLabel = "Prêt à postuler";
    } else if (scoreGlobal !== null && scoreGlobal >= 60 && hasDocument) {
      recommendation = "PREPARER";
      recommendationLabel = "Préparer documents";
    } else if (scoreGlobal !== null && scoreGlobal >= 50) {
      recommendation = "ANALYSER";
      recommendationLabel = "Analyser en priorité";
    } else if (scoreGlobal !== null && scoreGlobal < 30) {
      recommendation = "ARCHIVER";
      recommendationLabel = "Score faible — à archiver";
    } else {
      recommendation = "ANALYSER";
      recommendationLabel = "À évaluer";
    }

    return {
      id: o.id,
      title: o.title,
      company: o.company,
      country: o.country,
      location: o.location,
      status: o.status,
      priority: o.priority,
      sourceName: o.sourceName,
      contractType: o.contractType,
      duplicateStatus: o.duplicateStatus,
      duplicateScore: o.duplicateScore,
      scoreGlobal,
      businessFit,
      leadershipFit,
      internationalFit,
      seniorityFit,
      riskLevel,
      inPipeline,
      pipelineColumn,
      hasDocument,
      hasApprovedDocument,
      hasRelance,
      relanceScheduled,
      createdAt: o.createdAt.toISOString(),
      priorityScore,
      recommendation,
      recommendationLabel,
    };
  }).sort((a, b) => b.priorityScore - a.priorityScore);
}

export async function updateOpportunities(ids: string[], data: Partial<OpportunityData>) {
  await prisma.opportunity.updateMany({
    where: { id: { in: ids } },
    data,
  });
  revalidatePath("/opportunites");
}

export async function getDistinctCountries() {
  const rows = await prisma.opportunity.findMany({
    select: { country: true },
    distinct: ["country"],
    where: { country: { not: null } },
  });
  return rows.map(r => r.country).filter(Boolean) as string[];
}

export async function getDistinctSourceNames() {
  const rows = await prisma.opportunity.findMany({
    select: { sourceName: true },
    distinct: ["sourceName"],
    where: { sourceName: { not: null } },
  });
  return rows.map(r => r.sourceName).filter(Boolean) as string[];
}

// Fallback fetch URL côté serveur — basique, pas de scraping agressif
export async function fetchUrlText(url: string): Promise<{
  success: boolean;
  text?: string;
  title?: string;
  error?: string;
}> {
  try {
    const u = new URL(url);
    // Ne pas appeler les sites qui bloquent clairement
    const blockedHosts = ["linkedin.com", "indeed.com"];
    if (blockedHosts.some(h => u.hostname.includes(h))) {
      return { success: false, error: "Cette plateforme bloque l'import automatique. Utilisez le copier-coller." };
    }
    const res = await fetch(url, {
      headers: { "User-Agent": "PRSTO/1.0 (job search helper)" },
      signal: AbortSignal.timeout(8000),
      redirect: "follow",
    });
    if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
    const html = await res.text();
    // Extraction basique title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    // Extraction texte body simplifié
    const bodyText = html
      .replace(/<script[^>]*>[^<]*<\/script>/gi, "")
      .replace(/<style[^>]*>[^<]*<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 15000);
    return {
      success: true,
      text: bodyText,
      title: titleMatch?.[1]?.trim() || undefined,
    };
  } catch (e: unknown) {
    const err = e as Error;
    return { success: false, error: err.message || "Échec de la requête" };
  }
}
