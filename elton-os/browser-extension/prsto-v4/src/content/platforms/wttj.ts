/**
 * Content Script — Welcome to the Jungle Job Extraction
 */

import { extractGenericJob } from "../../lib/extractors";

function getWttjOffer(): Record<string, string> {
  const offer: Record<string, string> = {};

  const titleEl = document.querySelector(
    "[data-testid='job-title'], h1.sc-blHHSb, .sc-blHHSb"
  );
  offer.title = titleEl?.textContent?.trim() || "";

  const companyEl = document.querySelector(
    "[data-testid='company-name'], .sc-gsxoMX, .sc-dqBHgY"
  );
  offer.company = companyEl?.textContent?.trim() || "";

  const locationEl = document.querySelector(
    "[data-testid='job-location'], .sc-idXgbr"
  );
  offer.location = locationEl?.textContent?.trim() || "";

  const descriptionEl = document.querySelector(
    "[data-testid='job-description'], .sc-jrQzAO"
  );
  offer.description = descriptionEl?.textContent?.trim() || "";

  offer.url = window.location.href;

  return offer;
}

function start() {
  chrome.runtime.onMessage.addListener((msg, _sender, respond) => {
    if (msg?.type === "prsto:extractOffer") {
      const raw = getWttjOffer();
      const result = extractGenericJob(raw, "wttj");
      chrome.runtime.sendMessage({ type: "prsto:offerExtracted", data: result });
      respond({ success: true });
      return true;
    }
    return false;
  });

  setTimeout(() => {
    const raw = getWttjOffer();
    if (raw.title) {
      const result = extractGenericJob(raw, "wttj");
      chrome.runtime.sendMessage({ type: "prsto:offerExtracted", data: result }).catch(() => {});
    }
  }, 1500);
}

start();