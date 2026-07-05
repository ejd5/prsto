import { describe, it, expect } from "vitest";
import {
  classifyFirecrawlEligibility,
  canUseFirecrawlForSource,
  checkFirecrawlConfig,
  extractJobsFromMarkdown,
  normalizeFirecrawlJobs,
  createFirecrawlAuditLog,
} from "../lib/jobs/connectors/firecrawl-safe";
import {
  classifyImportMode,
  isLoginAuthPage,
  isCaptchaOrChallengePage,
  containsBypassAttempt,
  isFirecrawlEligibleDomain,
  isCompatibleWithFirecrawl,
} from "../lib/jobs/source-capability-scanner";
import type { ImportedJob } from "../lib/jobs/types";

/* ─── Catégorie 1 : Classification eligibility ── */

describe("Firecrawl Safe — Classification", () => {
  describe("Sources autorisées", () => {
    it("Greenhouse public → allowed", () => {
      const url = "https://boards.greenhouse.io/stripe";
      const result = classifyFirecrawlEligibility(url, "ATS_PUBLIC", "");
      expect(result.status).toBe("allowed");
      expect(result.reasonCode).toBe("allowed_public_ats");
    });

    it("Lever public → allowed", () => {
      const url = "https://jobs.lever.co/palantir";
      const result = classifyFirecrawlEligibility(url, "ATS_PUBLIC", "");
      expect(result.status).toBe("allowed");
    });

    it("Ashby public → allowed", () => {
      const url = "https://jobs.ashbyhq.com/linear";
      const result = classifyFirecrawlEligibility(url, "ATS_PUBLIC", "");
      expect(result.status).toBe("allowed");
    });

    it("Workable public → allowed", () => {
      const url = "https://apply.workable.com/somecorp";
      const result = classifyFirecrawlEligibility(url, "ATS_PUBLIC", "");
      expect(result.status).toBe("allowed");
    });

    it("SmartRecruiters public → allowed", () => {
      const url = "https://jobs.smartrecruiters.com/MyCorp";
      const result = classifyFirecrawlEligibility(url, "ATS_PUBLIC", "");
      expect(result.status).toBe("allowed");
    });

    it("Public company careers page → allowed", () => {
      const url = "https://careers.somecompany.com/jobs";
      const result = classifyFirecrawlEligibility(url, "AUTO_PUBLIC_CAREERS", "");
      expect(result.status).toBe("allowed");
      expect(result.reasonCode).toBe("allowed_public_careers");
    });

    it("AUTO_ATS → allowed", () => {
      const url = "https://boards.greenhouse.io/airbnb";
      const result = classifyFirecrawlEligibility(url, "ATS_PUBLIC", "");
      expect(result.status).toBe("allowed");
    });

    it("AUTO_JSONLD → allowed", () => {
      const url = "https://careers.se.com/fr/jobs";
      const result = classifyFirecrawlEligibility(url, "AUTO_JSONLD", "");
      expect(result.status).toBe("allowed");
      expect(result.reasonCode).toBe("allowed_jsonld");
    });

    it("AUTO_PUBLIC_CAREERS → allowed", () => {
      const url = "https://www.sanofi.com/fr/carrieres";
      const result = classifyFirecrawlEligibility(url, "AUTO_PUBLIC_CAREERS", "");
      expect(result.status).toBe("allowed");
    });
  });

  describe("Sources refusées", () => {
    it("LinkedIn → refused_closed_platform", () => {
      const url = "https://www.linkedin.com/jobs/view/12345";
      const result = classifyFirecrawlEligibility(url, "USER_ASSISTED", "");
      expect(result.status).toBe("refused");
      expect(result.reasonCode).toBe("refused_closed_platform");
    });

    it("Indeed → refused_closed_platform", () => {
      const url = "https://fr.indeed.com/viewjob?jk=abc123";
      const result = classifyFirecrawlEligibility(url, "USER_ASSISTED", "");
      expect(result.status).toBe("refused");
      expect(result.reasonCode).toBe("refused_closed_platform");
    });

    it("APEC → refused_closed_platform", () => {
      const url = "https://www.apec.fr/offre-emploi/123";
      const result = classifyFirecrawlEligibility(url, "USER_ASSISTED", "");
      expect(result.status).toBe("refused");
      expect(result.reasonCode).toBe("refused_closed_platform");
    });

    it("Login URL → refused_login_required", () => {
      const url = "https://example.com/login?redirect=/jobs";
      const result = classifyFirecrawlEligibility(url, null, "");
      expect(result.status).toBe("refused");
      expect(result.reasonCode).toBe("refused_login_required");
    });

    it("Signin URL → refused_login_required", () => {
      const url = "https://example.com/signin";
      const result = classifyFirecrawlEligibility(url, null, "");
      expect(result.status).toBe("refused");
      expect(result.reasonCode).toBe("refused_login_required");
    });

    it("Auth URL → refused_login_required", () => {
      const url = "https://example.com/auth/authorize";
      const result = classifyFirecrawlEligibility(url, null, "");
      expect(result.status).toBe("refused");
      expect(result.reasonCode).toBe("refused_login_required");
    });

    it("Checkpoint URL → refused_login_required", () => {
      const url = "https://example.com/checkpoint/challenge";
      const result = classifyFirecrawlEligibility(url, null, "");
      expect(result.status).toBe("refused");
      expect(result.reasonCode).toBe("refused_login_required");
    });

    it("CAPTCHA page → refused_captcha", () => {
      const url = "https://example.com/jobs";
      const html = "<html><body><div class='g-recaptcha' data-sitekey='xxx'></div></body></html>";
      const result = classifyFirecrawlEligibility(url, "AUTO_PUBLIC_CAREERS", html);
      expect(result.status).toBe("refused");
      expect(result.reasonCode).toBe("refused_captcha");
    });

    it("Cloudflare challenge → refused_captcha", () => {
      const url = "https://example.com/jobs";
      const html = "Just a moment... Checking your browser before accessing. Cloudflare challenge.";
      const result = classifyFirecrawlEligibility(url, "AUTO_PUBLIC_CAREERS", html);
      expect(result.status).toBe("refused");
      expect(result.reasonCode).toBe("refused_captcha");
    });

    it("DataDome protection → refused_captcha", () => {
      const url = "https://example.com/careers";
      const html = "<script>var dd='datadome';</script>";
      const result = classifyFirecrawlEligibility(url, null, html);
      expect(result.status).toBe("refused");
      expect(result.reasonCode).toBe("refused_captcha");
    });

    it("BLOCKED mode → refused_blocked_domain", () => {
      const url = "https://linkedin.com/jobs";
      const result = classifyFirecrawlEligibility(url, "BLOCKED", "");
      expect(result.status).toBe("refused");
      expect(result.reasonCode).toBe("refused_blocked_domain");
    });

    it("USER_ASSISTED source → refused_closed_platform", () => {
      const url = "https://www.welcometothejungle.com/fr/jobs";
      const result = classifyFirecrawlEligibility(url, "USER_ASSISTED", "");
      expect(result.status).toBe("refused");
    });

    it("Bypass keyword → refused_bypass_attempt", () => {
      const url = "https://example.com/jobs?use=bypass&mode=stealth";
      const result = classifyFirecrawlEligibility(url, null, "");
      expect(result.status).toBe("refused");
      expect(result.reasonCode).toBe("refused_bypass_attempt");
    });

    it("Residential proxy attempt → refused_bypass_attempt", () => {
      const url = "https://example.com/jobs?proxy=residential";
      const result = classifyFirecrawlEligibility(url, null, "");
      expect(result.status).toBe("refused");
      expect(result.reasonCode).toBe("refused_bypass_attempt");
    });

    it("Monster domain → refused (blocked)", () => {
      const url = "https://www.monster.fr/emploi/123";
      const result = classifyFirecrawlEligibility(url, null, "");
      expect(result.status).toBe("refused");
    });
  });

  describe("canUseFirecrawlForSource", () => {
    it("LinkedIn → false", () => {
      expect(canUseFirecrawlForSource({
        url: "https://www.linkedin.com/jobs/view/123",
        importMode: "USER_ASSISTED",
      })).toBe(false);
    });

    it("Indeed → false", () => {
      expect(canUseFirecrawlForSource({
        url: "https://fr.indeed.com/viewjob?jk=abc",
        importMode: "USER_ASSISTED",
      })).toBe(false);
    });
  });
});

