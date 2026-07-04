"use server";

import { prisma } from "@/lib/prisma";
import { analyzeJobFit, serializeAnalysis } from "./semantic-matcher";
import type { JobInput, ProfileInput } from "./semantic-matcher";

/**
 * Score rapide purement local (sans DeepSeek) basé sur le profil.
 * Retourne un score 0-100 et une priorité A/B/C.
 * Gère les titres anglais ET français.
 */

/* ─── Synonymes bilingues ────────────────── */

const COMMERCIAL_FR = [
  "commercial", "ventes", "sales", "business development", "biz dev",
  "account executive", "account manager", "key account", "revenue",
  "go-to-market", "gtm", "business", "client", "partnerships",
];

const DIRECTOR_FR = [
  "directeur", "director of", "director,", "director ", "head of", "vp ", "vice president",
  "country manager", "general manager", "managing director",
  "chief ", "president", "svp", "evp", "senior director",
  "senior manager", "c-level", "c-suite", "direction",
];

// "Account Executive" n'est PAS un poste de direction.
const NON_DIRECTION_TITLES = [
  "account executive", "account manager", "sales development",
  "business development representative", "sdr", "bdr",
];

const EXEC_TITLES = [
  "directeur", "director of", "head of", "vp ", "vice president",
  "country manager", "general manager", "managing director",
  "chief ", "president", "svp", "evp", "senior director",
  "senior manager", "cfo", "coo", "ceo",
  "cto", "cmo", "cro", "cpo", "partner", "comex", "direction",
  "lead ", "head ", "manager", "executive director",
];

/* ─── Helpers ────────────────────────────── */

function clean(s: string): string {
  return (s || "").toLowerCase().trim();
}

function includesAny(text: string, keywords: string[]): boolean {
  return keywords.some((kw) => text.includes(kw));
}

function countMatches(text: string, keywords: string[]): number {
  return keywords.filter((kw) => text.includes(kw)).length;
}

function isProfileCommercial(profileTitle: string): boolean {
  return includesAny(clean(profileTitle), ["commercial", "ventes", "sales", "business", "revenue"]);
}

function isProfileDirection(profileTitle: string): boolean {
  return includesAny(clean(profileTitle), DIRECTOR_FR);
}

function computeTitleScore(jobTitle: string, profileTitle: string): { score: number; reason: string } {
  const jt = clean(jobTitle);
  const pt = clean(profileTitle);

  // Match exact ou quasi-exact
  if (jt === pt) return { score: 30, reason: "Titre identique au profil (30/30)" };

  // "Account Executive" n'est pas un poste de direction
  const isNonDir = includesAny(jt, NON_DIRECTION_TITLES);

  // Le profil est Directeur Commercial
  const isCommercial = isProfileCommercial(pt);
  const isDir = isProfileDirection(pt);

  if (isDir && isCommercial) {
    // Profil = Directeur Commercial → on cherche un poste de direction commerciale
    const hasDir = !isNonDir && includesAny(jt, DIRECTOR_FR);
    const hasComm = includesAny(jt, COMMERCIAL_FR);

    if (hasDir && hasComm) {
      return { score: 30, reason: "Poste de direction commerciale détecté (30/30)" };
    }
    if (hasDir && !hasComm) {
      // Poste de direction mais pas commercial
      const dirCount = countMatches(jt, DIRECTOR_FR);
      if (dirCount >= 2) {
        return { score: 22, reason: "Poste de direction (non commercial) — compatible (22/30)" };
      }
      return { score: 18, reason: "Poste de direction — partiellement compatible (18/30)" };
    }
    if (hasComm && isNonDir) {
      // Account Executive, SDR, etc. — rôles commerciaux junior
      return { score: 14, reason: "Poste commercial (non-direction) — junior vs profil (14/30)" };
    }
    if (!hasDir && hasComm) {
      // Poste commercial mais pas direction (ex: Key Account Manager)
      const execLevel = jt.includes("senior") || jt.includes("enterprise") || jt.includes("head");
      if (execLevel) {
        return { score: 20, reason: "Poste commercial senior — compatible (20/30)" };
      }
      if (jt.includes("manager") || jt.includes("lead")) {
        return { score: 16, reason: "Poste commercial avec management — partiel (16/30)" };
      }
      return { score: 12, reason: "Poste commercial sans direction (12/30)" };
    }
    if (includesAny(jt, ["engineering", "developer", "data scientist", "designer", "product manager", "software"])) {
      return { score: 5, reason: "Poste technique — éloigné du profil (5/30)" };
    }
    return { score: 10, reason: "Titre éloigné du profil (10/30)" };
  }

  // Profil non-commercial : fallback générique
  const matchedDir = EXEC_TITLES.filter((t) => jt.includes(t));
  if (matchedDir.length >= 2) {
    return { score: 22, reason: `Termes exécutifs détectés : ${matchedDir.slice(0, 3).join(", ")} (22/30)` };
  }
  if (matchedDir.length === 1) {
    return { score: 18, reason: `Terme exécutif détecté : ${matchedDir[0]} (18/30)` };
  }

  // Matching mot-à-mot basique
  const pWords = pt.split(/\s+/).filter((w) => w.length > 2);
  const matched = pWords.filter((w) => jt.includes(w));
  if (matched.length >= 2) {
    return { score: 16, reason: `Mots-clés partagés : ${matched.join(", ")} (16/30)` };
  }
  if (matched.length === 1) {
    return { score: 10, reason: `Mot-clé partagé : ${matched[0]} (10/30)` };
  }
  return { score: 5, reason: "Titre éloigné du profil (5/30)" };
}

