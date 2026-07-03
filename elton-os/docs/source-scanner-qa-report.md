# ELTON OS V2.2.1 — QA Source Scanner — Rapport de recette

**Date :** 2026-06-20  
**Version :** V2.2.1  
**Auteur :** ELTON OS (QA automatique)

---

## Résumé

37 sources scannées, 44 entrées en base (7 préexistantes non scannées).  
La matrice d'import est stable : 12 AUTO_ATS, 4 USER_ASSISTED, 21 MANUAL_ONLY.

| Métrique | Valeur |
|----------|--------|
| Sources scannées | 37 |
| AUTO_ATS | 12 |
| USER_ASSISTED | 4 |
| MANUAL_ONLY | 21 |
| Tests passés | 514/514 |
| Build | ✅ clean (1 NFT warning préexistant) |
| Lint | 0 nouvelle erreur |
| Offres en base | 35 (25 avant QA + 10 importées) |
| Stubs supprimés | 4 (ashby, greenhouse, lever, smartrecruiters) |

---

## Matrice des sources

### AUTO_ATS (12) — Import automatique activé

| Source | Domaine | ATS | Import auto | Offres |
|--------|---------|-----|-------------|--------|
| greenhouse-stripe | boards.greenhouse.io | ✅ | ✅ | ~512 |
| greenhouse-airbnb | boards.greenhouse.io | ✅ | ✅ | ~226 |
| greenhouse-databricks | boards.greenhouse.io | ✅ | ✅ | ~758 |
| greenhouse-figma | boards.greenhouse.io | ✅ | ✅ | ~164 |
| greenhouse-doctolib | boards.greenhouse.io | ✅ | ✅ | ~186 |
| greenhouse-robinhood | boards.greenhouse.io | ✅ | ✅ | ~142 |
| greenhouse-coinbase | boards.greenhouse.io | ✅ | ✅ | ~103 |
| greenhouse-brex | boards.greenhouse.io | ✅ | ✅ | ~234 |
| lever-palantir | jobs.lever.co | ✅ | ✅ | ~238 |
| ashby-linear | jobs.ashbyhq.com | ✅ | ✅ | ~26 |
| ashby-perplexity | jobs.ashbyhq.com | ✅ | ✅ | ~74 |
| ashby-cursor | jobs.ashbyhq.com | ✅ | ✅ | ~104 |

**Note :** Bien que le fetch HTML des pages `boards.greenhouse.io/XYZ` échoue parfois (403/Cloudflare), la classification reste AUTO_ATS car l'API JSON (`api.greenhouse.io/v1/boards/XYZ/jobs`) fonctionne parfaitement. Le connecteur `public-ats.ts` utilise l'API, pas le HTML.

### USER_ASSISTED (4) — Copier-coller requis

| Source | Domaine | Mode | Action recommandée |
|--------|---------|------|--------------------|
| LinkedIn Jobs | linkedin.com | USER_ASSISTED | Import Express |
| Indeed France | fr.indeed.com | USER_ASSISTED | Import Express |
| APEC | apec.fr | USER_ASSISTED | Import Express |
| WTTJ | welcometothejungle.com | USER_ASSISTED | Import Express |

**Vérification sécurité :**
- ✅ Aucun scraping automatique
- ✅ Aucun Browser Agent lancé sans action explicite
- ✅ Aucun bypass CAPTCHA/login
- ✅ Message clair vers Import Express dans l'UI

### MANUAL_ONLY (21) — Pas d'API détectée

| Source | Domaine | Bloqué | Statut | Note |
|--------|---------|--------|--------|------|
| api-francetravail | api.francetravail.io | ✅ 403 | URL API seule (manque clé OAuth) |
| career-schneider | careers.se.com | ✅ 403 | Bloqué (Akamai/Cloudfront) |
| career-siemens | jobs.siemens.com | ❌ | ok | Page carrière React |
| career-legrand | legrand.com | ❌ | 404 | URL obsolète |
| career-loreal | careers.loreal.com | ❌ | 404 | URL obsolète |
| career-danone | careers.danone.com | ❌ | ok | Page carrière |
| career-sanofi | sanofi.com | ❌ | ok | Page carrière |
| career-airbus | airbus.com | ❌ | 404 | URL obsolète |
| career-engie | engie.com | ❌ | 404 | URL obsolète |
| career-orange | oran.ge | ✅ 403 | Bloqué |
| career-capgemini | capgemini.com | ❌ | ok | Page carrière |
| career-accor | careers.accor.com | ✅ 403 | Bloqué |
| career-total | totalenergies.com | ❌ | ok | Page carrière |
| career-thales | thalesgroup.com | ❌ | ok | Page carrière |
| career-safran | safran-group.com | ✅ 403 | Bloqué |
| career-edf | edf.fr | ✅ 403 | Bloqué |
| career-veolia | veolia.com | ❌ | ok | Page carrière |
| career-bnp | group.bnpparibas | ✅ 403 | Bloqué |
| career-axa | axa.com | ✅ 403 | Bloqué |
| career-lvmh | lvmh.fr | ❌ | ok | Page carrière |
| career-michelin | recrutement.michelin.fr | ❌ | ok | Page carrière |

**Limitations :**
- 0 JSON-LD détecté (pages React/SPA sans `<script type="application/ld+json">`)
- 0 RSS/sitemap détecté
- 7 URL 404 : légrand, loreal, airbus, engie (à mettre à jour)
- 9 pages bloquées (403/Cloudfront/Akamai)

### Non scannées (7)

