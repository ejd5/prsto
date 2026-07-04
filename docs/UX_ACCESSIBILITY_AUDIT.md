# ELTON OS — UX & Accessibility Audit

Generated: 2026-06-22
Scope: V2.9.0 UX Clarity + Accessibility + Beginner Mode

## Pages Audited

### 1. `/dashboard/jobs` (Dashboard)

| Aspect | Assessment |
|--------|-----------|
| Objectif | Vue d'ensemble des offres, tri, actions rapides |
| Complexité | Élevée — 10+ filtres, 2 onglets, barre recherche |
| Termes techniques | `semanticScore`, `reasonCode`, `USER_ASSISTED`, `AUTO_FIRECRAWL_SAFE`, `semanticConfidence` |
| Problèmes | Pas de zone "quoi faire aujourd'hui", pas d'empty state si aucune offre, loading basique, alert() natifs pour feedback |
| Accessibilité | Icônes seules sans aria-label, focus clavier limité |
| Priorité | Haute |

### 2. `/dashboard/jobs/applications/[id]` (Application Detail)

| Aspect | Assessment |
|--------|-----------|
| Objectif | Voir et gérer une candidature (documents, statut, pipeline) |
| Complexité | Élevée — 4 onglets, sections modifiables, actions multiples |
| Termes techniques | `matchScore`, `atsFormAnswers`, `changeLog`, `pipelineStatus` |
| Problèmes | Loading basique, pas de modal de succès après génération, alert() natif pour confirmation |
| Accessibilité | Zones cliquables petites, contrastes inégaux |
| Priorité | Haute |

### 3. `/dashboard/jobs/sources` (Safe Sources)

| Aspect | Assessment |
|--------|-----------|
| Objectif | Gérer les sources publiques de scanning |
| Complexité | Élevée — tableau, sélection multiple, lancement cron |
| Termes techniques | `sourceType`, `region`, `type` (job_board, executive), `priority` |
| Problèmes | 1360 lignes, pas de skeleton loading, messages techniques, alert() natif |
| Accessibilité | Checkbox sans label visible, tableau sans en-têtes ARIA |
| Priorité | Haute |

### 4. `/dashboard/jobs/importer` (Manual Import)

| Aspect | Assessment |
|--------|-----------|
| Objectif | Importer manuellement une offre depuis une URL |
| Complexité | Faible — un champ URL + bouton |
| Termes techniques | "Firecrawl Safe", "Fallback extraction" |
| Problèmes | Pas d'empty state, alert() pour erreur, pas de guidance |
| Priorité | Moyenne |

### 5. `/dashboard/jobs/importer/extension` (Extension)

| Aspect | Assessment |
|--------|-----------|
| Objectif | Aide pour configurer l'extension Chrome |
| Complexité | Faible — page d'info |
| Termes techniques | Trop techniques : "Chrome extension unpacked", "Draft ID" |
| Problèmes | Pas d'empty state si extension non détectée |
| Priorité | Moyenne |

### 6. `/dashboard/jobs/source-scanner` (Source Scanner)

| Aspect | Assessment |
|--------|-----------|
| Objectif | Scanner des sources pour découvrir des offres |
| Complexité | Moyenne — sources, historique, résultats |
| Termes techniques | `scanId`, `FOUND`, `MATCHED`, `REJECTED` |
| Problèmes | Pas d'empty state si aucun scan effectué, pas de skeleton |
| Priorité | Moyenne |

### 7. `/dashboard/jobs/reports` (Reports)

| Aspect | Assessment |
|--------|-----------|
| Objectif | Rapports de sourcing hebdomadaires |
| Complexité | Faible — liste de rapports |
| Termes techniques | Limité — "cron" dans les codes |
| Problèmes | 250 lignes, pas d'empty state |
| Priorité | Basse |

### 8. `/profil` (Profile)