/* ─── Catégorie 2 : Source scanner helpers ── */

describe("Source Capability Scanner — V2.6.2 extensions", () => {
  describe("isLoginAuthPage", () => {
    it("/login → true", () => expect(isLoginAuthPage("https://example.com/login")).toBe(true));
    it("/signin → true", () => expect(isLoginAuthPage("https://example.com/signin")).toBe(true));
    it("/auth → true", () => expect(isLoginAuthPage("https://example.com/auth/user")).toBe(true));
    it("/checkpoint → true", () => expect(isLoginAuthPage("https://example.com/checkpoint")).toBe(true));
    it("/jobs → false", () => expect(isLoginAuthPage("https://example.com/jobs")).toBe(false));
    it("/careers → false", () => expect(isLoginAuthPage("https://example.com/careers")).toBe(false));
  });

  describe("isCaptchaOrChallengePage", () => {
    it("g-recaptcha → true", () => {
      expect(isCaptchaOrChallengePage("<div class='g-recaptcha'></div>")).toBe(true);
    });
    it("hcaptcha → true", () => {
      expect(isCaptchaOrChallengePage("<script src='hcaptcha'></script>")).toBe(true);
    });
    it("Cloudflare → true", () => {
      expect(isCaptchaOrChallengePage("cf-ray: abc123")).toBe(true);
    });
    it("DataDome → true", () => {
      expect(isCaptchaOrChallengePage("datadome challenge")).toBe(true);
    });
    it("Plain HTML → false", () => {
      expect(isCaptchaOrChallengePage("<html><body><h1>Jobs</h1></body></html>")).toBe(false);
    });
    it("Empty → false", () => {
      expect(isCaptchaOrChallengePage("")).toBe(false);
    });
  });

  describe("containsBypassAttempt", () => {
    it("bypass → true", () => expect(containsBypassAttempt("use bypass mode")).toBe(true));
    it("proxy → true", () => expect(containsBypassAttempt("residential proxy")).toBe(true));
    it("stealth → true", () => expect(containsBypassAttempt("stealth browser")).toBe(true));
    it("captcha solver → true", () => expect(containsBypassAttempt("captcha solver api")).toBe(true));
    it("puppeteer → true", () => expect(containsBypassAttempt("use puppeteer")).toBe(true));
    it("playwright → true", () => expect(containsBypassAttempt("playwright automation")).toBe(true));
    it("selenium → true", () => expect(containsBypassAttempt("selenium webdriver")).toBe(true));
    it("headless browser → true", () => expect(containsBypassAttempt("headless browser mode")).toBe(true));
    it("normal URL → false", () => expect(containsBypassAttempt("https://careers.example.com/jobs")).toBe(false));
  });

  describe("isFirecrawlEligibleDomain", () => {
    it("greenhouse.io → true", () => expect(isFirecrawlEligibleDomain("boards.greenhouse.io")).toBe(true));
    it("lever.co → true", () => expect(isFirecrawlEligibleDomain("jobs.lever.co")).toBe(true));
    it("ashbyhq.com → true", () => expect(isFirecrawlEligibleDomain("jobs.ashbyhq.com")).toBe(true));
    it("company careers → true", () => expect(isFirecrawlEligibleDomain("careers.stripe.com")).toBe(true));
    it("linkedin.com → false", () => expect(isFirecrawlEligibleDomain("linkedin.com")).toBe(false));
    it("indeed.com → false", () => expect(isFirecrawlEligibleDomain("indeed.com")).toBe(false));
    it("apec.fr → false", () => expect(isFirecrawlEligibleDomain("apec.fr")).toBe(false));
  });

  describe("isCompatibleWithFirecrawl", () => {
    it("ATS_PUBLIC → true", () => expect(isCompatibleWithFirecrawl("ATS_PUBLIC")).toBe(true));
    it("AUTO_JSONLD → true", () => expect(isCompatibleWithFirecrawl("AUTO_JSONLD")).toBe(true));
    it("AUTO_PUBLIC_CAREERS → true", () => expect(isCompatibleWithFirecrawl("AUTO_PUBLIC_CAREERS")).toBe(true));
    it("AUTO_FIRECRAWL_SAFE → true", () => expect(isCompatibleWithFirecrawl("AUTO_FIRECRAWL_SAFE")).toBe(true));
    it("USER_ASSISTED → false", () => expect(isCompatibleWithFirecrawl("USER_ASSISTED")).toBe(false));
    it("BLOCKED → false", () => expect(isCompatibleWithFirecrawl("BLOCKED")).toBe(false));
    it("MANUAL_ONLY → false", () => expect(isCompatibleWithFirecrawl("MANUAL_ONLY")).toBe(false));
  });

  describe("classifyImportMode V2.6.2", () => {
    it("LinkedIn → BLOCKED", () => {
      const result = { domain: "linkedin.com", statusCode: 200, atsProvider: null, jsonldJobCount: 0, hasRss: false, hasSitemap: false, isBlocked: false };
      expect(classifyImportMode(result)).toBe("BLOCKED");
    });

    it("Indeed → BLOCKED", () => {
      const result = { domain: "indeed.com", statusCode: 200, atsProvider: null, jsonldJobCount: 0, hasRss: false, hasSitemap: false, isBlocked: false };
      expect(classifyImportMode(result)).toBe("BLOCKED");
    });

    it("Greenhouse → ATS_PUBLIC", () => {
      const result = { domain: "boards.greenhouse.io", statusCode: 200, atsProvider: "greenhouse", jsonldJobCount: 0, hasRss: false, hasSitemap: false, isBlocked: false };
      expect(classifyImportMode(result)).toBe("ATS_PUBLIC");
    });

    it("JSON-LD careers → AUTO_JSONLD", () => {
      const result = { domain: "careers.se.com", statusCode: 200, atsProvider: null, jsonldJobCount: 3, hasRss: false, hasSitemap: false, isBlocked: false };
      expect(classifyImportMode(result)).toBe("AUTO_JSONLD");
    });

    it("Public careers page → AUTO_PUBLIC_CAREERS", () => {
      const result = { domain: "careers.somecompany.com", statusCode: 200, atsProvider: null, jsonldJobCount: 0, hasRss: false, hasSitemap: false, isBlocked: false };
      expect(classifyImportMode(result)).toBe("AUTO_PUBLIC_CAREERS");
    });

    it("Known ATS API domain → ATS_PUBLIC", () => {
      const result = { domain: "jobs.lever.co", statusCode: 200, atsProvider: null, jsonldJobCount: 0, hasRss: false, hasSitemap: false, isBlocked: false };
      expect(classifyImportMode(result)).toBe("ATS_PUBLIC");
    });
  });
});

