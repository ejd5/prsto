/**
 * CV HTML-to-PDF Service — UNIQUE source de vérité pour les PDF CV envoyables.
 *
 * Principe : render /cv-print?print=1 via Playwright → le PDF est une capture
 * exacte du preview React. Aucun autre générateur PDF n'est utilisé.
 *
 * Nécessite : NEXT_PUBLIC_CV_HTML_PDF=true dans .env
 *            Playwright installé (npx playwright install chromium)
 *            Serveur Next.js accessible sur localhost:3000
 */

import { prisma } from "@/lib/prisma";

export interface HtmlPdfInput {
  draftId: string;
  templateId: string;
  baseUrl?: string;
  source?: "dashboard" | "extension" | "zip";
  mode?: "master" | "adapted";
}

export interface HtmlPdfResult {
  pdfBytes: Uint8Array;
  templateUsed: string;
  renderer: "html-preview";
}

const VALID_TEMPLATES = ["ats_classic", "modern_executive", "premium_leadership", "executive_bordeaux", "strategic_blue", "minimal_luxe"];

export function resolveCvTemplate(templateId?: string | null): string {
  if (!templateId) return "ats_classic";
  const clean = templateId.replace(/[-\s]/g, "_").toLowerCase();
  for (const valid of VALID_TEMPLATES) {
    if (clean === valid) return valid;
    if (clean.replace(/_/g, "") === valid.replace(/_/g, "")) return valid;
  }
  return "ats_classic";
}

/**
 * Generate a sendable CV PDF from the React preview page.
 * This is the ONLY way to produce a CV PDF for recruiters.
 *
 * @throws Error if Playwright is unavailable or rendering fails
 */
export async function generateSendableCvPdf(options: HtmlPdfInput): Promise<HtmlPdfResult> {
  if (process.env.NEXT_PUBLIC_CV_HTML_PDF !== "true") {
    throw new Error(
      "HTML-to-PDF disabled. Set NEXT_PUBLIC_CV_HTML_PDF=true in .env " +
      "and ensure Playwright is installed (npx playwright install chromium)."
    );
  }

  const { draftId, templateId, mode } = options;
  const baseUrl = options.baseUrl || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const resolvedTemplate = resolveCvTemplate(templateId);
  const cacheBuster = Date.now();
  const modeSuffix = mode === "master" ? "&mode=master" : "";
  const printUrl = `${baseUrl}/dashboard/jobs/applications/${draftId}/cv-print?template=${resolvedTemplate}&print=1&t=${cacheBuster}${modeSuffix}`;

  // Dynamic import — Playwright is a devDependency
  const { chromium } = await import("playwright");

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1240, height: 900 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    // Navigate to the cv-print page in print mode
    await page.goto(printUrl, { waitUntil: "networkidle", timeout: 45000 });

    // Wait for the CV renderer to be ready
    await page.waitForSelector("[data-cv-render-ready]", { timeout: 10000 }).catch(() => {
      // If the selector isn't found, wait extra time for React render
      return page.waitForTimeout(3000);
    });

    // Extra stabilization time for font loading and layout
    await page.waitForTimeout(1500);

    // Generate PDF — A4, exact copy of what's displayed
    const pdfBytes = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    return {
      pdfBytes: new Uint8Array(pdfBytes.buffer),
      templateUsed: resolvedTemplate,
      renderer: "html-preview",
    };
  } finally {
    await browser.close().catch(() => {});
  }
}
