# ELTON OS — Features Status Matrix

| Feature | Status | Key Files | Maturity (1-5) | Risk | Next Improvement |
|---------|--------|-----------|----------------|------|------------------|
| **Profil candidat** | Completed | `app/(app)/profil/page.tsx`, `prisma/schema.prisma` (Profile model) | 5 | Low | Enhanced fields (mobility, preferences) |
| **CV Maître** | Completed | `app/(app)/cv-maitre/page.tsx`, `lib/cv-parser/` | 4 | Medium | Better PDF parsing, multi-format support |
| **Extraction expériences depuis CV** | Completed | `lib/cv-parser/`, `lib/jobs/skills-extractor.ts` | 4 | Medium | Edge cases with non-standard CV formats |
| **Proof Vault** | Completed | `app/(app)/proof-vault/page.tsx`, `lib/proofs/` | 4 | Low | Export, confidence scoring refinement |
| **Sources** | Completed | `app/(app)/sources/page.tsx`, `lib/jobs/safe-sources/` | 4 | Low | More board integrations |
| **Market Radar** | Completed | `app/(app)/market-radar/page.tsx`, `lib/market-radar/` | 3 | Medium | Phase 17B/17C: dedup, priority scoring |
| **Opportunités** | Completed | `app/(app)/opportunites/page.tsx`, `lib/jobs/` | 4 | Low | Batch operations, advanced filtering |
| **Détection doublons** | Partial | `lib/jobs/dedup-engine.ts` | 3 | Medium | False positive reduction |
| **Analyse scoring** | Completed | `lib/jobs/scoring-engine.ts` | 4 | Low | Industry-specific weighting |
| **Génération documents** | Completed | `lib/generation/templates.ts`, `lib/jobs/application-preparer.ts` | 4 | Medium | More templates, better AI prompts |
| **Templates CV premium** | Completed | `components/cv-templates/*`, `lib/jobs/cv-pdf-premium.ts` | 4 | Low | More templates, customization |
| **Export PDF** | Completed | `lib/jobs/cv-pdf-premium.ts`, `lib/exports/engine.ts` | 4 | Low | - |
| **Export TXT** | Completed | `lib/exports/engine.ts` | 4 | Low | - |
| **Export DOCX** | Completed | `lib/exports/docx.ts` | 3 | Low | Formatting improvements |
| **Export ATS optimisé** | Completed | `lib/exports/engine.ts` | 4 | Low | - |
| **Pipeline** | Completed | `app/(app)/pipeline/page.tsx` | 4 | Low | Drag-drop reordering |
| **Relances** | Partial | `lib/jobs/follow-up/` | 3 | Medium | Template customization |
| **Entretiens** | Completed | `app/(app)/entretiens/page.tsx` | 4 | Low | Calendar integration |
| **Performance** | Partial | `app/(app)/performance/page.tsx` | 3 | Low | More metrics, charts |
| **Guide complet** | Partial | `app/(app)/guide/page.tsx` | 3 | Low | Expand content |
| **Démarrage guidé** | Completed | `app/(app)/demarrage/page.tsx` | 4 | Low | - |
| **First run réel** | Completed | `app/(app)/first-run/page.tsx` | 4 | Low | - |
| **Chrome Extension** | Completed | `browser-extension/elton-os-importer/` | 4 | Medium | Chrome Web Store publishing |
| **Import Assisté (LinkedIn)** | Completed | `browser-extension/`, `lib/jobs/assisted-import/` | 4 | Medium | DOM selector maintenance |
| **Import Assisté (Indeed)** | Completed | `browser-extension/`, `lib/jobs/assisted-import/` | 4 | Medium | DOM selector maintenance |
| **Import Assisté (APEC)** | Completed | `browser-extension/`, `lib/jobs/assisted-import/` | 4 | Medium | DOM selector maintenance |
| **Tests unitaires** | Completed | `tests/*.test.ts` (1454 tests) | 5 | Low | Coverage expansion |
| **Tests E2E** | Partial | `e2e-tests/` or playwright config | 2 | High | Need Playwright setup, test scenarios |
| **Sécurité / confidentialité** | Completed | Throughout codebase | 4 | Medium | Audit, encryption at rest |
| **CRM** | Experimental | `app/(app)/dashboard/jobs/crm/` | 2 | High | Needs full implementation |
| **Firecrawl Safe Import** | Experimental | `app/(app)/dashboard/jobs/importer/firecrawl-safe/` | 2 | Medium | Stability |

## Maturity Scale
1. Prototype / non-functional
2. Experimental, unstable
3. Functional with known gaps
4. Production-quality with minor gaps
5. Polished, thoroughly tested
