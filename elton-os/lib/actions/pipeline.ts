"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

function mapColumnToJobStatus(column: string): string {
  const map: Record<string, string> = {
    nouveau: "new",
    a_analyser: "enriched",
    analyse: "enriched",
    a_preparer: "enriched",
    document_a_valider: "enriched",
    pret_a_envoyer: "shortlisted",
    envoye: "applied",
    relance_1: "applied",
    relance_2: "applied",
    entretien_rh: "applied",
    entretien_direction: "applied",
    offre: "applied",
    refus: "rejected",
    archive: "expired",
  };
  return map[column] ?? "new";
}

export async function getPipelineTasks(filters?: {
  column?: string;
  country?: string;
  sourceName?: string;
  priority?: number;
  retard?: boolean;
  docApprouved?: boolean;
  search?: string;
}) {
  const where: Record<string, unknown> = {};
  if (filters?.column) where.column = filters.column;
  if (filters?.retard) {
    where.nextStepDate = { lt: new Date() };
    where.column = { notIn: ["refus", "archive", "offre"] };
  }

  const tasks = await prisma.pipelineTask.findMany({
    where,
    orderBy: [{ order: "asc" }, { lastStatusChange: "desc" }],
    include: {
      opportunity: {
        include: {
          analysis: { select: { scoreGlobal: true } },
          _count: { select: { documents: true } },
          relances: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  });

  let result = tasks;

  // Filtres post-query (sur données liées)
  if (filters?.country || filters?.sourceName || filters?.priority !== undefined || filters?.docApprouved || filters?.search) {
    result = tasks.filter((t) => {
      const opp = t.opportunity;
      if (!opp) return false;
      if (filters.country && opp.country !== filters.country) return false;
      if (filters.sourceName && opp.sourceName !== filters.sourceName) return false;
      if (filters.priority !== undefined && opp.priority !== filters.priority) return false;
      if (filters.docApprouved) {
        // Vérifier si l'opp a au moins un document APPROVED
        // On va faire une vérification simplifiée via les relances ou le count
        if (!opp._count || opp._count.documents === 0) return false;
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!opp.title.toLowerCase().includes(q) && !opp.company.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }

  return result;
}

export async function getPipelineTask(id: string) {
  return prisma.pipelineTask.findUnique({
    where: { id },
    include: {
      opportunity: {
        include: {
          analysis: { select: { scoreGlobal: true, keywordsAts: true } },
          documents: { orderBy: { createdAt: "desc" } },
          relances: { orderBy: { createdAt: "desc" } },
        },
      },
    },
  });
}

export async function getPipelineTaskByOpportunity(opportunityId: string) {
  return prisma.pipelineTask.findUnique({
    where: { opportunityId },
    include: {
      opportunity: {
        include: {
          analysis: { select: { scoreGlobal: true } },
          documents: { orderBy: { createdAt: "desc" }, take: 3 },
        },
      },
    },
  });
}

export async function addToPipeline(opportunityId: string, jobId?: string) {
  const existing = jobId
    ? await prisma.pipelineTask.findFirst({ where: { OR: [{ opportunityId }, { jobId }] } })
    : await prisma.pipelineTask.findFirst({ where: { opportunityId } });
  if (existing) return existing;

  const task = await prisma.pipelineTask.create({
    data: {
      opportunityId: opportunityId || undefined,
      jobId: jobId || undefined,
      column: "nouveau",
      lastStatusChange: new Date(),
    },
  });

  if (opportunityId) {
    await prisma.opportunity.update({
      where: { id: opportunityId },
      data: { status: "nouveau" },
    });
  }
  if (jobId) {
    await prisma.job.update({
      where: { id: jobId },
      data: { status: "new" },
    });
  }

  revalidatePath("/dashboard/jobs/pipeline");
  if (opportunityId) revalidatePath(`/opportunites/${opportunityId}`);
  return task;
}

export async function updatePipelineColumn(id: string, column: string) {
  const task = await prisma.pipelineTask.update({
    where: { id },
    data: {
      column,
      lastStatusChange: new Date(),
    },
  });

  // Synchroniser le statut
  if (task.opportunityId) {
    await prisma.opportunity.update({
      where: { id: task.opportunityId },
      data: {
        status: column,
        ...(column === "envoye" ? { appliedAt: new Date() } : {}),
      },
    });
  }
  if (task.jobId) {
    await prisma.job.update({
      where: { id: task.jobId },
      data: {
        status: mapColumnToJobStatus(column),
        ...(column === "envoye" ? { appliedAt: new Date() } : {}),
      },
    });
  }

  revalidatePath("/dashboard/jobs/pipeline");
  if (task.opportunityId) revalidatePath(`/opportunites/${task.opportunityId}`);
  return task;
}

export async function updatePipelineTask(id: string, data: {
  notes?: string;
  nextStep?: string;
  nextStepDate?: string;
  recruiterName?: string;
  recruiterTitle?: string;
  recruiterEmail?: string;
  recruiterLinkedin?: string;
  recruiterPhone?: string;
  cabinetName?: string;
  contactNotes?: string;
  contactSource?: string;
  order?: number;
}) {
  const task = await prisma.pipelineTask.update({
    where: { id },
    data: {
      ...data,
      nextStepDate: data.nextStepDate ? new Date(data.nextStepDate) : undefined,
    },
  });

  revalidatePath("/dashboard/jobs/pipeline");
  return task;
}

export async function removeFromPipeline(id: string) {
  const task = await prisma.pipelineTask.findUnique({ where: { id } });
  await prisma.pipelineTask.delete({ where: { id } });

  if (task?.opportunityId) {
    revalidatePath(`/opportunites/${task.opportunityId}`);
  }
  revalidatePath("/dashboard/jobs/pipeline");
}

export async function getPipelineStats() {
  const [total, allTasks] = await Promise.all([
    prisma.pipelineTask.count(),
    prisma.pipelineTask.findMany({
      select: { column: true, nextStepDate: true },
    }),
  ]);

  const now = new Date();
  const envoyees = allTasks.filter(t =>
    ["envoye", "relance_1", "relance_2", "entretien_rh", "entretien_direction", "offre"].includes(t.column)
  ).length;
  const relancesAFaire = allTasks.filter(t =>
    ["envoye", "relance_1", "relance_2"].includes(t.column) ||
    (t.nextStepDate && t.nextStepDate <= now)
  ).length;
  const relancesRetard = allTasks.filter(t =>
    t.nextStepDate && t.nextStepDate < new Date(now.getTime() - 2 * 86400000)
  ).length;
  const entretiens = allTasks.filter(t =>
    ["entretien_rh", "entretien_direction"].includes(t.column)
  ).length;
  const offres = allTasks.filter(t => t.column === "offre").length;
  const refus = allTasks.filter(t => t.column === "refus").length;

  return { inPipeline: total, envoyees, relancesAFaire, relancesRetard, entretiens, offres, refus };
}
