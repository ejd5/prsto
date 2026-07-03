/*
 * Market Radar — Scoring
 * Pure function. Scores a job posting against the user profile.
 */

import type { NormalizedJobPosting, RadarScore, RadarProfile } from "./types";
import { priorityFromScore } from "./types";

export function scoreJobAgainstProfile(
  job: NormalizedJobPosting,
  profile?: RadarProfile | null,
  cvMasterText?: string | null
): RadarScore {
  let total = 0;
  const reasons: string[] = [];
  const risks: string[] = [];
  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];
  const p = profile;

  const jd = `${job.title} ${job.description}`.toLowerCase();
  const cvText = (cvMasterText || "").toLowerCase();

  // 1. Titre / niveau direction (20 points)
  if (p?.title) {
    const userTitle = p.title.toLowerCase();
    const titleWords = userTitle.split(/\s+/);
    const matchCount = titleWords.filter((w) => w.length > 3 && jd.includes(w)).length;
    const titleScore = Math.min(20, matchCount * 5 + 5);
    total += titleScore;
    if (titleScore >= 10) {
      reasons.push(`Titre compatible : ${userTitle} (${titleScore}/20)`);
      matchedKeywords.push(userTitle);
    } else {
      risks.push("Titre du poste éloigné du profil");
    }
  } else {
    total += 8; // fallback sans titre
  }

  // 2. Secteur compatible (15 points)
  if (p?.sectors) {
    try {
      const sectors: string[] = JSON.parse(p.sectors);
      const matched = sectors.filter((s) => jd.includes(s.toLowerCase().trim()));
      const sectorScore = Math.min(15, matched.length * 5);
      total += sectorScore;
      if (sectorScore > 0) {
        reasons.push(`Secteur(s) compatible(s) : ${matched.join(", ")} (${sectorScore}/15)`);
        matched.forEach((s) => matchedKeywords.push(s));
      } else {
        risks.push("Secteur non détecté ou non compatible");
        missingKeywords.push(...sectors.slice(0, 3));
      }
    } catch { total += 5; }
  } else {
    total += 5;
  }

  // 3. Scope / seniorité (15 points)
  const execTerms = ["directeur", "director", "vp", "head of", "chief", "general manager", "country manager", "président", "comex", "executive", "direction"];
  const matchedExec = execTerms.filter((t) => jd.includes(t));
  const execScore = Math.min(15, matchedExec.length * 4 + 3);
  total += execScore;
  if (matchedExec.length > 0) {
    reasons.push(`Scope exécutif détecté (${execScore}/15)`);
    matchedKeywords.push(...matchedExec);
  }

  // 4. Localisation / remote (10 points)
  if (p?.location || p?.mobility) {
    const locs = [p.location, p.mobility].filter(Boolean) as string[];
    const locMatched = locs.some((l) => jd.includes(l.toLowerCase()));
    if (locMatched) {
      total += 10;
      reasons.push("Localisation compatible (10/10)");
    } else if (job.remote && /remote|télétravail/i.test(job.remote)) {
      total += 8;
      reasons.push("Remote possible (8/10)");
    } else if (job.location && p.mobility) {
      total += 5;
      reasons.push("Localisation à vérifier (5/10)");
    } else {
      total += 3;
      risks.push("Localisation non vérifiée");
    }
  } else {
    total += 5;
  }

  // 5. Compétences (15 points)
  if (p?.skills && p.skills.length > 0) {
    const matched = p.skills.filter((s) => jd.includes(s.name.toLowerCase()) || cvText.includes(s.name.toLowerCase()));
    const skillScore = Math.min(15, matched.length * 3);
    total += skillScore;
    if (skillScore > 0) {
      reasons.push(`${matched.length} compétence(s) détectée(s) (${skillScore}/15)`);
      matched.forEach((s) => matchedKeywords.push(s.name));
    } else {
      risks.push("Aucune compétence clé détectée dans l'offre");
    }
  } else {
    total += 5;
  }

  // 6. Expérience demandée (10 points)
  if (p?.yearsExp) {
    const expMatch = jd.match(/(\d+)\+?\s*ans?\b/i);
    if (expMatch) {
      const required = parseInt(expMatch[1]);
      if (p.yearsExp >= required) {
        total += 10;
        reasons.push(`Expérience : ${p.yearsExp} ans ≥ ${required} requis (10/10)`);
      } else if (p.yearsExp >= required - 3) {
        total += 6;
        reasons.push(`Expérience proche : ${p.yearsExp} ans vs ${required} (6/10)`);
      }
    } else {
      total += 7;
      reasons.push("Expérience non spécifiée dans l'offre (7/10)");
    }
  } else {
    total += 5;
  }

  // 7. Salaire / niveau (5 points)
  if (p?.targetSalary && job.salary) {
    const salDigits = job.salary.match(/\d[\d\s]*[kK€]/);
    if (salDigits) {
      total += 3;
      reasons.push("Salaire mentionné (3/5)");
    } else {
      total += 1;
    }
  } else {
    total += 2;
  }

  // 8. Contraintes / exclusions (10 points)
  if (p?.constraints) {
    const constraintRisk = /déplacement|mobilité|demenagement|déménagement/i.test(p.constraints);
    if (constraintRisk && job.location) {
      total += 5;
      risks.push("Vérifier compatibilité mobilité");
    } else {
      total += 10;
    }
  } else {
    total += 8;
  }

  // Clamp
  total = Math.min(100, Math.max(0, total));

  return {
    total,
    priority: priorityFromScore(total),
    reasons,
    risks,
    matchedKeywords: [...new Set(matchedKeywords)],
    missingKeywords: [...new Set(missingKeywords)],
  };
}
