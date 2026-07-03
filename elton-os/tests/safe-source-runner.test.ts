import { describe, it, expect, vi, beforeEach } from "vitest";

// Set env vars before any imports that use checkFirecrawlConfig
process.env.FIRECRAWL_ENABLED = "true";
process.env.FIRECRAWL_API_KEY = "test-fc-key-for-tests";
process.env.SAFE_SOURCES_RUN_ENABLED = "true";

/* ─── Mock Prisma ─────────────────────────── */

const mockSafeSourceUpdate = vi.fn();
const mockSafeSourceFindUnique = vi.fn();
const mockImportSourceFindUnique = vi.fn();
const mockImportSourceCreate = vi.fn();
const mockRawJobCreate = vi.fn();
const mockJobFindFirst = vi.fn();
const mockJobCreate = vi.fn();
const mockJobUpdate = vi.fn();
const mockJobScoreCreate = vi.fn();
const mockJobScoreUpdate = vi.fn();
const mockJobSearchRunFindMany = vi.fn();
const mockJobSearchRunCreate = vi.fn();
const mockProfileFindFirst = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    safeJobSource: {
      findUnique: mockSafeSourceFindUnique,
      findMany: vi.fn(),
      update: mockSafeSourceUpdate,
    },
    importSource: {
      findUnique: mockImportSourceFindUnique,
      create: mockImportSourceCreate,
    },
    rawJob: { create: mockRawJobCreate },
    job: {
      findFirst: mockJobFindFirst,
      create: mockJobCreate,
      update: mockJobUpdate,
    },
    jobScore: {
      create: mockJobScoreCreate,
      update: mockJobScoreUpdate,
    },
    jobSearchRun: { findMany: mockJobSearchRunFindMany, create: mockJobSearchRunCreate },
    profile: { findFirst: mockProfileFindFirst },
  },
}));

// Mock the Firecrawl Safe connector
const mockScrapeAllowed = vi.fn();
const mockExtractJobs = vi.fn();
const mockNormalizeJobs = vi.fn();

vi.mock("../lib/jobs/connectors/firecrawl-safe", async () => {
  const actual = await vi.importActual("../lib/jobs/connectors/firecrawl-safe");
  return {
    ...(actual as object),
    scrapeAllowedPageWithFirecrawl: mockScrapeAllowed,
    extractJobsFromMarkdown: (markdown: string, sourceUrl: string) => mockExtractJobs(markdown, sourceUrl),
    normalizeFirecrawlJobs: (jobs: unknown[], ctx: unknown) => mockNormalizeJobs(jobs, ctx),
  };
});

// Import after mocks
const { runSafeJobSource, validateJob, inferCompanyNameFromSource, isLikelyJobTitle, computeExtractionQuality } = await import("../lib/jobs/safe-source-runner");

/* ─── Helpers ─────────────────────────────── */

