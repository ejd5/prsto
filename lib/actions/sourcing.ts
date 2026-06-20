"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { searchFranceTravail } from "@/lib/sourcing/connectors/api-france-travail";
import { crawlJsonLDSources } from "@/lib/sourcing/connectors/jsonld-crawler";
import { scrapeSites } from "@/lib/sourcing/connectors/html-scraper";
import { scoreByLocation } from "@/lib/sourcing/geo-scorer";
import { scoreByTitle } from "@/lib/sourcing/role-scorer";
import { normalizeLocation, dedupKey } from "@/lib/sourcing/normalizer";
import { generateJsonWithDeepSeek } from "@/lib/ai/deepseek";
import type { ConnectorHealth } from "@/lib/sourcing/types";
import type { NormalizedOffer, ScoredOffer } from "@/lib/sourcing/types";

// ─── DeepSeek enrich prompt ──────────────────────────────

const ENRICH_PROMPT = `Tu es un assistant RH expert en recrutement pour cadres dirigeants.
À partir du texte brut d'une offre d'emploi, tu dois structurer et enrichir l'offre.

Retourne UNIQUEMENT du JSON avec ces champs :
{
  "title": string (titre nettoyé, sans H/F, sans (F/H), sans CDI),
  "company": string (nom de l'entreprise nettoyé),
  "location": string (ville/localisation),
  "country": string (code pays FR/BE/CH/etc),
  "contractType": string (CDI/CDD/Freelance/Alternance),
  "remote": string (remote/hybride/présentiel/non précisé),
  "salaryMin": number (salaire min annuel brut en EUR, 0 si absent),
  "salaryMax": number (salaire max annuel brut en EUR, 0 si absent),
  "description": string (résumé concis 2-3 phrases)
}

Règle : Ne JAMAIS inventer d'information. Si un champ n'est pas dans le texte, mets une chaîne vide ou 0.`;

// ─── Fonctions internes ─────────────────────────────────

async function getFrenchTravailCredentials(): Promise<{ clientId: string; clientSecret: string } | null> {
  const clientId = process.env.FRANCE_TRAVAIL_CLIENT_ID;
  const clientSecret = process.env.FRANCE_TRAVAIL_CLIENT_SECRET;
  if (clientId && clientSecret) return { clientId, clientSecret };
  return null;
}

async function getPriorityRoles(): Promise<string[]> {
  const roles = await prisma.priorityRole.findMany({
    where: { active: true },
    orderBy: { rank: "asc" },
    select: { name: true },
  });
  return roles.map(r => r.name);
}

async function addOrUpdateOffer(offer: ScoredOffer, isNew: boolean): Promise<void> {
  const { geoScore, roleScore, globalScore, geoPriority, matchedRoles, matchedCity, ...data } = offer;

  const fullGeoScore = Math.round(geoScore * 0.6 + roleScore * 0.4);

  await prisma.opportunity.upsert({
    where: { id: `sourcing::${data.externalId}` },
    update: {
      lastSeenAt: new Date(),
      isNew: false,
    },
    create: {
      id: `sourcing::${data.externalId}`,
      title: data.title,
      company: data.company,
      location: data.location,
      country: data.country || "FR",
      sourceUrl: data.sourceUrl,
      sourceName: data.sourceName,
      rawText: data.description,
      salaryMin: data.salaryMin || 0,
      salaryMax: data.salaryMax || 0,
      salaryCurrency: data.salaryCurrency || "EUR",
      contractType: data.contractType,
      remote: data.remote,
      status: "nouveau",
      score: fullGeoScore,
      externalId: data.externalId,
      sourceType: data.sourceType,
      geoScore: Math.round(geoScore),
      geoPriority,
      roleScore: Math.round(roleScore),
      globalScore: Math.round(globalScore),
      matchedRoles: JSON.stringify(matchedRoles),
      matchedCity,
      firstSeenAt: new Date(),
      lastSeenAt: new Date(),
      isNew,
    },
  });
}

