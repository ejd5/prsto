# ELTON OS — Product Status

> Dernière mise à jour : 2026-06-19 · Version V1.9.3

## Résumé

ELTON OS est une application web full-stack (Next.js 16 / Prisma SQLite / DeepSeek / Playwright) conçue pour les cadres dirigeants en recherche d'emploi. L'outil automatise le sourcing, le scoring, la préparation de candidature IA, le pipeline de suivi, les relances intelligentes et les analytics — sans jamais envoyer de candidature automatiquement.

---

## Modules livrés

| # | Module | Version | Statut |
|---|--------|---------|--------|
| 1 | Profil exécutif | V1.0 | ✅ Complet |
| 2 | CV Maître (import/parsing) | V1.0 | ✅ Complet |
| 3 | Proof Vault (preuves chiffrées) | V1.0 | ✅ Complet |
| 4 | Sourcing automatique | V2.0 | ✅ Complet |
| 5 | Browser Agent (Playwright) | V2.0 | ✅ Complet |
| 6 | Scoring offres (7 dimensions) | V1.0 | ✅ Complet |
| 7 | IA DeepSeek + anti-hallucination | V1.0 | ✅ Complet |
| 8 | Préparation candidature IA | V1.2 | ✅ Complet |
| 9 | Candidature assistée | V1.3.1 | ✅ Complet |
| 10 | Pipeline candidature | V1.4.2 | ✅ Complet |
| 11 | Relances intelligentes | V1.4.2 | ✅ Complet |
| 12 | Analytics candidature | V1.5.1 | ✅ Complet |
| 13 | Onboarding guidé | V1.6.1 | ✅ Complet |
| 14 | Mode démo (safe-by-default, smoke 9/9) | V1.9.3 | ✅ Complet |
| 15 | Landing page publique (/elton-os) | V2.0 | ✅ Complet |
| 16 | Formulaire lead + API | V2.0 | ✅ Complet |
| 16 | Guide complet | V1.0 | ✅ Complet |
| 17 | Exports (TXT, PDF, ZIP) | V1.0 | ✅ Complet |

---

## Routes principales

| Route | Méthode | Description |
|-------|---------|-------------|
| `GET /api/jobs` | GET | Liste des offres importées (filtres: priority, new, status) |
| `POST /api/jobs/import/run` | POST | Lance l'import depuis toutes les sources |
| `GET /api/jobs/[id]` | GET | Détail d'une offre |
| `POST /api/jobs/[id]/prepare-application` | POST | Génère le dossier de candidature IA |
| `GET/PATCH/POST /api/application-drafts/[id]` | GET/PATCH/POST | CRUD dossier candidature + actions |
| `POST /api/application-drafts/[id]/follow-up/generate` | POST | Génère 4 messages de relance |
| `POST /api/application-drafts/[id]/pipeline-action` | POST | Action pipeline (mark_followed_up, etc.) |
| `GET /api/jobs/application-pipeline` | GET | Pipeline complet avec stats |
| `GET /api/jobs/application-analytics` | GET | Analytics candidature |
| `POST /api/jobs/browser-agent/login` | POST | Ouvre session browser visible |
| `POST /api/jobs/browser-agent/run` | POST | Lance recherche headless |
| `POST /api/jobs/cron/morning` | POST | Cron matin (import + rapport) |
| `POST /api/jobs/cron/evening` | POST | Cron soir (import + rapport) |
| `GET/POST /api/demo` | GET/POST | Statut, création, suppression données démo |
| `npm run smoke:demo` | Script | Smoke test 9 étapes du mode démo (API) |

---

## Modèles Prisma clés

| Modèle | Rôle |
|--------|------|
| `Profile` | Identité exécutive, préférences, ciblage |
| `Experience` | Expériences pro avec chiffres (équipe, CA, budget) |
| `Skill` | Compétences classées (technique, management, etc.) |
| `CVMaster` | CV maître importé |
| `ProofEntry` | Preuves chiffrées (CA, croissance, équipe...) |
| `Job` | Offre d'emploi normalisée |
| `JobScore` | Score 7 dimensions + action recommandée |
| `ApplicationDraft` | Dossier candidature complet + pipelineStatus |
| `AssistedApplySession` | Session de candidature assistée |
| `BrowserSearchConfig` | Configuration Browser Agent par plateforme |
| `ImportSource` | Source d'import (API, browser, etc.) |
| `PipelineTask` | Pipeline legacy (Opportunities) — NON UTILISÉ par le nouveau pipeline |

---

## Règles de sécurité

- ❌ **Aucun envoi automatique** de candidature, email ou relance
- ❌ **Aucun Browser Agent** lancé automatiquement (login manuel requis)
- ❌ **Aucun bypass CAPTCHA/2FA**
- ✅ CV maître **jamais modifié** automatiquement
- ✅ Validation humaine obligatoire avant toute action
- ✅ Sessions Browser Agent stockées avec `chmod 600`
- ✅ `.elton/` dans `.gitignore`
- ✅ Pas de télémétrie, pas de tracking

---

## Design System

- Fond sombre (`var(--fond)`)
- Accent or/champagne (`var(--or)`)
- Typographie monospace pour données, sans-serif pour texte
- Inline styles (CSS variables) pour cohérence visuelle
- Composants : cartes, boutons, tableaux, badges, modales

---

## Qualité code

| Métrique | Valeur |
|----------|--------|
| Tests unitaires (Vitest) | 332/332 |
| Tests E2E (Playwright) | 38/38 |
| Lint warnings | ~20 (set-state-in-effect préexistants) |
| `no-explicit-any` | 0 |
| Imports relatifs | 100% |

---

## Limites connues

1. **`set-state-in-effect`** sur ~15 pages — pattern cohérent mais non conforme React strict
2. **Pas de pagination serveur** sur `/api/jobs` — `limit=100` maximum
3. **Pas de notifications push** — l'utilisateur doit ouvrir le pipeline pour voir les relances dues
4. **Génération relance** dépend de DeepSeek (fallback local OK mais générique)
5. **Pas d'authentification** — application monoposte (pas de login/multi-tenant)
6. **Pas de packaging SaaS** — pas de Docker, pas de déploiement cloud
7. **Browser Agent** nécessite Playwright installé localement
8. **Analytics** : pas de drill-down sur les tableaux source/score

---

## Prochaines étapes recommandées

1. **V1.7** — Documentation + mode démo (en cours)
2. **V1.8** — Polissage UI premium (transitions, micro-animations, responsive)
3. **V1.9** — Landing page commerciale + mode démo interactif
4. **V2.0** — Packaging SaaS (Docker, déploiement, auth)
5. **V2.1** — Notifications relance (email SMTP, pas de cron externe)
6. **V2.2** — Support multi-utilisateur
