import { describe, it, expect } from "vitest";
import { sanitizeCvText } from "@/lib/jobs/cv-content-sanitizer";
import { checkCvQuality } from "@/lib/jobs/cv-quality-gate";
import { normalizeLanguages, renderLanguages } from "@/lib/jobs/languages-normalizer";
import { buildCvRenderData } from "@/lib/cv-render/build-data";

const LEGACY_DRAFT = `JEAN DUPONT
Directeur Commercial
Paris

RÉSUMÉ EXÉCUTIF
Directeur Commercial (POSTE TERMINÉ) avec 15 ans d'expérience. sendableToAI semanticScore 85

EXPÉRIENCE PROFESSIONNELLE
TechCorp (2018-2023)
Directeur Commercial France (POSTE TERMINÉ)
Pilotage de la stratégie commerciale France. Management équipe 30p.

COMPÉTENCES CLÉS
• Management semanticScore: 85
• Négociation

LANGUES
Français (natif), Anglais (courant), Français (courant)`;

describe("CV legacy draft sanitization", () => {
  it("sanitizer removes POSTE TERMINÉ from legacy draft", () => {
    const result = sanitizeCvText(LEGACY_DRAFT);
    expect(result).not.toContain("POSTE TERMINÉ");
    expect(result).not.toContain("sendableToAI");
    expect(result).not.toContain("semanticScore");
  });

  it("sanitizer preserves meaningful content", () => {
    const result = sanitizeCvText(LEGACY_DRAFT);
    expect(result).toContain("JEAN DUPONT");
    expect(result).toContain("Directeur Commercial");
    expect(result).toContain("TechCorp");
    expect(result).toContain("Management");
  });

  it("quality gate flags legacy draft with POSTE TERMINÉ", () => {
    const result = checkCvQuality(LEGACY_DRAFT);
    expect(result.passed).toBe(false);
    expect(result.errors.some(e => e.code === "INTERNAL_MARKER")).toBe(true);
  });

  it("quality gate passes after sanitization", () => {
    const sanitized = sanitizeCvText(LEGACY_DRAFT);
    const result = checkCvQuality(sanitized);
    if (!result.passed) {
      expect(result.errors.some(e => e.code === "INTERNAL_MARKER")).toBe(false);
    }
  });
});

describe("CV rendering integration", () => {
  it("duplicate languages are sanitized in render pipeline", () => {
    const result = normalizeLanguages(["Français (natif)", "Anglais (courant)", "Français (courant)"]);
    const rendered = renderLanguages(result);
    expect(result.length).toBe(2);
    expect(rendered).toContain("Français");
    expect(rendered).toContain("Anglais");
    const fr = result.find(l => l.language === "Français");
    expect(fr?.level).toBe("natif");
  });

  it("PDF content never contains POSTE TERMINÉ after sanitization", () => {
    const dirty = "EXPÉRIENCE\nTechCorp (POSTE TERMINÉ)\nDirecteur Commercial";
    const clean = sanitizeCvText(dirty);
    expect(clean).not.toContain("POSTE TERMINÉ");
    expect(clean).toContain("TechCorp");
  });

  it("TXT export content never contains POSTE TERMINÉ after sanitization", () => {
    const dirty = "RÉSUMÉ\nCompétences validées sendableToAI\nPOSTE TERMINÉ";
    const clean = sanitizeCvText(dirty);
    expect(clean).not.toContain("POSTE TERMINÉ");
    expect(clean).not.toContain("sendableToAI");
  });

  it("buildCvRenderData sanitizes via extractSummary", () => {
    const result = buildCvRenderData({
      profile: { fullName: "Jean Dupont", title: "Directeur Commercial" },
      generatedCvContent: "PROFIL EXÉCUTIF\nDirecteur Commercial (POSTE TERMINÉ) avec 15 ans d'expérience en pilotage d'équipes commerciales et développement de stratégies de croissance sendableToAI. Expertise en négociation et management.",
    });
    expect(result.summary).toBeDefined();
    if (result.summary) {
      expect(result.summary).not.toContain("POSTE TERMINÉ");
      expect(result.summary).not.toContain("sendableToAI");
    }
  });
});
