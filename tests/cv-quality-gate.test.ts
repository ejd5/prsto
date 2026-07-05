import { describe, it, expect } from "vitest";
import { checkCvQuality } from "@/lib/jobs/cv-quality-gate";

describe("checkCvQuality", () => {
  it("passes clean CV", () => {
    const result = checkCvQuality(
      "Profil de direction commerciale\n\nDirecteur Commercial avec 15 ans d'expérience dans le pilotage d'équipes commerciales, le développement de réseaux de vente et la transformation des performances business. Management d'équipe de 30 personnes. P&L de 15M€.\n\nEXPÉRIENCE PROFESSIONNELLE\n\nTechCorp (2018-2023)\nDirecteur Commercial France\nPilotage de la stratégie commerciale France. Management d'une équipe de 30 commerciaux."
    );
    expect(result.passed).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it("flags POSTE TERMINÉ as error", () => {
    const result = checkCvQuality("Directeur Commercial (POSTE TERMINÉ)");
    expect(result.passed).toBe(false);
    expect(result.errors.some(e => e.code === "INTERNAL_MARKER")).toBe(true);
  });

  it("flags undefined/null as error", () => {
    const result = checkCvQuality("Compétence undefined");
    expect(result.passed).toBe(false);
    expect(result.errors.some(e => e.code === "UNDEFINED_TEXT")).toBe(true);
  });

  it("flags very short CV as error", () => {
    const result = checkCvQuality("Bonjour");
    expect(result.passed).toBe(false);
    expect(result.errors.some(e => e.code === "TOO_SHORT")).toBe(true);
  });

  it("computes score correctly for good CV", () => {
    const result = checkCvQuality(
      "Profil de direction commerciale\n\nDirecteur Commercial avec 15 ans d'expérience.\nManagement d'équipe, développement commercial.\n\nEXPÉRIENCE PROFESSIONNELLE\n\nTechCorp (2018-2023)\n\nSAVOIR-FAIRE STRATÉGIQUE\n• Direction commerciale : pilotage réseau, négociation\n• CRM Salesforce\n\nSAVOIR-ÊTRE EXÉCUTIF\n• Leadership d'équipe, culture du résultat"
    );
    expect(result.score).toBeGreaterThanOrEqual(50);
  });

  it("flags JSON residue as warning", () => {
    const result = checkCvQuality(
      'Profil de direction commerciale\n\n"data": "value"\n\nEXPÉRIENCE PROFESSIONNELLE\n\nTechCorp (2018-2023)\nManagement d\'équipe.\nCompétences variées en direction commerciale.'
    );
    expect(result.warnings.some(w => w.code === "JSON_RESIDUE")).toBe(true);
  });
});
