# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: critical/01-dashboard.spec.ts >> 1. Dashboard lisible >> 01.2 — Navigation principale visible
- Location: e2e/critical/01-dashboard.spec.ts:13:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('aside').first()
Expected substring: "Signal Feed"
Received string:    ""

Call log:
  - Expect "toContainText" with timeout 10000ms
  - waiting for locator('aside').first()

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - complementary [ref=e3]:
    - generic [ref=e4]:
      - img [ref=e5]:
        - generic [ref=e8]: E
      - generic [ref=e9]:
        - generic [ref=e10]: ELTON OS
        - generic [ref=e11]: BOARDROOM AI COPILOT
    - navigation [ref=e12]:
      - generic [ref=e13]:
        - generic [ref=e14]: AI Copilot
        - link "Home" [ref=e15] [cursor=pointer]:
          - /url: /
          - img [ref=e17]
          - generic [ref=e22]: Home
        - link "AI Briefing" [ref=e23] [cursor=pointer]:
          - /url: /analyse
          - img [ref=e24]
          - generic [ref=e27]: AI Briefing
        - link "Signal Feed" [ref=e28] [cursor=pointer]:
          - /url: /opportunites
          - img [ref=e29]
          - generic [ref=e35]: Signal Feed
        - link "Market Watch" [ref=e36] [cursor=pointer]:
          - /url: /market-radar
          - img [ref=e37]
          - generic [ref=e40]: Market Watch
      - generic [ref=e41]:
        - generic [ref=e42]: Intelligence & Tools
        - link "Recruiter Intel" [ref=e43] [cursor=pointer]:
          - /url: /dashboard/jobs/crm
          - img [ref=e44]
          - generic [ref=e49]: Recruiter Intel
        - link "Interview Studio" [ref=e50] [cursor=pointer]:
          - /url: /entretiens
          - img [ref=e51]
          - generic [ref=e54]: Interview Studio
        - link "Documents AI" [ref=e55] [cursor=pointer]:
          - /url: /documents
          - img [ref=e56]
          - generic [ref=e59]: Documents AI
        - link "Strategy Lab" [ref=e60] [cursor=pointer]:
          - /url: /analyse
          - img [ref=e61]
          - generic [ref=e63]: Strategy Lab
        - link "Decision Support" [ref=e64] [cursor=pointer]:
          - /url: /performance
          - img [ref=e65]
          - generic [ref=e67]: Decision Support
      - generic [ref=e68]:
        - generic [ref=e69]: Classic Modules
        - link "Démarrage guidé" [ref=e70] [cursor=pointer]:
          - /url: /demarrage
          - img [ref=e71]
          - generic [ref=e74]: Démarrage guidé
        - link "Profil" [ref=e75] [cursor=pointer]:
          - /url: /profil
          - img [ref=e76]
          - generic [ref=e79]: Profil
        - link "CV Maître" [ref=e80] [cursor=pointer]:
          - /url: /cv-maitre
          - img [ref=e81]
          - generic [ref=e84]: CV Maître
        - link "Proof Vault" [ref=e85] [cursor=pointer]:
          - /url: /proof-vault
          - img [ref=e86]
          - generic [ref=e88]: Proof Vault
        - link "Sources" [ref=e89] [cursor=pointer]:
          - /url: /sources
          - img [ref=e90]
          - generic [ref=e93]: Sources
        - link "Pipeline" [ref=e94] [cursor=pointer]:
          - /url: /dashboard/jobs/pipeline
          - img [ref=e95]
          - generic [ref=e97]: Pipeline
      - generic [ref=e98]:
        - generic [ref=e99]: System
        - link "Paramètres" [ref=e100] [cursor=pointer]:
          - /url: /parametres
          - img [ref=e101]
          - generic [ref=e104]: Paramètres
        - link "Guide complet" [ref=e105] [cursor=pointer]:
          - /url: /guide
          - img [ref=e106]
          - generic [ref=e108]: Guide complet
    - generic [ref=e109]:
      - generic [ref=e110]: EXECUTIVE PROFILE
      - generic [ref=e111]:
        - generic [ref=e112]: E
        - generic [ref=e113]:
          - generic [ref=e114]: Elton Duarte
          - generic [ref=e115]: Executive
      - generic [ref=e116]:
        - text: ELTON BLACK TIER
        - text: GLOBAL ACCESS
      - generic [ref=e117]: ELTON OS v2.0
  - generic [ref=e118]:
    - banner [ref=e119]:
      - generic [ref=e120]:
        - generic [ref=e121]: Good morning, Alex.
        - generic [ref=e122]: Your AI Boardroom Briefing is ready.
      - generic [ref=e123]:
        - img [ref=e124]
        - generic [ref=e127]: Search anything...
        - generic [ref=e128]: ⌘K
      - generic [ref=e129]:
        - button "3" [ref=e130]:
          - img [ref=e131]
          - generic [ref=e134]: "3"
        - button "E ELTON BLACK" [ref=e135]:
          - generic [ref=e136]: E
          - generic [ref=e137]: ELTON BLACK
          - img [ref=e138]
    - generic [ref=e140]:
      - main [ref=e141]
      - complementary [ref=e144]:
        - generic [ref=e145]:
          - generic [ref=e146]:
            - generic [ref=e147]: ✦
            - text: AI COPILOT
          - generic [ref=e148]: Online
        - generic [ref=e150]:
          - heading "Good morning, Alex." [level=2] [ref=e151]
          - paragraph [ref=e152]: How can I help you lead today?
        - generic [ref=e153]:
          - button "📋 Generate Executive Brief AI-powered summary" [ref=e154]:
            - generic [ref=e155]: 📋
            - generic [ref=e156]:
              - generic [ref=e157]: Generate Executive Brief
              - generic [ref=e158]: AI-powered summary
          - button "📊 Market & Role Intelligence Real-time insights" [ref=e159]:
            - generic [ref=e160]: 📊
            - generic [ref=e161]:
              - generic [ref=e162]: Market & Role Intelligence
              - generic [ref=e163]: Real-time insights
          - button "🎙️ Interview Prep Studio Practice with AI" [ref=e164]:
            - generic [ref=e165]: 🎙️
            - generic [ref=e166]:
              - generic [ref=e167]: Interview Prep Studio
              - generic [ref=e168]: Practice with AI
          - button "📄 Document Generation One-click executive docs" [ref=e169]:
            - generic [ref=e170]: 📄
            - generic [ref=e171]:
              - generic [ref=e172]: Document Generation
              - generic [ref=e173]: One-click executive docs
          - button "🧠 Strategic Recommendations AI-driven next steps" [ref=e174]:
            - generic [ref=e175]: 🧠
            - generic [ref=e176]:
              - generic [ref=e177]: Strategic Recommendations
              - generic [ref=e178]: AI-driven next steps
        - generic [ref=e180]:
          - textbox "Ask Elton anything..." [ref=e181]
          - button [ref=e182]:
            - img [ref=e183]
        - generic [ref=e186]:
          - generic [ref=e187]: "\""
          - paragraph [ref=e188]:
            - text: AI doesn't replace judgment.
            - text: It amplifies leadership.
            - strong [ref=e189]: You decide. AI provides clarity.
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test.describe("1. Dashboard lisible", () => {
  4  |   test("01.1 — Dashboard charge sans crash", async ({ page }) => {
  5  |     const res = await page.goto("/", { waitUntil: "domcontentloaded" });
  6  |     expect(res?.status()).toBe(200);
  7  |     await expect(page.locator("body")).toBeVisible({ timeout: 10000 });
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
> 19 |     await expect(sidebar).toContainText("Signal Feed");
     |                           ^ Error: expect(locator).toContainText(expected) failed
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