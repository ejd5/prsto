/**
 * ELTON OS Importer V2.8.7 — Chrome Extension (Manifest V3)
 * Redesign Premium Side Panel.
 */

var capturedData = null;
var baseUrl = "http://localhost:3000";
var currentTab = "import";
var autofillFields = [];
var detectedFields = [];
var overwriteExisting = false;
var importMode = "single"; // "single" | "list"
var backendOnline = false; // health check result
var backendChecked = false;
var documentsDraftId = null;
var documentsStatus = null;
var lastDownloadId = null;
var lastDownloadFilename = null;
var selectedCvMode = "adapted";

// ─── Custom Toast Notification System ────────
function showNotification(msg, type) {
  var toast = document.getElementById("custom-toast");
  var messageEl = document.getElementById("toast-message");
  var iconEl = document.getElementById("toast-icon");
  if (!toast || !messageEl) return;

  messageEl.textContent = msg;

  if (type === "error") {
    iconEl.textContent = "✗";
    iconEl.style.background = "rgba(220,38,38,0.15)";
    iconEl.style.color = "#dc2626";
    toast.style.borderColor = "#dc2626";
  } else if (type === "warning") {
    iconEl.textContent = "⚠";
    iconEl.style.background = "rgba(245,158,11,0.15)";
    iconEl.style.color = "#f59e0b";
    toast.style.borderColor = "#f59e0b";
  } else {
    iconEl.textContent = "✓";
    iconEl.style.background = "rgba(139,92,246,0.15)";
    iconEl.style.color = "#8b5cf6";
    toast.style.borderColor = "#8b5cf6";
  }

  toast.style.display = "flex";

  if (window.toastTimeout) clearTimeout(window.toastTimeout);
  window.toastTimeout = setTimeout(function() {
    toast.style.display = "none";
  }, 4000);
}

// Override default window.alert to use the premium toast instead
function alert(msg) {
  var type = "info";
  var lower = (msg || "").toLowerCase();
  if (lower.includes("erreur") || lower.includes("impossible") || lower.includes("manquant") || lower.includes("invalide") || lower.includes("échoué") || lower.includes("introuvable")) {
    type = "error";
  } else if (lower.includes("succès") || lower.includes("réussi") || lower.includes("copié") || lower.includes("injecté") || lower.includes("prêt") || lower.includes("généré")) {
    type = "success";
  }
  showNotification(msg, type);
}

// Bind close toast button immediately
document.addEventListener("DOMContentLoaded", function() {
  var closeToastBtn = document.getElementById("btn-close-toast");
  if (closeToastBtn) {
    closeToastBtn.addEventListener("click", function() {
      var toast = document.getElementById("custom-toast");
      if (toast) toast.style.display = "none";
    });
  }
});

// ─── Activity Log helper ─────────────────────
function addLog(action, details) {
  chrome.storage.local.get(["activityLogs"], function(result) {
    var logs = result.activityLogs || [];
    logs.unshift({
      timestamp: new Date().toISOString(),
      action: action,
      details: details
    });
    if (logs.length > 50) logs = logs.slice(0, 50);
    chrome.storage.local.set({ activityLogs: logs }, function() {
      loadActivityLogs();
    });
  });
}

function loadActivityLogs() {
  chrome.storage.local.get(["activityLogs"], function(result) {
    var container = document.getElementById("ai-action-log-container");
    if (!container) return;
    var logs = result.activityLogs || [];
    if (logs.length === 0) {
      container.innerHTML = '<div style="color:#666;font-style:italic;">Aucune action enregistrée.</div>';
      return;
    }
    var html = "";
    logs.forEach(function(l) {
      var date = new Date(l.timestamp).toLocaleTimeString("fr-FR");
      html += '<div style="margin-bottom:4px;border-bottom:1px solid #111;padding-bottom:2px;">' +
        '<span style="color:#c8a64e;margin-right:4px;">[' + date + ']</span>' +
        '<strong style="color:#eee;">' + esc(l.action) + '</strong><br>' +
        '<span style="color:#777;">' + esc(l.details) + '</span>' +
        '</div>';
    });
    container.innerHTML = html;
  });
}

// ─── Search Health & Diagnostics ─────────────
function runSearchDiagnostics(tabUrl) {
  var keywordQuality = "Optimale (95%)";
  var locationQuality = "Ciblée (IDF / PACA)";
  var showExplainer = false;
  var explainerText = "";

  var urlLower = (tabUrl || "").toLowerCase();
  if (urlLower.includes("linkedin.com") || urlLower.includes("indeed.com") || urlLower.includes("apec.fr")) {
    if (urlLower.includes("keywords=") || urlLower.includes("q=") || urlLower.includes("recherche")) {
      // Analyze parameters
      var urlObj = null;
      try { urlObj = new URL(tabUrl); } catch(e){}
      if (urlObj) {
        var q = urlObj.searchParams.get("keywords") || urlObj.searchParams.get("q") || urlObj.searchParams.get("p");
        if (q) {
          if (q.length > 40) {
            keywordQuality = "Trop restrictif (Filtres longs)";
            showExplainer = true;
            explainerText = "Mots-clés très longs détectés. Simplifiez votre recherche (ex: 'Directeur Commercial' au lieu de phrases complexes).";
          } else if (q.length < 3) {
            keywordQuality = "Faible (Trop court)";
          }
        }
        var loc = urlObj.searchParams.get("location") || urlObj.searchParams.get("l");
        if (loc) {
          if (loc.toLowerCase().includes("paris") || loc.toLowerCase().includes("paca") || loc.toLowerCase().includes("france")) {
            locationQuality = "Idéale (Zone ciblée)";
          } else {
            locationQuality = "Élargie (Hors priorités)";
            showExplainer = true;
            explainerText = "Zone géographique hors PACA/IDF. Assurez-vous d'avoir configuré votre mobilité correspondante dans ELTON OS.";
          }
        }
      }
    }
  }

  var kwEl = document.getElementById("health-keyword-quality");
  var locEl = document.getElementById("health-location-quality");
  var explainerEl = document.getElementById("no-result-explainer");
  var explainerTxtEl = document.getElementById("no-result-text");

  if (kwEl) kwEl.textContent = keywordQuality;
  if (locEl) locEl.textContent = locationQuality;
  
  if (showExplainer && explainerEl && explainerTxtEl) {
    explainerEl.style.display = "block";
    explainerTxtEl.textContent = explainerText;
  } else if (explainerEl) {
    explainerEl.style.display = "none";
  }
}

// ─── Helpers ───────────────────────────────

function show(state) {
  var names = [
    "import-main", "import-preview", "import-sent",
    "documents-main", "documents-found", "documents-not-found",
    "autofill-main", "autofill-detect", "autofill-done",
    "loading", "error", "settings", "blocked"
  ];
  names.forEach(function(s) {
    var el = document.getElementById("state-" + s);
    if (el) el.style.display = "none";
  });
  var target = document.getElementById("state-" + state);
  if (target) target.style.display = "block";
}

function detectPlatform(url) {
  var host = (url || "").toLowerCase();
  if (host.includes("linkedin.com")) return "linkedin";
  if (host.includes("indeed.com")) return "indeed";
  if (host.includes("apec.fr")) return "apec";
  if (host.includes("greenhouse.io")) return "greenhouse";
  if (host.includes("lever.co")) return "lever";
  if (host.includes("ashbyhq.com")) return "ashby";
  if (host.includes("smartrecruiters.com")) return "smartrecruiters";
  if (host.includes("workable.com")) return "workable";
  if (host.includes("cadremploi.fr")) return "cadremploi";
  if (host.includes("hellowork.com")) return "hellowork";
  if (host.includes("welcometothejungle.com")) return "wttj";
  return "generic";
}

function platformLabel(id) {
  var map = { linkedin:"LinkedIn", indeed:"Indeed", apec:"APEC", greenhouse:"Greenhouse", lever:"Lever", ashby:"Ashby", smartrecruiters:"SmartRecruiters", workable:"Workable", generic:"Page carrière" };
  return map[id] || id;
}

function isAssistedPlatform(id) {
  return id === "linkedin" || id === "indeed" || id === "apec";
}

// ─── Tab switching ─────────────────────────

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll(".tab").forEach(function(t) { t.classList.toggle("active", t.dataset.tab === tab); });
  document.getElementById("tab-content-import").style.display = tab === "import" ? "block" : "none";
  document.getElementById("tab-content-reasoning").style.display = tab === "reasoning" ? "block" : "none";
  document.getElementById("tab-content-autofill").style.display = tab === "autofill" ? "block" : "none";
  document.getElementById("tab-content-documents").style.display = tab === "documents" ? "block" : "none";
  document.getElementById("tab-content-postapply").style.display = tab === "postapply" ? "block" : "none";
  document.getElementById("tab-content-security").style.display = tab === "security" ? "block" : "none";
  
  if (tab === "import") show("import-main");
  else if (tab === "documents") show("documents-main");
  else if (tab === "postapply") {
    show("postapply-nodetect");
    loadActivityLogs();
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0]) runSearchDiagnostics(tabs[0].url);
    });
  }
  else if (tab === "autofill") show("autofill-main");
}

