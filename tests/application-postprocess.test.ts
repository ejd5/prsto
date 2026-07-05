import { describe, it, expect } from "vitest";
import {
  extractProfileLanguages,
  ensureProfileLanguagesInText,
  stripLinkedInFromText,
  stripSalaryFromText,
  stripEmDashesFromText,
  postProcessApplicationText,
} from "@/lib/jobs/application-postprocess";

describe("extractProfileLanguages", () => {
  it("extracts 4 languages from JSON", () => {
    const langs = extractProfileLanguages(JSON.stringify(["Français", "Anglais", "Espagnol", "Portugais"]));
    expect(langs).toHaveLength(4);
    expect(langs).toContain("Français");
    expect(langs).toContain("Anglais");
    expect(langs).toContain("Espagnol");
    expect(langs).toContain("Portugais");
  });

  it("extracts names from level format", () => {
    const langs = extractProfileLanguages(JSON.stringify(["Français (natif)", "Anglais (courant)"]));
    expect(langs).toHaveLength(2);
    expect(langs).toContain("Français");
    expect(langs).toContain("Anglais");
  });

  it("handles null / empty", () => {
    expect(extractProfileLanguages(null)).toEqual([]);
    expect(extractProfileLanguages("")).toEqual([]);
  });
});

describe("ensureProfileLanguagesInText", () => {
  it("adds missing language to LANGUES section", () => {
    const text = "EXPÉRIENCE\n...\n\nLANGUES\nFrançais\nAnglais\nPortugais\n\nCERTIFICATIONS\n...";
    const result = ensureProfileLanguagesInText(text, ["Français", "Anglais", "Espagnol", "Portugais"]);
    expect(result).toContain("Espagnol");
    // Must still contain the others
    expect(result).toContain("Français");
    expect(result).toContain("Portugais");
  });

  it("does not change text if all languages present", () => {
    const text = "LANGUES\nFrançais\nAnglais\nEspagnol\nPortugais";
    const result = ensureProfileLanguagesInText(text, ["Français", "Anglais", "Espagnol", "Portugais"]);
    expect(result).toBe(text);
  });

  it("adds LANGUES section if missing", () => {
    const text = "EXPÉRIENCE PROFESSIONNELLE\nDirecteur Commercial France chez ACME Corp — pilotage stratégique, management équipe 15 personnes, croissance CA\n\nCOMPÉTENCES CLÉS\nManagement, Négociation, Stratégie commerciale, SaaS B2B, Développement international";
    const result = ensureProfileLanguagesInText(text, ["Français", "Anglais"]);
    expect(result).toContain("LANGUES");
    expect(result).toContain("Français");
    expect(result).toContain("Anglais");
  });

  it("does nothing for empty input", () => {
    expect(ensureProfileLanguagesInText("", ["Français"])).toBe("");
  });
});

describe("stripLinkedInFromText", () => {
  it("removes URLs", () => {
    const r = stripLinkedInFromText("Contact: https://www.linkedin.com/in/jean");
    expect(r).not.toContain("linkedin.com");
  });

  it("removes linkedin.com/in/XXXX without protocol", () => {
    const r = stripLinkedInFromText("linkedin.com/in/jean | +33 6 xx");
    expect(r).not.toContain("linkedin.com/in/jean");
  });

  it("removes LinkedIn line", () => {
    const r = stripLinkedInFromText("Jean Dupont\nLinkedIn : linkedin.com/in/jean\nParis");
    expect(r).not.toContain("LinkedIn");
  });
});

describe("stripSalaryFromText", () => {
  it("removes lines about remuneration", () => {
    const r = stripSalaryFromText("Expérience\nRémunération : 120-180K€\nCompétences");
    expect(r).not.toContain("Rémunération");
    expect(r).toContain("Expérience");
    expect(r).toContain("Compétences");
  });
});

/* ─── Em dash / ChatGPT artifact stripping ────── */

