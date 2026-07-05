import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import { prisma } from "@/lib/prisma";
import { cleanMarkdown } from "@/components/cv-templates/cv-template-utils";

export type CvTemplateId = "ats_classic" | "modern_executive" | "premium_leadership" | "executive_bordeaux" | "strategic_blue" | "minimal_luxe";
export type CvPdfGenerator = (data: PremiumCvData) => Promise<Uint8Array>;

export function getCvPdfGenerator(templateId: string): { generator: CvPdfGenerator; templateUsed: string } {
  const t = templateId.replace(/-/g, "_").toLowerCase();
  switch (t) {
    case "ats_classic":
      return { generator: generateAtsClassicPdf, templateUsed: "ats-classique" };
    case "modern_executive":
      return { generator: generateModernExecutivePdf, templateUsed: "moderne-executif" };
    case "premium_leadership":
      return { generator: generateModernExecutivePdf, templateUsed: "premium-leadership" };
    default:
      return { generator: generateModernExecutivePdf, templateUsed: "premium-leadership" };
  }
}

export interface PremiumCvData {
  fullName: string;
  title: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  summary?: string;
  experiences: { title: string; company: string; startDate: string; endDate?: string; description?: string }[];
  skills: string[];
  languages: string[];
  education: string[];
  certifications: string[];
  targetJob?: { title?: string; company?: string };
}

/**
 * Clean JSON arrays from education/languages data.
 */
function parseJsonArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch { /* not JSON */ }
  return [];
}

/**
 * Format education string: clean JSON brackets, parse "School - Degree (year)" format.
 */
