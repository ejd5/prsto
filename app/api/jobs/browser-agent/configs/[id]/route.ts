import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function checkAuth(request: Request): "ok" | "missing" | "invalid" {
  if (process.env.NODE_ENV !== "production") return "ok";
  const token = request.headers.get("x-api-token");
  const expected = process.env.SOURCING_CRON_TOKEN;
  if (!expected) return "ok";
  if (!token) return "missing";
  return token === expected ? "ok" : "invalid";
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = checkAuth(request);
  if (auth !== "ok") {
    return NextResponse.json({ error: auth === "missing" ? "Token manquant" : "Token invalide" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const update: Record<string, unknown> = {};

  // Validation URL si searchUrl change
  if (body.searchUrl !== undefined) {
    const existing = await prisma.browserSearchConfig.findUnique({ where: { id } });
    const platform = body.platform || existing?.platform || "";
    try {
      const u = new URL(body.searchUrl);
      if (platform === "linkedin" && !u.hostname.includes("linkedin.com")) {
        return NextResponse.json({ error: "Linkedin nécessite une URL linkedin.com/jobs/search/..." }, { status: 400 });
      } else if (platform === "indeed" && !u.hostname.includes("indeed.com") && !u.hostname.includes("indeed.fr")) {
        return NextResponse.json({ error: "Indeed nécessite une URL fr.indeed.com ou indeed.com" }, { status: 400 });
      } else if (platform === "apec" && !u.hostname.includes("apec.fr")) {
        return NextResponse.json({ error: "APEC nécessite une URL apec.fr" }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: "URL invalide. Vérifiez le format." }, { status: 400 });
    }
  }
  if (body.label !== undefined) update.label = body.label;
  if (body.searchUrl !== undefined) update.searchUrl = body.searchUrl;
  if (body.enabled !== undefined) update.enabled = body.enabled;
  if (body.maxResultsPerRun !== undefined) update.maxResultsPerRun = Math.min(body.maxResultsPerRun, 20);
  if (body.locationPriority !== undefined) update.locationPriority = body.locationPriority;
  if (body.scrollEnabled !== undefined) update.scrollEnabled = body.scrollEnabled === true;
  if (body.maxScrolls !== undefined) update.maxScrolls = Math.min(body.maxScrolls, 5);
  if (body.scrollDelayMs !== undefined) update.scrollDelayMs = Math.min(body.scrollDelayMs, 2000);
  if (body.fetchDetailsEnabled !== undefined) update.fetchDetailsEnabled = body.fetchDetailsEnabled === true;
  if (body.maxDetailsPerRun !== undefined) update.maxDetailsPerRun = Math.min(body.maxDetailsPerRun, 5);

  const config = await prisma.browserSearchConfig.update({ where: { id }, data: update });
  return NextResponse.json({ success: true, config });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = checkAuth(request);
  if (auth !== "ok") {
    return NextResponse.json({ error: auth === "missing" ? "Token manquant" : "Token invalide" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.browserSearchConfig.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
