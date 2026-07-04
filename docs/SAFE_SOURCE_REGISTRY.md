# ELTON OS — Safe Source Registry V2.6.10

**Date :** 2026-06-21 | **Version :** V2.6.10

---

## Objectif

Le Safe Source Registry est le registre permanent des sources publiques autorisées pour l'import automatique via Firecrawl Safe. Il permet de gérer, tester et lancer des imports contrôlés sur des sources approuvées, avec des limites strictes et un audit complet.

---

## Sources autorisées

| Source | Domaine | Mode |
|--------|---------|------|
| Greenhouse (API publique) | `boards.greenhouse.io` | ATS_PUBLIC |
| Lever (API publique) | `jobs.lever.co` | ATS_PUBLIC |
| Ashby (API publique) | `jobs.ashbyhq.com` | ATS_PUBLIC |
| Workable (API publique) | `apply.workable.com` | ATS_PUBLIC |
| SmartRecruiters (API publique) | `jobs.smartrecruiters.com` | ATS_PUBLIC |
| Teamtailor (API publique) | `*.teamtailor.com` | ATS_PUBLIC |
| Recruitee (API publique) | `*.recruitee.com` | ATS_PUBLIC |
| Pages carrières publiques | `*.com/careers`, `*.com/jobs` | AUTO_PUBLIC_CAREERS |
| JSON-LD public | Toute page avec `JobPosting` | AUTO_JSONLD |

**Règle :** toute page accessible sans login, sans CAPTCHA, sur un domaine non bloqué.

---

## Sources refusées (jamais dans le registre)

| Source | Raison |
|--------|--------|
| **LinkedIn** | Plateforme fermée — `refused_closed_platform` |
| **Indeed** | Plateforme fermée — `refused_closed_platform` |
| **APEC** | Plateforme fermée — `refused_closed_platform` |
| Monster, Cadremploi, etc. | Domaines bloqués — `refused_blocked_domain` ou `refused_closed_platform` |
| Pages login/auth | Authentification requise — `refused_login_required` |
| Pages CAPTCHA | Protection anti-bot — `refused_captcha` |
| URLs avec bypass keywords | Tentative de contournement — `refused_bypass_attempt` |

---

## Cycle de vie d'une source

1. **Création** : URL soumise → `classifyFirecrawlEligibility()` → refusée si non conforme → stockée avec `importMode`, `normalizedDomain`, limites
2. **Test (preview)** : `runSafeJobSource(id, {action:"preview"})` → extraction sans écriture DB → retourne les offres et avertissements
3. **Import contrôlé** : `runSafeJobSource(id, {action:"import"})` → extraction → normalisation → filtrage qualité → dédup → RawJob → Job → JobScore → semantic matching → audit → mise à jour stats
4. **Désactivation** : `enabled = false` → la source est conservée mais les runs la sautent
5. **Suppression** : retrait définitif du registre

Chaque opération de création, mise à jour et run **reclassifie l'URL**. Une source ne peut jamais être ajoutée ou exécutée avec une URL qui deviendrait refusée.

---

## Run contrôlé

### Paramètres

| Paramètre | Défaut | Description |
|-----------|--------|-------------|
| `maxPagesPerRun` | 1 | Pages Firecrawl par run (limite la profondeur) |
| `maxJobsPerRun` | 20 | Offres max importées par run |
| `SAFE_SOURCES_MAX_PER_RUN` (env) | 5 | Sources max par run groupé |
| `SAFE_SOURCES_MAX_JOBS_PER_SOURCE` (env) | 20 | Plafond offres par source en run groupé |

### Flux

```
SafeJobSource (DB)
  → classifyFirecrawlEligibility(url) [pur, reclassifié]
  → checkFirecrawlConfig() [FIRECRAWL_ENABLED=true, clé présente]
  → scrapeAllowedPageWithFirecrawl(url, maxPages)
  → extractJobsFromMarkdown(markdown, url)
  → normalizeFirecrawlJobs(rawJobs, context)
  → validateJob() [titre obligatoire, warnings qualité]
  → maxJobsPerRun [limite stricte]
  → ImportSource "Firecrawl Safe" [find-or-create]
  → RawJob → checkDuplicate → Job → scoreJobLocal → JobScore
  → analyzeJobFit(jobInput, profileInput) [semantic matcher]
  → JobSearchRun [audit logsJson]
  → SafeJobSource.lastRunAt/lastStatus/lastJobsFound/lastJobsImported [update]
```

---

## Limites strictes

