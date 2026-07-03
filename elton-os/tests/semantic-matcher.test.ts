import { describe, it, expect } from "vitest";
import {
  analyzeJobFit,
  computeSemanticFitScore,
  explainJobFit,
  detectFitRisks,
  detectMissingSignals,
  recommendApplicationAction,
  serializeAnalysis,
} from "../lib/jobs/semantic-matcher";
import type { JobInput, ProfileInput } from "../lib/jobs/semantic-matcher";

/* ─── Setup ──────────────────────────────────── */

const PROFILE: ProfileInput = {
  fullName: "Elton Duarte",
  title: "Directeur Commercial",
  summary: "Plus de 20 ans d'expérience en direction commerciale, pilotage d'équipes commerciales, développement international, marchés francophones.",
  location: "Marseille",
  mobility: JSON.stringify(["PACA", "IDF", "France", "Europe"]),
  languages: JSON.stringify(["Français (natif)", "Anglais (courant)", "Portugais (natif)"]),
  yearsExp: 22,
  sectors: JSON.stringify(["Commerce B2B", "Distribution", "Services"]),
  functions: JSON.stringify(["Direction commerciale", "Business Development"]),
  remotePreference: "hybrid",
  targetSalary: "120000-150000",
  constraints: null,
};

/* ─── Catégorie 1 : Cas positifs ─────────────── */

describe("Positive matches", () => {
  it("Directeur Commercial France — highly_recommended", () => {
    const job: JobInput = {
      title: "Directeur Commercial France",
      company: "TechCorp France",
      location: "Paris",
      locationPriority: 2,
      contractType: "CDI",
      salaryMin: 130000,
      salaryMax: 160000,
      seniority: "director",
      functionArea: "Direction commerciale",
      sector: "Technologie B2B",
      description: "Pilotage de l'équipe commerciale France (15 personnes). Stratégie commerciale, développement des grands comptes, gestion du P&L, reporting au CEO. International expansion.",
      remotePolicy: "hybrid",
    };
    const result = analyzeJobFit(job, PROFILE);
    expect(result.overallScore).toBeGreaterThanOrEqual(75);
    expect(["highly_recommended", "recommended"]).toContain(result.recommendation);
    expect(result.recommendedAction).toBe("apply_now");
    expect(result.positiveSignals.length).toBeGreaterThanOrEqual(3);
  });

  it("Country Manager France — recommended", () => {
    const job: JobInput = {
      title: "Country Manager France",
      company: "GlobalRetail",
      location: "Lyon",
      locationPriority: 1,
      contractType: "CDI",
      salaryMin: 120000,
      salaryMax: 140000,
      seniority: "executive",
      functionArea: "Direction générale",
      sector: "Retail / Distribution",
      description: "Responsable du développement de l'activité en France. Management d'équipe, stratégie commerciale, expansion du marché français.",
      remotePolicy: "hybrid",
    };
    const result = analyzeJobFit(job, PROFILE);
    expect(result.overallScore).toBeGreaterThanOrEqual(70);
    expect(result.recommendation).toMatch(/recommended|highly_recommended/);
  });

  it("Sales Director Europe with French market focus — recommended", () => {
    const job: JobInput = {
      title: "Sales Director Europe",
      company: "CloudStack",
      location: "Remote Europe",
      locationPriority: 1,
      contractType: "CDI",
      salaryMin: 140000,
      salaryMax: 170000,
      seniority: "director",
      functionArea: "Sales",
      sector: "SaaS B2B",
      description: "Lead European sales team. French market is key — French speaking required. Remote from France, UK, or Germany. Enterprise sales, go-to-market strategy.",
      remotePolicy: "remote",
    };
    const result = analyzeJobFit(job, PROFILE);
    expect(result.overallScore).toBeGreaterThanOrEqual(70);
    expect(result.positiveSignals.some(s => s.label.includes("Remote") || s.label.includes("international"))).toBe(true);
  });

  it("Head of Sales Paris — recommended", () => {
    const job: JobInput = {
      title: "Head of Sales",
      company: "ScaleUp",
      location: "Paris",
      locationPriority: 2,
      contractType: "CDI",
      salaryMin: 110000,
      salaryMax: 140000,
      seniority: "head",
      functionArea: "Sales",
      sector: "FinTech",
      description: "Build and lead the French sales team from scratch. Define GTM strategy, hire 10+ AEs. Report to CEO. P&L ownership. French and English required.",
      remotePolicy: "hybrid",
    };
    const result = analyzeJobFit(job, PROFILE);
    expect(result.overallScore).toBeGreaterThanOrEqual(65);
    expect(result.recommendation).not.toBe("reject");
    expect(result.scores.roleFit).toBeGreaterThanOrEqual(50);
  });

  it("VP Sales EMEA — highly_recommended", () => {
    const job: JobInput = {
      title: "VP Sales EMEA",
      company: "Enterprise Inc",
      location: "London / Remote EMEA",
      locationPriority: 1,
      contractType: "CDI",
      salaryMin: 180000,
      salaryMax: 220000,
      seniority: "vice president",
      functionArea: "Sales Leadership",
      sector: "Enterprise Software",
      description: "VP Sales for EMEA region. Manage 50+ person sales org. Drive revenue growth across Europe. French market is a priority. Board-level reporting.",
      remotePolicy: "remote",
    };
    const result = analyzeJobFit(job, PROFILE);
    expect(result.overallScore).toBeGreaterThanOrEqual(70);
    expect(["highly_recommended", "recommended"]).toContain(result.recommendation);
  });

  it("Directeur Business Development Marseille — perfect location match", () => {
    const job: JobInput = {
      title: "Directeur Business Development",
      company: "Startup PACA",
      location: "Marseille",
      locationPriority: 0,
      contractType: "CDI",
      salaryMin: 100000,
      salaryMax: 130000,
      seniority: "director",
      functionArea: "Business Development",
      sector: "Logistique",
      description: "Développement commercial région PACA et Sud-Est. Grands comptes transport et logistique. Management d'une équipe de 5 commerciaux.",
      remotePolicy: "hybrid",
    };
    const result = analyzeJobFit(job, PROFILE);
    expect(result.scores.locationFit).toBeGreaterThanOrEqual(90);
    expect(result.positiveSignals.some(s => s.label.includes("PACA"))).toBe(true);
  });

  it("Score sans description détaillée — confidence plus basse", () => {
    const job: JobInput = {
      title: "Directeur Commercial",
      company: "SomeCorp",
      location: "Lyon",
      locationPriority: 2,
      contractType: "CDI",
      salaryMin: null,
      salaryMax: null,
      seniority: null,
      functionArea: null,
      sector: null,
      description: "Directeur commercial recherché.",
      remotePolicy: null,
    };
    const result = analyzeJobFit(job, PROFILE);
    expect(result.confidence).toBeLessThanOrEqual(70);
    expect(result.overallScore).toBeLessThanOrEqual(65);
    expect(result.missingSignals.length).toBeGreaterThanOrEqual(2);
  });
});

