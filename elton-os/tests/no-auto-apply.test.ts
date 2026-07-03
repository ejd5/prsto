import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const APP_DIR = path.resolve(process.cwd(), "app");

describe("No auto-apply code patterns", () => {
  it("app code contains no auto-submit call", () => {
    const files = findFiles(APP_DIR, [".tsx", ".ts"]);
    for (const f of files) {
      const content = fs.readFileSync(f, "utf-8");
      // Check for auto-submit patterns (should NOT exist)
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Skip commented lines, test files, and legitimate uses
        if (line.trim().startsWith("//") || line.trim().startsWith("*") || f.includes(".test.")) continue;
        // These patterns should NEVER appear in app logic
        if (line.includes("autoSubmit") || line.includes("auto_submit") || line.includes("autoApply")) {
          // Only fail if it's in actual logic, not type definitions
          if (!line.includes("interface") && !line.includes("type ") && !line.includes("autoApplyUrl")) {
            expect.fail(`Auto-submit pattern found in ${f}:${i + 1}: ${line.trim()}`);
          }
        }
      }
    }
  });

  it("guide page mentions manual-only apply", () => {
    const guidePath = path.resolve(APP_DIR, "(app)/guide/page.tsx");
    const content = fs.readFileSync(guidePath, "utf-8");
    expect(content).toContain("ne postule jamais");
  });

  it("dashboard mentions manual pipeline", () => {
    const jobDashboardPath = path.resolve(APP_DIR, "(app)/dashboard/jobs/page.tsx");
    const content = fs.readFileSync(jobDashboardPath, "utf-8");
    expect(content).toContain("Rien n'est envoyé automatiquement");
  });
});

function findFiles(dir: string, exts: string[]): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
      results.push(...findFiles(p, exts));
    } else if (entry.isFile() && exts.some((e) => entry.name.endsWith(e))) {
      results.push(p);
    }
  }
  return results;
}
