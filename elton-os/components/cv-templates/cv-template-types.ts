export type CvTemplateId =
  | "ats_classic"
  | "modern_executive"
  | "premium_leadership"
  | "executive_bordeaux"
  | "strategic_blue"
  | "minimal_luxe";
export type CvAccentColor = "champagne" | "navy" | "graphite" | "burgundy" | "emerald";

export const TEMPLATE_LABELS: Record<CvTemplateId, string> = {
  ats_classic: "ATS Classique",
  modern_executive: "Moderne Exécutif",
  premium_leadership: "Premium Leadership",
  executive_bordeaux: "Executive Bordeaux",
  strategic_blue: "Strategic Blue",
  minimal_luxe: "Minimal Luxe",
};

export const TEMPLATE_BADGES: Record<CvTemplateId, { label: string; preview: string }> = {
  ats_classic: { label: "ATS", preview: "#6366f1" },
  modern_executive: { label: "Premium", preview: "#2D3748" },
  premium_leadership: { label: "Premium", preview: "#C8A64E" },
  executive_bordeaux: { label: "Executive", preview: "#5A1E2B" },
  strategic_blue: { label: "Business", preview: "#17324D" },
  minimal_luxe: { label: "Premium", preview: "#111111" },
};

export const ACCENT_COLORS: Record<CvAccentColor, { label: string; hex: string }> = {
  champagne: { label: "Champagne", hex: "#C8A64E" },
  navy: { label: "Bleu nuit", hex: "#1B2A4A" },
  graphite: { label: "Graphite", hex: "#2D3748" },
  burgundy: { label: "Bordeaux", hex: "#722F37" },
  emerald: { label: "Vert exécutif", hex: "#1A4731" },
};

export function resolveAccent(accent?: string | null): CvAccentColor {
  const valid: CvAccentColor[] = ["champagne", "navy", "graphite", "burgundy", "emerald"];
  return valid.includes(accent as CvAccentColor) ? (accent as CvAccentColor) : "champagne";
}

export function resolveTemplate(template?: string | null): CvTemplateId {
  const valid: CvTemplateId[] = ["ats_classic", "modern_executive", "premium_leadership", "executive_bordeaux", "strategic_blue", "minimal_luxe"];
  return valid.includes(template as CvTemplateId) ? (template as CvTemplateId) : "premium_leadership";
}

export interface CvRenderData {
  identity: {
    fullName?: string;
    title?: string;
    email?: string;
    phone?: string;
    address?: string;
    location?: string;
    linkedin?: string;
    photoUrl?: string;
  };
  summary?: string;
  experiences: CvExperience[];
  skills: string[];
  education: CvEducation[];
  languages: CvLanguage[];
  certifications: string[];
  achievements: CvAchievement[];
  targetJob?: {
    title?: string;
    company?: string;
    sector?: string;
    atsKeywords?: string[];
    matchScore?: number;
  };
  adaptationMeta?: {
    adaptedForOfferId: string;
    adaptationMode: "ai" | "template";
    summaryWasAdapted: boolean;
    experiencesReordered: boolean;
    skillsFiltered: boolean;
  };
  template: CvTemplateId;
  options: CvRenderOptions;
}

export interface CvExperience {
  company: string;
  title: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  country?: string;
  description?: string;
  bullets?: string[];
  achievements?: string[];
}

export interface CvEducation {
  degree?: string;
  school?: string;
  year?: string;
  description?: string;
}

export interface CvLanguage {
  name: string;
  level?: string;
}

export interface CvAchievement {
  label: string;
  value?: string;
  description?: string;
}

export interface CvRenderOptions {
  includePhoto: boolean;
  includeLinkedIn: boolean;
  accentColor: CvAccentColor;
}
