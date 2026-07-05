import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  classifyFirecrawlEligibility,
} from "@/lib/jobs/connectors/firecrawl-safe";
import { computeChecksum, checkDuplicate } from "@/lib/jobs/dedupe";
import { scoreJobLocal } from "@/lib/jobs/deepseek-job-scorer";
import { detectLocationPriority, detectCountryScope, computeLocationScore } from "@/lib/jobs/location-priority";
import { analyzeJobFit, serializeAnalysis } from "@/lib/jobs/semantic-matcher";
import type { JobInput, ProfileInput } from "@/lib/jobs/semantic-matcher";
import type { ImportedJob } from "@/lib/jobs/types";

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

  try {
    const body = await request.json().catch(() => ({}));
    const url = (body.url || "").trim();
    const selectedJobs = (body.selectedJobs || []) as ImportedJob[];

    if (!url) {
      return NextResponse.json(
        { success: false, error: "URL requise." },
        { status: 400 },
      );
    }

    if (!Array.isArray(selectedJobs) || selectedJobs.length === 0) {
      return NextResponse.json(
        { success: false, error: "Aucune offre sélectionnée pour import." },
        { status: 400 },
      );
    }

    // Re-valider l'éligibilité avant import
    const eligibility = classifyFirecrawlEligibility(url, null, "");
    if (eligibility.status !== "allowed") {
      return NextResponse.json({
        success: false,
        error: `Import refusé : ${eligibility.detail} (${eligibility.reasonCode})`,
        complianceStatus: eligibility.status,
        reasonCode: eligibility.reasonCode,
      });
    }

    // Find-or-create ImportSource
    let importSource = await prisma.importSource.findUnique({
      where: { name: "Firecrawl Safe" },
    });
    if (!importSource) {
      importSource = await prisma.importSource.create({
        data: { name: "Firecrawl Safe", type: "firecrawl-safe", status: "ok" },
      });
    }

    // Charger le profil pour le semantic matching
    const profile = await prisma.profile.findFirst({
      include: { skills: true, experiences: { orderBy: { startDate: "desc" }, take: 5 } },
    });

    const jobIds: string[] = [];
    let imported = 0;
    let duplicates = 0;
    let skipped = 0;
    const warnings: Array<{ index: number; title: string; warnings: string[] }> = [];

    for (let i = 0; i < selectedJobs.length; i++) {
      const offer = selectedJobs[i];
      const jobWarnings: string[] = [];

      // Validation qualité
      if (!offer.title || offer.title.trim().length === 0) {
        skipped++;
        continue;
      }
      if (!offer.sourceUrl) {
        skipped++;
        continue;
      }
      if (!offer.company || offer.company.trim().length === 0) {
        jobWarnings.push("Entreprise non détectée");
      }
      const descLen = (offer.description || "").trim().length;
      if (descLen < 50) {
        jobWarnings.push("Description très courte (< 50 caractères) — score de confiance réduit");
      }
      if (descLen < 200) {
        jobWarnings.push("Description limitée (< 200 caractères)");
      }
      if (!offer.location || offer.location.trim().length === 0) {
        jobWarnings.push("Localisation non détectée");
      }

      if (jobWarnings.length > 0) {
        warnings.push({ index: i, title: offer.title, warnings: jobWarnings });
      }

      const checksum = computeChecksum(
        offer.title,
        offer.company || "",
        offer.location || "",
      );

      // 1. RawJob
      await prisma.rawJob.create({
        data: {
          sourceId: importSource.id,
          externalId: offer.externalId,
          sourceUrl: offer.sourceUrl,
          rawTitle: offer.title,
          rawCompany: offer.company,
          rawLocation: offer.location,
          rawDescription: offer.description,
          rawPayloadJson: null,
          checksum,
        },
      });

      // 2. Déduplication
      const dup = await checkDuplicate(
        offer.externalId,
        offer.sourceUrl,
        offer.title,
        offer.company,
        offer.location,
      );
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

      // 3. Location detection
      const locationPriority = detectLocationPriority(offer.location || null);
      const countryScope = detectCountryScope(offer.location || null);

      // 4. Create Job
      const job = await prisma.job.create({
        data: {
          sourceId: importSource.id,
          externalId: offer.externalId,
          sourceUrl: offer.sourceUrl,
          canonicalUrl: offer.canonicalUrl || offer.sourceUrl,
          title: offer.title,
          company: offer.company,
          location: offer.location,
          locationPriority,
          countryScope,
          remotePolicy: offer.remotePolicy,
          contractType: offer.contractType,
          salaryMin: offer.salaryMin,
          salaryMax: offer.salaryMax,
          seniority: offer.seniority,
          description: offer.description,
          publishedAt: offer.publishedAt ? new Date(offer.publishedAt) : undefined,
          checksum,
          status: "new",
        },
      });

      // 5. Scoring (local, sans DeepSeek)
      const scoreData = scoreJobLocal({
        title: offer.title,
        location: offer.location,
        description: offer.description,
      });

      await prisma.jobScore.create({
        data: {
          jobId: job.id,
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

      // 6. Semantic matching (non-bloquant)
      if (profile) {
        try {
          const jobInput: JobInput = {
            title: offer.title,
            company: offer.company,
            location: offer.location,
            locationPriority,
            countryScope,
            remotePolicy: offer.remotePolicy,
            contractType: offer.contractType,
            salaryMin: offer.salaryMin ?? null,
            salaryMax: offer.salaryMax ?? null,
            seniority: offer.seniority ?? null,
            functionArea: offer.functionArea ?? null,
            sector: offer.sector ?? null,
            description: offer.description,
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
            where: { jobId: job.id },
            data: {
              semanticScore: analysis.overallScore,
              semanticConfidence: analysis.confidence,
              semanticAnalysisJson: JSON.stringify(serialized),
              recommendation: analysis.recommendation,
            },
          });
        } catch {
          // Semantic matching failure must not break import
        }
      }

      jobIds.push(job.id);
      imported++;
    }

    return NextResponse.json({
      success: true,
      imported,
      duplicates,
      skipped,
      jobIds,
      warnings,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    const safeMsg = msg.replace(/fc-[a-zA-Z0-9]+/g, "***");
    return NextResponse.json(
      { success: false, error: safeMsg },
      { status: 500 },
    );
  }
}
