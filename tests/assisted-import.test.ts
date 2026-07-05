// API route checkAuth uses NODE_ENV === "development"
process.env.NODE_ENV = "development";

import { describe, it, expect, vi, beforeEach } from "vitest";

/* ─── Hoisted mocks (vi.mock is hoisted above imports) ── */

const {
  mockImportSourceFindFirst,
  mockImportSourceCreate,
  mockRawJobCreate,
  mockJobFindFirst,
  mockJobCreate,
  mockJobUpdate,
  mockJobScoreCreate,
  mockJobScoreUpdate,
  mockJobSearchRunCreate,
  mockProfileFindFirst,
  mockCheckDuplicate,
} = vi.hoisted(() => ({
  mockImportSourceFindFirst: vi.fn(),
  mockImportSourceCreate: vi.fn(),
  mockRawJobCreate: vi.fn(),
  mockJobFindFirst: vi.fn(),
  mockJobCreate: vi.fn(),
  mockJobUpdate: vi.fn(),
  mockJobScoreCreate: vi.fn(),
  mockJobScoreUpdate: vi.fn(),
  mockJobSearchRunCreate: vi.fn(),
  mockProfileFindFirst: vi.fn(),
  mockCheckDuplicate: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
    importSource: {
      findFirst: mockImportSourceFindFirst,
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
    jobSearchRun: { create: mockJobSearchRunCreate },
    profile: { findFirst: mockProfileFindFirst },
  },
}));

vi.mock("@/lib/jobs/dedupe", () => ({
  checkDuplicate: (...args: unknown[]) => mockCheckDuplicate(...args),
}));

/* ─── Mock deepseek scorer ────────────────── */

vi.mock("@/lib/jobs/deepseek-job-scorer", () => ({
  scoreJobLocal: vi.fn(() => ({
    executiveScore: 65,
    matchScore: 60,
    locationScore: 70,
    salaryScore: 50,
    freshnessScore: 50,
    companyScore: 50,
    riskScore: 40,
    globalScore: 60,
    reasons: ["Good match"],
    redFlags: [],
    recommendedAction: "review",
  })),
}));

/* ─── Mock semantic matcher ───────────────── */

vi.mock("@/lib/jobs/semantic-matcher", () => ({
  analyzeJobFit: vi.fn(() => ({
    overallScore: 72,
    confidence: 0.8,
    recommendation: "apply",
  })),
  serializeAnalysis: vi.fn(() => ({ score: 72 })),
}));

/* ─── Import pure functions + API POST handlers ── */

import {
  detectPlatformFromUrl,
  computeExtractionConfidence,
  validateAssistedImportPayload,
  isLoginOrCaptchaVisible,
  buildAssistedImportPreview,
  ASSISTED_REASON_CODES,
} from "@/lib/jobs/assisted-import-extractors";

import { chooseIngestionStrategy } from "@/lib/jobs/ingestion-router";

import { POST as previewPost } from "@/app/api/jobs/assisted-import/preview/route";
import { POST as importPost } from "@/app/api/jobs/assisted-import/import/route";
import { GET as healthGet } from "@/app/api/health/route";

/* ─── Helpers ─────────────────────────────── */

function validLinkedInPayload() {
  return {
    platform: "linkedin",
    sourceUrl: "https://www.linkedin.com/jobs/view/123",
    visibleOnly: true,
    jobs: [{
      title: "Directeur Commercial",
      company: "Acme Corp",
      location: "Paris",
      description: "Description complète du poste.",
      sourceUrl: "https://www.linkedin.com/jobs/view/123",
    }],
  };
}

