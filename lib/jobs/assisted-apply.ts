"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface FieldSuggestion {
  fieldName: string;
  fieldType: "text" | "textarea" | "email" | "tel" | "file" | "select";
  suggestedValue: string;
  confidence: number;
  missing: boolean;
}

export interface AssistedApplyResult {
  sessionId: string;
  status: string;
  sourceUrl: string | null;
  jobTitle: string;
  jobCompany: string;
  fields: FieldSuggestion[];
  warnings: string[];
  error?: string;
}

export async function startAssistedApply(draftId: string): Promise<AssistedApplyResult> {
  const draft = await prisma.applicationDraft.findUnique({
    where: { id: draftId },
    include: { job: { include: { source: { select: { name: true } } } } },
  });
  if (!draft || !draft.job) return { sessionId: "", status: "failed", sourceUrl: null, jobTitle: "", jobCompany: "", fields: [], warnings: [], error: "Dossier introuvable" };
  if (draft.status !== "approved") return { sessionId: "", status: "failed", sourceUrl: null, jobTitle: "", jobCompany: "", fields: [], warnings: [], error: "Le dossier doit etre approuve avant l'assistance." };
  if (!draft.job.sourceUrl) return { sessionId: "", status: "failed", sourceUrl: null, jobTitle: "", jobCompany: "", fields: [], warnings: [], error: "Aucune URL source." };

  const profile = await prisma.profile.findFirst();
  const cName = profile?.fullName || "";
  const cFirstName = cName.split(" ")[0] || "";
  const cLastName = cName.split(" ").slice(1).join(" ") || "";
  const cEmail = profile?.email || "";
  const cPhone = profile?.phone || "";
  const cLoc = profile?.location || "";
  const cLi = profile?.linkedin || "";
  const cSalary = profile?.targetSalary || "";

  const fields: FieldSuggestion[] = [];
  const warnings: string[] = [];

  // Tous les champs, même vides
  const allFields: { name: string; type: FieldSuggestion["fieldType"]; value: string }[] = [
    { name: "fullName", type: "text", value: cName },
    { name: "firstName", type: "text", value: cFirstName },
    { name: "lastName", type: "text", value: cLastName },
    { name: "email", type: "email", value: cEmail },
    { name: "phone", type: "tel", value: cPhone },
    { name: "location", type: "text", value: cLoc },
    { name: "linkedin", type: "text", value: cLi },
    { name: "salaryExpectations", type: "text", value: cSalary },
    { name: "availability", type: "text", value: "A definir selon vos besoins" },
    { name: "coverLetter", type: "textarea", value: draft.motivationLetterLong || "" },
    { name: "recruiterMessage", type: "textarea", value: draft.recruiterMessage || "" },
  ];

  for (const f of allFields) {
    const missing = !f.value;
    if (missing && f.name !== "availability") {
      warnings.push(`${f.name} non renseigne.`);
    }
    fields.push({
      fieldName: f.name, fieldType: f.type,
      suggestedValue: missing && f.name === "availability" ? f.value : (f.value || "A completer"),
      confidence: missing ? 0 : 85,
      missing,
    });
  }

  // Reponses ATS
  let atsAnswers: { question: string; answer: string }[] = [];
  if (draft.atsFormAnswers) {
    try { atsAnswers = JSON.parse(draft.atsFormAnswers); } catch { /* ignore */ }
  }
  for (const aa of atsAnswers) {
    fields.push({
      fieldName: aa.question, fieldType: "textarea",
      suggestedValue: aa.answer.slice(0, 2000),
      confidence: 80, missing: false,
    });
  }

  const session = await prisma.assistedApplySession.upsert({
    where: { applicationDraftId: draftId },
    create: {
      applicationDraftId: draftId, jobId: draft.jobId,
      sourceUrl: draft.job.sourceUrl,
      platform: draft.job.source?.name?.toLowerCase() || null,
      status: "ready_for_user",
      detectedFieldsJson: JSON.stringify(fields.map(f => ({ name: f.fieldName, type: f.fieldType }))),
      suggestedAnswersJson: JSON.stringify(fields),
      warningsJson: JSON.stringify(warnings),
    },
    update: {
      status: "ready_for_user",
      detectedFieldsJson: JSON.stringify(fields.map(f => ({ name: f.fieldName, type: f.fieldType }))),
      suggestedAnswersJson: JSON.stringify(fields),
      warningsJson: JSON.stringify(warnings),
    },
  });

  return {
    sessionId: session.id, status: "ready_for_user",
    sourceUrl: draft.job.sourceUrl,
    jobTitle: draft.job.title, jobCompany: draft.job.company || "",
    fields, warnings,
  };
}

export async function markAsSent(draftId: string) {
  const draft = await prisma.applicationDraft.findUnique({ where: { id: draftId } });
  if (!draft) return { success: false, error: "Dossier introuvable" };
  if (draft.status !== "approved") return { success: false, error: "Le dossier doit etre approuve avant de pouvoir le marquer comme envoye." };

  // Marquer le draft + pipeline
  const now = new Date();
  const nowISO = now.toISOString();
  const followUpDue = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const existing = draft.changeLogJson ? JSON.parse(draft.changeLogJson) : [];
  existing.push({ timestamp: nowISO, type: "status_change", field: "status", summary: "Candidature envoyee par l'utilisateur", actor: "user" });
  existing.push({ timestamp: nowISO, type: "pipeline", field: "pipelineStatus", summary: "Entree dans le pipeline — sent", actor: "user" });
  const changelog = existing.length > 50 ? existing.slice(existing.length - 50, existing.length) : existing;

  await prisma.applicationDraft.update({
    where: { id: draftId },
    data: {
      status: "sent",
      pipelineStatus: "sent",
      sentAt: now,
      followUpDueAt: followUpDue,
      lastPipelineActionAt: now,
      changeLogJson: JSON.stringify(changelog),
    },
  });

  // Marquer la session
  await prisma.assistedApplySession.updateMany({
    where: { applicationDraftId: draftId },
    data: { status: "completed" },
  });

  revalidatePath(`/dashboard/jobs/applications/${draftId}`);
  revalidatePath("/dashboard/jobs/pipeline");
  return { success: true, status: "sent" };
}

export async function getAssistedSession(draftId: string) {
  const session = await prisma.assistedApplySession.findUnique({
    where: { applicationDraftId: draftId },
  });
  if (!session) return null;
  return {
    id: session.id, status: session.status, sourceUrl: session.sourceUrl,
    fields: safeParse(session.suggestedAnswersJson),
    warnings: safeParse(session.warningsJson),
  };
}

function safeParse(v: string | null): unknown[] {
  if (!v) return [];
  try { return JSON.parse(v); } catch { return []; }
}
