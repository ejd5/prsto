# ELTON OS — Product Pitch

## Problem
Senior executives (Directeur Commercial, Country Manager, VP Sales) spend 10–20 hours per week on job searching: manually scanning job boards, tailoring applications, writing cover letters, and tracking pipelines. Generic job-search tools don't understand executive-level matching. ChatGPT produces shallow, artifact-filled applications that recruiters spot instantly.

## Target User
- Senior executive / director-level job seeker (France/Europe focus)
- 10+ years experience, targeting C-suite or executive roles
- Uses LinkedIn, Indeed, APEC, Cadremploi, Welcome to the Jungle, France Travail
- Applies to 2–5 roles per week with highly customized materials

## Value Proposition
**ELTON OS is a local-first, AI-assisted executive job search operating system.** It replaces scattered spreadsheets, manual cover letters, and generic job alerts with:

1. **Single profile** — Import your CV once, maintain one source of truth.
2. **Market scanning** — Automated job sourcing from 30+ board sources with executive-level scoring.
3. **Smart matching** — Role analysis, gap detection, ATS keyword alignment, scoring (0–100).
4. **Bulk document generation** — Tailored CV + cover letter per role, generated locally or with optional AI.
5. **Premium CV templates** — 6 executive-grade PDF templates (ATS-ready to luxury).
6. **Pipeline management** — Track opportunities from discovery to offer.
7. **Chrome extension** — Import jobs from LinkedIn/Indeed/APEC in one click, attach documents to ATS forms.
8. **Privacy-first** — Everything runs locally. Profile data stays on your machine.

## Main Workflow
```
1. Import CV → Profile extracted (experiences, skills, languages, education)
2. Build Proof Vault → Log achievements with context and metrics
3. Sources configured → Market Radar scans 30+ job boards
4. Opportunities discovered → Auto-scored and prioritized (A/B/C)
5. Select a role → Analysis, gap detection, matching report
6. Generate documents → CV adapted + cover letter + email + LinkedIn message
7. Apply → Via Chrome extension (ATS form fill + document attach)
8. Track → Pipeline status, follow-up reminders, interview prep
```

## Differentiation
- **Local-first architecture**: No cloud dependency for core features. Profile data never leaves your machine unless you choose AI generation.
- **Executive-level matching**: Scoring tailored for senior roles (P&L responsibility, team size, international experience, sector alignment).
- **Proof Vault**: Structured achievement repository with confidence ratings — far beyond a simple CV text.
- **Anti-hallucination**: Strict "never invent" rules in AI prompts. Every claim is anchored in verified profile data.
- **Chrome extension for ATS**: Real attachment to Greenhouse, Lever, Ashby, Workable forms — not just download.
- **Premium PDF CVs**: 6 visual templates from ATS-optimized to luxury executive.
- **No auto-apply**: Explicitly refuses to automate submissions. Human validation every step.

## Current Limitations
- SQLite local database (not designed for multi-user or server deployment)
- French market focus (sources, contract types, localization)
- AI generation requires either local setup or optional API key (DeepSeek / NVIDIA NIM)
- Chrome extension is unpacked (not in Chrome Web Store)
- No cloud sync or backup system
- No mobile app
- No collaborative features

## Vision (next 3 months)
- Market Radar Phase 17B/17C: enhanced scanning, de-duplication, priority scoring
- France Travail API connector (official)
- Greenhouse / Lever / SmartRecruiters / Ashby integration connectors
- Assisted import refinement for all major boards
- UX onboarding v2
- Premium CV template completion
- Backup / export / import system
- Security hardening for real deployment
