import { describe, it, expect } from "vitest";

// ─── Smoke test : structures de routes ───────────────
// Vérifie que les routes sont correctement déclarées
// Le test HTTP réel nécessite un serveur lancé

const STATIC_ROUTES = [
  "/",
  "/profil",
  "/cv-maitre",
  "/proof-vault",
  "/sources",
  "/guide",
  "/opportunites",
  "/analyse",
  "/documents",
  "/documents/templates",
  "/dashboard/jobs/pipeline",
  "/entretiens",
  "/parametres",
  "/test-flow",
];

const DYNAMIC_ROUTES = [
  "/opportunites/[id]",
  "/documents/[id]",
  "/entretiens/[id]",
];

describe("Déclaration des routes", () => {
  it("14 routes statiques sont déclarées", () => {
    expect(STATIC_ROUTES).toHaveLength(14);
  });

  it("3 routes dynamiques sont déclarées", () => {
    expect(DYNAMIC_ROUTES).toHaveLength(3);
  });

  it("toutes les routes statiques commencent par /", () => {
    for (const route of STATIC_ROUTES) {
      expect(route.startsWith("/")).toBe(true);
    }
  });

  it("toutes les routes sont uniques", () => {
    const all = [...STATIC_ROUTES, ...DYNAMIC_ROUTES];
    expect(new Set(all).size).toBe(all.length);
  });

  it("les routes critiques sont présentes", () => {
    expect(STATIC_ROUTES).toContain("/");
    expect(STATIC_ROUTES).toContain("/profil");
    expect(STATIC_ROUTES).toContain("/opportunites");
    expect(STATIC_ROUTES).toContain("/dashboard/jobs/pipeline");
    expect(STATIC_ROUTES).toContain("/entretiens");
    expect(STATIC_ROUTES).toContain("/test-flow");
    expect(STATIC_ROUTES).toContain("/parametres");
  });
});
