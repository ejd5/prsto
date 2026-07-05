# ELTON OS — Firecrawl Safe : Guide utilisateur

**Date :** 2026-06-21 | **Version :** V2.6.6

---

## Qu'est-ce que Firecrawl Safe ?

Firecrawl Safe est l'outil d'import automatique d'ELTON OS pour les pages carrières **publiques et autorisées**. Il extrait le contenu visible des offres d'emploi sans jamais contourner de protection, sans automatiser de connexion, et sans scraper les plateformes fermées.

---

## Sources compatibles

Firecrawl Safe fonctionne avec :

- **ATS publics** : Greenhouse, Lever, Ashby, Workable, SmartRecruiters, Teamtailor, Recruitee
- **Pages carrières publiques** : toute page `/careers` ou `/jobs` sans login ni CAPTCHA
- **Pages avec JSON-LD JobPosting** : extraction automatique des données structurées

## Sources non compatibles (import assisté requis)

- **LinkedIn** — plateforme fermée avec session utilisateur
- **Indeed** — plateforme fermée avec protection anti-bot
- **APEC** — plateforme fermée avec authentification
- **Pages avec login** — nécessitent une connexion
- **Pages avec CAPTCHA / Cloudflare / DataDome** — protégées contre les bots

Pour ces sources, utilisez l'**extension Chrome ELTON OS** :
1. Ouvrez l'annonce dans votre navigateur
2. Cliquez sur l'extension ELTON OS
3. Validez les champs extraits
4. Cliquez sur "Importer dans ELTON OS"

Voir [CHROME_EXTENSION_IMPORT_ASSISTED.md](CHROME_EXTENSION_IMPORT_ASSISTED.md).

---

## Comment utiliser Firecrawl Safe

### Depuis le Source Scanner

1. Allez dans **/dashboard/jobs/source-scanner**
2. Repérez la section **"Firecrawl Safe"** (sources avec badges ATS Public, Public Auto, Firecrawl)
3. Cliquez sur **"Analyser via Firecrawl Safe"** à côté d'une source

### Depuis la page Firecrawl Safe

1. Allez dans **/dashboard/jobs/importer/firecrawl-safe**
2. Collez l'URL d'une page carrière publique (ex: `https://boards.greenhouse.io/stripe`)
3. Cliquez sur **"Scanner"**
4. Consultez la décision :
   - **Autorisé** : le tableau des offres détectées s'affiche
   - **Refusé** : le motif est expliqué et l'alternative est proposée
5. Si autorisé, **cochez les offres** que vous voulez importer
6. Cliquez sur **"Importer"**
7. Les offres sont importées avec leur score et apparaissent dans le dashboard

---

## Sources enregistrées (V2.6.5)

Pour les sources que vous consultez régulièrement, utilisez le **registre de sources** :

1. Allez dans **/dashboard/jobs/sources**
2. Cliquez sur **"Ajouter une source"**
3. Collez l'URL et donnez un label (ex: "Stripe Greenhouse")
4. Cliquez sur **"Vérifier"** pour voir la décision de conformité
5. Si autorisé, cliquez sur **"Ajouter"**

Une fois enregistrée, la source peut être :
- **Testée** (preview) : voir les offres sans rien importer
- **Lancée** (import) : import contrôlé avec limites et audit
- **Désactivée** : conservée mais ignorée par les runs

Le registre est accessible depuis :
- `/dashboard/jobs/sources` (page dédiée)
- Le lien "Sources enregistrées" dans Firecrawl Safe
- Le lien "Gérer les sources autorisées" dans le Source Scanner

### Rapport quotidien (V2.6.6)

Depuis `/dashboard/jobs/sources`, l'onglet **"Rapport quotidien"** affiche :
- Le résumé des 24 dernières heures (sources lancées, offres trouvées/importées, doublons, scores sémantiques)
- Le **Top 10** des offres importées, triées par score sémantique
- La liste des **sources en erreur** avec le nombre d'erreurs consécutives
- Les **refus par motif** (plateforme fermée, login requis, etc.)

Ce rapport est purement une requête base de données — aucun appel réseau Firecrawl.

### Starter Pack (V2.6.6)

Un script `npm run seed:safe-sources` crée 15 sources publiques vérifiées (Greenhouse, Lever, Ashby, Workable, pages carrières). Toutes sont créées **désactivées par défaut**. Voir [SAFE_SOURCE_STARTER_PACK.md](SAFE_SOURCE_STARTER_PACK.md).

### Mode go-live contrôlé (V2.6.6)

- **Erreurs consécutives** : après 3 échecs successifs, une source est automatiquement ignorée par les runs groupés
- **Cron désactivé par défaut** : `SAFE_SOURCES_CRON_ENABLED=false`, activable manuellement
- **Sélection multiple** : cochez plusieurs sources et lancez "Tester (N)" ou "Importer (N)"
- **Filtres** : par statut (Activées, Désactivées, Succès, Erreur)

---

## Le journal de conformité

Chaque tentative Firecrawl Safe produit un journal visible dans la page. Il affiche :

