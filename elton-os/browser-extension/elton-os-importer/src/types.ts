declare namespace chrome {
  // Augment with custom message types if needed
}

interface CapturedData {
  title: string;
  company: string;
  location: string;
  platform: string;
  rawText: string;
  url: string;
  confidence: number;
  warnings: string[];
  scores?: {
    global: number;
    role: number;
    seniority: number;
    location_score: number;
    sector: number;
    proofs: number;
    risks: number;
  };
  reasoning?: {
    strategy: string;
    forts: string[];
    gaps: string[];
    risques: string[];
    cvAngle: string;
  };
}

// Recruteur — Profil candidat capturé
interface CandidateProfile {
  type: "candidate" | "candidate_search";
  platform: string;
  url: string;
  name: string;
  title: string;
  location: string;
  about: string;
  experiences?: Array<{ title: string; company: string; dates: string }>;
  skills: string[];
  confidence: number;
  profiles?: Array<{ name: string; title: string; location: string; url: string }>;
  count?: number;
}

interface AutofillField {
  label: string;
  key: string;
  value: string;
  certainty: "sure" | "uncertain" | "found";
  status: string;
}

interface DraftDetails {
  id: string;
  title: string;
  company: string;
  status: string;
  keywords_match_pct?: number;
  keywords?: { keyword: string; found: boolean }[];
  notes?: string;
  excitement?: number;
  salary_min?: number;
  salary_max?: number;
  pipelineStage?: string;
}

// Recruteur — Mission
interface MissionItem {
  id: string;
  candidateName: string;
  clientName: string;
  role: string;
  status: string;
  updatedAt: string;
}

// Recruteur — Client offer
interface ClientOffer {
  id?: string;
  title: string;
  company: string;
  location: string;
  description: string;
  platform: string;
  sourceUrl: string;
}
