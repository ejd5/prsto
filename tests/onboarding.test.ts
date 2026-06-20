import { describe, it, expect } from "vitest";
import { calculateAgentReadiness } from "@/lib/onboarding/readiness";
import type {
  ReadinessProfile,
  ReadinessCVMaster,
  ReadinessExperience,
  ReadinessSkill,
  ReadinessProofEntry,
  ReadinessJobSource,
  ReadinessSettings,
  ReadinessPipelineStats,
  ReadinessPriorityRole,
  ReadinessTargetCountry,
} from "@/lib/onboarding/readiness";

function makeProfile(overrides: Partial<ReadinessProfile> = {}): ReadinessProfile {
  return {
    fullName: "Jean Dupont",
    title: "Directeur Commercial",
    email: "jean@example.com",
    phone: "+33600000000",
    languages: '["Français (natif)", "Anglais (courant)"]',
    yearsExp: 15,
    sectors: '["Industrie", "Tech"]',
    functions: '["Direction Commerciale", "Country Manager"]',
    education: '["Master Management"]',
    certifications: '["PMP"]',
    remotePreference: "hybride",
    targetSalary: "120-150k€",
    ...overrides,
  };
}

function makeCVMaster(overrides: Partial<{ originalText: string; status: string }> = {}): ReadinessCVMaster {
  return {
    originalText: "CV complet avec 15 ans d'expérience en direction commerciale...",
    status: "validé",
    ...overrides,
  };
}

function makeFullExperiences(): ReadinessExperience[] {
  return [
    { company: "ACME Corp", title: "Directeur Commercial", startDate: "2020-01", description: "Direction commerciale Europe", teamSize: "25", revenue: "50M€", budget: "10M€" },
    { company: "StartupX", title: "Head of Sales", startDate: "2015-06", endDate: "2019-12", description: "Lancement marché FR", teamSize: "10", revenue: "5M€", budget: null },
  ];
}

function makeFullSkills(): ReadinessSkill[] {
  return [
    { name: "Management" }, { name: "Négociation" }, { name: "CRM" }, { name: "Stratégie" }, { name: "Business Development" },
  ];
}

function makeFullProofs(): ReadinessProofEntry[] {
  return [
    { category: "CA", title: "CA 2022", value: "+32%", verifiable: true },
    { category: "équipe", title: "Équipe", value: "25", verifiable: true },
    { category: "international", title: "Pays couverts", value: "12", verifiable: false },
  ];
}

function makeFullSources(): ReadinessJobSource[] {
  return [
    { active: true, priority: 1 },
    { active: true, priority: 0 },
    { active: false, priority: 0 },
  ];
}

function makeFullSettings(): ReadinessSettings {
  return { aiProvider: "deepseek", apiKey: "sk-1234", confidentialityMode: "anonymise" };
}

function makeFullPipeline(): ReadinessPipelineStats {
  return { total: 5 };
}

const emptyProfile = null;
const emptyCvMaster = null;
const emptyExperiences: ReadinessExperience[] = [];
const emptySkills: ReadinessSkill[] = [];
const emptyProofs: ReadinessProofEntry[] = [];
const emptySources: ReadinessJobSource[] = [];
const emptySettings = null;
const emptyPipeline: ReadinessPipelineStats = { total: 0 };
const emptyRoles: ReadinessPriorityRole[] = [];
const emptyCountries: ReadinessTargetCountry[] = [];

// ─── Statuts ──────────────────────────────────

