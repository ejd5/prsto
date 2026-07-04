# ELTON OS Import Assisté Pro — Extension Chrome V2.8.5

## Nouveautés V2.8.5 — Nouveaux templates CV + Suppression print automatique + Sélecteur extension

- **Suppression print automatique** : la page /cv-print n'ouvre plus l'impression au chargement. L'utilisateur choisit via les boutons dédiés.
- **Boutons séparés** : "Télécharger PDF" (icône Download, téléchargement direct du PDF premium) et "Imprimer" (icône Printer, ouvre window.print au clic seulement).
- **3 nouveaux templates CV** : Executive Bordeaux (fond ivoire, accents bordeaux, timeline classique), Strategic Blue (bandeau bleu pétrole, KPIs, blocs compétences), Minimal Luxe (noir/champagne/ivoire, lignes subtiles, espace généreux).
- **Sélecteur de template dans l'extension** : dropdown "Modèle CV" dans l'onglet Documents (Premium Leadership, Executive Bordeaux, Strategic Blue, Minimal Luxe).
- **Sélecteur amélioré sur /cv-print** : cartes avec badge ATS/Premium/Executive/Business et pastille de couleur.
- **Template parameter API** : `?template=executive_bordeaux|strategic_blue|minimal_luxe|premium_leadership` sur l'endpoint documents/cv.
- **Fallback** : template inconnu → premium-leadership, jamais d'erreur.

## Nouveautés V2.8.4 — Premium PDF CV Export for Extension Documents

- **CV PDF Premium Leadership** : le CV téléchargé depuis l'extension utilise désormais le template Premium Leadership (mise en page 2 colonnes, accent champagne #C8A64E, typographie Helvetica) au lieu du texte brut Courier monospace
- **Métadonnées de qualité** : l'endpoint documents expose `quality: "premium"` et `template: "premium-leadership"` pour le CV
- **Badge CV Premium** : l'interface Documents affiche un badge "CV Premium · Leadership" avec le style champagne quand le CV est en qualité premium
- **Badge fallback** : si le CV premium est indisponible, un badge rouge "CV premium indisponible — régénérez le dossier dans ELTON OS" s'affiche
- **Chaîne de fallback** : premium → fallback texte brut → erreur. Le fallback texte brut est explicite (`?fallback=plain`)
- **Header X-ELTON-Document-Warning** : `plain-fallback` quand le texte brut est utilisé comme fallback
- **Endpoint documents enrichi** : `downloadUrl` pour le CV, `quality` et `template` dans le manifeste

## Nouveautés V2.8.3 — LinkedIn Easy Apply CV Upload Helper + Fix chrome.downloads

- **Correction crash `chrome.downloads`** : l'erreur "Cannot read properties of undefined (reading 'download')" est corrigée. Guard `chrome?.downloads?.download` avec fallback Blob URL + lien `<a download>`. Aucun crash même sans la permission `downloads`.
- **Détection LinkedIn Easy Apply** : détection automatique du modal "Postuler chez", étape CV, bouton "Télécharger le CV", et bouton "Suivant"
- **Guide LinkedIn pas-à-pas** : instructions pour télécharger le CV adapté et le sélectionner manuellement dans LinkedIn
- **Fallback `showDownloadedFile`** : si `chrome.downloads.show` indisponible, affiche le nom du fichier
- **Badge étape CV** : avancement détecté automatiquement ("Étape CV")
- **Message draft manquant** : si aucun dossier trouvé, invite à importer d'abord l'offre

## Nouveautés V2.8.2 — Indeed Resume Upload Helper + Document Clipboard

- **Upload assisté pour Indeed SmartApply** : détection automatique des pages `smartapply.indeed.com`, guide pas-à-pas pour l'upload manuel du CV
- **Téléchargement avec nom de fichier** : utilisation de `chrome.downloads.download` pour des noms de fichiers propres (`ELTON_OS/CV_DUPONT_Jean_TeamCo.pdf`) au lieu de noms génériques
- **Presse-papier pour la lettre** : bouton "Copier la lettre" et "Remplir le champ lettre" pour coller ou injecter la lettre de motivation dans les formulaires
- **Endpoint cover-letter-text** : `GET /api/application-drafts/[id]/documents/cover-letter-text` — retourne la lettre en texte brut pour le presse-papier
- **Afficher dans le dossier** : bouton pour ouvrir le dossier de téléchargement après un téléchargement réussi
- **Copier le nom du fichier** : bouton pour copier le nom du fichier téléchargé (pratique pour retrouver le fichier dans le Finder/Explorateur)
- **Permission `downloads`** : ajoutée au manifeste pour les téléchargements contrôlés
- **Fallback manuel toujours disponible** : si l'upload automatique n'est pas supporté, un bouton de téléchargement manuel est proposé

