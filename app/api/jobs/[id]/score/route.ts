import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scoreJob } from "@/lib/jobs/deepseek-job-scorer";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const scoreData = await scoreJob(job);

  await prisma.jobScore.upsert({
    where: { jobId: id },
    update: { ...scoreData, reasonsJson: JSON.stringify(scoreData.reasons), redFlagsJson: JSON.stringify(scoreData.redFlags) },
    create: { jobId: id, ...scoreData, reasonsJson: JSON.stringify(scoreData.reasons), redFlagsJson: JSON.stringify(scoreData.redFlags) },
  });

  return NextResponse.json({ success: true, score: scoreData });
}
