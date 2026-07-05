"use server";

import { prisma } from "@/lib/prisma";
import {
  analyzeSkillGaps, searchSkills, getAllCategories,
  getSkillsByCategory, getSkillsBySector, getSkillsByFunction,
  SECTOR_PROFILES, FUNCTION_PROFILES,
  type SkillGapAnalysis, type SkillDefinition, type SkillCategory,
} from "@/lib/jobs/skills-database";

export async function runSkillGapAnalysis(params?: {
  targetSector?: string;
  targetFunction?: string;
}): Promise<{
  analysis: SkillGapAnalysis;
  userSkillCount: number;
  sectorOptions: typeof SECTOR_PROFILES;
  functionOptions: typeof FUNCTION_PROFILES;
}> {
  const profile = await prisma.profile.findFirst();
  if (!profile) throw new Error("Aucun profil trouvé.");

  const userSkills = await prisma.skill.findMany({
    where: { profileId: profile.id },
  });

  const analysis = await analyzeSkillGaps(
    userSkills.map((s) => ({ name: s.name, category: s.category, level: s.level })),
    params?.targetSector,
    params?.targetFunction
  );

  return {
    analysis,
    userSkillCount: userSkills.length,
    sectorOptions: SECTOR_PROFILES,
    functionOptions: FUNCTION_PROFILES,
  };
}

export async function browseSkills(params: {
  category?: SkillCategory;
  sector?: string;
  func?: string;
  query?: string;
}): Promise<{
  skills: SkillDefinition[];
  categories: { key: SkillCategory; label: string; count: number }[];
}> {
  let skills: SkillDefinition[] = [];

  if (params.query) {
    skills = searchSkills(params.query);
  } else if (params.category) {
    skills = getSkillsByCategory(params.category);
  } else if (params.sector) {
    const result = getSkillsBySector(params.sector);
    skills = [...result.critical, ...result.recommended];
  } else if (params.func) {
    const result = getSkillsByFunction(params.func);
    skills = [...result.critical, ...result.recommended];
  } else {
    skills = getSkillsByCategory("leadership");
  }

  return { skills, categories: getAllCategories() };
}

export async function getSkillsDashboard(): Promise<{
  totalSkills: number;
  userSkillCount: number;
  categories: { key: SkillCategory; label: string; count: number }[];
  sectors: typeof SECTOR_PROFILES;
  functions: typeof FUNCTION_PROFILES;
  topUserSkills: { name: string; category: string; level: string }[];
}> {
  const profile = await prisma.profile.findFirst();
  const userSkills = profile
    ? await prisma.skill.findMany({ where: { profileId: profile.id }, orderBy: { name: "asc" } })
    : [];

  return {
    totalSkills: 0,
    userSkillCount: userSkills.length,
    categories: getAllCategories(),
    sectors: SECTOR_PROFILES,
    functions: FUNCTION_PROFILES,
    topUserSkills: userSkills.map((s) => ({ name: s.name, category: s.category, level: s.level })),
  };
}
