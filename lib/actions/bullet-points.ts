"use server";

import { prisma } from "@/lib/prisma";
import { generateAllBulletPoints, type GeneratedBullets } from "@/lib/jobs/bullet-point-generator";

export async function generateExperienceBullets(): Promise<{
  experiences: GeneratedBullets[];
  totalExperiences: number;
}> {
  const profile = await prisma.profile.findFirst();
  if (!profile) throw new Error("Aucun profil trouvé.");

  const experiences = await prisma.experience.findMany({
    where: { profileId: profile.id },
    orderBy: { startDate: "desc" },
  });

  if (experiences.length === 0) {
    throw new Error("Aucune expérience trouvée. Ajoutez d'abord des expériences dans votre profil.");
  }

  const bullets = await generateAllBulletPoints(
    experiences.map((e) => ({
      company: e.company,
      title: e.title,
      sector: e.sector || undefined,
      startDate: e.startDate,
      endDate: e.endDate || undefined,
      description: e.description || undefined,
      responsibilities: e.responsibilities || undefined,
      teamSize: e.teamSize || undefined,
      revenue: e.revenue || undefined,
      budget: e.budget || undefined,
      achievements: e.achievements || undefined,
    }))
  );

  return { experiences: bullets, totalExperiences: experiences.length };
}

export async function getBulletPointStatus(): Promise<{
  hasExperiences: boolean;
  experienceCount: number;
  companyNames: string[];
}> {
  const profile = await prisma.profile.findFirst();
  if (!profile) return { hasExperiences: false, experienceCount: 0, companyNames: [] };

  const experiences = await prisma.experience.findMany({
    where: { profileId: profile.id },
    orderBy: { startDate: "desc" },
    select: { company: true, title: true },
  });

  return {
    hasExperiences: experiences.length > 0,
    experienceCount: experiences.length,
    companyNames: experiences.map((e) => e.company),
  };
}
