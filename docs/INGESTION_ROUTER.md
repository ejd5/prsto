# ELTON OS V2.6.10 — Smart Ingestion Router

**Date :** 2026-06-21 | **Version :** V2.6.10

---

## Objectif

Le Smart Ingestion Router choisit automatiquement la meilleure stratégie d'extraction pour chaque SafeJobSource. Au lieu d'utiliser Firecrawl pour toutes les sources, il priorise les APIs natives quand elles existent.

---

## Stratégies disponibles (par priorité)

| Priorité | Stratégie | Description | Connecteur |
|----------|-----------|-------------|------------|
| 1 | `API_OFFICIAL` | API France Travail (OAuth2) | `france-travail` |
| 2 | `ATS_NATIVE_GREENHOUSE` | API publique Greenhouse | `public-ats::fetchGreenhouseBoard` |
| 2 | `ATS_NATIVE_LEVER` | API publique Lever | `public-ats::fetchLeverBoard` |
| 2 | `ATS_NATIVE_ASHBY` | API publique Ashby | `public-ats::fetchAshbyBoard` |
| 2 | `ATS_NATIVE_SMARTRECRUITERS` | API publique SmartRecruiters | `public-ats::fetchSmartRecruitersBoard` |
| 3 | `ATS_NATIVE_WORKABLE` | API publique Workable | Aucun (fallback Firecrawl) |
| 4 | `JSONLD_NATIVE` | Extraction JSON-LD depuis le HTML | `generic-jsonld` |
| 5 | `FIRECRAWL_SAFE` | Firecrawl API (universel) | `firecrawl-safe` |
| 8 | `USER_ASSISTED` | Import manuel uniquement | Extension Chrome |
| 10 | `BLOCKED` | Aucun import automatique | — |

---

## Logique de routage

```
Source → chooseIngestionStrategy()
  ├─ BLOCKED              → BLOCKED (refuse)
  ├─ USER_ASSISTED/MANUAL → USER_ASSISTED (refuse)
  ├─ API_OFFICIAL         → API_OFFICIAL + fallback FIRECRAWL_SAFE
  ├─ ATS_PUBLIC + atsVendor connu
  │   ├─ greenhouse        → ATS_NATIVE_GREENHOUSE + company extraite du path
  │   ├─ lever             → ATS_NATIVE_LEVER + company extraite du path
  │   ├─ ashby             → ATS_NATIVE_ASHBY + company extraite du path
  │   ├─ smartrecruiters   → ATS_NATIVE_SMARTRECRUITERS + company extraite du path
  │   ├─ workable          → FIRECRAWL_SAFE (pas de connecteur natif)
  │   └─ autre             → FIRECRAWL_SAFE (ATS inconnu)
  ├─ AUTO_JSONLD          → JSONLD_NATIVE + fallback FIRECRAWL_SAFE
  ├─ AUTO_PUBLIC_CAREERS   → FIRECRAWL_SAFE
  ├─ AUTO_FIRECRAWL_SAFE   → FIRECRAWL_SAFE
  └─ Legacy (AUTO_API/ATS) → FIRECRAWL_SAFE + fallback USER_ASSISTED
```

---

## Fallback automatique

Quand une stratégie native échoue (API down, 0 résultats, timeout) :

1. **ATS native → Firecrawl Safe** : l'extraction repasse par le pipeline Firecrawl
2. **JSON-LD natif → Firecrawl Safe** : idem
3. **Firecrawl Safe → erreur** : pas de second fallback

Le fallback est tracé dans l'audit (`usedFallback: true`, `fallbackReason`).

---

## API des fonctions

```typescript
// Choix de la stratégie optimale (pure, sans I/O)
chooseIngestionStrategy(source: {
  importMode: string;
  atsVendor?: string | null;
  normalizedDomain: string;
  url: string;
  label: string;
}): StrategyDecision

// Exécution de la stratégie (appels réseau pour les stratégies natives)
runIngestionStrategy(
  source: { id, url, normalizedDomain, atsVendor?, label },
  strategy: IngestionStrategy,
  atsCompany?: string,
): Promise<IngestionResult>

// Priorité numérique (1-10)
getStrategyPriority(strategy: IngestionStrategy): number

// Explication humaine pour le dashboard
explainStrategyDecision(decision: StrategyDecision): string

// Vérifie si la stratégie est native (pas Firecrawl)
isNativeStrategy(strategy: IngestionStrategy): boolean
```

---

## Intégration dans le runner

Le `runSafeJobSource()` a été modifié :

**Avant (V2.6.9) :** Firecrawl pour toutes les sources
```
Classify → Check Firecrawl config → Cost guard → Firecrawl scrape → Extract → Import
```

**Après (V2.6.10) :** Routage natif prioritaire
```
Classify → chooseIngestionStrategy()
  ├─ Native dispo ? → runIngestionStrategy()
  │   ├─ Succès → les jobs passent directement au pipeline post-extraction
  │   └─ Échec → fallback Firecrawl
  └─ Firecrawl ? → Check config → Cost guard → scrape → extract → Import
```

Le pipeline post-extraction (company inference, noise filter, quality gates, import) reste identique quelle que soit la stratégie.

---

## Audit

Chaque `JobSearchRun.logsJson` inclut désormais :

```json
{
  "ingestionStrategy": "ATS_NATIVE_GREENHOUSE",
  "usedFallback": false,
  "fallbackReason": null
}
```

En cas de fallback :
```json
{
  "ingestionStrategy": "FIRECRAWL_SAFE",
  "usedFallback": true,
  "fallbackReason": "La stratégie native ATS_NATIVE_GREENHOUSE n'a retourné aucun résultat. Fallback Firecrawl."
}
```