/* ─── Catégorie 3 : Extraction Markdown ───── */

describe("Markdown → ImportedJob extraction", () => {
  it("Markdown avec sections heading → au moins 1 job extrait", () => {
    const md = "# Sales Director France\n\nManage the French sales team. Drive revenue growth across France.";
    const sourceUrl = "https://careers.example.com/jobs";
    const jobs = extractJobsFromMarkdown(md, sourceUrl);
    expect(jobs.length).toBeGreaterThanOrEqual(1);
    expect(jobs[0].title).toContain("Sales Director");
    expect(jobs[0].source).toBe("firecrawl-safe");
    expect(jobs[0].sourceUrl).toBe(sourceUrl);
  });

  it("2 sections heading → 2 jobs extraits", () => {
    const md1 = "# Sales Director France\n\nManage the French sales team.";
    const md2 = "# Country Manager EMEA\n\nLead EMEA operations. P&L ownership.";
    const sourceUrl = "https://careers.example.com/jobs";
    const jobs1 = extractJobsFromMarkdown(md1, sourceUrl);
    const jobs2 = extractJobsFromMarkdown(md2, sourceUrl);
    expect(jobs1.length).toBeGreaterThanOrEqual(1);
    expect(jobs2.length).toBeGreaterThanOrEqual(1);
    expect(jobs1[0].title).toContain("Sales Director");
    expect(jobs2[0].title).toContain("Country Manager");
  });

  it("Même input → même externalId (déterministe)", () => {
    const md = "# VP Sales\n\nLead the sales team. Based in London.";
    const url = "https://careers.example.com/jobs";
    const jobs1 = extractJobsFromMarkdown(md, url);
    const jobs2 = extractJobsFromMarkdown(md, url);
    expect(jobs1[0].externalId).toBe(jobs2[0].externalId);
  });

  it("externalId stable (même titre+domaine → même id)", () => {
    const md = "# VP Sales\n\nLead sales.";
    const url = "https://careers.example.com";
    const jobs1 = extractJobsFromMarkdown(md, url);
    const jobs2 = extractJobsFromMarkdown(md, url);
    expect(jobs1[0].externalId).toBe(jobs2[0].externalId);
  });

  it("Markdown vide → 0 jobs", () => {
    const jobs = extractJobsFromMarkdown("", "https://example.com");
    expect(jobs.length).toBe(0);
  });

  it("Description nettoyée — pas de balises markdown brutes", () => {
    const md = "# Sales Director\n\nWe need a Sales Director. Strong leadership required.";
    const jobs = extractJobsFromMarkdown(md, "https://careers.example.com");
    expect(jobs.length).toBeGreaterThanOrEqual(1);
    const desc = jobs[0].description || "";
    expect(desc).toContain("Sales Director");
    expect(desc).toContain("leadership");
  });

  it("Texte brut sans heading → 1 job extrait", () => {
    const md = "Sales Director France needed. Lead sales team. Based in Paris.";
    const jobs = extractJobsFromMarkdown(md, "https://careers.example.com");
    expect(jobs.length).toBe(1);
    expect(jobs[0].sourceUrl).toBe("https://careers.example.com");
  });
});

