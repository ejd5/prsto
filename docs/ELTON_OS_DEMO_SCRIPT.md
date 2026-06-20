# ELTON OS — Script de démonstration (5-7 minutes)

> Public : recruteurs, investisseurs, cadres dirigeants
> Objectif : montrer la valeur sans dépendre de données réelles

---

> **Règle safe-by-default :** Les données `[DEMO]` sont exclues par défaut. Elles ne sont visibles qu'avec `?demo=true`. En mode normal, le filtrage exclut automatiquement toute donnée taguée `[DEMO]`.

## Activation rapide (30s)

1. Ouvrir `/dashboard/jobs?demo=true`
2. Cliquer sur **"Créer les données démo"**
3. 10 offres, 6 candidatures, pipeline complet sont créés automatiquement
4. La carte démo affiche les stats en temps réel

> Toutes les données sont préfixées `[DEMO]`. Suppression en 1 clic. Aucune donnée réelle touchée.

---

## Scénario

Vous êtes un Directeur Commercial qui cherche un nouveau poste en PACA ou Île-de-France. Vous voulez que l'IA prépare vos candidatures, suive vos relances, et vous donne des analytics.

---

## Étape 1 — Dashboard sourcing (30s)

**URL :** `/dashboard/jobs`

**Montrer :**
- La carte "Agent prêt" (ou "Configuration en cours") avec le score de complétion
- Les badges de section cliquables (Identité, CV Maître, Sources…)
- Expliquer : "ELTON OS évalue en temps réel si votre agent est prêt à travailler"

**Message :** "Avant même de chercher des offres, ELTON OS vérifie que votre profil, CV, compétences et sources sont configurés. Un score vous dit exactement où vous en êtes."

---

## Étape 2 — Onboarding guidé (30s)

**URL :** `/demarrage`

**Montrer :**
- Le wizard 10 étapes
- Cliquer sur "Identité" pour montrer les champs
- Expliquer le stepper et la navigation

**Message :** "Un onboarding en 10 étapes vous guide pour tout configurer. Identité, ciblage géographique, expériences, CV maître, sources d'offres et modules IA."

---

## Étape 3 — Offres importées (45s)

**URL :** `/dashboard/jobs`

**Montrer :**
- La liste d'offres avec badges PACA/IDF/France/INTL
- Les scores (ex: 82%, 67%)
- Les boutons "Shortlist" et "Préparer candidature IA"

**Message :** "ELTON OS importe automatiquement des offres depuis France Travail, LinkedIn, Indeed, APEC et des sites corporate. Chaque offre est scorée sur 7 critères : matching exécutif, localisation, salaire, fraîcheur, entreprise, risque. Les priorités géographiques sont configurables — ici PACA et IDF en priorité."

---

## Étape 4 — Préparation de candidature IA (60s)

**Action :** Cliquer sur "Préparer candidature IA" sur une offre

**Montrer :**
- Le dossier généré
- Onglet "Analyse" : points forts/gaps/risques, score de matching
- Onglet "CV adapté" : CV personnalisé pour l'offre
- Onglet "Lettre" : lettre longue + version courte
- Onglet "Email" : email + message recruteur

**Message :** "En un clic, l'IA analyse l'offre, compare avec votre profil et votre CV maître, et génère un dossier complet : CV adapté, lettre de motivation, email et réponses aux formulaires ATS. Tout est vérifié — l'IA n'invente jamais d'expérience ou de diplôme."

---

## Étape 5 — Candidature assistée (45s)

**Action :** Cliquer sur "Candidature assistée"

**Montrer :**
- Les 11 champs pré-remplis (nom, email, téléphone, lettre, message recruteur…)
- Les scores de confiance
- Les alertes champs manquants
- Le message "Aucune candidature n'est envoyée automatiquement"

**Message :** "Quand vous postulez sur un site, ELTON OS pré-remplit tous les champs pour vous. Vous copiez, vous collez, vous envoyez. L'outil ne postule jamais à votre place. Une fois envoyé, vous marquez la candidature comme envoyée."

---

## Étape 6 — Pipeline + Relances (60s)

**URL :** `/dashboard/jobs/pipeline`

**Montrer :**
- Le Kanban 8 colonnes : Envoyées, À relancer, Relancées, Réponse reçue, Entretien, Offre
- La bannière "X candidatures à relancer aujourd'hui"
- Cliquer sur une carte → modal relance
- Les 4 formats : email court, LinkedIn, formel, ultra court
- Bouton "Copier"

**Message :** "Chaque candidature entre dans un pipeline visuel. Quand un recruteur ne répond pas sous 7 jours, ELTON OS vous alerte et génère 4 messages de relance — email, LinkedIn, formel, ou ultra court. Vous copiez, vous envoyez, vous marquez. Aucun envoi automatique."

---

## Étape 7 — Analytics (30s)

