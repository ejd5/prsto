import { describe, it, expect } from "vitest";
import { sanitizeCvText, sanitizeExperienceLine, sanitizeSectionTitle, normalizeDateRangeForCv } from "@/lib/jobs/cv-content-sanitizer";

describe("sanitizeCvText", () => {
  it("removes POSTE TERMINÉ marker", () => {
    const result = sanitizeCvText("Directeur Commercial (POSTE TERMINÉ)");
    expect(result).not.toContain("POSTE TERMINÉ");
    expect(result).toContain("Directeur Commercial");
  });

  it("removes POSTE ACTIF marker", () => {
    const result = sanitizeCvText("Poste actif depuis 2020");
    expect(result).not.toContain("POSTE ACTIF");
    expect(result).not.toContain("poste actif");
  });

  it("removes technical audit labels", () => {
    const result = sanitizeCvText("CV content sendableToAI semanticScore 85 reasonCode abc");
    expect(result).not.toContain("sendableToAI");
    expect(result).not.toContain("semanticScore");
    expect(result).not.toContain("reasonCode");
  });

  it("removes confidence and source markers", () => {
    const result = sanitizeCvText("source: linkedin confidence: high");
    expect(result).not.toContain("source:");
    expect(result).not.toContain("confidence:");
  });

  it("handles empty input", () => {
    expect(sanitizeCvText("")).toBe("");
  });

  it("cleans double spaces left behind", () => {
    const result = sanitizeCvText("Poste  terminé  (POSTE TERMINÉ)  suite");
    expect(result).not.toContain("  ");
    expect(result).toContain("terminé suite");
  });
});

describe("sanitizeExperienceLine", () => {
  it("removes POSTE TERMINÉ from experience line", () => {
    const result = sanitizeExperienceLine("Directeur Commercial chez TechCorp (POSTE TERMINÉ)");
    expect(result).not.toContain("POSTE TERMINÉ");
  });

  it("keeps clean lines unchanged", () => {
    const result = sanitizeExperienceLine("Directeur Commercial chez TechCorp (2018-2023)");
    expect(result).toBe("Directeur Commercial chez TechCorp (2018-2023)");
  });
});

describe("sanitizeSectionTitle", () => {
  it("removes markdown heading markers", () => {
    expect(sanitizeSectionTitle("### Résumé")).toBe("Résumé");
  });

  it("removes bold markers", () => {
    expect(sanitizeSectionTitle("**EXPÉRIENCE**")).toBe("EXPÉRIENCE");
  });
});

describe("normalizeDateRangeForCv", () => {
  it("formats full date range", () => {
    const result = normalizeDateRangeForCv("2018-03", "2023-06");
    expect(result).toContain("Mars 2018");
    expect(result).toContain("Juin 2023");
  });

  it("handles ongoing position", () => {
    const result = normalizeDateRangeForCv("2020-01", null);
    expect(result).toContain("Janvier 2020");
    expect(result).toContain("À ce jour");
  });
});
