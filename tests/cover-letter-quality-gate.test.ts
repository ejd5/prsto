import { describe, it, expect } from "vitest";
import { checkLetterQuality, isLetterUsable } from "@/lib/jobs/cover-letter-quality-gate";

const GOOD_LETTER = [
  "Madame, Monsieur,",
  "",
  "Le poste de Directeur Commercial France H/F chez TechCorp France correspond précisément à mon parcours et à mes réalisations en direction commerciale. Votre recherche d'un profil capable de structurer la croissance sur le marché français fait écho à mes 15 années d'expérience dans le pilotage d'équipes commerciales, le développement de réseaux de vente et la transformation des performances business.",
  "",
  "Dans mon poste le plus récent en tant que Directeur Commercial chez Groupe ABC, j'ai piloté une équipe de 35 personnes avec un P&L de 15M€, généré une croissance de +45% en 5 ans et mis en œuvre une transformation des processus commerciaux qui a amélioré la productivité de l'équipe de 30%. Ces résultats illustrent ma capacité à répondre aux enjeux de croissance et de structuration que vous décrivez dans votre annonce.",
  "",
  "Mon parcours m'a également permis de développer une expertise en négociation grands comptes, en pilotage de la performance et en management d'équipes multiculturelles. Je suis convaincu que ces compétences, associées à ma connaissance du secteur IT, me permettront de contribuer efficacement à vos objectifs commerciaux.",
  "",
  "Je serais ravi de vous rencontrer pour échanger sur ma vision du poste et les résultats concrets que je peux apporter à TechCorp France.",
  "",
  "Cordialement, Jean Dupont",
].join("\n");

describe("checkLetterQuality", () => {
  it("passes a good letter", () => {
    const result = checkLetterQuality(GOOD_LETTER, "Directeur Commercial France H/F", "TechCorp France");
    expect(result.passed).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it("rejects too short letter", () => {
    const result = checkLetterQuality("Bonjour, je postule.", "Poste", "Société");
    expect(result.passed).toBe(false);
    expect(result.errors.some(e => e.code === "TOO_FEW_WORDS")).toBe(true);
  });

  it("flags missing company name", () => {
    const letter = "Madame, Monsieur,\n\nJe postule au poste de Directeur Commercial. J'ai 15 ans d'expérience en direction commerciale. Je suis disponible pour un échange. Cordialement.";
    const result = checkLetterQuality(letter, "Directeur Commercial", "TechCorp");
    // If the letter doesn't mention "TechCorp", it should have a warning
    expect(result.warnings.some(w => w.code === "MISSING_COMPANY")).toBe(true);
  });

  it("flags placeholders", () => {
    const letter = "Je postule au poste de [Titre du poste] chez [Entreprise]. Avec [X] ans d'expérience.";
    const result = checkLetterQuality(letter, "Poste", "Entreprise");
    expect(result.passed).toBe(false);
    expect(result.errors.some(e => e.code === "PLACEHOLDER")).toBe(true);
  });

  it("flags technical text", () => {
    const letter = "Je postule. POSTE TERMINÉ sendableToAI semanticScore 85. Expérience en management.";
    const result = checkLetterQuality(letter, "Poste", "Société");
    expect(result.passed).toBe(false);
    expect(result.errors.some(e => e.code === "TECHNICAL_TEXT")).toBe(true);
  });

  it("isLetterUsable returns true for score >= 40", () => {
    const result = checkLetterQuality(GOOD_LETTER, "Directeur Commercial France H/F", "TechCorp France");
    expect(isLetterUsable(result)).toBe(true);
  });
});
