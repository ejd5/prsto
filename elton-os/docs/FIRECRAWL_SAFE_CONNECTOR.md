# ELTON OS V2.6.10 — Firecrawl Safe Connector

**Date :** 2026-06-21 | **Version :** V2.6.10

---

## Objectif

Fournir une couche d'extraction propre pour les pages publiques autorisées, via l'API Firecrawl. Ce connecteur **n'est pas un scraper** — il extrait uniquement le contenu visible publiquement sur des sources explicitement autorisées.

---

## Sources autorisées

| Source | Domaine | Mode |
|--------|---------|------|
| Greenhouse (API publique) | `boards.greenhouse.io` | ATS_PUBLIC |
| Lever (API publique) | `jobs.lever.co` | ATS_PUBLIC |
| Ashby (API publique) | `jobs.ashbyhq.com` | ATS_PUBLIC |
| Workable (API publique) | `apply.workable.com` | ATS_PUBLIC |
| SmartRecruiters (API publique) | `jobs.smartrecruiters.com` | ATS_PUBLIC |
| Pages carrières publiques | `*.com/careers`, `*.com/jobs`, etc. | AUTO_PUBLIC_CAREERS |
| JSON-LD public | Toute page avec `JobPosting` JSON-LD | AUTO_JSONLD |

**Règle générale :** toute page accessible sans login, sans CAPTCHA, sur un domaine non bloqué, est éligible.

---

## Sources refusées

| Source | Raison |
|--------|--------|
| **LinkedIn** | Plateforme fermée — `refused_closed_platform` |
| **Indeed** | Plateforme fermée — `refused_closed_platform` |
| **APEC** | Plateforme fermée — `refused_closed_platform` |
| Pages de login | Authentification requise — `refused_login_required` |
| Pages auth/signin | Authentification requise — `refused_login_required` |
| Pages CAPTCHA | Protection anti-bot — `refused_captcha` |
| Cloudflare/DataDome | Protection anti-bot — `refused_captcha` |
| Domaines bloqués | Liste de blocage — `refused_blocked_domain` |
| Sources USER_ASSISTED | Action utilisateur requise — `refused_closed_platform` |

---

## Pourquoi LinkedIn / Indeed / APEC ne sont pas automatisés

Ces plateformes :
- Nécessitent une session utilisateur authentifiée
- Protègent leurs données par des mesures anti-bot (Cloudflare, DataDome)
- Ont des CGU qui interdisent le scraping automatisé
- Exigent une interaction humaine pour consulter les offres

**Alternative :** l'extension Chrome Import Assisté permet à l'utilisateur d'importer manuellement les offres qu'il consulte déjà.

---

## Différence entre Firecrawl Safe et bypass

| Firecrawl Safe | Bypass |
|----------------|--------|
| Pages publiques uniquement | Pages protégées |
| Sans contournement | Proxy / CAPTCHA solving |
| Respecte les CGU | Ignore les protections |
| Audit complet | Opération opaque |
| Conforme RGPD | Risque juridique |

Ce connecteur **ne fait jamais** :
- De bypass de login
- De CAPTCHA solving
- De proxy evasion
- De scraping derrière authentification
- De modification des headers pour contourner les blocks
- D'auto-apply
- De stockage de cookies, sessions ou tokens

---

## Variables d'environnement

```bash
# Firecrawl Safe Connector
FIRECRAWL_API_KEY=fc-...
FIRECRAWL_ENABLED=false          # true pour activer
FIRECRAWL_MAX_PAGES_PER_RUN=10   # max pages par run
FIRECRAWL_TIMEOUT_MS=30000       # timeout en ms
```

La clé API n'est **jamais exposée côté client**.

---

## API des fonctions

