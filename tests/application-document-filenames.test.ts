import { describe, it, expect } from "vitest";
import {
  sanitizeFilenamePart,
  buildApplicationDocumentFilename,
  buildApplicationZipFilename,
} from "@/lib/jobs/document-filenames";

describe("sanitizeFilenamePart", () => {
  it("replaces spaces with underscores", () => {
    expect(sanitizeFilenamePart("Directeur Commercial")).toBe("Directeur_Commercial");
  });

  it("strips accents", () => {
    const result = sanitizeFilenamePart("Élève Déjà Côuté");
    expect(result).not.toMatch(/[ÉÈÊËÀÂÄÔÖÙÛÜÇç]/);
  });

  it("removes forbidden characters", () => {
    const result = sanitizeFilenamePart("Test:File/Name\\With*Illegal?Chars");
    expect(result).not.toMatch(/[\/\\:*?"<>|]/);
  });

  it("truncates to 80 characters", () => {
    const long = "A".repeat(150);
    expect(sanitizeFilenamePart(long).length).toBeLessThanOrEqual(80);
  });

  it("removes trailing underscores after truncation", () => {
    // "hello " → "hello_" → should be "hello"
    expect(sanitizeFilenamePart("hello ")).toBe("hello");
  });

  it("returns 'Inconnu' for empty input", () => {
    expect(sanitizeFilenamePart("")).toBe("Inconnu");
  });

  it("returns 'Inconnu' for whitespace-only input", () => {
    expect(sanitizeFilenamePart("   ")).toBe("Inconnu");
  });
});

describe("buildApplicationDocumentFilename", () => {
  it("builds CV filename with all parts", () => {
    const result = buildApplicationDocumentFilename("Jean", "Dupont", "TeamCo", "Directeur Commercial", "CV");
    expect(result).toBe("ELTON_Dupont_Jean_TeamCo_Directeur_Commercial_CV.pdf");
  });

  it("builds Lettre filename with all parts", () => {
    const result = buildApplicationDocumentFilename("Marie", "Martin", "Acme Corp", "Chef de projet", "Lettre");
    expect(result).toBe("ELTON_Martin_Marie_Acme_Corp_Chef_de_projet_Lettre.pdf");
  });

  it("uses 'Entreprise' when company is empty", () => {
    const result = buildApplicationDocumentFilename("Jean", "Dupont", "", "Manager", "CV");
    expect(result).toContain("Entreprise");
  });

  it("uses 'Poste' when title is empty", () => {
    const result = buildApplicationDocumentFilename("Jean", "Dupont", "TeamCo", "", "Lettre");
    expect(result).toContain("Poste");
  });

  it("strips accents from all parts", () => {
    const result = buildApplicationDocumentFilename("Élodie", "Chêne", "Société Générale", "Développeur", "CV");
    expect(result).toContain("Elodie");
    expect(result).not.toMatch(/[ÉÈÊË]/);
  });
});

describe("buildApplicationZipFilename", () => {
  it("builds ZIP filename with all parts", () => {
    const result = buildApplicationZipFilename("Jean", "Dupont", "TeamCo", "Directeur Commercial");
    expect(result).toBe("ELTON_Dupont_Jean_TeamCo_Directeur_Commercial_Pack.zip");
  });

  it("handles empty company and title", () => {
    const result = buildApplicationZipFilename("Jean", "Dupont", "", "");
    expect(result).toContain("Entreprise");
    expect(result).toContain("Poste");
    expect(result).toContain("Pack.zip");
  });
});
