import { describe, it, expect, vi, beforeEach } from "vitest";

/* ─── Mock Prisma ─────────────────────────── */

const mockSafeSourceFindMany = vi.fn();
const mockJobFindMany = vi.fn();
const mockImportSourceFindUnique = vi.fn();
const mockJobSearchRunFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    safeJobSource: { findMany: mockSafeSourceFindMany },
    job: { findMany: mockJobFindMany },
    importSource: { findUnique: mockImportSourceFindUnique },
    jobSearchRun: { findMany: mockJobSearchRunFindMany },
  },
}));

const { generateSafeSourceDailyReport } = await import("../lib/jobs/safe-source-report");

/* ─── Helpers ─────────────────────────────── */

function mockEmpty() {
  mockSafeSourceFindMany.mockResolvedValue([]);
  mockJobSearchRunFindMany.mockResolvedValue([]);
  mockImportSourceFindUnique.mockResolvedValue(null);
  mockJobFindMany.mockResolvedValue([]);
}

function mockSource(overrides: Record<string, unknown> = {}) {
  return {
    id: overrides.id || "src-001",
    label: overrides.label || "Test Source",
    url: "https://boards.greenhouse.io/test",
    normalizedDomain: "boards.greenhouse.io",
    sourceType: "ats",
    atsVendor: "greenhouse",
    importMode: "ATS_PUBLIC",
    enabled: true,
    maxPagesPerRun: 1,
    maxJobsPerRun: 20,
    lastRunAt: overrides.lastRunAt ?? new Date(),
    lastStatus: overrides.lastStatus ?? null,
    lastReasonCode: overrides.lastReasonCode ?? null,
    lastJobsFound: overrides.lastJobsFound ?? 0,
    lastJobsImported: overrides.lastJobsImported ?? 0,
    lastError: overrides.lastError ?? null,
    consecutiveErrors: overrides.consecutiveErrors ?? 0,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockEmpty();
});

/* ─── Catégorie 1 : Rapport vide ── */

describe("Safe Source Daily Report — empty state", () => {
  it("retourne un rapport vide quand aucune source n'a run", async () => {
    const report = await generateSafeSourceDailyReport();
    expect(report.sourcesRun).toBe(0);
    expect(report.jobsFound).toBe(0);
    expect(report.jobsImported).toBe(0);
    expect(report.topImported).toEqual([]);
    expect(report.sourcesInError).toEqual([]);
  });

  it("retourne un rapport vide quand aucune source n'a run récemment", async () => {
    const oldDate = new Date(Date.now() - 48 * 60 * 60 * 1000);
    mockSafeSourceFindMany.mockResolvedValue([
      mockSource({ lastRunAt: oldDate, lastJobsFound: 10, lastJobsImported: 5 }),
    ]);
    const report = await generateSafeSourceDailyReport();
    expect(report.sourcesRun).toBe(0);
    expect(report.jobsFound).toBe(0);
  });
});

/* ─── Catégorie 2 : Comptage stats ── */

describe("Safe Source Daily Report — stats counting", () => {
  it("compte les jobsFound/imported des sources run récemment", async () => {
    mockSafeSourceFindMany.mockResolvedValue([
      mockSource({ lastRunAt: new Date(), lastJobsFound: 20, lastJobsImported: 15 }),
      mockSource({ id: "src-002", label: "Source 2", lastRunAt: new Date(), lastJobsFound: 10, lastJobsImported: 8 }),
    ]);
    const report = await generateSafeSourceDailyReport();
    expect(report.sourcesRun).toBe(2);
    expect(report.jobsFound).toBe(30);
    expect(report.jobsImported).toBe(23);
  });

  it("compte les doublons et anomalies depuis les logs JobSearchRun", async () => {
    mockJobSearchRunFindMany.mockResolvedValue([
      {
        logsJson: JSON.stringify({
          safeSourceId: "src-001",
          safeSourceLabel: "Test",
          duplicates: 3,
          skipped: 1,
          invalid: 2,
          semanticScoredCount: 15,
        }),
      },
    ]);
    const report = await generateSafeSourceDailyReport();
    expect(report.duplicates).toBe(3);
    expect(report.skipped).toBe(1);
    expect(report.invalid).toBe(2);
    expect(report.semanticScoredCount).toBe(15);
  });

  it("ignore les logs JobSearchRun qui ne sont pas Safe Sources", async () => {
    mockJobSearchRunFindMany.mockResolvedValue([
      {
        logsJson: JSON.stringify({
          connector: "linkedin",
          jobsFound: 5,
        }),
      },
    ]);
    const report = await generateSafeSourceDailyReport();
    expect(report.semanticScoredCount).toBe(0);
  });
});

