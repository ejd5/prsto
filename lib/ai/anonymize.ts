// ─── Anonymization Engine ───
// Pure functions — no AI, no network, no side effects
// Masks sensitive data before sending to cloud AI

// ─── Types ────────────────────────────────────────

export interface AnonymizationConfig {
  anonymizeName: boolean;
  anonymizeEmail: boolean;
  anonymizePhone: boolean;
  anonymizeCompanies: boolean;
  anonymizeSalary: boolean;
}

export interface CandidateProfileInput {
  fullName: string;
  title: string;
  email?: string | null;
  phone?: string | null;
  linkedin?: string | null;
  location?: string | null;
  summary?: string | null;
  yearsExp?: number | null;
  sectors: string[];
  functions: string[];
  languages: string[];
  mobility?: string | null;
}

export interface AnonymizedProfile {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  linkedin: string;
  location: string;
  summary: string;
  yearsExp: number | null;
  sectors: string[];
  functions: string[];
  languages: string[];
  mobility: string;
}

export interface PayloadPreview {
  mode: "local" | "anonymise" | "complet";
  whatIsSent: string[];
  whatIsMasked: string[];
  samplePayload: Record<string, unknown>;
}

// ─── Constants ────────────────────────────────────

const PLACEHOLDERS = {
  name: "Candidat Exécutif",
  email: "candidat@exemple.com",
  phone: "+33 X XX XX XX XX",
  linkedin: "linkedin.com/in/candidat",
  location: "Ville, Pays",
  company: "[Entreprise confidentielle]",
  salary: "[Salaire confidentiel]",
};

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return PLACEHOLDERS.email;
  const visible = Math.min(2, local.length);
  return local.slice(0, visible) + "***@" + domain;
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return PLACEHOLDERS.phone;
  return digits.slice(0, 2) + " XX XX XX " + digits.slice(-2);
}

// ─── Anonymize candidate profile ──────────────────

export function anonymizeCandidateProfile(
  profile: CandidateProfileInput,
  config: AnonymizationConfig,
): AnonymizedProfile {
  return {
    fullName: config.anonymizeName ? PLACEHOLDERS.name : profile.fullName,
    title: profile.title,
    email: config.anonymizeEmail && profile.email
      ? maskEmail(profile.email)
      : (profile.email || PLACEHOLDERS.email),
    phone: config.anonymizePhone && profile.phone
      ? maskPhone(profile.phone)
      : (profile.phone || PLACEHOLDERS.phone),
    linkedin: profile.linkedin && (config.anonymizeName || config.anonymizeEmail)
      ? PLACEHOLDERS.linkedin
      : (profile.linkedin || ""),
    location: config.anonymizeName ? PLACEHOLDERS.location : (profile.location || ""),
    summary: profile.summary || "",
    yearsExp: profile.yearsExp ?? null,
    sectors: profile.sectors,
    functions: profile.functions,
    languages: profile.languages,
    mobility: profile.mobility || "",
  };
}

// ─── Anonymize opportunity data ───────────────────

export function anonymizeOpportunity(
  opp: {
    title: string;
    company: string;
    location?: string | null;
    country?: string | null;
    salaryMin?: number | null;
    salaryMax?: number | null;
  },
  config: AnonymizationConfig,
): {
  title: string;
  company: string;
  location: string;
  country: string;
  salaryMin: number | null;
  salaryMax: number | null;
} {
  return {
    title: opp.title,
    company: config.anonymizeCompanies ? PLACEHOLDERS.company : opp.company,
    location: config.anonymizeCompanies ? "Ville, Pays" : (opp.location || ""),
    country: opp.country || "",
    salaryMin: config.anonymizeSalary ? null : (opp.salaryMin ?? null),
    salaryMax: config.anonymizeSalary ? null : (opp.salaryMax ?? null),
  };
}

// ─── Anonymize document context ───────────────────

export function anonymizeDocumentContext(
  context: string,
  config: AnonymizationConfig,
  candidateName: string,
): string {
  let result = context;

  if (config.anonymizeName && candidateName) {
    result = result.replace(new RegExp(candidateName, "gi"), PLACEHOLDERS.name);
  }

  if (config.anonymizeEmail) {
    result = result.replace(/[\w.-]+@[\w.-]+\.\w{2,}/g, PLACEHOLDERS.email);
  }

  if (config.anonymizePhone) {
    result = result.replace(/(?:\+?\d{1,3}[\s.-]?)?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,4}[\s.-]?\d{1,4}/g, PLACEHOLDERS.phone);
  }

  if (config.anonymizeCompanies) {
    result = result.replace(/\b(?:SAS?|SARL|SA|EURL|Ltd|Inc|GmbH|Corp)\b/gi, "");
  }

  return result;
}

// ─── Build payload preview ────────────────────────

export function buildAiPayloadPreview(params: {
  mode: "local" | "anonymise" | "complet";
  settings: AnonymizationConfig;
  profile: CandidateProfileInput;
  opportunity: { title: string; company: string; location?: string | null };
}): PayloadPreview {
  const { mode, settings, profile, opportunity } = params;

  if (mode === "local") {
    return {
      mode: "local",
      whatIsSent: ["Aucune donnée n'est envoyée — la génération est 100% locale."],
      whatIsMasked: [],
      samplePayload: {},
    };
  }

  const anonymizedProfile = anonymizeCandidateProfile(profile, settings);
  const anonymizedOpp = anonymizeOpportunity(opportunity, settings);

  const whatIsSent: string[] = [];
  const whatIsMasked: string[] = [];

  whatIsSent.push(`Titre du poste : ${anonymizedOpp.title}`);
  whatIsSent.push(`Entreprise : ${anonymizedOpp.company}`);
  whatIsSent.push(`Nom : ${anonymizedProfile.fullName}`);
  whatIsSent.push(`Titre candidat : ${anonymizedProfile.title}`);
  whatIsSent.push(`Email : ${anonymizedProfile.email}`);

  if (settings.anonymizeName) {
    whatIsMasked.push("Nom complet → masqué");
    whatIsMasked.push("LinkedIn → masqué");
  }
  if (settings.anonymizeEmail) {
    whatIsMasked.push("Email → partiellement masqué");
  }
  if (settings.anonymizePhone) {
    whatIsMasked.push("Téléphone → masqué");
  }
  if (settings.anonymizeCompanies) {
    whatIsMasked.push("Entreprise cible → masquée");
  }
  if (settings.anonymizeSalary) {
    whatIsMasked.push("Salaire → masqué");
  }

  return {
    mode,
    whatIsSent,
    whatIsMasked,
    samplePayload: {
      profile: {
        name: anonymizedProfile.fullName,
        title: anonymizedProfile.title,
        email: anonymizedProfile.email,
        sectors: anonymizedProfile.sectors,
        languages: anonymizedProfile.languages,
      },
      opportunity: {
        title: anonymizedOpp.title,
        company: anonymizedOpp.company,
      },
    },
  };
}
