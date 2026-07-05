"use server";

import { prisma } from "@/lib/prisma";
import { optimizeCv, type CvOptimizationResult } from "@/lib/jobs/ai-cv-optimizer";

export interface CvOptimizerInput {
  jobTitle: string;
  jobDescription: string;
  company?: string;
}

export async function runCvOptimization(input: CvOptimizerInput): Promise<CvOptimizationResult> {
  const profile = await prisma.profile.findFirst();
  if (!profile) throw new Error("Aucun profil trouvé.");

  const cvMaster = await prisma.cVMaster.findUnique({ where: { profileId: profile.id } });
  const cvText = cvMaster?.originalText || profile.summary || "";

  if (!cvText || cvText.trim().length < 50) {
    throw new Error("CV Maître introuvable. Importez d'abord votre CV.");
  }

  const experiences = await prisma.experience.findMany({
    where: { profileId: profile.id },
    orderBy: { startDate: "desc" },
  });

  const skills = await prisma.skill.findMany({
    where: { profileId: profile.id },
  });

  return optimizeCv({
    cvText,
    jobTitle: input.jobTitle,
    jobDescription: input.jobDescription,
    company: input.company,
    profile: {
      fullName: profile.fullName,
      title: profile.title,
      summary: profile.summary,
      sectors: profile.sectors || undefined,
      functions: profile.functions || undefined,
      education: profile.education || undefined,
    },
    experiences: experiences.map((e) => ({
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
    })),
    skills: skills.map((s) => ({
      name: s.name,
      category: s.category,
      level: s.level,
    })),
  });
}

export async function getCvOptimizerStatus(): Promise<{
  hasCv: boolean;
  cvTitle: string;
  experienceCount: number;
  skillCount: number;
}> {
  const profile = await prisma.profile.findFirst();
  if (!profile) return { hasCv: false, cvTitle: "", experienceCount: 0, skillCount: 0 };

  const cvMaster = await prisma.cVMaster.findUnique({ where: { profileId: profile.id } });
  const experienceCount = await prisma.experience.count({ where: { profileId: profile.id } });
  const skillCount = await prisma.skill.count({ where: { profileId: profile.id } });

  return {
    hasCv: !!cvMaster,
    cvTitle: cvMaster?.fileName || "",
    experienceCount,
    skillCount,
  };
}

export interface RealCvPreviewData {
  fullName: string;
  title: string;
  summary: string;
  experiences: Array<{
    id: string;
    company: string;
    title: string;
    period: string;
    desc: string;
  }>;
  skills: string[];
}

export async function getRealCvPreviewData(): Promise<RealCvPreviewData | null> {
  const profile = await prisma.profile.findFirst();
  if (!profile) return null;

  const experiences = await prisma.experience.findMany({
    where: { profileId: profile.id },
    orderBy: { startDate: "desc" },
  });

  const skills = await prisma.skill.findMany({
    where: { profileId: profile.id },
  });

  const formatPeriod = (start: string, end?: string | null) => {
    const parseDateStr = (dateStr: string) => {
      // Handles ISO dates, raw year strings, or full dates
      if (!dateStr) return "";
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr; // fallback if raw string like '2021'
      const months = ["Janv.", "Févr.", "Mars", "Avril", "Mai", "Juin", "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc."];
      return `${months[d.getMonth()]} ${d.getFullYear()}`;
    };

    const startFormatted = parseDateStr(start);
    const endFormatted = end ? parseDateStr(end) : "Présent";
    return startFormatted && endFormatted ? `${startFormatted} - ${endFormatted}` : startFormatted || endFormatted;
  };

  return {
    fullName: profile.fullName || "Cadre Dirigeant",
    title: profile.title || "Directeur Exécutif",
    summary: profile.summary || "",
    experiences: experiences.map(e => ({
      id: e.id,
      company: e.company,
      title: e.title,
      period: formatPeriod(e.startDate, e.endDate),
      desc: e.description || e.responsibilities || "Description du poste et réalisations clés.",
    })),
    skills: skills.map(s => s.name),
  };
}
