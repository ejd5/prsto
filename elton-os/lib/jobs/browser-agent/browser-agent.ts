import { chromium } from "playwright";
import type { BrowserPlatform, BrowserSearchConfig, BrowserSearchResult, BrowserJobBrief } from "./types";
import { makeExternalId, PLATFORM_LOGIN_URLS } from "./types";
import { sessionExists, saveStorageState, loadStorageState, ensureGitIgnore } from "./session-store";

const MAX_SCROLLS_ABSOLUTE = 5;
const MAX_DETAILS_ABSOLUTE = 5;
const BLOCKED_INDICATORS = [
  "unusual traffic", "please verify", "captcha", "robot check",
  "please confirm", "security check", "access denied", "blocked",
  "too many requests", "please try again later",
];
const LOGIN_INDICATORS = [
  "se connecter", "sign in", "login", "s'identifier",
  "connectez-vous", "email", "password", "mot de passe", "authwall",
];

async function detectBlocked(page: import("playwright").Page): Promise<string | null> {
  const text = await page.locator("body").textContent().catch(() => "") || "";
  const lower = text.toLowerCase();
  for (const indicator of BLOCKED_INDICATORS) {
    if (lower.includes(indicator)) return `Blocage: "${indicator}"`;
  }
  const title = await page.title().catch(() => "");
  for (const indicator of LOGIN_INDICATORS) {
    if (title.toLowerCase().includes(indicator)) return "Page de connexion";
  }
  return null;
}

async function scrollPage(page: import("playwright").Page, scrolls: number, delayMs: number): Promise<void> {
  for (let i = 0; i < Math.min(scrolls, MAX_SCROLLS_ABSOLUTE); i++) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 0.7));
    await page.waitForTimeout(delayMs);
    // Vérifier qu'on n'a pas atteint la fin
    const atBottom = await page.evaluate(() =>
      window.innerHeight + window.scrollY >= document.body.scrollHeight
    );
    if (atBottom) break;
  }
}

async function extractLinkedInJobs(page: import("playwright").Page, limit: number): Promise<BrowserJobBrief[]> {
  const jobs: BrowserJobBrief[] = [];
  const cards = await page.locator(".job-card-container, article.job-card, li.occludable-update").all();
  for (let i = 0; i < Math.min(cards.length, limit); i++) {
    try {
      const title = await cards[i].locator("a[data-anonymize='job-title'], .job-card-list__title, h3, a.job-title").first().innerText().catch(() => "");
      const company = await cards[i].locator(".job-card-container__company-name, .job-card-list__company-name, .artdeco-entity-lockup__subtitle").first().innerText().catch(() => "");
      const location = await cards[i].locator(".job-card-container__metadata-wrapper, .job-card-list__location, li.job-card-container__metadata-item").first().innerText().catch(() => "");
      const link = await cards[i].locator("a").first().getAttribute("href").catch(() => "");
      if (title) {
        jobs.push({
          title: title.trim().slice(0, 200),
          company: company?.trim().slice(0, 100) || "",
          location: location?.trim().slice(0, 100) || "",
          sourceUrl: link ? (link.startsWith("http") ? link : `https://www.linkedin.com${link}`) : "",
          description: "",
        });
      }
    } catch { /* skip */ }
  }
  return jobs;
}

async function extractIndeedJobs(page: import("playwright").Page, limit: number): Promise<BrowserJobBrief[]> {
  const jobs: BrowserJobBrief[] = [];
  const cards = await page.locator(".job_seen_beacon, .jobsearch-SerpJobCard, .cardOutline, td.resultContent").all();
  for (let i = 0; i < Math.min(cards.length, limit); i++) {
    try {
      const title = await cards[i].locator("h2.jobTitle a, a.jobtitle, a.job-link, span[title]").first().innerText().catch(() => "");
      const company = await cards[i].locator("span.companyName, .company, [data-testid='company-name']").first().innerText().catch(() => "");
      const location = await cards[i].locator("div.companyLocation, .location, [data-testid='text-location']").first().innerText().catch(() => "");
      const link = await cards[i].locator("a").first().getAttribute("href").catch(() => "");
      if (title) {
        jobs.push({
          title: title.trim().slice(0, 200),
          company: company?.trim().slice(0, 100) || "",
          location: location?.trim().slice(0, 100) || "",
          sourceUrl: link ? (link.startsWith("http") ? link : `https://fr.indeed.com${link}`) : "",
          description: "",
        });
      }
    } catch { /* skip */ }
  }
  return jobs;
}

async function extractApecJobs(page: import("playwright").Page, limit: number): Promise<BrowserJobBrief[]> {
  const jobs: BrowserJobBrief[] = [];
  const cards = await page.locator(".card-offre, .result-item, article.card, div[class*='offer']").all();
  for (let i = 0; i < Math.min(cards.length, limit); i++) {
    try {
      const title = await cards[i].locator("h3 a, .title a, .offer-title, [class*='title'] a").first().innerText().catch(() => "");
      const company = await cards[i].locator(".company, .enterprise, [class*='company'], [class*='enterprise']").first().innerText().catch(() => "");
      const location = await cards[i].locator(".location, .ville, [class*='location'], [class*='ville']").first().innerText().catch(() => "");
      const link = await cards[i].locator("a").first().getAttribute("href").catch(() => "");
      if (title) {
        jobs.push({
          title: title.trim().slice(0, 200),
          company: company?.trim().slice(0, 100) || "",
          location: location?.trim().slice(0, 100) || "",
          sourceUrl: link ? (link.startsWith("http") ? link : `https://www.apec.fr${link}`) : "",
          description: "",
        });
      }
    } catch { /* skip */ }
  }
  return jobs;
}

