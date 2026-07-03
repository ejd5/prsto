# ELTON OS — E2E Testing Guide

## Quick Start

```bash
# Prérequis : Base de données à jour
npm run db:migrate
npm run db:seed

# 1. Démarrer le serveur en arrière-plan
npm run dev &

# 2. Lancer tous les tests E2E
npm run test:e2e

# 3. Lancer uniquement les 5 parcours critiques
npm run test:e2e:critical

# 4. Lancer en mode visible (headed)
npm run test:e2e:critical:headed

# 5. Voir le rapport HTML
npm run test:e2e:report
```

## Architecture

```
e2e/
├── playwright.config.ts       # Configuration centrale
├── fixtures/
│   └── demo-data.ts           # Profils fictifs pour tests
├── helpers.ts                 # Utilitaires partagés (setup/teardown demo)
├── critical/                  # 5 parcours critiques
│   ├── 01-onboarding.spec.ts
│   ├── 02-assisted-import.spec.ts
│   ├── 03-application-generation.spec.ts
│   ├── 04-premium-cv-pdf.spec.ts
│   └── 05-pipeline.spec.ts
├── routes-smoke.spec.ts       # Smoke tests des routes principales
├── application-flow.spec.ts   # Parcours candidature complet
├── safety.spec.ts             # Tests de sécurité
└── test-flow-demo.spec.ts     # Tests UI / test-flow
```

## Les 5 parcours critiques

| # | Parcours | Fichier | Couvre |
|---|----------|---------|--------|
| 1 | Onboarding → profil prêt | `01-onboarding.spec.ts` | Dashboard, démarrage, profil, guide, first-run |
| 2 | Import assisté mocké | `02-assisted-import.spec.ts` | Fixture extension, import LinkedIn/Indeed/APEC, dashboard |
| 3 | Génération candidature | `03-application-generation.spec.ts` | Opportunités, analyse, documents, templates, quality check |
| 4 | Téléchargement PDF premium | `04-premium-cv-pdf.spec.ts` | CV print, pas d'auto-print, templates, endpoint PDF |
| 5 | Pipeline | `05-pipeline.spec.ts` | Pipeline, stats, guide, sécurité no-auto-apply |

## Prérequis

- Node.js 18+
- Playwright installé (`npx playwright install chromium`)
- Base de données SQLite initialisée (`npm run db:migrate`)
- Serveur Next.js accessible sur `localhost:3000`
- Données démo disponibles (créées automatiquement avant chaque test)

## Données de test

Les tests utilisent :
1. **Données démo** — Créées via `/test-flow` (10 offres, 6 candidatures, pipeline complet)
2. **Fixtures** — Profil et offres fictives dans `e2e/fixtures/demo-data.ts`
3. **Extension Fixture** — Page `/test-flow/extension-fixture` pour simuler l'import

Aucune donnée personnelle réelle n'est utilisée.

## Ce qui n'est PAS testé (E2E)

- Import réel depuis LinkedIn / Indeed / APEC (site externe, nécessite authentification)
- Scraping de sites externes (contre les CGU)
- Extension Chrome réelle (testée unitairement dans `browser-extension/`)
- API externe DeepSeek / AI providers (nécessite clé API)
- Push notifications
- SMTP / email réel

## Tests unitaires vs E2E

| Type | Outil | Nombre | Couverture |
|------|-------|--------|------------|
| Unitaires | Vitest | 1464+ | Fonctions, templates, logique métier |
| E2E | Playwright | ~30 | Parcours utilisateur, UI, sécurité |

## Sécurité

Les tests E2E vérifient :
- Pas de bouton "Postuler automatiquement" ou "Auto Apply"
- Guide mentionne "ne postule jamais à votre place"
- API key masquée dans les paramètres
- Aucun scraping automatique
- Documents et pipeline avec validation humaine

## CI

```bash
# FULL CI
npm run db:reset
npm run test:e2e:critical
npx vitest run
npm run build
```

## Troubleshooting

| Problème | Solution |
|----------|----------|
| Timeout sur les tests | Lancer `npm run dev` séparément, puis `playwright test` |
| Erreur `baseURL` | Vérifier que le serveur tourne sur localhost:3000 |
| Tests fixture extension | S'assurer que la route `/test-flow/extension-fixture` existe |
| Tests échouent avec des dialogs natifs | Les tests utilisent `page.on('dialog', ...)` pour les gérer |
| Pas de navigateur | `npx playwright install chromium` |
