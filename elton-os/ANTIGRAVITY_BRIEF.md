# BRIEF ANTIGRAVITY — Rapprochement visuel PRSTO des images de branding

## Objectif
Rapprocher l'aspect visuel de l'application PRSTO des images de branding placées dans `public/branding/`. **Uniquement le visuel** — ne modifier aucun texte, aucun contenu, aucune structure fonctionnelle.

## Fichiers de référence à examiner (par ordre d'importance)
1. `public/branding/BRANDING PRSTO.png` — Brand board principal (couleurs, typo, mood)
2. `public/branding/ChatGPT Image 26 juin 2026 à 04_03_03.png` — Probablement mockup UI
3. `public/branding/ChatGPT Image 26 juin 2026, 04_40_16 (2).png`
4. `public/branding/ChatGPT Image 26 juin 2026, 04_40_17 (3).png`
5. `public/branding/ChatGPT Image 26 juin 2026, 04_40_17 (4).png`
6. `public/branding/ChatGPT Image 26 juin 2026, 04_40_18 (5).png`
7. `public/branding/ChatGPT Image 26 juin 2026, 04_40_18 (6).png`
8. `public/branding/ChatGPT Image 26 juin 2026, 04_40_18 (7).png`
9. `public/branding/ChatGPT Image 26 juin 2026, 04_40_18 (8).png`
10. `public/branding/ChatGPT Image 26 juin 2026, 04_40_18 (9).png`

## Design tokens actuels (déjà définis dans `app/globals.css`)

### Couleurs PRSTO
| Token | Valeur | Usage |
|------|--------|-------|
| `--prsto-forest` | `#103826` | Vert foncé — fonds, texte fort |
| `--prsto-pine` | `#1F4A34` | Vert mid — accents, données |
| `--prsto-sage` | `#6A8F6D` | Vert clair — sous-texte, icônes |
| `--prsto-gold` | `#E4B118` | Or — CTA, badges, accents |
| `--prsto-amber` | `#F2C94C` | Or clair — dégradés |
| `--prsto-ivory` | `#FAF6EF` | Ivoire — fond global |
| `--prsto-white` | `#FFFDF8` | Off-white — surfaces |
| `--prsto-text` | `#0B1F18` | Texte principal |
| `--prsto-muted` | `#50625A` | Texte secondaire |
| `--prsto-border` | `#E6DED2` | Bordures |

### Typographie
- **Playfair Display** — titres (`--font-display`)
- **Inter** — UI / corps (`--font-sans`)
- **JetBrains Mono** — code / labels (`--font-mono`)

### Rayons
- `--rayon`: 8px
- `--rayon-lg`: 12px
- `--rayon-xl`: 16px

### Mode sombre
- Fond: `#082E1E`
- Surface: `#0F3A26`
- Bordure: `#1F4A34` / `#2A5A40`

## Composants à aligner visuellement

### 1. App sidebar (`app/(app)/layout.tsx`)
- Logo en haut (`/branding/logo-prsto.png` — déjà en place)
- Sections de navigation avec icônes lucide
- Panel AI Copilot à droite
- **À rapprocher**: style des sections de menu, espacement, hover states, séparateurs

### 2. Landing page — 20 composants dans `components/landing/`
| Fichier | Rôle |
|---------|------|
| `LandingHeader.tsx` | Header sticky avec nav + CTA |
| `HeroSection.tsx` | Hero avec titre, CTA, mockup carte |
| `FeatureGrid.tsx` | Grille de features + widget ATS |
| `PricingSection.tsx` | 3 tiers de pricing |
| `TestimonialsSection.tsx` | Témoignages |
| `ComparatifSection.tsx` | Tableau comparatif |
| `StatsSection.tsx` | Statistiques clés |
| `TrustBand.tsx` | Bandeau de trust |
| `LogoCloud.tsx` | Logo cloud |
| `FaqSection.tsx` | FAQ accordéon |
| `ProductMockup.tsx` | Mockup produit |
| `FinalCta.tsx` | CTA final |
| `HowItWorks.tsx` | Étapes |
| `SecuritySection.tsx` | Section sécurité |
| `ScrollProgress.tsx` | Barre de progression scroll |
| `GlassCard.tsx` | Carte glass effect |
| `GlassIcon.tsx` | Icône glass |
| `Reveal.tsx` | Animation reveal |

### 3. Executive Brief — 9 composants dans `components/executive-brief/`
Thème sombre. `ExecutiveBriefHeader`, `ExecutiveBriefHero`, `ProblemSection`, `DeliverablesGrid`, `LinkedInAuditSection`, `ComparisonSection`, `ValueSection`, `ExecutiveBriefFaq`, `ExecutiveBriefCta`, `OrderForm`.

### 4. Login page (`app/(public)/login/page.tsx`)
Carte centrée sur fond ivoire avec logo.

## Contraintes ABSOLUES
1. **NE PAS modifier les textes** (labels, descriptions, titres, boutons)
2. **NE PAS modifier la structure** des composants (nombre d'éléments, ordre)
3. **NE PAS casser le fonctionnel** (liens, handlers, forms, API calls)
4. **NE PAS modifier les routes** (les URLs `/prsto`, `/prsto/executive-brief`)
5. **Conserver le logo actuel** (`/branding/logo-prsto.png`)

## Ce qui peut être ajusté
- Couleurs (marges, nuances, opacités, dégradés)
- Typographie (tailles de police, graisses, letter-spacing, line-height)
- Espacements (padding, margin, gap)
- Bordures (épaisseur, couleur, rayon)
- Ombres (box-shadow)
- Hover/active states
- Transitions/animations
- Backgrounds (textures, patterns, dégradés)
- Disposition visuelle (alignment, proportions) — sans changer la structure HTML

## Lancement
```bash
cd "/Users/duarteelton/Desktop/JOB PROJECT"
npm run dev  # serveur sur localhost:3000
```

Routes à vérifier visuellement :
- `http://localhost:3000/prsto` — Landing page
- `http://localhost:3000/prsto/executive-brief` — Executive Brief
- `http://localhost:3000/login` — Login
- `http://localhost:3000/` — App (sidebar + dashboard)