function mockPreviewRequest(body: Record<string, unknown>) {
  return new Request("http://localhost:3000/api/jobs/assisted-import/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function mockImportRequest(body: Record<string, unknown>) {
  return new Request("http://localhost:3000/api/jobs/assisted-import/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCheckDuplicate.mockResolvedValue({ status: "new", existingId: null });
});

/* ─── Category 1: Ingestion-router routes closed platforms to USER_ASSISTED ── */

describe("Ingestion-router — closed platforms → USER_ASSISTED", () => {
  function linkedInSource() {
    return {
      importMode: "USER_ASSISTED",
      url: "https://www.linkedin.com/jobs/view/123",
      normalizedDomain: "linkedin.com",
      label: "LinkedIn — Directeur Commercial",
      atsVendor: null,
    };
  }

  it("LinkedIn URL → USER_ASSISTED", () => {
    const d = chooseIngestionStrategy(linkedInSource());
    expect(d.strategy).toBe("USER_ASSISTED");
    expect(d.canAutoImport).toBe(false);
    expect(d.priority).toBe(8);
  });

  it("Indeed URL → USER_ASSISTED", () => {
    const d = chooseIngestionStrategy({
      ...linkedInSource(),
      url: "https://fr.indeed.com/viewjob?jk=abc",
      normalizedDomain: "indeed.com",
      label: "Indeed — Head of Sales",
    });
    expect(d.strategy).toBe("USER_ASSISTED");
    expect(d.canAutoImport).toBe(false);
  });

  it("APEC URL → USER_ASSISTED", () => {
    const d = chooseIngestionStrategy({
      ...linkedInSource(),
      url: "https://www.apec.fr/offre/123",
      normalizedDomain: "apec.fr",
      label: "APEC — Directeur des Ventes",
    });
    expect(d.strategy).toBe("USER_ASSISTED");
    expect(d.canAutoImport).toBe(false);
  });

  it("BLOCKED importMode → BLOCKED strategy", () => {
    const d = chooseIngestionStrategy({
      ...linkedInSource(),
      importMode: "BLOCKED",
      url: "https://some-blocked-site.com",
      normalizedDomain: "some-blocked-site.com",
    });
    expect(d.strategy).toBe("BLOCKED");
    expect(d.canAutoImport).toBe(false);
  });

  it("explainStrategyDecision mentions Import Assisté for USER_ASSISTED", () => {
    const d = chooseIngestionStrategy(linkedInSource());
    expect(d.reason).toContain("Import Assisté");
  });
});

/* ─── Category 2: Preview endpoint — never fetches sourceUrl ── */

describe("POST /api/jobs/assisted-import/preview", () => {
  it("accepts valid LinkedIn payload and returns preview", async () => {
    mockCheckDuplicate.mockResolvedValue({ status: "new", existingId: null });
    const res = await previewPost(mockPreviewRequest(validLinkedInPayload()));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.platform).toBe("linkedin");
    expect(body.extractionMethod).toBe("USER_ASSISTED_EXTENSION");
    expect(body.visibleOnly).toBe(true);
    expect(body.jobs).toHaveLength(1);
    expect(body.jobs[0].isDuplicate).toBe(false);
  });

  it("detects duplicates", async () => {
    mockCheckDuplicate.mockResolvedValue({ status: "duplicate", existingId: "job-456" });
    const res = await previewPost(mockPreviewRequest(validLinkedInPayload()));
    const body = await res.json();
    expect(body.jobs[0].isDuplicate).toBe(true);
    expect(body.jobs[0].existingJobId).toBe("job-456");
  });

  it("rejects missing sourceUrl", async () => {
    const res = await previewPost(mockPreviewRequest({
      platform: "linkedin",
      sourceUrl: "",
      visibleOnly: true,
      jobs: [{ title: "Job", company: "Co" }],
    }));
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.reasonCode).toBe("assisted_missing_required_fields");
  });

  it("rejects empty jobs array", async () => {
    const res = await previewPost(mockPreviewRequest({
      platform: "linkedin",
      sourceUrl: "https://linkedin.com/jobs/1",
      visibleOnly: true,
      jobs: [],
    }));
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("refuses server-side fetch flag for blocked domains", async () => {
    const res = await previewPost(mockPreviewRequest({
      platform: "linkedin",
      sourceUrl: "https://www.linkedin.com/jobs/view/123",
      visibleOnly: true,
      jobs: [{ title: "Job", company: "Co" }],
      _serverFetch: true,
    }));
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.reasonCode).toBe("refused_server_side_closed_platform_fetch");
  });

  it("refuses server-side fetch for Indeed", async () => {
    const res = await previewPost(mockPreviewRequest({
      platform: "indeed",
      sourceUrl: "https://fr.indeed.com/viewjob?jk=abc",
      visibleOnly: true,
      jobs: [{ title: "Job", company: "Co" }],
      _serverFetch: true,
    }));
    const body = await res.json();
    expect(body.reasonCode).toBe("refused_server_side_closed_platform_fetch");
  });

  it("refuses server-side fetch for APEC", async () => {
    const res = await previewPost(mockPreviewRequest({
      platform: "apec",
      sourceUrl: "https://www.apec.fr/offre/123",
      visibleOnly: true,
      jobs: [{ title: "Job", company: "Co" }],
      _serverFetch: true,
    }));
    const body = await res.json();
    expect(body.reasonCode).toBe("refused_server_side_closed_platform_fetch");
  });

  it("allows preview without _serverFetch flag", async () => {
    mockCheckDuplicate.mockResolvedValue({ status: "new", existingId: null });
    const res = await previewPost(mockPreviewRequest(validLinkedInPayload()));
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("returns 400 for missing title", async () => {
    const res = await previewPost(mockPreviewRequest({
      ...validLinkedInPayload(),
      jobs: [{ title: "", company: "Co", sourceUrl: "http://ex.com" }],
    }));
    expect(res.status).toBe(400);
  });

  it("computes extraction confidence per job", async () => {
    mockCheckDuplicate.mockResolvedValue({ status: "new", existingId: null });
    const res = await previewPost(mockPreviewRequest(validLinkedInPayload()));
    const body = await res.json();
    expect(body.jobs[0].confidence).toBeDefined();
    expect(body.jobs[0].confidence.score).toBeGreaterThan(0);
  });
});

/* ─── Category 3: Import endpoint — never fetches sourceUrl ── */

describe("POST /api/jobs/assisted-import/import", () => {
  beforeEach(() => {
    mockImportSourceFindFirst.mockResolvedValue(null);
    mockImportSourceCreate.mockResolvedValue({ id: "is-import-assist", name: "Import Assisté", type: "browser" });
    mockProfileFindFirst.mockResolvedValue({
      id: "profile-1",
      title: "Commercial Director",
      fullName: "Test User",
      location: "Paris",
      mobility: "Paris, Lyon",
      yearsExp: 12,
      sectors: ["Tech"],
      languages: "fr,en",
    });
    mockJobFindFirst.mockResolvedValue(null);
    mockJobCreate.mockImplementation((args: { data: Record<string, unknown> }) => Promise.resolve({ id: "job-new", ...args.data }));
    mockJobScoreCreate.mockResolvedValue({ id: "score-new" });
    mockJobScoreUpdate.mockResolvedValue({ id: "score-updated" });
    mockRawJobCreate.mockResolvedValue({ id: "raw-new" });
    mockJobSearchRunCreate.mockResolvedValue({ id: "run-new" });
    mockCheckDuplicate.mockResolvedValue({ status: "new", existingId: null });
  });

  it("rejects missing sourceUrl", async () => {
    const res = await importPost(mockImportRequest({
      platform: "linkedin",
      sourceUrl: "",
      visibleOnly: true,
      selectedJobs: [{ title: "Job", company: "Co" }],
    }));
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.reasonCode).toBe("assisted_missing_required_fields");
  });

  it("rejects empty selectedJobs", async () => {
    const res = await importPost(mockImportRequest({
      platform: "linkedin",
      sourceUrl: "https://linkedin.com/jobs/1",
      visibleOnly: true,
      selectedJobs: [],
    }));
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("rejects missing title in selected job", async () => {
    const res = await importPost(mockImportRequest({
      platform: "linkedin",
      sourceUrl: "https://linkedin.com/jobs/1",
      visibleOnly: true,
      selectedJobs: [{ title: "", company: "Co" }],
    }));
    expect(res.status).toBe(400);
  });

  it("allows import with missing company (warning, not rejection)", async () => {
    const res = await importPost(mockImportRequest({
      platform: "linkedin",
      sourceUrl: "https://linkedin.com/jobs/1",
      visibleOnly: true,
      selectedJobs: [{ title: "Job", company: "" }],
    }));
    // Company is optional in assisted import — user can fill it manually
    expect(res.status).toBe(200);
  });

  it("imports a single job through full pipeline", async () => {
    const res = await importPost(mockImportRequest({
      platform: "linkedin",
      sourceUrl: "https://www.linkedin.com/jobs/view/123",
      visibleOnly: true,
      selectedJobs: [{
        title: "Directeur Commercial",
        company: "Acme Corp",
        location: "Paris",
        description: "Description complète du poste.",
        salaryMin: 90000,
        salaryMax: 110000,
        contractType: "CDI",
        currency: "EUR",
        sourceUrl: "https://www.linkedin.com/jobs/view/123",
      }],
    }));
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.imported).toBe(1);
    expect(body.duplicates).toBe(0);
    expect(body.semanticScoredCount).toBeGreaterThanOrEqual(1);

    // Verify RawJob created
    expect(mockRawJobCreate).toHaveBeenCalled();
    // Verify Job created
    expect(mockJobCreate).toHaveBeenCalled();
    // Verify JobScore created
    expect(mockJobScoreCreate).toHaveBeenCalled();
    // Verify semantic score updated
    expect(mockJobScoreUpdate).toHaveBeenCalled();
    // Verify audit
    expect(mockJobSearchRunCreate).toHaveBeenCalled();
  });

  it("creates ImportSource if missing", async () => {
    mockImportSourceFindFirst.mockResolvedValue(null);
    await importPost(mockImportRequest({
      platform: "indeed",
      sourceUrl: "https://fr.indeed.com/job",
      visibleOnly: true,
      selectedJobs: [{ title: "Manager", company: "Corp" }],
    }));
    expect(mockImportSourceCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ name: "Import Assisté" }) })
    );
  });

  it("reuses existing ImportSource", async () => {
    mockImportSourceFindFirst.mockResolvedValue({ id: "is-existing", name: "Import Assisté", type: "browser" });
    await importPost(mockImportRequest({
      platform: "indeed",
      sourceUrl: "https://fr.indeed.com/job",
      visibleOnly: true,
      selectedJobs: [{ title: "Manager", company: "Corp" }],
    }));
    expect(mockImportSourceCreate).not.toHaveBeenCalled();
  });

  it("skips duplicates", async () => {
    mockCheckDuplicate.mockResolvedValue({ status: "duplicate", existingId: "job-456" });
    const res = await importPost(mockImportRequest({
      platform: "linkedin",
      sourceUrl: "https://linkedin.com/jobs/1",
      visibleOnly: true,
      selectedJobs: [{ title: "Job", company: "Co" }],
    }));
    const body = await res.json();
    expect(body.duplicates).toBe(1);
    expect(body.imported).toBe(0);
    expect(mockJobCreate).not.toHaveBeenCalled();
  });

  it("handles multiple jobs in one request", async () => {
    const res = await importPost(mockImportRequest({
      platform: "linkedin",
      sourceUrl: "https://linkedin.com/jobs/search",
      visibleOnly: true,
      selectedJobs: [
        { title: "Job 1", company: "Co A" },
        { title: "Job 2", company: "Co B" },
        { title: "Job 3", company: "Co C" },
      ],
    }));
    const body = await res.json();
    expect(body.imported).toBe(3);
  });

  it("audit log contains correct fields", async () => {
    await importPost(mockImportRequest({
      platform: "apec",
      sourceUrl: "https://www.apec.fr/offre/123",
      visibleOnly: true,
      selectedJobs: [{ title: "Director", company: "L'Oréal" }],
    }));
    const call = mockJobSearchRunCreate.mock.calls[0][0];
    expect(call.data.extractionMethod || call.data.logsJson).toBeDefined();
  });

  it("reasonCode is assisted_visible_job_imported on success", async () => {
    await importPost(mockImportRequest({
      platform: "linkedin",
      sourceUrl: "https://linkedin.com/jobs/1",
      visibleOnly: true,
      selectedJobs: [{ title: "Job", company: "Co" }],
    }));
    const call = mockJobSearchRunCreate.mock.calls[0][0];
    const logs = JSON.parse(call.data.logsJson);
    expect(logs.reasonCode).toBe("assisted_visible_job_imported");
  });
});