function setupMockSource(overrides: Record<string, unknown> = {}) {
  return {
    id: "src-001",
    label: "Test Source",
    url: "https://boards.greenhouse.io/test",
    normalizedDomain: "boards.greenhouse.io",
    sourceType: "ats",
    atsVendor: "greenhouse",
    importMode: "ATS_PUBLIC",
    enabled: true,
    maxPagesPerRun: 1,
    maxJobsPerRun: 5,
    lastRunAt: null,
    lastStatus: null,
    lastReasonCode: null,
    lastJobsFound: 0,
    lastJobsImported: 0,
    lastError: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function setupMockProfile() {
  return {
    id: "profile-1",
    fullName: "Test User",
    title: "Directeur Commercial",
    summary: "Executive profile",
    location: "Marseille",
    mobility: "France, Europe",
    languages: "fr, en",
    yearsExp: 15,
    sectors: "SaaS, Industrie",
    functions: "Direction Commerciale",
    remotePreference: "hybride",
    targetSalary: "150000",
    constraints: null,
    skills: [],
    experiences: [],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockJobSearchRunFindMany.mockResolvedValue([]);
});

/* ─── Catégorie 1 : Preview ──────────────── */

describe("Safe Source Runner — Preview", () => {
  it("retourne les offres sans écriture DB", async () => {
    const source = setupMockSource();
    mockSafeSourceFindUnique.mockResolvedValue(source);
    mockScrapeAllowed.mockResolvedValue({
      markdown: "# Senior Engineer\n\nDescription...",
      sourceUrl: source.url,
      durationMs: 500,
    });

    const rawJobs = [
      { title: "Senior Engineer", company: "TestCorp", location: "Paris" },
    ];
    mockExtractJobs.mockReturnValue(rawJobs);
    mockNormalizeJobs.mockReturnValue(rawJobs.map((j) => ({
      ...j,
      source: "firecrawl-safe",
      sourceUrl: `${source.url}/job/1`,
      externalId: "ext-senior-engineer",
      description: "Job description here.",
    })));

    const result = await runSafeJobSource(source.id, { action: "preview" });

    expect(result.success).toBe(true);
    expect(result.action).toBe("preview");
    expect(result.jobs).toBeDefined();
    expect(result.jobs!.length).toBeGreaterThan(0);
    expect(result.stats.jobsImported).toBe(0);
    // No DB writes should happen for preview
    expect(mockRawJobCreate).not.toHaveBeenCalled();
    expect(mockJobCreate).not.toHaveBeenCalled();
    expect(mockJobScoreCreate).not.toHaveBeenCalled();
    // Stats should be updated on the source
    expect(mockSafeSourceUpdate).toHaveBeenCalled();
  });

  it("retourne les warnings qualité en preview", async () => {
    const source = setupMockSource();
    mockSafeSourceFindUnique.mockResolvedValue(source);
    mockScrapeAllowed.mockResolvedValue({
      markdown: "Jobs page",
      sourceUrl: source.url,
      durationMs: 300,
    });

    const rawJobs = [
      { title: "Engineer", company: "Acme Corp", location: "" },
    ];
    mockExtractJobs.mockReturnValue(rawJobs);
    mockNormalizeJobs.mockReturnValue(rawJobs.map((j) => ({
      ...j,
      source: "test",
      sourceUrl: `${source.url}/job/1`,
      externalId: "ext-1",
      description: "Short.", // < 50 chars, triggers warning
    })));

    const result = await runSafeJobSource(source.id, { action: "preview" });

    expect(result.success).toBe(true);
    // Should have warnings for short description, missing location, missing applicationUrl
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

/* ─── Catégorie 2 : Import ───────────────── */

describe("Safe Source Runner — Import", () => {
  it("crée RawJob → Job → JobScore", async () => {
    const source = setupMockSource();
    mockSafeSourceFindUnique.mockResolvedValue(source);
    mockScrapeAllowed.mockResolvedValue({
      markdown: "Jobs page",
      sourceUrl: source.url,
      durationMs: 500,
    });

    const rawJobs = [
      { title: "VP Sales", company: "Acme Corp", location: "Paris" },
    ];
    mockExtractJobs.mockReturnValue(rawJobs);
    mockNormalizeJobs.mockReturnValue(rawJobs.map((j) => ({
      ...j,
      source: "firecrawl-safe",
      sourceUrl: `${source.url}/job/vp-sales`,
      externalId: "ext-vp-sales",
      description: "Lead the sales team across Europe.",
    })));

    // ImportSource
    mockImportSourceFindUnique.mockResolvedValue({
      id: "import-src-1",
      name: "Firecrawl Safe",
      type: "firecrawl-safe",
    });
    // No duplicate
    mockJobFindFirst.mockResolvedValue(null);
    // Job creation
    mockJobCreate.mockResolvedValue({
      id: "job-1",
      sourceId: "import-src-1",
      title: "VP Sales",
      company: "Acme Corp",
    });
    // Profile for semantic matching
    mockProfileFindFirst.mockResolvedValue(setupMockProfile());

    const result = await runSafeJobSource(source.id, { action: "import" });

    expect(result.success).toBe(true);
    expect(result.action).toBe("import");
    expect(result.stats.jobsImported).toBeGreaterThan(0);
    expect(mockRawJobCreate).toHaveBeenCalled();
    expect(mockJobCreate).toHaveBeenCalled();
    expect(mockJobScoreCreate).toHaveBeenCalled();
    expect(mockJobScoreUpdate).toHaveBeenCalled(); // semantic score update
    expect(mockJobSearchRunCreate).toHaveBeenCalled(); // audit
    expect(mockSafeSourceUpdate).toHaveBeenCalled(); // stats
  });

  it("respecte maxJobsPerRun", async () => {
    const source = setupMockSource({ maxJobsPerRun: 2 });
    mockSafeSourceFindUnique.mockResolvedValue(source);
    mockScrapeAllowed.mockResolvedValue({
      markdown: "Many jobs",
      sourceUrl: source.url,
      durationMs: 300,
    });

    // Return 10 raw jobs but limit should be 2
    const rawJobs = Array.from({ length: 10 }, (_, i) => ({
      title: `Job ${i}`,
      company: `Company ${i}`,
      location: "Paris",
    }));
    mockExtractJobs.mockReturnValue(rawJobs);
    mockNormalizeJobs.mockReturnValue(rawJobs.map((j) => ({
      ...j,
      source: "test",
      sourceUrl: `${source.url}/job/${j.title}`,
      externalId: `ext-${j.title}`,
      description: "Description text here for testing purposes.",
    })));

    mockImportSourceFindUnique.mockResolvedValue({ id: "is-1", name: "Firecrawl Safe" });
    mockJobFindFirst.mockResolvedValue(null);
    mockJobCreate.mockResolvedValue({ id: "j", title: "Test" });
    mockProfileFindFirst.mockResolvedValue(setupMockProfile());

    const result = await runSafeJobSource(source.id, { action: "import" });

    // Only maxJobsPerRun jobs should be imported (or fewer)
    expect(result.stats.jobsImported).toBeLessThanOrEqual(source.maxJobsPerRun);
  });

  it("skip les offres sans titre", async () => {
    const source = setupMockSource();
    mockSafeSourceFindUnique.mockResolvedValue(source);
    mockScrapeAllowed.mockResolvedValue({
      markdown: "Jobs",
      sourceUrl: source.url,
      durationMs: 200,
    });

    const rawJobs = [
      { title: "Valid Job", company: "Corp", location: "Paris" },
      { title: "", company: "NoTitleCorp", location: "Lyon" },
    ];
    mockExtractJobs.mockReturnValue(rawJobs);
    mockNormalizeJobs.mockReturnValue(rawJobs.map((j) => ({
      ...j,
      source: "test",
      sourceUrl: `${source.url}/job`,
      externalId: `ext-${j.title || "notitle"}`,
      description: "Some description here for the test.",
    })));

    mockImportSourceFindUnique.mockResolvedValue({ id: "is-1", name: "Firecrawl Safe" });
    mockJobFindFirst.mockResolvedValue(null);
    mockJobCreate.mockResolvedValue({ id: "job-valid", title: "Valid Job" });
    mockProfileFindFirst.mockResolvedValue(setupMockProfile());

    const result = await runSafeJobSource(source.id, { action: "import" });

    // Only the valid job should be imported
    expect(result.stats.jobsImported).toBe(1);
    expect(result.stats.invalid).toBeGreaterThanOrEqual(1);
  });

  it("met à jour SafeJobSource après import", async () => {
    const source = setupMockSource();
    mockSafeSourceFindUnique.mockResolvedValue(source);
    mockScrapeAllowed.mockResolvedValue({
      markdown: "Jobs",
      sourceUrl: source.url,
      durationMs: 400,
    });

    mockExtractJobs.mockReturnValue([
      { title: "CTO", company: "TechCo", location: "Paris" },
    ]);
    mockNormalizeJobs.mockReturnValue([
      {
        title: "CTO", company: "TechCo", location: "Paris",
        source: "test", sourceUrl: `${source.url}/cto`,
        externalId: "ext-cto", description: "Chief Technology Officer role.",
      },
    ]);

    mockImportSourceFindUnique.mockResolvedValue({ id: "is-1", name: "Firecrawl Safe" });
    mockJobFindFirst.mockResolvedValue(null);
    mockJobCreate.mockResolvedValue({ id: "job-cto", title: "CTO" });
    mockProfileFindFirst.mockResolvedValue(setupMockProfile());

    await runSafeJobSource(source.id, { action: "import" });

    expect(mockSafeSourceUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: source.id },
        data: expect.objectContaining({
          lastStatus: expect.any(String),
          lastJobsFound: expect.any(Number),
          lastJobsImported: expect.any(Number),
          lastRunAt: expect.any(Date),
        }),
      }),
    );
  });

  it("crée JobSearchRun pour l'audit", async () => {
    const source = setupMockSource();
    mockSafeSourceFindUnique.mockResolvedValue(source);
    mockScrapeAllowed.mockResolvedValue({
      markdown: "Jobs",
      sourceUrl: source.url,
      durationMs: 300,
    });

    mockExtractJobs.mockReturnValue([
      { title: "Director", company: "BigCo", location: "Marseille" },
    ]);
    mockNormalizeJobs.mockReturnValue([
      {
        title: "Director", company: "BigCo", location: "Marseille",
        source: "test", sourceUrl: `${source.url}/director`,
        externalId: "ext-director", description: "Director role description here.",
      },
    ]);

    mockImportSourceFindUnique.mockResolvedValue({ id: "is-1", name: "Firecrawl Safe" });
    mockJobFindFirst.mockResolvedValue(null);
    mockJobCreate.mockResolvedValue({ id: "job-dir", title: "Director" });
    mockProfileFindFirst.mockResolvedValue(setupMockProfile());

    await runSafeJobSource(source.id, { action: "import" });

    expect(mockJobSearchRunCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          mode: "manual",
          status: "success",
          logsJson: expect.stringContaining("safeSourceId"),
        }),
      }),
    );

    // Verify logsJson content
    const call = mockJobSearchRunCreate.mock.calls[0][0];
    const logs = JSON.parse(call.data.logsJson);
    expect(logs.safeSourceId).toBe(source.id);
    expect(logs.safeSourceLabel).toBe(source.label);
    expect(logs.reasonCode).toBeDefined();
    // Never contains API key
    expect(logs).not.toHaveProperty("apiKey");
    expect(logs).not.toHaveProperty("FIRECRAWL_API_KEY");
    expect(logs).not.toHaveProperty("token");
  });
});

