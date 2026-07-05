import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateJobReport } from "@/lib/jobs/reports";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") || null;

  // Si mode spécifié, utiliser le générateur de rapport
  if (mode && ["morning", "evening", "manual"].includes(mode)) {
    const lastRun = await prisma.jobSearchRun.findFirst({
      where: { mode },
      orderBy: { startedAt: "desc" },
    });
    if (!lastRun) {
      return NextResponse.json({
        report: null,
        message: `Aucun rapport ${mode} disponible. Lancez d'abord un import.`,
      });
    }
    const report = await generateJobReport(mode as "morning" | "evening" | "manual", lastRun.id);
    return NextResponse.json({ report });
  }

  // Sinon, dernier run tous modes confondus
  const lastRun = await prisma.jobSearchRun.findFirst({
    orderBy: { startedAt: "desc" },
  });
  if (!lastRun) {
    return NextResponse.json({ report: null, message: "Aucun rapport disponible." });
  }

  const report = await generateJobReport("manual", lastRun.id);
  return NextResponse.json({ report });
}
