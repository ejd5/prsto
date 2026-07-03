import { describe, it, expect } from "vitest";
import { classifySource } from "@/lib/market-radar/source-classifier";
import { sanitizeJobDescription, normalizeJobTitle, normalizeCompanyName, normalizeLocation, normalizeJobPosting } from "@/lib/market-radar/normalizer";
import { buildSearchQueriesFromProfile } from "@/lib/market-radar/query-builder";
import { scoreJobAgainstProfile } from "@/lib/market-radar/scoring";
import { detectRadarDuplicate } from "@/lib/market-radar/dedupe";
import { priorityFromScore, priorityLabel } from "@/lib/market-radar/types";
import type { NormalizedJobPosting, RadarProfile } from "@/lib/market-radar/types";

/* ── Source Classifier ── */

describe("classifySource", () => {
  it("LinkedIn → assisted_url", () => {
    expect(classifySource("https://www.linkedin.com/jobs/view/123")).toBe("assisted_url");
  });
  it("Indeed → assisted_url", () => {
    expect(classifySource("https://fr.indeed.com/viewjob?jk=abc")).toBe("assisted_url");
    expect(classifySource("https://indeed.com/job/123")).toBe("assisted_url");
  });
  it("APEC → assisted_url", () => {
    expect(classifySource("https://www.apec.fr/candidat/recherche-emploi.html")).toBe("assisted_url");
  });
  it("Greenhouse → ats_public", () => {
    expect(classifySource("https://boards.greenhouse.io/company/jobs/123")).toBe("ats_public");
  });
  it("Lever → ats_public", () => {
    expect(classifySource("https://jobs.lever.co/startup/abc")).toBe("ats_public");
    expect(classifySource("https://lever.co/company")).toBe("ats_public");
  });
  it("SmartRecruiters → ats_public", () => {
    expect(classifySource("https://jobs.smartrecruiters.com/Company/123")).toBe("ats_public");
  });
  it("Ashby → ats_public", () => {
    expect(classifySource("https://jobs.ashbyhq.com/company/abc")).toBe("ats_public");
  });
  it("Workable → ats_public", () => {
    expect(classifySource("https://apply.workable.com/company/j/ABC")).toBe("ats_public");
  });
  it("Recruitee → ats_public", () => {
    expect(classifySource("https://company.recruitee.com/o/job")).toBe("ats_public");
  });
  it("France Travail → official_api", () => {
    expect(classifySource("https://api.francetravail.fr/offres/123")).toBe("official_api");
  });
  it("random company site → career_page", () => {
    expect(classifySource("https://techcorp.com/careers/director")).toBe("career_page");
  });
  it("empty url → career_page", () => {
    expect(classifySource("")).toBe("career_page");
  });
});

/* ── Normalizer ── */

describe("sanitizeJobDescription", () => {
  it("removes HTML tags", () => {
    const r = sanitizeJobDescription("<p>Description</p><br>Suite");
    expect(r).not.toContain("<p>");
    expect(r).not.toContain("<br>");
    expect(r).toContain("Description");
  });
  it("removes Markdown bold", () => {
    const r = sanitizeJobDescription("**Important** poste");
    expect(r).not.toContain("**");
    expect(r).toContain("Important");
  });
  it("removes Markdown headers", () => {
    const r = sanitizeJobDescription("### Profil\nExpérience requise");
    expect(r).not.toContain("###");
  });
  it("collapses whitespace", () => {
    const r = sanitizeJobDescription("A   B\n\n\nC");
    expect(r).toBe("A B\n\nC");
  });
});

describe("normalizeJobTitle", () => {
  it("removes H/F suffix", () => {
    expect(normalizeJobTitle("Directeur Commercial H/F")).toBe("Directeur Commercial");
    expect(normalizeJobTitle("Sales Director (F/H)")).toBe("Sales Director");
  });
  it("trims whitespace", () => {
    expect(normalizeJobTitle("  VP Sales  ")).toBe("VP Sales");
  });
});