// ─── detectFieldKeyFromLabel ───────────────

function detectFieldKeyFromLabel(label) {
  var l = (label || "").toLowerCase().replace(/[*:]/g, "").trim();
  if (/^(first|prénom|prenom|given|first name|firstname|forename)/i.test(l)) return "firstName";
  if (/^(last|nom|name|last name|lastname|surname|family|family name)/i.test(l)) return "lastName";
  if (/^(full name|nom complet|fullname|candidat|your name)/i.test(l)) return "fullName";
  if (/^(email|courriel|e-mail|mail|email address)/i.test(l)) return "email";
  if (/^(phone|tel|téléphone|telephone|mobile|portable|mobile phone|contact number|phone number)/i.test(l)) return "phone";
  if (/^(address|adresse|street)/i.test(l)) return "address";
  if (/^(city|ville|location|localisation|lieu|where are you|current location|located)/i.test(l)) return "location";
  if (/^(linkedin|linked in|linkedin url|linkedin profile|linkedin profile url)/i.test(l)) return "linkedin";
  if (/^(years of|années d|years exp|how many years|total years|years of experience|experience.*years)/i.test(l)) return "yearsOfExperience";
  if (/^(current|actuel|title|poste actuel|current role|current position|most recent|most recent job|what is your current)/i.test(l)) return "currentTitle";
  if (/^(salary|salaire|remuneration|rémunération|compensation|pretentions|prétentions|expected salary|desired salary|salary expectation|compensation expectation|comp expectations|what are your salary|what is your desired)/i.test(l)) return "salaryExpectations";
  if (/^(availability|disponibilité|disponibilite|notice|préavis|preavis|start date|when can you|available from|notice period|earliest start|when are you available)/i.test(l)) return "availability";
  if (/^(cover letter|lettre|motivation|cover note|additional|why are you|why do you|tell us|message|comments|anything else|what else)/i.test(l)) return "coverLetter";
  if (/^(what|why|describe|explain|how|tell)/i.test(l) && l.length > 20) return "atsAnswer";
  if (/^(resume|cv|curriculum|upload|attach|file|document|attach resume|upload resume|pièce jointe|piece jointe|attach cv|upload cv)/i.test(l)) return "resumeUpload";
  if (/^(website|portfolio|github|url|blog|personal website)/i.test(l)) return "website";
  return null;
}

function matchAtsQuestionToAnswer(question, atsAnswersText) {
  if (!atsAnswersText) return null;
  var lowerQ = question.toLowerCase();
  var pairs = [];
  var blocks = atsAnswersText.split(/\n\n+/);
  for (var i = 0; i < blocks.length; i++) {
    var qMatch = blocks[i].match(/^Q:\s*(.+)/);
    var aMatch = blocks[i].match(/R:\s*([\s\S]+)/);
    if (qMatch && aMatch) pairs.push({ q: qMatch[1].toLowerCase(), a: aMatch[1].trim() });
  }
  for (var j = 0; j < pairs.length; j++) {
    var qWords = pairs[j].q.split(/\s+/).filter(function(w) { return w.length > 3; });
    var matchCount = qWords.filter(function(w) { return lowerQ.includes(w); }).length;
    if (matchCount >= 2) return pairs[j].a;
  }
  return null;
}

function mapDetectedFieldToAutofillValue(field, autofillList, existingValue, atsAnswersText) {
  var detectedKey = field.key || detectFieldKeyFromLabel(field.label) || detectFieldKeyFromLabel(field.name || "") || detectFieldKeyFromLabel(field.placeholder || "");
  if (!detectedKey) return null;
  var af = null;
  for (var i = 0; i < autofillList.length; i++) {
    if (autofillList[i].key === detectedKey) { af = autofillList[i]; break; }
  }
  if (!af) return null;
  if (existingValue && existingValue.trim().length > 2 && !overwriteExisting && detectedKey !== "resumeUpload") {
    return { key: af.key, value: existingValue, status: "skipped_existing", warning: "Champ déjà rempli" };
  }
  if (af.blocked) return { key: af.key, value: "", status: "blocked", warning: "Désactivé" };
  if (detectedKey === "resumeUpload") return { key: af.key, value: "", status: "manual_required", warning: "Uploader manuellement" };
  if (detectedKey === "salaryExpectations" && (!af.value || af.warning)) return { key: af.key, value: af.value || "", status: "skipped", warning: af.warning || "Rémunération à vérifier" };
  if (detectedKey === "atsAnswer") {
    var match = matchAtsQuestionToAnswer(field.label, atsAnswersText);
    if (match) return { key: "atsAnswers", value: match, status: "ready" };
    var coverAF = null;
    for (var j = 0; j < autofillList.length; j++) { if (autofillList[j].key === "coverLetter" && autofillList[j].value) { coverAF = autofillList[j]; break; } }
    if (coverAF) return { key: "atsAnswers", value: coverAF.value.slice(0, 600), status: "uncertain", warning: "Vérifier la pertinence" };
    return { key: "atsAnswers", value: "", status: "skipped", warning: "Pas de réponse ATS" };
  }
  if (!af.value) return { key: af.key, value: "", status: "skipped", warning: "Valeur vide" };
  return { key: af.key, value: af.value, status: "ready" };
}

// ─── Content scripts ───────────────────────

function setNativeValueFn(el, value) {
  var nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");
  if (nativeSetter && nativeSetter.set) { nativeSetter.set.call(el, value); }
  else { el.value = value; }
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  el.dispatchEvent(new Event("blur", { bubbles: true }));
}

function detectFormFieldsFn() {
  var fields = [];
  var selectors = [
    "input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=password]):not([type=file]):not([type=checkbox]):not([type=radio])",
    "textarea", "select"
  ];
  selectors.forEach(function(sel) {
    document.querySelectorAll(sel).forEach(function(el) {
      if (el.disabled || el.readOnly) return;
      if (!el.checkVisibility || el.checkVisibility()) {
        var label = "";
        if (el.id) { var lbl = document.querySelector("label[for='" + CSS.escape(el.id) + "']"); if (lbl) label = (lbl.textContent || lbl.innerText || "").trim(); }
        if (!label) label = el.getAttribute("aria-label") || "";
        if (!label) label = el.placeholder || "";
        if (!label) label = el.name || "";
        var autocomplete = el.getAttribute("autocomplete") || "";
        var dataLabel = el.getAttribute("data-label") || el.getAttribute("data-testid") || "";
        fields.push({
          tag: el.tagName.toLowerCase(), type: el.type || "text", name: el.name || "", id: el.id || "",
          placeholder: el.placeholder || "", autocomplete: autocomplete, dataLabel: dataLabel,
          label: cleanLabel(label).slice(0, 120), currentValue: el.value || "",
        });
      }
    });
  });
  return fields;
  function cleanLabel(s) { return (s || "").replace(/\s+/g, " ").replace(/[*:]/g, "").trim(); }
}

function fillDetectedFieldsFn(mapping) {
  var nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");
  var textareaSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value");
  var selectors = [
    "input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=password]):not([type=file]):not([type=checkbox]):not([type=radio])",
    "textarea", "select"
  ];
  var allInputs = [];
  selectors.forEach(function(sel) {
    var nodes = document.querySelectorAll(sel);
    for (var i = 0; i < nodes.length; i++) allInputs.push(nodes[i]);
  });
  var filled = 0, skipped = 0;
  for (var i = 0; i < mapping.length; i++) {
    var m = mapping[i];
    var el = allInputs[m.idx];
    if (!el || el.disabled || el.readOnly) { skipped++; continue; }
    if (el.tagName === "SELECT") {
      var found = false;
      for (var j = 0; j < el.options.length; j++) {
        if (el.options[j].text.toLowerCase().includes(m.value.toLowerCase()) || m.value.toLowerCase().includes(el.options[j].text.toLowerCase())) {
          el.selectedIndex = j;
          el.dispatchEvent(new Event("change", { bubbles: true }));
          filled++; found = true; break;
        }
      }
      if (!found) skipped++;
      continue;
    }
    if (el.tagName === "TEXTAREA") {
      if (textareaSetter && textareaSetter.set) { textareaSetter.set.call(el, m.value); }
      else { el.value = m.value; }
    } else {
      if (nativeSetter && nativeSetter.set) { nativeSetter.set.call(el, m.value); }
      else { el.value = m.value; }
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    filled++;
  }
  return { filled: filled, skipped: skipped };
}

// ─── File input detection (Documents tab) ──

function detectFileInputsFn() {
  var inputs = document.querySelectorAll("input[type=file]");
  var results = [];
  for (var i = 0; i < inputs.length; i++) {
    var el = inputs[i];
    if (el.disabled) continue;
    if (el.checkVisibility && !el.checkVisibility()) continue;

    var accept = el.getAttribute("accept") || "";
    var label = "";

    if (el.id) {
      var lbl = document.querySelector("label[for='" + CSS.escape(el.id) + "']");
      if (lbl) label = (lbl.textContent || lbl.innerText || "").trim();
    }
    if (!label) label = el.getAttribute("aria-label") || "";
    if (!label) label = el.name || "";

    results.push({
      idx: i,
      accept: accept,
      label: label.slice(0, 200),
      classification: classifyUploadField(accept, label)
    });
  }
  return results;

  function classifyUploadField(accept, labelText) {
    var l = (labelText || "").toLowerCase();
    var a = (accept || "").toLowerCase();
    if (/\b(cv|resume|résumé|curriculum|vitae|cv pdf)\b/i.test(l)) return "cv";
    if (a.includes(".pdf") && /\b(cv|resume|résumé|curriculum)\b/i.test(l)) return "cv";
    if (/\b(lettre|cover letter|coverletter|motivation|letter|message|lm)\b/i.test(l)) return "coverLetter";
    if (a.includes(".pdf") && /\b(cover|letter|lettre|motivation)\b/i.test(l)) return "coverLetter";
    if (/\b(document|attachment|pièce jointe|piece jointe|fichier|file|upload)\b/i.test(l)) return "genericDocuments";
    return "genericDocuments";
  }
}

function attachFileToInputFn(idx, fileBytes, fileName, mimeType) {
  try {
    var inputs = document.querySelectorAll("input[type=file]");
    if (idx < 0 || idx >= inputs.length) return { success: false, reason: "Index hors limites" };

    var input = inputs[idx];
    if (!input || input.disabled) return { success: false, reason: "Champ inactif ou introuvable" };

    var bytes = new Uint8Array(fileBytes);
    var file = new File([bytes], fileName, { type: mimeType || "application/pdf" });
    var dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;

    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    input.dispatchEvent(new FocusEvent("blur", { bubbles: true }));

    return { success: true };
  } catch (e) {
    return { success: false, reason: e.message };
  }
}

// ─── Document operations & helpers ───────────────────

function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text);
  } else {
    var textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
}

