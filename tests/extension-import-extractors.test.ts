import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

import {
  hashUrlForExternalId,
  detectPlatformFromUrl,
  platformLabel,
  computeExtractionConfidence,
  cleanVisibleText,
  validateAssistedImportPayload,
  isLoginOrCaptchaVisible,
  buildAssistedImportPreview,
  extractLinkedInJobPosting,
  extractIndeedJobPosting,
  extractApecJobPosting,
  extractLinkedInJobCards,
  extractIndeedJobCards,
  extractApecJobCards,
  isParasiteTitle,
  isParasiteCompany,
  cleanLocationText,
} from "@/lib/jobs/assisted-import-extractors";
import type { AssistedImportPayload } from "@/lib/jobs/assisted-import-extractors";

const FIXTURES = resolve(import.meta.dirname, "fixtures/assisted-import");

function readFixture(name: string): string {
  return readFileSync(resolve(FIXTURES, name), "utf-8");
}

/* ─── Category 1: Platform detection ────────── */

describe("detectPlatformFromUrl", () => {
  it("detects LinkedIn URLs", () => {
    expect(detectPlatformFromUrl("https://www.linkedin.com/jobs/view/123")).toBe("linkedin");
    expect(detectPlatformFromUrl("https://fr.linkedin.com/jobs/")).toBe("linkedin");
  });

  it("detects Indeed URLs", () => {
    expect(detectPlatformFromUrl("https://fr.indeed.com/viewjob?jk=abc")).toBe("indeed");
    expect(detectPlatformFromUrl("https://www.indeed.com/jobs")).toBe("indeed");
  });

  it("detects APEC URLs", () => {
    expect(detectPlatformFromUrl("https://www.apec.fr/candidat/recherche-emploi.html")).toBe("apec");
    expect(detectPlatformFromUrl("https://www.apec.fr/recruteur/")).toBe("apec");
  });

  it("detects Greenhouse URLs", () => {
    expect(detectPlatformFromUrl("https://boards.greenhouse.io/stripe")).toBe("greenhouse");
  });

  it("detects Lever URLs", () => {
    expect(detectPlatformFromUrl("https://jobs.lever.co/palantir")).toBe("lever");
  });

  it("detects generic URLs", () => {
    expect(detectPlatformFromUrl("https://www.example.com/careers")).toBe("generic");
  });
});

describe("platformLabel", () => {
  it("returns human-readable names", () => {
    expect(platformLabel("linkedin")).toBe("LinkedIn");
    expect(platformLabel("indeed")).toBe("Indeed");
    expect(platformLabel("apec")).toBe("APEC");
    expect(platformLabel("wttj")).toBe("Welcome to the Jungle");
  });
});

/* ─── Category 2: Confidence scoring ────────── */

describe("computeExtractionConfidence", () => {
  it("returns high score when all required fields present", () => {
    const c = computeExtractionConfidence({
      title: "Directeur Commercial",
      company: "Acme Corp",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Description complète du poste.",
    });
    expect(c.score).toBe(75);
    expect(c.details.title).toBe(true);
    expect(c.details.company).toBe(true);
    expect(c.details.description).toBe(true);
    expect(c.presentCount).toBeGreaterThanOrEqual(3);
  });

  it("returns lower score when company missing", () => {
    const c = computeExtractionConfidence({
      title: "Directeur Commercial",
      description: "Description complète.",
    });
    expect(c.score).toBeLessThan(60);
    expect(c.details.company).toBe(false);
  });

  it("returns very low score when title missing", () => {
    const c = computeExtractionConfidence({ company: "Acme", description: "Desc" });
    expect(c.score).toBeLessThan(50);
  });

  it("optional fields increase score", () => {
    const withoutOpt = computeExtractionConfidence({ title: "T", company: "C", description: "D" });
    const withOpt = computeExtractionConfidence({
      title: "T", company: "C", description: "D",
      location: "Paris", applicationUrl: "https://example.com", postedAt: "2026-06-01",
    });
    expect(withOpt.score).toBeGreaterThan(withoutOpt.score);
  });

  it("empty strings count as missing", () => {
    const c = computeExtractionConfidence({ title: "", company: "Acme", description: "" });
    expect(c.details.title).toBe(false);
    expect(c.details.description).toBe(false);
  });
});

