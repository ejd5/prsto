import { prisma } from "@/lib/prisma";

export async function getCommissions(userId: string) {
  return prisma.commission.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      mission: { select: { id: true, title: true, client: { select: { company: true } } } },
    },
  });
}

export async function createCommission(userId: string, data: { missionId: string; amount: number; notes?: string }) {
  return prisma.commission.create({
    data: { ...data, userId },
  });
}

export async function updateCommissionStatus(userId: string, id: string, status: string) {
  const updateData: any = { status };
  if (status === "paid") updateData.paidAt = new Date();

  return prisma.commission.updateMany({
    where: { id, userId },
    data: updateData,
  });
}

export async function getComptaStats(userId: string) {
  const commissions = await prisma.commission.findMany({ where: { userId } });

  const totalPending = commissions.filter(c => c.status === "pending").reduce((s, c) => s + c.amount, 0);
  const totalPaid = commissions.filter(c => c.status === "paid").reduce((s, c) => s + c.amount, 0);
  const totalCancelled = commissions.filter(c => c.status === "cancelled").reduce((s, c) => s + c.amount, 0);

  return { totalPending, totalPaid, totalCancelled, count: commissions.length };
}
