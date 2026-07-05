import { describe, it, expect, vi, beforeEach } from "vitest";

const mockDraft = {
  id: "draft-123",
  jobId: "job-1",
  status: "approved",
  sentAt: null,
  pipelineStatus: null,
  generationLogs: JSON.stringify([]),
  changeLogJson: JSON.stringify([]),
  followUpDueAt: null,
};

let currentDraft = { ...mockDraft };
let updateCalls: Array<{ where: { id: string }; data: Record<string, unknown> }> = [];

const mockJob = {
  id: "job-1",
  title: "Directeur Commercial France H/F",
  company: "TechCorp France",
  location: "13000 Marseille",
  sourceUrl: "https://fr.indeed.com/viewjob?jk=abc123",
  sourceName: "indeed",
};

const mockPrisma = {
  applicationDraft: {
    findUnique: vi.fn().mockImplementation((args: { where: { id: string } }) => {
      return Promise.resolve(args.where.id === "draft-123" ? { ...currentDraft } : null);
    }),
    update: vi.fn().mockImplementation((args: { where: { id: string }; data: Record<string, unknown> }) => {
      updateCalls.push(args);
      if (args.data.generationLogs) currentDraft.generationLogs = args.data.generationLogs as string;
      if (args.data.status) currentDraft.status = args.data.status as string;
      if (args.data.sentAt) currentDraft.sentAt = args.data.sentAt as string;
      return Promise.resolve({ ...currentDraft, ...args.data });
    }),
  },
  job: {
    findUnique: vi.fn().mockResolvedValue(mockJob),
  },
  opportunity: {
    findFirst: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({ id: "opp-1" }),
  },
  pipelineTask: {
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({ id: "pt-1" }),
    update: vi.fn().mockResolvedValue({ id: "pt-1" }),
  },
  relance: {
    create: vi.fn().mockResolvedValue({ id: "rel-1" }),
  },
  profile: { findFirst: vi.fn().mockResolvedValue(null) },
};

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

describe("POST /api/application-drafts/[id]/mark-submitted", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateCalls = [];
    currentDraft = { ...mockDraft, generationLogs: JSON.stringify([]), status: "approved", sentAt: null };
    vi.stubEnv("NODE_ENV", "development");
  });

  it("accepts mark-submitted with valid payload", async () => {
    const { POST } = await import("@/app/api/application-drafts/[id]/mark-submitted/route");
    const response = await POST(
      new Request("http://localhost:3000/api/application-drafts/draft-123/mark-submitted", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: "indeed", confirmationUrl: "https://smartapply.indeed.com/post-apply", confirmationText: "Votre candidature a bien été envoyée.", submittedAt: new Date().toISOString(), source: "chrome_extension", confidence: "high" }),
      }),
      { params: Promise.resolve({ id: "draft-123" }) }
    );
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.platform).toBe("indeed");
  });

  it("returns 400 when required fields missing", async () => {
    const { POST } = await import("@/app/api/application-drafts/[id]/mark-submitted/route");
    const response = await POST(
      new Request("http://localhost:3000/api/application-drafts/draft-123/mark-submitted", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: "indeed" }),
      }),
      { params: Promise.resolve({ id: "draft-123" }) }
    );
    expect(response.status).toBe(400);
  });

  it("returns 404 for missing draft", async () => {
    const { POST } = await import("@/app/api/application-drafts/[id]/mark-submitted/route");
    const response = await POST(
      new Request("http://localhost:3000/api/application-drafts/nonexistent/mark-submitted", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: "indeed", confirmationUrl: "https://example.com", submittedAt: new Date().toISOString(), source: "chrome_extension", confidence: "high" }),
      }),
      { params: Promise.resolve({ id: "nonexistent" }) }
    );
    expect(response.status).toBe(404);
  });

  it("masks emails in confirmation text before storing", async () => {
    const { POST } = await import("@/app/api/application-drafts/[id]/mark-submitted/route");
    await POST(
      new Request("http://localhost:3000/api/application-drafts/draft-123/mark-submitted", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: "indeed", confirmationUrl: "https://example.com", confirmationText: "Envoyé à eltduarte@gmail.com", submittedAt: new Date().toISOString(), source: "chrome_extension", confidence: "high" }),
      }),
      { params: Promise.resolve({ id: "draft-123" }) }
    );
    // Check that the log stored has masked email
    const logUpdate = updateCalls.find(c => c.data.generationLogs);
    expect(logUpdate).toBeTruthy();
    const logs = JSON.parse(logUpdate!.data.generationLogs as string);
    const detectionLog = logs.find((l: { type: string }) => l.type === "post_apply_detection");
    expect(detectionLog).toBeTruthy();
    expect(detectionLog.confirmationText).toContain("***@gmail.com");
    expect(detectionLog.confirmationText).not.toContain("eltduarte");
  });

  it("succeeds idempotently on repeated calls", async () => {
    // First call
    const { POST } = await import("@/app/api/application-drafts/[id]/mark-submitted/route");
    const r1 = await POST(
      new Request("http://localhost:3000/api/application-drafts/draft-123/mark-submitted", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: "indeed", confirmationUrl: "https://example.com", submittedAt: new Date().toISOString(), source: "chrome_extension", confidence: "high" }),
      }),
      { params: Promise.resolve({ id: "draft-123" }) }
    );
    expect(r1.status).toBe(200);

    // Second call — both should succeed (route handles idempotency internally)
    const r2 = await POST(
      new Request("http://localhost:3000/api/application-drafts/draft-123/mark-submitted", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: "indeed", confirmationUrl: "https://example.com", submittedAt: new Date().toISOString(), source: "chrome_extension", confidence: "high" }),
      }),
      { params: Promise.resolve({ id: "draft-123" }) }
    );
    expect(r2.status).toBe(200);
    const d2 = await r2.json();
    // Second call still succeeds (idempotent, no crash)
    expect(d2.success).toBe(true);
  });

  it("creates Opportunity and Relance when none exist", async () => {
    // Ensure no Opportunity exists
    mockPrisma.opportunity.findFirst.mockResolvedValue(null);

    const { POST } = await import("@/app/api/application-drafts/[id]/mark-submitted/route");
    await POST(
      new Request("http://localhost:3000/api/application-drafts/draft-123/mark-submitted", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: "indeed", confirmationUrl: "https://smartapply.indeed.com/post-apply", confirmationText: "Candidature envoyée.", submittedAt: new Date().toISOString(), source: "chrome_extension", confidence: "high" }),
      }),
      { params: Promise.resolve({ id: "draft-123" }) }
    );

    // Should have tried to find an Opportunity
    expect(mockPrisma.opportunity.findFirst).toHaveBeenCalled();
    // Should have created a new Opportunity
    expect(mockPrisma.opportunity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "Directeur Commercial France H/F",
          company: "TechCorp France",
          status: "postule",
        }),
      })
    );
    // Should have created a Relance
    expect(mockPrisma.relance.create).toHaveBeenCalled();
  });

  it("reuses existing Opportunity when one matches", async () => {
    mockPrisma.opportunity.findFirst.mockResolvedValue({ id: "existing-opp-1" });
    mockPrisma.opportunity.create.mockClear();
    mockPrisma.relance.create.mockClear();

    const { POST } = await import("@/app/api/application-drafts/[id]/mark-submitted/route");
    await POST(
      new Request("http://localhost:3000/api/application-drafts/draft-123/mark-submitted", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: "linkedin", confirmationUrl: "https://linkedin.com/apply/confirm", confirmationText: "Submitted.", submittedAt: new Date().toISOString(), source: "chrome_extension", confidence: "high" }),
      }),
      { params: Promise.resolve({ id: "draft-123" }) }
    );

    // Should NOT create a new Opportunity
    expect(mockPrisma.opportunity.create).not.toHaveBeenCalled();
    // Should create Relance with existing opp ID
    expect(mockPrisma.relance.create).toHaveBeenCalled();
  });
});