/* ─── Category 3: Text cleaning ─────────────── */

describe("cleanVisibleText", () => {
  it("removes cookie/privacy lines", () => {
    const text = "Job description\nAccept all cookies\nManage preferences\nQualifications";
    const cleaned = cleanVisibleText(text);
    expect(cleaned).not.toContain("Accept all cookies");
    expect(cleaned).not.toContain("Manage preferences");
    expect(cleaned).toContain("Job description");
  });

  it("removes LinkedIn/Indeed artifacts", () => {
    const text = "Job\ntitle\nLinkedIn Corporation\n© 2026\nDescription";
    const cleaned = cleanVisibleText(text);
    expect(cleaned).not.toContain("LinkedIn Corporation");
    expect(cleaned).not.toContain("© 2026");
  });

  it("returns empty for empty input", () => {
    expect(cleanVisibleText("")).toBe("");
  });
});

/* ─── Category 4: Validation ────────────────── */

describe("validateAssistedImportPayload", () => {
  const validPayload: AssistedImportPayload = {
    platform: "linkedin",
    sourceUrl: "https://www.linkedin.com/jobs/view/123",
    visibleOnly: true,
    jobs: [{ title: "Directeur Commercial", company: "Acme Corp", sourceUrl: "https://www.linkedin.com/jobs/view/123" }],
  };

  it("accepts valid payload", () => {
    expect(validateAssistedImportPayload(validPayload).valid).toBe(true);
  });

  it("rejects empty jobs array", () => {
    const r = validateAssistedImportPayload({ ...validPayload, jobs: [] });
    expect(r.valid).toBe(false);
    expect(r.reasonCode).toBe("assisted_missing_required_fields");
  });

  it("rejects missing sourceUrl", () => {
    const r = validateAssistedImportPayload({ ...validPayload, sourceUrl: "" });
    expect(r.valid).toBe(false);
  });

  it("rejects missing title", () => {
    const r = validateAssistedImportPayload({
      ...validPayload,
      jobs: [{ title: "", company: "Acme", sourceUrl: "http://example.com" }],
    });
    expect(r.valid).toBe(false);
    expect(r.reasonCode).toBe("assisted_missing_required_fields");
  });

  it("allows missing company (warning, not rejection)", () => {
    const r = validateAssistedImportPayload({
      ...validPayload,
      jobs: [{ title: "Job", company: "", sourceUrl: "http://example.com" }],
    });
    expect(r.valid).toBe(true);
  });

  it("rejects more than 10 jobs", () => {
    const jobs = Array.from({ length: 11 }, (_, i) => ({ title: `Job ${i}`, company: "Acme", sourceUrl: "http://ex.com" }));
    const r = validateAssistedImportPayload({ ...validPayload, jobs });
    expect(r.valid).toBe(false);
  });
});

/* ─── Category 5: Login/CAPTCHA detection ────── */

describe("isLoginOrCaptchaVisible", () => {
  it("detects CAPTCHA text", () => {
    expect(isLoginOrCaptchaVisible("Please complete the captcha to continue")).toBe(true);
    expect(isLoginOrCaptchaVisible("g-recaptcha widget on page")).toBe(true);
  });

  it("detects login wall text", () => {
    expect(isLoginOrCaptchaVisible("Sign in to view this job posting")).toBe(true);
    expect(isLoginOrCaptchaVisible("Connectez-vous pour voir cette offre")).toBe(true);
  });

  it("detects Cloudflare challenge", () => {
    expect(isLoginOrCaptchaVisible("Just a moment... checking your browser")).toBe(true);
  });

  it("returns false for normal job text", () => {
    expect(isLoginOrCaptchaVisible("Directeur Commercial — Paris — CDI")).toBe(false);
    expect(isLoginOrCaptchaVisible("We are looking for a great candidate")).toBe(false);
  });
});