describe("calculateAgentReadiness — statuts", () => {
  it("not_started quand tout est vide", () => {
    const result = calculateAgentReadiness({
      profile: emptyProfile, cvMaster: emptyCvMaster, experiences: emptyExperiences,
      skills: emptySkills, proofEntries: emptyProofs, jobSources: emptySources,
      settings: emptySettings, pipelineStats: emptyPipeline, priorityRoles: emptyRoles,
      targetCountries: emptyCountries,
    });
    expect(result.status).toBe("not_started");
    expect(result.globalScore).toBeLessThan(10);
  });

  it("in_progress avec un profil partiel", () => {
    const result = calculateAgentReadiness({
      profile: makeProfile({ fullName: "Jean", title: "CEO", email: "", phone: "", languages: null, yearsExp: null, sectors: null, functions: null, education: null, certifications: null, remotePreference: null, targetSalary: null }),
      cvMaster: makeCVMaster(),
      experiences: emptyExperiences, skills: emptySkills,
      proofEntries: emptyProofs, jobSources: emptySources, settings: emptySettings,
      pipelineStats: emptyPipeline, priorityRoles: [], targetCountries: [],
    });
    expect(result.status).toBe("in_progress");
  });

  it("almost_ready avec un profil et CV mais lacunes", () => {
    const result = calculateAgentReadiness({
      profile: makeProfile(),
      cvMaster: makeCVMaster(),
      experiences: [{ company: "ACME", title: "CEO", startDate: "2020-01", description: null, teamSize: null, revenue: null, budget: null }],
      skills: makeFullSkills(),
      proofEntries: emptyProofs,
      jobSources: emptySources,
      settings: makeFullSettings(),
      pipelineStats: { total: 1 },
      priorityRoles: [{ name: "Directeur Commercial" }],
      targetCountries: [{ code: "FR" }],
    });
    expect(result.status).toBe("almost_ready");
  });

  it("ready avec un profil complet mais proof vault faible", () => {
    const result = calculateAgentReadiness({
      profile: makeProfile(),
      cvMaster: makeCVMaster(),
      experiences: makeFullExperiences(),
      skills: makeFullSkills(),
      proofEntries: [{ category: "autre", title: "Article", value: "Publié", verifiable: false }],
      jobSources: makeFullSources(),
      settings: emptySettings,
      pipelineStats: { total: 0 },
      priorityRoles: [{ name: "Directeur Commercial" }],
      targetCountries: [{ code: "FR" }],
    });
    expect(result.status).toBe("ready");
  });

  it("active quand tout est complet", () => {
    const result = calculateAgentReadiness({
      profile: makeProfile(),
      cvMaster: makeCVMaster(),
      experiences: makeFullExperiences(),
      skills: makeFullSkills(),
      proofEntries: makeFullProofs(),
      jobSources: makeFullSources(),
      settings: makeFullSettings(),
      pipelineStats: makeFullPipeline(),
      priorityRoles: [{ name: "Directeur Commercial" }],
      targetCountries: [{ code: "FR" }],
    });
    expect(result.status).toBe("active");
    expect(result.globalScore).toBeGreaterThanOrEqual(90);
  });
});

// ─── Sections breakdown ──────────────────────

