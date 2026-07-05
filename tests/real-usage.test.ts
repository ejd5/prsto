import { describe, it, expect } from "vitest";
import {
  detectDemoDataRemains,
  detectCVMasterMissing,
  detectProofVaultInsufficient,
  detectNoRealOffers,
  detectNoApprovedDocs,
  detectNoPlannedRelances,
  detectNoPipeline,
  detectUnanalyzedOffers,
  detectRealUsageStatus,
  countReadyChecks,
  realUsageReadiness,
  type DetectionInput,
} from "@/lib/real-usage/detection";

function makeInput(overrides: Partial<DetectionInput> = {}): DetectionInput {
  return {
    demoProfileExists: false,
    cvMasterExists: true,
    proofCount: 8,
    verifiableProofCount: 5,
    opportunityCount: 7,
    analyzedOpportunityCount: 7,
    approvedDocCount: 3,
    plannedRelanceCount: 2,
    sentRelanceCount: 1,
    pipelineDraftCount: 4,
    profileComplete: true,
    ...overrides,
  };
}

// ─── detectDemoDataRemains ──────────────────────

describe("detectDemoDataRemains", () => {
  it("ok quand aucune donnée démo", () => {
    const r = detectDemoDataRemains(makeInput({ demoProfileExists: false }));
    expect(r.ok).toBe(true);
    expect(r.severity).toBe("ok");
  });

  it("error quand données démo présentes", () => {
    const r = detectDemoDataRemains(makeInput({ demoProfileExists: true }));
    expect(r.ok).toBe(false);
    expect(r.severity).toBe("error");
  });
});

// ─── detectCVMasterMissing ──────────────────────

describe("detectCVMasterMissing", () => {
  it("ok quand CV présent", () => {
    const r = detectCVMasterMissing(makeInput({ cvMasterExists: true }));
    expect(r.ok).toBe(true);
  });

  it("error quand CV absent", () => {
    const r = detectCVMasterMissing(makeInput({ cvMasterExists: false }));
    expect(r.ok).toBe(false);
    expect(r.severity).toBe("error");
  });
});

// ─── detectProofVaultInsufficient ───────────────

describe("detectProofVaultInsufficient", () => {
  it("ok avec >=5 preuves et >=1 vérifiable", () => {
    const r = detectProofVaultInsufficient(makeInput({ proofCount: 6, verifiableProofCount: 3 }));
    expect(r.ok).toBe(true);
    expect(r.severity).toBe("ok");
  });

  it("error sans preuve vérifiable", () => {
    const r = detectProofVaultInsufficient(makeInput({ proofCount: 2, verifiableProofCount: 0 }));
    expect(r.ok).toBe(false);
    expect(r.severity).toBe("error");
  });

  it("warning avec <5 preuves mais vérifiable présente", () => {
    const r = detectProofVaultInsufficient(makeInput({ proofCount: 3, verifiableProofCount: 1 }));
    expect(r.ok).toBe(false);
    expect(r.severity).toBe("warning");
  });
});

// ─── detectNoRealOffers ─────────────────────────

describe("detectNoRealOffers", () => {
  it("ok avec >=5 offres", () => {
    const r = detectNoRealOffers(makeInput({ opportunityCount: 8 }));
    expect(r.ok).toBe(true);
    expect(r.severity).toBe("ok");
  });

  it("warning avec 1-4 offres", () => {
    const r = detectNoRealOffers(makeInput({ opportunityCount: 3 }));
    expect(r.ok).toBe(false);
    expect(r.severity).toBe("warning");
  });

  it("error avec 0 offre", () => {
    const r = detectNoRealOffers(makeInput({ opportunityCount: 0 }));
    expect(r.ok).toBe(false);
    expect(r.severity).toBe("error");
  });
});

// ─── detectNoApprovedDocs ───────────────────────

describe("detectNoApprovedDocs", () => {
  it("ok avec documents approuvés", () => {
    const r = detectNoApprovedDocs(makeInput({ approvedDocCount: 2 }));
    expect(r.ok).toBe(true);
    expect(r.severity).toBe("ok");
  });

  it("warning sans document approuvé", () => {
    const r = detectNoApprovedDocs(makeInput({ approvedDocCount: 0 }));
    expect(r.ok).toBe(false);
    expect(r.severity).toBe("warning");
  });
});

// ─── detectNoPlannedRelances ────────────────────

