# ELTON OS — Prompt complet pour analyse externe & recommandations

> **À l'attention de l'IA consultée :** Ce document décrit exhaustivement un projet réel, son architecture, ses forces, ses limites, et les problèmes concrets à résoudre. Ton rôle est d'analyser, challenger, et proposer des solutions innovantes. Ne te limite pas à ce qui est déjà implémenté. Pense outside the box dans le respect des contraintes légales et éthiques.

---

## Sommaire

1. [Vision produit & positionnement](#1-vision-produit--positionnement)
2. [Architecture technique complète](#2-architecture-technique-complète)
3. [Fonctionnalités implémentées (inventaire exhaustif)](#3-fonctionnalités-implémentées)
4. [Sourcing : ce qui marche, ce qui bloque](#4-sourcing--ce-qui-marche-ce-qui-bloque)
5. [Le problème central à résoudre](#5-le-problème-central-à-résoudre)
6. [Contraintes absolues (non négociables)](#6-contraintes-absolues)
7. [Concurrents & état de l'art](#7-concurrents--état-de-lart)
8. [Pistes explorées et leurs résultats](#8-pistes-explorées-et-leurs-résultats)
9. [Questions ouvertes pour l'IA consultée](#9-questions-ouvertes-pour-lia-consultée)
10. [Données techniques pour analyse](#10-données-techniques-pour-analyse)

---

## 1. Vision produit & positionnement

### Ce qu'est ELTON OS

ELTON OS est un **cockpit de recherche d'opportunités pour cadres dirigeants** (Directeur Commercial, DG, VP Sales, Country Manager, etc.). C'est une application Next.js 16 auto-hébergée (localhost ou serveur privé) qui couvre l'intégralité du cycle de vie d'une recherche d'emploi exécutive :

```
Sourcing → Scoring → Dossier candidature → Candidature → Pipeline → CRM
```

### Positionnement différenciant

- 🎯 **Focus exclusif cadres dirigeants** (pas de stages, pas de juniors, pas de tech)
- 🇫🇷 **Priorité France / marché français / francophone**
- 🛡️ **Contrôle humain total** — aucune candidature automatique, aucun Submit
- ✨ **Qualité premium** — CV 3 templates, photo, 4 langues, pack complet
- ⚖️ **Conformité absolue** — pas de scraping illégal, pas de contournement CAPTCHA

### Promesse produit

> "ELTON OS vous prépare à postuler mieux, pas à spammer plus."

### Profil utilisateur cible

- **Elton Duarte** — Directeur Commercial, 20 ans d'expérience
- Localisation : Aix-en-Provence / PACA / France
- Secteurs : Industrie, SaaS, Distribution B2B
- Langues : Français (natif), Anglais (courant), Espagnol (professionnel), Portugais
- Rémunération cible : 120-180K€ + variable 30%
- Recherche : postes de direction commerciale, France prioritaire, remote Europe accepté

---

## 2. Architecture technique complète

### Stack

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 16 App Router + Turbopack, React 19, inline styles (CSS variables) |
| Backend | Next.js API Routes + Server Actions (`"use server"`) |
| Base de données | SQLite via Prisma 5 (`npx prisma db push`) |
| IA | DeepSeek API (v4-flash, v4-pro) avec fallback local |
| Tests | Vitest (698 tests unitaires), Playwright (38 tests E2E) |
| Extension Chrome | Manifest V3, 2 onglets (Import + Autofill), setNativeValue React-safe |
| Browser Agent | Playwright (headful) — utilisé uniquement sur action explicite |
| Déploiement | Localhost ou serveur privé (pas de cloud pour l'instant) |

### Modèles Prisma clés (30+ modèles)

```
Profile, CVMaster, Experience, Skill, ProofEntry
Job, JobScore, RawJob, ApplicationDraft, ImportSource, JobSearchRun
RecruiterContact, CompanyTarget, ContactInteraction
RadarCandidate, BrowserSearchConfig, SourcingRun, SourcingReport
Opportunity, DuplicateGroup, Document
Setting, AIPrompt
```

### Flux principal

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. SOURCING                                                      │
│    Cron quotidien → 12 sources ATS (Greenhouse/Lever/Ashby)     │
│    → fetch JSON API → filterJobForTargetProfile()               │
│    → detectInternationalCompatibility()                          │
│    → create Job + JobScore                                       │
│                                                                   │
│ 2. SCORING                                                        │
│    quick-score.ts (local, 0-100) basé sur le profil              │
│    Filtre : titre direction commerciale, localisation, secteur   │
│                                                                   │
│ 3. CANDIDATURE                                                    │
│    prepareApplication() → DeepSeek génère :                      │
│    • CV adapté (3 templates : ATS, Moderne, Premium)            │
│    • Lettre longue + courte                                       │
│    • Email candidature                                            │
│    • Message recruteur                                            │
│    • Réponses ATS                                                 │
│                                                                   │
│ 4. AUTOFILL (Extension Chrome V2.3.3)                            │
│    → Charge /api/application-drafts/[id]/autofill               │
│    → Détecte champs formulaire ATS                                │
│    → Remplit via setNativeValue (React-safe)                     │
│    → Jamais de Submit                                             │
│                                                                   │
│ 5. PIPELINE                                                       │
│    sent → follow_up_due → recruiter_replied → interview → offer  │
│                                                                   │
│ 6. CRM                                                            │
│    Contacts, cabinets, interactions, relances, notes             │
└─────────────────────────────────────────────────────────────────┘
```

### Structure du projet (fichiers clés)

```
lib/
  jobs/
    types.ts                    # ImportedJob, JobConnector, SearchQuery, SourceCapability
    worker.ts                   # Orchestrateur d'import (ALL_CONNECTORS, CONNECTOR_MODE)
    profile-filter.ts           # filterJobForTargetProfile() + detectInternationalCompatibility()
    quick-score.ts              # Scoring local 0-100 sans IA
    application-preparer.ts     # prepareApplication() — génération IA complète
    application-pipeline.ts     # Pipeline candidature
    application-analytics.ts    # Analytics
    application-postprocess.ts  # Post-process IA (langues, LinkedIn, rémunération)
    dedupe.ts                   # Déduplication externalId/sourceUrl/checksum
    connectors/
      public-ats.ts             # Greenhouse, Lever, Ashby, SmartRecruiters APIs
      france-travail.ts         # France Travail OAuth2
      generic-jsonld.ts         # JSON-LD crawler pages carrière
      browser-agent-connector.ts # Playwright headful
    parsers/
      jsonld-job-parser.ts      # Extraction JSON-LD JobPosting
    text-sanitizer.ts           # Nettoyage Markdown, placeholders, HTML
    source-capability-scanner.ts # Classification AUTO_ATS/USER_ASSISTED/MANUAL
  actions/
    autofill.ts                 # mapDraftToFormFields()
    source-scanner.ts           # scanAllSources()...
    crm.ts                      # 11 server actions CRM
    profile.ts                  # getProfile, upsertProfile
  cv-render/
    build-data.ts               # buildCvRenderData() — pure function
    normalize-compensation.ts   # normalizeCompensationTarget()

app/
  api/jobs/cron/sourcing/       # POST cron, GET latest, GET dashboard
  api/jobs/cron/sourcing/latest/ # Rapport sécurisé (token)
  api/jobs/source-scanner/      # scan, list, import-source
  api/jobs/importer/extension/  # Import Express extension
  api/jobs/quick-score/         # Re-scoring
  api/application-drafts/[id]/autofill/ # Autofill API
  api/crm/contacts/             # CRUD contacts CRM
  (app)/dashboard/jobs/         # Sourcing (liste, filtres, imports)
  (app)/dashboard/jobs/source-scanner/ # Audit 37 sources
  (app)/dashboard/jobs/importer/ # Import Express + extension
  (app)/dashboard/jobs/autofill/ # Page validation autofill
  (app)/dashboard/jobs/crm/     # CRM Carrière
  (app)/dashboard/jobs/pipeline/ # Pipeline candidatures
  (app)/dashboard/jobs/analytics/ # Analytics
  (app)/profil/                  # Profil exécutif (photo, langues, chips JSON, CV préfs)
  (app)/profil/autofill-preferences/ # Préférences autofill

browser-extension/elton-os-importer/
  manifest.json                 # Manifest V3 v2.3.3
  popup.html                    # 2 onglets (Import + Autofill)
  popup.js                      # 650+ lignes — détection, setNativeValue, fillDetectedFields
  README.md
  icons/

prisma/schema.prisma            # 30+ modèles
```

---

## 3. Fonctionnalités implémentées (inventaire exhaustif)

### Sourcing & import

| Fonctionnalité | Statut | Détail |
|---------------|--------|--------|
| France Travail API | ✅ | OAuth2, pagination, ~17 offres |
| Greenhouse API | ✅ | 12 companies (Stripe, Airbnb, Doctolib…) — 500-750 offres/board |
| Lever API | ✅ | Palantir — 238 offres |
| Ashby API | ✅ | Linear, Perplexity, Cursor — 26-104 offres |
| JSON-LD crawler | ✅ | 20 pages carrière FR |
| Source Scanner | ✅ | Audit 37 sources, classification AUTO_ATS/USER_ASSISTED/MANUAL |
| Cron quotidien | ✅ | Filtre profil + international, max 200 jobs/jour |
| Déduplication | ✅ | externalId > sourceUrl > checksum |
| Import Express (manuel) | ✅ | Copier-coller annonce → parsing → création Job |
| Extension Chrome Import | ✅ | Onglet Import : détection plateforme, extraction, envoi |

### Scoring & filtrage

| Fonctionnalité | Statut | Détail |
|---------------|--------|--------|
| Scoring local | ✅ | 0-100, 8 dimensions (titre, secteur, localisation, skills…) |
| Filtre profil Directeur Commercial | ✅ | `filterJobForTargetProfile()` — 638 tests |
| Politique internationale | ✅ | Marché France/francophone/remote Europe uniquement |
| Rejet US-only/UK-only/Germany-only | ✅ | `detectInternationalCompatibility()` |
| Scoring DeepSeek | ✅ | Fallback local si DeepSeek indisponible |

### Candidature

| Fonctionnalité | Statut | Détail |
|---------------|--------|--------|
| CV adapté IA | ✅ | DeepSeek, 3 templates, 4 langues, photo |
| CV ATS Classique | ✅ | 1 colonne, compatible ATS |
| CV Moderne Exécutif | ✅ | Sidebar gauche, photo ronde |
| CV Premium Leadership | ✅ | Header sombre, timeline, 2 colonnes |
| Lettre longue + courte | ✅ | Détection cabinet de recrutement |
| Email candidature | ✅ | Signature complète |
| Message recruteur | ✅ | Concis |
| Réponses ATS | ✅ | 2+ réponses par offre |
| Export PDF/DOCX/TXT | ✅ | @page A4, marges pro |
| Nettoyage Markdown | ✅ | `cleanGeneratedApplicationText()` |
| Post-process langues | ✅ | `ensureProfileLanguagesInText()` |
| LinkedIn masqué par défaut | ✅ | `cvIncludeLinkedIn=false` |
| Rémunération absente si invalide | ✅ | `normalizeCompensationTarget()` |

### Extension Chrome (V2.3.3)

| Fonctionnalité | Statut | Détail |
|---------------|--------|--------|
| Import annonce | ✅ | Détection plateforme, extraction texte, envoi API |
| Autofill formulaire | ✅ | 30+ labels FR/EN, setNativeValue React-safe |
| Détection champs ATS | ✅ | Greenhouse, Lever, Ashby, SmartRecruiters, Workable |
| Protection champs existants | ✅ | `skipped_existing` par défaut |
| Upload CV manuel | ✅ | `manual_required` — jamais automatique |
| Aucun Submit | ✅ | Zéro `.click()` dans le code |
| Permissions minimales | ✅ | activeTab, scripting, storage — pas de `<all_urls>` |

### Pipeline & Analytics

| Fonctionnalité | Statut |
|---------------|--------|
| Pipeline (sent→interview→offer) | ✅ |
| Analytics (source, template, secteur) | ✅ |
| Rapports sourcing (latest, dashboard) | ✅ |

### CRM Carrière (V2.4)

| Fonctionnalité | Statut |
|---------------|--------|
| Contacts (recruteurs, cabinets…) | ✅ |
| Interactions (email, appel, LinkedIn…) | ✅ |
| Relances planifiées | ✅ |
| Liaison contact ↔ candidature | ✅ |

---

## 4. Sourcing — ce qui marche, ce qui bloque

### ✅ Sources qui fonctionnent (import automatique)

| Source | Type | Volume/jour estimé | Méthode |
|--------|------|-------------------|---------|
| **Greenhouse** (8 companies) | API JSON | ~3000 offres brutes → ~5-10 qualifiées | `api.greenhouse.io/v1/boards/X/jobs` |
| **Lever** (Palantir) | API JSON | ~238 offres → ~2-5 qualifiées | `api.lever.co/v0/postings/X?mode=json` |
| **Ashby** (3 companies) | API JSON | ~200 offres → ~2-3 qualifiées | `api.ashbyhq.com/posting-api/job-board/X` |
| **France Travail** | API OAuth2 | ~17 offres | API gouvernementale |
| **JSON-LD pages carrière** | HTML parsing | ~0-5 offres | 20 pages carrière FR |
| **Total auto/jour** | | **~5-15 offres qualifiées** | Après filtre profil + international |

### ❌ Sources bloquées (inaccessibles en automatique)

| Source | Bloqueur | Raison | Volume potentiel estimé |
|--------|----------|--------|------------------------|
| **LinkedIn Jobs** | Auth wall, rate limiting, CGU interdiction | Nécessite login + session + JS rendering. Bloque les headless browsers. | 50-200 offres/jour |
| **Indeed** | Cloudflare, DataDome, CGU | Protection anti-bot agressive. Même avec Playwright headful, détection après 3-5 pages. | 30-100 offres/jour |
| **APEC** | Site Jahia, pas d'API, login obligatoire | Site legacy sans API, login requis pour voir les offres. | 10-30 offres/jour |
| **Cadremploi** | Cloudflare + DataDome | 403 systématique. Blocage total. | 10-20 offres/jour |
| **HelloWork** | API fermée | Pas d'API publique. | 5-15 offres/jour |
| **Jobijoba** | API 404 | Pas d'API publique. | 10-25 offres/jour |
| **Meteojob** | API 404 | Pas d'API publique. | 5-15 offres/jour |
| **Monster.fr** | 301 redirect, pas d'API | API publisher nécessite une clé partenaire. | 10-25 offres/jour |
| **Welcome to the Jungle** | Next.js SPA, pas d'API | Site entièrement React, données chargées dynamiquement. | 5-10 offres/jour |
| **Jooble** | Cloudflare Challenge | Protection JS obligatoire. | 10-30 offres/jour |
| **ChooseYourBoss** | Cloudflare Challenge | Protection JS obligatoire. | 5-10 offres/jour |
| **Talent.com** | API token requis | `Missing Authentication Token` | 15-40 offres/jour |

### ⚠️ Sources partiellement fonctionnelles

| Source | Statut | Limite |
|--------|--------|--------|
| **Browser Agent (Playwright)** | Semi-fonctionnel | LinkedIn/Indeed/APEC — nécessite login manuel, session courte (24h max), détection anti-bot après quelques pages. Volumes très faibles. |
| **Import Express (manuel)** | Fonctionnel | 1 annonce à la fois — l'utilisateur copie/colle. Pas scalable. |
| **Extension Chrome** | Fonctionnel | 1 annonce à la fois — détection + envoi. Pas de bulk import. |

---

## 5. Le problème central à résoudre

### Le goulot d'étranglement

```
Volume quotidien actuel : 5-15 offres qualifiées
Volume souhaité :         30-50 offres qualifiées
Gap :                     ~3-5x
```

### Pourquoi le volume est limité

1. **Les APIs ATS (Greenhouse/Lever/Ashby) sont excellentes** mais ne couvrent que ~12 entreprises. Il faut plus de companies.
2. **Les 14 plateformes bloquées** représentent le vrai gisement d'offres françaises. Elles sont inaccessibles en automatique.
3. **Le filtre profil est très strict** (ce qui est voulu — qualité > quantité) mais il filtre ~97% des offres ATS (972 fetchées → 3 gardées).
4. **Le Browser Agent (Playwright headful) est trop fragile** : sessions courtes, détection anti-bot, impossible de scaler.
5. **L'Import Express manuel est trop lent** pour un usage quotidien à volume.

### Ce dont on a besoin

Une solution qui :
- **Augmente le volume d'offres importées de 3x à 5x**
- **Ne contourne pas les CGU** de LinkedIn/Indeed/APEC
- **Ne risque pas le blocage de compte** utilisateur
- **Ne fait pas de candidature automatique**
- **Reste dans le cadre légal** (RGPD, droit français/européen)
- **Fonctionne avec un profil unique** (pas de compte partagé, pas de proxy rotating)

---

## 6. Contraintes absolues (non négociables)

### Règles légales & éthiques

1. ❌ **Pas de scraping LinkedIn/Indeed/APEC** — leurs CGU l'interdisent explicitement
2. ❌ **Pas de contournement CAPTCHA/login** — illégal (CFAA aux US, équivalent EU)
3. ❌ **Pas de faux comptes** ou d'usurpation d'identité
4. ❌ **Pas de candidature automatique** — l'utilisateur valide toujours
5. ❌ **Pas de clic automatique sur Postuler/Apply/Submit**
6. ❌ **Pas de lecture de messages privés** d'autres utilisateurs
7. ❌ **Pas d'usage de cookies/tokens** d'autres utilisateurs
8. ✅ **User-agent clair** : `ELTON-OS/2.4`
9. ✅ **Rate limiting** raisonnable (500ms entre requêtes)
10. ✅ **Données stockées localement** (SQLite, pas de cloud)

### Règles techniques

- `no-explicit-any` doit rester à 0
- `no-unused-vars` doit rester à 0
- Les 698 tests existants ne doivent pas casser
- La base SQLite est locale — pas de migration lourde

---

## 7. Concurrents & état de l'art

### Ce que font les concurrents

| Concurrent | Auto-apply | Sourcing | Extension | CV | Prix |
|-----------|:---:|:---:|:---:|:---:|----:|
| **Job Copilot** | ✅ Massif | ❌ | ✅ Autofill | ✅ | $9-29/mo |
| **LazyApply** | ✅ Spam | ❌ | ✅ Form fill | ✅ | $39-99/mo |
| **Massive** | ✅ Auto | ❌ | ✅ | ✅ | $39/mo |
| **Sonara** | ✅ Auto | ❌ | ❌ | ✅ | $49/mo |
| **Simplify** | ❌ | ❌ | ✅ Autofill | ✅ | Gratuit |
| **Huntr** | ❌ | ❌ | ✅ Save jobs | ✅ | $15-40/mo |
| **Teal** | ❌ | ❌ | ✅ Save jobs | ✅ | $9-29/mo |
| **ELTON OS** | ❌ (refusé) | ✅ Unique | ✅ V2.3.3 | ✅ Premium | Gratuit (OSS) |

### Analyse

**Forces d'ELTON OS vs concurrents :**
- ✅ **Seul à faire du sourcing automatique** (tous les autres sont des outils de candidature manuelle)
- ✅ **Seul à avoir un vrai filtre profil** avec scoring et politique internationale
- ✅ **CV premium supérieur** (3 templates, photo, 4 langues)
- ✅ **Pack candidature complet** (CV + lettres + email + ATS)
- ✅ **Contrôle humain total** — pas de risque de candidature erreur
- ✅ **100% gratuit et open-source**

**Faiblesses vs concurrents :**
- ❌ **Volume d'offres limité** — les concurrents ne sourcent pas, donc ils n'ont pas ce problème
- ❌ **Pas d'autofill LinkedIn Easy Apply** — Simplify/Job Copilot le font (avec auto-submit)
- ❌ **Pas de matching sémantique avancé** — Teal et Huntr ont du NLP
- ❌ **Interface desktop uniquement** (localhost) — les concurrents sont SaaS
- ❌ **Pas de version mobile**

### Question stratégique

> Les concurrents ont choisi la voie du **volume par auto-submit** (spam de candidatures). ELTON OS a choisi la voie de la **qualité par sourcing intelligent** (moins d'offres mais mieux ciblées). Est-ce le bon positionnement ? Peut-on avoir les deux : volume élevé ET qualité sans auto-submit ?

---

## 8. Pistes explorées et leurs résultats

| Piste | Résultat | Pourquoi ça n'a pas marché |
|-------|----------|---------------------------|
| **Scraping HTML LinkedIn/Indeed** | ❌ Échec | Pages rendues en JS, auth wall, rate limiting |
| **APIs non documentées LinkedIn/Indeed** | ❌ Échec | Nécessitent des tokens d'auth + violent les CGU |
| **Bookmarklet JavaScript** | ❌ Échec | CSP bloque `javascript:` URLs. `window.open()` bloqué. |
| **Browser Agent Playwright headless** | ❌ Échec | Détection anti-bot immédiate |
| **Browser Agent Playwright headful** | ⚠️ Semi | Fonctionne mais sessions courtes (24h), login manuel, pas scalable |
| **APIs partenaires (Indeed Publisher)** | ❌ Échec | Nécessite une clé partenaire (entreprise) |
| **RSS / Sitemap** | ❌ Échec | 0 source sur 37 propose un flux RSS |
| **JSON-LD pages carrière** | ⚠️ Faible | 0 résultat sur 21 pages (React/SPA sans JSON-LD) |
| **France Travail API** | ✅ Succès | OAuth2, ~17 offres — limité par le catalogue FT |
| **APIs ATS (Greenhouse/Lever/Ashby)** | ✅ Succès | 12 companies, 500-750 offres/board — mais limité en companies FR |
| **Extension Chrome Import Express** | ✅ Succès | MVP fonctionnel, 1 offre à la fois |

---

## 9. Questions ouvertes pour l'IA consultée

### Sourcing & volume

1. **Comment augmenter le volume d'offres quotidiennes de 3x à 5x sans violer les CGU de LinkedIn/Indeed/APEC ?**

2. **Existe-t-il des APIs partenaires ou des flux de données légaux** que nous n'aurions pas explorés ? Par exemple :
   - Des agrégateurs B2B qui revendent des données d'offres d'emploi ?
   - Des flux XML/JSON publics qu'on aurait manqués ?
   - Des partenariats possibles avec des job boards ?

3. **Comment trouver plus de companies sur Greenhouse/Lever/Ashby** qui recrutent en France ou pour le marché français ? Y a-t-il un annuaire, une liste, une méthode de découverte ?

4. **Le modèle "Import Express" (copier-coller manuel) peut-il être rendu plus efficace** sans dériver vers du scraping ? Par exemple :
   - Une extension Chrome qui suggère des URLs à ouvrir ?
   - Un workflow qui pré-remplit le copier-coller ?
   - Un bookmarklet amélioré ?

5. **Peut-on utiliser les API Google Jobs / Google for Jobs** pour découvrir des offres ? Schema.org JobPosting est indexé par Google.

6. **Les réseaux sociaux professionnels (LinkedIn, mais aussi Twitter/X, Facebook Jobs) ont-ils des APIs exploitables ?**

7. **Y a-t-il des techniques de "page scraping éthique"** qui respectent les CGU ? Par exemple :
   - Rate limiting très agressif (1 requête toutes les 30 secondes) ?
   - Utilisation exclusive de pages publiques sans login ?
   - Parsing de la version imprimable ou texte seul ?

### Architecture & scalabilité

8. **L'architecture actuelle (SQLite local) est-elle la bonne pour scaler ?** Faut-il migrer vers PostgreSQL ? Vers une archi cloud ?

9. **Le filtre profil rejette 97% des offres ATS** (972 fetchées → ~30 gardées). Est-ce trop strict ? Faut-il un mode "découverte" qui assouplit les critères ?

10. **Faut-il un matching sémantique (embeddings, vector search)** pour améliorer la pertinence au lieu de mots-clés ?

### Extension Chrome & Autofill

11. **Les concurrents (Simplify, Job Copilot) arrivent à faire de l'autofill sur LinkedIn Easy Apply.** Comment font-ils techniquement ? Peut-on le faire sans auto-submit ?

12. **Peut-on détecter et remplir les formulaires ATS de manière plus robuste** qu'avec des sélecteurs CSS + labels ?

13. **Faut-il migrer l'extension vers une approche "content script injecté en continu"** plutôt que "injection à la demande via scripting API" ?

### Stratégie & positionnement

14. **Le positionnement "qualité > volume sans auto-submit" est-il viable commercialement ?** Ou faut-il accepter un certain niveau d'automatisation ?

15. **Quel est le modèle économique optimal** pour ELTON OS ? SaaS ? Licence ? Service ?

16. **Quelles fonctionnalités manquent cruellement** par rapport aux concurrents ? Qu'est-ce qui ferait basculer un utilisateur de Teal/Huntr vers ELTON OS ?

### IA & génération

17. **Le prompting IA actuel (DeepSeek v4) est-il optimal ?** Faut-il un modèle plus puissant pour la génération de CV ?

18. **Faut-il un fine-tuning sur des CV de cadres dirigeants français** pour améliorer la qualité ?

---

## 10. Données techniques pour analyse

### Volume de sourcing actuel

```
Run J3 typique (6 sources ATS, cron quotidien) :
  Offres fetchées :    972
  Rejetées par profil : 969 (97.4%)
  Internationales acceptées : 1
  Internationales rejetées : 189
  Créées (nouvelles) : 0-3 (déjà dédupliquées)
  
Base de données :
  24 jobs "new" (propres, France uniquement)
  2 jobs "shortlisted"
  87 jobs "archived" (pollution nettoyée)
```

### Companies ATS actives (12)

```
Greenhouse : stripe(512), airbnb(226), databricks(758), figma(164),
             doctolib(186), robinhood(142), coinbase(103), brex(234)
Lever :      palantir(238)
Ashby :      linear(26), perplexity(74), cursor(104)
```

### Sources françaises bloquées (14)

```
LinkedIn, Indeed, APEC, Cadremploi, HelloWork, Jobijoba, Meteojob,
Monster, WTTJ, Jooble, ChooseYourBoss, Talent.com, Keljob, RegionsJob
```

### Tests

```
698 tests unitaires (Vitest)
25 fichiers de test
0 mock — toutes les fonctions sont pures et testables
```

### Taille du code

```
~150 fichiers source (.ts/.tsx)
~40 000 lignes de code
~15 docs markdown
1 extension Chrome (Manifest V3, ~650 lignes JS)
```

---

## Format de réponse attendu

Pour chaque piste ou recommandation, merci de structurer la réponse ainsi :

```
### Piste : [Titre]

**Faisabilité technique :** [Haute / Moyenne / Faible]
**Effort estimé :** [Heures / Jours / Semaines]
**Impact sur le volume :** [X offres/jour supplémentaires]
**Risques :** [Légal, technique, éthique]

**Description :** [Détail de la solution]
**Exemple d'implémentation :** [Code ou pseudo-code si pertinent]
**Références :** [Concurrents qui le font, APIs, doc]
```

---

**Merci pour ton analyse approfondie. Challenge tout. Ne te censure pas.**
