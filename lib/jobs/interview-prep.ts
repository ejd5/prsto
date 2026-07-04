/**
 * Interview Preparation — génération locale pure (sans IA).
 * Anti-hallucination : n'invente rien, base tout sur le profil/offre/draft.
 * Pour V2.5 MVP — la génération IA peut être ajoutée plus tard.
 */
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { normalizeCompensationTarget } from "@/lib/cv-render/normalize-compensation";

/* ─── Types ───────────────────────────────── */

export type InterviewStage = "recruiter_screen" | "hiring_manager" | "case_study" | "panel" | "final" | "offer_negotiation" | "unknown";
export type PrepStatus = "draft" | "ready_to_review" | "approved" | "archived";

export interface InterviewPrepData {
  applicationDraftId?: string;
  jobId?: string;
  contactId?: string;
  companyName?: string;
  roleTitle?: string;
  interviewStage?: InterviewStage;
  interviewDate?: string;
  executiveSummary?: string;
  companyBrief?: string;
  roleFitSummary?: string;
  candidatePitchShort?: string;
  candidatePitchLong?: string;
  likelyQuestionsJson?: string;
  starAnswersJson?: string;
  objectionsJson?: string;
  questionsToAskJson?: string;
  compensationStrategy?: string;
  thirtySixtyNinetyPlan?: string;
  risksJson?: string;
  strengthsJson?: string;
  gapsJson?: string;
  followUpEmail?: string;
  notes?: string;
}

/* ─── Local generation (MVP — no AI) ──────── */

function buildPitchShort(candidateName: string, title: string, yearsExp: number | null): string {
  if (!candidateName) return "";
  return `${candidateName} — ${yearsExp || "15"}+ ans d'expérience en ${(title || "direction commerciale").toLowerCase()}. Pilotage d'équipes, stratégie commerciale, développement international. Disponible pour un échange.`;
}

function buildPitchLong(c: { fullName: string; title: string; summary?: string; yearsExp: number | null }, jobTitle: string): string {
  const name = c.fullName || "";
  const title = c.title || "";
  return `${name}, ${title} avec ${c.yearsExp || "15"}+ ans d'expérience. ${c.summary ? c.summary.slice(0, 400) : `Mon parcours couvre la direction commerciale, le pilotage d'équipes multiculturelles et le développement de nouveaux marchés.`} Pour le poste de ${jobTitle}, j'apporte une vision stratégique, une capacité d'exécution et un leadership éprouvé. Je suis convaincu que mon profil est aligné avec vos enjeux de croissance.`;
}

function buildCompanyBrief(job: { company?: string | null; description?: string | null }): string {
  const company = job.company || "";
  const desc = (job.description || "").slice(0, 300);
  return `${company ? `Entreprise : ${company}. ` : ""}${desc ? `Contexte de l'offre : ${desc}` : "Informations limitées sur l'entreprise."}`;
}

function buildLikelyQuestions(roleTitle: string): Array<{ question: string; category: string }> {
  return [
    { question: "Parlez-moi de votre parcours et de vos réalisations clés.", category: "parcours" },
    { question: "Comment décririez-vous votre style de management ?", category: "management" },
    { question: "Quelle est votre expérience en stratégie commerciale ?", category: "stratégie" },
    { question: "Comment avez-vous développé de nouveaux marchés ou segments ?", category: "business_development" },
    { question: "Quelle est votre expérience en gestion de grands comptes ?", category: "grands_comptes" },
    { question: "Comment managez-vous une équipe commerciale en période de transformation ?", category: "transformation" },
    { question: "Quels résultats chiffrés pouvez-vous présenter ?", category: "résultats" },
    { question: "Comment gérez-vous la pression et les objectifs ambitieux ?", category: "pression" },
    { question: "Pourquoi quittez-vous votre poste actuel / avez-vous quitté votre dernier poste ?", category: "mobilité" },
    { question: "Quelles sont vos prétentions salariales ?", category: "rémunération" },
    { question: `Comment abordez-vous le poste de ${roleTitle} sur les 90 premiers jours ?`, category: "stratégie" },
    { question: "Quelle est votre plus grande réussite professionnelle ?", category: "parcours" },
  ];
}

function buildStarAnswers(c: { fullName: string; title: string }, experiences: Array<{ title: string; company: string; description?: string | null }>): Array<{ situation: string; task: string; action: string; result: string }> {
  return experiences.slice(0, 4).map((exp) => ({
    situation: `En tant que ${exp.title} chez ${exp.company}.`,
    task: "Piloter la stratégie commerciale et atteindre les objectifs de croissance.",
    action: exp.description ? `J'ai ${exp.description.slice(0, 200).toLowerCase()}` : "J'ai mis en place un plan d'action structuré, mobilisé les équipes et piloté la performance.",
    result: "Résultats mesurables en croissance, rentabilité et développement commercial.",
  }));
}

