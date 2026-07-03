/**
 * tailor-engine.ts — Moteur d'adaptation de CV par offre
 *
 * Produit un CvRenderData complet, directement consommable par les templates React,
 * avec le contenu adapté à une offre spécifique.
 *
 * Deux modes :
 * - template : algorithme de re-ranking + interpolation de mots-clés (sans IA)
 * - ai : prompt structuré → JSON CvRenderData (avec fallback template)
 */

import { prisma } from "@/lib/prisma";
import {
  buildCandidateSnapshot,
  runFullAnalysis,
  type CandidateSnapshot,
  type AnalysisReport,
} from "@/lib/analysis/engine";
import { buildCvRenderData } from "@/lib/cv-render/build-data";
import type {
  CvRenderData,
  CvExperience,
  CvAchievement,
  CvTemplateId,
} from "@/components/cv-templates/cv-template-types";
import { resolveTemplate, resolveAccent } from "@/components/cv-templates/cv-template-types";
import type { HallucinationAlert } from "@/lib/generation/engine";

// ─── Types ──────────────────────────────────────────────────

export interface TailorOptions {
  template: CvTemplateId;
  useAI: boolean;
  styleId?: string;
  language?: "fr" | "en";
}

export interface TailorResult {
  renderData: CvRenderData;
  rawText: string;
  alerts: HallucinationAlert[];
  mode: "ai" | "template";
}

// ─── Helpers de pertinence ──────────────────────────────────

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Score de pertinence d'une expérience par rapport à l'offre
 * Prend en compte : titre, achievements, description, country/sector
 */
function scoreExperienceRelevance(
  exp: CandidateSnapshot["experiences"][0],
  analysis: AnalysisReport
): number {
  let score = 0;
  const normTitle = normalize(exp.title);
  const normDesc = normalize(exp.description || "");
  const normAll = `${normTitle} ${normDesc} ${(exp.achievements || []).map(normalize).join(" ")}`;

  // ATS keywords match
  for (const kw of analysis.keywordsAts) {
    if (normAll.includes(normalize(kw))) score += 10;
  }

  // Confirmed match proofs
  for (const m of analysis.match.confirmedMatches) {
    if (normAll.includes(normalize(m.requirement))) score += 15;
    if (normAll.includes(normalize(m.proof))) score += 10;
  }

  // Strongest proofs
  for (const p of analysis.match.strongestProofs) {
    if (normAll.includes(normalize(p.proof))) score += 12;
  }

  // Sector match
  if (analysis.requirements.sector && normalize(exp.sector || "").includes(normalize(analysis.requirements.sector))) {
    score += 8;
  }

  // Sales/management skills match
  for (const skill of [...analysis.requirements.salesSkills, ...analysis.requirements.managementSkills]) {
    if (normAll.includes(normalize(skill))) score += 5;
  }

  // P&L / leadership signals
  for (const sig of analysis.requirements.leadershipSignals) {
    if (normAll.includes(normalize(sig))) score += 3;
  }

  return score;
}

/**
 * Score de pertinence d'un achievement par rapport à l'offre
 */
function scoreAchievementRelevance(achievement: string, analysis: AnalysisReport): number {
  let score = 0;
  const norm = normalize(achievement);

  for (const kw of analysis.keywordsAts) {
    if (norm.includes(normalize(kw))) score += 10;
  }
  for (const m of analysis.match.confirmedMatches) {
    if (norm.includes(normalize(m.requirement))) score += 8;
  }
  // Chiffres bonus — les recruteurs adorent les métriques
  if (/\d+[%kK€M]|\d{2,}/.test(achievement)) score += 5;

  return score;
}

/**
 * Score de pertinence d'une compétence par rapport à l'offre
 */