async function enrichWithDeepSeek(offer: NormalizedOffer): Promise<ScoredOffer> {
  // Géoscore
  const geo = scoreByLocation(offer.location);
  const geoLocation = normalizeLocation(offer.location);

  // DeepSeek normalisation (optionnel, fallback local)
  let enriched = { title: offer.title, company: offer.company, location: offer.location, country: offer.country || geoLocation.country || "FR", contractType: offer.contractType, remote: offer.remote, salaryMin: offer.salaryMin, salaryMax: offer.salaryMax, description: offer.description };

  if (offer.raw && offer.raw.length > 100) {
    try {
      const result = await generateJsonWithDeepSeek<typeof enriched>({
        systemPrompt: ENRICH_PROMPT,
        userPrompt: `Texte de l'offre :\n\n${offer.raw.slice(0, 8000)}`,
        temperature: 0.05,
      });
      if (result.success && result.data) {
        enriched = { ...enriched, ...result.data };
      }
    } catch { /* fallback local */ }
  }

  // Roles
  const priorityRoles = await getPriorityRoles();
  const role = scoreByTitle(enriched.title, priorityRoles);

  // Score global
  const globalScore = geo.score * 0.6 + role.score * 0.4;

  return {
    ...offer,
    title: enriched.title,
    company: enriched.company,
    location: enriched.location || offer.location,
    country: enriched.country || offer.country || geoLocation.country || "FR",
    contractType: enriched.contractType || offer.contractType,
    remote: enriched.remote || offer.remote,
    salaryMin: enriched.salaryMin || offer.salaryMin,
    salaryMax: enriched.salaryMax || offer.salaryMax,
    description: enriched.description || offer.description,
    geoScore: geo.score,
    roleScore: role.score,
    globalScore,
    geoPriority: geo.priority,
    matchedRoles: role.matchedRoles,
    matchedCity: geo.matchedCity || geoLocation.city,
  };
}

// ─── Orchestrateur principal ────────────────────────────

export async function runFullSourcing(isNew: boolean = true): Promise<{
  id: string;
  totalFound: number;
  totalNew: number;
  totalDuplicates: number;
  bySource: { name: string; found: number; imported: number }[];
  summary: string;
  health: ConnectorHealth[];
}> {
  // Créer le run
  const run = await prisma.sourcingRun.create({
    data: { status: "running" },
  });

  const allOffers: NormalizedOffer[] = [];
  const health: ConnectorHealth[] = [];
  const bySource: Record<string, { found: number; imported: number }> = {};
  const errors: string[] = [];

  // 1. France Travail API
  const ftCredentials = await getFrenchTravailCredentials();
  const ftKeywords = ["Directeur Commercial France", "Directeur des Ventes France", "Head of Sales France"];
  const ftResult = await searchFranceTravail(ftCredentials, ftKeywords);
  allOffers.push(...ftResult.offers);
  health.push(ftResult.health);
  bySource["France Travail"] = { found: ftResult.offers.length, imported: 0 };

  // 2. JSON-LD Crawler (sites carrières)
  const jsonldResult = await crawlJsonLDSources();
  allOffers.push(...jsonldResult.offers);
  health.push(jsonldResult.health);
  bySource["JSON-LD"] = { found: jsonldResult.offers.length, imported: 0 };

  // 3. HTML sites (scraping)
  const htmlResult = await scrapeSites(["Directeur Commercial France", "Directeur des Ventes"]);
  allOffers.push(...htmlResult.offers);
  health.push(htmlResult.health);
  bySource["HTML"] = { found: htmlResult.offers.length, imported: 0 };

  // Enrichir et importer
  let totalNew = 0;
  let totalDuplicates = 0;
  const seen = new Set<string>();

  for (const offer of allOffers) {
    // Déduplication locale (par externalId)
    if (seen.has(offer.externalId)) continue;
    seen.add(offer.externalId);

    // Déduplication DB (par externalId unique)
    const existing = await prisma.opportunity.findFirst({
      where: {
        OR: [
          { externalId: offer.externalId },
          { sourceUrl: offer.sourceUrl, title: { contains: offer.title.slice(0, 30) } },
        ],
      },
    });

    if (existing) {
      totalDuplicates++;
      // Mettre à jour lastSeenAt
      await prisma.opportunity.update({
        where: { id: existing.id },
        data: { lastSeenAt: new Date(), isNew: false },
      });
      continue;
    }

    // Enrichir avec DeepSeek
    const scored = await enrichWithDeepSeek(offer);

    // Ajouter à la DB
    await addOrUpdateOffer(scored, isNew);
    totalNew++;

    const source = bySource[offer.sourceName] || bySource[offer.sourceType] || bySource["Autre"];
    if (source) source.imported++;
  }

  // Finaliser le run
  const totalFound = allOffers.filter(o => seen.has(o.externalId)).length;
  const summary = `${totalNew} nouvelle(s) offre(s) importée(s), ${totalDuplicates} doublon(s) ignoré(s) sur ${totalFound} trouvée(s).`;

  await prisma.sourcingRun.update({
    where: { id: run.id },
    data: {
      status: "completed",
      completedAt: new Date(),
      sourcesAttempted: health.filter(h => h.status !== "unconfigured").length,
      sourcesSucceeded: health.filter(h => h.status === "ok").length,
      offersFound: totalFound,
      offersNew: totalNew,
      offersDuplicates: totalDuplicates,
      summary,
      errors: JSON.stringify(errors),
    },
  });

  revalidatePath("/opportunites");
  revalidatePath("/sourcing");
  revalidatePath("/");

  return {
    id: run.id,
    totalFound,
    totalNew,
    totalDuplicates,
    bySource: Object.entries(bySource).map(([name, data]) => ({ name, ...data })),
    summary,
    health,
  };
}

