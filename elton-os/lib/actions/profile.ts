"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type ProfileData = {
  fullName: string;
  title: string;
  summary: string;
  phone: string;
  email: string;
  linkedin: string;
  location: string;
  photoUrl: string;
  mobility: string;
  languages: string;
  yearsExp: number;
  sectors: string;
  functions: string;
  education: string;
  certifications: string;
  remotePreference: string;
  targetSalary: string;
  constraints: string;
  preferredTone: string;
  cvDefaultTemplate: string;
  cvIncludePhoto: boolean;
  cvIncludeLinkedIn: boolean;
  cvAccentColor: string;
};

export async function getProfile() {
  return prisma.profile.findFirst({
    include: { cvMaster: true, _count: { select: { experiences: true, skills: true, proofEntries: true } } },
  });
}

export async function upsertProfile(data: ProfileData) {
  const existing = await prisma.profile.findFirst();
  let profile;
  if (existing) {
    profile = await prisma.profile.update({ where: { id: existing.id }, data });
  } else {
    profile = await prisma.profile.create({ data: { ...data, yearsExp: data.yearsExp || 0 } });
  }
  revalidatePath("/profil");
  return profile;
}

export async function getPriorityRoles() {
  return prisma.priorityRole.findMany({ where: { active: true }, orderBy: { rank: "asc" } });
}

export async function getTargetCountries() {
  return prisma.targetCountry.findMany({ where: { active: true }, orderBy: { priority: "desc" } });
}