/* ─── Category 6: Fixture-based detection ────── */

describe("Fixture login/CAPTCHA detection", () => {
  it("login-wall.html contains login text", () => {
    const html = readFixture("login-wall.html");
    expect(isLoginOrCaptchaVisible(html)).toBe(true);
  });

  it("captcha.html contains CAPTCHA text", () => {
    const html = readFixture("captcha.html");
    expect(isLoginOrCaptchaVisible(html)).toBe(true);
  });

  it("linkedin-job.html does not trigger login/captcha", () => {
    const html = readFixture("linkedin-job.html");
    expect(isLoginOrCaptchaVisible(html)).toBe(false);
  });
});

/* ─── Category 7: LinkedIn extraction ────────── */

describe("extractLinkedInJobPosting", () => {
  it("extracts title, company, location, description", () => {
    const job = extractLinkedInJobPosting({
      pageTitle: "Directeur Commercial — H/F | LinkedIn",
      jobTitleText: "Directeur Commercial — H/F",
      companyText: "Schneider Electric",
      locationText: "Rueil-Malmaison, Île-de-France, France",
      descriptionText: "Schneider Electric recherche un Directeur Commercial pour piloter la stratégie de croissance.",
      url: "https://www.linkedin.com/jobs/view/123",
    });
    expect(job.source).toBe("linkedin");
    expect(job.title).toBe("Directeur Commercial — H/F");
    expect(job.company).toBe("Schneider Electric");
    expect(job.location).toContain("Rueil-Malmaison");
    expect(job.description).toContain("Schneider Electric");
    expect(job.sourceUrl).toBe("https://www.linkedin.com/jobs/view/123");
  });

  it("falls back to pageTitle when jobTitleText empty", () => {
    const job = extractLinkedInJobPosting({
      pageTitle: "Head of Sales | LinkedIn",
      jobTitleText: "",
      companyText: "Datadog",
      locationText: "Paris",
      descriptionText: "Description.",
      url: "https://www.linkedin.com/jobs/view/456",
    });
    expect(job.title).toBe("Head of Sales");
  });
});

/* ─── Category 8: Indeed extraction ──────────── */

describe("extractIndeedJobPosting", () => {
  it("extracts title, company, location, description", () => {
    const job = extractIndeedJobPosting({
      pageTitle: "Head of Sales EMEA - Datadog - Indeed",
      jobTitleText: "Head of Sales EMEA",
      companyText: "Datadog",
      locationText: "Paris (75)",
      descriptionText: "Datadog is looking for a Head of Sales EMEA.",
      url: "https://fr.indeed.com/viewjob?jk=abc",
      salaryText: "120 000 EUR par an",
    });
    expect(job.source).toBe("indeed");
    expect(job.title).toBe("Head of Sales EMEA");
    expect(job.company).toBe("Datadog");
    expect(job.location).toBe("Paris (75)");
    expect(job.salaryMin).toBe(120000);
  });

  it("parses salary correctly", () => {
    const job = extractIndeedJobPosting({
      pageTitle: "Test",
      jobTitleText: "Developer",
      companyText: "Co",
      locationText: "Paris",
      descriptionText: "Desc.",
      url: "https://fr.indeed.com/job",
      salaryText: "45 000 EUR par an",
    });
    expect(job.salaryMin).toBe(45000);
  });

  it("extracts employmentType and remotePolicy", () => {
    const job = extractIndeedJobPosting({
      pageTitle: "Key Account Manager - Uptoo - Indeed",
      jobTitleText: "Key Account Manager GMS France & Export H/F",
      companyText: "Uptoo",
      locationText: "13000 Marseille",
      descriptionText: "Description du poste.",
      url: "https://fr.indeed.com/viewjob?jk=abc123",
      salaryText: "De 65000 € à 89000 € par an",
      employmentType: "CDI / Temps plein",
      remotePolicy: "Télétravail partiel",
    });
    expect(job.title).toBe("Key Account Manager GMS France & Export H/F");
    expect(job.company).toBe("Uptoo");
    expect(job.location).toBe("13000 Marseille");
    expect(job.salaryMin).toBe(65000);
    expect(job.contractType).toBe("CDI / Temps plein");
    expect(job.remotePolicy).toBe("Télétravail partiel");
  });
});

