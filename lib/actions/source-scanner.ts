"use server";

import { prisma } from "@/lib/prisma";
import {
  assessSourceCapability,
  KNOWN_SOURCES,
  type KnownSource,
} from "@/lib/jobs/source-capability-scanner";
import type {
  SourceCapability,
  SourceImportMode,
} from "@/lib/jobs/types";

const USER_AGENT = "PRSTO/2.2 (personal job search assistant; +https://prsto.example.com)";
const FETCH_TIMEOUT = 15000;
const SCAN_DELAY_MS = 500; // rate limiting entre chaque source

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface ScanStats {
  scanned: number;
  byMode: Record<SourceImportMode, number>;
  errors: string[];
}

/**
 * Scanne une source individuelle : fetch l'URL, détecte les capacités,
 * et persiste le résultat dans ImportSource.capabilityJson (via configJson).
 */
export async function scanSingleSource(
  sourceId: string,
  url: string,
  name: string,
): Promise<SourceCapability> {
  let statusCode = 0;
  let html = "";

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
      redirect: "follow",
    });
    statusCode = res.status;
    html = await res.text();
  } catch (e: unknown) {
    const err = e as Error;
    // Si le fetch échoue (timeout, réseau, etc.), on traite comme bloqué
    statusCode = 0;
    html = err.message || "";
  }

  const capability = assessSourceCapability(sourceId, name, url, statusCode, html);
  capability.lastCheckedAt = new Date().toISOString();
  capability.lastStatus = statusCode === 0 ? "fetch_error" : statusCode < 400 ? "ok" : `http_${statusCode}`;

  // Persister dans ImportSource
  try {
    const existing = await prisma.importSource.findUnique({ where: { name: sourceId } });

    if (existing) {
      await prisma.importSource.update({
        where: { name: sourceId },
        data: {
          configJson: JSON.stringify(capability),
          status: capability.importMode.startsWith("AUTO") ? "ok" : "pending",
          errorMessage: capability.blocksServerFetch ? "Source bloque les requêtes serveur" : null,
        },
      });
    } else {
      await prisma.importSource.create({
        data: {
          name: sourceId,
          type: capability.platformType === "ats" ? "ats" : "html",
          enabled: capability.importMode.startsWith("AUTO"),
          configJson: JSON.stringify(capability),
          status: capability.importMode.startsWith("AUTO") ? "ok" : "pending",
          errorMessage: capability.blocksServerFetch ? "Source bloque les requêtes serveur" : null,
        },
      });
    }
  } catch {
    // Silencieux — la persistence n'est pas critique pour la classification
  }

  return capability;
}

/**
 * Scanne toutes les sources du catalogue KNOWN_SOURCES.
 * Applique un délai de 500ms entre chaque pour éviter les rate limits.
 */
export async function scanAllSources(): Promise<ScanStats> {
  const stats: ScanStats = {
    scanned: 0,
    byMode: {
      API_OFFICIAL: 0,
      ATS_PUBLIC: 0,
      PUBLIC_CAREERS: 0,
      AUTO_API: 0,
      AUTO_ATS: 0,
      AUTO_JSONLD: 0,
      AUTO_RSS: 0,
      AUTO_PUBLIC_CAREERS: 0,
      AUTO_FIRECRAWL_SAFE: 0,
      USER_ASSISTED: 0,
      MANUAL_ONLY: 0,
      BLOCKED: 0,
    },
    errors: [],
  };

  const sources: KnownSource[] = KNOWN_SOURCES;

  for (const src of sources) {
    try {
      const cap = await scanSingleSource(src.sourceId, src.url, src.name);
      stats.scanned++;
      stats.byMode[cap.importMode] = (stats.byMode[cap.importMode] || 0) + 1;
    } catch (e: unknown) {
      stats.errors.push(`${src.sourceId}: ${(e as Error).message}`);
    }

    // Rate limit entre chaque source
    await sleep(SCAN_DELAY_MS);
  }

  return stats;
}

/**
 * Récupère les sources filtrées par mode d'import.
 */
export async function getSourcesByMode(mode: SourceImportMode): Promise<Array<{
  id: string;
  name: string;
  type: string;
  capability: SourceCapability | null;
  jobCount: number;
}>> {
  const sources = await prisma.importSource.findMany({
    include: { jobs: { select: { id: true } } },
  });

  return sources
    .map((src) => {
      let capability: SourceCapability | null = null;
      try {
        if (src.configJson) {
          capability = JSON.parse(src.configJson) as SourceCapability;
        }
      } catch {
        capability = null;
      }

      return {
        id: src.id,
        name: src.name,
        type: src.type,
        capability,
        jobCount: src.jobs.length,
      };
    })
    .filter((src) => src.capability?.importMode === mode);
}

/**
 * Récupère toutes les sources avec leurs capacités,
 * triées par mode (AUTO d'abord).
 */
export async function listAllSourcesWithCapabilities(): Promise<Array<{
  id: string;
  name: string;
  type: string;
  capability: SourceCapability | null;
  jobCount: number;
  enabled: boolean;
  status: string;
  lastRunAt: string | null;
}>> {
  const sources = await prisma.importSource.findMany({
    include: { jobs: { select: { id: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return sources
    .map((src) => {
      let capability: SourceCapability | null = null;
      try {
        if (src.configJson) {
          capability = JSON.parse(src.configJson) as SourceCapability;
        }
      } catch {
        capability = null;
      }

      return {
        id: src.id,
        name: src.name,
        type: src.type,
        capability,
        jobCount: src.jobs.length,
        enabled: src.enabled,
        status: src.status,
        lastRunAt: src.lastRunAt?.toISOString() || null,
      };
    })
    .sort((a, b) => {
      const order: Record<string, number> = {
        AUTO_API: 0,
        AUTO_ATS: 1,
        AUTO_JSONLD: 2,
        AUTO_RSS: 3,
        USER_ASSISTED: 4,
        MANUAL_ONLY: 5,
        BLOCKED: 6,
      };
      const aOrder = order[a.capability?.importMode || "MANUAL_ONLY"] ?? 99;
      const bOrder = order[b.capability?.importMode || "MANUAL_ONLY"] ?? 99;
      return aOrder - bOrder;
    });
}

/**
 * Récupère le capability d'une source par son ID.
 */
export async function getSourceCapability(sourceName: string): Promise<SourceCapability | null> {
  const src = await prisma.importSource.findUnique({ where: { name: sourceName } });
  if (!src?.configJson) return null;
  try {
    return JSON.parse(src.configJson) as SourceCapability;
  } catch {
    return null;
  }
}

/**
 * Retourne les sources qui peuvent être lancées automatiquement.
 */
export async function getAutoSources(): Promise<string[]> {
  const sources = await listAllSourcesWithCapabilities();
  return sources
    .filter((s) => s.capability?.importMode?.startsWith("AUTO") && s.enabled)
    .map((s) => s.name);
}
