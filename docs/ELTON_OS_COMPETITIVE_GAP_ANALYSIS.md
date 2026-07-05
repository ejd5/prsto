# ELTON OS — Analyse concurrentielle & Roadmap

**Date :** 2026-06-20 | **Version :** V2.3

---

## Positionnement ELTON OS

ELTON OS est un **agent privé de recherche d'opportunités pour cadres dirigeants**.

**Notre promesse :** "ELTON OS vous prépare à postuler mieux, pas à spammer plus."

Positionnement différenciant :

- 🎯 Ciblage cadres dirigeants (Directeur Commercial, DG, VP Sales, Country Manager)
- 🇫🇷 Priorité France / marché français
- 🛡️ Contrôle humain total — aucune candidature automatique
- ✨ Qualité premium (CV 3 templates, photo, langues, IA profil source de vérité)
- ⚖️ Conformité totale (pas de scraping LinkedIn/Indeed, pas de contournement CAPTCHA)

---

## Ce qu'ELTON OS fait déjà (V2.2.5)

| Capacité | Statut | Détail |
|----------|:------:|--------|
| Sourcing automatique | ✅ | 12 sources ATS, France Travail, cron quotidien |
| Source Scanner | ✅ | Audit 37 sources, classification AUTO_ATS/USER_ASSISTED/MANUAL |
| Filtre profil Directeur Commercial | ✅ | `filterJobForTargetProfile()` — 638 tests de régression |
| Politique internationale | ✅ | France market / francophone / remote Europe uniquement |
| Import Express (copier-coller) | ✅ | `/dashboard/jobs/importer` + API `/api/jobs/importer/capture` |
| Extension Chrome | ✅ V1 | Manifest V3, popup, content-script, analyse+envoi |
| **CV IA** — 3 templates | ✅ | ATS Classique, Moderne Exécutif, Premium Leadership |
| Photo de profil | ✅ | Ronde, bien cadrée, paramétrable |
| 4 langues CV | ✅ | Français, Anglais, Espagnol, Portugais — source profil |
| LinkedIn masqué par défaut | ✅ | `cvIncludeLinkedIn=false` |
| Rémunération nettoyée | ✅ | `normalizeCompensationTarget()` — détection valeurs invalides |
| Pack candidature complet | ✅ | CV, lettre longue/courte, email, message recruteur, réponses ATS |
| Pipeline | ✅ | Suivi candidatures : envoyé, relance, entretien, offre |
| Analytics | ✅ | Performance par source, template, secteur |
| Rapports sourcing | ✅ | Cron `latest` sécurisé, dashboard "Dernier sourcing" |
| Mode démo | ✅ | Safe-by-default, données [DEMO] isolées |
| Sécurité | ✅ | Auth token cron, pas d'exposition publique des données sensibles |
| Scoring | ✅ | Local + DeepSeek fallback |
| Déduplication | ✅ | externalId + sourceUrl + checksum |

---

## Comparaison concurrentielle

### Job Copilot / LazyApply / Massive / Sonara

| Catégorie | Eux | ELTON OS |
|-----------|-----|----------|
| Auto-apply | ✅ Spam massif | ❌ Refusé stratégiquement |
| Extension Chrome | ✅ | ✅ V1 (analyse + envoi) |
| Autofill formulaire | ✅ | ❌ **MANQUE** |
| CV IA | ✅ Basique | ✅ Premium 3 templates |
| Lettre IA | ✅ | ✅ Longue + courte |
| Job tracker | ✅ | ✅ Pipeline + analytics |
| Sourcing auto | ❌ Non | ✅ 12 sources ATS + cron |
| Scoring / matching | ✅ Matching | ✅ Filtre profil + international |
| CRM recruteurs | ❌ Non | ❌ **MANQUE** |
| Préparation entretien | ✅ parfois | ❌ **MANQUE** |
| Contrôle humain | ❌ | ✅ Obligatoire |

### Huntr / Teal / Simplify