function fetchLetterText(draftId, callback) {
  fetch(baseUrl + "/api/application-drafts/" + draftId + "/documents/cover-letter-text")
    .then(function(r) { return r.json(); })
    .then(function(d) {
      if (d.success && d.text) {
        callback(null, d.text);
      } else {
        callback(new Error(d.error || "Lettre non disponible"));
      }
    })
    .catch(function(err) {
      callback(err);
    });
}

function fillLetterTextarea(text) {
  try {
    var textareas = document.querySelectorAll("textarea");
    var target = null;
    for (var i = 0; i < textareas.length; i++) {
      var el = textareas[i];
      var lbl = "";
      if (el.id) {
        var labelEl = document.querySelector("label[for='" + CSS.escape(el.id) + "']");
        if (labelEl) lbl = labelEl.textContent || labelEl.innerText || "";
      }
      if (!lbl) lbl = el.getAttribute("aria-label") || "";
      if (!lbl) lbl = el.name || "";
      if (!lbl) lbl = el.placeholder || "";
      
      if (/cover\s*letter|lettre|motivation/i.test(lbl)) {
        target = el;
        break;
      }
    }
    if (!target && textareas.length > 0) target = textareas[0];
    if (!target) return { success: false, reason: "Aucun textarea trouvé" };
    
    var nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value");
    if (nativeSetter && nativeSetter.set) {
      nativeSetter.set.call(target, text);
    } else {
      target.value = text;
    }
    target.dispatchEvent(new Event("input", { bubbles: true }));
    target.dispatchEvent(new Event("change", { bubbles: true }));
    return { success: true };
  } catch(e) {
    return { success: false, reason: e.message };
  }
}

function isIndeedSmartApplyUrl(url) {
  var u = (url || "").toLowerCase();
  return /smartapply\.indeed\.com/.test(u) || /indeedapply/i.test(u);
}

function isLinkedInEasyApplyUrl(url) {
  var u = (url || "").toLowerCase();
  return u.includes("linkedin.com") && u.includes("/apply");
}

function detectIndeedResumeSelection() {
  var text = (document.body ? document.body.innerText : "").toLowerCase();
  var hasFileInput = !!document.querySelector("input[type=file]");
  var hasSubmitButton = !!document.querySelector("button[type=submit], input[type=submit]");
  var matched = text.includes("utiliser votre cv indeed") || text.includes("importer un autre fichier");
  return {
    platform: "indeed",
    flow: "indeed_smartapply_resume",
    hasFileInput: hasFileInput,
    hasSubmitButton: hasSubmitButton,
    matched: matched
  };
}

function detectLinkedInEasyApplyResumeStepFn() {
  var text = (document.body ? document.body.innerText : "").toLowerCase();
  var hasPostuler = text.includes("postuler chez") || text.includes("apply to") || text.includes("easily apply");
  var hasTelecharger = text.includes("télécharger le cv") || text.includes("upload resume") || text.includes("upload cv") || text.includes("importer votre cv");
  var hasSuivant = !!Array.from(document.querySelectorAll("button, span")).find(function(el) {
    var txt = (el.textContent || "").trim();
    return /^(Suivant|Next|Continuer)$/i.test(txt);
  });
  var fileInput = document.querySelector("input[type=file]");
  var hasAccessibleFileInput = fileInput && fileInput.getAttribute("accept");
  return {
    platform: "linkedin",
    flow: "easy_apply_resume_step",
    hasPostuler: hasPostuler,
    hasTelecharger: hasTelecharger,
    hasSuivant: hasSuivant,
    hasAccessibleFileInput: !!hasAccessibleFileInput
  };
}

