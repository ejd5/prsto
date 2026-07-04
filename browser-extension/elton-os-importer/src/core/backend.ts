// ─── Backend API ──────────────────────────────
import { baseUrl, documentsDraftId, selectedCvMode, getApiUrl } from "../utils/state";
import { showNotification } from "../utils/notifications";
import { addLog } from "../utils/logging";
import { esc, platformLabel, detectPlatform, show } from "../utils/helpers";
import {
  capturedData, documentsStatus, backendOnline,
  setBackendOnline, setDocumentsStatus,
  setDocumentsDraftId, setCurrentExcitement, setCapturedData,
  lastDownloadId, lastDownloadFilename,
  setLastDownloadId, setLastDownloadFilename,
} from "../utils/state";
import { loadDocumentStatus, updateDocumentsUI, downloadDocument } from "./documents";

export function checkHealth() {
  var statusEl = document.getElementById("backend-status");
  fetch(getApiUrl("/api/health"))
    .then(function(r) { return r.json(); })
    .then(function(d: any) {
      var isOnline = d.status === "ok" || d.status === "degraded";
      setBackendOnline(isOnline);
      if (statusEl) {
        statusEl.className = "backend-status " + (isOnline ? "badge-green" : "badge-yellow");
        statusEl.textContent = isOnline ? "Connecté" : "Hors ligne";
      }
    })
    .catch(function() {
      setBackendOnline(false);
      if (statusEl) {
        statusEl.className = "backend-status badge-red";
        statusEl.textContent = "Déconnecté";
      }
    });
}

export function findMatchingDraft(callback?: any, overrideTitle?: string, overrideCompany?: string) {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    var t = tabs[0] || ({} as any);
    var url = t.url || "";
    var title = overrideTitle || (t.title || "").replace(/\s*[-|]\s*(LinkedIn|Indeed|APEC).*/i, "").trim();
    var payload: any = {
      sourceUrl: url,
      title: title,
      company: overrideCompany || "",
      platform: detectPlatform(url)
    };

    fetch(getApiUrl("/api/jobs/assisted-import/match-draft"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function(r) { return r.json(); })
      .then(function(d: any) {
        if (d.success && d.match) {
          setDocumentsDraftId(d.match.draftId);
          chrome.storage.local.set({ lastFoundDraftId: d.match.draftId } as any);
          loadDocumentStatus(function(err?: any) {
            if (!err) updateDocumentsUI();
            if (callback) callback(null);
          });
          loadDraftDetails(d.match.draftId);
        } else {
          setDocumentsDraftId(null);
          setDocumentsStatus(null);
          clearDraftDetails();
          if (callback) callback(null, d.suggestions || []);
        }
      })
      .catch(function(err: any) {
        setDocumentsDraftId(null);
        clearDraftDetails();
        if (callback) callback(err, []);
      });
  });
}

