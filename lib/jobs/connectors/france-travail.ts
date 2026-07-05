import type { JobConnector, ImportedJob, SearchQuery } from "../types";

const API_BASE = "https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search";
const OAUTH_URL = "https://entreprise.francetravail.io/connexion/oauth2/access_token?realm=partenaire";
const REQUEST_TIMEOUT = 15000;
const TOKEN_TTL_MS = 55 * 60 * 1000; // 55 min — le token expire à 60 min

// Cache mémoire du token
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getToken(clientId: string, clientSecret: string): Promise<string | null> {
  // Vérifier le cache
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  try {
    const res = await fetch(OAUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        scope: "api_offresdemploiv2 o2dsoffre",
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      console.warn(`[France Travail] OAuth échoué: HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();
    if (!data.access_token) {
      console.warn("[France Travail] Token manquant dans la réponse OAuth");
      return null;
    }

    cachedToken = {
      value: data.access_token,
      expiresAt: Date.now() + TOKEN_TTL_MS,
    };

    return data.access_token;
  } catch (e: unknown) {
    const err = e as Error;
    if (err.name === "AbortError") {
      console.warn("[France Travail] Timeout OAuth");
    } else {
      console.warn(`[France Travail] Erreur OAuth: ${err.message?.slice(0, 100)}`);
    }
    return null;
  }
}

/**
 * Construit les paramètres de recherche France Travail.
 * La commune doit être un nom de ville/code INSEE.
 * On garde une recherche large pour maximiser les résultats.
 */
/**
 * Construit les paramètres de recherche France Travail.
 * Supporte le format de pagination interne: keyword::page=N&range=R
 */
function buildSearchParams(keyword: string, location?: string): URLSearchParams {
  // Extraire les infos de pagination si présentes
  let cleanKeyword = keyword;
  let page = "1";
  let rangeEnd = "150";

  const pageMatch = keyword.match(/::page=(\d+)&range=(\d+)/);
  if (pageMatch) {
    page = pageMatch[1];
    rangeEnd = String(parseInt(pageMatch[2]) + 149);
    cleanKeyword = keyword.replace(/::page=\d+&range=\d+/, "");
  }

  const minRange = String((parseInt(page) - 1) * 150 + 1);

  const params = new URLSearchParams({
    motsCles: cleanKeyword,
    minRange,
    maxRange: rangeEnd,
    tri: "0", // 0 = pertinence, 1 = date
    domaine: "M", // M = cadres
  });

  // Ajouter la commune seulement si c'est une ville précise
  if (location && !["France", "Europe", "Suisse", "Belgique", "Luxembourg", "International"].includes(location)) {
    params.set("commune", location);
  }

  return params;
}

/**
 * Mappe un résultat France Travail vers notre format ImportedJob.
 */
function mapResultToJob(item: Record<string, unknown>): ImportedJob | null {
  const title = (item.intitule as string) || "";
  if (!title || title.length < 5) return null;

  const entreprise = (item.entreprise as Record<string, unknown>) || {};
  const societat = (item.societat as Record<string, unknown>) || {};
  const lieu = (item.lieuTravail as Record<string, unknown>) || {};
  const salaire = (item.salaire as Record<string, unknown>) || {};

  // Détection remote/télétravail
  let remote: string | undefined;
  const duree = (item.dureeTravailLibelle as string) || "";
  if (duree.toLowerCase().includes("télétravail") || duree.toLowerCase().includes("teletravail") || duree.toLowerCase().includes("distance")) {
    remote = "remote";
  }

  return {
    source: "france-travail",
    externalId: `francetravail::${item.id}`,
    sourceUrl: `https://candidat.francetravail.fr/offres/${item.id}`,
    title,
    company: (entreprise.nom as string) || (societat.nom as string) || "",
    location: (lieu.libelle as string) || (lieu.ville as string) || "",
    contractType: (item.typeContratLibelle as string) || "",
    remotePolicy: remote,
    salaryMin: (salaire.montantMinimal as number) || undefined,
    salaryMax: (salaire.montantMaximal as number) || undefined,
    currency: "EUR",
    seniority: (item.experienceLibelle as string) || undefined,
    description: (item.description as string) || (item.activite as string) || "",
    publishedAt: (item.dateCreation as string) || undefined,
  };
}

export const franceTravailConnector: JobConnector = {
  id: "france-travail",
  name: "France Travail",
  type: "api",

  async search(query: SearchQuery): Promise<ImportedJob[]> {
    const clientId = process.env.FRANCE_TRAVAIL_CLIENT_ID;
    const clientSecret = process.env.FRANCE_TRAVAIL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return []; // Pas de warning — le worker log proprement
    }

    const token = await getToken(clientId, clientSecret);
    if (!token) {
      return []; // Token échoué — pas d'offres, pas d'erreur bloquante
    }

    const offers: ImportedJob[] = [];
    const params = buildSearchParams(query.keyword, query.location);

    try {
      const res = await fetch(`${API_BASE}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
      });

      if (!res.ok) {
        if (res.status === 401) {
          cachedToken = null; // Token invalide — forcer le refresh au prochain appel
        }
        return [];
      }

      const data = await res.json();
      const results = data.resultats || [];

      for (const item of results) {
        const job = mapResultToJob(item);
        if (job) offers.push(job);
      }
    } catch (e: unknown) {
      const err = e as Error;
      if (err.name === "AbortError") {
        console.warn(`[France Travail] Timeout pour "${query.keyword}"`);
      }
      // L'erreur est silencieuse — le worker catch déjà
    }

    return offers;
  },
};

/**
 * Réinitialise le cache de token (utile pour les tests).
 */
export function resetTokenCache(): void {
  cachedToken = null;
}