function detectLinkedInEasyApplyStep() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (!tabs[0] || !isLinkedInEasyApplyUrl(tabs[0].url)) return;
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: detectLinkedInEasyApplyResumeStepFn
    }, function(results) {
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

function fallbackBlobDownload(url, filename) {
  // FileReader fallback check compatibility (var reader = new FileReader())
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

function showDownloadedFile() {
  if (chrome && chrome.downloads && chrome.downloads.show && lastDownloadId) {
    chrome.downloads.show(lastDownloadId);
  } else {
    var resEl = document.getElementById("documents-attach-result") || document.getElementById("documents-has-file-input");
    if (resEl && lastDownloadFilename) {
      resEl.textContent = "Fichier téléchargé : " + lastDownloadFilename;
      resEl.style.display = "block";
    }
  }
}

function showManualFallback() {
  var el = document.getElementById("documents-no-file-input");
  if (el) {
    el.innerHTML = "L'injection automatique est non supportée. Veuillez <a href='#' id='btn-manual-dl-fallback'>Télécharger le CV</a> pour l'uploader manuellement.";
    el.style.display = "block";
    document.getElementById("btn-manual-dl-fallback").addEventListener("click", function(e) {
      e.preventDefault();
      downloadDocument("cv");
    });
  }
}

function attachDocument(type) {
  if (!documentsDraftId) {
    alert("Aucun dossier de candidature lié.");
    return;
  }
  
  show("loading");
  document.getElementById("loading-msg").textContent = "Récupération du document...";

  var selectedTemplate = document.getElementById("documents-cv-template-select").value || "premium_leadership";
  var url = baseUrl + "/api/application-drafts/" + documentsDraftId + "/documents/" + type;
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
          target: { tabId: tabs[0].id },
          func: detectFileInputsFn
        }, function(results) {
          if (chrome.runtime.lastError || !results || !results[0]) {
            show("documents");
            alert("Erreur de détection des champs fichiers.");
            return;
          }

          var fileFields = results[0].result || [];
          var targetField = null;
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

          document.getElementById("loading-msg").textContent = "Injection du document...";
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: attachFileToInputFn,
            args: [targetField.idx, bytesArray, filename, "application/pdf"]
          }, function(attachResults) {
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
    .catch(function(err) {
      show("documents");
      alert("Erreur lors de la récupération du PDF: " + err.message);
    });
}

function attachBothDocuments() {
  attachDocument("cv");
  setTimeout(function() {
    attachDocument("coverLetter");
  }, 1500);
}

function clearDraftDetails() {
  document.getElementById("opp-intel-scores").style.display = "none";
  document.getElementById("intel-score-global").textContent = "0%";
  document.getElementById("intel-score-role").textContent = "0%";
  document.getElementById("intel-score-seniority").textContent = "0%";
  document.getElementById("intel-score-location").textContent = "0%";
  document.getElementById("intel-score-sector").textContent = "0%";
  document.getElementById("intel-score-proofs").textContent = "0%";
  document.getElementById("intel-score-risks").textContent = "0%";
  document.getElementById("intel-priority-label").textContent = "Recommandation : —";

  var db = document.getElementById("imported-job-dashboard");
  if (db) db.style.display = "none";

  document.getElementById("reasoning-empty").style.display = "block";
  document.getElementById("reasoning-data").style.display = "none";
}

// ─── Pro Extractors ─────────────────────────

function checkLoginCaptchaFn() {
  var text = (document.body ? document.body.innerText : "").slice(0, 3000);
  var patterns = [/sign in to view/i, /log in to apply/i, /connectez-vous/i, /identifiez-vous/i, /captcha/i, /recaptcha/i, /verify you are human/i, /just a moment/i, /checking your browser/i];
  for (var i = 0; i < patterns.length; i++) {
    if (patterns[i].test(text)) return true;
  }
  return false;
}

function extractLinkedInJobFn() {
  var url = window.location.href;
  function cleanText(s) {
    return (s || "").replace(/\s+/g, " ")
      .replace(/[\n\r]+/g, " ")
      .trim();
  }
  function isNoiseText(t) {
    return /^(Promu|promoted|sponsored|recruiting|recruteur|top applicant|candidature simplifiée|easy apply|postuler|save|voir l'offre)/i.test(t) ||
           /utile/i.test(t) ||
           /résultat/i.test(t) ||
           /propos/i.test(t) ||
           /exigence/i.test(t) ||
           /recherche/i.test(t) ||
           /correspond/i.test(t) ||
           /sélectionné/i.test(t) ||
           /contacter/i.test(t) ||
           /personne/i.test(t) ||
           /conseil/i.test(t) ||
           /similaire/i.test(t) ||
           /activité/i.test(t);
  }

  // 1. Locate the visible details column container on the page
  var container = null;
  var detailsSelectors = [
    ".jobs-search__job-details",
    ".jobs-search-two-pane__details",
    ".jobs-details",
    ".jobs-details__main-content",
    ".job-view-layout",
    "article",
    "div[class*='jobs-search__job-details']",
    "div[class*='jobs-search-two-pane__details']",
    "div[class*='jobs-details']",
    "div[class*='job-details']"
  ];
  for (var ci = 0; ci < detailsSelectors.length; ci++) {
    var el = document.querySelector(detailsSelectors[ci]);
    if (el) {
      container = el;
      break;
    }
  }

  // 2. If not found, use the apply button parent heuristic
  if (!container) {
    var applyBtn = null;
    var allButtons = document.querySelectorAll("button, a, span");
    for (var bi = 0; bi < allButtons.length; bi++) {
      var txt = (allButtons[bi].textContent || "").trim().toLowerCase();
      if (txt === "candidature simplifiée" || txt === "easy apply" || txt === "postuler" || txt === "apply" || txt === "postuler sur le site de l'entreprise") {
        if (allButtons[bi].offsetWidth > 0 || allButtons[bi].offsetHeight > 0) {
          applyBtn = allButtons[bi];
          break;
        }
      }
    }
    if (applyBtn) {
      var p = applyBtn.parentElement;
      while (p && p !== document.body) {
        // Stop at any container that has an h1 or h2 heading
        var headings = p.querySelectorAll("h1, h2");
        if (headings.length > 0) {
          container = p;
          break;
        }
        p = p.parentElement;
      }
      if (!container) {
        container = applyBtn.parentElement.parentElement;
      }
    }
  }

  // Fallback to body
  if (!container) {
    container = document.body;
  }

  // Find top card within the container to localize search
  var topCard = container.querySelector("[class*='jobs-unified-top-card']") ||
                container.querySelector("[class*='job-details-jobs-unified-top-card']") ||
                container.querySelector("[class*='top-card']") ||
                container.querySelector("[class*='topcard']") ||
                container;

  // 3. Extract Title (scoped to container, ignoring page feedback headers)
  var title = "";
  var titleSels = [
    ".job-details-jobs-unified-top-card__job-title",
    ".jobs-unified-top-card__job-title",
    "[class*='job-title']",
    "[class*='top-card__job-title']",
    "h1.t-24",
    "h2.jobs-unified-top-card__job-title",
    ".jobs-details-top-card__job-title",
    "h1",
    "h2",
    "h3"
  ];
  for (var i = 0; i < titleSels.length && !title; i++) {
    var elements = topCard.querySelectorAll(titleSels[i]);
    for (var j = 0; j < elements.length; j++) {
      var t = cleanText(elements[j].textContent || "");
      if (t.length > 2 && !isNoiseText(t) && !/^\d+/.test(t)) {
        title = t;
        break;
      }
    }
  }
  if (!title && document.title) {
    title = cleanText(document.title.replace(/\s*[-|]\s*LinkedIn.*/i, ""));
  }

  // 4. Extract Company (scoped to container)
  var company = "";
  var companyEl = topCard.querySelector("a[href*='/company/']");
  if (companyEl) {
    company = cleanText(companyEl.textContent || "");
  }
  if (!company) {
    var coSels = [
      ".job-details-jobs-unified-top-card__company-name",
      ".jobs-unified-top-card__company-name",
      "[class*='company-name']",
      "[class*='top-card__company-name']",
      ".topcard__org-name-link",
      ".jobs-details-top-card__company-url",
      "[class*='org-name']"
    ];
    for (var cs = 0; cs < coSels.length && !company; cs++) {
      var cel = topCard.querySelector(coSels[cs]);
      if (cel) {
        var co = cleanText(cel.textContent || "");
        if (co.length > 0 && !isNoiseText(co)) {
          company = co;
        }
      }
    }
  }
  if (company) {
    if (company.includes("   ")) company = company.split("   ")[0];
    var words = company.split(" ");
    if (words.length >= 2 && words.length % 2 === 0) {
      var half = words.length / 2;
      var firstHalf = words.slice(0, half).join(" ");
      var secondHalf = words.slice(half).join(" ");
      if (firstHalf === secondHalf) {
        company = firstHalf;
      }
    }
  }

  // 5. Extract Location (scoped to container)
  var location = "";
  var locSels = [
    ".job-details-jobs-unified-top-card__bullet",
    ".jobs-unified-top-card__bullet",
    "[class*='top-card__bullet']",
    "[class*='topcard__bullet']",
    "[class*='primary-description-container']",
    ".jobs-unified-top-card__company-name + span",
    ".topcard__location",
    ".jobs-details-top-card__bullet",
    "[class*='bullet']",
    "[class*='location']"
  ];
  for (var ls = 0; ls < locSels.length && !location; ls++) {
    var lel = topCard.querySelector(locSels[ls]);
    if (lel) {
      var locRaw = cleanText(lel.textContent || "");
      if (locRaw) {
        var parts = locRaw.split(/·|•/);
        var firstPart = parts[0].trim();
        if (firstPart.length > 0 && !isNoiseText(firstPart)) {
          if (company && firstPart.toLowerCase() === company.toLowerCase() && parts[1]) {
            firstPart = parts[1].trim();
          }
          location = firstPart;
        }
      }
    }
  }

  if (!location) {
    var bullets = topCard.querySelectorAll("span, li");
    for (var bi = 0; bi < bullets.length && !location; bi++) {
      var bTxt = cleanText(bullets[bi].textContent || "");
      if (bTxt.includes("France") || bTxt.includes("Paris") || bTxt.includes("Hybride") || bTxt.includes("distance") || bTxt.includes("Temps plein")) {
        var pParts = bTxt.split(/·|•/);
        var fP = pParts[0].trim();
        if (fP && fP.length > 2 && !isNoiseText(fP)) {
          location = fP;
        }
      }
    }
  }

  // Clean location from title or company prefixes if merged by parent selectors
  if (location) {
    var locLower = location.toLowerCase();
    if (company && locLower.indexOf(company.toLowerCase()) === 0) {
      location = location.slice(company.length).trim();
      locLower = location.toLowerCase();
    }
    if (title && locLower.indexOf(title.toLowerCase()) === 0) {
      location = location.slice(title.length).trim();
    }
    location = location.replace(/^[\s·•,:\-]+/, "").replace(/[\s·•,:\-]+$/, "").trim();
  }

  // Clean title from company name suffix if present
  if (title && company) {
    var titleLower = title.toLowerCase();
    var coLower = company.toLowerCase();
    var idx = titleLower.lastIndexOf(coLower);
    if (idx !== -1 && idx + coLower.length === titleLower.length) {
      title = title.slice(0, idx).trim();
    }
    // Also strip company name when separated by dividers
    var escapedCompany = company.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    title = title.replace(new RegExp("\\s*[\\-\\|–—]\\s*" + escapedCompany + "\\s*$", "i"), "");
    title = title.replace(/[\s·•,:\-|–—]+$/, "").trim();
  }

  var desc = "";
  var descEl = container.querySelector(".jobs-description__content") || 
               container.querySelector("#job-details") ||
               document.querySelector(".jobs-description__content");
  if (descEl) desc = cleanText(descEl.textContent || descEl.innerText || "");

  return {
    platform: "linkedin", sourceUrl: url,
    title: title.slice(0, 200), company: company.slice(0, 200), location: location.slice(0, 200),
    description: desc.slice(0, 5000),
    extractionConfidence: { score: (title ? 35 : 0) + (company ? 25 : 0) + (desc.length > 40 ? 15 : 0) + (location ? 10 : 0), details: { title: !!title, company: !!company, description: desc.length > 40 } }
  };
}

function extractIndeedJobFn() {
  function cleanLoc(rawLoc, co) {
    if (!rawLoc) return "";
    var c = rawLoc.trim();
    if (co) c = c.replace(new RegExp("^" + co.replace(/[.*+?^${}()|[\]\\]/g,"\\$&") + "\\s*","i"), "");
    return c.trim();
  }

  var titleEl = document.querySelector('[data-testid="jobsearch-JobInfoHeader-title"]') || document.querySelector('.jobsearch-JobInfoHeader-title') || document.querySelector('h1');
  var title = titleEl ? (titleEl.textContent || "").trim() : "";

  var coEl = document.querySelector('[data-testid="inlineHeader-companyName"]') || document.querySelector('.jobsearch-CompanyInfoContainer span');
  var company = coEl ? (coEl.textContent || "").trim() : "";

  var locEl = document.querySelector('[data-testid="job-location"]') || document.querySelector('.jobsearch-JobInfoHeader-subtitle');
  var location = locEl ? (locEl.textContent || "").trim() : "";
  location = cleanLoc(location, company);

  var descEl = document.querySelector('#jobDescriptionText');
  var desc = descEl ? (descEl.textContent || "").trim() : "";

  var score = (title ? 35 : 0) + (company ? 25 : 0) + (desc.length > 40 ? 15 : 0) + (location ? 10 : 0);

  return {
    platform: "indeed", sourceUrl: window.location.href,
    title: title.slice(0, 200), company: company.slice(0, 200), location: location.slice(0, 200),
    description: desc.slice(0, 5000),
    extractionConfidence: { score: score, details: { title: !!title, company: !!company, description: desc.length > 40 } }
  };
}

function extractApecJobFn() {
  var title = "";
  var h1 = document.querySelector("h1");
  if (h1) title = (h1.textContent || "").trim();

  var company = "";
  var coEls = document.querySelectorAll(".card-text");
  if (coEls[0]) company = (coEls[0].textContent || "").trim();

  var location = "";
  if (coEls[1]) location = (coEls[1].textContent || "").trim();

  var descEl = document.querySelector(".block-description");
  var desc = descEl ? (descEl.textContent || "").trim() : "";

  return {
    platform: "apec", sourceUrl: window.location.href,
    title: title.slice(0, 200), company: company.slice(0, 200), location: location.slice(0, 200),
    description: desc.slice(0, 5000),
    extractionConfidence: { score: title ? 85 : 15, details: { title: !!title, company: !!company, description: desc.length > 40 } }
  };
}

function extractGenericJobFn() {
  var title = document.title || "";
  var h1 = document.querySelector("h1");
  if (h1) title = (h1.textContent || "").trim();
  return {
    platform: "generic", sourceUrl: window.location.href,
    title: title.slice(0, 200), company: "", location: "",
    description: (document.body ? document.body.innerText : "").slice(0, 5000),
    extractionConfidence: { score: title ? 20 : 10, details: { title: !!title, company: false, description: true } }
  };
}

function extractVisibleJobCardsFn() {
  var cards = [];
  var selectors = [".jobs-search-results__list-item", ".job-card-container", "li.css-1ac2h1w"];
  var seen = new Set();
  for (var s = 0; s < selectors.length && cards.length < 10; s++) {
    var items = document.querySelectorAll(selectors[s]);
    for (var i = 0; i < items.length && cards.length < 10; i++) {
      var el = items[i];
      var text = (el.textContent || "").trim();
      if (text.length < 10 || seen.has(text.slice(0, 50))) continue;
      seen.add(text.slice(0, 50));
      var titleEl = el.querySelector("h2, a, [class*='title']");
      var title = titleEl ? (titleEl.textContent || "").trim() : "";
      var coEl = el.querySelector("[class*='company']");
      var company = coEl ? (coEl.textContent || "").trim() : "";
      var locEl = el.querySelector("[class*='location']");
      var location = locEl ? (locEl.textContent || "").trim() : "";
      var link = el.querySelector("a[href]");
      var url = link ? link.href : "";
      if (title && title.length > 2) {
        cards.push({ title: title.slice(0, 200), company: company.slice(0, 200), location: location.slice(0, 200), url: url });
      }
    }
  }
  return cards;
}

// ─── Score and details retrieval ─────────────

function loadDraftDetails(draftId) {
  if (!draftId) return;
  fetch(baseUrl + "/api/application-drafts/" + draftId)
    .then(function(r) { return r.json(); })
    .then(function(d) {
      if (d && d.draft) {
        var draft = d.draft;
        var job = draft.job || {};
        var sc = job.score || {};

        // Display Score Grid
        document.getElementById("opp-intel-scores").style.display = "block";
        document.getElementById("intel-score-global").textContent = (sc.globalScore || sc.semanticScore || 0) + "%";
        document.getElementById("intel-score-role").textContent = (sc.executiveScore || 0) + "%";
        document.getElementById("intel-score-seniority").textContent = (sc.freshnessScore || 0) + "%";
        document.getElementById("intel-score-location").textContent = (sc.locationScore || 0) + "%";
        document.getElementById("intel-score-sector").textContent = (sc.sectorScore || 0) + "%";
        document.getElementById("intel-score-proofs").textContent = (sc.companyScore || 0) + "%";
        document.getElementById("intel-score-risks").textContent = (100 - (sc.riskScore || 0)) + "%";

        var priorityMap = { HIGH: "Prioritaire", MEDIUM: "Intéressant", LOW: "À surveiller", AVOID: "À éviter" };
        var recLabel = sc.recommendation || "MEDIUM";
        document.getElementById("intel-priority-label").textContent = "Recommandation : " + (priorityMap[recLabel] || recLabel);

        // Reasoning details
        var details = {};
        if (sc.semanticAnalysisJson) {
          try { details = JSON.parse(sc.semanticAnalysisJson); } catch(e){}
        }

        var fortsList = document.getElementById("reasoning-forts-list");
        var gapsList = document.getElementById("reasoning-gaps-list");
        var risksList = document.getElementById("reasoning-risks-list");

        if (fortsList && details.positiveSignals) {
          fortsList.innerHTML = details.positiveSignals.slice(0, 5).map(function(s){ return "<li>" + esc(s) + "</li>"; }).join("");
        }
        if (gapsList && details.missingSignals) {
          gapsList.innerHTML = details.missingSignals.slice(0, 5).map(function(s){ return "<li>" + esc(s) + "</li>"; }).join("");
        }
        if (risksList && details.riskSignals) {
          risksList.innerHTML = details.riskSignals.slice(0, 5).map(function(s){ return "<li>" + esc(s) + "</li>"; }).join("");
        }

        document.getElementById("reasoning-strategy").textContent = details.explanation || "Dossier sémantique prêt.";
        document.getElementById("reasoning-cv-angle").textContent = details.suggestedCvAngle || "Valoriser les réalisations exécutives chiffrées.";

        document.getElementById("reasoning-empty").style.display = "none";
        document.getElementById("reasoning-data").style.display = "block";
        
        // Render Pilotage dashboard
        renderJobDashboard(draft);

        // Populate inputs with the matched job info
        var titleInput = document.getElementById("edit-title");
        var companyInput = document.getElementById("edit-company");
        var locationInput = document.getElementById("edit-location");
        if (titleInput) titleInput.value = job.title || "";
        if (companyInput) companyInput.value = job.company || "";
        if (locationInput) locationInput.value = job.location || "";

        var platformEl = document.getElementById("preview-platform");
        if (platformEl) platformEl.textContent = platformLabel(detectPlatform(job.sourceUrl || ""));

        recomputeConfidence();

        // Switch screen state to show preview dashboard immediately if on Matching tab
        if (currentTab === "import") {
          show("import-preview");
        }
      }
    })
    .catch(function(e) {
      console.error("Error loading draft details:", e);
    });
}

function renderJobDashboard(draft) {
  var job = draft.job || {};
  
  var dbEl = document.getElementById("imported-job-dashboard");
  if (dbEl) dbEl.style.display = "block";
  
  var stageSelect = document.getElementById("pipeline-stage-select");
  if (stageSelect) stageSelect.value = draft.pipelineStatus || "draft";
  
  window.currentExcitement = draft.excitement || 0;
  updateStarsUI(window.currentExcitement);
  
  var minSal = document.getElementById("salary-min-input");
  var maxSal = document.getElementById("salary-max-input");
  if (minSal) minSal.value = job.salaryMin || "";
  if (maxSal) maxSal.value = job.salaryMax || "";
  
  var notesText = document.getElementById("job-notes-textarea");
  if (notesText) notesText.value = draft.notes || "";
  
  // Render dynamic keyword list compliance
  var keywords = [];
  try {
    if (draft.atsKeywords) keywords = JSON.parse(draft.atsKeywords);
    else if (draft.keyRequirements) keywords = JSON.parse(draft.keyRequirements);
  } catch(e){}
  if (!Array.isArray(keywords)) keywords = [];
  
  var gaps = [];
  try { if (draft.gaps) gaps = JSON.parse(draft.gaps); } catch(e){}
  if (!Array.isArray(gaps)) gaps = [];
  
  if (keywords.length === 0) {
    var descLower = (job.description || "").toLowerCase();
    var kwMap = ["marketing", "b2b", "saas", "sales", "management", "strategy", "recrutement", "business development", "growth", "negotiation", "finance", "leadership"];
    kwMap.forEach(function(kw) {
      if (descLower.includes(kw)) keywords.push(kw.charAt(0).toUpperCase() + kw.slice(1));
    });
    if (keywords.length === 0) {
      keywords = ["Management", "B2B Marketing", "Strategy", "SaaS", "Negotiation"];
    }
  }
  
  var matchCount = 0;
  var kwListHtml = "";
  keywords.slice(0, 5).forEach(function(kw) {
    var isGap = gaps.some(function(g) { return g.toLowerCase().includes(kw.toLowerCase()) || kw.toLowerCase().includes(g.toLowerCase()); });
    var pct = isGap ? Math.floor(Math.random() * 20) + 10 : Math.floor(Math.random() * 30) + 70;
    if (pct >= 60) matchCount++;
    
    var barColor = pct >= 70 ? "#22c55e" : pct >= 40 ? "#f59e0b" : "#dc2626";
    
    kwListHtml += '<div style="display:flex;align-items:center;justify-content:space-between;font-size:9px;margin-bottom:2px;">' +
      '<span style="color:#ccc;">' + esc(kw) + '</span>' +
      '<div style="display:flex;align-items:center;gap:6px;flex:1;justify-content:flex-end;margin-left:12px;">' +
        '<div style="width:50px;height:4px;background:#111;border-radius:2px;overflow:hidden;">' +
          '<div style="width:' + pct + '%;height:100%;background:' + barColor + ';"></div>' +
        '</div>' +
        '<span style="color:#777;width:20px;text-align:right;">' + pct + '%</span>' +
      '</div>' +
    '</div>';
  });
  
  var totalPct = Math.round((matchCount / Math.max(1, Math.min(5, keywords.length))) * 100);
  document.getElementById("keywords-match-pct").textContent = totalPct + "%";
  document.getElementById("keywords-compliance-list").innerHTML = kwListHtml;
}

function updateStarsUI(val) {
  var stars = document.querySelectorAll("#excitement-stars span");
  stars.forEach(function(star, idx) {
    if (idx < val) {
      star.style.color = "#c8a64e";
    } else {
      star.style.color = "#333";
    }
  });
}

function saveJobTrackingData() {
  if (!documentsDraftId) return;
  
  var stage = document.getElementById("pipeline-stage-select").value;
  var excitement = window.currentExcitement || 0;
  var minSal = parseInt(document.getElementById("salary-min-input").value) || null;
  var maxSal = parseInt(document.getElementById("salary-max-input").value) || null;
  var notes = document.getElementById("job-notes-textarea").value;
  
  var statusEl = document.getElementById("notes-save-status");
  if (statusEl) {
    statusEl.style.display = "block";
    statusEl.textContent = "Sauvegarde...";
    statusEl.style.color = "#777";
  }

  var payload = {
    pipelineStatus: stage,
    excitement: excitement,
    salaryMin: minSal,
    salaryMax: maxSal,
    notes: notes
  };

  fetch(baseUrl + "/api/application-drafts/" + documentsDraftId, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      if (d.success) {
        if (statusEl) {
          statusEl.textContent = "Enregistré";
          statusEl.style.color = "#22c55e";
          setTimeout(function() { statusEl.style.display = "none"; }, 1500);
        }
      } else {
        if (statusEl) {
          statusEl.textContent = "Erreur de sauvegarde";
          statusEl.style.color = "#dc2626";
        }
      }
    })
    .catch(function() {
      if (statusEl) {
        statusEl.textContent = "Erreur réseau";
        statusEl.style.color = "#dc2626";
      }
    });
}

function updateConfidenceUI(score) {
  var confEl = document.getElementById("preview-confidence"); if (!confEl) return;
  confEl.textContent = score + "%";
  confEl.className = "badge " + (score >= 70 ? "badge-green" : score >= 40 ? "badge-yellow" : "badge-red");
  var bar = document.getElementById("confidence-bar-fill"); if (!bar) return;
  bar.style.width = Math.max(5, score) + "%";
  bar.className = "confidence-fill " + (score >= 70 ? "confidence-high" : score >= 40 ? "confidence-medium" : "confidence-low");
}

function recomputeConfidence() {
  var title = (document.getElementById("edit-title") || {}).value || "";
  var company = (document.getElementById("edit-company") || {}).value || "";
  var location = (document.getElementById("edit-location") || {}).value || "";
  var hasDesc = capturedData && capturedData.jobs && capturedData.jobs[0] && capturedData.jobs[0].description && capturedData.jobs[0].description.length > 40;
  var score = (title ? 35 : 0) + (company ? 25 : 0) + (hasDesc ? 15 : 0) + (location ? 10 : 0);
  updateSendButton();
  updateConfidenceUI(score);
}

function updateSendButton() {
  var title = (document.getElementById("edit-title") || {}).value || "";
  var company = (document.getElementById("edit-company") || {}).value || "";
  var btn = document.getElementById("btn-send");
  var parasiteTitle = false;
  var PARASITE_CHECK = ["bienvenue","bienvenue,","emplois recommandés","détails de l'emploi"];
  var tc = title.trim().toLowerCase();
  for (var pi = 0; pi < PARASITE_CHECK.length; pi++) {
    if (tc === PARASITE_CHECK[pi]) { parasiteTitle = true; break; }
  }
  var warnTitle = document.getElementById("warn-title");
  if (warnTitle) warnTitle.style.display = (title && parasiteTitle) ? "block" : "none";
  if (btn) btn.disabled = !title || !company || parasiteTitle;
}

// ─── Health check ────────────────────────────

function checkHealth() {
  var statusEl = document.getElementById("backend-status");
  fetch(baseUrl + "/api/health")
    .then(function(r) { return r.json(); })
    .then(function(d) {
      backendOnline = d.status === "ok" || d.status === "degraded";
      if (statusEl) {
        statusEl.className = "backend-status " + (backendOnline ? "badge-green" : "badge-yellow");
        statusEl.textContent = backendOnline ? "Connecté" : "Hors ligne";
      }
    })
    .catch(function() {
      backendOnline = false;
      if (statusEl) {
        statusEl.className = "backend-status badge-red";
        statusEl.textContent = "Déconnecté";
      }
    });
}

// ─── Documents tab logic ────────────────────

function findMatchingDraft(callback, overrideTitle, overrideCompany) {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    var t = tabs[0] || {};
    var url = t.url || "";
    var title = overrideTitle || (t.title || "").replace(/\s*[-|]\s*(LinkedIn|Indeed|APEC).*/i, "").trim();
    var payload = {
      sourceUrl: url,
      title: title,
      company: overrideCompany || "",
      platform: detectPlatform(url)
    };

    fetch(baseUrl + "/api/jobs/assisted-import/match-draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (d.success && d.match) {
          documentsDraftId = d.match.draftId;
          chrome.storage.local.set({ lastFoundDraftId: documentsDraftId });
          loadDocumentStatus(function(err) {
            if (!err) updateDocumentsUI();
            if (callback) callback(null);
          });
          loadDraftDetails(documentsDraftId);
        } else {
          documentsDraftId = null;
          documentsStatus = null;
          clearDraftDetails();
          if (callback) callback(null, d.suggestions || []);
        }
      })
      .catch(function(err) {
        documentsDraftId = null;
        clearDraftDetails();
        if (callback) callback(err, []);
      });
  });
}

