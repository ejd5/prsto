# ELTON OS — CV Template Parity QA

Date : 2026-06-22
V2.10.0 — Template selection fix + 6 distinct PDF generators

## Root Cause

`getCvPdfGenerator()` n'avait que **4 cas** dans son switch (`executive_bordeaux`, `strategic_blue`, `minimal_luxe`, `premium_leadership`). Les templates **`ats_classic`** et **`modern_executive`** tombaient dans le `default` → généraient toujours **Premium Leadership** (champagne). C'est pour ça que "Moderne Exécutif" produisait un PDF champagne identique.

## Correctif

- Ajout de `ats_classic` et `modern_executive` dans le switch
- Création de `generateAtsClassicPdf()` — format simple, Courier, noir/gris, single colonne, zéro couleur
- Création de `generateModernExecutivePdf()` — sidebar navy, texte blanc, accents or, layout 2 colonnes
- Normalisation du templateId dans le switch (`templateId.replace(/-/g, '_').toLowerCase()`)

## Les 6 templates PDF maintenant distincts

| Template | Couleur dominante | Layout | Générateur PDF |
|----------|------------------|--------|----------------|
| ATS Classique | Noir/gris | 1 colonne, Courier | `generateAtsClassicPdf` (NEW) |
| Moderne Exécutif | Navy (#1B2A4A) | Sidebar gauche, Helvetica | `generateModernExecutivePdf` (NEW) |
| Premium Leadership | Champagne (#C8A64E) | 2 colonnes, header haut | `generatePremiumCvPdf` |
| Executive Bordeaux | Bordeaux (#5A1E2B) | Timeline, serif | `generateExecutiveBordeauxPdf` |
| Strategic Blue | Bleu (#17324D) | KPIs en haut, business | `generateStrategicBluePdf` |
| Minimal Luxe | Noir/Champagne | Épuré, espace blanc | `generateMinimalLuxePdf` |

## Flux validés

| Flux | Statut |
|------|--------|
| cv-print preview | ✅ READY (buildCvRenderData avec CvTemplateRenderer) |
| cv-print Télécharger PDF | ✅ READY (endpoint avec ?template=) |
| Extension Télécharger CV | ✅ READY (même endpoint) |
| Extension Joindre CV | ✅ READY (mêmes bytes) |
| ZIP Pack | ✅ READY |
| Cover Letter | ✅ READY |

## Vérifications

- [x] `?template=modern_executive` → generateModernExecutivePdf
- [x] `?template=ats_classic` → generateAtsClassicPdf
- [x] `?template=premium_leadership` → generatePremiumCvPdf
- [x] `?template=minimal_luxe` → generateMinimalLuxePdf
- [x] `?template=strategic_blue` → generateStrategicBluePdf
- [x] `?template=executive_bordeaux` → generateExecutiveBordeauxPdf
- [x] TemplateId normalisé (underscores, lowercase)
- [x] Footer ELTON OS absent partout

## Décision

**✅ V2.10.0 READY** — La sélection template → preview → PDF → extension est maintenant fiable pour les 6 templates.
