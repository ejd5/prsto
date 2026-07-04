# PRSTO — SSO Setup Guide (Google + LinkedIn)

This guide explains how to enable Single Sign-On (Google + LinkedIn) on PRSTO.

---

## Architecture

PRSTO uses a **custom JWT session system** (cookie `prsto_session`, 30 days). SSO was added **alongside** the existing email/password auth — no breaking changes.

| Flow | What happens |
|------|--------------|
| User clicks "Continuer avec Google" | Browser redirects to `/api/auth/google` |
| `/api/auth/google` | Sets a state cookie + redirects to Google consent screen |
| User consents on Google | Google redirects back to `/api/auth/google/callback?code=...&state=...` |
| `/api/auth/google/callback` | Verifies state, exchanges code for tokens, fetches user info, **finds-or-creates User + Account**, calls `createSession()` |
| Browser redirects to `/` | User is logged in (cookie `prsto_session` set) |

Same flow for LinkedIn, replacing Google with LinkedIn URLs.

### Database

Two schema changes (already pushed to Neon):

1. **`User.password` is now nullable** — SSO-only users have `password = null`. Login route refuses email/password for these users and tells them which SSO provider to use.
2. **New `Account` model** — stores OAuth provider linkage (`provider`, `providerAccountId`, tokens, etc.). Unique on `[provider, providerAccountId]`.

A user can have multiple Accounts (e.g. both Google and LinkedIn linked to the same email).

---

## Required env vars (in `.env.local`)

```bash
# App base URL — must match the OAuth redirect URIs you register with Google/LinkedIn
# Examples:
#   Local:     http://localhost:3000
#   Preview:   https://preview-chat-<bot-id>.space-z.ai
#   Prod:      https://prsto.com
NEXTAUTH_URL=http://localhost:3000

# Google OAuth 2.0 (https://console.cloud.google.com/apis/credentials)
GOOGLE_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxx

# LinkedIn OAuth 2.0 (https://www.linkedin.com/developers/apps)
LINKEDIN_CLIENT_ID=86xxxxxxxxxxx
LINKEDIN_CLIENT_SECRET=xxxxxxxxxxxxxxxx
```

If a provider's vars are missing, **the buttons don't show** on the login page (graceful fallback). No crash.

---

## Step 1 — Google Cloud Console

1. Go to https://console.cloud.google.com/
2. Create or select a project (e.g. `prsto-prod`)
3. **APIs & Services → OAuth consent screen**
   - User type: **External** (or Internal if you have a Workspace)
   - App name: `PRSTO`
   - Support email: your email
   - Authorized domains: `space-z.ai` (for preview) and your prod domain
   - Scopes: `openid`, `email`, `profile` (already requested by code)
   - Add yourself as a Test User (while app is in "Testing" mode)
4. **APIs & Services → Credentials → Create credentials → OAuth client ID**
   - Application type: **Web application**
   - Authorized JavaScript origins:
     - `http://localhost:3000`
     - `https://preview-chat-<your-bot-id>.space-z.ai`
     - `https://yourprod.com`
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/google/callback`
     - `https://preview-chat-<your-bot-id>.space-z.ai/api/auth/google/callback`
     - `https://yourprod.com/api/auth/google/callback`
   - Click **Create**
5. Copy **Client ID** and **Client Secret** into `.env.local`

---

## Step 2 — LinkedIn Developer Portal

1. Go to https://www.linkedin.com/developers/apps
2. Click **Create app**
   - App name: `PRSTO`
   - LinkedIn Page: link to your company page (or create one)
   - Privacy policy URL: required (use any URL for now, e.g. `https://prsto.com/privacy`)
   - App logo: upload PRSTO logo
3. **Auth tab**:
   - Authorized redirect URLs:
     - `http://localhost:3000/api/auth/linkedin/callback`
     - `https://preview-chat-<your-bot-id>.space-z.ai/api/auth/linkedin/callback`
     - `https://yourprod.com/api/auth/linkedin/callback`
   - OAuth 2.0 scopes: select `Sign In with LinkedIn using OpenID Connect` (gives `openid`, `profile`, `email`)
4. **Products tab**: add "Sign In with LinkedIn"
5. **Settings tab**: copy **Client ID** and **Client Secret** into `.env.local`

> ⚠️ LinkedIn apps start in "Development" mode — only app owners/developers can sign in. To allow anyone, you must submit for **Verification** (requires app review, ~1-2 weeks).

---

## Step 3 — Restart & test

```bash
# After updating .env.local:
npm run build
npm start
# Visit http://localhost:3000/login
# You should see the two SSO buttons above the email/password form
```

Test checklist:
- [ ] Login page shows "Continuer avec Google" button
- [ ] Login page shows "Continuer avec LinkedIn" button
- [ ] Clicking Google button → Google consent screen
- [ ] After consent → redirected back to `/` and logged in
- [ ] Logout → can login again with same Google account (existing Account reused)
- [ ] Logout → try email/password login with the SSO user's email → blocked with friendly message
- [ ] LinkedIn button → LinkedIn consent → back to `/` logged in

---

## Files

| File | Role |
|------|------|
| `lib/auth/sso.ts` | OAuth helpers (state, URLs, code exchange, find-or-create user) |
| `app/api/auth/google/route.ts` | Initiates Google OAuth |
| `app/api/auth/google/callback/route.ts` | Handles Google callback |
| `app/api/auth/linkedin/route.ts` | Initiates LinkedIn OAuth |
| `app/api/auth/linkedin/callback/route.ts` | Handles LinkedIn callback |
| `app/api/auth/sso-status/route.ts` | Returns which providers are configured (for login page) |
| `app/(public)/login/page.tsx` | Login UI with SSO buttons + email/password fallback |
| `prisma/schema.prisma` | Added `Account` model + `User.password` now nullable |

---

## Security notes

- **State cookie** (`prsto_sso_state`) prevents CSRF — 10 minute TTL, httpOnly, sameSite=lax
- **Tokens are stored** in the `Account` table (`accessToken`, `refreshToken`, `expiresAt`) — useful for future features (e.g. importing LinkedIn profile data)
- **Existing users** can link an SSO account: if email matches, we link the new `Account` to the existing `User` (no duplicate)
- **No password leakage**: SSO-only users (`password = null`) cannot login via email/password — the API refuses with a friendly message telling them which SSO to use

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Buttons don't appear | One or both providers' env vars are missing. Check `.env.local`. |
| "redirect_uri_mismatch" | The redirect URI in Google/LinkedIn console must EXACTLY match `${NEXTAUTH_URL}/api/auth/{provider}/callback` |
| "invalid_client" | Client ID/secret typo |
| "access_denied" on consent | User cancelled — normal |
| "email_not_verified" (Google) | User's Google email isn't verified (rare) |
| LinkedIn "Insufficient permissions" | App still in Development mode — add user as developer in LinkedIn portal |
| Works locally, fails on preview | `NEXTAUTH_URL` must be the public URL (https://preview-xxx.space-z.ai), and that URL must be in the OAuth redirect URIs list |