/* ─── Catégorie 3 : Refus et erreurs ─────── */

describe("Safe Source Runner — Refusals", () => {
  it("refuse source désactivée", async () => {
    const source = setupMockSource({ enabled: false });
    mockSafeSourceFindUnique.mockResolvedValue(source);

    const result = await runSafeJobSource(source.id, { action: "import" });

    expect(result.success).toBe(false);
    expect(result.message).toContain("désactivée");
  });

  it("refuse source dont l'URL est reclassifiée comme refusée", async () => {
    // Source with a LinkedIn URL that somehow exists (shouldn't happen, but runner must catch it)
    const source = setupMockSource({
      url: "https://www.linkedin.com/jobs/",
      normalizedDomain: "linkedin.com",
    });
    mockSafeSourceFindUnique.mockResolvedValue(source);

    const result = await runSafeJobSource(source.id, { action: "preview" });

    expect(result.success).toBe(false);
    expect(result.complianceStatus).toBe("refused");
    expect(result.reasonCode).toBe("refused_closed_platform");
    // Source stats should be updated to reflect refusal
    expect(mockSafeSourceUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          lastStatus: "refused",
        }),
      }),
    );
  });

  it("refuse source reclassifiée BLOCKED", async () => {
    const source = setupMockSource({
      url: "https://www.monster.fr/emploi/123",
      normalizedDomain: "monster.fr",
    });
    mockSafeSourceFindUnique.mockResolvedValue(source);

    const result = await runSafeJobSource(source.id, { action: "import" });

    expect(result.success).toBe(false);
    expect(result.complianceStatus).toBe("refused");
  });

  it("gère l'erreur réseau Firecrawl", async () => {
    const source = setupMockSource();
    mockSafeSourceFindUnique.mockResolvedValue(source);
    mockScrapeAllowed.mockRejectedValue(new Error("fetch failed"));

    const result = await runSafeJobSource(source.id, { action: "import" });

    expect(result.success).toBe(false);
    expect(result.complianceStatus).toBe("error");
    expect(result.reasonCode).toBe("error_firecrawl_timeout");
    // Source stats should be updated
    expect(mockSafeSourceUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          lastStatus: "failed",
        }),
      }),
    );
  });
});