describe("detectNoPlannedRelances", () => {
  it("ok avec relances", () => {
    const r = detectNoPlannedRelances(makeInput({ plannedRelanceCount: 2, sentRelanceCount: 1 }));
    expect(r.ok).toBe(true);
  });

  it("warning sans relance", () => {
    const r = detectNoPlannedRelances(makeInput({ plannedRelanceCount: 0, sentRelanceCount: 0 }));
    expect(r.ok).toBe(false);
    expect(r.severity).toBe("warning");
  });
});

// ─── detectNoPipeline ───────────────────────────

describe("detectNoPipeline", () => {
  it("ok avec pipeline actif", () => {
    const r = detectNoPipeline(makeInput({ pipelineDraftCount: 3 }));
    expect(r.ok).toBe(true);
  });

  it("warning sans pipeline", () => {
    const r = detectNoPipeline(makeInput({ pipelineDraftCount: 0 }));
    expect(r.ok).toBe(false);
    expect(r.severity).toBe("warning");
  });
});

// ─── detectUnanalyzedOffers ─────────────────────

describe("detectUnanalyzedOffers", () => {
  it("ok quand toutes les offres sont analysées", () => {
    const r = detectUnanalyzedOffers(makeInput({ opportunityCount: 5, analyzedOpportunityCount: 5 }));
    expect(r.ok).toBe(true);
  });

  it("warning quand offres non analysées", () => {
    const r = detectUnanalyzedOffers(makeInput({ opportunityCount: 5, analyzedOpportunityCount: 3 }));
    expect(r.ok).toBe(false);
    expect(r.severity).toBe("warning");
  });

  it("ok quand 0 offre (rien à analyser)", () => {
    const r = detectUnanalyzedOffers(makeInput({ opportunityCount: 0, analyzedOpportunityCount: 0 }));
    expect(r.ok).toBe(true);
  });
});

// ─── detectRealUsageStatus ──────────────────────

describe("detectRealUsageStatus", () => {
  it("retourne 8 résultats", () => {
    const results = detectRealUsageStatus(makeInput());
    expect(results).toHaveLength(8);
  });

  it("tout ok quand données parfaites", () => {
    const results = detectRealUsageStatus(makeInput());
    expect(results.every((r) => r.ok)).toBe(true);
  });

  it("mix ok/error avec données partielles", () => {
    const results = detectRealUsageStatus(makeInput({
      demoProfileExists: true,
      cvMasterExists: false,
      proofCount: 2,
      verifiableProofCount: 0,
    }));
    const okCount = results.filter((r) => r.ok).length;
    expect(okCount).toBeLessThan(8);
    expect(okCount).toBeGreaterThan(0);
  });
});

// ─── countReadyChecks ───────────────────────────

describe("countReadyChecks", () => {
  it("compte tous les ok", () => {
    const results = detectRealUsageStatus(makeInput());
    expect(countReadyChecks(results)).toBe(8);
  });

  it("compte 0 quand tout est error", () => {
    const results = detectRealUsageStatus(makeInput({
      demoProfileExists: true,
      cvMasterExists: false,
      opportunityCount: 0,
      verifiableProofCount: 0,
      approvedDocCount: 0,
    }));
    expect(countReadyChecks(results)).toBeLessThan(8);
  });
});

// ─── realUsageReadiness ─────────────────────────

describe("realUsageReadiness", () => {
  it("retourne 100 quand tout est ok", () => {
    const results = detectRealUsageStatus(makeInput());
    expect(realUsageReadiness(results)).toBe(100);
  });

  it("score très bas (0-20%) quand tout est en erreur", () => {
    const results = detectRealUsageStatus(makeInput({
      demoProfileExists: true,
      cvMasterExists: false,
      opportunityCount: 0,
      verifiableProofCount: 0,
      approvedDocCount: 0,
      plannedRelanceCount: 0,
      sentRelanceCount: 0,
      pipelineDraftCount: 0,
      analyzedOpportunityCount: 0,
    }));
    const readiness = realUsageReadiness(results);
    expect(readiness).toBeLessThanOrEqual(20);
  });

  it("score intermédiaire avec mix", () => {
    const results = detectRealUsageStatus(makeInput({
      demoProfileExists: false,
      cvMasterExists: true,
      opportunityCount: 5,
      proofCount: 2,
      verifiableProofCount: 0,
      approvedDocCount: 0,
      plannedRelanceCount: 0,
      sentRelanceCount: 0,
      pipelineDraftCount: 0,
      analyzedOpportunityCount: 0,
    }));
    const readiness = realUsageReadiness(results);
    expect(readiness).toBeGreaterThan(0);
    expect(readiness).toBeLessThan(100);
  });
});