Règles de sécurité V2.8.2 :
- Aucune soumission automatique de candidature
- Aucun contournement du sélecteur de fichier système d'Indeed
- Aucune lecture de cookies / sessions / mots de passe
- Aucun fetch serveur vers Indeed
- Aucun bypass anti-bot / login / CAPTCHA
- Aucune pièce jointe sans validation explicite de l'utilisateur
- Fallback manuel toujours proposé

## Nouveautés V2.8.1 — Indeed terrain fix

- **Correctif extraction Indeed** : l'extracteur lit désormais le panneau détail à droite en priorité (titre, entreprise, lieu, salaire, type de contrat, télétravail)
- **Filtres anti-parasites** : les textes parasites comme "Bienvenue, ELTON", "Emplois recommandés", "Détails de l'emploi" ne sont plus acceptés comme titre
- **Nettoyage entreprise+lieu** : les fusions du type "Uptoo13000 Marseille" sont automatiquement corrigées
- **Correction manuelle** : si l'extraction est imparfaite, les champs sont éditables et l'envoi reste bloqué tant que le titre est invalide
- **Fallback carte sélectionnée** : si le panneau détail est incomplet, l'extracteur lit la carte sélectionnée dans la colonne de gauche

## Nouveautés V2.8.0

- **Onglet Documents PDF** : joindre CV et lettre de motivation aux formulaires de candidature directement depuis l'extension
- **Génération PDF serveur** : PDFs générés via `pdf-lib` avec noms de fichiers personnalisés (`ELTON_DUPONT_Jean_TeamCo_CV.pdf`)
- **Pièce jointe automatique** : détection des champs fichier (`<input type=file>`) et attachement via `DataTransfer`
- **Fallback téléchargement manuel** : toujours disponible quand l'upload automatique n'est pas supporté
- **Endpoint match-draft** : `POST /api/jobs/assisted-import/match-draft` pour retrouver le dossier correspondant à la page active
- **Endpoints documents** : `GET /api/application-drafts/[id]/documents` (manifeste + CV PDF + Lettre PDF + ZIP)
- **Détection contenu obsolète** : alerte visuelle "Échec" dans l'interface avec bouton Régénérer
- **Audit trail** : logs `document_downloaded` dans `generationLogs` à chaque téléchargement de PDF

## Nouveautés V2.7.3

- **Correction manuelle** : champs titre, entreprise et lieu éditables dans la preview, score de confiance recalculé en temps réel
- **Extraction LinkedIn améliorée** : 3 stratégies pour l'entreprise (CSS direct, au-dessus du h1, carte active dans la colonne de gauche), filtrage du bruit (isNoiseText)
- **CV/Lettre de motivation** : fallbacks locaux (`buildLocalResume`, `buildLocalLetter`) remplaçant les erreurs "Échec génération CV"
- **externalId** : hash SHA-256 au lieu de base64 tronqué (correction du bug de doublons)
- **UI modernisée** : thème sombre premium, barre de confiance, badges colorés

## Principe

L'Import Assisté Pro permet d'importer des offres depuis LinkedIn, Indeed et APEC **sans jamais automatiser ces plateformes côté serveur**. L'utilisateur ouvre la page d'offre dans son navigateur personnel, l'extension lit le DOM visible, et l'utilisateur valide avant l'envoi vers ELTON OS.

**Aucune soumission automatique de candidature.**

## Sécurité

Règles strictes :

- Pas d'automatisation LinkedIn / Indeed / APEC côté serveur
- Pas de Firecrawl sur LinkedIn / Indeed / APEC
- Pas de contournement anti-bot
- Pas de résolution CAPTCHA
- Pas de réutilisation de cookies / sessions / mots de passe
- Pas de lecture de contenus privés, messages, profils privés
- Pas d'auto-scroll agressif
- Pas de clic automatique sur les annonces
- Pas de soumission de candidature automatique

## Plateformes supportées

| Plateforme | Extraction Single | Extraction Liste (max 10) | Statut |
|---|---|---|---|
| LinkedIn | Titre, entreprise, lieu, description | Cartes visibles | Actif |
| Indeed | Titre, entreprise, lieu, description, salaire | Cartes visibles | Actif |
| APEC | Titre, entreprise, lieu, description, contrat, salaire | Cartes visibles | Actif |

