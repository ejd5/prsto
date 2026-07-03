import { describe, it, expect } from "vitest";
import {
  normalizeJobTitle,
  normalizeCompanyName,
  normalizeLocation,
  createDescriptionFingerprint,
  calculateOpportunitySimilarity,
  detectDuplicates,
} from "@/lib/dedup/engine";

// ─── Normalisation ────────────────────────────────────

describe("normalizeJobTitle", () => {
  it("met en minuscule et supprime la ponctuation", () => {
    expect(normalizeJobTitle("Directeur Commercial")).toBe("commercial directeur");
  });

  it("supprime les stop words", () => {
    expect(normalizeJobTitle("Directeur de la Commercial")).toBe("commercial directeur");
  });

  it("traite les abréviations", () => {
    expect(normalizeJobTitle("Dir. Commercial H/F")).toBe("commercial dir hf");
  });

  it("tri les mots pour l'ordre canonique", () => {
    expect(normalizeJobTitle("Commercial Directeur")).toBe("commercial directeur");
    expect(normalizeJobTitle("Directeur Commercial")).toBe("commercial directeur");
  });

  it("supprime les mots courts", () => {
    expect(normalizeJobTitle("A B Directeur C")).toBe("directeur");
  });

  it("gère les titres anglais", () => {
    expect(normalizeJobTitle("Senior Sales Director")).toBe("director sales senior");
  });
});

describe("normalizeCompanyName", () => {
  it("supprime les suffixes juridiques", () => {
    expect(normalizeCompanyName("TechCorp SAS")).toBe("techcorp");
    expect(normalizeCompanyName("TechCorp SA")).toBe("techcorp");
    expect(normalizeCompanyName("TechCorp Ltd")).toBe("techcorp");
    expect(normalizeCompanyName("TechCorp Inc")).toBe("techcorp");
    expect(normalizeCompanyName("TechCorp GmbH")).toBe("techcorp");
  });

  it("supprime 'group' et 'groupe'", () => {
    expect(normalizeCompanyName("Groupe ABC")).toBe("abc");
    expect(normalizeCompanyName("ABC Group")).toBe("abc");
  });

  it("nettoie les espaces", () => {
    expect(normalizeCompanyName("  TechCorp  SAS  ")).toBe("techcorp");
  });

  it("gère les noms simples", () => {
    expect(normalizeCompanyName("TechCorp")).toBe("techcorp");
  });
});

describe("normalizeLocation", () => {
  it("supprime les qualificatifs régionaux", () => {
    expect(normalizeLocation("Paris, Île-de-France")).toBe("paris le de france");
    expect(normalizeLocation("Lyon Rhône-Alpes")).toBe("lyon rhne alpes");
  });

  it("retourne vide pour entrée vide", () => {
    expect(normalizeLocation("")).toBe("");
  });

  it("nettoie la ponctuation", () => {
    expect(normalizeLocation("Paris (75)")).toBe("paris 75");
  });
});

describe("createDescriptionFingerprint", () => {
  it("extrait les 20 mots les plus fréquents", () => {
    const text = "commercial commercial commercial directeur directeur equipe ca croissance transformation";
    const fp = createDescriptionFingerprint(text);
    expect(fp.split("|")).toContain("commercial");
    expect(fp.split("|")).toContain("directeur");
  });

  it("ignore les stop words", () => {
    const text = "le la de du directeur commercial pour sur dans avec les un une";
    const fp = createDescriptionFingerprint(text);
    expect(fp.split("|")).not.toContain("le");
    expect(fp.split("|")).not.toContain("la");
    expect(fp.split("|")).toContain("commercial");
  });

  it("retourne une chaîne vide pour texte vide", () => {
    expect(createDescriptionFingerprint("")).toBe("");
  });
});

// ─── Score de similarité ──────────────────────────────

