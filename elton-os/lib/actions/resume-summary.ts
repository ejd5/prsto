"use server";

import { prisma } from "@/lib/prisma";
import { generateAllVariants, generateSummary, adaptForJob, type GeneratedSummary, type SummaryInput } from "@/lib/jobs/resume-summary-generator";

export async function generateResumeSummaries(input?: {
  targetRole?: string;
  company?: string;
  tone?: string;
}): Promise<{ variants: GeneratedSummary[]; adapted?: GeneratedSummary }> {
  const profile = await prisma.profile.findFirst();
  if (!profile) throw new Error("Aucun profil trouvé.");

  const experiences = await prisma.experience.findMany({
    where: { profileId: profile.id },
    orderBy: { startDate: "desc" },
  });

  const skills = await prisma.skill.findMany({
    where: { profileId: profile.id },
  });

  const summaryInput: SummaryInput = {
    fullName: profile.fullName,
    title: profile.title,
    summary: profile.summary,
    yearsExp: profile.yearsExp,
    sectors: profile.sectors || undefined,
    functions: profile.functions || undefined,
    education: profile.education || undefined,
    certifications: profile.certifications || undefined,
    languages: profile.languages || undefined,
    location: profile.location || undefined,
    mobility: profile.mobility || undefined,
    preferredTone: profile.preferredTone || undefined,
    targetRole: input?.targetRole,
    company: input?.company,
    experiences: experiences.map((e) => ({
      title: e.title,
      company: e.company,
      startDate: e.startDate,
      endDate: e.endDate || undefined,
      achievements: e.achievements || undefined,
      revenue: e.revenue || undefined,
      teamSize: e.teamSize || undefined,
      budget: e.budget || undefined,
    })),
    skills: skills.map((s) => ({
      name: s.name,
      category: s.category,
      level: s.level,
    })),
  };

  const variants = await generateAllVariants(summaryInput);
  const result: { variants: GeneratedSummary[]; adapted?: GeneratedSummary } = { variants };

  if (input?.targetRole) {
    result.adapted = await adaptForJob(summaryInput, input.targetRole, input.company);
  }

  return result;
}

export async function getProfileSummaryStatus(): Promise<{
  hasProfile: boolean;
  fullName: string;
  title: string;
  currentSummary: string;
  experienceCount: number;
  skillCount: number;
  preferredTone: string;
}> {
  const profile = await prisma.profile.findFirst();
  if (!profile) {
    return { hasProfile: false, fullName: "", title: "", currentSummary: "", experienceCount: 0, skillCount: 0, preferredTone: "formel" };
  }

  const experienceCount = await prisma.experience.count({ where: { profileId: profile.id } });
  const skillCount = await prisma.skill.count({ where: { profileId: profile.id } });

  return {
    hasProfile: true,
    fullName: profile.fullName,
    title: profile.title,
    currentSummary: profile.summary || "",
    experienceCount,
    skillCount,
    preferredTone: profile.preferredTone || "formel",
  };
}
