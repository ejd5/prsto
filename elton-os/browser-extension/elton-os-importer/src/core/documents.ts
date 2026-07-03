// ─── Document operations ──────────────────────
import { baseUrl, documentsDraftId, documentsStatus, selectedCvMode, lastDownloadFilename, lastDownloadId, setDocumentsStatus, setLastDownloadId, setLastDownloadFilename, getApiUrl } from "../utils/state";
import { showNotification } from "../utils/notifications";
import { addLog } from "../utils/logging";
import { show } from "../utils/helpers";
import { detectLinkedInEasyApplyResumeStepFn } from "./content-scripts";

export function isIndeedSmartApplyUrl(url: string): boolean {
  var u = (url || "").toLowerCase();
  return /smartapply\.indeed\.com/.test(u) || /indeedapply/i.test(u);
}

export function isLinkedInEasyApplyUrl(url: string): boolean {
  var u = (url || "").toLowerCase();
  return u.includes("linkedin.com") && u.includes("/apply");
}

export function detectLinkedInEasyApplyStep() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (!tabs[0] || !isLinkedInEasyApplyUrl(tabs[0].url || "")) return;
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id! },
      func: detectLinkedInEasyApplyResumeStepFn
    }, function(results: any) {
      var info = results && results[0] ? results[0].result : null;
      var stepBadge = document.getElementById("documents-cv-step-badge");
      if (info && info.hasTelecharger) {
        if (stepBadge) {
          stepBadge.style.display = "inline-block";
          stepBadge.textContent = "Étape CV";
        }
        var linkGuide = document.getElementById("documents-linkedin-guide");
        if (linkGuide) linkGuide.style.display = "block";
      } else {
        if (stepBadge) stepBadge.style.display = "none";
      }
    });
  });
}

export function loadDocumentStatus(callback?: any) {
  if (!documentsDraftId) { if (callback) callback(null); return; }
  fetch(getApiUrl("/api/application-drafts/" + documentsDraftId + "/documents"))
    .then(function(r) { return r.json(); })
    .then(function(d: any) {
      if (d.success) {
        setDocumentsStatus(d);
        if (callback) callback(null);
      } else {
        if (callback) callback(new Error(d.error || "Documents indisponibles"));
      }
    })
    .catch(function(err: any) {
      if (callback) callback(err);
    });
}

