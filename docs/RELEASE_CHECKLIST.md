# ELTON OS — Release Checklist

## Pre-Release

### Build & Tests
- [ ] `npm run build` — Production build OK
- [ ] `npx vitest run` — 1495+ tests pass
- [ ] `npm run test:e2e:critical` — 27 critical journeys pass
- [ ] `npm run lint` — 0 errors (warnings baseline accepted)

### Security
- [ ] `.env` not tracked in git
- [ ] `.env.local` not tracked in git
- [ ] API keys stored encrypted at rest (AES-256-GCM via `lib/security/secrets.ts`)
- [ ] API keys never returned in plaintext from API
- [ ] API keys masked in UI (`maskSecret()`)
- [ ] `ELTON_OS_SECRET_KEY` documented in `.env.example`
- [ ] Export endpoint strips API keys from backup
- [ ] Security headers applied (X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
- [ ] `middleware.ts` applies security headers
- [ ] No API keys in code
- [ ] No real personal data in code
- [ ] Extension manifest V3 permissions minimal

### Data & Backup
- [ ] Export endpoint: `GET /api/elton-os/export` returns ZIP with manifest + data + README
- [ ] Export excludes API keys, env vars
- [ ] Export filename: `ELTON_OS_Backup_YYYY-MM-DD.zip`
- [ ] System health: `GET /api/elton-os/health` returns stats without secrets
- [ ] Database backups exist (if production data)

### Documentation
- [ ] `README.md` — version number updated
- [ ] `docs/USER_GUIDE_BEGINNER.md` — up to date
- [ ] `docs/CV_TEMPLATES.md` — templates documented
- [ ] `docs/ASSISTED_IMPORT_EXTENSION.md` — up to date
- [ ] `docs/SECURITY_HEADERS.md` — security headers documented
- [ ] `docs/SECURITY_PRIVACY.md` — security model reviewed
- [ ] `docs/E2E_TESTING.md` — up to date
- [ ] `docs/LINT_CLEANUP_REPORT.md` — current baseline documented
- [ ] `browser-extension/README.md` — version number updated

### Extension
- [ ] `browser-extension/manifest.json` — version bumped
- [ ] `browser-extension/popup.html` — version bumped
- [ ] Extension loads in Chrome (unpacked)
- [ ] Import Pro tab works
- [ ] Documents tab works (template selector included)
- [ ] Autofill tab works
- [ ] CORS extension configured

### Manual QA
- [ ] Dashboard loads with "Aujourd'hui, quoi faire ?"
- [ ] Opportunities page shows data
- [ ] Profile page saves correctly
- [ ] CV Master import works
- [ ] Document generation works (no "Échec" silent failures)
- [ ] Premium PDF download works (all 6 templates)
- [ ] No auto-print on CV page
- [ ] Pipeline shows status
- [ ] Guide page loads with sections
- [ ] No native alert() / confirm() popups
- [ ] Simple/Expert mode toggle in sidebar
- [ ] Settings: API key configuration works with encryption
- [ ] Settings: Export button downloads ZIP
- [ ] Settings: AI provider connection test works

## Post-Release

- [ ] Tag git release: `git tag v2.9.2`
- [ ] Push tags: `git push --tags`
- [ ] Archive extension: `bash browser-extension/elton-os-importer/package-extension.sh`

## Rollback Plan

1. `git checkout <previous-tag>`
2. `npm run db:migrate`
3. `npm run dev`

## No-Apply Guard Check

Verify no auto-apply features were added:
- [ ] `npm run test:e2e:critical` — pipeline safety tests pass
- [ ] `npx vitest run tests/no-auto-apply.test.ts` — auto-submit patterns test passes
- [ ] Chrome extension: no auto-submit code in popup.js
- [ ] Pipeline: manual steps documented
- [ ] Guide: "ne postule jamais à votre place" section present
- [ ] Dashboard: "Rien n'est envoyé automatiquement" message visible
