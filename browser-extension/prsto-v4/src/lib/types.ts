/**
 * PRSTO Copilot — Shared types (background ↔ sidepanel ↔ content)
 */

export type SupportedPlatform =
  | "linkedin"
  | "indeed"
  | "apec"
  | "cadremploi"
  | "wttj"
  | "unknown";

export interface JobOffer {
  platform: SupportedPlatform;
  url: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  contractType?: string;
  description: string;
  postedAt?: string;
  applyUrl?: string;
  companyLogo?: string;
  extractionQuality: number;
  hints: string[];
  raw: Record<string, unknown>;
  capturedAt: string;
}

export interface CandidateProfile {
  name?: string;
  title?: string;
  yearsExperience?: number;
  skills?: string[];
  expectedSalary?: number;
  preferredLocations?: string[];
  preferredRoles?: string[];
  industries?: string[];
  sectors?: string[];
  languages?: string[];
}

export type ChatRole = "system" | "user" | "assistant" | "context";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  streaming?: boolean;
  meta?: {
    score?: JobScore;
    offer?: { title: string; company: string; url: string };
    latencyMs?: number;
    tokens?: number;
  };
}

export interface JobScore {
  global: number;
  breakdown: {
    role: number;
    seniority: number;
    location: number;
    sector: number;
    skills: number;
    atsCompatibility: number;
  };
  strengths: string[];
  gaps: string[];
  atsKeywordsMissing: string[];
  oneLineVerdict: string;
  recommendation: "postuler" | "retravailler" | "passer";
}

export interface ExtensionSettings {
  baseUrl: string;
  apiToken?: string;
  candidateProfile?: CandidateProfile;
  autoAnalyse: boolean;
  model: string;
  temperature: number;
}

export const DEFAULT_SETTINGS: ExtensionSettings = {
  baseUrl: "http://localhost:3000",
  autoAnalyse: true,
  model: "deepseek-chat",
  temperature: 0.4,
};
