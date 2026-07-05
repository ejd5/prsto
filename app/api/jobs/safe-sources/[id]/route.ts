import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { classifyFirecrawlEligibility } from "@/lib/jobs/connectors/firecrawl-safe";
import { extractDomain } from "@/lib/jobs/source-capability-scanner";
import { runSafeJobSource } from "@/lib/jobs/safe-source-runner";

function checkAuth(request: Request): "ok" | "missing" | "invalid" {
  if (process.env.NODE_ENV !== "production") return "ok";
  const token = request.headers.get("x-api-token");
  const expected = process.env.SOURCING_CRON_TOKEN;
  if (!expected) return "ok";
  if (!token) return "missing";
  return token === expected ? "ok" : "invalid";
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = checkAuth(_request);
  if (auth !== "ok") {
    return NextResponse.json({ error: auth === "missing" ? "Token manquant" : "Token invalide" }, { status: 401 });
  }

  const { id } = await params;
  const source = await prisma.safeJobSource.findUnique({ where: { id } });
  if (!source) {
    return NextResponse.json({ success: false, error: "Source introuvable." }, { status: 404 });
  }

  return NextResponse.json({ success: true, source });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = checkAuth(request);
  if (auth !== "ok") {
    return NextResponse.json({ error: auth === "missing" ? "Token manquant" : "Token invalide" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const existing = await prisma.safeJobSource.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Source introuvable." }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));

    // If URL changed, reclassify
    if (body.url && body.url !== existing.url) {
      const eligibility = classifyFirecrawlEligibility(body.url, null, "");
      if (eligibility.status !== "allowed") {
        return NextResponse.json({
          success: false,
          error: `Mise à jour refusée : ${eligibility.detail} (${eligibility.reasonCode})`,
          complianceStatus: eligibility.status,
          reasonCode: eligibility.reasonCode,
        }, { status: 400 });
      }
    }

    const updateData: Record<string, unknown> = {};
    if (body.label !== undefined) updateData.label = body.label;
    if (body.url !== undefined) {
      updateData.url = body.url;
      updateData.normalizedDomain = extractDomain(body.url);
    }
    if (body.enabled !== undefined) updateData.enabled = body.enabled;
    if (typeof body.maxPagesPerRun === "number") updateData.maxPagesPerRun = body.maxPagesPerRun;
    if (typeof body.maxJobsPerRun === "number") updateData.maxJobsPerRun = body.maxJobsPerRun;
    if (body.notes !== undefined) updateData.notes = body.notes || null;

    const source = await prisma.safeJobSource.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, source });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = checkAuth(request);
  if (auth !== "ok") {
    return NextResponse.json({ error: auth === "missing" ? "Token manquant" : "Token invalide" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await prisma.safeJobSource.delete({ where: { id } });
    return NextResponse.json({ success: true, deleted: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = checkAuth(request);
  if (auth !== "ok") {
    return NextResponse.json({ error: auth === "missing" ? "Token manquant" : "Token invalide" }, { status: 401 });
  }

  // POST acts as run for a single source (form POST from UI)
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const action = body.action === "preview" ? "preview" : "import";
    const result = await runSafeJobSource(id, { action });
    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    const safeMsg = msg.replace(/fc-[a-zA-Z0-9]+/g, "***");
    return NextResponse.json({ success: false, error: safeMsg }, { status: 500 });
  }
}
