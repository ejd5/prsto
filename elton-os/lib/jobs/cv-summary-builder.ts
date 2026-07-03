/**
 * CV Summary Builder
 */

export interface SummaryInput {
  candidateName: string;
  candidateTitle: string;
  candidateSummary?: string;
  yearsExp?: number | null;
  jobTitle: string;
  jobCompany?: string;
  jobSector?: string;
  skills: string[];
  topProofs?: string[];
  confirmedMatches?: string[];
  managementScope?: string;
  revenueScope?: string;
  internationalScope?: string;
}

const SECTION_TITLES: Record<string, string[]> = {
  "Directeur Commercial": ["Profil de direction commerciale", "Proposition de valeur exécutive", "Synthèse de candidature"],
  "Country Manager": ["Profil de leadership marché", "Vision & leadership", "Positionnement"],
  "Sales Director": ["Direction commerciale orientée performance", "Leadership sales & croissance", "Profil sales & développement"],
  "Head of Sales": ["Leadership sales & croissance", "Profil de direction commerciale", "Synthèse de candidature"],
  "Directeur Général": ["Profil de direction générale", "Vision stratégique & leadership", "Positionnement exécutif"],
  "VP Sales": ["Direction commerciale orientée performance", "Leadership sales & croissance", "Profil sales leadership"],
  "Business Development": ["Profil développement & croissance", "Proposition de valeur", "Positionnement business"],
};

const DEFAULT_TITLES = ["Synthèse de candidature", "Proposition de valeur exécutive", "Positionnement", "Profil stratégique"];

export function chooseSummarySectionTitle(jobTitle: string): string {
  const lower = jobTitle.toLowerCase();
  for (const [role, titles] of Object.entries(SECTION_TITLES)) {
    if (lower.includes(role.toLowerCase())) return titles[0];
  }
  if (lower.includes("directeur") || lower.includes("directrice")) return "Profil de direction exécutive";
  if (lower.includes("manager") || lower.includes("lead") || lower.includes("head")) return "Synthèse de candidature";
  if (lower.includes("vp") || lower.includes("vice")) return "Profil exécutif";
  return DEFAULT_TITLES[0];
}

export function buildExecutiveSummary(input: SummaryInput): string {
  const parts: string[] = [];
  const yearStr = input.yearsExp ? `${input.yearsExp} ans d'expérience` : "une expérience confirmée";
  const orientation = input.candidateTitle?.toLowerCase().includes("commercial") ? " croissance" :
    input.candidateTitle?.toLowerCase().includes("direction") ? " stratégie et performance" : " résultats";
  parts.push(`${input.candidateTitle || "Cadre dirigeant"} orienté${orientation}, avec ${yearStr}`);
  const scopes = [input.managementScope, input.revenueScope, input.internationalScope].filter(Boolean);
  if (scopes.length > 0) parts.push(`dans le ${scopes.join(", ")}`);
  const topSkills = input.skills.slice(0, 3);
  if (topSkills.length > 0) parts.push(`compétences : ${topSkills.join(", ")}`);
  parts.push(`pour le poste de ${input.jobTitle}${input.jobCompany ? ` chez ${input.jobCompany}` : ""}`);
  if (input.topProofs?.length) parts.push(`résultats : ${input.topProofs.slice(0, 2).join(", ")}`);
  if (input.confirmedMatches?.length) parts.push(`adéquation : ${input.confirmedMatches.slice(0, 3).join(", ")}`);
  parts.push("disponible pour contribuer à vos objectifs.");
  return parts.join(". ").replace(/\.\./g, ".") + ".";
}

export function isContaminatedSummary(summary: string): boolean {
  if (!summary) return true;
  const headerPatterns = ["expérience professionnelle", "parcours professionnel", "savoir-faire", "savoir-être"];
  for (const line of summary.split("\n")) {
    const trimmed = line.trim();
    if (/^[A-ZÀ-Ÿ\s\-]{4,}$/.test(trimmed) && trimmed.length >= 8) {
      const tLower = trimmed.toLowerCase();
      if (headerPatterns.some((p) => tLower.includes(p))) return true;
    }
  }
  return false;
}

export function sanitizeExecutiveSummary(summary: string): string {
  if (!summary) return "";
  const lines = summary.split("\n").filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) return true;
    if (/^[A-ZÀ-Ÿ\s\-]{3,}$/.test(trimmed) && trimmed.length < 50) return false;
    return true;
  });
  return lines.join("\n").replace(/\*{2}/g, "").replace(/_{2,}/g, "").replace(/[-]{3,}/g, "").replace(/^(résumé|resume|profil|summary)\s*/i, "").trim();
}
