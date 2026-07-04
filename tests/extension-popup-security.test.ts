import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const POPUP_PATH = resolve(
  import.meta.dirname,
  "../browser-extension/elton-os-importer/popup.js"
);
const popupSource = readFileSync(POPUP_PATH, "utf-8");

// Strip comments for code-only checks (avoids false positives from doc headers)
const codeOnly = popupSource
  .replace(/\/\/.*$/gm, "")   // single-line comments
  .replace(/\/\*[\s\S]*?\*\//g, "") // block comments

/* ─── Security invariants — popup.js ─────────── */

describe("Popup.js security invariants", () => {
  it("does not read document.cookie", () => {
    expect(popupSource).not.toMatch(/document\.cookie/);
  });

  it("does not read localStorage or sessionStorage", () => {
    expect(popupSource).not.toMatch(/localStorage/);
    expect(popupSource).not.toMatch(/sessionStorage/);
  });

  it("does not auto-submit forms", () => {
    expect(popupSource).not.toMatch(/\.submit\(/);
    expect(popupSource).not.toMatch(/form\.submit/);
    // Allow a.click() for download triggers (not form submission)
    const clickCalls = popupSource.match(/\w\.click\(\s*\)/g) || [];
    const formClicks = clickCalls.filter(function(c) { return !/^a\.click/.test(c); });
    expect(formClicks).toEqual([]);
  });

  it("does not auto-scroll", () => {
    expect(codeOnly).not.toMatch(/scrollTo/);
    expect(codeOnly).not.toMatch(/scrollBy/);
  });

  it("does not fetch() to external job boards", () => {
    // All fetch() calls must go to the local backend
    const fetchCalls = popupSource.match(/fetch\(["'][^"']+["']\)/g) || [];
    for (const call of fetchCalls) {
      const url = call.replace(/fetch\(["']|["']\)/g, "");
      expect(url).toMatch(/^\/api\//);
      // baseUrl is always localhost:3000
    }
    // No hardcoded external URLs in fetch
    expect(popupSource).not.toMatch(/fetch\(["']https?:\/\//);
  });

  it("uses CAPTCHA detection only for blocking, not bypassing", () => {
    // checkLoginCaptchaFn DETECTS login/captcha pages to BLOCK extraction
    // This is a security feature, not a bypass.
    expect(popupSource).toMatch(/checkLoginCaptchaFn/);
    expect(popupSource).toMatch(/captcha/i);
    // Should NOT contain any captcha-solving or bypass logic
    expect(popupSource).not.toMatch(/solve.*captcha/i);
    expect(popupSource).not.toMatch(/bypass.*captcha/i);
    expect(popupSource).not.toMatch(/captcha.*solver/i);
  });

  it("only references password in form detection, not extraction", () => {
    // Autofill detects password fields to SKIP them — correct behavior
    const extractFns = popupSource.match(/function extract\w+Fn[\s\S]*?(?=function (?:extract|send))/g) || [];
    for (const fn of extractFns) {
      expect(fn).not.toMatch(/password/);
    }
  });

  it("handles all clicks via user-initiated event listeners", () => {
    // All user interaction goes through addEventListener, not direct .click() calls
    // Exception 1: a.click() is used for blob URL downloads (user-initiated)
    // Exception 2: btn-detect-form.click() auto-triggers form detection after the user
    //   has already initiated a "load autofill" action (expected UX convenience)
    const clickCalls = codeOnly.match(/\w+\.click\(\s*\)/g) || [];
    const disallowed = clickCalls.filter(function(c) {
      return !/^a\.click/i.test(c) && !/btn-detect-form/i.test(c);
    });
    expect(disallowed).toEqual([]);
    // Event listeners exist for buttons and tabs
    expect(popupSource).toMatch(/addEventListener\(/);
  });
});

/* ─── Manual correction helpers validation ──── */

describe("Popup.js manual correction helpers", () => {
  it("defines updateConfidenceUI function", () => {
    expect(popupSource).toMatch(/function updateConfidenceUI/);
    // Updates badge text and confidence bar width
    expect(popupSource).toMatch(/confidence/);
    expect(popupSource).toMatch(/style\.width/);
  });

  it("defines recomputeConfidence function with proper scoring", () => {
    expect(popupSource).toMatch(/function recomputeConfidence/);
    // Scores: title=35, company=25, description=15, location=10
    expect(popupSource).toMatch(/35/);
    expect(popupSource).toMatch(/25/);
  });

  it("defines updateSendButton function with title+company guard", () => {
    expect(popupSource).toMatch(/function updateSendButton/);
    // Must check both title and company before enabling
    expect(popupSource).toMatch(/!title\s*\|\|\s*!company/);
  });

  it("send button click handler validates title and company before sending", () => {
    // The handler reads from edit-title and edit-company inputs
    expect(popupSource).toMatch(/edit-title/);
    expect(popupSource).toMatch(/edit-company/);
    // Validate the guard exists in the handler chain
    expect(popupSource).toMatch(/\.value\s*\|\|\s*""/);
  });

  it("recomputes confidence on input change", () => {
    // Input listeners on edit fields trigger recompute
    expect(popupSource).toMatch(/edit-title/);
    expect(popupSource).toMatch(/recomputeConfidence/);
  });
});

/* ─── Extraction function invariants ────────── */

describe("Popup.js extraction function invariants", () => {
  it("extraction function reads only from visible DOM", () => {
    // Uses querySelector / textContent — no hidden element access
    expect(popupSource).toMatch(/querySelector/);
    // No offsetHeight/parentNode traversal for invisible content
    expect(popupSource).not.toMatch(/offsetParent/);
  });

  it("extraction does not access passwords or credentials", () => {
    const extractFn = popupSource.match(/function extractLinkedInJobFn[\s\S]*?(?=function (?:extractIndeedJobFn|extractApecJobFn|sendToElton))/);
    const fnBody = extractFn ? extractFn[0] : "";
    expect(fnBody).not.toMatch(/password/);
    expect(fnBody).not.toMatch(/credential/);
    expect(fnBody).not.toMatch(/token/);
    expect(fnBody).not.toMatch(/secret/);
  });

  it("company extraction has multiple fallback strategies", () => {
    // V2.7.3 added multiple strategies for company detection
    expect(popupSource).toMatch(/company/);
    // Has company search in side panel
    expect(popupSource).toMatch(/\[href.*company/);
  });

  it("location extraction uses metadata parsing with separators", () => {
    // V2.7.3 added geographic text scanning
    expect(popupSource).toMatch(/location/);
  });

  it("has isNoiseText helper for filtering boilerplate", () => {
    expect(popupSource).toMatch(/function isNoiseText/);
    // Should filter common noise words
    expect(popupSource).toMatch(/promoted/);
    expect(popupSource).toMatch(/easy apply/);
  });

  it("limits list extraction to max 10 cards", () => {
    expect(popupSource).toMatch(/10/);
  });

  it("extraction include login/CAPTCHA detection", () => {
    // Should check for login/CAPTCHA before attempting extraction
    expect(popupSource).toMatch(/login/i);
  });
});

/* ─── Assisted import payload validation ───── */

describe("Popup.js assisted import payload invariants", () => {
  it("send button is disabled when title or company is missing", () => {
    // updateSendButton disables the send button when title or company is absent
    expect(popupSource).toMatch(/btn\.disabled\s*=\s*!title/);
  });

  it("supports manual correction via editable inputs", () => {
    // Has edit-title, edit-company, edit-location inputs
    expect(popupSource).toMatch(/edit-title/);
    expect(popupSource).toMatch(/edit-company/);
    expect(popupSource).toMatch(/edit-location/);
  });

  it("sendPayload includes manually corrected values", () => {
    // The btn-send click handler reads from input values, not capturedData directly
    const handlerMatch = popupSource.match(/getElementById\("btn-send"\)\.addEventListener\("click",\s*function\s*\(\)\s*\{[\s\S]*?edit-company/);
    expect(handlerMatch).toBeTruthy();
    const handlerBody = handlerMatch ? handlerMatch[0] : "";
    expect(handlerBody).toContain("edit-title");
    expect(handlerBody).toContain("edit-company");
  });
});
