# CV Templates — ELTON OS V2.8.5

## Liste des 6 modèles

| Modèle | ID | Style | Usage recommandé |
|--------|----|-------|-------------------|
| **ATS Classique** | `ats_classic` | Colonne simple, sobre | Première candidature, ATS |
| **Moderne Exécutif** | `modern_executive` | Sidebar gauche colorée | Direction, comité exécutif |
| **Premium Leadership** | `premium_leadership` | 2 colonnes, champagne | Postes dirigeants, board |
| **Executive Bordeaux** | `executive_bordeaux` | Timeline, bordeaux | Direction, board, postes CAC 40 |
| **Strategic Blue** | `strategic_blue` | KPIs, bleu pétrole | Sales Director, Country Manager |
| **Minimal Luxe** | `minimal_luxe` | Épuré, champagne/noir | Cabinet de chasse, luxe, premium |

## Palettes

### ATS Classique
- Noir professionnel (#1a1a2e) / Gris (#333) / Fond blanc

### Moderne Exécutif
- Navy (#1B2A4A) / Champagne (#C8A64E) / Blanc

### Premium Leadership
- Champagne (#C8A64E) / Noir (#1a1a1a) / Gris (#666) / Fond blanc

### Executive Bordeaux
- Bordeaux (#5A1E2B) / Ivoire (#F7F3EC) / Charbon (#1F2933) / Gris doux (#E8E2DA)

### Strategic Blue
- Bleu pétrole (#17324D) / Steel blue (#2F5D7C) / Gris-bleu clair (#EAF1F6) / Graphite (#202833)

### Minimal Luxe
- Presque noir (#111111) / Champagne (#C9A85D) / Ivoire (#FAF7EF) / Gris chaud (#6F6A60)

## Différences clés

- **ATS Classique** : optimisé parsing automatique, zéro colonne, zéro tableau, polices système
- **Moderne Exécutif** : sidebar colorée avec contact + compétences, contenu à droite
- **Premium Leadership** : header sombre champagne, 2 colonnes, réalisations clés chiffrées
- **Executive Bordeaux** : timeline avec dots, fond ivoire, accents bordeaux, serif classique
- **Strategic Blue** : bandeau KPIs CA/équipe/croissance, layout business, compétences en blocs
- **Minimal Luxe** : centré, espace blanc généreux, ligne champagne subtile, footer discret

## Comportement Télécharger PDF

- Le bouton "Télécharger PDF" appelle l'endpoint `/api/application-drafts/[id]/documents/cv?template=<id>` avec `Content-Disposition: attachment`
- Le PDF est téléchargé directement (pas de boîte de dialogue print)
- Le bouton "Imprimer" est séparé et ouvre `window.print()` uniquement au clic utilisateur

## Modèle par défaut extension

- L'extension télécharge en **Premium Leadership** par défaut
- L'utilisateur peut sélectionner un autre modèle via le dropdown "Modèle CV" dans l'onglet Documents
- Les options disponibles dans l'extension : Premium Leadership, Executive Bordeaux, Strategic Blue, Minimal Luxe

## Template inconnu → fallback

Si un template ID inconnu est demandé, le système utilise `premium_leadership` automatiquement (pas d'erreur).

## Sections communes à tous les templates

- Identité (nom, titre, contact)
- Profil exécutif / Résumé
- Parcours professionnel (expériences)
- Compétences / Expertise
- Formation
- Langues
- Certifications

Les templates ne contiennent jamais : Markdown brut, placeholders `[Adresse]`, photo par défaut, inventions.
