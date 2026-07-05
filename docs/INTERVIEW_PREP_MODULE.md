# ELTON OS V2.5 — Préparation Entretien — Module

**Date :** 2026-06-21 | **Version :** V2.6

---

## Objectif

Aider un cadre dirigeant à préparer chaque entretien avec un dossier complet généré automatiquement à partir :
- De l'offre (Job)
- Du CV adapté (ApplicationDraft)
- Du profil candidat (Profile)
- Du contact recruteur (CRM)
- De l'historique CRM

Génération 100% locale — pas d'IA pour le MVP. Anti-hallucination.

---

## Modèle Prisma

### InterviewPrep

| Champ | Type | Description |
|-------|------|-------------|
| applicationDraftId | String? | Candidature liée |
| jobId | String? | Offre liée |
| contactId | String? | Contact recruteur lié |
| interviewStage | String | recruiter_screen, hiring_manager, case_study, panel, final, offer_negotiation, unknown |
| prepStatus | String | draft, ready_to_review, approved, archived |
| candidatePitchShort | String? | Pitch 30 secondes |
| candidatePitchLong | String? | Pitch 2 minutes |
| companyBrief | String? | Résumé entreprise |
| likelyQuestionsJson | String? | 12 questions probables avec catégories |
| starAnswersJson | String? | 4-6 réponses STAR |
| objectionsJson | String? | 6 objections + réponses |
| questionsToAskJson | String? | 10 questions à poser |
| thirtySixtyNinetyPlan | String? | Plan 30/60/90 jours |
| compensationStrategy | String? | Stratégie rémunération |
| followUpEmail | String? | Email post-entretien |

---

## Contenu généré (local, pas d'IA)

| Section | Contenu |
|---------|---------|
| **Pitch 30 sec** | "ELTON DUARTE — 20+ ans direction commerciale. Pilotage équipes, stratégie, international." |
| **Pitch 2 min** | Parcours + résultats + adéquation + motivation |
| **12 questions probables** | Parcours, management, stratégie, développement, grands comptes, transformation, résultats, pression, mobilité, rémunération, plan 90 jours, réussite |
| **6 réponses STAR** | Basées sur les 4 dernières expériences du profil |
| **6 objections** | Secteur, salaire, disponibilité, localisation, séniorité, international |
| **10 questions à poser** | Objectifs, périmètre, équipe, budget, culture, attentes CEO, critères succès |
| **Plan 30/60/90** | Diagnostic → Quick Wins → Accélération |
| **Stratégie rémunération** | Basée sur `targetSalary` — si invalide → phrase neutre |
| **Email post-entretien** | Remerciement, rappel intérêt, valeur ajoutée, ouverture |

---

## Anti-hallucination

- Aucune expérience inventée
- Aucun chiffre inventé
- Aucun diplôme inventé
- Rémunération invalide → phrase neutre
- Pas de `[placeholder]`
- Pas de Markdown

---

