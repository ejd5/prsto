# PROMPT POUR ANTIGRAVITY

## Contexte général

PRSTO est une application Next.js 16.2.9 (Turbopack) avec Tailwind CSS v4, hébergée sur `/Users/duarteelton/Desktop/JOB PROJECT`.

L'application a subi un **pivot stratégique non commité** : passée d'une plateforme **candidat premium** (copilote carrière IA pour cadres dirigeants) à un outil **cabinet de recrutement B2B** (agence/recruteur). Les fichiers du pivot sont restés en working directory (untracked). Depuis, on est en train de **revenir à la vision originale candidate-first**, mais le code est un mélange des deux.

Le serveur tourne avec `npm run dev` sur `localhost:3000`.

---

## 1. Vision originale du projet

PRSTO (anciennement "Elton OS") est un **copilote carrière IA premium pour cadres dirigeants** (Directeurs, VP, CTO, etc.) en recherche d'emploi.

### Fonctionnalités prévues au départ :

| Module | Fichier | Statut |
|--------|---------|--------|
| **CV Maître** — importer/gérer son CV | `app/(app)/cv-maitre/page.tsx` | Existe, tracké |
| **Scoring d'offres** — analyse IA des offres | `app/(app)/opportunites/page.tsx` | Existe, tracké |
| **Détail offre** — analyse + matching | `app/(app)/opportunites/[id]/page.tsx` | Existe, tracké |
| **Préparation entretien** — brief IA | `app/(app)/entretiens/page.tsx` | Existe, tracké |
| **Pipeline candidatures** — kanban suivi | `app/(app)/dashboard/jobs/pipeline/page.tsx` | Existe, tracké |
| **Dashboard jobs** — suivi global | `app/(app)/dashboard/jobs/page.tsx` | Existe, tracké |
| **Documents** — CV, lettres, templates | `app/(app)/documents/page.tsx` | Existe, tracké |
| **Performance** — analytics KPIs | `app/(app)/performance/page.tsx` | Existe, tracké |
| **Assistant Recherche IA** — chat recherche web | `app/(app)/assistant-recherche/page.tsx` | **EN COURS** |
| **Landing page candidate** | `app/(public)/elton-os/page.tsx` | Supprimée (dans git, non restaurée) |

### Stack technique :
- Next.js 16.2.9 (Turbopack), Tailwind CSS v4
- Prisma + SQLite (`prisma/dev.db`)
- DeepSeek API (configuré dans settings)
- Firecrawl API (clé : `fc-2ede1712d78e40ff9e0feb7cf6024c84`, configurée dans `.env.local`)
- Base de données : opportunités, candidatures, pipeline, profil, etc.
- Design tokens : `--prsto-forest #103826`, `--prsto-gold #E4B118`, `--prsto-ivory #FAF6EF`

---

## 2. Ce qui a disparu pendant le pivot recruteur

Tous les fichiers **trackés** sont restés (candidat), mais le pivot a :

1. **Détourné la navigation** (`app/(app)/layout.tsx`) — NAV_SECTIONS pointe maintenant vers `/recruiter/` au lieu des pages candidat
2. **Remplacé le dashboard** (`app/(app)/page.tsx`) — affiche RecruiterCockpit au lieu de CandidateDashboard
3. **Supprimé la landing page** — `app/(public)/elton-os/page.tsx` effacée (visible dans git : `git show main:app/\(public\)/elton-os/page.tsx`)
4. **Changer les métadonnées** — `app/layout.tsx` titre "PRSTO — La plateforme des recruteurs indépendants"
5. **Ajouté tout un dossier untracked** `app/(public)/prsto/` avec landing recruteur
6. **Ajouté tous les fichiers recruteur** en untracked : `app/(app)/recruiter/*`, `components/dashboard/recruiter/*`, etc.

**Ce qui reste de la version candidate dans le git :**
- `git log` : 1 seul commit `a7ace3b Initial ELTON OS app baseline` (la version candidate originale)
- Les fichiers trackés sont la version candidate
- Les untracked = la version recruteur

---

