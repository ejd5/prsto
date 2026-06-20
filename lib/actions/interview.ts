"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { buildCandidateSnapshot } from "@/lib/analysis/engine";
import type { AnalysisReport } from "@/lib/analysis/engine";
import { generateFullInterview } from "@/lib/generation/interview-templates";

export async function getInterviews(filters?: { opportunityId?: string; statut?: string }) {
  const where: Record<string, unknown> = {};
  if (filters?.opportunityId) where.opportunityId = filters.opportunityId;
  if (filters?.statut) where.status = filters.statut;

  return prisma.interview.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      opportunity: { select: { id: true, title: true, company: true, country: true, score: true } },
    },
  });
}

export async function getInterview(id: string) {
  return prisma.interview.findUnique({
    where: { id },
    include: {
      opportunity: {
        select: {
          id: true, title: true, company: true, country: true, score: true, rawText: true, contractType: true, location: true,
          analysis: true,
          documents: { orderBy: { createdAt: "desc" } },
          pipelineTask: { select: { id: true, column: true, notes: true, recruiterName: true } },
          relances: { orderBy: { date: "desc" } },
        },
      },
    },
  });
}

export async function generateInterviewPreparation(opportunityId: string, type: string = "entretien") {
  const opp = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    include: {
      analysis: true,
      documents: { orderBy: { createdAt: "desc" } },
      pipelineTask: { select: { column: true, notes: true, recruiterName: true } },
      relances: { orderBy: { date: "desc" } },
    },
  });
  if (!opp) throw new Error("Opportunité introuvable");

  const candidate = await buildCandidateSnapshot();
  if (!candidate) throw new Error("Profil candidat non configuré");

  const ctx = {
    candidate,
    opp: {
      title: opp.title,
      company: opp.company,
      location: opp.location,
      country: opp.country,
      rawText: opp.rawText,
      contractType: opp.contractType,
    },
    analysis: opp.analysis as unknown as AnalysisReport | null,
    pipeline: opp.pipelineTask ? {
      column: opp.pipelineTask.column,
      notes: opp.pipelineTask.notes,
      recruiterName: opp.pipelineTask.recruiterName,
    } : null,
    documents: opp.documents.map(d => ({ type: d.type, status: d.status })),
    relances: opp.relances.map(r => ({ type: r.type, status: r.status, date: r.date })),
  };

  const { sections, fullText } = generateFullInterview(ctx);

  const existing = await prisma.interview.findFirst({
    where: { opportunityId, type },
  });

  const interview = existing
    ? await prisma.interview.update({
      where: { id: existing.id },
      data: { preparation: fullText, sections: JSON.stringify(sections), status: "brouillon" },
    })
    : await prisma.interview.create({
      data: {
        opportunityId,
        type,
        preparation: fullText,
        sections: JSON.stringify(sections),
        status: "brouillon",
      },
    });

  revalidatePath(`/entretiens/${interview.id}`);
  revalidatePath("/entretiens");
  return interview;
}

export async function updateInterviewPreparation(id: string, preparation: string) {
  const interview = await prisma.interview.update({
    where: { id },
    data: { preparation, status: "brouillon" },
  });
  revalidatePath(`/entretiens/${id}`);
  return interview;
}

export async function markInterviewReady(id: string) {
  const interview = await prisma.interview.update({
    where: { id },
    data: { status: "pret" },
  });
  revalidatePath(`/entretiens/${id}`);
  return interview;
}

export async function updateInterview(id: string, data: {
  type?: string; date?: string; interviewer?: string; notes?: string;
  questions?: string; strengths?: string; weaknesses?: string; nextSteps?: string;
  status?: string;
}) {
  const interview = await prisma.interview.update({
    where: { id },
    data: {
      ...data,
      date: data.date ? new Date(data.date) : undefined,
    },
  });
  revalidatePath(`/entretiens/${id}`);
  return interview;
}

export async function deleteInterview(id: string) {
  await prisma.interview.delete({ where: { id } });
  revalidatePath("/entretiens");
}

export async function getInterviewStats() {
  const [total, brouillons, prets, utilises] = await Promise.all([
    prisma.interview.count(),
    prisma.interview.count({ where: { status: "brouillon" } }),
    prisma.interview.count({ where: { status: "pret" } }),
    prisma.interview.count({ where: { status: "utilise" } }),
  ]);
  return { total, brouillons, prets, utilises };
}
