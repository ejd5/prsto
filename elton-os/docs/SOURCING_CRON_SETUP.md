# ELTON OS — Setup Cron Sourcing Quotidien

## Endpoint

```
POST /api/jobs/cron/sourcing
```

Protégé par `x-api-token` header + `SOURCING_CRON_TOKEN`.

- **En localhost/127.0.0.1** : le token est optionnel en dev (`NODE_ENV !== "production"`)
- **Dès que l'app est exposée** (domaine public, reverse proxy, tunnel) : `SOURCING_CRON_TOKEN` est obligatoire
- Sans token configuré hors localhost : 401

## Variables d'environnement

```bash
SOURCING_CRON_TOKEN=votre-token-secret-ici   # Obligatoire hors localhost
JOB_REPORT_WEBHOOK_URL=https://...            # Optionnel — webhook de notification après chaque run
```

## Plan d'activation

| Jour | Action | Paramètres |
|------|--------|-----------|
| **J1** | Dry run uniquement | `dryRun: true, maxSources: 3` |
| **J2** | Run réel limité | `dryRun: false, maxSources: 3, maxJobsPerSource: 10, maxTotalJobs: 30` |
| **J3** | Run réel élargi | `dryRun: false, maxSources: 6, maxJobsPerSource: 20, maxTotalJobs: 100` |
| **J4+** | Run complet contrôlé | `dryRun: false, maxSources: 12, maxJobsPerSource: 30, maxTotalJobs: 200` |

### Commande J1 (dry run)

```bash
curl -X POST https://VOTRE_DOMAINE/api/jobs/cron/sourcing \
  -H "Content-Type: application/json" \
  -H "x-api-token: votre-token-secret" \
  -d '{"dryRun":true, "maxSources":3, "maxJobsPerSource":30, "maxTotalJobs":200}'
```

**Objectif J1 :**
- Ne rien créer — dry run uniquement
- Vérifier le rapport dans `/dashboard/jobs` (bloc "Dernier sourcing")
- Vérifier les compteurs internationaux (`acceptedFranceMarket`, `rejectedInternationalNotCompatible`)
- Vérifier les top jobs proposés
- Si satisfaisant, passer à J2

### Résultat J1 (2026-06-20)
- 0 job créé, 972 fetchées, 32 intl acceptées, 158 intl rejetées ✅

### Résultat J2 (2026-06-20)
- Bugs découverts et corrigés : "remote" standalone, HTML non nettoyé, localisations US/Brésil non détectées
- 0 créé (déjà dédupliqués), pollution archivée (87 jobs)

### Résultat J3 (2026-06-20)
- 6 sources scannées, 972 fetchées, 969 filtrées profil, 1 intl acceptée, 189 intl rejetées
- 0 créé (déjà dédupliqués), 24 jobs propres en base (France uniquement)
- **Décision : PRÊT pour J4+ cron quotidien**

## Vérifier un run

```bash
# Dernier rapport
curl http://localhost:3000/api/jobs/cron/sourcing/latest

# Historique des runs dans la DB
sqlite3 prisma/dev.db "SELECT startedAt, mode, status, fetchedCount, createdCount, duplicateCount, rejectedCount FROM JobSearchRun ORDER BY startedAt DESC LIMIT 5;"
```

### Dans l'UI
- `/dashboard/jobs` affiche un bloc "Dernier sourcing automatique" avec le résumé du dernier run et les top offres
- `/dashboard/jobs/source-scanner` permet de lancer un dry run ou un cron réel depuis l'UI

## Paramètres

| Paramètre | Défaut | Description |
|-----------|--------|-------------|
| `dryRun` | `false` | `true` = ne crée rien, retourne juste un aperçu |
| `maxSources` | 12 | Nombre max de sources à interroger |
| `maxJobsPerSource` | 30 | Offres max créées par source |
| `maxTotalJobs` | 200 | Total max d'offres créées par run |
| `onlyRecentDays` | 21 | Ignore les offres publiées il y a plus de N jours |
| `minScoreToCreate` | 55 | Score de pertinence profil minimum pour créer un Job |

## Exemple de requête

```bash
curl -X POST https://elton-os.example.com/api/jobs/cron/sourcing \
  -H "Content-Type: application/json" \
  -H "x-api-token: votre-token-secret" \
  -d '{"dryRun": false, "maxSources": 5, "maxJobsPerSource": 20, "maxTotalJobs": 100}'
```

## Exemple cron-job.org

```
URL: https://votre-domaine.com/api/jobs/cron/sourcing
Méthode: POST
Headers:
  Content-Type: application/json
  x-api-token: votre-token-secret
Body: {"dryRun":false,"maxSources":12,"maxJobsPerSource":30,"maxTotalJobs":200,"onlyRecentDays":21}
Planification: Tous les jours à 7h00
```

## Exemple crontab

```cron
# ELTON OS — Cron sourcing quotidien (8h00)
0 8 * * * curl -s -X POST https://elton-os.example.com/api/jobs/cron/sourcing -H 'Content-Type: application/json' -H 'x-api-token: votre-token' -d '{"maxSources":12,"maxJobsPerSource":30,"maxTotalJobs":200}' > /dev/null 2>&1
```

## Sources traitées

Seules les sources **READY_FOR_CRON** sont interrogées :

