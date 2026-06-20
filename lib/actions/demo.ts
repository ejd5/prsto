"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const TAG = "[DEMO]";

/*
 * Sécurité : TOUTES les données créées ici commencent par TAG dans leur
 * titre/nom/externalId/email. deleteDemoData() ne supprime que les objets
 * portant TAG. Les vraies données sont INTACTES.
 */

/* ─── Types ─────────────────────────────── */

export interface DemoStatus {
  demoJobsCount: number;
  demoDraftsCount: number;
  demoPipelineCount: number;
  demoSentCount: number;
  demoToFollowUpCount: number;
  demoRepliedCount: number;
  demoInterviewCount: number;
  demoOfferCount: number;
  demoArchivedCount: number;
  hasDemoData: boolean;
}

/* ─── Status ────────────────────────────── */

export async function getDemoDataStatus(): Promise<DemoStatus> {
  const now = new Date();
  const [jobs, drafts, pipeline, sent, toFollowUp, replied, interview, offer, archived] = await Promise.all([
    prisma.job.count({ where: { title: { startsWith: TAG } } }),
    prisma.applicationDraft.count({ where: { jobSummary: { startsWith: TAG } } }),
    prisma.applicationDraft.count({ where: { pipelineStatus: { not: null }, jobSummary: { startsWith: TAG } } }),
    prisma.applicationDraft.count({ where: { pipelineStatus: "sent", jobSummary: { startsWith: TAG } } }),
    prisma.applicationDraft.count({
      where: {
        pipelineStatus: "sent",
        followUpDueAt: { lte: now },
        jobSummary: { startsWith: TAG },
      },
    }),
    prisma.applicationDraft.count({ where: { pipelineStatus: "recruiter_replied", jobSummary: { startsWith: TAG } } }),
    prisma.applicationDraft.count({ where: { pipelineStatus: "interview", jobSummary: { startsWith: TAG } } }),
    prisma.applicationDraft.count({ where: { pipelineStatus: "offer", jobSummary: { startsWith: TAG } } }),
    prisma.applicationDraft.count({ where: { pipelineStatus: "archived", jobSummary: { startsWith: TAG } } }),
  ]);

  return {
    demoJobsCount: jobs,
    demoDraftsCount: drafts,
    demoPipelineCount: pipeline,
    demoSentCount: sent,
    demoToFollowUpCount: toFollowUp,
    demoRepliedCount: replied,
    demoInterviewCount: interview,
    demoOfferCount: offer,
    demoArchivedCount: archived,
    hasDemoData: jobs > 0 || drafts > 0,
  };
}

/* ─── Check Existing (legacy compat) ──────── */

export async function checkExistingData(): Promise<{
  hasProfile: boolean;
  hasOpportunities: boolean;
  hasDocuments: boolean;
  hasDemoData: boolean;
}> {
  const [profile, oppCount, docCount, demoJob] = await Promise.all([
    prisma.profile.findFirst(),
    prisma.opportunity.count(),
    prisma.document.count(),
    prisma.job.findFirst({ where: { title: { startsWith: TAG } } }),
  ]);
  return {
    hasProfile: !!profile,
    hasOpportunities: oppCount > 0,
    hasDocuments: docCount > 0,
    hasDemoData: !!demoJob,
  };
}

/* ─── Create ─────────────────────────────── */

