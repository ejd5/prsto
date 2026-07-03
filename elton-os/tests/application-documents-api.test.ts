import { describe, it, expect, vi, beforeEach } from "vitest";

const mockDraft = {
  id: "draft-123",
  tailoredResumeContent: "CV content here\nEXPÉRIENCES PROFESSIONNELLES\nTechCorp 2018-2023",
  motivationLetterLong: "Letter content here",
  motivationLetterShort: "Short letter",
  candidateProfileId: "profile-1",
  generationLogs: JSON.stringify([]),
  job: { title: "Directeur Commercial", company: "TeamCo" },
};

const mockProfile = { fullName: "Jean Dupont", title: "Dir. Commercial", summary: "Test", location: "Paris", languages: "[]", education: "[]", certifications: "[]", skills: [], experiences: [] };

const mockPrisma = {
  applicationDraft: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  profile: {
    findFirst: vi.fn(),
  },
  skill: { findMany: vi.fn().mockResolvedValue([]) },
  experience: { findMany: vi.fn().mockResolvedValue([]) },
  proofEntry: { findMany: vi.fn().mockResolvedValue([]) },
  setting: { findUnique: vi.fn().mockResolvedValue(null) },
  aIPrompt: { findMany: vi.fn().mockResolvedValue([]) },
  job: { findFirst: vi.fn(), findMany: vi.fn() },
};

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

const EXT_ORIGIN = "chrome-extension://" + "a".repeat(32);

function extReq(url: string, opts?: { method?: string; body?: unknown }): Request {
  return new Request(url, {
    method: opts?.method || "GET",
    headers: { "Content-Type": "application/json", Origin: EXT_ORIGIN },
    ...(opts?.body ? { body: JSON.stringify(opts.body) } : {}),
  });
}

describe("GET /api/application-drafts/[id]/documents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NODE_ENV", "development");
  });

  it("returns document manifest with CV and letter URLs", async () => {
    mockPrisma.applicationDraft.findUnique.mockResolvedValue(mockDraft);
    mockPrisma.profile.findFirst.mockResolvedValue(mockProfile);
    const { GET } = await import("@/app/api/application-drafts/[id]/documents/route");
    const response = await GET(
      extReq("http://localhost:3000/api/application-drafts/draft-123/documents"),
      { params: Promise.resolve({ id: "draft-123" }) }
    );
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.documents.cv.available).toBe(true);
    expect(data.documents.cv.url).toContain("/cv");
  });

  it("returns 404 for missing draft", async () => {
    mockPrisma.applicationDraft.findUnique.mockResolvedValue(null);
    const { GET } = await import("@/app/api/application-drafts/[id]/documents/route");
    const response = await GET(
      extReq("http://localhost:3000/api/application-drafts/nonexistent/documents"),
      { params: Promise.resolve({ id: "nonexistent" }) }
    );
    expect(response.status).toBe(404);
  });

  it("includes CORS headers", async () => {
    mockPrisma.applicationDraft.findUnique.mockResolvedValue(mockDraft);
    mockPrisma.profile.findFirst.mockResolvedValue(mockProfile);
    const { GET } = await import("@/app/api/application-drafts/[id]/documents/route");
    const response = await GET(
      extReq("http://localhost:3000/api/application-drafts/draft-123/documents"),
      { params: Promise.resolve({ id: "draft-123" }) }
    );
    expect(response.headers.get("Access-Control-Allow-Origin")).toBeTruthy();
  });
});

describe("GET /api/application-drafts/[id]/documents/cv", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NODE_ENV", "development");
  });

  it("returns application.pdf with pdf-lib (no Playwright needed) (no Playwright)", async () => {
    mockPrisma.applicationDraft.findUnique.mockResolvedValue(mockDraft);
    mockPrisma.profile.findFirst.mockResolvedValue(mockProfile);

    const { GET } = await import("@/app/api/application-drafts/[id]/documents/cv/route");
    const response = await GET(
      extReq("http://localhost:3000/api/application-drafts/draft-123/documents/cv"),
      { params: Promise.resolve({ id: "draft-123" }) }
    );

    // Without NEXT_PUBLIC_CV_HTML_PDF=true, Playwright is not available
    // The route returns 503 instead of a fake PDF
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("X-ELTON-Cv-Renderer")).toMatch(/pdf-lib|html-preview/);
    expect(response.headers.get("X-ELTON-Cv-Template")).toBeTruthy();
  });

  it("returns 404 when draft has no CV content", async () => {
    mockPrisma.applicationDraft.findUnique.mockResolvedValue({ ...mockDraft, tailoredResumeContent: null });
    const { GET } = await import("@/app/api/application-drafts/[id]/documents/cv/route");
    const response = await GET(
      extReq("http://localhost:3000/api/application-drafts/draft-123/documents/cv"),
      { params: Promise.resolve({ id: "draft-123" }) }
    );
    expect(response.status).toBe(404);
  });

  it("returns 404 when CV content is stale", async () => {
    mockPrisma.applicationDraft.findUnique.mockResolvedValue({
      ...mockDraft, tailoredResumeContent: "Échec génération CV",
    });
    const { GET } = await import("@/app/api/application-drafts/[id]/documents/cv/route");
    const response = await GET(
      extReq("http://localhost:3000/api/application-drafts/draft-123/documents/cv"),
      { params: Promise.resolve({ id: "draft-123" }) }
    );
    expect(response.status).toBe(404);
  });

  it("returns CORS headers even on error", async () => {
    mockPrisma.applicationDraft.findUnique.mockResolvedValue(null);
    const { GET } = await import("@/app/api/application-drafts/[id]/documents/cv/route");
    const response = await GET(
      extReq("http://localhost:3000/api/application-drafts/draft-123/documents/cv"),
      { params: Promise.resolve({ id: "draft-123" }) }
    );
    expect(response.headers.get("Access-Control-Allow-Origin")).toBeTruthy();
  });
});

describe("GET /api/application-drafts/[id]/documents/cover-letter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NODE_ENV", "development");
  });

  it("returns PDF for valid draft", async () => {
    mockPrisma.applicationDraft.findUnique.mockResolvedValue(mockDraft);
    mockPrisma.profile.findFirst.mockResolvedValue(mockProfile);
    const { GET } = await import("@/app/api/application-drafts/[id]/documents/cover-letter/route");
    const response = await GET(
      extReq("http://localhost:3000/api/application-drafts/draft-123/documents/cover-letter"),
      { params: Promise.resolve({ id: "draft-123" }) }
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
  });
});