## Routes API

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/interview-prep` | GET | Liste des préparations |
| `/api/interview-prep` | POST | Créer depuis draftId |
| `/api/interview-prep/[id]` | GET | Détail |
| `/api/interview-prep/[id]` | PUT | Mettre à jour |
| `/api/interview-prep/[id]` | PATCH | Approuver/archiver |
| `/api/application-drafts/[id]/interview-prep` | POST | Créer depuis une candidature |

Toutes les routes protégées par `checkAuth()`.

---

## Pages UI

| Page | Description |
|------|-------------|
| `/dashboard/jobs/interview-prep` | Liste des préparations |
| `/dashboard/jobs/interview-prep/[id]` | Détail avec toutes les sections + boutons Copier |
| Sidebar | Entrée "Entretiens" |

---

## Intégration

| Module | Intégration |
|--------|-------------|
| ApplicationDraft | `POST /api/application-drafts/[id]/interview-prep` |
| Pipeline | Bouton "Préparer entretien" (violet) si pas de prep, badge "Préparation prête" (vert) si prep active. Action directe dans la colonne Entretien. |
| CRM | Interaction type `note` (internal_note) créée automatiquement — sujet : "Préparation entretien créée — {poste} (entretien non encore réalisé)" |
| Sidebar | `/dashboard/jobs/interview-prep` |

---

## Sécurité

- Routes protégées par `checkAuth()` (token x-api-token requis hors localhost)
- Aucune donnée d'entretien publique
- Aucun email envoyé automatiquement
- Aucune candidature automatique

---

## Tests

- **Fichier :** `tests/interview-prep.test.ts` — 40 tests
- **Couverture V2.5.1 :** création, génération de contenu, anti-hallucination, update/statut, sémantique CRM, CRUD
- **Couverture V2.5.2 :** anti-duplication (double appel, existed flag), updateInterviewPrep date (ISO, HTML input, invalide), pipeline data (hasInterviewPrep, no-crash sans prep)
- **Mock :** `revalidatePath` (next/cache) mocké pour l'environnement vitest

---
## Sémantique CRM corrigée (V2.5.1)

- L'interaction créée est de type `note` (internal_note), PAS `interview`
- Sujet explicite : "Préparation entretien créée — {poste} (entretien non encore réalisé)"
- Aucune confusion possible avec un entretien réel
- Aucun marquage automatique de `pipelineStatus=interview`
- Aucun envoi automatique (email, relance)

---
## Limites

- Génération locale MVP (pas d'IA) — les contenus sont basiques mais corrects
- Pas de personnalisation par type d'entretien (recruiter_screen vs final)
- Pas de mode démo pour les InterviewPreps
- Pas de régénération IA

---

## V2.5.2 — Correctifs & Améliorations

### Pipeline : bouton direct + badge
- Bouton violet "Préparer entretien" dans la colonne Entretien du Pipeline (si pas de prep active)
- Badge vert "Préparation prête" avec lien vers la prep (si prep active)
- Création via `POST /api/application-drafts/{id}/interview-prep` + redirection

### Pipeline data layer
- `PipelineItem` enrichi avec `hasInterviewPrep: boolean`, `interviewPrepId?: string`, `interviewPrepStatus?: string`
- `getApplicationPipeline()` et `getPipelineItem()` incluent la relation `interviewPreps` filtrée (preps actives uniquement)

### Anti-duplication
- `createInterviewPrepFromDraft` vérifie l'existence d'une prep active (draft/ready_to_review/approved) avant création
- Si une prep existe déjà → retourne `{ success: true, prepId, existed: true }` sans créer de doublon

### Correction date dans updateInterviewPrep
- Conversion automatique string → Date pour le champ `interviewDate`
- Accepte les formats ISO (2026-07-15T10:00:00.000Z) et HTML input (2026-08-20)
- Les dates invalides sont ignorées silencieusement (pas de crash)

### Helper mono-profil
- Fonction `getPrimaryProfile()` : `findFirst` trié par `createdAt: asc` (le plus ancien = principal)
- Remplace `findFirst()` sans where — plus explicite et prêt pour évolution multi-profil

---

## V2.5.3 — Clean Lint & Smoke E2E

### Correction lint Pipeline
- Suppression de l'erreur `react-hooks/set-state-in-effect` dans `pipeline/page.tsx:99`
- L'effet de chargement initial utilise un fetch inline avec `.then()` (setState dans les callbacks asynchrones uniquement)
- `load` (useCallback) conservé pour les appels impératifs (bouton Actualiser, après actions pipeline)
- `loading` initialisé à `true` → pas besoin de `setLoading(true)` synchrone dans l'effet

### Smoke E2E validé
- Création InterviewPrep avec 10 sections générées et non vides
- Anti-duplication UI : 2e clic → `existed:true`, même prepId, pas de doublon actif
- CRM : interaction type `note`, direction `internal_note`, sujet "Préparation entretien créée — {poste} (entretien non encore réalisé)"
- pipelineStatus inchangé après création prep
- Pipeline data : `hasInterviewPrep=true`, `interviewPrepId` et `interviewPrepStatus` corrects
- Dates : ISO acceptée, HTML input acceptée, date invalide ignorée sans crash, update sans date OK

### État final
- **Tests :** 777/777, 0 skip, 0 échec
- **Lint :** 0 erreur sur les fichiers modifiés
- **Build :** OK

---

## Checklist après modification Prisma

Toute modification de `prisma/schema.prisma` nécessite :

1. `npm run prisma:refresh` — régénère le client dans `./app/generated/prisma`
2. `npx prisma db push` — applique les changements à la DB (SQLite)
3. Redémarrer le serveur Next.js (`npm run dev:fresh`)
4. `npm run smoke:pipeline-api` — vérifie que l'API Pipeline retourne du JSON valide
5. `npm test` — vérifie qu'aucun test ne casse

> Voir [DEV_RUNTIME_TROUBLESHOOTING.md](DEV_RUNTIME_TROUBLESHOOTING.md) pour le diagnostic des erreurs Prisma Client stale.
