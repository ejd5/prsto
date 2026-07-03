import { NextResponse } from "next/server";
import {
  checkFirecrawlConfig,
  classifyFirecrawlEligibility,
  scrapeAllowedPageWithFirecrawl,
  extractJobsFromMarkdown,
  normalizeFirecrawlJobs,
  createFirecrawlAuditLog,
} from "@/lib/jobs/connectors/firecrawl-safe";
import type { FirecrawlAuditEntry, SourceImportMode } from "@/lib/jobs/types";

function normalizeDomain(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host;
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] || url;
  }
}

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
    const msg = auth === "missing" ? "Token manquant" : "Token invalide";
    return NextResponse.json({ error: msg }, { status: 401 });
  }

  const start = Date.now();
  let requestUrl = "";

  try {
    const body = await request.json().catch(() => ({}));
    requestUrl = (body.url || "").trim();

    if (!requestUrl) {
      return NextResponse.json(
        { success: false, error: "URL requise." },
        { status: 400 },
      );
    }

    // Vérification config
    const configError = checkFirecrawlConfig();
    if (configError) {
      return NextResponse.json({
        success: false,
        complianceStatus: configError.status,
        reasonCode: configError.reasonCode,
        message: configError.detail,
        suggestedMode: "MANUAL_ONLY",
      });
    }

    // Classification éligibilité
    const eligibility = classifyFirecrawlEligibility(requestUrl, null, "");

    if (eligibility.status !== "allowed") {
      let suggestedMode = "MANUAL_ONLY";
      if (
        eligibility.reasonCode === "refused_closed_platform" ||
        eligibility.reasonCode === "refused_blocked_domain"
      ) {
        suggestedMode = "USER_ASSISTED";
      }

      const domain = normalizeDomain(requestUrl);
      const audit: FirecrawlAuditEntry = {
        timestamp: new Date().toISOString(),
        actor: "firecrawl-safe",
        sourceUrl: requestUrl,
        normalizedDomain: domain,
        scannerDecision: "MANUAL_ONLY",
        connector: "firecrawl-safe",
        extractionMethod: "firecrawl_v1_scrape",
        status: "refused",
        reasonCode: eligibility.reasonCode as FirecrawlAuditEntry["reasonCode"],
        durationMs: Date.now() - start,
        jobsExtracted: 0,
        errors: [eligibility.detail],
      };

      const message =
        eligibility.reasonCode === "refused_closed_platform"
          ? "Cette source nécessite un import assisté. Ouvrez l'annonce dans votre navigateur et utilisez l'extension Chrome PRSTO."
          : eligibility.reasonCode === "refused_blocked_domain"
            ? "Ce domaine est bloqué. Utilisez l'import assisté si l'offre est pertinente."
            : eligibility.reasonCode === "refused_login_required"
              ? "Cette page nécessite une connexion. Utilisez l'extension Chrome pour importer depuis votre session."
              : eligibility.reasonCode === "refused_captcha"
                ? "Cette page est protégée par un système anti-bot. Utilisez l'import assisté."
                : `Source non éligible : ${eligibility.detail}`;

      return NextResponse.json({
        success: false,
        complianceStatus: eligibility.status,
        reasonCode: eligibility.reasonCode,
        message,
        suggestedMode,
        audit,
      });
    }

    // Extraction Firecrawl
    const { markdown, sourceUrl: resolvedUrl, durationMs } =
      await scrapeAllowedPageWithFirecrawl(requestUrl);

    // Extraction des offres depuis le Markdown
    const rawJobs = extractJobsFromMarkdown(markdown, resolvedUrl);

    // Normalisation
    const domain = normalizeDomain(resolvedUrl);
    const jobs = normalizeFirecrawlJobs(rawJobs, { sourceUrl: resolvedUrl, domain });

    // Annoter la qualité de chaque job pour la preview
    const annotatedJobs = jobs.map((job) => {
      const issues: string[] = [];
      if (!job.title || job.title.trim().length === 0) issues.push("missing_title");
      if (!job.company || job.company.trim().length === 0) issues.push("missing_company");
      if (!job.location || job.location.trim().length === 0) issues.push("missing_location");
      const descLen = (job.description || "").trim().length;
      if (descLen < 50) issues.push("low_confidence");
      if (descLen < 200) issues.push("short_description");
      return { ...job, _quality: { confidence: descLen < 50 ? "low" : descLen < 200 ? "medium" : "high", issues } };
    });

    // Audit
    const audit = createFirecrawlAuditLog({
      sourceUrl: requestUrl,
      importMode: null,
      status: "allowed",
      reasonCode: eligibility.reasonCode,
      jobsExtracted: jobs.length,
      durationMs,
      errors: [],
    });

    return NextResponse.json({
      success: true,
      mode: "AUTO_FIRECRAWL_SAFE" as SourceImportMode,
      complianceStatus: "allowed",
      reasonCode: eligibility.reasonCode,
      audit,
      jobs: annotatedJobs,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    let reasonCode: FirecrawlAuditEntry["reasonCode"] = "error_parse_failed";
    if (msg.includes("rate limit")) reasonCode = "error_firecrawl_rate_limit";
    else if (msg.includes("timeout") || msg.includes("AbortError"))
      reasonCode = "error_firecrawl_timeout";

    // Ne jamais exposer la clé API dans les erreurs
    const safeMsg = msg.replace(/fc-[a-zA-Z0-9]+/g, "***");

    const audit: FirecrawlAuditEntry = {
      timestamp: new Date().toISOString(),
      actor: "firecrawl-safe",
      sourceUrl: requestUrl || "inconnue",
      normalizedDomain: requestUrl ? normalizeDomain(requestUrl) : "inconnu",
      scannerDecision: "MANUAL_ONLY",
      connector: "firecrawl-safe",
      extractionMethod: "firecrawl_v1_scrape",
      status: "error",
      reasonCode,
      durationMs: Date.now() - start,
      jobsExtracted: 0,
      errors: [safeMsg],
    };

    return NextResponse.json({
      success: false,
      complianceStatus: "error",
      reasonCode,
      message: safeMsg,
      audit,
    });
  }
}