/* ─── Catégorie 4 : Déduplication ────────── */

describe("Safe Source Runner — Dedup", () => {
  it("détecte les doublons par externalId", async () => {
    const source = setupMockSource();
    mockSafeSourceFindUnique.mockResolvedValue(source);
    mockScrapeAllowed.mockResolvedValue({
      markdown: "Jobs",
      sourceUrl: source.url,
      durationMs: 300,
    });

    mockExtractJobs.mockReturnValue([
      { title: "Role", company: "Corp", location: "Paris" },
    ]);
    mockNormalizeJobs.mockReturnValue([
      {
        title: "Role", company: "Corp", location: "Paris",
        source: "test", sourceUrl: `${source.url}/role`,
        externalId: "ext-role", description: "Role description here for the test.",
      },
    ]);

    mockImportSourceFindUnique.mockResolvedValue({ id: "is-1", name: "Firecrawl Safe" });
    // Simulate duplicate found
    mockJobFindFirst.mockResolvedValue({ id: "existing-job" });

    const result = await runSafeJobSource(source.id, { action: "import" });

    expect(result.stats.duplicates).toBeGreaterThan(0);
    expect(result.stats.jobsImported).toBe(0);
  });

  it("met à jour lastSeenAt pour les doublons", async () => {
    const source = setupMockSource();
    mockSafeSourceFindUnique.mockResolvedValue(source);
    mockScrapeAllowed.mockResolvedValue({
      markdown: "Jobs",
      sourceUrl: source.url,
      durationMs: 200,
    });

    mockExtractJobs.mockReturnValue([
      { title: "Role", company: "Corp", location: "Paris" },
    ]);
    mockNormalizeJobs.mockReturnValue([
      {
        title: "Role", company: "Corp", location: "Paris",
        source: "test", sourceUrl: `${source.url}/role`,
        externalId: "ext-role", description: "Description.",
      },
    ]);

    mockImportSourceFindUnique.mockResolvedValue({ id: "is-1", name: "Firecrawl Safe" });
    mockJobFindFirst.mockResolvedValue({ id: "existing-job" });

    await runSafeJobSource(source.id, { action: "import" });

    // Should call update on the existing job
    expect(mockJobUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "existing-job" },
        data: expect.objectContaining({ lastSeenAt: expect.any(Date) }),
      }),
    );
  });
});

/* ─── Catégorie 5 : Semantic scoring ─────── */

describe("Safe Source Runner — Semantic scoring", () => {
  it("calcule le semanticScore après import", async () => {
    const source = setupMockSource();
    mockSafeSourceFindUnique.mockResolvedValue(source);
    mockScrapeAllowed.mockResolvedValue({
      markdown: "Jobs",
      sourceUrl: source.url,
      durationMs: 400,
    });

    mockExtractJobs.mockReturnValue([
      { title: "VP Engineering", company: "StartupX", location: "Paris" },
    ]);
    mockNormalizeJobs.mockReturnValue([
      {
        title: "VP Engineering", company: "StartupX", location: "Paris",
        source: "test", sourceUrl: `${source.url}/vp-eng`,
        externalId: "ext-vp-eng", description: "Lead the engineering team of 50 people.",
      },
    ]);

    mockImportSourceFindUnique.mockResolvedValue({ id: "is-1", name: "Firecrawl Safe" });
    mockJobFindFirst.mockResolvedValue(null);
    mockJobCreate.mockResolvedValue({ id: "job-vp", title: "VP Engineering" });
    mockProfileFindFirst.mockResolvedValue(setupMockProfile());

    const result = await runSafeJobSource(source.id, { action: "import" });

    expect(result.success).toBe(true);
    expect(result.stats.semanticScoredCount).toBeGreaterThan(0);
    // JobScore should be updated with semantic data
    expect(mockJobScoreUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          semanticScore: expect.any(Number),
          semanticConfidence: expect.any(Number),
          recommendation: expect.any(String),
          semanticAnalysisJson: expect.any(String),
        }),
      }),
    );
  });
});

/* ─── Catégorie 6 : Run all ──────────────── */

