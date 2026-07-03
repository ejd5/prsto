"use server";

import { prisma } from "@/lib/prisma";
import {
  getApplicationPipeline,
  ensureApplicationDraftForJob,
  markSent, markFollowedUp, markRecruiterReplied,
  markInterviewScheduled, markRejected, archiveApplication,
  generateFollowUpMessage, getPipelineItem,
} from "@/lib/jobs/application-pipeline";

export async function getAutoApplyDashboard() {
  const pipeline = await getApplicationPipeline();
  const profile = await prisma.profile.findFirst();

  const totalJobs = await prisma.job.count();

  const jobsWithoutDraft = await prisma.job.count({
    where: { draft: null },
  });

  const recentJobs = await prisma.job.findMany({
    where: { draft: null },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      score: { select: { globalScore: true, recommendation: true } },
    },
  });

  return {
    pipeline,
    profileName: profile?.fullName || "",
    stats: {
      totalJobs,
      jobsWithoutDraft,
      pipelineTotal: pipeline.stats.total,
      sent: pipeline.stats.sent + pipeline.stats.toFollowUp,
      interviews: pipeline.stats.interview,
      offers: pipeline.stats.offer,
    },
    recentJobs,
  };
}

export async function createDraftForJob(jobId: string) {
  const draft = await ensureApplicationDraftForJob(jobId);
  return { success: true, draftId: draft.id };
}

export {
  getApplicationPipeline,
  ensureApplicationDraftForJob,
  markSent, markFollowedUp, markRecruiterReplied,
  markInterviewScheduled, markRejected, archiveApplication,
  generateFollowUpMessage, getPipelineItem,
};
