"use server";

import { prisma } from "@/lib/prisma";

type ExportedRecord = unknown;

export async function exportAllData(): Promise<{
  exportedAt: string;
  profile: ExportedRecord;
  cvMaster: ExportedRecord;
  proofEntries: ExportedRecord;
  opportunities: ExportedRecord;
  documents: ExportedRecord;
  pipelineTasks: ExportedRecord;
  relances: ExportedRecord;
  interviews: ExportedRecord;
  analyses: ExportedRecord;
  settings: ExportedRecord;
  aiPrompts: ExportedRecord;
  jobSources: ExportedRecord;
}> {
  const [
    profile,
    cvMaster,
    proofEntries,
    opportunities,
    documents,
    pipelineTasks,
    relances,
    interviews,
    analyses,
    settings,
    aiPrompts,
    jobSources,
  ] = await Promise.all([
    prisma.profile.findFirst(),
    prisma.cVMaster.findMany({ orderBy: { uploadedAt: "desc" } }),
    prisma.proofEntry.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.opportunity.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.document.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.pipelineTask.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.relance.findMany({ orderBy: { date: "desc" } }),
    prisma.interview.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.analysis.findMany(),
    prisma.setting.findFirst(),
    prisma.aIPrompt.findMany(),
    prisma.jobSource.findMany(),
  ]);

  // Strip apiKey from settings export
  const safeSettings = settings
    ? { ...settings, apiKey: undefined, hasApiKey: !!(settings as Record<string, unknown>).apiKey }
    : null;

  return {
    exportedAt: new Date().toISOString(),
    profile,
    cvMaster,
    proofEntries,
    opportunities,
    documents,
    pipelineTasks,
    relances,
    interviews,
    analyses,
    settings: safeSettings,
    aiPrompts,
    jobSources,
  };
}
