# ELTON OS — Test Report

Generated: 2026-06-22
Git: main@a7ace3b

## Unit Tests (Vitest)

See `test-report.txt` for full output.

To run: `npm test` (alias for `vitest run`)

| Metric | Value |
|--------|-------|
| Test files | 43 |
| Total tests | 1454 |
| Pass rate | 100% (latest known run) |
| Coverage | See `test:coverage` |

## E2E Tests (Playwright)

See `e2e-report.txt` for full output (if available).

**Note:** E2E tests require Playwright browsers to be installed and a running dev server. If not run, this section will be marked as "not executed."

## Build

See `build-report.txt` for full output.

Run: `npm run build`

**Result: BUILD SUCCEEDED** (exit code 0)
- Compiled successfully in 39s
- TypeScript check passed (2.2 min)
- 92 pages generated (74 static, 18 dynamic)
- 2 Turbopack warnings (NFT tracing — pre-existing, non-blocking)

## Lint

See `lint-report.txt` for full output.

Run: `npm run lint`

**Result: 127 problems** (37 errors, 90 warnings)
- 2 errors and 2 warnings potentially fixable with `--fix`
- Main error category: `react-hooks/set-state-in-effect` (pre-existing baseline)
- Main warning category: `@typescript-eslint/no-unused-vars`
- These are accepted as a known baseline; no new lint issues from recent changes

## Known Issues

| Issue | Status | Notes |
|-------|--------|-------|
| ESLint `set-state-in-effect` warnings | Baselines accepted | Pre-existing warnings in analyse, cv-maitre, demarrage, others |
| ESLint `no-unused-vars` in tests | Accepted | Test files have unused imports (formatDateRange, sanitizeJobDescription) |
| ESLint `no-explicit-any` in some files | Known | Partial usage of `any` type in legacy code |
| TypeScript `strict` mode not fully enforced | Known | `tsconfig.json` does not enable strict |
| E2E test coverage | Gap | Playwright tests not yet established |
| Turbopack NFT warnings (2) | Pre-existing | Next.js config tracing issue with Prisma/browser-agent |
