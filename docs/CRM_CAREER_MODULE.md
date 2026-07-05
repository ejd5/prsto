# ELTON OS V2.4 — CRM Carrière — Module recruteurs, cabinets et réseau

**Date :** 2026-06-20 | **Version :** V2.4

---

## Objectif

ELTON OS devient un cockpit de recherche d'opportunités pour cadre dirigeant.

Le CRM carrière permet de suivre :
- Les recruteurs et chasseurs de tête
- Les cabinets de recrutement (Turnpoint, Michael Page, Hays, etc.)
- Les entreprises cibles
- Les interactions (emails, appels, LinkedIn, notes)
- Les relances planifiées

---

## Modèles Prisma

### RecruiterContact

| Champ | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Identifiant |
| fullName | String | Nom complet |
| firstName | String? | Prénom |
| lastName | String? | Nom |
| email | String? | Email |
| phone | String? | Téléphone |
| linkedinUrl | String? | URL LinkedIn |
| roleTitle | String? | Poste (ex: "Directrice Adjointe") |
| companyName | String? | Société actuelle |
| firmName | String? | Cabinet de recrutement |
| contactType | String | recruiter, headhunter, hiring_manager, hr, founder, executive, network, unknown |
| relationshipStrength | String? | weak, new, active, strong |
| lastContactedAt | DateTime? | Dernier contact |
| nextFollowUpAt | DateTime? | Prochaine relance |

### CompanyTarget

| Champ | Type | Description |
|-------|------|-------------|
| name | String | Nom de l'entreprise |
| website | String? | Site web |
| linkedinUrl | String? | LinkedIn |
| sector | String? | Secteur |
| size | String? | startup, scaleup, pme, eti, grand_groupe |
| targetPriority | Int? | 1=haute, 2=moyenne, 3=basse |

### ContactInteraction

| Champ | Type | Description |
|-------|------|-------------|
| contactId | String? | Contact lié |
| applicationDraftId | String? | Candidature liée |
| jobId | String? | Offre liée |
| type | String | email, linkedin_message, phone_call, meeting, interview, note, follow_up, intro, other |
| direction | String | inbound, outbound, internal_note |
| outcome | String | positive, neutral, negative, pending |

---

## Pages

| Page | Description |
|------|-------------|
| `/dashboard/jobs/crm` | Liste des contacts, recherche, ajout |
| `/dashboard/jobs/crm/contacts/[id]` | Fiche contact avec historique, notes, candidatures liées |

---

## API Routes

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/crm/contacts` | GET | Liste contacts (avec ?q=recherche) |
| `/api/crm/contacts` | POST | Créer un contact |
| `/api/crm/contacts/[id]` | GET | Détail contact + interactions + drafts |
| `/api/crm/contacts/[id]` | PUT | Modifier contact |
| `/api/crm/contacts/[id]` | DELETE | Supprimer contact |
| `/api/crm/interactions` | GET | Liste interactions (contactId/draftId) |
| `/api/crm/interactions` | POST | Ajouter interaction |

---

## Règles de sécurité

- Aucun envoi automatique d'email
- Aucun scraping LinkedIn
- Aucune lecture de messages privés
- Les interactions sont créées manuellement
- Les relances sont des notes, pas des envois
- Pas de token/cookie exposé

---

## Tests

34 tests CRM (Vitest) :
- **RecruiterContact** : création (recruteur, chasseur, réseau), recherche (nom, cabinet), update, minimal
- **CompanyTarget** : création, liste
- **ContactInteraction** : email, note, LinkedIn msg, lastContactedAt, tri décroissant
- **Follow-ups** : dues aujourd'hui, futures exclues, silencieuses (14+ jours)
- **Link → draft** : liaison, delete contact → SetNull (ne casse pas le draft)
- **generateFollowUpMessage** : pas de Markdown, pas de placeholder
- **checkContactDuplicate** : email, LinkedIn, nom+société, même nom autre société, inconnu
- **createContactFromDraft** : liaison draft+contact, détection cabinet→headhunter
- **CRM Demo Data** : création, suppression, re-run → 3 contacts
- **getCrmDashboardSummary** : retourne toutes les clés
- **addInteractionFromDraft** : création note liée au draft (Prisma direct)
- **getDraftInteractions** : retourne un tableau
- **getApplicationDraft** : inclut `contact`, draft survit à la suppression du contact

## Procédure de migration

```bash
# Après modification du schema.prisma
npx prisma generate
npx prisma db push --accept-data-loss
```

## V2.4.2 — Intégration dans le cockpit candidature

| Intégration | Description |
|-------------|-------------|
| **Dashboard jobs** | Bloc "CRM Carrière" avec contacts, relances dues, cette semaine, cabinets |
| **Pipeline** | (À venir) Contact lié, bouton "Lier contact", "Ajouter interaction" |
| **ApplicationDraft** | (À venir) Panneau CRM avec lien contact, notes, relances |
| **Auth production** | Toutes les routes CRM protégées par `x-api-token` + `SOURCING_CRON_TOKEN` hors localhost |
| **Déduplication** | `checkContactDuplicate()` par email > LinkedIn > nom+société |
| **Mode démo** | `createCrmDemoData()` : 3 contacts, 2 compagnies, 5 interactions en `[DEMO]` |
| **Création depuis draft** | `createContactFromDraft(draftId)` préremplit companyName/firmName/contactType |

## V2.4.4 — CRM dans Pipeline + ApplicationDraft

| Intégration | Description |
|-------------|-------------|
| **Onglet CRM dans ApplicationDraft** | Panneau complet : contact lié, créer contact, notes, historique interactions, générer relance |
| **API `/api/application-drafts/[id]/crm`** | GET interactions, POST (addInteractionFromDraft, createContactFromDraft, linkContactToDraft) |
| **`addInteractionFromDraft(draftId, data)`** | Crée une interaction liée au draft + met à jour lastContactedAt du contact |
| **`getDraftInteractions(draftId)`** | Retourne les interactions triées par date, avec contact lié |
| **Pipeline (backend)** | `getApplicationDraft()` inclut maintenant `contact` — prêt pour affichage UI |
| **`linkContactToDraft`** | Accessible via `POST /api/application-drafts/[id]/crm {action:"link-contact", contactId}` |

## Limites

- Pas d'intégration email native (SMTP/IMAP)
- Pas de synchronisation LinkedIn automatique
- Les relances sont des templates à copier, pas des envois automatiques
- Affichage contact dans Pipeline (UI) à finaliser — le backend est prêt

---

## Checklist après modification Prisma

Toute modification de `prisma/schema.prisma` (nouveau champ, nouvelle relation, nouveau modèle) nécessite :

1. `npm run prisma:refresh` — régénère le client dans `./app/generated/prisma`
2. `npx prisma db push` — applique les changements à la DB (SQLite)
3. Redémarrer le serveur Next.js (`npm run dev:fresh`)
4. `npm run smoke:pipeline-api` — vérifie que l'API Pipeline retourne du JSON valide
5. `npm test` — vérifie qu'aucun test ne casse

> Un Prisma Client stale (généré avant la modif schema) fait planter les routes API avec des erreurs `Unknown field` au lieu de JSON valide, ce qui provoque `Runtime SyntaxError` côté client. Voir [DEV_RUNTIME_TROUBLESHOOTING.md](DEV_RUNTIME_TROUBLESHOOTING.md).
