// Pure function — no DB, no network, no AI. Testable unitairement.

export type ReadinessStatus =
  | "not_started"
  | "in_progress"
  | "almost_ready"
  | "ready"
  | "active";

export type SectionBreakdown = Record<
  string,
  { score: number; max: number; ok: boolean; label: string }
>;

export type AgentReadinessResult = {
  globalScore: number;
  status: ReadinessStatus;
  missingFields: string[];
  completedSections: string[];
  nextBestAction: string;
  breakdown: SectionBreakdown;
};

export type ReadinessProfile = {
  fullName: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  languages: string | null;
  yearsExp: number | null;
  sectors: string | null;
  functions: string | null;
  education: string | null;
  certifications: string | null;
  remotePreference: string | null;
  targetSalary: string | null;
  constraints: string | null;
  preferredTone: string | null;
};

export type ReadinessCVMaster = {
  originalText: string | null;
  status: string | null;
} | null;

export type ReadinessExperience = {
  company: string | null;
  title: string | null;
  startDate: string | null;
  description: string | null;
  teamSize: string | null;
  revenue: string | null;
  budget: string | null;
};

export type ReadinessSkill = {
  name: string;
};

export type ReadinessProofEntry = {
  category: string;
  title: string;
  value: string;
  verifiable: boolean;
};

export type ReadinessJobSource = {
  active: boolean;
  priority: number;
};

export type ReadinessSettings = {
  aiProvider: string | null;
  apiKey: string | null;
  confidentialityMode: string | null;
};

export type ReadinessPipelineStats = {
  total: number;
};

export type ReadinessPriorityRole = {
  name: string;
};

export type ReadinessTargetCountry = {
  code: string;
};

