import { describe, it, expect } from "vitest";
import { normalizeLanguages, renderLanguages } from "@/lib/jobs/languages-normalizer";

describe("normalizeLanguages", () => {
  it("deduplicates same language with different casing", () => {
    const result = normalizeLanguages(["Français", "français", "FR"]);
    expect(result.length).toBe(1);
    expect(result[0].language).toBe("Français");
  });

  it("keeps highest level when duplicate languages found", () => {
    const result = normalizeLanguages([
      "Anglais (courant)",
      "Anglais (natif)",
    ]);
    expect(result.length).toBe(1);
    expect(result[0].level).toBe("natif");
  });

  it("parses language with level in parentheses", () => {
    const result = normalizeLanguages(["Espagnol (professionnel)"]);
    expect(result[0].language).toBe("Espagnol");
    expect(result[0].level).toBe("professionnel");
  });

  it("parses language with level after dash", () => {
    const result = normalizeLanguages(["Portugais - intermediaire"]);
    expect(result[0].language).toBe("Portugais");
    expect(result[0].level).toBe("intermédiaire");
  });

  it("marks unknown level as 'a preciser'", () => {
    const result = normalizeLanguages(["Portugais"]);
    expect(result[0].language).toBe("Portugais");
    // Level for unspecified should contain "preciser"
    expect(result[0].level).toMatch(/precis/i);
  });

  it("handles complex duplication: Français + Anglais + Français (natif)", () => {
    const result = normalizeLanguages(["Français", "Anglais", "Français (natif)"]);
    expect(result.length).toBe(2);
    expect(result.find(l => l.language === "Français")?.level).toBe("natif");
  });

  it("handles empty input", () => {
    expect(normalizeLanguages([])).toEqual([]);
  });

  it("handles JSON array as single string", () => {
    const result = normalizeLanguages([JSON.stringify(["Français (natif)", "Anglais (courant)"])]);
    expect(result.length).toBe(2);
    expect(result.find(l => l.language === "Français")?.level).toBe("natif");
    expect(result.find(l => l.language === "Anglais")?.level).toBe("courant");
  });

  it("sorts natif first", () => {
    const result = normalizeLanguages(["Français (natif)", "Anglais (courant)"]);
    expect(result[0].language).toBe("Français");
    expect(result[0].level).toBe("natif");
  });
});

describe("renderLanguages", () => {
  it("renders clean language list", () => {
    const result = renderLanguages([
      { language: "Français", level: "natif" },
      { language: "Anglais", level: "courant" },
    ]);
    expect(result).toContain("Français — natif");
    expect(result).toContain("Anglais — courant");
  });
});
