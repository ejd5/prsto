/**
 * PRSTO Recruteur v3.0 — Chrome Extension (Manifest V3)
 */

import {
  candidateProfile, clientOffer, matchResult, baseUrl,
  setCandidateProfile, setClientOffer, setMatchResult,
  setBaseUrl, resetState, getApiUrl,
} from "./utils/state";
import { bindCloseToast, customAlert } from "./utils/notifications";
import { addLog } from "./utils/logging";
import { esc, detectPlatform } from "./utils/helpers";
import {
  checkHealth,
  importCandidateProfile, importClientOffer, matchCandidateToOffer,
  generateDossier, shareDossierToClient, getCandidateList, getOfferList,
} from "./core/backend";
import {
  extractLinkedInJobFn, extractIndeedJobFn, extractApecJobFn, extractGenericJobFn,
  extractLinkedInProfileFn, extractLinkedInSearchFn, extractGitHubProfileFn, extractGenericProfileFn,
} from "./core/extractors";
import { detectCurrentContext, initStore, updateStoreState } from "./utils/state-machine";
import { detectedFields, setDetectedFields } from "./utils/state";
import { detectFormFieldsFn, fillDetectedFieldsFn } from "./core/content-scripts";
import { mapDetectedFieldToAutofillValue } from "./tabs/autofill";

// ─── Tab switching ─────────────────────────
function switchTab(tab: string) {
  document.querySelectorAll(".tab").forEach(function(t) { t.classList.toggle("active", (t as HTMLElement).dataset.tab === tab); });
  (document.getElementById("tab-sourcing") as HTMLElement).style.display = tab === "sourcing" ? "block" : "none";
  (document.getElementById("tab-matcher") as HTMLElement).style.display = tab === "matcher" ? "block" : "none";
  (document.getElementById("tab-dossier") as HTMLElement).style.display = tab === "dossier" ? "block" : "none";
  (document.getElementById("tab-autofill") as HTMLElement).style.display = tab === "autofill" ? "block" : "none";
}

// ─── Recruiter Helpers ────────────────────
function refreshBaseList() {
  var container = document.getElementById("base-list");
  if (!container) return;
  container.innerHTML = '<span class="spinner"></span>';
  getCandidateList(function(err: any, data: any) {
    if (err || !data || !data.candidates || data.candidates.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:12px;font-size:8px;color:rgba(250,246,239,0.3);">Aucun candidat dans la base. Utilisez l\'onglet Sourcer.</div>';
      return;
    }
    var html = '<div style="font-size:8px;color:rgba(250,246,239,0.4);margin-bottom:4px;">' + data.candidates.length + ' candidats</div>';
    data.candidates.forEach(function(c: any) {
      html += '<div class="list-item"><div class="avatar">' + (c.name || "C").charAt(0).toUpperCase() + '</div><div style="flex:1;min-width:0;"><div style="font-weight:600;">' + esc(c.name || "Inconnu") + '</div><div style="font-size:7px;color:rgba(250,246,239,0.3);">' + esc(c.status || "importé") + '</div></div><span style="font-size:7px;color:rgba(250,246,239,0.25);">' + (c.importedAt ? new Date(c.importedAt).toLocaleDateString("fr") : "") + '</span></div>';
    });
    container.innerHTML = html;
  });
}

function loadMissionPipeline() {
  var container = document.getElementById("mission-pipeline");
  if (!container) return;
  container.innerHTML = '<span class="spinner"></span>';
  fetch(getApiUrl("/api/recruiter/offers/list"))
    .then(function(r) { return r.json(); })
    .then(function(d: any) {
      if (!d.offers || d.offers.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:12px;font-size:8px;color:rgba(250,246,239,0.3);">Aucune mission en cours.<br>Importez un candidat et une offre pour démarrer.</div>';
        return;
      }
      var html = '';
      d.offers.forEach(function(o: any) {
        var statusColor = o.status === "placed" ? "#22c55e" : o.status === "sent" ? "#E4B118" : "rgba(250,246,239,0.3)";
        html += '<div class="pipeline-row"><div class="avatar">' + (o.company || "?").charAt(0) + '</div><div style="flex:1;min-width:0;"><div style="font-weight:600;">' + esc(o.title || "") + '</div><div style="font-size:7px;color:rgba(250,246,239,0.3);">' + esc(o.company || "") + '</div></div><span class="pipeline-status" style="color:' + statusColor + ';background:rgba(228,177,24,0.06);">' + esc(o.status || "new") + '</span></div>';
      });
      container.innerHTML = html;
    })
    .catch(function() {
      container.innerHTML = '<div style="text-align:center;padding:12px;font-size:8px;color:rgba(250,246,239,0.3);">Impossible de charger les missions.</div>';
    });
}

