import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { checkApplicationReadiness } from "@/lib/jobs/application-readiness";

const SOURCE_FILES = [
  "lib/jobs/cv-pdf-premium.ts",
  "components/cv-templates/MinimalLuxeTemplate.tsx",
  "lib/generation/templates.ts",
];

describe("ELTON OS footer removed from CV exports", () => {
  for (const file of SOURCE_FILES) {
    it(`${path.basename(file)} does not contain PDF footer text`, () => {
      const fullPath = path.resolve(process.cwd(), file);
      if (!fs.existsSync(fullPath)) return;
      const content = fs.readFileSync(fullPath, "utf-8");
      expect(content).not.toContain("CV généré par ELTON OS");
      expect(content).not.toContain("Document confidentiel");
    });
  }

  it("no CV generation files contain the PDF footer pattern", () => {
    const errors: string[] = [];
    const footerPatterns = ["CV généré par ELTON OS", "Document confidentiel"];
    const cvFiles = [
      "lib/jobs/cv-pdf-premium.ts",
      "lib/exports/engine.ts",
      "lib/generation/templates.ts",
    ];
    for (const file of cvFiles) {
      const fullPath = path.resolve(process.cwd(), file);
      if (!fs.existsSync(fullPath)) continue;
      const content = fs.readFileSync(fullPath, "utf-8");
      for (const pat of footerPatterns) {
        if (content.includes(pat)) errors.push(`${file}: "${pat}"`);
      }
    }
    expect(errors).toEqual([]);
  });
});

describe("Application Readiness", () => {
  it("detects clean draft as ready", () => {
    const result = checkApplicationReadiness({
      cvContent: "Profil de direction commerciale\nDirecteur Commercial avec 15 ans.\nEXPÉRIENCES PROFESSIONNELLES\nTechCorp 2018-2023",
      letterContent: "Madame, Monsieur,\n\nJe postule au poste de Directeur Commercial chez TechCorp. Fort de 15 ans d'expérience.\n\nCordialement,\nJean Dupont",
      jobTitle: "Directeur Commercial France H/F",
      company: "TechCorp France",
    });
    expect(result.status).toBe("ready");
  });

  it("flags internal markers as needs_review", () => {
    const result = checkApplicationReadiness({
      cvContent: "POSTE TERMINÉ sendableToAI semanticScore 85",
      letterContent: "Lettre courte.",
      jobTitle: "Directeur Commercial",
      company: "TechCorp",
    });
    expect(result.checks.some((c) => c.code === "cv_no_markers" && !c.passed)).toBe(true);
  });

  it("detects missing job title as not_ready", () => {
    const result = checkApplicationReadiness({
      cvContent: "CV content",
      letterContent: "Letter content",
      jobTitle: "",
      company: "TechCorp",
    });
    expect(result.checks.some((c) => c.code === "job_title" && !c.passed)).toBe(true);
  });
});
