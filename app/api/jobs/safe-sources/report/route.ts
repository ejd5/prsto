import { NextResponse } from "next/server";
import { generateSafeSourceDailyReport } from "@/lib/jobs/safe-source-report";

function checkAuth(request: Request): "ok" | "missing" | "invalid" {
  if (process.env.NODE_ENV !== "production") return "ok";
  const token = request.headers.get("x-api-token");
  const expected = process.env.SOURCING_CRON_TOKEN;
  if (!expected) return "ok";
  if (!token) return "missing";
  return token === expected ? "ok" : "invalid";
}

export async function GET(request: Request) {
  const auth = checkAuth(request);
  if (auth !== "ok") {
    return NextResponse.json(
      { error: auth === "missing" ? "Token manquant" : "Token invalide" },
      { status: 401 },
    );
  }

  try {
    const report = await generateSafeSourceDailyReport();
    return NextResponse.json({ success: true, report });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
