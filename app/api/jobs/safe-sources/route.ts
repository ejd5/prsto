import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { classifyFirecrawlEligibility } from "@/lib/jobs/connectors/firecrawl-safe";
import { extractDomain } from "@/lib/jobs/source-capability-scanner";

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

  const { searchParams } = new URL(request.url);
  const enabledOnly = searchParams.get("enabled") === "true";

  const where = enabledOnly ? { enabled: true } : {};
  const sources = await prisma.safeJobSource.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ success: true, sources });
}

export async function POST(request: Request) {
  const auth = checkAuth(request);
  if (auth !== "ok") {
    return NextResponse.json({ error: auth === "missing" ? "Token manquant" : "Token invalide" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const url = (body.url || "").trim();
    const label = (body.label || "").trim();
    const maxPagesPerRun = typeof body.maxPagesPerRun === "number" ? body.maxPagesPerRun : 1;
    const maxJobsPerRun = typeof body.maxJobsPerRun === "number" ? body.maxJobsPerRun : 20;
    const notes = (body.notes || "").trim() || null;

    if (!url) {
      return NextResponse.json({ success: false, error: "URL requise." }, { status: 400 });
    }
    if (!label) {
      return NextResponse.json({ success: false, error: "Label requis." }, { status: 400 });
    }

    // Reclassify before creation
    const eligibility = classifyFirecrawlEligibility(url, null, "");
    if (eligibility.status !== "allowed") {
      return NextResponse.json({
        success: false,
        error: `Source refusée : ${eligibility.detail} (${eligibility.reasonCode})`,
        complianceStatus: eligibility.status,
        reasonCode: eligibility.reasonCode,
        message: eligibility.detail,
        suggestedMode: eligibility.status === "refused" && eligibility.reasonCode === "refused_closed_platform" ? "USER_ASSISTED" : undefined,
      }, { status: 400 });
    }

    const domain = extractDomain(url);

    // Detect sourceType and atsVendor
    let sourceType = "career_page";
    let atsVendor: string | null = null;
    if (/greenhouse\.io/i.test(domain)) { sourceType = "ats"; atsVendor = "greenhouse"; }
    else if (/lever\.co/i.test(domain)) { sourceType = "ats"; atsVendor = "lever"; }
    else if (/ashbyhq\.com/i.test(domain)) { sourceType = "ats"; atsVendor = "ashby"; }
    else if (/workable\.com/i.test(domain)) { sourceType = "ats"; atsVendor = "workable"; }
    else if (/smartrecruiters\.com/i.test(domain)) { sourceType = "ats"; atsVendor = "smartrecruiters"; }
    else if (/teamtailor\.com/i.test(domain)) { sourceType = "ats"; atsVendor = "teamtailor"; }
    else if (/recruitee\.com/i.test(domain)) { sourceType = "ats"; atsVendor = "recruitee"; }

    const source = await prisma.safeJobSource.create({
      data: {
        label,
        url,
        normalizedDomain: domain,
        sourceType,
        atsVendor,
        importMode: eligibility.reasonCode === "allowed_public_ats" ? "ATS_PUBLIC" :
                    eligibility.reasonCode === "allowed_jsonld" ? "AUTO_JSONLD" : "AUTO_PUBLIC_CAREERS",
        maxPagesPerRun,
        maxJobsPerRun,
        notes,
      },
    });

    return NextResponse.json({ success: true, source });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ success: false, error: "Cette source existe déjà (même domaine et URL)." }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
