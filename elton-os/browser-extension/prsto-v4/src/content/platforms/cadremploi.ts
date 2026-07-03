/**
 * Content Script — Cadremploi Job Extraction
 */

import { extractGenericJob } from "../../lib/extractors";

function getCadremploiOffer(): Record<string, string> {
  const offer: Record<string, string> = {};

  const titleEl = document.querySelector(
    ".adview-title h1, .adview__title, h1[itemprop='title']"
  );
  offer.title = titleEl?.textContent?.trim() || "";

  const companyEl = document.querySelector(
    ".adview-company-name, .adview__company, [itemprop='hiringOrganization']"
  );
  offer.company = companyEl?.textContent?.trim() || "";

  const locationEl = document.querySelector(
    ".adview-location, .adview__city, [itemprop='jobLocation']"
  );
  offer.location = locationEl?.textContent?.trim() || "";

  const descriptionEl = document.querySelector(
    ".adview-description, .adview__description, [itemprop='description']"
  );
  offer.description = descriptionEl?.textContent?.trim() || "";

  offer.url = window.location.href;

  return offer;
}

function start() {
  chrome.runtime.onMessage.addListener((msg, _sender, respond) => {
    if (msg?.type === "prsto:extractOffer") {
      const raw = getCadremploiOffer();
      const result = extractGenericJob(raw, "cadremploi");
      chrome.runtime.sendMessage({ type: "prsto:offerExtracted", data: result });
      respond({ success: true });
      return true;
    }
    return false;
  });

  setTimeout(() => {
    const raw = getCadremploiOffer();
    if (raw.title) {
      const result = extractGenericJob(raw, "cadremploi");
      chrome.runtime.sendMessage({ type: "prsto:offerExtracted", data: result }).catch(() => {});
    }
  }, 1500);
}

start();