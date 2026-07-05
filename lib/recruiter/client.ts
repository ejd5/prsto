import { prisma } from "@/lib/prisma";

export type ClientCreateData = {
  company: string;
  contactName?: string;
  email?: string;
  phone?: string;
  website?: string;
  sector?: string;
  notes?: string;
};

export type ClientUpdateData = Partial<ClientCreateData> & {
  status?: string;
};

export async function getClients(userId: string) {
  return prisma.recruiterClient.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { missions: true } } },
  });
}

export async function getClientById(userId: string, id: string) {
  return prisma.recruiterClient.findFirst({
    where: { id, userId },
    include: {
      missions: {
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { candidates: true } } },
      },
    },
  });
}

export async function createClient(userId: string, data: ClientCreateData) {
  return prisma.recruiterClient.create({
    data: { ...data, userId },
  });
}

export async function updateClient(userId: string, id: string, data: ClientUpdateData) {
  return prisma.recruiterClient.updateMany({
    where: { id, userId },
    data,
  });
}

export async function deleteClient(userId: string, id: string) {
  return prisma.recruiterClient.deleteMany({
    where: { id, userId },
  });
}