| Catégorie | Eux | ELTON OS |
|-----------|-----|----------|
| CV IA | ✅ | ✅ Supérieur (3 templates, photo, 4 langues) |
| Extension Chrome | ✅ Sauvegarde offres | ✅ V1 Import Express |
| Autofill | ✅ Assisté | ❌ **MANQUE** (planifié V2.3) |
| Job tracker | ✅ Kanban | ✅ Pipeline |
| Sourcing auto | ❌ | ✅ Unique |
| CRM | ✅ Huntr a un CRM | ❌ **MANQUE** |
| Analytics | ✅ Basique | ✅ Supérieur (source, template, secteur, scoring) |
| Préparation entretien | ❌ Non (Teal oui) | ❌ **MANQUE** |

---

## Gap Analysis — Ce qu'il manque à ELTON OS

### 🔴 CRITIQUE (prochaine brique)

| Gap | Pourquoi | Effort |
|-----|---------|--------|
| **Autofill assisté des formulaires** | Accélère la candidature sans auto-submit | Moyen |
| **Validation humaine avant toute action** | Déjà là — renforcer l'UX | Faible |
| **CRM recruteurs / cabinets** | Suivi des contacts, relances, historique | Élevé |
| **Préparation entretien** | Questions, pitch, STAR, plan 30/60/90 | Moyen |

### 🟡 IMPORTANT (après CRITIQUE)

| Gap | Pourquoi | Effort |
|-----|---------|--------|
| Matching sémantique avancé | NER, embeddings sur les offres | Élevé |
| Intelligence entreprise | Fiche entreprise, scoring employeur | Moyen |
| Suivi performance par source/template | Déjà en partie — enrichir | Faible |
| Recommandations stratégie candidature | "Postulez à X avant Y car..." | Moyen |

### 🟢 PLUS TARD

| Gap | Pourquoi | Effort |
|-----|---------|--------|
| Email/calendar intégration | Sync Gmail/Outlook | Élevé |
| Scoring marché | Benchmark salaires poste/secteur | Moyen |
| Benchmark rémunération | Glassdoor-like | Élevé |
| Assistant vocal / mock interview | IA conversationnelle | Élevé |

---

## Ce qu'il ne faut PAS copier

| Pratique | Pourquoi on refuse |
|----------|-------------------|
| Auto-submit massif | Contre nos valeurs, risque blocage, illégal dans certaines juridictions |
| Clic automatique sur Postuler | Même raison |
| Scraping massif LinkedIn/Indeed/APEC | Bloqué techniquement + CGU + éthique |
| Contournement CAPTCHA/login | Illégal (CFAA, GDPR) |
| Envoi sans validation humaine | Dangereux — une candidature mal calibrée brûle une opportunité |

---

## Roadmap recommandée

| Phase | Brique | Priorité |
|-------|--------|----------|
| **V2.3** | Extension Chrome Import Express V1 | ✅ FAIT |
| **V2.3** | Autofill assisté (spec + début implémentation) | 🔴 CRITIQUE |
| **V2.4** | CRM recruteurs / cabinets | 🔴 CRITIQUE |
| **V2.5** | Préparation entretien | 🔴 CRITIQUE |
| **V2.6** | Matching sémantique avancé | 🟡 IMPORTANT |
| **V2.7** | Intelligence entreprise | 🟡 IMPORTANT |
| **V3.0** | Email/calendar + scoring marché | 🟢 PLUS TARD |

---

## Prochaine brique recommandée : Autofill assisté (V2.3 complète)

### Pourquoi cette priorité ?

1. L'extension Chrome existe déjà (V1) — il manque juste l'autofill
2. C'est la demande n°1 des utilisateurs de ce type d'outil
3. Différenciant clé : autofill SANS auto-submit (personne ne le fait)
4. Effort modéré — réutilisation de l'infrastructure existante
5. Complète le cycle : trouver → analyser → préparer → **postuler**

### Principe

```
Extension détecte formulaire → ELTON OS propose les réponses → 
Utilisateur vérifie → Utilisateur clique "Remplir" → 
Extension remplit les champs → Utilisateur clique "Envoyer" sur le site externe
```

**Jamais de clic automatique sur Submit.**
