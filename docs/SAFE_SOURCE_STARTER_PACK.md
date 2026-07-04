# ELTON OS — Safe Source Starter Pack V2.6.7

**Date :** 2026-06-21 | **Version :** V2.6.7

---

## Objectif

Le Starter Pack fournit une première liste de sources publiques vérifiées, prêtes à être activées manuellement après test. Ces sources couvrent les principaux ATS publics (Greenhouse, Lever, Ashby, Workable) et les pages carrières de grands groupes français internationaux.

Toutes les sources sont créées **désactivées par défaut** (`enabled: false`). L'utilisateur doit :

1. Tester chaque source (preview)
2. Vérifier les offres retournées
3. Activer manuellement la source si satisfaisant

---

## Sources incluses

### ATS Publics — Greenhouse

| Label | URL | Offres max | Pages max |
|-------|-----|-----------|-----------|
| Stripe — Greenhouse | `https://boards.greenhouse.io/stripe` | 20 | 1 |
| Airbnb — Greenhouse | `https://boards.greenhouse.io/airbnb` | 20 | 1 |
| Notion — Greenhouse | `https://boards.greenhouse.io/notion` | 20 | 1 |
| Figma — Greenhouse | `https://boards.greenhouse.io/figma` | 20 | 1 |
| Datadog — Greenhouse | `https://boards.greenhouse.io/datadog` | 20 | 1 |

### ATS Publics — Lever

| Label | URL | Offres max | Pages max |
|-------|-----|-----------|-----------|
| Spotify — Lever | `https://jobs.lever.co/spotify` | 20 | 1 |
| Netflix — Lever | `https://jobs.lever.co/netflix` | 20 | 1 |

### ATS Publics — Ashby

| Label | URL | Offres max | Pages max |
|-------|-----|-----------|-----------|
| Linear — Ashby | `https://jobs.ashbyhq.com/linear` | 20 | 1 |
| Vercel — Ashby | `https://jobs.ashbyhq.com/vercel` | 20 | 1 |

### ATS Publics — Workable

| Label | URL | Offres max | Pages max |
|-------|-----|-----------|-----------|
| Deel — Workable | `https://apply.workable.com/deel` | 20 | 1 |

### Pages carrières publiques

| Label | URL | Offres max | Pages max |
|-------|-----|-----------|-----------|
| Schneider Electric — Carrières | `https://careers.se.com/` | 20 | 2 |
| L'Oréal — Carrières | `https://careers.loreal.com/` | 20 | 2 |
| Sanofi — Carrières | `https://www.sanofi.com/en/careers` | 20 | 2 |
| Legrand — Carrières | `https://www.legrandgroup.com/fr/recrutement` | 20 | 2 |
| Accor — Carrières | `https://careers.accor.com/` | 20 | 2 |

---

## Comment activer les sources

```bash
# Lancer le seed (idempotent, rerunnable sans doublons)
npm run seed:safe-sources
```

Puis dans le dashboard :

1. Aller dans **/dashboard/jobs/sources**
2. Pour chaque source désactivée :
   - Cliquer sur **"Tester"** (preview) pour voir les offres sans importer
   - Si la preview retourne des offres valides, cliquer sur **"Activer"**
   - Si la preview échoue, vérifier l'URL (elle peut avoir changé)
3. Une fois activée, cliquer sur **"Lancer import"** pour importer les offres
4. Utiliser **"Lancer toutes les sources"** pour un run groupé (max 5 sources)

---

## Règles importantes

### Ce qui est autorisé

- Pages carrières publiques sans login
- Boards ATS publics (Greenhouse, Lever, Ashby, Workable, etc.)
- Pages avec JSON-LD JobPosting accessible publiquement
- URLs sans CAPTCHA, Cloudflare, DataDome

### Ce qui est refusé (automatiquement)

- **LinkedIn** — `refused_closed_platform`
- **Indeed** — `refused_closed_platform`
- **APEC** — `refused_closed_platform`
- **Pages login/auth** — `refused_login_required`
- **Pages CAPTCHA/anti-bot** — `refused_captcha`
- **Tentatives de bypass (proxy, headless, etc.)** — `refused_bypass_attempt`

Le seed skip automatiquement toute URL qui échoue la classification.

### Limites

- **maxPagesPerRun** : 1 (2 pour les pages carrières étendues)
- **maxJobsPerRun** : 20 par source
- **SAFE_SOURCES_MAX_PER_RUN** : 5 par run groupé
- **SAFE_SOURCES_MAX_JOBS_PER_SOURCE** : 20 par source en run groupé

---

## Maintenance

### URLs devenues invalides

Les pages carrières peuvent changer d'URL. Si une source échoue systématiquement (3 erreurs consécutives), elle est automatiquement ignorée par les runs groupés. Un badge rouge "Erreurs répétées — désactiver ?" apparaît dans le dashboard.

Pour corriger :
1. Vérifier la nouvelle URL sur le site de l'entreprise
2. Scanner la nouvelle URL via le Source Scanner
3. Mettre à jour la source dans le registre

### Ajouter une nouvelle source

1. Dans **/dashboard/jobs/sources**, cliquer sur "Ajouter une source"
2. Coller l'URL et donner un label
3. Cliquer sur "Vérifier" pour la classification
4. Si autorisé, cliquer sur "Ajouter"
5. Tester avec "Preview" avant d'activer

### Supprimer une source

Dans le registre, cliquer sur l'icône poubelle. Confirmer.

---

## Idempotence du seed

Le script `npm run seed:safe-sources` peut être relancé sans risque :
- Les sources existantes (même domaine + URL) sont mises à jour
- Les nouvelles sources sont créées
- Aucun doublon n'est créé (contrainte unique `normalizedDomain + url`)
- Les sources déjà activées manuellement restent activées (le seed ne modifie pas `enabled`)

---

## Voir aussi

- [SAFE_SOURCE_REGISTRY.md](SAFE_SOURCE_REGISTRY.md) — Registre complet, architecture, endpoints
- [FIRECRAWL_SAFE_USER_FLOW.md](FIRECRAWL_SAFE_USER_FLOW.md) — Guide utilisateur Firecrawl Safe
- [FIRECRAWL_SAFE_CONNECTOR.md](FIRECRAWL_SAFE_CONNECTOR.md) — Documentation technique du connecteur
- [SAFE_SOURCE_CANARY_RUNBOOK.md](SAFE_SOURCE_CANARY_RUNBOOK.md) — Procédure d'activation contrôlée (canary)