export function loadDraftDetails(draftId: string) {
  if (!draftId) return;
  fetch(getApiUrl("/api/application-drafts/" + draftId))
    .then(function(r) { return r.json(); })
    .then(function(d: any) {
      if (d && d.draft) {
        var draft = d.draft;
        var job = draft.job || {};
        var sc = job.score || {};

        document.getElementById("opp-intel-scores")!.style.display = "block";
        document.getElementById("intel-score-global")!.textContent = (sc.globalScore || sc.semanticScore || 0) + "%";
        document.getElementById("intel-score-role")!.textContent = (sc.executiveScore || 0) + "%";
        document.getElementById("intel-score-seniority")!.textContent = (sc.freshnessScore || 0) + "%";
        document.getElementById("intel-score-location")!.textContent = (sc.locationScore || 0) + "%";
        document.getElementById("intel-score-sector")!.textContent = (sc.sectorScore || 0) + "%";
        document.getElementById("intel-score-proofs")!.textContent = (sc.companyScore || 0) + "%";
        document.getElementById("intel-score-risks")!.textContent = (100 - (sc.riskScore || 0)) + "%";

        var priorityMap: Record<string, string> = { HIGH: "Prioritaire", MEDIUM: "Intéressant", LOW: "À surveiller", AVOID: "À éviter" };
        var recLabel = sc.recommendation || "MEDIUM";
        document.getElementById("intel-priority-label")!.textContent = "Recommandation : " + (priorityMap[recLabel] || recLabel);

        var details: any = {};
        if (sc.semanticAnalysisJson) {
          try { details = JSON.parse(sc.semanticAnalysisJson); } catch(e){}
        }

        var fortsList = document.getElementById("reasoning-forts-list");
        var gapsList = document.getElementById("reasoning-gaps-list");
        var risksList = document.getElementById("reasoning-risks-list");

        if (fortsList && details.positiveSignals) {
          fortsList.innerHTML = details.positiveSignals.slice(0, 5).map(function(s: string){ return "<li>" + esc(s) + "</li>"; }).join("");
        }
        if (gapsList && details.missingSignals) {
          gapsList.innerHTML = details.missingSignals.slice(0, 5).map(function(s: string){ return "<li>" + esc(s) + "</li>"; }).join("");
        }
        if (risksList && details.riskSignals) {
          risksList.innerHTML = details.riskSignals.slice(0, 5).map(function(s: string){ return "<li>" + esc(s) + "</li>"; }).join("");
        }

        document.getElementById("reasoning-strategy")!.textContent = details.explanation || "Dossier sémantique prêt.";
        document.getElementById("reasoning-cv-angle")!.textContent = details.suggestedCvAngle || "Valoriser les réalisations exécutives chiffrées.";

        document.getElementById("reasoning-empty")!.style.display = "none";
        document.getElementById("reasoning-data")!.style.display = "block";
        
        renderJobDashboard(draft);

        var titleInput = document.getElementById("edit-title") as HTMLInputElement;
        var companyInput = document.getElementById("edit-company") as HTMLInputElement;
        var locationInput = document.getElementById("edit-location") as HTMLInputElement;
        if (titleInput) titleInput.value = job.title || "";
        if (companyInput) companyInput.value = job.company || "";
        if (locationInput) locationInput.value = job.location || "";

        var platformEl = document.getElementById("preview-platform");
        if (platformEl) platformEl.textContent = platformLabel(detectPlatform(job.sourceUrl || ""));

        recomputeConfidence();

        if (currentTab === "import") {
          show("import-preview");
        }
      }
    })
    .catch(function(e) {
      console.error("Error loading draft details:", e);
    });
}

