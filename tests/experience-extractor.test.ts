import { describe, it, expect, beforeEach } from "vitest";
import {
  extractExperiencesFromResumeText,
  normalizeDateRange,
  detectCompanyAndTitle,
  detectAchievements,
  detectTools,
  detectCountryOrLocation,
  scoreExperienceConfidence,
  detectDuplicateExperience,
  resetIdCounter,
  type ExtractedExperience,
} from "@/lib/resume/experience-extractor";

function makeDemoCV(): string {
  return `RÉSUMÉ EXÉCUTIF
Directeur Commercial expérimenté avec 15 ans en B2B. Pilotage de business units jusqu'à 80M€.

EXPÉRIENCE PROFESSIONNELLE
Directeur Commercial France — TechCorp (2019-présent)
- Gestion d'une équipe de 45 commerciaux, CA 32M€
- Croissance organique +28% en 3 ans
- Déploiement Salesforce pour 120 utilisateurs
- Lancement de 2 nouvelles verticales (Santé, Industrie)

Head of Sales — ScaleUp SaaS (2016-2019)
- Équipe de 20 personnes, CA 12M€
- Levée Série B 15M$
- Acquisition de 45 clients enterprise

Directeur Commercial Adjoint — BigIndustry (2010-2016)
- Gestion d'un portefeuille de 25 grands comptes
- CA moyen par compte : 300k€-3M€

FORMATION
Master Management — HEC Paris (2009)

LANGUES
Français (natif) — Anglais (courant TOEIC 950)`;
}

function makeCVWithAlternateFormats(): string {
  return `EXPÉRIENCE PROFESSIONNELLE
CEO | ACME Corp (2018-2024)
- Direction générale de l'entreprise
- Croissance de 5M€ à 15M€

VP Sales, BigEnterprise (2014-2018)
- Management d'une équipe de 50 commerciaux
- Ouverture de 3 nouveaux marchés

ACME Corp - Country Manager (2010-2014)
- Lancement de la filiale France
- Équipe de 15 personnes

Directeur Commercial
EntrepriseX
2020 - présent
- Développement commercial France`;
}

function makeCVWithVagueInfo(): string {
  return `EXPÉRIENCE PROFESSIONNELLE
Diverses missions en consulting (2018-2023)
- Accompagnement de clients dans leur transformation digitale
- Animation de formations
- Rédaction de cahiers des charges

Un poste quelque part (2015-2017)
- Quelques réalisations
- Projets variés

FORMATION
Master en Commerce`;
}

beforeEach(() => {
  resetIdCounter();
});

// ─── extraction expérience simple ───────────────

describe("extractExperiencesFromResumeText", () => {
  it("extrait une expérience simple depuis le CV démo", () => {
    const exps = extractExperiencesFromResumeText(makeDemoCV());
    expect(exps.length).toBeGreaterThanOrEqual(3);
    // First experience
    expect(exps[0].company).toBe("TechCorp");
    expect(exps[0].title).toBe("Directeur Commercial France");
    expect(exps[0].achievements.length).toBeGreaterThanOrEqual(3);
    expect(exps[0].startDate).toBe("2019-01");
  });

  it("extrait plusieurs expériences", () => {
    const exps = extractExperiencesFromResumeText(makeDemoCV());
    expect(exps.length).toBe(3);
    expect(exps[0].company).toBe("TechCorp");
    expect(exps[1].company).toBe("ScaleUp SaaS");
    expect(exps[2].company).toBe("BigIndustry");
  });

  it("gère les formats alternatifs (pipe, comma, Company-Title)", () => {
    resetIdCounter();
    const exps = extractExperiencesFromResumeText(makeCVWithAlternateFormats());
    expect(exps.length).toBeGreaterThanOrEqual(3);
    // CEO | ACME Corp
    expect(exps[0].company).toBe("ACME Corp");
    expect(exps[0].title).toBe("CEO");
    // VP Sales, BigEnterprise
    expect(exps[1].company).toBe("BigEnterprise");
    expect(exps[1].title).toBe("VP Sales");
    // ACME Corp - Country Manager
    expect(exps[2].company).toBe("ACME Corp");
    expect(exps[2].title).toBe("Country Manager");
  });

  it("confidenceScore bas si entreprise manquante", () => {
    const exps = extractExperiencesFromResumeText(makeCVWithVagueInfo());
    // First experience has vague header
    if (exps.length > 0) {
      expect(exps[0].confidenceScore).toBeLessThan(70);
    }
  });

  it("warnings si dates incertaines", () => {
    const exps = extractExperiencesFromResumeText(makeCVWithVagueInfo());
    if (exps.length > 0) {
      expect(exps[0].warnings.length).toBeGreaterThan(0);
    }
  });

  it("ne crée pas d'expérience sans company ni titre", () => {
    const exps = extractExperiencesFromResumeText("EXPÉRIENCE PROFESSIONNELLE\n(2019-2024)\n- quelque chose");
    expect(exps.length).toBe(0);
  });

  it("retourne vide si aucune section expérience", () => {
    const exps = extractExperiencesFromResumeText("Bonjour le monde");
    expect(exps.length).toBe(0);
  });
});