function formatEducation(raw: string): string {
  // Remove JSON array brackets
  let s = raw.replace(/^\["|"\]$|^\[|^\"|\"$/g, "").replace(/",\s*"/g, " — ");
  // Clean any remaining JSON artifacts
  s = s.replace(/["\[\]]/g, "").trim();
  return s;
}

/**
 * Format language entry: keep level if present, otherwise add "à préciser".
 */
function formatLanguage(raw: string): string {
  if (/\(|—|–|fluent|courant|natif|professionnel|intermédiaire|notions/i.test(raw)) return raw;
  return raw + " (à préciser)";
}

/**
 * Deduplicate skills.
 */
function dedupSkills(skills: string[]): string[] {
  const seen = new Set<string>();
  return skills.filter((s) => {
    const key = s.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 15);
}

export async function extractPremiumCvData(draftId: string, forceMaster = false): Promise<PremiumCvData> {
  const draft = await prisma.applicationDraft.findUnique({
    where: { id: draftId },
    include: { job: { select: { title: true, company: true } } },
  });
  if (!draft) throw new Error("Draft introuvable");

  const profile = await prisma.profile.findFirst({
    where: { id: draft.candidateProfileId || undefined },
    include: { skills: true, experiences: { orderBy: { startDate: "desc" }, take: 10 } },
  });

  const raw = forceMaster ? "" : (draft.tailoredResumeContent || "");

  let parsedJson: any = null;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    // not JSON
  }

  const fullName = parsedJson?.identity?.fullName || profile?.fullName || "";
  const title = parsedJson?.identity?.title || profile?.title || "";

  // Extract summary
  let summary = "";
  if (parsedJson?.summary) {
    summary = parsedJson.summary;
  } else {
    const clean = sanitizeCvText(raw);
    const lines = clean.split("\n").filter((l) => l.trim().length > 0);
    const sectionIdx = lines.findIndex((l) =>
      /PROFIL|SYNTHÈSE|POSITIONNEMENT|RÉSUMÉ|RESUME|LEADERSHIP|VALEUR/i.test(l.trim())
    );
    if (sectionIdx >= 0 && sectionIdx < lines.length - 1) {
      const contentLines = lines.slice(sectionIdx + 1).filter((l) => l.trim().length > 20 && !/^EXPÉRIENCE|EXPERIENCE|SAVOIR-FAIRE|SAVOIR-ÊTRE/i.test(l));
      summary = contentLines.slice(0, 5).join(" ").slice(0, 600);
    }
    if (!summary && profile?.summary) summary = profile.summary;
  }

  let experiences: { title: string; company: string; startDate: string; endDate?: string; description?: string }[] = [];
  if (parsedJson?.experiences && Array.isArray(parsedJson.experiences)) {
    experiences = parsedJson.experiences.map((e: any) => {
      let desc = e.description || "";
      if (e.bullets && Array.isArray(e.bullets) && e.bullets.length > 0) {
        desc += (desc ? "\n" : "") + e.bullets.map((b: string) => `• ${b}`).join("\n");
      } else if (e.achievements && Array.isArray(e.achievements) && e.achievements.length > 0) {
        desc += (desc ? "\n" : "") + e.achievements.map((b: string) => `• ${b}`).join("\n");
      }
      return {
        title: e.title || "",
        company: e.company || "",
        startDate: e.startDate || "",
        endDate: e.endDate || undefined,
        description: desc || undefined,
      };
    });
  } else {
    // Try to parse markdown experiences
    let parsedMarkdownExps: any[] | null = null;
    const expIdx = raw.search(/EXPÉRIENCES? PROFESSIONNELLES?|EXPERIENCE|PARCOURS/i);
    if (expIdx !== -1) {
      const expText = raw.slice(expIdx).split(/\n(?:## )?(?:COMPÉTENCES|FORMATION|LANGUES|CERTIFICATIONS)/i)[0];
      const lines = expText.split("\n").map((l: string) => l.trim()).filter(Boolean);
      const exps: any[] = [];
      let currentExp: any = null;
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        
        // Match Markdown heading: "### Titre — Entreprise"
        const mdMatch = line.match(/^###\s+(.*)$/);
        // Or old format: "Titre — Entreprise" without year, or with year
        const isHeading = mdMatch || (line.match(/ — | \- | – /) && !line.match(/^[•\-*]/) && !line.match(/^(?:Janvier|Février|Mars|Avril|Mai|Juin|Juillet|Août|Septembre|Octobre|Novembre|Décembre|January|February|March|April|May|June|July|August|September|October|November|December)?\s*\d{4}/i));

        if (isHeading) {
          if (currentExp) exps.push(currentExp);
          let titleLine = mdMatch ? mdMatch[1] : line;
          const parts = titleLine.split(/ — | \- | – /);
          
          currentExp = {
            title: parts[0]?.trim() || "",
            company: parts.slice(1).join(" - ").trim() || "",
            startDate: "",
            endDate: undefined,
            bullets: []
          };
        } else if (currentExp && !currentExp.startDate && line.match(/\d{4}/) && !line.match(/^[•\-*]/)) {
          // This is the date line below the heading
          const dates = line.split(/ à | au | to | - | – /i);
          currentExp.startDate = dates[0]?.trim() || "";
          currentExp.endDate = dates[1]?.trim() && !/présent|aujourd'hui|now/i.test(dates[1]) ? dates[1].trim() : undefined;
        } else if (currentExp && line.match(/^[•\-*]/)) {
          currentExp.bullets.push(line.replace(/^[•\-*]\s*/, ""));
        } else if (currentExp && !line.match(/^[•\-*]/) && currentExp.startDate) {
          // Multiline bullet or description
          if (currentExp.bullets.length > 0) {
            currentExp.bullets[currentExp.bullets.length - 1] += " " + line;
          } else {
            currentExp.bullets.push(line);
          }
        }
      }
      if (currentExp) exps.push(currentExp);
      if (exps.length > 0) {
        parsedMarkdownExps = exps.map(e => ({
          company: e.company || "Entreprise",
          title: e.title || "Poste",
          startDate: e.startDate || "",
          endDate: e.endDate,
          description: e.bullets.length > 0 ? e.bullets.map((b: string) => `• ${b}`).join("\n") : undefined
        }));
      }
    }
    
    if (parsedMarkdownExps && parsedMarkdownExps.length > 0) {
      experiences = parsedMarkdownExps;
    } else {
      experiences = (profile?.experiences || []).map((e) => ({
        title: e.title || "",
        company: e.company || "",
        startDate: e.startDate || "",
        endDate: e.endDate || undefined,
        description: e.description || undefined,
      }));
    }
  }

  let skills: string[] = [];
  if (parsedJson?.skills && Array.isArray(parsedJson.skills)) {
    skills = dedupSkills(parsedJson.skills);
  } else {
    skills = dedupSkills((profile?.skills || []).map((s) => s.name));
  }

  // Languages — parse JSON, format with levels
  let languages: string[] = [];
  if (parsedJson?.languages && Array.isArray(parsedJson.languages)) {
    languages = parsedJson.languages.map((l: any) => l.name + (l.level ? ` (${l.level})` : ""));
  } else {
    const langRaw = profile?.languages || "";
    const langParsed = parseJsonArray(langRaw);
    languages = langParsed.length > 0
      ? langParsed.map(formatLanguage)
      : [];
  }

  // Education — parse JSON, clean format
  let education: string[] = [];
  if (parsedJson?.education && Array.isArray(parsedJson.education)) {
    education = parsedJson.education.map((edu: any) => edu.degree + (edu.school ? ` — ${edu.school}` : "") + (edu.year ? ` (${edu.year})` : ""));
  } else {
    const eduRaw = profile?.education || "";
    const eduParsed = parseJsonArray(eduRaw);
    education = eduParsed.length > 0
      ? eduParsed.map(formatEducation)
      : eduRaw.split(/[,\n;]/).map((s) => s.trim()).filter(Boolean);
  }

  // Certifications
  let certifications: string[] = [];
  if (parsedJson?.certifications && Array.isArray(parsedJson.certifications)) {
    certifications = parsedJson.certifications;
  } else {
    const certsRaw = profile?.certifications || "";
    const certsParsed = parseJsonArray(certsRaw);
    certifications = certsParsed.length > 0
      ? certsParsed
      : certsRaw.split(/[,\n;]/).map((s) => s.trim()).filter(Boolean);
  }

  return {
    fullName,
    title,
    email: profile?.email || undefined,
    phone: profile?.phone || undefined,
    location: profile?.location || undefined,
    linkedin: profile?.linkedin || undefined,
    summary: cleanMarkdown(summary),
    experiences,
    skills,
    languages,
    education,
    certifications,
    targetJob: draft.job ? { title: draft.job.title, company: draft.job.company || undefined } : undefined,
  };
}

/**
 * Internal sanitizer for the PDF data pipeline (avoids circular deps).
 */
function sanitizeCvText(text: string): string {
  return text
    .replace(/POSTE TERMINÉ|POSTE ACTIF|sendableToAI|semanticScore|reasonCode/gi, "")
    .replace(/\(POSTE TERMINÉ\)/gi, "")
    .replace(/\(POSTE ACTIF\)/gi, "")
    .replace(/\["(.*?)"\]/g, "$1")
    .replace(/ {2,}/g, " ")
    .trim();
}

/* ─── ATS Classic PDF Generator ─── */
const ATS_COL = (r: number, g: number, b: number) => rgb(r/255, g/255, b/255);
const ATS_BLACK = ATS_COL(26, 26, 46);
const ATS_GRAY = ATS_COL(100, 100, 100);
const ATS_MARGIN = 60;

export async function generateAtsClassicPdf(data: PremiumCvData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Courier);
  const fontBold = await doc.embedFont(StandardFonts.CourierBold);
  const pageW = 595, pageH = 842;
  let page = doc.addPage([pageW, pageH]);
  let y = pageH - 50;

  const tb = (text: string, size = 10, col = ATS_BLACK) => { if (!text) return; page.drawText(text, { x: ATS_MARGIN, y, size, font, color: col }); y -= size + 4; };
  const tbB = (text: string, size = 12, col = ATS_BLACK) => { page.drawText(text, { x: ATS_MARGIN, y, size, font: fontBold, color: col }); y -= size + 4; };

  tbB(data.fullName || "", 14); tb(data.title || "", 10, ATS_GRAY);
  const contact = [data.email, data.phone, data.location].filter(Boolean).join(" | ");
  if (contact) tb(contact, 8, ATS_GRAY);
  y -= 10;

  if (data.summary) { tbB("PROFIL"); tb(data.summary, 9); y -= 8; }
  if (data.experiences.length > 0) { tbB("EXPERIENCES PROFESSIONNELLES"); y -= 4; }
  for (const exp of data.experiences) {
    if (y < 80) { page = doc.addPage([pageW, pageH]); y = pageH - 50; }
    tbB(exp.title + " - " + exp.company, 10); tb(exp.startDate + " - " + (exp.endDate || "present"), 8, ATS_GRAY);
    if (exp.description) { exp.description.split("\n").filter(Boolean).forEach(l => tb(l.trim(), 8)); }
    y -= 6;
  }
  if (data.skills.length > 0) { tbB("COMPETENCES"); tb(data.skills.slice(0, 12).join(", "), 8); y -= 6; }
  if (data.languages.length > 0) { tbB("LANGUES"); tb(data.languages.join(", "), 8); }
  if (data.education.length > 0) { tbB("FORMATION"); data.education.slice(0, 4).forEach(e => tb(e, 8)); }
  if (data.certifications.length > 0) { tbB("CERTIFICATIONS"); data.certifications.slice(0, 4).forEach(c => tb(c, 8)); }
  return doc.save();
}

/* ─── Modern Executive PDF Generator ─── */
const ME_NAVY = ATS_COL(27, 50, 74);
const ME_WHITE = rgb(1, 1, 1);
const ME_DARK = ATS_COL(25, 25, 25);
const ME_GRAY2 = ATS_COL(110, 110, 110);
const ME_GOLD = ATS_COL(200, 166, 78);
const ME_SIDEBAR_W = 170;
const ME_CX = ME_SIDEBAR_W + 30;

export async function generateModernExecutivePdf(data: PremiumCvData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontObl = await doc.embedFont(StandardFonts.HelveticaOblique);
  const pageW = 595, pageH = 842;
  let page = doc.addPage([pageW, pageH]);
  page.drawRectangle({ x: 0, y: 0, width: ME_SIDEBAR_W, height: pageH, color: ME_NAVY });

  let y = pageH - 60;
  const tb = (text: string, x: number, size = 9, col = ME_DARK, f = font) => { page.drawText(text || "", { x, y, size, font: f, color: col }); y -= size + 4; };

  // Sidebar
  page.drawText(data.fullName || "", { x: 18, y, size: 14, font: fontBold, color: ME_WHITE }); y -= 18;
  page.drawText(data.title || "", { x: 18, y, size: 10, font: fontObl, color: ME_GOLD }); y -= 22;
  [data.email, data.phone, data.location].filter(Boolean).forEach(c => { page.drawText(c!, { x: 18, y, size: 8, font, color: ME_WHITE }); y -= 13; });
  y -= 16;
  if (data.skills.length > 0) {
    page.drawText("COMPETENCES", { x: 18, y, size: 9, font: fontBold, color: ME_GOLD }); y -= 16;
    data.skills.slice(0, 10).forEach(s => { page.drawText("> " + s, { x: 18, y, size: 8, font, color: ME_WHITE }); y -= 12; });
    y -= 10;
  }
  if (data.languages.length > 0) {
    page.drawText("LANGUES", { x: 18, y, size: 9, font: fontBold, color: ME_GOLD }); y -= 16;
    data.languages.slice(0, 5).forEach(l => { page.drawText(l, { x: 18, y, size: 8, font, color: ME_WHITE }); y -= 12; });
  }

  // Main content
  y = pageH - 60;
  if (data.summary) { tb(data.summary, ME_CX, 9, ME_DARK, fontObl); y -= 8; }
  if (data.experiences.length > 0) { tb("EXPERIENCES PROFESSIONNELLES", ME_CX, 10, ME_NAVY, fontBold); y -= 6; }
  for (const exp of data.experiences) {
    if (y < 80) { page = doc.addPage([pageW, pageH]); y = pageH - 50; page.drawRectangle({ x: 0, y: 0, width: ME_SIDEBAR_W, height: pageH, color: ME_NAVY }); }
    tb(exp.title + " - " + exp.company, ME_CX, 10, ME_DARK, fontBold);
    tb(exp.startDate + " - " + (exp.endDate || "present"), ME_CX, 8, ME_GRAY2);
    if (exp.description) { exp.description.split("\n").filter(Boolean).forEach(l => tb(l.trim(), ME_CX, 8)); }
    y -= 6;
  }
  if (data.education.length > 0) { tb("FORMATION", ME_CX, 10, ME_NAVY, fontBold); data.education.slice(0, 4).forEach(e => tb(e, ME_CX, 8)); }
  if (data.certifications.length > 0) { tb("CERTIFICATIONS", ME_CX, 10, ME_NAVY, fontBold); data.certifications.slice(0, 4).forEach(c => tb(c, ME_CX, 8)); }
  return doc.save();
}
