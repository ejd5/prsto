"use server";

import { prisma } from "@/lib/prisma";
import {
  extractExperiencesFromResumeText,
  detectDuplicateExperience,
  resetIdCounter,
  type ExtractedExperience,
} from "@/lib/resume/experience-extractor";

export async function getMasterResumeText(profileId: string): Promise<string | null> {
  const cv = await prisma.cVMaster.findUnique({
    where: { profileId },
    select: { originalText: true },
  });
  return cv?.originalText || null;
}

export async function previewExperiencesFromMasterResume(
  profileId: string
): Promise<{ experiences: ExtractedExperience[]; error?: string }> {
  const text = await getMasterResumeText(profileId);
  if (!text) {
    return { experiences: [], error: "Aucun CV maître trouvé. Importez d'abord votre CV." };
  }

  resetIdCounter();
  const experiences = extractExperiencesFromResumeText(text);

  if (experiences.length === 0) {
    return { experiences: [], error: "Aucune expérience détectée dans le CV. Vérifiez le format ou saisissez vos expériences manuellement." };
  }

  return { experiences };
}

export async function importSelectedExperiences(
  profileId: string,
  experiences: ExtractedExperience[]
): Promise<{ imported: number; skipped: number; duplicates: { title: string; company: string }[] }> {
  const existing = await prisma.experience.findMany({
    where: { profileId },
    select: { company: true, title: true, startDate: true, endDate: true },
  });

  let imported = 0;
  let skipped = 0;
  const duplicates: { title: string; company: string }[] = [];

  for (const exp of experiences) {
    const dup = detectDuplicateExperience(exp, existing.map(e => ({ ...e, endDate: e.endDate || "" })));
    if (dup.isDuplicate) {
      skipped++;
      duplicates.push({ title: exp.title || "", company: exp.company || "" });
      continue;
    }

    await prisma.experience.create({
      data: {
        profileId,
        company: exp.company || "",
        title: exp.title || "",
        sector: exp.sector || "",
        country: exp.country || "",
        startDate: exp.startDate || "",
        endDate: exp.endDate || "",
        description: exp.description || "",
        responsibilities: exp.achievements.join("\n") || "",
        teamSize: exp.teamSize || "",
        revenue: exp.revenue || "",
        budget: exp.budget || "",
        tools: exp.tools.join(", ") || "",
        achievements: exp.achievements.join("\n") || "",
      },
    });
    imported++;
  }

  return { imported, skipped, duplicates };
}