export function updateDocumentsUI() {
  if (!documentsStatus) return;
  var info = documentsStatus;
  document.getElementById("documents-draft-title")!.textContent = info.jobTitle || "Dossier trouvé";
  document.getElementById("documents-draft-info")!.textContent = (info.company || "") + " · " + (documentsDraftId || "").slice(0, 8) + "…";

  var cv = info.documents && info.documents.cv;
  var letter = info.documents && info.documents.coverLetter;

  var cvBadge = document.getElementById("documents-cv-badge")!;
  var cvPremiumBadge = document.getElementById("documents-cv-premium-badge");
  var cvFallbackBadge = document.getElementById("documents-cv-fallback-badge");

  if (selectedCvMode === "master") {
    cvBadge.className = "badge badge-green";
    cvBadge.textContent = "CV Maître (Profil)";
    if (cvPremiumBadge) {
      cvPremiumBadge.style.display = "inline-block";
      var tempSelect = document.getElementById("documents-cv-template-select") as HTMLSelectElement;
      var tempLabel = (tempSelect && tempSelect.options[tempSelect.selectedIndex]?.text) || "Premium Leadership";
      cvPremiumBadge.textContent = "CV Maître (" + tempLabel + ")";
    }
    if (cvFallbackBadge) cvFallbackBadge.style.display = "none";
  } else {
    if (cv && cv.available) {
      cvBadge.className = "badge badge-green";
      cvBadge.textContent = "CV Prêt";
      if (cv.quality === "premium" || cv.template === "premium-leadership" || cv.template === "executive-bordeaux" || cv.template === "strategic-blue" || cv.template === "minimal-luxe") {
        if (cvPremiumBadge) {
          cvPremiumBadge.style.display = "inline-block";
          var tempLabel2 = cv.template || "Premium Leadership";
          tempLabel2 = tempLabel2.replace(/-/g, " ").replace(/\b\w/g, function(l: string){ return l.toUpperCase(); });
          cvPremiumBadge.textContent = "CV Premium (" + tempLabel2 + ")";
        }
        if (cvFallbackBadge) cvFallbackBadge.style.display = "none";
      } else {
        if (cvPremiumBadge) cvPremiumBadge.style.display = "none";
        if (cvFallbackBadge) cvFallbackBadge.style.display = "none";
      }
    } else {
      cvBadge.className = "badge badge-red";
      cvBadge.textContent = "CV Indisponible";
      if (cvPremiumBadge) cvPremiumBadge.style.display = "none";
      if (cvFallbackBadge) cvFallbackBadge.style.display = "inline-block";
    }
  }

  var letterBadge = document.getElementById("documents-letter-badge")!;
  if (letter && letter.available) {
    letterBadge.className = "badge badge-green"; letterBadge.textContent = "Lettre Prête";
  } else {
    letterBadge.className = "badge badge-red"; letterBadge.textContent = "Lettre Absente";
  }

  var generatePackBtn = document.getElementById("btn-generate-pack");
  if (generatePackBtn) {
    var hasCV = cv && cv.available;
    var hasLetter = letter && letter.available;
    if (hasCV || hasLetter) {
      generatePackBtn.textContent = "Régénérer le Pack (CV + Lettre)";
      (generatePackBtn as HTMLElement).style.background = "linear-gradient(135deg, #7c3aed, #4d1d95)";
    } else {
      generatePackBtn.textContent = "Générer le Pack (CV + Lettre)";
      (generatePackBtn as HTMLElement).style.background = "linear-gradient(135deg, #8b5cf6, #6d28d9)";
    }
  }

  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs[0]) {
      var url = tabs[0].url || "";
      var isIndeed = isIndeedSmartApplyUrl(url);
      var isLinkedIn = isLinkedInEasyApplyUrl(url);
      
      var indeedBadge = document.getElementById("documents-smartapply-badge");
      if (indeedBadge) indeedBadge.style.display = isIndeed ? "inline-block" : "none";
      
      var linkedInBadge = document.getElementById("documents-linkedin-badge");
      if (linkedInBadge) linkedInBadge.style.display = isLinkedIn ? "inline-block" : "none";

      var indeedGuide = document.getElementById("documents-indeed-guide");
      if (indeedGuide) indeedGuide.style.display = isIndeed ? "block" : "none";

      if (isLinkedIn) {
        detectLinkedInEasyApplyStep();
      } else {
        var stepBadge = document.getElementById("documents-cv-step-badge");
        if (stepBadge) stepBadge.style.display = "none";
        var linkGuide = document.getElementById("documents-linkedin-guide");
        if (linkGuide) linkGuide.style.display = "none";
      }
    }
  });
}

export function downloadDocument(type: string) {
  if (!documentsDraftId) return;
  var selectedTemplate = (document.getElementById("documents-cv-template-select") as HTMLSelectElement).value || "premium_leadership";
  var url = baseUrl + "/api/application-drafts/" + documentsDraftId + "/documents/" + type;
  if (type === "cv") {
    url += "?template=" + encodeURIComponent(selectedTemplate);
    if (selectedCvMode === "master") {
      url += "&mode=master";
    }
  }

  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    var filename = "ELTON_CV.pdf";
    if (documentsStatus) {
      var name = (documentsStatus.candidateName || "Candidat").replace(/\s+/g, "_");
      var comp = (documentsStatus.company || "Company").replace(/\s+/g, "_");
      var role = (documentsStatus.jobTitle || "Job").replace(/\s+/g, "_");
      filename = "ELTON_" + name + "_" + comp + "_" + role + "_" + (type === "cv" ? "CV" : type === "cover-letter" ? "Lettre" : "Pack") + "." + (type === "zip" ? "zip" : "pdf");
    }
    var shortName = filename;

    addLog("Téléchargement de document", type.toUpperCase() + " : " + filename);

    if (chrome && chrome.downloads && chrome.downloads.download) {
      chrome.downloads.download({ url: url, filename: filename, saveAs: false } as any, function(downloadId: number) {
        setLastDownloadId(downloadId);
        setLastDownloadFilename(filename);
      });
    } else {
      fallbackBlobDownload(url, filename);
      setLastDownloadFilename(shortName);
    }
  });
}