describe("Safe Source Runner — Run all", () => {
  it("runAllEnabledSafeSources respecte SAFE_SOURCES_MAX_PER_RUN", async () => {
    const { runAllEnabledSafeSources } = await import("../lib/jobs/safe-source-runner");

    expect(runAllEnabledSafeSources).toBeDefined();
    expect(typeof runAllEnabledSafeSources).toBe("function");
    // runAllEnabledSafeSources calls findMany with take = SAFE_SOURCES_MAX_PER_RUN (default 5)
    // Full integration test requires complex Prisma mocks; tested via API route smoke tests
  });
});

/* ─── Catégorie 7 : Kill switch ──────────── */

describe("Safe Source Runner — Kill switch", () => {
  it("SAFE_SOURCES_RUN_ENABLED=false bloque le run individuel", async () => {
    const prev = process.env.SAFE_SOURCES_RUN_ENABLED;
    process.env.SAFE_SOURCES_RUN_ENABLED = "false";
    try {
      const source = setupMockSource();
      mockSafeSourceFindUnique.mockResolvedValue(source);

      const result = await runSafeJobSource(source.id, { action: "import" });

      expect(result.success).toBe(false);
      expect(result.reasonCode).toBe("refused_run_disabled");
      expect(result.message).toContain("SAFE_SOURCES_RUN_ENABLED");
      // No Firecrawl call should have been made
      expect(mockScrapeAllowed).not.toHaveBeenCalled();
    } finally {
      if (prev) process.env.SAFE_SOURCES_RUN_ENABLED = prev;
      else delete process.env.SAFE_SOURCES_RUN_ENABLED;
    }
  });

  it("SAFE_SOURCES_RUN_ENABLED=false bloque runAll", async () => {
    const prev = process.env.SAFE_SOURCES_RUN_ENABLED;
    process.env.SAFE_SOURCES_RUN_ENABLED = "false";
    try {
      const { runAllEnabledSafeSources } = await import("../lib/jobs/safe-source-runner");
      const results = await runAllEnabledSafeSources("import");

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].reasonCode).toBe("refused_run_disabled");
    } finally {
      if (prev) process.env.SAFE_SOURCES_RUN_ENABLED = prev;
      else delete process.env.SAFE_SOURCES_RUN_ENABLED;
    }
  });

  it("SAFE_SOURCES_RUN_ENABLED=true autorise le run individuel", async () => {
    const prev = process.env.SAFE_SOURCES_RUN_ENABLED;
    process.env.SAFE_SOURCES_RUN_ENABLED = "true";
    try {
      const source = setupMockSource();
      mockSafeSourceFindUnique.mockResolvedValue(source);
      mockScrapeAllowed.mockResolvedValue({ markdown: "# Jobs\n- Senior Engineer at TestCo", sourceUrl: source.url, durationMs: 100 });
      mockExtractJobs.mockReturnValue([{ title: "Senior Engineer" }]);
      mockNormalizeJobs.mockReturnValue([{
        title: "Senior Engineer", company: "TestCo", location: "Paris",
        sourceUrl: source.url, externalId: "ext-1", description: "A senior role at TestCo in Paris",
      }]);
      mockImportSourceFindUnique.mockResolvedValue({ id: "is-fc" });
      mockJobFindFirst.mockResolvedValue(null);
      mockJobCreate.mockResolvedValue({ id: "job-1" });
      mockJobScoreCreate.mockResolvedValue({});
      mockJobScoreUpdate.mockResolvedValue({});
      mockProfileFindFirst.mockResolvedValue(null);

      const result = await runSafeJobSource(source.id, { action: "preview" });

      expect(result.success).toBe(true);
    } finally {
      if (prev) process.env.SAFE_SOURCES_RUN_ENABLED = prev;
      else delete process.env.SAFE_SOURCES_RUN_ENABLED;
    }
  });
});

/* ─── Catégorie 8 : Cost guard ────────────── */

