import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateJobReport } from "@/lib/jobs/reports";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") || "manual";

  if (!["morning", "evening", "manual"].includes(mode)) {
    return NextResponse.json({ error: "mode invalide. Utilisez morning, evening ou manual." }, { status: 400 });
  }

  // Chercher le dernier run du mode demandé
  const lastRun = await prisma.jobSearchRun.findFirst({
    where: { mode },
    orderBy: { startedAt: "desc" },
  });

  if (!lastRun) {
    return NextResponse.json({
      success: true,
      report: null,
      message: `Aucun rapport ${mode} disponible. Lancez d'abord un import.`,
    });
  }

  try {
    const report = await generateJobReport(mode as "morning" | "evening" | "manual", lastRun.id);
    return NextResponse.json({ success: true, report });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
