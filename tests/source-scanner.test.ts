import { describe, it, expect } from "vitest";
import {
  detectAtsProvider,
  detectJsonLdJobs,
  detectRssOrSitemap,
  detectServerBlocked,
  isBlockedDomain,
  classifyImportMode,
  assessSourceCapability,
} from "@/lib/jobs/source-capability-scanner";

// ─── detectAtsProvider ─────────────────────

describe("detectAtsProvider", () => {
  it("detects Greenhouse from domain", () => {
    const result = detectAtsProvider("https://boards.greenhouse.io/stripe", "");
    expect(result).toBe("greenhouse");
  });

  it("detects Greenhouse from HTML", () => {
    const html = '<link rel="stylesheet" href="https://job-boards.cdn.greenhouse.io/assets/entry.css">';
    const result = detectAtsProvider("https://stripe.com/careers", html);
    expect(result).toBe("greenhouse");
  });

  it("detects Lever from domain", () => {
    const result = detectAtsProvider("https://jobs.lever.co/palantir", "");
    expect(result).toBe("lever");
  });

  it("detects Ashby from domain", () => {
    const result = detectAtsProvider("https://jobs.ashbyhq.com/linear", "");
    expect(result).toBe("ashby");
  });

  it("detects SmartRecruiters from domain", () => {
    const result = detectAtsProvider("https://jobs.smartrecruiters.com/company", "");
    expect(result).toBe("smartrecruiters");
  });

  it("detects Workable from HTML", () => {
    const html = '<script src="https://apply.workable.com/static/widget.js">';
    const result = detectAtsProvider("https://mycompany.com/jobs", html);
    expect(result).toBe("workable");
  });

  it("detects Teamtailor from domain", () => {
    const result = detectAtsProvider("https://careers.mycompany.teamtailor.com/jobs", "");
    expect(result).toBe("teamtailor");
  });

  it("detects Recruitee from HTML", () => {
    const html = '<script src="https://mycompany.recruitee.com/widget.js">';
    const result = detectAtsProvider("https://company.com/careers", html);
    expect(result).toBe("recruitee");
  });

  it("returns null for unknown career pages", () => {
    const result = detectAtsProvider("https://www.company.com/careers", "<html><body>Jobs</body></html>");
    expect(result).toBeNull();
  });
});

// ─── detectJsonLdJobs ──────────────────────

describe("detectJsonLdJobs", () => {
  it("counts 1 JobPosting in JSON-LD", () => {
    const html = `<script type="application/ld+json">{"@type":"JobPosting","title":"Developer"}</script>`;
    expect(detectJsonLdJobs(html)).toBe(1);
  });

  it("counts multiple JobPostings", () => {
    const html = `
      <script type="application/ld+json">{"@type":"JobPosting","title":"Dev"}</script>
      <script type="application/ld+json">{"@type":"JobPosting","title":"Manager"}</script>
      <script type="application/ld+json">{"@type":"JobPosting","title":"Lead"}</script>
    `;
    expect(detectJsonLdJobs(html)).toBe(3);
  });

  it("ignores non-JobPosting JSON-LD blocks", () => {
    const html = `
      <script type="application/ld+json">{"@type":"Organization","name":"ACME"}</script>
      <script type="application/ld+json">{"@type":"WebSite"}</script>
    `;
    expect(detectJsonLdJobs(html)).toBe(0);
  });

  it("returns 0 for pages without JSON-LD", () => {
    expect(detectJsonLdJobs("<html><body>No JSON-LD here</body></html>")).toBe(0);
  });
});

// ─── detectRssOrSitemap ────────────────────

describe("detectRssOrSitemap", () => {
  it("detects sitemap hint in URL", () => {
    const result = detectRssOrSitemap("https://company.com/sitemap.xml");
    expect(result.sitemap).toBe(true);
    expect(result.rss).toBe(false);
  });

  it("detects RSS hint in URL", () => {
    const result = detectRssOrSitemap("https://company.com/jobs/rss");
    expect(result.rss).toBe(true);
    expect(result.sitemap).toBe(false);
  });

  it("detects feed hint in URL", () => {
    const result = detectRssOrSitemap("https://company.com/careers/feed");
    expect(result.rss).toBe(true);
  });

  it("returns false for normal URLs", () => {
    const result = detectRssOrSitemap("https://company.com/careers");
    expect(result.rss).toBe(false);
    expect(result.sitemap).toBe(false);
  });
});

