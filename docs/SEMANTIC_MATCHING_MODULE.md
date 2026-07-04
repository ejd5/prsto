# ELTON OS V2.6.1 — Matching Sémantique Avancé + Scoring Explicable

**Date :** 2026-06-21 | **Version :** V2.6.1 | **Backfill :** 115 offres, 0 erreur

---

## Objectif

Compléter le scoring existant (DeepSeek + quick-score local) par un **module de matching sémantique explicable**, 100% local, sans dépendance IA.

Le module explique **pourquoi** une offre matche (ou pas) selon 8 dimensions pondérées, avec des signaux positifs, risques, et angles de candidature.

Le scoring existant (`globalScore`, `matchScore`) reste inchangé. Les nouveaux champs sont tous NULL-able — zéro migration de données.

---

## Architecture

- **`lib/jobs/semantic-matcher.ts`** — Fonctions pures (zéro Prisma, zéro réseau)
- **`lib/jobs/quick-score.ts`** — Appel automatique après chaque scoring
- **`scripts/backfill-semantic-scores.ts`** — Backfill idempotent pour les offres existantes
- **4 champs sur `JobScore`** (`semanticScore`, `semanticConfidence`, `semanticAnalysisJson`, `recommendation`)

---

## Dimensions (8 pondérations, somme = 100%)

| Dimension | Poids | Description |
|-----------|-------|-------------|
| Role Fit | 25% | Titre et fonction vs profil direction commerciale |
| Seniority Fit | 20% | Années d'expérience et niveau hiérarchique |
| Location Fit | 15% | Localisation vs profil et mobilité |
| Sector Fit | 10% | Secteurs du profil vs offre |
| Language Fit | 10% | Exigences linguistiques |
| Company Fit | 8% | Entreprise, contrat, culture |
| Compensation Fit | 5% | Adéquation salariale |
| Application Readiness | 7% | Qualité de la description |

---

## Calibration

### Corrections V2.6.1

**1. Faux positif "stage" (substring)**
- Symptôme : "stepping on stage" (anglais = scène) détecté comme "stage" (internship)
- Fix : Patterns multi-mots (`"stage de"`, `"stage en"`, `"offre de stage"`, `"recherche stage"`, `"stagiaire"`, `"intern"`, `"alternance"`, `"apprenti"`, `"graduate"`, `"entry level"`, `"entry-level"`, `"debutant"`) au lieu de `"stage"` seul
- Appliqué dans : `applyRiskCaps()`, `computeRisk()`, `detectRiskSignals()`

**2. Faux positif "Account Executive" = direction**
- Symptôme : `COMMERCE_KEYWORDS` contenait "account executive" → AE scorés 75+ comme direction commerciale
- Fix : `NON_DIRECTION_TITLES` (AE, AM, SDR, BDR, CSM, etc.) vérifié en premier dans `computeRoleFit()`
- Override : `DIRECTION_OVERRIDE_KEYWORDS` (Key Account, Grand Compte, Enterprise, Senior, Strategic, Global) — contournent la pénalité

**3. Faux négatif "Key Account Manager"**
- Symptôme : "Key Account Manager" contient "account manager" → pénalisé comme non-direction
- Fix : `DIRECTION_OVERRIDE_KEYWORDS` vérifiés avant `NON_DIRECTION_TITLES`

### Distribution calibrée (115 offres)

| Niveau | Seuil | Nb | % | Action |
|--------|-------|----|---|--------|
| ⭐ highly_recommended | ≥ 85 | 4 | 3.5% | apply_now |
| ✅ recommended | 75-84 | 18 | 15.7% | apply_now |
| 🔶 possible | 55-74 | 59 | 51.3% | shortlist |
| ⚠️ low_priority | 35-54 | 28 | 24.3% | review_manually |
| ❌ reject | < 35 | 6 | 5.2% | reject |

### Seuils observés