- **Pas de crawl profond** : `maxPagesPerRun` limite la pagination
- **Pas de import non borné** : `maxJobsPerRun` plafonne chaque run
- **Pas de cron automatique** : lancement manuel ou via route protégée uniquement
- **Pas de source refusée** : reclassification à chaque opération
- **Pas de stockage de secrets** : jamais de clé API dans l'audit ou les logs

---

## Audit

Chaque run crée un `JobSearchRun` avec `logsJson` contenant :

```json
{
  "safeSourceId": "uuid",
  "safeSourceLabel": "Stripe Greenhouse",
  "sourceUrl": "https://boards.greenhouse.io/stripe",
  "normalizedDomain": "boards.greenhouse.io",
  "scannerDecision": "ATS_PUBLIC",
  "connector": "firecrawl-safe",
  "complianceStatus": "allowed",
  "reasonCode": "allowed_public_ats",
  "jobsFound": 20,
  "jobsImported": 18,
  "duplicates": 2,
  "skipped": 0,
  "invalid": 0,
  "durationMs": 2500,
  "semanticScoredCount": 18,
  "errors": [],
  "timestamp": "2026-06-21T12:00:00.000Z"
}
```

L'audit est visible dans `/dashboard/jobs/sources` en cliquant sur "Voir l'audit" après un run.

---

## Sécurité

- **checkAuth()** sur toutes les routes API (x-api-token en production)
- **Reclassification obligatoire** à la création, mise à jour et chaque run
- **Clé Firecrawl jamais exposée** : ni dans les réponses API, ni dans l'audit, ni dans les logs
- **Pas de bypass** : les mots-clés proxy/CAPTCHA/headless sont détectés et refusés
- **Pas d'automatisation LinkedIn/Indeed/APEC** : refusées à la classification

---

## Cron futur

Un cron pourra être activé via :

```
POST /api/jobs/safe-sources/run
Header: x-api-token: <SOURCING_CRON_TOKEN>
Body: { action: "import" }
```

Variables d'environnement :
```bash
SAFE_SOURCES_MAX_PER_RUN=5
SAFE_SOURCES_MAX_JOBS_PER_SOURCE=20
```

Aucun cron automatique n'est activé par défaut.

---

## Lien avec Firecrawl Safe

Le Safe Source Registry utilise le connecteur Firecrawl Safe (V2.6.2-V2.6.4) pour :
- La classification (`classifyFirecrawlEligibility`)
- La vérification de configuration (`checkFirecrawlConfig`)
- L'extraction (`scrapeAllowedPageWithFirecrawl`, `extractJobsFromMarkdown`, `normalizeFirecrawlJobs`)

La différence avec un import one-shot :
- **Firecrawl Safe (one-shot)** : URL collée manuellement → preview → sélection → import
- **Safe Source Registry** : source enregistrée une fois → testable/lançable en un clic → stats et audit persistants

---

## Lien avec le semantic matcher

Après import depuis une Safe Source :
- `scoreJobLocal()` calcule le score initial (executive, match, location, salary, freshness, company, risk)
- `analyzeJobFit()` calcule le score sémantique (8 dimensions : roleFit, seniorityFit, locationFit, sectorFit, languageFit, compensationFit, companyFit, applicationReadiness)
- `serializeAnalysis()` stocke le résultat dans `JobScore.semanticAnalysisJson`
- `recommendation` est calculé (highly_recommended, recommended, possible, low_priority, reject)
- Le dashboard affiche "Pourquoi cette offre matche" pour chaque offre importée

---

## Pourquoi LinkedIn / Indeed / APEC restent Import Assisté

Ces plateformes :
- Nécessitent une session utilisateur authentifiée
- Protègent leurs données par des mesures anti-bot
- Ont des CGU qui interdisent le scraping automatisé
- Sont classifiées `USER_ASSISTED` ou `BLOCKED` → refusées à la création et au run

**Alternative :** l'extension Chrome Import Assisté permet d'importer manuellement les offres consultées.

---

## Go-live contrôlé (V2.6.6)

Le Safe Source Registry passe en mode go-live avec les ajouts suivants :

### Seed des sources