```typescript
// Vérification config
checkFirecrawlConfig(): ComplianceResult | null

// Éligibilité source (fonction pure, sans check env)
classifyFirecrawlEligibility(url, importMode, html): ComplianceResult

// Éligibilité + config
canUseFirecrawlForSource(input): boolean

// Extraction (vérifie config + éligibilité avant d'appeler Firecrawl)
scrapeAllowedPageWithFirecrawl(url, options): Promise<{ markdown, sourceUrl, durationMs }>

// Extraction Markdown → ImportedJob[]
extractJobsFromMarkdown(markdown, sourceUrl): ImportedJob[]

// Normalisation
normalizeFirecrawlJobs(rawJobs, context): ImportedJob[]

// Audit
createFirecrawlAuditLog(event): FirecrawlAuditEntry
```

---

## Source Scanner Integration

Le Source Scanner (`source-capability-scanner.ts`) a été étendu avec de nouveaux modes :

| Mode | Description |
|------|-------------|
| `API_OFFICIAL` | API gouvernementale (France Travail) |
| `ATS_PUBLIC` | ATS avec API publique (Greenhouse, Lever, etc.) |
| `AUTO_JSONLD` | Page avec JSON-LD JobPosting |
| `AUTO_PUBLIC_CAREERS` | Page carrière publique éligible Firecrawl |
| `AUTO_FIRECRAWL_SAFE` | Extraction Firecrawl explicite |
| `USER_ASSISTED` | Plateforme nécessitant action utilisateur |
| `BLOCKED` | Domaine explicitement bloqué |

Les modes existants (`AUTO_API`, `AUTO_ATS`, `AUTO_RSS`, `MANUAL_ONLY`) restent inchangés pour la rétrocompatibilité.

---

## Reason codes

| Code | Statut | Signification |
|------|--------|---------------|
| `allowed_public_ats` | allowed | ATS public autorisé |
| `allowed_public_careers` | allowed | Page carrière publique autorisée |
| `allowed_jsonld` | allowed | JSON-LD public autorisé |
| `refused_closed_platform` | refused | Plateforme fermée (LinkedIn, Indeed, APEC) |
| `refused_login_required` | refused | Page de connexion détectée |
| `refused_captcha` | refused | Protection CAPTCHA détectée |
| `refused_blocked_domain` | refused | Domaine sur liste de blocage |
| `refused_user_assisted_source` | refused | Source nécessitant action utilisateur |
| `refused_bypass_attempt` | refused | Tentative de contournement détectée |
| `refused_missing_api_key` | refused | Clé API absente ou Firecrawl désactivé |
| `error_firecrawl_rate_limit` | error | Rate limit Firecrawl atteint |
| `error_firecrawl_timeout` | error | Timeout Firecrawl |
| `error_parse_failed` | error | Échec du parsing Markdown → jobs |

---

## Audit logs

Chaque tentative d'extraction produit un `FirecrawlAuditEntry` avec :
- Timestamp, source URL, domaine normalisé
- Décision du scanner, connecteur, méthode d'extraction
- Statut, reason code, nombre de jobs extraits
- Durée, erreurs éventuelles

Ces logs sont sérialisables dans `JobSearchRun.logsJson`.

---

## Connexion au semantic matcher

Après import via Firecrawl Safe :
- Les offres passent par le flux standard : RawJob → dédup → Job → JobScore
- `quick-score.ts` calcule automatiquement le semanticScore
- La politique internationale (`location-priority.ts`) est appliquée
- Aucun chemin ne bypass le semantic matcher ou la politique internationale

---

## Tests

- **Fichier :** `tests/firecrawl-safe.test.ts` — 90 tests
- **Classification (23) :** 9 autorisés + 14 refusés
- **Source scanner helpers (21) :** login, captcha, bypass, eligibility, compatibility, classifyImportMode
- **Extraction Markdown (7) :** parsing, déterministe, nettoyage
- **Normalisation (4) :** URLs relatives/absolues, troncature, source
- **Audit logs (5) :** allowed, refused, error, champs requis
- **Dedup (3) :** même input → même externalId, domaines différents → ids différents
- **Config (2) :** sans clé API, canUseFirecrawlForSource
- **Reason codes (2) :** exhaustivité des 13 codes

---

## Limites