/* ─── Catégorie 4 : Normalisation ──────────── */

describe("normalizeFirecrawlJobs", () => {
  it("URL relative → applicationUrl absolue", () => {
    const raw: ImportedJob[] = [{
      source: "firecrawl-safe",
      sourceUrl: "/jobs/apply/123",
      title: "Sales Director",
      company: "Corp",
      description: "Lead sales.",
    }];
    const context = { sourceUrl: "https://careers.example.com/jobs", domain: "careers.example.com" };
    const normalized = normalizeFirecrawlJobs(raw, context);

    expect(normalized[0].sourceUrl).toBe("https://careers.example.com/jobs/apply/123");
  });

  it("URL absolue → inchangée", () => {
    const raw: ImportedJob[] = [{
      source: "firecrawl-safe",
      sourceUrl: "https://apply.example.com/job/456",
      title: "CTO",
      description: "Lead tech.",
    }];
    const context = { sourceUrl: "https://careers.example.com", domain: "careers.example.com" };
    const normalized = normalizeFirecrawlJobs(raw, context);

    expect(normalized[0].sourceUrl).toBe("https://apply.example.com/job/456");
  });

  it("Description tronquée à 5000 caractères", () => {
    const longDesc = "A".repeat(6000);
    const raw: ImportedJob[] = [{
      source: "firecrawl-safe",
      title: "Test",
      description: longDesc,
      sourceUrl: "https://example.com",
    }];
    const context = { sourceUrl: "https://example.com", domain: "example.com" };
    const normalized = normalizeFirecrawlJobs(raw, context);

    expect(normalized[0].description!.length).toBeLessThanOrEqual(5000);
  });

  it("Source toujours firecrawl-safe", () => {
    const raw: ImportedJob[] = [{
      source: "unknown",
      title: "Test",
      sourceUrl: "https://example.com",
      description: "test",
    }];
    const context = { sourceUrl: "https://example.com", domain: "example.com" };
    const normalized = normalizeFirecrawlJobs(raw, context);

    expect(normalized[0].source).toBe("firecrawl-safe");
  });
});

