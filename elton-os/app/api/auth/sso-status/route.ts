import { NextResponse } from "next/server";
import { getConfiguredProviders, getBaseUrl } from "@/lib/auth/sso";

// GET /api/auth/sso-status
// Returns which SSO providers are configured + the redirect URLs to start OAuth
export async function GET() {
  const providers = getConfiguredProviders();
  const baseUrl = getBaseUrl();

  return NextResponse.json({
    providers: providers.map((p) => ({
      id: p,
      label: p === "google" ? "Google" : "LinkedIn",
      href: `/api/auth/${p}`,
    })),
    configured: {
      google: providers.includes("google"),
      linkedin: providers.includes("linkedin"),
    },
    baseUrl,
  });
}
