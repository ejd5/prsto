# ELTON OS — Routes Map

## App Pages (under `app/(app)/`)

| Route | Screen | Purpose | Status | Dependencies |
|-------|--------|---------|--------|-------------|
| `/` | Dashboard | Main dashboard with stats, pipeline overview, recent activity | Completed | Profile, opportunities, pipeline |
| `/profil` | Profile | Executive profile management (personal info, CV settings) | Completed | Database |
| `/profil/autofill-preferences` | Autofill Prefs | ATS autofill field mapping preferences | Completed | Profile |
| `/cv-maitre` | Master CV | CV import (text/PDF), parsing, experience editing | Completed | Profile |
| `/proof-vault` | Proof Vault | Achievement tracking with confidence ratings | Completed | Profile, experiences |
| `/sources` | Job Sources | Manage job board source configuration | Completed | Database |
| `/opportunites` | Opportunities | List all discovered opportunities with scoring | Completed | Opportunities, Market Radar |
| `/opportunites/[id]` | Opportunity Detail | Single opportunity view, analysis, document generation | Completed | Opportunity, analysis |
| `/analyse` | Analysis | Opportunity analysis, scoring, gap detection | Completed | AI, profile matching |
| `/documents` | Documents | Generated document management | Completed | Opportunity, documents |
| `/documents/[id]` | Document Detail | Single document preview and export | Completed | Documents |
| `/documents/[id]/print-cv` | CV Print | CV preview for browser printing | Completed | CV data |
| `/documents/templates` | CV Templates | Template selection and preview | Completed | CV templates |
| `/dashboard/jobs` | Jobs Dashboard | Job search dashboard | Completed | Database |
| `/dashboard/jobs/applications/[id]` | Application Detail | Full application view with pipeline actions | Completed | Opportunity, documents |
| `/dashboard/jobs/applications/[id]/cv-print` | CV Print (Job) | CV print from job context | Completed | CV data |
| `/dashboard/jobs/applications/[id]/print` | Print (Job) | Document print from job context | Completed | Documents |
| `/dashboard/jobs/applications/[id]/assisted-apply` | Assisted Apply | Guided application flow with document attach | Completed | Documents, extension |
| `/dashboard/jobs/pipeline` | Pipeline | Kanban-style pipeline view | Completed | Opportunities |
| `/dashboard/jobs/analytics` | Analytics | Job search analytics and metrics | Completed | Opportunities, analytics |
| `/dashboard/jobs/reports` | Reports | Application reports | Completed | Opportunities |
| `/dashboard/jobs/settings` | Job Settings | Job search settings | Completed | Database |
| `/dashboard/jobs/sources` | Job Sources (Dashboard) | Source management from dashboard | Completed | Job sources |
| `/dashboard/jobs/source-scanner` | Source Scanner | Scan job sources for new opportunities | Partial | Market Radar |
| `/dashboard/jobs/crm` | CRM | Contact management | Experimental | CRM module |
| `/dashboard/jobs/crm/contacts/[id]` | Contact Detail | Single CRM contact | Experimental | CRM |
| `/dashboard/jobs/importer` | Importer | Assisted import from job boards | Completed | Extension, extraction |
| `/dashboard/jobs/importer/capture` | Importer Capture | Capture job posting from browser | Completed | Extension |
| `/dashboard/jobs/importer/extension` | Extension | Chrome extension management | Completed | Extension |
| `/dashboard/jobs/importer/firecrawl-safe` | Firecrawl Safe | Safe firecrawl import mode | Experimental | Firecrawl |
| `/dashboard/jobs/interview-prep` | Interview Prep | Interview preparation tools | Completed | AI, opportunity |
| `/dashboard/jobs/interview-prep/[id]` | Interview Prep Detail | Detailed interview preparation | Completed | AI, opportunity |
| `/dashboard/jobs/autofill` | Autofill | ATS form autofill tool | Completed | Extension |
| `/demarrage` | Getting Started | Guided onboarding flow | Completed | Profile |
| `/first-run` | First Run | First-time setup wizard | Completed | Profile |
| `/market-radar` | Market Radar | Automated job market scanning dashboard | Completed | Market Radar |
| `/entretiens` | Interviews | Interview management | Completed | Opportunities |
| `/entretiens/[id]` | Interview Detail | Single interview details and prep | Completed | Opportunity |
| `/pipeline` | Pipeline (Standalone) | Standalone pipeline view | Completed | Opportunities |
| `/performance` | Performance | Performance metrics and KPIs | Completed | Analytics |
| `/guide` | Guide | User guide and documentation | Completed | Static |
| `/parametres` | Settings | Application settings | Completed | Database |
| `/quality-check` | Quality Check | Quality assurance checks | Experimental | Testing |
| `/test-flow` | Test Flow | Integration test flow UI | Experimental | Testing |
| `/elton-os` | ELTON OS Public | Public landing page | Completed | Static |

## Public Pages (under `app/(public)/`)

| Route | Screen | Purpose | Status |
|-------|--------|---------|--------|
| `/` (public layout) | Public Layout | Public-facing layout wrapper | Completed |
| `/elton-os` | ELTON OS Landing | Public product landing page | Completed |

## API Routes (under `app/api/`)

Key API endpoints (full list in `route-tree.txt`):

| Route | Purpose |
|-------|---------|
| `/api/profile` | Profile CRUD |
| `/api/jobs` | Job/opportunity listing and search |
| `/api/jobs/[id]` | Single opportunity |
| `/api/jobs/[id]/score` | Executive scoring |
| `/api/jobs/[id]/prepare-application` | Generate application documents |
| `/api/jobs/[id]/draft` | Application draft management |
| `/api/jobs/[id]/status` | Status updates |
| `/api/jobs/assisted-import/*` | Assisted import pipeline |
| `/api/application-drafts/[id]/*` | Full draft management + documents |
| `/api/application-drafts/[id]/documents/cv` | CV PDF download (with template support) |
| `/api/application-drafts/[id]/documents/cover-letter` | Cover letter PDF download |
| `/api/application-drafts/[id]/documents/zip` | CV + letter ZIP download |
| `/api/market-radar/*` | Market scanning and candidates |
| `/api/cron/*` | Scheduled tasks (sourcing, reports) |
| `/api/crm/*` | CRM operations |
| `/api/interview-prep/*` | Interview preparation |
| `/api/health` | Health check |
| `/api/demo` | Demo mode |

## Status Legend
- **Completed** — Functional, tested, in use
- **Partial** — Some features missing or known issues
- **Experimental** — Prototype stage, may be unstable