| Cas | Score min | Score max | Comportement |
|-----|-----------|-----------|--------------|
| Directeur Commercial France | 81 | 87 | recommended / highly |
| Key Account Manager France | 85 | 88 | highly_recommended |
| VP Sales / CRO France | 81 | 83 | recommended |
| Account Executive Paris/Dublin | 66 | 69 | possible |
| Account Executive US-only | 30 | 40 | reject / low_priority |
| Customer Success Manager | 68 | 68 | possible |
| Software Engineer | 30 | 35 | reject / low_priority |
| Stage / Alternance | ≤ 30 | ≤ 30 | reject |
| Sans description (titre bon) | 60 | 60 | possible |
| Remote hors EMEA | 0 | 0 | reject |

---

## Risk Caps (plafonnement)

Appliqués après calcul du score :

1. **Stage / alternance / junior → max 30** — incompatible avec profil exécutif
2. **SDR / BDR → max 30** — sous le niveau direction
3. **Rôle technique hors cible → max 35** — software engineer, data scientist, etc.
4. **International incompatible → max 40** — sans compatibilité France/EMEA
5. **Remote hors France/EMEA → reject (score 0)** — strict par défaut
6. **Description < 50 caractères → max 60** — évaluation limitée

---

## Règles de scoring clés

### `computeRoleFit()`
1. Si `NON_DIRECTION_TITLES` match (sans `DIRECTION_OVERRIDE_KEYWORDS`) → dim(25, 0.25, ...)
2. Si titre match titres direction + description contient mots-clés commerce → dim(25, 0.95, ...)
3. Si titre direction seulement → dim(25, 0.82, ...)
4. Si commerce sans direction → dim(25, 0.55, ...)
5. Titre technique → dim(25, 0.15, ...)

### `computeLocationFit()`
1. Même ville → 98-100
2. Même région / mobilité PACA → 88-95
3. France / IDF → 88
4. Europe / EMEA → 75
5. Autre → 30-40

### `computeRisk()`
- Stage/alternance/junior/SDR/BDR → 30-35 points de risque
- Technique hors cible → 20
- International incompatible → 25
- Description pauvre → 15

---

## Signaux

### Positifs
- Titre direction commerciale
- Poste de direction / P&L / Comex
- Management d'équipe
- Stratégie commerciale / GTM
- Développement international / marché français
- Grands comptes / Enterprise
- PACA / IDF / Remote France

### Risques
- Stage / alternance / junior
- SDR / BDR
- Poste technique
- Localisation incompatible (US-only, UK-only, etc.)
- Remote hors France/EMEA
- Description pauvre

### Manquants
- Description détaillée
- Nom de l'entreprise
- Fourchette salariale
- Localisation
- Type de contrat

---

## API des fonctions

```typescript
// Analyse complète
analyzeJobFit(job: JobInput, profile: ProfileInput, options?: SemanticOptions): JobFitAnalysis

// Score (wrapper)
computeSemanticFitScore(input: { overallScore: number }): number

// Explication textuelle
explainJobFit(input: JobFitAnalysis): string[]

// Risques formatés
detectFitRisks(input: JobFitAnalysis): string[]

// Signaux manquants formatés
detectMissingSignals(input: JobFitAnalysis): string[]

// Action recommandée
recommendApplicationAction(input: { overallScore: number }): Action

// Sérialisation pour le stockage DB
serializeAnalysis(a: JobFitAnalysis): object
```

---

## Intégrations

| Module | Fichier | Intégration |
|--------|---------|-------------|
| Quick Score | `lib/jobs/quick-score.ts` | Appel `analyzeJobFit()` après chaque upsert JobScore |
| API Jobs | `app/api/jobs/route.ts` | Filtre `?recommendation=` (highly_recommended, recommended, possible, low_priority) |
| Dashboard | `app/(app)/dashboard/jobs/page.tsx` | 4 nouveaux filtres + badge de reco + semanticScore affiché |
| Détail candidature | `app/(app)/dashboard/jobs/applications/[id]/page.tsx` | Section "Pourquoi cette offre matche" — barres par dimension, signaux, angles |
| Préparateur | `lib/jobs/application-preparer.ts` | Angles injectés dans les prompts CV et lettre de motivation |
| Analytics | `lib/jobs/application-analytics.ts` | `byRecommendation` metrics + `semanticScore ?? globalScore` |

