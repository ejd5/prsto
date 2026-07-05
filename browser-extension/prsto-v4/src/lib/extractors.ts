/**
 * Generic job offer extractor — cleans raw DOM fields into structured JobOffer
 */

import { JobOffer, SupportedPlatform } from "./types";

export function extractGenericJob(
  raw: Record<string, string>,
  platform: SupportedPlatform,
): JobOffer {
  const title = cleanText(raw.title || "");
  const company = cleanText(raw.company || "");
  const location = cleanText(raw.location || "");
  const salary = cleanText(raw.salary || "");
  const contractType = cleanText(raw.contractType || "");
  const description = cleanText(raw.description || "");
  const url = raw.url || window.location.href;

  // Quality assessment
  const present = [title, company, description].filter(Boolean).length;
  const extractionQuality = present >= 3 ? 95 : present >= 2 ? 70 : present >= 1 ? 40 : 10;

  const hints: string[] = [];
  if (!title) hints.push("title_missing");
  if (!company) hints.push("company_missing");
  if (!description) hints.push("description_missing");
  if (description.length < 200) hints.push("description_short");
  if (!location) hints.push("location_missing");

  return {
    platform,
    url,
    title,
    company,
    location,
    salary,
    contractType,
    description: description.slice(0, 8000),
    extractionQuality,
    hints,
    raw,
    capturedAt: new Date().toISOString(),
  };
}

export function detectPlatform(url: string): SupportedPlatform {
  if (url.includes("linkedin.com")) return "linkedin";
  if (url.includes("indeed.com") || url.includes("indeed.fr")) return "indeed";
  if (url.includes("apec.fr")) return "apec";
  if (url.includes("cadremploi.fr")) return "cadremploi";
  if (url.includes("welcometothejungle.com")) return "wttj";
  return "unknown";
}

function cleanText(raw: string): string {
  return raw
    .replace(/\s+/g, " ")
    .replace(/[\u200B-\u200F\uFEFF]/g, "")
    .trim();
}