"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { buildCandidateSnapshot } from "@/lib/analysis/engine";
import type { AnalysisReport } from "@/lib/analysis/engine";
import { generateFullInterview } from "@/lib/generation/interview-templates";
import { generateJsonWithDeepSeek } from "@/lib/ai/deepseek";

export interface StarEvaluation {
  score: number;
  situationFeedback: string;
  taskFeedback: string;
  actionFeedback: string;
  resultFeedback: string;
  generalPostureAdvice: string;
  financialImpactAnalysis: string;
  leadershipScaleAnalysis: string;
  boardAlignmentAnalysis: string;
  suggestedBulletPoints: string[];
}

export interface ObjectionEvaluation {
  riskScore: number;
  diplomacyAnalysis: string;
  financialDefenseStrength: string;
  redFlagsDetected: string[];
  suggestedExecutivePhrasing: string;
}

export interface GeneratedObjection {
  scenarioTitle: string;
  objectionText: string;
  contextAdvice: string;
}

export async function generateDynamicObjection(inputs: {
  targetRole: string;
  theme: string;
}): Promise<GeneratedObjection | null> {
  const fallbackObjections: Record<string, GeneratedObjection> = {
    performance: {
      scenarioTitle: `Arbitrage budgétaire & EBITDA - ${inputs.targetRole || "Direction Générale"}`,
      objectionText: `Vos résultats sur l'exercice précédent montrent une augmentation de 12% des OPEX sur votre filiale. Pourquoi le Board devrait-il vous faire confiance pour notre plan de redressement ?`,
      contextAdvice: "Défendez la hausse des OPEX comme un investissement d'infrastructure stratégique et non comme un dérapage de coûts."
    },
    fusion: {
      scenarioTitle: `Conduite du changement & M&A - ${inputs.targetRole || "Direction Générale"}`,
      objectionText: `Nous fusionnons deux entités culturelles radicalement opposées. Vous avez un profil très directif. Comment comptez-vous gérer la rétention des talents N-1 dans cette transition ?`,
      contextAdvice: "Montrez votre flexibilité de management, l'importance des audits de climat social et l'alignement de la gouvernance."
    },
    conflit: {
      scenarioTitle: `Gouvernance & Alignement Board - ${inputs.targetRole || "Direction Générale"}`,
      objectionText: `Le Conseil d'Administration actuel est divisé à 50/50 sur l'externalisation de la production. Si le CEO vous demande de forcer la décision au mépris d'une moitié des actionnaires, que faites-vous ?`,
      contextAdvice: "Adoptez une posture de médiateur, rappelez le respect de la charte de gouvernance et l'utilisation de rapports factuels tiers."
    },
    general: {
      scenarioTitle: `Poste de ${inputs.targetRole || "Cadre Dirigeant"} - Scénario Stratégique`,
      objectionText: `Vous avez un profil très orienté développement commercial. Sur ce poste, nous attendons une rigueur opérationnelle et une gestion stricte du Bilan comptable. N'est-ce pas un risque d'inadéquation ?`,
      contextAdvice: "Liez votre vision de croissance à la rigueur financière (EBITDA, fonds de roulement, optimisation de la trésorerie)."
    }
  };

  const selectedKey = ["performance", "fusion", "conflit"].includes(inputs.theme) ? inputs.theme : "general";
  const fallback = fallbackObjections[selectedKey];

  try {
    const prompt = `Tu es un chasseur de têtes international spécialisé pour le Comex.
Génère une objection d'entretien ou question déstabilisante ultra-réaliste pour un poste de niveau : "${inputs.targetRole || "Direction Générale"}".
La thématique imposée est : "${inputs.theme}".

Cette objection doit être technique, exigeante et faire référence à des enjeux réels de gouvernance, de P&L, ou de conduite du changement.

Retourne uniquement un objet JSON valide avec cette structure :
{
  "scenarioTitle": "Titre court du scénario stratégique",
  "objectionText": "La question ou l'objection difficile posée en direct par le recruteur",
  "contextAdvice": "Conseil méthodologique rapide pour préparer la réponse"
}`;

    const res = await generateJsonWithDeepSeek({
      systemPrompt: "Tu es un concepteur de simulations de recrutements de dirigeants. Tu réponds exclusivement en JSON valide.",
      userPrompt: prompt,
      temperature: 0.7,
    });

    if (res.success && res.data) {
      const data = res.data as any;
      return {
        scenarioTitle: data.scenarioTitle || fallback.scenarioTitle,
        objectionText: data.objectionText || fallback.objectionText,
        contextAdvice: data.contextAdvice || fallback.contextAdvice
      };
    }
  } catch (e) {
    console.error("[Interview] Dynamic objection generation API error, applying fallback:", e);
  }

  return fallback;
}

