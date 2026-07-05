# ELTON OS — Roadmap

## Versions livrées

| Version | Date | Contenu |
|---------|------|---------|
| V1.0 | Mai 2026 | Profil, CV Maître, Proof Vault, Sources, Opportunités, Analyse, Documents, Pipeline legacy |
| V1.1 | Mai 2026 | Sourcing engine V1 : France Travail, JSON-LD, scoring 7D, déduplication |
| V1.2 | Mai 2026 | Préparation candidature IA : CV adapté, lettres, email, ATS, anti-invention, édition inline |
| V1.3 | Mai 2026 | Candidature assistée : champs pré-remplis, mark-as-sent, copie facile |
| V1.4 | Juin 2026 | Pipeline candidature : Kanban 8 colonnes, relances IA 4 formats, fallback local |
| V1.4.1 | Juin 2026 | Recette pipeline : bugs fixés (code mort, imports unused, revalidatePath) |
| V1.4.2 | Juin 2026 | Polish : fallback relance local, notification visuelle relances dues, commentaires follow_up_due |
| V1.5 | Juin 2026 | Analytics candidature : KPIs, segmentation source/score/location, activité hebdo, alertes |
| V1.5.1 | Juin 2026 | Recette analytics : bug offerRate, byLocationPriority, nettoyage code redondant |
| V1.6 | Juin 2026 | Onboarding : carte readiness sur /dashboard/jobs, navigation vers /demarrage |
| V1.6.1 | Juin 2026 | Polish onboarding : carte compacte, badges cliquables (?section=), CTAs contextuels |

---

## V1.7 — En cours

- [x] Documentation STATUS, DEMO_SCRIPT, ROADMAP
- [x] Mode démo léger (?demo=true)
- [x] Badge "Mode démo" sur /dashboard/jobs

---

## Prochaines priorités

### V1.8 — Polissage UI premium
- Micro-animations sur les transitions de page
- Squelettes de chargement (shimmer)
- Responsive mobile amélioré
- États vides illustrés (pas juste du texte)
- Amélioration des toasts/notifications
- Thème print pour exports

### V1.9 — Landing + Mode démo interactif
- Landing page commerciale (/) avec parcours guidé
- Mode démo avec données pré-remplies (pas de setup requis)
- Vidéo de démonstration ou walkthrough interactif
- Bouton "Essayer la démo" sur la landing

### V2.0 — Packaging SaaS
- Dockerfile + docker-compose
- Authentification utilisateur (NextAuth ou simple)
- Multi-tenant (un compte = un profil)
- Déploiement cloud (Vercel, Railway, ou VPS)
- Sauvegarde automatique de la DB
- Variables d'environnement de production

### V2.1 — Notifications & Automatisation
- Notifications email pour relances dues (SMTP)
- Résumé hebdomadaire automatique
- Rappel de suivi si pas d'activité depuis X jours
- Export automatique programmé

### V2.2 — Améliorations IA
- Fine-tuning des prompts par secteur
- Suggestions de mots-clés ATS par offre
- Analyse de la concurrence (autres candidats)
- Préparation aux entretiens (questions probables)
- Détection de soft skills dans les offres

### V2.3 — Connecteurs additionnels
- HelloWork, RegionsJob, Cadreo
- Sites corporate (Workday, SAP SuccessFactors)
- ATS directs (Greenhouse, Lever avec API)
- Agrégateurs (Google Jobs, Indeed API)

---

## Idées futures

- **Mode recruteur** : inverser la perspective, aider à filtrer des candidats
- **Mode réseau** : activation du réseau LinkedIn, recommandations
- **Mode freelance** : adaptation pour missions et portage salarial
- **Extension navigateur** : détection d'offres en un clic, auto-remplissage
- **App mobile** : PWA ou React Native pour suivi en déplacement
- **Communauté** : partage de statistiques anonymisées, benchmarks

---

## Principes directeurs

1. **Jamais d'envoi automatique** — candidature, email, relance, message
2. **Humain aux commandes** — l'IA suggère, l'humain décide
3. **Données locales** — SQLite, pas de cloud obligatoire
4. **Qualité > Quantité** — 50 bonnes candidatures valent mieux que 500 génériques
5. **Transparence** — chaque score est justifié, chaque génération est tracée
