import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/jobs/cron/sourcing/dashboard
 *
 * Version allégée du rapport pour le dashboard client.
 * Pas de token requis. N'expose que des stats agrégées (pas de topJobs, pas d'URLs).
 */
export async function GET() {
  try {
    const latest = await prisma.jobSearchRun.findFirst({
      where: { logsJson: { not: null } },
      orderBy: { startedAt: "desc" },
    });

    if (!latest) {
      return NextResponse.json({
        found: false,
        message: "Aucun rapport disponible.",
      });
    }

    let parsedLogs: Record<string, unknown> = {};
    try {
      parsedLogs = JSON.parse(latest.logsJson || "{}");
    } catch { /* ignore */ }

    return NextResponse.json({
      found: true,
      id: latest.id,
      status: latest.status,
      startedAt: latest.startedAt.toISOString(),
      fetchedCount: latest.fetchedCount,
      createdCount: latest.createdCount,
      duplicateCount: latest.duplicateCount,
      rejectedCount: latest.rejectedCount,
      version: (parsedLogs as Record<string, unknown>).version || "",
      sourcesScanned: (parsedLogs as Record<string, unknown>).sourcesScanned || 0,
      intlAccepted: (parsedLogs as Record<string, unknown>).intlAccepted || 0,
      intlRejected: (parsedLogs as Record<string, unknown>).intlRejected || 0,
      // Top jobs : seulement titre + score (pas d'URLs)
      topJobs: (((parsedLogs as Record<string, unknown>).topJobs || []) as Array<Record<string, unknown>>)
        .slice(0, 5)
        .map((j) => ({
          title: j.title || "",
          company: j.company || "",
          score: j.score || 0,
        })),
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
