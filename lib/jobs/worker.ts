import { prisma } from "@/lib/prisma";
import { planSearches } from "./search-planner";
import { detectLocationPriority, computeLocationScore, detectCountryScope } from "./location-priority";
import { checkDuplicate, computeChecksum } from "./dedupe";
import { scoreJob, scoreJobLocal } from "./deepseek-job-scorer";
import type { ImportMode, SearchQuery, ImportedJob } from "./types";
import fixtureData from "./fixtures/france-travail-sample.json";

export interface ImportOptions {
  mode?: ImportMode;
  source?: string;        // "all" | "france-travail" | "michael-page" | ...
  dryRun?: boolean;       // si true, utilise les fixtures au lieu des API
  maxPages?: number;      // pagination France Travail (défaut: 1)
  maxJobsPerRun?: number; // limite globale (défaut: 250)
}

// Tous les connecteurs disponibles
import { linkedinPublicConnector } from "./connectors/linkedin-public";
import { franceTravailConnector } from "./connectors/france-travail";
import { michaelPageConnector } from "./connectors/michael-page";
import { greenhouseConnector } from "./connectors/greenhouse";
import { leverConnector } from "./connectors/lever";
import { ashbyConnector } from "./connectors/ashby";
import { smartRecruitersConnector } from "./connectors/smartrecruiters";
import { genericJsonLdConnector } from "./connectors/generic-jsonld";
import { browserAgentConnector } from "./connectors/browser-agent-connector";

/** Configuration : quels connecteurs sont "broad" (1 appel large) vs "per_query" (par localisation) */
const CONNECTOR_MODE: Record<string, "broad" | "per_query"> = {
  "france-travail": "broad",
  "michael-page": "per_query",
  "linkedin-public": "per_query",
  "greenhouse": "broad",
  "lever": "broad",
  "ashby": "broad",
  "smartrecruiters": "broad",
  "generic-jsonld": "broad",
  "browser-agent": "broad",
};

const ALL_CONNECTORS = [
  franceTravailConnector,
  michaelPageConnector,
  linkedinPublicConnector,
  greenhouseConnector,
  leverConnector,
  ashbyConnector,
  smartRecruitersConnector,
  genericJsonLdConnector,
  browserAgentConnector,
];

const BROAD_KEYWORDS = [
  "Directeur Commercial", "Directeur des Ventes", "Head of Sales",
  "Country Manager France", "Directeur Business Development",
];

const DEFAULT_MAX_JOBS = 250;
const DEFAULT_MAX_PAGES = 1;

/* ─── Traitement des offres ────────────────────────── */