describe("calculateAgentReadiness — sections", () => {
  it("identité complète vaut 10", () => {
    const result = calculateAgentReadiness({
      profile: makeProfile(),
      cvMaster: emptyCvMaster, experiences: emptyExperiences, skills: emptySkills,
      proofEntries: emptyProofs, jobSources: emptySources, settings: emptySettings,
      pipelineStats: emptyPipeline, priorityRoles: [], targetCountries: [],
    });
    expect(result.breakdown.identity.score).toBe(10);
    expect(result.breakdown.identity.ok).toBe(true);
  });

  it("identité partielle perd des points", () => {
    const result = calculateAgentReadiness({
      profile: makeProfile({ email: "", phone: "", title: "" }),
      cvMaster: emptyCvMaster, experiences: emptyExperiences, skills: emptySkills,
      proofEntries: emptyProofs, jobSources: emptySources, settings: emptySettings,
      pipelineStats: emptyPipeline, priorityRoles: [], targetCountries: [],
    });
    expect(result.breakdown.identity.score).toBe(2.5);
    expect(result.breakdown.identity.ok).toBe(false);
  });

  it("ciblage complet vaut 15", () => {
    const result = calculateAgentReadiness({
      profile: makeProfile(),
      cvMaster: emptyCvMaster, experiences: emptyExperiences, skills: emptySkills,
      proofEntries: emptyProofs, jobSources: emptySources, settings: emptySettings,
      pipelineStats: emptyPipeline,
      priorityRoles: [{ name: "Directeur Commercial" }],
      targetCountries: [{ code: "FR" }],
    });
    expect(result.breakdown.targeting.score).toBe(15);
  });

  it("ciblage vide vaut 0", () => {
    const result = calculateAgentReadiness({
      profile: makeProfile({ sectors: null, functions: null, yearsExp: null }),
      cvMaster: emptyCvMaster, experiences: emptyExperiences, skills: emptySkills,
      proofEntries: emptyProofs, jobSources: emptySources, settings: emptySettings,
      pipelineStats: emptyPipeline, priorityRoles: [], targetCountries: [],
    });
    expect(result.breakdown.targeting.score).toBe(0);
  });

  it("expériences complètes vaut 20", () => {
    const result = calculateAgentReadiness({
      profile: emptyProfile,
      cvMaster: emptyCvMaster,
      experiences: makeFullExperiences(),
      skills: emptySkills, proofEntries: emptyProofs, jobSources: emptySources,
      settings: emptySettings, pipelineStats: emptyPipeline,
      priorityRoles: [], targetCountries: [],
    });
    expect(result.breakdown.experiences.score).toBe(20);
  });

  it("1 seule expérience vaut 5 (pas de description ni chiffres)", () => {
    const result = calculateAgentReadiness({
      profile: emptyProfile,
      cvMaster: emptyCvMaster,
      experiences: [{ company: "ACME", title: "CEO", startDate: "2020-01", description: null, teamSize: null, revenue: null, budget: null }],
      skills: emptySkills, proofEntries: emptyProofs, jobSources: emptySources,
      settings: emptySettings, pipelineStats: emptyPipeline,
      priorityRoles: [], targetCountries: [],
    });
    expect(result.breakdown.experiences.score).toBe(5);
  });

  it("skills complets vaut 10", () => {
    const result = calculateAgentReadiness({
      profile: makeProfile({ languages: '["FR", "EN"]' }),
      cvMaster: emptyCvMaster, experiences: emptyExperiences,
      skills: makeFullSkills(),
      proofEntries: emptyProofs, jobSources: emptySources, settings: emptySettings,
      pipelineStats: emptyPipeline, priorityRoles: [], targetCountries: [],
    });
    expect(result.breakdown.skills.score).toBe(10);
  });

  it("CV maître importé et validé vaut 15", () => {
    const result = calculateAgentReadiness({
      profile: emptyProfile,
      cvMaster: makeCVMaster({ originalText: "CV complet détaillé avec parcours professionnel de plus de 15 ans en direction commerciale et développement business", status: "validé" }),
      experiences: emptyExperiences, skills: emptySkills, proofEntries: emptyProofs,
      jobSources: emptySources, settings: emptySettings, pipelineStats: emptyPipeline,
      priorityRoles: [], targetCountries: [],
    });
    expect(result.breakdown.cvMaster.score).toBe(15);
  });

  it("CV maître absent vaut 0", () => {
    const result = calculateAgentReadiness({
      profile: emptyProfile, cvMaster: null,
      experiences: emptyExperiences, skills: emptySkills, proofEntries: emptyProofs,
      jobSources: emptySources, settings: emptySettings, pipelineStats: emptyPipeline,
      priorityRoles: [], targetCountries: [],
    });
    expect(result.breakdown.cvMaster.score).toBe(0);
  });

  it("CV maître trop court vaut 0", () => {
    const result = calculateAgentReadiness({
      profile: emptyProfile,
      cvMaster: { originalText: "Court", status: "importé" },
      experiences: emptyExperiences, skills: emptySkills, proofEntries: emptyProofs,
      jobSources: emptySources, settings: emptySettings, pipelineStats: emptyPipeline,
      priorityRoles: [], targetCountries: [],
    });
    expect(result.breakdown.cvMaster.score).toBe(0);
  });

  it("proof vault complet vaut 15", () => {
    const result = calculateAgentReadiness({
      profile: emptyProfile, cvMaster: emptyCvMaster, experiences: emptyExperiences,
      skills: emptySkills,
      proofEntries: makeFullProofs(),
      jobSources: emptySources, settings: emptySettings, pipelineStats: emptyPipeline,
      priorityRoles: [], targetCountries: [],
    });
    expect(result.breakdown.proofVault.score).toBe(15);
  });

  it("proof vault avec seulement un chiffre vaut 5", () => {
    const result = calculateAgentReadiness({
      profile: emptyProfile, cvMaster: emptyCvMaster, experiences: emptyExperiences,
      skills: emptySkills,
      proofEntries: [{ category: "CA", title: "CA", value: "+10%", verifiable: false }],
      jobSources: emptySources, settings: emptySettings, pipelineStats: emptyPipeline,
      priorityRoles: [], targetCountries: [],
    });
    expect(result.breakdown.proofVault.score).toBe(5);
  });

  it("sources actives + prioritaire vaut 5", () => {
    const result = calculateAgentReadiness({
      profile: emptyProfile, cvMaster: emptyCvMaster, experiences: emptyExperiences,
      skills: emptySkills, proofEntries: emptyProofs,
      jobSources: makeFullSources(),
      settings: emptySettings, pipelineStats: emptyPipeline,
      priorityRoles: [], targetCountries: [],
    });
    expect(result.breakdown.sources.score).toBe(5);
  });

  it("sources vides vaut 0", () => {
    const result = calculateAgentReadiness({
      profile: emptyProfile, cvMaster: emptyCvMaster, experiences: emptyExperiences,
      skills: emptySkills, proofEntries: emptyProofs,
      jobSources: [],
      settings: emptySettings, pipelineStats: emptyPipeline,
      priorityRoles: [], targetCountries: [],
    });
    expect(result.breakdown.sources.score).toBe(0);
  });

  it("IA configurée vaut 5", () => {
    const result = calculateAgentReadiness({
      profile: emptyProfile, cvMaster: emptyCvMaster, experiences: emptyExperiences,
      skills: emptySkills, proofEntries: emptyProofs, jobSources: emptySources,
      settings: makeFullSettings(),
      pipelineStats: emptyPipeline, priorityRoles: [], targetCountries: [],
    });
    expect(result.breakdown.ia.score).toBe(5);
  });

  it("pipeline avec offres vaut 5", () => {
    const result = calculateAgentReadiness({
      profile: emptyProfile, cvMaster: emptyCvMaster, experiences: emptyExperiences,
      skills: emptySkills, proofEntries: emptyProofs, jobSources: emptySources,
      settings: emptySettings,
      pipelineStats: { total: 3 },
      priorityRoles: [], targetCountries: [],
    });
    expect(result.breakdown.pipeline.score).toBe(5);
  });
});

