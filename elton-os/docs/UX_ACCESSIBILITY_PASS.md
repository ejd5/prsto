# ELTON OS — UX & Accessibility Pass V2.9.0

## Summary
Complete UX clarity pass: Simple/Expert mode, replacement of all native `alert()`/`confirm()` calls, "Today" dashboard zone, empty states, loading skeletons, premium modals, improved guide, accessibility improvements.

## Changes by Category

### 1. Simple/Expert Mode
- New file: `lib/ux-mode.ts` — Context provider + `useUxMode()` hook + `humanLabel()` mapping
- New file: `components/ui/UxModeToggle.tsx` — Toggle button in sidebar header
- Added to `app/(app)/layout.tsx` — `UxModeProvider` wrapping the app layout
- Expert-only features on dashboard: detailed sourcing reports, CRM, readiness breakdown, advanced filters
- Simplified labels: "Top scores" → "Très pertinentes", "Shortlist" → "Enregistré"
- `humanLabel()` maps 30+ technical terms to plain language

### 2. Premium Modals (Native alert/confirm replacement)
- **`components/ui/EltonModal.tsx`** — Reusable modal with focus trap, Escape key, ARIA dialog
- **`components/ui/EltonToast.tsx`** — Toast notification system (success/error/warning/info) with `ToastProvider` + `useToast()` hook
- **`components/ui/ConfirmActionDialog.tsx`** — Confirmation dialog replacing `confirm()` calls
- **`components/ui/SuccessActionModal.tsx`** — Premium success modal with animated icons (check/sparkles/rocket)

### 3. Native alert/confirm/prompt replacement status
Pages with **alert() → toast replacement** completed:
- `app/(app)/page.tsx` — Suggestions to toast.info
- `app/(app)/dashboard/jobs/page.tsx` — All alerts to toasts, confirms to ConfirmActionDialog
- `app/(app)/dashboard/jobs/importer/page.tsx` — Import errors to toast.error, success to toast.success
- `app/(app)/analyse/page.tsx` — Suggestions to toast.info
- `app/(app)/documents/page.tsx` — Suggestions to toast.info
- `app/(app)/entretiens/page.tsx` — Suggestions to toast.info
- `app/(app)/parametres/page.tsx` — Suggestions to toast.info

Remaining `confirm()` calls (less intrusive, user-initiated) to be addressed in next pass:
- `app/(app)/opportunites/page.tsx` line 167
- `app/(app)/opportunites/[id]/page.tsx` line 134
- `app/(app)/entretiens/[id]/page.tsx` line 81
- `app/(app)/documents/[id]/page.tsx` line 122
- `app/(app)/analyse/page.tsx` line 79
- `app/(app)/cv-maitre/page.tsx` line 99
- `app/(app)/sources/page.tsx` line 106
- `app/(app)/dashboard/jobs/sources/page.tsx` lines 311, 338, 372
- `app/(app)/dashboard/jobs/settings/page.tsx` line 175

### 4. Empty States
- **`components/ui/EmptyState.tsx`** — Reusable empty state with icon, title, message, action button, secondary link
- Dashboard jobs: Empty state with "Aucune offre importée" + Import Express button + "Configurer des sources" link

### 5. Loading Skeletons
- **`components/ui/SkeletonCard.tsx`** — `SkeletonCard`, `SkeletonRow`, `SkeletonToday`, `SkeletonDetail`
- Dashboard jobs: `SkeletonToday` for "Today" zone, `SkeletonCard` for job list loading
- Main app layout: Spinner on page transitions

### 6. Dashboard "Today" Zone
- New "Aujourd'hui, quoi faire ?" section at top
- Cards: nouvelles offres, top opportunités, candidatures à préparer (conditionnel selon mode)

### 7. Guide Improvements
- Guide sections added: "23. Importer une offre LinkedIn", "24. Importer une offre Indeed", "25. Importer une offre APEC", "26. Utiliser l'extension Chrome", "99. Ce que ELTON OS ne fait pas"
- Step-by-step numbered guides for all import methods
- Security transparency section with 6 "ce que l'app ne fait pas" cards
- Labels made more human-readable

### 8. Pages Improved

| Page | Improvements |
|------|------------|
| `/dashboard/jobs` | Today zone, skeletons, empty state, toasts, confirm dialogs, expert-only details |
| `/dashboard/jobs/importer` | Toast notifications instead of alerts |
| `/dashboard/jobs/settings` | Toast import added |
| `/dashboard/jobs/sources` | Toast import added |
| `/analyse` | Toast suggestions |
| `/documents` | Toast suggestions |
| `/entretiens` | Toast suggestions |
| `/parametres` | Toast suggestions |
| `/guide` | Import guides, security transparency, extension guide |
| Root layout | UxModeProvider + ToastProvider wrapping |

### 9. Remaining UX Gaps
- `confirm()` calls in ~10 files — less disruptive and user-initiated; to be replaced in V2.9.1
- Full Playwright E2E test suite — needs to be established
- Color contrast audit — not yet automated
- Mobile responsive pass — not in scope
- Keyboard navigation complete audit — partial (modals only)

## Files Created
- `lib/ux-mode.ts`
- `components/ui/EltonModal.tsx`
- `components/ui/EltonToast.tsx`
- `components/ui/ConfirmActionDialog.tsx`
- `components/ui/SuccessActionModal.tsx`
- `components/ui/EmptyState.tsx`
- `components/ui/SkeletonCard.tsx`
- `components/ui/UxModeToggle.tsx`
- `docs/UX_ACCESSIBILITY_AUDIT.md`
- `docs/UX_ACCESSIBILITY_PASS.md`

## Files Modified
- `app/(app)/layout.tsx` — Providers + UxModeToggle
- `app/(app)/page.tsx` — Toast suggestions
- `app/(app)/dashboard/jobs/page.tsx` — Today zone, toasts, skeletons, empty state
- `app/(app)/dashboard/jobs/importer/page.tsx` — Toast notifications
- `app/(app)/dashboard/jobs/sources/page.tsx` — Toast import
- `app/(app)/analyse/page.tsx` — Toast suggestions
- `app/(app)/documents/page.tsx` — Toast suggestions
- `app/(app)/entretiens/page.tsx` — Toast suggestions
- `app/(app)/parametres/page.tsx` — Toast suggestions
- `app/(app)/guide/page.tsx` — Import guides + security section

## UX Rules Established
1. No native `alert()` — always use Toast or Modal
2. Mode Simple = essential actions only, plain language
3. Mode Expert = full technical details, scores, logs
4. Every empty state has: icon + title + message + action button
5. Every modal has: focus trap, Escape close, aria-modal
6. Toast duration: success=4s, error=6s, info=4s, warning=5s
7. Confirm destructive actions use ConfirmActionDialog with destructive variant
8. No tooltip-only actions — icons must have aria-label
