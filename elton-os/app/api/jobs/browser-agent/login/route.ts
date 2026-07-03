import { NextResponse } from "next/server";
import { startManualLogin } from "@/lib/jobs/browser-agent/browser-agent";
import type { BrowserPlatform } from "@/lib/jobs/browser-agent/types";

function checkAuth(request: Request): "ok" | "missing" | "invalid" {
  if (process.env.NODE_ENV !== "production") return "ok";
  const token = request.headers.get("x-api-token");
  const expected = process.env.SOURCING_CRON_TOKEN;
  if (!expected) return "ok";
  if (!token) return "missing";
  return token === expected ? "ok" : "invalid";
}

export async function POST(request: Request) {
  const auth = checkAuth(request);
  if (auth !== "ok") {
    return NextResponse.json({ error: auth === "missing" ? "Token manquant" : "Token invalide" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const platform = body.platform as BrowserPlatform;

  if (!["linkedin", "indeed", "apec"].includes(platform)) {
    return NextResponse.json({ error: "Platform invalide" }, { status: 400 });
  }

  try {
    const status = await startManualLogin(platform);
    return NextResponse.json({
      success: status === "connected",
      platform,
      status,
      message: status === "connected"
        ? "Connexion réussie. Session sauvegardée."
        : status === "needs_user_reauth"
          ? "Connexion annulée. Réessayez."
          : status === "blocked"
            ? "Blocage détecté par la plateforme."
            : "Erreur lors de la connexion.",
    });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