Un script `npm run seed:safe-sources` crée un starter pack de 15 sources publiques vérifiées :
- 5 Greenhouse (Stripe, Airbnb, Notion, Figma, Datadog)
- 2 Lever (Spotify, Netflix)
- 2 Ashby (Linear, Vercel)
- 1 Workable (Deel)
- 5 pages carrières (Schneider Electric, L'Oréal, Sanofi, Legrand, Accor)

Toutes les sources sont créées **désactivées par défaut** (`enabled: false`). L'activation est manuelle après test. Le seed est idempotent (upsert sur composite key `normalizedDomain + url`).

Voir [SAFE_SOURCE_STARTER_PACK.md](SAFE_SOURCE_STARTER_PACK.md).

### Dashboard enrichi

- **Compteurs** en barre de résumé : total, activées, désactivées, succès, erreurs
- **Filtres** par statut : Toutes, Activées, Désactivées, Succès, Erreur
- **Sélection multiple** : checkboxes + "Tester (N)" / "Importer (N)" sur la sélection
- **Badge erreurs consécutives** : ≥3 erreurs affiche "Erreurs répétées — désactiver ?"
- **Onglet Rapport quotidien** : stats, top 10 offres avec scores sémantiques, sources en erreur, refus par motif
- **Confirmation** avant lancement groupé (nombre de sources, limite max)

### Politique de run contrôlé

- **consecutiveErrors** : compteur dans SafeJobSource, incrémenté à chaque échec (scrape timeout, reclassification refusée), remis à 0 en cas de succès
- **Seuil** : `ConsecutiveErrorThreshold = 3` — une source avec ≥3 erreurs consécutives est automatiquement ignorée par `runAllEnabledSafeSources()`
- Les runs individuels restent possibles pour débloquer une source après correction

### Rapport quotidien

- **Endpoint** : `GET /api/jobs/safe-sources/report` — retourne le rapport des 24 dernières heures
- **Contenu** : stats agrégées (offres trouvées, importées, doublons, anomalies, scores sémantiques), top 10 offres par score sémantique, sources en erreur avec consecutiveErrors, refus par reasonCode
- **Pas de données Firecrawl** : le rapport est purement une requête DB, sans appel réseau
- **Intégré au dashboard** : onglet "Rapport quotidien" dans /dashboard/jobs/sources

### Cron (désactivé par défaut)

- **Endpoint** : `POST /api/jobs/safe-sources/cron`
- **Gating** : `SAFE_SOURCES_CRON_ENABLED` (env var, défaut `false`)
- **Auth** : `x-api-token` header requis en production
- Si désactivé : retourne 403 avec message explicite
- Si activé : run groupé + rapport quotidien dans la réponse

### Quality gates

- `consecutiveErrors` ≥ 3 → source ignorée en run groupé
- Reclassification à chaque opération (création, update, run)
- Pas d'API key dans les réponses API, l'audit ou les logs
- Run groupé borné par `SAFE_SOURCES_MAX_PER_RUN` et `SAFE_SOURCES_MAX_JOBS_PER_SOURCE`

## Endpoints API

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/jobs/safe-sources` | Liste toutes les sources |
| `POST` | `/api/jobs/safe-sources` | Crée une source (reclassifie) |
| `GET` | `/api/jobs/safe-sources/[id]` | Détail d'une source |
| `PUT` | `/api/jobs/safe-sources/[id]` | Met à jour une source (reclassifie si URL changée) |
| `DELETE` | `/api/jobs/safe-sources/[id]` | Supprime une source |
| `POST` | `/api/jobs/safe-sources/[id]/run` | Lance un run (preview ou import) |
| `POST` | `/api/jobs/safe-sources/run` | Lance toutes les sources activées |
| `GET` | `/api/jobs/safe-sources/report` | Rapport quotidien Safe Sources |
| `POST` | `/api/jobs/safe-sources/cron` | Cron (désactivé par défaut, SAFE_SOURCES_CRON_ENABLED) |
| `GET` | `/api/jobs/safe-sources/status` | Statut config (kill switch, Firecrawl, limites) |

---

## Dashboard

- **Page :** `/dashboard/jobs/sources`
- **Accès depuis :** Source Scanner, Firecrawl Safe (import unique)
- **Fonctions :** liste, création avec preview de conformité, test, import, désactivation, suppression, audit, statut configuration, rapport quotidien, filtres, sélection multiple

---

## Extraction Quality Hardening (V2.6.9)

### Company inference

`inferCompanyNameFromSource()` remplace le simple `split(" — ")`. Stratégie multi-niveaux :

1. Conserver `job.company` explicite si présent
2. Extraire depuis `source.label` via séparateurs ` — `, ` - `, ` | `
3. Inférer depuis `atsVendor` si non-standard
4. Inférer depuis le domaine normalisé
5. Retourner `undefined` si rien n'est inférable

### Noise filter

`isLikelyJobTitle()` bloque 24 patterns de chrome UI (case-insensitive) :
- Navigation : `All Jobs`, `Showing X results`, `Search`, `Filter(s)`
- Filtres : `Department(s)`, `Location(s)`, `Team(s)`, `Office(s)`
- UI : `Sort by`, `Newest`, `Relevance`, `Page N`, `Next`, `Previous`, `Reset`

Les vrais titres longs (> 30 chars sans pattern match) sont toujours conservés.

### Extraction quality scoring

`computeExtractionQuality()` calcule :
- `qualityStatus` : `clean` (< 20% invalide/bruit), `warning` (20-50%), `poor` (> 50%)
- `shouldDisableSource` : `true` si `poor` ET 0 job valide

### Import guard

Si qualité `poor` avec 0 job valide :
- Import bloqué avec `reasonCode: refused_poor_extraction_quality`
- `consecutiveErrors` incrémenté
- Aucune écriture DB (RawJob/Job/JobScore)
- Audit inclut `extractionQuality` avec titres suspects

---

## Tests

- `tests/safe-job-sources.test.ts` — 28 tests : classification création, update, restrictions run, audit sécurité, kill switch
- `tests/safe-source-runner.test.ts` — 57 tests (+0 V2.6.10) : preview, import, limites, dédup, erreurs, semantic scoring, refus, kill switch, cost guard, quality gates, company inference, noise filter, extraction quality
- `tests/safe-source-report.test.ts` — 14 tests : rapport vide, comptage, top importés, sources en erreur, sécurité clé API, cron désactivé, auth cron, kill switch, quality gates
- `tests/ingestion-router.test.ts` — 38 tests (NEW V2.6.10) : stratégies, ATS native routing, JSON-LD routing, Firecrawl fallback, BLOCKED/USER_ASSISTED, company extraction, explainStrategyDecision

Tous les tests sont unitaires : pas d'appel réseau Firecrawl, Prisma mocké.

---

## Smart Ingestion Router (V2.6.10)

### Routage natif prioritaire

`chooseIngestionStrategy()` sélectionne la meilleure stratégie d'extraction pour chaque source :

- **API native ATS** (priorité 2) : Greenhouse, Lever, Ashby, SmartRecruiters — APIs JSON publiques, extraction structurée garantie
- **JSON-LD natif** (priorité 4) : extraction depuis le HTML sans Firecrawl
- **Firecrawl Safe** (priorité 5) : fallback universel pour les pages sans API native
- **USER_ASSISTED** (priorité 8) : plateformes nécessitant une action utilisateur
- **BLOCKED** (priorité 10) : domaines bloqués, aucun import automatique

### Fallback automatique

Si la stratégie native échoue (0 résultat, timeout) → fallback automatique vers Firecrawl Safe. Le fallback est tracé dans l'audit.

### Impact

- Les sources Greenhouse, Lever, Ashby ne consomment plus de requêtes Firecrawl
- Extraction plus fiable (JSON structuré vs parsing Markdown)
- Company name inclus nativement (plus besoin d'inférence pour ces sources)

Voir [INGESTION_ROUTER.md](INGESTION_ROUTER.md) pour la documentation complète.

## Import Assisté Pro (V2.7)

L'Import Assisté Pro V2.7 rend les plateformes `USER_ASSISTED` (LinkedIn, Indeed, APEC) utilisables via une extension Chrome :

- Extraction DOM visible uniquement (pas de cookies, pas de sessions)
- Détection login/CAPTCHA avant extraction
- Mode offre unique + mode liste visible (max 10 cartes, pas d'auto-scroll)
- Envoi vers ELTON OS avec validation utilisateur
- Pipeline complet : RawJob → Job → JobScore → Semantic Matcher
- Audit avec `extractionMethod: "USER_ASSISTED_EXTENSION"`

### Extension

- Manifest V3, version 2.7.0
- Permissions : activeTab, scripting, storage
- Host permissions : 12 domaines (LinkedIn, Indeed, APEC, Greenhouse, Lever, etc.)

### Tests

- `tests/assisted-import.test.ts` — 36 tests : preview/import API, closed platform refusal, pipeline complet, dédoublonnage, audit
- `tests/extension-import-extractors.test.ts` — 44 tests : platform detection, extraction LinkedIn/Indeed/APEC, job cards, confidence scoring, login/CAPTCHA detection, validation
- `tests/ingestion-router.test.ts` — 38 tests (USER_ASSISTED routing inclus)

Voir [ASSISTED_IMPORT_EXTENSION.md](ASSISTED_IMPORT_EXTENSION.md) pour la documentation complète.
