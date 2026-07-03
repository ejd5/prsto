# ELTON OS — Extension Chrome Import Express — Spécification

**Date :** 2026-06-20 | **Version :** V2.3

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Extension Chrome (Manifest V3)          │
│                                                         │
│  popup.html / popup.js                                  │
│  ┌─────────────────────────────────────┐                │
│  │ Plateforme détectée                 │                │
│  │ URL actuelle                        │                │
│  │ [Analyser cette annonce]            │                │
│  │ Aperçu (titre, entreprise, lieu)    │                │
│  │ [Envoyer vers ELTON OS]             │                │
│  │ [Configurer l'URL ELTON OS]          │                │
│  └─────────────────────────────────────┘                │
│                                                         │
│  content-script.js (injecté via scripting API)          │
│  ┌─────────────────────────────────────┐                │
│  │ extractText() → rawText             │                │
│  │ parseLightweight() → title,company  │                │
│  └─────────────────────────────────────┘                │
└───────────────────────┬─────────────────────────────────┘
                        │ POST /api/jobs/importer/extension
                        ▼
┌─────────────────────────────────────────────────────────┐
│                    ELTON OS (Next.js 16)                 │
│                                                         │
│  /api/jobs/importer/extension                           │
│  ┌─────────────────────────────────────┐                │
│  │ parseExtensionPayload()              │                │
│  │ cleanImportedJobText()               │                │
│  │ create Job + RawJob                  │                │
│  │ return { jobId, title, company }     │                │
│  └─────────────────────────────────────┘                │
│                                                         │
│  /dashboard/jobs/importer/capture?jobId=xxx             │
│  ┌─────────────────────────────────────┐                │
│  │ Affiche l'offre                      │                │
│  │ Permet correction (titre, etc.)      │                │
│  │ Bouton "Créer l'offre"              │                │
│  └─────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────┘
```

---

## Permissions

```json
{
  "permissions": ["activeTab", "scripting", "storage"],
  "host_permissions": [
    "https://*.linkedin.com/jobs/*",
    "https://*.indeed.com/*",
    "https://www.apec.fr/*",
    "https://www.cadremploi.fr/*",
    "https://www.hellowork.com/*",
    "https://www.welcometothejungle.com/*"
  ]
}
```

**Aucune permission globale.** L'extension ne peut accéder qu'aux sites listés.

---

## Popup (popup.html + popup.js)

### États

| État | Description |
|------|-------------|
| `main` | Bouton "Analyser cette annonce" + Config URL |
| `settings` | Champ URL ELTON OS |
| `loading` | "Analyse en cours…" |
| `preview` | Aperçu titre, entreprise, lieu. Bouton "Envoyer" |
| `sent` | "Offre envoyée !" |
| `error` | Message d'erreur + Réessayer |

### Détection plateforme

```javascript
function detectPlatform(url) {
  if (url.includes("linkedin.com/jobs")) return "linkedin";
  if (url.includes("indeed.com")) return "indeed";
  if (url.includes("apec.fr")) return "apec";
  if (url.includes("cadremploi.fr")) return "cadremploi";
  if (url.includes("hellowork.com")) return "hellowork";
  if (url.includes("welcometothejungle.com")) return "wttj";
  return "generic";
}
```

---

## Content Script (exécuté via scripting.executeScript)

### Extraction

```javascript
function extractText() {
  var title = document.title;
  var h1 = document.querySelector("h1")?.textContent?.trim();
  var bodyText = document.body?.innerText?.slice(0, 10000);
  return { pageTitle: title, detectedTitle: h1 || title, rawText: bodyText };
}
```

### Limites

- **Max 10 KB** de texte extrait
- Lecture du **contenu visible uniquement** (`innerText`, pas `innerHTML`)
- **Aucune lecture** de cookies, tokens, localStorage, messages privés
- **Aucun clic** sur Apply/Submit/Postuler

---

## Routes ELTON OS

### POST /api/jobs/importer/extension

**Input :**
```json
{
  "sourcePlatform": "linkedin",
  "sourceUrl": "https://www.linkedin.com/jobs/view/...",
  "pageTitle": "Directeur Commercial France — ACME",
  "rawText": "...",
  "detectedTitle": "Directeur Commercial France",
  "detectedCompany": "ACME Corp",
  "detectedLocation": "Paris"
}
```

**Traitement :**
1. `parseExtensionPayload()` — valide, nettoie (`cleanImportedJobText()`)
2. Crée `Job` (status: `"new"`) + `RawJob`
3. Crée `ImportSource` "Import Express" si absent

**Output :**
```json
{
  "success": true,
  "jobId": "uuid",
  "title": "Directeur Commercial France",
  "company": "ACME Corp",
  "location": "Paris",
  "sourceUrl": "https://...",
  "message": "Offre créée. Consultez ELTON OS pour vérifier."
}
```

### GET/POST /api/jobs/[id]

Récupère les détails d'une offre pour la page de validation.

---

## Page validation

### /dashboard/jobs/importer/capture?jobId=xxx

Affiche :
- Titre détecté (éditable)
- Entreprise détectée (éditable)
- Lieu détecté (éditable)
- Description (3000 premiers caractères)
- URL source
- Bouton "Créer l'offre"
- Lien "Voir dans Sourcing"

---

## Plateformes supportées

| Plateforme | Détection | Extraction | Notes |
|-----------|-----------|------------|-------|
| LinkedIn Jobs | URL pattern | innerText, h1 | Fonctionne si connecté |
| Indeed / Indeed FR | URL pattern | innerText, h1 | OK |
| APEC | URL pattern | innerText, h1 | OK |
| Cadremploi | URL pattern | innerText | Cloudflare possible |
| HelloWork | URL pattern | innerText | OK |
| WTTJ | URL pattern | innerText | SPA — DOM peut être vide |
| Pages carrière génériques | Fallback | body.innerText | Qualité variable |

---

## Sécurité

| Règle | Implémentation |
|-------|---------------|
| Aucune candidature automatique | Pas de clic Apply/Submit dans le content-script |
| Aucun scraping massif | Une seule annonce à la fois (clic utilisateur) |
| Aucun contournement CAPTCHA/login | L'utilisateur doit être connecté normalement |
| Aucune lecture cookies/tokens | `innerText` uniquement, pas de `localStorage` |
| Validation humaine obligatoire | Offre créée avec `status: "new"`, page de validation |
| Token ELTON OS jamais exposé | `SOURCING_CRON_TOKEN` côté serveur uniquement |

---

## Tests manuels

| Cas | Attendu |
|-----|---------|
| LinkedIn job ouverte | Détection linkedin, extraction titre+entreprise+lieu |
| Indeed job ouverte | Détection indeed, extraction |
| APEC offre ouverte | Détection apec |
| Page non supportée | Fallback generic |
| Texte trop court (< 50 chars) | Erreur "texte trop court" |
| ELTON OS inaccessible | Erreur réseau dans le popup |
| Annonce sans entreprise | "Entreprise inconnue" |
| URL ELTON OS personnalisée | Sauvegardée dans chrome.storage.local |

---

## Autofill assisté — Spécification V2 (backlog)

### Fonctionnement

```
1. Utilisateur ouvre un formulaire de candidature (Greenhouse, Lever, etc.)
2. L'extension détecte les champs du formulaire
3. L'extension affiche les correspondances avec le profil ELTON OS
4. L'utilisateur vérifie et clique "Remplir"
5. Les champs sont remplis (sans Submit)
6. L'utilisateur clique lui-même sur "Envoyer" sur le site externe
```

### Champs supportés

| Champ formulaire | Source ELTON OS |
|-----------------|-----------------|
| First Name | Profile.fullName (split) |
| Last Name | Profile.fullName (split) |
| Email | Profile.email |
| Phone | Profile.phone |
| Location | Profile.location |
| LinkedIn URL | Profile.linkedin |
| Resume upload | ⚠️ Warning — l'utilisateur doit uploader manuellement |
| Cover Letter | ApplicationDraft.motivationLetterLong |
| Years of Experience | Profile.yearsExp |
| Current Title | Profile.title |
| Salary Expectations | Profile.targetSalary |
| ATS Questions | ApplicationDraft.atsFormAnswers |

### Champs jamais remplis automatiquement

- Checkbox "I agree to terms"
- Checkbox "I am not a robot"
- CAPTCHA
- Bouton Submit
- Upload de fichier

---

## Fichiers de l'extension

```
browser-extension/elton-os-importer/
  manifest.json      # Manifest V3
  popup.html         # UI du popup (340px)
  popup.js           # Logique : détection, extraction, envoi
  icons/             # icon16.png, icon48.png, icon128.png
  README.md          # Documentation
```