Sources créées avant V2.2 (ImportSource dans la DB sans URL) :
ATS publics (Greenhouse, Lever, etc.), France Travail (fixture), inconnue, Import Express, Import manuel, Test, Copier-coller

---

## QA ATS — Tests unitaires et fonctionnels

### Detection (source-capability-scanner.ts)

| Test | Résultat |
|------|----------|
| detectAtsProvider — greenhouse | ✅ |
| detectAtsProvider — lever | ✅ |
| detectAtsProvider — ashby | ✅ |
| detectAtsProvider — smartrecruiters | ✅ |
| detectAtsProvider — workable | ✅ |
| detectAtsProvider — teamtailor | ✅ |
| detectAtsProvider — recruitee | ✅ |
| detectAtsProvider — bamboohr | ✅ |
| detectAtsProvider — unknown | ✅ null |
| detectJsonLdJobs — 1, 3, 0 | ✅ |
| detectServerBlocked — 403, 429, Cloudflare, DataDome, reCAPTCHA, normal | ✅ |
| isBlockedDomain — linkedin, indeed, apec, stripe | ✅ |
| classifyImportMode — AUTO_ATS, AUTO_JSONLD, AUTO_RSS, USER_ASSISTED, MANUAL_ONLY, blocked career page | ✅ |
| WTTJ NOT detected as ATS | ✅ |

### Import ATS — Bout en bout

| Test | Résultat |
|------|----------|
| POST /api/jobs/import/run (public-ats, limit=5) | ✅ 5 créées, 5 doublons |
| POST /api/jobs/import/run (linkedin-public, limit=3) | ✅ 0 créée, 0 erreur |
| POST /api/jobs/import/run (all, respectCapabilities=true, limit=5) | ✅ 5 créées |
| Jobs apparaissent dans /dashboard/jobs | ✅ 35 offres |
| Scoring automatique | ✅ Toutes scorées |
| Déduplication | ✅ externalId + checksum |
| Source attribution correcte | ✅ "ATS publics (Greenhouse, Lever, etc.)" |

### Suppression des stubs — Impact

| Stub supprimé | Remplacé par | Impact tests | Impact import |
|---------------|-------------|--------------|---------------|
| ashby.ts | public-ats.ts | ✅ aucun | ✅ aucun |
| greenhouse.ts | public-ats.ts | ✅ aucun | ✅ aucun |
| lever.ts | public-ats.ts | ✅ aucun | ✅ aucun |
| smartrecruiters.ts | public-ats.ts | ✅ aucun | ✅ aucun |

---

## Worker intelligent — Vérification

| Règle | Statut |
|-------|--------|
| AUTO_API / AUTO_ATS / AUTO_JSONLD / AUTO_RSS → lancé | ✅ |
| USER_ASSISTED → ignoré | ✅ |
| MANUAL_ONLY → ignoré | ✅ |
| BLOCKED → ignoré | ✅ |
| respectCapabilities par défaut (true) | ✅ |
| respectCapabilities=false rétabli l'ancien comportement | ✅ |
| Erreurs claires "⏭️ Skip:" dans les logs | ✅ (via errors[] dans JobSearchRun) |
| Aucune candidature automatique | ✅ |
| Aucun Browser Agent lancé automatiquement | ✅ |

---

## UI — Vérification

| Page | Statut |
|------|--------|
| /dashboard/jobs/source-scanner | ✅ Tableau avec badges colorés |
| /dashboard/jobs/importer | ✅ Import Express avec preview |
| /dashboard/jobs | ✅ Boutons "Import Express" + "Sources" |
| Sidebar | ✅ "Source Scanner" + "Import Express" |
| Badges AUTO_ATS (bleu) | ✅ |
| Badges USER_ASSISTED (jaune) | ✅ |
| Badges MANUAL_ONLY (gris) | ✅ |
| Bouton "Import Express" sur lignes USER_ASSISTED | ✅ |
| Lien externe vers chaque source | ✅ |

---

## Corrections V2.2 → V2.2.1

1. **Classification ATS** : Les sources ATS sont maintenant AUTO_ATS même si le fetch HTML échoue (l'API JSON est utilisée)
2. **WTTJ** : N'est plus faussement détecté comme "welcomekit" ATS → correctement classé USER_ASSISTED
3. **Pages carrière bloquées** : MANUAL_ONLY au lieu de USER_ASSISTED (ce ne sont pas des plateformes sociales)
4. **12 ATS AUTO** (au lieu de 4) : les 8 companies greenhouse/lever/ashby qui avaient un blocage HTML sont maintenant correctement classifiées

---

## Limites restantes

- **0 JSON-LD détecté** : Les pages carrière modernes (React/SPA) n'embarquent pas de `<script type="application/ld+json">`. Il faudrait crawler les sous-pages de détail des offres
- **Pas de RSS/sitemap** : Aucune des 37 sources ne propose de flux RSS ou sitemap détectable
- **France Travail** : Classé MANUAL_ONLY (manque les credentials OAuth dans .env)
- **7 URL 404** : Les URLs de certaines pages carrière sont obsolètes et doivent être mises à jour
- **Pas de SmartRecruiters/Workable/Teamtailor actif** : Aucune company française trouvée avec ces ATS

---

## Recommandations

| Action | Priorité |
|--------|----------|
| Activer les 12 sources AUTO_ATS dans le cron quotidien | Haute |
| Mettre à jour les 7 URLs obsolètes (404) | Moyenne |
| Configurer FRANCE_TRAVAIL_CLIENT_ID/SECRET | Moyenne |
| Crawler les sous-pages carrière pour JSON-LD | Basse |
| Ajouter des companies SmartRecruiters/Workable FR | Basse |
