#!/usr/bin/env python3
"""Génère le rapport d'analyse PRSTO en HTML self-contained."""

import os, json, datetime
from pathlib import Path

OUTPUT = "/home/z/my-project/download/PRSTO_analyse_strategique.html"

# ─────────────────────────────────────────────────────────────────────────────
# DATA (collectée lors du scan du projet + recherches web)
# ─────────────────────────────────────────────────────────────────────────────

PROJECT_FACTS = {
    "name_code": "elton-os",
    "name_brand": "PRSTO",
    "name_long": "PRSTO — Le copilote carrière IA des cadres dirigeants",
    "stack": "Next.js 16.2.9 (Turbopack), React 19.2, Prisma 5.22, SQLite, TypeScript",
    "ai_providers": "NVIDIA NIM (gratuit), DeepSeek via NIM",
    "lines_ts_tsx": 479,
    "prisma_models": 38,
    "nav_sections": 6,
    "nav_items": 17,
    "landing_components": 30,
    "extension_platforms": ["LinkedIn", "Indeed", "APEC", "Cadremploi", "HelloWork", "Welcome to the Jungle"],
    "pricing_week": 9.90,
    "pricing_month": 39.90,
    "pricing_3months": 89.90,
    "pricing_6months": 149.90,
    "colors": {
        "primary_dark": "#0E3A29",
        "primary_darker": "#0B2E21",
        "accent_gold": "#E4B118",
        "accent_gold_light": "#F2C94C",
        "bg_cream": "#FAF6EF",
        "bg_paper": "#FFFDF8",
        "text_dark": "#0B1F18",
        "text_muted": "#6A8F6D",
    }
}

