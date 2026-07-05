"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type ExperienceData = {
  title: string;
  company: string;
  sector: string;
  country: string;
  startDate: string;
  endDate: string;
  description: string;
  responsibilities: string;
  teamSize: string;
  revenue: string;
  budget: string;
  tools: string;
  achievements: string;
};

export async function getExperiences(profileId: string) {
  return prisma.experience.findMany({
    where: { profileId },
    orderBy: { startDate: "desc" },
  });
}

export async function addExperience(profileId: string, data: ExperienceData) {
  const exp = await prisma.experience.create({
    data: {
      ...data,
      endDate: data.endDate || null,
      profileId,
    },
  });
  revalidatePath("/profil");
  return exp;
}

export async function updateExperience(id: string, data: ExperienceData) {
  const exp = await prisma.experience.update({
    where: { id },
    data: {
      ...data,
      endDate: data.endDate || null,
    },
  });
  revalidatePath("/profil");
  return exp;
}

export async function deleteExperience(id: string) {
  await prisma.experience.delete({ where: { id } });
  revalidatePath("/profil");
}