// ─── DOM ready ─────────────────────────────
document.addEventListener("DOMContentLoaded", function() {
  window.alert = customAlert as any;
  bindCloseToast();

  chrome.storage.local.get(["eltonBaseUrl"], function(result: any) {
    if (result.eltonBaseUrl) {
      setBaseUrl(result.eltonBaseUrl);
      var urlInput = document.getElementById("elton-url-input") as HTMLInputElement;
      if (urlInput) urlInput.value = baseUrl;
    }
    checkHealth();
    
    // Auto-detect active page context and load state machine
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs && tabs[0] && tabs[0].url) {
        detectCurrentContext(tabs[0].url, function(state) {
          var labelMap: Record<string, string> = { 
            linkedin: "LinkedIn", indeed: "Indeed", apec: "APEC", 
            greenhouse: "Greenhouse", lever: "Lever", ashby: "Ashby", 
            smartrecruiters: "SmartRecruiters", workable: "Workable", 
            cadremploi: "Cadremploi", hellowork: "Hellowork", 
            wttj: "Welcome to the Jungle"
          };
          var platformName = labelMap[state.platform || ""] || "Page standard";
          var pageTypeLabels: Record<string, string> = {
            candidate_profile: "Profil Candidat",
            job_offer: "Offre d'emploi",
            candidate_search: "Recherche candidats",
            generic: "Page Standard"
          };
          var typeLabel = pageTypeLabels[state.pageType || ""] || "Détection...";
          var platEl = document.getElementById("platform");
          if (platEl) platEl.textContent = "Site : " + platformName + " (" + typeLabel + ")";
          
          // Advise recommended action inside UI
          var adviceEl = document.createElement("div");
          adviceEl.id = "workflow-action-advice";
          adviceEl.style.fontSize = "9px";
          adviceEl.style.padding = "4px 8px";
          adviceEl.style.background = "rgba(228, 177, 24, 0.1)";
          adviceEl.style.border = "1px solid rgba(228, 177, 24, 0.2)";
          adviceEl.style.borderRadius = "6px";
          adviceEl.style.color = "#E4B118";
          adviceEl.style.margin = "8px 0";
          adviceEl.style.fontWeight = "bold";
          adviceEl.style.textAlign = "center";
          
          if (state.pageType === "candidate_profile") {
            adviceEl.textContent = "👉 Action suggérée : Sourcer ce candidat";
          } else if (state.pageType === "job_offer") {
            adviceEl.textContent = "👉 Action suggérée : Matcher avec un candidat";
          } else {
            adviceEl.textContent = "👉 Copilote prêt : Capturez des données ou déposez un CV";
          }
          
          var headerEl = document.querySelector(".header");
          if (headerEl && !document.getElementById("workflow-action-advice")) {
            headerEl.appendChild(adviceEl);
          }
        });
      }
    });
  });

  document.querySelectorAll(".tab").forEach(function(btn) {
    btn.addEventListener("click", function() { switchTab((btn as HTMLElement).dataset.tab || ""); });
  });

  // Listen for storage session changes to synchronize state machine across sidepanels
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener(function(changes, namespace) {
      if (namespace === "session" && changes.workflowState) {
        var state = changes.workflowState.newValue;
        if (state && state.importedCandidateId) {
          var cidInput = document.getElementById("match-candidate-id") as HTMLInputElement;
          if (cidInput && !cidInput.value) cidInput.value = state.importedCandidateId;
          var cDossierInput = document.getElementById("dossier-candidate") as HTMLInputElement;
          if (cDossierInput && !cDossierInput.value) cDossierInput.value = state.importedCandidateId;
        }
        if (state && state.importedOfferId) {
          var oidInput = document.getElementById("match-offer-id") as HTMLInputElement;
          if (oidInput && !oidInput.value) oidInput.value = state.importedOfferId;
        }
      }
    });
  }

  // ═══════════════════════════════════════════
  // SOURCING — Scrape single profile
  // ═══════════════════════════════════════════
  var scrapeBtn = document.getElementById("btn-scrape-profile");
  if (scrapeBtn) scrapeBtn.addEventListener("click", function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      var url = tabs[0]!.url || "";
      var platform = detectPlatform(url);
      var extractFn = platform === "linkedin" ? extractLinkedInProfileFn : platform === "github" ? extractGitHubProfileFn : extractGenericProfileFn;

      chrome.scripting.executeScript({ target: { tabId: tabs[0]!.id! }, func: extractFn as any }, function(results: any) {
        if (!results || !results[0]) { customAlert("Extraction impossible sur cette page."); return; }
        var data = results[0].result;
        setCandidateProfile(data);
        try { (document.getElementById("scrape-name") as HTMLElement).textContent = data.name || "—"; } catch(e) {}
        try { (document.getElementById("scrape-title") as HTMLElement).textContent = data.title || "—"; } catch(e) {}
        try { (document.getElementById("scrape-loc") as HTMLElement).textContent = data.location || "—"; } catch(e) {}
        var conf = data.confidence || 0;
        try { (document.getElementById("conf-bar") as HTMLElement).style.width = Math.max(5, conf) + "%"; } catch(e) {}
        try { (document.getElementById("scrape-preview") as HTMLElement).style.display = "block"; } catch(e) {}
        addLog("Profil scrappé", data.name + " — " + data.title);
      });
    });
  });

  var saveBtn = document.getElementById("btn-save-profile");
  if (saveBtn) saveBtn.addEventListener("click", function() {
    if (!candidateProfile) return;
    importCandidateProfile(candidateProfile, function(err: any, res: any) {
      if (err) {
        customAlert("Erreur lors de l'enregistrement du candidat.");
        return;
      }
      var savedCid = res.candidateId || res.id || "cand-" + Date.now();
      
      // Update store state machine
      updateStoreState({ importedCandidateId: savedCid, step: "candidate_imported" });

      var cidInput = document.getElementById("match-candidate-id") as HTMLInputElement;
      if (cidInput) cidInput.value = savedCid;
      var cDossierInput = document.getElementById("dossier-candidate") as HTMLInputElement;
      if (cDossierInput) cDossierInput.value = savedCid;
      customAlert("Candidat ajouté — ID: " + savedCid);
    });
  });

  var batchBtn = document.getElementById("btn-scrape-search");
  if (batchBtn) batchBtn.addEventListener("click", function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.scripting.executeScript({ target: { tabId: tabs[0]!.id! }, func: extractLinkedInSearchFn as any }, function(results: any) {
        if (!results || !results[0]) { customAlert("Aucun profil trouvé."); return; }
        var profiles = (results[0].result.profiles || []);
        var container = document.getElementById("scrape-batch-result");
        if (!container) return;
        container.style.display = "block";
        var html = '<div style="font-size:8px;color:rgba(250,246,239,0.5);margin-bottom:4px;">' + profiles.length + ' profils trouvés</div>';
        profiles.forEach(function(p: any) {
          html += '<div class="list-item"><div class="avatar">' + (p.name || "?").charAt(0) + '</div><div><strong>' + esc(p.name) + '</strong><br><span style="color:rgba(250,246,239,0.3)">' + esc(p.title) + '</span></div></div>';
        });
        container.innerHTML = html;
      });
    });
  });

  // ═══════════════════════════════════════════
  // MATCHER
  // ═══════════════════════════════════════════
  var scanOfferBtn = document.getElementById("btn-scan-offer");
  if (scanOfferBtn) scanOfferBtn.addEventListener("click", function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      var platform = detectPlatform(tabs[0]!.url || "");
      var extractFn = platform === "linkedin" ? extractLinkedInJobFn : platform === "indeed" ? extractIndeedJobFn : platform === "apec" ? extractApecJobFn : extractGenericJobFn;
      chrome.scripting.executeScript({ target: { tabId: tabs[0]!.id! }, func: extractFn as any }, function(results: any) {
        if (!results || !results[0]) { customAlert("Offre non trouvée."); return; }
        var data = results[0].result;
        var offerData = { title: data.title, company: data.company, location: data.location || "", description: data.rawText || data.description || "", platform: platform, url: tabs[0]!.url || "" };
        
        importClientOffer(offerData, function(err: any, res: any) {
          if (err) {
            customAlert("Erreur lors de la sauvegarde de l'offre.");
            return;
          }
          var savedOfferId = res.offerId || res.id || "offer-" + Date.now();
          setClientOffer({ ...offerData, id: savedOfferId } as any);

          // Update store state machine
          updateStoreState({ importedOfferId: savedOfferId, step: "offer_imported" });

          var oidInput = document.getElementById("match-offer-id") as HTMLInputElement;
          if (oidInput) oidInput.value = savedOfferId;
          addLog("Offre scannée & sauvée", data.title + " @ " + data.company);
          customAlert("Offre enregistrée — ID: " + savedOfferId);
        });
      });
    });
  });

  var matchBtn = document.getElementById("btn-match");
  if (matchBtn) matchBtn.addEventListener("click", function() {
    var cidInput = document.getElementById("match-candidate-id") as HTMLInputElement;
    var oidInput = document.getElementById("match-offer-id") as HTMLInputElement;
    if (!cidInput || !oidInput) return;
    var cid = cidInput.value; var oid = oidInput.value;
    if (!cid || !oid) { customAlert("Renseignez l'ID candidat et l'ID offre."); return; }
    
    // UI feedback state
    var btnText = matchBtn.textContent;
    matchBtn.textContent = "Matching en cours...";
    (matchBtn as HTMLButtonElement).disabled = true;

    matchCandidateToOffer(cid, oid, function(err: any, data: any) {
      matchBtn.textContent = btnText;
      (matchBtn as HTMLButtonElement).disabled = false;
      
      if (err) {
        customAlert("Impossible de matcher : " + (err.message || "Erreur réseau"));
        return;
      }
      
      setMatchResult(data);
      var scoreEl = document.getElementById("match-score");
      var detailsEl = document.getElementById("match-details");
      var recoEl = document.getElementById("match-reco");
      var resultEl = document.getElementById("match-result");
      if (scoreEl) scoreEl.textContent = (data.score || 0) + "%";
      if (detailsEl) { var dh = ""; if (data.matching) { Object.keys(data.matching).forEach(function(k) { dh += "<span>" + k + ": <strong>" + data.matching[k] + "%</strong></span>"; }); } detailsEl.innerHTML = dh; }
      if (recoEl) recoEl.textContent = data.recommendation || "";
      if (resultEl) resultEl.style.display = "block";
      customAlert("Matching complété ! Score : " + (data.score || 0) + "%");
    });
  });

  // ═══════════════════════════════════════════
  // DOSSIER
  // ═══════════════════════════════════════════
  var genBtn = document.getElementById("btn-generate-dossier");
  if (genBtn) genBtn.addEventListener("click", function() {
    var cInput = document.getElementById("dossier-candidate") as HTMLInputElement;
    var oInput = document.getElementById("dossier-offer") as HTMLInputElement;
    if (!cInput || !oInput) return;
    var cid = cInput.value; var oid = oInput.value;
    if (!cid || !oid) { customAlert("Renseignez les IDs candidat et offre."); return; }
    generateDossier(cid, oid, function(err: any, data: any) {
      if (err) return;
      var rel = document.getElementById("dossier-result");
      if (rel) { 
        rel.style.display = "block"; 
        rel.className = "status-success"; 
        rel.innerHTML = "Dossier généré ! ID: " + data.dossierId; 
      }
      // Populate share candidate input (used as dossier ID) automatically
      var dInput = document.getElementById("dossier-candidate") as HTMLInputElement;
      if (dInput) dInput.value = data.dossierId || "";
    });
  });

  var shareBtn = document.getElementById("btn-share-dossier");
  if (shareBtn) shareBtn.addEventListener("click", function() {
    var cInput = document.getElementById("dossier-candidate") as HTMLInputElement;
    if (!cInput) return;
    var dossierId = cInput.value;
    if (!dossierId) { customAlert("Générez d'abord un dossier pour obtenir un ID."); return; }
    shareDossierToClient(dossierId, function(err: any, data: any) {
      if (err) return;
      var rel = document.getElementById("share-result");
      if (rel) { rel.style.display = "block"; rel.className = "status-gold"; rel.innerHTML = "Lien client :<br><a href='" + esc(data.shareUrl || "") + "' target='_blank' style='color:#E4B118;font-size:8px;'>" + esc(data.shareUrl || "") + "</a>"; }
    });
  });

  // ═══════════════════════════════════════════
  // AUTOFILL (AUTO-APPLY)
  // ═══════════════════════════════════════════
  var detectBtn = document.getElementById("btn-detect-fields");
  if (detectBtn) detectBtn.addEventListener("click", function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (!tabs[0] || !tabs[0].id) return;
      
      chrome.scripting.executeScript({ target: { tabId: tabs[0].id }, func: detectFormFieldsFn }, function(results) {
        if (!results || !results[0]) { customAlert("Aucun formulaire détecté sur la page."); return; }
        
        var fields = results[0].result || [];
        var preview = document.getElementById("autofill-preview");
        var list = document.getElementById("autofill-fields-list");
        var countLabel = document.getElementById("autofill-count-label");
        
        if (preview && list && countLabel) {
          preview.style.display = "block";
          countLabel.textContent = fields.length + " champs détectés";
          
          setDetectedFields(fields);

          var html = "";
          fields.forEach(function(f: any, idx: number) {
            html += `<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid rgba(14,56,38,0.05);">
              <span>[${f.tag}] <strong>${esc(f.label || f.placeholder || f.name)}</strong></span>
              <span style="color:rgba(14,56,38,0.4)">#${idx}</span>
            </div>`;
          });
          list.innerHTML = html;
          customAlert("Formulaire analysé !");
        }
      });
    });
  });

  var fillBtn = document.getElementById("btn-fill-fields");
  if (fillBtn) fillBtn.addEventListener("click", function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (!tabs[0] || !tabs[0].id) return;

      // Mock user candidate details profile to map onto form fields
      var userProfile = [
        { key: "firstName", value: "Duarte" },
        { key: "lastName", value: "Elton" },
        { key: "fullName", value: "Duarte Elton" },
        { key: "email", value: "duarte.elton@example.com" },
        { key: "phone", value: "+33612345678" },
        { key: "location", value: "Paris, France" },
        { key: "linkedin", value: "https://www.linkedin.com/in/duarte-elton" },
        { key: "currentTitle", value: "Directeur de projet" }
      ];

      var mappings: any[] = [];
      detectedFields.forEach(function(f: any, idx: number) {
        var afVal = mapDetectedFieldToAutofillValue(f, userProfile, f.currentValue || "", "", true);
        if (afVal && afVal.status === "ready") {
          mappings.push({ idx: idx, value: afVal.value });
        }
      });

      if (mappings.length === 0) {
        customAlert("Aucun champ correspondant trouvé à remplir.");
        return;
      }

      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: fillDetectedFieldsFn,
        args: [mappings]
      }, function(results) {
        if (results && results[0]) {
          var res = results[0].result;
          customAlert(`Formulaire rempli avec succès ! (Remplis: ${res.filled}, Ignorés: ${res.skipped})`);
        }
      });
    });
  });

  var saveUrlBtn = document.getElementById("btn-save-url");
  if (saveUrlBtn) saveUrlBtn.addEventListener("click", function() {
    var val = (document.getElementById("elton-url-input") as HTMLInputElement).value;
    chrome.storage.local.set({ eltonBaseUrl: val } as any, function() {
      setBaseUrl(val); checkHealth(); customAlert("URL: " + val);
    });
  });

  var closeToastBtn = document.getElementById("btn-close-toast");
  if (closeToastBtn) closeToastBtn.addEventListener("click", function() {
    (document.getElementById("custom-toast") as HTMLElement).style.display = "none";
  });

  switchTab("sourcing");
});
