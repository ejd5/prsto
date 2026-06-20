"use server";

import { prisma } from "@/lib/prisma";
import { generateWithDeepSeek } from "@/lib/ai/deepseek";
import { getDraftDemoFilter } from "@/lib/jobs/demo-data";
import { revalidatePath } from "next/cache";

/* ─── Types ─────────────────────────────── */

export interface PipelineItem {
  id: string;
  jobId: string;
  status: string;
  pipelineStatus: string | null;
  matchScore: number | null;
  sentAt: string | null;
  followUpDueAt: string | null;
  followedUpAt: string | null;
  recruiterRepliedAt: string | null;
  interviewAt: string | null;
  lastPipelineActionAt: string | null;
  jobTitle: string;
  jobCompany: string | null;
  jobLocation: string | null;
  sourceUrl: string | null;
  sourceName: string | null;
  globalScore: number | null;
}

export interface PipelineStats {
  sent: number;
  toFollowUp: number;
  followedUp: number;
  recruiterReplied: number;
  interview: number;
  offer: number;
  rejected: number;
  archived: number;
  total: number;
}

export interface FollowUpMessages {
  emailCourt: string;
  messageLinkedin: string;
  relanceFormelle: string;
  relanceUltraCourte: string;
}

/*
 * pipelineStatus — valeurs stockées en base (ApplicationDraft.pipelineStatus) :
 *   sent, followed_up, recruiter_replied, interview, offer, rejected, archived
 *
 * "follow_up_due" et "toFollowUp" NE SONT JAMAIS stockés en base.
 * La colonne Kanban "À relancer" est calculée dynamiquement :
 *   pipelineStatus === "sent" AND followUpDueAt <= now
 *
 * Cela évite un cron ou une tâche planifiée : le calcul se fait à chaque lecture.
 */

/* ─── Query ──────────────────────────────── */

export async function getApplicationPipeline(opts?: { demoMode?: boolean }): Promise<{ items: PipelineItem[]; stats: PipelineStats }> {
  // demoMode: true  → uniquement les drafts [DEMO]
  // demoMode: false ou undefined → exclut les drafts [DEMO] (safe-by-default)
  const demoMode = opts?.demoMode ?? false;
  const draftWhere: Record<string, unknown> = {
    pipelineStatus: { not: null },
    ...getDraftDemoFilter(demoMode),
  };

  const drafts = await prisma.applicationDraft.findMany({
    where: draftWhere,
    include: {
      job: {
        include: {
          score: { select: { globalScore: true } },
          source: { select: { name: true } },
        },
      },
    },
    orderBy: { lastPipelineActionAt: "desc" },
  });

  const items: PipelineItem[] = drafts.map((d) => ({
    id: d.id,
    jobId: d.jobId,
    status: d.status,
    pipelineStatus: d.pipelineStatus,
    matchScore: d.matchScore,
    sentAt: d.sentAt?.toISOString() ?? null,
    followUpDueAt: d.followUpDueAt?.toISOString() ?? null,
    followedUpAt: d.followedUpAt?.toISOString() ?? null,
    recruiterRepliedAt: d.recruiterRepliedAt?.toISOString() ?? null,
    interviewAt: d.interviewAt?.toISOString() ?? null,
    lastPipelineActionAt: d.lastPipelineActionAt?.toISOString() ?? null,
    jobTitle: d.job.title,
    jobCompany: d.job.company,
    jobLocation: d.job.location,
    sourceUrl: d.job.sourceUrl,
    sourceName: d.job.source?.name ?? null,
    globalScore: d.job.score?.globalScore ?? d.matchScore ?? null,
  }));

  const now = new Date();
  const stats: PipelineStats = {
    sent: items.filter((i) => i.pipelineStatus === "sent" && (!i.followUpDueAt || new Date(i.followUpDueAt) > now)).length,
    toFollowUp: items.filter((i) => {
      if (i.pipelineStatus === "sent" && i.followUpDueAt && new Date(i.followUpDueAt) <= now) return true;
      return false;
    }).length,
    followedUp: items.filter((i) => i.pipelineStatus === "followed_up").length,
    recruiterReplied: items.filter((i) => i.pipelineStatus === "recruiter_replied").length,
    interview: items.filter((i) => i.pipelineStatus === "interview").length,
    offer: items.filter((i) => i.pipelineStatus === "offer").length,
    rejected: items.filter((i) => i.pipelineStatus === "rejected").length,
    archived: items.filter((i) => i.pipelineStatus === "archived").length,
    total: items.length,
  };

  return { items, stats };
}