---

## Sources où le routage change le comportement

| Source | Avant V2.6.10 | Après V2.6.10 |
|--------|--------------|---------------|
| Stripe (Greenhouse) | Firecrawl | API native Greenhouse |
| Airbnb (Greenhouse) | Firecrawl | API native Greenhouse |
| Databricks (Greenhouse) | Firecrawl | API native Greenhouse |
| Figma (Greenhouse) | Firecrawl | API native Greenhouse |
| Palantir (Lever) | Firecrawl | API native Lever |
| Linear (Ashby) | Firecrawl | API native Ashby |
| Perplexity (Ashby) | Firecrawl | API native Ashby |
| Cursor (Ashby) | Firecrawl | API native Ashby |
| Pages carrières JSON-LD | Firecrawl | JSON-LD natif → fallback Firecrawl |
| Pages carrières standards | Firecrawl | Firecrawl (inchangé) |
| LinkedIn / Indeed / APEC | Refusé | USER_ASSISTED (refusé, inchangé) |

---

## Avantages

- **Qualité d'extraction** : les APIs natives retournent des données structurées (pas de parsing Markdown)
- **Coût Firecrawl** : les sources avec API native ne consomment plus de requêtes Firecrawl
- **Vitesse** : les APIs natives sont plus rapides (pas de rendu headless)
- **Fiabilité** : les APIs JSON sont plus stables que le parsing Markdown
- **Company** : les APIs Greenhouse/Lever/Ashby incluent le company name (plus besoin d'inférence)

---

## Limitations connues

- **Workable** : détecté par le scanner mais pas de connecteur natif → Firecrawl
- **Teamtailor/Recruitee/BambooHR** : détectés comme ATS mais sans connecteur natif → Firecrawl
- **SmartRecruiters** : l'API nécessite un company ID (souvent différent du slug dans l'URL)
- **JSON-LD natif** : dépend du fetch HTML réussi (certaines pages peuvent bloquer)

---

## Tests

- **Fichier :** `tests/ingestion-router.test.ts` — 38 tests
- **Stratégies (6) :** priority ordering, API_OFFICIAL=1, ATS native=2, FIRECRAWL_SAFE=5, USER_ASSISTED=8, BLOCKED=10
- **isNativeStrategy (3) :** ATS/JSONLD=true, FIRECRAWL/USER_ASSISTED/BLOCKED=false
- **BLOCKED (2) :** importMode BLOCKED, pas de fallback
- **USER_ASSISTED (3) :** USER_ASSISTED, MANUAL_ONLY, fallback=self
- **API_OFFICIAL (1) :** France Travail routing
- **ATS_PUBLIC native (7) :** Greenhouse/Lever/Ashby/SmartRecruiters → native, Workable/unknown/sans vendor → Firecrawl
- **JSON-LD (1) :** AUTO_JSONLD → JSONLD_NATIVE
- **Firecrawl (5) :** AUTO_PUBLIC_CAREERS, PUBLIC_CAREERS, AUTO_FIRECRAWL_SAFE, AUTO_API, AUTO_ATS
- **Company extraction (4) :** Greenhouse/Lever/Ashby URL paths, no path → Firecrawl
- **explainStrategyDecision (3) :** contient stratégie/priorité, BLOCKED=non, fallback présent
- **StrategyDecision shape (2) :** champs requis, reason non vide
- **listStrategiesByPriority (1) :** ordre correct

---

## V2.7 — Import Assisté Pro (Chrome Extension)

L'Import Assisté Pro V2.7 rend les plateformes USER_ASSISTED (LinkedIn, Indeed, APEC) réellement utilisables :

- L'utilisateur ouvre la page d'offre dans son navigateur personnel
- L'extension Chrome lit le DOM visible (pas de cookies, pas de sessions, pas de réseau)
- L'utilisateur valide les offres avant envoi vers ELTON OS
- Le serveur ne fetch jamais LinkedIn / Indeed / APEC

### Endpoints API

| Endpoint | Méthode | Rôle |
|---|---|---|
| `/api/jobs/assisted-import/preview` | POST | Validation + dédoublonnage |
| `/api/jobs/assisted-import/import` | POST | Pipeline complet : RawJob → Job → JobScore → Semantic Matcher |

### Reason Codes

| Code | Description |
|---|---|
| `assisted_visible_job_imported` | Offre unique importée via extension |
| `assisted_visible_list_imported` | Offres en liste importées via extension |
| `assisted_duplicate_skipped` | Doublon |
| `assisted_missing_required_fields` | Champs obligatoires manquants |
| `blocked_login_or_captcha_visible` | Page de login/CAPTCHA |
| `refused_server_side_closed_platform_fetch` | Tentative de fetch serveur refusée |
| `refused_auto_scrape_closed_platform` | Tentative de scraping automatique refusée |

Voir [ASSISTED_IMPORT_EXTENSION.md](ASSISTED_IMPORT_EXTENSION.md) pour la documentation complète.

---

## Sécurité

- **Pas de bypass** : les sources BLOCKED/USER_ASSISTED sont refusées avant tout appel réseau
- **Pas de nouveau connecteur** : réutilisation exclusive des connecteurs existants
- **Pas de scraper** : les APIs natives sont publiques et documentées
- **Pas de stockage de secrets** : aucun token dans l'audit ou les logs
- **Pas de fetch serveur vers plateformes fermées** : le serveur refuse toute tentative de fetch vers LinkedIn/Indeed/APEC/Cadremploi/Monster
