/*
 * buildCvRenderData — Pure function, no DB, no network. Testable unitairement.
 * Construit CvRenderData à partir des données du profil, CV maître, document généré.
 * Règles anti-hallucination : jamais inventer, jamais de placeholder, jamais de Markdown.
 */
import type { CvRenderData, CvExperience, CvEducation, CvLanguage, CvAchievement } from "@/components/cv-templates/cv-template-types";
import { resolveTemplate, resolveAccent } from "@/components/cv-templates/cv-template-types";
import { cleanMarkdown } from "@/components/cv-templates/cv-template-utils";

type BuildInput = {
  profile?: {
    fullName?: string | null; title?: string | null; email?: string | null; phone?: string | null;
    linkedin?: string | null; location?: string | null; photoUrl?: string | null;
    summary?: string | null; languages?: string | null; education?: string | null;
    certifications?: string | null; sectors?: string | null;
    cvDefaultTemplate?: string | null; cvIncludePhoto?: boolean | null;
    cvIncludeLinkedIn?: boolean | null; cvAccentColor?: string | null;
  } | null;
  cvMasterText?: string | null;
  generatedCvContent?: string | null;
  experiences?: {
    company: string; title: string; startDate?: string; endDate?: string | null;
    location?: string; country?: string | null; description?: string | null;
    achievements?: string | null; responsibilities?: string | null; sector?: string | null;
  }[];
  skills?: { name: string; category?: string }[];
  proofEntries?: { category: string; title: string; value: string; description?: string }[];
  targetJob?: { title?: string; company?: string };
};

export function buildCvRenderData(input: BuildInput): CvRenderData {
  const p = input.profile;

  // Identity
  const identity: CvRenderData["identity"] = {};
  if (p?.fullName) identity.fullName = p.fullName;
  if (p?.title) identity.title = p.title;
  if (p?.email) identity.email = p.email;
  if (p?.phone) identity.phone = p.phone;
  if (p?.location) identity.location = p.location;
  if (p?.linkedin) identity.linkedin = p.linkedin;
  if (p?.photoUrl) identity.photoUrl = p.photoUrl;

  // Résumé (priorité : generatedCvContent > profile.summary > cvMasterText)
  const summary = cleanMarkdown(
    extractSummary(input.generatedCvContent) ||
    (p?.summary || "").slice(0, 600) ||
    extractSummary(input.cvMasterText) ||
    ""
  );

  // Expériences
  const experiences: CvExperience[] = (input.experiences || []).map((e) => {
    const achievements = safeParse(e.achievements);
    const desc = e.description || e.responsibilities || "";
    const bullets = extractBullets(desc);
    return {
      company: e.company,
      title: e.title,
      startDate: e.startDate,
      endDate: e.endDate || undefined,
      location: e.location || e.country || undefined,
      description: cleanMarkdown(desc).slice(0, 300) || undefined,
      bullets: bullets.length > 0 ? bullets : undefined,
      achievements: achievements.length > 0 ? achievements.map(String) : undefined,
    };
  });

  // Skills
  const skills = (input.skills || []).map((s) => s.name);

  // Education
  const education: CvEducation[] = safeParse(p?.education).map((e: string) => {
    const parts = e.split(" — ");
    return { degree: parts[0]?.trim(), school: parts[1]?.trim() };
  }).filter((e) => e.degree);

  // Languages
  const languages: CvLanguage[] = safeParse(p?.languages).map((l: string) => {
    const cleaned = l.replace(/[\[\]"]/g, "").trim();
    const match = cleaned.match(/^(.+?)(?:\s*\((.+)\))?$/);
    return { name: match?.[1]?.trim() || cleaned, level: match?.[2]?.trim() };
  });

  // Certifications
  const certifications: string[] = safeParse(p?.certifications);

  // Achievements (Proof Vault)
  const achievements: CvAchievement[] = (input.proofEntries || []).slice(0, 6).map((pr) => ({
    label: pr.category,
    value: pr.value,
    description: pr.title,
  }));

  // Options
  const options = {
    includePhoto: p?.cvIncludePhoto ?? true,
    includeLinkedIn: p?.cvIncludeLinkedIn ?? false,
    accentColor: resolveAccent(p?.cvAccentColor),
  };

  return {
    identity,
    summary: summary || undefined,
    experiences,
    skills,
    education,
    languages,
    certifications,
    achievements,
    targetJob: input.targetJob,
    template: resolveTemplate(p?.cvDefaultTemplate),
    options,
  };
}

/* ─── Helpers ─── */

function safeParse(v: string | null | undefined): string[] {
  if (!v) return [];
  try { const arr = JSON.parse(v); return Array.isArray(arr) ? arr.filter(Boolean).map(String) : []; } catch { return []; }
}

function extractSummary(text?: string | null): string | null {
  if (!text) return null;
  const clean = cleanMarkdown(text);
  const lines = clean.split("\n").filter((l) => l.trim().length > 20);
  // Chercher "RÉSUMÉ EXÉCUTIF" ou "PROFIL"
  const summaryIdx = lines.findIndex((l) => /RÉSUMÉ|RESUME|PROFIL/i.test(l));
  if (summaryIdx >= 0 && summaryIdx < lines.length - 1) {
    return lines.slice(summaryIdx + 1, summaryIdx + 5).join(" ").slice(0, 600);
  }
  // Fallback : premières lignes significatives
  return lines.slice(0, 4).join(" ").slice(0, 600) || null;
}

function extractBullets(desc: string): string[] {
  if (!desc) return [];
  return desc.split(/\n/).filter((l) => l.trim().length > 10).map((l) => cleanMarkdown(l.replace(/^[•\-]\s*/, ""))).filter(Boolean).slice(0, 5);
}