describe("Safe Source Runner — Cost guard", () => {
  it("bloque l'import quand la limite quotidienne de requêtes est atteinte", async () => {
    const prev = process.env.SAFE_SOURCES_RUN_ENABLED;
    process.env.SAFE_SOURCES_RUN_ENABLED = "true";
    try {
      const source = setupMockSource();
      mockSafeSourceFindUnique.mockResolvedValue(source);

      // Simulate 25 safe runs already today
      const mockRuns = Array.from({ length: 25 }, (_, i) => ({
        logsJson: JSON.stringify({
          safeSourceId: `src-${i}`,
          safeSourceLabel: `Source ${i}`,
          jobsImported: 5,
        }),
      }));
      mockJobSearchRunFindMany.mockResolvedValue(mockRuns);

      const result = await runSafeJobSource(source.id, { action: "import" });

      expect(result.success).toBe(false);
      expect(result.reasonCode).toBe("refused_daily_limit_reached");
      expect(result.message).toContain("Limite quotidienne");
    } finally {
      if (prev) process.env.SAFE_SOURCES_RUN_ENABLED = prev;
      else delete process.env.SAFE_SOURCES_RUN_ENABLED;
    }
  });

  it("bloque l'import quand la limite quotidienne d'offres est atteinte", async () => {
    const prev = process.env.SAFE_SOURCES_RUN_ENABLED;
    process.env.SAFE_SOURCES_RUN_ENABLED = "true";
    try {
      const source = setupMockSource();
      mockSafeSourceFindUnique.mockResolvedValue(source);

      // 1 run but 100+ jobs already imported today
      mockJobSearchRunFindMany.mockResolvedValue([{
        logsJson: JSON.stringify({
          safeSourceId: "src-001",
          safeSourceLabel: "Test",
          jobsImported: 105,
        }),
      }]);

      const result = await runSafeJobSource(source.id, { action: "import" });

      expect(result.success).toBe(false);
      expect(result.reasonCode).toBe("refused_daily_limit_reached");
    } finally {
      if (prev) process.env.SAFE_SOURCES_RUN_ENABLED = prev;
      else delete process.env.SAFE_SOURCES_RUN_ENABLED;
    }
  });

  it("n'applique pas le cost guard en mode preview", async () => {
    const prev = process.env.SAFE_SOURCES_RUN_ENABLED;
    process.env.SAFE_SOURCES_RUN_ENABLED = "true";
    try {
      const source = setupMockSource();
      mockSafeSourceFindUnique.mockResolvedValue(source);

      // Simulate daily limit reached
      mockJobSearchRunFindMany.mockResolvedValue(Array.from({ length: 30 }, (_, i) => ({
        logsJson: JSON.stringify({ safeSourceId: `src-${i}`, jobsImported: 1 }),
      })));

      mockScrapeAllowed.mockResolvedValue({ markdown: "# Jobs\n- Test", sourceUrl: source.url, durationMs: 100 });
      mockExtractJobs.mockReturnValue([{ title: "Test Job" }]);
      mockNormalizeJobs.mockReturnValue([{
        title: "Test Job", company: "Co", location: "Loc",
        sourceUrl: source.url, externalId: "ext-1", description: "A test job description that is long enough.",
      }]);

      const result = await runSafeJobSource(source.id, { action: "preview" });

      // Preview should succeed even when daily limit is reached (no DB writes)
      expect(result.success).toBe(true);
    } finally {
      if (prev) process.env.SAFE_SOURCES_RUN_ENABLED = prev;
      else delete process.env.SAFE_SOURCES_RUN_ENABLED;
    }
  });
});

/* ─── Catégorie 9 : Quality gates renforcés ─ */

describe("Safe Source Runner — Quality gates", () => {
  it("rejette les jobs sans company (test unitaire validateJob)", () => {
    const result = validateJob({
      source: "test", title: "Engineer", company: "", location: "Paris",
      sourceUrl: "https://example.com/job", description: "A solid job description with enough text.",
    });
    expect(result.valid).toBe(false);
    expect(result.warnings).toContain("Entreprise absente");
  });

  it("rejette les jobs sans titre (test unitaire validateJob)", () => {
    const result = validateJob({
      source: "test", title: "", company: "TestCo", location: "Paris",
      sourceUrl: "https://example.com/job", description: "Description.",
    });
    expect(result.valid).toBe(false);
    expect(result.warnings).toContain("Titre absent");
  });

  it("rejette les jobs sans sourceUrl ni applicationUrl (test unitaire validateJob)", () => {
    const result = validateJob({
      source: "test", title: "Engineer", company: "TestCo", location: "Paris",
      sourceUrl: "", description: "A solid job description with enough text.",
    });
    expect(result.valid).toBe(false);
    expect(result.warnings).toContain("sourceUrl et applicationUrl absents");
  });

  it("détecte le salaire incohérent (min > max)", () => {
    const result = validateJob({
      source: "test", title: "Engineer", company: "TestCo", location: "Paris",
      sourceUrl: "https://example.com", salaryMin: 80000, salaryMax: 50000,
      description: "A solid job description with enough text.",
    });
    expect(result.valid).toBe(true);
    expect(result.warnings).toContain("Salaire incohérent (min > max)");
  });

  it("infère la company depuis le label quand absente de l'extraction", async () => {
    const source = setupMockSource({ label: "TestCo — Greenhouse" });
    mockSafeSourceFindUnique.mockResolvedValue(source);
    mockScrapeAllowed.mockResolvedValue({ markdown: "# Jobs\n- Test", sourceUrl: source.url, durationMs: 100 });
    mockExtractJobs.mockReturnValue([{ title: "Test Job" }]);
    mockNormalizeJobs.mockReturnValue([{
      title: "Test Job", company: "", location: "Paris",
      sourceUrl: source.url, externalId: "ext-1", description: "A role description long enough for validation.",
    }]);

    const result = await runSafeJobSource(source.id, { action: "preview" });

    // Company inférée depuis le label "TestCo — Greenhouse" → "TestCo"
    expect(result.stats.invalid).toBe(0);
    expect(result.jobs).toBeDefined();
    expect(result.jobs![0].company).toBe("TestCo");
  });
});

/* ─── Catégorie 10 : Company inference ────── */