export async function createDemoData(): Promise<{ success: boolean; error?: string }> {
  try {
    // Supprimer d'abord les anciennes données démo (ignore si échec)
    try { await deleteDemoData(); } catch { /* ignore cleanup failure */ }

    // 1. Sources d'import
    const srcLinkedIn = await prisma.importSource.create({
      data: { name: `${TAG} LinkedIn Browser`, type: "browser", enabled: true },
    });
    const srcAPEC = await prisma.importSource.create({
      data: { name: `${TAG} APEC`, type: "api", enabled: true },
    });
    const srcFT = await prisma.importSource.create({
      data: { name: `${TAG} France Travail`, type: "api", enabled: true },
    });
    const srcWTJ = await prisma.importSource.create({
      data: { name: `${TAG} Welcome to the Jungle`, type: "html", enabled: true },
    });
    const srcMP = await prisma.importSource.create({
      data: { name: `${TAG} Michael Page`, type: "html", enabled: true },
    });

    // 2. 10 offres d'emploi
    const now = new Date();
    const jobs = await Promise.all([
      prisma.job.create({
        data: {
          title: `${TAG} Directeur Commercial France H/F`,
          company: "TechCorp SAS",
          location: "Marseille, PACA",
          locationPriority: 1,
          countryScope: "france",
          remotePolicy: "hybride",
          contractType: "CDI",
          salaryMin: 120000, salaryMax: 160000,
          seniority: "executive",
          functionArea: "direction commerciale",
          sector: "SaaS B2B",
          description: "Pilotage de la stratégie commerciale France. Équipe de 45 commerciaux, CA 35M€. Développement grands comptes et transformation commerciale.",
          sourceId: srcLinkedIn.id,
          sourceUrl: `https://demo.example.com/linkedin/offre-1`,
          externalId: `${TAG} linkedin::dc-techcorp-mrs`,
          publishedAt: new Date(now.getTime() - 3 * 86400000),
          firstSeenAt: new Date(now.getTime() - 3 * 86400000),
          status: "new",
        },
      }),
      prisma.job.create({
        data: {
          title: `${TAG} Country Manager France — Industrie`,
          company: "BigIndustry Group",
          location: "Paris, Île-de-France",
          locationPriority: 2,
          countryScope: "france",
          remotePolicy: "présentiel",
          contractType: "CDI",
          salaryMin: 130000, salaryMax: 170000,
          seniority: "executive",
          functionArea: "direction générale",
          sector: "Industrie",
          description: "Responsable du P&L France (80M€). Gestion de 3 business units et 200 collaborateurs. Stratégie de croissance et développement international.",
          sourceId: srcAPEC.id,
          sourceUrl: `https://demo.example.com/apec/offre-1`,
          externalId: `${TAG} apec::cm-bigindustry-paris`,
          publishedAt: new Date(now.getTime() - 5 * 86400000),
          firstSeenAt: new Date(now.getTime() - 5 * 86400000),
          status: "new",
        },
      }),
      prisma.job.create({
        data: {
          title: `${TAG} Directeur Commercial B2B — Santé`,
          company: "MedTech Solutions",
          location: "Nice, PACA",
          locationPriority: 1,
          countryScope: "france",
          remotePolicy: "hybride",
          contractType: "CDI",
          salaryMin: 110000, salaryMax: 145000,
          seniority: "executive",
          functionArea: "direction commerciale",
          sector: "Santé",
          description: "Développement du marché français pour un éditeur SaaS Santé. Création et management d'une équipe commerciale.",
          sourceId: srcFT.id,
          sourceUrl: `https://demo.example.com/ft/offre-1`,
          externalId: `${TAG} ft::dc-medtech-nice`,
          publishedAt: new Date(now.getTime() - 2 * 86400000),
          firstSeenAt: new Date(now.getTime() - 2 * 86400000),
          status: "new",
        },
      }),
      prisma.job.create({
        data: {
          title: `${TAG} Head of Sales Europe — SaaS`,
          company: "CloudScale.io",
          location: "Remote Europe",
          locationPriority: 4,
          countryScope: "europe",
          remotePolicy: "remote",
          contractType: "CDI",
          salaryMin: 140000, salaryMax: 190000,
          seniority: "executive",
          functionArea: "direction commerciale",
          sector: "SaaS B2B",
          description: "Pilotage des ventes Europe (5 pays). Construction de l'équipe commerciale from scratch. Report au CRO basé à Londres.",
          sourceId: srcWTJ.id,
          sourceUrl: `https://demo.example.com/wtj/offre-1`,
          externalId: `${TAG} wtj::hos-cloudscale-remote`,
          publishedAt: new Date(now.getTime() - 10 * 86400000),
          firstSeenAt: new Date(now.getTime() - 10 * 86400000),
          status: "new",
        },
      }),
      prisma.job.create({
        data: {
          title: `${TAG} Directeur Commercial Régional PACA`,
          company: "LogiTrans Group",
          location: "Aix-en-Provence, PACA",
          locationPriority: 1,
          countryScope: "france",
          remotePolicy: "hybride",
          contractType: "CDI",
          salaryMin: 95000, salaryMax: 120000,
          seniority: "senior",
          functionArea: "direction commerciale",
          sector: "Transport & Logistique",
          description: "Management de 15 agences commerciales en PACA. CA 25M€. Développement du portefeuille clients B2B.",
          sourceId: srcMP.id,
          sourceUrl: `https://demo.example.com/mp/offre-1`,
          externalId: `${TAG} mp::dcr-logitrans-aix`,
          publishedAt: new Date(now.getTime() - 7 * 86400000),
          firstSeenAt: new Date(now.getTime() - 7 * 86400000),
          status: "new",
        },
      }),
      prisma.job.create({
        data: {
          title: `${TAG} VP Commercial — Scale-up Fintech`,
          company: "PayNext",
          location: "Paris, Île-de-France",
          locationPriority: 2,
          countryScope: "france",
          remotePolicy: "hybride",
          contractType: "CDI",
          salaryMin: 150000, salaryMax: 200000,
          seniority: "executive",
          functionArea: "direction commerciale",
          sector: "Fintech",
          description: "Définition et exécution de la stratégie go-to-market France et Benelux. Équipe de 30 personnes en croissance rapide.",
          sourceId: srcLinkedIn.id,
          sourceUrl: `https://demo.example.com/linkedin/offre-2`,
          externalId: `${TAG} linkedin::vp-paynext-paris`,
          publishedAt: new Date(now.getTime() - 1 * 86400000),
          firstSeenAt: new Date(now.getTime() - 1 * 86400000),
          status: "new",
        },
      }),
      prisma.job.create({
        data: {
          title: `${TAG} Business Unit Director — Industrie`,
          company: "MecaCorp Industries",
          location: "Lyon, Auvergne-Rhône-Alpes",
          locationPriority: 3,
          countryScope: "france",
          remotePolicy: "présentiel",
          contractType: "CDI",
          salaryMin: 100000, salaryMax: 135000,
          seniority: "senior",
          functionArea: "direction business unit",
          sector: "Industrie",
          description: "Gestion complète d'une BU de 50 personnes, CA 20M€. Développement de nouveaux marchés et optimisation des marges.",
          sourceId: srcAPEC.id,
          sourceUrl: `https://demo.example.com/apec/offre-2`,
          externalId: `${TAG} apec::bud-meca-lyon`,
          publishedAt: new Date(now.getTime() - 14 * 86400000),
          firstSeenAt: new Date(now.getTime() - 14 * 86400000),
          status: "new",
        },
      }),
      prisma.job.create({
        data: {
          title: `${TAG} Directeur des Ventes — Retail Luxe`,
          company: "Maison Héritage",
          location: "Cannes, PACA",
          locationPriority: 1,
          countryScope: "france",
          remotePolicy: "présentiel",
          contractType: "CDI",
          salaryMin: 90000, salaryMax: 120000,
          seniority: "senior",
          functionArea: "direction commerciale",
          sector: "Luxe & Retail",
          description: "Direction du réseau de boutiques Sud-Est. 12 points de vente, équipe de 80 conseillers. Stratégie omnicanale.",
          sourceId: srcFT.id,
          sourceUrl: `https://demo.example.com/ft/offre-2`,
          externalId: `${TAG} ft::dv-heritage-cannes`,
          publishedAt: new Date(now.getTime() - 4 * 86400000),
          firstSeenAt: new Date(now.getTime() - 4 * 86400000),
          status: "new",
        },
      }),
      prisma.job.create({
        data: {
          title: `${TAG} Chief Revenue Officer — Scale-up`,
          company: "DataMind AI",
          location: "Remote France",
          locationPriority: 3,
          countryScope: "france",
          remotePolicy: "remote",
          contractType: "CDI",
          salaryMin: 160000, salaryMax: 220000,
          seniority: "executive",
          functionArea: "direction générale",
          sector: "IA & Data",
          description: "Construction de la fonction Revenue (Sales + Marketing + CS). Report direct CEO. Participation au COMEX.",
          sourceId: srcWTJ.id,
          sourceUrl: `https://demo.example.com/wtj/offre-2`,
          externalId: `${TAG} wtj::cro-datamind-remote`,
          publishedAt: new Date(now.getTime() - 6 * 86400000),
          firstSeenAt: new Date(now.getTime() - 6 * 86400000),
          status: "new",
        },
      }),
      prisma.job.create({
        data: {
          title: `${TAG} Sales Director Southern Europe`,
          company: "GlobalTech Corp",
          location: "Barcelone/Madrid, Espagne",
          locationPriority: 4,
          countryScope: "europe",
          remotePolicy: "hybride",
          contractType: "CDI",
          salaryMin: 130000, salaryMax: 180000,
          seniority: "executive",
          functionArea: "direction commerciale",
          sector: "SaaS B2B",
          description: "Direction commerciale Europe du Sud (France, Espagne, Italie). Management multiculturel, 3 pays, 40 collaborateurs.",
          sourceId: srcMP.id,
          sourceUrl: `https://demo.example.com/mp/offre-2`,
          externalId: `${TAG} mp::sd-globaltech-bcn`,
          publishedAt: new Date(now.getTime() - 21 * 86400000),
          firstSeenAt: new Date(now.getTime() - 21 * 86400000),
          status: "new",
        },
      }),
    ]);

    // 4. Scores pour chaque offre
    const scoreData = [
      { jobId: jobs[0].id, globalScore: 88, executiveScore: 90, matchScore: 85, locationScore: 100, salaryScore: 75, recommendedAction: "apply", reasonsJson: JSON.stringify(["Match profil direction commerciale", "PACA priorité 1", "Expérience SaaS B2B"]), redFlagsJson: JSON.stringify([]) },
      { jobId: jobs[1].id, globalScore: 78, executiveScore: 85, matchScore: 75, locationScore: 80, salaryScore: 72, recommendedAction: "apply", reasonsJson: JSON.stringify(["P&L 80M€", "Management 200 personnes", "Scope international"]), redFlagsJson: JSON.stringify(["Présentiel Paris"]) },
      { jobId: jobs[2].id, globalScore: 82, executiveScore: 82, matchScore: 80, locationScore: 100, salaryScore: 68, recommendedAction: "apply", reasonsJson: JSON.stringify(["Secteur Santé porteur", "PACA priorité 1", "Création d'équipe"]), redFlagsJson: JSON.stringify([]) },
      { jobId: jobs[3].id, globalScore: 67, executiveScore: 70, matchScore: 65, locationScore: 15, salaryScore: 80, recommendedAction: "review", reasonsJson: JSON.stringify(["Scope Europe attractif", "Construction from scratch"]), redFlagsJson: JSON.stringify(["Remote international", "Pas de bureau France"]) },
      { jobId: jobs[4].id, globalScore: 73, executiveScore: 68, matchScore: 72, locationScore: 100, salaryScore: 55, recommendedAction: "shortlist", reasonsJson: JSON.stringify(["15 agences en PACA", "Secteur transport stable"]), redFlagsJson: JSON.stringify(["Salaire bas", "Senior (pas executive)"]) },
      { jobId: jobs[5].id, globalScore: 91, executiveScore: 92, matchScore: 90, locationScore: 80, salaryScore: 95, recommendedAction: "apply", reasonsJson: JSON.stringify(["VP Commercial Fintech", "Package 200k€", "Croissance rapide"]), redFlagsJson: JSON.stringify([]) },
      { jobId: jobs[6].id, globalScore: 54, executiveScore: 58, matchScore: 50, locationScore: 50, salaryScore: 45, recommendedAction: "review", reasonsJson: JSON.stringify(["BU Director expérience", "Lyon accessible"]), redFlagsJson: JSON.stringify(["Industrie traditionnelle", "Présentiel obligatoire"]) },
      { jobId: jobs[7].id, globalScore: 62, executiveScore: 60, matchScore: 55, locationScore: 100, salaryScore: 50, recommendedAction: "review", reasonsJson: JSON.stringify(["Luxe & Retail", "Cannes emplacement premium"]), redFlagsJson: JSON.stringify(["Salaire bas", "Retail vs B2B"]) },
      { jobId: jobs[8].id, globalScore: 85, executiveScore: 88, matchScore: 82, locationScore: 50, salaryScore: 95, recommendedAction: "apply", reasonsJson: JSON.stringify(["CRO COMEX", "IA & Data secteur porteur", "Package 220k€"]), redFlagsJson: JSON.stringify(["Remote France", "Startup pre-scale"]) },
      { jobId: jobs[9].id, globalScore: 45, executiveScore: 52, matchScore: 40, locationScore: 15, salaryScore: 70, recommendedAction: "skip", reasonsJson: JSON.stringify(["Management multiculturel"]), redFlagsJson: JSON.stringify(["Basé en Espagne", "Pas prioritaire", "Déplacement fréquent"]) },
    ];

    for (const s of scoreData) {
      await prisma.jobScore.create({ data: s });
    }

    // 5. ApplicationDrafts avec statuts variés
    const sent10dAgo = new Date(now.getTime() - 10 * 86400000);
    const sent7dAgo = new Date(now.getTime() - 7 * 86400000);
    const sent2dAgo = new Date(now.getTime() - 2 * 86400000);
    const followUpFuture = new Date(now.getTime() + 5 * 86400000); // dans 5 jours
    const followUpDue7d = new Date(now.getTime() - 3 * 86400000); // déjà dépassée
    const replied3dAgo = new Date(now.getTime() - 3 * 86400000);
    const interviewTomorrow = new Date(now.getTime() + 1 * 86400000);

    const draftTemplate = (overrides: Record<string, unknown>) => ({
      jobSummary: `${TAG} Analyse démo`,
      matchScore: (overrides.matchScore as number) || 75,
      keyRequirements: JSON.stringify(["Expérience direction commerciale", "Management d'équipe", "Anglais courant"]),
      atsKeywords: JSON.stringify(["direction commerciale", "management", "B2B", "stratégie"]),
      confirmedMatches: JSON.stringify(["Management d'équipe 15+ ans", "Anglais courant"]),
      gaps: JSON.stringify([]),
      risks: JSON.stringify([]),
      applicationEmail: `${TAG} Bonjour,\n\nJe vous adresse ma candidature pour le poste de [POSTE].\n\nCordialement,\nJean Dupont`,
      recruiterMessage: `${TAG} Bonjour, je suis intéressé par votre offre de [POSTE]. Mon profil correspond.`,
      tailoredResumeContent: `${TAG} CV adapté — Jean Dupont\n\nRÉSUMÉ EXÉCUTIF\nDirecteur Commercial 15 ans d'expérience B2B.\n\nEXPÉRIENCES\n• Direction commerciale France — CA 35M€\n• Management équipes 45+ personnes`,
      motivationLetterLong: `${TAG} Lettre de motivation — [POSTE]\n\nMadame, Monsieur,\n\nFort de 15 ans d'expérience en direction commerciale...\n\n[3-4 paragraphes]`,
      motivationLetterShort: `${TAG} Directeur Commercial expérimenté, je suis vivement intéressé par votre poste.`,
      atsFormAnswers: JSON.stringify([{ question: "Années d'expérience en management", answer: "15 ans" }, { question: "Salaire attendu", answer: "130-150k€" }]),
      changeLogJson: JSON.stringify([{ timestamp: new Date().toISOString(), type: "creation", summary: "Génération démo", actor: "demo" }]),
      ...overrides,
    });

    // Draft 0 — envoyé récemment (Maison Héritage, score 62, envoyé il y a 2j, relance dans 5j)
    // Remplit la colonne Kanban "Envoyées"
    await prisma.applicationDraft.create({
      data: {
        jobId: jobs[7].id,
        status: "sent",
        pipelineStatus: "sent",
        sentAt: sent2dAgo,
        followUpDueAt: followUpFuture,
        lastPipelineActionAt: sent2dAgo,
        ...draftTemplate({ matchScore: 62 }) as Record<string, unknown>,
      },
    });

    // Draft 1 — envoyé (TechCorp, score 88, envoyé il y a 10j, relance due)
    // Remplit la colonne Kanban "À relancer" (followUpDueAt dépassé)
    await prisma.applicationDraft.create({
      data: {
        jobId: jobs[0].id,
        status: "sent",
        pipelineStatus: "sent",
        sentAt: sent10dAgo,
        followUpDueAt: followUpDue7d,
        // followUpDueAt = sentAt + 7j = il y a 3j → relance DUE
        lastPipelineActionAt: sent10dAgo,
        ...draftTemplate({ matchScore: 88 }) as Record<string, unknown>,
      },
    });

    // Draft 2 — relancé (PayNext, score 91, envoyé il y a 7j, relancé il y a 2j)
    await prisma.applicationDraft.create({
      data: {
        jobId: jobs[5].id,
        status: "sent",
        pipelineStatus: "followed_up",
        sentAt: sent7dAgo,
        followUpDueAt: new Date(now.getTime() + 0 * 86400000), // due today
        followedUpAt: new Date(now.getTime() - 2 * 86400000),
        lastPipelineActionAt: new Date(now.getTime() - 2 * 86400000),
        ...draftTemplate({ matchScore: 91 }) as Record<string, unknown>,
      },
    });

    // Draft 3 — réponse recruteur (MedTech, score 82, envoyé il y a 14j, répondu il y a 3j)
    await prisma.applicationDraft.create({
      data: {
        jobId: jobs[2].id,
        status: "sent",
        pipelineStatus: "recruiter_replied",
        sentAt: new Date(now.getTime() - 14 * 86400000),
        followUpDueAt: new Date(now.getTime() - 7 * 86400000),
        recruiterRepliedAt: replied3dAgo,
        lastPipelineActionAt: replied3dAgo,
        ...draftTemplate({ matchScore: 82 }) as Record<string, unknown>,
      },
    });

    // Draft 4 — entretien planifié (CloudScale, score 67, envoyé il y a 20j)
    await prisma.applicationDraft.create({
      data: {
        jobId: jobs[3].id,
        status: "sent",
        pipelineStatus: "interview",
        sentAt: new Date(now.getTime() - 20 * 86400000),
        followUpDueAt: new Date(now.getTime() - 13 * 86400000),
        recruiterRepliedAt: new Date(now.getTime() - 5 * 86400000),
        interviewAt: interviewTomorrow,
        lastPipelineActionAt: new Date(now.getTime() - 5 * 86400000),
        ...draftTemplate({ matchScore: 67 }) as Record<string, unknown>,
      },
    });

    // Draft 5 — refusé (LogiTrans, score 73)
    await prisma.applicationDraft.create({
      data: {
        jobId: jobs[4].id,
        status: "sent",
        pipelineStatus: "rejected",
        sentAt: new Date(now.getTime() - 30 * 86400000),
        followUpDueAt: new Date(now.getTime() - 23 * 86400000),
        lastPipelineActionAt: new Date(now.getTime() - 15 * 86400000),
        ...draftTemplate({ matchScore: 73 }) as Record<string, unknown>,
      },
    });

    // Draft 6 — draft (pas encore envoyé, DataMind AI)
    await prisma.applicationDraft.create({
      data: {
        jobId: jobs[8].id,
        status: "draft",
        pipelineStatus: null,
        ...draftTemplate({ matchScore: 85 }) as Record<string, unknown>,
      },
    });

    // Draft 7 — offre reçue (GlobalTech, score 45, envoyé il y a 40j, offre reçue il y a 5j)
    await prisma.applicationDraft.create({
      data: {
        jobId: jobs[9].id,
        status: "sent",
        pipelineStatus: "offer",
        sentAt: new Date(now.getTime() - 40 * 86400000),
        followUpDueAt: new Date(now.getTime() - 33 * 86400000),
        recruiterRepliedAt: new Date(now.getTime() - 20 * 86400000),
        interviewAt: new Date(now.getTime() - 15 * 86400000),
        lastPipelineActionAt: new Date(now.getTime() - 5 * 86400000),
        ...draftTemplate({ matchScore: 45 }) as Record<string, unknown>,
      },
    });

    // Draft 8 — archivé (MecaCorp, score 54, envoyé il y a 60j, refusé puis archivé)
    await prisma.applicationDraft.create({
      data: {
        jobId: jobs[6].id,
        status: "archived",
        pipelineStatus: "archived",
        sentAt: new Date(now.getTime() - 60 * 86400000),
        followUpDueAt: new Date(now.getTime() - 53 * 86400000),
        lastPipelineActionAt: new Date(now.getTime() - 30 * 86400000),
        ...draftTemplate({ matchScore: 54 }) as Record<string, unknown>,
      },
    });

    // 7. Session de candidature assistée (pour le draft envoyé TechCorp)
    const allDrafts = await prisma.applicationDraft.findMany({
      where: { jobSummary: { startsWith: TAG } },
    });
    const draftSent = allDrafts.find((d) => d.pipelineStatus === "sent")!;

    await prisma.assistedApplySession.create({
      data: {
        applicationDraftId: draftSent.id,
        jobId: draftSent.jobId,
        sourceUrl: `https://demo.example.com/linkedin/offre-1`,
        platform: "linkedin",
        status: "completed",
        suggestedAnswersJson: JSON.stringify([
          { fieldName: "fullName", fieldType: "text", suggestedValue: "Jean Dupont", confidence: 90 },
          { fieldName: "email", fieldType: "email", suggestedValue: "demo@elton-os.local", confidence: 90 },
          { fieldName: "phone", fieldType: "tel", suggestedValue: "06 00 00 00 00", confidence: 85 },
          { fieldName: "coverLetter", fieldType: "textarea", suggestedValue: "Lettre de motivation démo...", confidence: 80 },
        ]),
        warningsJson: JSON.stringify([]),
      },
    });

    revalidatePath("/dashboard/jobs");
    revalidatePath("/dashboard/jobs/pipeline");
    revalidatePath("/dashboard/jobs/analytics");
    return { success: true };
  } catch (e: unknown) {
    const err = e as Error;
    return { success: false, error: err.message };
  }
}

