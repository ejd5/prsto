/**
 * Source Capability Scanner — fonctions pures de détection et classification.
 * Aucun import Prisma, aucun réseau. Testable unitairement.
 *
 * Inspecte une URL et le HTML d'une page pour déterminer
 * le meilleur mode d'import : API, ATS, JSON-LD, RSS, ou assisté.
 */

import type {
  SourceCapability,
  SourceImportMode,
  PlatformType,
  ScannerResult,
} from "./types";

/* ─── Domain blocklists ──────────────────── */

const BLOCKED_DOMAINS = [
  "linkedin.com",
  "indeed.com",
  "apec.fr",
  "cadremploi.fr",
  "lefigaro.fr/emploi",
  "monster.fr",
  "monster.com",
  "jobijoba.com",
  "meteojob.com",
  "keljob.com",
  "hellowork.com",
  "regionsjob.com",
  "jooble.org",
  "jooble.fr",
  "chooseyourboss.com",
  "talent.com",
];

export function extractDomain(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host;
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] || url;
  }
}

/* ─── ATS detection ──────────────────────── */

const ATS_PATTERNS: Array<{ provider: string; domainPattern: RegExp; htmlPattern?: RegExp }> = [
  {
    provider: "greenhouse",
    domainPattern: /greenhouse\.io/,
    htmlPattern: /greenhouse/i,
  },
  {
    provider: "lever",
    domainPattern: /lever\.co/,
    htmlPattern: /jobs\.lever\.co|lever\.co\/.*\/apply/i,
  },
  {
    provider: "ashby",
    domainPattern: /ashbyhq\.com/,
    htmlPattern: /ashbyhq\.com/i,
  },
  {
    provider: "smartrecruiters",
    domainPattern: /smartrecruiters\.com/,
    htmlPattern: /smartrecruiters/i,
  },
  {
    provider: "workable",
    domainPattern: /workable\.com/,
    htmlPattern: /apply\.workable\.com/i,
  },
  {
    provider: "teamtailor",
    domainPattern: /teamtailor\.com/,
    htmlPattern: /teamtailor/i,
  },
  {
    provider: "recruitee",
    domainPattern: /recruitee\.com/,
    htmlPattern: /recruitee\.com|recruitee/i,
  },
  {
    provider: "bamboohr",
    domainPattern: /bamboohr\.com/,
    htmlPattern: /bamboohr/i,
  },
  {
    provider: "welcomekit",
    domainPattern: /welcomekit\.(co|tech|io|com)/,
    htmlPattern: /welcomekit/i,
  },
  {
    provider: "workday",
    domainPattern: /myworkdayjobs\.com/,
    htmlPattern: /myworkdayjobs\.com/i,
  },
];

/**
 * Détecte le provider ATS à partir du domaine ou du HTML.
 * Retourne le nom du provider (greenhouse, lever, etc.) ou null.
 */
export function detectAtsProvider(url: string, html: string): string | null {
  const domain = extractDomain(url);

  for (const { provider, domainPattern, htmlPattern } of ATS_PATTERNS) {
    if (domainPattern.test(domain)) return provider;
    if (htmlPattern && htmlPattern.test(html)) return provider;
  }

  return null;
}

/* ─── JSON-LD detection ──────────────────── */

const JSONLD_REGEX = /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;

/**
 * Compte le nombre de blocs JSON-LD contenant un JobPosting.
 */
export function detectJsonLdJobs(html: string): number {
  let count = 0;
  let m: RegExpExecArray | null;
  const regex = new RegExp(JSONLD_REGEX.source, "gi");
  while ((m = regex.exec(html)) !== null) {
    try {
      const content = m[1].trim();
      if (content.includes('"@type"') && content.includes("JobPosting")) {
        count++;
      }
    } catch {
      // blocs malformés — on ignore
    }
  }
  return count;
}

/* ─── RSS / Sitemap hints ────────────────── */