/* ─── Category 8b: Indeed anti-parasite filters ── */

describe("isParasiteTitle", () => {
  it("rejects 'Bienvenue, ELTON'", () => {
    expect(isParasiteTitle("Bienvenue, ELTON")).toBe(true);
  });

  it("rejects 'Bienvenue'", () => {
    expect(isParasiteTitle("Bienvenue")).toBe(true);
  });

  it("rejects 'Détails de l'emploi'", () => {
    expect(isParasiteTitle("Détails de l'emploi")).toBe(true);
  });

  it("rejects 'Emplois recommandés'", () => {
    expect(isParasiteTitle("Emplois recommandés")).toBe(true);
  });

  it("rejects 'Salaire'", () => {
    expect(isParasiteTitle("Salaire")).toBe(true);
  });

  it("rejects 'Continuer pour postuler'", () => {
    expect(isParasiteTitle("Continuer pour postuler")).toBe(true);
  });

  it("rejects 'Candidature simplifiée'", () => {
    expect(isParasiteTitle("Candidature simplifiée")).toBe(true);
  });

  it("accepts real job titles", () => {
    expect(isParasiteTitle("Key Account Manager GMS France & Export H/F")).toBe(false);
  });

  it("accepts 'Senior Developer'", () => {
    expect(isParasiteTitle("Senior Developer")).toBe(false);
  });

  it("returns true for null/empty", () => {
    expect(isParasiteTitle(null)).toBe(true);
    expect(isParasiteTitle("")).toBe(true);
    expect(isParasiteTitle("  ")).toBe(true);
  });
});

describe("isParasiteCompany", () => {
  it("rejects 'CDI' as company", () => {
    expect(isParasiteCompany("CDI")).toBe(true);
  });

  it("rejects 'Temps plein' as company", () => {
    expect(isParasiteCompany("Temps plein")).toBe(true);
  });

  it("rejects 'Télétravail' as company", () => {
    expect(isParasiteCompany("Télétravail")).toBe(true);
  });

  it("rejects 'Annonce' as company", () => {
    expect(isParasiteCompany("Annonce")).toBe(true);
  });

  it("accepts real company names", () => {
    expect(isParasiteCompany("Uptoo")).toBe(false);
  });

  it("accepts 'Schneider Electric'", () => {
    expect(isParasiteCompany("Schneider Electric")).toBe(false);
  });

  it("returns false for empty (not a parasite, just missing)", () => {
    expect(isParasiteCompany("")).toBe(false);
    expect(isParasiteCompany(null)).toBe(false);
  });
});

describe("cleanLocationText", () => {
  it("separates merged company+location 'Uptoo13000 Marseille' → '13000 Marseille'", () => {
    expect(cleanLocationText("Uptoo13000 Marseille", "Uptoo")).toBe("13000 Marseille");
  });

  it("separates merged company+location 'Uptoo 13000 Marseille'", () => {
    expect(cleanLocationText("Uptoo 13000 Marseille", "Uptoo")).toBe("13000 Marseille");
  });

  it("preserves clean location '13000 Marseille'", () => {
    expect(cleanLocationText("13000 Marseille")).toBe("13000 Marseille");
  });

  it("strips 'Télétravail partiel' suffix from location", () => {
    expect(cleanLocationText("13000 Marseille, Télétravail partiel")).toBe("13000 Marseille");
  });

  it("strips 'Télétravail' suffix", () => {
    expect(cleanLocationText("Paris — Télétravail")).toBe("Paris");
  });

  it("returns empty for empty input", () => {
    expect(cleanLocationText("")).toBe("");
    expect(cleanLocationText(null)).toBe("");
  });
});