// ─── detectServerBlocked ───────────────────

describe("detectServerBlocked", () => {
  it("detects 403 as blocked", () => {
    expect(detectServerBlocked(403, "")).toBe(true);
  });

  it("detects 429 as blocked", () => {
    expect(detectServerBlocked(429, "")).toBe(true);
  });

  it("detects Cloudflare challenge in HTML", () => {
    const html = `<html><body>Just a moment... <script>window._cf_chl_opt</script></body></html>`;
    expect(detectServerBlocked(200, html)).toBe(true);
  });

  it("detects DataDome in HTML", () => {
    const html = `<html><script src="https://datadome.co/challenge.js"></script></html>`;
    expect(detectServerBlocked(200, html)).toBe(true);
  });

  it("detects reCAPTCHA in HTML", () => {
    const html = `<script src="https://www.google.com/recaptcha/api.js"></script>`;
    expect(detectServerBlocked(200, html)).toBe(true);
  });

  it("returns false for normal pages", () => {
    expect(detectServerBlocked(200, "<html><body>Welcome to our careers page</body></html>")).toBe(false);
  });
});

// ─── isBlockedDomain ───────────────────────

describe("isBlockedDomain", () => {
  it("blocks linkedin.com", () => {
    expect(isBlockedDomain("linkedin.com")).toBe(true);
    expect(isBlockedDomain("www.linkedin.com")).toBe(true);
  });

  it("blocks indeed.com", () => {
    expect(isBlockedDomain("fr.indeed.com")).toBe(true);
    expect(isBlockedDomain("indeed.com")).toBe(true);
  });

  it("blocks apec.fr", () => {
    expect(isBlockedDomain("apec.fr")).toBe(true);
    expect(isBlockedDomain("www.apec.fr")).toBe(true);
  });

  it("allows normal career pages", () => {
    expect(isBlockedDomain("stripe.com")).toBe(false);
    expect(isBlockedDomain("company.careers")).toBe(false);
  });
});

// ─── classifyImportMode ────────────────────

describe("classifyImportMode", () => {
  it("returns BLOCKED for linkedin.com (V2.6.2)", () => {
    const result = classifyImportMode({
      domain: "linkedin.com",
      statusCode: 200,
      atsProvider: null,
      jsonldJobCount: 0,
      hasRss: false,
      hasSitemap: false,
      isBlocked: false,
    });
    expect(result).toBe("BLOCKED");
  });

  it("returns BLOCKED for indeed.com (V2.6.2)", () => {
    const result = classifyImportMode({
      domain: "indeed.com",
      statusCode: 200,
      atsProvider: null,
      jsonldJobCount: 0,
      hasRss: false,
      hasSitemap: false,
      isBlocked: false,
    });
    expect(result).toBe("BLOCKED");
  });

  it("returns MANUAL_ONLY for pages blocked at scan level (V2.6.2)", () => {
    const result = classifyImportMode({
      domain: "somecompany.com",
      statusCode: 403,
      atsProvider: null,
      jsonldJobCount: 0,
      hasRss: false,
      hasSitemap: false,
      isBlocked: true,
    });
    // Domain not on any list but server blocked → last fallback returns MANUAL_ONLY
    expect(result).toBe("MANUAL_ONLY");
  });

  it("returns ATS_PUBLIC when provider detected (V2.6.2)", () => {
    const result = classifyImportMode({
      domain: "boards.greenhouse.io",
      statusCode: 200,
      atsProvider: "greenhouse",
      jsonldJobCount: 0,
      hasRss: false,
      hasSitemap: false,
      isBlocked: false,
    });
    expect(result).toBe("ATS_PUBLIC");
  });

  it("returns AUTO_JSONLD when JSON-LD jobs found", () => {
    const result = classifyImportMode({
      domain: "se.com",
      statusCode: 200,
      atsProvider: null,
      jsonldJobCount: 5,
      hasRss: false,
      hasSitemap: false,
      isBlocked: false,
    });
    expect(result).toBe("AUTO_JSONLD");
  });

  it("returns AUTO_PUBLIC_CAREERS when RSS/sitemap is available (V2.6.2)", () => {
    const result = classifyImportMode({
      domain: "company.com",
      statusCode: 200,
      atsProvider: null,
      jsonldJobCount: 0,
      hasRss: true,
      hasSitemap: false,
      isBlocked: false,
    });
    expect(result).toBe("AUTO_PUBLIC_CAREERS");
  });

  it("returns AUTO_PUBLIC_CAREERS for unknown sources (V2.6.2)", () => {
    const result = classifyImportMode({
      domain: "unknown-company.com",
      statusCode: 200,
      atsProvider: null,
      jsonldJobCount: 0,
      hasRss: false,
      hasSitemap: false,
      isBlocked: false,
    });
    expect(result).toBe("AUTO_PUBLIC_CAREERS");
  });

  it("returns ATS_PUBLIC when ATS takes priority over JSON-LD (V2.6.2)", () => {
    const result = classifyImportMode({
      domain: "jobs.lever.co",
      statusCode: 200,
      atsProvider: "lever",
      jsonldJobCount: 10,
      hasRss: false,
      hasSitemap: false,
      isBlocked: false,
    });
    expect(result).toBe("ATS_PUBLIC");
  });
});