COMPETITORS = [
    {
        "name": "LinkedIn Premium Career",
        "type": "Réseau social + offres",
        "audience": "Tous niveaux, mass market",
        "traffic": "~1 Md membres, ~310 M actifs/mois",
        "pricing": "39,99 €/mois",
        "strengths": [
            "Base de données d'offres la plus large au monde",
            "Réseau social intégré (networking natif)",
            "AI coach récent (2024) pour Premium",
            "Notoriété mondiale, habitus recruteur",
        ],
        "weaknesses": [
            "Très généraliste — pas de focus executive",
            "Aucun outil structuré (pas de pipeline, pas de CRM recruteur)",
            "Pas de CV maître, pas de scoring d'offres",
            "Premium n'apporte pas grand-chose pour un cadre dirigeant",
            "Auto-apply massif = décrédibilisation de la candidature",
        ]
    },
    {
        "name": "APEC",
        "type": "Job board institutionnel",
        "audience": "Cadres France",
        "traffic": "2,45 M visites/mois",
        "pricing": "Gratuit (candidat)",
        "strengths": [
            "Le job board de référence des cadres en France",
            "Notoriété institutionnelle forte",
            "Offres négociées et qualifiées",
            "600 conseillers en présentiel",
        ],
        "weaknesses": [
            "UX datée, processus d'inscription lourd",
            "Aucun outil IA, pas de CV adapté, pas de tracking",
            "Catalogue d'offres surtout middle management",
            "Aucune valeur ajoutée côté préparation entretien",
        ]
    },
    {
        "name": "Cadremploi",
        "type": "Job board cadre",
        "audience": "Cadres France",
        "traffic": "~1,5-2 M visites/mois (estimation)",
        "pricing": "Gratuit (candidat)",
        "strengths": [
            "Large choix d'offres cadres",
            "Partenariats cabinets (Michael Page, Hays, Robert Half)",
            "Contenu éditorial (conseils carrière)",
        ],
        "weaknesses": [
            "UX datée, pas de différenciation executive",
            "Aucun outil d'optimisation (CV, lettre, ATS)",
            "Pas de tracking, pas de CRM",
            "Généraliste cadre, pas premium dirigeant",
        ]
    },
    {
        "name": "Welcome to the Jungle",
        "type": "Job board branding",
        "audience": "Cadres tech/marketing jeunes",
        "traffic": "3,5 M visites/mois (catégorie #6 mondiale)",
        "pricing": "Gratuit (candidat)",
        "strengths": [
            "Très belle UX, photos/videos entreprises",
            "Forte notoriété chez 25-40 ans urbains",
            "Marque employeur bien faite",
        ],
        "weaknesses": [
            "Orienté startup/tech, pas executive",
            "Pas d'outils IA, pas de CV optimizer",
            "Pas de préparation entretien",
            "Marché français uniquement",
        ]
    },
    {
        "name": "HelloWork",
        "type": "Job board généraliste",
        "audience": "Tous niveaux",
        "traffic": "Top 4 mondial catégorie Jobs & Employment",
        "pricing": "Gratuit (candidat)",
        "strengths": [
            "Large volume d'offres",
            "Présent sur tous les secteurs",
        ],
        "weaknesses": [
            "Très généraliste",
            "Aucune valeur ajoutée pour les cadres dirigeants",
            "Pas d'outils IA",
        ]
    },
    {
        "name": "Experteer",
        "type": "Job board premium executive",
        "audience": "Cadres supérieurs Europe",
        "traffic": "Niche (non publié)",
        "pricing": "12-30 €/mois",
        "strengths": [
            "Positionnement executive clair (€60k+)",
            "Accès direct chasseurs de tête",
            "Présent dans 10 pays EU + US",
            "Confidentialité des profils",
        ],
        "weaknesses": [
            "UX datée, peu d'innovation",
            "Pas d'IA, pas de CV optimizer",
            "Pas de CRM recruteur structuré",
            "Modèle job board, pas copilote",
        ]
    },
    {
        "name": "Teal HQ",
        "type": "AI job search copilote",
        "audience": "Tous niveaux (US-centric)",
        "traffic": "~1-2 M visites/mois (estimation)",
        "pricing": "Gratuit + Teal+ 9 $/semaine ou 29 $/mois",
        "strengths": [
            "Chrome extension job tracker excellente",
            "Resume builder gratuit illimité",
            "Pricing transparent, freemium généreux",
            "UX moderne et claire",
        ],
        "weaknesses": [
            "Pas de focus executive",
            "Pas de CRM recruteur, pas de market radar",
            "Mock interview très basique",
            "Pas d'extension Chrome pour scraper le contenu des offres",
        ]
    },
    {
        "name": "Jobscan",
        "type": "ATS scanner",
        "audience": "Tous niveaux US",
        "traffic": "~3-5 M visites/mois (estimation)",
        "pricing": "49,95 $/mois",
        "strengths": [
            "Leader ATS scanning",
            "Algorithme de matching keyword mature",
            "LinkedIn optimizer inclus",
            "AI cover letter generator",
        ],
        "weaknesses": [
            "Un seul outil (scanner), pas d'écosystème",
            "Cher pour ce que c'est",
            "Pas de tracking, pas de CRM, pas de mock interview",
            "Pas de focus executive",
        ]
    },
    {
        "name": "Huntr",
        "type": "Job tracker + autofill",
        "audience": "Tous niveaux US",
        "traffic": "~500k-1 M visites/mois (estimation)",
        "pricing": "Gratuit (100 jobs) + Pro 40 $/mois",
        "strengths": [
            "Chrome extension autofill très bonne",
            "Job tracker Kanban propre",
            "Free tier généreux",
        ],
        "weaknesses": [
            "40 $/mois = cher pour un simple tracker",
            "Caps à 100 jobs en gratuit",
            "Pas d'IA, pas de CV optimizer avancé",
            "Pas de focus executive",
        ]
    },
    {
        "name": "Simplify",
        "type": "AI autofill + matching",
        "audience": "Tech/jeunes diplômés US",
        "traffic": "~1 M visites/mois (estimation)",
        "pricing": "Gratuit + premium",
        "strengths": [
            "Autofill très rapide",
            "Matching basé sur 1 profil unique",
            "UX moderne, ciblée GenZ tech",
        ],
        "weaknesses": [
            "Auto-apply massif = anti-pattern executive",
            "Pas de CRM recruteur",
            "Pas de préparation entretien",
            "Marché US essentiellement",
        ]
    },
    {
        "name": "Loopcv",
        "type": "Auto-apply massif",
        "audience": "Tous niveaux international",
        "traffic": "Niche",
        "pricing": "30-80 $/mois",
        "strengths": [
            "Volume d'envoi automatique",
            "Multi-sources",
        ],
        "weaknesses": [
            "Modèle à risque (auto-apply = mauvaise qualité)",
            "UX datée",
            "Pas adapté executive (un DG ne se postule pas en masse)",
        ]
    },
    {
        "name": "Sonara",
        "type": "Auto-apply IA",
        "audience": "US",
        "traffic": "Niche",
        "pricing": "50-80 $/mois",
        "strengths": [
            "IA qui choisit les offres",
        ],
        "weaknesses": [
            "Modèle décrédibilisé (auto-apply)",
            "Pas adapté executive",
        ]
    },
    {
        "name": "Page Executive / Michael Page",
        "type": "Cabinet de chasse",
        "audience": "Top management",
        "traffic": "Niche (cabinets)",
        "pricing": "Gratuit (candidat)",
        "strengths": [
            "Accès missions exclusives top management",
            "Conseillers seniors",
            "Réseau direct avec boards",
        ],
        "weaknesses": [
            "Pas un outil — passif (on vous appelle)",
            "Pas de préparation structurée",
            "Pas de CRM bidirectionnel",
        ]
    },
]

