"use server";

import type { NormalizedOffer, ConnectorHealth } from "../types";

const API_BASE = "https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search";

interface FranceTravailCredentials {
  clientId: string;
  clientSecret: string;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getToken(credentials: FranceTravailCredentials): Promise<string | null> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  try {
    const res = await fetch("https://entreprise.francetravail.io/connexion/oauth2/access_token?realm=partenaire", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        scope: "api_offresdemploiv2 o2dsoffre",
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    cachedToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
    return data.access_token;
  } catch {
    return null;
  }
}

export async function searchFranceTravail(
  credentials: FranceTravailCredentials | null,
  keywords: string[],
  location?: string
): Promise<{ offers: NormalizedOffer[]; health: ConnectorHealth }> {
  if (!credentials || !credentials.clientId || !credentials.clientSecret) {
    return {
      offers: [],
      health: { name: "France Travail", status: "unconfigured", lastRun: null, lastError: null, offersFound: 0 },
    };
  }

  const token = await getToken(credentials);
  if (!token) {
    return {
      offers: [],
      health: { name: "France Travail", status: "error", lastRun: new Date().toISOString(), lastError: "Authentification échouée", offersFound: 0 },
    };
  }

  const allOffers: NormalizedOffer[] = [];
  const errors: string[] = [];

  for (const keyword of keywords) {
    try {
      const params = new URLSearchParams({
        motsCles: keyword,
        minRange: "1",
        maxRange: "150",
        tri: "1", // date
        domaine: "M", // cadres
      });
      if (location) params.set("commune", location);

      const res = await fetch(`${API_BASE}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        if (res.status === 401) {
          cachedToken = null; // force refresh
          errors.push(`France Travail: token expiré pour "${keyword}"`);
        } else {
          errors.push(`France Travail: HTTP ${res.status} pour "${keyword}"`);
        }
        continue;
      }

      const data = await res.json();
      const results = data.resultats || [];

      for (const item of results) {
        const offre = item;
        allOffers.push({
          externalId: `francetravail::${offre.id}`,
          title: offre.intitule || "",
          company: offre.entreprise?.nom || offre.societat?.nom || "",
          location: offre.lieuTravail?.libelle || offre.lieuTravail?.ville || "",
          country: "FR",
          contractType: offre.typeContratLibelle || "",
          remote: offre.origineOffre?.origine || "",
          salaryMin: offre.salaire?.montantMinimal || 0,
          salaryMax: offre.salaire?.montantMaximal || 0,
          salaryCurrency: "EUR",
          description: offre.description || offre.activite || "",
          sourceName: "France Travail",
          sourceUrl: offre.origineOffre?.urlOrigine || `https://candidat.francetravail.fr/offres/${offre.id}`,
          postedAt: offre.dateCreation || null,
          applicationUrl: offre.origineOffre?.urlOrigine || null,
          sourceType: "api",
          raw: JSON.stringify(offre),
        });
      }
    } catch (e: unknown) {
      const err = e as Error;
      errors.push(`France Travail: ${err.message?.slice(0, 100) || "erreur"}`);
    }
  }

  return {
    offers: allOffers,
    health: {
      name: "France Travail",
      status: errors.length > 0 ? "error" : "ok",
      lastRun: new Date().toISOString(),
      lastError: errors[0] || null,
      offersFound: allOffers.length,
    },
  };
}
