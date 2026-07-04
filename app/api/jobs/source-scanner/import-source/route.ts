import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeChecksum, checkDuplicate } from "@/lib/jobs/dedupe";
import { detectLocationPriority, computeLocationScore, detectCountryScope } from "@/lib/jobs/location-priority";
import { scoreJobLocal } from "@/lib/jobs/deepseek-job-scorer";
import { fetchGreenhouseBoard, fetchLeverBoard, fetchAshbyBoard } from "@/lib/jobs/connectors/public-ats";
import type { ImportedJob } from "@/lib/jobs/types";

const USER_AGENT = "PRSTO/2.2 (personal job search assistant; +https://prsto.example.com)";
const TIMEOUT = 15000;

/** Décodage sourceId → { provider, company } */
function parseAtsSourceId(sourceId: string): { provider: string; company: string } | null {
  if (sourceId.startsWith("greenhouse-")) {
    return { provider: "greenhouse", company: sourceId.replace("greenhouse-", "") };
  }
  if (sourceId.startsWith("lever-")) {
    return { provider: "lever", company: sourceId.replace("lever-", "") };
  }
  if (sourceId.startsWith("ashby-")) {
    return { provider: "ashby", company: sourceId.replace("ashby-", "") };
  }
  return null;
}

interface ImportSourceResult {
  fetched: number;
  created: number;
  duplicates: number;
  errors: string[];
  sample: Array<{ title: string; company: string; location?: string }>;
}

async function importFromAtsSource(
  sourceId: string,
  maxJobs: number,
  dryRun: boolean,
): Promise<ImportSourceResult> {
  const parsed = parseAtsSourceId(sourceId);
  if (!parsed) {
    return { fetched: 0, created: 0, duplicates: 0, errors: [`SourceId non reconnue: ${sourceId}`], sample: [] };
  }

  // Fetch les offres depuis l'API ATS
  let offers: ImportedJob[] = [];
  try {
    switch (parsed.provider) {
      case "greenhouse":
        offers = await fetchGreenhouseBoard(parsed.company);
        break;
      case "lever":
        offers = await fetchLeverBoard(parsed.company);
        break;
      case "ashby":
        offers = await fetchAshbyBoard(parsed.company);
        break;
    }
  } catch (e: unknown) {
    return { fetched: 0, created: 0, duplicates: 0, errors: [`Erreur fetch API: ${(e as Error).message}`], sample: [] };
  }

  if (offers.length === 0) {
    return { fetched: 0, created: 0, duplicates: 0, errors: ["Aucune offre trouvée via l'API"], sample: [] };
  }

  // Dry run → retourne juste un échantillon
  const sample = offers.slice(0, 5).map((o) => ({
    title: o.title,
    company: o.company || parsed.company,
    location: o.location,
  }));

  if (dryRun) {
    return { fetched: offers.length, created: 0, duplicates: 0, errors: [], sample };
  }

  // Import réel (limité à maxJobs)
  let created = 0;
  let duplicates = 0;
  const errors: string[] = [];
  const limited = offers.slice(0, maxJobs);

  for (const offer of limited) {
    try {
      // Résoudre ou créer ImportSource
      let importSrc = await prisma.importSource.findUnique({ where: { name: sourceId } });
      if (!importSrc) {
        importSrc = await prisma.importSource.create({
          data: { name: sourceId, type: "ats", enabled: true },
        });
      }

      // Déduplication
      const dedup = await checkDuplicate(
        offer.externalId,
        offer.sourceUrl,
        offer.title,
        offer.company,
        offer.location,
      );
      if (dedup.status !== "new") {
        if (dedup.existingId) {
          await prisma.job.update({ where: { id: dedup.existingId }, data: { lastSeenAt: new Date() } });
        }
        duplicates++;
        continue;
      }

      // Créer le Job
      const locPriority = detectLocationPriority(offer.location || null);
      const countryScope = detectCountryScope(offer.location || null);
      const checksum = computeChecksum(offer.title, offer.company || "", offer.location || "");

      const job = await prisma.job.create({
        data: {
          sourceId: importSrc.id,
          externalId: offer.externalId,
          sourceUrl: offer.sourceUrl,
          title: offer.title,
          company: offer.company,
          location: offer.location,
          locationPriority: locPriority,
          countryScope,
          remotePolicy: offer.remotePolicy,
          contractType: offer.contractType,
          salaryMin: offer.salaryMin,
          salaryMax: offer.salaryMax,
          description: offer.description,
          publishedAt: offer.publishedAt ? new Date(offer.publishedAt) : undefined,
          checksum,
          status: "new",
        },
      });

      // Scoring local
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
          locationScore: scoreData.locationScore || computeLocationScore(locPriority),
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

      created++;
    } catch (e: unknown) {
      errors.push(`${offer.title}: ${(e as Error).message?.slice(0, 80)}`);
    }
  }

  return { fetched: offers.length, created, duplicates, errors, sample };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const sourceId = (body.sourceId as string || "").trim();
    const maxJobs = Math.min(50, parseInt(body.maxJobs as string || "10") || 10);
    const dryRun = body.dryRun === true;

    if (!sourceId) {
      return NextResponse.json({ error: "sourceId requis" }, { status: 400 });
    }

    // Vérifier que la source est AUTO_ATS
    const capSrc = await prisma.importSource.findUnique({ where: { name: sourceId } });
    let importMode = "";
    if (capSrc?.configJson) {
      try {
        const cap = JSON.parse(capSrc.configJson);
        importMode = cap.importMode || "";
      } catch { /* ignore */ }
    }

    if (importMode && !importMode.startsWith("AUTO_")) {
      return NextResponse.json({
        error: `Import refusé : source "${sourceId}" en mode ${importMode}. Seules les sources AUTO_* sont acceptées. Utilisez Import Express pour les sources USER_ASSISTED.`,
        importMode,
      }, { status: 403 });
    }

    if (!importMode) {
      // Pas encore scanné → on essaie quand même (mode découverte)
      importMode = "AUTO_ATS";
    }

    const result = await importFromAtsSource(sourceId, maxJobs, dryRun);

    // Mettre à jour lastRunAt sur ImportSource
    try {
      await prisma.importSource.update({
        where: { name: sourceId },
        data: {
          lastRunAt: new Date(),
          status: result.created > 0 ? "ok" : result.errors.length > 0 ? "error" : "ok",
          errorMessage: result.errors.length > 0 ? result.errors.slice(0, 3).join("; ") : null,
        },
      });
    } catch { /* ignore */ }

    return NextResponse.json({
      success: true,
      sourceId,
      importMode,
      dryRun,
      ...result,
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
