# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: routes-smoke.spec.ts >> Smoke — routes principales >> GET /proof-vault → 200 et rendu
- Location: e2e/routes-smoke.spec.ts:25:9

# Error details

```
Test timeout of 30000ms exceeded.
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
            - img [ref=e70]
            - generic [ref=e73]: Démarrage guidé
          - link "Profil" [ref=e74] [cursor=pointer]:
            - /url: /profil
            - img [ref=e75]
            - generic [ref=e78]: Profil
          - link "CV Maître" [ref=e79] [cursor=pointer]:
            - /url: /cv-maitre
            - img [ref=e80]
            - generic [ref=e83]: CV Maître
          - link "Proof Vault" [ref=e84] [cursor=pointer]:
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
          - generic [ref=e135]: 04:52
          - button "E ELTON BLACK" [ref=e136]:
            - generic [ref=e137]: E
            - generic [ref=e138]: ELTON BLACK
            - img [ref=e139]
      - main [ref=e142]:
        - generic [ref=e143]:
          - generic [ref=e144]:
            - generic [ref=e145]:
              - heading "Proof Vault" [level=1] [ref=e146]
              - paragraph [ref=e147]: 0 preuve(s) — source de vérité pour toutes les affirmations
            - button "Ajouter une preuve" [ref=e148]:
              - img [ref=e149]
              - text: Ajouter une preuve
          - button "Tous (0)" [ref=e151]
          - generic [ref=e153]:
            - img [ref=e154]
            - paragraph [ref=e156]: Aucune preuve. Ajoutez votre première preuve.
          - button "Suggestions IA" [ref=e157]:
            - img [ref=e158]
            - text: Suggestions IA
  - button "Open Next.js Dev Tools" [ref=e166] [cursor=pointer]:
    - generic [ref=e169]:
      - text: Compiling
      - generic [ref=e170]:
        - generic [ref=e171]: .
        - generic [ref=e172]: .
        - generic [ref=e173]: .
  - alert [ref=e174]
```