"use server";

import { prisma } from "@/lib/prisma";
import { analyzeLinkedInProfile, matchKeywordsWithJobDescriptions, type LinkedInAnalysis, type KeywordMatchResult } from "@/lib/jobs/linkedin-optimizer";

export async function runLinkedInAnalysis(): Promise<LinkedInAnalysis> {
  const profile = await prisma.profile.findFirst();
  if (!profile) throw new Error("Aucun profil trouvé.");

  const experiences = await prisma.experience.findMany({
    where: { profileId: profile.id },
    orderBy: { startDate: "desc" },
  });

  const skills = await prisma.skill.findMany({
    where: { profileId: profile.id },
  });

  const targetLinkedinUrl = profile.linkedin || "https://www.linkedin.com/in/elton-duarte-684bb221/";
  const eltonHeadline = "Directeur Commercial B2B & Opérations | Management d'équipes | Conduite du changement";
  const eltonSummary = profile.summary || "Dirigeant avec un solide parcours dans la conduite de centres de profit, la négociation Grands Comptes et l'optimisation des performances dans les secteurs de la distribution B2B et de la Franchise.";

  // Détection des champs de profil pour la complétude
  const hasPhoto = !!(profile as any).photoUrl || !!(profile as any).avatarUrl;
  const hasBanner = !!(profile as any).bannerUrl;
  const hasCustomUrl = !!(profile.linkedin && profile.linkedin.includes("/in/"));
  const recommendations = (profile as any).recommendationCount ?? 0;

  return analyzeLinkedInProfile({
    fullName: profile.fullName || "Elton Duarte",
    title: profile.title || "Directeur Commercial & Opérations",
    summary: eltonSummary,
    headline: eltonHeadline,
    location: profile.location || "France",
    sectors: profile.sectors || "Distribution, Franchise",
    functions: profile.functions || "Commercial, Management",
    education: profile.education || undefined,
    certifications: profile.certifications || undefined,
    languages: profile.languages || undefined,
    linkedin: targetLinkedinUrl,
    profilePhoto: hasPhoto,
    bannerImage: hasBanner,
    customUrl: hasCustomUrl,
    recommendations: recommendations,
    experiences: experiences.map((e) => ({
      company: e.company,
      title: e.title,
      sector: e.sector || undefined,
      startDate: e.startDate,
      endDate: e.endDate || undefined,
      description: e.description || e.responsibilities || "",
      achievements: e.achievements || undefined,
    })),
    skills: skills.map((s) => ({
      name: s.name,
      category: s.category,
      level: s.level,
    })),
  });
}

export async function matchKeywordsForProfile(jobDescriptionText: string): Promise<KeywordMatchResult> {
  const profile = await prisma.profile.findFirst();
  if (!profile) throw new Error("Aucun profil trouvé.");

  const experiences = await prisma.experience.findMany({
    where: { profileId: profile.id },
    orderBy: { startDate: "desc" },
  });

  const skills = await prisma.skill.findMany({
    where: { profileId: profile.id },
  });

  return matchKeywordsWithJobDescriptions({
    fullName: profile.fullName || "",
    title: profile.title || "",
    summary: profile.summary || "",
    headline: undefined,
    experiences: experiences.map((e) => ({
      company: e.company,
      title: e.title,
      sector: e.sector || undefined,
      startDate: e.startDate,
      endDate: e.endDate || undefined,
      description: e.description || "",
      achievements: e.achievements || undefined,
    })),
    skills: skills.map((s) => ({
      name: s.name,
      category: s.category,
      level: s.level,
    })),
  }, [jobDescriptionText]);
}

export async function getLinkedInStatus(): Promise<{
  hasProfile: boolean;
  fullName: string;
  title: string;
  linkedin: string;
}> {
  const profile = await prisma.profile.findFirst();
  if (!profile) {
    return { hasProfile: false, fullName: "", title: "", linkedin: "" };
  }

  return {
    hasProfile: true,
    fullName: profile.fullName,
    title: profile.title,
    linkedin: profile.linkedin || "https://www.linkedin.com/in/elton-duarte-684bb221/",
  };
}