# Recommandations stratégiques
RECOMMENDATIONS = [
    # (catégorie, titre, priorité, effort, impact, description détaillée)
    ("Positionnement", "Verrouiller le positionnement « Executive Only »", "CRITIQUE", "FAIBLE", "ÉLEVÉ",
     "Aujourd'hui la landing parle de « cadres dirigeants » mais le menu mélange des termes qui pourraient s'appliquer à tout cadre. "
     "Verrouiller en ajoutant un filtre d'éligibilité (experience ≥ 8 ans, fonctions C-level/DG/Direction Générale/Comex). "
     "Ajouter une question d'onboarding : « Combien d'années d'expérience en management d'équipe ? » avec un seuil minimum. "
     "Transformer le tagline en : « Le copilote carrière IA pour dirigeants — DG, DGD, CEO, COO, CFO, CTO, CMO, Country Manager, VP ». "
     "Experteer le fait bien avec son seuil €60k+. Faire pareil mais avec un seuil d'expérience + taille d'équipe."),

    ("Positionnement", "Créer une page « Manifeste executive » dédiée", "HAUTE", "MOYEN", "ÉLEVÉ",
     "Les dirigeants n'achètent pas un outil, ils achètent une vision. Créer une page /manifeste qui pose : "
     "« Un process de recrutement de dirigeant dure 6-18 mois, traverse 7-12 étapes, mobilise 15-30 interlocuteurs. "
     "Les outils généralistes (LinkedIn, APEC) ne sont pas calibrés pour cette durée et cette complexité. » "
     "Y inclure une infographie du pipeline type (Sourcing → Brief cabinet → 1er call → Case study → Panel → Final → Négociation → Onboarding). "
     "Cette page devient le centre de la differentiation et le hub SEO pour « recherche emploi dirigeant »."),

    ("Positionnement", "Tagline à retravailler", "HAUTE", "FAIBLE", "MOYEN",
     "Actuel : « Votre prochain poste ne se trouve pas. Il se prépare. » — bon mais pas assez distinctif. "
     "Propositions : "
     "• « Le copilote carrière des dirigeants. 18 mois de process, 18 outils réunis. » "
     "• « Vous n'envoyez pas un CV. Vous pilotez une campagne. » "
     "• « Pour les cadres qui ne postulent plus — ils se positionnent. » "
     "Faire un A/B test sur la landing via Vercel Edge Config."),

    ("Branding", "Cohérence du nom PRSTO vs elton-os", "CRITIQUE", "FAIBLE", "ÉLEVÉ",
     "Le code source et 80% des URLs/routes utilisent « elton-os » (route /elton-os, API /api/elton-os, dossier browser-extension/elton-os-importer). "
     "La landing utilise « PRSTO ». Le CV PDF généré s'appelle encore « elton-os ». "
     "Cela crée une confusion utilisateur ET technique. Action : "
     "(1) Faire un grand rename /elton-os → /prsto dans les routes publiques ; "
     "(2) Renommer browser-extension/elton-os-importer → browser-extension/prsto-importer ; "
     "(3) Mettre à jour tous les libellés UI (« Guide PRSTO » déjà OK, mais vérifier les pages PDF, exports, emails) ; "
     "(4) Garder le code interne elton-os si voulu, mais le brand côté utilisateur doit être 100% PRSTO."),

    ("Menu", "Renommer « Tableau de bord » → « Cockpit »", "MOYENNE", "FAIBLE", "MOYEN",
     "« Tableau de bord » est trop générique. Un dirigeant pilote un cockpit, pas un tableau de bord. "
     "Renommer en « Cockpit » ou « Quart de bord » (vocabulaire maritime/pilotage). "
     "Renommer aussi : "
     "• « Performance » → « Indicateurs de campagne » "
     "• « Opportunités » → « Pipelines ouverts » "
     "• « Candidatures » → « Missions en cours » "
     "• « Insights marché » → « Radar marché » "
     "• « Mes Offres » (section) → « Ma campagne » "
     "• « Documents & CV » → « Mes arsenaux » (ou « Matériel de campagne ») "
     "• « Préparation » → « Training Camp » "
     "• « Compte » → « Réglages » (raccourcir, virer le guide d'ici)"),

    ("Menu", "Restruvturer la navigation en 4 sections au lieu de 6", "HAUTE", "MOYEN", "ÉLEVÉ",
     "6 sections × 17 items = trop chargé pour une sidebar de 220px. "
     "Réorganiser en 4 blocks : "
     "1. CAMPAGNE (Cockpit, Pipelines, Missions en cours, Radar marché) — 4 items "
     "2. ARSENAUX (CV Maître, Documents, Proof Vault) — 3 items "
     "3. TRAINING (Entretiens, Mock Interview Panel, Interview Prep Library) — 3 items "
     "4. INTELLIGENCE (Recherche IA, AI CV Optimizer, LinkedIn Optimizer, Conseiller) — 4 items "
     "5. RÉGLAGES (Mon Profil, Paramètres, Guide) — 3 items en bas, séparés "
     "Total : 17 items conservés mais groupés plus logiquement. Le cerveau humain lit 4±2 chunks, pas 6."),

    ("Menu", "Ajouter « Conseiller » dans le menu principal", "HAUTE", "FAIBLE", "ÉLEVÉ",
     "Le « Conseiller PRSTO » existe dans le code (lib/conseiller/) mais n'a pas d'entrée visible dans le menu. "
     "C'est pourtant LA fonctionnalité « second brain » qui différencie PRSTO. "
     "L'ajouter comme 5e item de INTELLIGENCE avec une pastille « IA » dorée et un CTA en bas de sidebar : "
     "« Une question sur votre campagne ? Demandez à votre Conseiller → » "
     "Le distinguer des autres outils IA (qui font des actions) en le présentant comme un chat permanent."),

    ("Landing", "Hero trop focalisé sur la souffrance, pas assez sur la solution", "HAUTE", "MOYEN", "ÉLEVÉ",
     "Actuellement : « Vous postez depuis 6 mois sans résultat ? Et si le problème n'était pas vous, mais votre méthode ? » "
     "Cette approche culpabilisante marche mal pour des dirigeants (egos fragiles après un échec de recherche). "
     "Reformuler positivement : « Votre prochain poste de direction se mérite. PRSTO vous donne les 18 outils pour le décrocher. » "
     "Garder le compteur de jours depuis lequel ils recherchent mais en mode « plus tu attends, plus tu as besoin de méthode »."),

    ("Landing", "Stats à valider/actualiser", "MOYENNE", "FAIBLE", "MOYEN",
     "Stats actuelles : 87% de succès, 300+ cadres accompagnés, 17 ATS supportés, 8s génération CV. "
     "Si 300+ cadres accompagnés = vrai, ajouter une section « Cas clients » avec 3-5 mini-cases studies anonymisées (secteur, fonction, durée, résultat). "
     "Si c'est une projection, retirer et remplacer par des KPI de produit : « 18 outils intégrés », « 6 sources d'offres scannées », « 1 extension Chrome multi-plateformes ». "
     "Les témoignages actuels sont bien mais trop génériques. Remplacer par des témoignages qui citent un outil précis utilisé."),

    ("Landing", "Pricing : ajouter un plan Elite/Dirigeant", "HAUTE", "MOYEN", "ÉLEVÉ",
     "Actuellement : Gratuit / Pro (39,90 €/mois) — sans différenciation des profils. "
     "Pour des dirigeants qui dépensent 50-200k € en chasseurs de tête, 39,90 €/mois paraît suspect (trop cheap). "
     "Ajouter un 3e plan : "
     "• ELITE / DIRIGEANT — 149 €/mois ou 999 €/6 mois "
     "• Inclus : Conseiller IA illimité, Market Radar temps réel, Mock Interview Panel illimité, "
     "  Accès anticipé nouvelles sources, Coaching humain 1h/mois, Support prioritaire "
     "Cela crée un ancrage psychologique (le Pro paraît accessible, l'Elite valide la valeur pour ceux qui veulent tout). "
     "Experteer facture 30 €/mois pour un simple job board. PRSTO peut demander 149 € pour un copilote complet."),

    ("Features", "Le « Proof Vault » est sous-exploité — en faire un USP", "HAUTE", "MOYEN", "ÉLEVÉ",
     "Le Proof Vault (preuves de réalisations structurées) est une excellente idée qui n'existe chez aucun concurrent. "
     "Le positionner comme un USP central : « Le Proof Vault transforme votre mémoire en arsenal. "
     "Chaque réalisation indexée, qualifiée, prête à être déployée en entretien ou dans un CV adapté. » "
     "Y connecter le mock interview (le panel IA pioche dans le Proof Vault pour challenger sur vos preuves). "
     "Y connecter le CV Optimizer (sélection automatique des 5 preuves les plus pertinentes pour une offre donnée). "
     "C'est le « second brain » que vous évoquez."),

    ("Features", "Activer le « second brain » complet via le Conseiller", "HAUTE", "MOYEN", "ÉLEVÉ",
     "Le code du Conseiller existe (lib/conseiller/conseiller-engine.ts) mais c'est un simple chatbot avec liste blanche de topics. "
     "Le transformer en vraie mémoire longue : "
     "(1) À chaque interaction (candidature, entretien, appel recruteur), le Conseiller ingère un résumé ; "
     "(2) Il peut répondre : « La dernière fois que vous avez postulé chez LVMH, vous aviez mis en avant votre transformation digitale — voici comment l'adapter à cette offre L'Oréal. » ; "
     "(3) Il génère chaque semaine un brief matinal : « 3 candidatures en attente de relance, 1 entretien à préparer, 2 nouvelles offres à scoring >80%. » ; "
     "(4) Utiliser le NVIDIA NIM (gratuit) en backend, vectoriser via embeddings locaux pour la confidentialité. "
     "C'est exactement la différenciation que vous cherchez vs LinkedIn/Teal/Jobscan."),

    ("Features", "Mock Interview Panel — étoffer à un vrai panel de 5+ profils", "HAUTE", "MOYEN", "ÉLEVÉ",
     "Le Mock Interview existe mais semble mono-interlocuteur. Pour des dirigeants, le panel type c'est : "
     "• 1 CEO / N+1 "
     "• 1 DRH / Chief People Officer "
     "• 1 futur pair (ex: autre membre du Comex) "
     "• 1 investisseur / board member "
     "• 1 cas pratique / case study "
     "Implémenter un mode « Panel Complet » où l'IA joue les 5 rôles en séquence, puis délivre un débrief 360°. "
     "Utiliser les voices NVIDIA NIM (TTS) pour différencier les voix. "
     "C'est un feature à 149 €/mois à elle seule."),

    ("Extension", "Extension Chrome — clarifier les 6 plateformes supportées", "HAUTE", "FAIBLE", "ÉLEVÉ",
     "Le manifest.json liste LinkedIn, Indeed, APEC, Cadremploi, HelloWork, Welcome to the Jungle — c'est très bien. "
     "Mais l'extension est invisible sur la landing. Ajouter une section dédiée : "
     "« L'extension PRSTO Copilot — votre second cerveau sur 6 plateformes » "
     "avec une démo vidéo de 30s montrant le side panel IA qui analyse une offre LinkedIn en temps réel. "
     "C'est un argument commercial majeur (Teal et Huntr ont une extension mais pas en IA conversationnelle temps réel sur l'offre)."),

    ("Sourcing", "Système de sourcing multi-sources — activé mais à paramétrer", "CRITIQUE", "ÉLEVÉ", "ÉLEVÉ",
     "Le code source contient : "
     "• lib/jobs/connectors/firecrawl-safe.ts (scraping respectueux) "
     "• lib/jobs/connectors/france-travail.ts + api-france-travail.ts (France Travail API officielle) "
     "• lib/jobs/connectors/linkedin-public.ts (LinkedIn public) "
     "• lib/jobs/connectors/michael-page.ts (Michael Page) "
     "• lib/jobs/connectors/public-ats.ts (ATS génériques) "
     "• lib/sourcing/connectors/ (html-scraper, jsonld-crawler) "
     "C'est excellent mais à valider : "
     "(1) France Travail API est gratuite (officielle) — à confirmer en production ; "
     "(2) LinkedIn public va se heurter au rate limiting — le code prévoit un mode « safe » ; "
     "(3) Michael Page scraping — vérifier les ToS ; "
     "(4) Manquent : Welcome to the Jungle (présent dans l'extension mais pas dans le sourcing auto), Robert Walters, Hays, Page Executive ; "
     "(5) International : pas de connector pour LinkedIn US/UK jobs, Indeed US/UK, eFinancialCareers, BoardEx. "
     "Recommandation : ajouter 3 connectors prioritaires — WTTJ, Robert Walters, eFinancialCareers."),

    ("IA", "Architecture IA — consolider autour de NVIDIA NIM", "MOYENNE", "FAIBLE", "MOYEN",
     "Le code utilise NVIDIA NIM (gratuit) via integrate.api.nvidia.com — c'est très bien pour les coûts. "
     "Mais il y a aussi un fichier deepseek.ts qui pointe sur nvidia.api.nvidia.com — vérifier la cohérence. "
     "Recommandations : "
     "(1) Documenter la stratégie IA dans /docs/ai-architecture.md (quand utiliser quel modèle) ; "
     "(2) Prévoir un fallback OpenRouter (déjà mentionné dans le code) en cas de rate limit NVIDIA ; "
     "(3) Ajouter un cache Redis local pour les réponses IA fréquentes (anti-hallucination.ts existe déjà, l'étendre) ; "
     "(4) Pour les embeddings du second brain, utiliser les modèles locaux HuggingFace (@huggingface/transformers est déjà dans package.json) — gratuit et privé."),

    ("Internationalisation", "i18n — ajout critique pour FR/EN/ES", "HAUTE", "ÉLEVÉ", "ÉLEVÉ",
     "Aucun fichier i18n détecté dans le scan. Tout est en dur en français. "
     "Migrer vers next-intl (recommandé pour Next.js 16) : "
     "(1) Extraire toutes les chaînes dans /messages/fr.json, /messages/en.json, /messages/es.json ; "
     "(2) Configurer next-intl avec détection automatique (Accept-Language + sous-domaine : prsto.fr / prsto.io / prsto.es) ; "
     "(3) Priorité : EN d'abord (LinkedIn/APEC/Welcome ont une version EN faible — opportun), puis ES (marché LATAM en croissance) ; "
     "(4) Pour le contenu éditorial (manifeste, blog), faire traduire par un cabinet spécialisé, pas par IA seule. "
     "Budget estimé : 5-8 jours de dev pour la mise en place next-intl + 10 jours pour extraire toutes les chaînes."),

    ("Performance", "Bundle size — vérifier le poids du dashboard", "MOYENNE", "MOYEN", "MOYEN",
     "Le dashboard charge 479 fichiers TS/TSX et le package.json montre 50+ dépendances (pdf-lib, docx, mammoth, leaflet, mediapipe, etc.). "
     "Risques : "
     "(1) First Load JS potentiellement > 500 KB (à vérifier avec next build + bundle analyzer) ; "
     "(2) libleaflet pour les cartes (Market Radar) est lourd — lazy loader ; "
     "(3) @mediapipe/tasks-vision (mock interview camera analysis) — code-split agressif ; "
     "Action : lancer `npx @next/bundle-analyzer`, identifier les chunks > 50 KB, lazy-importer les composances media/leaflet."),

    ("Sécurité", "JWT + SQLite — validation pour production", "HAUTE", "MOYEN", "ÉLEVÉ",
     "Auth via JWT (jsonwebtoken + bcryptjs) — correct pour démarrer mais limites : "
     "(1) Pas de rotation de tokens visible dans le code ; "
     "(2) SQLite — OK pour dev, mais à migrer vers PostgreSQL/Neon pour la prod multi-utilisateurs ; "
     "(3) Les clés API NVIDIA NIM et Supabase sont dans .env.local — s'assurer qu'elles sont dans le vault du déploiement (Vercel/Cloudflare secrets), jamais dans le repo ; "
     "(4) L'extension Chrome communique avec localhost:3000 — pour la prod, hardcoder https://app.prsto.fr et ajouter CSP strict ; "
     "(5) Vérifier les rate limits des API /api/jobs/* (pas de throttle visible) — risque d'abus."),

    ("SEO/Content", "Lancer un blog éditorial « Le Carnet PRSTO »", "HAUTE", "MOYEN", "ÉLEVÉ",
     "Le /blog existe dans app/(public)/prsto/blog. À exploiter : "
     "(1) Publier 2 articles/semaine sur les sujets : salaires dirigeants, processus recrutement C-level, négociation package, market radar par secteur ; "
     "(2) Cibler mots-clés longue traine : « combien gagne un DG en France 2026 », « process recrutement CEO scale-up », « préparer entretien cabinet de chasse » ; "
     "(3) Inviter cabinets de chasse à publier (content partnership) — génère backlinks et notoriété ; "
     "(4) Newsletter hebdo « Le Brief Dirigeant » — capture emails qualifiés."),

    ("Roadmap", "V2 — ajouter « Boardroom Simulator »", "BAISSE", "ÉLEVÉ", "ÉLEVÉ",
     "Le code mentionne « Boardroom Studio » dans les features landing mais ne semble pas implémenté. "
     "C'est pourtant le Graal pour des dirigeants : simulation d'un conseil d'administration avec 5 IA jouant les rôles d'administrateurs. "
     "Roadmap V2 — 6 mois : implémenter un mode « Pitch Comex » où le dirigeant présente son plan 100 jours à un panel de 5 IA (CEO, CFO, DRH, Investisseur, Expert métier). "
     "Analyse posture, voix, contenu. Débrief 360°. Prix : 99 €/simulation."),

    ("Roadmap", "V2 — API publique pour cabinets de chasse", "BAISSE", "ÉLEVÉ", "MOYEN",
     "Pour s'ouvrir le marché B2B (cabinets), publier une API REST : "
     "(1) POST /api/v1/cabinets/missions — pousser une mission ; "
     "(2) GET /api/v1/cabinets/candidates — chercher dans la base de profils opt-in ; "
     "(3) Système de matching automatique candidat↔mission. "
     "Modèle : 99 €/mois par cabinet (5 utilisateurs), 499 €/mois illimité. "
     "Cible : 500 cabinets en France, 5000 en Europe = TAM 30 M€/an."),

    ("UX/UI", "Sidebar 220px — trop étroite pour les labels", "MOYENNE", "FAIBLE", "MOYEN",
     "Beaucoup de labels sont en 12.5px et tronqués. Soit : "
     "(1) Élargir la sidebar à 240-260px ; "
     "(2) Raccourcir les labels (« Insights marché » → « Marché », « Mock Interview » → « Mocks », « AI CV Optimizer » → « CV AI ») ; "
     "(3) Ajouter tooltips au hover pour les labels complets. "
     "Sur un écran 1440px, gagner 40px de largeur centrale n'a pas d'impact négatif."),

    ("UX/UI", "Dark theme du dashboard trop oppressant", "MOYENNE", "FAIBLE", "MOYEN",
     "La sidebar en #0E3A29 (vert très sombre) sur fond #FAF6EF (crème) est élégante mais peut oppresser sur de longues sessions. "
     "Proposer un toggle « Thème jour / Thème nuit » dans /parametres. "
     "Thème nuit : sidebar #0B1F18 + accent doré plus vif. "
     "Thème jour : sidebar #FFFFFF + accent doré + textes #0B1F18."),
]