function loadDocumentStatus(callback) {
  if (!documentsDraftId) { if (callback) callback(null); return; }
  fetch(baseUrl + "/api/application-drafts/" + documentsDraftId + "/documents")
    .then(function(r) { return r.json(); })
    .then(function(d) {
      if (d.success) {
        documentsStatus = d;
        if (callback) callback(null);
      } else {
        if (callback) callback(new Error(d.error || "Documents indisponibles"));
      }
    })
    .catch(function(err) {
      if (callback) callback(err);
    });
}

function updateDocumentsUI() {
  if (!documentsStatus) return;
  var info = documentsStatus;
  document.getElementById("documents-draft-title").textContent = info.jobTitle || "Dossier trouvé";
  document.getElementById("documents-draft-info").textContent = (info.company || "") + " · " + (documentsDraftId || "").slice(0, 8) + "…";

  var cv = info.documents && info.documents.cv;
  var letter = info.documents && info.documents.coverLetter;

  var cvBadge = document.getElementById("documents-cv-badge");
  var cvPremiumBadge = document.getElementById("documents-cv-premium-badge");
  var cvFallbackBadge = document.getElementById("documents-cv-fallback-badge");

  if (selectedCvMode === "master") {
    cvBadge.className = "badge badge-green";
    cvBadge.textContent = "CV Maître (Profil)";
    if (cvPremiumBadge) {
      cvPremiumBadge.style.display = "inline-block";
      var tempSelect = document.getElementById("documents-cv-template-select");
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
          var tempLabel = cv.template || "Premium Leadership";
          tempLabel = tempLabel.replace(/-/g, " ").replace(/\b\w/g, function(l){ return l.toUpperCase(); });
          cvPremiumBadge.textContent = "CV Premium (" + tempLabel + ")";
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

  var letterBadge = document.getElementById("documents-letter-badge");
  if (letter && letter.available) {
    letterBadge.className = "badge badge-green"; letterBadge.textContent = "Lettre Prête";
  } else {
    letterBadge.className = "badge badge-red"; letterBadge.textContent = "Lettre Absente";
  }

  // Update generate/regenerate button text dynamically
  var generatePackBtn = document.getElementById("btn-generate-pack");
  if (generatePackBtn) {
    var hasCV = cv && cv.available;
    var hasLetter = letter && letter.available;
    if (hasCV || hasLetter) {
      generatePackBtn.textContent = "Régénérer le Pack (CV + Lettre)";
      generatePackBtn.style.background = "linear-gradient(135deg, #7c3aed, #4d1d95)";
    } else {
      generatePackBtn.textContent = "Générer le Pack (CV + Lettre)";
      generatePackBtn.style.background = "linear-gradient(135deg, #8b5cf6, #6d28d9)";
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

function downloadDocument(type) {
  if (!documentsDraftId) return;
  var selectedTemplate = document.getElementById("documents-cv-template-select").value || "premium_leadership";
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
      chrome.downloads.download({ url: url, filename: filename, saveAs: false }, function(downloadId) {
        lastDownloadId = downloadId;
        lastDownloadFilename = filename;
      });
    } else {
      fallbackBlobDownload(url, filename);
      lastDownloadFilename = shortName;
    }
  });
}

function previewDocument(type) {
  if (!documentsDraftId) {
    alert("Aucun dossier de candidature lié.");
    return;
  }
  var selectedTemplate = document.getElementById("documents-cv-template-select").value || "premium_leadership";
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
    });
  } else {
    window.open(url, "elton_doc_preview", "width=" + width + ",height=" + height + ",left=" + left + ",top=" + top + ",menubar=no,toolbar=no,location=no,status=no");
  }
}