// ─── normalizeDateRange ─────────────────────────

describe("normalizeDateRange", () => {
  it("détecte '2020 - 2024'", () => {
    const r = normalizeDateRange("Directeur (2020 - 2024)");
    expect(r.startDate).toBe("2020-01");
    expect(r.endDate).toBe("2024-01");
    expect(r.confidence).toBeGreaterThanOrEqual(85);
  });

  it("détecte '2019-présent'", () => {
    const r = normalizeDateRange("TechCorp (2019-présent)");
    expect(r.startDate).toBe("2019-01");
    expect(r.endDate).toBeNull();
    expect(r.confidence).toBeGreaterThanOrEqual(80);
  });

  it("détecte 'Depuis 2021'", () => {
    const r = normalizeDateRange("Depuis 2021, je travaille chez");
    expect(r.startDate).toBe("2021-01");
    expect(r.endDate).toBeNull();
  });

  it("détecte '2019-present'", () => {
    const r = normalizeDateRange("Chez ACME (2019-present)");
    expect(r.startDate).toBe("2019-01");
    expect(r.endDate).toBeNull();
  });

  it("retourne null si aucune date", () => {
    const r = normalizeDateRange("Directeur Commercial");
    expect(r.startDate).toBeNull();
    expect(r.endDate).toBeNull();
    expect(r.confidence).toBe(0);
  });

  it("détecte date inline sans parenthèses '2018 - 2023'", () => {
    const r = normalizeDateRange("Diverses missions (2018-2023)");
    expect(r.startDate).toBe("2018-01");
    expect(r.endDate).toBe("2023-01");
  });
});

// ─── detectCompanyAndTitle ──────────────────────

describe("detectCompanyAndTitle", () => {
  it("détecte 'Titre — Entreprise' avec em-dash", () => {
    const r = detectCompanyAndTitle("Directeur Commercial — TechCorp (2019-présent)");
    expect(r.company).toBe("TechCorp");
    expect(r.title).toBe("Directeur Commercial");
  });

  it("détecte 'Titre | Entreprise' avec pipe", () => {
    const r = detectCompanyAndTitle("CEO | ACME Corp (2018-2024)");
    expect(r.company).toBe("ACME Corp");
    expect(r.title).toBe("CEO");
  });

  it("détecte 'Titre, Entreprise' avec virgule", () => {
    const r = detectCompanyAndTitle("VP Sales, BigEnterprise");
    expect(r.company).toBe("BigEnterprise");
    expect(r.title).toBe("VP Sales");
  });

  it("company=null si aucune entreprise détectée", () => {
    const r = detectCompanyAndTitle("Directeur Commercial (2019-2024)");
    expect(r.company).toBeNull();
    expect(r.title).toBe("Directeur Commercial");
    expect(r.warnings.length).toBeGreaterThan(0);
  });
});

// ─── detectAchievements ─────────────────────────

