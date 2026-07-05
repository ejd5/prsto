# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: safety.spec.ts >> Sécurité — protections clés >> documents : statuts visibles
- Location: e2e/safety.spec.ts:53:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/documents", waiting until "load"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
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
          - generic [ref=e135]: 04:55
          - button "E ELTON BLACK" [ref=e136]:
            - generic [ref=e137]: E
            - generic [ref=e138]: ELTON BLACK
            - img [ref=e139]
      - main [ref=e142]:
        - generic [ref=e143]:
          - generic [ref=e144]:
            - generic [ref=e145]:
              - heading "Documents" [level=1] [ref=e146]
              - paragraph [ref=e147]: 0 documents· 0 approuvés· 0 à valider
            - button "Nouveau document" [ref=e148]:
              - img [ref=e149]
              - text: Nouveau document
          - generic [ref=e150]:
            - img [ref=e151]
            - button "Tous (0)" [ref=e153]
          - img [ref=e155]
        - button "Suggestions IA" [ref=e157]:
          - img [ref=e158]
          - text: Suggestions IA
  - alert [ref=e161]
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
  22 |     await page.goto("/parametres");
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
> 54 |     await page.goto("/documents");
     |                ^ Error: page.goto: Test timeout of 30000ms exceeded.
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