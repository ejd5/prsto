/*
 * buildCvRenderData — Pure function, no DB, no network.
 * Construit CvRenderData à partir du profil, CV maître, document généré par IA.
 */
import type { CvRenderData, CvExperience, CvEducation, CvLanguage, CvAchievement } from "@/components/cv-templates/cv-template-types";
import { resolveTemplate, resolveAccent } from "@/components/cv-templates/cv-template-types";
import { cleanMarkdown } from "@/components/cv-templates/cv-template-utils";
import { sanitizeCvText } from "@/lib/jobs/cv-content-sanitizer";

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

  const identity: CvRenderData["identity"] = {};
  if (p?.fullName) identity.fullName = p.fullName;
  identity.title = input.targetJob?.title || p?.title || undefined;
  if (p?.email) identity.email = p.email;
  if (p?.phone) identity.phone = p.phone;
  if (p?.location) identity.location = p.location;
  if (p?.linkedin) identity.linkedin = p.linkedin;
  if (p?.photoUrl) identity.photoUrl = p.photoUrl;

  const summary = cleanMarkdown(
    extractSummary(input.generatedCvContent) ||
    (p?.summary || "").slice(0, 600) ||
    extractSummary(input.cvMasterText) ||
    ""
  );

  const parsedExps = parseExperiencesFromText(input.generatedCvContent);

  const rawExpsList = parsedExps || (input.experiences || []).map(e => ({
    company: e.company,
    title: e.title,
    startDate: e.startDate || "",
    endDate: e.endDate || undefined,
    description: e.description || e.responsibilities || undefined,
    location: e.location || undefined,
    bullets: [] as string[],
    achievements: safeParse(e.achievements)
  }));

  const experiences: CvExperience[] = rawExpsList.map((e) => {
    // If it's a parsed experience from the tailored text, look up the database copy to get descriptions/bullets if missing.
    let dbMatch = input.experiences?.find(db => 
      db.company.toLowerCase().replace(/[^a-z0-9]/g, "") === e.company.toLowerCase().replace(/[^a-z0-9]/g, "")
    );
    if (!dbMatch && input.experiences) {
      dbMatch = input.experiences.find(db => 
        db.company.toLowerCase().includes(e.company.toLowerCase()) || 
        e.company.toLowerCase().includes(db.company.toLowerCase())
      );
    }

    const finalDescription = e.description || dbMatch?.description || dbMatch?.responsibilities || undefined;
    const finalAchievements = e.achievements || safeParse(dbMatch?.achievements);
    
    let bullets: string[] = [];
    if (e.bullets && e.bullets.length > 0) {
      bullets = e.bullets;
    } else if (dbMatch) {
      const desc = dbMatch.description || dbMatch.responsibilities || "";
      const lines = desc.split("\n").map(l => l.trim()).filter(Boolean);
      const bulletLines = lines.filter(l => /^[•\-*]/.test(l));
      const paragraphLines = lines.filter(l => !/^[•\-*]/.test(l));
      const dbBullets = bulletLines.map(l => cleanMarkdown(l.replace(/^[•\-*]\s*/, ""))).filter(Boolean);
      
      if (dbBullets.length > 0) {
        bullets = dbBullets;
      } else if (paragraphLines.length > 0) {
        // Split paragraph by punctuation to form short, readable bullet points
        bullets = paragraphLines.join(" ").split(/[.;]\s+/).map(s => s.trim().replace(/\.$/, "")).filter(s => s.length > 5);
      }
    }

    // Limit to 4 bullets max for the first 5 experiences, and 2 bullets max for the rest (to fit on 1 page!)
    const isSummarized = ["shurgard", "brioche pasquier", "xerox"].some(c => e.company.toLowerCase().includes(c));
    const finalBullets = bullets.length > 0 ? bullets.slice(0, isSummarized ? 2 : 4) : undefined;

    return {
      company: e.company,
      title: e.title,
      startDate: e.startDate,
      endDate: e.endDate || undefined,
      location: (() => {
        let loc = e.location || dbMatch?.location || dbMatch?.country || undefined;
        if (loc) {
          loc = loc.replace(/\bfrance\b/gi, "")
                   .replace(/\bparis\b/gi, "")
                   .replace(/^[,\s]+|[,\s]+$/g, "")
                   .trim();
        }
        return loc || undefined;
      })(),
      description: finalDescription && !finalBullets ? cleanMarkdown(finalDescription).slice(0, 300) : undefined,
      bullets: finalBullets,
      achievements: finalAchievements.length > 0 ? finalAchievements.map(String) : undefined,
    };
  });

  experiences.sort((a, b) => {
    const ya = parseInt((a.startDate || "").match(/\d{4}/)?.[0] || "0", 10);
    const yb = parseInt((b.startDate || "").match(/\d{4}/)?.[0] || "0", 10);
    return yb - ya;
  });

  const skills = (input.skills || []).map((s) => s.name);

  const education: CvEducation[] = safeParse(p?.education).map((e: string) => {
    const parts = e.split(" — ");
    const degree = parts[0]?.trim();
    const school = parts[1]?.trim();
    const year = parts[2]?.trim() || undefined;
    if (school && /^\d{4}$/.test(school) && !year) return { degree, school: undefined, year: school };
    return { degree, school, year };
  }).filter((e) => e.degree);

  const rawLanguages: CvLanguage[] = parseLanguageList(p?.languages);
  const langMap = new Map<string, CvLanguage>();
  for (const lang of rawLanguages) {
    const key = normalizeLanguageKey(lang.name);
    const existing = langMap.get(key);
    if (!existing || (lang.level && !existing.level)) langMap.set(key, lang);
  }
  const languages: CvLanguage[] = Array.from(langMap.values());

  const certifications: string[] = safeParse(p?.certifications);

  const achievements: CvAchievement[] = (input.proofEntries || []).slice(0, 6).map((pr) => ({
    label: pr.category, value: pr.value, description: pr.title,
  }));

  const options = {
    includePhoto: p?.cvIncludePhoto ?? true,
    includeLinkedIn: p?.cvIncludeLinkedIn ?? false,
    accentColor: resolveAccent(p?.cvAccentColor),
  };

  return {
    identity, summary: summary || undefined, experiences, skills,
    education, languages, certifications, achievements,
    targetJob: input.targetJob,
    template: resolveTemplate(p?.cvDefaultTemplate), options,
  };
}

