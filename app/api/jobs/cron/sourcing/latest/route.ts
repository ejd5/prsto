import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* ─── Auth (same as POST route) ──────────── */

function isLocalRequest(request: Request): boolean {
  const host = request.headers.get("host") || "";
  if (/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host)) return true;
  if (/^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)) return true;
  if (host.endsWith(".local")) return true;
  return false;
}

function checkAuth(request: Request): "ok" | "missing" | "invalid" {
  // En localhost/dev, le token est optionnel
  if (process.env.NODE_ENV !== "production" && isLocalRequest(request)) return "ok";

  const token = request.headers.get("x-api-token");
  const expected = process.env.SOURCING_CRON_TOKEN;

  // En production ou exposé, le token est obligatoire
  if (!expected) return "missing";
  if (!token) return "missing";
  return token === expected ? "ok" : "invalid";
}

export async function GET(request: Request) {
  // Auth: bloqué hors localhost sans token
  const auth = checkAuth(request);
  if (auth !== "ok") {
    return NextResponse.json(
      { error: auth === "missing" ? "Token requis pour accéder au rapport de sourcing" : "Token invalide" },
      { status: 401 },
    );
  }

  try {
    const latest = await prisma.jobSearchRun.findFirst({
      where: { logsJson: { not: null } },
      orderBy: { startedAt: "desc" },
    });

    if (!latest) {
      return NextResponse.json({
        found: false,
        message: "Aucun rapport de sourcing disponible. Lancez un premier cron.",
      });
    }

    let parsedLogs: Record<string, unknown> = {};
    try {
      parsedLogs = JSON.parse(latest.logsJson || "{}");
    } catch { /* ignore */ }

    // Nettoyer les champs sensibles avant exposition
    const { errorsBySource, ...safeLogs } = parsedLogs as Record<string, unknown>;

    return NextResponse.json({
      found: true,
      id: latest.id,
      mode: latest.mode,
      status: latest.status,
      startedAt: latest.startedAt.toISOString(),
      finishedAt: latest.finishedAt?.toISOString() || null,
      fetchedCount: latest.fetchedCount,
      createdCount: latest.createdCount,
      duplicateCount: latest.duplicateCount,
      rejectedCount: latest.rejectedCount,
      errorMessage: latest.errorMessage,
      ...safeLogs,
      // Ne pas exposer errorsBySource publiquement (contient des URLs d'offres)
      errorsCount: errorsBySource ? Object.keys(errorsBySource as Record<string, unknown>).length : 0,
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
