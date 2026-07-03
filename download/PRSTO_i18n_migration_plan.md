# PRSTO — Plan migration i18n (FR / EN / ES)

## Objectif
Transformer PRSTO en application multilingue (français par défaut, anglais et espagnol en option) pour conquérir les marchés EU puis international.

## Stack recommandée
- **next-intl** (https://next-intl-docs.vercel.app/) — le standard i18n pour Next.js 16
- Compatible App Router, Server Components, Turbopack
- Gestion des namespaces, pluralisation, formats de date/nombre

## Architecture cible

### Structure des fichiers
```
messages/
├── fr.json          # Français (langue source, déjà en dur dans le code)
├── en.json          # Anglais (traduit via Riva Translate + review humaine)
└── es.json          # Espagnol (traduit via Riva Translate + review humaine)

src/i18n/
├── routing.ts       # Configuration des locales
├── request.ts       # Middleware de détection locale
└── navigation.ts    # API de navigation localisée

app/
├── [locale]/
│   ├── (app)/       # Toutes les routes protégées
│   ├── (public)/    # Toutes les routes publiques
│   └── layout.tsx   # Layout avec NextIntlClientProvider
```

### URLs
- `prsto.fr` → français (défaut)
- `prsto.io` → anglais (défaut)
- `prsto.es` → espagnol (défaut)
- OU `prsto.fr/fr`, `prsto.fr/en`, `prsto.fr/es` (sous-chemins)

## Plan d'exécution (10 jours estimés)

### Phase 1 — Setup (2 jours)
1. Installer next-intl : `npm install next-intl`
2. Créer `src/i18n/routing.ts` avec locales `['fr', 'en', 'es']`
3. Créer `src/i18n/request.ts` (middleware détection Accept-Language)
4. Déplacer `app/(app)` et `app/(public)` dans `app/[locale]/`
5. Créer `messages/fr.json` vide (structure)
6. Wrapper le layout root avec `NextIntlClientProvider`

### Phase 2 — Extraction des chaînes (3 jours)
Pour chaque fichier `.tsx` :
1. Identifier toutes les chaînes en dur (titres, labels, placeholders, messages)
2. Remplacer par `t('namespace.key')` ou `useTranslations('namespace')`
3. Ajouter la clé dans `messages/fr.json` avec la valeur française

**Fichiers prioritaires** :
- `app/(public)/prsto/page.tsx` + tous les composants `components/landing/*`
- `app/(app)/layout.tsx` (menu, sidebar)
- `app/(app)/conseiller/page.tsx`
- `app/(app)/cv-maitre/page.tsx`
- `app/(app)/opportunites/[id]/page.tsx`
- `app/(app)/dashboard/jobs/page.tsx`
- `app/(app)/proof-vault/page.tsx`
- `app/(app)/parametres/page.tsx`
- `app/(app)/guide/page.tsx`

**Estimation** : ~500-800 chaînes à extraire

### Phase 3 — Traduction automatique (1 jour)
Utiliser l'API `/api/translate` déjà en place :
1. Script Node qui lit `messages/fr.json`
2. Pour chaque clé, appelle `/api/translate` avec `targetLang=en`
3. Écrit le résultat dans `messages/en.json`
4. Idem pour `messages/es.json`

**Note** : Pour les textes longs (landing, guide), il faudra une review humaine.

### Phase 4 — Review humaine EN (2 jours)
- Faire relire `messages/en.json` par un anglophone natif
- Ajuster les formulations idiomatiques
- Particulièrement important pour :
  - Le ton du Conseiller IA (prompt système à traduire aussi)
  - Les tarifs (€ vs $)
  - Les références légales (USCIS vs Service-Public.fr)

### Phase 5 — Tests + déploiement (2 jours)
1. Tester les 3 locales en local
2. Configurer les sous-domaines (prsto.fr, prsto.io, prsto.es)
3. Ajouter un sélecteur de langue dans le footer + header
4. Déployer sur Vercel avec les domaines configurés
5. Tester le SEO (hreflang tags)

## Outils à utiliser

### Pour l'extraction automatique
```bash
# Installer i18n-parser
npm install -D i18n-parser

# Extraire les chaînes
npx i18n-parser --output messages/fr.json 'app/**/*.tsx'
```

### Pour la traduction
```bash
# Script Node utilisant notre API /api/translate
node scripts/translate-messages.js fr en
node scripts/translate-messages.js fr es
```

### Pour la review
- **DeepL** (gratuit pour petits volumes) — meilleure qualité que Google Translate
- **Crowdin** ou **Localazy** (plateformes de gestion de traduction collaborative)

## Budget estimé

| Poste | Coût |
|-------|------|
| Dev Phase 1 (setup) | 2 jours |
| Dev Phase 2 (extraction) | 3 jours |
| Traduction auto (Riva) | 0€ (gratuit via NVIDIA NIM) |
| Review humaine EN | 500-1000€ (freelance anglophone) |
| Review humaine ES | 300-600€ (freelance hispanophone) |
| Tests + déploiement | 2 jours |
| **Total** | **~10 jours dev + 1000€ traduction** |

## Risques et mitigations

| Risque | Mitigation |
|--------|-----------|
| Extraction manuelle fastidieuse | Utiliser i18n-parser + script semi-auto |
| Traduction IA imparfaite | Review humaine obligatoire pour les textes visibles |
| Performance (augmente bundle) | Code-splitting par locale |
| SEO multilingue | Configurer hreflang + sitemaps par locale |
| Extension Chrome non traduite | Phase 2 séparée (extension a son propre i18n) |

## Recommandation

Commencer par **Phase 1 + Phase 2 sur la landing uniquement** (3-4 jours). Ça permet de :
- Valider l'architecture next-intl
- Avoir la landing en EN pour les visiteurs US
- Mesurer l'impact SEO avant d'investir dans le dashboard

Le dashboard peut rester en FR dans un 1er temps (les dirigeants français sont la cible initiale).
