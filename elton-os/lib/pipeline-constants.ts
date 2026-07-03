export const PIPELINE_COLUMNS = [
  { key: "nouveau", label: "Nouveau", phase: "Découverte" },
  { key: "a_analyser", label: "À analyser", phase: "Découverte" },
  { key: "analyse", label: "Analysé", phase: "Préparation" },
  { key: "a_preparer", label: "Candidature à préparer", phase: "Préparation" },
  { key: "document_a_valider", label: "Document à valider", phase: "Préparation" },
  { key: "pret_a_envoyer", label: "Prêt à envoyer", phase: "Préparation" },
  { key: "envoye", label: "Envoyé", phase: "Action" },
  { key: "relance_1", label: "Relance 1", phase: "Action" },
  { key: "relance_2", label: "Relance 2", phase: "Action" },
  { key: "entretien_rh", label: "Entretien RH", phase: "Entretiens" },
  { key: "entretien_direction", label: "Entretien Direction", phase: "Entretiens" },
  { key: "offre", label: "Offre", phase: "Décision" },
  { key: "refus", label: "Refus", phase: "Décision" },
  { key: "archive", label: "Archivé", phase: "Décision" },
] as const;

export type PipelineColumn = (typeof PIPELINE_COLUMNS)[number]["key"];