// ─── missingFields & completedSections ────────

describe("calculateAgentReadiness — missingFields & completedSections", () => {
  it("liste tous les champs manquants pour profil vide", () => {
    const result = calculateAgentReadiness({
      profile: emptyProfile, cvMaster: emptyCvMaster, experiences: emptyExperiences,
      skills: emptySkills, proofEntries: emptyProofs, jobSources: emptySources,
      settings: emptySettings, pipelineStats: emptyPipeline, priorityRoles: emptyRoles,
      targetCountries: emptyCountries,
    });
    expect(result.missingFields.length).toBeGreaterThan(5);
    expect(result.completedSections.length).toBe(0);
  });

  it("completedSections contient les sections ok", () => {
    const result = calculateAgentReadiness({
      profile: makeProfile(),
      cvMaster: makeCVMaster(),
      experiences: makeFullExperiences(),
      skills: makeFullSkills(),
      proofEntries: makeFullProofs(),
      jobSources: makeFullSources(),
      settings: makeFullSettings(),
      pipelineStats: makeFullPipeline(),
      priorityRoles: [{ name: "Directeur Commercial" }],
      targetCountries: [{ code: "FR" }],
    });
    expect(result.completedSections.length).toBe(9);
    expect(result.missingFields.length).toBe(0);
  });
});

// ─── nextBestAction ───────────────────────────

