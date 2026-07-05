"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";

export interface RecruiterCockpitData {
  metrics: {
    activeCandidates: number;
    activeMissions: number;
    clientsActifs: number;
    proposeCount: number;
    entretienCount: number;
    placeCount: number;
    revenueMonth: number;
    revenueTotal: number;
    conversionRate: number;
  };
  pipeline: Array<{
    id: string;
    candidateName: string;
    clientName: string;
    role: string;
    status: string;
    updatedAt: string;
  }>;
  recentCandidates: Array<{
    id: string;
    fullName: string;
    title: string;
    status: string;
    createdAt: string;
  }>;
  missionTimeline: Array<{
    id: string;
    action: string;
    target: string;
    timeAgo: string;
  }>;
  funnel: Array<{ stage: string; label: string; count: number; color: string }>;
}

export async function getRecruiterCockpitData(): Promise<RecruiterCockpitData> {
  try {
    const session = await getSession();
    if (!session) throw new Error("Non authentifié");

    const userId = session.userId;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      activeCandidates,
      activeMissions,
      clientsActifs,
      proposeCount,
      entretienCount,
      offreCount,
      placeCount,
      commissions,
      pipelineEntries,
      recentCandidates,
      recentTimeline,
    ] = await Promise.all([
      prisma.candidate.count({ where: { userId } }),
      prisma.recruiterMission.count({ where: { userId, status: { in: ["ouverte", "en_cours"] } } }),
      prisma.recruiterClient.count({ where: { userId, status: "actif" } }),
      prisma.missionCandidate.count({ where: { mission: { userId }, status: "propose" } }),
      prisma.missionCandidate.count({ where: { mission: { userId }, status: "entretien" } }),
      prisma.missionCandidate.count({ where: { mission: { userId }, status: "offre" } }),
      prisma.missionCandidate.count({ where: { mission: { userId }, status: "place" } }),
      prisma.commission.findMany({
        where: { userId },
        select: { amount: true, status: true, paidAt: true, createdAt: true },
      }),
      prisma.missionCandidate.findMany({
        where: { mission: { userId } },
        orderBy: { updatedAt: "desc" },
        take: 8,
        include: {
          candidate: { select: { name: true } },
          mission: { select: { title: true, client: { select: { company: true } } } },
        },
      }),
      prisma.candidate.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, offerTitle: true, status: true, createdAt: true },
      }),
      prisma.missionCandidate.findMany({
        where: { mission: { userId }, updatedAt: { gte: monthStart } },
        orderBy: { updatedAt: "desc" },
        take: 5,
        include: {
          candidate: { select: { name: true } },
          mission: { select: { title: true, client: { select: { company: true } } } },
        },
      }),
    ]);

    const revenueMonth = commissions
      .filter(c => c.status === "paid" && c.paidAt && c.paidAt >= monthStart)
      .reduce((s, c) => s + c.amount, 0);

    const revenueTotal = commissions
      .filter(c => c.status === "paid")
      .reduce((s, c) => s + c.amount, 0);

    const totalPipeline = proposeCount + entretienCount + offreCount + placeCount;
    const conversionRate = totalPipeline > 0 ? Math.round((placeCount / totalPipeline) * 100) : 0;

    const pipeline = pipelineEntries.map(e => ({
      id: e.id,
      candidateName: e.candidate.name,
      clientName: e.mission.client.company,
      role: e.mission.title,
      status: e.status,
      updatedAt: e.updatedAt.toISOString(),
    }));

    const candidates = recentCandidates.map(c => ({
      id: c.id,
      fullName: c.name,
      title: c.offerTitle,
      status: c.status,
      createdAt: c.createdAt.toISOString(),
    }));

    const timeline = recentTimeline.map((e, i) => {
      const statusLabels: Record<string, string> = {
        propose: "Proposé à", entretien: "Entretien chez", offre: "Offre chez",
        place: "Placé chez", refuse: "Refusé par", abandon: "Abandon",
      };
      return {
        id: e.id,
        action: `${statusLabels[e.status] || e.status} ${e.mission.client.company}`,
        target: `${e.candidate.name} → ${e.mission.title}`,
        timeAgo: `${Math.max(1, Math.floor((now.getTime() - new Date(e.updatedAt).getTime()) / 3600000))}h`,
      };
    });

    return {
      metrics: {
        activeCandidates,
        activeMissions,
        clientsActifs,
        proposeCount,
        entretienCount,
        placeCount,
        revenueMonth: Math.round(revenueMonth),
        revenueTotal: Math.round(revenueTotal),
        conversionRate,
      },
      pipeline,
      recentCandidates: candidates,
      missionTimeline: timeline,
      funnel: [
        { stage: "propose", label: "Proposés", count: proposeCount, color: "#3b82f6" },
        { stage: "entretien", label: "Entretiens", count: entretienCount, color: "#8b5cf6" },
        { stage: "offre", label: "Offres", count: offreCount, color: "#f59e0b" },
        { stage: "place", label: "Placés", count: placeCount, color: "#22c55e" },
      ],
    };
  } catch (err) {
    console.error("getRecruiterCockpitData error:", err);
    return {
      metrics: {
        activeCandidates: 0, activeMissions: 0, clientsActifs: 0,
        proposeCount: 0, entretienCount: 0, placeCount: 0,
        revenueMonth: 0, revenueTotal: 0, conversionRate: 0,
      },
      pipeline: [], recentCandidates: [], missionTimeline: [], funnel: [],
    };
  }
}
