import { describe, it, expect } from "vitest";
import {
  cleanGeneratedApplicationText,
  isCabinetRecrutement,
  cleanImportedJobText,
  parseImportedJobText,
} from "@/lib/jobs/text-sanitizer";

describe("cleanGeneratedApplicationText", () => {
  it("removes bold markdown", () => {
    const r = cleanGeneratedApplicationText("**Jean Dupont** est un directeur");
    expect(r.text).not.toContain("**");
    expect(r.text).toContain("Jean Dupont");
    expect(r.warnings.markdownRemoved).toBe(true);
  });

  it("removes --- separators", () => {
    const r = cleanGeneratedApplicationText("Section 1\n---\nSection 2");
    expect(r.text).not.toContain("---");
    expect(r.warnings.markdownRemoved).toBe(true);
  });

  it("removes ### headers", () => {
    const r = cleanGeneratedApplicationText("### Résumé exécutif\nTexte");
    expect(r.text).not.toContain("###");
    expect(r.warnings.markdownRemoved).toBe(true);
  });

  it("replaces - list markers with bullets", () => {
    const r = cleanGeneratedApplicationText("- Item 1\n- Item 2");
    expect(r.text).not.toContain("- ");
    expect(r.text).toContain("• Item 1");
  });

  it("removes code blocks", () => {
    const r = cleanGeneratedApplicationText("```json\n{}\n```\nTexte");
    expect(r.text).not.toContain("```");
    expect(r.warnings.markdownRemoved).toBe(true);
  });

  it("removes placeholders", () => {
    const r = cleanGeneratedApplicationText("Contact : [Adresse] [Téléphone] [Email]");
    expect(r.text).not.toContain("[Adresse]");
    expect(r.text).not.toContain("[Téléphone]");
    expect(r.warnings.placeholdersRemoved.length).toBeGreaterThan(0);
  });

  it("collapses excessive blank lines", () => {
    const r = cleanGeneratedApplicationText("A\n\n\n\n\nB");
    expect(r.text).toBe("A\n\nB");
  });

  it("handles empty input", () => {
    const r = cleanGeneratedApplicationText("");
    expect(r.text).toBe("");
    expect(r.warnings.cleaned).toBe(false);
  });

  it("leaves clean text unchanged in content but marks cleaned", () => {
    const r = cleanGeneratedApplicationText("Jean Dupont\nDirecteur Commercial\n\nExpérience :\n15 ans");
    expect(r.text).toContain("Jean Dupont");
    expect(r.warnings.markdownRemoved).toBe(false);
  });
});

describe("isCabinetRecrutement", () => {
  it("detects cabinet de recrutement", () => {
    expect(isCabinetRecrutement("Poste publié par un cabinet de recrutement")).toBe(true);
  });

  it("detects executive search", () => {
    expect(isCabinetRecrutement("Notre client, via executive search")).toBe(true);
  });

  it("returns false for regular company", () => {
    expect(isCabinetRecrutement("TechCorp recrute un directeur")).toBe(false);
  });

  it("detects chasseur de têtes", () => {
    expect(isCabinetRecrutement("Chasseur de têtes recherche pour client")).toBe(true);
  });

  it("detects intérim", () => {
    expect(isCabinetRecrutement("Agence intérim recherche")).toBe(true);
  });
});

describe("cleanImportedJobText", () => {
  it("removes LinkedIn UI noise", () => {
    const cleaned = cleanImportedJobText("Cookies\nAccept\nDecline\nPoste : Directeur\nApply now\nSave\n");
    expect(cleaned).not.toContain("Cookies");
    expect(cleaned).not.toContain("Apply now");
    expect(cleaned).toContain("Directeur");
  });

  it("removes Indeed UI noise", () => {
    const cleaned = cleanImportedJobText("Direkteur\nIndeed\nEmployer\nActive\nPosted 3 days ago\nSign in");
    expect(cleaned).not.toContain("Indeed");
    expect(cleaned).not.toContain("Sign in");
  });

  it("removes copyright lines", () => {
    const cleaned = cleanImportedJobText("Description\n© 2026 LinkedIn Corporation");
    expect(cleaned).not.toContain("© 2026");
  });

  it("preserves job details", () => {
    const cleaned = cleanImportedJobText(
      "Directeur Commercial H/F\nTechCorp\nParis\nDescription du poste\nProfil recherché\nCookies\nAccept"
    );
    expect(cleaned).toContain("Directeur Commercial");
    expect(cleaned).toContain("TechCorp");
    expect(cleaned).toContain("Paris");
    expect(cleaned).not.toContain("Cookies");
  });

  it("removes lines that are too short", () => {
    const cleaned = cleanImportedJobText("A\nB\nDirecteur Commercial\nC");
    expect(cleaned).not.toContain("A");
    expect(cleaned).not.toContain("B");
    expect(cleaned).toContain("Directeur Commercial");
  });
});

describe("parseImportedJobText", () => {
  it("extracts title from first line", () => {
    const longDesc = "Description détaillée du poste. ".repeat(50);
    const r = parseImportedJobText(`Directeur Commercial H/F\nTechCorp\nParis\n${longDesc}\nProfil recherché : expérience confirmée.`);
    expect(r.title).toBe("Directeur Commercial H/F");
    expect(r.company).toBe("TechCorp");
    expect(r.quality).toBe("good");
  });

  it("detects LinkedIn source", () => {
    const r = parseImportedJobText("Titre\nEntreprise", "https://linkedin.com/jobs/view/123");
    expect(r.sourceName).toBe("LinkedIn");
  });

  it("detects Indeed source", () => {
    const r = parseImportedJobText("Titre\nEntreprise", "https://indeed.com/viewjob?jk=abc");
    expect(r.sourceName).toBe("Indeed");
  });

  it("marks quality as weak when title missing", () => {
    const r = parseImportedJobText("");
    expect(r.quality).toBe("weak");
    expect(r.qualityIssues).toContain("Titre manquant");
  });

  it("detects salary", () => {
    const r = parseImportedJobText("Titre\nEntreprise\nSalaire : 120-150k€\nDescription");
    expect(r.salary).toContain("120");
  });

  it("detects contract type", () => {
    const r = parseImportedJobText("Titre\nEntreprise\nCDI\nDescription");
    expect(r.contractType).toBe("CDI");
  });

  it("detects cabinet via text", () => {
    const r = parseImportedJobText("Titre\nCabinet de recrutement\nDescription longue du poste");
    expect(r.isCabinet).toBe(true);
  });
});
