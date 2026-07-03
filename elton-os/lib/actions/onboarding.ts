"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { calculateAgentReadiness } from "@/lib/onboarding/readiness";
import type {
  ReadinessProfile,
  ReadinessCVMaster,
  ReadinessExperience,
  ReadinessSkill,
  ReadinessProofEntry,
  ReadinessJobSource,
  ReadinessSettings,
  ReadinessPipelineStats,
  ReadinessPriorityRole,
  ReadinessTargetCountry,
} from "@/lib/onboarding/readiness";

const COOKIE_NAME = "onboarding-step";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 jours

export async function getOnboardingState() {
  const profile = await prisma.profile.findFirst({
    include: {
      cvMaster: true,
      skills: true,
      experiences: { orderBy: { startDate: "desc" } },
      proofEntries: true,
    },
  });

  const [jobSources, settings, pipelineCount, priorityRoles, targetCountries] =
    await Promise.all([
      prisma.jobSource.findMany({ orderBy: [{ priority: "desc" }, { name: "asc" }] }),
      prisma.setting.findUnique({ where: { id: "elton-os-settings" } }),
      prisma.pipelineTask.count(),
      prisma.priorityRole.findMany({ where: { active: true }, orderBy: { rank: "asc" } }),
      prisma.targetCountry.findMany({ where: { active: true }, orderBy: { priority: "desc" } }),
    ]);

  const readinessProfile: ReadinessProfile | null = profile
    ? {
        fullName: profile.fullName || null,
        title: profile.title || null,
        email: profile.email || null,
        phone: profile.phone || null,
        languages: profile.languages || null,
        yearsExp: profile.yearsExp || null,
        sectors: profile.sectors || null,
        functions: profile.functions || null,
        education: profile.education || null,
        certifications: profile.certifications || null,
        remotePreference: profile.remotePreference || null,
        targetSalary: profile.targetSalary || null,
        constraints: profile.constraints || null,
        preferredTone: profile.preferredTone || null,
      }
    : null;

  const cvMaster: ReadinessCVMaster = profile?.cvMaster
    ? { originalText: profile.cvMaster.originalText, status: profile.cvMaster.status }
    : null;

  const experiences: ReadinessExperience[] = (profile?.experiences || []).map((e) => ({
    company: e.company,
    title: e.title,
    startDate: e.startDate,
    description: e.description || null,
    teamSize: e.teamSize || null,
    revenue: e.revenue || null,
    budget: e.budget || null,
  }));

  const skills: ReadinessSkill[] = (profile?.skills || []).map((s) => ({ name: s.name }));

  const proofEntries: ReadinessProofEntry[] = (profile?.proofEntries || []).map((p) => ({
    category: p.category,
    title: p.title,
    value: p.value,
    verifiable: p.verifiable,
  }));

  const jobSourcesReady: ReadinessJobSource[] = jobSources.map((s) => ({
    active: s.active,
    priority: s.priority,
  }));

  const settingsReady: ReadinessSettings | null = settings
    ? {
        aiProvider: settings.aiProvider,
        apiKey: settings.apiKey || null,
        confidentialityMode: settings.confidentialityMode,
      }
    : null;

  const pipelineStats: ReadinessPipelineStats = { total: pipelineCount };

  const priorityRolesReady: ReadinessPriorityRole[] = priorityRoles.map((r) => ({ name: r.name }));
  const targetCountriesReady: ReadinessTargetCountry[] = targetCountries.map((c) => ({ code: c.code }));

  const readiness = calculateAgentReadiness({
    profile: readinessProfile,
    cvMaster,
    experiences,
    skills,
    proofEntries,
    jobSources: jobSourcesReady,
    settings: settingsReady,
    pipelineStats,
    priorityRoles: priorityRolesReady,
    targetCountries: targetCountriesReady,
  });

  return {
    readiness,
    profile: profile
      ? {
          id: profile.id,
          fullName: profile.fullName,
          title: profile.title,
          email: profile.email || "",
          phone: profile.phone || "",
          linkedin: profile.linkedin || "",
          location: profile.location || "",
          mobility: profile.mobility || "",
          languages: profile.languages || "",
          yearsExp: profile.yearsExp || 0,
          sectors: profile.sectors || "",
          functions: profile.functions || "",
          education: profile.education || "",
          certifications: profile.certifications || "",
          remotePreference: profile.remotePreference || "",
          targetSalary: profile.targetSalary || "",
          summary: profile.summary || "",
          constraints: profile.constraints || "",
          preferredTone: profile.preferredTone || "",
        }
      : null,
    cvMaster: profile?.cvMaster
      ? {
          id: profile.cvMaster.id,
          fileName: profile.cvMaster.fileName,
          originalText: profile.cvMaster.originalText,
          status: profile.cvMaster.status,
        }
      : null,
    experiences: (profile?.experiences || []).map((e) => ({
      id: e.id,
      company: e.company,
      title: e.title,
      sector: e.sector || "",
      country: e.country || "",
      startDate: e.startDate,
      endDate: e.endDate || "",
      description: e.description || "",
      responsibilities: e.responsibilities || "",
      teamSize: e.teamSize || "",
      revenue: e.revenue || "",
      budget: e.budget || "",
      tools: e.tools || "",
      achievements: e.achievements || "",
    })),
    skills: (profile?.skills || []).map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      level: s.level,
      source: s.source,
    })),
    proofEntries: (profile?.proofEntries || []).map((p) => ({
      id: p.id,
      category: p.category,
      title: p.title,
      value: p.value,
      context: p.context || "",
      period: p.period || "",
      confidence: p.confidence,
      verifiable: p.verifiable,
      isConfidential: p.isConfidential,
      usableForCV: p.usableForCV,
      usableForLetter: p.usableForLetter,
      sendableToAI: p.sendableToAI,
      documentUrl: p.documentUrl || "",
      experienceId: p.experienceId || "",
    })),
    jobSources: jobSources.map((s) => ({
      id: s.id,
      name: s.name,
      url: s.url,
      region: s.region,
      type: s.type,
      priority: s.priority,
      active: s.active,
      notes: s.notes || "",
    })),
    settings: settings
      ? {
          aiProvider: settings.aiProvider,
          apiKey: settings.apiKey || "",
          confidentialityMode: settings.confidentialityMode,
          anonymizeBeforeCall: settings.anonymizeBeforeCall,
        }
      : null,
    priorityRoles: priorityRoles.map((r) => ({ id: r.id, name: r.name, rank: r.rank })),
    targetCountries: targetCountries.map((c) => ({ id: c.id, name: c.name, code: c.code, priority: c.priority })),
    pipelineStats,
  };
}

export async function saveOnboardingStep(step: number) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, String(step), {
    maxAge: COOKIE_MAX_AGE,
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });
}

export async function getOnboardingStep(): Promise<number> {
  const cookieStore = await cookies();
  const step = cookieStore.get(COOKIE_NAME);
  return step ? parseInt(step.value, 10) || 1 : 1;
}
