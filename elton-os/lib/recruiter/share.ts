import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function getShareLinks(userId: string, missionId: string) {
  const mission = await prisma.recruiterMission.findFirst({
    where: { id: missionId, userId },
  });
  if (!mission) return null;

  return prisma.missionShareLink.findMany({
    where: { missionId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createShareLink(userId: string, missionId: string, expiresInDays?: number) {
  const mission = await prisma.recruiterMission.findFirst({
    where: { id: missionId, userId },
  });
  if (!mission) throw new Error("Mission introuvable");

  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  return prisma.missionShareLink.create({
    data: { missionId, token, expiresAt },
  });
}

export async function deactivateShareLink(userId: string, linkId: string) {
  const link = await prisma.missionShareLink.findFirst({
    where: { id: linkId },
    include: { mission: true },
  });
  if (!link || link.mission.userId !== userId) throw new Error("Lien introuvable");

  return prisma.missionShareLink.update({
    where: { id: linkId },
    data: { active: false },
  });
}

export async function getMissionByShareToken(token: string) {
  const link = await prisma.missionShareLink.findUnique({
    where: { token },
    include: {
      mission: {
        include: {
          client: { select: { id: true, company: true } },
          candidates: {
            include: { candidate: { select: { id: true, name: true, cvOptimized: true } } },
            orderBy: { proposedAt: "desc" },
          },
        },
      },
    },
  });

  if (!link || !link.active) return null;
  if (link.expiresAt && link.expiresAt < new Date()) return null;

  return link;
}
