# ELTON OS — Pièces jointes PDF depuis l'extension

## Principe

L'onglet **Documents** de l'extension ELTON OS Importer Pro permet de :
1. Retrouver le dossier de candidature correspondant à la page active
2. Télécharger le CV et la lettre de motivation au format PDF
3. Joindre automatiquement les PDFs aux formulaires de candidature

**Aucune candidature n'est envoyée automatiquement.**

## Utilisation

### 1. Importer et générer

1. Ouvrir une offre sur LinkedIn/Indeed/APEC
2. Onglet **Import Pro** → Analyser → Envoyer vers ELTON OS
3. Dans ELTON OS, le CV et la lettre sont générés automatiquement

### 2. Joindre les documents

1. Retourner sur la page de candidature (formulaire ATS)
2. Onglet **Documents** → Rechercher le dossier
3. Le CV et la lettre apparaissent avec leur statut (prêt/indisponible)
4. Cliquer **Joindre CV** ou **Joindre Lettre**

### 3. Fallback manuel

Si l'upload automatique n'est pas supporté par le site :
- Un message "Pièce jointe automatique non supportée sur ce site" s'affiche
- Un bouton **Télécharger manuellement** permet de récupérer le PDF
- Le téléchargement manuel est toujours disponible via les boutons dédiés

## Noms de fichiers

Les PDFs sont nommés selon le format :
```
ELTON_NOM_Prénom_Entreprise_Poste_CV.pdf
ELTON_NOM_Prénom_Entreprise_Poste_Lettre.pdf
ELTON_NOM_Prénom_Entreprise_Poste_Pack.zip
```

Exemple : `ELTON_DUPONT_Jean_TeamCo_Directeur_Commercial_CV.pdf`

Les accents sont retirés, les espaces remplacés par `_`, les caractères interdits supprimés.

## Fonctionnement technique

### Détection des champs fichier

L'extension injecte `detectFileInputsFn()` qui :
- Trouve tous les `<input type="file">` visibles
- Les classifie par type : `cv`, `coverLetter`, `genericDocuments`, `unknown`
- Utilise les attributs `accept`, `aria-label`, les `<label for="...">`, et le `name`

### Attachement

`attachFileToInputFn()` crée un `File` via `new File([bytes], filename, {type: "application/pdf"})`, l'ajoute au `DataTransfer` du champ fichier, et dispatch les événements `input`, `change`, `blur`.

L'extension ne clique jamais sur un bouton Submit. L'utilisateur vérifie et soumet manuellement.

### PDFs serveur

Les PDFs sont générés côté serveur via `pdf-lib` en police Courier 11pt, format A4, avec retour à la ligne automatique.

## Nouveautés V2.8.3 — LinkedIn Easy Apply CV Upload Helper

- **Correction crash `chrome.downloads undefined`** : guard `chrome?.downloads?.download` avec fallback Blob URL + lien `<a download>`. Plus aucun crash même sans la permission `downloads`.
- **Détection LinkedIn Easy Apply** : détection automatique du modal "Postuler chez", de l'étape CV, du bouton "Télécharger le CV", et du bouton "Suivant".
- **Guide LinkedIn pas-à-pas** : instructions claires pour télécharger le CV adapté et le sélectionner manuellement dans LinkedIn.
- **Fallback `showDownloadedFile`** : si `chrome.downloads.show` indisponible, affiche le nom du fichier pour que l'utilisateur le retrouve dans ses Téléchargements.
- **Badge CV step** : affichage de l'avancement (ex: "Étape CV") détecté automatiquement.

## Nouveautés V2.8.2 — Indeed Resume Upload Helper

- **Upload assisté Indeed SmartApply** : détection des pages `smartapply.indeed.com`, guide pas-à-pas pour l'upload manuel.
- **Téléchargements nommés** : utilisation de `chrome.downloads.download` pour des noms propres (`ELTON_OS/CV_DUPONT_Jean.pdf`).
- **Presse-papier lettre** : boutons "Copier la lettre" et "Remplir le champ lettre".
- **Endpoint cover-letter-text** : `GET /api/application-drafts/[id]/documents/cover-letter-text`.