describe("calculateAgentReadiness — nextBestAction", () => {
  it("recommande l'identité et le CV au début", () => {
    const result = calculateAgentReadiness({
      profile: emptyProfile, cvMaster: emptyCvMaster, experiences: emptyExperiences,
      skills: emptySkills, proofEntries: emptyProofs, jobSources: emptySources,
      settings: emptySettings, pipelineStats: emptyPipeline, priorityRoles: [], targetCountries: [],
    });
    expect(result.nextBestAction).toContain("identité");
  });

  it("recommande le CV quand l'identité est ok", () => {
    const result = calculateAgentReadiness({
      profile: makeProfile(),
      cvMaster: emptyCvMaster, experiences: emptyExperiences, skills: emptySkills,
      proofEntries: emptyProofs, jobSources: emptySources, settings: emptySettings,
      pipelineStats: emptyPipeline, priorityRoles: [], targetCountries: [],
    });
    expect(result.nextBestAction).toContain("CV");
  });

  it("confirme quand tout est prêt", () => {
    const result = calculateAgentReadiness({
      profile: makeProfile(),
      cvMaster: makeCVMaster(),
      experiences: makeFullExperiences(),
      skills: makeFullSkills(),
      proofEntries: makeFullProofs(),
      jobSources: makeFullSources(),
      settings: makeFullSettings(),
      pipelineStats: makeFullPipeline(),
      priorityRoles: [{ name: "Directeur Commercial" }],
      targetCountries: [{ code: "FR" }],
    });
    expect(result.nextBestAction).toContain("prêt");
  });
});

// ─── Cas limites ──────────────────────────────

describe("calculateAgentReadiness — cas limites", () => {
  it("profile null ne casse pas", () => {
    const result = calculateAgentReadiness({
      profile: null, cvMaster: emptyCvMaster, experiences: emptyExperiences,
      skills: emptySkills, proofEntries: emptyProofs, jobSources: emptySources,
      settings: emptySettings, pipelineStats: emptyPipeline, priorityRoles: [], targetCountries: [],
    });
    expect(result.globalScore).toBe(0);
    expect(result.status).toBe("not_started");
  });

  it("settings null ne casse pas", () => {
    const result = calculateAgentReadiness({
      profile: makeProfile(),
      cvMaster: makeCVMaster(),
      experiences: makeFullExperiences(),
      skills: makeFullSkills(),
      proofEntries: makeFullProofs(),
      jobSources: makeFullSources(),
      settings: null,
      pipelineStats: makeFullPipeline(),
      priorityRoles: [{ name: "Directeur Commercial" }],
      targetCountries: [{ code: "FR" }],
    });
    expect(result.globalScore).toBeGreaterThanOrEqual(85);
  });

  it("score max est exactement 100", () => {
    const result = calculateAgentReadiness({
      profile: makeProfile(),
      cvMaster: makeCVMaster(),
      experiences: makeFullExperiences(),
      skills: makeFullSkills(),
      proofEntries: makeFullProofs(),
      jobSources: makeFullSources(),
      settings: makeFullSettings(),
      pipelineStats: makeFullPipeline(),
      priorityRoles: [{ name: "Directeur Commercial" }],
      targetCountries: [{ code: "FR" }],
    });
    expect(result.globalScore).toBe(100);
  });

  it("half-complete donne un score cohérent", () => {
    const result = calculateAgentReadiness({
      profile: makeProfile({ phone: "", email: "" }),
      cvMaster: makeCVMaster({ status: "importé" }),
      experiences: [{ company: "ACME", title: "CEO", startDate: "2020-01", description: null, teamSize: null, revenue: null, budget: null }],
      skills: [{ name: "Management" }, { name: "Sales" }],
      proofEntries: emptyProofs,
      jobSources: [{ active: true, priority: 0 }],
      settings: emptySettings,
      pipelineStats: emptyPipeline,
      priorityRoles: [],
      targetCountries: [],
    });
    expect(result.globalScore).toBeGreaterThan(10);
    expect(result.globalScore).toBeLessThan(75);
  });

  it("secteurs/fonctions vides (string vide ou []) ne donnent pas de points", () => {
    const result = calculateAgentReadiness({
      profile: makeProfile({ sectors: "", functions: "[]" }),
      cvMaster: emptyCvMaster, experiences: emptyExperiences, skills: emptySkills,
      proofEntries: emptyProofs, jobSources: emptySources, settings: emptySettings,
      pipelineStats: emptyPipeline, priorityRoles: [], targetCountries: [],
    });
    expect(result.breakdown.targeting.score).toBeLessThan(6);
  });
});
