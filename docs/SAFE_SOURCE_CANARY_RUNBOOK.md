# ELTON OS — Safe Source Canary Runbook V2.6.7

**Date :** 2026-06-21 | **Version :** V2.6.7

---

## Objectif

Ce runbook décrit la procédure d'activation contrôlée des Safe Sources en production. L'approche "canary" consiste à activer progressivement 2 à 3 sources seulement, vérifier chaque étape, et n'étendre qu'une fois la stabilité confirmée.

**Principe :** ne jamais lancer `runAll` sans avoir validé chaque source individuellement.

---

## Prérequis

- [ ] Dashboard `/dashboard/jobs/sources` accessible
- [ ] Variables d'environnement vérifiées dans `.env` :
  - `SAFE_SOURCES_RUN_ENABLED=true` (kill switch off)
  - `FIRECRAWL_ENABLED=true`
  - `FIRECRAWL_API_KEY=fc-...` (clé présente)
  - `FIRECRAWL_DAILY_MAX_REQUESTS=25`
  - `FIRECRAWL_DAILY_MAX_JOBS_IMPORTED=100`
  - `SAFE_SOURCES_CRON_ENABLED=false` (cron désactivé)
- [ ] Sources seedées via `npm run seed:safe-sources`
- [ ] Profil exécutif configuré (pour le semantic matching)

---

## Étape 1 : Sélection des sources canary

Choisir 2 à 3 sources parmi les plus fiables :

| Priorité | Source | URL | ATS |
|----------|--------|-----|-----|
| 1 | Stripe | `https://boards.greenhouse.io/stripe` | Greenhouse |
| 2 | Spotify | `https://jobs.lever.co/spotify` | Lever |
| 3 | Notion | `https://boards.greenhouse.io/notion` | Greenhouse |

**Critères de sélection :**
- ATS public reconnu (Greenhouse, Lever, Ashby)
- Entreprise active avec offres régulières
- Page carrière stable (pas de redirections fréquentes)
- Déjà testée en preview avec succès

---

## Étape 2 : Vérification de l'état de configuration

1. Aller dans `/dashboard/jobs/sources`
2. Ouvrir le panneau **"Statut configuration"** (cliquer sur ▸)
3. Vérifier que tous les indicateurs sont verts :
   - Runs Safe Sources : Activé
   - Firecrawl activé : Activé
   - Clé Firecrawl configurée : Activé
4. Vérifier les limites : requêtes/jour et offres/jour
5. Vérifier qu'aucun warning rouge n'est affiché

Si un indicateur est rouge, corriger la configuration avant de continuer.

---

## Étape 3 : Activation des sources

1. Dans le registre, repérer la source à activer (ex: "Stripe — Greenhouse")
2. Vérifier qu'elle est en statut **Désactivé** (badge gris)
3. Cliquer sur **"Activer"**
4. Le badge passe en mode normal (l'opacité revient à 100%)

**Ne pas activer plus de 3 sources pour le premier canary.**

---

## Étape 4 : Test individuel (preview)

Pour chaque source activée :

1. Cliquer sur **"Tester"** (bouton avec icône œil)
2. Attendre la réponse (quelques secondes)
3. Vérifier le résultat :
   - **Succès** : badge vert, `N offres trouvées`
   - **Avertissements** : bandeau jaune avec détails (entreprise manquante, description courte, etc.)
   - **Échec** : badge rouge avec message d'erreur
4. Cliquer sur **"Voir l'audit"** pour inspecter les détails techniques
5. Si la preview échoue, **ne pas lancer l'import**. Investiguer l'erreur. Désactiver la source si nécessaire.

---

## Étape 5 : Import contrôlé

Pour chaque source dont la preview est OK :

1. Cliquer sur **"Lancer import"**
2. Attendre la réponse
3. Vérifier :
   - `N offres importées` > 0
   - `N doublons` (normal si c'est un re-run)
   - `N scores sémantiques` (doit correspondre au nombre d'offres)
4. Cliquer sur **"Voir l'audit"** et vérifier que `semanticScoredCount` est correct

---

## Étape 6 : Vérification post-import

1. Aller dans l'onglet **"Rapport quotidien"**
2. Vérifier que les offres apparaissent dans le **Top 10**
3. Vérifier les scores sémantiques (≥ 50% = acceptable, ≥ 75% = bon)
4. Vérifier les recommandations (apply_now, review, consider)
5. Aller dans `/dashboard/jobs` et chercher les offres importées (source "Firecrawl Safe")
6. Ouvrir une offre et vérifier la section "Pourquoi cette offre matche"

---

## Étape 7 : Décision

Après le premier canary :

| Situation | Action |
|-----------|--------|
| Preview + Import OK sur les 3 sources | ✅ Canary réussi — activer 2-3 sources supplémentaires |
| Preview OK mais Import avec warnings | ⚠️ Ajuster les limites (maxJobsPerRun), vérifier les warnings |
| Preview échoue sur une source | 🔴 Désactiver la source, vérifier l'URL |
| Import échoue (timeout, erreur réseau) | 🔴 Désactiver la source, vérifier Firecrawl |
| 3 erreurs consécutives sur une source | 🔴 La source est automatiquement ignorée par les runs groupés |

---

## Étape 8 : Nettoyage

Si une source doit être désactivée :

1. Cliquer sur **"Désactiver"**
2. Le badge "Désactivé" apparaît
3. La source ne sera plus incluse dans les runs

Si une source a 3 erreurs consécutives ou plus :
- Un badge rouge "Erreurs répétées" apparaît
- La source est automatiquement ignorée par les runs groupés
- Pour la réactiver : corriger le problème, puis lancer un run individuel réussi (remet `consecutiveErrors` à 0)

---

## Règles de sécurité

- **Ne JAMAIS activer plus de 5 sources sans validation préalable**
- **Ne JAMAIS lancer runAll sans avoir testé chaque source**
- **Ne JAMAIS modifier les limites (maxJobsPerRun) à la hausse sans réflexion**
- **Toujours vérifier le rapport quotidien après un run**
- **Désactiver immédiatement une source qui échoue 2 fois de suite**
- **Ne pas laisser le cron activé sans surveillance**

---

## Troubleshooting

| Symptôme | Cause probable | Action |
|----------|---------------|--------|
| "Runs désactivés par configuration" | `SAFE_SOURCES_RUN_ENABLED=false` | Mettre à `true` dans `.env` |
| "Limite quotidienne atteinte" | Trop de requêtes aujourd'hui | Attendre demain ou augmenter `FIRECRAWL_DAILY_MAX_REQUESTS` |
| "Firecrawl désactivé" | `FIRECRAWL_ENABLED=false` | Mettre à `true` dans `.env` |
| "Clé API Firecrawl absente" | `FIRECRAWL_API_KEY` non définie | Configurer la clé dans `.env` |
| "Timeout" | Page cible lente ou inaccessible | Vérifier l'URL dans un navigateur |
| "Plateforme fermée" | L'URL a changé (ex: redirigé vers LinkedIn) | Reclassifier l'URL via le Source Scanner |

---

## Voir aussi

- [SAFE_SOURCE_CANARY_REPORT.md](SAFE_SOURCE_CANARY_REPORT.md) — Template de rapport post-canary
- [SAFE_SOURCE_REGISTRY.md](SAFE_SOURCE_REGISTRY.md) — Documentation complète du registre
- [SAFE_SOURCE_STARTER_PACK.md](SAFE_SOURCE_STARTER_PACK.md) — Sources du starter pack