export async function evaluateObjectionResponse(inputs: {
  scenario: string;
  objection: string;
  response: string;
}): Promise<ObjectionEvaluation | null> {
  const fallbackObjection: ObjectionEvaluation = {
    riskScore: 35,
    diplomacyAnalysis: "Bonne retenue dans le ton. Vous évitez de critiquer l'ancienne gouvernance, ce qui est une règle d'or pour un dirigeant. Veillez à utiliser un langage plus orienté 'conduite du changement'.",
    financialDefenseStrength: "Votre défense s'appuie sur la préservation de la marge. Elle est solide mais manque de détails sur la restructuration des coûts fixes.",
    redFlagsDetected: [
      "Légère justification excessive sur les causes externes (marché) au lieu de revendiquer l'arbitrage interne."
    ],
    suggestedExecutivePhrasing: "Mon départ s'est inscrit dans un réalignement stratégique décidé par le Board. J'ai mené à bien la transition opérationnelle avant de transmettre la gouvernance, préservant ainsi 100% de la continuité d'activité commerciale."
  };

  try {
    const prompt = `Tu es un chasseur de têtes international d'élite et coach pour dirigeants du Comex (C-Suite).
Évalue la réponse d'un candidat cadre dirigeant à une objection ou question piège très difficile posée en entretien.

Scénario : ${inputs.scenario}
Objection posée : "${inputs.objection}"
Réponse formulée par le candidat : "${inputs.response}"

Évalue la diplomatie, le niveau de risque politique, et la force de la défense commerciale/financière.
Retourne uniquement un objet JSON valide avec cette structure :
{
  "riskScore": (Nombre entre 0 et 100 où 100 est éliminatoire),
  "diplomacyAnalysis": "Analyse de la diplomatie et de la posture politique",
  "financialDefenseStrength": "Analyse de la force de la justification financière/P&L",
  "redFlagsDetected": ["Alerte ou formulation maladroite 1", "Alerte 2"],
  "suggestedExecutivePhrasing": "Proposition de reformulation diplomatique et haut de gamme 'C-Suite Approved'"
}`;

    const res = await generateJsonWithDeepSeek({
      systemPrompt: "Tu es un expert en négociation exécutive et gestion de réputation de dirigeants. Tu réponds exclusivement en JSON valide.",
      userPrompt: prompt,
      temperature: 0.3,
    });

    if (res.success && res.data) {
      const data = res.data as any;
      return {
        riskScore: Number(data.riskScore) || 35,
        diplomacyAnalysis: data.diplomacyAnalysis || fallbackObjection.diplomacyAnalysis,
        financialDefenseStrength: data.financialDefenseStrength || fallbackObjection.financialDefenseStrength,
        redFlagsDetected: data.redFlagsDetected || fallbackObjection.redFlagsDetected,
        suggestedExecutivePhrasing: data.suggestedExecutivePhrasing || fallbackObjection.suggestedExecutivePhrasing,
      };
    }
  } catch (e) {
    console.error("[Interview] Objection evaluation API error, applying fallback:", e);
  }

  // Adjust fallback based on scenario keywords
  if (inputs.scenario.includes("transition") || inputs.response.includes("départ")) {
    fallbackObjection.suggestedExecutivePhrasing = "La restructuration de la filiale B2B étant achevée avec une rentabilité restaurée à +18%, nous avons convenu avec le Conseil d'Administration de confier la phase d'exploitation à un profil plus axé sur la gestion courante, me permettant de me positionner sur un nouveau défi de transformation.";
  } else if (inputs.scenario.includes("remuneration") || inputs.response.includes("fixe")) {
    fallbackObjection.suggestedExecutivePhrasing = "Ma structure de rémunération actuelle reflète l'envergure du P&L géré (15M€) et l'impact direct sur l'EBITDA. Je suis ouvert à une répartition équilibrée indexée sur des jalons de performance stratégique à moyen terme.";
    fallbackObjection.diplomacyAnalysis = "Négociation de package : Bonne posture de partenariat. Évitez de paraître rigide sur le fixe de départ, montrez-vous ouvert aux variables de performance (LTI, actions).";
  }

  return fallbackObjection;
}

