import { describe, it, expect } from "vitest";
import {
  chooseIngestionStrategy,
  getStrategyPriority,
  isNativeStrategy,
  explainStrategyDecision,
  listStrategiesByPriority,
} from "@/lib/jobs/ingestion-router";
import type { IngestionStrategy } from "@/lib/jobs/ingestion-router";

function s(overrides?: Partial<Parameters<typeof chooseIngestionStrategy>[0]>): Parameters<typeof chooseIngestionStrategy>[0] {
  return {
    importMode: "ATS_PUBLIC",
    atsVendor: null,
    normalizedDomain: "boards.greenhouse.io",
    url: "https://boards.greenhouse.io/stripe",
    label: "Stripe — Greenhouse",
    ...overrides,
  };
}

/* ─── Category 1: Strategy priorities ──────── */

describe("getStrategyPriority", () => {
  it("returns 2 for ATS native strategies (highest auto-import priority)", () => {
    expect(getStrategyPriority("ATS_NATIVE_GREENHOUSE")).toBe(2);
    expect(getStrategyPriority("ATS_NATIVE_LEVER")).toBe(2);
    expect(getStrategyPriority("ATS_NATIVE_ASHBY")).toBe(2);
  });

  it("returns 1 for API_OFFICIAL (best)", () => {
    expect(getStrategyPriority("API_OFFICIAL")).toBe(1);
  });

  it("returns 5 for FIRECRAWL_SAFE (middle tier)", () => {
    expect(getStrategyPriority("FIRECRAWL_SAFE")).toBe(5);
  });

  it("returns 8 for USER_ASSISTED (manual only)", () => {
    expect(getStrategyPriority("USER_ASSISTED")).toBe(8);
  });

  it("returns 10 for BLOCKED (worst)", () => {
    expect(getStrategyPriority("BLOCKED")).toBe(10);
  });

  it("returns 10 for unknown strategy", () => {
    expect(getStrategyPriority("UNKNOWN" as IngestionStrategy)).toBe(10);
  });
});

describe("listStrategiesByPriority", () => {
  it("returns strategies in priority order", () => {
    const list = listStrategiesByPriority();
    expect(list[0]).toBe("API_OFFICIAL");
    expect(list[list.length - 1]).toBe("BLOCKED");
  });
});

/* ─── Category 2: isNativeStrategy ─────────── */

describe("isNativeStrategy", () => {
  it("returns true for ATS native strategies", () => {
    expect(isNativeStrategy("ATS_NATIVE_GREENHOUSE")).toBe(true);
    expect(isNativeStrategy("ATS_NATIVE_LEVER")).toBe(true);
    expect(isNativeStrategy("ATS_NATIVE_ASHBY")).toBe(true);
    expect(isNativeStrategy("ATS_NATIVE_SMARTRECRUITERS")).toBe(true);
    expect(isNativeStrategy("JSONLD_NATIVE")).toBe(true);
  });

  it("returns false for FIRECRAWL_SAFE", () => {
    expect(isNativeStrategy("FIRECRAWL_SAFE")).toBe(false);
  });

  it("returns false for BLOCKED and USER_ASSISTED", () => {
    expect(isNativeStrategy("BLOCKED")).toBe(false);
    expect(isNativeStrategy("USER_ASSISTED")).toBe(false);
  });
});

/* ─── Category 3: BLOCKED sources ──────────── */

describe("chooseIngestionStrategy — BLOCKED", () => {
  it("returns BLOCKED for importMode BLOCKED", () => {
    const d = chooseIngestionStrategy(s({ importMode: "BLOCKED" }));
    expect(d.strategy).toBe("BLOCKED");
    expect(d.canAutoImport).toBe(false);
    expect(d.priority).toBe(10);
  });

  it("BLOCKED has no fallback", () => {
    const d = chooseIngestionStrategy(s({ importMode: "BLOCKED" }));
    expect(d.fallback).toBeUndefined();
  });
});

/* ─── Category 4: USER_ASSISTED sources ────── */

describe("chooseIngestionStrategy — USER_ASSISTED", () => {
  it("returns USER_ASSISTED for importMode USER_ASSISTED", () => {
    const d = chooseIngestionStrategy(s({ importMode: "USER_ASSISTED", url: "https://www.linkedin.com/jobs/" }));
    expect(d.strategy).toBe("USER_ASSISTED");
    expect(d.canAutoImport).toBe(false);
  });

  it("returns USER_ASSISTED for importMode MANUAL_ONLY", () => {
    const d = chooseIngestionStrategy(s({ importMode: "MANUAL_ONLY" }));
    expect(d.strategy).toBe("USER_ASSISTED");
    expect(d.canAutoImport).toBe(false);
  });

  it("USER_ASSISTED fallback is itself", () => {
    const d = chooseIngestionStrategy(s({ importMode: "USER_ASSISTED" }));
    expect(d.fallback).toBe("USER_ASSISTED");
  });
});