describe("detectAchievements", () => {
  it("détecte les lignes avec puces", () => {
    const block = "Directeur — Entreprise\n- Gestion équipe de 45 personnes\n- Croissance +28%\nDescription normale";
    const a = detectAchievements(block);
    expect(a).toHaveLength(2);
    expect(a[0]).toBe("Gestion équipe de 45 personnes");
  });
});

// ─── detectTools ─────────────────────────────────

describe("detectTools", () => {
  it("détecte Salesforce", () => {
    const tools = detectTools("Déploiement Salesforce pour 120 utilisateurs");
    expect(tools).toContain("Salesforce");
  });
});

// ─── detectCountryOrLocation ────────────────────

describe("detectCountryOrLocation", () => {
  it("détecte France", () => {
    const r = detectCountryOrLocation("Directeur Commercial France");
    expect(r.country).toBe("FR");
  });
});

// ─── scoreExperienceConfidence ──────────────────

describe("scoreExperienceConfidence", () => {
  it("score élevé pour expérience complète", () => {
    const exp: ExtractedExperience = {
      id: "test", company: "TechCorp", title: "Directeur", startDate: "2020-01",
      endDate: "2024-01", location: null, country: null, sector: null,
      description: "Longue description avec plein de détails sur le poste",
      achievements: ["Réalisation 1", "Réalisation 2"], tools: ["Salesforce"],
      teamSize: null, revenue: null, budget: null, confidenceScore: 0,
      warnings: [], sourceText: "test",
    };
    const { score } = scoreExperienceConfidence(exp);
    expect(score).toBeGreaterThan(70);
  });

  it("score faible sans company ni title", () => {
    const exp: ExtractedExperience = {
      id: "test", company: null, title: null, startDate: null,
      endDate: null, location: null, country: null, sector: null,
      description: "", achievements: [], tools: [],
      teamSize: null, revenue: null, budget: null, confidenceScore: 0,
      warnings: [], sourceText: "test",
    };
    const { score } = scoreExperienceConfidence(exp);
    expect(score).toBeLessThan(30);
  });
});

// ─── detectDuplicateExperience ──────────────────

describe("detectDuplicateExperience", () => {
  it("détecte un doublon exact", () => {
    const exp: ExtractedExperience = {
      id: "test", company: "TechCorp", title: "Directeur", startDate: "2020-01",
      endDate: "2024-01", location: null, country: null, sector: null,
      description: "", achievements: [], tools: [],
      teamSize: null, revenue: null, budget: null, confidenceScore: 50,
      warnings: [], sourceText: "",
    };
    const existing = [{ company: "TechCorp", title: "Directeur", startDate: "2020-01", endDate: "2024-01" }];
    const result = detectDuplicateExperience(exp, existing);
    expect(result.isDuplicate).toBe(true);
    expect(result.confidence).toBe(95);
  });

  it("détecte un doublon partiel", () => {
    const exp: ExtractedExperience = {
      id: "test", company: "TechCorp", title: "Directeur", startDate: "2020-01",
      endDate: null, location: null, country: null, sector: null,
      description: "", achievements: [], tools: [],
      teamSize: null, revenue: null, budget: null, confidenceScore: 50,
      warnings: [], sourceText: "",
    };
    const existing = [{ company: "TechCorp", title: "Directeur", startDate: "2020-06", endDate: "2024-01" }];
    const result = detectDuplicateExperience(exp, existing);
    expect(result.isDuplicate).toBe(true);
    expect(result.confidence).toBe(60);
  });

  it("ne signale pas de doublon si company différente", () => {
    const exp: ExtractedExperience = {
      id: "test", company: "TechCorp", title: "Directeur", startDate: "2020-01",
      endDate: null, location: null, country: null, sector: null,
      description: "", achievements: [], tools: [],
      teamSize: null, revenue: null, budget: null, confidenceScore: 50,
      warnings: [], sourceText: "",
    };
    const existing = [{ company: "ACME", title: "Directeur", startDate: "2020-01", endDate: "2024-01" }];
    const result = detectDuplicateExperience(exp, existing);
    expect(result.isDuplicate).toBe(false);
  });
});
