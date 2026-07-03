"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type UxMode = "simple" | "expert";

const STORAGE_KEY = "elton-os-ux-mode";

interface UxModeContextValue {
  mode: UxMode;
  setMode: (m: UxMode) => void;
  toggle: () => void;
  /** True when in expert mode — convenience alias */
  isExpert: boolean;
  /** True when in simple mode */
  isSimple: boolean;
}

const UxModeContext = createContext<UxModeContextValue | null>(null);

export function UxModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<UxMode>("simple");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "simple" || stored === "expert") setModeState(stored);
  }, []);

  const setMode = (m: UxMode) => {
    setModeState(m);
    localStorage.setItem(STORAGE_KEY, m);
  };

  const toggle = () => setMode(mode === "simple" ? "expert" : "simple");

  return (
    <UxModeContext.Provider value={{ mode, setMode, toggle, isExpert: mode === "expert", isSimple: mode === "simple" }}>
      {children}
    </UxModeContext.Provider>
  );
}

export function useUxMode(): UxModeContextValue {
  const ctx = useContext(UxModeContext);
  if (!ctx) throw new Error("useUxMode must be used within UxModeProvider");
  return ctx;
}

/**
 * Maps technical labels to human-readable variants.
 * In simple mode, technical terms are replaced by plain language.
 */
const TECHNICAL_TO_HUMAN: Record<string, string> = {
  // Scores
  semanticScore: "Score de compatibilité",
  executiveScore: "Score exécutif",
  globalScore: "Score global",
  semanticConfidence: "Fiabilité",
  locationScore: "Score géographique",
  reasonCode: "Raison",
  // Sources / import
  "USER_ASSISTED": "Import assisté",
  "AUTO_FIRECRAWL_SAFE": "Source publique vérifiée",
  "AUTO_RSS_FEED": "Flux RSS automatique",
  "AUTO_OFFICIAL_API": "API officielle",
  "AUTO_BROWSER_AGENT": "Agent navigateur",
  "AUTO_MANUAL_CLIPBOARD": "Presse-papier",
  // Status
  shortlisted: "Enregistré",
  archived: "Archivé",
  dismissed: "Mis de côté",
  // Recommendations
  highly_recommended: "Très pertinent",
  recommended: "Pertinent",
  possible: "Possible",
  low_priority: "Faible priorité",
  // Pipeline
  draft: "Brouillon",
  ready_to_review: "Prêt à vérifier",
  approved: "Approuvé",
  sent: "Envoyé",
  rejected: "Non retenu",
  // Platform
  contractType: "Type de contrat",
  salaryMin: "Salaire min.",
  salaryMax: "Salaire max.",
  sourceName: "Source",
  sourceUrl: "URL de l'offre",
  publishedAt: "Date de publication",
  // Entities
  Opportunity: "Offre",
  Analysis: "Analyse",
  Document: "Document",
  PipelineTask: "Tâche pipeline",
  // Features
  "Firecrawl Safe": "Source publique",
  "Safe Source Registry": "Sources vérifiées",
  "Market Radar": "Scanner",
  "Proof Vault": "Preuves",
  targetSalary: "Prétentions salariales",
  remotePreference: "Préférence télétravail",
};

export function humanLabel(technical: string): string {
  return TECHNICAL_TO_HUMAN[technical] || technical;
}
