"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type SkillData = {
  name: string;
  category: string;
  level: string;
  source: string;
};

export async function getSkills(profileId: string) {
  return prisma.skill.findMany({ where: { profileId }, orderBy: { category: "asc" } });
}

export async function addSkill(profileId: string, data: SkillData) {
  const skill = await prisma.skill.create({ data: { ...data, profileId } });
  revalidatePath("/profil");
  return skill;
}

export async function updateSkill(id: string, data: SkillData) {
  const skill = await prisma.skill.update({ where: { id }, data });
  revalidatePath("/profil");
  return skill;
}

export async function deleteSkill(id: string) {
  await prisma.skill.delete({ where: { id } });
  revalidatePath("/profil");
}