describe("extractIndeedJobPosting anti-parasite", () => {
  it("filters parasite title and falls back to page title", () => {
    const job = extractIndeedJobPosting({
      pageTitle: "Key Account Manager - Uptoo - Indeed",
      jobTitleText: "Bienvenue, ELTON",
      companyText: "Uptoo",
      locationText: "13000 Marseille",
      descriptionText: "Description.",
      url: "https://fr.indeed.com/viewjob?jk=abc",
    });
    expect(job.title).toBe("Key Account Manager");
  });

  it("filters parasite company", () => {
    const job = extractIndeedJobPosting({
      pageTitle: "Key Account Manager - Indeed",
      jobTitleText: "Key Account Manager GMS",
      companyText: "CDI",
      locationText: "13000 Marseille",
      descriptionText: "Description.",
      url: "https://fr.indeed.com/viewjob?jk=abc",
    });
    expect(job.company).toBe("");
  });

  it("cleans merged company+location", () => {
    const job = extractIndeedJobPosting({
      pageTitle: "Key Account Manager - Uptoo - Indeed",
      jobTitleText: "Key Account Manager GMS France & Export H/F",
      companyText: "Uptoo",
      locationText: "Uptoo13000 Marseille",
      descriptionText: "Description.",
      url: "https://fr.indeed.com/viewjob?jk=abc",
    });
    expect(job.company).toBe("Uptoo");
    expect(job.location).toBe("13000 Marseille");
  });
});

/* ─── Category 8c: Indeed side panel extracted data ─── */

describe("Indeed side panel extraction confidence", () => {
  it("reaches 75+ when title+company+location+description present", () => {
    const job = extractIndeedJobPosting({
      pageTitle: "Key Account Manager GMS France & Export H/F - Uptoo - Indeed",
      jobTitleText: "Key Account Manager GMS France & Export H/F",
      companyText: "Uptoo",
      locationText: "13000 Marseille",
      descriptionText: "Uptoo recrute un Key Account Manager GMS pour son bureau de Marseille.",
      url: "https://fr.indeed.com/viewjob?jk=abc123",
      salaryText: "De 65000 € à 89000 € par an",
      employmentType: "CDI / Temps plein",
      remotePolicy: "Télétravail partiel",
    });
    const conf = computeExtractionConfidence(job);
    expect(conf.score).toBeGreaterThanOrEqual(75);
    expect(conf.details.title).toBe(true);
    expect(conf.details.company).toBe(true);
    expect(conf.details.description).toBe(true);
    expect(conf.details.location).toBe(true);
  });
});

/* ─── Category 9: APEC extraction ────────────── */

describe("extractApecJobPosting", () => {
  it("extracts title, company, location, contract type", () => {
    const job = extractApecJobPosting({
      pageTitle: "Directeur des Ventes — APEC",
      jobTitleText: "Directeur des Ventes",
      companyText: "L'Oréal",
      locationText: "Levallois-Perret (92)",
      descriptionText: "L'Oréal recrute un Directeur des Ventes.",
      url: "https://www.apec.fr/offre/123",
      contractType: "CDI",
      salaryText: "90 000 à 110 000 EUR/an",
    });
    expect(job.source).toBe("apec");
    expect(job.title).toBe("Directeur des Ventes");
    expect(job.company).toBe("L'Oréal");
    expect(job.contractType).toBe("CDI");
    expect(job.salaryMin).toBe(90000);
    expect(job.salaryMax).toBe(110000);
  });
});

/* ─── Category 10: Job cards extraction ──────── */

