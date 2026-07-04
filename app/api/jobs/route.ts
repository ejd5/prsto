import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getJobDemoFilter, parseDemoMode } from "@/lib/jobs/demo-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const locationPriority = searchParams.get("priority");
  const minScore = searchParams.get("minScore");
  const newOnly = searchParams.get("new");
  const today = searchParams.get("today");
  const remote = searchParams.get("remote");
  const recommendation = searchParams.get("recommendation");
  const limit = parseInt(searchParams.get("limit") || "50");

  // safe-by-default: demo absent = false (exclut [DEMO])
  const demoMode = parseDemoMode(searchParams);
  const archivedOnly = searchParams.get("archived");
  const where: Record<string, unknown> = {
    ...getJobDemoFilter(demoMode),
  };
  // Par défaut, exclure les offres archivées
  if (archivedOnly === "true") {
    where.status = "archived";
  } else if (!status && !newOnly) {
    where.status = { not: "archived" };
  }
  if (status) where.status = status;
  if (locationPriority) where.locationPriority = parseInt(locationPriority);
  if (minScore) {
    where.score = { globalScore: { gte: parseInt(minScore) } };
  }
  if (newOnly === "true") where.status = "new";
  // Offres importées aujourd'hui
  if (today === "true") {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    where.firstSeenAt = { gte: startOfDay };
  }
  // Remote
  if (remote === "true") {
    where.remotePolicy = { in: ["remote", "Remote"] };
  }
  // Semantic recommendation filter
  if (recommendation) {
    where.score = { ...(where.score as object || {}), recommendation };
  }

  const jobs = await prisma.job.findMany({
    where,
    select: {
      id: true, title: true, company: true, location: true, locationPriority: true,
      status: true, sourceUrl: true, firstSeenAt: true, publishedAt: true,
      source: { select: { name: true, type: true } }, score: true, draft: { select: { id: true } },
    },
    orderBy: [{ firstSeenAt: "desc" }],
    take: limit,
  });

  return NextResponse.json({ jobs, total: jobs.length });
}
