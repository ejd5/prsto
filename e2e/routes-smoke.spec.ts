import { test, expect } from "@playwright/test";

const ROUTES: { path: string; title: string }[] = [
  { path: "/", title: "Dashboard" },
  { path: "/demarrage", title: "Démarrage guidé" },
  { path: "/test-flow", title: "Test flow" },
  { path: "/profil", title: "Profil" },
  { path: "/cv-maitre", title: "CV Maître" },
  { path: "/proof-vault", title: "Proof Vault" },
  { path: "/sources", title: "Sources" },
  { path: "/opportunites", title: "Opportunités" },
  { path: "/analyse", title: "Analyse" },
  { path: "/documents", title: "Documents" },
  { path: "/documents/templates", title: "Templates" },
  { path: "/quality-check", title: "Quality Check" },
  { path: "/pipeline", title: "Pipeline" },
  { path: "/performance", title: "Performance" },
  { path: "/entretiens", title: "Entretiens" },
  { path: "/parametres", title: "Paramètres" },
  { path: "/guide", title: "Guide" },
];

test.describe("Smoke — routes principales", () => {
  for (const route of ROUTES) {
    test(`GET ${route.path} → 200 et rendu`, async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(msg.text());
      });

      const res = await page.goto(route.path);
      expect(res?.status()).toBe(200);

      const body = page.locator("body");
      await expect(body).toBeVisible();

      // Vérifier qu'au moins un élément visible est présent
      const text = await body.innerText();
      expect(text.length).toBeGreaterThan(5);

      // Pas d'erreur console non récupérée
      if (errors.length > 0) {
        console.warn(`[${route.path}] console errors:`, errors.slice(0, 3));
      }
      expect(errors.length).toBe(0);
    });
  }
});

test.describe("Smoke — sidebar navigation", () => {
  test("toutes les routes depuis la sidebar", async ({ page }) => {
    await page.goto("/");
    const sidebar = page.locator("aside");
    await expect(sidebar).toBeVisible();

    // Vérifier les entrées principales de la sidebar
    const navItems = [
      "Dashboard",
      "Démarrage guidé",
      "Test flow",
      "Profil",
      "Opportunités",
      "Pipeline",
      "Documents",
      "Analyse",
      "Entretiens",
      "Performance",
      "Paramètres",
      "Guide",
    ];
    for (const label of navItems) {
      await expect(sidebar).toContainText(label);
    }
  });
});
