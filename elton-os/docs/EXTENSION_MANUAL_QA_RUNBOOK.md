# ELTON OS — Extension Manual QA Runbook

## Préparation

1. Lancer ELTON OS : `npm run dev`
2. Ouvrir `chrome://extensions` → Mode développeur → Charger l'extension non empaquetée
   → sélectionner `browser-extension/elton-os-importer`
3. L'icône ELTON OS doit apparaître en haut à droite de Chrome
4. Vérifier que le serveur tourne sur `localhost:3000`

---

## LinkedIn

**Test 1 — Import simple**
- [ ] Ouvrir une annonce LinkedIn (ex: cherche "Directeur Commercial" sur LinkedIn)
- [ ] Cliquer icône ELTON OS → Import Pro → Analyser l'offre visible
- [ ] Vérifier : title correspond, entreprise correcte, lieu correct, description complète
- [ ] Vérifier : score de confiance affiché
- [ ] Cliquer Envoyer vers ELTON OS
- [ ] Vérifier : offre apparaît dans `/dashboard/jobs`
- [ ] Vérifier : source = "LinkedIn"
- [ ] Vérifier : pas de "Bienvenue, ELTON" ou titre parasite

**Test 2 — Import liste (max 10)**
- [ ] Ouvrir une page de résultats LinkedIn (recherche active)
- [ ] Cliquer Analyser les cartes visibles (max 10)
- [ ] Vérifier : les cartes sont listées
- [ ] Vérifier : pas plus de 10 cartes

**Test 3 — Pas d'auto-apply**
- [ ] Vérifier : aucun bouton "Postuler" dans l'extension
- [ ] Vérifier : aucun auto-submit
- [ ] Vérifier : l'extension ne clique jamais sur Suivant/Envoyer

## Résultat LinkedIn : READY / NEEDS FIX
Bug(s) : ________________________________

---

## Indeed

**Test 1 — Import annonce (panneau latéral)**
- [ ] Ouvrir une annonce Indeed (recherche → cliquer sur une offre)
- [ ] Cliquer icône ELTON OS → Import Pro → Analyser l'offre visible
- [ ] Vérifier : titre correct (pas "Bienvenue, ELTON" ou "Détails de l'emploi")
- [ ] Vérifier : entreprise correcte
- [ ] Vérifier : lieu correct
- [ ] Vérifier : salaire si présent
- [ ] Envoyer vers ELTON OS
- [ ] Vérifier : offre dans dashboard

**Test 2 — Fallback manuel**
- [ ] Si l'extraction échoue, utiliser Import Express (copier-coller)
- [ ] Vérifier : Import Express fonctionne

**Test 3 — SmartApply si applicable**
- [ ] Sur une page SmartApply Indeed, l'extension doit détecter la plateforme
- [ ] Documents tab doit fonctionner
- [ ] Fallback manuel disponible si SmartApply non détecté

## Résultat Indeed : READY / NEEDS FIX
Bug(s) : ________________________________

---

## APEC

**Test 1 — Import annonce**
- [ ] Ouvrir une annonce APEC
- [ ] Cliquer icône ELTON OS → Import Pro → Analyser l'offre visible
- [ ] Vérifier : titre, entreprise, lieu, description
- [ ] Envoyer vers ELTON OS
- [ ] Vérifier : offre dans dashboard

**Test 2 — Pas de scraping agressif**
- [ ] Vérifier : l'extension ne tente pas de contourner login/CAPTCHA

## Résultat APEC : READY / NEEDS FIX
Bug(s) : ________________________________

---

## Documents Tab

**Test 1 — CV premium téléchargeable**
- [ ] Depuis une offre importée, onglet Documents
- [ ] Cliquer Rechercher le dossier
- [ ] Badge CV vert = prêt
- [ ] Sélecteur de modèle disponible (Premium Leadership, Executive Bordeaux, etc.)
- [ ] Cliquer Télécharger CV
- [ ] Vérifier : PDF téléchargé, nom personnalisé, pas de print dialog

**Test 2 — Lettre de motivation**
- [ ] Badge Lettre vert = prêt
- [ ] Cliquer Télécharger Lettre
- [ ] Vérifier : PDF téléchargé

**Test 3 — Pack ZIP**
- [ ] Cliquer Télécharger Pack
- [ ] Vérifier : ZIP contient CV + Lettre

## Résultat Documents : READY / NEEDS FIX
Bug(s) : ________________________________

---

## Autofill Tab

- [ ] Sur formulaire ATS (Greenhouse, Lever, Ashby, Workable)
- [ ] Détection des champs fonctionne
- [ ] Remplissage correct
- [ ] Pas de Submit automatique

## Résultat Autofill : READY / NEEDS FIX
Bug(s) : ________________________________

---

## Décision finale
- [ ] **READY** — Tous les tests critiques passent
- [ ] **NEEDS FIX** — Voir bugs ci-dessus
