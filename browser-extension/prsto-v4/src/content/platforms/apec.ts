/**
 * Content Script — APEC Job Extraction
 */

import { extractGenericJob } from "../../lib/extractors";

function getApecOffer(): Record<string, string> {
  const offer: Record<string, string> = {};

  const titleEl = document.querySelector(
    ".card-offer__title, h1.offer-title, .offer-header h1"
  );
  offer.title = titleEl?.textContent?.trim() || "";

  const companyEl = document.querySelector(
    ".card-offer__company, .offer-company-name, .company-name"
  );
  offer.company = companyEl?.textContent?.trim() || "";

  const locationEl = document.querySelector(
    ".card-offer__location, .offer-location"
  );
  offer.location = locationEl?.textContent?.trim() || "";

  const contractEl = document.querySelector(
    ".card-offer__contract, .offer-contract"
  );
  offer.contractType = contractEl?.textContent?.trim() || "";

  const descriptionEl = document.querySelector(
    ".card-offer__description, .offer-description, .offer-detail__content"
  );
  offer.description = descriptionEl?.textContent?.trim() || "";

  offer.url = window.location.href;

  return offer;
}

function start() {
  chrome.runtime.onMessage.addListener((msg, _sender, respond) => {
    if (msg?.type === "prsto:extractOffer") {
      const raw = getApecOffer();
      const result = extractGenericJob(raw, "apec");
      chrome.runtime.sendMessage({ type: "prsto:offerExtracted", data: result });
      respond({ success: true });
      return true;
    }
    return false;
  });

  setTimeout(() => {
    const raw = getApecOffer();
    if (raw.title) {
      const result = extractGenericJob(raw, "apec");
      chrome.runtime.sendMessage({ type: "prsto:offerExtracted", data: result }).catch(() => {});
    }
  }, 1500);
}

start();