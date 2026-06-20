"use server";

import { prisma } from "@/lib/prisma";
import { detectRealUsageStatus, realUsageReadiness, type DetectionResult } from "@/lib/real-usage/detection";

const DEMO_TAG = "[DEMO]";

export async function getRealUsageStatus(): Promise<{
  detections: DetectionResult[];
  readiness: number;
}> {
  const [
    demoProfile,
    cvMasterCount,
    proofEntries,
    opps,
    approvedDocs,
    relances,
    pipelineTasks,
    profileComplete,
  ] = await Promise.all([
    prisma.profile.findFirst({ where: { fullName: { startsWith: DEMO_TAG } } }),
    prisma.cVMaster.count({ where: { fileName: { not: { startsWith: DEMO_TAG } } } }),
    Promise.all([
      prisma.proofEntry.count({ where: { title: { not: { startsWith: DEMO_TAG } } } }),
      prisma.proofEntry.count({ where: { title: { not: { startsWith: DEMO_TAG } }, verifiable: true } }),
    ]),
    Promise.all([
      prisma.opportunity.count({ where: { title: { not: { startsWith: DEMO_TAG } } } }),
      prisma.opportunity.count({ where: { title: { not: { startsWith: DEMO_TAG } }, analysis: { isNot: null } } }),
    ]),
    prisma.document.count({ where: { content: { not: { startsWith: DEMO_TAG } }, status: "APPROVED" } }),
    Promise.all([
      prisma.relance.count({ where: { status: "a_envoyer" } }),
      prisma.relance.count({ where: { status: "envoye" } }),
    ]),
    prisma.pipelineTask.count({ where: { opportunity: { title: { not: { startsWith: DEMO_TAG } } } } }),
    prisma.profile.findFirst({ where: { fullName: { not: { startsWith: DEMO_TAG } } }, select: { fullName: true, title: true } }),
  ]);

  const detections = detectRealUsageStatus({
    demoProfileExists: !!demoProfile,
    cvMasterExists: cvMasterCount > 0,
    proofCount: proofEntries[0],
    verifiableProofCount: proofEntries[1],
    opportunityCount: opps[0],
    analyzedOpportunityCount: opps[1],
    approvedDocCount: approvedDocs,
    plannedRelanceCount: relances[0],
    sentRelanceCount: relances[1],
    pipelineTaskCount: pipelineTasks,
    profileComplete: !!(profileComplete?.fullName && profileComplete?.title),
  });

  return {
    detections,
    readiness: realUsageReadiness(detections),
  };
}
