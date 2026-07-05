import { describe, it, expect } from "vitest";
import { resolveTemplate, resolveAccent, TEMPLATE_LABELS, TEMPLATE_BADGES } from "@/components/cv-templates/cv-template-types";
import { cleanMarkdown, formatDateRange } from "@/components/cv-templates/cv-template-utils";
import { buildCvRenderData } from "@/lib/cv-render/build-data";

describe("resolveTemplate", () => {
  it("returns valid template id", () => {
    expect(resolveTemplate("ats_classic")).toBe("ats_classic");
    expect(resolveTemplate("modern_executive")).toBe("modern_executive");
    expect(resolveTemplate("premium_leadership")).toBe("premium_leadership");
  });
  // V2.8.5
  it("recognizes new V2.8.5 templates", () => {
    expect(resolveTemplate("executive_bordeaux")).toBe("executive_bordeaux");
    expect(resolveTemplate("strategic_blue")).toBe("strategic_blue");
    expect(resolveTemplate("minimal_luxe")).toBe("minimal_luxe");
  });
  it("falls back to premium_leadership for unknown", () => {
    expect(resolveTemplate("unknown")).toBe("premium_leadership");
  });
  it("falls back for null/undefined", () => {
    expect(resolveTemplate(null)).toBe("premium_leadership");
    expect(resolveTemplate(undefined)).toBe("premium_leadership");
  });
});

describe("TEMPLATE_LABELS has all 6 templates", () => {
  it("has all template labels defined", () => {
    const ids = Object.keys(TEMPLATE_LABELS);
    expect(ids).toContain("ats_classic");
    expect(ids).toContain("modern_executive");
    expect(ids).toContain("premium_leadership");
    expect(ids).toContain("executive_bordeaux");
    expect(ids).toContain("strategic_blue");
    expect(ids).toContain("minimal_luxe");
  });
});

describe("TEMPLATE_BADGES has all 6 templates", () => {
  it("has badges for all templates", () => {
    expect(TEMPLATE_BADGES.executive_bordeaux.label).toBe("Executive");
    expect(TEMPLATE_BADGES.strategic_blue.label).toBe("Business");
    expect(TEMPLATE_BADGES.minimal_luxe.label).toBe("Premium");
    expect(TEMPLATE_BADGES.ats_classic.label).toBe("ATS");
  });
});

describe("resolveAccent", () => {
  it("returns valid accent", () => {
    expect(resolveAccent("navy")).toBe("navy");
    expect(resolveAccent("burgundy")).toBe("burgundy");
  });
  it("falls back to champagne for unknown", () => {
    expect(resolveAccent("pink")).toBe("champagne");
    expect(resolveAccent(null)).toBe("champagne");
  });
});

describe("cleanMarkdown", () => {
  it("removes bold markdown", () => {
    expect(cleanMarkdown("**Jean Dupont**")).toBe("Jean Dupont");
  });
  it("removes --- separators", () => {
    expect(cleanMarkdown("A\n---\nB")).toBe("A\n\nB");
  });
  it("removes ### headers", () => {
    expect(cleanMarkdown("### Résumé\nTexte")).toBe("Résumé\nTexte");
  });
  it("removes placeholders", () => {
    const r = cleanMarkdown("[Adresse] [Téléphone]");
    expect(r).not.toContain("[Adresse]");
    expect(r).not.toContain("[Téléphone]");
  });
  it("replaces - bullets with •", () => {
    expect(cleanMarkdown("- Item")).toBe("• Item");
  });
});

describe("buildCvRenderData", () => {
  const profile = {
    fullName: "Jean Dupont", title: "Directeur Commercial", email: "j@test.com",
    phone: "06 00 00 00 00", linkedin: "linkedin.com/in/jean", location: "Paris",
    photoUrl: "data:photo", summary: "Résumé test", languages: '["Français","Anglais (courant)"]',
    education: '["Master HEC","Bachelor ESCP"]', certifications: '["Lean Six Sigma"]',
    cvDefaultTemplate: "modern_executive", cvIncludePhoto: true, cvIncludeLinkedIn: false,
    cvAccentColor: "navy",
  };

  it("builds identity correctly", () => {
    const data = buildCvRenderData({ profile });
    expect(data.identity.fullName).toBe("Jean Dupont");
    expect(data.identity.linkedin).toBe("linkedin.com/in/jean");
  });

  it("cvIncludeLinkedIn false → linkedin not in contact", () => {
    const data = buildCvRenderData({ profile: { ...profile, cvIncludeLinkedIn: false } });
    expect(data.options.includeLinkedIn).toBe(false);
  });

  it("cvIncludeLinkedIn true → linkedin visible", () => {
    const data = buildCvRenderData({ profile: { ...profile, cvIncludeLinkedIn: true } });
    expect(data.options.includeLinkedIn).toBe(true);
    expect(data.identity.linkedin).toBe("linkedin.com/in/jean");
  });

  it("cvIncludePhoto false → photo not included", () => {
    const data = buildCvRenderData({ profile: { ...profile, cvIncludePhoto: false } });
    expect(data.options.includePhoto).toBe(false);
  });

  it("no placeholder produced", () => {
    const data = buildCvRenderData({ profile: {} });
    const str = JSON.stringify(data);
    expect(str).not.toContain("[Adresse]");
    expect(str).not.toContain("[Téléphone]");
    expect(str).not.toContain("[Email]");
  });

  it("no markdown in summary", () => {
    const data = buildCvRenderData({ profile: { ...profile, summary: "**Expert** en vente" } });
    expect(data.summary).not.toContain("**");
    expect(data.summary).toContain("Expert");
  });

  it("returns stable structure even with empty profile", () => {
    const data = buildCvRenderData({ profile: null });
    expect(data.identity.fullName).toBeUndefined();
    expect(data.experiences).toEqual([]);
    expect(data.skills).toEqual([]);
    expect(data.template).toBe("premium_leadership");
  });

  it("parses languages correctly", () => {
    const data = buildCvRenderData({ profile });
    expect(data.languages.length).toBe(2);
    expect(data.languages[0].name).toBe("Français");
    expect(data.languages[1].name).toBe("Anglais");
    expect(data.languages[1].level).toBe("courant");
  });

  it("parses education correctly", () => {
    const data = buildCvRenderData({ profile });
    expect(data.education.length).toBe(2);
  });

  it("parses certifications correctly", () => {
    const data = buildCvRenderData({ profile });
    expect(data.certifications).toEqual(["Lean Six Sigma"]);
  });

  it("builds achievements from proof entries", () => {
    const data = buildCvRenderData({
      profile,
      proofEntries: [{ category: "CA", title: "Croissance", value: "+32%" }],
    });
    expect(data.achievements.length).toBe(1);
    expect(data.achievements[0].value).toBe("+32%");
  });

  it("uses cvAccentColor navy", () => {
    const data = buildCvRenderData({ profile });
    expect(data.options.accentColor).toBe("navy");
  });

  it("falls back to champagne for unknown accent", () => {
    const data = buildCvRenderData({ profile: { cvAccentColor: "pink" } });
    expect(data.options.accentColor).toBe("champagne");
  });
});
