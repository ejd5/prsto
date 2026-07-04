import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { acceptInvitation } from "@/lib/enterprise";

// GET /api/enterprise/accept-invite?token=...
// Accepts invitation, redirects to /enterprise
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(new URL("/login?error=missing_token", request.url));
    }

    const session = await getSession();
    if (!session) {
      // Redirect to login with redirect back to this URL
      const returnUrl = encodeURIComponent(request.url);
      return NextResponse.redirect(new URL(`/login?returnUrl=${returnUrl}`, request.url));
    }

    const result = await acceptInvitation(token, session.userId, session.email);

    if (!result.success) {
      return NextResponse.redirect(new URL(`/enterprise?error=${encodeURIComponent(result.error || "Erreur")}`, request.url));
    }

    return NextResponse.redirect(new URL("/enterprise?welcome=1", request.url));
  } catch (error) {
    console.error("[enterprise/accept-invite] Error:", error);
    return NextResponse.redirect(new URL("/enterprise?error=accept_failed", request.url));
  }
}

// POST /api/enterprise/accept-invite — alternative for programmatic use
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { token } = body as { token: string };

    if (!token) {
      return NextResponse.json({ error: "Token requis" }, { status: 400 });
    }

    const result = await acceptInvitation(token, session.userId, session.email);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, orgId: result.orgId });
  } catch (error) {
    console.error("[enterprise/accept-invite] POST Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