- Dépend de l'API Firecrawl (tierce partie)
- Limité aux pages publiques sans protection anti-bot
- Le parsing Markdown → ImportedJob est basique (améliorable avec IA)
- Pas de pagination automatique (FIRECRAWL_MAX_PAGES_PER_RUN)
- Pas de re-scraping automatique (rafraîchissement manuel)

---

## API Endpoints (V2.6.3)

### `POST /api/jobs/firecrawl-safe/preview`

Analyse une URL et retourne les offres détectées en preview. **Ne crée aucune offre en base.**

**Input :**
```json
{
  "url": "https://boards.greenhouse.io/stripe",
  "sourceId": "optional",
  "maxPages": 1
}
```

**Output allowed :**
```json
{
  "success": true,
  "mode": "AUTO_FIRECRAWL_SAFE",
  "complianceStatus": "allowed",
  "reasonCode": "allowed_public_ats",
  "audit": { "timestamp": "...", "normalizedDomain": "...", "status": "allowed", ... },
  "jobs": [ { "title": "...", "company": "...", "location": "...", ... } ]
}
```

**Output refused :**
```json
{
  "success": false,
  "complianceStatus": "refused",
  "reasonCode": "refused_closed_platform",
  "message": "Cette source nécessite un import assisté.",
  "suggestedMode": "USER_ASSISTED"
}
```

### `POST /api/jobs/firecrawl-safe/import`

Importe les offres sélectionnées dans le pipeline ELTON OS.

**Input :**
```json
{
  "url": "https://boards.greenhouse.io/stripe",
  "selectedJobs": [ { "title": "...", "company": "...", ... } ],
  "auditRef": "..."
}
```

**Output :**
```json
{
  "success": true,
  "imported": 3,
  "duplicates": 1,
  "skipped": 0,
  "jobIds": ["id1", "id2", "id3"]
}
```

### Flux d'import

1. `preview` → classifie l'URL, scrape si allowed, extrait les offres
2. L'utilisateur sélectionne les offres à importer
3. `import` → re-valide l'éligibilité, crée RawJob → dédup → Job → JobScore → semanticScore
4. Les offres apparaissent dans le dashboard avec leur score

### Règles de sécurité

- **Preview** : lecture seule, jamais d'écriture en base
- **Import** : re-valide l'éligibilité avant chaque import
- **Auth** : token `x-api-token` requis en production
- **Clé API** : jamais exposée côté client, jamais loggée dans les erreurs
- **Validation utilisateur** : obligatoire (checkbox) avant tout import

### Erreurs de configuration

| Condition | reasonCode |
|-----------|------------|
| `FIRECRAWL_ENABLED=false` | `refused_missing_api_key` |
| `FIRECRAWL_API_KEY` absente | `refused_missing_api_key` |
| Timeout Firecrawl | `error_firecrawl_timeout` |
| Rate limit Firecrawl | `error_firecrawl_rate_limit` |
| Échec parsing Markdown | `error_parse_failed` |

### Intégration Semantic Matcher

Après import confirmé :
- `scoreJobLocal()` calcule le score initial (executiveScore, matchScore, locationScore, globalScore)
- `analyzeJobFit()` calcule le score sémantique (8 dimensions)
- Les champs `semanticScore`, `semanticConfidence`, `semanticAnalysisJson`, `recommendation` sont mis à jour
- Aucun bypass du semantic matcher n'est possible

### Différence Preview vs Import

| Preview | Import |
|---------|--------|
| Lecture seule | Écriture en base |
| Retourne les offres brutes | Crée RawJob → Job → JobScore |
| Pas de dédup | Dédup complète |
| Pas de scoring | Score local + sémantique |
| Audit de classification | Audit + IDs des jobs créés |

### UI

- **Page :** `/dashboard/jobs/importer/firecrawl-safe`
- **Source Scanner :** `/dashboard/jobs/source-scanner` — badges pour API_OFFICIAL, ATS_PUBLIC, AUTO_PUBLIC_CAREERS, AUTO_FIRECRAWL_SAFE
- **Audit visible** : journal de conformité affiché dans la preview (sourceUrl, domaine, décision scanner, connecteur, statut, reasonCode, durée, offres extraites)