/* ─── Catégorie 3 : Sources en erreur ── */

describe("Safe Source Daily Report — sources in error", () => {
  it("liste les sources en statut failed avec consecutiveErrors", async () => {
    mockSafeSourceFindMany.mockResolvedValue([
      mockSource({
        lastStatus: "failed",
        lastError: "Timeout Firecrawl",
        lastReasonCode: "error_firecrawl_timeout",
        consecutiveErrors: 2,
      }),
      mockSource({
        id: "src-002",
        label: "Refused Source",
        lastStatus: "refused",
        lastError: "Plateforme fermée",
        lastReasonCode: "refused_closed_platform",
        consecutiveErrors: 1,
      }),
    ]);
    const report = await generateSafeSourceDailyReport();
    expect(report.errors).toBe(2);
    expect(report.sourcesInError).toHaveLength(2);
    expect(report.sourcesInError[0].consecutiveErrors).toBe(2);
    expect(report.sourcesInError[1].label).toBe("Refused Source");
  });
});

/* ─── Catégorie 4 : Top importés ── */

describe("Safe Source Daily Report — top imported jobs", () => {
  it("inclut le top 10 offres avec scores sémantiques", async () => {
    mockImportSourceFindUnique.mockResolvedValue({ id: "is-firecrawl" });
    mockJobFindMany.mockResolvedValue([
      {
        id: "job-1", title: "Country Manager France", company: "Stripe",
        location: "Paris", locationPriority: 1,
        createdAt: new Date(),
        score: {
          globalScore: 85, semanticScore: 92, recommendation: "apply_now",
        },
      },
      {
        id: "job-2", title: "Sales Director EMEA", company: "Airbnb",
        location: "Londres", locationPriority: 4,
        createdAt: new Date(),
        score: {
          globalScore: 78, semanticScore: 88, recommendation: "apply_now",
        },
      },
    ]);
    const report = await generateSafeSourceDailyReport();
    expect(report.topImported).toHaveLength(2);
    expect(report.topImported[0].title).toBe("Country Manager France");
    expect(report.topImported[0].semanticScore).toBe(92);
    expect(report.topImported[1].semanticScore).toBe(88);
  });

  it("trie par score sémantique décroissant", async () => {
    mockImportSourceFindUnique.mockResolvedValue({ id: "is-fc" });
    mockJobFindMany.mockResolvedValue([
      { id: "a", score: { semanticScore: 60, globalScore: null, recommendation: null }, title: "A", company: "C1", location: "L1", locationPriority: null, createdAt: new Date() },
      { id: "b", score: { semanticScore: 90, globalScore: null, recommendation: null }, title: "B", company: "C2", location: "L2", locationPriority: null, createdAt: new Date() },
      { id: "c", score: { semanticScore: 75, globalScore: null, recommendation: null }, title: "C", company: "C3", location: "L3", locationPriority: null, createdAt: new Date() },
    ]);
    const report = await generateSafeSourceDailyReport();
    expect(report.topImported[0].semanticScore).toBe(90);
    expect(report.topImported[1].semanticScore).toBe(75);
    expect(report.topImported[2].semanticScore).toBe(60);
  });

  it("limite à 10 offres max", async () => {
    mockImportSourceFindUnique.mockResolvedValue({ id: "is-fc" });
    const jobs = Array.from({ length: 15 }, (_, i) => ({
      id: `job-${i}`,
      title: `Job ${i}`,
      company: "Co",
      location: "Loc",
      locationPriority: null,
      createdAt: new Date(),
      score: { semanticScore: 100 - i, globalScore: null, recommendation: null },
    }));
    mockJobFindMany.mockResolvedValue(jobs);
    const report = await generateSafeSourceDailyReport();
    expect(report.topImported).toHaveLength(10);
  });

  it("fonctionne quand aucun score n'est présent", async () => {
    mockImportSourceFindUnique.mockResolvedValue({ id: "is-fc" });
    mockJobFindMany.mockResolvedValue([
      { id: "x", title: "X", company: "Co", location: "Loc", locationPriority: null, createdAt: new Date(), score: null },
    ]);
    const report = await generateSafeSourceDailyReport();
    expect(report.topImported).toHaveLength(0);
  });
});

/* ─── Catégorie 5 : Refus par motif ── */

describe("Safe Source Daily Report — refusal summary", () => {
  it("agrège les refus par reasonCode", async () => {
    mockSafeSourceFindMany.mockResolvedValue([
      mockSource({ id: "s1", label: "S1", lastStatus: "refused", lastReasonCode: "refused_closed_platform" }),
      mockSource({ id: "s2", label: "S2", lastStatus: "refused", lastReasonCode: "refused_closed_platform" }),
      mockSource({ id: "s3", label: "S3", lastStatus: "refused", lastReasonCode: "refused_login_required" }),
    ]);
    const report = await generateSafeSourceDailyReport();
    expect(report.refusalSummary).toHaveLength(2);
    const platform = report.refusalSummary.find((r) => r.reasonCode === "refused_closed_platform");
    expect(platform?.count).toBe(2);
  });
});