export function calculateAgentReadiness(params: {
  profile: ReadinessProfile | null;
  cvMaster: ReadinessCVMaster;
  experiences: ReadinessExperience[];
  skills: ReadinessSkill[];
  proofEntries: ReadinessProofEntry[];
  jobSources: ReadinessJobSource[];
  settings: ReadinessSettings | null;
  pipelineStats: ReadinessPipelineStats;
  priorityRoles: ReadinessPriorityRole[];
  targetCountries: ReadinessTargetCountry[];
}): AgentReadinessResult {
  const breakdown: SectionBreakdown = {};
  const missingFields: string[] = [];
  const completedSections: string[] = [];

  const p = params.profile;

  // 1. Identité (10 pts)
  let identityScore = 0;
  if (p?.fullName) identityScore += 2.5;
  else missingFields.push("Nom complet");
  if (p?.title) identityScore += 2.5;
  else missingFields.push("Titre / poste actuel");
  if (p?.email) identityScore += 2.5;
  else missingFields.push("Email");
  if (p?.phone) identityScore += 2.5;
  else missingFields.push("Téléphone");
  breakdown.identity = {
    score: identityScore,
    max: 10,
    ok: identityScore >= 7.5,
    label: "Identité",
  };
  if (identityScore >= 7.5) completedSections.push("Identité");

  // 2. Ciblage exécutif (15 pts)
  let targetingScore = 0;
  if (params.priorityRoles.length >= 1) targetingScore += 3;
  else missingFields.push("Au moins un rôle prioritaire");
  if (params.targetCountries.length >= 1) targetingScore += 3;
  else missingFields.push("Au moins un pays cible");
  if (p?.sectors && p.sectors !== "[]" && p.sectors.length > 2) targetingScore += 3;
  else missingFields.push("Secteurs d'activité");
  if (p?.functions && p.functions !== "[]" && p.functions.length > 2) targetingScore += 3;
  else missingFields.push("Fonctions");
  if (p?.yearsExp && p.yearsExp > 0) targetingScore += 3;
  else missingFields.push("Années d'expérience");
  breakdown.targeting = {
    score: targetingScore,
    max: 15,
    ok: targetingScore >= 9,
    label: "Ciblage exécutif",
  };
  if (targetingScore >= 9) completedSections.push("Ciblage exécutif");

  // 3. Expériences (20 pts)
  let expScore = 0;
  const exps = params.experiences;
  if (exps.length >= 2) expScore += 10;
  else if (exps.length === 1) expScore += 5;
  else missingFields.push("Au moins 2 expériences professionnelles");

  const withDesc = exps.filter((e) => e.description && e.description.trim().length > 10).length;
  if (withDesc >= 1) expScore += 5;
  else missingFields.push("Au moins une expérience avec description");

  const withNumbers = exps.filter(
    (e) =>
      (e.teamSize && e.teamSize.trim().length > 0) ||
      (e.revenue && e.revenue.trim().length > 0) ||
      (e.budget && e.budget.trim().length > 0)
  ).length;
  if (withNumbers >= 1) expScore += 5;
  else missingFields.push("Au moins une expérience avec chiffres (équipe, CA, budget)");
  breakdown.experiences = {
    score: expScore,
    max: 20,
    ok: expScore >= 15,
    label: "Expériences",
  };
  if (expScore >= 15) completedSections.push("Expériences");

  // 4. Compétences & Langues (10 pts)
  let skillScore = 0;
  if (params.skills.length >= 5) skillScore += 5;
  else if (params.skills.length >= 2) skillScore += 2.5;
  else missingFields.push("Au moins 5 compétences");

  if (p?.languages && p.languages !== "[]" && p.languages.length > 2) skillScore += 5;
  else missingFields.push("Langues parlées");
  breakdown.skills = {
    score: skillScore,
    max: 10,
    ok: skillScore >= 7.5,
    label: "Compétences & Langues",
  };
  if (skillScore >= 7.5) completedSections.push("Compétences & Langues");

  // 5. CV Maître (15 pts)
  let cvScore = 0;
  if (params.cvMaster?.originalText && params.cvMaster.originalText.trim().length > 50) {
    cvScore += 10;
    if (params.cvMaster.status === "validé") cvScore += 5;
  } else {
    missingFields.push("CV Maître importé");
  }
  breakdown.cvMaster = { score: cvScore, max: 15, ok: cvScore >= 10, label: "CV Maître" };
  if (cvScore >= 10) completedSections.push("CV Maître");

  // 6. Proof Vault (15 pts)
  let proofScore = 0;
  const proofs = params.proofEntries;
  const chiffreEntries = proofs.filter(
    (p) => p.category === "CA" || p.category === "croissance" || p.category === "équipe" || p.category === "budget"
  );
  if (chiffreEntries.length >= 1) proofScore += 5;
  else missingFields.push("Au moins un chiffre dans le Proof Vault");
  if (proofs.length >= 3) proofScore += 5;
  else missingFields.push("Au moins 3 entrées dans le Proof Vault");
  const verifiable = proofs.filter((p) => p.verifiable).length;
  if (verifiable >= 1) proofScore += 5;
  else missingFields.push("Au moins une entrée vérifiable dans le Proof Vault");
  breakdown.proofVault = {
    score: proofScore,
    max: 15,
    ok: proofScore >= 10,
    label: "Proof Vault",
  };
  if (proofScore >= 10) completedSections.push("Proof Vault");

  // 7. Sources (5 pts)
  let sourceScore = 0;
  const activeSources = params.jobSources.filter((s) => s.active);
  if (activeSources.length >= 1) sourceScore += 3;
  else missingFields.push("Au moins une source d'emploi active");
  if (params.jobSources.some((s) => s.priority >= 1)) sourceScore += 2;
  else missingFields.push("Au moins une source marquée prioritaire");
  breakdown.sources = { score: sourceScore, max: 5, ok: sourceScore >= 3, label: "Sources" };
  if (sourceScore >= 3) completedSections.push("Sources");

  // 8. IA & Confidentialité (5 pts)
  let iaScore = 0;
  if (params.settings?.confidentialityMode)
    iaScore += 3;
  else missingFields.push("Mode de confidentialité IA configuré");
  if (params.settings?.apiKey && params.settings.apiKey.trim().length > 0) iaScore += 2;
  else if (params.settings?.aiProvider === "none") iaScore += 2; // pas besoin de clé si pas d'IA
  else missingFields.push("Clé API DeepSeek configurée");
  breakdown.ia = { score: iaScore, max: 5, ok: iaScore >= 3, label: "IA & Confidentialité" };
  if (iaScore >= 3) completedSections.push("IA & Confidentialité");

  // 9. Pipeline initial (5 pts)
  let pipelineScore = 0;
  if (params.pipelineStats.total >= 1) {
    pipelineScore += 5;
  } else {
    missingFields.push("Au moins une opportunité dans le pipeline");
  }
  breakdown.pipeline = {
    score: pipelineScore,
    max: 5,
    ok: pipelineScore >= 5,
    label: "Pipeline initial",
  };
  if (pipelineScore >= 5) completedSections.push("Pipeline initial");

  // Global score
  const globalScore = Math.round(
    (identityScore + targetingScore + expScore + skillScore + cvScore + proofScore + sourceScore + iaScore + pipelineScore)
  );

  // Status
  let status: ReadinessStatus;
  if (globalScore < 10) status = "not_started";
  else if (globalScore < 50) status = "in_progress";
  else if (globalScore < 75) status = "almost_ready";
  else if (globalScore < 90) status = "ready";
  else status = "active";

  // Next best action
  let nextBestAction: string;
  if (status === "not_started") {
    nextBestAction = "Commencez par renseigner votre identité et importer votre CV Maître.";
  } else if (!breakdown.identity.ok) {
    nextBestAction = "Complétez votre identité (nom, titre, email, téléphone).";
  } else if (!breakdown.cvMaster.ok) {
    nextBestAction = "Importez votre CV Maître pour alimenter le Proof Vault.";
  } else if (!breakdown.experiences.ok) {
    nextBestAction = "Ajoutez vos expériences professionnelles avec des chiffres.";
  } else if (!breakdown.targeting.ok) {
    nextBestAction = "Définissez vos rôles prioritaires et pays cibles.";
  } else if (!breakdown.skills.ok) {
    nextBestAction = "Complétez vos compétences et langues.";
  } else if (!breakdown.proofVault.ok) {
    nextBestAction = "Enrichissez votre Proof Vault avec des chiffres vérifiables.";
  } else if (!breakdown.sources.ok) {
    nextBestAction = "Activez vos sources d'emploi prioritaires.";
  } else if (!breakdown.ia.ok) {
    nextBestAction = "Configurez l'IA et la confidentialité dans les paramètres.";
  } else if (!breakdown.pipeline.ok) {
    nextBestAction = "Importez une première opportunité dans le pipeline.";
  } else {
    nextBestAction = "Votre agent est prêt. Analysez des offres et générez des documents.";
  }

  return {
    globalScore,
    status,
    missingFields,
    completedSections,
    nextBestAction,
    breakdown,
  };
}

export const SECTION_ORDER = [
  "identity",
  "targeting",
  "experiences",
  "skills",
  "cvMaster",
  "proofVault",
  "sources",
  "ia",
  "pipeline",
];
