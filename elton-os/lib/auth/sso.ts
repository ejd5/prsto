/**
 * SSO helpers — Google + LinkedIn OAuth 2.0
 * =====================================================
 * Works alongside the existing JWT session system:
 *   - On OAuth success, we call createSession() from lib/auth/session
 *   - SSO users have password = null (cannot login with email/password)
 *   - Existing users with a password can link an SSO account (future feature)
 *
 * Required env vars (set in .env.local):
 *   GOOGLE_CLIENT_ID
 *   GOOGLE_CLIENT_SECRET
 *   LINKEDIN_CLIENT_ID
 *   LINKEDIN_CLIENT_SECRET
 *   NEXTAUTH_URL  (or NEXT_PUBLIC_APP_URL)  — e.g. http://localhost:3000
 *                                              or https://preview-xxx.space-z.ai
 */

import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth/session";

// ─── Provider config ───────────────────────────────────────
export type SsoProvider = "google" | "linkedin";

export function isProviderConfigured(provider: SsoProvider): boolean {
  if (provider === "google") {
    return !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
  }
  if (provider === "linkedin") {
    return !!process.env.LINKEDIN_CLIENT_ID && !!process.env.LINKEDIN_CLIENT_SECRET;
  }
  return false;
}

export function getConfiguredProviders(): SsoProvider[] {
  const list: SsoProvider[] = [];
  if (isProviderConfigured("google")) list.push("google");
  if (isProviderConfigured("linkedin")) list.push("linkedin");
  return list;
}

// ─── URL helpers ───────────────────────────────────────────
export function getBaseUrl(): string {
  // Priority: NEXTAUTH_URL > NEXT_PUBLIC_APP_URL > VERCEL_URL > default localhost
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL.replace(/\/$/, "");
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

function getRedirectUri(provider: SsoProvider): string {
  const base = getBaseUrl();
  return `${base}/api/auth/${provider}/callback`;
}

// ─── State cookie (CSRF protection) ────────────────────────
const STATE_COOKIE = "prsto_sso_state";
const STATE_MAX_AGE = 10 * 60; // 10 minutes

export function buildState(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function setStateCookie(state: string): Promise<void> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: STATE_MAX_AGE,
    path: "/",
  });
}

export async function verifyStateCookie(state: string): Promise<boolean> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const stored = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);
  if (!stored || stored !== state) return false;
  return true;
}

// ─── Google OAuth URLs ─────────────────────────────────────
const GOOGLE_SCOPES = ["openid", "email", "profile"].join(" ");

export function getGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: getRedirectUri("google"),
    response_type: "code",
    scope: GOOGLE_SCOPES,
    state,
    access_type: "online",
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

interface GoogleTokenResponse {
  access_token: string;
  id_token?: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
}

export async function exchangeGoogleCode(code: string): Promise<{
  tokens: GoogleTokenResponse;
  user: GoogleUserInfo;
}> {
  // 1. Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: getRedirectUri("google"),
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const txt = await tokenRes.text();
    throw new Error(`Google token exchange failed: ${tokenRes.status} ${txt}`);
  }

  const tokens = (await tokenRes.json()) as GoogleTokenResponse;

  // 2. Fetch user info
  const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userRes.ok) {
    throw new Error(`Google userinfo failed: ${userRes.status}`);
  }

  const user = (await userRes.json()) as GoogleUserInfo;
  return { tokens, user };
}

// ─── LinkedIn OAuth URLs ───────────────────────────────────
// Using OpenID Connect scopes (available since 2023 — replaces r_liteprofile/r_emailaddress)
const LINKEDIN_SCOPES = ["openid", "profile", "email"].join(" ");

export function getLinkedInAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.LINKEDIN_CLIENT_ID!,
    redirect_uri: getRedirectUri("linkedin"),
    response_type: "code",
    scope: LINKEDIN_SCOPES,
    state,
  });
  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
}

interface LinkedInTokenResponse {
  access_token: string;
  id_token?: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface LinkedInUserInfo {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
}

export async function exchangeLinkedInCode(code: string): Promise<{
  tokens: LinkedInTokenResponse;
  user: LinkedInUserInfo;
}> {
  // 1. Exchange code for tokens
  const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      redirect_uri: getRedirectUri("linkedin"),
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const txt = await tokenRes.text();
    throw new Error(`LinkedIn token exchange failed: ${tokenRes.status} ${txt}`);
  }

  const tokens = (await tokenRes.json()) as LinkedInTokenResponse;

  // 2. Fetch user info via OpenID Connect /v2/userinfo
  const userRes = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userRes.ok) {
    throw new Error(`LinkedIn userinfo failed: ${userRes.status}`);
  }

  const user = (await userRes.json()) as LinkedInUserInfo;
  return { tokens, user };
}

// ─── Find-or-create user (shared by both providers) ────────
export interface SsoUserInfo {
  providerAccountId: string;
  email: string;
  name?: string;
  image?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export async function findOrCreateUserFromSso(
  provider: SsoProvider,
  info: SsoUserInfo
): Promise<{ userId: string; email: string; role: string; isNewUser: boolean }> {
  // 1. Existing Account? → user already linked
  const existingAccount = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider,
        providerAccountId: info.providerAccountId,
      },
    },
    include: { user: true },
  });

  if (existingAccount) {
    // Refresh tokens + image (in case they changed)
    await prisma.account.update({
      where: { id: existingAccount.id },
      data: {
        accessToken: info.accessToken ?? existingAccount.accessToken,
        refreshToken: info.refreshToken ?? existingAccount.refreshToken,
        expiresAt: info.expiresAt ?? existingAccount.expiresAt,
        image: info.image ?? existingAccount.image,
        name: info.name ?? existingAccount.name,
      },
    });
    return {
      userId: existingAccount.user.id,
      email: existingAccount.user.email,
      role: existingAccount.user.role,
      isNewUser: false,
    };
  }

  // 2. Existing user with same email? → link new Account to it
  const existingUser = await prisma.user.findUnique({
    where: { email: info.email },
  });

  if (existingUser) {
    await prisma.account.create({
      data: {
        userId: existingUser.id,
        provider,
        providerAccountId: info.providerAccountId,
        email: info.email,
        name: info.name,
        image: info.image,
        accessToken: info.accessToken,
        refreshToken: info.refreshToken,
        expiresAt: info.expiresAt,
      },
    });
    // Update avatar if missing
    if (!existingUser.image && info.image) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { image: info.image },
      });
    }
    return {
      userId: existingUser.id,
      email: existingUser.email,
      role: existingUser.role,
      isNewUser: false,
    };
  }

  // 3. Brand new user — create with password = null (SSO-only)
  const newUser = await prisma.user.create({
    data: {
      email: info.email,
      name: info.name || info.email.split("@")[0],
      password: null,
      image: info.image,
      role: "user",
    },
  });

  await prisma.account.create({
    data: {
      userId: newUser.id,
      provider,
      providerAccountId: info.providerAccountId,
      email: info.email,
      name: info.name,
      image: info.image,
      accessToken: info.accessToken,
      refreshToken: info.refreshToken,
      expiresAt: info.expiresAt,
    },
  });

  return {
    userId: newUser.id,
    email: newUser.email,
    role: newUser.role,
    isNewUser: true,
  };
}

// ─── Finalize: create session + return redirect URL ────────
export async function finalizeSsoLogin(params: {
  userId: string;
  email: string;
  role: string;
}): Promise<void> {
  await createSession(params.userId, params.email, params.role);
}