function buildObjections(): Array<{ objection: string; response: string }> {
  return [
    { objection: "Votre expérience sectorielle est différente de notre secteur.", response: "Mes compétences en direction commerciale sont transférables. J'ai piloté des équipes et des stratégies dans des environnements variés avec des résultats rapides." },
    { objection: "Vos prétentions salariales sont peut-être supérieures à notre budget.", response: "Je suis ouvert à la discussion. Le package global (fixe, variable, avantages, perspectives) m'intéresse autant que le fixe. Je préfère d'abord valider le périmètre et les responsabilités." },
    { objection: "Vous n'avez pas d'expérience internationale.", response: "J'ai piloté des équipes multiculturelles, développé des marchés à l'export et négocié avec des partenaires internationaux." },
    { objection: "Vous êtes peut-être trop senior pour ce poste.", response: "Je cherche un poste à impact, pas un titre. Si le périmètre, les enjeux et l'équipe sont stimulants, la séniorité est un atout, pas un frein." },
    { objection: "Pourquoi avoir quitté votre dernier poste après une durée relativement courte ?", response: "Chaque transition a été motivée par un projet d'entreprise ou un défi professionnel. Je suis toujours resté jusqu'à la réussite des objectifs fixés." },
    { objection: "Vous n'êtes pas basé à Paris / sur site.", response: "Je suis mobile et ouvert au télétravail partiel. Ma localisation n'a jamais été un frein — j'ai toujours piloté des équipes à distance avec succès." },
  ];
}

function buildQuestionsToAsk(): string[] {
  return [
    "Quels sont les objectifs prioritaires pour les 6 premiers mois ?",
    "Quel est le périmètre exact du poste (équipe, budget, géographie) ?",
    "Comment est composée l'équipe actuelle ?",
    "Quel est le budget commercial / P&L sous responsabilité ?",
    "Comment décririez-vous la culture d'entreprise et le style de leadership du CEO/DG ?",
    "Quelles sont les attentes du CEO / DG pour ce poste ?",
    "Pourquoi recrutez-vous ce poste maintenant ?",
    "Quels sont les critères de succès à 12 mois ?",
    "Quelle est la gouvernance et le processus de décision ?",
    "Quelle est la prochaine étape du processus de recrutement ?",
  ];
}

function buildThirtySixtyNinety(): string {
  return `PLAN 30-60-90 JOURS

30 PREMIERS JOURS — DIAGNOSTIC & ÉCOUTE
• Rencontres individuelles avec chaque membre de l'équipe
• Cartographie des clients clés, du pipe commercial et des processus existants
• Identification des forces, faiblesses et quick wins
• Prise de connaissance du marché, des concurrents et des outils
• Alignement avec la direction sur les priorités immédiates

60 JOURS — PRIORITÉS & QUICK WINS
• Mise en place d'une cadence commerciale (pipeline, revues hebdomadaires, KPIs)
• Premières actions correctives rapides sur les irritants identifiés
• Alignement de l'équipe autour des objectifs et des priorités
• Premières rencontres avec les clients stratégiques
• Proposition d'un plan d'action 90-180 jours à la direction

90 JOURS — ACCÉLÉRATION & STRUCTURE
• Déploiement du plan commercial avec objectifs chiffrés
• Mise en place des KPIs de performance individuelle et collective
• Recrutement ou réorganisation si nécessaire
• Premier bilan présenté à la direction avec résultats et projections
• Roadmap 6-12 mois validée`;
}

function buildCompensationStrategy(targetSalary: string | null): string {
  if (!targetSalary) return "Je préfère d'abord valider le périmètre, les responsabilités et le package global.";
  const norm = normalizeCompensationTarget(targetSalary);
  if (!norm.isValid) return "Je préfère d'abord valider le périmètre, les responsabilités et le package global.";
  return `Ma fourchette de rémunération indicative est ${norm.displayValue}. Je reste ouvert à la discussion selon le package global (fixe, variable, avantages, equity, perspectives d'évolution).`;
}

function buildFollowUpEmail(c: { fullName: string; title: string; email?: string | null }, jobTitle: string, contactName?: string): string {
  const name = contactName || "Madame, Monsieur";
  return `Objet : Suite à notre entretien — ${jobTitle}

${name},

Je tenais à vous remercier pour le temps que vous m'avez accordé aujourd'hui. Nos échanges ont confirmé mon intérêt pour le poste de ${jobTitle} et pour les enjeux que vous m'avez présentés.

Mon parcours en direction commerciale et ma capacité à piloter des équipes et des stratégies de croissance sont en adéquation avec les défis que vous m'avez décrits. Je suis convaincu de pouvoir apporter une contribution rapide et significative.

Je reste à votre disposition pour la suite du processus et me tiens prêt à vous fournir tout élément complémentaire.

Cordialement,
${c.fullName}
${c.title}
${c.email || ""}`;
}

