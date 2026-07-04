"use server";

import { prisma } from "@/lib/prisma";

/**
 * Scanner France Travail via leur API publique (pas de scraping).
 * Utilise l'API existante lib/jobs/connectors/france-travail.ts
 */
export async function scanFranceTravail(): Promise<{ success: boolean; found: number; error?: string }> {
  try {
    // Utiliser la route API d'import existante
    const res = await fetch("http://localhost:3000/api/jobs/import/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "manual",
        source: "france-travail",
        maxPages: 2,
        maxJobsPerRun: 25,
        dryRun: false,
      }),
    });
    const data = await res.json();
    return {
      success: data.success || false,
      found: data.createdCount || 0,
      error: data.error,
    };
  } catch (e: unknown) {
    return { success: false, error: (e as Error).message, found: 0 };
  }
}

/**
 * Génère des liens de recherche pour les plateformes à import manuel.
 * L'utilisateur doit ouvrir ces liens, copier le texte de l'annonce, et le coller dans PRSTO.
 */
export async function generateSearchUrls(): Promise<{
  queries: string[];
  urls: { platform: string; query: string; url: string }[];
}> {
  const profile = await prisma.profile.findFirst({
    select: { title: true, functions: true, sectors: true },
  });
  const { buildSearchQueriesFromProfile } = await import("@/lib/market-radar/query-builder");

  const queries = buildSearchQueriesFromProfile(
    profile ? {
      title: profile.title,
      functions: profile.functions,
      sectors: profile.sectors,
    } : null,
  );

  const platforms = [
    {
      name: "LinkedIn",
      url: (q: string) => `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(q)}&location=France`,
    },
    {
      name: "Indeed",
      url: (q: string) => `https://fr.indeed.com/jobs?q=${encodeURIComponent(q)}&l=France`,
    },
    {
      name: "APEC",
      url: (q: string) => `https://www.apec.fr/candidat/recherche-emploi.html/emploi?motsCles=${encodeURIComponent(q)}`,
    },
    {
      name: "Welcome to the Jungle",
      url: (q: string) => `https://www.welcometothejungle.com/fr/jobs?query=${encodeURIComponent(q)}`,
    },
  ];

  const urls = queries.slice(0, 15).flatMap((q) =>
    platforms.map((p) => ({ platform: p.name, query: q, url: p.url(q) }))
  );

  return { queries, urls };
}
