# ELTON OS Landing Page — Design Notes

## Design Reference
- **Primary**: COSMOQ (framer template) — dark bg, glassmorphism cards, blue-tinted borders, circular glass icons, Inter Tight typography, premium SaaS/AI agent aesthetic.
- **Secondary inspiration**: Linear, Raycast, Vercel — minimal interfaces with high information density, clean typography, subtle borders.

## Palette (scoped to landing)
```css
--bg: #030303
--panel: #0A0A0B
--panel-soft: #111114
--border: rgba(255,255,255,0.08)
--border-strong: rgba(255,255,255,0.14)
--text: #F4F4F5
--text-muted: #8A8A92
--text-soft: #B8B8C0
--accent-gold: #C9A84D
--accent-blue: #6A8DFF
--accent-green: #36D978
--accent-purple: #8B5CF6
```

These tokens are set as CSS custom properties scoped to `.landing-page` wrapper to avoid conflicting with the app's existing warm gold palette.

## Key Design Decisions
1. **Dark background (`#030303`)** — deeper than the app's `#080705`, gives the landing its own distinct feel.
2. **Glassmorphism panels** — `rgba(255,255,255,0.03)` backgrounds with subtle `rgba(125,164,255,0.16)` blue-tinted borders (COSMOQ signature).
3. **Gold remains the primary accent** — but used sparingly for CTAs and highlights. Blue is secondary accent.
4. **No auto-apply** philosophy is featured prominently — the "you stay in control" message is a unique differentiator.
5. **Circular glass icons** — 40-48px circles with `rgba(255,255,255,0.04)` backgrounds and blue-tinted borders, matching COSMOQ's icon style.
6. **Typography**: Inter (already loaded), large titles (36-48px), tight line-height (1.0-1.1), negative letter-spacing (-0.03em to -0.05em).

## Sections (top to bottom)
1. **Header** — Sticky, border-bottom, glass effect, logo + nav links + CTA button.
2. **Hero** — Big headline with gold "Sans jamais déléguer l'envoi" tagline, subtitle, two CTAs, plus a "product card" on the right showing ELTON OS interface mockup.
3. **Trust Band** — Subtle logos/logos text showing "Trusted by executives from..." (placeholder).
4. **Features Grid** — 6 feature cards in 3x2 grid with glass icons.
5. **How It Works** — 3 steps (Configurez → Sourcez → Postulez) in a horizontal flow with connecting lines.
6. **Local-First Security** — Section emphasizing privacy, local SQLite, no data leaks.
7. **Pricing** — 3 tiers: Starter, Pro, Enterprise.
8. **FAQ** — accordion-style.
9. **Final CTA** — Big section with gradient bg, final push to action.
10. **Footer** — Simple, minimal, with legal links.

## Components
- `LandingHeader` — sticky glass nav
- `HeroSection` — hero with product card
- `TrustBand` — trust indicators
- `FeatureGrid` — features with glass icons
- `HowItWorks` — 3-step process
- `SecuritySection` — local-first privacy
- `PricingSection` — 3 tiers
- `FaqSection` — accordion
- `FinalCta` — final call-to-action
- `LandingFooter` — minimal footer

## Content Strategy
- Target audience: cadres dirigeants (Directeur Commercial, Country Manager, VP Sales).
- Value prop: "Un copilote IA pour cadres dirigeants — automatisez la recherche, gardez le contrôle de l'envoi."
- Key differentiators: no auto-submit, no spam, local-first, human validation always required.
- Tone: professional, serious, premium, slightly technical. No hype language, no emojis in copy.