function scoreSkillRelevance(skillName: string, analysis: AnalysisReport): number {
  let score = 0;
  const norm = normalize(skillName);

  for (const kw of analysis.keywordsAts) {
    if (norm.includes(normalize(kw)) || normalize(kw).includes(norm)) score += 15;
  }
  for (const m of analysis.match.confirmedMatches) {
    if (norm.includes(normalize(m.requirement)) || normalize(m.requirement).includes(norm)) score += 10;
  }
  for (const skill of [...analysis.requirements.salesSkills, ...analysis.requirements.managementSkills, ...analysis.requirements.strategicSkills]) {
    if (norm.includes(normalize(skill)) || normalize(skill).includes(norm)) score += 8;
  }

  return score;
}

// ─── Adaptation du résumé (mode template) ───────────────────

function buildAdaptedSummary(
  candidate: CandidateSnapshot,
  analysis: AnalysisReport,
  targetTitle: string,
  targetCompany: string,
  language: "fr" | "en"
): string {
  const baseSummary = candidate.summary || "";
  const topMatches = analysis.match.confirmedMatches.slice(0, 3);
  const topKeywords = analysis.keywordsAts.slice(0, 4);

  // Identifier les compétences/preuves qui matchent le poste
  const proofHighlights = analysis.match.strongestProofs
    .slice(0, 2)
    .map(p => p.proof)
    .join(". ");

  if (language === "fr") {
    // Construction d'un résumé enrichi orienté offre
    const parts: string[] = [];

    // Phrase d'ouverture — orientée rôle ciblé
    const rolePart = candidate.title || "Dirigeant commercial";
    parts.push(
      `${rolePart} avec ${candidate.yearsExp} ans d'expérience` +
      (candidate.sectors.length > 0 ? ` dans les secteurs ${candidate.sectors.slice(0, 2).join(", ")}` : "") +
      "."
    );

    // Core competence alignment
    if (topMatches.length > 0) {
      const matchParts = topMatches.map(m => m.requirement).join(", ");
      parts.push(`Expertise confirmée en ${matchParts}.`);
    }

    // Proof highlights
    if (proofHighlights) {
      parts.push(proofHighlights + ".");
    }

    // ATS keywords injection
    if (topKeywords.length > 0) {
      const kwText = topKeywords
        .filter(kw => !parts.join(" ").toLowerCase().includes(kw.toLowerCase()))
        .slice(0, 3);
      if (kwText.length > 0) {
        parts.push(`Compétences clés : ${kwText.join(", ")}.`);
      }
    }

    return parts.join(" ").slice(0, 600);
  } else {
    // English version
    const parts: string[] = [];
    const rolePart = candidate.title || "Commercial Leader";
    parts.push(
      `${rolePart} with ${candidate.yearsExp} years of experience` +
      (candidate.sectors.length > 0 ? ` in ${candidate.sectors.slice(0, 2).join(", ")}` : "") +
      "."
    );

    if (topMatches.length > 0) {
      const matchParts = topMatches.map(m => m.requirement).join(", ");
      parts.push(`Proven track record in ${matchParts}.`);
    }

    if (proofHighlights) {
      parts.push(proofHighlights + ".");
    }

    return parts.join(" ").slice(0, 600);
  }
}

// ─── Sélection des achievements pertinents ──────────────────

function selectRelevantAchievements(
  candidate: CandidateSnapshot,
  analysis: AnalysisReport
): CvAchievement[] {
  // Toutes les preuves du Proof Vault
  const allProofs = candidate.proofEntries.map(p => ({
    label: p.category,
    value: p.value,
    description: p.title,
    score: 0,
  }));

  // Scorer chaque preuve
  for (const proof of allProofs) {
    const combined = `${proof.label} ${proof.value} ${proof.description || ""}`;
    proof.score = scoreAchievementRelevance(combined, analysis);
  }

  // Trier par pertinence, garder le top 6
  return allProofs
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(p => ({
      label: p.label,
      value: p.value,
      description: p.description,
    }));
}

// ─── Conversion CandidateSnapshot → CvRenderData adaptée ────

