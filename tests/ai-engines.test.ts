import { describe, it, expect, vi } from "vitest";

// Mock getDeepSeekConfig to return null → all engines use heuristic fallback (no DB needed)
vi.mock("@/lib/ai/deepseek", async () => {
  const actual = await vi.importActual<typeof import("@/lib/ai/deepseek")>("@/lib/ai/deepseek");
  return {
    ...actual,
    getDeepSeekConfig: vi.fn().mockResolvedValue(null),
  };
});

import { scanResume } from "@/lib/jobs/ats-resume-scanner";
import { optimizeCv } from "@/lib/jobs/ai-cv-optimizer";
import { generateSummary, generateAllVariants, adaptForJob } from "@/lib/jobs/resume-summary-generator";
import { generateBulletPoints, generateAllBulletPoints } from "@/lib/jobs/bullet-point-generator";
import { analyzeLinkedInProfile } from "@/lib/jobs/linkedin-optimizer";
import { analyzeSkillGaps } from "@/lib/jobs/skills-database";

const MOCK_CV = `Directeur Commercial avec plus de 15 ans d'expérience dans l'industrie et le SaaS.
Expert en développement commercial, management d'équipes et pilotage de la performance.

EXPÉRIENCE PROFESSIONNELLE

Directeur Commercial – TechCorp (2018-présent)
• Pilotage d'une équipe de 25 personnes
• Chiffre d'affaires : 15M€
• Budget : 500K€
• Développé le portefeuille clients de 30% en 2 ans
• Mis en place une stratégie de transformation digitale

Country Manager – IndusGroup (2014-2018)
• Management d'une équipe de 50 personnes
• P&L complet, CA de 25M€
• Lancement de 3 nouvelles gammes de produits
• Négociation de contrats avec les 5 plus gros comptes nationaux

Directeur Commercial – SoluTech (2010-2014)
• Développement commercial B2B
• Équipe de 10 personnes
• Croissance du CA de 40%

FORMATION

MBA – HEC Paris (2008-2010)
Master en Commerce International – ESSEC (2005-2008)

COMPÉTENCES
Leadership, Management d'équipe, P&L, Développement commercial, Négociation,
Transformation digitale, Stratégie d'entreprise, Business Plan, Force de vente

LANGUES
Français : Langue maternelle
Anglais : Courant (C1)
Allemand : Intermédiaire (B1)`;

const MOCK_JD = `Directeur Commercial – Secteur Industriel
Notre client, un leader de l'industrie manufacturière, recherche un Directeur Commercial pour piloter la stratégie commerciale et développer le chiffre d'affaires en France et en Europe.

Missions :
• Définir et exécuter la stratégie commerciale
• Manager une équipe de 15 commerciaux
• Piloter le P&L de la BU (CA 20M€)
• Développer le portefeuille clients grands comptes
• Accompagner la transformation digitale de la force de vente
• Négocier les contrats stratégiques

Profil recherché :
• Minimum 10 ans d'expérience en direction commerciale
• Expertise en management d'équipe et développement business
• Maîtrise du P&L et des outils CRM (Salesforce)
• Anglais courant impératif
• Formation supérieure (MBA ou équivalent)`;

describe("ATS Scanner (AI + heuristic fallback)", () => {
  it("returns correct structure with heuristic fallback", async () => {
    const result = await scanResume({
      cvText: MOCK_CV,
      jobTitle: "Directeur Commercial",
      jobDescription: MOCK_JD,
      company: "IndustrieLeader",
    });

    expect(result).toHaveProperty("globalScore");
    expect(result).toHaveProperty("keywordMatch");
    expect(result).toHaveProperty("formatScore");
    expect(result).toHaveProperty("sectionCoverage");
    expect(result).toHaveProperty("matchedKeywords");
    expect(result).toHaveProperty("missingKeywords");
    expect(result).toHaveProperty("sectionScores");
    expect(result).toHaveProperty("suggestions");
    expect(result).toHaveProperty("rawJobKeywords");
    expect(result).toHaveProperty("rawCvKeywords");

    expect(typeof result.globalScore).toBe("number");
    expect(result.globalScore).toBeGreaterThanOrEqual(0);
    expect(result.globalScore).toBeLessThanOrEqual(100);
    expect(result.matchedKeywords.length).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(result.suggestions)).toBe(true);
  });
});

