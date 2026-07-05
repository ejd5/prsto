# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: critical/01-dashboard.spec.ts >> 1. Dashboard lisible >> 01.1 — Dashboard charge sans crash
- Location: e2e/critical/01-dashboard.spec.ts:4:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: expect(locator).toBeVisible() failed

Locator:  locator('body')
Expected: visible
Received: undefined

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('body')

```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test.describe("1. Dashboard lisible", () => {
  4  |   test("01.1 — Dashboard charge sans crash", async ({ page }) => {
  5  |     const res = await page.goto("/", { waitUntil: "domcontentloaded" });
  6  |     expect(res?.status()).toBe(200);
> 7  |     await expect(page.locator("body")).toBeVisible({ timeout: 10000 });
     |                                        ^ Error: expect(locator).toBeVisible() failed
  8  |     const text = await page.locator("body").innerText();
  9  |     expect(text).toContain("ELTON OS");
  10 |     expect(text.length).toBeGreaterThan(50);
  11 |   });
  12 | 
  13 |   test("01.2 — Navigation principale visible", async ({ page }) => {
  14 |     await page.goto("/", { waitUntil: "domcontentloaded" });
  15 |     const sidebar = page.locator("aside").first();
  16 |     await expect(sidebar).toBeVisible({ timeout: 10000 });
  17 |     await expect(sidebar).toContainText("Home");
  18 |     await expect(sidebar).toContainText("AI Briefing");
  19 |     await expect(sidebar).toContainText("Signal Feed");
  20 |     await expect(sidebar).toContainText("Market Watch");
  21 |     await expect(sidebar).toContainText("Recruiter Intel");
  22 |     await expect(sidebar).toContainText("Interview Studio");
  23 |     await expect(sidebar).toContainText("Documents AI");
  24 |     await expect(sidebar).toContainText("Strategy Lab");
  25 |     await expect(sidebar).toContainText("Decision Support");
  26 |   });
  27 | 
  28 |   test("01.3 — Bouton Sourcing / Import Express visible", async ({ page }) => {
  29 |     await page.goto("/dashboard/jobs", { waitUntil: "domcontentloaded" });
  30 |     const body = page.locator("body");
  31 |     await expect(body).toBeVisible({ timeout: 10000 });
  32 |     await expect(body).toContainText("Import Express");
  33 |   });
  34 | 
  35 |   test("01.4 — Profil page accessible", async ({ page }) => {
  36 |     const res = await page.goto("/profil", { waitUntil: "domcontentloaded" });
  37 |     expect(res?.status()).toBe(200);
  38 |     const body = page.locator("body");
  39 |     await expect(body).toBeVisible({ timeout: 10000 });
  40 |     expect((await body.innerText()).length).toBeGreaterThan(30);
  41 |   });
  42 | 
  43 |   test("01.5 — Aucun texte d'erreur brut", async ({ page }) => {
  44 |     const errors: string[] = [];
  45 |     page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
  46 |     await page.goto("/", { waitUntil: "domcontentloaded" });
  47 |     await page.waitForTimeout(2000);
  48 |     // Allow some known non-critical errors
  49 |     const criticalErrors = errors.filter(e =>
  50 |       !e.includes("favicon") && !e.includes("404") && !e.includes("Failed to load")
  51 |     );
  52 |     expect(criticalErrors.length).toBe(0);
  53 |   });
  54 | });
  55 | 
```