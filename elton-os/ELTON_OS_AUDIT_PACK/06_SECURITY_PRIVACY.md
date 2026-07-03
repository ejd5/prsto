# ELTON OS — Security & Privacy

## Architecture Principles

### Local-First
- **All profile data stored locally** in SQLite on the user's machine
- No cloud sync, no remote database, no user accounts
- The application runs entirely on `localhost:3000`
- No data leaves the machine unless the user explicitly enables AI generation

### AI Generation (Optional)
- AI document generation requires an API key (DeepSeek, NVIDIA NIM, or OpenRouter)
- The user must explicitly configure the API key
- Only approved data fields (marked `sendableToAI` in Proof Vault) are sent to AI
- Strict "never invent" system prompts prevent hallucination
- The user can review and edit all AI-generated content before use

## What ELTON OS Does NOT Do
This is a deliberate design principle — these are enforced in code:

1. **No auto-apply** — The app never submits an application automatically. Every apply action requires human button click.
2. **No scraping LinkedIn** — The Chrome extension only reads the currently visible DOM when the user explicitly clicks "Analyze." No background crawling, no stored cookies.
3. **No anti-bot bypass** — If LinkedIn/Indeed/APEC shows a login wall or CAPTCHA, the extension blocks and tells the user.
4. **No automatic email sending** — All email content is generated for the user to copy-paste manually.
5. **No automatic LinkedIn messaging** — Messages are generated for manual copy-paste only.
6. **No ATS form submission** — The extension fills fields but never clicks Submit. The user must verify and submit.
7. **No cookies/tokens storage** — The extension does not read or store LinkedIn/Indeed/APEC session data.
8. **No mass scraping** — Maximum 10 visible job cards in list mode. Single job in detail mode.
9. **No user accounts** — No registration, no login, no multi-tenancy.

## API Key Management
- API keys stored in `ApiConfig` database model
- Keys can be managed via Settings UI
- No keys are hardcoded in the codebase
- The `.env` file is excluded from version control (in `.gitignore`)
- Note: Keys are not encrypted at rest in the database (improvement area)

## Data Excluded from Audit Pack
The following are intentionally excluded from this pack:
- `.env`, `.env.local` (environment secrets)
- `prisma/dev.db` (real database)
- Files containing personal data (real CVs, emails, phone numbers)
- Any `.db`, `.sqlite`, `.sqlite3` files
- `node_modules/`, `.next/`, `coverage/`, `playwright-report/`, `test-results/`
- Screenshots containing real personal data
- API keys, tokens, session data

## Remaining Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| API keys stored without encryption | Medium | Feature request: encrypt at rest |
| SQLite file unprotected on disk | Medium | File-system permissions only |
| No user authentication | Low (by design — local app) | N/A — local-first architecture |
| CV data in browser local state | Low | Session-only, cleared on tab close |
| AI provider receives profile data | Low | User opt-in, limited to approved fields |
| Extension runs on job sites | Low | activeTab only, no background scripts |