function fallbackBlobDownload(url: string, filename: string) {
  fetch(url)
    .then(function(r) { return r.blob(); })
    .then(function(blob) {
      var blobUrl = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    });
}

export function showDownloadedFile() {
  if (chrome && chrome.downloads && chrome.downloads.show && lastDownloadId) {
    chrome.downloads.show(lastDownloadId);
  } else {
    var resEl = document.getElementById("documents-attach-result") || document.getElementById("documents-has-file-input");
    if (resEl && lastDownloadFilename) {
      resEl.textContent = "Fichier téléchargé : " + lastDownloadFilename;
      (resEl as HTMLElement).style.display = "block";
    }
  }
}

export function showManualFallback() {
  var el = document.getElementById("documents-no-file-input");
  if (el) {
    el.innerHTML = "L'injection automatique est non supportée. Veuillez <a href='#' id='btn-manual-dl-fallback'>Télécharger le CV</a> pour l'uploader manuellement.";
    (el as HTMLElement).style.display = "block";
    document.getElementById("btn-manual-dl-fallback")!.addEventListener("click", function(e) {
      e.preventDefault();
      downloadDocument("cv");
    });
  }
}

export function previewDocument(type: string) {
  if (!documentsDraftId) {
    alert("Aucun dossier de candidature lié.");
    return;
  }
  var selectedTemplate = (document.getElementById("documents-cv-template-select") as HTMLSelectElement).value || "premium_leadership";
  var url = "";
  if (type === "cv") {
    var modeParam = selectedCvMode === "master" ? "&mode=master" : "";
    url = baseUrl + "/dashboard/jobs/applications/" + documentsDraftId + "/cv-print?template=" + encodeURIComponent(selectedTemplate) + "&print=1&fit=1" + modeParam;
  } else {
    url = baseUrl + "/dashboard/jobs/applications/" + documentsDraftId + "/print?type=letter&fit=1";
  }

  var width = 500;
  var height = 700;
  var left = Math.round((window.screen.width - width) / 2);
  var top = Math.round((window.screen.height - height) / 2);

  if (chrome && chrome.windows && chrome.windows.create) {
    chrome.windows.create({
      url: url,
      type: "popup",
      width: width,
      height: height,
      left: left,
      top: top,
      focused: true
    } as any);
  } else {
    window.open(url, "elton_doc_preview", "width=" + width + ",height=" + height + ",left=" + left + ",top=" + top + ",menubar=no,toolbar=no,location=no,status=no");
  }
}