async function extractJobs(platform: BrowserPlatform, page: import("playwright").Page, limit: number): Promise<BrowserJobBrief[]> {
  if (platform === "linkedin") return extractLinkedInJobs(page, limit);
  if (platform === "indeed") return extractIndeedJobs(page, limit);
  return extractApecJobs(page, limit);
}

async function fetchJobDetail(page: import("playwright").Page, job: BrowserJobBrief): Promise<string | null> {
  if (!job.sourceUrl) return null;
  try {
    await page.goto(job.sourceUrl, { waitUntil: "domcontentloaded", timeout: 10000 });
    await page.waitForTimeout(1000);
    const blocked = await detectBlocked(page);
    if (blocked) return null;
    const text = await page.locator("body").innerText().catch(() => "") || "";
    // Extrait un bloc de description : 200-2000 caractères autour de "about" / "description"
    const lines = text.split("\n").filter(l => l.trim().length > 30);
    const descLines = lines.slice(0, 20).join("\n").slice(0, 2000);
    return descLines || null;
  } catch {
    return null;
  }
}

// ─── Connexion manuelle ─────────────────────────────

export async function startManualLogin(platform: BrowserPlatform): Promise<string> {
  ensureGitIgnore();
  let browser;
  try {
    browser = await chromium.launch({ headless: false, args: ["--start-maximized"] });
    const context = await browser.newContext({ viewport: null });
    const page = await context.newPage();
    await page.goto(PLATFORM_LOGIN_URLS[platform], { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    let loggedIn = false;
    try {
      await page.waitForURL((url) => {
        const current = url.toString().toLowerCase();
        if (current.includes("/feed/") || current.includes("/jobs/") ||
            current.includes("loggedin") || current.includes("/my/") ||
            current.includes("/candidate/") || current.includes("/dashboard")) {
          loggedIn = true;
          return true;
        }
        return false;
      }, { timeout: 90000 });
    } catch { /* timeout — pas connecté */ }
    await page.waitForTimeout(1500);
    const blocked = await detectBlocked(page);
    if (blocked) {
      await context.close();
      if (browser) await browser.close();
      return "blocked";
    }
    if (!loggedIn) {
      await context.close();
      if (browser) await browser.close();
      return "needs_user_reauth";
    }
    const storageState = await context.storageState();
    saveStorageState(platform, storageState as unknown as Record<string, unknown>);
    await context.close();
    if (browser) await browser.close();
    return "connected";
  } catch {
    if (browser) await browser.close().catch(() => {});
    return "error";
  }
}

// ─── Recherche connectée avec scroll + détails ───────

export async function runBrowserSearch(config: BrowserSearchConfig): Promise<BrowserSearchResult> {
  if (!sessionExists(config.platform)) {
    return { status: "needs_user_reauth", jobs: [], detailsFetched: 0, scrollsDone: 0, error: "Session non configurée" };
  }
  const storageState = loadStorageState(config.platform);
  if (!storageState) {
    return { status: "needs_user_reauth", jobs: [], detailsFetched: 0, scrollsDone: 0, error: "Session invalide" };
  }

  const limit = Math.min(config.maxResultsPerRun || 10, 20);
  const maxScrolls = Math.min(config.scrollEnabled ? (config.maxScrolls || 3) : 0, MAX_SCROLLS_ABSOLUTE);
  const scrollDelay = config.scrollDelayMs || 1000;
  const fetchDetails = config.fetchDetailsEnabled === true;
  const maxDetails = Math.min(fetchDetails ? (config.maxDetailsPerRun || 3) : 0, MAX_DETAILS_ABSOLUTE);

  let browser;
  try {
    browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
    const context = await browser.newContext({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      storageState: storageState as any,
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36",
      locale: "fr-FR",
    });
    const page = await context.newPage();

    await page.goto(config.searchUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(2000);

    const blocked = await detectBlocked(page);
    if (blocked) {
      await context.close();
      if (browser) await browser.close();
      return { status: "blocked", jobs: [], detailsFetched: 0, scrollsDone: 0, error: blocked };
    }

    const title = await page.title().catch(() => "");
    if (LOGIN_INDICATORS.some(i => title.toLowerCase().includes(i))) {
      await context.close();
      if (browser) await browser.close();
      return { status: "needs_user_reauth", jobs: [], detailsFetched: 0, scrollsDone: 0, error: "Session expirée" };
    }

    // Auto-scroll limité
    let scrollsDone = 0;
    if (maxScrolls > 0) {
      await scrollPage(page, maxScrolls, scrollDelay);
      scrollsDone = Math.min(maxScrolls, MAX_SCROLLS_ABSOLUTE);
    }

    // Extraction
    const jobs = await extractJobs(config.platform, page, limit);

    // Enrichissement descriptions (limité)
    let detailsFetched = 0;
    if (maxDetails > 0 && jobs.length > 0) {
      const limitDetails = Math.min(maxDetails, jobs.length);
      for (let i = 0; i < limitDetails; i++) {
        const desc = await fetchJobDetail(page, jobs[i]);
        if (desc) {
          jobs[i].description = desc;
          detailsFetched++;
        } else {
          // Si une fiche bloque, arrêter les détails pour cette plateforme
          break;
        }
      }
    }

    // Assigner externalIds stables
    for (const job of jobs) {
      job.externalId = makeExternalId(config.platform, job);
    }

    await context.close();
    if (browser) await browser.close();

    return { status: "success", jobs, detailsFetched, scrollsDone };
  } catch (e: unknown) {
    if (browser) await browser.close().catch(() => {});
    const err = e as Error;
    return { status: "error", jobs: [], detailsFetched: 0, scrollsDone: 0, error: err.message?.slice(0, 200) };
  }
}