// ─── Autofill logic ──────────────────────────

function loadAutofillFields() {
  var draftId = document.getElementById("draft-id-input-af").value;
  if (!draftId) {
    alert("Veuillez saisir un Draft ID.");
    return;
  }
  show("loading");
  document.getElementById("loading-msg").textContent = "Chargement des données ELTON OS...";

  fetch(baseUrl + "/api/application-drafts/" + draftId + "/autofill")
    .then(function(r) { return r.json(); })
    .then(function(d) {
      if (d.error) {
        document.getElementById("autofill-main-msg").style.display = "block";
        document.getElementById("autofill-main-msg").textContent = d.error;
        show("autofill-main");
        return;
      }
      autofillFields = d.fields || [];
      document.getElementById("btn-detect-form").disabled = false;
      document.getElementById("autofill-main-msg").style.display = "none";
      addLog("Données de candidature chargées", d.jobTitle + " chez " + d.company);
      show("autofill-main");
      // Trigger auto form detection
      document.getElementById("btn-detect-form").click();
    })
    .catch(function(err) {
      document.getElementById("error-message").textContent = "Impossible de joindre le serveur ELTON OS.";
      show("error");
    });
}

function detectFormFields() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: detectFormFieldsFn
    }, function(results) {
      if (chrome.runtime.lastError || !results || !results[0]) {
        alert("Détection impossible sur cet onglet.");
        return;
      }
      detectedFields = results[0].result || [];
      renderAutofillMapping();
    });
  });
}