## Architecture

```
Navigateur (extension Chrome)
  ├─ Content scripts injectés via chrome.scripting.executeScript()
  ├─ Lecture DOM visible uniquement
  ├─ Détection login/CAPTCHA avant extraction
  └─ Envoi POST → ELTON OS (CORS: origin chrome-extension://)

Serveur ELTON OS
  ├─ GET /api/health                                    → Health check (CORS)
  ├─ POST /api/jobs/assisted-import/preview            → Validation + dédoublonnage (CORS)
  ├─ POST /api/jobs/assisted-import/import             → Pipeline complet (CORS)
  ├─ POST /api/jobs/assisted-import/match-draft        → Matching dossier existant (CORS)
  ├─ GET /api/application-drafts/[id]/documents        → Manifeste documents (CORS)
  ├─ GET /api/application-drafts/[id]/documents/cv     → PDF CV (CORS)
  ├─ GET /api/application-drafts/[id]/documents/cover-letter → PDF Lettre (CORS)
  └─ GET /api/application-drafts/[id]/documents/zip    → ZIP CV+Lettre (CORS)
       RawJob → Dédup → Job → JobScore → Semantic Matcher
```

## Configuration CORS

L'extension Chrome envoie des requêtes avec l'origine `chrome-extension://<extension-id>`. Le serveur ELTON OS doit autoriser cette origine via CORS.

### Variable d'environnement

```bash
# .env
ELTON_EXTENSION_ALLOWED_ORIGINS=chrome-extension://akkfmbjfjjklnlkmobadmgeogopakkkd
```

Origines multiples (séparées par des virgules) :
```bash
ELTON_EXTENSION_ALLOWED_ORIGINS=chrome-extension://id1,chrome-extension://id2
```

### Trouver l'ID de l'extension

1. Ouvrir `chrome://extensions`
2. L'ID est affiché sous le nom de l'extension "ELTON OS Importer Pro"
3. Format : 32 caractères minuscules (a-p)

### Comportement selon l'environnement

| Environnement | `ELTON_EXTENSION_ALLOWED_ORIGINS` défini | Comportement |
|---|---|---|
| Development | Non | Accepte toute origine `chrome-extension://[a-z]{32}` |
| Development | Oui | Accepte uniquement les origines listées |
| Production | Non | Refuse toutes les origines |
| Production | Oui | Accepte uniquement les origines listées |

### Règles de sécurité CORS

- **Jamais** `Access-Control-Allow-Origin: *` avec `Access-Control-Allow-Credentials: true`
- Origine exacte obligatoire (`chrome-extension://<id-32-caractères>`)
- `Vary: Origin` sur toutes les réponses
- Preflight OPTIONS → 204 avec `Access-Control-Max-Age: 86400`
- Headers autorisés : `Content-Type, Authorization, x-api-token`

## Modes d'import

### Mode A — Offre unique

- L'utilisateur ouvre une page d'offre (LinkedIn, Indeed, APEC)
- L'extension détecte la plateforme automatiquement
- Clic sur "Analyser l'offre visible"
- Extraction du DOM visible : titre, entreprise, lieu, description, salaire
- Prévisualisation avec champs éditables (correction manuelle V2.7.3)
- Score de confiance recalculé en temps réel lors des corrections
- Clic sur "Envoyer vers ELTON OS" (désactivé si titre ou entreprise manquant)

### Mode B — Liste visible (max 10)

- L'utilisateur fait une recherche et voit des cartes
- L'extension détecte la plateforme
- Clic sur "Analyser les cartes visibles (max 10)"
- Extraction des cartes visibles sans auto-scroll
- Sélection par checkbox
- Clic sur "Envoyer la sélection vers ELTON OS"

## Détection login / CAPTCHA

Avant toute extraction, l'extension vérifie le texte visible de la page :

- `Sign in to view` / `Log in to apply`
- `Connectez-vous` / `Identifiez-vous`
- `captcha` / `recaptcha` / `hcaptcha`
- `Just a moment... checking your browser` (Cloudflare)

Si détecté → état `blocked`, message "Import assisté impossible sur cette page".

## Confiance d'extraction

Score 0–100 basé sur les champs présents :

| Champ | Poids |
|---|---|
| Titre | 35 |
| Entreprise | 25 |
| Description | 15 |
| Lieu | 10 |
| URL de candidature | 5 |
| Date de publication | 4 |
| Salaire min | 3 |
| Type de contrat | 2 |
| Politique remote | 1 |

