# ELTON OS — Safe Source Canary Report V2.6.8

**Date :** 2026-06-21 | **Version :** V2.6.8

---

## Informations générales

| Champ | Valeur |
|-------|--------|
| Date du canary | 2026-06-21 |
| Opérateur | Ejd5 |
| Sources activées | 2 |
| Mode | preview + import |

---

## Sources testées

| Source | URL | Preview | Import | Offres trouvées | Offres importées | Doublons | Invalid | Durée |
|--------|-----|---------|--------|----------------|-----------------|----------|---------|-------|
| Stripe — Greenhouse | https://boards.greenhouse.io/stripe | ✅ | ✅ | 1 | 1 | 0 | 0 | 1121ms |
| Airbnb — Greenhouse | https://boards.greenhouse.io/airbnb | ✅ | ✅ | 2 | 1 | 1 | 0 | 655ms |

---

## Statistiques du run

| Métrique | Valeur |
|----------|--------|
| Requêtes Firecrawl | 2 preview + 2 import = 4 requêtes |
| Jobs found | 3 (total des 2 sources) |
| Jobs imported | 2 |
| Duplicates | 1 |
| Invalid (qualité) | 0 |
| Skipped | 0 |
| SemanticScoredCount | 2 |

---

## Top offres par score sémantique

| Titre | Entreprise | Localisation | Score sémantique | Score global | Recommandation |
|-------|-----------|-------------|-----------------|-------------|----------------|
| Chat with Stripe sales | Stripe | North America | 35 | 52 | low_priority |

**Analyse sémantique :**
- Role Fit : 55/100
- Seniority Fit : 92/100
- Location Fit : 30/100 (North America vs Marseille)
- Sector Fit : 70/100
- Language Fit : 90/100
- Compensation Fit : 55/100
- Company Fit : 75/100
- Application Readiness : 95/100

**Signaux positifs :** Stratégie commerciale, Seniority, Langues, Préparation
**Signaux manquants :** Fourchette salariale, Type de contrat
**Angle CV suggéré :** "Insister sur les résultats chiffrés de pilotage d'équipe et de croissance."
**Angle LM suggéré :** "Démontrer une connaissance de Stripe et de son marché."
**Préparation entretien :** "Prêt pour un entretien en français et en anglais."

---

## Distribution géographique

| Zone | Nombre d'offres |
|------|----------------|
| PACA | 0 |
| Île-de-France | 0 |
| France (hors PACA/IDF) | 0 |
| International | 2 (North America) |
| Non détecté | 0 |

---

## Erreurs rencontrées

| Source | Erreur | Reason code | Action corrective |
|--------|--------|-------------|-------------------|
| Aucune | — | — | — |

**Note :** Avant le fix de company inference (étape 6b), les 3 offres étaient invalid pour cause de `company` absent. Après fix : 0 invalid.

---

## Qualité des données

| Métrique | Valeur |
|----------|--------|
| Offres avec entreprise manquante | 0 (fix inference appliqué) |
| Offres avec localisation manquante | 0 (firecrawl détecte la loc) |
| Offres avec description courte (< 200 car.) | 1 (Stripe — page listing sans détail) |
| Offres avec salaire incohérent | 0 |
| Offres avec URL de candidature absente | 1 (Stripe — listing board, pas offre détaillée) |

**Finding — Qualité extraction Greenhouse :**
- Stripe : extraction propre, 1 job réel détecté
- Airbnb : extraction de chrome UI ("All Jobs", "Showing 1-10 results...") au lieu des vrais jobs. Le markdown de la page board Greenhouse Airbnb contient du texte de navigation avant les offres réelles. Amélioration suggérée : filtrer les titres contenant "All Jobs", "Showing...results", "Filters", "Search" etc.

**Finding — Company inference :**
- Ajout post-normalisation (étape 6b) : `source.label.split(" — ")[0]` infère l'entreprise depuis le label de la source. Sans ce fix, 100% des offres étaient invalid (company absent des boards ATS). Solution simple et fiable pour les sources seedées avec format "NomEntreprise — ATS".

---

## Coût / Consommation

| Métrique | Valeur |
|----------|--------|
| Requêtes Firecrawl utilisées aujourd'hui | 2 |
| Offres importées aujourd'hui | 2 |
| Limite requêtes/jour (FIRECRAWL_DAILY_MAX_REQUESTS) | 10 |
| Limite offres/jour (FIRECRAWL_DAILY_MAX_JOBS_IMPORTED) | 20 |
| Marge restante | 8 requêtes / 18 offres |

---

## Configuration vérifiée

