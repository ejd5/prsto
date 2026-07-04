import { describe, it, expect } from "vitest";
import { computeDashboardCounts, applyJobsFilter, VALID_FILTERS } from "@/lib/jobs/dashboard-filters";
import type { DashboardJob } from "@/lib/jobs/dashboard-filters";

function makeJob(overrides: Partial<DashboardJob> = {}): DashboardJob {
  return {
    id: "test", title: "Test", company: "Corp", location: "Paris",
    locationPriority: null, status: "new", sourceUrl: null,
    firstSeenAt: new Date().toISOString(), publishedAt: null,
    source: { name: "LinkedIn" },
    score: { globalScore: 70, semanticScore: 70, recommendation: "recommended", semanticConfidence: 80 },
    ...overrides,
  };
}

describe("computeDashboardCounts", () => {
  it("counts total jobs correctly", () => {
    expect(computeDashboardCounts([makeJob({ id: "1" }), makeJob({ id: "2" })]).total).toBe(2);
  });

  it("counts top jobs correctly", () => {
    const jobs = [
      makeJob({ id: "1", score: { globalScore: 80, semanticScore: 75, recommendation: "highly_recommended", semanticConfidence: 85 } }),
      makeJob({ id: "2", score: { globalScore: 50, semanticScore: 40, recommendation: "possible", semanticConfidence: 60 } }),
    ];
    expect(computeDashboardCounts(jobs).topCount).toBe(1);
  });

  it("counts new jobs based on publishedAt", () => {
    const recent = new Date(Date.now() - 12 * 3600000);
    const old = new Date(Date.now() - 72 * 3600000);
    const jobs = [
      makeJob({ id: "1", publishedAt: recent.toISOString() }),
      makeJob({ id: "2", publishedAt: old.toISOString() }),
    ];
    expect(computeDashboardCounts(jobs).newCount).toBe(1);
  });

  it("counts needs application jobs (no draft)", () => {
    const jobs = [makeJob({ id: "1" }), makeJob({ id: "2", draft: { id: "d" } })];
    expect(computeDashboardCounts(jobs).needsApplicationCount).toBe(1);
  });
});

describe("applyJobsFilter", () => {
  const recent = new Date(Date.now() - 12 * 3600000);
  const old = new Date(Date.now() - 72 * 3600000);

  const jobs = [
    makeJob({ id: "1", publishedAt: recent.toISOString(), score: { globalScore: 85, semanticScore: 80, recommendation: "highly_recommended", semanticConfidence: 90 }, locationPriority: 1 }),
    makeJob({ id: "2", publishedAt: old.toISOString(), firstSeenAt: old.toISOString(), score: { globalScore: 60, semanticScore: 55, recommendation: "possible", semanticConfidence: 70 }, locationPriority: 2 }),
    makeJob({ id: "3", publishedAt: old.toISOString(), firstSeenAt: old.toISOString(), score: { globalScore: 40, semanticScore: 35, recommendation: "low_priority", semanticConfidence: 50 }, draft: { id: "d-1" } }),
  ];

  it("filter 'all' returns all jobs", () => {
    expect(applyJobsFilter(jobs, "all")).toHaveLength(3);
  });

  it("filter 'new' returns only recent jobs", () => {
    expect(applyJobsFilter(jobs, "new")).toHaveLength(1);
  });

  it("filter 'highly_rec' returns only top jobs", () => {
    expect(applyJobsFilter(jobs, "highly_rec")).toHaveLength(1);
  });

  it("filter 'needs_application' returns only jobs without drafts", () => {
    expect(applyJobsFilter(jobs, "needs_application")).toHaveLength(2);
  });

  it("filter 'paca' returns only PACA jobs", () => {
    expect(applyJobsFilter(jobs, "paca")).toHaveLength(1);
  });

  it("filter 'idf' returns only IDF jobs", () => {
    expect(applyJobsFilter(jobs, "idf")).toHaveLength(1);
  });
});

describe("VALID_FILTERS", () => {
  it("includes all expected filter keys", () => {
    expect(VALID_FILTERS).toContain("all");
    expect(VALID_FILTERS).toContain("new");
    expect(VALID_FILTERS).toContain("highly_rec");
    expect(VALID_FILTERS).toContain("needs_application");
  });
});
