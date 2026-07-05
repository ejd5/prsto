/**
 * Smart Ingestion Router V2.6.10
 *
 * Route chaque SafeJobSource vers la meilleure stratégie d'extraction :
 *   API native ATS > JSON-LD natif > Firecrawl Safe > User Assisted > Blocked
 *
 * Fallback automatique : si la stratégie native échoue → Firecrawl Safe.
 */

import type { ImportedJob, SourceImportMode } from "./types";
import {
  fetchGreenhouseBoard,
  fetchLeverBoard,
  fetchAshbyBoard,
  fetchSmartRecruitersBoard,
} from "./connectors/public-ats";
import { parseJsonLdJobPosting } from "./parsers/jsonld-job-parser";

/* ─── Strategy definitions ──────────────────── */

export type IngestionStrategy =
  | "API_OFFICIAL"
  | "ATS_NATIVE_GREENHOUSE"
  | "ATS_NATIVE_LEVER"
  | "ATS_NATIVE_ASHBY"
  | "ATS_NATIVE_SMARTRECRUITERS"
  | "ATS_NATIVE_WORKABLE"
  | "JSONLD_NATIVE"
  | "FIRECRAWL_SAFE"
  | "USER_ASSISTED"
  | "BLOCKED";

export interface StrategyDecision {
  strategy: IngestionStrategy;
  priority: number; // 1–10, plus bas = meilleur
  reason: string;
  canAutoImport: boolean;
  connector?: string;
  atsCompany?: string;
  fallback?: IngestionStrategy;
}

export interface IngestionResult {
  jobs: ImportedJob[];
  strategy: IngestionStrategy;
  usedFallback: boolean;
  fallbackReason?: string;
}

/* ─── Priority ordering ─────────────────────── */

const STRATEGY_PRIORITY: Record<IngestionStrategy, number> = {
  API_OFFICIAL: 1,
  ATS_NATIVE_GREENHOUSE: 2,
  ATS_NATIVE_LEVER: 2,
  ATS_NATIVE_ASHBY: 2,
  ATS_NATIVE_SMARTRECRUITERS: 2,
  ATS_NATIVE_WORKABLE: 3,
  JSONLD_NATIVE: 4,
  FIRECRAWL_SAFE: 5,
  USER_ASSISTED: 8,
  BLOCKED: 10,
};

const NATIVE_STRATEGIES: IngestionStrategy[] = [
  "API_OFFICIAL",
  "ATS_NATIVE_GREENHOUSE",
  "ATS_NATIVE_LEVER",
  "ATS_NATIVE_ASHBY",
  "ATS_NATIVE_SMARTRECRUITERS",
  "JSONLD_NATIVE",
];

const USER_AGENT = "PRSTO/1.0 (personal job search assistant)";
const FETCH_TIMEOUT = 15000;

/* ─── ATS company extraction ────────────────── */

const ATS_VENDOR_TO_STRATEGY: Record<string, IngestionStrategy> = {
  greenhouse: "ATS_NATIVE_GREENHOUSE",
  lever: "ATS_NATIVE_LEVER",
  ashby: "ATS_NATIVE_ASHBY",
  smartrecruiters: "ATS_NATIVE_SMARTRECRUITERS",
  workable: "ATS_NATIVE_WORKABLE",
};

function extractAtsCompany(url: string): string | null {
  try {
    const pathname = new URL(url).pathname;
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length > 0 && parts[0].length >= 2) return parts[0];
  } catch { /* invalid URL */ }
  return null;
}

/* ─── Strategy selection ────────────────────── */

export function getStrategyPriority(strategy: IngestionStrategy): number {
  return STRATEGY_PRIORITY[strategy] ?? 10;
}

export function isNativeStrategy(strategy: IngestionStrategy): boolean {
  return (NATIVE_STRATEGIES as string[]).includes(strategy);
}

/**
 * Choose the best ingestion strategy for a source.
 * Pure function — no I/O, no network calls.
 */