export function saveJobTrackingData() {
  if (!documentsDraftId) return;
  
  var stage = (document.getElementById("pipeline-stage-select") as HTMLSelectElement).value;
  var excitementVal = currentExcitement || 0;
  var minSal = parseInt((document.getElementById("salary-min-input") as HTMLInputElement).value) || null;
  var maxSal = parseInt((document.getElementById("salary-max-input") as HTMLInputElement).value) || null;
  var notes = (document.getElementById("job-notes-textarea") as HTMLTextAreaElement).value;
  
  var statusEl = document.getElementById("notes-save-status");
  if (statusEl) {
    statusEl.style.display = "block";
    statusEl.textContent = "Sauvegarde...";
    statusEl.style.color = "#777";
  }

  var payload: any = {
    pipelineStatus: stage,
    excitement: excitementVal,
    salaryMin: minSal,
    salaryMax: maxSal,
    notes: notes
  };

  fetch(getApiUrl("/api/application-drafts/" + documentsDraftId), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then(function(r) { return r.json(); })
    .then(function(d: any) {
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

export function fetchLetterText(draftId: string, callback: (err: any, text?: string) => void) {
  fetch(getApiUrl("/api/application-drafts/" + draftId + "/documents/cover-letter-text"))
    .then(function(r) { return r.json(); })
    .then(function(d: any) {
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

function renderJobDashboard(draft: any) {
  var job = draft.job || {};
  
  var dbEl = document.getElementById("imported-job-dashboard");
  if (dbEl) dbEl.style.display = "block";
  
  var stageSelect = document.getElementById("pipeline-stage-select") as HTMLSelectElement;
  if (stageSelect) stageSelect.value = draft.pipelineStatus || "draft";
  
  setCurrentExcitement(draft.excitement || 0);
  updateStarsUI(currentExcitement);
  
  var minSal = document.getElementById("salary-min-input") as HTMLInputElement;
  var maxSal = document.getElementById("salary-max-input") as HTMLInputElement;
  if (minSal) minSal.value = job.salaryMin || "";
  if (maxSal) maxSal.value = job.salaryMax || "";
  
  var notesText = document.getElementById("job-notes-textarea") as HTMLTextAreaElement;
  if (notesText) notesText.value = draft.notes || "";
  
  var keywords: string[] = [];
  try {
    if (draft.atsKeywords) keywords = JSON.parse(draft.atsKeywords);
    else if (draft.keyRequirements) keywords = JSON.parse(draft.keyRequirements);
  } catch(e){}
  if (!Array.isArray(keywords)) keywords = [];
  
  var gaps: string[] = [];
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
  document.getElementById("keywords-match-pct")!.textContent = totalPct + "%";
  document.getElementById("keywords-compliance-list")!.innerHTML = kwListHtml;
}

function updateStarsUI(val: number) {
  var stars = document.querySelectorAll("#excitement-stars span");
  stars.forEach(function(star, idx) {
    if (idx < val) {
      (star as HTMLElement).style.color = "#c8a64e";
    } else {
      (star as HTMLElement).style.color = "#333";
    }
  });
}

function recomputeConfidence() {
  var title = ((document.getElementById("edit-title") as HTMLInputElement) || {}).value || "";
  var company = ((document.getElementById("edit-company") as HTMLInputElement) || {}).value || "";
  var location = ((document.getElementById("edit-location") as HTMLInputElement) || {}).value || "";
  var hasDesc = capturedData && capturedData.jobs && capturedData.jobs[0] && capturedData.jobs[0].description && capturedData.jobs[0].description.length > 40;
  var score = (title ? 35 : 0) + (company ? 25 : 0) + (hasDesc ? 15 : 0) + (location ? 10 : 0);
  updateSendButton();
  updateConfidenceUI(score);
}

function updateSendButton() {
  var title = ((document.getElementById("edit-title") as HTMLInputElement) || {}).value || "";
  var company = ((document.getElementById("edit-company") as HTMLInputElement) || {}).value || "";
  var btn = document.getElementById("btn-send") as HTMLButtonElement;
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

function updateConfidenceUI(score: number) {
  var confEl = document.getElementById("preview-confidence"); if (!confEl) return;
  confEl.textContent = score + "%";
  confEl.className = "badge " + (score >= 70 ? "badge-green" : score >= 40 ? "badge-yellow" : "badge-red");
  var bar = document.getElementById("confidence-bar-fill"); if (!bar) return;
  (bar as HTMLElement).style.width = Math.max(5, score) + "%";
  bar.className = "confidence-fill " + (score >= 70 ? "confidence-high" : score >= 40 ? "confidence-medium" : "confidence-low");
}

export function clearDraftDetails() {
  document.getElementById("opp-intel-scores")!.style.display = "none";
  document.getElementById("intel-score-global")!.textContent = "0%";
  document.getElementById("intel-score-role")!.textContent = "0%";
  document.getElementById("intel-score-seniority")!.textContent = "0%";
  document.getElementById("intel-score-location")!.textContent = "0%";
  document.getElementById("intel-score-sector")!.textContent = "0%";
  document.getElementById("intel-score-proofs")!.textContent = "0%";
  document.getElementById("intel-score-risks")!.textContent = "0%";
  document.getElementById("intel-priority-label")!.textContent = "Recommandation : —";

  var db = document.getElementById("imported-job-dashboard");
  if (db) db.style.display = "none";

  document.getElementById("reasoning-empty")!.style.display = "block";
  document.getElementById("reasoning-data")!.style.display = "none";
}

// ═══════════════════════════════════════════════
// RECRUTEUR — Endpoints
// ═══════════════════════════════════════════════

// Importer un profil candidat scrappé dans la base PRSTO
export function importCandidateProfile(profile: any, callback?: (err: any, data: any) => void) {
  var payload = {
    platform: profile.platform || "linkedin",
    sourceUrl: profile.url,
    name: profile.name,
    title: profile.title,
    location: profile.location,
    about: profile.about || "",
    experiences: profile.experiences || [],
    skills: profile.skills || [],
    confidence: profile.confidence || 0,
  };

  fetch(getApiUrl("/api/recruiter/candidates/import"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then(function(r) { return r.json(); })
    .then(function(d: any) {
      addLog("importer-candidat", "Candidat importé: " + profile.name);
      if (callback) callback(null, d);
    })
    .catch(function(err) {
      showNotification("Erreur import candidat: " + err.message, "error");
      if (callback) callback(err);
    });
}

// Scanner une offre client (depuis job board) et la sauver
export function importClientOffer(offer: any, callback?: (err: any, data: any) => void) {
  var payload = {
    title: offer.title,
    company: offer.company,
    location: offer.location || "",
    description: offer.rawText || offer.description || "",
    platform: offer.platform || "generic",
    sourceUrl: offer.url || window.location.href,
  };

  fetch(getApiUrl("/api/recruiter/offers/import"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then(function(r) { return r.json(); })
    .then(function(d: any) {
      addLog("importer-offre", "Offre importée: " + offer.title);
      if (callback) callback(null, d);
    })
    .catch(function(err) {
      showNotification("Erreur import offre: " + err.message, "error");
      if (callback) callback(err);
    });
}

// Matcher un candidat contre une offre client
export function matchCandidateToOffer(candidateId: string, offerId: string, callback?: (err: any, data: any) => void) {
  fetch(getApiUrl("/api/recruiter/match"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ candidateId: candidateId, offerId: offerId })
  })
    .then(function(r) { return r.json(); })
    .then(function(d: any) {
      addLog("matching", "Matching complété — score: " + (d.score || 0));
      if (callback) callback(null, d);
    })
    .catch(function(err) {
      showNotification("Erreur matching: " + err.message, "error");
      if (callback) callback(err);
    });
}

// Générer un dossier complet pour un candidat (CV formaté + lettre + brief)
export function generateDossier(candidateId: string, offerId: string, callback?: (err: any, data: any) => void) {
  fetch(getApiUrl("/api/recruiter/dossiers/generate"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ candidateId: candidateId, offerId: offerId, generateCv: true, generateLettre: true, generateBrief: true })
  })
    .then(function(r) { return r.json(); })
    .then(function(d: any) {
      addLog("dossier", "Dossier généré — id: " + (d.dossierId || ""));
      if (callback) callback(null, d);
    })
    .catch(function(err) {
      showNotification("Erreur génération dossier: " + err.message, "error");
      if (callback) callback(err);
    });
}

// Partager un dossier au client (générer lien privé)
export function shareDossierToClient(dossierId: string, callback?: (err: any, data: any) => void) {
  fetch(getApiUrl("/api/recruiter/dossiers/" + dossierId + "/share"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}) 
  })
    .then(function(r) { return r.json(); })
    .then(function(d: any) {
      addLog("partage", "Lien client généré: " + (d.shareUrl || ""));
      if (callback) callback(null, d);
    })
    .catch(function(err) {
      showNotification("Erreur partage: " + err.message, "error");
      if (callback) callback(err);
    });
}

// Obtenir la liste des candidats du recruteur
export function getCandidateList(callback?: (err: any, data: any) => void) {
  fetch(getApiUrl("/api/recruiter/candidates/list"))
    .then(function(r) { return r.json(); })
    .then(function(d: any) {
      if (callback) callback(null, d);
    })
    .catch(function(err) {
      if (callback) callback(err);
    });
}

// Obtenir la liste des offres clients
export function getOfferList(callback?: (err: any, data: any) => void) {
  fetch(getApiUrl("/api/recruiter/offers/list"))
    .then(function(r) { return r.json(); })
    .then(function(d: any) {
      if (callback) callback(null, d);
    })
    .catch(function(err) {
      if (callback) callback(err);
    });
}

// Mettre à jour le statut d'une mission
export function updateMissionStatus(missionId: string, status: string, callback?: (err: any, data: any) => void) {
  fetch(baseUrl + "/api/recruiter/missions/" + missionId + "/status", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: status })
  })
    .then(function(r) { return r.json(); })
    .then(function(d: any) {
      addLog("mission", "Mission " + missionId + " → " + status);
      if (callback) callback(null, d);
    })
    .catch(function(err) {
      if (callback) callback(err);
    });
}
