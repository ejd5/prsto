/*
 * PRSTO — Mode Démo
 *
 * CONVENTION DE FILTRAGE :
 *   Une donnée est "démo" si son champ title, jobSummary, externalId,
 *   ou name commence par "[DEMO]". Tout le reste est "réel".
 *
 * RÈGLE CENTRALE :
 *   - mode normal (demo !== "true") → exclut les données [DEMO]
 *   - mode démo (demo === "true")    → affiche UNIQUEMENT les données [DEMO]
 *
 * SÉCURITÉ :
 *   Les données [DEMO] sont EXCLUES PAR DÉFAUT.
 *   Elles ne doivent être visibles qu'avec ?demo=true.
 *   Aucune mutation DB automatique en mode démo.
 *   Aucun Browser Agent, aucun email, aucune candidature réelle.
 *
 * Activation : ?demo=true dans l'URL (useSearchParams)
 * Le mode démo est purement visuel — il affiche un badge mais ne modifie
 * AUCUNE donnée, ne lance aucun Browser Agent, n'envoie aucun email.
 */

export const DEMO_TAG = "[DEMO]";
export const DEMO_BADGE_TEXT = "Mode démo actif — données fictives, aucune action réelle";
export const DEMO_SAFETY_NOTICE = "Aucune candidature réelle. Aucun email envoyé. Aucune donnée modifiée.";

/**
 * Parse le mode démo depuis l'URL.
 * Retourne true UNIQUEMENT si demo=true.
 * Retourne false pour demo=false, demo absent, ou toute autre valeur.
 */
export function parseDemoMode(searchParams: URLSearchParams | null): boolean {
  if (!searchParams) return false;
  return searchParams.get("demo") === "true";
}

/**
 * À appeler depuis un composant client qui utilise useSearchParams().
 * Alias de parseDemoMode pour lisibilité côté client.
 */
export function isDemoFromParams(searchParams: URLSearchParams | null): boolean {
  if (!searchParams) return false;
  return searchParams.get("demo") === "true";
}

/**
 * Ajoute ?demo=true à un chemin si isDemo est true.
 */
export function withDemoParam(path: string, isDemo: boolean): string {
  if (!isDemo) return path;
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}demo=true`;
}

/**
 * Clause Prisma pour ApplicationDraft : mode démo (true) = uniquement [DEMO],
 * mode normal (false) = exclut [DEMO].
 */
export function getDraftDemoFilter(demoMode: boolean): Record<string, unknown> {
  if (demoMode) {
    return { jobSummary: { startsWith: DEMO_TAG } };
  }
  // Inclure les drafts sans jobSummary (null) + ceux dont le jobSummary ne commence pas par [DEMO]
  // Le simple NOT { startsWith } exclut les NULL en SQL
  return {
    OR: [
      { jobSummary: null },
      { NOT: { jobSummary: { startsWith: DEMO_TAG } } },
    ],
  };
}

/**
 * Clause Prisma pour Job : mode démo (true) = uniquement [DEMO],
 * mode normal (false) = exclut [DEMO].
 */
export function getJobDemoFilter(demoMode: boolean): Record<string, unknown> {
  if (demoMode) {
    return { title: { startsWith: DEMO_TAG } };
  }
  return { NOT: { title: { startsWith: DEMO_TAG } } };
}