export function chooseIngestionStrategy(source: {
  importMode: string;
  atsVendor?: string | null;
  normalizedDomain: string;
  url: string;
  label: string;
}): StrategyDecision {
  const mode = source.importMode as SourceImportMode;

  // 1. BLOCKED — never import
  if (mode === "BLOCKED") {
    return {
      strategy: "BLOCKED",
      priority: STRATEGY_PRIORITY.BLOCKED,
      reason: "Domaine ou plateforme bloqué(e). Aucun import automatique possible.",
      canAutoImport: false,
    };
  }

  // 2. USER_ASSISTED — requires user action
  if (mode === "USER_ASSISTED" || mode === "MANUAL_ONLY") {
    return {
      strategy: "USER_ASSISTED",
      priority: STRATEGY_PRIORITY.USER_ASSISTED,
      reason: "Cette plateforme nécessite une action utilisateur (navigateur personnel). Utilisez l'extension Chrome Import Assisté.",
      canAutoImport: false,
      fallback: "USER_ASSISTED",
    };
  }

  // 3. API_OFFICIAL — France Travail
  if (mode === "API_OFFICIAL") {
    return {
      strategy: "API_OFFICIAL",
      priority: STRATEGY_PRIORITY.API_OFFICIAL,
      reason: "API officielle France Travail détectée.",
      canAutoImport: true,
      connector: "france-travail",
      fallback: "FIRECRAWL_SAFE",
    };
  }

  // 4. ATS_PUBLIC — native API if available
  if (mode === "ATS_PUBLIC" && source.atsVendor) {
    const vendor = source.atsVendor.toLowerCase();
    const atsStrategy = ATS_VENDOR_TO_STRATEGY[vendor];

    if (atsStrategy) {
      const company = extractAtsCompany(source.url);
      const hasNativeConnector = atsStrategy !== "ATS_NATIVE_WORKABLE";

      if (hasNativeConnector && company) {
        return {
          strategy: atsStrategy,
          priority: STRATEGY_PRIORITY[atsStrategy],
          reason: `Connecteur natif ${source.atsVendor} disponible pour ${company}. API publique, extraction structurée garantie.`,
          canAutoImport: true,
          connector: `public-ats::${vendor}`,
          atsCompany: company,
          fallback: "FIRECRAWL_SAFE",
        };
      }

      // Workable or missing company → no native connector, fall through to Firecrawl
      if (atsStrategy === "ATS_NATIVE_WORKABLE") {
        return {
          strategy: "FIRECRAWL_SAFE",
          priority: STRATEGY_PRIORITY.FIRECRAWL_SAFE,
          reason: `ATS ${source.atsVendor} détecté mais aucun connecteur natif disponible. Fallback Firecrawl Safe.`,
          canAutoImport: true,
          connector: "firecrawl-safe",
        };
      }
    }

    // Unknown ATS vendor → Firecrawl
    return {
      strategy: "FIRECRAWL_SAFE",
      priority: STRATEGY_PRIORITY.FIRECRAWL_SAFE,
      reason: `ATS ${source.atsVendor} détecté mais non supporté nativement. Fallback Firecrawl Safe.`,
      canAutoImport: true,
      connector: "firecrawl-safe",
    };
  }

  // 5. JSON-LD detected → try native JSON-LD extraction
  if (mode === "AUTO_JSONLD") {
    return {
      strategy: "JSONLD_NATIVE",
      priority: STRATEGY_PRIORITY.JSONLD_NATIVE,
      reason: "JSON-LD JobPosting détecté. Extraction structurée native prioritaire.",
      canAutoImport: true,
      connector: "generic-jsonld",
      fallback: "FIRECRAWL_SAFE",
    };
  }

  // 6. Public careers page → Firecrawl Safe
  if (mode === "AUTO_PUBLIC_CAREERS" || mode === "PUBLIC_CAREERS") {
    return {
      strategy: "FIRECRAWL_SAFE",
      priority: STRATEGY_PRIORITY.FIRECRAWL_SAFE,
      reason: "Page carrière publique. Extraction via Firecrawl Safe.",
      canAutoImport: true,
      connector: "firecrawl-safe",
    };
  }

  // 7. AUTO_FIRECRAWL_SAFE → Firecrawl
  if (mode === "AUTO_FIRECRAWL_SAFE") {
    return {
      strategy: "FIRECRAWL_SAFE",
      priority: STRATEGY_PRIORITY.FIRECRAWL_SAFE,
      reason: "Source marquée pour extraction Firecrawl Safe.",
      canAutoImport: true,
      connector: "firecrawl-safe",
    };
  }

  // 8. Legacy AUTO_API / AUTO_ATS → Firecrawl Safe
  if (mode === "AUTO_API" || mode === "AUTO_ATS") {
    return {
      strategy: "FIRECRAWL_SAFE",
      priority: STRATEGY_PRIORITY.FIRECRAWL_SAFE,
      reason: `Mode legacy ${mode} — Firecrawl Safe par défaut.`,
      canAutoImport: true,
      connector: "firecrawl-safe",
      fallback: "USER_ASSISTED",
    };
  }

  // 9. Catch-all → Firecrawl Safe
  return {
    strategy: "FIRECRAWL_SAFE",
    priority: STRATEGY_PRIORITY.FIRECRAWL_SAFE,
    reason: "Aucune stratégie native détectée. Firecrawl Safe par défaut.",
    canAutoImport: true,
    connector: "firecrawl-safe",
  };
}