---

## Backfill

### Procédure

```bash
# Dry-run (vérification sans écriture)
npm run jobs:semantic-backfill:dry

# Lancement réel
npm run jobs:semantic-backfill
```

### Comportement

- **Idempotent** — peut être relancé sans risque de corruption
- Lit le profil principal (1er par `createdAt`)
- Parcourt toutes les offres avec un `JobScore`
- Calcule `analyzeJobFit()` puis `update` les 4 champs sémantiques
- Ne modifie **jamais** `globalScore`, `matchScore`, `recommendedAction`
- Log clair : titre, entreprise, score, recommandation, confiance, erreurs éventuelles

### Résultat du backfill V2.6.1

- **115 offres backfillées** en ~2 secondes
- **0 erreur**, **0 skip**
- Tous les enregistrements ont les 4 champs renseignés

---

## Modèle Prisma (4 champs sur JobScore)

```prisma
model JobScore {
  // ... champs existants
  semanticScore        Int?      // Score sémantique 0-100
  semanticConfidence   Int?      // Confiance 0-100
  semanticAnalysisJson String?   // JobFitAnalysis sérialisé
  recommendation       String?   // highly_recommended | recommended | possible | low_priority | reject
}
```

---

## Tests

- **Fichier :** `tests/semantic-matcher.test.ts` — 34 tests
- **Cas positifs (7) :** Directeur Commercial France, Country Manager, Sales Director Europe, Head of Sales, VP Sales EMEA, BD Marseille, score basse description
- **Risk caps (8) :** stage, alternance, junior, SDR, Software Engineer, Fullstack Developer, US-only onsite, remote hors France/EMEA
- **Signaux (4) :** positiveSignals, riskSignals, missingSignals, explainJobFit
- **Recommandations (4) :** apply_now, shortlist, review_manually, reject
- **Edge cases (6) :** titre vide, champs null, confidence > 0, scores 0-100, serializeAnalysis, computeSemanticFitScore
- **Input parsing (4) :** langues EN/FR, anglais requis sans anglais, secteur aligné, salaire dans prétentions

---

## Limites

- Local uniquement — pas d'IA, pas d'embeddings (mais architecture prête)
- Keyword matching FR/EN — sensible aux formulations, pas de compréhension sémantique profonde
- Pas d'apprentissage — les pondérations et caps sont fixes
- Les angles CV/lettre sont génériques — pas de personnalisation IA
- La confiance dépend de la richesse des données du profil et de l'offre

---

## Future extension

- **Embeddings** : Remplacer `countMatches` / `containsAny` par similarité cosinus sur embeddings de texte
- **IA locale** : Remplacer les règles de scoring par un petit modèle fine-tuné
- **Apprentissage** : Pondérations ajustables par feedback utilisateur (accept/reject)
- **Multi-profil** : Adapter `ProfileInput` pour accepter plusieurs profils candidats
- **A/B testing** : Comparer les recommendations sémantiques vs IA vs quick-score

---

## Checklist après modification Prisma

Toute modification de `prisma/schema.prisma` nécessite :

1. `npm run prisma:refresh` — régénère le client
2. `npx prisma db push` — applique les changements
3. Redémarrer le serveur Next.js (`npm run dev:fresh`)
4. `npm run smoke:pipeline-api` — vérifie l'API
5. `npm test` — vérifie qu'aucun test ne casse

> Voir [DEV_RUNTIME_TROUBLESHOOTING.md](DEV_RUNTIME_TROUBLESHOOTING.md) pour le diagnostic Prisma Client stale.