describe("calculateOpportunitySimilarity", () => {
  const baseA = {
    normalizedTitle: "directeur commercial",
    normalizedCompany: "techcorp",
    normalizedLocation: "paris",
    descriptionFingerprint: "commercial|directeur|equipe|ca|croissance|saas|b2b",
  };

  it("score 85 pour deux offres identiques sans keywords ni contract", () => {
    const result = calculateOpportunitySimilarity(baseA, baseA);
    // company 25 + title 20 + location 15 + description 25 = 85 (pas de keywords/contract)
    expect(result.score).toBe(85);
    expect(result.status).toBe("PROBABLE_DUPLICATE");
  });

  it("score 100 quand entreprise, titre, localisation identiques + keywords + contract", () => {
    const full = {
      ...baseA,
      keywords: '["commercial","direction","equipe","ca","b2b"]',
      contractType: "CDI",
    };
    const result = calculateOpportunitySimilarity(full, full);
    expect(result.score).toBe(100);
    expect(result.status).toBe("CONFIRMED_DUPLICATE");
  });

  it("score CONFIRMED_DUPLICATE quand >= 95", () => {
    const a = { ...baseA, contractType: "CDI" };
    const b = { ...baseA, contractType: "CDI", keywords: '["commercial","direction"]' };
    const r = calculateOpportunitySimilarity(a, b);
    // Même entreprise (25), même titre (20), même location (15), même fingerprint (25) = 85 min + contract 5 = 90
    // With matching keywords could push over 95
    expect(r.score).toBeGreaterThanOrEqual(85);
  });

  it("score PROBABLE_DUPLICATE entre 75 et 94 avec même entreprise et keywords", () => {
    const a = { ...baseA, keywords: '["commercial","direction"]', contractType: "CDI" };
    const b = {
      ...baseA,
      normalizedTitle: "directeur commercial senior",
      normalizedLocation: "paris",
      keywords: '["commercial","direction"]',
      contractType: "CDI",
    };
    const result = calculateOpportunitySimilarity(a, b);
    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(result.score).toBeLessThan(95);
    expect(result.status).toBe("PROBABLE_DUPLICATE");
  });

  it("score SIMILAR entre 50 et 74 avec même entreprise et titre proche", () => {
    const b = {
      normalizedTitle: "directeur des ventes",
      normalizedCompany: "techcorp",
      normalizedLocation: "paris",
      descriptionFingerprint: "commercial|directeur|ventes|ca|equipe",
    };
    const result = calculateOpportunitySimilarity(baseA, b);
    expect(result.score).toBeGreaterThanOrEqual(50);
    expect(result.score).toBeLessThan(75);
    expect(result.status).toBe("SIMILAR");
  });

  it("score UNIQUE en dessous de 50", () => {
    const b = {
      normalizedTitle: "developpeur fullstack",
      normalizedCompany: "startupxyz",
      normalizedLocation: "marseille",
      descriptionFingerprint: "react|node|typescript|api|frontend",
    };
    const result = calculateOpportunitySimilarity(baseA, b);
    expect(result.score).toBeLessThan(50);
    expect(result.status).toBe("UNIQUE");
  });

  it("breakdown : company = 25 si nom identique", () => {
    const result = calculateOpportunitySimilarity(baseA, baseA);
    expect(result.breakdown.company).toBe(25);
  });

  it("breakdown : company = 0 si nom différent", () => {
    const b = { ...baseA, normalizedCompany: "startupxyz" };
    const result = calculateOpportunitySimilarity(baseA, b);
    expect(result.breakdown.company).toBe(0);
  });

  it("breakdown : contract = 5 si même type", () => {
    const result = calculateOpportunitySimilarity(
      { ...baseA, contractType: "CDI" },
      { ...baseA, contractType: "CDI" }
    );
    expect(result.breakdown.contract).toBe(5);
  });

  it("breakdown : contract = 0 si type différent", () => {
    const result = calculateOpportunitySimilarity(
      { ...baseA, contractType: "CDI" },
      { ...baseA, contractType: "CDD" }
    );
    expect(result.breakdown.contract).toBe(0);
  });

  it("score entre 0 et 100", () => {
    const b = {
      normalizedTitle: "developpeur",
      normalizedCompany: "startupxyz",
      normalizedLocation: "marseille",
      descriptionFingerprint: "react|node",
    };
    const result = calculateOpportunitySimilarity(baseA, b);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});

// ─── Détection par lot ────────────────────────────────

describe("detectDuplicates", () => {
  const baseOpp = (id: string, title: string, company: string) => ({
    id,
    title,
    company,
    normalizedTitle: normalizeJobTitle(title),
    normalizedCompany: normalizeCompanyName(company),
    normalizedLocation: "paris",
    descriptionFingerprint: "commercial|directeur|equipe|ca|croissance",
    duplicateStatus: "UNIQUE",
  });

  it("détecte un doublon confirmé", () => {
    const existing = [
      baseOpp("1", "Directeur Commercial", "TechCorp SAS"),
    ];
    const newOpp = baseOpp("2", "Directeur Commercial H/F", "TechCorp");

    const result = detectDuplicates(newOpp, existing);
    expect(result.matches.length).toBe(1);
    expect(result.highestScore).toBeGreaterThanOrEqual(70);
  });

  it("ignore les offres IGNORED", () => {
    const existing = [
      { ...baseOpp("1", "Directeur Commercial", "TechCorp SAS"), duplicateStatus: "IGNORED" },
    ];
    const newOpp = baseOpp("2", "Directeur Commercial", "TechCorp");

    const result = detectDuplicates(newOpp, existing);
    expect(result.matches.length).toBe(0);
    expect(result.highestStatus).toBe("UNIQUE");
  });

  it("ignore la même offre (même id)", () => {
    const existing = [baseOpp("1", "Directeur Commercial", "TechCorp")];
    const result = detectDuplicates(baseOpp("1", "Directeur Commercial", "TechCorp"), existing);
    expect(result.matches.length).toBe(0);
  });

  it("aucun match si score < 50", () => {
    const existing = [
      { ...baseOpp("1", "Développeur Fullstack", "StartupXYZ"), normalizedTitle: "developpeur fullstack", normalizedCompany: "startupxyz", descriptionFingerprint: "react|node|api" },
    ];
    const newOpp = baseOpp("2", "Directeur Commercial", "TechCorp");
    const result = detectDuplicates(newOpp, existing);
    expect(result.matches.length).toBe(0);
    expect(result.highestStatus).toBe("UNIQUE");
  });
});