/* ─── Strategy execution ────────────────────── */

function truncateDescription(text: string): string {
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 5000);
}

/**
 * Execute the chosen ingestion strategy.
 * For native strategies: calls the corresponding API and returns ImportedJob[].
 * For FIRECRAWL_SAFE: returns empty — the caller runs the Firecrawl pipeline.
 * For BLOCKED / USER_ASSISTED: throws.
 */
export async function runIngestionStrategy(
  source: {
    id: string;
    url: string;
    normalizedDomain: string;
    atsVendor?: string | null;
    label: string;
  },
  strategy: IngestionStrategy,
  atsCompany?: string,
): Promise<IngestionResult> {
  switch (strategy) {
    /* ─── ATS Native ─────────────────────── */

    case "ATS_NATIVE_GREENHOUSE": {
      const company = atsCompany || extractAtsCompany(source.url);
      if (!company) break;
      try {
        const jobs = await fetchGreenhouseBoard(company);
        if (jobs.length > 0) {
          return { jobs, strategy, usedFallback: false };
        }
      } catch { /* fall through to fallback */ }
      break;
    }

    case "ATS_NATIVE_LEVER": {
      const company = atsCompany || extractAtsCompany(source.url);
      if (!company) break;
      try {
        const jobs = await fetchLeverBoard(company);
        if (jobs.length > 0) {
          return { jobs, strategy, usedFallback: false };
        }
      } catch { /* fall through to fallback */ }
      break;
    }

    case "ATS_NATIVE_ASHBY": {
      const company = atsCompany || extractAtsCompany(source.url);
      if (!company) break;
      try {
        const jobs = await fetchAshbyBoard(company);
        if (jobs.length > 0) {
          return { jobs, strategy, usedFallback: false };
        }
      } catch { /* fall through to fallback */ }
      break;
    }

    case "ATS_NATIVE_SMARTRECRUITERS": {
      const companyId = atsCompany || extractAtsCompany(source.url);
      if (!companyId) break;
      try {
        const jobs = await fetchSmartRecruitersBoard(companyId, source.label);
        if (jobs.length > 0) {
          return { jobs, strategy, usedFallback: false };
        }
      } catch { /* fall through to fallback */ }
      break;
    }

    /* ─── JSON-LD Native ─────────────────── */

    case "JSONLD_NATIVE": {
      try {
        const res = await fetch(source.url, {
          headers: {
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml",
          },
          signal: AbortSignal.timeout(FETCH_TIMEOUT),
          redirect: "follow",
        });
        if (!res.ok) break;
        const html = await res.text();
        if (html.length < 500) break;
        const jobs = parseJsonLdJobPosting(html, "jsonld-native").map(j => ({
          ...j,
          description: j.description ? truncateDescription(j.description) : j.description,
        }));
        if (jobs.length > 0) {
          return { jobs, strategy, usedFallback: false };
        }
      } catch { /* fall through to fallback */ }
      break;
    }

    /* ─── Firecrawl / blocked / assisted ─── */

    case "FIRECRAWL_SAFE":
      // Caller handles Firecrawl — return empty so they know to run the pipeline
      return { jobs: [], strategy, usedFallback: false };

    case "USER_ASSISTED":
      throw new Error("Cette source nécessite une action utilisateur (Import Assisté).");

    case "BLOCKED":
      throw new Error("Cette source est bloquée et ne peut pas être importée automatiquement.");

    default:
      break;
  }

  // Native strategy failed → fallback to Firecrawl
  return {
    jobs: [],
    strategy: "FIRECRAWL_SAFE",
    usedFallback: true,
    fallbackReason: `La stratégie native ${strategy} n'a retourné aucun résultat.`,
  };
}

/* ─── Human-readable explanation ────────────── */

export function explainStrategyDecision(decision: StrategyDecision): string {
  const lines: string[] = [
    `Source : ${decision.strategy}`,
    `Priorité : ${decision.priority}/10`,
    `Import automatique : ${decision.canAutoImport ? "oui" : "non"}`,
    `Raison : ${decision.reason}`,
  ];
  if (decision.connector) {
    lines.push(`Connecteur : ${decision.connector}`);
  }
  if (decision.atsCompany) {
    lines.push(`Entreprise ATS : ${decision.atsCompany}`);
  }
  if (decision.fallback) {
    lines.push(`Fallback : ${decision.fallback}`);
  }
  return lines.join("\n");
}

/**
 * Returns the list of strategies in priority order (best first).
 */
export function listStrategiesByPriority(): IngestionStrategy[] {
  return (Object.entries(STRATEGY_PRIORITY) as [IngestionStrategy, number][])
    .sort(([, a], [, b]) => a - b)
    .map(([s]) => s);
}