describe("extractLinkedInJobCards", () => {
  it("limits to 10 cards", () => {
    const cards = Array.from({ length: 15 }, (_, i) => ({
      title: `Job ${i}`,
      company: `Company ${i}`,
      location: `Paris ${i}`,
      url: `https://linkedin.com/jobs/${i}`,
    }));
    const result = extractLinkedInJobCards(cards);
    expect(result).toHaveLength(10);
  });

  it("includes confidence and platform", () => {
    const result = extractLinkedInJobCards([
      { title: "Dir Commercial", company: "Acme", location: "Paris", url: "https://linkedin.com/jobs/1" },
    ]);
    expect(result[0].platform).toBe("linkedin");
    expect(result[0].extractionConfidence).toBeDefined();
    expect(result[0].extractionConfidence.score).toBeGreaterThan(0);
  });

  it("adds warning when URL missing", () => {
    const result = extractLinkedInJobCards([
      { title: "Job", company: "Co", location: "Paris", url: undefined },
    ]);
    expect(result[0].warnings.length).toBeGreaterThan(0);
  });
});

describe("extractIndeedJobCards", () => {
  it("limits to 10 and includes platform", () => {
    const cards = Array.from({ length: 12 }, (_, i) => ({
      title: `Indeed Job ${i}`,
      company: `Co ${i}`,
      location: "Paris",
      url: "https://indeed.com/job/",
    }));
    const result = extractIndeedJobCards(cards);
    expect(result).toHaveLength(10);
    expect(result[0].platform).toBe("indeed");
  });
});

describe("extractApecJobCards", () => {
  it("adds warning when company missing", () => {
    const result = extractApecJobCards([
      { title: "Job", company: "", location: "Paris" },
    ]);
    expect(result[0].warnings.length).toBeGreaterThan(0);
    expect(result[0].warnings[0]).toContain("Entreprise");
  });
});

/* ─── Category 11: buildAssistedImportPreview ── */

describe("buildAssistedImportPreview", () => {
  it("builds preview with duplicates map", () => {
    const jobs = [{
      source: "linkedin",
      sourceUrl: "https://linkedin.com/jobs/1",
      title: "Director",
      company: "Co",
      location: "Paris",
      description: "Desc",
      externalId: "linkedin::abc",
    }];
    const preview = buildAssistedImportPreview("linkedin", "https://linkedin.com/jobs/1", jobs, { "linkedin::abc": "existing-job-id" });
    expect(preview.platform).toBe("linkedin");
    expect(preview.extractionMethod).toBe("USER_ASSISTED_EXTENSION");
    expect(preview.visibleOnly).toBe(true);
    expect(preview.jobs[0].duplicate?.isDuplicate).toBe(true);
    expect(preview.jobs[0].duplicate?.existingId).toBe("existing-job-id");
  });

  it("marks non-duplicate jobs correctly", () => {
    const jobs = [{
      source: "indeed",
      sourceUrl: "https://indeed.com/job",
      title: "Manager",
      company: "Corp",
      location: "Lyon",
      description: "Description",
      externalId: "indeed::xyz",
    }];
    const preview = buildAssistedImportPreview("indeed", "https://indeed.com/job", jobs, {});
    expect(preview.jobs[0].duplicate?.isDuplicate).toBe(false);
  });
});

/* ─── Category 12: Edge cases ───────────────── */

describe("Edge cases", () => {
  it("computeExtractionConfidence handles empty object", () => {
    const c = computeExtractionConfidence({});
    expect(c.score).toBe(0);
    expect(c.presentCount).toBe(0);
  });

  it("cleanVisibleText handles null gracefully", () => {
    expect(cleanVisibleText(null as unknown as string)).toBe("");
  });

  it("detectPlatformFromUrl handles empty string", () => {
    expect(detectPlatformFromUrl("")).toBe("generic");
  });

  it("validateAssistedImportPayload handles jobs inheriting sourceUrl", () => {
    const payload: AssistedImportPayload = {
      platform: "indeed",
      sourceUrl: "https://indeed.com/page",
      visibleOnly: true,
      jobs: [{ title: "Manager", company: "Corp" }],
    };
    // Jobs without their own sourceUrl are valid because the payload has it
    expect(validateAssistedImportPayload(payload).valid).toBe(true);
  });
});

/* ─── Category 13: LinkedIn search-results side panel extraction ── */

