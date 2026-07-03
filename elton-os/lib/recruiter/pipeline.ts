import { prisma } from "@/lib/prisma";

const PIPELINE_STAGES = ["propose", "entretien", "offre", "place", "refuse", "abandon"] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const PIPELINE_LABELS: Record<PipelineStage, string> = {
  propose: "Proposé",
  entretien: "Entretien",
  offre: "Offre",
  place: "Placé",
  refuse: "Refusé",
  abandon: "Abandon",
};

export const PIPELINE_COLORS: Record<PipelineStage, string> = {
  propose: "#3b82f6",
  entretien: "#8b5cf6",
  offre: "#f59e0b",
  place: "#22c55e",
  refuse: "#ef4444",
  abandon: "#6b7280",
};

type AddCandidateToMissionData = {
  missionId: string;
  candidateId: string;
};

export async function addCandidateToMission(userId: string, data: AddCandidateToMissionData) {
  const mission = await prisma.recruiterMission.findFirst({
    where: { id: data.missionId, userId },
  });
  if (!mission) throw new Error("Mission introuvable");

  const candidate = await prisma.candidate.findFirst({
    where: { id: data.candidateId, userId },
  });
  if (!candidate) throw new Error("Candidat introuvable");

  return prisma.missionCandidate.create({
    data: {
      missionId: data.missionId,
      candidateId: data.candidateId,
    },
  });
}

export async function updateCandidateStatus(userId: string, missionCandidateId: string, status: PipelineStage) {
  const entry = await prisma.missionCandidate.findFirst({
    where: { id: missionCandidateId },
    include: { mission: true },
  });

  if (!entry || entry.mission.userId !== userId) {
    throw new Error("Élément introuvable");
  }

  const updateData: any = { status };
  if (status === "entretien") updateData.interviewAt = new Date();

  return prisma.missionCandidate.update({
    where: { id: missionCandidateId },
    data: updateData,
  });
}

export async function removeCandidateFromMission(userId: string, missionCandidateId: string) {
  const entry = await prisma.missionCandidate.findFirst({
    where: { id: missionCandidateId },
    include: { mission: true },
  });

  if (!entry || entry.mission.userId !== userId) {
    throw new Error("Élément introuvable");
  }

  return prisma.missionCandidate.delete({
    where: { id: missionCandidateId },
  });
}

export async function getMissionPipeline(userId: string, missionId: string) {
  const mission = await prisma.recruiterMission.findFirst({
    where: { id: missionId, userId },
    include: {
      client: { select: { id: true, company: true } },
      candidates: {
        include: { candidate: true },
        orderBy: { proposedAt: "desc" },
      },
    },
  });

  if (!mission) return null;

  const pipeline = PIPELINE_STAGES.map((stage) => ({
    stage,
    label: PIPELINE_LABELS[stage],
    color: PIPELINE_COLORS[stage],
    entries: mission.candidates.filter((c) => c.status === stage),
  }));

  return { mission, pipeline };
}
