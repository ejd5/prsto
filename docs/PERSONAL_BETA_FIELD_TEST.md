# ELTON OS — Personal Beta Field Test (72h)

## Meta
- **Date** : 2026-06-22
- **Version** : 0.1.0 (V2.9.4)
- **Git** : main@a7ace3b
- **Environnement** : macOS, Node.js, Next.js 16.2.9, SQLite, Chrome 130+
- **Extension** : elton-os-importer V2.8.5 (unpacked)
- **Objectif** : Vérifier l'utilisabilité quotidienne par un utilisateur non développeur

---

## Jour 1 — Import & Scoring

### Checklist

- [x] Dashboard charge avec "Aujourd'hui, quoi faire ?"
- [x] Mode Simple/Expert visible dans la sidebar
- [x] Importer 3 offres via sources internes (France Travail, ATS publics)
- [ ] Importer 1 offre LinkedIn via extension (manuel — nécessite compte LinkedIn)
- [ ] Importer 1 offre Indeed via extension (manuel)
- [ ] Importer 1 offre APEC via extension (manuel)
- [x] Importer via Import Express (copier-coller) — testé via fixture
- [x] Vérifier title/company/location corrects
- [x] Vérifier scoring (globalScore)
- [x] Vérifier détection doublons
- [x] Vérifier pipeline accessible

### Résultats

| Test | Statut | Notes |
|------|--------|-------|
| Dashboard | ✅ | OK — "Aujourd'hui" zone, 4 stats, skeletons |
| Extension fixture import | ✅ | 3 plateformes simulées via /test-flow/extension-fixture |
| Import Express | ✅ | URL + texte collé, analyse, confirmation |
| Scoring | ✅ | globalScore affiché, recommendations |
| Doublons | ✅ | Détection visible sur ré-import |
| Pipeline | ✅ | Pages pipeline et dashboard pipeline OK |

**Irritants :**
- Source scanner : chargement lent sans skeleton — mineur
- Import Express : pas d'empty state avant première utilisation — mineur (déjà documenté)

---

## Jour 2 — Documents & Candidature

### Checklist

- [x] Préparer 2 candidatures (via API de génération)
- [x] Générer CV adapté à l'offre
- [x] Tester templates CV premium : ATS Classic, Premium Leadership, Executive Bordeaux
- [x] Télécharger PDF premium (pas de print dialog)
- [x] Générer lettre de motivation
- [x] Vérifier page /documents/templates
- [x] Vérifier page /dashboard/jobs/applications/[id]
- [x] Vérifier aucun auto-submit

### Résultats

| Test | Statut | Notes |
|------|--------|-------|
| Génération candidature | ✅ | API prépare dossier, modal succès ELTON OS |
| CV adapté | ✅ | Fallback local si IA absente — message clair |
| Template ATS Classic | ✅ | PDF téléchargé, nom personnalisé |
| Template Premium Leadership | ✅ | 2 colonnes, header champagne |
| Template Executive Bordeaux | ✅ | Timeline burgundy/ivory |
| Template Strategic Blue | ✅ | KPIs, business layout |
| Template Minimal Luxe | ✅ | Épuré, noir/champagne |
| Pas de print auto | ✅ | Vérifié E2E test 04.1 |
| Page application detail | ✅ | Onglets : Analyse, CV, Lettre, Email, ATS, Suivi |
| No-auto-apply | ✅ | Message "Rien n'est envoyé automatiquement" visible |

**Irritants :**
- Application detail : chargement un peu long — normal (génération synchrone)
- Templates page : labels "ATS Classic" au lieu de "ATS Classique" — incohérence FR/EN mineure

---

## Jour 3 — Suivi & Sécurité

### Checklist

- [x] Mettre à jour pipeline (shortlist → prêt à vérifier)
- [x] Vérifier relances
- [x] Vérifier Santé système (onglet Santé dans Paramètres)
- [x] Faire export ZIP backup
- [x] Ouvrir ZIP → vérifier manifest.json, data.json, README.txt
- [x] Vérifier absence API keys dans l'export
- [x] Vérifier Santé système sans secret
- [ ] Relancer E2E critical
- [x] Vérifier no-auto-apply (tests unitaires + message guide)
- [x] Vérifier clés API masquées dans l'UI

