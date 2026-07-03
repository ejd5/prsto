/**
 * PRSTO Recruteur — State Machine & Unified Workflow Store
 */
import { detectPlatform } from "./helpers";
import { checkHealth } from "../core/backend";

export type WorkflowStep =
  | "idle"
  | "context_detecting"
  | "context_detected"
  | "extracting"
  | "extracted"
  | "importing"
  | "imported"
  | "dedupe_checking"
  | "duplicate_alert"
  | "matching"
  | "match_completed"
  | "generating_dossier"
  | "dossier_ready"
  | "error";

export interface CandidateExtraction {
  name: string;
  title: string;
  location: string;
  about: string;
  experiences: Array<{ title: string; company: string; dates: string }>;
  skills: string[];
  confidence: number;
}

export interface OfferExtraction {
  title: string;
  company: string;
  location: string;
  description: string;
  confidence: number;
}

export interface WorkflowState {
  step: WorkflowStep;
  activeTabId?: number;
  activeUrl?: string;
  platform?: string;
  pageType?: "candidate_profile" | "job_offer" | "candidate_search" | "generic" | "unknown";
  
  candidatePreview?: CandidateExtraction;
  importedCandidateId?: string;
  
  offerPreview?: OfferExtraction;
  importedOfferId?: string;
  
  matchResult?: {
    score: number;
    matching?: Record<string, number>;
    recommendation?: string;
  };
  
  dossierResult?: {
    dossierId: string;
    shareUrl?: string;
  };
  
  errorMessage?: string;
  lastUpdatedAt: string;
}

// Memory fallback if chrome.storage is not ready
let currentStoreState: WorkflowState = {
  step: "idle",
  lastUpdatedAt: new Date().toISOString()
};

export function getStoreState(): WorkflowState {
  return currentStoreState;
}

export function initStore(callback: (state: WorkflowState) => void) {
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.session) {
    chrome.storage.session.get(["workflowState"], function(res) {
      if (res && res.workflowState) {
        currentStoreState = res.workflowState;
      }
      callback(currentStoreState);
    });
  } else {
    callback(currentStoreState);
  }
}

export function updateStoreState(updates: Partial<WorkflowState>, callback?: (state: WorkflowState) => void) {
  currentStoreState = {
    ...currentStoreState,
    ...updates,
    lastUpdatedAt: new Date().toISOString()
  };
  
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.session) {
    chrome.storage.session.set({ workflowState: currentStoreState }, function() {
      if (callback) callback(currentStoreState);
    });
  } else {
    if (callback) callback(currentStoreState);
  }
}

/**
 * Detects context based on URL structure and updates state machine
 */
export function detectCurrentContext(url: string, callback?: (state: WorkflowState) => void) {
  const platform = detectPlatform(url);
  let pageType: WorkflowState["pageType"] = "generic";
  
  const u = url.toLowerCase();
  if (u.includes("linkedin.com/in/")) {
    pageType = "candidate_profile";
  } else if (u.includes("linkedin.com/jobs/view") || u.includes("linkedin.com/jobs/search")) {
    pageType = "job_offer";
  } else if (u.includes("github.com/") && !u.includes("/repositories") && !u.includes("/projects") && u.split("/").length <= 5) {
    // Basic username match
    pageType = "candidate_profile";
  } else if (u.includes("indeed.com") && (u.includes("rc/clk") || u.includes("viewjob") || u.includes("jobs"))) {
    pageType = "job_offer";
  } else if (u.includes("apec.fr") && u.includes("detail-offre")) {
    pageType = "job_offer";
  } else if (u.includes("hellowork.com") && u.includes(".html")) {
    pageType = "job_offer";
  } else if (u.includes("welcometothejungle.com") && u.includes("/jobs/")) {
    pageType = "job_offer";
  }

  updateStoreState({
    activeUrl: url,
    platform: platform,
    pageType: pageType,
    step: "context_detected"
  }, callback);
}