/* ─── Helpers ────────────────────────────── */

async function updatePipeline(draftId: string, pipelineStatus: string, extra: Record<string, unknown> = {}) {
  const now = new Date();
  const nowISO = now.toISOString();

  const draft = await prisma.applicationDraft.findUnique({ where: { id: draftId } });
  if (!draft) return { success: false, error: "Dossier introuvable" };

  const existing = draft.changeLogJson ? JSON.parse(draft.changeLogJson) : [];
  existing.push({
    timestamp: nowISO,
    type: "pipeline",
    field: "pipelineStatus",
    summary: `Pipeline → ${pipelineStatus}`,
    actor: "user",
  });
  const changelog = existing.length > 50 ? existing.slice(existing.length - 50, existing.length) : existing;

  await prisma.applicationDraft.update({
    where: { id: draftId },
    data: {
      pipelineStatus,
      lastPipelineActionAt: now,
      changeLogJson: JSON.stringify(changelog),
      ...extra,
    } as Record<string, unknown>,
  });

  revalidatePath("/dashboard/jobs/pipeline");
  revalidatePath(`/dashboard/jobs/applications/${draftId}`);
  return { success: true, pipelineStatus };
}

/* ─── Actions pipeline ────────────────────── */

export async function markFollowedUp(draftId: string) {
  const now = new Date();
  return updatePipeline(draftId, "followed_up", { followedUpAt: now });
}

export async function markRecruiterReplied(draftId: string) {
  const now = new Date();
  return updatePipeline(draftId, "recruiter_replied", { recruiterRepliedAt: now });
}

export async function markInterviewScheduled(draftId: string, interviewAt?: string) {
  const extra: Record<string, unknown> = {};
  if (interviewAt) extra.interviewAt = new Date(interviewAt);
  return updatePipeline(draftId, "interview", extra);
}

export async function markOffer(draftId: string) {
  return updatePipeline(draftId, "offer");
}

export async function markRejected(draftId: string) {
  return updatePipeline(draftId, "rejected");
}

export async function archiveApplication(draftId: string) {
  return updatePipeline(draftId, "archived");
}

/* ─── Génération relance ─────────────────── */

