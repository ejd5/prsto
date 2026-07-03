import { prisma } from "@/lib/prisma";

export async function getCandidateDossiers(userId: string, candidateId: string) {
  return prisma.candidateDossier.findMany({
    where: { candidateId, userId },
    orderBy: { version: "desc" },
  });
}

export async function createCandidateDossierVersion(
  userId: string,
  candidateId: string,
  data: { cvOptimized?: string; coverLetter?: string; interviewBrief?: string; notes?: string },
) {
  const lastVersion = await prisma.candidateDossier.findFirst({
    where: { candidateId, userId },
    orderBy: { version: "desc" },
  });

  const version = (lastVersion?.version ?? 0) + 1;

  return prisma.candidateDossier.create({
    data: { ...data, version, candidateId, userId },
  });
}

export async function getCandidateNotes(userId: string, candidateId: string) {
  return prisma.candidateNote.findMany({
    where: { candidateId, userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function addCandidateNote(userId: string, candidateId: string, content: string, category = "general") {
  return prisma.candidateNote.create({
    data: { candidateId, userId, content, category },
  });
}

export async function deleteCandidateNote(userId: string, noteId: string) {
  return prisma.candidateNote.deleteMany({
    where: { id: noteId, userId },
  });
}