### Tests (V2.6.4)

- **Fichier :** `tests/firecrawl-safe-api.test.ts` — 60 tests
- **Preview (25+) :** Greenhouse/Lever/careers/JSONLD allowed, LinkedIn (4 variants)/Indeed (4)/APEC (3)/login (5)/CAPTCHA (2)/bypass (5)/BLOCKED refused
- **Extraction + Qualité (5) :** Markdown sections, empty input, externalId déterministe, normalization, quality checks
- **Quality (2) :** low confidence, missing fields
- **Audit (5) :** allowed/refused/error entries, JSON serialization, no API key
- **Config (4) :** disabled env, pure function, API key not leaked, status endpoint shape
- **Import validation (2) :** empty selectedJobs, re-validation consistency
- **Dedup (3) :** same input → same ID, different domains → different IDs, source field

### V2.6.4 — Améliorations

- **Status endpoint :** `GET /api/jobs/firecrawl-safe/status` — retourne enabled/configured/maxPagesPerRun sans exposer la clé
- **Qualité extraction :** validation titre, entreprise, description, localisation avec warnings
- **Refus renforcés :** 22 URLs testées (LinkedIn/Indeed/APEC/login/CAPTCHA/bypass), zéro appel Firecrawl
- **UX hardening :** notice "Preview only", badges qualité, warnings import, lien extension Chrome
- **Smoke script :** `npm run smoke:firecrawl-safe` — skip propre si non configuré
- **QA terrain :** voir [FIRECRAWL_SAFE_TERRAIN_QA_REPORT.md](FIRECRAWL_SAFE_TERRAIN_QA_REPORT.md) pour les résultats sur sources réelles

### Erreurs fréquentes

| Erreur | Cause | Solution |
|--------|-------|----------|
| `refused_missing_api_key` | `FIRECRAWL_ENABLED=false` ou clé absente | Configurer `.env` |
| `refused_closed_platform` | URL LinkedIn/Indeed/APEC | Utiliser l'extension Chrome |
| `refused_login_required` | Page avec login/auth | Utiliser l'extension Chrome |
| `refused_captcha` | Protection anti-bot | Utiliser l'extension Chrome |
| `error_firecrawl_timeout` | Page lente ou inaccessible | Vérifier l'URL, réessayer |
| `error_firecrawl_rate_limit` | Trop de requêtes | Attendre quelques minutes |

### Règles qualité extraction

- Titre absent → **skippé** (non importé)
- Entreprise absente → **warning**, importé avec avertissement
- Description < 50 chars → **low_confidence**, score réduit
- Description < 200 chars → **short_description**
- Localisation absente → **warning**
- _quality affiché dans la preview pour chaque offre

### Limites connues

- Le parsing Markdown → titre est basique (premier heading) — certaines pages ont des formats non standards
- La description est tronquée à 5000 caractères
- L'audit est en mémoire (non persisté en base) — sera persisté dans une version future
- Pas de pagination automatique
- Pas de re-scraping automatique

### Safe Source Registry (V2.6.5)

Le [Safe Source Registry](SAFE_SOURCE_REGISTRY.md) permet de gérer un registre permanent de sources autorisées :

- **Enregistrement** : ajoutez une source une fois, elle reste disponible
- **Test** : preview sans écriture DB pour vérifier les offres détectées
- **Import contrôlé** : lancez l'import en un clic avec limites strictes
- **Audit** : chaque run produit un `JobSearchRun` avec logs complets
- **Dashboard** : `/dashboard/jobs/sources`

La différence avec l'import one-shot Firecrawl Safe :
- **One-shot** : URL collée manuellement → preview → sélection checkbox → import
- **Registre** : source persistante → test/run en un clic → stats et historique

### V2.6.9 — Extraction Quality Hardening

#### Company inference