describe("LinkedIn search-results side panel extraction", () => {
  it("extracts title from side panel h1 (search-results pattern)", () => {
    const job = extractLinkedInJobPosting({
      pageTitle: "Sales Country Manager - France, Remote | LinkedIn",
      jobTitleText: "Sales Country Manager - France, Remote",
      companyText: "Wildix",
      locationText: "France / Remote",
      descriptionText: "Wildix is looking for a Sales Country Manager to lead our expansion in France. You will be responsible for driving revenue growth and building partner relationships.",
      url: "https://www.linkedin.com/jobs/search/?currentJobId=123",
    });
    expect(job.source).toBe("linkedin");
    expect(job.title).toBe("Sales Country Manager - France, Remote");
    expect(job.company).toBe("Wildix");
    expect(job.location).toContain("France");
    expect(job.description).toContain("Wildix");
    expect(job.sourceUrl).toContain("jobs/search/");
  });

  it("handles company extracted from link text near title", () => {
    // The popup.js content script trims text before passing to the extractor.
    // The extractor module receives already-trimmed strings from the DOM.
    const job = extractLinkedInJobPosting({
      pageTitle: "(2) Sales Country Manager | LinkedIn",
      jobTitleText: "Sales Country Manager - France, Remote",
      companyText: "Wildix",
      locationText: "France",
      descriptionText: "Job description here.",
      url: "https://www.linkedin.com/jobs/search/?currentJobId=456",
    });
    expect(job.company).toBe("Wildix");
  });

  it("handles location with Remote keyword (search-results pattern)", () => {
    const job = extractLinkedInJobPosting({
      pageTitle: "DevOps Engineer | LinkedIn",
      jobTitleText: "DevOps Engineer",
      companyText: "Acme",
      locationText: "Remote / France",
      descriptionText: "DevOps role",
      url: "https://www.linkedin.com/jobs/search/?currentJobId=789",
    });
    expect(job.location).toContain("Remote");
    expect(job.location).toContain("France");
  });

  it("falls back to page title when h1 text is empty", () => {
    const job = extractLinkedInJobPosting({
      pageTitle: "Senior Developer - Wildix | LinkedIn",
      jobTitleText: "",
      companyText: "Wildix",
      locationText: "Paris",
      descriptionText: "Job details",
      url: "https://www.linkedin.com/jobs/search/?currentJobId=101",
    });
    expect(job.title).toBe("Senior Developer - Wildix");
  });

  it("extracts description with 'About the job' text", () => {
    const job = extractLinkedInJobPosting({
      pageTitle: "Sales Manager | LinkedIn",
      jobTitleText: "Sales Manager",
      companyText: "Corp",
      locationText: "Lyon",
      descriptionText: "About the job\n\nWe are hiring a Sales Manager to lead our team. Responsibilities include strategy and execution.",
      url: "https://www.linkedin.com/jobs/search/?currentJobId=202",
    });
    expect(job.description).toContain("Sales Manager");
    expect(job.description).toContain("About the job");
  });
});

/* ─── Category 14: hashUrlForExternalId ─────────── */

describe("hashUrlForExternalId", () => {
  it("produces stable, unique IDs for different URLs", () => {
    const id1 = hashUrlForExternalId("https://www.linkedin.com/jobs/view/4069200600/");
    const id2 = hashUrlForExternalId("https://www.linkedin.com/jobs/view/4069200601/");
    // Same domain prefix, different IDs
    expect(id1).not.toBe(id2);
    // Deterministic
    expect(hashUrlForExternalId("https://www.linkedin.com/jobs/view/4069200600/")).toBe(id1);
  });

  it("produces IDs with correct prefix length", () => {
    const id = hashUrlForExternalId("https://example.com/job/123");
    expect(id.length).toBeLessThanOrEqual(32);
    expect(id.length).toBeGreaterThan(10);
  });

  it("does not truncate the unique part (original bug regression)", () => {
    // The old base64 method Buffer.from(url).toString("base64").slice(0, 40)
    // produced identical prefixes for long URLs with similar beginnings.
    // SHA-256 ensures every character of the URL affects the output.
    const urls = [
      "https://www.linkedin.com/jobs/view/1111111111/?refId=abc",
      "https://www.linkedin.com/jobs/view/2222222222/?refId=def&tracking=xyz",
      "https://www.linkedin.com/jobs/search/?currentJobId=3333333333&keywords=sales",
    ];
    const ids = urls.map((u) => hashUrlForExternalId(u));
    expect(new Set(ids).size).toBe(3);
  });
});