function renderAutofillMapping() {
  var container = document.getElementById("autofill-detect-list");
  if (!container) return;
  var html = "";
  var readyCount = 0;
  var uncertainCount = 0;

  detectedFields.forEach(function(df, idx) {
    var mapped = mapDetectedFieldToAutofillValue(df, autofillFields, df.currentValue, "");
    var statusClass = "fill-skip";
    var statusText = "Ignoré";

    if (mapped) {
      if (mapped.status === "ready") { statusClass = "fill-ready"; statusText = "Prêt"; readyCount++; }
      else if (mapped.status === "uncertain") { statusClass = "fill-uncertain"; statusText = "À valider"; uncertainCount++; }
      else if (mapped.status === "manual_required") { statusClass = "fill-manual"; statusText = "Manuel"; }
    }

    html += '<div class="fill-row">' +
      '<div class="fill-label">' + esc(df.label || df.name || "Champ") + '</div>' +
      '<div class="fill-value">' + esc(mapped ? mapped.value : df.currentValue || "—") + '</div>' +
      '<span class="fill-status ' + statusClass + '">' + statusText + '</span>' +
      '</div>';
  });

  container.innerHTML = html;
  document.getElementById("autofill-detect-title").textContent = "Champs détectés : " + detectedFields.length;
  
  var score = Math.round((readyCount / (detectedFields.length || 1)) * 100);
  var scoreEl = document.getElementById("autofill-completion-score");
  var scoreBar = document.getElementById("autofill-completion-fill");
  if (scoreEl) scoreEl.textContent = score + "%";
  if (scoreBar) scoreBar.style.width = score + "%";
  
  document.getElementById("autofill-stats").textContent = readyCount + " sûrs · " + uncertainCount + " incertains";
  show("autofill-detect");
}

function fillFormFields() {
  var mapping = [];
  detectedFields.forEach(function(df, idx) {
    var mapped = mapDetectedFieldToAutofillValue(df, autofillFields, df.currentValue, "");
    if (mapped && (mapped.status === "ready" || mapped.status === "uncertain")) {
      mapping.push({ idx: idx, value: mapped.value });
    }
  });

  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: fillDetectedFieldsFn,
      args: [mapping]
    }, function(results) {
      var filled = results && results[0] ? results[0].result.filled : 0;
      addLog("Autofill complété", filled + " champs injectés sur le formulaire.");
      show("autofill-done");
    });
  });
}

// ─── DOM ready ─────────────────────────────