/* ─── Helpers ─── */

function safeParse(v: string | null | undefined): string[] {
  if (!v) return [];
  try { const arr = JSON.parse(v); return Array.isArray(arr) ? arr.filter(Boolean).map(String) : []; } catch { return []; }
}

function parseLanguageList(raw: string | null | undefined): CvLanguage[] {
  if (!raw) return [];
  let items: string[] = [];
  try { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) items = parsed.map(String); }
  catch { items = raw.split(",").map((s) => s.trim()).filter(Boolean); }
  return items.map((item) => {
    const cleaned = item.replace(/^["\s]+|["\s]+$/g, "").trim();
    const match = cleaned.match(/^(.+?)\s*[(\-–—]\s*(.+?)\s*[)\-–—]?\s*$/);
    if (match) return { name: match[1].trim(), level: match[2].trim() };
    return { name: cleaned, level: undefined };
  }).filter((l) => l.name.length > 1);
}

function normalizeLanguageKey(name: string): string {
  return name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]/g, "").trim();
}

/* ─── Experience parser ─── */

const MONTHS_RE = /(?:Janv|Févr|Fév|Mars|Avr|Mai|Juin|Juil|Août|Sept|Oct|Nov|Déc|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i;

function parseExperiencesFromText(text?: string | null): CvExperience[] | null {
  if (!text) return null;

  const expIdx = text.search(/EXPÉRIENCES? PROFESSIONNELLES?|PARCOURS PROFESSIONNEL|EXPÉRIENCE PROFESSIONNELLE/i);
  if (expIdx < 0) return null;

  const expText = text.slice(expIdx)
    .split(/\n(?:##?\s*)?(?:COMPÉTENCES|FORMATION|LANGUES|CERTIFICATIONS|POINTS DE VIGILANCE|SAVOIR[- ]FAIRE|SAVOIR[- ]ÊTRE)/i)[0];

  const lines = expText.split("\n").map(l => l.trim()).filter(Boolean);
  const exps: CvExperience[] = [];
  let cur: { title: string; company: string; startDate: string; endDate?: string; bullets: string[] } | null = null;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // Skip section headers and standalone date ranges
    if (/^EXPÉRIENCE|^PARCOURS|^COMPÉTENCES|^FORMATION|^LANGUES|^CERTIFICATIONS/i.test(line)) continue;
    if (/^\d{4}\s*[–\-—]\s*\d{4}$/.test(line)) continue;

    const isBullet = /^[•\-*✓✔]/.test(line);
    const cleanLine = isBullet ? line.replace(/^[•\-*✓✔]\s*/, "") : line;
    const hasPipe = cleanLine.includes("|");
    const hasDashSep = / — | – /.test(cleanLine);
    const hasDate = MONTHS_RE.test(cleanLine);

    // ── Is this an experience header? ──
    // "Titre | Entreprise | Date" (DeepSeek)
    // "Titre — Entreprise" (old)
    // "• Titre | Entreprise | Date" (bullet format, Expériences antérieures)
    const isExpHeading = (hasPipe || hasDashSep) && !/^(?:COMPÉTENCE|FORMATION|LANGUE|CERTIFICATION)/i.test(cleanLine);

    if (isExpHeading) {
      // Save previous experience
      if (cur && cur.title) exps.push(cur);

      let extractedStart = "";
      let extractedEnd: string | undefined = undefined;
      const dateRangeMatch = cleanLine.match(/\((\d{4})\s*[–\-—]\s*(\d{4}|Présent|Actuel|Aujourd’hui|Aujourd'hui)\)/i);
      const singleYearMatch = cleanLine.match(/\((\d{4})\)/);

      let lineToParse = cleanLine;
      if (dateRangeMatch) {
        extractedStart = dateRangeMatch[1];
        if (!/présent|actuel|aujourd/i.test(dateRangeMatch[2])) {
          extractedEnd = dateRangeMatch[2];
        }
        lineToParse = cleanLine.replace(dateRangeMatch[0], "").trim();
      } else if (singleYearMatch) {
        extractedStart = singleYearMatch[1];
        lineToParse = cleanLine.replace(singleYearMatch[0], "").trim();
      }

      if (hasPipe) {
        const parts = lineToParse.split(/\s*\|\s*/);
        cur = { title: parts[0]?.trim() || "", company: parts[1]?.trim() || "", startDate: extractedStart || "", endDate: extractedEnd, bullets: [] };
        if (parts[2] && !extractedStart) {
          const dparts = parts[2].split(/[–\-—]\s*/);
          cur.startDate = dparts[0]?.trim() || "";
          if (dparts[1] && !/présent|actuel|aujourd/i.test(dparts[1])) cur.endDate = dparts[1].trim();
        }
      } else {
        const parts = lineToParse.split(/ — | – /);
        cur = { title: parts[0]?.trim() || "", company: parts.slice(1).join(" - ").trim() || "", startDate: extractedStart || "", endDate: extractedEnd, bullets: [] };
      }
      continue;
    }

    // ── Date line below heading (old format) ──
    if (cur && !cur.startDate && hasDate && !isBullet && !hasPipe && !hasDashSep) {
      const dparts = line.split(/[–\-—]\s*/);
      cur.startDate = dparts[0]?.trim() || "";
      if (dparts[1] && !/présent|actuel|aujourd/i.test(dparts[1])) cur.endDate = dparts[1].trim();
      continue;
    }

    // ── Bullet point ──
    if (cur && isBullet && !isExpHeading) {
      cur.bullets.push(cleanLine);
      continue;
    }

    // ── Continuation text ──
    if (cur && /\w/.test(line) && !isExpHeading) {
      if (cur.bullets.length > 0) cur.bullets[cur.bullets.length - 1] += " " + line;
    }
  }

  if (cur && cur.title) exps.push(cur);
  if (exps.length === 0) return null;

  return exps.map(e => ({
    company: e.company || "Entreprise",
    title: e.title || "Poste",
    startDate: e.startDate || "",
    endDate: e.endDate || undefined,
    description: undefined,
    bullets: e.bullets?.length || 0 > 0 ? e.bullets : undefined,
    achievements: undefined,
  }));
}

/* ─── Summary extraction ─── */

function extractSummary(text?: string | null): string | null {
  if (!text) return null;
  const sanitized = sanitizeCvText(text);
  const clean = cleanMarkdown(sanitized);
  const allLines = clean.split("\n").filter((l) => l.trim().length > 0);

  // Find any known profile section header
  const summaryIdx = allLines.findIndex((l) =>
    /^(PROFIL|SYNTHÈSE|SYNTHESE|POSITIONNEMENT|PROPOSITION|LEADERSHIP|VALEUR|ATOUTS|RÉSUMÉ|RESUME)/i.test(l.trim())
  );
  if (summaryIdx >= 0 && summaryIdx < allLines.length - 1) {
    // Find the NEXT section header after the profile
    const nextSectionIdx = allLines.slice(summaryIdx + 1).findIndex((l) =>
      /^(COMPÉTENCES|EXPÉRIENCE|EXPERIENCE|SAVOIR[- ]FAIRE|SAVOIR[- ]ÊTRE|FORMATION|LANGUES|CERTIFICATIONS|PARCOURS)/i.test(l.trim())
    );
    const end = nextSectionIdx >= 0 ? summaryIdx + 1 + nextSectionIdx : allLines.length;
    const contentLines = allLines.slice(summaryIdx + 1, end)
      .filter((l) => l.trim().length > 20 && !/^[•\-*✓✔]/.test(l.trim()));
    const candidate = contentLines.join(" ").slice(0, 600);
    if (candidate && candidate.length > 80) return candidate;
  }

  // Fallback: everything before EXPÉRIENCE
  const expIdx = allLines.findIndex((l) => /^EXPÉRIENCE|EXPERIENCE/i.test(l.trim()));
  if (expIdx > 0) {
    const before = allLines.slice(0, expIdx)
      .filter((l) => l.trim().length > 25 && !/^[A-ZÀ-Ÿ\s\-]{4,}$/.test(l.trim()))
      .join(" ").slice(0, 600);
    if (before && before.length > 80) return before;
  }

  return null;
}
