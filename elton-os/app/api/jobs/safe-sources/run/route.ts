import { NextResponse } from "next/server";
import { runAllEnabledSafeSources } from "@/lib/jobs/safe-source-runner";

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
    return NextResponse.json({ error: auth === "missing" ? "Token manquant" : "Token invalide" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action === "preview" ? "preview" : "import";
    const results = await runAllEnabledSafeSources(action);

    const totalFound = results.reduce((s, r) => s + r.stats.jobsFound, 0);
    const totalImported = results.reduce((s, r) => s + r.stats.jobsImported, 0);
    const totalDups = results.reduce((s, r) => s + r.stats.duplicates, 0);
    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      runs: results,
      summary: {
        totalSources: results.length,
        succeeded,
        failed,
        totalJobsFound: totalFound,
        totalJobsImported: totalImported,
        totalDuplicates: totalDups,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    const safeMsg = msg.replace(/fc-[a-zA-Z0-9]+/g, "***");
    return NextResponse.json({ success: false, error: safeMsg }, { status: 500 });
  }
}
