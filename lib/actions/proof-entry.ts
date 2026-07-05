"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type ProofEntryData = {
  category: string;
  title: string;
  value: string;
  context: string;
  period: string;
  confidence: string;
  verifiable: boolean;
  isConfidential: boolean;
  usableForCV: boolean;
  usableForLetter: boolean;
  sendableToAI: boolean;
  documentUrl: string;
  experienceId: string;
};

export async function getProofEntries(profileId: string) {
  return prisma.proofEntry.findMany({
    where: { profileId },
    include: { experience: { select: { id: true, title: true, company: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function addProofEntry(profileId: string, data: ProofEntryData) {
  const entry = await prisma.proofEntry.create({
    data: {
      ...data,
      experienceId: data.experienceId || null,
      profileId,
    },
  });
  revalidatePath("/proof-vault");
  return entry;
}

export async function updateProofEntry(id: string, data: ProofEntryData) {
  const entry = await prisma.proofEntry.update({
    where: { id },
    data: {
      ...data,
      experienceId: data.experienceId || null,
    },
  });
  revalidatePath("/proof-vault");
  return entry;
}

export async function deleteProofEntry(id: string) {
  await prisma.proofEntry.delete({ where: { id } });
  revalidatePath("/proof-vault");
}
