import type { CvRenderData, CvExperience } from "./cv-template-types";

export function formatDateRange(exp: CvExperience): string {
  if (!exp.startDate && !exp.endDate) return "";
  const start = formatDate(exp.startDate || "");
  const end = exp.endDate ? formatDate(exp.endDate) : "Présent";
  if (!start) return end;
  return `${start} — ${end}`;
}

function formatDate(d: string): string {
  if (!d) return "";
  const trimmed = d.trim();
  
  // Try to parse YYYY-MM
  const clean = trimmed.replace(/[^0-9\-]/g, "");
  if (/^\d{4}-\d{2}$/.test(clean)) {
    const [y, m] = clean.split("-");
    return `${m}/${y}`;
  }
  
  // Parse textual dates (e.g. Sept. 2025, Fév. 2026, etc.)
  const monthsMap: Record<string, string> = {
    janv: "01", jan: "01",
    fevr: "02", fév: "02", feb: "02",
    mars: "03", mar: "03",
    avr: "04", apr: "04",
    mai: "05", may: "05",
    juin: "06", jun: "06",
    juil: "07", jul: "07",
    aout: "08", aoû: "08", aug: "08",
    sept: "09", sep: "09",
    oct: "10",
    nov: "11",
    dec: "12", déc: "12"
  };

  const norm = trimmed.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const yearMatch = norm.match(/\b\d{4}\b/);
  if (yearMatch) {
    const y = yearMatch[0];
    for (const [key, val] of Object.entries(monthsMap)) {
      if (norm.includes(key)) {
        return `${val}/${y}`;
      }
    }
    return y; // fallback if no month is parsed but year is found
  }
  
  return trimmed;
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

/**
 * Vérifie si un texte contient un mot-clé ATS de l'offre ciblée.
 * Retourne la liste des keywords trouvés dans le texte.
 */
export function findAtsKeywordsInText(text: string, data: CvRenderData): string[] {
  if (!data.targetJob?.atsKeywords?.length || !text) return [];
  const norm = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return data.targetJob.atsKeywords.filter(kw => {
    const normKw = kw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return norm.includes(normKw);
  });
}

/**
 * Retourne un label de poste ciblé pour affichage discret dans le header.
 * Ex: "Candidature : Directeur Commercial — ACME Corp"
 */
export function getTargetJobLabel(data: CvRenderData): string | null {
  if (!data.targetJob?.title || !data.targetJob?.company) return null;
  return `${data.targetJob.title} — ${data.targetJob.company}`;
}

/**
 * Retourne true si le CV est adapté à une offre spécifique.
 */
export function isAdapted(data: CvRenderData): boolean {
  return !!data.adaptationMeta?.adaptedForOfferId;
}

