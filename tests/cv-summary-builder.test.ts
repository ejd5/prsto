import { describe, it, expect } from "vitest";
import {
  chooseSummarySectionTitle,
  buildExecutiveSummary,
  isContaminatedSummary,
  sanitizeExecutiveSummary,
} from "@/lib/jobs/cv-summary-builder";

describe("chooseSummarySectionTitle", () => {
  it("returns Profil de direction commerciale for commercial roles", () => {
    expect(chooseSummarySectionTitle("Directeur Commercial France H/F")).toBe("Profil de direction commerciale");
  });

  it("returns Synthèse de candidature for manager roles", () => {
    expect(chooseSummarySectionTitle("Sales Manager")).toBe("Synthèse de candidature");
  });

  it("returns Profil de leadership marché for country manager", () => {
    expect(chooseSummarySectionTitle("Country Manager France")).toBe("Profil de leadership marché");
  });

  it("returns Direction commerciale orientée performance for sales director", () => {
    expect(chooseSummarySectionTitle("Sales Director EMEA")).toBe("Direction commerciale orientée performance");
  });

  it("returns default for unknown titles", () => {
    const title = chooseSummarySectionTitle("Consultant Senior");
    expect(title.length).toBeGreaterThan(5);
  });
});

describe("isContaminatedSummary", () => {
  it("detects EXPÉRIENCE PROFESSIONNELLE as all-caps section header", () => {
    expect(isContaminatedSummary("Résumé\nEXPÉRIENCE PROFESSIONNELLE\nTechCorp 2018-2023")).toBe(true);
  });

  it("detects SAVOIR-FAIRE as section header", () => {
    expect(isContaminatedSummary("Résumé.\nSAVOIR-FAIRE STRATÉGIQUE\nDirection commerciale, Négociation")).toBe(true);
  });

  it("passes clean narrative summaries", () => {
    expect(isContaminatedSummary("Directeur Commercial avec 15 ans d'expérience orienté croissance, pilotage équipes et P&L. Compétences clés en négociation et management.")).toBe(false);
  });

  it("passes summaries without all-caps headers", () => {
    expect(isContaminatedSummary("Profil de direction commerciale.\n15 ans d'expérience en pilotage d'équipes et développement commercial.")).toBe(false);
  });
});

describe("sanitizeExecutiveSummary", () => {
  it("removes all-caps section headers", () => {
    const result = sanitizeExecutiveSummary("RÉSUMÉ EXÉCUTIF\nDirecteur Commercial avec expérience.\nEXPÉRIENCE PROFESSIONNELLE\nTechCorp");
    expect(result).not.toContain("RÉSUMÉ EXÉCUTIF");
    expect(result).not.toContain("EXPÉRIENCE");
  });

  it("passes clean text unchanged", () => {
    const clean = "Directeur commercial orienté croissance avec 15 ans d'expérience.";
    expect(sanitizeExecutiveSummary(clean)).toBe(clean);
  });
});

describe("buildExecutiveSummary", () => {
  it("produces a multi-sentence summary", () => {
    const result = buildExecutiveSummary({
      candidateName: "Jean Dupont",
      candidateTitle: "Directeur Commercial",
      yearsExp: 15,
      jobTitle: "Directeur Commercial France H/F",
      jobCompany: "TechCorp France",
      skills: ["Management", "Négociation", "CRM"],
      confirmedMatches: ["Expérience internationale", "Management équipe 30p"],
    });
    expect(result.length).toBeGreaterThan(150);
    expect(result).toContain("Directeur Commercial");
    expect(result).toContain("TechCorp France");
    expect(result).toContain("Management");
  });

  it("varies output for different roles", () => {
    const forDc = buildExecutiveSummary({
      candidateName: "Test", candidateTitle: "Directeur Commercial", yearsExp: 15,
      jobTitle: "Directeur Commercial", skills: ["Management"], confirmedMatches: [],
    });
    const forCm = buildExecutiveSummary({
      candidateName: "Test", candidateTitle: "Country Manager", yearsExp: 15,
      jobTitle: "Country Manager", skills: ["Management"], confirmedMatches: [],
    });
    expect(forDc).not.toBe(forCm);
  });
});