function computeSectorScore(fullText: string, profileSectors: string | null): { score: number; reason?: string } {
  if (!profileSectors) return { score: 8 };
  try {
    const sectors: string[] = JSON.parse(profileSectors);
    const matched = sectors.filter((s) => s && s.trim().length > 2 && fullText.includes(s.toLowerCase().trim()));
    if (matched.length > 0) {
      return { score: 20, reason: `Secteur(s) compatible(s) : ${matched.join(", ")} (20/20)` };
    }
  } catch { /* ignore */ }
  return { score: 8, reason: "Secteur non détecté" };
}

function computeLocationScore(
  jobLocation: string,
  profileLocation: string | null,
  profileMobility: string | null,
): { score: number; reason?: string } {
  const jl = clean(jobLocation);
  if (!profileLocation) return { score: 8 };

  const pl = clean(profileLocation);
  if (jl.includes(pl) || pl.includes(jl)) {
    return { score: 15, reason: "Localisation compatible (15/15)" };
  }

  // France entière
  if (jl.includes("france") || jl.includes("paris") || jl.includes("lyon") || jl.includes("marseille")) {
    return { score: 12, reason: "Grande ville française (12/15)" };
  }

  if (profileMobility) {
    try {
      const mobility: string[] = JSON.parse(profileMobility);
      const locMatch = mobility.some((m) => jl.includes(clean(m)));
      if (locMatch) return { score: 12, reason: "Dans la zone de mobilité (12/15)" };
    } catch { /* ignore */ }
  }

  return { score: 5, reason: "Localisation éloignée (5/15)" };
}

function computeSkillsScore(fullText: string, skills: Array<{ name: string }>): { score: number; matched: number } {
  if (!skills || skills.length === 0) return { score: 5, matched: 0 };
  const matched = skills.filter((s) => fullText.includes(s.name.toLowerCase()));
  const score = Math.min(15, matched.length * 3);
  return { score, matched: matched.length };
}

function computeExperienceScore(
  desc: string,
  yearsExp: number | null,
): { score: number; reason?: string } {
  if (!yearsExp) return { score: 5 };
  const expMatch = desc.match(/(\d+)\+?\s*(ans?|years?)/i);
  if (expMatch) {
    const required = parseInt(expMatch[1]);
    if (yearsExp >= required) {
      return { score: 10, reason: `Expérience : ${yearsExp} ans ≥ ${required} requis (10/10)` };
    }
    return { score: 4, reason: `Expérience : ${yearsExp} vs ${required} requis (4/10)` };
  }
  return { score: 7, reason: "Expérience non spécifiée dans l'offre (7/10)" };
}

function computeScopeScore(fullText: string): { score: number; reason?: string } {
  const matched = EXEC_TITLES.filter((t) => fullText.includes(t));
  const score = Math.min(10, matched.length * 2 + 2);
  if (matched.length >= 2) {
    return { score, reason: `Niveau exécutif : ${matched.slice(0, 4).join(", ")} (${score}/10)` };
  }
  return { score: Math.min(4, score) };
}

/* ─── Main ────────────────────────────────── */

