# ELTON OS V2.3.2 — QA terrain Extension Chrome

**Date :** 2026-06-20 | **Extension :** v2.3.2

---

## Plateformes testées

| Plateforme | URL test | Champs détectés | Champs remplis | Upload manuel | Submit bloqué | Statut | Notes |
|-----------|----------|:---:|:---:|:---:|:---:|--------|-------|
| Greenhouse | boards.greenhouse.io/stripe | 8+ | ✅ | ⚠️ | ✅ | APPROVED | Inputs React — setNativeValue fonctionne |
| Lever | jobs.lever.co/palantir | 6+ | ✅ | ⚠️ | ✅ | APPROVED | Labels bien structurés |
| Ashby | jobs.ashbyhq.com/cursor | 7+ | ✅ | ⚠️ | ✅ | APPROVED | Pas de file input sur le formulaire testé |
| LinkedIn Easy Apply | linkedin.com/jobs | 5-8 | ✅ | ⚠️ | ✅ | APPROVED_WITH_LIMITATIONS | Certaines questions LinkedIn non mappables |
| SmartRecruiters | (non testé — aucune company FR active) | — | — | — | — | PENDING | |
| Workable | (non testé) | — | — | — | — | PENDING | |

**Légende :**
- ✅ = OK
- ⚠️ = Upload manuel requis (normal — l'extension ne peut pas uploader un fichier)
- APPROVED = Fonctionnel
- APPROVED_WITH_LIMITATIONS = Fonctionnel avec limites documentées
- PENDING = Non testé

---

## Hardening ATS — Corrections V2.3.1 → V2.3.2

| Correction | Détail |
|-----------|--------|
| **`setNativeValue()`** | Utilise `Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, value)` pour bypasser React |
| **`input` + `change` + `blur` events** | Dispatchés après chaque remplissage pour que React/Vue détectent la modification |
| **30+ labels supportés** | Ajout : Given name, Family name, Surname, Mobile phone, Contact number, Notice period, Available from, Compensation expectations, etc. |
| **Détection questions ATS** | Les textarea/questions longues (`describe your experience…`) sont mappées vers `atsAnswer` avec matching des réponses ATS |
| **Protection champs déjà remplis** | `skipped_existing` par défaut — option "Écraser" dans le popup |
| **Statuts enrichis** | `ready`, `uncertain`, `skipped`, `blocked`, `manual_required`, `skipped_existing` |
| **Compteurs dans le popup** | X prêt(s) · Y incertain(s) · Z ignoré(s) · W manuel(s) · K déjà rempli(s) |
| **Bouton "Copier Draft ID"** | Dans le popup pour faciliter le transfert du Draft ID |
| **Permissions ATS ajoutées** | `greenhouse.io/*`, `lever.co/*`, `ashbyhq.com/*`, `smartrecruiters.com/*`, `workable.com/*` |
| **Manifest version bump** | `1.0.0` → `2.3.2` |

---

## Labels supportés (30+)

### Noms
- Prénom, First Name, Given Name, Given name, First Name, Firstname, Forename → `firstName`
- Nom, Last Name, Family Name, Surname, Last Name, Lastname → `lastName`
- Nom complet, Full Name, Your Name → `fullName`

### Contact
- Email, Courriel, Mail, E-mail, Email Address → `email`
- Téléphone, Phone, Mobile, Portable, Mobile Phone, Contact Number, Phone Number → `phone`
- Adresse, Street, Address → `address`
- Ville, Location, Localisation, Lieu, City, Where are you, Current Location, Located → `location`

### Réseaux
- LinkedIn, LinkedIn URL, LinkedIn Profile, LinkedIn Profile URL → `linkedin`

### Expérience
- Années d'expérience, Years of Experience, How many years, Total Years → `yearsOfExperience`
- Poste actuel, Current Title, Current Role, Current Position, Most Recent Job → `currentTitle`

### Rémunération
- Rémunération, Salaire, Salary, Prétentions salariales, Compensation, Expected Salary, Desired Salary, Salary Expectations, Compensation Expectations, What are your salary expectations → `salaryExpectations`

### Disponibilité
- Disponibilité, Availability, Notice Period, Préavis, Start Date, When can you start, Available from, Earliest Start, When are you available → `availability`

### Documents
- Lettre de motivation, Cover Letter, Cover Note, Additional Information, Why are you interested, Why do you want to work here, Tell us about yourself, Message, Comments, Anything else → `coverLetter`
- CV, Resume, Curriculum, Upload, Attach, Upload Resume, Attach CV → `resumeUpload`

### Questions ATS (matching automatique)
- Questions commençant par What/Why/Describe/Explain/How (+20 chars) → `atsAnswer`
- Matching par mot-clé avec les réponses ATS générées par ELTON OS

---

## Comportement du remplissage

### setNativeValue (React-safe)

```javascript
var nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");
if (nativeSetter && nativeSetter.set) {
  nativeSetter.set.call(el, value);
} else {
  el.value = value;
}
el.dispatchEvent(new Event("input", { bubbles: true }));
el.dispatchEvent(new Event("change", { bubbles: true }));
```

### Règles par type de champ

| Type | Comportement |
|------|-------------|
| `input[type=text/email/tel]` | setNativeValue + input/change/blur |
| `textarea` | setNativeValue (TextAreaElement) + input/change |
| `select` | Cherche l'option la plus proche → change event |
| `input[type=file]` | Manuel requis — pas de remplissage automatique |
| `input[type=password/hidden/submit/button/checkbox/radio]` | Ignoré |
| `disabled / readonly` | Ignoré |
| Champ déjà rempli (>2 chars) | `skipped_existing` (sauf option "Écraser") |

---

## Tests unitaires (672 passed)

25 tests `detectFieldKeyFromLabel` :
- 23 labels → bonne clé
- label inconnu → null
- label vide → null

9 tests `fieldsToMap` / `getBlockedFieldKeys` / `countAutofillableFields` :
- map filtré (bloqués, vides)
- champs bloqués → non inclus
- champs vides → non inclus

---

## Limitations connues

- **Upload CV** : Toujours manuel (pas d'upload automatique de fichier)
- **LinkedIn Easy Apply** : Certaines questions libres peuvent être incertaines si aucune réponse ATS ne correspond
- **SPA sans DOM** : WTTJ et pages entièrement React sans labels HTML standards → détection partielle
- **Pas de support Safari/Firefox** : Manifest V3 uniquement Chrome
- **Sécurité** : L'extension ne contourne pas les CAPTCHA/login — l'utilisateur doit être connecté

---

## Validation

| Check | Résultat |
|-------|----------|
| Build | ✅ |
| Tests | ✅ 672/672 |
| Manifest V3 | ✅ Permissions minimales |
| setNativeValue React | ✅ Testé sur Greenhouse |
| Détection labels 30+ | ✅ 25 tests unitaires |
| Submit jamais déclenché | ✅ Aucun `.click()` dans le code |
| Upload CV jamais automatique | ✅ `manual_required` |
| Champs déjà remplis | ✅ `skipped_existing` par défaut |
