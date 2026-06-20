export interface DetectionInput {
  demoProfileExists: boolean;
  cvMasterExists: boolean;
  proofCount: number;
  verifiableProofCount: number;
  opportunityCount: number;
  analyzedOpportunityCount: number;
  approvedDocCount: number;
  plannedRelanceCount: number;
  sentRelanceCount: number;
  pipelineTaskCount: number;
  profileComplete: boolean;
}

export interface DetectionResult {
  id: string;
  label: string;
  ok: boolean;
  severity: "ok" | "warning" | "error";
  message: string;
  recommendation: string;
}

export function detectDemoDataRemains(input: DetectionInput): DetectionResult {
  const ok = !input.demoProfileExists;
  return {
    id: "demo-data",
    label: "Données démo supprimées",
    ok,
    severity: ok ? "ok" : "error",
    message: ok
      ? "Aucune donnée [DEMO] détectée dans le profil."
      : "Des données de démonstration [DEMO] sont encore présentes.",
    recommendation: ok
      ? "Parfait. Vous travaillez avec vos vraies données."
      : "Utilisez le bouton 'Supprimer données démo' dans /test-flow pour les nettoyer.",
  };
}

export function detectCVMasterMissing(input: DetectionInput): DetectionResult {
  const ok = input.cvMasterExists;
  return {
    id: "cv-master",
    label: "CV Maître importé",
    ok,
    severity: ok ? "ok" : "error",
    message: ok
      ? "CV Maître présent dans la base."
      : "Aucun CV Maître importé.",
    recommendation: ok
      ? "Vérifiez que le contenu est bien votre CV réel (pas [DEMO])."
      : "Importez votre vrai CV dans /cv-maitre avant de générer des documents.",
  };
}

export function detectProofVaultInsufficient(input: DetectionInput): DetectionResult {
  const hasVerifiable = input.verifiableProofCount >= 1;
  const hasEnough = input.proofCount >= 5;

  if (hasEnough && hasVerifiable) {
    return {
      id: "proof-vault",
      label: "Proof Vault suffisant",
      ok: true,
      severity: "ok",
      message: `${input.proofCount} preuves dont ${input.verifiableProofCount} vérifiable(s).`,
      recommendation: "Continuez à enrichir votre Proof Vault au fil du temps.",
    };
  }
  if (!hasVerifiable) {
    return {
      id: "proof-vault",
      label: "Preuves vérifiables manquantes",
      ok: false,
      severity: "error",
      message: `Aucune preuve vérifiable (${input.proofCount} preuves au total).`,
      recommendation: "Ajoutez au moins 1 preuve vérifiable (chiffre, date, source) dans /proof-vault.",
    };
  }
  return {
    id: "proof-vault",
    label: "Proof Vault à enrichir",
    ok: false,
    severity: "warning",
    message: `Seulement ${input.proofCount} preuve(s). Visez au moins 5.`,
    recommendation: "Ajoutez des preuves (CA, équipe, certifications, langues) dans /proof-vault.",
  };
}

export function detectNoRealOffers(input: DetectionInput): DetectionResult {
  if (input.opportunityCount === 0) {
    return {
      id: "real-offers",
      label: "Offres réelles",
      ok: false,
      severity: "error",
      message: "Aucune opportunité réelle dans la base.",
      recommendation: "Ajoutez au moins 5 vraies offres manuellement ou via les sources dans /sources.",
    };
  }
  if (input.opportunityCount < 5) {
    return {
      id: "real-offers",
      label: "Offres réelles",
      ok: false,
      severity: "warning",
      message: `${input.opportunityCount} opportunité(s) — objectif : 5 minimum.`,
      recommendation: `Ajoutez encore ${5 - input.opportunityCount} offre(s) pour atteindre le seuil recommandé.`,
    };
  }
  return {
    id: "real-offers",
    label: "Offres réelles",
    ok: true,
    severity: "ok",
    message: `${input.opportunityCount} opportunités dans la base.`,
    recommendation: "Vérifiez que ce sont bien vos 5 vraies offres (pas [DEMO]).",
  };
}