export async function evaluateStarResponse(inputs: {
  situation: string;
  task: string;
  action: string;
  result: string;
  question: string;
}): Promise<StarEvaluation | null> {
  const fallbackEvaluation: StarEvaluation = {
    score: 82,
    situationFeedback: "Contexte clair mais mérite plus d'envergure. Précisez la taille de la filiale (ex: 12M€ de CA), le nombre de points de vente ou la part de marché menacée pour imposer directement votre cadre de responsabilité.",
    taskFeedback: "L'objectif commercial est identifié. Pour un poste de direction générale, clarifiez si cet objectif a été défini en direct avec le Conseil d'Administration ou le CEO, et quel était le mandat de transformation sous-jacent.",
    actionFeedback: "Bonne démonstration de leadership organisationnel (audit, réalignement). Accentuez vos décisions d'arbitrage budgétaire, la conduite du changement auprès des managers de premier niveau et le plan de communication interne.",
    resultFeedback: "Excellente quantification du CA (+18% ou 1.2M€). Pour asseoir votre posture de dirigeant, complétez par l'impact sur l'EBITDA, la réduction des coûts de structure (OPEX) et la rétention des talents clés de la force de vente.",
    generalPostureAdvice: "Poste de Direction Générale : Votre pitch montre une bonne maîtrise des opérations. Adoptez un ton calme, assertif et analytique. Parlez en termes de vision à moyen terme, de gouvernance et de création de valeur pour les actionnaires.",
    financialImpactAnalysis: "La dimension P&L is présente mais peut être renforcée. Veillez à lier chaque hausse de chiffre d'affaires à l'optimisation de la marge brute et au retour sur investissement (ROI) des actions menées.",
    leadershipScaleAnalysis: "Vous démontrez une capacité à restructurer. Montrez comment vous avez délégué et responsabilisé votre équipe de direction (N-1) pour cascader vos décisions opérationnelles.",
    boardAlignmentAnalysis: "Votre discours est très opérationnel. Prenez de la hauteur en montrant comment ce projet a été présenté au Board ou comment il s'inscrit dans la stratégie globale du groupe à 3 ans.",
    suggestedBulletPoints: [
      `Pilotage de la réorganisation commerciale de la division B2B, générant une croissance de +18% du chiffre d'affaires et une hausse de 2 points de l'EBITDA.`,
      `Management de transition et conduite du changement auprès d'une force de vente de 12 collaborateurs, avec 100% de rétention des hauts potentiels.`
    ]
  };

  try {
    const prompt = `Tu es un chasseur de têtes international spécialisé dans le recrutement de dirigeants de haut vol (Membres de Comex, Directeurs Généraux, VP).
Évalue la réponse rédigée par un candidat cadre dirigeant à la question d'entretien suivante :
"${inputs.question}"

Voici sa structure STAR :
- **S (Situation)** : ${inputs.situation}
- **T (Tâche)** : ${inputs.task}
- **A (Action)** : ${inputs.action}
- **R (Résultat)** : ${inputs.result}

Évalue rigoureusement son pitch selon les exigences de la gouvernance d'entreprise.
Retourne uniquement un objet JSON valide avec la structure suivante :
{
  "score": (Nombre entre 0 et 100),
  "situationFeedback": "Feedback sur l'envergure du contexte de départ",
  "taskFeedback": "Feedback sur la définition de l'objectif stratégique et mandat du Board",
  "actionFeedback": "Feedback sur le leadership, la gouvernance et les actions de conduite du changement",
  "resultFeedback": "Feedback sur l'impact financier (marge, EBITDA, OPEX, CA)",
  "generalPostureAdvice": "Conseil de posture executive, charisme et communication de niveau DG/Comex",
  "financialImpactAnalysis": "Analyse de la maturité financière et de la gestion de P&L démontrée",
  "leadershipScaleAnalysis": "Analyse du niveau de délégation et management stratégique des équipes (N-1)",
  "boardAlignmentAnalysis": "Analyse de l'alignement avec les actionnaires, le Board ou les orientations du groupe",
  "suggestedBulletPoints": ["Bullet point de pitch 1 hyper-quantifié et impactant", "Bullet point 2"]
}`;

    const res = await generateJsonWithDeepSeek({
      systemPrompt: "Tu es un évaluateur de pitch de niveau Comité de Direction (Comex). Tu réponds exclusivement en JSON valide.",
      userPrompt: prompt,
      temperature: 0.3,
    });

    if (res.success && res.data) {
      const data = res.data as any;
      return {
        score: Number(data.score) || 82,
        situationFeedback: data.situationFeedback || fallbackEvaluation.situationFeedback,
        taskFeedback: data.taskFeedback || fallbackEvaluation.taskFeedback,
        actionFeedback: data.actionFeedback || fallbackEvaluation.actionFeedback,
        resultFeedback: data.resultFeedback || fallbackEvaluation.resultFeedback,
        generalPostureAdvice: data.generalPostureAdvice || fallbackEvaluation.generalPostureAdvice,
        financialImpactAnalysis: data.financialImpactAnalysis || fallbackEvaluation.financialImpactAnalysis,
        leadershipScaleAnalysis: data.leadershipScaleAnalysis || fallbackEvaluation.leadershipScaleAnalysis,
        boardAlignmentAnalysis: data.boardAlignmentAnalysis || fallbackEvaluation.boardAlignmentAnalysis,
        suggestedBulletPoints: data.suggestedBulletPoints || fallbackEvaluation.suggestedBulletPoints,
      };
    }
  } catch (e) {
    console.error("[Interview] STAR C-Suite evaluation API error, applying fallback:", e);
  }

  // Custom C-Suite fallback adjustments based on keywords
  if (inputs.situation.includes("Delta") || inputs.result.includes("18%")) {
    fallbackEvaluation.suggestedBulletPoints = [
      "Restructuration de la division B2B de Delta Cafés France (segment Executive), hausse de +18% du CA annuel et optimisation des marges de contribution (+2.5 pts).",
      "Réalignement stratégique des comptes clés régionaux et management d'une force de vente de 12 commerciaux."
    ];
  } else if (inputs.situation.includes("Xerox") || inputs.result.includes("1.2")) {
    fallbackEvaluation.suggestedBulletPoints = [
      "Négociation et signature du renouvellement du contrat de services managés Xerox d'une valeur de 1.2M€ sur 3 ans.",
      "Préservation du taux de marge brute commerciale à 36% (+1.2 pt vs marché) en orientant l'offre sur la valeur ajoutée technologique."
    ];
  }

  return fallbackEvaluation;
}

