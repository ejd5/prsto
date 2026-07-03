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

export async function GET(request: Request) {
  const auth = checkAuth(request);
  if (auth !== "ok") {
    return NextResponse.json({ error: auth === "missing" ? "Token manquant" : "Token invalide" }, { status: 401 });
  }

  const configs = await prisma.browserSearchConfig.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ configs });
}

export async function POST(request: Request) {
  const auth = checkAuth(request);
  if (auth !== "ok") {
    return NextResponse.json({ error: auth === "missing" ? "Token manquant" : "Token invalide" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { platform, label, searchUrl, maxResultsPerRun, locationPriority, scrollEnabled, maxScrolls, scrollDelayMs, fetchDetailsEnabled, maxDetailsPerRun } = body;

  if (!platform || !label || !searchUrl) {
    return NextResponse.json({ error: "platform, label et searchUrl requis" }, { status: 400 });
  }

  if (!["linkedin", "indeed", "apec"].includes(platform)) {
    return NextResponse.json({ error: "Platform invalide" }, { status: 400 });
  }

  // Validation URL par plateforme
  let urlError: string | null = null;
  try {
    const u = new URL(searchUrl);
    if (platform === "linkedin" && !u.hostname.includes("linkedin.com")) {
      urlError = "Linkedin nécessite une URL linkedin.com/jobs/search/...";
    } else if (platform === "indeed" && !u.hostname.includes("indeed.com") && !u.hostname.includes("indeed.fr")) {
      urlError = "Indeed nécessite une URL fr.indeed.com ou indeed.com";
    } else if (platform === "apec" && !u.hostname.includes("apec.fr")) {
      urlError = "APEC nécessite une URL apec.fr";
    }
  } catch {
    urlError = "URL invalide. Vérifiez le format.";
  }
  if (urlError) {
    return NextResponse.json({ error: urlError }, { status: 400 });
  }

  const config = await prisma.browserSearchConfig.create({
    data: {
      platform,
      label,
      searchUrl,
      maxResultsPerRun: Math.min(maxResultsPerRun || 10, 20),
      enabled: true,
      locationPriority: locationPriority || null,
      scrollEnabled: scrollEnabled === true,
      maxScrolls: Math.min(maxScrolls ?? 3, 5),
      scrollDelayMs: Math.min(scrollDelayMs ?? 1000, 2000),
      fetchDetailsEnabled: fetchDetailsEnabled === true,
      maxDetailsPerRun: Math.min(maxDetailsPerRun ?? 3, 5),
    },
  });

  return NextResponse.json({ success: true, config });
}