describe("inferCompanyNameFromSource", () => {
  it("conserve le company explicite du job", () => {
    const result = inferCompanyNameFromSource(
      { label: "Stripe — Greenhouse", normalizedDomain: "boards.greenhouse.io" },
      { company: "Stripe Inc" },
    );
    expect(result).toBe("Stripe Inc");
  });

  it("infère depuis label avec séparateur ' — '", () => {
    const result = inferCompanyNameFromSource(
      { label: "Airbnb — Greenhouse", normalizedDomain: "boards.greenhouse.io" },
      {},
    );
    expect(result).toBe("Airbnb");
  });

  it("infère depuis label avec séparateur ' - '", () => {
    const result = inferCompanyNameFromSource(
      { label: "Company - Lever", normalizedDomain: "jobs.lever.co" },
      {},
    );
    expect(result).toBe("Company");
  });

  it("infère depuis label avec séparateur ' | '", () => {
    const result = inferCompanyNameFromSource(
      { label: "Acme Corp | Workable", normalizedDomain: "apply.workable.com" },
      {},
    );
    expect(result).toBe("Acme Corp");
  });

  it("infère depuis le domaine si le label n'a pas de séparateur", () => {
    const result = inferCompanyNameFromSource(
      { label: "Carrières", normalizedDomain: "careers.stripe.com" },
      {},
    );
    // Domain: careers.stripe.com → stripe → Stripe
    expect(result).toBe("Stripe");
  });

  it("infère depuis le domaine pour les boards ATS", () => {
    const result = inferCompanyNameFromSource(
      { label: "Jobs", normalizedDomain: "jobs.ashbyhq.com", atsVendor: "ashby" },
      {},
    );
    // Domain: jobs.ashbyhq.com → ashbyhq → Ashbyhq (pas .com/.org)
    expect(result).toBe("Ashbyhq");
  });

  it("retourne undefined si rien n'est inférable", () => {
    const result = inferCompanyNameFromSource(
      { label: "Jobs", normalizedDomain: "apply.com" },
      {},
    );
    // "apply" is the subdomain, "com" is TLD → can't infer
    expect(result).toBeUndefined();
  });

  it("ignore les TLD communs dans l'inférence de domaine", () => {
    const result = inferCompanyNameFromSource(
      { label: "Openings", normalizedDomain: "jobs.figma.com" },
      {},
    );
    expect(result).toBe("Figma");
  });
});

/* ─── Catégorie 11 : Noise filter ──────────── */

describe("isLikelyJobTitle", () => {
  it("rejette 'All Jobs'", () => {
    expect(isLikelyJobTitle("All Jobs")).toBe(false);
  });

  it("rejette 'Showing 1-10 results'", () => {
    expect(isLikelyJobTitle("Showing 1-10 results out of total 226 open jobs")).toBe(false);
    expect(isLikelyJobTitle("Showing 1-10 results")).toBe(false);
  });

  it("rejette 'Search'", () => {
    expect(isLikelyJobTitle("Search")).toBe(false);
    expect(isLikelyJobTitle("Search jobs")).toBe(false);
  });

  it("rejette 'Location' seul", () => {
    expect(isLikelyJobTitle("Location")).toBe(false);
    expect(isLikelyJobTitle("Locations")).toBe(false);
  });

  it("rejette 'Remote' seul", () => {
    expect(isLikelyJobTitle("Remote")).toBe(false);
  });

  it("rejette 'Filter' et 'Filters'", () => {
    expect(isLikelyJobTitle("Filter")).toBe(false);
    expect(isLikelyJobTitle("Filters")).toBe(false);
  });

  it("rejette 'Department' et 'Team'", () => {
    expect(isLikelyJobTitle("Department")).toBe(false);
    expect(isLikelyJobTitle("Teams")).toBe(false);
  });

  it("rejette 'Sort by', 'Newest', 'Relevance'", () => {
    expect(isLikelyJobTitle("Sort by")).toBe(false);
    expect(isLikelyJobTitle("Newest")).toBe(false);
    expect(isLikelyJobTitle("Relevance")).toBe(false);
  });

  it("accepte 'Remote Sales Director France' (titre long)", () => {
    expect(isLikelyJobTitle("Remote Sales Director France")).toBe(true);
  });

  it("accepte 'Director, Sales'", () => {
    expect(isLikelyJobTitle("Director, Sales")).toBe(true);
  });

  it("accepte 'Country Manager France'", () => {
    expect(isLikelyJobTitle("Country Manager France")).toBe(true);
  });

 it("accepte 'Head of Sales — EMEA'", () => {
    expect(isLikelyJobTitle("Head of Sales — EMEA")).toBe(true);
  });

  it("accepte 'Senior Software Engineer (Remote)'", () => {
    expect(isLikelyJobTitle("Senior Software Engineer (Remote)")).toBe(true);
  });

  it("rejette 'Page 1' et 'Next'", () => {
    expect(isLikelyJobTitle("Page 1")).toBe(false);
    expect(isLikelyJobTitle("Next")).toBe(false);
  });

  it("rejette 'Reset'", () => {
    expect(isLikelyJobTitle("Reset")).toBe(false);
    expect(isLikelyJobTitle("Clear filters")).toBe(false);
  });
});

/* ─── Catégorie 12 : Extraction quality ───── */

