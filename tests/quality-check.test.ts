import { describe, it, expect } from "vitest";
import { evaluateDocumentQuality } from "@/lib/quality-check/engine";

const GOOD_CV = `JEAN DUPONT — Directeur Commercial | B2B | 15 ans

RÉSUMÉ
Directeur Commercial orienté résultats avec 15 ans d'expérience en B2B. Pilotage de filiales à l'international, gestion de P&L jusqu'à 45M€, transformation d'organisations commerciales.

EXPÉRIENCE PROFESSIONNELLE
Directeur Commercial — Groupe ABC (2018-Présent)
Paris, France
Pilotage de la stratégie commerciale France. Management de 35 collaborateurs.
• CA France : 45M€ — Croissance de 35% sur 3 ans
• Déploiement d'une nouvelle stratégie de pricing générant +8% de marge
• Recrutement et structuration d'une équipe de 5 Key Account Managers

Head of Sales — XYZ Corp (2015-2018)
Lyon, France
Direction des ventes B2B SaaS. Équipe de 20 personnes.
• Croissance du portefeuille client de +40% en 2 ans
• Négociation de 3 contrats stratégiques > 1M€ chacun

FORMATION
MBA — HEC Paris (2010)

LANGUES
Français (natif) · Anglais (courant) · Espagnol (B2)`;

const GENERIC_CV = `Je suis une personne passionnée et rigoureuse avec un bon sens de l'organisation. Dans le cadre de mes fonctions, j'ai pu développer mes compétences en management. Je suis convaincu que mon dynamisme et ma forte capacité d'adaptation sont des atouts pour votre entreprise. Je souhaite vous faire part de ma candidature pour le poste. Je me permets de vous adresser mon CV. Dans cette optique, je reste à votre disposition pour un entretien. Dans l'attente de votre retour, n'hésitez pas à me contacter.`;

describe("Quality Check Engine", () => {
  describe("evaluateDocumentQuality", () => {
    it("returns a valid QualityScore for good content", () => {
      const result = evaluateDocumentQuality({
        text: GOOD_CV,
        offerTitle: "Directeur Commercial France",
        offerCompany: "TechCorp",
        candidateName: "Jean Dupont",
        candidateTitle: "Directeur Commercial",
      });

      expect(result.overall).toBeGreaterThanOrEqual(60);
      expect(result.overall).toBeLessThanOrEqual(100);
      expect(result.breakdown.clarity).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.credibility).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.personalization).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.proof).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.humanTone).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.atsKeywords).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.noInventedGaps).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.noGenericPhrases).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.executiveLevel).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.appropriateLength).toBeGreaterThanOrEqual(0);
    });

    it("detects generic phrases in weak content", () => {
      const result = evaluateDocumentQuality({ text: GENERIC_CV });

      expect(result.genericPhrases.length).toBeGreaterThanOrEqual(3);
      expect(result.overall).toBeLessThan(60);
    });

    it("scores good content higher than generic content", () => {
      const good = evaluateDocumentQuality({ text: GOOD_CV });
      const weak = evaluateDocumentQuality({ text: GENERIC_CV });

      expect(good.overall).toBeGreaterThan(weak.overall);
    });

    it("gives higher personalization when offer is provided", () => {
      const withOffer = evaluateDocumentQuality({
        text: GOOD_CV,
        offerTitle: "Directeur Commercial France",
        offerCompany: "TechCorp",
        candidateName: "Jean Dupont",
        candidateTitle: "Directeur Commercial",
      });

      const withoutOffer = evaluateDocumentQuality({ text: GOOD_CV });

      expect(withOffer.breakdown.personalization).toBeGreaterThan(withoutOffer.breakdown.personalization);
    });

    it("detects risky phrases with unverified numbers", () => {
      const text = "J'ai généré 150% de croissance et dirigé une équipe de 200 personnes. J'ai obtenu le prix du meilleur manager.";
      const result = evaluateDocumentQuality({ text });

      // Should have at least some risky phrases
      expect(result.riskyPhrases.length).toBeGreaterThan(0);
      // Credibility should be penalized
      expect(result.breakdown.credibility).toBeLessThanOrEqual(7);
    });

    it("gives higher executive level for leadership content", () => {
      const exec = "P&L management, board presentation, international strategy, EBITDA optimization, team leadership across 3 countries";
      const ops = "Saisie des commandes, classement des dossiers, reporting quotidien, tâches administratives";

      const execResult = evaluateDocumentQuality({ text: exec });
      const opsResult = evaluateDocumentQuality({ text: ops });

      expect(execResult.breakdown.executiveLevel).toBeGreaterThan(opsResult.breakdown.executiveLevel);
    });

    it("produces strengths array for good content", () => {
      const result = evaluateDocumentQuality({ text: GOOD_CV });

      expect(result.strengths.length).toBeGreaterThan(0);
      expect(Array.isArray(result.strengths)).toBe(true);
    });

    it("produces improvements array for weak content", () => {
      const result = evaluateDocumentQuality({ text: GENERIC_CV });

      expect(result.improvements.length).toBeGreaterThan(0);
      expect(Array.isArray(result.improvements)).toBe(true);
    });

    it("produces rewrite recommendations", () => {
      const result = evaluateDocumentQuality({ text: GENERIC_CV });

      expect(result.rewriteRecommendations.length).toBeGreaterThan(0);
    });

    it("handles empty text", () => {
      const result = evaluateDocumentQuality({ text: "" });

      expect(result.overall).toBe(0);
      expect(result.breakdown.clarity).toBe(0);
    });

    it("handles very short text", () => {
      const result = evaluateDocumentQuality({ text: "Bonjour, voici mon CV." });

      expect(result.breakdown.appropriateLength).toBeLessThanOrEqual(5);
    });

    it("returns breakdown with all 10 criteria", () => {
      const result = evaluateDocumentQuality({ text: GOOD_CV });

      const criteria = [
        "clarity", "credibility", "personalization", "proof", "humanTone",
        "atsKeywords", "noInventedGaps", "noGenericPhrases", "executiveLevel", "appropriateLength",
      ];
      for (const c of criteria) {
        expect(result.breakdown[c as keyof typeof result.breakdown]).toBeGreaterThanOrEqual(0);
        expect(result.breakdown[c as keyof typeof result.breakdown]).toBeLessThanOrEqual(10);
      }
    });

    it("overall score is roughly the sum of breakdown / 1", () => {
      const result = evaluateDocumentQuality({ text: GOOD_CV });
      const sum = Object.values(result.breakdown).reduce((a, b) => a + b, 0);

      // Overall should be close to the sum (each criterion is 0-10, overall is 0-100)
      expect(Math.abs(result.overall - sum)).toBeLessThanOrEqual(5);
    });

    it("english text is evaluated correctly", () => {
      const text = `JEAN DUPONT\nSenior Sales Director\n\nPROFESSIONAL SUMMARY\nResults-driven Sales Director with 15+ years. Managed P&L of $45M. International experience across 5 countries.\n\nPROFESSIONAL EXPERIENCE\nSales Director — ABC Group (2018-Present)\n• Revenue: $45M — CAGR +12% over 5 years\n• Team: 35 sales professionals\n\nEDUCATION\nMBA — HEC Paris (2010)`;
      const result = evaluateDocumentQuality({
        text,
        candidateName: "Jean Dupont",
        candidateTitle: "Sales Director",
      });

      expect(result.overall).toBeGreaterThanOrEqual(45);
      expect(result.breakdown.executiveLevel).toBeGreaterThanOrEqual(3);
    });
  });
});
