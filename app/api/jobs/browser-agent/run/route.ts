import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { browserAgentConnector } from "@/lib/jobs/connectors/browser-agent-connector";
import { runBrowserSearch } from "@/lib/jobs/browser-agent/browser-agent";

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
  const configId = body.configId as string | undefined;

  try {
    // Si un configId est fourni, ne lancer QUE cette config
    if (configId) {
      const config = await prisma.browserSearchConfig.findUnique({ where: { id: configId } });
      if (!config) {
        return NextResponse.json({ error: "Configuration introuvable" }, { status: 404 });
      }
      if (!config.enabled) {
        return NextResponse.json({ error: "Configuration désactivée. Activez-la d'abord." }, { status: 400 });
      }

      const result = await runBrowserSearch({
        id: config.id,
        platform: config.platform as "linkedin" | "indeed" | "apec",
        searchUrl: config.searchUrl,
        label: config.label,
        enabled: config.enabled,
        maxResultsPerRun: config.maxResultsPerRun,
        locationPriority: config.locationPriority ?? undefined,
        scrollEnabled: config.scrollEnabled,
        maxScrolls: config.maxScrolls,
        scrollDelayMs: config.scrollDelayMs,
        fetchDetailsEnabled: config.fetchDetailsEnabled,
        maxDetailsPerRun: config.maxDetailsPerRun,
      });

      // Mettre à jour la config
      await prisma.browserSearchConfig.update({
        where: { id: config.id },
        data: {
          lastRunAt: new Date(),
          lastError: result.error || null,
          lastOffersFound: result.jobs.length,
          lastDetailsFetched: result.detailsFetched,
        },
      });

      return NextResponse.json({
        success: result.status === "success",
        found: result.jobs.length,
        detailsFetched: result.detailsFetched,
        error: result.error || null,
        jobs: result.jobs.map(j => ({ title: j.title, company: j.company, location: j.location })),
        message: result.status === "success"
          ? `${result.jobs.length} offre(s) trouvée(s). Lancez un import pour les traiter.`
          : result.status === "needs_user_reauth"
            ? "Session expirée. Reconnectez la session."
            : result.error || "Erreur inconnue",
      });
    }

    // Sinon, lancer toutes les configs
    const result = await browserAgentConnector.runAllSearches();
    return NextResponse.json({
      success: true,
      found: result.offers.length,
      totals: result.totals,
      message: `${result.offers.length} offre(s) trouvée(s) par le Browser Agent. Lancez un import pour les traiter.`,
    });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