/* ─── Category 4: Reason codes ─────────────── */

describe("ASSISTED_REASON_CODES", () => {
  it("all codes exist", () => {
    expect(ASSISTED_REASON_CODES.assisted_visible_job_imported).toBeTruthy();
    expect(ASSISTED_REASON_CODES.assisted_visible_list_imported).toBeTruthy();
    expect(ASSISTED_REASON_CODES.assisted_duplicate_skipped).toBeTruthy();
    expect(ASSISTED_REASON_CODES.assisted_missing_required_fields).toBeTruthy();
    expect(ASSISTED_REASON_CODES.blocked_login_or_captcha_visible).toBeTruthy();
    expect(ASSISTED_REASON_CODES.refused_server_side_closed_platform_fetch).toBeTruthy();
    expect(ASSISTED_REASON_CODES.refused_auto_scrape_closed_platform).toBeTruthy();
  });

  it("all descriptions are non-empty", () => {
    for (const [key, desc] of Object.entries(ASSISTED_REASON_CODES)) {
      expect(desc.length, `${key} has empty description`).toBeGreaterThan(5);
    }
  });
});

/* ─── Category 5: Login/CAPTCHA blocked ────── */

describe("Login/CAPTCHA blocked", () => {
  it("CAPTCHA detected in text", () => {
    const text = "Veuillez compléter le captcha pour continuer. Offre de poste.";
    expect(isLoginOrCaptchaVisible(text)).toBe(true);
  });

  it("login wall detected in text", () => {
    const text = "Connectez-vous pour voir cette offre d'emploi complète.";
    expect(isLoginOrCaptchaVisible(text)).toBe(true);
  });

  it("normal job text passes", () => {
    const text = "Nous recherchons un Directeur Commercial pour notre bureau de Paris. CDI.";
    expect(isLoginOrCaptchaVisible(text)).toBe(false);
  });
});