describe("CV Optimizer (AI + heuristic fallback)", () => {
  it("returns correct structure with heuristic fallback", async () => {
    const result = await optimizeCv({
      cvText: MOCK_CV,
      jobTitle: "Directeur Commercial",
      jobDescription: MOCK_JD,
      company: "IndustrieLeader",
      profile: {
        fullName: "Jean Dupont",
        title: "Directeur Commercial",
        summary: "Directeur Commercial avec 15 ans d'expérience",
        sectors: "Industrie, SaaS",
      },
      experiences: [
        {
          company: "TechCorp",
          title: "Directeur Commercial",
          startDate: "2018-01-01",
          endDate: undefined,
          description: "Pilotage d'une équipe de 25 personnes",
          revenue: "15M€",
          teamSize: "25",
          budget: "500K€",
          achievements: "Développé le portefeuille clients de 30%",
        },
      ],
      skills: [
        { name: "Leadership", category: "leadership", level: "expert" },
        { name: "P&L Management", category: "finance", level: "expert" },
      ],
    });

    expect(result).toHaveProperty("summary");
    expect(result).toHaveProperty("suggestions");
    expect(result.summary).toHaveProperty("originalScore");
    expect(result.summary).toHaveProperty("improvedScore");
    expect(result.summary).toHaveProperty("totalSuggestions");
    expect(Array.isArray(result.suggestions)).toBe(true);
  });
});

describe("Resume Summary Generator (AI + heuristic fallback)", () => {
  it("generateSummary returns correct structure", async () => {
    const result = await generateSummary({
      fullName: "Jean Dupont",
      title: "Directeur Commercial",
      summary: MOCK_CV.slice(0, 200),
      yearsExp: 15,
      sectors: JSON.stringify(["Industrie", "SaaS"]),
      location: "Paris",
    }, "formel");

    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("tone");
    expect(result).toHaveProperty("text");
    expect(result).toHaveProperty("length");
    expect(typeof result.text).toBe("string");
    expect(result.text.length).toBeGreaterThan(20);
  });

  it("generateAllVariants returns 9 variants (3 tones × 3 targets)", async () => {
    const results = await generateAllVariants({
      fullName: "Jean Dupont",
      title: "Directeur Commercial",
      summary: MOCK_CV.slice(0, 200),
      yearsExp: 15,
    });

    expect(results.length).toBe(9);
    const tones = new Set(results.map((r) => r.tone));
    const targets = new Set(results.map((r) => r.target));
    expect(tones.size).toBe(3);
    expect(targets.size).toBe(3);
  });

  it("adaptForJob returns targeted summary", async () => {
    const result = await adaptForJob(
      {
        fullName: "Jean Dupont",
        title: "Directeur Commercial",
        yearsExp: 15,
      },
      "VP Sales",
      "TargetCorp"
    );

    expect(result).toHaveProperty("tone");
    expect(result).toHaveProperty("text");
    expect(result.text.length).toBeGreaterThan(20);
  });
});