/* ─── Catégorie 2 : Risk caps ────────────────── */

describe("Risk caps", () => {
  it("Stage → max 30", () => {
    const job: JobInput = {
      title: "Stage Commercial",
      company: "BigCorp",
      location: "Paris",
      contractType: "Stage",
      description: "Stage de 6 mois en développement commercial.",
    };
    const result = analyzeJobFit(job, PROFILE);
    expect(result.overallScore).toBeLessThanOrEqual(30);
    expect(result.recommendation).toBe("reject");
    expect(result.riskSignals.some(s => s.label.includes("Stage") || s.label.includes("Alternance"))).toBe(true);
  });

  it("Alternance → max 30", () => {
    const job: JobInput = {
      title: "Commercial en Alternance",
      company: "SchoolPartners",
      location: "Lille",
      contractType: "Alternance",
      description: "Alternance 12 mois — développement commercial B2B.",
    };
    const result = analyzeJobFit(job, PROFILE);
    expect(result.overallScore).toBeLessThanOrEqual(30);
  });

  it("Junior Sales Rep → max 30", () => {
    const job: JobInput = {
      title: "Sales Representative Junior",
      company: "SoftCo",
      location: "Paris",
      contractType: "CDI",
      description: "Entry-level sales position. 0-2 years experience.",
    };
    const result = analyzeJobFit(job, PROFILE);
    expect(result.overallScore).toBeLessThanOrEqual(30);
  });

  it("SDR → max 30", () => {
    const job: JobInput = {
      title: "Sales Development Representative",
      company: "SaaS Startup",
      location: "Remote",
      contractType: "CDI",
      description: "SDR role — prospection et qualification de leads.",
    };
    const result = analyzeJobFit(job, PROFILE);
    expect(result.overallScore).toBeLessThanOrEqual(30);
    expect(result.riskSignals.some(s => s.label.includes("SDR") || s.label.includes("BDR"))).toBe(true);
  });

  it("Software Engineer → max 35", () => {
    const job: JobInput = {
      title: "Software Engineer",
      company: "Google",
      location: "Paris",
      contractType: "CDI",
      salaryMin: 90000,
      salaryMax: 120000,
      description: "Développement fullstack React/Node.js. Équipe produit.",
    };
    const result = analyzeJobFit(job, PROFILE);
    expect(result.overallScore).toBeLessThanOrEqual(35);
  });

  it("Developer Fullstack → max 35", () => {
    const job: JobInput = {
      title: "Développeur Fullstack",
      company: "WebAgency",
      location: "Remote",
      contractType: "CDI",
      description: "Développement frontend React et backend Node.js.",
    };
    const result = analyzeJobFit(job, PROFILE);
    expect(result.overallScore).toBeLessThanOrEqual(35);
  });

  it("US-only onsite → low score + location risk", () => {
    const job: JobInput = {
      title: "Sales Director",
      company: "US Corp",
      location: "New York, USA",
      locationPriority: 4,
      contractType: "Full-time",
      salaryMin: 200000,
      salaryMax: 300000,
      description: "Must be based in New York. On-site only. US residency required.",
      remotePolicy: "onsite",
    };
    const result = analyzeJobFit(job, PROFILE);
    expect(result.overallScore).toBeLessThanOrEqual(60);
    expect(result.riskSignals.some(s => s.dimension === "locationFit")).toBe(true);
  });

  it("Remote-only outside France/Europe → reject (score 0)", () => {
    const job: JobInput = {
      title: "Sales Director",
      company: "Indian Startup",
      location: "India",
      locationPriority: 4,
      contractType: "CDI",
      description: "Fully remote position. Must be based in India. India market experience required.",
      remotePolicy: "remote",
    };
    const result = analyzeJobFit(job, PROFILE, { strictLocationFilter: true });
    expect(result.overallScore).toBe(0);
    expect(result.recommendation).toBe("reject");
    expect(result.recommendedAction).toBe("reject");
  });
});