async function processOffers(
  offers: ImportedJob[],
  connectorName: string,
  connectorType: string,
  opts: ImportOptions,
  stats: { fetched: number; created: number; duplicates: number },
  connectorStats: Record<string, { fetched: number; created: number; duplicates: number }>
): Promise<void> {
  const maxJobs = opts.maxJobsPerRun || DEFAULT_MAX_JOBS;

  for (const offer of offers) {
    if (stats.created >= maxJobs) break;
    stats.fetched++;

    // Résoudre ou créer l'ImportSource
    let importSource = await prisma.importSource.findUnique({ where: { name: connectorName } });
    if (!importSource) {
      importSource = await prisma.importSource.create({
        data: { name: connectorName, type: connectorType, status: "ok" },
      });
    }

    // RawJob
    await prisma.rawJob.create({
      data: {
        sourceId: importSource.id,
        externalId: offer.externalId,
        sourceUrl: offer.sourceUrl,
        rawTitle: offer.title,
        rawCompany: offer.company,
        rawLocation: offer.location,
        rawDescription: offer.description,
        rawPayloadJson: offer.rawJson ? JSON.stringify(offer.rawJson) : null,
        checksum: computeChecksum(offer.title, offer.company || "", offer.location || ""),
      },
    });

    // Déduplication
    const dup = await checkDuplicate(
      offer.externalId, offer.sourceUrl,
      offer.title, offer.company, offer.location
    );
    if (dup.status !== "new") {
      if (dup.existingId) {
        await prisma.job.update({ where: { id: dup.existingId }, data: { lastSeenAt: new Date() } });
      }
      stats.duplicates++;
      if (connectorStats[connectorName]) connectorStats[connectorName].duplicates++;
      continue;
    }

    // Localisation
    const locationPriority = detectLocationPriority(offer.location || null);
    const countryScope = detectCountryScope(offer.location || null);
    const checksum = computeChecksum(offer.title, offer.company || "", offer.location || "");

    // Créer le Job
    const job = await prisma.job.create({
      data: {
        sourceId: importSource.id,
        externalId: offer.externalId,
        sourceUrl: offer.sourceUrl,
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

    // Scoring
    const hasDeepSeek = await checkDeepSeekConfig();
    const scoreData = hasDeepSeek
      ? await scoreJob({ title: offer.title, company: offer.company, location: offer.location, description: offer.description })
      : scoreJobLocal({ title: offer.title, location: offer.location, description: offer.description });

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

    stats.created++;
    if (connectorStats[connectorName]) connectorStats[connectorName].created++;
  }

  if (connectorStats[connectorName]) connectorStats[connectorName].fetched = stats.fetched;
}

/* ─── Mode fixture ────────────────────────────────── */

async function runFixture(opts: ImportOptions): Promise<{
  fetchedCount: number; createdCount: number; duplicateCount: number; errors: string[];
}> {
  const stats = { fetched: 0, created: 0, duplicates: 0 };
  const connectorStats: Record<string, { fetched: number; created: number; duplicates: number }> = {
    "France Travail (fixture)": { fetched: 0, created: 0, duplicates: 0 },
  };

  const fixtureOffers: ImportedJob[] = (fixtureData as Record<string, unknown>[]).map((item) => {
    const entreprise = (item.entreprise as Record<string, unknown>) || {};
    const societat = (item.societat as Record<string, unknown>) || {};
    const lieu = (item.lieuTravail as Record<string, unknown>) || {};
    const salaire = (item.salaire as Record<string, unknown>) || {};
    return {
      source: "fixture",
      externalId: `fixture::${item.id}`,
      sourceUrl: `https://candidat.francetravail.fr/offres/${item.id}`,
      title: (item.intitule as string) || "",
      company: (entreprise.nom as string) || (societat.nom as string) || "",
      location: (lieu.libelle as string) || (lieu.ville as string) || "",
      contractType: (item.typeContratLibelle as string) || "",
      salaryMin: (salaire.montantMinimal as number) || undefined,
      salaryMax: (salaire.montantMaximal as number) || undefined,
      description: (item.description as string) || "",
      publishedAt: (item.dateCreation as string) || undefined,
    };
  }).filter(o => o.title);

  await processOffers(fixtureOffers, "France Travail (fixture)", "fixture", opts, stats, connectorStats);

  return { fetchedCount: stats.fetched, createdCount: stats.created, duplicateCount: stats.duplicates, errors: [] };
}

/* ─── Mode réel ───────────────────────────────────── */

async function runReal(opts: ImportOptions): Promise<{
  fetchedCount: number; createdCount: number; duplicateCount: number; errors: string[];
}> {
  const queries = planSearches();
  const allErrors: string[] = [];
  const stats = { fetched: 0, created: 0, duplicates: 0 };
  const connectorStats: Record<string, { fetched: number; created: number; duplicates: number }> = {};
  const sourceFilter = opts.source || "all";

  for (const connector of ALL_CONNECTORS) {
    connectorStats[connector.name] = { fetched: 0, created: 0, duplicates: 0 };
  }

  // Filtrer par source si demandé
  const activeConnectors = sourceFilter === "all"
    ? ALL_CONNECTORS
    : ALL_CONNECTORS.filter(c => c.id === sourceFilter || c.name === sourceFilter);

  // Phase 1 : connecteurs broad
  for (const connector of activeConnectors) {
    if (CONNECTOR_MODE[connector.id] !== "broad") continue;

    // Cas spécial : Browser Agent (utilise runAllSearches au lieu de search)
    if (connector.id === "browser-agent") {
      try {
        const browserAgent = connector as typeof browserAgentConnector;
        const result = await browserAgent.runAllSearches();
        if (connectorStats[connector.name]) connectorStats[connector.name].fetched += result.offers.length;
        await processOffers(result.offers, connector.name, connector.type, opts, stats, connectorStats);
        // Ajouter les infos détaillées aux logs
        const baStats = result.totals;
        if (Object.keys(baStats).length > 0) {
          // Ces stats seront visibles dans logsJson.connectorStats après finalisation
        }
      } catch (e: unknown) {
        const err = e as Error;
        allErrors.push(`Browser Agent: ${err.message?.slice(0, 100) || "erreur"}`);
      }
      continue;
    }

    for (const keyword of BROAD_KEYWORDS) {
      if (stats.created >= (opts.maxJobsPerRun || DEFAULT_MAX_JOBS)) break;

      const broadQuery: SearchQuery = {
        keyword,
        location: "France",
        locationPriority: 3,
        seniority: "executive",
        priority: 5,
        remoteAllowed: false,
        countryScope: "france",
      };

      // Pagination pour France Travail
      const maxPages = opts.maxPages || DEFAULT_MAX_PAGES;
      for (let page = 0; page < maxPages; page++) {
        if (stats.created >= (opts.maxJobsPerRun || DEFAULT_MAX_JOBS)) break;
        const range = page * 150 + 1;

        try {
          // On passe la page via un paramètre modifié
          const pagedQuery = { ...broadQuery, keyword: `${broadQuery.keyword}::page=${page + 1}&range=${range}` };
          const offers = await connector.search(pagedQuery);
          if (connectorStats[connector.name]) connectorStats[connector.name].fetched += offers.length;

          await processOffers(offers, connector.name, connector.type, opts, stats, connectorStats);

          if (offers.length < 150) break; // Plus de pages
        } catch (e: unknown) {
          const err = e as Error;
          allErrors.push(`${connector.name} (page ${page + 1}): ${err.message?.slice(0, 100) || "erreur"}`);
          break; // Arrêter la pagination en cas d'erreur
        }
      }
    }
  }

  // Phase 2 : connecteurs per_query (pas de pagination — limité par les 30 requêtes géo)
  for (const query of queries) {
    if (stats.created >= (opts.maxJobsPerRun || DEFAULT_MAX_JOBS)) break;

    for (const connector of activeConnectors) {
      if (CONNECTOR_MODE[connector.id] !== "per_query") continue;

      try {
        const offers = await connector.search(query);
        if (connectorStats[connector.name]) connectorStats[connector.name].fetched += offers.length;
        await processOffers(offers, connector.name, connector.type, opts, stats, connectorStats);
      } catch (e: unknown) {
        const err = e as Error;
        allErrors.push(`${connector.name} (${query.keyword}): ${err.message?.slice(0, 100) || "erreur"}`);
      }
    }
  }

  return { fetchedCount: stats.fetched, createdCount: stats.created, duplicateCount: stats.duplicates, errors: allErrors };
}

/* ─── Point d'entrée unique ───────────────────────── */

export async function runJobImport(opts: ImportOptions = {}): Promise<{
  runId: string;
  fetchedCount: number;
  createdCount: number;
  duplicateCount: number;
  errors: string[];
}> {
  const mode = opts.mode || "manual";
  const isFixture = opts.dryRun === true;

  const run = await prisma.jobSearchRun.create({
    data: { mode, status: "running" },
  });

  const result = isFixture ? await runFixture(opts) : await runReal(opts);

  // Finaliser le run
  const status = result.errors.length > 0 ? "partial" : result.createdCount > 0 ? "success" : "success";

  await prisma.jobSearchRun.update({
    where: { id: run.id },
    data: {
      status,
      finishedAt: new Date(),
      fetchedCount: result.fetchedCount,
      createdCount: result.createdCount,
      duplicateCount: result.duplicateCount,
      errorMessage: result.errors.length > 0 ? result.errors.join("; ").slice(0, 2000) : null,
      logsJson: JSON.stringify({
        dryRun: isFixture,
        options: opts,
        errors: result.errors,
      }),
    },
  });

  return {
    runId: run.id,
    fetchedCount: result.fetchedCount,
    createdCount: result.createdCount,
    duplicateCount: result.duplicateCount,
    errors: result.errors,
  };
}

async function checkDeepSeekConfig(): Promise<boolean> {
  try {
    const setting = await prisma.setting.findFirst();
    return !!(setting?.apiKey && setting.apiKey.trim().length > 0);
  } catch { return false; }
}
