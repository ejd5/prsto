# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: routes-smoke.spec.ts >> Smoke — routes principales >> GET /entretiens → 200 et rendu
- Location: e2e/routes-smoke.spec.ts:25:9

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.innerText: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('body')

```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | const ROUTES: { path: string; title: string }[] = [
  4  |   { path: "/", title: "Dashboard" },
  5  |   { path: "/demarrage", title: "Démarrage guidé" },
  6  |   { path: "/test-flow", title: "Test flow" },
  7  |   { path: "/profil", title: "Profil" },
  8  |   { path: "/cv-maitre", title: "CV Maître" },
  9  |   { path: "/proof-vault", title: "Proof Vault" },
  10 |   { path: "/sources", title: "Sources" },
  11 |   { path: "/opportunites", title: "Opportunités" },
  12 |   { path: "/analyse", title: "Analyse" },
  13 |   { path: "/documents", title: "Documents" },
  14 |   { path: "/documents/templates", title: "Templates" },
  15 |   { path: "/quality-check", title: "Quality Check" },
  16 |   { path: "/pipeline", title: "Pipeline" },
  17 |   { path: "/performance", title: "Performance" },
  18 |   { path: "/entretiens", title: "Entretiens" },
  19 |   { path: "/parametres", title: "Paramètres" },
  20 |   { path: "/guide", title: "Guide" },
  21 | ];
  22 | 
  23 | test.describe("Smoke — routes principales", () => {
  24 |   for (const route of ROUTES) {
  25 |     test(`GET ${route.path} → 200 et rendu`, async ({ page }) => {
  26 |       const errors: string[] = [];
  27 |       page.on("console", (msg) => {
  28 |         if (msg.type() === "error") errors.push(msg.text());
  29 |       });
  30 | 
  31 |       const res = await page.goto(route.path);
  32 |       expect(res?.status()).toBe(200);
  33 | 
  34 |       const body = page.locator("body");
  35 |       await expect(body).toBeVisible();
  36 | 
  37 |       // Vérifier qu'au moins un élément visible est présent
> 38 |       const text = await body.innerText();
     |                               ^ Error: locator.innerText: Test timeout of 30000ms exceeded.
  39 |       expect(text.length).toBeGreaterThan(5);
  40 | 
  41 |       // Pas d'erreur console non récupérée
  42 |       if (errors.length > 0) {
  43 |         console.warn(`[${route.path}] console errors:`, errors.slice(0, 3));
  44 |       }
  45 |       expect(errors.length).toBe(0);
  46 |     });
  47 |   }
  48 | });
  49 | 
  50 | test.describe("Smoke — sidebar navigation", () => {
  51 |   test("toutes les routes depuis la sidebar", async ({ page }) => {
  52 |     await page.goto("/");
  53 |     const sidebar = page.locator("aside").first();
  54 |     await expect(sidebar).toBeVisible();
  55 | 
  56 |     const navItems = [
  57 |       "Home",
  58 |       "AI Briefing",
  59 |       "Signal Feed",
  60 |       "Market Watch",
  61 |       "Recruiter Intel",
  62 |       "Interview Studio",
  63 |       "Documents AI",
  64 |       "Strategy Lab",
  65 |       "Decision Support",
  66 |       "Démarrage guidé",
  67 |       "Profil",
  68 |       "CV Maître",
  69 |       "Proof Vault",
  70 |       "Sources",
  71 |       "Pipeline",
  72 |       "Paramètres",
  73 |       "Guide complet",
  74 |     ];
  75 |     for (const label of navItems) {
  76 |       await expect(sidebar).toContainText(label);
  77 |     }
  78 |   });
  79 | });
  80 | 
```