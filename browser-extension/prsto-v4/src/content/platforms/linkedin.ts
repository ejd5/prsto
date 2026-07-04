/**
 * Content Script — LinkedIn Job Extraction
 */

import { extractGenericJob } from "../../lib/extractors";

function getLinkedInOffer(): Record<string, string> {
  const offer: Record<string, string> = {};

  const titleEl = document.querySelector(
    ".jobs-unified-top-card__job-title, .job-details-jobs-unified-top-card__job-title, h1.job-title, h1.t-24, h2.t-24"
  );
  offer.title = titleEl?.textContent?.trim() || "";

  const companyEl = document.querySelector(
    ".jobs-unified-top-card__company-name a, .job-details-jobs-unified-top-card__company-name a, .employer-name"
  );
  offer.company = companyEl?.textContent?.trim() || "";

  const locationEl = document.querySelector(
    ".jobs-unified-top-card__bullet, .job-details-jobs-unified-top-card__bullet, .location-container"
  );
  offer.location = locationEl?.textContent?.trim() || "";

  const descriptionEl = document.querySelector(
    ".jobs-description__content, .jobs-box__html-content, #job-details"
  );
  offer.description = descriptionEl?.textContent?.trim() || "";

  const salaryEl = document.querySelector(".compensation__salary");
  offer.salary = salaryEl?.textContent?.trim() || "";

  offer.url = window.location.href;

  return offer;
}

function start() {
  chrome.runtime.onMessage.addListener((msg, _sender, respond) => {
    if (msg?.type === "prsto:extractOffer") {
      const raw = getLinkedInOffer();
      const result = extractGenericJob(raw, "linkedin");
      chrome.runtime.sendMessage({ type: "prsto:offerExtracted", data: result });
      respond({ success: true });
      return true;
    }
    return false;
  });

  // Auto-extract on page load (idle)
  setTimeout(() => {
    const raw = getLinkedInOffer();
    if (raw.title && raw.description) {
      const result = extractGenericJob(raw, "linkedin");
      chrome.runtime.sendMessage({ type: "prsto:offerExtracted", data: result }).catch(() => {});
    }
  }, 1500);
}

start();