describe("normalizeCompanyName", () => {
  it("removes country code suffix", () => {
    expect(normalizeCompanyName("TechCorp (FR)")).toBe("TechCorp");
  });
  it("removes legal entity suffix", () => {
    expect(normalizeCompanyName("Startup SAS")).toBe("Startup");
    expect(normalizeCompanyName("BigCorp Ltd.")).toBe("BigCorp");
  });
});

describe("normalizeLocation", () => {
  it("removes parentheticals", () => {
    expect(normalizeLocation("Paris (75)")).toBe("Paris");
  });
  it("returns undefined for empty", () => {
    expect(normalizeLocation("")).toBeUndefined();
    expect(normalizeLocation(undefined)).toBeUndefined();
  });
});

describe("normalizeJobPosting", () => {
  it("returns valid job posting", () => {
    const r = normalizeJobPosting({
      title: "Directeur Commercial H/F",
      company: "TechCorp SAS",
      description: "Un poste passionnant avec des responsabilités variées et une équipe dynamique pour piloter la stratégie commerciale.",
      sourceUrl: "https://example.com/job",
    });
    if ("invalid" in r) throw new Error("Expected valid posting");
    expect(r.title).toBe("Directeur Commercial");
    expect(r.company).toBe("TechCorp");
  });
  it("rejects missing title", () => {
    const r = normalizeJobPosting({ company: "TechCorp", description: "Description longue ici pour le poste avec beaucoup de détails sur les missions et responsabilités." });
    expect("invalid" in r).toBe(true);
    if ("invalid" in r) expect(r.reason).toBe("Titre manquant");
  });
  it("rejects missing company", () => {
    const r = normalizeJobPosting({ title: "Director", description: "Description longue ici pour le poste avec des missions détaillées." });
    expect("invalid" in r).toBe(true);
  });
  it("rejects description too short", () => {
    const r = normalizeJobPosting({ title: "Director", company: "TechCorp", description: "Court" });
    expect("invalid" in r).toBe(true);
  });
});

/* ── Query Builder ── */

describe("buildSearchQueriesFromProfile", () => {
  it("builds queries from profile title", () => {
    const queries = buildSearchQueriesFromProfile({ title: "Directeur Commercial" });
    expect(queries).toContain("Directeur Commercial");
    expect(queries).toContain("Directeur Commercial France");
  });
  it("limits to 20 queries", () => {
    const queries = buildSearchQueriesFromProfile({
      title: "CEO",
      functions: JSON.stringify(["Ventes", "Marketing", "Produit", "Finance", "RH", "Stratégie", "Ops", "Tech", "Data", "Legal", "Com", "CSR"]),
      sectors: JSON.stringify(["SaaS", "Industrie", "Santé", "Finance", "Retail", "Luxe", "Agro", "Transport", "Énergie", "Conseil"]),
      experiences: Array.from({ length: 10 }, (_, i) => ({ title: `Poste ${i}`, company: "C" })),
    });
    expect(queries.length).toBeLessThanOrEqual(20);
  });
  it("generates international queries when English detected", () => {
    const queries = buildSearchQueriesFromProfile({
      title: "Directeur Commercial",
      languages: JSON.stringify(["Anglais (courant)"]),
    });
    expect(queries.some((q) => q.includes("Europe"))).toBe(true);
  });
  it("uses fallback when profile is empty", () => {
    const queries = buildSearchQueriesFromProfile(null);
    expect(queries.length).toBeGreaterThanOrEqual(5);
    expect(queries).toContain("Directeur Commercial");
  });
});

/* ── Scoring ── */