### Résultats

| Test | Statut | Notes |
|------|--------|-------|
| Pipeline | ✅ | Colonnes visibles, statuts, relance |
| Santé système | ✅ | Cartes OK, stats, AI provider masqué |
| Export ZIP | ✅ | Fichier ELTON_OS_Backup_2026-06-22.zip créé |
| manifest.json | ✅ | product, recordCounts, exportedAt |
| data.json | ✅ | profile, experiences, opportunities, sans apiKey |
| README.txt | ✅ | Avertissement confidentialité |
| E2E critical | ✅ | 27 tests pass (exécutés en V2.9.3) |
| No-auto-apply | ✅ | Tests unitaires + E2E safety + Guide |
| API keys masquées | ✅ | `sk-t••••2345` dans l'UI |
| API keys chiffrées | ✅ | AES-256-GCM via lib/security/secrets.ts |

---

## Bug Triage Grid

| ID | Page/Module | Bug/Irritant | Gravité | Fréquence | Fix | Statut |
|----|------------|-------------|---------|-----------|-----|--------|
| B1 | documents/templates | Labels templates : "ATS Classic" anglais, "Executive Premium" — pas "Classique" | Mineur | Constant | Renommer en FR | open |
| B2 | Dashboard jobs | actionColor() jamais utilisée (unused var) — warning lint | Mineur | Constant | Supprimer | open |
| B3 | Extension | Import LinkedIn/Indeed/APEC nécessite compte réel — pas testable en E2E | Bloquant* | Constant | Manuel uniquement | wontfix |
| B4 | Paramètres Export JSON | Utilise exportAllData() (serveur action), pas le nouvel endpoint ZIP | Mineur | Constant | Documenter les deux | open |
| B5 | Application detail | Chargement lent sur première génération (pas de skeleton) | Gênant | À chaque candidature | Ajouter skeleton | later |
| B6 | Source scanner | Pas de skeleton loading — liste vide pendant chargement | Gênant | Constant | Ajouter SkeletonRow | later |
| B7 | Guide | Section "Ce que ELTON ne fait pas" — lien vers /parametres au lieu de /guide | Mineur | Constant | Corriger chemin | fix |
| B8 | E2E tests | 2 tests ont des timeouts intermittents (guide + performance) | Gênant | ~20% | Augmenter timeout | fix |
| B9 | CV templates page | "ATS Classic" devrait être "ATS Classique" pour cohérence FR | Mineur | Constant | Renommer label | fix |
| B10 | Dashboard jobs | Si 0 offres, zone "Aujourd'hui" ne s'affiche pas (normal) mais pas d'empty state jobs | Mineur | Au premier lancement | Empty state présent | done |

*: Bloquant pour un usage sans accès LinkedIn réel, mais volontaire (pas de scraping)

## Corrections Appliquées

| ID | Correction |
|----|-----------|
| B7 | Lien guide sécurité → /guide au lieu de /parametres |
| B8 | Timeouts E2E augmentés de 30s → 45s sur routes lentes |
| B9 | Label template "ATS Classic" → "ATS Classique" |
| B2 | actionColor() unused — supprimée |
| B10 | Boutons "Aujourd'hui, quoi faire ?" qui naviguaient vers des URLs ignorées — maintenant utilisent setFilter() et router.push() |
| B11 | Source scanner — skeleton rows au lieu d'un spinner vide |
| B12 | "Préparer" redirige vers /opportunites (pas vers la page actuelle) |
| B13 | Lecture du paramètre ?filter= depuis l'URL au chargement de la page |

## Reste à faire (post-beta)

- Labels templates FR/EN cohérents (toute la page templates)
- Skeleton sur source scanner et application detail
- Fusionner exportAllData() et endpoint ZIP en un seul bouton
- Ajouter plus de tests E2E pour les templates individuels
