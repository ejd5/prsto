"use server";

import { prisma } from "@/lib/prisma";

export interface BoardroomData {
  // Profil
  profile: {
    fullName: string;
    title: string;
    photoUrl: string | null;
  } | null;

  // Métriques Hero
  metrics: {
    topOpportunities: number;       // opps score >= 70
    marketMomentum: number;         // nb total sources actives
    roleFitScore: number;           // avg score des analyses
    investorProbability: number;    // taux entretiens / candidatures envoyées
    networkSignals: number;         // contacts recruteurs récents
  };

  // Confidence Score (basé sur la complétude des données)
  confidenceScore: number;

  // AI Briefing
  briefing: {
    highFitOpportunities: number;
    compensationTrend: number | null;    // salaire moyen des opps analysées
    recruitersToContact: number;
    totalOpps: number;
    analysedOpps: number;
  };

  // Signal Feed (dernières opportunités / activité)
  signals: Array<{
    id: string;
    type: "opportunity" | "analysis" | "interview" | "contact";
    title: string;
    subtitle: string;
    timeAgo: string;
  }>;

  // Predictive Opportunities (meilleures opps par score)
  opportunities: Array<{
    id: string;
    title: string;
    company: string;
    matchScore: number;
    salaryRange: string;
    tags: string[];
  }>;

  // Executive Narrative (stats pour parler de soi)
  narrative: {
    provenTrackRecord: boolean;
    transformationLeader: boolean;
    strategicInitiatives: number;
    teamBuilder: boolean;
  };

  // Market Watch
  market: {
    sectors: Array<{
      name: string;
      trend: string;
      change: string;
    }>;
    sentimentPoints: number[];  // courbe simplifiée
  };

  // Recruiter Intelligence
  recruiters: Array<{
    id: string;
    name: string;
    company: string;
    responseRate: number;
    lastContact: string | null;
  }>;

  // Decision Support
  decision: {
    action: "Pursue" | "Hold" | "Skip";
    targetTitle: string;
    targetCompany: string;
    confidence: "HIGH" | "MEDIUM" | "LOW";
    rationale: string;
  } | null;

  // Pipeline stats
  pipeline: {
    sent: number;
    interview: number;
    offer: number;
    pending: number;
  };

  // AI Mode
  aiMode: string;
}

function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);
  if (diffMin < 2) return "à l'instant";
  if (diffMin < 60) return `${diffMin}m`;
  if (diffH < 24) return `${diffH}h`;
  return `${diffD}j`;
}

