import { NextResponse } from "next/server";
import { getGoogleAuthUrl, buildState, setStateCookie, isProviderConfigured } from "@/lib/auth/sso";

// GET /api/auth/google
// Initiates Google OAuth flow — redirects user to Google consent screen
export async function GET() {
  if (!isProviderConfigured("google")) {
    return NextResponse.json(
      { error: "Google SSO n'est pas configuré. Ajoutez GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET dans .env.local" },
      { status: 503 }
    );
  }

  const state = buildState();
  await setStateCookie(state);
  const url = getGoogleAuthUrl(state);
  return NextResponse.redirect(url);
}
