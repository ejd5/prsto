import { NextResponse } from "next/server";
import { runJobImport } from "@/lib/jobs/worker";
import type { ImportOptions } from "@/lib/jobs/worker";

function checkAuth(request: Request): "ok" | "missing" | "invalid" {
  if (process.env.NODE_ENV !== "production") return "ok";
  const token = request.headers.get("x-api-token");
  const expected = process.env.SOURCING_CRON_TOKEN;
  if (!expected) return "ok";
  if (!token) return "missing";
  return token === expected ? "ok" : "invalid";
}

export async function GET() {
  return NextResponse.json({
    endpoint: "Import automatique PRSTO",
    method: "POST pour lancer un import",
    dryRun: "POST avec {\"dryRun\": true} pour tester sans API",
    params: "maxPages (1-5), maxJobsPerRun (max 500), source, mode",
    auth: process.env.SOURCING_CRON_TOKEN ? "Token configuré" : "Token non configuré",
    env: process.env.NODE_ENV || "development",
  });
}

export async function POST(request: Request) {
  const auth = checkAuth(request);
  if (auth !== "ok") {
    const msg = auth === "missing" ? "Token manquant" : "Token invalide";
    return NextResponse.json({ error: msg }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  const opts: ImportOptions = {
    mode: body.mode || "manual",
    source: body.source || "all",
    dryRun: body.dryRun === true,
    maxPages: typeof body.maxPages === "number" ? body.maxPages : 1,
    maxJobsPerRun: typeof body.maxJobsPerRun === "number" ? body.maxJobsPerRun : 250,
  };

  if (opts.maxPages && opts.maxPages > 5) {
    return NextResponse.json({ error: "maxPages ne peut pas dépasser 5" }, { status: 400 });
  }
  if (opts.maxJobsPerRun && opts.maxJobsPerRun > 500) {
    return NextResponse.json({ error: "maxJobsPerRun ne peut pas dépasser 500" }, { status: 400 });
  }

  try {
    const result = await runJobImport(opts);
    return NextResponse.json({
      success: true,
      ...result,
      dryRun: opts.dryRun,
    });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