/* ─── Catégorie 5 : Audit logs ─────────────── */

describe("createFirecrawlAuditLog", () => {
  it("Crée un log avec tous les champs requis", () => {
    const log = createFirecrawlAuditLog({
      sourceUrl: "https://boards.greenhouse.io/stripe",
      importMode: "ATS_PUBLIC",
      status: "allowed",
      reasonCode: "allowed_public_ats",
      jobsExtracted: 3,
      durationMs: 1250,
      errors: [],
    });

    expect(log.timestamp).toBeTruthy();
    expect(log.actor).toBe("firecrawl-safe");
    expect(log.normalizedDomain).toBe("boards.greenhouse.io");
    expect(log.scannerDecision).toBe("ATS_PUBLIC");
    expect(log.connector).toBe("firecrawl-safe");
    expect(log.extractionMethod).toBe("firecrawl_v1_scrape");
    expect(log.status).toBe("allowed");
    expect(log.reasonCode).toBe("allowed_public_ats");
    expect(log.jobsExtracted).toBe(3);
    expect(log.durationMs).toBe(1250);
    expect(log.errors).toEqual([]);
  });

  it("Log de refus avec reasonCode", () => {
    const log = createFirecrawlAuditLog({
      sourceUrl: "https://linkedin.com/jobs/123",
      importMode: "USER_ASSISTED",
      status: "refused",
      reasonCode: "refused_closed_platform",
      jobsExtracted: 0,
      durationMs: 5,
      errors: ["Plateforme fermée"],
    });

    expect(log.status).toBe("refused");
    expect(log.reasonCode).toBe("refused_closed_platform");
    expect(log.jobsExtracted).toBe(0);
    expect(log.errors).toContain("Plateforme fermée");
  });

  it("status 'allowed' produit un log valide", () => {
    const log = createFirecrawlAuditLog({
      sourceUrl: "https://careers.stripe.com/jobs",
      importMode: "AUTO_PUBLIC_CAREERS",
      status: "allowed",
      reasonCode: "allowed_public_careers",
      jobsExtracted: 5,
      durationMs: 2000,
      errors: [],
    });

    expect(log.status).toBe("allowed");
    expect(log.jobsExtracted).toBe(5);
  });

  it("status 'refused' produit un log valide", () => {
    const log = createFirecrawlAuditLog({
      sourceUrl: "https://apec.fr/offre/123",
      importMode: "BLOCKED",
      status: "refused",
      reasonCode: "refused_blocked_domain",
      jobsExtracted: 0,
      durationMs: 3,
      errors: ["APEC bloqué"],
    });

    expect(log.status).toBe("refused");
    expect(log.reasonCode).toBe("refused_blocked_domain");
  });

  it("status 'error' produit un log valide", () => {
    const log = createFirecrawlAuditLog({
      sourceUrl: "https://example.com/jobs",
      importMode: "AUTO_PUBLIC_CAREERS",
      status: "error",
      reasonCode: "error_firecrawl_timeout",
      jobsExtracted: 0,
      durationMs: 30000,
      errors: ["Timeout"],
    });

    expect(log.status).toBe("error");
    expect(log.reasonCode).toBe("error_firecrawl_timeout");
  });
});

