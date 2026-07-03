/**
 * POST /api/jobs/assisted-import/import
 *
 * V2.7 — Import Assisté Pro Import.
 *
 * Importe les offres sélectionnées et validées par l'utilisateur dans PRSTO.
 * Pipeline complet: RawJob → Job (dédup) → JobScore → semantic matcher.
 *
 * RÈGLES STRICTES:
 * - Ne jamais fetcher LinkedIn / Indeed / APEC côté serveur
 * - Ne jamais importer sans validation utilisateur explicite
 * - Jamais d'auto-apply
 * - Jamais de Firecrawl sur ces plateformes
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkDuplicate } from "@/lib/jobs/dedupe";
import { scoreJobLocal } from "@/lib/jobs/deepseek-job-scorer";
import { detectLocationPriority, detectCountryScope, computeLocationScore } from "@/lib/jobs/location-priority";
import { analyzeJobFit, serializeAnalysis } from "@/lib/jobs/semantic-matcher";
import {
  validateAssistedImportPayload,
  detectPlatformFromUrl,
  hashUrlForExternalId,
} from "@/lib/jobs/assisted-import-extractors";
import type { JobInput, ProfileInput } from "@/lib/jobs/semantic-matcher";
import type { ImportedJob } from "@/lib/jobs/types";
import { withExtensionCors, createCorsPreflightResponse } from "@/lib/http/extension-cors";
import { ensureApplicationDraftForJob } from "@/lib/jobs/application-pipeline";

function checkAuth(request: Request): boolean {
  if (process.env.NODE_ENV === "development") return true;
  const token = request.headers.get("x-api-token");
  return token === process.env.SOURCING_CRON_TOKEN;
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

  const startedAt = Date.now();

  try {
    const body = await request.json().catch(() => ({}));
    const platform = body.platform || detectPlatformFromUrl(body.sourceUrl || "");
    const sourceUrl = body.sourceUrl || "";
    const selectedJobs: Array<Partial<ImportedJob>> = body.selectedJobs || [];

    if (!sourceUrl) {
      return corsJson({
        success: false,
        reasonCode: "assisted_missing_required_fields",
        message: "URL source manquante.",
      }, request);
    }
    if (selectedJobs.length === 0) {
      return corsJson({
        success: false,
        reasonCode: "assisted_missing_required_fields",
        message: "Aucune offre sélectionnée.",
      }, request);
    }

    // Valider
    const validation = validateAssistedImportPayload({
      platform,
      sourceUrl,
      visibleOnly: true,
      jobs: selectedJobs,
    });
    if (!validation.valid) {
      return corsJson({ success: false, ...validation }, request, 400);
    }

    // Trouver ou créer l'ImportSource
    let importSource = await prisma.importSource.findFirst({
      where: { name: "Import Assisté" },
    });
    if (!importSource) {
      importSource = await prisma.importSource.create({
        data: { name: "Import Assisté", type: "browser", status: "ok" },
      });
    }

    // Profile pour semantic matching
    const profile = await prisma.profile.findFirst({
      include: { skills: true, experiences: { orderBy: { startDate: "desc" }, take: 5 } },
    });

    let imported = 0;
    let duplicates = 0;
    const skipped = 0;
    let semanticScoredCount = 0;

    for (const raw of selectedJobs) {
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
        currency: raw.currency || "EUR",
        remotePolicy: raw.remotePolicy || undefined,
        publishedAt: raw.publishedAt || undefined,
        externalId: `${platform}::${hashUrlForExternalId(raw.sourceUrl || raw.title || "")}`,
      };

      // RawJob
      await prisma.rawJob.create({
        data: {
          sourceId: importSource.id,
          externalId: job.externalId,
          sourceUrl: job.sourceUrl,
          rawTitle: job.title,
          rawCompany: job.company,
          rawLocation: job.location,
          rawDescription: job.description,
          rawPayloadJson: null,
          fetchedAt: new Date(),
        },
      });

      // Dédup
      const dup = await checkDuplicate(job.externalId, job.sourceUrl, job.title, job.company, job.location);
      if (dup.status !== "new") {
        if (dup.existingId) {
          await prisma.job.update({
            where: { id: dup.existingId },
            data: { lastSeenAt: new Date() },
          });
        }
        duplicates++;
        continue;
      }

      // Location
      const locationPriority = detectLocationPriority(job.location || null);
      const countryScope = detectCountryScope(job.location || null);

      // Job
      const created = await prisma.job.create({
        data: {
          sourceId: importSource.id,
          externalId: job.externalId,
          sourceUrl: job.sourceUrl,
          title: job.title,
          company: job.company,
          location: job.location,
          locationPriority,
          countryScope,
          remotePolicy: job.remotePolicy,
          contractType: job.contractType,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          description: job.description,
          publishedAt: job.publishedAt ? new Date(job.publishedAt) : undefined,
          status: "new",
          firstSeenAt: new Date(),
          lastSeenAt: new Date(),
        },
      });

      // Score
      const scoreData = scoreJobLocal({
        title: job.title,
        location: job.location,
        description: job.description,
      });
      await prisma.jobScore.create({
        data: {
          jobId: created.id,
          executiveScore: scoreData.executiveScore,
          matchScore: scoreData.matchScore,
          locationScore: scoreData.locationScore || computeLocationScore(locationPriority),
          salaryScore: scoreData.salaryScore,
          freshnessScore: scoreData.freshnessScore,
          companyScore: scoreData.companyScore,
          riskScore: scoreData.riskScore,
          globalScore: scoreData.globalScore,
          reasonsJson: JSON.stringify(scoreData.reasons),
          redFlagsJson: JSON.stringify(scoreData.redFlags),
          recommendedAction: scoreData.recommendedAction,
        },
      });

      // Semantic matching
      if (profile) {
        try {
          const jobInput: JobInput = {
            title: job.title,
            company: job.company,
            location: job.location,
            locationPriority,
            countryScope,
            remotePolicy: job.remotePolicy,
            contractType: job.contractType,
            salaryMin: job.salaryMin ?? null,
            salaryMax: job.salaryMax ?? null,
            seniority: job.seniority ?? null,
            functionArea: job.functionArea ?? null,
            sector: job.sector ?? null,
            description: job.description,
          };
          const p = profile as unknown as Record<string, unknown>;
          const profileInput: ProfileInput = {
            fullName: (p.fullName as string) ?? profile.title,
            title: profile.title,
            summary: (p.summary as string) ?? null,
            location: profile.location,
            mobility: profile.mobility,
            languages: (p.languages as string) ?? null,
            yearsExp: profile.yearsExp as number | null,
            sectors: profile.sectors,
            functions: (p.functions as string) ?? null,
            remotePreference: (p.remotePreference as string) ?? null,
            targetSalary: (p.targetSalary as string) ?? null,
            constraints: (p.constraints as string) ?? null,
          };
          const analysis = analyzeJobFit(jobInput, profileInput);
          const serialized = serializeAnalysis(analysis);
          await prisma.jobScore.update({
            where: { jobId: created.id },
            data: {
              semanticScore: analysis.overallScore,
              semanticConfidence: analysis.confidence,
              semanticAnalysisJson: JSON.stringify(serialized),
              recommendation: analysis.recommendation,
            },
          });
          semanticScoredCount++;
        } catch { /* semantic failure must not break import */ }
      }

      // Auto-créer un ApplicationDraft pour faire apparaître l'offre dans le pipeline
      try { await ensureApplicationDraftForJob(created.id); } catch { /* non-bloquant */ }

      imported++;
    }

    // Audit
    const duration = Date.now() - startedAt;
    await prisma.jobSearchRun.create({
      data: {
        sourceId: importSource.id,
        mode: "manual",
        status: imported > 0 ? "success" : "partial",
        startedAt: new Date(startedAt),
        finishedAt: new Date(),
        fetchedCount: selectedJobs.length,
        createdCount: imported,
        duplicateCount: duplicates,
        rejectedCount: skipped,
        errorMessage: null,
        logsJson: JSON.stringify({
          timestamp: new Date().toISOString(),
          actor: "assisted-import",
          platform,
          sourceUrl,
          extractionMethod: "USER_ASSISTED_EXTENSION",
          visibleOnly: true,
          selectedCount: selectedJobs.length,
          imported,
          duplicates,
          skipped,
          semanticScoredCount,
          reasonCode: imported > 0 ? "assisted_visible_job_imported" : "assisted_duplicate_skipped",
          durationMs: duration,
        }),
      },
    });

    return corsJson({
      success: true,
      imported,
      duplicates,
      skipped,
      semanticScoredCount,
      durationMs: duration,
      message: `${imported} offre(s) importée(s), ${duplicates} doublon(s), ${semanticScoredCount} score(s) sémantique(s).`,
    }, request);
  } catch (e: unknown) {
    return corsJson({ success: false, error: (e as Error).message }, request, 500);
  }
}