Score < 40 → badge rouge et avertissement. Les champs éditables permettent de compléter les informations manquantes.

### Correction manuelle (V2.7.3)

L'interface de preview affiche des champs éditables pour le titre, l'entreprise et le lieu :

- Les valeurs extraites sont pré-remplies
- L'utilisateur peut corriger tout champ incorrect ou manquant
- Le score de confiance est recalculé en temps réel
- Le bouton "Envoyer" est désactivé tant que titre ET entreprise sont vides
- Un avertissement s'affiche si l'entreprise est manquante

Cela résout le problème des extractions incomplètes (notamment les annonces LinkedIn en page de résultats qui affichent l'entreprise au-dessus du titre).

## Pipeline d'import

1. **RawJob** — stockage brut avec `fetchedAt`
2. **Déduplication** — par externalId, sourceUrl, titre+entreprise+lieu
3. **Job** — création avec `locationPriority`, `countryScope`
4. **JobScore** — scoring local (executiveScore, matchScore, locationScore, etc.)
5. **Semantic Matcher** — analyse de fit vs profil (si profil existe)
6. **Audit** — `JobSearchRun` avec `extractionMethod: "USER_ASSISTED_EXTENSION"`

## API Endpoints

### GET /api/health

Health check. Retourne le statut du serveur et de la base de données. Supporte CORS.

```json
{
  "status": "ok",
  "version": "2.7.3",
  "timestamp": "2026-06-21T...",
  "db": "connected"
}
```

### OPTIONS /api/jobs/assisted-import/preview

Preflight CORS. Retourne 204 avec headers CORS si l'origine est autorisée.

### OPTIONS /api/jobs/assisted-import/import

Preflight CORS. Retourne 204 avec headers CORS si l'origine est autorisée.

### POST /api/jobs/assisted-import/preview

Valide le payload et vérifie les doublons. Ne fetch jamais les plateformes.

```json
{
  "platform": "linkedin",
  "sourceUrl": "https://www.linkedin.com/jobs/view/123",
  "visibleOnly": true,
  "jobs": [{ "title": "...", "company": "...", "sourceUrl": "..." }]
}
```

Refuse les requêtes avec `_serverFetch: true` sur les domaines bloqués (LinkedIn, Indeed, APEC, Cadremploi, Monster).

### POST /api/jobs/assisted-import/import

Importe les offres sélectionnées. Pipeline complet. Ne fetch jamais les plateformes.

```json
{
  "platform": "linkedin",
  "sourceUrl": "https://www.linkedin.com/jobs/view/123",
  "visibleOnly": true,
  "selectedJobs": [{ "title": "...", "company": "..." }]
}
```

## Reason Codes

| Code | Description |
|---|---|
| `assisted_visible_job_imported` | Offre unique importée via extension |
| `assisted_visible_list_imported` | Offres en liste importées via extension |
| `assisted_duplicate_skipped` | Doublon — existe déjà dans ELTON OS |
| `assisted_missing_required_fields` | Champs obligatoires manquants |
| `blocked_login_or_captcha_visible` | Page de login ou CAPTCHA détectée |
| `refused_server_side_closed_platform_fetch` | Tentative de fetch serveur refusée |
| `refused_auto_scrape_closed_platform` | Tentative de scraping automatique refusée |

## Integration avec le Smart Ingestion Router

Le routeur V2.6.10 classe LinkedIn, Indeed, APEC en `USER_ASSISTED` (priorité 8) :

```typescript
chooseIngestionStrategy({ importMode: "USER_ASSISTED", url: "https://www.linkedin.com/jobs/" })
// → { strategy: "USER_ASSISTED", canAutoImport: false, priority: 8 }
```

`explainStrategyDecision()` indique : "Utilisez l'extension Chrome Import Assisté."

## Installation de l'extension

1. Ouvrir `chrome://extensions`
2. Activer "Mode développeur"
3. "Charger l'extension non empaquetée"
4. Sélectionner `browser-extension/elton-os-importer/`

Le fichier ZIP (`elton-os-importer-v2.7.3.zip`) est destiné à l'archivage et au partage — ne pas glisser-déposer dans Chrome.

## Packaging

```bash
bash browser-extension/elton-os-importer/package-extension.sh
```

Crée `browser-extension/elton-os-importer-v2.7.3.zip` en excluant .DS_Store, fichiers secrets, et en vérifiant manifest.json + popup.html + popup.js.

## QA Terrain — Tests manuels

### Offre unique

| Plateforme | Action | Vérifications |
|---|---|---|
| LinkedIn | Ouvrir annonce → icône ELTON OS → "Analyser l'offre visible" | Title, company, location, description, confidence |
| Indeed | Idem | Title, company, location, description, salary, confidence |
| APEC | Idem | Title, company, location, description, contract, salary, confidence |

Pour chaque plateforme :
1. Vérifier l'aperçu (title, company, location)
2. Vérifier le score de confiance
3. Envoyer vers ELTON OS
4. Vérifier le dashboard jobs → l'offre apparaît
5. Vérifier le détail "Pourquoi cette offre matche"

### Liste visible

| Plateforme | Action | Vérifications |
|---|---|---|
| LinkedIn | Page résultats → "Analyser les cartes visibles" | ≤ 10 cartes, pas d'auto-scroll |
| Indeed | Idem | Checkbox par carte, sélection utilisateur |
| APEC | Idem | Envoi sélection uniquement |

### Login / CAPTCHA

| Test | Résultat attendu |
|---|---|
| Page de login LinkedIn | État "bloqué" |
| Page CAPTCHA Cloudflare | État "bloqué" |
| Page sans offre | Message "aucune carte détectée" |

## Troubleshooting

### L'extension ne détecte pas la plateforme

- Vérifier que l'URL correspond à un domaine connu (linkedin.com, indeed.com, apec.fr, etc.)
- Les pages "Easy Apply" LinkedIn sont supportées
- Les pages SPA (WTTJ) peuvent avoir un DOM vide au moment de l'extraction

### Extraction faible (confidence < 40%)

- LinkedIn a pu changer ses sélecteurs CSS → title et company peuvent être extraits de `document.title` (fallback)
- Indeed peut charger la description en lazy loading → scroll manuel dans la page avant d'analyser
- APEC peut avoir changé l'ordre des `.card-text` → vérifier manuellement les champs

### ELTON OS inaccessible

- Vérifier que l'URL configurée dans les paramètres de l'extension pointe vers le bon serveur
- Par défaut : `http://localhost:3000`
- En production : configurer l'URL de votre instance ELTON OS

### L'import échoue (400 Bad Request)

- Vérifier que title et company sont bien remplis (minimum 3 caractères pour title)
- Vérifier que sourceUrl est présente
- Maximum 10 offres par import

### Le serveur refuse les requêtes (CORS)

- Vérifier que `ELTON_EXTENSION_ALLOWED_ORIGINS` contient l'ID de l'extension (visible dans `chrome://extensions`)
- Vérifier que le serveur a été redémarré après modification du `.env`
- En développement sans variable, toute extension Chrome est acceptée
- L'extension utilise `credentials: "omit"` — pas de cookies envoyés
- Les requêtes preflight (OPTIONS) doivent retourner 204 avec les headers CORS

### Le serveur refuse les requêtes (Auth)

- L'API preview/import nécessite `x-api-token` en production (égale `SOURCING_CRON_TOKEN`)
- En développement (`NODE_ENV=development`), l'auth est désactivée

## Limites connues

1. **Sélecteurs CSS LinkedIn/Indeed/APEC** : peuvent changer sans préavis. L'extension utilise des fallbacks (document.title, class wildcards), privilégie les heuristiques de texte visible.
2. **Description Indeed** : peut être vide si lazy loading. Solution : scroller manuellement avant d'analyser.
3. **Ordre APEC** : `.card-text[0]` = company, `.card-text[1]` = location. Si APEC change l'ordre, les champs seront inversés.
4. **Correction manuelle** : implémentée en V2.7.3. Les champs titre, entreprise et lieu sont éditables dans la preview, avec recalcul du score de confiance en temps réel.
5. **CV/Lettre de motivation** : les fonctions de fallback local (`buildLocalResume`, `buildLocalLetter`) remplacent les erreurs "Échec" en production.
6. **Pas de fetch serveur** : le serveur ne peut pas récupérer le contenu des plateformes fermées. Toute l'extraction se fait côté extension.

## Tests

```bash
npx vitest run tests/assisted-import.test.ts tests/extension-import-extractors.test.ts tests/extension-cors.test.ts tests/ingestion-router.test.ts tests/application-preparer.test.ts tests/extension-popup-security.test.ts
```

59 tests extractors (incl. hashUrlForExternalId + noise filtering) + 49 tests API (assisted-import) + 30 tests CORS + 38 tests ingestion-router + 17 tests CV/letter fallback + 24 tests popup security = 217 tests pour le système d'import assisté.

Tests totaux ELTON OS V2.8.5 : 1442 passants (43 fichiers).
