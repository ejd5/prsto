"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/* ─── Types ───────────────────────────────── */

export type ContactType =
  | "recruiter" | "headhunter" | "hiring_manager" | "hr"
  | "founder" | "executive" | "network" | "unknown";

export type InteractionType =
  | "email" | "linkedin_message" | "phone_call" | "meeting"
  | "interview" | "note" | "follow_up" | "intro" | "other";

export type InteractionDirection = "inbound" | "outbound" | "internal_note";

export type InteractionOutcome = "positive" | "neutral" | "negative" | "pending";

export interface CrmContactData {
  fullName: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  roleTitle?: string;
  companyName?: string;
  firmName?: string;
  contactType: ContactType;
  source?: string;
  location?: string;
  notes?: string;
  tagsJson?: string;
  relationshipStrength?: string;
  nextFollowUpAt?: string;
}

export interface CompanyTargetData {
  name: string;
  website?: string;
  linkedinUrl?: string;
  sector?: string;
  size?: string;
  location?: string;
  targetPriority?: number;
  notes?: string;
  tagsJson?: string;
}

export interface InteractionData {
  contactId?: string;
  companyTargetId?: string;
  applicationDraftId?: string;
  jobId?: string;
  type: InteractionType;
  direction: InteractionDirection;
  subject?: string;
  body?: string;
  outcome?: InteractionOutcome;
  occurredAt?: string;
  nextActionAt?: string;
}

/* ─── Contacts ────────────────────────────── */

export async function listCrmContacts(search?: string) {
  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { fullName: { contains: search } },
      { companyName: { contains: search } },
      { firmName: { contains: search } },
    ];
  }
  return prisma.recruiterContact.findMany({
    orderBy: { updatedAt: "desc" },
    where,
    include: { _count: { select: { interactions: true, drafts: true } } },
  });
}

export async function getCrmContact(id: string) {
  return prisma.recruiterContact.findUnique({
    where: { id },
    include: {
      interactions: { orderBy: { occurredAt: "desc" }, take: 20,
        include: { applicationDraft: { select: { id: true } }, job: { select: { id: true, title: true, company: true } } },
      },
      drafts: { select: { id: true, status: true, pipelineStatus: true, job: { select: { title: true, company: true } } } },
    },
  });
}

export async function upsertCrmContact(data: CrmContactData, id?: string) {
  const payload = {
    fullName: data.fullName,
    firstName: data.firstName || data.fullName.split(" ")[0],
    lastName: data.lastName || data.fullName.split(" ").slice(1).join(" "),
    email: data.email, phone: data.phone, linkedinUrl: data.linkedinUrl,
    roleTitle: data.roleTitle, companyName: data.companyName, firmName: data.firmName,
    contactType: data.contactType, source: data.source, location: data.location,
    notes: data.notes, tagsJson: data.tagsJson, relationshipStrength: data.relationshipStrength,
    nextFollowUpAt: data.nextFollowUpAt ? new Date(data.nextFollowUpAt) : undefined,
  };
  if (id) {
    const result = await prisma.recruiterContact.update({ where: { id }, data: payload });
    revalidatePath("/dashboard/jobs/crm");
    return result;
  }
  const result = await prisma.recruiterContact.create({ data: payload });
  revalidatePath("/dashboard/jobs/crm");
  return result;
}

export async function deleteCrmContact(id: string) {
  await prisma.recruiterContact.delete({ where: { id } });
  revalidatePath("/dashboard/jobs/crm");
  return { success: true };
}

export async function linkContactToDraft(contactId: string, draftId: string) {
  await prisma.applicationDraft.update({ where: { id: draftId }, data: { contactId } });
  // Auto-create an intro interaction
  await prisma.contactInteraction.create({
    data: {
      contactId, applicationDraftId: draftId,
      type: "intro", direction: "outbound", subject: "Candidature liée",
      outcome: "pending",
    },
  });
  revalidatePath("/dashboard/jobs/crm");
  return { success: true };
}

/* ─── Company Targets ─────────────────────── */

export async function listCompanyTargets() {
  return prisma.companyTarget.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { interactions: true } } },
  });
}

