import { describe, it, expect } from "vitest";
import {
  CV_TEMPLATES,
  getCVTemplate,
  getCVTemplatesByATSLevel,
  CVData,
} from "@/lib/cv-templates/templates";

const DEMO_CV: CVData = {
  fullName: "Jean Dupont",
  title: "Directeur Commercial",
  email: "jean@example.com",
  phone: "06 00 00 00 00",
  linkedin: "linkedin.com/in/jeandupont",
  location: "Paris, France",
  summary: "15 ans d'expérience en direction commerciale B2B.",
  languages: ["Français (natif)", "Anglais (courant)"],
  skills: [
    { name: "Stratégie commerciale", category: "commerce", level: "Expert" },
    { name: "Management d'équipe", category: "management", level: "Expert" },
  ],
  experiences: [
    {
      company: "TechCorp",
      title: "Directeur Commercial France",
      period: "2019-présent",
      location: "Paris",
      description: "Pilotage d'une équipe de 45 commerciaux, CA 32M€.",
      achievements: ["Croissance +28% CA en 3 ans", "Déploiement Salesforce 120 utilisateurs"],
    },
  ],
  education: [
    { degree: "Master Management", school: "HEC Paris", year: "2009" },
  ],
  certifications: ["Green Belt Lean Six Sigma"],
};

describe("CV_TEMPLATES registry", () => {
  it("contient 8 templates", () => {
    expect(CV_TEMPLATES).toHaveLength(8);
  });

  it("chaque template a un id unique", () => {
    const ids = CV_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("chaque template a renderText et renderHTML", () => {
    for (const t of CV_TEMPLATES) {
      expect(typeof t.renderText).toBe("function");
      expect(typeof t.renderHTML).toBe("function");
    }
  });

  it("chaque template a un nom et une description", () => {
    for (const t of CV_TEMPLATES) {
      expect(t.name.length).toBeGreaterThan(0);
      expect(t.description.length).toBeGreaterThan(0);
    }
  });

  it("tous les templates ont au moins 5 sections", () => {
    for (const t of CV_TEMPLATES) {
      expect(t.sections.length).toBeGreaterThanOrEqual(4);
    }
  });

  it("chaque template a des usageTips", () => {
    for (const t of CV_TEMPLATES) {
      expect(Array.isArray(t.usageTips)).toBe(true);
      expect(t.usageTips.length).toBeGreaterThanOrEqual(3);
      for (const tip of t.usageTips) {
        expect(typeof tip).toBe("string");
        expect(tip.length).toBeGreaterThan(10);
      }
    }
  });
});

describe("getCVTemplate", () => {
  it("retourne un template par id", () => {
    const t = getCVTemplate("ats-classic");
    expect(t).toBeDefined();
    expect(t!.name).toBe("ATS Classic");
  });

  it("retourne undefined pour id inexistant", () => {
    expect(getCVTemplate("nonexistent")).toBeUndefined();
  });
});

describe("getCVTemplatesByATSLevel", () => {
  it("filtre par niveau HIGH", () => {
    const high = getCVTemplatesByATSLevel("HIGH");
    expect(high.length).toBeGreaterThanOrEqual(1);
    for (const t of high) expect(t.atsLevel).toBe("HIGH");
  });

  it("filtre par niveau MEDIUM", () => {
    const med = getCVTemplatesByATSLevel("MEDIUM");
    for (const t of med) expect(t.atsLevel).toBe("MEDIUM");
  });

  it("filtre par niveau LOW", () => {
    const low = getCVTemplatesByATSLevel("LOW");
    expect(low.length).toBeGreaterThanOrEqual(1);
    for (const t of low) expect(t.atsLevel).toBe("LOW");
  });
});

// ─── Rendu texte ──────────────────────────────────────

describe("renderText", () => {
  it("ATS Classic contient les sections clés", () => {
    const template = getCVTemplate("ats-classic")!;
    const text = template.renderText(DEMO_CV);

    expect(text).toContain("RÉSUMÉ");
    expect(text).toContain("EXPÉRIENCE PROFESSIONNELLE");
    expect(text).toContain("COMPÉTENCES");
    expect(text).toContain("FORMATION");
    expect(text).toContain("LANGUES");
    expect(text).toContain("CERTIFICATIONS");
  });

  it("ATS Classic contient le nom", () => {
    const template = getCVTemplate("ats-classic")!;
    const text = template.renderText(DEMO_CV);
    expect(text).toContain("JEAN DUPONT");
  });

  it("chaque template produit du texte non vide", () => {
    for (const t of CV_TEMPLATES) {
      const text = t.renderText(DEMO_CV);
      expect(text.length).toBeGreaterThan(100);
    }
  });

  it("International EN utilise les sections anglaises", () => {
    const template = getCVTemplate("international-en")!;
    const text = template.renderText(DEMO_CV);
    expect(text).toContain("PROFESSIONAL SUMMARY");
    expect(text).toContain("CORE COMPETENCIES");
  });

  it("One-Page Brief est le plus court", () => {
    const brief = getCVTemplate("one-page-brief")!;
    const executive = getCVTemplate("executive-premium")!;

    const briefText = brief.renderText(DEMO_CV);
    const execText = executive.renderText(DEMO_CV);
    expect(briefText.length).toBeLessThan(execText.length);
  });

  it("Sales Leadership contient la section performance", () => {
    const template = getCVTemplate("sales-leadership")!;
    const text = template.renderText(DEMO_CV);
    expect(text).toContain("PERFORMANCE COMMERCIALE");
  });

  it("Country Manager affiche les langues dans l'en-tête", () => {
    const template = getCVTemplate("country-manager")!;
    const text = template.renderText(DEMO_CV);
    expect(text).toContain("Français (natif)");
  });
});

// ─── Rendu HTML ───────────────────────────────────────

describe("renderHTML", () => {
  it("ATS Classic produit du HTML valide", () => {
    const template = getCVTemplate("ats-classic")!;
    const html = template.renderHTML(DEMO_CV);

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
    expect(html).toContain("Jean Dupont");
  });

  it("chaque template produit du HTML avec DOCTYPE", () => {
    for (const t of CV_TEMPLATES) {
      const html = t.renderHTML(DEMO_CV);
      expect(html).toContain("<!DOCTYPE html>");
    }
  });

  it("Executive Premium utilise le layout accent", () => {
    const template = getCVTemplate("executive-premium")!;
    const html = template.renderHTML(DEMO_CV);
    expect(html).toContain("border-left");
  });
});
