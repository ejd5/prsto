import { describe, it, expect } from "vitest";
import { normalizeSkills, renderSkillsSection } from "@/lib/jobs/skills-normalizer";

describe("normalizeSkills", () => {
  it("groups and categorizes skills", () => {
    const skills = [
      { name: "Direction commerciale", category: "business" },
      { name: "Négociation grands comptes", category: "business" },
      { name: "Management d'équipe", category: "management" },
      { name: "CRM Salesforce", category: "tech" },
      { name: "Pilotage P&L", category: "business" },
      { name: "Leadership", category: "management" },
    ];
    const result = normalizeSkills(skills);
    expect(result.knowHow.length).toBeGreaterThan(0);
    expect(result.softSkills.length).toBeGreaterThan(0);
  });

  it("deduplicates similar skills", () => {
    const skills = [
      { name: "CRM", category: "tech" },
      { name: "CRM Salesforce", category: "tech" },
      { name: "Salesforce CRM", category: "tech" },
    ];
    const result = normalizeSkills(skills);
    // Should only have one CRM group
    const crmGroups = result.knowHow.filter(g => g.name.toLowerCase().includes("crm"));
    expect(crmGroups.length).toBeLessThanOrEqual(1);
  });

  it("handles empty input", () => {
    const result = normalizeSkills([]);
    expect(result.knowHow).toEqual([]);
    expect(result.softSkills).toEqual([]);
  });
});

describe("renderSkillsSection", () => {
  it("renders both savoir-faire and savoir-être", () => {
    const skills = [
      { name: "Direction commerciale", category: "business" },
      { name: "Leadership", category: "management" },
      { name: "Pilotage P&L", category: "business" },
    ];
    const result = renderSkillsSection(skills);
    expect(result).toContain("SAVOIR-FAIRE");
    expect(result).toContain("SAVOIR-ÊTRE");
  });
});