export async function quickScoreJob(jobId: string) {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) return { success: false, error: "Offre introuvable" };

  const profile = await prisma.profile.findFirst({
    include: { skills: true, experiences: { orderBy: { startDate: "desc" }, take: 5 } },
  });

  if (!profile) {
    await prisma.jobScore.upsert({
      where: { jobId },
      create: { jobId, globalScore: 50, recommendedAction: "review", reasonsJson: JSON.stringify(["Profil non configuré — score neutre"]) },
      update: { globalScore: 50, recommendedAction: "review", reasonsJson: JSON.stringify(["Profil non configuré — score neutre"]) },
    });
    return { success: true, score: 50, priority: "B" as const };
  }

  const title = clean(job.title);
  const desc = clean(job.description || "");
  const location = clean(job.location || "");
  const fullText = title + " " + desc;

  const reasons: string[] = [];
  const redFlags: string[] = [];
  let total = 0;

  // 1. Titre (30 pts)
  const titleResult = computeTitleScore(job.title, profile.title || "");
  total += titleResult.score;
  reasons.push(titleResult.reason);
  if (titleResult.score < 10) redFlags.push("Titre très éloigné du profil");

  // 2. Secteurs (20 pts)
  const sectorResult = computeSectorScore(fullText, profile.sectors);
  total += sectorResult.score;
  if (sectorResult.reason) reasons.push(sectorResult.reason);
  if (sectorResult.score < 10) redFlags.push("Secteur non compatible");

  // 3. Localisation (15 pts)
  const locResult = computeLocationScore(job.location || "", profile.location, profile.mobility);
  total += locResult.score;
  if (locResult.reason) reasons.push(locResult.reason);

  // 4. Compétences (15 pts)
  const skillResult = computeSkillsScore(fullText, profile.skills || []);
  total += skillResult.score;
  if (skillResult.matched > 0) {
    reasons.push(`${skillResult.matched} compétence(s) détectée(s) (${skillResult.score}/15)`);
  }

  // 5. Expérience (10 pts)
  const expResult = computeExperienceScore(desc, profile.yearsExp);
  total += expResult.score;
  if (expResult.reason) reasons.push(expResult.reason);
  if (expResult.score < 5) redFlags.push("Expérience potentiellement insuffisante");

  // 6. Scope exécutif (10 pts)
  const scopeResult = computeScopeScore(fullText);
  total += scopeResult.score;
  if (scopeResult.reason) reasons.push(scopeResult.reason);

  // 7. Contrat / remote (5 pts)
  let contractScore = 0;
  if (job.contractType && /CDI|full.time/i.test(job.contractType)) { contractScore += 3; }
  if (job.remotePolicy && /remote|hybride/i.test(job.remotePolicy)) { contractScore += 2; }
  total += contractScore;

  // 8. Salaire (bonus)
  if (job.salaryMin || job.salaryMax) total += 3;
  else total += 1;

  // Clamp
  total = Math.min(100, Math.max(0, total));

  // Action recommandée
  let recommendedAction: "apply" | "shortlist" | "review" | "skip";
  if (total >= 75) recommendedAction = "apply";
  else if (total >= 55) recommendedAction = "shortlist";
  else if (total >= 35) recommendedAction = "review";
  else recommendedAction = "skip";

  // Enregistrer
  await prisma.jobScore.upsert({
    where: { jobId },
    create: {
      jobId,
      globalScore: total,
      recommendedAction,
      reasonsJson: JSON.stringify(reasons),
      redFlagsJson: JSON.stringify(redFlags),
    },
    update: {
      globalScore: total,
      recommendedAction,
      reasonsJson: JSON.stringify(reasons),
      redFlagsJson: JSON.stringify(redFlags),
    },
  });

  // Semantic matching (non-blocking)
  try {
    const j = job as unknown as Record<string, unknown>;
    const jobInput: JobInput = {
      title: job.title,
      company: job.company,
      location: job.location,
      locationPriority: job.locationPriority,
      countryScope: (j.countryScope as string) ?? null,
      remotePolicy: job.remotePolicy,
      contractType: job.contractType,
      salaryMin: job.salaryMin as number | null,
      salaryMax: job.salaryMax as number | null,
      seniority: (j.seniority as string) ?? null,
      functionArea: (j.functionArea as string) ?? null,
      sector: (j.sector as string) ?? null,
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
      where: { jobId },
      data: {
        semanticScore: analysis.overallScore,
        semanticConfidence: analysis.confidence,
        semanticAnalysisJson: JSON.stringify(serialized),
        recommendation: analysis.recommendation,
      },
    });
  } catch {
    // Semantic matching failure must not break quick-score
  }

  let priority: "A" | "B" | "C";
  if (total >= 75) priority = "A";
  else if (total >= 55) priority = "B";
  else priority = "C";

  return { success: true, score: total, priority, reasons, redFlags };
}

/**
 * Score toutes les offres non-scorées. Appelé au chargement de la page.
 */
export async function quickScoreAll() {
  const jobs = await prisma.job.findMany({
    where: {
      score: null,
      title: { not: { startsWith: "[DEMO]" } },
    },
    select: { id: true },
  });

  let scored = 0;
  for (const job of jobs) {
    await quickScoreJob(job.id);
    scored++;
  }

  return { success: true, scored };
}

/**
 * Force le re-scoring de toutes les offres (même déjà scorées).
 */
export async function quickScoreAllForce() {
  const jobs = await prisma.job.findMany({
    where: {
      title: { not: { startsWith: "[DEMO]" } },
    },
    select: { id: true },
  });

  let scored = 0;
  for (const job of jobs) {
    await quickScoreJob(job.id);
    scored++;
  }

  return { success: true, scored };
}