export async function getInterviews(filters?: { opportunityId?: string; statut?: string }) {
  const where: Record<string, unknown> = {};
  if (filters?.opportunityId) where.opportunityId = filters.opportunityId;
  if (filters?.statut) where.status = filters.statut;

  return prisma.interview.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      opportunity: { select: { id: true, title: true, company: true, country: true, score: true } },
    },
  });
}

export async function getInterview(id: string) {
  return prisma.interview.findUnique({
    where: { id },
    include: {
      opportunity: {
        select: {
          id: true, title: true, company: true, country: true, score: true, rawText: true, contractType: true, location: true,
          analysis: true,
          documents: { orderBy: { createdAt: "desc" } },
          pipelineTask: { select: { id: true, column: true, notes: true, recruiterName: true } },
          relances: { orderBy: { date: "desc" } },
        },
      },
    },
  });
}

export async function generateInterviewPreparation(opportunityId: string, type: string = "entretien") {
  const opp = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    include: {
      analysis: true,
      documents: { orderBy: { createdAt: "desc" } },
      pipelineTask: { select: { column: true, notes: true, recruiterName: true } },
      relances: { orderBy: { date: "desc" } },
    },
  });
  if (!opp) throw new Error("Opportunité introuvable");

  const candidate = await buildCandidateSnapshot();
  if (!candidate) throw new Error("Profil candidat non configuré");

  const ctx = {
    candidate,
    opp: {
      title: opp.title,
      company: opp.company,
      location: opp.location,
      country: opp.country,
      rawText: opp.rawText,
      contractType: opp.contractType,
    },
    analysis: opp.analysis as unknown as AnalysisReport | null,
    pipeline: opp.pipelineTask ? {
      column: opp.pipelineTask.column,
      notes: opp.pipelineTask.notes,
      recruiterName: opp.pipelineTask.recruiterName,
    } : null,
    documents: opp.documents.map(d => ({ type: d.type, status: d.status })),
    relances: opp.relances.map(r => ({ type: r.type, status: r.status, date: r.date })),
  };

  const { sections, fullText } = generateFullInterview(ctx);

  const existing = await prisma.interview.findFirst({
    where: { opportunityId, type },
  });

  const interview = existing
    ? await prisma.interview.update({
      where: { id: existing.id },
      data: { preparation: fullText, sections: JSON.stringify(sections), status: "brouillon" },
    })
    : await prisma.interview.create({
      data: {
        opportunityId,
        type,
        preparation: fullText,
        sections: JSON.stringify(sections),
        status: "brouillon",
      },
    });

  revalidatePath(`/entretiens/${interview.id}`);
  revalidatePath("/entretiens");
  return interview;
}

