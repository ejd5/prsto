# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: application-flow.spec.ts >> Parcours candidature complet >> 00 — créer données démo via /test-flow
- Location: e2e/application-flow.spec.ts:4:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/test-flow", waiting until "load"

```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | 
  3   | test.describe.serial("Parcours candidature complet", () => {
  4   |   test("00 — créer données démo via /test-flow", async ({ page }) => {
> 5   |     await page.goto("/test-flow");
      |                ^ Error: page.goto: Test timeout of 30000ms exceeded.
  6   | 
  7   |     page.on("dialog", (dialog) => dialog.accept());
  8   | 
  9   |     // Supprimer d'abord pour repartir propre
  10  |     const deleteBtn = page.getByRole("button", { name: /Supprimer/i });
  11  |     if (await deleteBtn.isVisible().catch(() => false)) {
  12  |       await deleteBtn.click();
  13  |       await page.waitForTimeout(2000);
  14  |     }
  15  | 
  16  |     // Créer données démo
  17  |     const createBtn = page.getByRole("button", { name: /Créer/i });
  18  |     await expect(createBtn).toBeVisible();
  19  |     await createBtn.click();
  20  |     await page.waitForTimeout(3000);
  21  | 
  22  |     // Vérifier message de succès
  23  |     const body = await page.locator("body").innerText();
  24  |     expect(
  25  |       body.includes("succès") ||
  26  |         body.includes("créées") ||
  27  |         body.includes("[DEMO]")
  28  |     ).toBeTruthy();
  29  |   });
  30  | 
  31  |   test("01 — opportunités : liste et détail", async ({ page }) => {
  32  |     await page.goto("/opportunites");
  33  |     await expect(page.locator("h1")).toContainText("Opportunités");
  34  | 
  35  |     const body = page.locator("body");
  36  |     await expect(body).toBeVisible();
  37  |     const text = await body.innerText();
  38  |     expect(text.length).toBeGreaterThan(50);
  39  | 
  40  |     // Cliquer sur le premier lien d'opportunité si présent
  41  |     const oppLink = page.locator('a[href*="/opportunites/"]').first();
  42  |     if (await oppLink.isVisible({ timeout: 3000 }).catch(() => false)) {
  43  |       await oppLink.click();
  44  |       await page.waitForTimeout(1000);
  45  |       await expect(page.locator("body")).toBeVisible();
  46  |     }
  47  |   });
  48  | 
  49  |   test("02 — analyse : page charge", async ({ page }) => {
  50  |     await page.goto("/analyse");
  51  |     await expect(page.locator("h1")).toContainText("Analyse");
  52  |     const body = page.locator("body");
  53  |     await expect(body).toBeVisible();
  54  |     const text = await body.innerText();
  55  |     expect(text.length).toBeGreaterThan(20);
  56  |   });
  57  | 
  58  |   test("03 — documents : page charge", async ({ page }) => {
  59  |     await page.goto("/documents");
  60  |     await expect(page.locator("h1")).toContainText("Documents");
  61  |     const body = page.locator("body");
  62  |     await expect(body).toBeVisible();
  63  |     const text = await body.innerText();
  64  |     expect(text.length).toBeGreaterThan(20);
  65  |   });
  66  | 
  67  |   test("04 — documents/templates : page charge", async ({ page }) => {
  68  |     await page.goto("/documents/templates");
  69  |     await expect(page.locator("body")).toContainText("Templates");
  70  |     await expect(page.locator("body")).toBeVisible();
  71  |   });
  72  | 
  73  |   test("05 — quality-check : page charge", async ({ page }) => {
  74  |     await page.goto("/quality-check");
  75  |     await expect(page.locator("body")).toContainText("Assistant qualité");
  76  |     await expect(page.locator("body")).toBeVisible();
  77  |   });
  78  | 
  79  |   test("06 — pipeline : page charge et colonnes visibles", async ({ page }) => {
  80  |     await page.goto("/pipeline");
  81  |     const body = page.locator("body");
  82  |     await expect(body).toBeVisible({ timeout: 5000 });
  83  |     const text = await body.innerText();
  84  |     expect(text.length).toBeGreaterThan(20);
  85  |     const lower = text.toLowerCase();
  86  |     expect(
  87  |       lower.includes("postuler") ||
  88  |         lower.includes("attente") ||
  89  |         lower.includes("entretien") ||
  90  |         lower.includes("pipeline")
  91  |     ).toBeTruthy();
  92  |   });
  93  | 
  94  |   test("07 — performance : KPIs chargent", async ({ page }) => {
  95  |     await page.goto("/performance");
  96  |     await expect(page.locator("h1")).toContainText("Performance");
  97  |     const body = page.locator("body");
  98  |     await expect(body).toBeVisible({ timeout: 5000 });
  99  |     await page.waitForTimeout(2000);
  100 |     const text = await body.innerText();
  101 |     expect(text.length).toBeGreaterThan(30);
  102 |   });
  103 | 
  104 |   test("08 — entretiens : page charge", async ({ page }) => {
  105 |     await page.goto("/entretiens");
```