export async function upsertCompanyTarget(data: CompanyTargetData, id?: string) {
  const payload = {
    name: data.name, website: data.website, linkedinUrl: data.linkedinUrl,
    sector: data.sector, size: data.size, location: data.location,
    targetPriority: data.targetPriority, notes: data.notes, tagsJson: data.tagsJson,
  };
  if (id) {
    const result = await prisma.companyTarget.update({ where: { id }, data: payload });
    revalidatePath("/dashboard/jobs/crm");
    return result;
  }
  const result = await prisma.companyTarget.create({ data: payload });
  revalidatePath("/dashboard/jobs/crm");
  return result;
}

/* ─── Interactions ────────────────────────── */

export async function listInteractions(contactId?: string, draftId?: string) {
  const where: Record<string, unknown> = {};
  if (contactId) where.contactId = contactId;
  if (draftId) where.applicationDraftId = draftId;
  return prisma.contactInteraction.findMany({
    where, orderBy: { occurredAt: "desc" }, take: 50,
    include: {
      contact: { select: { id: true, fullName: true } },
      applicationDraft: { select: { id: true } },
      job: { select: { id: true, title: true, company: true } },
    },
  });
}

export async function addInteraction(data: InteractionData) {
  const result = await prisma.contactInteraction.create({
    data: {
      contactId: data.contactId || null,
      companyTargetId: data.companyTargetId || null,
      applicationDraftId: data.applicationDraftId || null,
      jobId: data.jobId || null,
      type: data.type, direction: data.direction,
      subject: data.subject, body: data.body,
      outcome: data.outcome || "pending",
      occurredAt: data.occurredAt ? new Date(data.occurredAt) : new Date(),
      nextActionAt: data.nextActionAt ? new Date(data.nextActionAt) : undefined,
    },
  });
  // Update lastContactedAt on contact
  if (data.contactId) {
    await prisma.recruiterContact.update({
      where: { id: data.contactId },
      data: { lastContactedAt: new Date() },
    });
  }
  revalidatePath("/dashboard/jobs/crm");
  return result;
}

/* ─── Follow-ups ──────────────────────────── */

export async function getCrmFollowUpsDue() {
  const now = new Date();
  const endOfWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [dueNow, upcoming, silent] = await Promise.all([
    prisma.recruiterContact.findMany({
      where: { nextFollowUpAt: { lte: now } },
      orderBy: { nextFollowUpAt: "asc" },
      take: 10,
    }),
    prisma.recruiterContact.findMany({
      where: { nextFollowUpAt: { gt: now, lte: endOfWeek } },
      orderBy: { nextFollowUpAt: "asc" },
      take: 10,
    }),
    prisma.recruiterContact.findMany({
      where: {
        lastContactedAt: { lt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) },
        nextFollowUpAt: null,
      },
      orderBy: { lastContactedAt: "asc" },
      take: 10,
    }),
  ]);

  return {
    dueNow: dueNow.map(formatContactCard),
    upcoming: upcoming.map(formatContactCard),
    silent: silent.map(formatContactCard),
    totalDue: dueNow.length,
    totalThisWeek: dueNow.length + upcoming.length,
  };
}

function formatContactCard(c: {
  id: string; fullName: string; contactType: string; companyName: string | null;
  firmName: string | null; lastContactedAt: Date | null; nextFollowUpAt: Date | null;
  relationshipStrength: string | null;
}) {
  return {
    id: c.id,
    fullName: c.fullName,
    contactType: c.contactType,
    companyName: c.companyName,
    firmName: c.firmName,
    lastContactedAt: c.lastContactedAt?.toISOString() || null,
    nextFollowUpAt: c.nextFollowUpAt?.toISOString() || null,
    relationshipStrength: c.relationshipStrength,
  };
}

/* ─── Dashboard summary ───────────────────── */

