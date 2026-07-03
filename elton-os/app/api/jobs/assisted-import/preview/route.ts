/**
 * POST /api/jobs/assisted-import/preview
 *
 * V2.7 — Import Assisté Pro Preview.
 *
 * Reçoit les données extraites par l'extension Chrome et les valide côté serveur.
 * Aucun fetch vers les plateformes (LinkedIn/Indeed/APEC).
 * Aucun re-scraping serveur.
 *
 * RÈGLES STRICTES:
 * - Ne jamais fetcher LinkedIn / Indeed / APEC côté serveur
 * - Ne jamais contourner login/CAPTCHA
 * - Ne jamais utiliser Firecrawl sur ces plateformes
 * - Validation utilisateur obligatoire avant import
 */

import { NextResponse } from "next/server";
import { checkDuplicate } from "@/lib/jobs/dedupe";
import {
  validateAssistedImportPayload,
  computeExtractionConfidence,
  detectPlatformFromUrl,
  hashUrlForExternalId,
} from "@/lib/jobs/assisted-import-extractors";
import type { ExtractionConfidence } from "@/lib/jobs/assisted-import-extractors";
import type { ImportedJob } from "@/lib/jobs/types";
import { withExtensionCors, createCorsPreflightResponse } from "@/lib/http/extension-cors";

function checkAuth(request: Request): boolean {
  if (process.env.NODE_ENV === "development") return true;
  const token = request.headers.get("x-api-token");
  return token === process.env.SOURCING_CRON_TOKEN;
}

const BLOCKED_FETCH_DOMAINS = [
  "linkedin.com", "indeed.com", "apec.fr",
  "cadremploi.fr", "monster.fr", "monster.com",
];

function isBlockedFetchDomain(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return BLOCKED_FETCH_DOMAINS.some((d) => host.includes(d));
  } catch { return false; }
}

function corsJson(data: Record<string, unknown>, request: Request, status = 200): Response {
  return withExtensionCors(NextResponse.json(data, { status }), request);
}

export async function OPTIONS(request: Request) {
  return createCorsPreflightResponse(request);
}

export async function POST(request: Request) {
  if (!checkAuth(request)) {
    return corsJson({ success: false, error: "Non autorisé." }, request, 401);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const platform = body.platform || detectPlatformFromUrl(body.sourceUrl || "");
    const sourceUrl = body.sourceUrl || "";

    // Guard: ne jamais accepter un fetch serveur vers plateformes fermées
    if (!sourceUrl) {
      return corsJson({
        success: false,
        reasonCode: "assisted_missing_required_fields",
        message: "URL source manquante.",
      }, request);
    }
    if (isBlockedFetchDomain(sourceUrl) && body._serverFetch) {
      return corsJson({
        success: false,
        reasonCode: "refused_server_side_closed_platform_fetch",
        message: "Le fetch serveur vers LinkedIn/Indeed/APEC est interdit. Utilisez l'extension Chrome.",
      }, request);
    }

    // Valider le payload
    const validation = validateAssistedImportPayload({ platform, sourceUrl, visibleOnly: true, jobs: body.jobs || [] });
    if (!validation.valid) {
      return corsJson({ success: false, ...validation }, request, 400);
    }

    const rawJobs: Array<Partial<ImportedJob>> = body.jobs || [];
    const previewJobs: Array<{
      job: ImportedJob;
      confidence: ExtractionConfidence;
      warnings: string[];
      isDuplicate: boolean;
      existingJobId?: string;
    }> = [];

    for (const raw of rawJobs) {
      const job: ImportedJob = {
        source: platform,
        sourceUrl: raw.sourceUrl || sourceUrl,
        applicationUrl: raw.applicationUrl || raw.sourceUrl || sourceUrl,
        title: raw.title || "",
        company: raw.company || "",
        location: raw.location || "",
        description: raw.description || "",
        contractType: raw.contractType || undefined,
        salaryMin: raw.salaryMin || undefined,
        salaryMax: raw.salaryMax || undefined,
        currency: raw.currency || undefined,
        remotePolicy: raw.remotePolicy || undefined,
        publishedAt: raw.publishedAt || undefined,
        externalId: `${platform}::${hashUrlForExternalId(raw.sourceUrl || raw.title || "")}`,
      };
      const confidence = computeExtractionConfidence(job);

      // Check duplicate
      const dup = await checkDuplicate(job.externalId, job.sourceUrl, job.title, job.company, job.location);

      previewJobs.push({
        job,
        confidence,
        warnings: confidence.score < 50 ? ["Extraction faible — vérifiez les champs avant import."] : [],
        isDuplicate: dup.status !== "new",
        existingJobId: dup.existingId || undefined,
      });
    }

    return corsJson({
      success: true,
      platform,
      sourceUrl,
      visibleOnly: true,
      extractionMethod: "USER_ASSISTED_EXTENSION",
      isLoginOrCaptchaVisible: false,
      jobs: previewJobs,
    }, request);
  } catch (e: unknown) {
    return corsJson({ success: false, error: (e as Error).message }, request, 500);
  }
}