/* ─── Catégorie 6 : Période ── */

describe("Safe Source Daily Report — period", () => {
  it("couvre les 24 dernières heures", async () => {
    const report = await generateSafeSourceDailyReport();
    const from = new Date(report.period.from);
    const to = new Date(report.period.to);
    const diffMs = to.getTime() - from.getTime();
    expect(diffMs).toBe(24 * 60 * 60 * 1000);
  });
});

/* ─── Catégorie 7 : Mixed statuses ───────── */

describe("Safe Source Daily Report — mixed statuses", () => {
  it("gère un mélange de sources avec et sans erreurs", async () => {
    const now = new Date();
    const sources = [
      { id: "src-ok", label: "OK Source", enabled: true, consecutiveErrors: 0, lastStatus: "success", lastJobsFound: 10, lastJobsImported: 8, lastError: null, lastRunAt: now, normalizedDomain: "boards.greenhouse.io", url: "https://boards.greenhouse.io/test", sourceType: "ats", atsVendor: "greenhouse", importMode: "ATS_PUBLIC", maxPagesPerRun: 1, maxJobsPerRun: 20, lastReasonCode: null, notes: null, createdAt: new Date(), updatedAt: new Date() },
      { id: "src-err", label: "Error Source", enabled: true, consecutiveErrors: 4, lastStatus: "error", lastJobsFound: 5, lastJobsImported: 0, lastError: "Scrape timeout", lastRunAt: now, normalizedDomain: "jobs.lever.co", url: "https://jobs.lever.co/test", sourceType: "ats", atsVendor: "lever", importMode: "ATS_PUBLIC", maxPagesPerRun: 1, maxJobsPerRun: 20, lastReasonCode: "error_firecrawl_timeout", notes: null, createdAt: new Date(), updatedAt: new Date() },
      { id: "src-warn", label: "Warn Source", enabled: true, consecutiveErrors: 1, lastStatus: "success", lastJobsFound: 3, lastJobsImported: 2, lastError: "2 warnings qualité", lastRunAt: now, normalizedDomain: "jobs.ashbyhq.com", url: "https://jobs.ashbyhq.com/test", sourceType: "ats", atsVendor: "ashby", importMode: "ATS_PUBLIC", maxPagesPerRun: 1, maxJobsPerRun: 20, lastReasonCode: null, notes: null, createdAt: new Date(), updatedAt: new Date() },
    ];
    mockSafeSourceFindMany.mockResolvedValue(sources);
    mockJobFindMany.mockResolvedValue([]);
    mockJobSearchRunFindMany.mockResolvedValue([]);

    const report = await generateSafeSourceDailyReport();

    // Error Source and Warn Source both have lastError — they appear in sourcesInError
    expect(report.sourcesInError.length).toBeGreaterThanOrEqual(1);
    const errSource = report.sourcesInError.find((s: { label: string }) => s.label === "Error Source");
    expect(errSource).toBeDefined();
    expect(errSource!.consecutiveErrors).toBe(4);
    // Jobs found sums across recently-run sources
    expect(report.jobsFound).toBe(18); // 10 + 5 + 3
  });

  it("rapporte 0 quand aucune source n'a tourné récemment", async () => {
    const seedSources = Array.from({ length: 15 }, (_, i) => ({
      id: `seed-${i}`,
      label: `Seed Source ${i}`,
      enabled: false,
      consecutiveErrors: 0,
      lastStatus: null,
      lastRunAt: null,
      lastError: null,
      lastJobsFound: 0,
      lastJobsImported: 0,
      lastReasonCode: null,
      normalizedDomain: `domain-${i}.com`,
      url: `https://domain-${i}.com/careers`,
      sourceType: "careers",
      atsVendor: null,
      importMode: "AUTO_PUBLIC_CAREERS",
      maxPagesPerRun: 2,
      maxJobsPerRun: 20,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    mockSafeSourceFindMany.mockResolvedValue(seedSources);
    mockJobFindMany.mockResolvedValue([]);
    mockJobSearchRunFindMany.mockResolvedValue([]);

    const report = await generateSafeSourceDailyReport();

    // No sources have run in last 24h
    expect(report.sourcesRun).toBe(0);
    expect(report.jobsFound).toBe(0);
    expect(report.jobsImported).toBe(0);
    expect(report.sourcesInError).toHaveLength(0);
  });
});
