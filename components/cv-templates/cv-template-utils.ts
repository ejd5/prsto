import type { CvRenderData, CvExperience } from "./cv-template-types";

export function formatDateRange(exp: CvExperience): string {
  const start = formatDate(exp.startDate || "");
  const end = exp.endDate ? formatDate(exp.endDate) : "Présent";
  if (!start) return end;
  return `${start} — ${end}`;
}

function formatDate(d: string): string {
  if (!d) return "";
  const clean = d.replace(/[^0-9\-]/g, "").trim();
  if (clean.length >= 7) {
    const [y, m] = clean.split("-");
    const months = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
    const mi = parseInt(m || "1") - 1;
    if (mi >= 0 && mi < 12) return `${months[mi]} ${y}`;
    return clean;
  }
  return clean;
}

export function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^#{1,3}\s/gm, "")
    .replace(/^---+$/gm, "")
    .replace(/^- /gm, "• ")
    .replace(/\[(Adresse|Téléphone|Telephone|Email|LinkedIn|Linkedin|Ville|Code Postal|Date|Nom|Prénom|Prenom)\]/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function extractBullets(desc: string): string[] {
  if (!desc) return [];
  const lines = desc.split(/\n/).filter((l) => l.trim().length > 5);
  return lines.map((l) => cleanMarkdown(l.replace(/^[•\-]\s*/, ""))).filter(Boolean).slice(0, 5);
}

export function hasContent(data: CvRenderData): boolean {
  return !!(
    data.identity.fullName ||
    data.experiences.length > 0 ||
    data.skills.length > 0
  );
}

export function accentHex(data: CvRenderData): string {
  const ACCENT_MAP: Record<string, string> = {
    champagne: "#C8A64E",
    navy: "#1B2A4A",
    graphite: "#2D3748",
    burgundy: "#722F37",
    emerald: "#1A4731",
  };
  return ACCENT_MAP[data.options.accentColor] || "#C8A64E";
}

export function accentBg(data: CvRenderData, opacity = 0.08): string {
  const hex = accentHex(data);
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}

export function showPhoto(data: CvRenderData): boolean {
  return data.options.includePhoto && !!data.identity.photoUrl;
}

export function showLinkedIn(data: CvRenderData): boolean {
  return data.options.includeLinkedIn && !!data.identity.linkedin;
}