**URL :** `/dashboard/jobs/analytics`

**Montrer :**
- Les 6 cartes KPI (envoyées, réponses, entretiens, offres…)
- L'entonnoir de candidature
- Le tableau par source
- L'onglet "Alertes" : relances dues + candidatures à fort score sans réponse

**Message :** "Enfin, ELTON OS mesure votre performance : taux de réponse, taux d'entretien, taux d'offre, délai moyen avant réponse. Vous savez quelles sources performent le mieux et quelles candidatures méritent une relance."

---

## Conclusion (15s)

**Message final :** "ELTON OS est un copilote IA pour cadres dirigeants. Il trouve les offres, prépare les dossiers, suit les candidatures et optimise votre recherche — sans jamais envoyer quoi que ce soit automatiquement. L'humain reste aux commandes."

---

## Checklist pré-démo

- [ ] Avoir des offres importées (sinon lancer un import manuel)
- [ ] Avoir un profil configuré (sinon passer par /demarrage)
- [ ] Avoir au moins un dossier de candidature prêt
- [ ] Avoir une candidature marquée "envoyée" (pour montrer le pipeline)
- [ ] Vérifier que DeepSeek est connecté (pour la génération IA)
- [ ] Ouvrir en plein écran (Cmd+Shift+F)
- [ ] Cacher la sidebar si nécessaire pour plus d'espace

---

## Préparer les données démo

Avant une démonstration, peupler la base avec des données fictives [DEMO] pour éviter de montrer des données personnelles.

### Activation du mode démo

1. Ouvrir `/dashboard/jobs?demo=true`
2. Cliquer **"Créer les données démo"** — bouton violet

La carte démo affiche :
- Nombre d'offres, candidatures, relances dues, réponses
- Liens vers Pipeline démo et Analytics démo (conservent `?demo=true`)
- Bouton "Supprimer données démo"

### Ce que `createDemoData()` crée

| Ressource | Quantité | Détail |
|-----------|----------|--------|
| Sources | 5 | LinkedIn, APEC, France Travail, WTTJ, Michael Page |
| Offres | 10 | Scores 45-91, 4 zones géographiques (PACA×4, IDF×2, France×2, Intl×2) |
| Scores | 10 | 7 dimensions, actions recommandées (apply/shortlist/review/skip) |
| Drafts | 6 | 1 draft, 1 envoyé avec relance due, 1 relancé, 1 réponse reçue, 1 entretien, 1 refusé |
| Session assistée | 1 | Pour le draft envoyé |

### Pipeline démo

- Colonne **Envoyées** : 1 carte (relance due, overdue badge)
- Colonne **À relancer** : 1 carte (followUpDueAt dépassé de 3 jours)
- Colonne **Relancées** : 1 carte (relancé il y a 2 jours)
- Colonne **Réponse reçue** : 1 carte
- Colonne **Entretien** : 1 carte (demain)
- Colonne **Refusées** : 1 carte

### Analytics démo

- KPIs non vides (10 envoyées, 2 réponses, 1 entretien, 1 relance due…)
- bySource : 5 sources
- byScoreRange : 4 tranches
- byLocationPriority : PACA ×4, IDF ×2…
- weeklyActivity : 8 semaines
- topCompanies : top 10
- highScoreNoReply : candidatures ≥50% sans réponse

### Nettoyage après démo

Cliquer **"Supprimer données démo"** (bouton rouge dans la carte démo).

Toutes les données `[DEMO]` sont supprimées. Aucune donnée réelle touchée.

### API démo

| Route | Méthode | Description |
|-------|---------|-------------|
| `GET /api/demo/status` | GET | Statut des données démo |
| `POST /api/demo` avec `{action:"create"}` | POST | Créer les données démo |
| `POST /api/demo` avec `{action:"delete"}` | POST | Supprimer les données démo |

---

## Smoke test mode démo

Un script de smoke test valide le flux démo complet côté API :

```bash
# Prérequis : serveur Next.js lancé (npm run dev)
SMOKE_API_BASE=http://localhost:3000 npm run smoke:demo
```

Ce que le smoke test vérifie en 9 étapes :
1. GET /api/demo → status initial (hasDemoData: false)
2. POST /api/demo create → création dataset démo
3. GET /api/demo → hasDemoData: true, compteurs > 0
4. GET /api/jobs?demo=true → toutes les offres sont [DEMO]
5. GET /api/jobs → aucune offre [DEMO] (safe-by-default)
6. GET /api/jobs/application-pipeline?demo=true → drafts [DEMO]
7. GET /api/jobs/application-analytics?demo=true → KPIs non vides
8. POST /api/demo delete → suppression dataset
9. GET /api/demo → hasDemoData: false (nettoyé)

Le script nettoie automatiquement après lui-même. Aucune vraie donnée touchée.