| Aspect | Assessment |
|--------|-----------|
| Objectif | Gérer le profil exécutif |
| Complexité | Moyenne — formulaire structuré |
| Termes techniques | "Proof Vault", "CV Maître", années d'expérience en JSON |
| Problèmes | Pas de modales de succès après sauvegarde |
| Priorité | Basse |

### 9. `/cv-maitre` (Master CV)

| Aspect | Assessment |
|--------|-----------|
| Objectif | Importer et gérer le CV maître |
| Complexité | Faible — upload + aperçu |
| Termes techniques | "Parsing", "Extraction" |
| Problèmes | Pas de skeleton pendant parsing, alert() natif |
| Priorité | Moyenne |

### 10. `/proof-vault` (Proof Vault)

| Aspect | Assessment |
|--------|-----------|
| Objectif | Gérer les preuves de résultats |
| Complexité | Moyenne — tableau de proof entries |
| Termes techniques | Catégories : "CA", "P&L", "transformation_commerciale" |
| Problèmes | Pas de modale de succès après ajout, pas d'erreur utile |
| Priorité | Basse |

### 11. `/demarrage` (Getting Started)

| Aspect | Assessment |
|--------|-----------|
| Objectif | Guide pas-à-pas pour débuter — 1469 lignes très complètes |
| Complexité | Élevée mais volontaire — checklist complète |
| Termes techniques | "Proof Vault", "CV Maître", "Sources", "Pipeline", "Sourcing" |
| Problèmes | Très long — pourrait bénéficier de collapse/expand |
| Priorité | Basse (déjà bien fait) |

### 12. `/first-run` (First Run)

| Aspect | Assessment |
|--------|-----------|
| Objectif | Premier lancement — configuration initiale |
| Complexité | Faible — assistant pas-à-pas |
| Termes techniques | Limité |
| Problèmes | Confirm() natif pour suggestions |
| Priorité | Basse |

### 13. `/guide` (Guide)

| Aspect | Assessment |
|--------|-----------|
| Objectif | Documentation utilisateur intégrée |
| Complexité | Moyenne — 1490 lignes, beaucoup de texte |
| Termes techniques | Nombreux — documente les fonctionnalités avancées |
| Problèmes | Pas d'étapes numérotées claires, pas de section "10 minutes pour démarrer" |
| Priorité | Moyenne |

## Problèmes Transverses

### alert/confirm natifs
**37 occurrences** dans les pages app. Situations :
- Confirmation suppression (le plus fréquent ~12x)
- Feedback succès import (~5x)
- Erreurs API (~6x)
- Suggestions auto (~5x)
- Démo data (~4x)

### Empty states manquants
- Dashboard jobs : aucun
- Sources : aucun
- Importer : aucun
- Source scanner : aucun
- Reports : aucun
- CRM : aucun
- Entretiens : aucun
- Documents : aucun

### Loading states basiques
- Majorité utilisent un simple `Loader2` centré
- Pas de skeleton correspondant à la structure de la page
- Temps de chargement longs sans indication de progression

### Accessibilité
- Icônes seules : `Search`, `X`, `Trash2`, `RefreshCw` sans `aria-label`
- Modales : pas de focus trap, pas de fermeture Escape
- Contrastes : certains textes gris sur fond gris clair
- Boutons : zones cliquables petites sur mobile
- Navigation clavier : tabs order non vérifié

## Plan de Correction

1. Créer mode Simple/Expert (localStorage + composant Provider)
2. Créer composants UI : EltonModal, EltonToast, ConfirmDialog, SuccessModal
3. Créer EmptyState, SkeletonLoading composants réutilisables
4. Remplacer 37 alert/confirm natifs par composants custom
5. Ajouter empty states sur toutes les pages listées
6. Ajouter skeletons sur pages longue durée
7. Améliorer accessibilité (aria-labels, focus, contrastes)
8. Réorganiser dashboard : ajouter "Aujourd'hui, quoi faire ?"
9. Simplifier cartes offre : actions principales/secondaires
10. Améliorer /guide avec sections pratiques