// ─── Single source scan (pour UI "Scanner cette URL") ─────

export async function scanSingleUrl(url: string): Promise<{
  found: number; imported: number; duplicates: number; offers: { title: string; company: string }[];
  error?: string;
}> {
  const { crawlSingleCareerPage } = await import("@/lib/sourcing/connectors/jsonld-crawler");
  const offers = await crawlSingleCareerPage(url);

  if (offers.length === 0) {
    return { found: 0, imported: 0, duplicates: 0, offers: [], error: "Aucune offre détectée sur cette page" };
  }

  let imported = 0;
  let duplicates = 0;
  const importedOffers: { title: string; company: string }[] = [];

  for (const offer of offers) {
    const existing = await prisma.opportunity.findFirst({
      where: { externalId: offer.externalId },
    });
    if (existing) { duplicates++; continue; }

    const scored = await enrichWithDeepSeek(offer);
    await addOrUpdateOffer(scored, true);
    imported++;
    importedOffers.push({ title: scored.title, company: scored.company });
  }

  return { found: offers.length, imported, duplicates, offers: importedOffers };
}

// ─── Import par texte collé ──────────────────────────────

export async function importFromPastedText(
  sourceName: string,
  text: string
): Promise<{
  found: number; imported: number; duplicates: number; offers: { title: string; company: string }[];
  error?: string;
}> {
  if (!text || text.trim().length < 50) {
    return { found: 0, imported: 0, duplicates: 0, offers: [], error: "Texte trop court" };
  }

  const result = await generateJsonWithDeepSeek<{ offers: NormalizedOffer[] }>({
    systemPrompt: `Tu es un assistant RH. Extrais les offres d'emploi du texte fourni.
Retourne en JSON : { "offers": [{ "title": string, "company": string, "location": string, "country": string, "contractType": string, "remote": string, "salaryMin": number, "salaryMax": number, "description": string }] }
Ne JAMAIS inventer d'information.`,
    userPrompt: `Texte copié depuis ${sourceName}:\n\n${text.slice(0, 30000)}`,
    temperature: 0.05,
  });

  if (!result.success || !result.data?.offers) {
    return { found: 0, imported: 0, duplicates: 0, offers: [], error: "Extraction impossible" };
  }

  const offers = result.data.offers;
  let imported = 0;
  let duplicates = 0;
  const importedOffers: { title: string; company: string }[] = [];

  for (const offer of offers) {
    if (!offer.title || !offer.company) continue;
    const key = dedupKey(offer.title, offer.company);
    const existing = await prisma.opportunity.findFirst({
      where: { sourceUrl: "", title: { contains: offer.title.slice(0, 30) } },
    });
    if (existing) { duplicates++; continue; }

    const scored = await enrichWithDeepSeek({ ...offer, sourceName, sourceUrl: "", sourceType: "browser", externalId: `pasted::${key}`, raw: "" });
    await addOrUpdateOffer(scored, true);
    imported++;
    importedOffers.push({ title: scored.title, company: scored.company });
  }

  revalidatePath("/opportunites");
  return { found: offers.length, imported, duplicates, offers: importedOffers };
}

// ─── Historique des runs ─────────────────────────────────

export async function getSourcingRuns(limit: number = 20) {
  return prisma.sourcingRun.findMany({
    orderBy: { startedAt: "desc" },
    take: limit,
  });
}

export async function getLatestRun() {
  return prisma.sourcingRun.findFirst({
    orderBy: { startedAt: "desc" },
  });
}

export async function getConnectorHealth(): Promise<ConnectorHealth[]> {
  const health: ConnectorHealth[] = [];

  // France Travail
  const ftKey = process.env.FRANCE_TRAVAIL_CLIENT_ID;
  health.push({
    name: "France Travail",
    status: ftKey ? "ok" : "unconfigured",
    lastRun: null,
    lastError: ftKey ? null : "FRANCE_TRAVAIL_CLIENT_ID non configuré",
    offersFound: 0,
  });

  // JSON-LD Crawler
  health.push({
    name: "JSON-LD Crawler",
    status: "ok",
    lastRun: null,
    lastError: null,
    offersFound: 0,
  });

  // HTML Scraper
  health.push({
    name: "HTML Scraper",
    status: "ok",
    lastRun: null,
    lastError: null,
    offersFound: 0,
  });

  return health;
}
