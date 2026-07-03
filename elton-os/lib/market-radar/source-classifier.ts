/*
 * Market Radar — Source Classifier
 * Pure function. No DB, no network.
 */

import type { MarketRadarSourceType } from "./types";

export function classifySource(url: string): MarketRadarSourceType {
  const u = url.toLowerCase().trim();
  if (!u) return "career_page";

  // LinkedIn / Indeed / APEC → import manuel assisté, jamais scrapé
  if (u.includes("linkedin.com")) return "assisted_url";
  if (/indeed\.\w{2,3}/.test(u) || u.includes("indeed.com")) return "assisted_url";
  if (u.includes("apec.fr")) return "assisted_url";

  // Welcometothejungle → career page (not assisted by default)
  if (u.includes("welcometothejungle.com")) return "career_page";

  // ATS publics (API ou HTML parsing)
  if (u.includes("boards.greenhouse.io") || u.includes("greenhouse.io")) return "ats_public";
  if (u.includes("jobs.lever.co") || u.includes("lever.co")) return "ats_public";
  if (u.includes("smartrecruiters.com")) return "ats_public";
  if (u.includes("ashbyhq.com") || u.includes("jobs.ashbyhq.com")) return "ats_public";
  if (u.includes("workable.com") || u.includes("apply.workable.com")) return "ats_public";
  if (u.includes("recruitee.com")) return "ats_public";
  if (u.includes("breezy.hr")) return "ats_public";
  if (u.includes("teamtailor.com")) return "ats_public";

  // APIs officielles
  if (u.includes("francetravail.fr") || u.includes("api.francetravail")) return "official_api";
  if (u.includes("pole-emploi.fr") || u.includes("api.pole-emploi")) return "official_api";

  return "career_page";
}