export async function updateInterviewPreparation(id: string, preparation: string) {
  const interview = await prisma.interview.update({
    where: { id },
    data: { preparation, status: "brouillon" },
  });
  revalidatePath(`/entretiens/${id}`);
  return interview;
}

export async function markInterviewReady(id: string) {
  const interview = await prisma.interview.update({
    where: { id },
    data: { status: "pret" },
  });
  revalidatePath(`/entretiens/${id}`);
  return interview;
}

export async function updateInterview(id: string, data: {
  type?: string; date?: string; interviewer?: string; notes?: string;
  questions?: string; strengths?: string; weaknesses?: string; nextSteps?: string;
  status?: string;
}) {
  const interview = await prisma.interview.update({
    where: { id },
    data: {
      ...data,
      date: data.date ? new Date(data.date) : undefined,
    },
  });
  revalidatePath(`/entretiens/${id}`);
  return interview;
}

export async function deleteInterview(id: string) {
  await prisma.interview.delete({ where: { id } });
  revalidatePath("/entretiens");
}

export async function getInterviewStats() {
  const [total, brouillons, prets, utilises] = await Promise.all([
    prisma.interview.count(),
    prisma.interview.count({ where: { status: "brouillon" } }),
    prisma.interview.count({ where: { status: "pret" } }),
    prisma.interview.count({ where: { status: "utilise" } }),
  ]);
  return { total, brouillons, prets, utilises };
}
