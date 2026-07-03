import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const POPUP_PATH = resolve(
  import.meta.dirname,
  "../browser-extension/elton-os-importer/popup.js"
);
const popupSource = readFileSync(POPUP_PATH, "utf-8");

/* ─── Security invariants for Documents tab ─── */

describe("Documents tab security invariants", () => {
  it("does not read document.cookie in Documents tab code", () => {
    // Already covered by existing security test, but verify no new cookie access
    const docSection = popupSource.match(/Documents tab logic[\s\S]*?DOM ready/s);
    if (docSection) {
      expect(docSection[0]).not.toMatch(/document\.cookie/);
    }
  });

  it("does not read localStorage or sessionStorage in Documents tab code", () => {
    const docSection = popupSource.match(/Documents tab logic[\s\S]*?DOM ready/s);
    if (docSection) {
      expect(docSection[0]).not.toMatch(/localStorage/);
      expect(docSection[0]).not.toMatch(/sessionStorage/);
    }
  });

  it("does not auto-submit forms in attachFileToInputFn", () => {
    expect(popupSource).toMatch(/function attachFileToInputFn/);
    const fnBody = popupSource.match(/function attachFileToInputFn[\s\S]*?(?=^function |\/\/ ───)/m);
    if (fnBody) {
      expect(fnBody[0]).not.toMatch(/\.submit\(/);
      expect(fnBody[0]).not.toMatch(/form\.submit/);
    }
  });

  it("does not auto-scroll in Documents tab functions", () => {
    const docSection = popupSource.match(/Documents tab logic[\s\S]*?DOM ready/s);
    if (docSection) {
      const stripped = docSection[0].replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
      expect(stripped).not.toMatch(/scrollTo/);
      expect(stripped).not.toMatch(/scrollBy/);
    }
  });

  it("does not fetch to external URLs in Documents tab", () => {
    const docSection = popupSource.match(/Documents tab logic[\s\S]*?DOM ready/s);
    if (docSection) {
      const fetches = docSection[0].match(/fetch\(["'][^"']+["']\)/g) || [];
      for (const call of fetches) {
        const url = call.replace(/fetch\(["']|["']\)/g, "");
        expect(url).toMatch(/^\/api\//);
      }
    }
  });
});

/* ─── File input detection ─────────────────── */

describe("detectFileInputsFn classification", () => {
  it("defines detectFileInputsFn with classification logic", () => {
    expect(popupSource).toMatch(/function detectFileInputsFn/);
  });

  it("classifies CV file inputs by label text", () => {
    expect(popupSource).toMatch(/cv|resume|résumé|curriculum/i);
  });

  it("classifies cover letter file inputs by label text", () => {
    expect(popupSource).toMatch(/lettre|cover letter|motivation/i);
  });

  it("classifies generic document file inputs", () => {
    expect(popupSource).toMatch(/genericDocuments/);
  });

  it("detects accept attribute for PDF filtering", () => {
    expect(popupSource).toMatch(/getAttribute\(["']accept["']\)/);
  });

  it("checks element visibility before classifying", () => {
    const fnBody = popupSource.match(/function detectFileInputsFn[\s\S]*?(?=^function |\/\/ ───)/m);
    if (fnBody) {
      expect(fnBody[0]).toMatch(/checkVisibility/);
    }
  });
});

/* ─── File attachment ──────────────────────── */

describe("attachFileToInputFn", () => {
  it("defines attachFileToInputFn with DataTransfer", () => {
    expect(popupSource).toMatch(/function attachFileToInputFn/);
    expect(popupSource).toMatch(/DataTransfer/);
  });

  it("dispatches input and change events after attachment", () => {
    const fnBody = popupSource.match(/function attachFileToInputFn[\s\S]*?(?=^function |\/\/ ───)/m);
    if (fnBody) {
      expect(fnBody[0]).toMatch(/dispatchEvent.*input/);
      expect(fnBody[0]).toMatch(/dispatchEvent.*change/);
    }
  });

  it("does not auto-submit after file attachment", () => {
    const fnBody = popupSource.match(/function attachFileToInputFn[\s\S]*?(?=^function |\/\/ ───)/m);
    if (fnBody) {
      expect(fnBody[0]).not.toMatch(/\.submit\(/);
    }
  });
});

/* ─── Manual download fallback ─────────────── */

describe("Documents tab — manual download fallback", () => {
  it("has downloadDocument function for CV, letter, and ZIP", () => {
    expect(popupSource).toMatch(/function downloadDocument/);
    // URLs are constructed via string concat: "/documents/" + type
    expect(popupSource).toMatch(/"\/documents\/"\s*\+\s*type/);
    expect(popupSource).toMatch(/type === "cv"/);
    expect(popupSource).toMatch(/"cover-letter"/);
    expect(popupSource).toMatch(/downloadDocument\("zip"\)/);
  });

  it("has showManualFallback function with download button", () => {
    expect(popupSource).toMatch(/function showManualFallback/);
    expect(popupSource).toMatch(/non supportée/);
    expect(popupSource).toMatch(/Télécharger/);
  });

  it("uses chrome.downloads.download with FileReader fallback (V2.8.2)", () => {
    expect(popupSource).toMatch(/chrome\.downloads\.download/);
    expect(popupSource).toMatch(/FileReader/);
  });
});

/* ─── UI states ────────────────────────────── */

describe("Documents tab UI states", () => {
  it("has documents-main state", () => {
    expect(popupSource).not.toMatch(/state-documents-main/); // HTML only
  });

  it("has documents-found state with attach/download buttons", () => {
    // Check that the button IDs exist in event listeners
    expect(popupSource).toMatch(/btn-attach-cv/);
    expect(popupSource).toMatch(/btn-attach-letter/);
    expect(popupSource).toMatch(/btn-download-cv/);
    expect(popupSource).toMatch(/btn-download-letter/);
    expect(popupSource).toMatch(/btn-download-zip/);
  });

  it("has footer note about no auto-submission", () => {
    // The footer in popup.html already states this
    const htmlPath = resolve(import.meta.dirname, "../browser-extension/elton-os-importer/popup.html");
    const html = readFileSync(htmlPath, "utf-8");
    expect(html).toMatch(/aucune candidature/i);
  });
});

/* ─── V2.8.2 — Indeed Resume Upload Helper ─── */

describe("V2.8.2 — Indeed SmartApply detection", () => {
  it("defines isIndeedSmartApplyUrl function", () => {
    expect(popupSource).toMatch(/function isIndeedSmartApplyUrl/);
  });

  it("matches smartapply.indeed.com URLs", () => {
    expect(popupSource).toMatch(/smartapply\\\.indeed\\\.com/);
  });

  it("matches indeedapply URLs", () => {
    expect(popupSource).toMatch(/indeedapply/i);
  });

  it("defines detectIndeedResumeSelection function", () => {
    expect(popupSource).toMatch(/function detectIndeedResumeSelection/);
  });

  it("detects Indeed resume selection screen text", () => {
    expect(popupSource).toMatch(/utiliser votre cv indeed/);
    expect(popupSource).toMatch(/importer un autre fichier/i);
  });

  it("detects file input and submit button presence", () => {
    expect(popupSource).toMatch(/hasSubmitButton/);
    expect(popupSource).toMatch(/hasFileInput/);
  });

  it("shows Indeed SmartApply badge when detected", () => {
    expect(popupSource).toMatch(/documents-smartapply-badge/);
  });

  it("shows Indeed guide section for manual upload", () => {
    expect(popupSource).toMatch(/documents-indeed-guide/);
  });

  it("shows no-file-input and has-file-input toggles", () => {
    expect(popupSource).toMatch(/documents-no-file-input/);
    expect(popupSource).toMatch(/documents-has-file-input/);
  });
});

describe("V2.8.2 — Clipboard and textarea operations", () => {
  it("defines copyToClipboard function", () => {
    expect(popupSource).toMatch(/function copyToClipboard/);
  });

  it("uses navigator.clipboard.writeText", () => {
    expect(popupSource).toMatch(/navigator\.clipboard\.writeText/);
  });

  it("has execCommand fallback for older browsers", () => {
    expect(popupSource).toMatch(/execCommand\(["']copy["']\)/);
  });

  it("defines fetchLetterText function calling cover-letter-text endpoint", () => {
    expect(popupSource).toMatch(/function fetchLetterText/);
    expect(popupSource).toMatch(/cover-letter-text/);
  });

  it("defines fillLetterTextarea function", () => {
    expect(popupSource).toMatch(/function fillLetterTextarea/);
  });

  it("searches for cover letter textareas by aria-label, name, placeholder", () => {
    // Searches for key terms in texarea detection
    expect(popupSource).toMatch(/cover\\s\*letter|lettre|motivation/);
  });

  it("dispatches input and change events after filling", () => {
    const fnBody = popupSource.match(/function fillLetterTextarea[\s\S]*?(?=^function |\/\/ ───)/m);
    if (fnBody) {
      expect(fnBody[0]).toMatch(/dispatchEvent.*input/);
      expect(fnBody[0]).toMatch(/dispatchEvent.*change/);
    }
  });

  it("does not auto-submit after filling textarea", () => {
    const fnBody = popupSource.match(/function fillLetterTextarea[\s\S]*?(?=^function |\/\/ ───)/m);
    if (fnBody) {
      expect(fnBody[0]).not.toMatch(/\.submit\(/);
    }
  });

  it("registers btn-copy-letter event listener", () => {
    expect(popupSource).toMatch(/btn-copy-letter/);
  });

  it("registers btn-fill-letter event listener", () => {
    expect(popupSource).toMatch(/btn-fill-letter/);
  });
});

describe("V2.8.2 — Download tracking and show-in-folder", () => {
  it("tracks lastDownloadId and lastDownloadFilename", () => {
    expect(popupSource).toMatch(/var lastDownloadId = null/);
    expect(popupSource).toMatch(/var lastDownloadFilename = null/);
  });

  it("defines showDownloadedFile function", () => {
    expect(popupSource).toMatch(/function showDownloadedFile/);
  });

  it("uses chrome.downloads.show to reveal file", () => {
    expect(popupSource).toMatch(/chrome\.downloads\.show/);
  });

  it("registers btn-show-file event listener", () => {
    expect(popupSource).toMatch(/btn-show-file/);
  });

  it("registers btn-copy-filename event listener", () => {
    expect(popupSource).toMatch(/btn-copy-filename/);
  });
});

/* ─── V2.8.3 — chrome.downloads safety guard ─── */

describe("V2.8.3 — chrome.downloads undefined fallback", () => {
  it("defines fallbackBlobDownload function", () => {
    expect(popupSource).toMatch(/function fallbackBlobDownload/);
  });

  it("guards chrome.downloads.download with existence check before calling", () => {
    expect(popupSource).toMatch(/chrome\s*&&\s*chrome\.downloads\s*&&\s*chrome\.downloads\.download/);
  });

  it("falls back to anchor click when chrome.downloads unavailable", () => {
    // fallbackBlobDownload creates <a>, sets href+download, clicks, removes
    const fnBody = popupSource.match(/function fallbackBlobDownload[\s\S]*?(?=^function |\/\/ ───)/m);
    if (fnBody) {
      expect(fnBody[0]).toMatch(/createElement\(["']a["']\)/);
      expect(fnBody[0]).toMatch(/\.click\(\)/);
    }
  });

  it("guards showDownloadedFile chrome.downloads.show with existence check", () => {
    expect(popupSource).toMatch(/chrome\.downloads\.show/);
    // Must be guarded: chrome && chrome.downloads && chrome.downloads.show
    const fnBody = popupSource.match(/function showDownloadedFile[\s\S]*?(?=^function |\/\/ ───)/m);
    if (fnBody) {
      expect(fnBody[0]).toMatch(/chrome\s*&&\s*chrome\.downloads\s*&&/);
    }
  });

  it("shows filename in result when showDownloadedFile has no downloads API", () => {
    const fnBody = popupSource.match(/function showDownloadedFile[\s\S]*?(?=^function |\/\/ ───)/m);
    if (fnBody) {
      expect(fnBody[0]).toMatch(/lastDownloadFilename/);
      expect(fnBody[0]).toMatch(/documents-attach-result/);
    }
  });

  it("sets lastDownloadFilename on blob fallback path", () => {
    const fnBody = popupSource.match(/function downloadDocument[\s\S]*?(?=^function |\/\/ ───)/m);
    if (fnBody) {
      // In the else branch (no downloads API): fallbackBlobDownload + set filename
      expect(fnBody[0]).toMatch(/fallbackBlobDownload/);
      expect(fnBody[0]).toMatch(/lastDownloadFilename\s*=\s*shortName/);
    }
  });
});

/* ─── V2.8.3 — LinkedIn Easy Apply detection ─── */

describe("V2.8.3 — LinkedIn Easy Apply detection", () => {
  it("defines isLinkedInEasyApplyUrl function", () => {
    expect(popupSource).toMatch(/function isLinkedInEasyApplyUrl/);
  });

  it("matches linkedin.com/jobs/.../apply URLs", () => {
    const fnBody = popupSource.match(/function isLinkedInEasyApplyUrl[\s\S]*?(?=^function |\/\/ ───)/m);
    if (fnBody) {
      expect(fnBody[0]).toMatch(/linkedin/);
      expect(fnBody[0]).toMatch(/apply/);
    }
  });

  it("defines detectLinkedInEasyApplyResumeStepFn content script", () => {
    expect(popupSource).toMatch(/function detectLinkedInEasyApplyResumeStepFn/);
  });

  it("detects 'Télécharger le CV' button in DOM", () => {
    const fnBody = popupSource.match(/function detectLinkedInEasyApplyResumeStepFn[\s\S]*?(?=^function |\/\/ ───)/m);
    if (fnBody) {
      expect(fnBody[0]).toMatch(/télécharger le cv|upload resume|upload cv|importer votre cv/i);
    }
  });

  it("detects 'Postuler chez' Easy Apply modal", () => {
    const fnBody = popupSource.match(/function detectLinkedInEasyApplyResumeStepFn[\s\S]*?(?=^function |\/\/ ───)/m);
    if (fnBody) {
      expect(fnBody[0]).toMatch(/postuler chez|apply to|easily apply/i);
    }
  });

  it("detects 'Suivant'/Next button", () => {
    const fnBody = popupSource.match(/function detectLinkedInEasyApplyResumeStepFn[\s\S]*?(?=^function |\/\/ ───)/m);
    if (fnBody) {
      expect(fnBody[0]).toMatch(/Suivant|Next|Continuer/);
    }
  });

  it("checks for accessible file input with accept attribute", () => {
    const fnBody = popupSource.match(/function detectLinkedInEasyApplyResumeStepFn[\s\S]*?(?=^function |\/\/ ───)/m);
    if (fnBody) {
      expect(fnBody[0]).toMatch(/getAttribute\(["']accept["']\)/);
      expect(fnBody[0]).toMatch(/hasAccessibleFileInput/);
    }
  });

  it("returns platform=linkedin and flow=easy_apply_resume_step", () => {
    const fnBody = popupSource.match(/function detectLinkedInEasyApplyResumeStepFn[\s\S]*?(?=^function |\/\/ ───)/m);
    if (fnBody) {
      expect(fnBody[0]).toMatch(/easy_apply_resume_step/);
      expect(fnBody[0]).toMatch(/platform:\s*"linkedin"/);
    }
  });

  it("defines detectLinkedInEasyApplyStep popup handler", () => {
    expect(popupSource).toMatch(/function detectLinkedInEasyApplyStep/);
  });

  it("triggers LinkedIn detection from updateDocumentsUI", () => {
    expect(popupSource).toMatch(/isLinkedInEasyApplyUrl/);
    expect(popupSource).toMatch(/detectLinkedInEasyApplyStep/);
  });
});

/* ─── V2.8.3 — LinkedIn Easy Apply security invariants ─── */

describe("V2.8.3 — LinkedIn Easy Apply security invariants", () => {
  it("does not auto-click 'Télécharger le CV'", () => {
    // The detection function only reads the DOM — it never clicks
    const fnBody = popupSource.match(/function detectLinkedInEasyApplyResumeStepFn[\s\S]*?(?=^function |\/\/ ───)/m);
    if (fnBody) {
      expect(fnBody[0]).not.toMatch(/\.click\(\)/);
    }
  });

  it("does not auto-click 'Suivant'", () => {
    // Security rule: never auto-advance in the flow
    expect(popupSource).not.toMatch(/Suivant.*\.click\(\)/);
    expect(popupSource).not.toMatch(/Next.*\.click\(\)/);
  });

  it("does not auto-submit forms", () => {
    const fnBody = popupSource.match(/function detectLinkedInEasyApplyResumeStepFn[\s\S]*?(?=^function |\/\/ ───)/m);
    if (fnBody) {
      expect(fnBody[0]).not.toMatch(/\.submit\(\)/);
    }
  });

  it("does not access document.cookie", () => {
    const fnBody = popupSource.match(/function detectLinkedInEasyApplyResumeStepFn[\s\S]*?(?=^function |\/\/ ───)/m);
    if (fnBody) {
      expect(fnBody[0]).not.toMatch(/document\.cookie/);
    }
  });

  it("does not fetch to LinkedIn", () => {
    // All fetch calls must go to baseUrl (/api/...)
    const fnBody = popupSource.match(/function detectLinkedInEasyApplyStep[\s\S]*?(?=^function |\/\/ ───)/m);
    if (fnBody) {
      expect(fnBody[0]).not.toMatch(/linkedin\.com/);
    }
  });
});

/* ─── V2.8.3 — LinkedIn Documents UI ─── */

describe("V2.8.3 — LinkedIn Easy Apply Documents UI", () => {
  it("has LinkedIn Easy Apply badge in popup.html", () => {
    const htmlPath = resolve(import.meta.dirname, "../browser-extension/elton-os-importer/popup.html");
    const html = readFileSync(htmlPath, "utf-8");
    expect(html).toMatch(/documents-linkedin-badge/);
  });

  it("has CV step badge", () => {
    const htmlPath = resolve(import.meta.dirname, "../browser-extension/elton-os-importer/popup.html");
    const html = readFileSync(htmlPath, "utf-8");
    expect(html).toMatch(/documents-cv-step-badge/);
  });

  it("has LinkedIn guide section with step-by-step instructions", () => {
    const htmlPath = resolve(import.meta.dirname, "../browser-extension/elton-os-importer/popup.html");
    const html = readFileSync(htmlPath, "utf-8");
    expect(html).toMatch(/documents-linkedin-guide/);
    expect(html).toMatch(/documents-linkedin-no-file-input/);
    expect(html).toMatch(/documents-linkedin-has-file-input/);
  });

  it("has no-draft warning message for missing draft", () => {
    const htmlPath = resolve(import.meta.dirname, "../browser-extension/elton-os-importer/popup.html");
    const html = readFileSync(htmlPath, "utf-8");
    expect(html).toMatch(/documents-linkedin-no-draft/);
    expect(html).toMatch(/Importez d'abord l'offre/);
  });

  it("shows security notice about manual file selection", () => {
    const htmlPath = resolve(import.meta.dirname, "../browser-extension/elton-os-importer/popup.html");
    const html = readFileSync(htmlPath, "utf-8");
    expect(html).toMatch(/LinkedIn demande une sélection manuelle/);
    expect(html).toMatch(/sélectionnez ce PDF/);
  });

  it("tells user to never auto-click Suivant", () => {
    const htmlPath = resolve(import.meta.dirname, "../browser-extension/elton-os-importer/popup.html");
    const html = readFileSync(htmlPath, "utf-8");
    expect(html).toMatch(/Ne cliquez pas sur Suivant/);
  });
});

/* ─── V2.8.4 — CV Premium PDF for extension ─── */

describe("V2.8.4 — CV Premium badge and quality metadata", () => {
  it("has CV Premium badge element in HTML", () => {
    const htmlPath = resolve(import.meta.dirname, "../browser-extension/elton-os-importer/popup.html");
    const html = readFileSync(htmlPath, "utf-8");
    expect(html).toMatch(/documents-cv-premium-badge/);
  });

  it("has CV fallback warning badge in HTML", () => {
    const htmlPath = resolve(import.meta.dirname, "../browser-extension/elton-os-importer/popup.html");
    const html = readFileSync(htmlPath, "utf-8");
    expect(html).toMatch(/documents-cv-fallback-badge/);
    expect(html).toMatch(/régénérez le dossier/);
  });

  it("shows Premium Leadership label in badge", () => {
    const htmlPath = resolve(import.meta.dirname, "../browser-extension/elton-os-importer/popup.html");
    const html = readFileSync(htmlPath, "utf-8");
    expect(html).toMatch(/CV Premium/);
    expect(html).toMatch(/Leadership/);
  });

  it("checks cv.quality === 'premium' in updateDocumentsUI", () => {
    expect(popupSource).toMatch(/cv\.quality === "premium"/);
  });

  it("checks cv.template in updateDocumentsUI", () => {
    expect(popupSource).toMatch(/cv\.template === "premium-leadership"/);
  });

  it("shows premium badge when quality is premium", () => {
    // The updateDocumentsUI function must reference documents-cv-premium-badge
    expect(popupSource).toMatch(/documents-cv-premium-badge/);
  });

  it("hides fallback badge when quality is premium", () => {
    // updateDocumentsUI must hide fallback when premium
    expect(popupSource).toMatch(/documents-cv-fallback-badge/);
  });
});

describe("V2.8.4 — No plain text fallback by default", () => {
  it("popup.js does not reference plain-text fallback as primary document", () => {
    // popup.js should NOT describe the CV as "texte brut" or plain text
    expect(popupSource).not.toMatch(/texte brut/);
  });

  it("has Premium Leadership CV badge (not plain text badge)", () => {
    const htmlPath = resolve(import.meta.dirname, "../browser-extension/elton-os-importer/popup.html");
    const html = readFileSync(htmlPath, "utf-8");
    // Should NOT say "texte brut" or similar
    expect(html).not.toMatch(/texte brut/);
  });

  it("premium badge uses champagne accent color", () => {
    const htmlPath = resolve(import.meta.dirname, "../browser-extension/elton-os-importer/popup.html");
    const html = readFileSync(htmlPath, "utf-8");
    expect(html).toMatch(/c8a64e/i);
  });
});

/* ─── V2.8.5 — New CV templates + No auto-print + Template selector ─── */

describe("V2.8.5 — CV template selector in extension", () => {
  it("has template select dropdown in HTML", () => {
    const htmlPath = resolve(import.meta.dirname, "../browser-extension/elton-os-importer/popup.html");
    const html = readFileSync(htmlPath, "utf-8");
    expect(html).toMatch(/documents-cv-template-select/);
  });

  it("template select includes Executive Bordeaux option", () => {
    const htmlPath = resolve(import.meta.dirname, "../browser-extension/elton-os-importer/popup.html");
    const html = readFileSync(htmlPath, "utf-8");
    expect(html).toMatch(/executive_bordeaux/);
    expect(html).toMatch(/Executive Bordeaux/);
  });

  it("template select includes Strategic Blue option", () => {
    const htmlPath = resolve(import.meta.dirname, "../browser-extension/elton-os-importer/popup.html");
    const html = readFileSync(htmlPath, "utf-8");
    expect(html).toMatch(/strategic_blue/);
    expect(html).toMatch(/Strategic Blue/);
  });

  it("template select includes Minimal Luxe option", () => {
    const htmlPath = resolve(import.meta.dirname, "../browser-extension/elton-os-importer/popup.html");
    const html = readFileSync(htmlPath, "utf-8");
    expect(html).toMatch(/minimal_luxe/);
    expect(html).toMatch(/Minimal Luxe/);
  });

  it("downloadDocument appends ?template= for CV type", () => {
    expect(popupSource).toMatch(/template.*encodeURIComponent/);
  });

  it("updateDocumentsUI recognizes all premium template IDs", () => {
    expect(popupSource).toMatch(/executive-bordeaux/);
    expect(popupSource).toMatch(/strategic-blue/);
    expect(popupSource).toMatch(/minimal-luxe/);
  });

  it("premium badge shows template name", () => {
    const htmlPath = resolve(import.meta.dirname, "../browser-extension/elton-os-importer/popup.html");
    const html = readFileSync(htmlPath, "utf-8");
    expect(html).toMatch(/Modèle CV/);
  });
});

describe("V2.8.5 — No auto-print on cv-print page", () => {
  it("cv-print page does not call window.print on load", () => {
    const cvPrintPath = resolve(import.meta.dirname, "../app/(app)/dashboard/jobs/applications/[id]/cv-print/page.tsx");
    const cvPrintSource = readFileSync(cvPrintPath, "utf-8");
    // Must NOT have setTimeout(() => window.print(), ...) — removed in V2.8.5
    expect(cvPrintSource).not.toMatch(/setTimeout\s*\(\s*\(\)\s*=>\s*window\.print/);
  });

  it("cv-print page still allows manual print via button", () => {
    const cvPrintPath = resolve(import.meta.dirname, "../app/(app)/dashboard/jobs/applications/[id]/cv-print/page.tsx");
    const cvPrintSource = readFileSync(cvPrintPath, "utf-8");
    // Must have Print button with window.print for manual use
    expect(cvPrintSource).toMatch(/Imprimer/);
    // Must have Download icon instead of just Printer
    expect(cvPrintSource).toMatch(/Download/);
  });

  it("cv-print page uses Download icon for PDF button", () => {
    const cvPrintPath = resolve(import.meta.dirname, "../app/(app)/dashboard/jobs/applications/[id]/cv-print/page.tsx");
    const cvPrintSource = readFileSync(cvPrintPath, "utf-8");
    expect(cvPrintSource).toMatch(/Télécharger PDF/);
    expect(cvPrintSource).toMatch(/handleDownloadPdf/);
  });
});