Les boards ATS (Greenhouse, Lever, etc.) n'ont pas de label "Company:" par offre. Le helper `inferCompanyNameFromSource()` applique une stratégie multi-niveaux :

1. Conserver le `company` explicite du job s'il existe
2. Extraire depuis `source.label` avec séparateurs ` — `, ` - `, ` | `
3. Inférer depuis `atsVendor` si non-standard
4. Inférer depuis le domaine (ex: `boards.greenhouse.io/stripe` → `Stripe`)
5. Retourner `undefined` → laisser `validateJob()` décider

#### Noise filter

Les pages ATS peuvent contenir du "chrome UI" dans le Markdown (navigation, filtres, pagination). `isLikelyJobTitle()` bloque 24 patterns insensibles à la casse :

- `All Jobs`, `Showing X results`, `Search`, `Filter(s)`, `Department(s)`, `Location(s)`, `Team(s)`
- `Remote` (seul), `On-site` (seul), `Hybrid` (seul)
- `Sort by`, `Relevance`, `Newest`, `Page N`, `Next`, `Previous`, `Reset`, `Clear filters`
- `View all jobs`, `No jobs found`, `Loading`, `Apply`, `Open positions`

**Règle :** les titres > 30 caractères qui ne matchent aucun pattern sont toujours conservés. Les titres vides/trop courts passent à `validateJob()`.

#### Extraction quality scoring

`computeExtractionQuality()` produit un score :

| Métrique | Calcul |
|----------|--------|
| `validJobs` | rawCount - noiseSkipped - invalidCount |
| `invalidRatio` | invalidCount / (rawCount - noiseSkipped) |
| `noiseRatio` | noiseSkipped / rawCount |
| `qualityStatus` | `clean` (< 20% invalid/noise), `warning` (20-50%), `poor` (> 50%) |
| `shouldDisableSource` | `true` si `poor` ET 0 valid job |

#### Import guard

Si `shouldDisableSource` est `true` ou si 0 job valide avec du bruit :
- L'import est bloqué avec `reasonCode: refused_poor_extraction_quality`
- `consecutiveErrors` est incrémenté
- Aucun `RawJob` / `Job` n'est créé
- L'audit inclut `extractionQuality` avec les titres suspects

#### Nouveaux Reason Codes

| Code | Signification |
|------|---------------|
| `refused_poor_extraction_quality` | Extraction majoritairement du bruit (> 50% ou 0 job valide) |

Voir [SAFE_SOURCE_REGISTRY.md](SAFE_SOURCE_REGISTRY.md) pour la documentation complète.

### V2.6.10 — Smart Ingestion Router

Le Smart Ingestion Router priorise les APIs natives ATS avant Firecrawl :

- **Greenhouse, Lever, Ashby, SmartRecruiters** : appel direct à l'API JSON publique (plus de requête Firecrawl)
- **JSON-LD natif** : extraction depuis le HTML sans Firecrawl
- **Firecrawl Safe** : fallback quand aucune API native n'est disponible, ou quand la native échoue
- **Workable, Teamtailor, Recruitee** : pas de connecteur natif → Firecrawl Safe

Le routage est transparent pour le runner : les jobs passent par le même pipeline post-extraction (noise filter, quality gates, company inference, import).

Voir [INGESTION_ROUTER.md](INGESTION_ROUTER.md) pour la documentation complète.

### V2.7 — Import Assisté Pro

Firecrawl Safe **ne doit jamais être utilisé** sur les plateformes fermées : LinkedIn, Indeed, APEC, Cadremploi, Monster.

L'Import Assisté Pro V2.7 remplace le besoin de Firecrawl sur ces plateformes : l'utilisateur extrait les offres via l'extension Chrome et les envoie à ELTON OS pour import. Le serveur refuse toute tentative de fetch ou Firecrawl vers ces domaines.

Voir [ASSISTED_IMPORT_EXTENSION.md](ASSISTED_IMPORT_EXTENSION.md) pour la documentation complète.
