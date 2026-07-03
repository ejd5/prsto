# ELTON OS — Technology Stack

## Core Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | Next.js | 16.2.9 |
| Language | TypeScript | ^5 |
| UI Library | React | 19.2.4 |
| Styling | Tailwind CSS | ^4 |
| Database ORM | Prisma | ^5.22.0 |
| Database | SQLite | (via Prisma) |
| Testing | Vitest | ^4.1.9 |
| E2E Testing | Playwright | ^1.61.0 |
| Linting | ESLint (Next.js) | ^9 |
| Type Checking | tsc | ^5 |
| Icons | Lucide React | ^1.21.0 |

## Document Generation

| Library | Purpose |
|---------|---------|
| pdf-lib | PDF generation (premium CV templates) |
| docx | DOCX export |
| jszip | ZIP packaging (CV + letter) |

## Key Project Dependencies

- `next` (16.2.9) — App Router with React Server Components
- `react` / `react-dom` (19.2.4) — Latest React
- `@prisma/client` / `prisma` (5.x) — Database client and migrations
- `pdf-lib` — A4 PDF generation with custom fonts and layouts
- `lucide-react` — UI icons
- `vitest` — Unit/integration test runner
- `@playwright/test` — E2E browser testing
- `tailwindcss` v4 — Utility-first CSS
- `@tailwindcss/postcss` — PostCSS plugin for Tailwind v4
- `eslint` + `eslint-config-next` — Linting
- `tsx` — TypeScript execution (scripts, seed)
- `typescript` — Type checking
- `@vitejs/plugin-react` — Vite plugin for Vitest

## Directory Architecture

```
elton-os/
├── app/                      # Next.js App Router
│   ├── (app)/                # Authenticated app routes
│   │   ├── page.tsx          # Dashboard
│   │   ├── profil/           # Profile management
│   │   ├── cv-maitre/        # Master CV
│   │   ├── proof-vault/      # Achievement vault
│   │   ├── opportunites/     # Opportunities
│   │   ├── analyse/          # Analysis
│   │   ├── documents/        # Documents + templates
│   │   ├── market-radar/     # Job market scanning
│   │   ├── pipeline/         # Pipeline
│   │   ├── entretiens/       # Interviews
│   │   ├── performance/      # Performance metrics
│   │   ├── demarrage/        # Getting started
│   │   ├── first-run/        # First-run wizard
│   │   ├── guide/            # User guide
│   │   ├── parametres/       # Settings
│   │   ├── dashboard/jobs/   # Jobs dashboard area
│   │   └── test-flow/        # Test flow
│   ├── (public)/             # Public routes
│   ├── api/                  # API routes
│   └── layout.tsx            # Root layout
├── components/               # React components
│   ├── cv-templates/         # CV PDF templates (React)
│   └── ui/                   # Shared UI components
├── lib/                      # Business logic
│   ├── ai/                   # AI prompts and generation
│   ├── cv-parser/            # CV text parsing
│   ├── cv-render/            # CV render data construction
│   ├── exports/              # Export engines (PDF, DOCX, TXT)
│   ├── generation/           # Document generation templates
│   ├── jobs/                 # Job-related logic
│   ├── market-radar/         # Market scanning
│   └── proofs/               # Proof Vault logic
├── prisma/                   # Database schema + migrations
├── tests/                    # Test files
├── browser-extension/        # Chrome extension
├── scripts/                  # Utility scripts
├── docs/                     # Documentation
└── public/                   # Static assets
```

## Available npm Scripts

| Script | Command |
|--------|---------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript check |
| `npm test` | Run Vitest unit tests |
| `npm run test:coverage` | Run tests with coverage |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed database |
| `npm run db:studio` | Open Prisma Studio |