/* ─── Delete ─────────────────────────────── */

export async function deleteDemoData(): Promise<{ success: boolean; deleted?: { jobs: number; drafts: number; scores: number; sources: number; profiles: number; sessions: number }; error?: string }> {
  try {
    // Ordre cascade-safe — supprime les objets [DEMO]
    // Étape 1 : trouver les jobs démo et supprimer leurs scores
    const demoJobIds = (await prisma.job.findMany({
      where: { title: { startsWith: TAG } },
      select: { id: true },
    })).map((j) => j.id);

    let scoresDeleted = 0;
    for (const jobId of demoJobIds) {
      try {
        await prisma.jobScore.deleteMany({ where: { jobId } });
        scoresDeleted++;
      } catch { /* skip */ }
    }

    const sessions = await prisma.assistedApplySession.deleteMany({
      where: { suggestedAnswersJson: { contains: TAG } },
    });

    const drafts = await prisma.applicationDraft.deleteMany({
      where: { jobSummary: { startsWith: TAG } },
    });

    const jobs = await prisma.job.deleteMany({
      where: { title: { startsWith: TAG } },
    });

    const sources = await prisma.importSource.deleteMany({
      where: { name: { startsWith: TAG } },
    });

    let profilesDeleted = 0;
    try {
      const r = await prisma.profile.deleteMany({
        where: { email: { startsWith: TAG } },
      });
      profilesDeleted = r.count;
    } catch { /* skip */ }

    revalidatePath("/dashboard/jobs");
    revalidatePath("/dashboard/jobs/pipeline");
    revalidatePath("/dashboard/jobs/analytics");

    return {
      success: true,
      deleted: {
        jobs: jobs.count,
        drafts: drafts.count,
        scores: scoresDeleted,
        sources: sources.count,
        profiles: profilesDeleted,
        sessions: sessions.count,
      },
    };
  } catch (e: unknown) {
    const err = e as Error;
    return { success: false, error: err.message };
  }
}