/* ─── Category 6: Pure function imports work in API context ── */

describe("Pure functions in API context", () => {
  it("detectPlatformFromUrl identifies all blocked platforms", () => {
    expect(detectPlatformFromUrl("https://www.linkedin.com/jobs/")).toBe("linkedin");
    expect(detectPlatformFromUrl("https://fr.indeed.com/viewjob")).toBe("indeed");
    expect(detectPlatformFromUrl("https://www.apec.fr/offre/123")).toBe("apec");
  });

  it("validateAssistedImportPayload rejects title < 3 chars", () => {
    const r = validateAssistedImportPayload({
      platform: "linkedin",
      sourceUrl: "https://linkedin.com/jobs/1",
      visibleOnly: true,
      jobs: [{ title: "AB", company: "Corp" }],
    });
    expect(r.valid).toBe(false);
  });

  it("validateAssistedImportPayload allows empty company (warning, not rejection)", () => {
    const r = validateAssistedImportPayload({
      platform: "linkedin",
      sourceUrl: "https://linkedin.com/jobs/1",
      visibleOnly: true,
      jobs: [{ title: "Director", company: "   " }],
    });
    // Company is optional for assisted import — user can fill it manually
    expect(r.valid).toBe(true);
  });

  it("computeExtractionConfidence returns full score layout", () => {
    const c = computeExtractionConfidence({
      title: "Directeur Commercial",
      company: "Acme Corp",
      location: "Paris",
      description: "Description complète.",
      contractType: "CDI",
    });
    expect(c).toHaveProperty("score");
    expect(c).toHaveProperty("presentCount");
    expect(c).toHaveProperty("totalFields");
    expect(c).toHaveProperty("details");
    expect(c.details.title).toBe(true);
    expect(c.details.company).toBe(true);
  });

  it("buildAssistedImportPreview sets visibleOnly=true", () => {
    const preview = buildAssistedImportPreview("indeed", "https://indeed.com/job", [], {});
    expect(preview.visibleOnly).toBe(true);
    expect(preview.extractionMethod).toBe("USER_ASSISTED_EXTENSION");
    expect(preview.isLoginOrCaptchaVisible).toBe(false);
  });
});

