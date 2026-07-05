/**
 * Content Script — Indeed Job Extraction
 */

import { extractGenericJob } from "../../lib/extractors";

function getIndeedOffer(): Record<string, string> {
  const offer: Record<string, string> = {};

  const titleEl = document.querySelector(
    "h1.jobsearch-JobInfoHeader-title, [data-testid='jobsearch-JobInfoHeader-title'], .icl-u-xs-mb--xs"
  );
  offer.title = titleEl?.textContent?.trim() || "";

  const companyEl = document.querySelector(
    "[data-testid='inlineHeader-companyName'], .jobsearch-CompanyInfoContainer a, .css-63koeb"
  );
  offer.company = companyEl?.textContent?.trim() || "";

  const locationEl = document.querySelector(
    "[data-testid='inlineHeader-companyLocation'], .css-6z8o9s"
  );
  offer.location = locationEl?.textContent?.trim() || "";

  const salaryEl = document.querySelector(
    "[data-testid='jobDetailSalary'], #salaryInfoAndJobType"
  );
  offer.salary = salaryEl?.textContent?.trim() || "";

  const descriptionEl = document.querySelector(
    "#jobDescriptionText, .jobsearch-JobComponent-description, [data-testid='jobDescriptionText']"
  );
  offer.description = descriptionEl?.textContent?.trim() || "";

  offer.url = window.location.href;

  return offer;
}

function start() {
  chrome.runtime.onMessage.addListener((msg, _sender, respond) => {
    if (msg?.type === "prsto:extractOffer") {
      const raw = getIndeedOffer();
      const result = extractGenericJob(raw, "indeed");
      chrome.runtime.sendMessage({ type: "prsto:offerExtracted", data: result });
      respond({ success: true });
      return true;
    }
    return false;
  });

  setTimeout(() => {
    const raw = getIndeedOffer();
    if (raw.title) {
      const result = extractGenericJob(raw, "indeed");
      chrome.runtime.sendMessage({ type: "prsto:offerExtracted", data: result }).catch(() => {});
    }
  }, 1500);
}

start();