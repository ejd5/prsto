# ELTON OS — Extension Chrome Import Assisté

**Date :** 2026-06-21 | **Version :** V2.6.2

---

## Objectif

Permettre l'import manuel d'offres d'emploi depuis des plateformes fermées (LinkedIn, Indeed, APEC, etc.) via une extension Chrome. L'utilisateur garde le contrôle total — **aucune automatisation**.

---

## Flux utilisateur

1. L'utilisateur ouvre manuellement l'annonce dans son navigateur
2. L'utilisateur clique sur l'extension Chrome ELTON OS
3. L'extension lit **uniquement le contenu visible** de l'onglet actif
4. Les champs extraits (titre, entreprise, description, etc.) sont affichés pour validation
5. L'utilisateur corrige/complète si nécessaire
6. L'utilisateur clique sur "Importer dans ELTON OS"
7. L'offre est importée via l'API ELTON OS
8. Le scoring sémantique est calculé automatiquement

---

## Ce que l'extension fait

- Lit le DOM de l'onglet actif (page déjà chargée par l'utilisateur)
- Extrait les champs visibles : titre, entreprise, localisation, description
- Propose les champs pour validation humaine
- Envoie les données validées à ELTON OS

## Ce que l'extension ne fait JAMAIS

- Aucun auto-apply (candidature automatique)
- Aucun scraping massif (une offre à la fois, action manuelle)
- Aucun auto-scroll agressif
- Aucun crawling caché (pages en arrière-plan)
- Aucun stockage de cookies, sessions, mots de passe ou tokens
- Aucune lecture de messages privés
- Aucune navigation automatique
- Aucune interaction avec l'interface sans action utilisateur explicite
- Aucune automatisation de connexion
- Aucun remplissage automatique de formulaire ATS

---

## Plateformes compatibles

L'extension fonctionne sur toute page web contenant une offre d'emploi visible, notamment :

- LinkedIn Jobs
- Indeed
- APEC
- Welcome to the Jungle
- Sites carrières d'entreprises
- Pages ATS publiques

L'extraction est basée sur le DOM visible — elle fonctionne même si la page n'a pas de JSON-LD ou d'API.

---

## Sécurité

- L'extension fonctionne en local uniquement
- Aucune donnée n'est envoyée avant validation utilisateur
- L'API ELTON OS reçoit uniquement les champs validés
- Les tokens d'authentification ELTON OS sont stockés localement dans le navigateur
- Aucune donnée de navigation n'est collectée

---

## Alternative à l'automatisation

Pour les sources où l'automatisation est impossible ou interdite (LinkedIn, Indeed, APEC), l'extension Import Assisté est la méthode recommandée.

Voir [FIRECRAWL_SAFE_CONNECTOR.md](FIRECRAWL_SAFE_CONNECTOR.md) pour les sources autorisées en extraction automatique.