export async function generateFollowUpMessage(
  draftId: string
): Promise<{ success: boolean; messages?: FollowUpMessages; error?: string }> {
  const draft = await prisma.applicationDraft.findUnique({
    where: { id: draftId },
    include: { job: true },
  });
  if (!draft || !draft.job) return { success: false, error: "Dossier introuvable" };

  const profile = await prisma.profile.findFirst();
  const candidateName = profile?.fullName || "Candidat";
  const job = draft.job;

  const context = `Poste : ${job.title}
Entreprise : ${job.company || "N/A"}
Localisation : ${job.location || "N/A"}
Candidat : ${candidateName}
Date d'envoi : ${draft.sentAt?.toISOString().split("T")[0] || "inconnue"}`;

  const prompt = `Tu es un expert en relance de candidature pour un cadre dirigeant.

Contexte :
${context}

Génère 4 versions de relance :

1. **Email court** : Email professionnel de suivi, cordial, 2-3 phrases. Rappelle le poste, demande poliment un retour.
2. **Message LinkedIn** : Message privé LinkedIn, 2-4 lignes, ton direct mais respectueux.
3. **Relance formelle** : Email formel, 3-4 paragraphes, structuré, pour un processus de recrutement corporate.
4. **Relance ultra courte** : 1-2 phrases maximum, percutant, pour un message rapide (WhatsApp/SMS pro).

RÈGLES :
- N'invente RIEN sur le candidat.
- Ne mentionne pas de compétences non vérifiées.
- Ton exécutif, confiant, pas désespéré.
- Propose de la valeur, ne supplie pas.
- En français.
- Format : retourne UNIQUEMENT les 4 textes, séparés par "---" sur une ligne.`;

  let messages: FollowUpMessages | null = null;

  const result = await generateWithDeepSeek({
    systemPrompt: "Tu es un assistant de relance de candidature pour cadres dirigeants. Retourne UNIQUEMENT les 4 messages demandés, séparés par ---.",
    userPrompt: prompt,
    temperature: 0.5,
    maxTokens: 3000,
  });

  if (result.success && result.content) {
    const parts = result.content.split(/\n---\n|^---$/m).map((p) => p.trim()).filter(Boolean);
    messages = {
      emailCourt: parts[0] || "",
      messageLinkedin: parts[1] || "",
      relanceFormelle: parts[2] || "",
      relanceUltraCourte: parts[3] || "",
    };
  }

  // Fallback local si DeepSeek indisponible ou échec
  if (!messages) {
    const entreprise = job.company || "votre entreprise";
    const poste = job.title;
    const dateEnvoi = draft.sentAt?.toISOString().split("T")[0] || "";
    const delai = dateEnvoi ? `, que j'ai adressée le ${dateEnvoi}` : "";

    messages = {
      emailCourt:
        `Bonjour,\n\nJe fais suite à ma candidature au poste de ${poste}${delai}.\n\n` +
        `Je reste très intéressé(e) par cette opportunité et je serais ravi(e) d'échanger avec vous pour en discuter.\n\n` +
        `Dans l'attente de votre retour, cordialement,\n${candidateName}`,

      messageLinkedin:
        `Bonjour,\n\n` +
        `Je me permets de vous recontacter au sujet de ma candidature pour le poste de ${poste}${delai}.\n` +
        `Je reste disponible pour échanger avec vous à votre convenance. Excellente journée !`,

      relanceFormelle:
        `Objet : Suivi de candidature — ${poste}\n\n` +
        `Madame, Monsieur,\n\n` +
        `Je me permets de revenir vers vous concernant ma candidature au poste de ${poste} au sein de ${entreprise}${delai}.\n\n` +
        `Ce poste correspond à mon projet professionnel et je suis convaincu(e) de pouvoir apporter une contribution significative à votre organisation.\n\n` +
        `Je me tiens à votre disposition pour un échange téléphonique ou un entretien afin de vous présenter plus en détail mon parcours et ma motivation.\n\n` +
        `Dans l'attente de votre retour, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.\n\n` +
        `${candidateName}`,

      relanceUltraCourte:
        `Bonjour, je fais suite à ma candidature pour ${poste}${delai}. Je reste très intéressé(e) et disponible pour échanger. Excellente journée.`,
    };
  }

  return { success: true, messages };
}

/* ─── Pipeline item unique ───────────────── */

export async function getPipelineItem(draftId: string): Promise<PipelineItem | null> {
  const draft = await prisma.applicationDraft.findUnique({
    where: { id: draftId },
    include: {
      job: {
        include: {
          score: { select: { globalScore: true } },
          source: { select: { name: true } },
        },
      },
    },
  });
  if (!draft || !draft.job) return null;

  return {
    id: draft.id,
    jobId: draft.jobId,
    status: draft.status,
    pipelineStatus: draft.pipelineStatus,
    matchScore: draft.matchScore,
    sentAt: draft.sentAt?.toISOString() ?? null,
    followUpDueAt: draft.followUpDueAt?.toISOString() ?? null,
    followedUpAt: draft.followedUpAt?.toISOString() ?? null,
    recruiterRepliedAt: draft.recruiterRepliedAt?.toISOString() ?? null,
    interviewAt: draft.interviewAt?.toISOString() ?? null,
    lastPipelineActionAt: draft.lastPipelineActionAt?.toISOString() ?? null,
    jobTitle: draft.job.title,
    jobCompany: draft.job.company,
    jobLocation: draft.job.location,
    sourceUrl: draft.job.sourceUrl,
    sourceName: draft.job.source?.name ?? null,
    globalScore: draft.job.score?.globalScore ?? draft.matchScore ?? null,
  };
}