/**
 * À partir d'une URL de page carrière, devine si des flux RSS/sitemap
 * sont susceptibles d'exister (basé sur la présence de ces patterns dans l'URL).
 * Cette fonction ne fetch pas — elle détecte les hints dans l'URL fournie.
 */
export function detectRssOrSitemap(_url: string): { rss: boolean; sitemap: boolean } {
  // Cette fonction est un hint basé sur le chemin.
  // Le scan réel (fetch) est fait par le server action.
  let rss = false;
  let sitemap = false;

  const lower = _url.toLowerCase();

  if (/\/sitemap/i.test(lower)) sitemap = true;
  if (/\/(rss|feed|atom)/i.test(lower)) rss = true;

  return { rss, sitemap };
}

/* ─── Server block detection ─────────────── */

const BLOCK_SIGNATURES: RegExp[] = [
  /cloudflare.*challenge/i,
  /cf-ray:/i,
  /_cf_chl_opt/i,
  /datadome/i,
  /ddos.*protection/i,
  /captcha/i,
  /g-recaptcha/i,
  /hcaptcha/i,
  /recaptcha/i,
  /access denied/i,
  /blocked/i,
  /just a moment/i,
  /checking your browser/i,
  /enable javascript/i,
];

/**
 * Détecte si le serveur bloque les requêtes automatisées.
 * Analyse le code HTTP et les signatures HTML.
 */
export function detectServerBlocked(statusCode: number, html: string): boolean {
  if (statusCode === 403 || statusCode === 429 || statusCode === 503) {
    return true;
  }

  // Si le code est 200 mais contient un challenge (Cloudflare, DataDome, etc.)
  if (statusCode === 200) {
    return BLOCK_SIGNATURES.some((sig) => sig.test(html));
  }

  return false;
}

/* ─── Known blocked domains ──────────────── */

/**
 * Vérifie si le domaine est connu pour bloquer les fetchs serveur.
 * LinkedIn, Indeed, APEC, etc.
 */
export function isBlockedDomain(domain: string): boolean {
  const normalized = domain.toLowerCase().replace(/^www\./, "");
  return BLOCKED_DOMAINS.some((d) => normalized.includes(d));
}

/**
 * Domaines de plateformes sociales / job boards où l'utilisateur peut
 * copier-coller une annonce. On les classe USER_ASSISTED.
 */
const USER_ASSISTED_DOMAINS = [
  "linkedin.com",
  "indeed.com",
  "apec.fr",
  "cadremploi.fr",
  "lefigaro.fr/emploi",
  "monster.fr",
  "monster.com",
  "jobijoba.com",
  "meteojob.com",
  "hellowork.com",
  "regionsjob.com",
  "jooble.org",
  "jooble.fr",
  "chooseyourboss.com",
  "talent.com",
  "welcometothejungle.com",
  "keljob.com",
];

/**
 * Domaines ATS dont on connaît l'API. Même si le fetch HTML échoue,
 * on peut importer via l'API JSON.
 */
const KNOWN_ATS_API_DOMAINS = [
  "greenhouse.io",
  "lever.co",
  "ashbyhq.com",
  "smartrecruiters.com",
  "workable.com",
  "teamtailor.com",
  "recruitee.com",
  "bamboohr.com",
  "myworkdayjobs.com",
];

/**
 * Vérifie si le domaine est une plateforme sociale/job board
 * où le copier-coller manuel est possible.
 */
export function isUserAssistedDomain(domain: string): boolean {
  const normalized = domain.toLowerCase().replace(/^www\./, "");
  return USER_ASSISTED_DOMAINS.some((d) => normalized.includes(d));
}

/**
 * Vérifie si le domaine est un ATS connu dont l'API est disponible.
 */
export function isKnownAtsApiDomain(domain: string): boolean {
  const normalized = domain.toLowerCase().replace(/^www\./, "");
  return KNOWN_ATS_API_DOMAINS.some((d) => normalized.includes(d));
}

/* ─── Login / Auth page detection ─────────── */