/* ─── Category 5: API_OFFICIAL ─────────────── */

describe("chooseIngestionStrategy — API_OFFICIAL", () => {
  it("returns API_OFFICIAL for France Travail import mode", () => {
    const d = chooseIngestionStrategy(s({
      importMode: "API_OFFICIAL",
      url: "https://api.francetravail.io/",
      normalizedDomain: "francetravail.io",
    }));
    expect(d.strategy).toBe("API_OFFICIAL");
    expect(d.canAutoImport).toBe(true);
    expect(d.priority).toBe(1);
    expect(d.connector).toBe("france-travail");
    expect(d.fallback).toBe("FIRECRAWL_SAFE");
  });
});

/* ─── Category 6: ATS_PUBLIC with native connector ── */

describe("chooseIngestionStrategy — ATS_PUBLIC native", () => {
  it("routes Greenhouse to ATS_NATIVE_GREENHOUSE", () => {
    const d = chooseIngestionStrategy(s({
      atsVendor: "greenhouse",
      url: "https://boards.greenhouse.io/stripe",
    }));
    expect(d.strategy).toBe("ATS_NATIVE_GREENHOUSE");
    expect(d.canAutoImport).toBe(true);
    expect(d.atsCompany).toBe("stripe");
    expect(d.fallback).toBe("FIRECRAWL_SAFE");
  });

  it("routes Lever to ATS_NATIVE_LEVER", () => {
    const d = chooseIngestionStrategy(s({
      atsVendor: "lever",
      url: "https://jobs.lever.co/palantir",
    }));
    expect(d.strategy).toBe("ATS_NATIVE_LEVER");
    expect(d.atsCompany).toBe("palantir");
  });

  it("routes Ashby to ATS_NATIVE_ASHBY", () => {
    const d = chooseIngestionStrategy(s({
      atsVendor: "ashby",
      url: "https://jobs.ashbyhq.com/linear",
    }));
    expect(d.strategy).toBe("ATS_NATIVE_ASHBY");
    expect(d.atsCompany).toBe("linear");
  });

  it("routes SmartRecruiters to ATS_NATIVE_SMARTRECRUITERS", () => {
    const d = chooseIngestionStrategy(s({
      atsVendor: "smartrecruiters",
      url: "https://jobs.smartrecruiters.com/SomeCompany/jobs",
    }));
    expect(d.strategy).toBe("ATS_NATIVE_SMARTRECRUITERS");
    expect(d.atsCompany).toBe("SomeCompany");
  });

  it("workable falls back to FIRECRAWL_SAFE (no native connector)", () => {
    const d = chooseIngestionStrategy(s({
      atsVendor: "workable",
      url: "https://apply.workable.com/somecompany",
    }));
    expect(d.strategy).toBe("FIRECRAWL_SAFE");
    expect(d.canAutoImport).toBe(true);
    expect(d.connector).toBe("firecrawl-safe");
  });

  it("unknown ATS vendor falls back to FIRECRAWL_SAFE", () => {
    const d = chooseIngestionStrategy(s({
      atsVendor: "teamtailor",
      url: "https://somecompany.teamtailor.com/jobs",
    }));
    expect(d.strategy).toBe("FIRECRAWL_SAFE");
  });

  it("ATS_PUBLIC without vendor defaults to FIRECRAWL_SAFE", () => {
    const d = chooseIngestionStrategy(s({
      atsVendor: null,
      importMode: "ATS_PUBLIC",
      url: "https://boards.greenhouse.io/unknown",
    }));
    expect(d.strategy).toBe("FIRECRAWL_SAFE");
  });
});

/* ─── Category 7: JSON-LD native ───────────── */

describe("chooseIngestionStrategy — JSONLD_NATIVE", () => {
  it("routes AUTO_JSONLD to JSONLD_NATIVE", () => {
    const d = chooseIngestionStrategy(s({
      importMode: "AUTO_JSONLD",
      url: "https://careers.sanofi.com/jobs",
    }));
    expect(d.strategy).toBe("JSONLD_NATIVE");
    expect(d.canAutoImport).toBe(true);
    expect(d.connector).toBe("generic-jsonld");
    expect(d.fallback).toBe("FIRECRAWL_SAFE");
  });
});

/* ─── Category 8: Public careers → Firecrawl ─ */

