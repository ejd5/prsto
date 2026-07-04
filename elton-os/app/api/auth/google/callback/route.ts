import { NextResponse } from "next/server";
import {
  exchangeGoogleCode,
  verifyStateCookie,
  findOrCreateUserFromSso,
  finalizeSsoLogin,
  getBaseUrl,
} from "@/lib/auth/sso";

// GET /api/auth/google/callback?code=...&state=...
// Google redirects here after user consents
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // User denied consent
  if (error) {
    return NextResponse.redirect(`${getBaseUrl()}/login?error=access_denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${getBaseUrl()}/login?error=missing_params`);
  }

  // Verify state cookie (CSRF protection)
  const validState = await verifyStateCookie(state);
  if (!validState) {
    return NextResponse.redirect(`${getBaseUrl()}/login?error=invalid_state`);
  }

  try {
    const { tokens, user } = await exchangeGoogleCode(code);

    if (!user.email_verified) {
      return NextResponse.redirect(`${getBaseUrl()}/login?error=email_not_verified`);
    }

    const result = await findOrCreateUserFromSso("google", {
      providerAccountId: user.sub,
      email: user.email,
      name: user.name,
      image: user.picture,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : undefined,
    });

    await finalizeSsoLogin({
      userId: result.userId,
      email: result.email,
      role: result.role,
    });

    // Redirect to app home (or onboarding if new user)
    const dest = result.isNewUser ? "/?welcome=1" : "/";
    return NextResponse.redirect(`${getBaseUrl()}${dest}`);
  } catch (err) {
    console.error("[SSO] Google callback error:", err);
    return NextResponse.redirect(`${getBaseUrl()}/login?error=exchange_failed`);
  }
}
