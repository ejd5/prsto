// ─── Mock Interview — 3 System Prompts ───
// PrepPrompt  → génère personas + questions
// LoopPrompt  → analyse réponse + décide suite
// AuditPrompt → compile le rapport final

export interface PortraitPersona {
  id: string;
  name: string;
  title: string;
  traits: string[];
}

export interface PrepOutput {
  personas: PortraitPersona[];
  questions: {
    text: string;
    assignedTo: string;
    type: "opening" | "behavioral" | "stress" | "closing";
  }[];
}

export interface LoopOutput {
  action: "next_question" | "follow_up" | "conclude";
  speaker: string;
  question: string;
  feedback_point?: string;
}

export interface AuditOutput {
  global_score: number;
  dimensions: {
    structure: { score: number; evidence: string };
    concision: { score: number; evidence: string };
    impact: { score: number; evidence: string };
    posture: { score: number; evidence: string };
    aisance_orale: { score: number; evidence: string };
  };
  synthesis: string;
  strengths: string[];
  improvements: string[];
}

export function getPrepPrompt(params: {
  language: string;
  company: string;
  jobTitle: string;
  jobDescription: string;
  strengths: string[];
  panelPersonas: PortraitPersona[];
  existingQuestions: string[];
}): { systemPrompt: string; userPrompt: string } {
  const personaDescriptions = params.panelPersonas
    .map((p) => `- ${p.name} (${p.title}) — traits: ${p.traits.join(", ")}`)
    .join("\n");

  return {
    systemPrompt: `Tu es un coach exécutif qui prépare des simulations d'entretien.

Tu reçois :
- Les infos du poste et de l'entreprise
- Le profil du candidat (points forts)
- La composition du panel
- Un historique des questions déjà posées à ce candidat

Tu dois générer :
1. Les PERSONAS des membres du panel (nom, poste, traits de personnalité)
2. 5 QUESTIONS d'entretien variées, réparties entre les membres du panel

RÈGLES ABSOLUES :
- Langue de l'entretien : ${params.language}
- Les questions doivent être incisives, contextuelles, adaptées au poste et au profil
- NE JAMAIS poser une question déjà dans l'historique
- Varier les types de questions (ouverture, comportemental, stress, technique, conclusion)
- Chaque question est assignée à un membre du panel spécifique

Réponds UNIQUEMENT avec un objet JSON valide.`,
    userPrompt: JSON.stringify({
      company: params.company,
      jobTitle: params.jobTitle,
      jobDescription: params.jobDescription,
      candidateStrengths: params.strengths,
      panel: params.panelPersonas,
      alreadyAskedQuestions: params.existingQuestions,
      language: params.language,
    }),
  };
}

export function getLoopPrompt(params: {
  language: string;
  userTranscript: string;
  lastQuestion: string;
  sessionHistory: { question: string; answer: string }[];
  wpm: number;
  silenceRatio: number;
  postureScore: number;
  gazeScore: number;
  remainingQuestions: number;
}): { systemPrompt: string; userPrompt: string } {
  return {
    systemPrompt: `Tu es un examinateur exécutif qui analyse les réponses en temps réel.

Tu reçois :
- La dernière question posée
- La transcription de la réponse du candidat
- L'historique de la session
- Les métriques en direct (WPM, silence, posture, regard)

Tu dois décider :
- "next_question" → question suivante normale
- "follow_up" → rebondir sur la réponse (creuser un point)
- "conclude" → assez de questions, clôturer

RÈGLES ABSOLUES :
- Langue : ${params.language}
- Si la réponse est trop courte ou évasive → follow_up
- Si la réponse est complète et de qualité → next_question
- S'il reste 0 questions et pas de follow-up nécessaire → conclude
- Le feedback_point est optionnel : une observation courte sur la réponse
- ALTERNER les speakers : ne pas donner 2 questions de suite à la même personne

Réponds UNIQUEMENT avec un objet JSON valide.`,
    userPrompt: JSON.stringify({
      lastQuestion: params.lastQuestion,
      transcript: params.userTranscript,
      sessionHistory: params.sessionHistory,
      metrics: {
        wpm: params.wpm,
        silenceRatio: params.silenceRatio,
        postureScore: params.postureScore,
        gazeScore: params.gazeScore,
      },
      remainingQuestions: params.remainingQuestions,
      language: params.language,
    }),
  };
}

export function getAuditPrompt(params: {
  language: string;
  sessionHistory: { question: string; answer: string }[];
  metrics: {
    avgWpm: number;
    avgSilenceRatio: number;
    avgPostureScore: number;
    avgGazeScore: number;
  };
  company: string;
  jobTitle: string;
}): { systemPrompt: string; userPrompt: string } {
  return {
    systemPrompt: `Tu es un coach exécutif senior spécialisé dans l'évaluation de présence et de communication.

Tu reçois la transcription complète d'un entretien simulé ainsi que les métriques biométriques.

Tu dois produire un rapport structuré avec :
- Un score global (0-100)
- 5 dimensions notées (structure, concision, impact, posture, aisance orale)
- Chaque dimension a : score (0-20), evidence (citation ou observation concrète)
- Synthèse (3-4 phrases)
- 3 forces
- 3 axes d'amélioration

Sois précis, cite des extraits de la transcription. Ne sois pas générique.
Langue du rapport : ${params.language}.

Réponds UNIQUEMENT avec un objet JSON valide.`,
    userPrompt: JSON.stringify({
      company: params.company,
      jobTitle: params.jobTitle,
      transcript: params.sessionHistory.map(
        (s) => `Q: ${s.question}\nR: ${s.answer}`,
      ).join("\n\n"),
      metrics: params.metrics,
      language: params.language,
    }),
  };
}