describe("chooseIngestionStrategy — Firecrawl Safe", () => {
  it("routes AUTO_PUBLIC_CAREERS to FIRECRAWL_SAFE", () => {
    const d = chooseIngestionStrategy(s({
      importMode: "AUTO_PUBLIC_CAREERS",
      url: "https://www.siemens.com/careers",
    }));
    expect(d.strategy).toBe("FIRECRAWL_SAFE");
    expect(d.canAutoImport).toBe(true);
    expect(d.connector).toBe("firecrawl-safe");
  });

  it("routes PUBLIC_CAREERS to FIRECRAWL_SAFE", () => {
    const d = chooseIngestionStrategy(s({
      importMode: "PUBLIC_CAREERS",
      url: "https://www.loreal.com/careers",
    }));
    expect(d.strategy).toBe("FIRECRAWL_SAFE");
  });

  it("routes AUTO_FIRECRAWL_SAFE to FIRECRAWL_SAFE", () => {
    const d = chooseIngestionStrategy(s({
      importMode: "AUTO_FIRECRAWL_SAFE",
    }));
    expect(d.strategy).toBe("FIRECRAWL_SAFE");
  });

  it("legacy AUTO_API defaults to FIRECRAWL_SAFE", () => {
    const d = chooseIngestionStrategy(s({ importMode: "AUTO_API" }));
    expect(d.strategy).toBe("FIRECRAWL_SAFE");
    expect(d.fallback).toBe("USER_ASSISTED");
  });

  it("legacy AUTO_ATS defaults to FIRECRAWL_SAFE", () => {
    const d = chooseIngestionStrategy(s({ importMode: "AUTO_ATS" }));
    expect(d.strategy).toBe("FIRECRAWL_SAFE");
  });
});

/* ─── Category 9: ATS company extraction ───── */

describe("chooseIngestionStrategy — company extraction", () => {
  it("extracts company from Greenhouse URL with path", () => {
    const d = chooseIngestionStrategy(s({
      atsVendor: "greenhouse",
      url: "https://boards.greenhouse.io/databricks/jobs/12345",
    }));
    expect(d.atsCompany).toBe("databricks");
  });

  it("extracts company from Lever URL", () => {
    const d = chooseIngestionStrategy(s({
      atsVendor: "lever",
      url: "https://jobs.lever.co/palantir",
    }));
    expect(d.atsCompany).toBe("palantir");
  });

  it("extracts company from Ashby URL with path", () => {
    const d = chooseIngestionStrategy(s({
      atsVendor: "ashby",
      url: "https://jobs.ashbyhq.com/perplexity/jobs",
    }));
    expect(d.atsCompany).toBe("perplexity");
  });

  it("handles URL without path gracefully (no ATS native)", () => {
    const d = chooseIngestionStrategy(s({
      atsVendor: "greenhouse",
      url: "https://boards.greenhouse.io",
    }));
    // No company extractable — falls back to Firecrawl
    expect(d.strategy).toBe("FIRECRAWL_SAFE");
  });
});

/* ─── Category 10: explainStrategyDecision ──── */

describe("explainStrategyDecision", () => {
  it("includes strategy name and priority", () => {
    const d = chooseIngestionStrategy(s({ atsVendor: "greenhouse", url: "https://boards.greenhouse.io/stripe" }));
    const exp = explainStrategyDecision(d);
    expect(exp).toContain("ATS_NATIVE_GREENHOUSE");
    expect(exp).toContain("2/10");
    expect(exp).toContain("oui");
    expect(exp).toContain("stripe");
  });

  it("shows non-auto-importable for BLOCKED", () => {
    const d = chooseIngestionStrategy(s({ importMode: "BLOCKED" }));
    const exp = explainStrategyDecision(d);
    expect(exp).toContain("non");
  });

  it("includes fallback when present", () => {
    const d = chooseIngestionStrategy(s({ atsVendor: "greenhouse", url: "https://boards.greenhouse.io/stripe" }));
    const exp = explainStrategyDecision(d);
    expect(exp).toContain("FIRECRAWL_SAFE");
  });
});

/* ─── Category 11: Strategy decision shape ──── */

describe("StrategyDecision shape", () => {
  it("all required fields are present", () => {
    const d = chooseIngestionStrategy(s({ atsVendor: "greenhouse", url: "https://boards.greenhouse.io/stripe" }));
    expect(d).toHaveProperty("strategy");
    expect(d).toHaveProperty("priority");
    expect(d).toHaveProperty("reason");
    expect(d).toHaveProperty("canAutoImport");
  });

  it("reason is a non-empty string", () => {
    const d = chooseIngestionStrategy(s({ importMode: "BLOCKED" }));
    expect(d.reason.length).toBeGreaterThan(10);
  });
});
