"use server";

import { prisma } from "@/lib/prisma";
import { generateJsonWithDeepSeek } from "@/lib/ai/deepseek";

const REPORT_PROMPT = `Tu es un assistant RH expert en pilotage de recherche d'emploi exécutive.
Tu dois rédiger un rapport clair et actionnable à partir des données de sourcing.

Le rapport doit contenir :
1. Résumé exécutif (1-2 phrases)
2. Nouveautés : nombre d'offres nouvelles, par source
3. Top offres de la journée (max 5, triées par priorité géographique puis score)
4. Alertes éventuelles (sources KO, problèmes détectés)

Format : texte clair, professionnel, environ 15-20 lignes maximum.`;

export async function generateReport(type: "morning" | "evening"): Promise<{
  content: string;
  runId: string | null;
}> {
  const latestRun = await prisma.sourcingRun.findFirst({
    where: { status: "completed" },
    orderBy: { completedAt: "desc" },
  });

  if (!latestRun) {
    // Même sans run, générer un rapport basé sur les offres existantes
    const opportunities = await prisma.opportunity.findMany({
      where: { isNew: true },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { title: true, company: true, location: true, geoScore: true, sourceName: true, createdAt: true },
    });

    let content = "";
    if (opportunities.length > 0) {
      const stats = {
        totalNouvelles: opportunities.length,
        sources: [...new Set(opportunities.map(o => o.sourceName))].filter(Boolean),
        topOffers: opportunities.slice(0, 5).map(o => ({
          titre: o.title,
          entreprise: o.company,
          lieu: o.location,
          score: o.geoScore,
        })),
      };

      const result = await generateJsonWithDeepSeek<{ rapport: string }>({
        systemPrompt: REPORT_PROMPT,
        userPrompt: `Rapport ${type === "morning" ? "matinal" : "de fin d'après-midi"}.
Statistiques : ${JSON.stringify(stats, null, 2)}

Génère un rapport professionnel en français.`,
        temperature: 0.3,
      });

      content = result.success && result.data?.rapport
        ? result.data.rapport
        : `Rapport ${type}: ${stats.totalNouvelles} offre(s) nouvelle(s) à examiner.`;
    } else {
      content = type === "morning"
        ? "Bonjour. Aucune nouvelle offre depuis le dernier rapport."
        : "Bonsoir. Aucune nouvelle offre détectée aujourd'hui.";
    }

    // Sauvegarder le rapport
    await prisma.sourcingReport.create({
      data: { type, content },
    });

    return { content, runId: null };
  }

  // Générer le rapport avec DeepSeek
  const newOffers = await prisma.opportunity.findMany({
    where: { isNew: true },
    orderBy: [{ geoScore: "desc" }, { roleScore: "desc" }],
    take: 10,
    select: { title: true, company: true, location: true, geoScore: true, geoPriority: true, roleScore: true, sourceName: true, matchedCity: true },
  });

  const stats = {
    run: {
      status: latestRun.status,
      duree: latestRun.completedAt
        ? Math.round((latestRun.completedAt.getTime() - latestRun.startedAt.getTime()) / 1000) + "s"
        : "N/A",
      trouvees: latestRun.offersFound,
      nouvelles: latestRun.offersNew,
      doublons: latestRun.offersDuplicates,
      resume: latestRun.summary,
    },
    sources: {
      OK: latestRun.sourcesSucceeded,
      KO: latestRun.sourcesAttempted - latestRun.sourcesSucceeded,
    },
    topOffers: newOffers.slice(0, 5).map(o => ({
      titre: o.title,
      entreprise: o.company,
      lieu: o.location,
      score_geo: o.geoScore,
      priorite: o.geoPriority === 1 ? "PACA" : o.geoPriority === 2 ? "IDF" : "France",
      score_role: o.roleScore,
      source: o.sourceName,
    })),
  };

  const result = await generateJsonWithDeepSeek<{ rapport: string }>({
    systemPrompt: REPORT_PROMPT,
    userPrompt: `Rapport ${type === "morning" ? "matinal" : "de fin d'après-midi"}.
Données : ${JSON.stringify(stats, null, 2)}

Génère un rapport professionnel en français.`,
    temperature: 0.3,
  });

  const content = result.success && result.data?.rapport
    ? result.data.rapport
    : latestRun.summary || `Rapport ${type}: ${latestRun.offersNew} nouvelle(s) offre(s).`;

  // Sauvegarder
  await prisma.sourcingReport.create({
    data: { type, content, sourceRunId: latestRun.id },
  });

  // Marquer les offres comme vues
  await prisma.opportunity.updateMany({
    where: { isNew: true },
    data: { isNew: false },
  });

  return { content, runId: latestRun.id };
}

export async function getReports(limit: number = 10) {
  return prisma.sourcingReport.findMany({
    orderBy: { date: "desc" },
    take: limit,
  });
}
