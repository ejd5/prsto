# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: routes-smoke.spec.ts >> Smoke — routes principales >> GET /demarrage → 200 et rendu
- Location: e2e/routes-smoke.spec.ts:25:9

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/demarrage", waiting until "load"

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
          - img [ref=e16]
          - generic [ref=e21]: Home
        - link "AI Briefing" [ref=e22] [cursor=pointer]:
          - /url: /analyse
          - img [ref=e23]
          - generic [ref=e26]: AI Briefing
        - link "Signal Feed" [ref=e27] [cursor=pointer]:
          - /url: /opportunites
          - img [ref=e28]
          - generic [ref=e34]: Signal Feed
        - link "Market Watch" [ref=e35] [cursor=pointer]:
          - /url: /market-radar
          - img [ref=e36]
          - generic [ref=e39]: Market Watch
      - generic [ref=e40]:
        - generic [ref=e41]: Intelligence & Tools
        - link "Recruiter Intel" [ref=e42] [cursor=pointer]:
          - /url: /dashboard/jobs/crm
          - img [ref=e43]
          - generic [ref=e48]: Recruiter Intel
        - link "Interview Studio" [ref=e49] [cursor=pointer]:
          - /url: /entretiens
          - img [ref=e50]
          - generic [ref=e53]: Interview Studio
        - link "Documents AI" [ref=e54] [cursor=pointer]:
          - /url: /documents
          - img [ref=e55]
          - generic [ref=e58]: Documents AI
        - link "Strategy Lab" [ref=e59] [cursor=pointer]:
          - /url: /analyse
          - img [ref=e60]
          - generic [ref=e62]: Strategy Lab
        - link "Decision Support" [ref=e63] [cursor=pointer]:
          - /url: /performance
          - img [ref=e64]
          - generic [ref=e66]: Decision Support
      - generic [ref=e67]:
        - generic [ref=e68]: Classic Modules
        - link "Démarrage guidé" [ref=e69] [cursor=pointer]:
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
    - main [ref=e141]:
      - img [ref=e143]
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
> 31 |       const res = await page.goto(route.path);
     |                              ^ Error: page.goto: Test timeout of 30000ms exceeded.
  32 |       expect(res?.status()).toBe(200);
  33 | 
  34 |       const body = page.locator("body");
  35 |       await expect(body).toBeVisible();
  36 | 
  37 |       // Vérifier qu'au moins un élément visible est présent
  38 |       const text = await body.innerText();
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