const LOGIN_AUTH_PATTERNS: RegExp[] = [
  /\/login/i,
  /\/signin/i,
  /\/auth/i,
  /\/sign_in/i,
  /\/sign-in/i,
  /\/checkpoint/i,
  /\/authenticate/i,
  /\/oauth/i,
  /\/saml/i,
];

/**
 * Détecte si l'URL pointe vers une page de login ou d'authentification.
 */
export function isLoginAuthPage(url: string): boolean {
  const lower = url.toLowerCase();
  return LOGIN_AUTH_PATTERNS.some((p) => p.test(lower));
}

/* ─── CAPTCHA / Anti-bot detection ────────── */

const CAPTCHA_SIGNATURES: RegExp[] = [
  /cloudflare.*challenge/i,
  /cf-ray:/i,
  /_cf_chl_opt/i,
  /datadome/i,
  /ddos.*protection/i,
  /captcha/i,
  /g-recaptcha/i,
  /hcaptcha/i,
  /recaptcha/i,
  /access denied/i,
  /blocked/i,
  /just a moment/i,
  /checking your browser/i,
  /enable javascript/i,
];

export function isCaptchaOrChallengePage(html: string): boolean {
  if (!html) return false;
  return CAPTCHA_SIGNATURES.some((sig) => sig.test(html));
}

/* ─── Bypass keyword detection ────────────── */

const BYPASS_PATTERNS: RegExp[] = [
  /bypass/i,
  /proxy/i,
  /captcha.?solver/i,
  /stealth/i,
  /residential.?proxy/i,
  /anti.?bot/i,
  /bot.?detect/i,
  /scraper.?api/i,
  /headless.?browser/i,
  /puppeteer/i,
  /playwright/i,
  /selenium/i,
];

/**
 * Détecte une tentative de bypass dans une URL ou une chaîne.
 * Empêche toute utilisation de proxy evasion / CAPTCHA solving.
 */
export function containsBypassAttempt(text: string): boolean {
  return BYPASS_PATTERNS.some((p) => p.test(text));
}

/* ─── Firecrawl eligibility ───────────────── */

/**
 * Domaines éligibles à l'extraction Firecrawl Safe.
 * ATS publics, pages carrières d'entreprises, JSON-LD publiques.
 */
export function isFirecrawlEligibleDomain(domain: string): boolean {
  // ATS publics
  if (isKnownAtsApiDomain(domain)) return true;

  // Domaines bloqués → non éligible
  if (isBlockedDomain(domain)) return false;

  // Domaines USER_ASSISTED (LinkedIn, Indeed, APEC) → non éligible
  if (isUserAssistedDomain(domain)) return false;

  // Toute page carrière publique → éligible
  return true;
}

/* ─── Public careers page detection ───────── */

const CAREERS_PATTERNS: RegExp[] = [
  /\/careers?/i,
  /\/jobs?/i,
  /\/emploi/i,
  /\/recrutement/i,
  /\/nous.?rejoindre/i,
  /\/join.?us/i,
  /\/work.?with.?us/i,
  /\/talent/i,
];

/**
 * Détecte si l'URL semble pointer vers une page carrière publique.
 */
export function isPublicCareersPage(url: string): boolean {
  return CAREERS_PATTERNS.some((p) => p.test(url));
}

/* ─── Classification engine ──────────────── */

/**
 * Décide du mode d'import optimal selon les capacités détectées.
 * Priorité : ATS (API) > JSON-LD > Firecrawl Safe > RSS > USER_ASSISTED > MANUAL
 */
