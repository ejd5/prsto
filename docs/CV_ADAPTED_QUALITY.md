# ELTON OS — CV Adapté Quality

## Règles de nettoyage

### Marqueurs techniques supprimés
Le CV adapté ne doit jamais contenir :

- `POSTE TERMINÉ` / `POSTE ACTIF`
- `semanticScore`, `globalScore`, `executiveScore`
- `reasonCode`, `recommendedAction`
- `sendableToAI`, `confidence:`, `source:`
- `confirmed`, `unconfirmed`, `internal`
- `redFlagsJson`, `reasonsJson`

Ces marqueurs sont des données internes d'audit qui n'ont pas leur place dans un CV candidat.

**Helper** : `lib/jobs/cv-content-sanitizer.ts`

### Langues normalisées
Les langues sont dédupliquées et harmonisées :

- Déduplication insensible à la casse et aux accents
- Conservation du meilleur niveau connu
- Niveaux harmonisés : natif, courant, professionnel, intermédiaire, notions, à préciser
- Alias reconnus : FR → Français, EN → Anglais, ES → Espagnol, etc.

**Helper** : `lib/jobs/languages-normalizer.ts`

### Compétences groupées
Les compétences sont regroupées par thème pour éviter les listes répétitives :

- Savoir-faire stratégique : Direction commerciale, Pilotage P&L, Négociation, CRM/Pipeline...
- Savoir-être exécutif : Leadership, Management d'équipe, Communication & Influence...

**Helper** : `lib/jobs/skills-normalizer.ts`

## Titres de résumé personnalisés

Le titre de la section "Résumé" varie selon le poste ciblé :

| Poste | Titre utilisé |
|-------|-------------|
| Directeur Commercial | Profil de direction commerciale |
| Country Manager / DG | Profil de leadership marché |
| Sales Director / VP Sales | Direction commerciale orientée performance |
| Business Development | Profil développement & croissance |
| Directeur / Directrice | Profil de direction exécutive |
| Autres | Proposition de valeur exécutive |

## Contenu du résumé

Le résumé exécutif contient (4-7 lignes) :

1. Positionnement du candidat
2. Années d'expérience / profondeur
3. Périmètre commercial et secteurs
4. Management, P&L, croissance, transformation
5. Alignement avec l'annonce
6. 2-4 compétences clés pertinentes

## Savoir-faire / Savoir-être

Deux sections ajoutées dans le CV adapté :

**Savoir-faire stratégique** : Compétences métiers regroupées par thème
**Savoir-être exécutif** : Qualités de direction et leadership

Les suggestions IA reformulent en langage premium sans rien inventer. Le fallback local utilise un mapping par rôle.

## Quality Gate

Avant affichage/export, un quality gate vérifie :

- Aucun marqueur technique (error)
- Aucun "undefined", "null" (error)
- Contenu minimum 300 caractères (error)
- Langues dédupliquées (warning)
- Compétences dédupliquées (warning)
- Résidu JSON (warning)
- Score qualité calculé (0-100)

**Helper** : `lib/jobs/cv-quality-gate.ts`

## Anti-hallucination

- N'invente jamais une expérience, un diplôme, un chiffre ou une langue
- Reste ancré dans les données du profil et du Proof Vault
- Si IA indisponible, fallback local propre (templates locaux)
- Jamais de "candidat idéal", "profil parfait", "excellent candidat"
- Toute information non vérifiée est exclue