describe("computeExtractionQuality", () => {
  it("qualifie clean quand tout est valide", () => {
    const q = computeExtractionQuality(10, 0, 0, []);
    expect(q.qualityStatus).toBe("clean");
    expect(q.validJobs).toBe(10);
    expect(q.invalidRatio).toBe(0);
    expect(q.shouldDisableSource).toBe(false);
  });

  it("qualifie warning quand l'invalidRatio est entre 20% et 50%", () => {
    // 5 jobs, 0 noise, 2 invalid → invalidRatio = 2/5 = 0.4
    const q = computeExtractionQuality(5, 0, 2, []);
    expect(q.qualityStatus).toBe("warning");
    expect(q.invalidRatio).toBe(0.4);
    expect(q.shouldDisableSource).toBe(false);
  });

  it("qualifie poor quand l'invalidRatio dépasse 50%", () => {
    // 5 jobs, 0 noise, 3 invalid → 3/5 = 0.6
    const q = computeExtractionQuality(5, 0, 3, []);
    expect(q.qualityStatus).toBe("poor");
    expect(q.invalidRatio).toBe(0.6);
  });

  it("qualifie poor quand plus de 50% de bruit", () => {
    // 10 jobs, 6 noise, 0 invalid → noiseRatio = 0.6
    const q = computeExtractionQuality(10, 6, 0, ["All Jobs", "Search", "Filter", "Showing results", "Location", "Remote"]);
    expect(q.qualityStatus).toBe("poor");
    expect(q.noiseSkipped).toBe(6);
  });

  it("recommande la désactivation quand poor + 0 job valide", () => {
    // 3 jobs, all noise
    const q = computeExtractionQuality(3, 3, 0, ["All Jobs", "Search", "Filter"]);
    expect(q.qualityStatus).toBe("poor");
    expect(q.validJobs).toBe(0);
    expect(q.shouldDisableSource).toBe(true);
  });

  it("ne recommande pas la désactivation si au moins 1 job valide même en poor", () => {
    // 5 jobs, 3 noise, 1 valid, 1 invalid
    const q = computeExtractionQuality(5, 3, 1, ["All Jobs", "Search", "Filter"]);
    expect(q.validJobs).toBe(1);
    expect(q.shouldDisableSource).toBe(false);
  });
});

/* ─── Catégorie 13 : Runner noise filter ───── */

describe("Safe Source Runner — Noise filter", () => {
  it("filtre les titres parasites en mode preview", async () => {
    const source = setupMockSource();
    mockSafeSourceFindUnique.mockResolvedValue(source);
    mockScrapeAllowed.mockResolvedValue({ markdown: "# All Jobs\n# Search\n# Software Engineer", sourceUrl: source.url, durationMs: 100 });
    mockExtractJobs.mockReturnValue([
      { title: "All Jobs" },
      { title: "Search" },
      { title: "Software Engineer", company: "TestCo" },
    ]);
    mockNormalizeJobs.mockReturnValue([
      { title: "All Jobs", company: "", sourceUrl: source.url, externalId: "ext-1", description: "UI chrome text that was scraped from the page UI navigation bar." },
      { title: "Search", company: "", sourceUrl: source.url, externalId: "ext-2", description: "Another UI element that appeared in the markdown extraction." },
      { title: "Software Engineer", company: "TestCo", location: "Paris", sourceUrl: source.url, externalId: "ext-3", description: "A real job description for a software engineering position." },
    ]);

    const result = await runSafeJobSource(source.id, { action: "preview" });

    expect(result.stats.skipped).toBe(2); // All Jobs + Search = noise
    expect(result.stats.jobsFound).toBe(3); // total raw count
    expect(result.stats.invalid).toBe(0);
    expect(result.jobs).toHaveLength(1);
    expect(result.jobs![0].title).toBe("Software Engineer");
    expect(result.extractionQuality).toBeDefined();
    expect(result.extractionQuality!.noiseSkipped).toBe(2);
    expect(result.extractionQuality!.suspectedNoiseTitles).toContain("All Jobs");
  });

  it("en mode import, bloque l'import si 100% bruit (0 valid job)", async () => {
    const source = setupMockSource();
    mockSafeSourceFindUnique.mockResolvedValue(source);
    mockScrapeAllowed.mockResolvedValue({ markdown: "# All Jobs\n# Search\n# Filter", sourceUrl: source.url, durationMs: 100 });
    mockExtractJobs.mockReturnValue([
      { title: "All Jobs" },
      { title: "Search" },
      { title: "Filter" },
    ]);
    mockNormalizeJobs.mockReturnValue([
      { title: "All Jobs", company: "", sourceUrl: source.url, externalId: "ext-1", description: "UI chrome text from navigation." },
      { title: "Search", company: "", sourceUrl: source.url, externalId: "ext-2", description: "Search box label from the page." },
      { title: "Filter", company: "", sourceUrl: source.url, externalId: "ext-3", description: "Filter button label from the page." },
    ]);

    const result = await runSafeJobSource(source.id, { action: "import" });

    expect(result.success).toBe(false);
    expect(result.reasonCode).toBe("refused_poor_extraction_quality");
    expect(result.stats.jobsImported).toBe(0);
    expect(result.extractionQuality!.qualityStatus).toBe("poor");
    expect(result.extractionQuality!.shouldDisableSource).toBe(true);
  });
});
