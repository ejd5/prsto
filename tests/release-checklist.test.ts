import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("System health endpoint verification", () => {
  it("health route file exists", () => {
    const healthRoute = path.resolve(process.cwd(), "app/api/elton-os/health/route.ts");
    expect(fs.existsSync(healthRoute)).toBe(true);
  });

  it("health endpoint does not expose API key values to client", () => {
    const healthRoute = path.resolve(process.cwd(), "app/api/elton-os/health/route.ts");
    const content = fs.readFileSync(healthRoute, "utf-8");
    // The code can reference apiKey as a boolean check, but must never send the value
    expect(content).toContain("status");
    expect(content).toContain("stats");
    // Never serialize the actual apiKey string value in response
    expect(content).not.toMatch(/apiKey\s*:/);
  });
});

describe("Release checklist verification", () => {
  it("release checklist exists and covers critical items", () => {
    const checklist = path.resolve(process.cwd(), "docs/RELEASE_CHECKLIST.md");
    expect(fs.existsSync(checklist)).toBe(true);
    const content = fs.readFileSync(checklist, "utf-8");
    const lower = content.toLowerCase();
    expect(lower).toContain("no-auto-apply");
    expect(lower).toContain("extension");
    expect(lower).toContain("lint");
    expect(lower).toContain("export");
    expect(lower).toContain("guide");
  });

  it("release checklist has No-Apply Guard section", () => {
    const content = fs.readFileSync(path.resolve(process.cwd(), "docs/RELEASE_CHECKLIST.md"), "utf-8");
    expect(content).toContain("No-Apply Guard");
  });
});

describe("Daily routine and QA docs", () => {
  it("daily routine doc exists", () => {
    const p = path.resolve(process.cwd(), "docs/DAILY_ROUTINE.md");
    expect(fs.existsSync(p)).toBe(true);
  });

  it("extension manual QA runbook exists", () => {
    const p = path.resolve(process.cwd(), "docs/EXTENSION_MANUAL_QA_RUNBOOK.md");
    expect(fs.existsSync(p)).toBe(true);
  });
});