| Source | Provider | Offres estimées |
|--------|----------|-----------------|
| greenhouse-stripe | Greenhouse | ~512 |
| greenhouse-airbnb | Greenhouse | ~226 |
| greenhouse-databricks | Greenhouse | ~758 |
| greenhouse-figma | Greenhouse | ~164 |
| greenhouse-doctolib | Greenhouse | ~186 |
| greenhouse-robinhood | Greenhouse | ~142 |
| greenhouse-coinbase | Greenhouse | ~103 |
| greenhouse-brex | Greenhouse | ~234 |
| lever-palantir | Lever | ~238 |
| ashby-linear | Ashby | ~26 |
| ashby-perplexity | Ashby | ~74 |
| ashby-cursor | Ashby | ~104 |

## Sources ignorées

Toutes les sources USER_ASSISTED, MANUAL_ONLY, BLOCKED sont automatiquement ignorées :

| Source | Raison |
|--------|--------|
| LinkedIn Jobs | USER_ASSISTED — nécessite Import Express |
| Indeed France | USER_ASSISTED — nécessite Import Express |
| APEC | USER_ASSISTED — nécessite Import Express |
| Pages carrière corporate | MANUAL_ONLY — pas d'API détectée |

## Filtre profil

Avant création, chaque offre est filtrée contre le profil cible :

- ✅ Postes de direction commerciale (Directeur Commercial, VP Sales, Country Manager…)
- ✅ Localisation France / Europe prioritaire
- ✅ Scope management / P&L / équipe
- ❌ Stages, alternances, postes juniors
- ❌ SDR, BDR, Account Executive opérationnel
- ❌ Postes techniques (Software Engineer, Data Scientist, Product Manager…)
- ❌ Rôles administratifs
- ❌ Localisation US-only sans remote

Seuil : `minScoreToCreate = 55` (ajustable dans la requête).

## Politique internationale (V2.2.5)

Les postes à l'étranger ne sont pas tous acceptés. Le cron applique une règle stricte :

### Acceptés

Un poste international est conservé si au moins un des critères suivants est vrai :

| Critère | Exemple | Compteur |
|---------|---------|----------|
| Cible le marché France / francophone | "French Market Manager", "Responsable Marché Français" | `acceptedFranceMarket` |
| Recherche un profil français / francophone | "French native required", "Bilingual French/English" | `acceptedFrenchProfile` |
| Remote depuis la France | "Remote from France", "Candidates based in France" | `acceptedRemoteFrance` |
| Remote Europe / EMEA compatible France | "Remote EMEA", "EU remote" | `acceptedRemoteFrance` |
| Poste nommé "Country Manager France" | Même si l'entreprise est étrangère | `acceptedFranceMarket` |

### Rejetés

Un poste international est rejeté si :

| Critère | Exemple |
|---------|---------|
| US-only / UK-only / Germany-only | "US only", "UK based", "Germany only" |
| Local-only hors France | "Must be based in London", "NYC onsite" |
| Onsite hors France sans mention France | "Onsite Berlin 5 days/week" |
| Relocation hors France | "Relocation required to San Francisco" |
| Langue locale obligatoire sans français | "German native required", "Spanish native" |
| Hybrid local sans remote France/Europe | "Hybrid London 3 days/week" |

**Compteur associé :** `rejectedInternationalNotCompatible`

### Exemples

| Offre | Décision | Raison |
|-------|----------|--------|
| Country Manager France — société US | ✅ Accepté | Cible marché France |
| Sales Director, French-speaking markets | ✅ Accepté | Profil francophone requis |
| Remote EMEA, candidates based in France | ✅ Accepté | Remote Europe compatible |
| Head of Sales, French Market Europe | ✅ Accepté | Marché France détecté |
| Sales Director US — US only, NY based | ❌ Rejeté | US-only, local |
| Country Manager Germany — German native | ❌ Rejeté | Local Germany |
| VP Sales — NYC onsite, relocation required | ❌ Rejeté | Relocation US |

## Vérifier un run

Consulter le dernier run :

```bash
# Via l'API
curl http://localhost:3000/api/jobs/cron/sourcing

# Dans la DB
sqlite3 prisma/dev.db "SELECT * FROM JobSearchRun ORDER BY startedAt DESC LIMIT 3;"
```

Dans `/dashboard/jobs/source-scanner`, les boutons **Dry Run Cron** et **Lancer Cron** permettent de tester manuellement.

## Désactiver une source

Dans la DB :
```sql
UPDATE ImportSource SET enabled = 0 WHERE name = 'greenhouse-stripe';
```

Ou via l'UI Source Scanner : décocher la source de la liste (non implémenté — à faire manuellement).

## Limites de sécurité

- **Aucune candidature automatique** — jamais d'envoi, jamais de Apply
- **Aucun scraping LinkedIn/Indeed** — ces sources sont ignorées
- **Aucun Browser Agent** — le cron n'utilise que les APIs JSON
- **Rate limiting** — ~500ms de délai entre les sources
- **Limite de jobs** — 200 max par run, 30 max par source
- **User-agent clair** : `ELTON-OS/2.2`

## Logs

Chaque run crée un `JobSearchRun` avec :
- `mode = "morning"`
- `fetchedCount`, `createdCount`, `duplicateCount`, `rejectedCount`
- `logsJson` contenant le rapport complet (version `v2.2.5`)

### Compteurs internationaux (logsJson)

| Compteur | Signification |
|----------|--------------|
| `intlAccepted` | Offres internationales conservées (marché France, francophone, remote) |
| `intlRejected` | Offres internationales rejetées (US-only, UK-only, relocation…) |
| `acceptedFranceMarket` | Offres ciblant le marché France / francophone |
| `acceptedFrenchProfile` | Offres recherchant un profil français / francophone |
| `acceptedRemoteFrance` | Offres remote depuis la France ou remote Europe |
| `rejectedInternationalNotCompatible` | Offres internationales ne remplissant aucun critère |
