import { prisma } from "@/lib/prisma";

export type MissionCreateData = {
  clientId: string;
  title: string;
  location?: string;
  contractType?: string;
  salary?: string;
  description?: string;
  fee?: number;
  feeType?: string;
  deadline?: string;
};

export type MissionUpdateData = Partial<MissionCreateData> & {
  status?: string;
};

export async function getMissions(userId: string) {
  return prisma.recruiterMission.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { id: true, company: true } },
      _count: { select: { candidates: true } },
    },
  });
}

export async function getMissionById(userId: string, id: string) {
  return prisma.recruiterMission.findFirst({
    where: { id, userId },
    include: {
      client: true,
      candidates: {
        include: { candidate: true },
        orderBy: { proposedAt: "desc" },
      },
    },
  });
}

export async function createMission(userId: string, data: MissionCreateData) {
  return prisma.recruiterMission.create({
    data: {
      ...data,
      userId,
      deadline: data.deadline ? new Date(data.deadline) : null,
    },
  });
}

export async function updateMission(userId: string, id: string, data: MissionUpdateData) {
  const updateData: any = { ...data };
  if (data.deadline) updateData.deadline = new Date(data.deadline);

  return prisma.recruiterMission.updateMany({
    where: { id, userId },
    data: updateData,
  });
}

export async function deleteMission(userId: string, id: string) {
  return prisma.recruiterMission.deleteMany({
    where: { id, userId },
  });
}
