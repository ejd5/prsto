import { NextResponse } from "next/server";
import { runAllEnabledSafeSources } from "@/lib/jobs/safe-source-runner";
import { generateSafeSourceDailyReport } from "@/lib/jobs/safe-source-report";

function checkAuth(request: Request): "ok" | "missing" | "invalid" {
  if (process.env.NODE_ENV !== "production") return "ok";
  const token = request.headers.get("x-api-token");
  const expected = process.env.SOURCING_CRON_TOKEN;
  if (!expected) return "ok";
  if (!token) return "missing";
  return token === expected ? "ok" : "invalid";
}

export async function POST(request: Request) {
  const auth = checkAuth(request);
  if (auth !== "ok") {
    return NextResponse.json(
      { error: auth === "missing" ? "Token manquant" : "Token invalide" },
      { status: 401 },
    );
  }

  if (process.env.SAFE_SOURCES_CRON_ENABLED !== "true") {
    return NextResponse.json({
      success: false,
      error: "Cron Safe Sources désactivé (SAFE_SOURCES_CRON_ENABLED=false)",
      hint: "Mettez SAFE_SOURCES_CRON_ENABLED=true dans .env pour activer le cron automatique.",
    }, { status: 403 });
  }

  try {
    const results = await runAllEnabledSafeSources("import");

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const totalFound = results.reduce((sum, r) => sum + r.stats.jobsFound, 0);
    const totalImported = results.reduce((sum, r) => sum + r.stats.jobsImported, 0);
    const totalDups = results.reduce((sum, r) => sum + r.stats.duplicates, 0);

    const report = await generateSafeSourceDailyReport();

    return NextResponse.json({
      success: true,
      run: {
        totalSources: results.length,
        succeeded,
        failed,
        totalJobsFound: totalFound,
        totalJobsImported: totalImported,
        totalDuplicates: totalDups,
        results,
      },
      report,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    const safeMsg = msg.replace(/fc-[a-zA-Z0-9]+/g, "***");
    return NextResponse.json({ success: false, error: safeMsg }, { status: 500 });
  }
}