export function classifyImportMode(result: ScannerResult): SourceImportMode {
  // 1. Domaine bloqué → BLOCKED
  if (isBlockedDomain(result.domain)) {
    return "BLOCKED";
  }

  // 2. ATS détecté par le domaine → ATS_PUBLIC
  if (result.atsProvider) {
    return "ATS_PUBLIC";
  }

  // 3. Domaine ATS connu → ATS_PUBLIC
  if (isKnownAtsApiDomain(result.domain)) {
    return "ATS_PUBLIC";
  }

  // 4. JSON-LD détecté → AUTO_JSONLD
  if (result.jsonldJobCount > 0) {
    return "AUTO_JSONLD";
  }

  // 5. Page carrière publique → PUBLIC_CAREERS (eligible Firecrawl)
  if (!isUserAssistedDomain(result.domain) && !result.isBlocked) {
    return "AUTO_PUBLIC_CAREERS";
  }

  // 6. Plateforme sociale / job board → USER_ASSISTED
  if (isUserAssistedDomain(result.domain)) {
    return "USER_ASSISTED";
  }

  // 7. Bloqué par le serveur → MANUAL_ONLY
  if (result.isBlocked) {
    return "MANUAL_ONLY";
  }

  // 8. API France Travail → API_OFFICIAL
  if (/francetravail|pole-emploi/i.test(result.domain)) {
    return "API_OFFICIAL";
  }

  // 9. Rien → manuel
  return "MANUAL_ONLY";
}

/**
 * Vérifie si un mode d'import est compatible avec Firecrawl Safe.
 */
export function isCompatibleWithFirecrawl(mode: SourceImportMode): boolean {
  return mode === "ATS_PUBLIC"
    || mode === "AUTO_JSONLD"
    || mode === "AUTO_PUBLIC_CAREERS"
    || mode === "AUTO_FIRECRAWL_SAFE"
    || mode === "PUBLIC_CAREERS";
}

/* ─── Platform type detection ────────────── */

function detectPlatformType(domain: string, atsProvider: string | null): PlatformType {
  if (atsProvider) return "ats";

  if (
    /linkedin\.com/i.test(domain) ||
    /indeed\./i.test(domain)
  ) {
    return "social_network";
  }

  if (
    /apec\.fr/i.test(domain) ||
    /cadremploi/i.test(domain) ||
    /monster/i.test(domain) ||
    /jobijoba/i.test(domain) ||
    /meteojob/i.test(domain) ||
    /jooble/i.test(domain) ||
    /talent\.com/i.test(domain)
  ) {
    return "job_board";
  }

  if (/francetravail/i.test(domain) || /pole-emploi/i.test(domain)) {
    return "aggregator";
  }

  return "career_page";
}

/* ─── Main assessment ────────────────────── */

/**
 * Point d'entrée principal : évalue les capacités d'une source
 * à partir de son URL, du code HTTP et du HTML de sa page.
 */
export function assessSourceCapability(
  sourceId: string,
  name: string,
  url: string,
  statusCode: number,
  html: string,
): SourceCapability {
  const domain = extractDomain(url);
  const atsProvider = detectAtsProvider(url, html);
  const jsonldJobCount = detectJsonLdJobs(html);
  const { rss, sitemap } = detectRssOrSitemap(url);
  const blocked = detectServerBlocked(statusCode, html) || isBlockedDomain(domain);

  const result: ScannerResult = {
    domain,
    statusCode,
    atsProvider,
    jsonldJobCount,
    hasRss: rss,
    hasSitemap: sitemap,
    isBlocked: blocked,
  };

  const importMode = classifyImportMode(result);
  const platformType = detectPlatformType(domain, atsProvider);

  const requiresBrowser =
    importMode === "USER_ASSISTED" && !atsProvider && jsonldJobCount === 0;

  return {
    sourceId,
    name,
    url,
    domain,
    platformType,
    importMode,
    supportsApi: importMode === "AUTO_API" || importMode === "API_OFFICIAL",
    supportsRss: rss || importMode === "AUTO_RSS",
    supportsSitemap: sitemap,
    supportsJsonLd: jsonldJobCount > 0,
    supportsAtsEndpoint: atsProvider !== null,
    requiresBrowser,
    blocksServerFetch: blocked,
    requiresUserAction: importMode === "USER_ASSISTED" || importMode === "MANUAL_ONLY" || importMode === "BLOCKED",
    lastCheckedAt: null,
    lastStatus: null,
    notes: null,
  };
}

/* ─── Source catalog ─────────────────────── */

export interface KnownSource {
  sourceId: string;
  name: string;
  url: string;
  type: "api" | "ats" | "html" | "career";
}