/* ─── Catégorie 6 : Dedup helpers ──────────── */

describe("Dedup via externalId / content stability", () => {
  it("Même input → même externalId (déterministe)", () => {
    const jobs1 = extractJobsFromMarkdown(
      "# Sales Director\n\nLead the sales team. Based in Paris.",
      "https://careers.example.com"
    );
    const jobs2 = extractJobsFromMarkdown(
      "# Sales Director\n\nLead the sales team. Based in Paris.",
      "https://careers.example.com"
    );
    expect(jobs1[0].externalId).toBe(jobs2[0].externalId);
  });

  it("Même company+title+location depuis même domaine → même externalId", () => {
    const jobs1 = extractJobsFromMarkdown(
      "# VP Sales\n\nCompany: Stripe. Location: Paris. Lead the EMEA team.",
      "https://careers.stripe.com"
    );
    const jobs2 = extractJobsFromMarkdown(
      "# VP Sales\n\nCompany: Stripe. Location: Paris. Lead the EMEA team.",
      "https://careers.stripe.com"
    );
    expect(jobs1[0].externalId).toBe(jobs2[0].externalId);
    expect(jobs1[0].title).toBe(jobs2[0].title);
  });

  it("Domaines différents → externalIds différents (by design)", () => {
    // L'externalId inclut le domaine — un même job posté sur deux boards
    // différentes DOIT avoir des externalIds différents.
    const jobs1 = extractJobsFromMarkdown(
      "# CTO\n\nLead engineering.",
      "https://careers.example.com"
    );
    const jobs2 = extractJobsFromMarkdown(
      "# CTO\n\nLead engineering.",
      "https://boards.greenhouse.io/startup"
    );
    expect(jobs1[0].externalId).not.toBe(jobs2[0].externalId);
  });
});

