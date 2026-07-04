import { NextResponse } from "next/server";
import {
  exchangeLinkedInCode,
  verifyStateCookie,
  findOrCreateUserFromSso,
  finalizeSsoLogin,
  getBaseUrl,
} from "@/lib/auth/sso";

// GET /api/auth/linkedin/callback?code=...&state=...
// LinkedIn redirects here after user consents
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${getBaseUrl()}/login?error=access_denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${getBaseUrl()}/login?error=missing_params`);
  }

  const validState = await verifyStateCookie(state);
  if (!validState) {
    return NextResponse.redirect(`${getBaseUrl()}/login?error=invalid_state`);
  }

  try {
    const { tokens, user } = await exchangeLinkedInCode(code);

    if (!user.email) {
      return NextResponse.redirect(`${getBaseUrl()}/login?error=no_email`);
    }

    const result = await findOrCreateUserFromSso("linkedin", {
      providerAccountId: user.sub,
      email: user.email,
      name: user.name,
      image: user.picture,
      accessToken: tokens.access_token,
      refreshToken: undefined,
      expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : undefined,
    });

    await finalizeSsoLogin({
      userId: result.userId,
      email: result.email,
      role: result.role,
    });

    const dest = result.isNewUser ? "/?welcome=1" : "/";
    return NextResponse.redirect(`${getBaseUrl()}${dest}`);
  } catch (err) {
    console.error("[SSO] LinkedIn callback error:", err);
    return NextResponse.redirect(`${getBaseUrl()}/login?error=exchange_failed`);
  }
}
