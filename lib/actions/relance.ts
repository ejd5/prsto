"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { buildCandidateSnapshot } from "@/lib/analysis/engine";
import {
  getRelanceTemplate,
  getRelanceLabel,
  type RelanceTemplate,
  type RelanceContext,
} from "@/lib/generation/relance-templates";

// ─── CRUD Relances ─────────────────────────────────────

export async function getRelances(opportunityId: string) {
  return prisma.relance.findMany({
    where: { opportunityId },
    orderBy: { date: "desc" },
    include: {
      opportunity: { select: { title: true, company: true, pipelineTask: { select: { id: true, column: true } } } },
    },
  });
}

export async function generateRelance(opportunityId: string, templateType: RelanceTemplate) {
  const opp = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    include: {
      analysis: { select: { scoreGlobal: true } },
      pipelineTask: { select: { recruiterName: true, recruiterTitle: true, cabinetName: true } },
      documents: { where: { status: "APPROVED" }, select: { id: true } },
    },
  });
  if (!opp) throw new Error("Opportunité introuvable");

  const candidate = await buildCandidateSnapshot();
  if (!candidate) throw new Error("Profil candidat non configuré");

  const ctx: RelanceContext = {
    candidateName: candidate.fullName,
    candidateTitle: candidate.title,
    oppTitle: opp.title,
    oppCompany: opp.company,
    oppLocation: opp.location || opp.country || "",
    oppCountry: opp.country || "",
    score: opp.analysis?.scoreGlobal || null,
    strategy: opp.title.includes("Commercial") || opp.title.includes("Sales") || opp.title.includes("Ventes")
      ? "orientation résultats" : "leadership et impact",
    recruiterName: opp.pipelineTask?.recruiterName || undefined,
    recruiterTitle: opp.pipelineTask?.recruiterTitle || undefined,
    cabinetName: opp.pipelineTask?.cabinetName || undefined,
    hasApprovedDoc: opp.documents.length > 0,
  };

  const templateFn = getRelanceTemplate(templateType);
  const content = templateFn(ctx);

  const typeMap: Record<string, string> = {
    j5_fr: "email", j10_fr: "email",
    linkedin_fr: "linkedin", cabinet_fr: "cabinet",
    remerciement_fr: "email",
    j5_en: "email", j10_en: "email",
    linkedin_en: "linkedin", cabinet_en: "cabinet",
    remerciement_en: "email",
  };

  const relance = await prisma.relance.create({
    data: {
      opportunityId,
      type: typeMap[templateType] || "email",
      templateUsed: templateType,
      content,
      status: "a_envoyer",
      scheduledDate: templateType.includes("j5") ? new Date(Date.now() + 5 * 86400000) :
        templateType.includes("j10") ? new Date(Date.now() + 10 * 86400000) : null,
    },
  });

  revalidatePath(`/opportunites/${opportunityId}`);
  revalidatePath("/pipeline");
  return { ...relance, label: getRelanceLabel(templateType) };
}

export async function markRelanceSent(id: string) {
  const relance = await prisma.relance.update({
    where: { id },
    data: { status: "envoye", date: new Date() },
  });

  revalidatePath(`/opportunites/${relance.opportunityId}`);
  revalidatePath("/pipeline");
  return relance;
}

export async function scheduleRelance(id: string, scheduledDate: string) {
  const relance = await prisma.relance.update({
    where: { id },
    data: { scheduledDate: new Date(scheduledDate) },
  });

  revalidatePath(`/opportunites/${relance.opportunityId}`);
  revalidatePath("/pipeline");
  return relance;
}

export async function getRelancesRetard() {
  return prisma.relance.findMany({
    where: {
      scheduledDate: { lt: new Date() },
      status: "a_envoyer",
    },
    include: {
      opportunity: { select: { title: true, company: true } },
    },
    orderBy: { scheduledDate: "asc" },
  });
}

export { getRelanceLabel, type RelanceTemplate };
