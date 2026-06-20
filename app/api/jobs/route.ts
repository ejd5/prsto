import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getJobDemoFilter, parseDemoMode } from "@/lib/jobs/demo-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const locationPriority = searchParams.get("priority");
  const minScore = searchParams.get("minScore");
  const newOnly = searchParams.get("new");
  const limit = parseInt(searchParams.get("limit") || "50");

  // safe-by-default: demo absent = false (exclut [DEMO])
  const demoMode = parseDemoMode(searchParams);
  const where: Record<string, unknown> = {
    ...getJobDemoFilter(demoMode),
  };
  if (status) where.status = status;
  if (locationPriority) where.locationPriority = parseInt(locationPriority);
  if (minScore) {
    where.score = { globalScore: { gte: parseInt(minScore) } };
  }
  if (newOnly === "true") where.status = "new";

  const jobs = await prisma.job.findMany({
    where,
    include: { score: true, source: { select: { name: true } } },
    orderBy: [{ firstSeenAt: "desc" }],
    take: limit,
  });

  return NextResponse.json({ jobs, total: jobs.length });
}
