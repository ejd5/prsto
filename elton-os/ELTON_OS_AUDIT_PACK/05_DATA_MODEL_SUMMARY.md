# ELTON OS — Data Model Summary

## Overview
ELTON OS uses SQLite via Prisma ORM. The database is a single file (`prisma/dev.db` by default). All data is local-first — there is no cloud database.

## Core Models

### Profile (1 per user)
The central entity. Stores executive identity, contact info, career metadata, CV template preferences, and linked data.
- **Relationships**: Has one `CVMaster`, many `Skill`s, many `Experience`s, many `ProofEntry`s
- **Sensitive fields**: `fullName`, `phone`, `email`, `linkedin`, `photoUrl`, `targetSalary`, `sectors`, `education`, `certifications`

### CVMaster (1 per Profile)
Stores the imported CV text and parsed representation.
- **Sensitive**: Contains full CV text (`originalText`) which may include personal history, references, detailed career data
- **Relationships**: Belongs to `Profile`

### Skill (many per Profile)
Individual skills with category, level, and source tracking.
- **Source field**: `cv_master` (from CV parsing), `proof_vault` (manually added)
- **Relationships**: Belongs to `Profile`

### Experience (many per Profile)
Career experiences with company, title, dates, description, and quantified metrics (team size, revenue, budget).
- **Sensitive**: Contains employment history, team sizes, P&L data
- **Relationships**: Belongs to `Profile`, may have many `ProofEntry`s

### ProofEntry (many per Profile)
Quantified achievements with category, confidence rating, and usage flags.
- **Flags**: `sendableToAI` controls which proofs are sent to AI for generation
- **Relationships**: Belongs to `Profile`, optionally linked to `Experience`

## Job / Opportunity Models

### JobSource
Configuration for job board sources (LinkedIn, Indeed, APEC, France Travail, etc.).
- Does NOT store credentials or cookies
- **Relationships**: Has many `MarketRadar`s, many `Opportunity`s

### PriorityRole
Defined target roles (e.g., "Directeur Commercial") with priority ranking.

### TargetCountry
Country targeting configuration for market scanning.

### MarketRadar
Automated search configuration per job source. Stores constructed search URLs.
- **Sensitive**: Search URLs may contain location or role preferences

### RadarCandidate
Discovered job postings from market scanning, before full import. Stores score, priority, dedup status.

### Opportunity
Imported job posting with full details, scoring, and pipeline status.
- **Sensitive**: Company names and job details (not personal data, but proprietary to the job listing)
- **Relationships**: Has one `Analysis`, many `Document`s, one `PipelineTask`, many `Relance`s, many `Interview`s

### Analysis (1 per Opportunity)
AI-generated analysis of the opportunity vs. candidate profile. Stores score, keyword matches, gaps, risks.

### Document (many per Opportunity)
Generated application documents (CV, cover letter, email, LinkedIn message, ATS answers).

### PipelineTask (1 per Opportunity)
Pipeline card status and position.

### Relance (many per Opportunity)
Follow-up/reminder records for applications.

### Interview (many per Opportunity)
Interview records with dates, notes, status.

## CRM Models (Experimental)

### CrmContact
Contact management for professional network.

### CrmInteraction (many per CrmContact)
Interaction history with contacts.

## Sensitive Data Areas

| Area | Data | Risk |
|------|------|------|
| Profile | fullName, phone, email, location | PII |
| Profile | targetSalary, sectors | Career preferences |
| CVMaster | Full CV text with complete career history | PII, employment history |
| Experience | Company names, dates, team sizes, budgets | Employment data |
| ProofEntry | Quantified achievements (revenue, growth) | Career metrics |
| ApiConfig | AI API keys (hashed) | Security-critical |
| Opportunity | Company names, job details | Not personal, but listing source data |

## API Key Storage
AI provider API keys (DeepSeek, etc.) are stored in `ApiConfig` model, NOT in `.env` at runtime. The actual key values are stored as-is (not encrypted at rest in current version — noted as improvement area).

## Database File
- Location: `prisma/dev.db` (or configured via `DATABASE_URL` env var)
- Format: SQLite 3
- This file is NEVER included in the audit pack