/* ─── Category 15: cleanVisibleText server-side filtering ── */

describe("cleanVisibleText server-side filtering", () => {
  it("strips 'Easy Apply' and login/privacy lines (server-side)", () => {
    const noisy = "Easy Apply\nSenior Developer\nJoin now\nAt Company X\nParis\nSign in\nCookies\nPrivacy";
    const cleaned = cleanVisibleText(noisy);
    // Server-side patterns strip these
    expect(cleaned).not.toMatch(/Easy Apply/i);
    expect(cleaned).not.toMatch(/Join now/i);
    expect(cleaned).not.toMatch(/Sign in/i);
    expect(cleaned).not.toMatch(/Cookies/i);
    expect(cleaned).not.toMatch(/Privacy/i);
    // Real content preserved
    expect(cleaned).toContain("Senior Developer");
    expect(cleaned).toContain("At Company X");
    expect(cleaned).toContain("Paris");
  });

  it("strips LinkedIn boilerplate patterns", () => {
    const text = "LinkedIn\nLinkedIn Corporation\n© 2025 All rights reserved\nSenior Dev\nParis";
    const cleaned = cleanVisibleText(text);
    expect(cleaned).not.toContain("LinkedIn Corporation");
    expect(cleaned).not.toContain("All rights reserved");
    expect(cleaned).not.toMatch(/© \d{4}/);
    expect(cleaned).toContain("Senior Dev");
    expect(cleaned).toContain("Paris");
  });

  it("does not strip legitimate company names and locations", () => {
    const text = "Wildix\nParis et périphérie\nRemote / France\nSales Country Manager";
    const cleaned = cleanVisibleText(text);
    expect(cleaned).toContain("Wildix");
    expect(cleaned).toContain("Paris");
    expect(cleaned).toContain("Remote");
    expect(cleaned).toContain("France");
    expect(cleaned).toContain("Sales Country Manager");
  });
});

/* ─── Category 16: Security — no cookies / no auto-scroll / no submit ── */

describe("Security invariants for popup.js extractors", () => {
  it("extractor functions do not reference document.cookie", () => {
    // All extraction functions in the extraction module are pure functions.
    // The popup.js content scripts use only querySelector/textContent.
    // This test validates that the core extraction functions in the module
    // take raw data objects (not DOM), ensuring no cookie access.
    const fn = extractLinkedInJobPosting.toString();
    expect(fn).not.toContain("document.cookie");
    expect(fn).not.toContain("localStorage");
    expect(fn).not.toContain("sessionStorage");
  });

  it("detectPlatformFromUrl correctly identifies search-results page as linkedin", () => {
    expect(detectPlatformFromUrl("https://www.linkedin.com/jobs/search/?currentJobId=123&keywords=sales")).toBe("linkedin");
    expect(detectPlatformFromUrl("https://fr.linkedin.com/jobs/collection/")).toBe("linkedin");
  });

  it("no submit or auto-apply referenced in server-side extractors", () => {
    const fn = extractLinkedInJobPosting.toString();
    expect(fn).not.toContain(".submit");
    expect(fn).not.toContain(".apply");
    expect(fn).not.toContain("window.location");
  });

  it("no auto-scroll referenced in server-side extractors", () => {
    const fn = extractLinkedInJobPosting.toString();
    expect(fn).not.toContain("scrollTo");
    expect(fn).not.toContain("scrollBy");
    expect(fn).not.toContain("auto-scroll");
  });
});