describe("scoreJobAgainstProfile", () => {
  const job: NormalizedJobPosting = {
    source: "test",
    sourceType: "career_page",
    sourceUrl: "https://test.com",
    title: "Directeur Commercial France",
    company: "TechCorp",
    location: "Paris",
    description: "Nous recherchons un Directeur Commercial France pour piloter notre stratégie commerciale. Poste basé à Paris. Expérience requise : 10 ans minimum en direction commerciale B2B.",
  };

  const profile: RadarProfile = {
    title: "Directeur Commercial",
    functions: JSON.stringify(["Direction commerciale"]),
    sectors: JSON.stringify(["SaaS B2B"]),
    yearsExp: 15,
    location: "Paris",
    mobility: "France",
    languages: JSON.stringify(["Anglais", "Français"]),
    skills: [{ name: "Stratégie commerciale" }, { name: "Management" }, { name: "B2B" }, { name: "Négociation" }],
  };

  it("scores at least C for relevant match", () => {
    const result = scoreJobAgainstProfile(job, profile);
    expect(result.total).toBeGreaterThanOrEqual(55);
    expect(["A", "B", "C"]).toContain(result.priority);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("scores ignore for very off-target role", () => {
    const result = scoreJobAgainstProfile({ ...job, title: "Développeur Frontend React", description: "React, TypeScript, CSS, frontend development." }, { title: "Directeur Commercial" });
    expect(result.priority).toBe("ignore");
  });

  it("returns reasons for the score", () => {
    const result = scoreJobAgainstProfile(job, profile);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("returns matched keywords", () => {
    const result = scoreJobAgainstProfile(job, profile);
    expect(result.matchedKeywords.length).toBeGreaterThan(0);
  });
});

/* ── Priority helpers ── */

describe("priorityFromScore", () => {
  it("85+ → A", () => { expect(priorityFromScore(90)).toBe("A"); });
  it("70-84 → B", () => { expect(priorityFromScore(78)).toBe("B"); });
  it("55-69 → C", () => { expect(priorityFromScore(60)).toBe("C"); });
  it("<55 → ignore", () => { expect(priorityFromScore(30)).toBe("ignore"); });
});

/* ── Deduplication ── */

describe("detectRadarDuplicate", () => {
  const candidate: NormalizedJobPosting = {
    source: "test", sourceType: "career_page", sourceUrl: "https://test.com/job/123",
    title: "Directeur Commercial H/F", company: "TechCorp", description: "Description longue pour le poste.",
  };

  it("detects exact duplicate by externalId", () => {
    const r = detectRadarDuplicate(
      { ...candidate, externalId: "ext::123" },
      [{ externalId: "ext::123", title: "Other", company: "Other" }]
    );
    expect(r.status).toBe("duplicate_exact");
  });

  it("detects exact duplicate by sourceUrl", () => {
    const r = detectRadarDuplicate(
      { ...candidate, sourceUrl: "https://same.com" },
      [{ title: "Other", company: "Other", sourceUrl: "https://same.com" }]
    );
    expect(r.status).toBe("duplicate_exact");
  });

  it("detects duplicate by same title + company (titles may differ by H/F suffix)", () => {
    const r = detectRadarDuplicate(candidate, [
      { title: "Directeur Commercial", company: "TechCorp" },
    ]);
    expect(["duplicate_exact", "duplicate_probable", "duplicate_similar"]).toContain(r.status);
  });

  it("detects probable duplicate with similar title", () => {
    const r = detectRadarDuplicate(candidate, [
      { title: "Directeur Commercial France", company: "TechCorp" },
    ]);
    expect(["duplicate_probable", "duplicate_similar"]).toContain(r.status);
  });

  it("returns new for unrelated postings", () => {
    const r = detectRadarDuplicate(candidate, [
      { title: "Développeur Python", company: "StartupX" },
    ]);
    expect(r.status).toBe("new");
  });

  it("empty existing list → new", () => {
    const r = detectRadarDuplicate(candidate, []);
    expect(r.status).toBe("new");
  });
});

describe("priorityLabel", () => {
  it("returns readable labels", () => {
    expect(priorityLabel("A")).toBe("Priorité A");
    expect(priorityLabel("B")).toBe("Priorité B");
    expect(priorityLabel("C")).toBe("Priorité C");
    expect(priorityLabel("ignore")).toBe("Hors cible");
  });
});