export async function getBoardroomData(): Promise<BoardroomData> {
  const [
    profile,
    opps,
    jobs,
    jobScores,
    analyses,
    contacts,
    interviews,
    pipeline,
    sources,
    settings,
  ] = await Promise.all([
    prisma.profile.findFirst({ select: { fullName: true, title: true, photoUrl: true } }),
    prisma.opportunity.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true, title: true, company: true, score: true,
        salaryMin: true, salaryMax: true, salaryCurrency: true,
        status: true, createdAt: true, updatedAt: true,
        analysis: { select: { scoreGlobal: true } },
      },
    }),
    prisma.job.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true, title: true, company: true, globalScore: true,
        salaryMin: true, salaryMax: true, currency: true,
        status: true, createdAt: true, updatedAt: true,
        score: { select: { matchScore: true, executiveScore: true } },
      },
    }),
    prisma.jobScore.findMany({ select: { matchScore: true, executiveScore: true, globalScore: true }, take: 100 }),
    prisma.analysis.findMany({ select: { scoreGlobal: true, analysedAt: true }, take: 100 }),
    prisma.recruiterContact.findMany({
      orderBy: { lastContactedAt: "desc" },
      take: 5,
      select: { id: true, fullName: true, companyName: true, firmName: true, lastContactedAt: true, createdAt: true },
    }),
    prisma.interview.findMany({ select: { id: true, status: true, createdAt: true }, take: 20 }),
    prisma.pipelineTask.findMany({ select: { column: true }, take: 200 }),
    prisma.jobSource.findMany({ where: { active: true }, select: { id: true }, take: 100 }),
    prisma.setting.findFirst({ select: { aiProvider: true } }),
  ]);

  // Fusionner Opportunity + Job en une liste unifiée
  const allOpps = [
    ...opps.map((o) => ({
      id: o.id,
      title: o.title,
      company: o.company,
      score: o.score ?? o.analysis?.scoreGlobal ?? 0,
      salaryMin: o.salaryMin,
      salaryMax: o.salaryMax,
      salaryCurrency: o.salaryCurrency,
      status: o.status,
      createdAt: o.createdAt,
    })),
    ...jobs.map((j) => ({
      id: j.id,
      title: j.title,
      company: j.company ?? "",
      score: j.globalScore ?? j.score?.matchScore ?? j.score?.executiveScore ?? 0,
      salaryMin: j.salaryMin,
      salaryMax: j.salaryMax,
      salaryCurrency: j.currency,
      status: j.status,
      createdAt: j.createdAt,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  // --- Métriques ---
  const scoredOpps = allOpps.filter((o) => o.score >= 70);
  const allScores = [
    ...analyses.map((a) => a.scoreGlobal).filter((s): s is number => s !== null && s > 0),
    ...jobScores.map((s) => s.matchScore).filter((s): s is number => s !== null && s > 0),
  ];
  const avgScore = allScores.length > 0
    ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
    : 0;

  const sentCount = pipeline.filter((p) => ["envoye", "relance_1", "relance_2"].includes(p.column)).length;
  const interviewCount = pipeline.filter((p) => ["entretien_rh", "entretien_direction"].includes(p.column)).length;
  const offerCount = pipeline.filter((p) => p.column === "offre").length;
  const pendingCount = pipeline.filter((p) => ["nouveau", "a_analyser"].includes(p.column)).length;

  const investorProb = sentCount > 0
    ? Math.min(99, Math.round((interviewCount / sentCount) * 100))
    : 0;

  // --- Confidence Score ---
  const hasProfile = !!profile;
  const hasOpps = allOpps.length > 0;
  const hasAnalyses = allScores.length > 0;
  const hasSent = sentCount > 0;
  const confidenceBase = [hasProfile, hasOpps, hasAnalyses, hasSent].filter(Boolean).length;
  const confidenceScore = Math.min(99, 45 + confidenceBase * 13 + Math.min(15, avgScore / 10));

  // --- Briefing ---
  const avgSalary = (() => {
    const withSalary = allOpps.filter((o) => o.salaryMin && o.salaryMax);
    if (withSalary.length === 0) return null;
    const avg = withSalary.reduce((a, o) => a + ((o.salaryMin! + o.salaryMax!) / 2), 0) / withSalary.length;
    return Math.round(avg / 1000);
  })();

  // --- Signals ---
  const signals = allOpps.slice(0, 4).map((o) => ({
    id: o.id,
    type: "opportunity" as const,
    title: o.title,
    subtitle: o.company,
    timeAgo: timeAgo(new Date(o.createdAt)),
  }));

  // --- Top Opportunities ---
  const topOpps = [...allOpps]
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((o) => {
      const salMin = o.salaryMin ? `${Math.round(o.salaryMin / 1000)}K` : null;
      const salMax = o.salaryMax ? `${Math.round(o.salaryMax / 1000)}K` : null;
      const salaryRange = salMin && salMax ? `${salMin}–${salMax}` : salMin ?? salMax ?? "NC";
      return {
        id: o.id,
        title: o.title,
        company: o.company,
        matchScore: o.score,
        salaryRange,
        tags: ["EXECUTIVE", o.status?.toUpperCase() ?? "NEW"],
      };
    });

  // --- Recruiters ---
  const recruiters = contacts.slice(0, 3).map((c) => ({
    id: c.id,
    name: c.fullName,
    company: c.companyName ?? c.firmName ?? "—",
    responseRate: c.lastContactedAt ? 85 : 0,
    lastContact: c.lastContactedAt ? timeAgo(new Date(c.lastContactedAt)) : null,
  }));

  // --- Decision Support ---
  const bestOpp = topOpps[0] ?? null;
  const decision = bestOpp
    ? {
        action: bestOpp.matchScore >= 75 ? "Pursue" as const : bestOpp.matchScore >= 50 ? "Hold" as const : "Skip" as const,
        targetTitle: bestOpp.title,
        targetCompany: bestOpp.company,
        confidence: (bestOpp.matchScore >= 80 ? "HIGH" : bestOpp.matchScore >= 65 ? "MEDIUM" : "LOW") as "HIGH" | "MEDIUM" | "LOW",
        rationale: bestOpp.matchScore >= 80
          ? `Score de matching élevé (${bestOpp.matchScore}%) — opportunité prioritaire.`
          : bestOpp.matchScore >= 50
          ? `Score intermédiaire (${bestOpp.matchScore}%) — analyser avant de postuler.`
          : `Score faible (${bestOpp.matchScore}%) — opportunité non prioritaire.`,
      }
    : null;

  // --- Market Sectors ---
  const sectorCounts: Record<string, number> = {};
  for (const o of allOpps) {
    const sector = o.company || "Inconnu";
    sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
  }
  const topSectors = Object.entries(sectorCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);
  const sectorSentiment = topSectors.length > 0
    ? topSectors.map(([name, count]) => ({
        name: name.length > 15 ? name.slice(0, 15) + "…" : name,
        trend: count >= 2 ? "Bullish" : "Neutral",
        change: count > 0 ? `+${count} offre${count > 1 ? "s" : ""}` : "0",
      }))
    : [{ name: "Aucune donnée", trend: "Neutral", change: "0" }];

  const sentimentCurve = allOpps.length > 0
    ? allOpps.slice(0, 20).map((o) => o.score)
    : Array.from({ length: 5 }, () => 50);

  return {
    profile: profile
      ? { fullName: profile.fullName, title: profile.title, photoUrl: profile.photoUrl }
      : null,
    metrics: {
      topOpportunities: scoredOpps.length || opps.length,
      marketMomentum: sources.length,
      roleFitScore: avgScore || 0,
      investorProbability: investorProb,
      networkSignals: contacts.length,
    },
    confidenceScore: Math.round(confidenceScore),
    briefing: {
      highFitOpportunities: scoredOpps.length,
      compensationTrend: avgSalary,
      recruitersToContact: contacts.filter((c) => !c.lastContactedAt).length,
      totalOpps: opps.length,
      analysedOpps: analyses.length,
    },
    signals,
    opportunities: topOpps,
    narrative: {
      provenTrackRecord: opps.length > 5,
      transformationLeader: analyses.length > 3,
      strategicInitiatives: Math.max(analyses.length, opps.length),
      teamBuilder: interviews.length > 0,
    },
    market: {
      sectors: sectorSentiment,
      sentimentPoints: sentimentCurve,
    },
    recruiters,
    decision,
    pipeline: {
      sent: sentCount,
      interview: interviewCount,
      offer: offerCount,
      pending: pendingCount,
    },
    aiMode: settings?.aiProvider ?? "local",
  };
}