export async function getCrmDashboardSummary() {
  const [contactCount, interactionsThisMonth, followUps, targets] = await Promise.all([
    prisma.recruiterContact.count(),
    prisma.contactInteraction.count({
      where: { occurredAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
    }),
    getCrmFollowUpsDue(),
    prisma.companyTarget.count(),
  ]);
  return { contactCount, interactionsThisMonth, followUps, targetCount: targets };
}

/* ─── Generate follow-up message (local, no AI) ── */

export async function generateFollowUpMessage(contactId: string, context: string) {
  const contact = await prisma.recruiterContact.findUnique({ where: { id: contactId } });
  if (!contact) return { error: "Contact introuvable" };

  const ctx = context || "candidature";
  const name = contact.firstName || contact.fullName.split(" ")[0];
  const messages: Record<string, string> = {
    candidature: `Bonjour ${name},\n\nJe fais suite à ma candidature et reste à votre disposition pour un échange.\n\nCordialement,\nELTON DUARTE`,
    relance: `Bonjour ${name},\n\nJe me permets de vous relancer concernant notre dernier échange. Je suis toujours très intéressé par l'opportunité et disponible pour en discuter.\n\nCordialement,\nELTON DUARTE`,
    entretien: `Bonjour ${name},\n\nSuite à notre entretien, je tenais à vous remercier pour votre temps et nos échanges. Je reste à votre disposition pour la suite du processus.\n\nCordialement,\nELTON DUARTE`,
    reseau: `Bonjour ${name},\n\nJ'espère que vous allez bien. Je souhaitais prendre de vos nouvelles et échanger sur vos projets en cours. N'hésitez pas si je peux vous être utile.\n\nCordialement,\nELTON DUARTE`,
  };
  const message = messages[ctx] || messages.relance;
  return { message };
}

/* ─── Add interaction from draft ──────────── */

export async function addInteractionFromDraft(draftId: string, data: InteractionData) {
  const draft = await prisma.applicationDraft.findUnique({ where: { id: draftId } });
  if (!draft) return { error: "Draft introuvable" };
  const interaction = await prisma.contactInteraction.create({
    data: {
      contactId: data.contactId || draft.contactId || null,
      applicationDraftId: draftId,
      jobId: data.jobId || draft.jobId || null,
      type: data.type, direction: data.direction,
      subject: data.subject, body: data.body,
      outcome: data.outcome || "pending",
      occurredAt: data.occurredAt ? new Date(data.occurredAt) : new Date(),
      nextActionAt: data.nextActionAt ? new Date(data.nextActionAt) : undefined,
    },
  });
  if (draft.contactId) {
    await prisma.recruiterContact.update({ where: { id: draft.contactId }, data: { lastContactedAt: new Date() } });
  }
  revalidatePath("/dashboard/jobs/crm");
  return { success: true, interactionId: interaction.id };
}

export async function getDraftInteractions(draftId: string) {
  return prisma.contactInteraction.findMany({
    where: { applicationDraftId: draftId },
    orderBy: { occurredAt: "desc" },
    include: { contact: { select: { id: true, fullName: true } } },
    take: 20,
  });
}

/* ─── Create contact from draft ───────────── */

export async function createContactFromDraft(draftId: string, overrides?: Partial<CrmContactData>) {
  const draft = await prisma.applicationDraft.findUnique({
    where: { id: draftId },
    include: { job: { select: { title: true, company: true } } },
  });
  if (!draft || !draft.job) return { error: "Draft introuvable" };

  const cabinetDetected = draft.job.company
    ? /executive search|cabinet|recrutement|recruitment|chasse/i.test(draft.job.company)
    : false;

  const contact = await prisma.recruiterContact.create({
    data: {
      fullName: overrides?.fullName || `Contact — ${draft.job.company || "inconnue"}`,
      companyName: overrides?.companyName || draft.job.company || undefined,
      firmName: overrides?.firmName || (cabinetDetected ? draft.job.company : undefined),
      contactType: overrides?.contactType || (cabinetDetected ? "headhunter" : "recruiter"),
      notes: overrides?.notes || `Contact créé depuis la candidature : ${draft.job.title}`,
      source: overrides?.source || "application_draft",
    },
  });

  await prisma.applicationDraft.update({ where: { id: draftId }, data: { contactId: contact.id } });
  revalidatePath("/dashboard/jobs/crm");
  return { success: true, contactId: contact.id };
}

/* ─── Dedup contact ───────────────────────── */

export async function checkContactDuplicate(email?: string, linkedinUrl?: string, fullName?: string, companyName?: string) {
  if (email) {
    const byEmail = await prisma.recruiterContact.findFirst({ where: { email } });
    if (byEmail) return { isDuplicate: true, existingId: byEmail.id };
  }
  if (linkedinUrl) {
    const byLinkedin = await prisma.recruiterContact.findFirst({ where: { linkedinUrl } });
    if (byLinkedin) return { isDuplicate: true, existingId: byLinkedin.id };
  }
  if (fullName && companyName) {
    const byNameAndCompany = await prisma.recruiterContact.findFirst({ where: { fullName, companyName } });
    if (byNameAndCompany) return { isDuplicate: true, existingId: byNameAndCompany.id };
  }
  return { isDuplicate: false };
}

/* ─── CRM Demo data ───────────────────────── */

export async function createCrmDemoData() {
  const demoContacts = await prisma.recruiterContact.findMany({ where: { notes: { startsWith: "[DEMO]" } } });
  for (const c of demoContacts) {
    await prisma.contactInteraction.deleteMany({ where: { contactId: c.id } });
    await prisma.recruiterContact.delete({ where: { id: c.id } });
  }
  await prisma.companyTarget.deleteMany({ where: { notes: { startsWith: "[DEMO]" } } });

  const c1 = await prisma.recruiterContact.create({
    data: { fullName: "[DEMO] Sophie Martin", contactType: "headhunter", firmName: "Michael Page Executive", companyName: "Michael Page", email: "sophie.martin@michaelpage.fr", roleTitle: "Senior Partner", relationshipStrength: "active", notes: "[DEMO] Cabinet de recrutement executive", nextFollowUpAt: new Date(Date.now() + 2 * 86400000) },
  });
  const c2 = await prisma.recruiterContact.create({
    data: { fullName: "[DEMO] Laurent Dubois", contactType: "recruiter", companyName: "LVMH", roleTitle: "Talent Acquisition Director", email: "laurent.dubois@lvmh.fr", relationshipStrength: "new", notes: "[DEMO] Recruteur corporate luxury", lastContactedAt: new Date(Date.now() - 20 * 86400000) },
  });
  const c3 = await prisma.recruiterContact.create({
    data: { fullName: "[DEMO] Claire Morel", contactType: "network", companyName: "Schneider Electric", roleTitle: "VP HR France", linkedinUrl: "https://linkedin.com/in/clairemorel", relationshipStrength: "strong", notes: "[DEMO] Contact réseau", nextFollowUpAt: new Date() },
  });

  await prisma.companyTarget.create({ data: { name: "[DEMO] LVMH", sector: "Luxury", size: "grand_groupe", targetPriority: 1, notes: "[DEMO]" } });
  await prisma.companyTarget.create({ data: { name: "[DEMO] Schneider Electric", sector: "Industrie", size: "grand_groupe", targetPriority: 2, notes: "[DEMO]" } });

  await prisma.contactInteraction.create({ data: { contactId: c1.id, type: "phone_call", direction: "outbound", subject: "Prise de contact", body: "Appel avec Sophie — poste Directeur Commercial.", outcome: "positive" } });
  await prisma.contactInteraction.create({ data: { contactId: c1.id, type: "email", direction: "outbound", subject: "Envoi candidature", body: "CV et lettre envoyés.", outcome: "pending" } });
  await prisma.contactInteraction.create({ data: { contactId: c2.id, type: "linkedin_message", direction: "inbound", subject: "Sollicitation LVMH", body: "Laurent m'a contacté pour un poste.", outcome: "positive" } });
  await prisma.contactInteraction.create({ data: { contactId: c3.id, type: "meeting", direction: "outbound", subject: "Déjeuner réseau", body: "Discussion opportunités marché.", outcome: "positive" } });
  await prisma.contactInteraction.create({ data: { contactId: c2.id, type: "note", direction: "internal_note", subject: "Relance prévue", body: "Relancer Laurent si pas de retour.", outcome: "neutral" } });

  return { contacts: 3, targets: 2, interactions: 5 };
}

export async function deleteCrmDemoData() {
  const demoContacts = await prisma.recruiterContact.findMany({ where: { notes: { startsWith: "[DEMO]" } } });
  let count = 0;
  for (const c of demoContacts) {
    await prisma.contactInteraction.deleteMany({ where: { contactId: c.id } });
    await prisma.recruiterContact.delete({ where: { id: c.id } });
    count++;
  }
  await prisma.companyTarget.deleteMany({ where: { notes: { startsWith: "[DEMO]" } } });
  return { contacts: count };
}