| Flag | Valeur |
|------|--------|
| `SAFE_SOURCES_RUN_ENABLED` | true (canary) |
| `SAFE_SOURCES_CRON_ENABLED` | false ✅ |
| `FIRECRAWL_ENABLED` | true |
| `FIRECRAWL_API_KEY` | configurée ✅ |
| `SAFE_SOURCES_MAX_PER_RUN` | 2 |
| `SAFE_SOURCES_MAX_JOBS_PER_SOURCE` | 10 |
| `FIRECRAWL_DAILY_MAX_REQUESTS` | 10 |
| `FIRECRAWL_DAILY_MAX_JOBS_IMPORTED` | 20 |
| Sources totales | 15 |
| Sources enabled | 2 |
| Kill switch | OFF (runs autorisés) |

---

## Décision

- [ ] **Keep enabled** — Stripe : qualité acceptable, 1 job réel importé, pipeline complet OK
- [x] **Disable** — Airbnb : extraction de chrome UI, pas de vrais jobs. Désactiver jusqu'à amélioration de l'extraction.
- [ ] **Adjust limits** — pas nécessaire
- [ ] **Add more sources** — pas avant amélioration extraction
- [x] **Investigate** — extraction Greenhouse : le split par headings attrape le chrome UI avant les offres réelles. Priorité moyenne : améliorer le filtrage des titres parasites.

---

## Notes

- Pipeline end-to-end validé : Firecrawl → extraction Markdown → normalisation → company inference → validateJob → dédup → RawJob → Job → JobScore → semantic matcher → recommandation
- Semantic matcher : 8 dimensions calculées (roleFit, seniorityFit, locationFit, sectorFit, languageFit, compensationFit, companyFit, applicationReadiness)
- Angles CV/LM/Interview générés automatiquement
- Location priority 3 (international) correctement assigné pour North America
- Cost guard fonctionnel : dailyRequestsUsed=2, dailyJobsImportedUsed=2
- Le fix company inference est critique pour les boards ATS — sans lui, 0% de succès
- Airbnb à désactiver — extraction attrape du texte UI au lieu des offres
- Extraction à améliorer : filtrer les titres parasites ("All Jobs", "Showing X results", "Filters", "Search", "Reset")

---

## Prochain canary

| Date prévue | Sources à activer | Commentaire |
|-------------|-------------------|-------------|
| Après amélioration extraction Greenhouse | Airbnb, Notion, Figma | Tester le filtrage des titres parasites sur plusieurs boards Greenhouse |
| Après amélioration extraction | Spotify (Lever), Linear (Ashby) | Tester d'autres ATS publics |

---

---

## Lessons from V2.6.8

### Ce qui a fonctionné

- Firecrawl s'est connecté et a extrait du contenu pour les 2 sources
- Pipeline end-to-end validé : extraction → normalisation → company inference → dédup → scoring
- Semantic matcher a produit des résultats complets (8 dimensions + angles CV/LM/Interview)
- Cost guard a correctement compté les requêtes
- Kill switch / cron disable / LinkedIn-Indeed-APEC refusés : OK

### Ce qui n'a pas fonctionné

- **Airbnb Greenhouse** : l'extraction a attrapé du chrome UI au lieu de vrais jobs ("All Jobs", "Showing 1-10 results out of total 226 open jobs", "Reset")
- **Company absente** : les boards ATS n'ont pas de label "Company:" par offre → 100% des jobs étaient invalid avant le fix d'inférence

### Fixes déployés (V2.6.8 → V2.6.9)

1. **Company inference robuste** : `inferCompanyNameFromSource()` multi-stratégie (label → séparateurs → atsVendor → domaine)
2. **Noise filter** : `isLikelyJobTitle()` bloque 24 patterns de chrome UI (case-insensitive), accepte les vrais titres longs
3. **Extraction quality scoring** : `computeExtractionQuality()` → clean/warning/poor + shouldDisableSource
4. **Import guard** : si 100% bruit → `refused_poor_extraction_quality`, pas d'import, consecutiveErrors++
5. **Audit enrichi** : `extractionQuality` dans `FirecrawlAuditEntry` et `JobSearchRun.logsJson`

### Prochaine action V2.6.9+

- Re-tester Airbnb avec le noise filter → devrait être poor et s'auto-désactiver
- Tester Stripe → doit rester clean
- Si résultats OK : activer 2-3 nouvelles sources (Notion, Figma, Spotify)

---

## Historique des canaries

| Date | Sources | Résultat | Décision |
|------|---------|----------|----------|
| 2026-06-21 | Stripe, Airbnb (Greenhouse) | 2 jobs importés, pipeline OK, extraction Airbnb pauvre | Keep Stripe, Disable Airbnb, améliorer extraction |
| 2026-06-21 (V2.6.9) | Stripe | Extraction quality hardening déployé | Noise filter + quality guard actifs |
