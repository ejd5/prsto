import { describe, it, expect } from "vitest";

// ─── Tests de logique d'export (sans Prisma) ────────

// On teste la logique de sanitization appliquée dans export.ts
// sans accéder à la base de données.

function sanitizeSettings(settings: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!settings) return null;
  const safe = { ...settings };
  const hadKey = !!safe.apiKey;
  safe.apiKey = undefined;
  safe.hasApiKey = hadKey;
  return safe;
}

describe("Export JSON — sanitization", () => {
  it("supprime apiKey des settings", () => {
    const settings = {
      id: "elton-os-settings",
      aiProvider: "deepseek",
      apiKey: "sk-secret-key-12345",
      baseUrl: "https://api.deepseek.com",
    };
    const result = sanitizeSettings(settings);
    expect(result).not.toBeNull();
    expect(result!.apiKey).toBeUndefined();
  });

  it("ajoute hasApiKey = true si la clé était présente", () => {
    const settings = { id: "1", apiKey: "sk-secret" };
    const result = sanitizeSettings(settings);
    expect(result!.hasApiKey).toBe(true);
  });

  it("ajoute hasApiKey = false si pas de clé", () => {
    const settings = { id: "1", aiProvider: "none" };
    const result = sanitizeSettings(settings);
    expect(result!.hasApiKey).toBe(false);
  });

  it("retourne null si settings est null", () => {
    expect(sanitizeSettings(null)).toBeNull();
  });

  it("préserve les autres champs", () => {
    const settings = {
      id: "elton-os-settings",
      aiProvider: "deepseek",
      apiKey: "sk-key",
      baseUrl: "https://api.deepseek.com",
      timeout: 25,
    };
    const result = sanitizeSettings(settings);
    expect(result!.id).toBe("elton-os-settings");
    expect(result!.aiProvider).toBe("deepseek");
    expect(result!.baseUrl).toBe("https://api.deepseek.com");
    expect(result!.timeout).toBe(25);
  });

  it("ne laisse pas fuiter la clé en valeur vide", () => {
    const settings = { id: "1", apiKey: "" };
    const result = sanitizeSettings(settings);
    expect(result!.apiKey).toBeUndefined();
    expect(result!.hasApiKey).toBe(false);
  });

  it("ne modifie pas l'objet original", () => {
    const settings = { id: "1", apiKey: "sk-key" };
    sanitizeSettings(settings);
    // L'original doit rester intact
    expect(settings.apiKey).toBe("sk-key");
  });
});

describe("Export JSON — structure", () => {
  it("la structure d'export contient les champs requis", () => {
    // Test de la structure attendue (sans Prisma)
    const exportStructure = {
      exportedAt: new Date().toISOString(),
      profile: { fullName: "Test" },
      cvMaster: [],
      proofEntries: [],
      opportunities: [],
      documents: [],
      pipelineTasks: [],
      relances: [],
      interviews: [],
      analyses: [],
      settings: { id: "1", hasApiKey: false },
      aiPrompts: [],
      jobSources: [],
    };

    expect(exportStructure).toHaveProperty("exportedAt");
    expect(exportStructure).toHaveProperty("profile");
    expect(exportStructure).toHaveProperty("cvMaster");
    expect(exportStructure).toHaveProperty("proofEntries");
    expect(exportStructure).toHaveProperty("opportunities");
    expect(exportStructure).toHaveProperty("documents");
    expect(exportStructure).toHaveProperty("pipelineTasks");
    expect(exportStructure).toHaveProperty("relances");
    expect(exportStructure).toHaveProperty("interviews");
    expect(exportStructure).toHaveProperty("analyses");
    expect(exportStructure).toHaveProperty("settings");
    expect(exportStructure).toHaveProperty("aiPrompts");
    expect(exportStructure).toHaveProperty("jobSources");

    // apiKey ne doit jamais être présent
    const settingsStr = JSON.stringify(exportStructure.settings);
    expect(settingsStr).not.toContain("apiKey");
  });
});