## 3. LE PROBLEME — Assistant Recherche IA (recherche web)

**Ce qu'on veut :** Un chat à la ChatGPT où l'utilisateur colle son CV ou tape "cherche un poste de Directeur Commercial posté il y a moins de 24h" et l'assistant va **chercher sur le web** (pas seulement dans la base locale) pour trouver des offres.

### Ce qui a été tenté (et a échoué) :

**Tentative 1 : Fetch direct de Google / Indeed / DuckDuckGo**
- Google et DuckDuckGo retournent des CAPTCHA ou pages vides
- Indeed aussi quand fetch depuis un serveur Node.js classique
- **Bloqué** par anti-bot

**Tentative 2 : Scrapers existants**
- `scrapeSourceUrl()` de `lib/sourcing/connectors/html-scraper.ts` — Robert Walters retourne 403
- Michael Page rend la page mais sans les offres (rendu client-side)
- Les connecteurs ATS publics (Greenhouse, Lever, Ashby) nécessitent des company IDs précis
- France Travail nécessite des credentials OAuth (non configurés)
- Le Browser Agent (Playwright) nécessite une session utilisateur manuelle

**Tentative 3 : Firecrawl API**
- **FONCTIONNE** pour scraper des URLs individuelles (API key configurée dans `.env.local`)
- `curl -X POST https://api.firecrawl.dev/v1/scrape` avec `{"url": "https://michaelpage.fr/jobs/directeur-commercial"}` retourne les offres en markdown
- On a un parseur qui extrait les titres depuis le markdown
- Mais **Firecrawl n'a pas d'endpoint "search"** (leur API de search demande un plan supérieur)
- On est limité à des URLs connues 

**Ce qui marche en partie :**
- `lib/jobs/connectors/michael-page.ts` — le connecteur existant, mais il parse avec des regex fragiles
- `lib/actions/sourcing.ts` — `scrapeCustomUrl()` qui fetch une URL et utilise DeepSeek pour extraire les jobs

### Ce qu'il faudrait (solution idéale) :

Un **moteur de recherche jobs** qui :
1. Prend une requête libre (ex: "Directeur Commercial fintech Paris")
2. Cherche sur **tous les sites d'emploi** (LinkedIn, Indeed, WTJ, APEC, France Travail, Michael Page, Option Carrière, RegionsJob, Google Jobs)
3. Filtre par date (24h, 7 jours, etc.)
4. Agrège les résultats, déduplique
5. Les importe dans la base PRSTO
6. Les affiche dans le chat avec titre, entreprise, source

**Approche recommandée :**
- Firecrawl peut scraper n'importe quelle URL → créer une liste de ~30 URLs de recherche (sites d'emploi × mots-clés)
- Ou utiliser le Browser Agent Playwright (déjà dans le code) pour ouvrir un vrai navigateur = pas de CAPTCHA
- Ou intégrer SerpAPI / Brave Search API (payant mais fiable)

---

## 4. Fichiers clés à connaître

```
lib/actions/assistant-search.ts        ← le serveur action du chat
app/(app)/assistant-recherche/page.tsx ← le UI du chat
lib/ai/deepseek.ts                     ← connecteur IA (DeepSeek/OpenRouter)
lib/jobs/connectors/                   ← tous les connecteurs (Michael Page, France Travail, etc.)
lib/jobs/browser-agent/               ← Playwright pour navigation automatisée
lib/actions/opportunity.ts             ← CRUD offres d'emploi
.env.local                             ← Firecrawl API key (fc-2ede1712d78e40ff9e0feb7cf6024c84)
app/(app)/layout.tsx                   ← navigation sidebar
app/layout.tsx                         ← root layout + metadata
```

## 5. Commandes utiles

```bash
cd "/Users/duarteelton/Desktop/JOB PROJECT"
npm run dev                              # serveur local
npx next build                           # build + typecheck
tail -30 /tmp/next-dev.log | grep -i assistant  # logs assistant
git log --oneline                        # historique
git diff --stat                          # fichiers modifiés
git ls-tree -r main --name-only          # fichiers trackés
```
