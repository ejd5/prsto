import { describe, it, expect } from "vitest";
import {
  parseDemoMode,
  isDemoFromParams,
  withDemoParam,
  getDraftDemoFilter,
  getJobDemoFilter,
  DEMO_TAG,
} from "@/lib/jobs/demo-data";

describe("parseDemoMode", () => {
  it("returns true when demo=true", () => {
    const sp = new URLSearchParams("demo=true");
    expect(parseDemoMode(sp)).toBe(true);
  });

  it("returns false when demo=false", () => {
    const sp = new URLSearchParams("demo=false");
    expect(parseDemoMode(sp)).toBe(false);
  });

  it("returns false when demo is absent", () => {
    const sp = new URLSearchParams("");
    expect(parseDemoMode(sp)).toBe(false);
  });

  it("returns false for demo=1", () => {
    const sp = new URLSearchParams("demo=1");
    expect(parseDemoMode(sp)).toBe(false);
  });

  it("returns false for demo=yes", () => {
    const sp = new URLSearchParams("demo=yes");
    expect(parseDemoMode(sp)).toBe(false);
  });

  it("returns false for empty value", () => {
    const sp = new URLSearchParams("demo=");
    expect(parseDemoMode(sp)).toBe(false);
  });

  it("returns false for null input", () => {
    expect(parseDemoMode(null)).toBe(false);
  });

  it("returns false when other params present but demo absent", () => {
    const sp = new URLSearchParams("status=new&priority=1");
    expect(parseDemoMode(sp)).toBe(false);
  });
});

describe("isDemoFromParams", () => {
  it("same behavior as parseDemoMode for demo=true", () => {
    const sp = new URLSearchParams("demo=true");
    expect(isDemoFromParams(sp)).toBe(true);
  });

  it("same behavior for demo absent", () => {
    const sp = new URLSearchParams("");
    expect(isDemoFromParams(sp)).toBe(false);
  });
});

describe("withDemoParam", () => {
  it("adds demo=true when isDemo is true", () => {
    expect(withDemoParam("/dashboard/jobs", true)).toBe("/dashboard/jobs?demo=true");
  });

  it("does not add param when isDemo is false", () => {
    expect(withDemoParam("/dashboard/jobs", false)).toBe("/dashboard/jobs");
  });

  it("uses & when path already has params", () => {
    expect(withDemoParam("/dashboard/jobs?filter=new", true)).toBe("/dashboard/jobs?filter=new&demo=true");
  });
});

describe("getDraftDemoFilter", () => {
  it("demoMode=true returns startsWith filter on jobSummary", () => {
    const f = getDraftDemoFilter(true);
    expect(f).toEqual({ jobSummary: { startsWith: DEMO_TAG } });
  });

  it("demoMode=false returns NOT filter on jobSummary", () => {
    const f = getDraftDemoFilter(false);
    expect(f).toEqual({ NOT: { jobSummary: { startsWith: DEMO_TAG } } });
  });
});

describe("getJobDemoFilter", () => {
  it("demoMode=true returns startsWith filter on title", () => {
    const f = getJobDemoFilter(true);
    expect(f).toEqual({ title: { startsWith: DEMO_TAG } });
  });

  it("demoMode=false returns NOT filter on title", () => {
    const f = getJobDemoFilter(false);
    expect(f).toEqual({ NOT: { title: { startsWith: DEMO_TAG } } });
  });
});