describe("Bullet Points Generator (AI + heuristic fallback)", () => {
  it("generateBulletPoints returns correct structure", async () => {
    const result = await generateBulletPoints({
      company: "TechCorp",
      title: "Directeur Commercial",
      startDate: "2018-01-01",
      description: "Pilotage de la stratégie commerciale et management d'équipe",
      achievements: JSON.stringify([
        "Augmenté le CA de 30% en 2 ans",
        "Signé un contrat cadre avec 3 nouveaux comptes stratégiques",
        "Mis en place un CRM Salesforce couvrant 100% de l'équipe",
      ]),
      revenue: "15M€",
      teamSize: "25",
      budget: "500K€",
    });

    expect(result).toHaveProperty("experienceId");
    expect(result).toHaveProperty("company");
    expect(result).toHaveProperty("title");
    expect(result).toHaveProperty("bullets");
    expect(result).toHaveProperty("suggestions");
    expect(result.bullets.length).toBeGreaterThanOrEqual(3);

    // Vérifie les 3 styles
    const styles = new Set(result.bullets.map((b) => b.style));
    expect(styles.has("star")).toBe(true);
    expect(styles.has("concise")).toBe(true);
    expect(styles.has("numbered")).toBe(true);
  });

  it("generateAllBulletPoints handles multiple experiences", async () => {
    const results = await generateAllBulletPoints([
      {
        company: "TechCorp",
        title: "Directeur Commercial",
        startDate: "2018-01-01",
      },
      {
        company: "IndusGroup",
        title: "Country Manager",
        startDate: "2014-06-01",
        endDate: "2018-01-01",
      },
    ]);

    expect(results.length).toBe(2);
    expect(results[0].company).toBe("TechCorp");
    expect(results[1].company).toBe("IndusGroup");
  });
});

describe("LinkedIn Optimizer (AI + heuristic fallback)", () => {
  it("analyzeLinkedInProfile returns correct structure", async () => {
    const result = await analyzeLinkedInProfile({
      fullName: "Jean Dupont",
      title: "Directeur Commercial | Industrie & SaaS | Transformation & Croissance",
      summary: "Directeur Commercial avec 15 ans d'expérience dans l'industrie et le SaaS. Expert en développement commercial, management d'équipes et transformation digitale. Résultats : croissance du CA de 30%, management d'équipes jusqu'à 50 personnes, pilotage de P&L jusqu'à 25M€.",
      location: "Paris",
      sectors: JSON.stringify(["Industrie", "SaaS"]),
      experiences: [
        {
          company: "TechCorp",
          title: "Directeur Commercial",
          startDate: "2018-01-01",
          description: "Pilotage d'une équipe de 25 personnes, CA de 15M€",
        },
      ],
      skills: [
        { name: "Leadership", category: "leadership", level: "expert" },
        { name: "P&L Management", category: "finance", level: "expert" },
        { name: "Négociation", category: "commercial", level: "expert" },
      ],
    });

    expect(result).toHaveProperty("overallScore");
    expect(result).toHaveProperty("sections");
    expect(result).toHaveProperty("suggestions");
    expect(result).toHaveProperty("strengths");
    expect(Array.isArray(result.sections)).toBe(true);
    expect(result.sections.length).toBe(5);
    expect(typeof result.overallScore).toBe("number");
  });
});

describe("Skills Database (AI + heuristic fallback)", () => {
  it("analyzeSkillGaps returns correct structure", async () => {
    const result = await analyzeSkillGaps(
      [
        { name: "Leadership", category: "leadership", level: "expert" },
        { name: "P&L Management", category: "finance", level: "expert" },
        { name: "Négociation", category: "commercial", level: "expert" },
        { name: "Développement commercial", category: "commercial", level: "expert" },
      ],
      "industrie",
      "direction"
    );

    expect(result).toHaveProperty("present");
    expect(result).toHaveProperty("missing");
    expect(result).toHaveProperty("strengths");
    expect(result).toHaveProperty("recommendations");
    expect(result).toHaveProperty("coverageByCategory");
    expect(Array.isArray(result.present)).toBe(true);
    expect(Array.isArray(result.missing)).toBe(true);
    expect(typeof result.coverageByCategory).toBe("object");
  });

  it("returns empty strengths when no skills provided", async () => {
    const result = await analyzeSkillGaps([], undefined, undefined);
    expect(result.present.length).toBe(0);
    expect(Array.isArray(result.missing)).toBe(true);
  });
});
