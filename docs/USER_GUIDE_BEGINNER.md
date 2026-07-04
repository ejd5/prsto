# ELTON OS — Guide utilisateur débutant

## Installer et lancer ELTON OS

```bash
# 1. Cloner le projet
git clone <url-du-projet>
cd elton-os

# 2. Installer les dépendances
npm install

# 3. Initialiser la base de données
npm run db:migrate
npm run db:seed

# 4. Lancer l'application
npm run dev
```

Ouvrez http://localhost:3000 dans votre navigateur.

## 1. Importer son CV

1. Allez dans la page **CV Maître** (menu latéral gauche)
2. Collez le texte intégral de votre CV dans le champ
3. Cliquez **Enregistrer**
4. Les expériences et compétences sont extraites automatiquement

> **Important** : Conservez les dates exactes de début et fin de chaque expérience. Le système utilise ces dates pour adapter vos documents.

## 2. Vérifier son profil

1. Allez dans **Profil** (menu latéral gauche)
2. Vérifiez que toutes les informations sont correctes :
   - Nom, titre, résumé
   - Localisation et mobilité
   - Langues
   - Formation et certifications
3. Ajoutez vos secteurs d'activité et fonctions cibles

## 3. Importer une offre LinkedIn

**Option A — Extension Chrome :**
1. Ouvrez l'offre LinkedIn dans votre navigateur
2. Cliquez sur l'icône ELTON OS (en haut à droite de Chrome)
3. Onglet **Import Pro** → **Analyser l'offre visible**
4. Vérifiez l'aperçu → **Envoyer vers ELTON OS**

**Option B — Import Express :**
1. Allez dans **Import Express** (menu Sourcing)
2. Collez l'URL ou le texte de l'offre
3. Cliquez **Analyser** → vérifiez → **Importer**

## 4. Importer une offre Indeed

1. Ouvrez l'offre Indeed
2. Utilisez l'extension Chrome (icône ELTON OS → Import Pro → Analyser)
3. Vérifiez bien le titre et l'entreprise : Indeed peut parfois mélanger les informations
4. Envoyez vers ELTON OS

**Si l'extraction échoue :** copiez-collez le texte de l'offre dans Import Express.

## 5. Importer une offre APEC

Même principe que LinkedIn/Indeed :
1. Ouvrez l'offre APEC
2. Icône ELTON OS → Import Pro → Analyser → Envoyer

## 6. Générer CV + lettre de motivation

1. Allez dans **Opportunités**
2. Cliquez sur une offre
3. Cliquez **Préparer candidature**
4. Le système génère :
   - Un CV adapté à l'offre
   - Une lettre de motivation personnalisée
   - Un email de candidature
   - Un message LinkedIn
   - Des réponses ATS

> **Aucun document n'est envoyé automatiquement.** Vous devez les télécharger et les envoyer vous-même.

## 7. Télécharger un CV PDF premium

1. Depuis une candidature, allez dans l'onglet **Documents**
2. Cliquez sur **Télécharger PDF**
3. Choisissez parmi 6 templates :
   - ATS Classique (pour les ATS)
   - Premium Leadership (pour postes dirigeants)
   - Executive Bordeaux (timeline, élégant)
   - Strategic Blue (KPIs, business)
   - Minimal Luxe (épuré, luxe)
4. Le PDF se télécharge directement (pas de fenêtre d'impression)

## 8. Remplir un formulaire de candidature avec l'extension

1. Sur le formulaire ATS (Greenhouse, Lever, Ashby...), cliquez l'icône ELTON OS
2. Onglet **Autofill**
3. Collez le Draft ID → **Charger les champs**
4. **Détecter les champs** → vérifiez les correspondances
5. **Remplir les champs**
6. **C'est vous qui cliquez sur Envoyer** — l'extension ne soumet jamais automatiquement

## 9. Suivre ses candidatures dans le pipeline

1. Allez dans **Pipeline**
2. Les candidatures sont affichées en colonnes :
   - À postuler
   - En attente
   - Relance
   - Entretien
   - Offre
   - Refus
3. Déplacez les cartes en changeant le statut
4. Utilisez **Relance** pour générer un message de suivi

## 10. Ce que ELTON OS ne fait jamais automatiquement

- ❌ **Ne postule pas à votre place** — Aucun bouton "Postuler" automatique
- ❌ **N'envoie pas d'email** — Les messages sont générés pour copier-coller
- ❌ **Ne scrape pas LinkedIn** — Lit uniquement la page visible après votre clic
- ❌ **Ne contourne pas les CAPTCHA** — Si un login est demandé, l'extension se bloque
- ❌ **Ne stocke pas vos cookies** — Aucune session LinkedIn/Indeed/APEC conservée
- ❌ **N'envoie pas de données dans le cloud** — Tout reste sur votre machine
- ❌ **Ne collecte pas de données d'utilisation** — Aucune télémétrie, aucun analytics externe

## En cas de problème

| Problème | Solution |
|----------|----------|
| L'application ne démarre pas | Vérifiez que `npm install` a réussi |
| Page blanche | Vérifiez la console navigateur (F12) |
| Extension ne répond pas | Vérifiez que vous êtes sur linkedin.com, indeed.com ou apec.fr |
| Import échoue | Utilisez Import Express (copier-coller) comme alternative |
| Document non généré | Consultez la page Quality Check pour le diagnostic |