- L'URL source et le domaine normalisé
- La décision du scanner
- Le statut de conformité (allowed / refused / error)
- Le code raison (allowed_public_ats, refused_closed_platform, etc.)
- Le nombre d'offres extraites
- La durée de l'opération
- Les erreurs éventuelles

Ce journal garantit la **traçabilité complète** de chaque extraction.

---

## Ce que Firecrawl Safe ne fait JAMAIS

- Aucun auto-apply (candidature automatique)
- Aucun scraping derrière login
- Aucun CAPTCHA solving
- Aucun proxy evasion
- Aucune automatisation LinkedIn / Indeed / APEC
- Aucun stockage de cookies, sessions, mots de passe ou tokens
- Aucun mass scraping
- Aucun import sans validation utilisateur explicite

---

## Comment tester une URL publique

1. Copiez l'URL d'une page carrière (ex: `https://boards.greenhouse.io/stripe`)
2. Collez-la dans **/dashboard/jobs/importer/firecrawl-safe**
3. Cliquez sur **Scanner**
4. Vérifiez la décision de conformité (autorisée ou refusée)
5. Si autorisée, cochez les offres et importez
6. Vérifiez les offres dans le dashboard

## Que faire si une source est refusée

| Motif | Action recommandée |
|-------|-------------------|
| Plateforme fermée (LinkedIn, Indeed, APEC) | Utilisez l'**extension Chrome** — ouvrez l'annonce et importez |
| Connexion requise | Connectez-vous dans votre navigateur, puis utilisez l'extension Chrome |
| CAPTCHA / anti-bot | Ouvrez la page dans votre navigateur, utilisez l'extension Chrome |
| Domaine bloqué | Vérifiez si l'offre est disponible sur une autre source (site carrière direct) |
| Configuration absente | Contactez l'administrateur pour activer `FIRECRAWL_ENABLED=true` |

## Quand utiliser l'extension Chrome Import Assisté

Utilisez l'extension Chrome pour :
- Toute offre sur **LinkedIn, Indeed, APEC**
- Toute offre nécessitant une **connexion**
- Toute page avec **CAPTCHA ou protection anti-bot**
- Toute page où Firecrawl Safe retourne `refused`

L'extension lit le contenu visible de votre onglet actif et vous permet d'importer l'offre en un clic.

Voir [CHROME_EXTENSION_IMPORT_ASSISTED.md](CHROME_EXTENSION_IMPORT_ASSISTED.md).

## Comment vérifier les offres importées

Après un import réussi :

1. Cliquez sur **"Voir les offres importées"** dans la page Firecrawl Safe
2. Ou allez dans **/dashboard/jobs** — les offres apparaissent avec la source "Firecrawl Safe"
3. Chaque offre a un **score global** (globalScore) et un **score sémantique** (8 dimensions)
4. Cliquez sur une offre pour voir le détail et la section **"Pourquoi cette offre matche"**
5. Les avertissements de qualité (entreprise manquante, description courte) sont affichés dans la preview avant import

### Vérification du statut Firecrawl

Pour vérifier si Firecrawl Safe est correctement configuré :

```bash
curl http://localhost:3000/api/jobs/firecrawl-safe/status
```

Retour attendu :
```json
{
  "enabled": true,
  "configured": true,
  "maxPagesPerRun": 10,
  "timeoutMs": 30000
}
```

La clé API n'est **jamais** retournée.

## Dépannage

### "Configuration Firecrawl absente"
→ La variable `FIRECRAWL_ENABLED` n'est pas à `true` ou `FIRECRAWL_API_KEY` n'est pas configurée côté serveur.

### "Limite de taux atteinte"
→ L'API Firecrawl a temporairement limité les requêtes. Réessayez dans quelques minutes.

### "Timeout"
→ La page cible a mis trop de temps à répondre. Vérifiez que l'URL est correcte et accessible.

### "Échec du parsing"
→ Le contenu extrait n'a pas pu être interprété. L'URL pointe peut-être vers une page sans offres d'emploi.

### "Plateforme fermée"
→ Vous essayez d'importer depuis LinkedIn, Indeed ou APEC. Utilisez l'extension Chrome à la place.

---

## FAQ

**Q : Pourquoi LinkedIn est refusé alors que l'offre est publique ?**
R : LinkedIn exige une session utilisateur pour afficher le contenu complet des offres. L'extraction automatisée violerait leurs CGU et nécessiterait un contournement technique qu'ELTON OS ne pratique pas.

**Q : Puis-je importer plusieurs pages d'un coup ?**
R : Non. Firecrawl Safe traite une URL à la fois. Le paramètre `FIRECRAWL_MAX_PAGES_PER_RUN` limite le nombre de pages par exécution.

**Q : Les offres importées sont-elles scorées automatiquement ?**
R : Oui. Chaque offre importée reçoit un score local (`scoreJobLocal`) et une analyse sémantique (`analyzeJobFit`) qui évalue 8 dimensions de matching.

**Q : Comment voir les offres importées ?**
R : Elles apparaissent dans **/dashboard/jobs** avec les autres offres. Leur source est "Firecrawl Safe".
