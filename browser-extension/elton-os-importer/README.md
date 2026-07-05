# ELTON OS Importer Pro — Extension Chrome V2.8.4

Importez une annonce (onglet Import Pro), **remplissez les formulaires ATS** (onglet Autofill), et **joignez vos PDF** (onglet Documents) en un clic.

**Aucune candidature automatique. Jamais de Submit automatique. Aucun scraping.**

**Nouveau V2.8.5 — 3 nouveaux templates CV + Suppression print auto :** Executive Bordeaux, Strategic Blue, Minimal Luxe. Sélecteur de modèle dans l'onglet Documents. Page /cv-print sans impression auto — boutons Télécharger PDF / Imprimer séparés.

**V2.8.3 — LinkedIn Easy Apply CV Upload Helper :** Détection automatique du modal LinkedIn Easy Apply, guide pas-à-pas pour le CV adapté, correction crash `chrome.downloads undefined` avec fallback Blob download.

**V2.8.2 — Indeed Resume Upload Helper :** Upload assisté pour Indeed SmartApply avec téléchargements nommés, presse-papier pour la lettre, remplissage automatique du champ lettre.

**V2.8.1 — Indeed terrain fix :** Extraction Indeed corrigée pour les pages de résultats avec panneau latéral. Filtres anti-parasites contre les textes type "Bienvenue, ELTON".

---

## Installation (mode développeur)

1. Ouvrez Chrome et allez à `chrome://extensions`
2. Activez le **Mode développeur** (coin supérieur droit)
3. Cliquez sur **Charger l'extension non empaquetée**
4. Sélectionnez le dossier `browser-extension/elton-os-importer`

## Trois fonctionnalités

### Onglet Import Pro (V2.8.0)

**Mode A — Offre unique :**
1. Ouvrez une annonce LinkedIn/Indeed/APEC
2. Cliquez **Analyser l'offre visible**
3. Vérifiez l'aperçu (titre, entreprise, lieu, confiance)
4. Cliquez **Envoyer vers ELTON OS**

**Mode B — Liste visible (max 10) :**
1. Faites une recherche sur LinkedIn/Indeed/APEC
2. Cliquez **Analyser les cartes visibles (max 10)**
3. Sélectionnez les offres à importer
4. Cliquez **Envoyer la sélection vers ELTON OS**

**Détection automatique :** login, CAPTCHA, Cloudflare → bloqué avec message explicite.

### Onglet Autofill

Remplir un formulaire de candidature ATS avec les données d'ELTON OS.

1. Dans ELTON OS, générez un dossier de candidature
2. Copiez le Draft ID
3. Ouvrez le formulaire de candidature sur le site ATS
4. Cliquez l'icône ELTON OS → onglet Autofill
5. Collez le Draft ID → **Charger les champs ELTON OS**
6. Cliquez **Détecter les champs du formulaire**
7. Vérifiez l'aperçu des correspondances
8. Cliquez **Remplir les champs**
9. **C'est VOUS qui cliquez sur Envoyer sur le site externe.**

**Nouveau V2.8.0 :** Onglet Documents (CV + Lettre PDF), détection fichier inputs, attachement via DataTransfer, fallback téléchargement manuel, ZIP des deux documents, noms personnalisés (`ELTON_DUPONT_Jean_TeamCo_Directeur_Commercial_CV.pdf`).
**V2.7.3 :** Correction manuelle (champs éditables dans la preview), extraction LinkedIn améliorée (3 stratégies entreprise), CV/Lettre fallback locaux, UI modernisée.

### Onglet Documents (V2.8.0)

Joindre un CV PDF et une lettre de motivation personnalisés à un formulaire de candidature.

1. Dans ELTON OS, générez un dossier de candidature (CV + Lettre)
2. Ouvrez le formulaire de candidature sur le site ATS
3. Cliquez l'icône ELTON OS → onglet **Documents**
4. Cliquez **Rechercher le dossier** — l'extension trouve automatiquement le draft correspondant
5. Vérifiez les badges CV PDF / Lettre PDF (vert = prêt, rouge = à regénérer)
6. Cliquez **Joindre CV** ou **Joindre Lettre** — le PDF est téléchargé et attaché au champ fichier du formulaire
7. Si l'attachement automatique échoue : fallback manuel (bouton Télécharger)
8. **C'est VOUS qui validez et envoyez la candidature sur le site externe.**

**Noms de fichiers :** `ELTON_DUPONT_Jean_TeamCo_Directeur_Commercial_CV.pdf`, `ELTON_DUPONT_Jean_TeamCo_Directeur_Commercial_Lettre.pdf`, `ELTON_DUPONT_Jean_TeamCo_Directeur_Commercial_Pack.zip`

**Téléchargement manuel :** boutons Télécharger CV, Télécharger Lettre, Télécharger Pack toujours disponibles.

## Plateformes supportées (Import Pro)

| Plateforme | Mode Single | Mode Liste | Extraction |
|---|---|---|---|
| LinkedIn | Titre, entreprise, lieu, description | Cartes visibles (max 10) | DOM visible |
| Indeed | Titre, entreprise, lieu, description, salaire | Cartes visibles (max 10) | DOM visible |
| APEC | Titre, entreprise, lieu, description, contrat, salaire | Cartes visibles (max 10) | DOM visible |

## Plateformes supportées (Autofill)

