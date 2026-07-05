# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: safety.spec.ts >> Sécurité — protections clés >> parametres : clé API masquée et IA optionnelle
- Location: e2e/safety.spec.ts:21:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/parametres", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test.describe("Sécurité — protections clés", () => {
  4  |   test("pipeline : instructions manuelles visibles", async ({ page }) => {
  5  |     await page.goto("/pipeline");
  6  |     const body = page.locator("body");
  7  |     await expect(body).toBeVisible({ timeout: 5000 });
  8  |     const text = await body.innerText();
  9  |     const lower = text.toLowerCase();
  10 |     expect(
  11 |       lower.includes("pas d'envoi") ||
  12 |         lower.includes("aucun envoi") ||
  13 |         lower.includes("envoyer vous-même") ||
  14 |         lower.includes("manuellement") ||
  15 |         lower.includes("envoyez") ||
  16 |         lower.includes("pipeline") ||
  17 |         lower.includes("relance")
  18 |     ).toBeTruthy();
  19 |   });
  20 | 
  21 |   test("parametres : clé API masquée et IA optionnelle", async ({ page }) => {
> 22 |     await page.goto("/parametres");
     |                ^ Error: page.goto: Test timeout of 30000ms exceeded.
  23 | 
  24 |     // Cliquer sur l'onglet DeepSeek via data-testid
  25 |     const deepseekTab = page.locator('[data-testid="tab-deepseek"]');
  26 |     await expect(deepseekTab).toBeVisible({ timeout: 5000 });
  27 |     await deepseekTab.click();
  28 |     await page.waitForTimeout(800);
  29 | 
  30 |     const body = page.locator("body");
  31 |     const text = await body.innerText();
  32 | 
  33 |     // Après clic, la page doit contenir le texte de l'onglet DeepSeek
  34 |     expect(
  35 |       text.includes("optionnel") ||
  36 |         text.includes("fonctionne") ||
  37 |         text.includes("sans clé API") ||
  38 |         text.includes("templates locaux")
  39 |     ).toBeTruthy();
  40 | 
  41 |     // Vérifier le champ de clé API masqué (input password)
  42 |     const hasPasswordInput =
  43 |       (await page.locator('input[type="password"]').count()) > 0;
  44 |     const allPlaceholders = await page.locator("input").evaluateAll((els) =>
  45 |       els.map((el) => (el as HTMLInputElement).placeholder)
  46 |     );
  47 |     const hasMaskedOrSk = allPlaceholders.some(
  48 |       (p) => p.includes("•••") || p.includes("sk-")
  49 |     );
  50 |     expect(hasPasswordInput || hasMaskedOrSk).toBeTruthy();
  51 |   });
  52 | 
  53 |   test("documents : statuts visibles", async ({ page }) => {
  54 |     await page.goto("/documents");
  55 |     const body = page.locator("body");
  56 |     await expect(body).toBeVisible({ timeout: 5000 });
  57 |     const text = await body.innerText();
  58 |     expect(text.length).toBeGreaterThan(20);
  59 |     expect(
  60 |       text.includes("valider") ||
  61 |         text.includes("Approuvé") ||
  62 |         text.includes("Brouillon") ||
  63 |         text.includes("DRAFT") ||
  64 |         text.includes("Document") ||
  65 |         text.includes("valide")
  66 |     ).toBeTruthy();
  67 |   });
  68 | 
  69 |   test("guide : ELTON OS ne postule jamais à votre place", async ({ page }) => {
  70 |     await page.goto("/guide");
  71 |     const body = page.locator("body");
  72 |     await expect(body).toBeVisible({ timeout: 5000 });
  73 |     const text = await body.innerText();
  74 |     expect(
  75 |       text.includes("ne postule jamais") ||
  76 |         text.includes("jamais à votre place") ||
  77 |         text.includes("pas d'envoi automatique") ||
  78 |         text.includes("ne postule")
  79 |     ).toBeTruthy();
  80 |   });
  81 | });
  82 | 
```