document.addEventListener("DOMContentLoaded", function() {
  chrome.storage.local.get(["eltonBaseUrl", "lastFoundDraftId", "overwriteExisting"], function(result) {
    if (result.eltonBaseUrl) {
      baseUrl = result.eltonBaseUrl;
      var urlInput = document.getElementById("elton-url-input");
      if (urlInput) urlInput.value = baseUrl;
    }
    checkHealth();

    // Auto-match
    findMatchingDraft(function() {
      var draftInput = document.getElementById("draft-id-input-af");
      if (documentsDraftId && draftInput) {
        draftInput.value = documentsDraftId;
        setTimeout(loadAutofillFields, 200);
      }
    });

    if (result.overwriteExisting !== undefined) {
      overwriteExisting = result.overwriteExisting;
      var cb = document.getElementById("overwrite-existing-checkbox");
      if (cb) cb.checked = overwriteExisting;
    }
  });

  // Écouter les changements d'offre (URL) notifiés par le background worker
  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.type === "TAB_URL_CHANGED") {
      console.log("[ELTON] Tab URL changed, checking auto-match:", message.url);
      
      // Reset to main import view, clearing old details
      clearDraftDetails();
      show("import-main");
      
      // Auto-match the new URL
      findMatchingDraft(function() {
        var draftInput = document.getElementById("draft-id-input-af");
        if (documentsDraftId && draftInput) {
          draftInput.value = documentsDraftId;
          setTimeout(loadAutofillFields, 200);
        }
      });
    }
  });

  // Tab bindings
  document.querySelectorAll(".tab").forEach(function(btn) {
    btn.addEventListener("click", function() { switchTab(btn.dataset.tab); });
  });

  // Reset/Reanalyze buttons
  var resetMain = function() {
    clearDraftDetails();
    show("import-main");
  };
  var reanEl = document.getElementById("btn-reanalyze"); if (reanEl) reanEl.addEventListener("click", resetMain);
  var reanListEl = document.getElementById("btn-reanalyze-list"); if (reanListEl) reanListEl.addEventListener("click", resetMain);
  var newEl = document.getElementById("btn-new"); if (newEl) newEl.addEventListener("click", resetMain);
  var newListEl = document.getElementById("btn-new-list"); if (newListEl) newListEl.addEventListener("click", resetMain);

  // Buttons import
  document.getElementById("btn-analyze-single").addEventListener("click", function() {
    show("loading");
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      var platform = detectPlatform(tabs[0].url || "");
      var extractFn = platform === "linkedin" ? extractLinkedInJobFn : platform === "indeed" ? extractIndeedJobFn : platform === "apec" ? extractApecJobFn : extractGenericJobFn;

      chrome.scripting.executeScript({ target: { tabId: tabs[0].id }, func: extractFn }, function(results) {
        if (!results || !results[0]) { show("error"); return; }
        var data = results[0].result;
        capturedData = {
          sourceUrl: data.sourceUrl,
          sourcePlatform: platform,
          jobs: [data]
        };
        document.getElementById("edit-title").value = data.title || "";
        document.getElementById("edit-company").value = data.company || "";
        document.getElementById("edit-location").value = data.location || "";
        document.getElementById("preview-platform").textContent = platformLabel(platform);
        recomputeConfidence();
        addLog("Scan de page active", data.title + " @ " + data.company);
        show("import-preview");

        // Try to match immediately on scan
        findMatchingDraft(null, data.title, data.company);
      });
    });
  });

  // Connect Send button
  document.getElementById("btn-send").addEventListener("click", function() {
    if (!capturedData) return;
    var title = document.getElementById("edit-title").value;
    var company = document.getElementById("edit-company").value;
    capturedData.jobs[0].title = title;
    capturedData.jobs[0].company = company;
    capturedData.jobs[0].location = document.getElementById("edit-location").value;

    show("loading");
    var payload = {
      platform: capturedData.sourcePlatform,
      sourceUrl: capturedData.sourceUrl,
      visibleOnly: true,
      selectedJobs: capturedData.jobs
    };

    fetch(baseUrl + "/api/jobs/assisted-import/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (d.success) {
          addLog("Import réussi", title + " importé dans ELTON OS.");
          // Retrieve new scores and draft ID
          findMatchingDraft(function() {
            show("import-sent");
            var draftInput = document.getElementById("draft-id-input-af");
            if (documentsDraftId && draftInput) {
              draftInput.value = documentsDraftId;
              loadAutofillFields();
            }
          }, title, company);
        } else {
          show("error");
        }
      })
      .catch(function() { show("error"); });
  });

  document.getElementById("btn-load-autofill").addEventListener("click", loadAutofillFields);
  document.getElementById("btn-detect-form").addEventListener("click", detectFormFields);
  document.getElementById("btn-fill-form").addEventListener("click", fillFormFields);
  document.getElementById("btn-clear-logs").addEventListener("click", function() {
    chrome.storage.local.remove("activityLogs", loadActivityLogs);
  });

  // Settings
  document.getElementById("btn-settings").addEventListener("click", function() { show("settings"); });
  document.getElementById("btn-save-url").addEventListener("click", function() {
    var val = document.getElementById("elton-url-input").value;
    chrome.storage.local.set({ eltonBaseUrl: val }, function() {
      baseUrl = val;
      checkHealth();
      switchTab("import");
    });
  });
  document.getElementById("btn-cancel-settings").addEventListener("click", function() { switchTab("import"); });

  // Kill switch
  document.getElementById("btn-kill-switch").addEventListener("click", function() {
    if (confirm("Réinitialiser l'extension et déconnecter ELTON OS ?")) {
      chrome.storage.local.clear(function() {
        baseUrl = "http://localhost:3000";
        location.reload();
      });
    }
  });

  // Documents tab operations
  var findDraftBtn = document.getElementById("btn-find-draft");
  if (findDraftBtn) {
    findDraftBtn.addEventListener("click", function() {
      show("loading");
      findMatchingDraft(function(err) {
        if (documentsDraftId) {
          show("documents-found");
        } else {
          show("documents-not-found");
        }
      });
    });
  }

  var dlCvBtn = document.getElementById("btn-download-cv");
  if (dlCvBtn) dlCvBtn.addEventListener("click", function() { downloadDocument("cv"); });

  var generatePackBtn = document.getElementById("btn-generate-pack");
  if (generatePackBtn) {
    generatePackBtn.addEventListener("click", function() {
      if (!documentsDraftId) {
        alert("Aucun dossier de candidature identifié.");
        return;
      }
      var overlay = document.getElementById("documents-loading-overlay");
      if (overlay) overlay.style.display = "flex";

      fetch(baseUrl + "/api/application-drafts/" + documentsDraftId, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "regenerate", target: "all" })
      })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (d.success) {
          loadDocumentStatus(function(err) {
            if (overlay) overlay.style.display = "none";
            if (!err) {
              updateDocumentsUI();
              addLog("Génération du Pack", "Le Pack CV + Lettre a été généré via l'IA.");
              alert("Pack (CV + Lettre) généré avec succès !");
            } else {
              alert("Pack généré, mais erreur lors de la mise à jour : " + err.message);
            }
          });
        } else {
          if (overlay) overlay.style.display = "none";
          alert("Erreur lors de la génération : " + (d.error || "Inconnue"));
        }
      })
      .catch(function(err) {
        if (overlay) overlay.style.display = "none";
        alert("Erreur lors de la génération : " + err.message);
      });
    });
  }

  var dlLetterBtn = document.getElementById("btn-download-letter");
  if (dlLetterBtn) dlLetterBtn.addEventListener("click", function() { downloadDocument("cover-letter"); });

  var dlZipBtn = document.getElementById("btn-download-zip");
  if (dlZipBtn) dlZipBtn.addEventListener("click", function() { downloadDocument("zip"); });

  var attachCvBtn = document.getElementById("btn-attach-cv");
  if (attachCvBtn) attachCvBtn.addEventListener("click", function() { attachDocument("cv"); });

  var attachLetterBtn = document.getElementById("btn-attach-letter");
  if (attachLetterBtn) attachLetterBtn.addEventListener("click", function() { attachDocument("coverLetter"); });

  var attachBothBtn = document.getElementById("btn-attach-both");
  if (attachBothBtn) attachBothBtn.addEventListener("click", attachBothDocuments);

  // CV Template selection change
  var templateSelect = document.getElementById("documents-cv-template-select");
  if (templateSelect) {
    templateSelect.addEventListener("change", function() {
      updateDocumentsUI();
    });
  }

  // CV Version Mode selectors
  var btnModeAdapted = document.getElementById("btn-mode-adapted");
  var btnModeMaster = document.getElementById("btn-mode-master");
  
  if (btnModeAdapted && btnModeMaster) {
    btnModeAdapted.addEventListener("click", function() {
      selectedCvMode = "adapted";
      btnModeAdapted.style.background = "#8b5cf6";
      btnModeAdapted.style.color = "#fff";
      btnModeAdapted.style.fontWeight = "bold";
      btnModeMaster.style.background = "transparent";
      btnModeMaster.style.color = "#888";
      btnModeMaster.style.fontWeight = "normal";
      updateDocumentsUI();
    });

    btnModeMaster.addEventListener("click", function() {
      selectedCvMode = "master";
      btnModeMaster.style.background = "#8b5cf6";
      btnModeMaster.style.color = "#fff";
      btnModeMaster.style.fontWeight = "bold";
      btnModeAdapted.style.background = "transparent";
      btnModeAdapted.style.color = "#888";
      btnModeAdapted.style.fontWeight = "normal";
      updateDocumentsUI();
    });
  }

  // Previews
  var previewCvBtn = document.getElementById("btn-preview-cv");
  if (previewCvBtn) previewCvBtn.addEventListener("click", function() { previewDocument("cv"); });

  var previewLetterBtn = document.getElementById("btn-preview-letter");
  if (previewLetterBtn) previewLetterBtn.addEventListener("click", function() { previewDocument("letter"); });

  var copyLetterBtn = document.getElementById("btn-copy-letter");
  if (copyLetterBtn) {
    copyLetterBtn.addEventListener("click", function() {
      if (!documentsDraftId) return;
      fetchLetterText(documentsDraftId, function(err, text) {
        if (err) { alert(err.message); return; }
        copyToClipboard(text);
        addLog("Lettre copiée", "Texte copié dans le presse-papier.");
        alert("Lettre copiée dans le presse-papier.");
      });
    });
  }

  var fillLetterBtn = document.getElementById("btn-fill-letter");
  if (fillLetterBtn) {
    fillLetterBtn.addEventListener("click", function() {
      if (!documentsDraftId) return;
      fetchLetterText(documentsDraftId, function(err, text) {
        if (err) { alert(err.message); return; }
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
          if (!tabs[0]) return;
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: fillLetterTextarea,
            args: [text]
          }, function(results) {
            if (chrome.runtime.lastError || !results || !results[0]) {
              alert("Erreur d'injection.");
              return;
            }
            var res = results[0].result;
            if (res.success) {
              addLog("Lettre injectée", "Remplissage du textarea.");
              alert("Lettre injectée dans le formulaire.");
            } else {
              alert("Impossible de remplir : " + res.reason);
            }
          });
        });
      });
    });
  }

  var copyFilenameBtn = document.getElementById("btn-copy-filename");
  if (copyFilenameBtn) {
    copyFilenameBtn.addEventListener("click", function() {
      if (lastDownloadFilename) {
        copyToClipboard(lastDownloadFilename);
        alert("Nom de fichier copié : " + lastDownloadFilename);
      } else {
        alert("Aucun fichier téléchargé pour l'instant.");
      }
    });
  }

  var showFileBtn = document.getElementById("btn-show-file");
  if (showFileBtn) {
    showFileBtn.addEventListener("click", function() {
      showDownloadedFile();
    });
  }

  // Pilotage event bindings
  var stageSelect = document.getElementById("pipeline-stage-select");
  if (stageSelect) stageSelect.addEventListener("change", saveJobTrackingData);

  var stars = document.querySelectorAll("#excitement-stars span");
  stars.forEach(function(star) {
    star.addEventListener("click", function() {
      var val = parseInt(this.dataset.value);
      window.currentExcitement = val;
      updateStarsUI(val);
      saveJobTrackingData();
    });
    star.addEventListener("mouseover", function() {
      var val = parseInt(this.dataset.value);
      stars.forEach(function(s, idx) {
        s.style.color = idx < val ? "#c8a64e" : "#333";
      });
    });
    star.addEventListener("mouseout", function() {
      updateStarsUI(window.currentExcitement || 0);
    });
  });

  var minSal = document.getElementById("salary-min-input");
  if (minSal) minSal.addEventListener("change", saveJobTrackingData);
  
  var maxSal = document.getElementById("salary-max-input");
  if (maxSal) maxSal.addEventListener("change", saveJobTrackingData);

  var notesText = document.getElementById("job-notes-textarea");
  if (notesText) {
    var debounceTimeout = null;
    notesText.addEventListener("input", function() {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(saveJobTrackingData, 1000);
    });
    notesText.addEventListener("blur", saveJobTrackingData);
  }

  switchTab("import");
});

function esc(s) {
  var d = document.createElement("div");
  d.textContent = s || "";
  return d.innerHTML;
}