## LinkedIn Easy Apply — CV adapté

Sur les pages LinkedIn Easy Apply, la sélection manuelle du fichier est **obligatoire** car LinkedIn utilise un sélecteur de fichier système qui ne peut pas être automatisé par l'extension.

**Flux recommandé :**
1. Onglet **Documents** → Rechercher le dossier
2. Le badge "LinkedIn Easy Apply détecté" confirme la détection
3. Cliquer **Télécharger CV** pour obtenir le PDF avec le bon nom
4. Dans LinkedIn, cliquer sur **Télécharger le CV**
5. Sélectionner le PDF téléchargé par ELTON OS
6. Vérifier que le CV est bien affiché
7. **Ne pas cliquer automatiquement sur Suivant** — l'utilisateur vérifie et continue

**Pourquoi la sélection manuelle est nécessaire :**
- LinkedIn utilise un bouton "Télécharger le CV" qui ouvre la fenêtre système
- L'extension Chrome ne peut pas interagir avec la fenêtre système
- Le PDF est préparé avec le bon nom pour être facilement identifiable
- L'utilisateur garde le contrôle total de sa candidature

**Limites connues :**
- Pas d'attachement automatique sur LinkedIn Easy Apply
- Le champ fichier peut ne pas être accessible avant le clic sur "Télécharger le CV"
- Aucun clic automatique sur "Suivant" ou "Postuler"

## Plateformes testées

| Plateforme | Upload auto | Fallback manuel |
|---|---|---|
| LinkedIn (Easy Apply) | Manuel requis (guide pas-à-pas) | Oui |
| Indeed (SmartApply) | Manuel requis (guide pas-à-pas) | Oui |
| Indeed | Supporté | Oui |
| Greenhouse | Supporté | Oui |
| Lever | Supporté | Oui |
| Ashby | Supporté | Oui |
| Workable | Partiel | Oui |
| SmartRecruiters | Partiel | Oui |
| Pages carrière génériques | Variable | Oui |

## V2.8.5 — Nouveaux templates + Sélecteur extension

- **Sélecteur de modèle dans l'extension** : dropdown "Modèle CV" avec 4 options (Premium Leadership, Executive Bordeaux, Strategic Blue, Minimal Luxe)
- **Template parameter** : `?template=<id>` envoyé à l'endpoint documents/cv
- **3 nouveaux templates** : Executive Bordeaux, Strategic Blue, Minimal Luxe (voir [CV_TEMPLATES.md](../../docs/CV_TEMPLATES.md))

## V2.8.4 — CV Premium PDF

Depuis la V2.8.4, le CV PDF téléchargé depuis l'extension utilise le **template Premium Leadership** avec :
- Mise en page 2 colonnes (Parcours à gauche, Expertise à droite)
- Accent champagne (#C8A64E), fond d'en-tête sombre
- Typographie Helvetica (Bold, Regular, Oblique)
- Sections : Profil Exécutif, Parcours Professionnel, Expertise, Langues, Formation, Certifications, Poste Ciblé
- Badge "CV Premium · Leadership" dans l'interface Documents

Le fallback texte brut (Courier) reste disponible via `?fallback=plain` explicite.

## Limitations

- L'upload automatique dépend de la façon dont le site gère les champs fichier
- Certains sites utilisent des composants custom (non `<input type="file">`) qui ne peuvent pas être détectés
- Le fallback manuel est toujours disponible
- L'extension ne supporte pas le glisser-déposer (drag & drop)

## Sécurité

- Aucune soumission automatique de candidature
- Aucune lecture de cookies, sessions, mots de passe
- Aucun upload sans validation utilisateur explicite
- Tous les appels API passent par le serveur ELTON OS local
- Les PDFs ne contiennent que les données du profil candidat (pas d'invention)