/* ─── Catégorie 3 : Signaux ──────────────────── */

describe("Signaux", () => {
  it("positiveSignals détecte les bons labels", () => {
    const job: JobInput = {
      title: "Directeur Commercial France",
      company: "TechCorp",
      location: "Marseille",
      contractType: "CDI",
      salaryMin: 130000,
      salaryMax: 160000,
      description: "Pilotage équipe commerciale. Stratégie commerciale. Développement international. Français requis, anglais courant.",
      remotePolicy: "hybrid",
    };
    const result = analyzeJobFit(job, PROFILE);
    expect(result.positiveSignals.length).toBeGreaterThanOrEqual(2);
    // All signals have type "positive"
    expect(result.positiveSignals.every(s => s.type === "positive")).toBe(true);
  });

  it("riskSignals identifie les risques", () => {
    const job: JobInput = {
      title: "Stage en Commerce",
      company: "",
      location: "",
      description: "", // very short
    };
    const result = analyzeJobFit(job, PROFILE);
    expect(result.riskSignals.length).toBeGreaterThanOrEqual(2);
    expect(result.riskSignals.every(s => s.type === "risk")).toBe(true);
  });

  it("missingSignals quand description vide", () => {
    const job: JobInput = {
      title: "Commercial",
      description: null,
    };
    const result = analyzeJobFit(job, PROFILE);
    const missing = detectMissingSignals(result);
    expect(missing.length).toBeGreaterThanOrEqual(3);
  });

  it("explainJobFit retourne des phrases", () => {
    const job: JobInput = {
      title: "Directeur Commercial",
      company: "TechCorp",
      location: "Paris",
      description: "Poste de direction commerciale pour le marché français. Management d'équipe, stratégie go-to-market.",
    };
    const result = analyzeJobFit(job, PROFILE);
    const lines = explainJobFit(result);
    expect(lines.length).toBeGreaterThanOrEqual(2);
    expect(lines.every(l => l.length > 10)).toBe(true);
  });
});

