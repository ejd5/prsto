"use server";

import { prisma } from "@/lib/prisma";
import { scanResume, type AtsScanResult } from "@/lib/jobs/ats-resume-scanner";

export interface AtsScannerInput {
  jobTitle: string;
  jobDescription: string;
  company?: string;
}

export async function runAtsScan(input: AtsScannerInput): Promise<AtsScanResult> {
  const profile = await prisma.profile.findFirst();
  if (!profile) throw new Error("Aucun profil trouvé. Veuillez d'abord configurer votre profil.");

  const cvMaster = await prisma.cVMaster.findUnique({ where: { profileId: profile.id } });
  const cvText = cvMaster?.originalText || profile.summary || "";

  if (!cvText || cvText.trim().length < 50) {
    throw new Error("CV Maître introuvable ou trop court. Importez d'abord votre CV dans CV Maître.");
  }

  return scanResume({
    cvText,
    jobTitle: input.jobTitle,
    jobDescription: input.jobDescription,
    company: input.company,
  });
}

export async function getCvStatus(): Promise<{ hasCv: boolean; cvTitle: string; wordCount: number }> {
  const profile = await prisma.profile.findFirst();
  if (!profile) return { hasCv: false, cvTitle: "", wordCount: 0 };

  const cvMaster = await prisma.cVMaster.findUnique({ where: { profileId: profile.id } });
  if (!cvMaster) return { hasCv: false, cvTitle: "", wordCount: 0 };

  return {
    hasCv: true,
    cvTitle: cvMaster.fileName,
    wordCount: cvMaster.originalText.split(/\s+/).filter(Boolean).length,
  };
}