describe("stripEmDashesFromText", () => {
  it("replaces em dashes (—) with comma+space", () => {
    const r = stripEmDashesFromText("Objet : Candidature — Directeur Commercial chez Acme Corp");
    expect(r).not.toContain("—");
    expect(r).toContain("Objet : Candidature");
    expect(r).toContain("Directeur Commercial");
  });

  it("replaces en dashes (–) with comma+space", () => {
    const r = stripEmDashesFromText("Profil – 15 ans – direction commerciale");
    expect(r).not.toContain("–");
  });

  it("removes em dash bullet proofs", () => {
    const r = stripEmDashesFromText("Résultats :\n— CA +30% en 3 ans\n— Équipe 50 personnes");
    expect(r).not.toContain("—");
    expect(r).toContain("CA +30%");
    expect(r).toContain("Équipe 50");
  });

  it("cleans up double commas from replacements", () => {
    const r = stripEmDashesFromText("A — B — C");
    expect(r).not.toContain(",, ");
  });

  it("handles empty input", () => {
    expect(stripEmDashesFromText("")).toBe("");
  });

  it("does not alter text without dashes", () => {
    const clean = "Objet : Candidature au poste de Directeur Commercial";
    expect(stripEmDashesFromText(clean)).toBe(clean);
  });
});

describe("postProcessApplicationText", () => {
  it("adds missing languages", () => {
    const result = postProcessApplicationText({
      text: "CV\n\nLANGUES\nFrançais\nAnglais\nPortugais",
      profileLanguages: ["Français", "Anglais", "Espagnol", "Portugais"],
      stripLinkedIn: false,
      stripSalary: false,
    });
    expect(result.text).toContain("Espagnol");
    expect(result.changes.length).toBeGreaterThan(0);
  });

  it("strips LinkedIn when requested", () => {
    const result = postProcessApplicationText({
      text: "CV\nlinkedin.com/in/jean\nExpérience",
      profileLanguages: [],
      stripLinkedIn: true,
      stripSalary: false,
    });
    expect(result.text).not.toContain("linkedin.com");
    expect(result.changes.some((c) => c.includes("linkedin"))).toBe(true);
  });

  it("strips salary when requested", () => {
    const result = postProcessApplicationText({
      text: "CV\nRémunération : 120K€\nExpérience",
      profileLanguages: [],
      stripLinkedIn: false,
      stripSalary: true,
    });
    expect(result.text).not.toContain("Rémunération");
    expect(result.changes.some((c) => c.includes("rémunération"))).toBe(true);
  });

  it("reports all changes", () => {
    const result = postProcessApplicationText({
      text: "CV\nlinkedin.com/in/jean\nRémunération : 120K€\nLANGUES\nFrançais\nAnglais",
      profileLanguages: ["Français", "Anglais", "Espagnol", "Portugais"],
      stripLinkedIn: true,
      stripSalary: true,
    });
    expect(result.changes.length).toBeGreaterThanOrEqual(3);
    expect(result.text).toContain("Espagnol");
    expect(result.text).toContain("Portugais");
    expect(result.text).not.toContain("linkedin.com");
    expect(result.text).not.toContain("Rémunération");
  });

  it("strips em dashes (ChatGPT artifacts) from text", () => {
    const result = postProcessApplicationText({
      text: "Objet : Candidature — Directeur Commercial\n\nMadame, Monsieur,\n\nC'est avec un vif intérêt — mon parcours correspond.",
      profileLanguages: [],
      stripLinkedIn: false,
      stripSalary: false,
    });
    expect(result.text).not.toContain("—");
    expect(result.changes.some((c) => c.includes("tirets longs"))).toBe(true);
  });

  it("does not report em dash change if none present", () => {
    const result = postProcessApplicationText({
      text: "Objet : Candidature au poste de Directeur\n\nMadame, Monsieur,\n\nTexte propre sans artefacts.",
      profileLanguages: [],
      stripLinkedIn: false,
      stripSalary: false,
    });
    expect(result.changes.some((c) => c.includes("tirets longs"))).toBe(false);
  });
});