| Plateforme | Détection formulaire | Remplissage |
|---|---|---|
| Greenhouse | input, textarea, select | setNativeValue + events |
| Lever | ✅ | ✅ |
| Ashby | ✅ | ✅ |
| SmartRecruiters | ✅ | ✅ |
| Workable | ✅ | ✅ |
| LinkedIn Easy Apply | ✅ (si accessible) | ✅ |
| Indeed | ✅ (si formulaire) | ✅ |

## Champs supportés par l'Autofill

30+ labels reconnus en français et anglais :
Prénom/First Name, Nom/Last Name, Email, Téléphone/Phone, LinkedIn, Ville/Location,
Salaire/Salary Expectations, Disponibilité/Availability, Années d'expérience,
Poste actuel/Current Title, Lettre de motivation/Cover Letter, CV/Resume (upload manuel),
Questions ATS ouvertes (matching automatique)

## Permissions

- `activeTab` — lire le contenu de l'onglet actif uniquement
- `scripting` — exécuter extraction + détection + remplissage
- `storage` — sauvegarder URL ELTON OS + préférences

### Host permissions

```
linkedin.com/*, indeed.com/*, apec.fr/*
greenhouse.io/*, lever.co/*, ashbyhq.com/*
smartrecruiters.com/*, workable.com/*
cadremploi.fr/*, hellowork.com/*, welcometothejungle.com/*
```

**Aucune permission globale.** L'extension ne peut accéder qu'aux plateformes listées.

## Sécurité

- **Aucune candidature automatique** — jamais de Submit/Apply/Postuler
- **Aucun upload CV automatique** — avertissement manuel
- **Aucun scraping massif** — une annonce ou max 10 cartes visibles
- **Aucun contournement CAPTCHA/login** — détection et blocage
- **Aucune lecture de cookies, tokens, localStorage**
- **Aucun auto-scroll ou clic automatique**
- **Aucune soumission de candidature automatique**
- **Champs déjà remplis non écrasés** (option activable)
- **Validation humaine obligatoire**

## Pipeline serveur

```
RawJob → Déduplication → Job → JobScore → Semantic Matcher → Audit
```

Le serveur ne fetch jamais LinkedIn/Indeed/APEC. Toute tentative est refusée (code `refused_server_side_closed_platform_fetch`).

## Structure

```
elton-os-importer/
  manifest.json      # Manifest V3 (v2.8.0)
  popup.html         # UI 3 onglets (Import Pro + Documents + Autofill)
  popup.js           # Logique complète + extracteurs Pro + Documents + détection fichiers
  icons/             # icône or 16/48/128px
  README.md
```

## Endpoints

| Endpoint | Rôle |
|---|---|
| `POST /api/jobs/assisted-import/preview` | Validation + dédoublonnage |
| `POST /api/jobs/assisted-import/import` | Pipeline complet |
| `POST /api/jobs/assisted-import/match-draft` | Recherche draft par URL/titre (V2.8.0) |
| `GET /api/application-drafts/[id]/documents` | Statut documents (CV/Lettre dispo) (V2.8.0) |
| `GET /api/application-drafts/[id]/documents/cv` | PDF CV personnalisé (V2.8.0) |
| `GET /api/application-drafts/[id]/documents/cover-letter` | PDF Lettre personnalisé (V2.8.0) |
| `GET /api/application-drafts/[id]/documents/zip` | ZIP CV+Lettre (V2.8.0) |

## Troubleshooting

| Problème | Solution |
|---|---|
| Plateforme non détectée | Vérifier l'URL (linkedin.com, indeed.com, apec.fr) |
| Extraction faible (< 40%) | Corriger les champs dans la preview (V2.7.3) ou scroller manuellement |
| Entreprise manquante | Saisir le nom de l'entreprise dans le champ éditable (V2.7.3) |
| ELTON OS inaccessible | Vérifier l'URL dans Paramètres (défaut localhost:3000) |
| Champ non extrait | Les sélecteurs CSS ont pu changer — utiliser les fallbacks |
| Import refusé (400) | Vérifier title (min 3 car.), company (min 1 car.), sourceUrl |
| Login/CAPTCHA bloquant | Comportement normal — sécurité — utiliser une page accessible |
| Indeed : titre "Bienvenue, ELTON" ou entreprise manquante | Corriger manuellement les champs dans l'aperçu avant envoi (V2.8.1) |
| Indeed : entreprise + lieu fusionnés | L'extracteur nettoie automatiquement (V2.8.1) — sinon corriger manuellement |
| Documents : dossier introuvable | Importer d'abord l'offre dans ELTON OS et générer le dossier |
| Documents : attachement échoue | Utiliser le bouton Télécharger (fallback manuel toujours disponible) |

## Packaging

```bash
bash package-extension.sh
```

Crée `elton-os-importer-v2.8.4.zip`. Pour archivage et partage uniquement — l'installation principale reste le mode développeur.

Voir [docs/ASSISTED_IMPORT_EXTENSION_QA_REPORT.md](../../docs/ASSISTED_IMPORT_EXTENSION_QA_REPORT.md) pour le rapport de QA V2.8.0.

## QA Report

Voir [docs/ASSISTED_IMPORT_EXTENSION_QA_REPORT.md](../../docs/ASSISTED_IMPORT_EXTENSION_QA_REPORT.md) pour le rapport de QA V2.8.0.1.
