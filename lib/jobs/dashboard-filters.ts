/**
 * Dashboard Filters
 * Pure functions for computing dashboard counts and filtering job lists.
 */

export interface DashboardJob {
  id: string; title: string; company: string | null; location: string | null;
  locationPriority: number | null; status: string; sourceUrl: string | null;
  firstSeenAt: string; publishedAt: string | null;
  source: { name: string; type: string | null };
  score: {
    globalScore: number | null; semanticScore: number | null; recommendation: string | null;
    semanticConfidence: number | null; reasonsJson: string | null; redFlagsJson: string | null;
    executiveScore: number | null; locationScore: number | null; recommendedAction: string | null;
  } | null;
  draft?: { id: string } | null;
}

export interface DashboardCounts {
  total: number;
  newCount: number;
  topCount: number;
  needsApplicationCount: number;
  pacaCount: number;
  idfCount: number;
  recommendedCount: number;
  savedCount: number;
  archivedCount: number;
}

function isJobNew(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const diffHours = (Date.now() - new Date(dateStr).getTime()) / 3600000;
  return diffHours < 48;
}

function isJobTop(job: DashboardJob): boolean {
  const s = job.score?.semanticScore ?? job.score?.globalScore;
  return (typeof s === "number" && s >= 75) || job.score?.recommendation === "highly_recommended";
}

export function computeDashboardCounts(allJobs: DashboardJob[]): DashboardCounts {
  return {
    total: allJobs.length,
    newCount: allJobs.filter((j) => isJobNew(j.publishedAt || j.firstSeenAt)).length,
    topCount: allJobs.filter(isJobTop).length,
    needsApplicationCount: allJobs.filter((j) => !j.draft?.id).length,
    pacaCount: allJobs.filter((j) => j.locationPriority === 1).length,
    idfCount: allJobs.filter((j) => j.locationPriority === 2).length,
    recommendedCount: allJobs.filter((j) => j.score?.recommendation === "recommended").length,
    savedCount: allJobs.filter((j) => j.status === "shortlisted").length,
    archivedCount: allJobs.filter((j) => j.status === "archived").length,
  };
}

export function applyJobsFilter(jobs: DashboardJob[], filterKey: string): DashboardJob[] {
  switch (filterKey) {
    case "all": return jobs;
    case "new": return jobs.filter((j) => isJobNew(j.publishedAt || j.firstSeenAt));
    case "highly_rec": return jobs.filter(isJobTop);
    case "recommended": return jobs.filter((j) => j.score?.recommendation === "recommended" || isJobTop(j));
    case "paca": return jobs.filter((j) => j.locationPriority === 1);
    case "idf": return jobs.filter((j) => j.locationPriority === 2);
    case "score65": return jobs.filter((j) => { const s = j.score?.semanticScore ?? j.score?.globalScore; return typeof s === "number" && s >= 65; });
    case "needs_application": return jobs.filter((j) => !j.draft?.id);
    case "shortlist": return jobs.filter((j) => j.status === "shortlisted");
    case "archived": return jobs.filter((j) => j.status === "archived");
    default: return jobs;
  }
}

export function getFilterLabel(filterKey: string): string {
  const labels: Record<string, string> = {
    all: "Toutes les offres", new: "Offres récentes", highly_rec: "Offres très pertinentes",
    recommended: "Offres recommandées", paca: "Offres en PACA", idf: "Offres en Île-de-France",
    score65: "Score 65+", needs_application: "Candidatures à préparer",
    shortlist: "Offres enregistrées", archived: "Offres archivées",
  };
  return labels[filterKey] || filterKey;
}

export const VALID_FILTERS = [
  "all", "new", "highly_rec", "recommended", "paca", "idf",
  "score65", "needs_application", "shortlist", "archived",
];