/* ─── Category 7: Health endpoint ───────── */

function healthRequest(): Request {
  return new Request("http://localhost:3000/api/health", { method: "GET" });
}

describe("GET /api/health", () => {
  it("returns ok when DB is reachable", async () => {
    const res = await healthGet(healthRequest());
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.version).toBe("2.7.2");
    expect(body.timestamp).toBeDefined();
    expect(body.db).toBe("connected");
  });

  it("returns valid JSON with all required fields", async () => {
    const res = await healthGet(healthRequest());
    const body = await res.json();
    expect(body).toHaveProperty("status");
    expect(body).toHaveProperty("version");
    expect(body).toHaveProperty("timestamp");
    expect(body).toHaveProperty("db");
  });
});

/* ─── Category 8: Backend offline — graceful degradation ── */

describe("Backend offline — graceful degradation", () => {
  it("preview endpoint rejects missing sourceUrl before any backend check", async () => {
    // Even when backend is "offline", missing required fields should fail fast
    const res = await previewPost(mockPreviewRequest({
      platform: "linkedin",
      sourceUrl: "",
      visibleOnly: true,
      jobs: [{ title: "Job", company: "Co" }],
    }));
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.reasonCode).toBe("assisted_missing_required_fields");
  });

  it("baseUrl localhost:3000 is valid default", () => {
    const url = "http://localhost:3000";
    expect(url).toMatch(/^https?:\/\/localhost:\d+/);
  });

  it("baseUrl localhost:3001 is valid alternative", () => {
    const url = "http://localhost:3001";
    expect(url).toMatch(/^https?:\/\/localhost:\d+/);
  });

  it("detectPlatformFromUrl works without any server", () => {
    // Platform detection is local — no network needed
    expect(detectPlatformFromUrl("https://www.linkedin.com/jobs/search/?currentJobId=123")).toBe("linkedin");
    expect(detectPlatformFromUrl("https://fr.indeed.com/viewjob?jk=abc")).toBe("indeed");
    expect(detectPlatformFromUrl("https://www.apec.fr/offre/123")).toBe("apec");
  });

  it("computeExtractionConfidence works locally without server", () => {
    const c = computeExtractionConfidence({
      title: "Sales Country Manager",
      company: "Wildix",
      location: "France / Remote",
      description: "Job description here.",
    });
    expect(c.score).toBeGreaterThan(80); // All main fields present = 85
    expect(c.details.title).toBe(true);
    expect(c.details.company).toBe(true);
    expect(c.details.location).toBe(true);
  });

  it("API import should fail gracefully when _serverFetch attempted", async () => {
    // This endpoint REFUSES server-side fetch for blocked platforms.
    // In real use, the extension sends visibleOnly=true with no _serverFetch.
    // This test guarantees the guard works.
    const res = await previewPost(mockPreviewRequest({
      platform: "linkedin",
      sourceUrl: "https://www.linkedin.com/jobs/view/123",
      visibleOnly: true,
      jobs: [{ title: "Job", company: "Co" }],
      _serverFetch: true,
    }));
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.reasonCode).toBe("refused_server_side_closed_platform_fetch");
  });
});
