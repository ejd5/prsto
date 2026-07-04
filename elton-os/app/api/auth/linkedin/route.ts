import { NextResponse } from "next/server";
import { getLinkedInAuthUrl, buildState, setStateCookie, isProviderConfigured } from "@/lib/auth/sso";

// GET /api/auth/linkedin
// Initiates LinkedIn OAuth flow
export async function GET() {
  if (!isProviderConfigured("linkedin")) {
    return NextResponse.json(
      { error: "LinkedIn SSO n'est pas configuré. Ajoutez LINKEDIN_CLIENT_ID et LINKEDIN_CLIENT_SECRET dans .env.local" },
      { status: 503 }
    );
  }

  const state = buildState();
  await setStateCookie(state);
  const url = getLinkedInAuthUrl(state);
  return NextResponse.redirect(url);
}