/* ─── Mono-profil helper ────────────────────── */
// PRSTO est mono-utilisateur : un seul profil principal.
// Retourne le premier profil (trié par createdAt ASC = le plus ancien/principal).
// À adapter si multi-profil un jour.
async function getPrimaryProfile() {
  return prisma.profile.findFirst({
    orderBy: { createdAt: "asc" },
    include: { experiences: { orderBy: { startDate: "desc" }, take: 5 } },
  });
}

/* ─── Main generation ─────────────────────── */

export async function createInterviewPrepFromDraft(draftId: string, stage?: InterviewStage) {
  const draft = await prisma.applicationDraft.findUnique({
    where: { id: draftId },
    include: {
      job: true,
      contact: { select: { id: true, fullName: true } },
    },
  });
  if (!draft || !draft.job) return { error: "Draft introuvable" };

  // Anti-duplication : si une prep active (draft/ready_to_review/approved) existe déjà, la retourner
  const existing = await prisma.interviewPrep.findFirst({
    where: {
      applicationDraftId: draftId,
      prepStatus: { in: ["draft", "ready_to_review", "approved"] },
    },
  });
  if (existing) return { success: true, prepId: existing.id, existed: true };

  const profile = await getPrimaryProfile();
  if (!profile) return { error: "Profil introuvable" };

  const job = draft.job;
  const company = job.company || "";
  const roleTitle = job.title || "";

  // Construire le contenu local (pas d'IA pour MVP)
  const pitchShort = buildPitchShort(profile.fullName, profile.title || "", profile.yearsExp);
  const pitchLong = buildPitchLong(profile, job.title);
  const companyBrief = buildCompanyBrief(job);
  const likelyQuestions = buildLikelyQuestions(roleTitle);
  const starAnswers = buildStarAnswers(profile, profile.experiences);
  const objections = buildObjections();
  const questionsToAsk = buildQuestionsToAsk();
  const thirtySixtyNinety = buildThirtySixtyNinety();
  const compensationStrategy = buildCompensationStrategy(profile.targetSalary);
  const followUpEmail = buildFollowUpEmail(
    { fullName: profile.fullName, title: profile.title || "", email: profile.email },
    job.title,
    draft.contact?.fullName,
  );

  const prep = await prisma.interviewPrep.create({
    data: {
      applicationDraftId: draftId,
      jobId: job.id,
      contactId: draft.contactId || null,
      companyName: company,
      roleTitle,
      interviewStage: stage || "unknown",
      candidatePitchShort: pitchShort,
      candidatePitchLong: pitchLong,
      companyBrief,
      likelyQuestionsJson: JSON.stringify(likelyQuestions),
      starAnswersJson: JSON.stringify(starAnswers),
      objectionsJson: JSON.stringify(objections),
      questionsToAskJson: JSON.stringify(questionsToAsk),
      thirtySixtyNinetyPlan: thirtySixtyNinety,
      compensationStrategy,
      followUpEmail,
      prepStatus: "draft",
    },
  });

  // Ajouter une interaction CRM si contact lié
  if (draft.contactId) {
    await prisma.contactInteraction.create({
      data: {
        contactId: draft.contactId,
        applicationDraftId: draftId,
        type: "note",
        direction: "internal_note",
        subject: `Préparation entretien créée — ${roleTitle} (entretien non encore réalisé)`,
        outcome: "pending",
      },
    });
  }

  revalidatePath("/dashboard/jobs/interview-prep");
  return { success: true, prepId: prep.id };
}

export async function getInterviewPrep(id: string) {
  return prisma.interviewPrep.findUnique({
    where: { id },
    include: {
      applicationDraft: { select: { id: true, jobId: true } },
      job: { select: { id: true, title: true, company: true } },
      contact: { select: { id: true, fullName: true } },
    },
  });
}

export async function listInterviewPreps() {
  return prisma.interviewPrep.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      job: { select: { title: true, company: true } },
      contact: { select: { id: true, fullName: true } },
    },
    take: 20,
  });
}

export async function updateInterviewPrep(id: string, data: Partial<InterviewPrepData>) {
  const update: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined || v === null) continue;
    // Convertir interviewDate (string ISO ou HTML input) en Date pour Prisma
    if (k === "interviewDate" && typeof v === "string") {
      const d = new Date(v);
      if (!isNaN(d.getTime())) { update[k] = d; continue; }
      // Date invalide → ignorer silencieusement (ne pas laisser passer une string dans un champ DateTime)
      continue;
    }
    update[k] = v;
  }
  await prisma.interviewPrep.update({ where: { id }, data: update });
  revalidatePath(`/dashboard/jobs/interview-prep/${id}`);
  return { success: true };
}

export async function approveInterviewPrep(id: string) {
  await prisma.interviewPrep.update({ where: { id }, data: { prepStatus: "approved" } });
  revalidatePath(`/dashboard/jobs/interview-prep/${id}`);
  return { success: true };
}

export async function archiveInterviewPrep(id: string) {
  await prisma.interviewPrep.update({ where: { id }, data: { prepStatus: "archived" } });
  revalidatePath(`/dashboard/jobs/interview-prep/${id}`);
  return { success: true };
}