export function detectNoApprovedDocs(input: DetectionInput): DetectionResult {
  const ok = input.approvedDocCount >= 1;
  return {
    id: "approved-docs",
    label: "Documents approuvés",
    ok,
    severity: ok ? "ok" : "warning",
    message: ok
      ? `${input.approvedDocCount} document(s) approuvé(s).`
      : "Aucun document approuvé.",
    recommendation: ok
      ? "Vos documents sont prêts à être envoyés."
      : "Générez et approuvez au moins un CV dans /documents.",
  };
}

export function detectNoPlannedRelances(input: DetectionInput): DetectionResult {
  const total = input.plannedRelanceCount + input.sentRelanceCount;
  const ok = total >= 1;
  return {
    id: "relances",
    label: "Relances planifiées",
    ok,
    severity: ok ? "ok" : "warning",
    message: ok
      ? `${total} relance(s) (${input.sentRelanceCount} envoyée(s)).`
      : "Aucune relance planifiée ou envoyée.",
    recommendation: ok
      ? "Continuez le suivi de vos candidatures."
      : "Planifiez des relances J+5 depuis le /pipeline.",
  };
}

export function detectNoPipeline(input: DetectionInput): DetectionResult {
  const ok = input.pipelineTaskCount >= 1;
  return {
    id: "pipeline",
    label: "Pipeline actif",
    ok,
    severity: ok ? "ok" : "warning",
    message: ok
      ? `${input.pipelineTaskCount} tâche(s) dans le pipeline.`
      : "Aucune tâche dans le pipeline.",
    recommendation: ok
      ? "Suivez la progression de vos candidatures."
      : "Ajoutez vos offres au pipeline dans /pipeline.",
  };
}

export function detectUnanalyzedOffers(input: DetectionInput): DetectionResult {
  if (input.opportunityCount === 0) {
    return {
      id: "analyzed-offers",
      label: "Offres analysées",
      ok: true,
      severity: "ok",
      message: "Aucune offre à analyser.",
      recommendation: "Ajoutez des offres puis lancez leur analyse.",
    };
  }
  const ok = input.analyzedOpportunityCount >= input.opportunityCount;
  return {
    id: "analyzed-offers",
    label: "Offres analysées",
    ok,
    severity: ok ? "ok" : "warning",
    message: ok
      ? `Toutes les offres (${input.opportunityCount}) sont analysées.`
      : `${input.analyzedOpportunityCount}/${input.opportunityCount} offres analysées.`,
    recommendation: ok
      ? "Les scores et analyses sont disponibles."
      : "Lancez l'analyse des offres restantes dans /analyse.",
  };
}

export function detectRealUsageStatus(input: DetectionInput): DetectionResult[] {
  return [
    detectDemoDataRemains(input),
    detectCVMasterMissing(input),
    detectProofVaultInsufficient(input),
    detectNoRealOffers(input),
    detectNoApprovedDocs(input),
    detectNoPlannedRelances(input),
    detectNoPipeline(input),
    detectUnanalyzedOffers(input),
  ];
}

export function countReadyChecks(results: DetectionResult[]): number {
  return results.filter((r) => r.ok).length;
}

const WEIGHTS: Record<string, number> = {
  "demo-data": 20,
  "cv-master": 20,
  "real-offers": 20,
  "proof-vault": 15,
  "approved-docs": 15,
  relances: 10,
  pipeline: 10,
  "analyzed-offers": 10,
};

export function realUsageReadiness(results: DetectionResult[]): number {
  let earned = 0;
  let total = 0;
  for (const r of results) {
    const w = WEIGHTS[r.id] ?? 10;
    total += w;
    if (r.ok) earned += w;
  }
  if (total === 0) return 0;
  return Math.round((earned / total) * 100);
}