/* ─── Catégorie 4 : Recommendations ──────────── */

describe("Recommendations", () => {
  it("apply_now ≥ 75", () => {
    expect(recommendApplicationAction({ overallScore: 80 })).toBe("apply_now");
    expect(recommendApplicationAction({ overallScore: 75 })).toBe("apply_now");
  });

  it("shortlist 55-74", () => {
    expect(recommendApplicationAction({ overallScore: 60 })).toBe("shortlist");
    expect(recommendApplicationAction({ overallScore: 55 })).toBe("shortlist");
  });

  it("review_manually 35-54", () => {
    expect(recommendApplicationAction({ overallScore: 40 })).toBe("review_manually");
    expect(recommendApplicationAction({ overallScore: 35 })).toBe("review_manually");
  });

  it("reject < 35", () => {
    expect(recommendApplicationAction({ overallScore: 20 })).toBe("reject");
    expect(recommendApplicationAction({ overallScore: 0 })).toBe("reject");
  });
});

/* ─── Catégorie 5 : Edge cases ───────────────── */

describe("Edge cases", () => {
  it("Titre vide — ne crashe pas", () => {
    const job: JobInput = {
      title: "",
      description: "Un poste de direction.",
    };
    expect(() => analyzeJobFit(job, PROFILE)).not.toThrow();
  });

  it("Tous les champs null — ne crashe pas", () => {
    const job: JobInput = { title: "Un job" };
    const result = analyzeJobFit(job, PROFILE);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(100);
  });

  it("Confidence > 0 toujours", () => {
    const job: JobInput = {
      title: "Directeur Commercial",
      company: "BestCorp",
      location: "Marseille",
      description: "Poste de direction — description assez détaillée pour test de confiance.",
    };
    const result = analyzeJobFit(job, PROFILE);
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("computeSemanticFitScore renvoie le score", () => {
    expect(computeSemanticFitScore({ overallScore: 72 })).toBe(72);
    expect(computeSemanticFitScore({ overallScore: 0 })).toBe(0);
  });

  it("detectFitRisks retourne des chaînes formatées", () => {
    const job: JobInput = { title: "Stage", description: "" };
    const result = analyzeJobFit(job, PROFILE);
    const risks = detectFitRisks(result);
    expect(risks.length).toBeGreaterThanOrEqual(1);
    expect(risks.every(r => r.includes(":"))).toBe(true);
  });

  it("serializeAnalysis retourne les clés principales", () => {
    const job: JobInput = {
      title: "Directeur Commercial",
      company: "Corp",
      location: "Paris",
      description: "Un poste de direction avec management d'équipe.",
    };
    const result = analyzeJobFit(job, PROFILE);
    const serialized = serializeAnalysis(result);
    expect(serialized).toHaveProperty("overallScore");
    expect(serialized).toHaveProperty("confidence");
    expect(serialized).toHaveProperty("recommendation");
    expect(serialized).toHaveProperty("recommendedAction");
    expect(serialized).toHaveProperty("explanation");
    expect(serialized).toHaveProperty("scores");
    expect(Array.isArray(serialized.positiveSignals)).toBe(true);
    expect(Array.isArray(serialized.riskSignals)).toBe(true);
    expect(Array.isArray(serialized.missingSignals)).toBe(true);
  });

  it("Aucune régression — overallScore toujours entre 0 et 100", () => {
    const jobs: JobInput[] = [
      { title: "Directeur Commercial France", company: "A", location: "Paris", description: "Très bon match, management, stratégie, international. Équipe commerciale de 20 personnes." },
      { title: "Stage", company: "B", location: "Paris", description: "Stage 6 mois" },
      { title: "Software Engineer", company: "C", location: "Remote", description: "Code toute la journée" },
      { title: "Sales Director", company: "D", location: "New York", locationPriority: 4, description: "US only" },
      { title: "" },
      { title: "SDR", description: "" },
      { title: "VP Sales", company: "E", location: "Remote Europe", description: "Lead EMEA sales team" },
    ];

    for (const job of jobs) {
      const result = analyzeJobFit(job, PROFILE);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    }
  });
});

/* ─── Catégorie 6 : Périmètre d'entrée ──────── */

describe("Input parsing", () => {
  it("Langues bilingues EN/FR score > 70", () => {
    const job: JobInput = {
      title: "Directeur Commercial",
      company: "GlobalCorp",
      location: "Paris",
      description: "English and French required. Must be fluent in both languages.",
    };
    const result = analyzeJobFit(job, PROFILE);
    expect(result.scores.languageFit).toBeGreaterThanOrEqual(70);
  });

  it("Anglais requis sans anglais dans le profil → score bas", () => {
    const profileNoEn: ProfileInput = {
      ...PROFILE,
      languages: JSON.stringify(["Français (natif)"]),
    };
    const job: JobInput = {
      title: "Commercial",
      description: "English is mandatory for this role. Must be fluent.",
    };
    const result = analyzeJobFit(job, profileNoEn);
    expect(result.scores.languageFit).toBeLessThan(40);
  });

  it("Secteur aligné → score >= 65", () => {
    const job: JobInput = {
      title: "Directeur Commercial",
      company: "DistriPlus",
      location: "Lyon",
      description: "Leader de la distribution B2B. Commerce inter-entreprises.",
      sector: "Distribution",
    };
    const result = analyzeJobFit(job, PROFILE);
    expect(result.scores.sectorFit).toBeGreaterThanOrEqual(65);
  });

  it("Fourchette salariale dans les prétentions → >= 80", () => {
    const job: JobInput = {
      title: "Directeur Commercial",
      company: "WellPaid",
      location: "Paris",
      salaryMin: 130000,
      salaryMax: 150000,
      description: "Poste de direction.",
    };
    const result = analyzeJobFit(job, PROFILE);
    expect(result.scores.compensationFit).toBeGreaterThanOrEqual(80);
  });
});

/* ─── Catégorie 7 : Null safety ───────────── */

describe("Null safety", () => {
  it("description null — ne crashe pas, confidence réduite", () => {
    const job: JobInput = {
      title: "Directeur Commercial",
      company: "Corp",
      location: "Lyon",
      description: null,
    };
    const result = analyzeJobFit(job, PROFILE);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.confidence).toBeLessThanOrEqual(75);
    expect(result.missingSignals.length).toBeGreaterThanOrEqual(1);
  });

  it("Tous les champs texte null — score bas mais pas NaN", () => {
    const job: JobInput = {
      title: "Un poste",
      company: null,
      location: null,
      description: null,
      contractType: null,
      remotePolicy: null,
      salaryMin: null,
      salaryMax: null,
      seniority: null,
      functionArea: null,
      sector: null,
    };
    const result = analyzeJobFit(job, PROFILE);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(Number.isNaN(result.overallScore)).toBe(false);
    expect(Number.isNaN(result.confidence)).toBe(false);
  });

  it("Profil avec champs null — ne crashe pas", () => {
    const minimalProfile: ProfileInput = {
      fullName: "",
      title: "",
      summary: null,
      location: null,
      mobility: null,
      languages: null,
      yearsExp: null,
      sectors: null,
      functions: null,
      remotePreference: null,
      targetSalary: null,
      constraints: null,
    };
    const job: JobInput = { title: "Un poste quelconque" };
    expect(() => analyzeJobFit(job, minimalProfile)).not.toThrow();
  });

  it("Salaire 0 — ne crashe pas", () => {
    const job: JobInput = {
      title: "Directeur Commercial",
      description: "Poste de direction.",
      salaryMin: 0,
      salaryMax: 0,
    };
    const result = analyzeJobFit(job, PROFILE);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("Mobility JSON invalide — ne crashe pas", () => {
    const profileBadMobility: ProfileInput = {
      ...PROFILE,
      mobility: "pas-du-json",
    };
    const job: JobInput = {
      title: "Directeur Commercial",
      description: "Poste de direction.",
      location: "Paris",
    };
    expect(() => analyzeJobFit(job, profileBadMobility)).not.toThrow();
  });
});

/* ─── Catégorie 8 : Recommendation filter ─── */

describe("Recommendation filter", () => {
  it("recommendation couvre tous les niveaux", () => {
    const levels = new Set<string>();
    const jobs: JobInput[] = [
      { title: "Directeur Commercial France", company: "A", location: "Paris", description: "Poste de direction, management, stratégie, international." },
      { title: "Stage en Commerce", description: "Stage 6 mois." },
      { title: "Software Engineer", description: "Code." },
      { title: "Account Executive SMB", description: "Sales role. US-based.", location: "New York", locationPriority: 4 },
      { title: "Sales Manager", company: "B", location: "Paris", description: "Manager équipe commerciale." },
      { title: "VP Sales EMEA", company: "C", location: "Remote Europe", description: "Lead EMEA sales. French required. Executive role." },
    ];
    for (const job of jobs) {
      const result = analyzeJobFit(job, PROFILE);
      levels.add(result.recommendation);
    }
    expect(levels.has("highly_recommended") || levels.has("recommended")).toBe(true);
    expect(levels.has("possible") || levels.has("low_priority")).toBe(true);
    expect(levels.has("reject")).toBe(true);
  });

  it("recommendedAction cohérent avec recommendation", () => {
    const job: JobInput = {
      title: "Directeur Commercial France",
      company: "TechCorp",
      location: "Paris",
      description: "Poste de direction. Management, stratégie, international.",
    };
    const result = analyzeJobFit(job, PROFILE);
    if (result.recommendation === "highly_recommended" || result.recommendation === "recommended") {
      expect(result.recommendedAction).toBe("apply_now");
    } else if (result.recommendation === "reject") {
      expect(result.recommendedAction).toBe("reject");
    }
  });

  it("Toutes les recommendations sont des valeurs valides", () => {
    const validRecs = ["highly_recommended", "recommended", "possible", "low_priority", "reject"];
    const jobs: JobInput[] = [
      { title: "Directeur Commercial France", location: "Paris", description: "Direction." },
      { title: "Stage", description: "" },
      { title: "Software Engineer", description: "Code." },
      { title: "Account Executive", location: "New York", locationPriority: 4, description: "Sales US." },
      { title: "SDR", description: "" },
    ];
    for (const job of jobs) {
      const result = analyzeJobFit(job, PROFILE);
      expect(validRecs).toContain(result.recommendation);
    }
  });
});

/* ─── Catégorie 9 : Backfill idempotency ───── */

describe("Backfill idempotency", () => {
  it("serializeAnalysis est déterministe (même input → même output)", () => {
    const job: JobInput = {
      title: "Directeur Commercial France",
      company: "TechCorp",
      location: "Paris",
      description: "Poste de direction commerciale. Management d'équipe, stratégie go-to-market, développement international.",
      salaryMin: 130000,
      salaryMax: 160000,
      contractType: "CDI",
      remotePolicy: "hybrid",
    };
    const result1 = analyzeJobFit(job, PROFILE);
    const result2 = analyzeJobFit(job, PROFILE);
    const ser1 = serializeAnalysis(result1);
    const ser2 = serializeAnalysis(result2);
    expect(ser1.overallScore).toBe(ser2.overallScore);
    expect(ser1.recommendation).toBe(ser2.recommendation);
    expect(ser1.confidence).toBe(ser2.confidence);
    expect(ser1.recommendedAction).toBe(ser2.recommendedAction);
    expect(JSON.stringify(ser1.scores)).toBe(JSON.stringify(ser2.scores));
  });

  it("serializeAnalysis contient toutes les clés attendues pour le stockage", () => {
    const job: JobInput = {
      title: "Directeur Commercial",
      location: "Paris",
      description: "Poste de direction.",
    };
    const result = analyzeJobFit(job, PROFILE);
    const ser = serializeAnalysis(result);
    const requiredKeys = [
      "overallScore", "confidence", "recommendation", "recommendedAction",
      "scores", "positiveSignals", "riskSignals", "missingSignals", "explanation",
      "suggestedCvAngle", "suggestedCoverLetterAngle",
    ];
    for (const key of requiredKeys) {
      expect(ser).toHaveProperty(key);
    }
  });

  it("Deux analyses successives sans modification DB ne changent pas le score", () => {
    const job: JobInput = {
      title: "Directeur des Ventes",
      company: "BigCorp",
      location: "Lyon",
      description: "Direction des ventes France. Management équipe 20 personnes. Stratégie commerciale.",
    };
    const r1 = analyzeJobFit(job, PROFILE);
    const r2 = analyzeJobFit(job, PROFILE);
    expect(r1.overallScore).toBe(r2.overallScore);
    expect(r1.recommendation).toBe(r2.recommendation);
    expect(r1.confidence).toBe(r2.confidence);
  });
});
