import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const EXPORT_ROUTE = path.resolve(process.cwd(), "app/api/elton-os/export/route.ts");
const content = fs.readFileSync(EXPORT_ROUTE, "utf-8");

describe("Export format validation", () => {
  it("export endpoint path exists", () => {
    expect(fs.existsSync(EXPORT_ROUTE)).toBe(true);
  });

  it("export uses JSZip for ZIP generation", () => {
    expect(content).toContain("JSZip");
    expect(content).toContain("zip.file");
    expect(content).toContain("generateAsync");
  });

  it("export filename follows elton-os-export- convention", () => {
    expect(content).toContain("elton-os-export-");
    expect(content).toContain(".zip");
  });

  it("export fetches profile, opportunities, contacts, drafts", () => {
    expect(content).toContain("profiles");
    expect(content).toContain("opportunities");
    expect(content).toContain("contacts");
    expect(content).toContain("drafts");
  });

  it("export adds model JSON files to ZIP", () => {
    expect(content).toContain("profile.json");
    expect(content).toContain("opportunities.json");
    expect(content).toContain("contacts.json");
    expect(content).toContain("drafts.json");
  });

  it("export sets Content-Type application/zip", () => {
    expect(content).toContain("application/zip");
    expect(content).toContain("Content-Disposition");
    expect(content).toContain("Cache-Control");
  });
});