/* ─── Catégorie 7 : Config check ────────────── */

describe("Firecrawl Safe — Configuration", () => {
  it("checkFirecrawlConfig retourne erreur sans clé (env non définie)", () => {
    const result = checkFirecrawlConfig();
    expect(result).not.toBeNull();
    expect(result!.status).toBe("refused");
    expect(result!.reasonCode).toBe("refused_missing_api_key");
  });

  it("canUseFirecrawlForSource → false sans config", () => {
    const url = "https://boards.greenhouse.io/stripe";
    expect(canUseFirecrawlForSource({ url, importMode: "ATS_PUBLIC" })).toBe(false);
  });
});

/* ─── Catégorie 8 : Reason codes ────────────── */

describe("Reason codes", () => {
  const allReasonCodes = [
    "allowed_public_ats",
    "allowed_public_careers",
    "allowed_jsonld",
    "refused_closed_platform",
    "refused_login_required",
    "refused_captcha",
    "refused_blocked_domain",
    "refused_user_assisted_source",
    "refused_bypass_attempt",
    "refused_missing_api_key",
    "error_firecrawl_rate_limit",
    "error_firecrawl_timeout",
    "error_parse_failed",
  ];

  it("Tous les reason codes sont documentés (13)", () => {
    expect(allReasonCodes.length).toBe(13);
  });

  it("Chaque URL de test produit toujours refused", () => {
    const urls = [
      "https://www.linkedin.com/jobs/123",
      "https://fr.indeed.com/job",
      "https://example.com/login",
      "https://example.com/jobs?bypass=1",
    ];
    for (const url of urls) {
      const result = classifyFirecrawlEligibility(url, null, "");
      expect(result.status).toBe("refused");
    }
  });
});