function buildTailoredRenderData(
  candidate: CandidateSnapshot,
  analysis: AnalysisReport,
  opportunity: { id: string; title: string; company: string; rawText: string },
  options: TailorOptions
): CvRenderData {
  // 1. Scorer et trier les expériences
  const scoredExperiences = candidate.experiences.map(exp => ({
    exp,
    relevance: scoreExperienceRelevance(exp, analysis),
  }));
  scoredExperiences.sort((a, b) => b.relevance - a.relevance);

  // 2. Construire les expériences avec achievements re-ordonnés
  const experiences: CvExperience[] = scoredExperiences.map(({ exp }) => {
    const achievements = (exp.achievements || [])
      .map(a => ({ text: a, score: scoreAchievementRelevance(a, analysis) }))
      .sort((a, b) => b.score - a.score)
      .map(a => a.text);

    const desc = exp.description || "";
    const bullets = desc
      .split(/\n/)
      .filter(l => l.trim().length > 10)
      .map(l => l.replace(/^[•\-]\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 5);

    return {
      company: exp.company,
      title: exp.title,
      startDate: undefined, // The snapshot doesn't have startDate; it's in the DB
      endDate: undefined,
      location: exp.country || undefined,
      description: desc.slice(0, 300) || undefined,
      bullets: bullets.length > 0 ? bullets : undefined,
      achievements: achievements.length > 0 ? achievements.slice(0, 4) : undefined,
    };
  });

  // 3. Scorer et trier les compétences
  const scoredSkills = candidate.skills.map(s => ({
    name: s.name,
    score: scoreSkillRelevance(s.name, analysis),
  }));
  scoredSkills.sort((a, b) => b.score - a.score);
  const skills = scoredSkills.map(s => s.name);

  // 4. Résumé adapté
  const language = options.language || "fr";
  const summary = buildAdaptedSummary(
    candidate,
    analysis,
    opportunity.title,
    opportunity.company,
    language
  );

  // 5. Achievements pertinents du Proof Vault
  const achievements = selectRelevantAchievements(candidate, analysis);

  // 6. Education, langues, certifications (identiques)
  const languages = candidate.languages.map(l => {
    const parts = l.match(/^(.+?)\s*[(\-–—]\s*(.+?)\s*[)\-–—]?\s*$/);
    if (parts) return { name: parts[1].trim(), level: parts[2].trim() };
    return { name: l, level: undefined };
  });

  // 7. Construire le CvRenderData complet
  const renderData: CvRenderData = {
    identity: {
      fullName: candidate.fullName,
      title: candidate.title,
      email: candidate.email,
      phone: candidate.phone,
      location: candidate.location,
      linkedin: candidate.linkedin,
    },
    summary,
    experiences,
    skills,
    education: [], // Will be filled from profile
    languages,
    certifications: [], // Will be filled from profile
    achievements,
    targetJob: {
      title: opportunity.title,
      company: opportunity.company,
      sector: analysis.requirements.sector || undefined,
      atsKeywords: analysis.keywordsAts.slice(0, 12),
      matchScore: analysis.score.globalScore,
    },
    adaptationMeta: {
      adaptedForOfferId: opportunity.id,
      adaptationMode: "template",
      summaryWasAdapted: true,
      experiencesReordered: scoredExperiences.length > 1 && scoredExperiences[0].relevance !== scoredExperiences[1].relevance,
      skillsFiltered: true,
    },
    template: options.template,
    options: {
      includePhoto: true,
      includeLinkedIn: false,
      accentColor: resolveAccent(null),
    },
  };

  return renderData;
}

// ─── Compléter avec les données profil (éducation, etc.) ────

async function enrichFromProfile(renderData: CvRenderData): Promise<CvRenderData> {
  const profile = await prisma.profile.findFirst();
  if (!profile) return renderData;

  // Education
  const eduRaw = safeJsonParse(profile.education);
  renderData.education = eduRaw.map((e: string) => {
    const parts = e.split(" — ");
    const degree = parts[0]?.trim();
    const school = parts[1]?.trim();
    const year = parts[2]?.trim() || undefined;
    if (school && /^\d{4}$/.test(school) && !year) {
      return { degree, school: undefined, year: school };
    }
    return { degree, school, year };
  }).filter((e: { degree?: string }) => e.degree);

  // Certifications
  renderData.certifications = safeJsonParse(profile.certifications);

  // Photo & LinkedIn preferences
  renderData.options.includePhoto = profile.cvIncludePhoto ?? true;
  renderData.options.includeLinkedIn = profile.cvIncludeLinkedIn ?? false;
  renderData.options.accentColor = resolveAccent(profile.cvAccentColor);

  // Photo URL
  if (profile.photoUrl) {
    renderData.identity.photoUrl = profile.photoUrl;
  }

  return renderData;
}

// ─── Génération du texte brut (pour stockage Document) ──────

function renderDataToText(data: CvRenderData, language: "fr" | "en"): string {
  const sections: string[] = [];
  const i = data.identity;

  // Header
  sections.push((i.fullName || "").toUpperCase());
  sections.push([i.title, i.location].filter(Boolean).join(" | "));
  sections.push([i.email, i.phone, i.linkedin].filter(Boolean).join(" | "));

  // Target job
  if (data.targetJob?.title && data.targetJob?.company) {
    sections.push("");
    sections.push(language === "fr"
      ? `Candidature : ${data.targetJob.title} — ${data.targetJob.company}`
      : `Application: ${data.targetJob.title} — ${data.targetJob.company}`
    );
  }

  // Summary
  if (data.summary) {
    sections.push("");
    sections.push(language === "fr" ? "RÉSUMÉ EXÉCUTIF" : "EXECUTIVE SUMMARY");
    sections.push(data.summary);
  }

  // Experiences
  if (data.experiences.length > 0) {
    sections.push("");
    sections.push(language === "fr" ? "EXPÉRIENCES PROFESSIONNELLES" : "PROFESSIONAL EXPERIENCE");
    for (const exp of data.experiences) {
      sections.push("");
      sections.push(`${exp.title} — ${exp.company}`);
      if (exp.location) sections.push(exp.location);
      if (exp.description) sections.push(exp.description);
      if (exp.achievements?.length) {
        for (const a of exp.achievements) {
          sections.push(`• ${a}`);
        }
      }
      if (exp.bullets?.length && !exp.achievements?.length) {
        for (const b of exp.bullets) {
          sections.push(`• ${b}`);
        }
      }
    }
  }

  // Skills
  if (data.skills.length > 0) {
    sections.push("");
    sections.push(language === "fr" ? "COMPÉTENCES CLÉS" : "CORE COMPETENCIES");
    sections.push(data.skills.join(" | "));
  }

  // Achievements
  if (data.achievements.length > 0) {
    sections.push("");
    sections.push(language === "fr" ? "RÉALISATIONS CLÉS" : "KEY ACHIEVEMENTS");
    for (const a of data.achievements) {
      sections.push(`• ${a.label}: ${a.value}${a.description ? ` — ${a.description}` : ""}`);
    }
  }

  // Education
  if (data.education.length > 0) {
    sections.push("");
    sections.push(language === "fr" ? "FORMATION" : "EDUCATION");
    for (const e of data.education) {
      sections.push(`${e.degree}${e.school ? ` — ${e.school}` : ""}${e.year ? ` (${e.year})` : ""}`);
    }
  }

  // Languages
  if (data.languages.length > 0) {
    sections.push("");
    sections.push(language === "fr" ? "LANGUES" : "LANGUAGES");
    sections.push(data.languages.map(l => `${l.name}${l.level ? ` (${l.level})` : ""}`).join(", "));
  }

  // Certifications
  if (data.certifications.length > 0) {
    sections.push("");
    sections.push("CERTIFICATIONS");
    for (const c of data.certifications) {
      sections.push(`• ${c}`);
    }
  }

  return sections.join("\n");
}

// ─── API Principale ─────────────────────────────────────────

/**
 * Génère un CV adapté à une offre spécifique.
 * Retourne un CvRenderData directement consommable par les templates React,
 * plus une version texte pour le stockage Document.
 */
export async function tailorCvForOffer(
  opportunityId: string,
  options: TailorOptions
): Promise<TailorResult> {
  // 1. Charger l'opportunité
  const opp = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    include: { analysis: true },
  });
  if (!opp || !opp.rawText) {
    throw new Error("Opportunité introuvable ou sans description.");
  }

  // 2. Charger le profil candidat
  const candidate = await buildCandidateSnapshot();
  if (!candidate) {
    throw new Error("Profil candidat non configuré.");
  }

  // 3. Charger ou calculer l'analyse
  let analysis: AnalysisReport;
  if (opp.analysis) {
    // Reconstituer l'AnalysisReport depuis les données stockées
    const storedAnalysis = opp.analysis;
    const parsedKeywords = safeJsonParse(storedAnalysis.keywordsAts);
    const parsedExigences = safeJsonParse(storedAnalysis.exigences);
    const parsedRisks = safeJsonParse(storedAnalysis.risks);
    const parsedGaps = safeJsonParse(storedAnalysis.gaps);
    const parsedPointsForts = safeJsonParse(storedAnalysis.pointsForts);
    const parsedMatchDetails = safeJsonParseObj(storedAnalysis.matchDetails);

    // Run fresh analysis for full types
    analysis = runFullAnalysis(opp.rawText, candidate);
    // Override avec les données stockées si dispo
    if (storedAnalysis.scoreGlobal) {
      analysis.score.globalScore = storedAnalysis.scoreGlobal;
    }
    if (parsedKeywords.length > 0) {
      analysis.keywordsAts = parsedKeywords;
    }
  } else {
    // Analyse fraîche
    analysis = runFullAnalysis(opp.rawText, candidate);
  }

  // 4. Charger les expériences avec dates depuis la DB
  const profileWithExp = await prisma.profile.findFirst({
    include: {
      experiences: { orderBy: { createdAt: "desc" } },
    },
  });

  // 5. Construire le CvRenderData adapté
  let renderData = buildTailoredRenderData(
    candidate,
    analysis,
    { id: opp.id, title: opp.title, company: opp.company, rawText: opp.rawText },
    options
  );

  // 6. Enrichir les expériences avec les dates de la DB et conserver l'ordre chronologique original
  if (profileWithExp?.experiences) {
    const enrichedExperiences = renderData.experiences.map(exp => {
      const dbExp = profileWithExp.experiences.find(
        e => e.company.toLowerCase().trim() === exp.company.toLowerCase().trim() ||
             e.title.toLowerCase().trim() === exp.title.toLowerCase().trim()
      );
      if (dbExp) {
        return {
          ...exp,
          startDate: dbExp.startDate || undefined,
          endDate: dbExp.endDate || undefined,
          location: exp.location || dbExp.country || undefined,
        };
      }
      return exp;
    });

    // Trier les expériences enrichies par startDate descendante (les plus récentes en premier)
    enrichedExperiences.sort((a, b) => {
      const dateA = a.startDate || "";
      const dateB = b.startDate || "";
      return dateB.localeCompare(dateA);
    });

    renderData.experiences = enrichedExperiences;
  }

  // 7. Enrichir depuis le profil (éducation, certifications, photo, etc.)
  renderData = await enrichFromProfile(renderData);

  // 8. Forcer le template choisi
  renderData.template = options.template;

  // 9. Générer le texte brut
  const language = options.language || "fr";
  const rawText = renderDataToText(renderData, language);

  return {
    renderData,
    rawText,
    alerts: [], // Pas d'hallucination en mode template (données vérifiées)
    mode: "template",
  };
}

// ─── Helpers ────────────────────────────────────────────────

function safeJsonParse(v: string | null | undefined): string[] {
  if (!v) return [];
  try {
    const arr = JSON.parse(v);
    return Array.isArray(arr) ? arr.filter(Boolean).map(String) : [];
  } catch {
    return [];
  }
}

function safeJsonParseObj(v: string | null | undefined): Record<string, unknown> {
  if (!v) return {};
  try {
    const obj = JSON.parse(v);
    return typeof obj === "object" && obj !== null ? obj : {};
  } catch {
    return {};
  }
}
