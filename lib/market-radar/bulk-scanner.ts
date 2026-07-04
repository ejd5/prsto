"use server";

import { prisma } from "@/lib/prisma";
import { buildSearchQueriesFromProfile } from "@/lib/market-radar/query-builder";
import { classifySource } from "@/lib/market-radar/source-classifier";
import { createRadarCandidate } from "@/lib/actions/market-radar";
import type { RadarProfile } from "@/lib/market-radar/types";

/**
 * Scanner automatisé pour les sources suivantes :
 * - ATS publics (Greenhouse, Lever, SmartRecruiters, Ashby, Workable...)
 * - API France Travail
 * - Pages carrière publiques
 *
 * LinkedIn / Indeed / APEC / Monster / Cadremploi / etc. → ignorés
 * (bloqués, nécessitent import manuel via copier-coller)
 *
 * Sécurité : aucun auto-apply, aucun scraping agressif.
 */

const SCANNABLE_DOMAINS: Record<string, (query: string) => string> = {
  // ATS publics — URLs prévisibles
  "boards.greenhouse.io": (q) => "",
  "jobs.lever.co": (q) => "",
  "jobs.smartrecruiters.com": (q) => "",
  "jobs.ashbyhq.com": (q) => "",
  "apply.workable.com": (q) => "",

  // Pages carrière avec recherche
  "welcometothejungle.com": (q) => `https://www.welcometothejungle.com/fr/jobs?query=${encodeURIComponent(q)}`,

  // France Travail (API)
  "francetravail.fr": (q) => `https://candidat.francetravail.fr/offres/recherche?motsCles=${encodeURIComponent(q)}`,
};

const SKIP_DOMAINS = [
  "linkedin.com", "indeed.com", "apec.fr", "cadremploi.fr",
  "glassdoor.fr", "monster.fr", "hellowork.com", "meteojob.com",
  "jobijoba.com", "otta.com", "remoterocketship.com", "himalayas.app",
  "wellfound.com", "eu-startups.com", "startup.jobs",
  // Cabinets de recrutement — généralement pas de jobs list publiques
  "michaelpage.fr", "pageexecutive.com", "hays.fr", "kornferry.com",
  "robertwalters.fr", "morganphilips.com", "lhh.com", "roberthalf.fr",
  "boyden.com", "kellerexecutivesearch.com", "ceo-worldwide.com",
  "execunet.com", "theladders.com", "arubaexec.com", "topofminds.com",
];

export async function bulkScanSources(limit?: number): Promise<{
  sourcesTotal: number;
  scannable: number;
  skipped: number;
  queriesGenerated: number;
  message: string;
}> {
  const sources = await prisma.jobSource.findMany({
    where: { active: true },
  });

  const scannable: string[] = [];
  const skipped: { name: string; reason: string }[] = [];

  for (const src of sources) {
    const domain = new URL(src.url).hostname.replace("www.", "");
    if (SKIP_DOMAINS.some((d) => domain.includes(d))) {
      skipped.push({ name: src.name, reason: "Bloqué/LinkedIn/cabinet → import manuel requis" });
      continue;
    }
    if (Object.keys(SCANNABLE_DOMAINS).some((d) => domain.includes(d)) || src.name.includes("France Travail")) {
      scannable.push(src.name);
    } else {
      skipped.push({ name: src.name, reason: "Pas de scan automatique possible" });
    }
  }

  // Générer les requêtes depuis le profil
  const profile = await prisma.profile.findFirst({
    include: { skills: true, experiences: { orderBy: { startDate: "desc" }, take: 10 } },
  });
  const cvMaster = await prisma.cVMaster.findFirst();

  const radarProfile: RadarProfile | null = profile ? {
    title: profile.title,
    functions: profile.functions,
    sectors: profile.sectors,
    yearsExp: profile.yearsExp,
    location: profile.location,
    mobility: profile.mobility,
    languages: profile.languages,
    targetSalary: profile.targetSalary,
    remotePreference: profile.remotePreference,
    constraints: profile.constraints,
    skills: profile.skills.map((s) => ({ name: s.name, category: s.category })),
    experiences: profile.experiences.map((e) => ({
      title: e.title, company: e.company, sector: e.sector,
      startDate: e.startDate, endDate: e.endDate,
    })),
  } : null;

  const queries = buildSearchQueriesFromProfile(radarProfile, cvMaster?.originalText);
  const limitedQueries = (limit ? queries.slice(0, limit) : queries);

  return {
    sourcesTotal: sources.length,
    scannable: scannable.length,
    skipped: skipped.length,
    queriesGenerated: limitedQueries.length,
    message: `${scannable.length} sources scannables sur ${sources.length}. ${skipped.length} nécessitent un import manuel (LinkedIn, Indeed, cabinets). Voici les requêtes : ${limitedQueries.join(", ")}`,
  };
}

/**
 * Génère des URLs France Travail pour chaque requête
 */
export async function generateFranceTravailUrls() {
  const queries = await prisma.profile.findFirst().then(async (profile) => {
    const cvMaster = await prisma.cVMaster.findFirst();
    const radarProfile: RadarProfile | null = profile ? {
      title: profile.title, functions: profile.functions, sectors: profile.sectors,
      yearsExp: profile.yearsExp, location: profile.location,
    } : null;
    return buildSearchQueriesFromProfile(radarProfile, cvMaster?.originalText);
  });

  return queries.map((q) => ({
    query: q,
    url: `https://candidat.francetravail.fr/offres/recherche?motsCles=${encodeURIComponent(q)}&lieux=France`,
  }));
}

/**
 * Génère des URLs Welcome to the Jungle pour chaque requête
 */
export async function generateWttjUrls() {
  const queries = await prisma.profile.findFirst().then(async (profile) => {
    const cvMaster = await prisma.cVMaster.findFirst();
    const radarProfile: RadarProfile | null = profile ? {
      title: profile.title, functions: profile.functions,
    } : null;
    return buildSearchQueriesFromProfile(radarProfile, cvMaster?.originalText);
  });

  return queries.map((q) => ({
    query: q,
    url: `https://www.welcometothejungle.com/fr/jobs?query=${encodeURIComponent(q)}`,
  }));
}