export function attachDocument(type: string) {
  if (!documentsDraftId) {
    alert("Aucun dossier de candidature lié.");
    return;
  }
  
  show("loading");
  document.getElementById("loading-msg")!.textContent = "Récupération du document...";

  var selectedTemplate = (document.getElementById("documents-cv-template-select") as HTMLSelectElement).value || "premium_leadership";
  var url = getApiUrl("/api/application-drafts/" + documentsDraftId + "/documents/" + type);
  if (type === "cv") {
    url += "?template=" + encodeURIComponent(selectedTemplate);
    if (selectedCvMode === "master") {
      url += "&mode=master";
    }
  }

  fetch(url)
    .then(function(res) {
      if (!res.ok) throw new Error("Erreur de téléchargement");
      return res.arrayBuffer();
    })
    .then(function(buffer) {
      var bytesArray = Array.from(new Uint8Array(buffer));
      
      var ext = "pdf";
      var filename = "ELTON_CV." + ext;
      if (documentsStatus) {
        var name = (documentsStatus.candidateName || "Candidat").replace(/\s+/g, "_");
        var comp = (documentsStatus.company || "Company").replace(/\s+/g, "_");
        var role = (documentsStatus.jobTitle || "Job").replace(/\s+/g, "_");
        filename = "ELTON_" + name + "_" + comp + "_" + role + "_" + (type === "cv" ? "CV" : "Lettre") + "." + ext;
      }

      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (!tabs[0]) {
          show("documents");
          alert("Onglet actif introuvable.");
          return;
        }

        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id! },
          func: () => {
            var inputs = document.querySelectorAll("input[type=file]");
            var results: any[] = [];
            for (var i = 0; i < inputs.length; i++) {
              var el = inputs[i];
              if (el.disabled) continue;
              if ((el as any).checkVisibility && !(el as any).checkVisibility()) continue;
              var accept = el.getAttribute("accept") || "";
              var label = "";
              if (el.id) { var lbl = document.querySelector("label[for='" + CSS.escape(el.id) + "']"); if (lbl) label = (lbl.textContent || (lbl as any).innerText || "").trim(); }
              if (!label) label = el.getAttribute("aria-label") || "";
              if (!label) label = el.name || "";
              var l = label.toLowerCase();
              var a = accept.toLowerCase();
              var classification = "genericDocuments";
              if (/\b(cv|resume|résumé|curriculum|vitae|cv pdf)\b/i.test(l)) classification = "cv";
              else if (a.includes(".pdf") && /\b(cv|resume|résumé|curriculum)\b/i.test(l)) classification = "cv";
              else if (/\b(lettre|cover letter|coverletter|motivation|letter|message|lm)\b/i.test(l)) classification = "coverLetter";
              else if (a.includes(".pdf") && /\b(cover|letter|lettre|motivation)\b/i.test(l)) classification = "coverLetter";
              results.push({ idx: i, accept: accept, label: label.slice(0, 200), classification: classification });
            }
            return results;
          }
        }, function(detectResults: any) {
          if (chrome.runtime.lastError || !detectResults || !detectResults[0]) {
            show("documents");
            alert("Erreur de détection des champs fichiers.");
            return;
          }

          var fileFields = detectResults[0].result || [];
          var targetField: any = null;
          for (var i = 0; i < fileFields.length; i++) {
            if (fileFields[i].classification === type) {
              targetField = fileFields[i];
              break;
            }
          }
          if (!targetField && fileFields.length > 0) {
            targetField = fileFields[0];
          }

          if (!targetField) {
            show("documents");
            showManualFallback();
            return;
          }

          document.getElementById("loading-msg")!.textContent = "Injection du document...";
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id! },
            func: (idx: number, fileBytes: number[], fname: string, mime: string) => {
              try {
                var inputs = document.querySelectorAll("input[type=file]");
                if (idx < 0 || idx >= inputs.length) return { success: false, reason: "Index hors limites" };
                var input = inputs[idx];
                if (!input || input.disabled) return { success: false, reason: "Champ inactif ou introuvable" };
                var bytes = new Uint8Array(fileBytes);
                var file = new File([bytes], fname, { type: mime || "application/pdf" });
                var dt = new DataTransfer();
                dt.items.add(file);
                input.files = dt.files;
                input.dispatchEvent(new Event("input", { bubbles: true }));
                input.dispatchEvent(new Event("change", { bubbles: true }));
                input.dispatchEvent(new FocusEvent("blur", { bubbles: true }));
                return { success: true };
              } catch (e: any) {
                return { success: false, reason: e.message };
              }
            },
            args: [targetField.idx, bytesArray, filename, "application/pdf"]
          }, function(attachResults: any) {
            show("documents");
            if (chrome.runtime.lastError || !attachResults || !attachResults[0]) {
              alert("Erreur technique lors de l'attachement.");
              return;
            }
            var res = attachResults[0].result;
            if (res.success) {
              addLog("Attachement réussi", type.toUpperCase() + " injecté dans " + (targetField.label || "l'input"));
              alert("Document injecté avec succès.");
            } else {
              alert("Impossible d'injecter : " + res.reason);
            }
          });
        });
      });
    })
    .catch(function(err: any) {
      show("documents");
      alert("Erreur lors de la récupération du PDF: " + err.message);
    });
}

export function attachBothDocuments() {
  attachDocument("cv");
  setTimeout(function() {
    attachDocument("coverLetter");
  }, 1500);
}