// ─── assessSourceCapability ────────────────

describe("assessSourceCapability", () => {
  it("classifies Stripe Greenhouse as ATS_PUBLIC (V2.6.2)", () => {
    const cap = assessSourceCapability(
      "greenhouse-stripe",
      "Stripe",
      "https://boards.greenhouse.io/stripe",
      200,
      '<html><head><link rel="stylesheet" href="https://job-boards.cdn.greenhouse.io/assets/entry.css"></head><body>Jobs</body></html>',
    );
    expect(cap.importMode).toBe("ATS_PUBLIC");
    expect(cap.supportsAtsEndpoint).toBe(true);
    expect(cap.platformType).toBe("ats");
  });

  it("classifies LinkedIn as BLOCKED (V2.6.2)", () => {
    const cap = assessSourceCapability(
      "platform-linkedin",
      "LinkedIn Jobs",
      "https://www.linkedin.com/jobs/",
      200,
      "<html><body>LinkedIn Jobs</body></html>",
    );
    expect(cap.importMode).toBe("BLOCKED");
  });

  it("classifies Indeed as BLOCKED (V2.6.2)", () => {
    const cap = assessSourceCapability(
      "platform-indeed",
      "Indeed France",
      "https://fr.indeed.com/",
      200,
      "<html><body>Indeed</body></html>",
    );
    expect(cap.importMode).toBe("BLOCKED");
  });

  it("classifies JSON-LD career page as AUTO_JSONLD", () => {
    const cap = assessSourceCapability(
      "career-schneider",
      "Schneider Electric",
      "https://careers.se.com/search",
      200,
      '<script type="application/ld+json">{"@type":"JobPosting","title":"Engineer","hiringOrganization":{"name":"Schneider"}}</script>',
    );
    expect(cap.importMode).toBe("AUTO_JSONLD");
    expect(cap.supportsJsonLd).toBe(true);
  });

  it("classifies unknown page as AUTO_PUBLIC_CAREERS (V2.6.2)", () => {
    const cap = assessSourceCapability(
      "unknown",
      "Unknown Corp",
      "https://unknown-company.com/jobs",
      200,
      "<html><body>We're hiring!</body></html>",
    );
    expect(cap.importMode).toBe("AUTO_PUBLIC_CAREERS");
  });

  it("sets lastCheckedAt to null in pure function", () => {
    const cap = assessSourceCapability(
      "test",
      "Test",
      "https://test.com",
      200,
      "<html></html>",
    );
    expect(cap.lastCheckedAt).toBeNull();
    expect(cap.lastStatus).toBeNull();
  });

  it("extracts domain correctly", () => {
    const cap = assessSourceCapability(
      "test",
      "Test",
      "https://www.example.com/careers?page=1",
      200,
      "<html></html>",
    );
    expect(cap.domain).toBe("example.com");
  });
});
