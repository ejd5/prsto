import { prisma } from "@/lib/prisma";

export async function getRecruiterDashboardStats(userId: string) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalClients,
    activeMissions,
    totalCandidates,
    recentCandidates,
    pipelineCounts,
    placementCount,
    missionStatusCounts,
  ] = await Promise.all([
    prisma.recruiterClient.count({ where: { userId, status: "actif" } }),
    prisma.recruiterMission.count({
      where: { userId, status: { in: ["ouverte", "en_cours"] } },
    }),
    prisma.candidate.count({ where: { userId } }),
    prisma.candidate.findMany({
      where: { userId, createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    Promise.all(
      ["propose", "entretien", "offre", "place", "refuse", "abandon"].map(
        async (status) => {
          const count = await prisma.missionCandidate.count({
            where: {
              mission: { userId },
              status,
            },
          });
          return { status, count };
        },
      ),
    ),
    prisma.missionCandidate.count({
      where: { mission: { userId }, status: "place" },
    }),
    Promise.all(
      ["ouverte", "en_cours", "pourvue", "fermee"].map(async (status) => {
        const count = await prisma.recruiterMission.count({
          where: { userId, status },
        });
        return { status, count };
      }),
    ),
  ]);

  return {
    totalClients,
    activeMissions,
    totalCandidates,
    recentCandidates,
    pipelineCounts,
    placementCount,
    missionStatusCounts,
  };
}