/**
 * Catalogue des ~30 sources à auditer.
 * Mélange de pages carrière FR et internationales, ATS publics, et plateformes.
 */
export const KNOWN_SOURCES: KnownSource[] = [
  // ATS publics (déjà dans public-ats.ts)
  { sourceId: "greenhouse-stripe", name: "Stripe", url: "https://boards.greenhouse.io/stripe", type: "ats" },
  { sourceId: "greenhouse-airbnb", name: "Airbnb", url: "https://boards.greenhouse.io/airbnb", type: "ats" },
  { sourceId: "greenhouse-databricks", name: "Databricks", url: "https://boards.greenhouse.io/databricks", type: "ats" },
  { sourceId: "greenhouse-figma", name: "Figma", url: "https://boards.greenhouse.io/figma", type: "ats" },
  { sourceId: "greenhouse-doctolib", name: "Doctolib", url: "https://boards.greenhouse.io/doctolib", type: "ats" },
  { sourceId: "greenhouse-robinhood", name: "Robinhood", url: "https://boards.greenhouse.io/robinhood", type: "ats" },
  { sourceId: "greenhouse-coinbase", name: "Coinbase", url: "https://boards.greenhouse.io/coinbase", type: "ats" },
  { sourceId: "greenhouse-brex", name: "Brex", url: "https://boards.greenhouse.io/brex", type: "ats" },
  { sourceId: "lever-palantir", name: "Palantir", url: "https://jobs.lever.co/palantir", type: "ats" },
  { sourceId: "ashby-linear", name: "Linear", url: "https://jobs.ashbyhq.com/linear", type: "ats" },
  { sourceId: "ashby-perplexity", name: "Perplexity", url: "https://jobs.ashbyhq.com/perplexity", type: "ats" },
  { sourceId: "ashby-cursor", name: "Cursor", url: "https://jobs.ashbyhq.com/cursor", type: "ats" },

  // Workday ATS — chemins confirmés
  { sourceId: "workday-nvidia", name: "NVIDIA", url: "https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite/", type: "ats" },
  { sourceId: "workday-pernod-ricard", name: "Pernod Ricard", url: "https://pernodricard.wd3.myworkdayjobs.com/pernod-ricard/", type: "ats" },
  { sourceId: "workday-sanofi", name: "Sanofi", url: "https://sanofi.wd3.myworkdayjobs.com/fr-FR/OpellaCareers/", type: "ats" },
  { sourceId: "workday-eiffage", name: "Eiffage", url: "https://eiffage.wd3.myworkdayjobs.com/Eiffage_Careers/", type: "ats" },
  { sourceId: "workday-airliquide", name: "Air Liquide", url: "https://airliquidehr.wd3.myworkdayjobs.com/AirLiquideExternalCareer/", type: "ats" },
  { sourceId: "workday-airbus", name: "Airbus", url: "https://ag.wd3.myworkdayjobs.com/fr-FR/Airbus/", type: "ats" },
  { sourceId: "workday-michelin", name: "Michelin", url: "https://michelinhr.wd3.myworkdayjobs.com/Michelin/", type: "ats" },
  { sourceId: "workday-alcon", name: "Alcon", url: "https://alcon.wd5.myworkdayjobs.com/careers_alcon/", type: "ats" },
  { sourceId: "workday-unilever", name: "Unilever", url: "https://unilever.wd3.myworkdayjobs.com/tmicc/", type: "ats" },
  { sourceId: "workday-pierre-fabre", name: "Pierre Fabre", url: "https://pierrefabre.wd3.myworkdayjobs.com/External_Career_Site/", type: "ats" },
  { sourceId: "workday-expanscience", name: "Expanscience", url: "https://expanscience.wd3.myworkdayjobs.com/expanscience_careers/", type: "ats" },
  { sourceId: "workday-prysmian", name: "Prysmian Group", url: "https://prysmiangroup.wd3.myworkdayjobs.com/Careers/", type: "ats" },
  { sourceId: "workday-air-products", name: "Air Products", url: "https://airproducts.wd5.myworkdayjobs.com/AP0001/", type: "ats" },
  { sourceId: "workday-roche", name: "Roche", url: "https://roche.wd3.myworkdayjobs.com/ROG-A2O-GENE/", type: "ats" },
  { sourceId: "workday-ing", name: "ING", url: "https://ing.wd3.myworkdayjobs.com/ICSGBLCOR/", type: "ats" },
  { sourceId: "workday-wolterskluwer", name: "Wolters Kluwer", url: "https://wk.wd3.myworkdayjobs.com/External/", type: "ats" },
  { sourceId: "workday-axalta", name: "Axalta", url: "https://axalta.wd1.myworkdayjobs.com/Axalta/", type: "ats" },

  // Pages carrière avec JSON-LD
  { sourceId: "career-schneider", name: "Schneider Electric", url: "https://careers.se.com/global/fr/search-results", type: "html" },
  { sourceId: "career-siemens", name: "Siemens", url: "https://jobs.siemens.com/careers", type: "html" },
  { sourceId: "career-legrand", name: "Legrand", url: "https://www.legrand.com/fr/carrieres", type: "html" },
  { sourceId: "career-loreal", name: "L'Oréal", url: "https://careers.loreal.com/fr/fr", type: "html" },
  { sourceId: "career-danone", name: "Danone", url: "https://careers.danone.com/fr/fr.html", type: "html" },
  { sourceId: "career-sanofi", name: "Sanofi", url: "https://www.sanofi.com/fr/carrieres", type: "html" },
  { sourceId: "career-airbus", name: "Airbus", url: "https://www.airbus.com/fr/careers", type: "html" },
  { sourceId: "career-engie", name: "Engie", url: "https://www.engie.com/carrieres", type: "html" },
  { sourceId: "career-orange", name: "Orange", url: "https://oran.ge/fr/carrieres", type: "html" },
  { sourceId: "career-capgemini", name: "Capgemini", url: "https://www.capgemini.com/fr-fr/carrieres/", type: "html" },
  { sourceId: "career-accor", name: "Accor", url: "https://careers.accor.com/fr/fr/", type: "html" },
  { sourceId: "career-total", name: "TotalEnergies", url: "https://totalenergies.com/fr/carrieres", type: "html" },
  { sourceId: "career-thales", name: "Thales", url: "https://www.thalesgroup.com/fr/careers", type: "html" },
  { sourceId: "career-safran", name: "Safran", url: "https://www.safran-group.com/fr/carrieres", type: "html" },
  { sourceId: "career-edf", name: "EDF", url: "https://www.edf.fr/groupe-edf/nous-rejoindre", type: "html" },
  { sourceId: "career-veolia", name: "Veolia", url: "https://www.veolia.com/fr/carrieres", type: "html" },
  { sourceId: "career-bnp", name: "BNP Paribas", url: "https://group.bnpparibas/nous-rejoindre", type: "html" },
  { sourceId: "career-axa", name: "AXA", url: "https://www.axa.com/fr/carrieres", type: "html" },
  { sourceId: "career-lvmh", name: "LVMH", url: "https://www.lvmh.fr/talents/", type: "html" },
  { sourceId: "career-michelin", name: "Michelin", url: "https://recrutement.michelin.fr/", type: "html" },

  // Plateformes — USER_ASSISTED
  { sourceId: "platform-linkedin", name: "LinkedIn Jobs", url: "https://www.linkedin.com/jobs/", type: "html" },
  { sourceId: "platform-indeed", name: "Indeed France", url: "https://fr.indeed.com/", type: "html" },
  { sourceId: "platform-apec", name: "APEC", url: "https://www.apec.fr/", type: "html" },
  { sourceId: "platform-wttj", name: "Welcome to the Jungle", url: "https://www.welcometothejungle.com/fr/jobs", type: "html" },

  // API officielle
  { sourceId: "api-francetravail", name: "France Travail", url: "https://api.francetravail.io/", type: "api" },
];