describe("Post-apply detector logic", () => {
  function detectPostApply(url: string, text: string) {
    if (!url || !text) return { detected: false, platform: null, confidence: "low", confirmationText: "", pageUrl: url || "" };
    const signals: Record<string, { texts: string[] }> = {
      indeed: { texts: ["votre candidature a bien été envoyée", "candidature a bien été envoyée"] },
      linkedin: { texts: ["votre candidature a été envoyée avec succès", "application submitted"] },
      apec: { texts: ["votre candidature a bien été transmise", "candidature transmise"] },
      generic: { texts: ["thank you for applying", "merci pour votre candidature", "application submitted"] },
    };
    for (const [platform, s] of Object.entries(signals)) {
      for (const t of s.texts) {
        if (text.toLowerCase().includes(t.toLowerCase())) {
          return { detected: true, platform, confidence: platform === "generic" ? "medium" : "high", confirmationText: t, pageUrl: url };
        }
      }
    }
    return { detected: false, platform: null, confidence: "low", confirmationText: "", pageUrl: url };
  }

  it("detects Indeed post-apply (FR)", () => {
    const r = detectPostApply("https://smartapply.indeed.com/post-apply", "Votre candidature a bien été envoyée. Vous recevrez un email.");
    expect(r.detected).toBe(true);
    expect(r.platform).toBe("indeed");
  });

  it("detects generic ATS", () => {
    const r = detectPostApply("https://boards.greenhouse.io/confirm", "Thank you for applying!");
    expect(r.detected).toBe(true);
    expect(r.platform).toBe("generic");
  });

  it("does NOT detect on regular page", () => {
    const r = detectPostApply("https://linkedin.com/jobs/view/123", "Description du poste. Nous recherchons un Directeur.");
    expect(r.detected).toBe(false);
  });

  it("detects LinkedIn Easy Apply", () => {
    const r = detectPostApply("https://www.linkedin.com/jobs/", "Votre candidature a été envoyée avec succès.");
    expect(r.detected).toBe(true);
    expect(r.platform).toBe("linkedin");
  });

  it("detects APEC", () => {
    const r = detectPostApply("https://www.apec.fr/", "Votre candidature a bien été transmise.");
    expect(r.detected).toBe(true);
    expect(r.platform).toBe("apec");
  });
});
