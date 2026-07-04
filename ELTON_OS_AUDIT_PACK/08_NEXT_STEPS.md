# ELTON OS — Next Steps & Priorities

## Product Priorities

### 1. Market Radar Phase 17B/17C
Enhanced job market scanning:
- Better deduplication across sources
- Priority scoring refinement
- Scheduled scan reporting
- France Travail official API connector
- WTTJ (Welcome to the Jungle) structured integration

### 2. Job Board Connectors
- **France Travail API** (official partner API)
- **Greenhouse** integration (ATS)
- **Lever** integration (ATS)
- **SmartRecruiters** integration (ATS)
- **Ashby** integration (ATS)

### 3. Assisted Import Enhancement
- DOM selector maintenance for LinkedIn/Indeed/APEC (sites change frequently)
- Anti-parasite filter improvements
- Better extraction confidence scoring
- More platform support (Cadremploi, HelloWork, RegionJobs)

### 4. Premium CV Templates
- Finalize all 6 templates with full PDF generation
- Template customization options (colors, sections)
- Template preview in document generator

### 5. UX & Onboarding
- First-run wizard polish
- Getting started guide improvement
- Empty state designs
- Error state handling
- Loading skeletons

### 6. Document Generation
- Cover letter quality improvement (in progress)
- More template options
- Multi-language document support
- Batch document generation

### 7. Testing & Quality
- Playwright E2E test suite setup
- Coverage expansion (target 80%+)
- Edge case test scenarios
- Accessibility testing

### 8. Security Hardening
- API key encryption at rest
- Database file permissions
- Input sanitization audit
- CSP headers

### 9. Infrastructure
- Backup / export / import system
- Database migration system
- Error monitoring
- Performance profiling

### 10. Real Deployment Prep
- Chrome Web Store submission for extension
- Documentation finalization
- Privacy policy
- Terms of service
- User feedback system
- Analytics (opt-in, privacy-respecting)

## Tech Debt

| Item | Impact | Effort |
|------|--------|--------|
| ESLint warnings cleanup (set-state-in-effect baseline) | Low | Medium |
| TypeScript strict mode gaps | Medium | Large |
| Test coverage expansion | Medium | Large |
| old `any` type usage | Low | Medium |
| Prisma migration history cleanup | Low | Small |
| Extract reusable UI components | Medium | Large |
