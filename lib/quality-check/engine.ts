// ─── Quality Check Engine ───
// Pure functions — no AI, no network, no side effects
// Evaluates document quality across 10 criteria

export type QualityCriterion =
  | "clarity"
  | "credibility"
  | "personalization"
  | "proof"
  | "humanTone"
  | "atsKeywords"
  | "noInventedGaps"
  | "noGenericPhrases"
  | "executiveLevel"
  | "appropriateLength";

export interface QualityScore {
  overall: number; // 0-100
  breakdown: Record<QualityCriterion, number>; // 0-10 each
  strengths: string[];
  improvements: string[];
  genericPhrases: { text: string; suggestion: string }[];
  riskyPhrases: { text: string; reason: string }[];
  rewriteRecommendations: string[];
}

interface CheckContext {
  text: string;
  offerTitle?: string;
  offerCompany?: string;
  candidateName?: string;
  candidateTitle?: string;
}

// ─── Generic phrase patterns (overused, empty, or AI-slop) ───
const GENERIC_PATTERNS: { pattern: RegExp; suggestion: string }[] = [
  { pattern: /je suis (une personne |quelqu['’]un de )?(passionn[ée]|motiv[ée]|dynamique|rigoureux|autonome)/gi, suggestion: "Remplacez par une preuve concrète (chiffre, résultat)" },
  { pattern: /je suis (convaincu|persuadé|certain) que/gi, suggestion: "Affirmez sans préambule : supprimez « je suis convaincu que »" },
  { pattern: /forte capacit[ée] d['’]adaptation/gi, suggestion: "Remplacez par un exemple de contexte différent maîtrisé rapidement" },
  { pattern: /sens (de l['’]|des )?(organisation|relationnel|communication)/gi, suggestion: "Illustrez par une situation concrète plutôt qu'un trait générique" },
  { pattern: /rigueur et (de |d['’])?organisation/gi, suggestion: "Remplacez par un résultat chiffré démontrant votre rigueur" },
  { pattern: /esprit d['’](équipe|analyse|initiative|entreprise)/gi, suggestion: "Montrez-le par une réalisation plutôt que de le déclarer" },
  { pattern: /dans le cadre de mes fonctions/gi, suggestion: "Supprimez cette formule bureaucratique, allez directement au fait" },
  { pattern: /j['’]ai (pu|eu l['’]occasion de) (développer|travailler|gérer|accompagner)/gi, suggestion: "Supprimez « j'ai eu l'occasion de », commencez par le verbe d'action" },
  { pattern: /fort de (mon|mes) (expérience|années|compétences)/gi, suggestion: "Remplacez par une durée ou un chiffre précis" },
  { pattern: /soucieux de (la|mon|l['’])/gi, suggestion: "Tournure passive — préférez un verbe d'action" },
  { pattern: /au sein de (l['’]|la |le |les |d['’]une )/gi, suggestion: "Limitez « au sein de » à 1 occurrence maximum" },
  { pattern: /j['’]ai (ainsi|également|aussi) pu/gi, suggestion: "Supprimez ces adverbes de remplissage" },
  { pattern: /comme (je l['’]|nous l['’]|vous l['’])ai (mentionné|indiqué|dit|expliqué)/gi, suggestion: "Évitez de vous répéter — supprimez le renvoi" },
  { pattern: /je (souhaite|souhaiterais) (vous |te )?(faire part|exprimer|partager)/gi, suggestion: "Allez droit au but : supprimez la formule de politesse creuse" },
  { pattern: /dans cette (optique|perspective|démarche)/gi, suggestion: "Formule vague — soyez plus direct" },
  { pattern: /je me permets de/gi, suggestion: "Supprimez — vous n'avez pas à demander la permission d'écrire" },
  { pattern: /je (reste|suis|demeure) (à votre |à ta |)disposition/gi, suggestion: "Formule de fin standardisée — personnalisez la clôture" },
  { pattern: /dans l['’]attente de votre retour/gi, suggestion: "Clôture générique — proposez une prochaine étape concrète" },
  { pattern: /n['’]hésitez pas à (me |nous )?(contacter|revenir vers moi)/gi, suggestion: "Évitez la formule toute faite — soyez plus direct" },
  { pattern: /I am (passionate|motivated|dedicated|results-driven|hardworking)/gi, suggestion: "Replace with a concrete achievement or metric" },
  { pattern: /I believe (that |)I (am |would be |can |have )/gi, suggestion: "Drop 'I believe' — state it as fact, not belief" },
  { pattern: /excellent (communication|interpersonal|organizational|leadership) skills/gi, suggestion: "Replace with a concrete example demonstrating the skill" },
  { pattern: /proven track record/gi, suggestion: "Too generic — name a specific metric or result" },
  { pattern: /think outside the box/gi, suggestion: "Cliché — describe a specific innovative solution you delivered" },
  { pattern: /go(-| )getter|self(-| )starter/gi, suggestion: "Avoid cliché — show initiative through a concrete example" },
];

// ─── Risky phrase patterns (could be flagged as invented, exaggerated, or inappropriate) ───
const RISKY_PATTERNS: { pattern: RegExp; reason: string }[] = [
  { pattern: /(?:j['’]ai|nous avons) (généré|réalisé|produit|atteint) \d{2,3}[% ]/gi, reason: "Chiffre non sourcé — vérifiez qu'il est dans le Proof Vault" },
  { pattern: /(?:j['’]ai|nous avons) (généré|réalisé|produit|atteint) \d[\d ]*[kKmM]?€?/gi, reason: "Montant non sourcé — vérifiez qu'il est dans le Proof Vault" },
  { pattern: /\d{2,3}% de (croissance|progression|hausse|augmentation)/gi, reason: "Pourcentage de croissance — doit être vérifiable" },
  { pattern: /(?:diplômé|graduated|MBA|Master|PhD|Doctorat) (?:de|du|de l['’]|from) (?:HEC|ESSEC|INSEAD|Harvard|Stanford|MIT|Oxford|Cambridge)/gi, reason: "Diplôme prestigieux — vérifiez qu'il est bien dans votre profil" },
  { pattern: /(?:J['’]ai|I have) (?:plus de |over |more than )?\d{1,2} ans d['’]expérience/gi, reason: "Nombre d'années — assurez-vous qu'il correspond à votre CV réel" },
  { pattern: /(?:j['’]ai|I) (?:dirigé|managé|lead|managed) (?:une équipe|a team) de \d+/gi, reason: "Taille d'équipe — chiffre à vérifier dans vos preuves" },
  { pattern: /(?:CA|chiffre d['’]affaires|revenue) (?:de|d['’])?\d[\d ]*[kKmM]?€?/gi, reason: "CA / Revenue — donnée sensible, doit être étayée" },
  { pattern: /(?:prix|award|récompense|distinction|classé|ranked|élu)/gi, reason: "Prix ou distinction — vérifiez son existence réelle" },
  { pattern: /(?:publication|article|brevet|patent|conférence|keynote)/gi, reason: "Publication/brevet — doit exister réellement" },
  { pattern: /(?:toujours|jamais|parfaitement|excellent|exceptionnel|remarquable|incroyable)/gi, reason: "Superlatif absolu — préférez un fait mesurable" },
  { pattern: /(?:le meilleur|le premier|le seul|leader|numéro 1|n°1|top)/gi, reason: "Auto-proclamation — étayez par une source externe ou retirez" },
];

// ─── Executive keywords ───
const EXECUTIVE_TERMS = [
  /P&L|profit & loss|compte d['’]exploitation|résultat net|EBITDA|marge/gi,
  /stratég(ie|ique)|strateg(y|ic)|vision|roadmap|transformation/gi,
  /direction|directeur|director|VP|vice president|C-level|executive|comex|codir/gi,
  /négoc|negotiat|contrat|partenariat|alliance|fusion|acquisition/gi,
  /board|conseil d['’]administration|gouvernance|actionnaire|shareholder/gi,
  /international|multiculturel|global|région|region|zone|pays|country|filiale|subsidiary/gi,
  /croissance|growth|scale|déploiement|expansion|lancement|launch/gi,
  /équipe|team|talent|recrutement|hiring|management|leadership/gi,
  /digital|SaaS|transformation|data|IA|AI|machine learning|automat/i,
  /chiffre d['’]affaires|CA|revenu|résultat|rentabilité|budget|forecast/gi,
];

// ─── ATS keyword categories ───
const ATS_CATEGORIES: { name: string; keywords: RegExp[] }[] = [
  {
    name: "Management",
    keywords: [
      /management|direction|leadership|supervision|coordination/gi,
      /équipe|team|département|department|service|unité|unit/gi,
      /recruté|recrutement|hiring|onboarding|formation|training/gi,
    ],
  },
  {
    name: "Commercial",
    keywords: [
      /vente|sales|commercial|business development|négociation|negotiation/gi,
      /client|account|portefeuille|portfolio|pipeline|prospection/gi,
      /chiffre d['’]affaires|revenu|revenue|marge|margin|rentabilité/gi,
    ],
  },
  {
    name: "Stratégie",
    keywords: [
      /stratégie|strategy|stratégique|strategic|plan|roadmap/gi,
      /vision|objectif|croissance|growth|déploiement|expansion/gi,
      /transformation|optimisation|amélioration|improvement/gi,
    ],
  },
  {
    name: "International",
    keywords: [
      /international|global|multiculturel|cross-cultural/gi,
      /anglais|english|bilingue|bilingual|langue|language/gi,
      /pays|country|région|region|zone|territoire|territory/gi,
    ],
  },
];

// ─── Scoring functions ───

function scoreClarity(ctx: CheckContext): { score: number; notes: string[] } {
  const { text } = ctx;
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  if (sentences.length === 0) return { score: 0, notes: ["Texte vide"] };

  const notes: string[] = [];
  let score = 5;

  // Average sentence length (ideal: 15-25 words for FR, 12-20 for EN)
  let totalWords = 0;
  let longSentences = 0;
  for (const s of sentences) {
    const words = s.trim().split(/\s+/).length;
    totalWords += words;
    if (words > 35) longSentences++;
  }
  const avgWords = totalWords / sentences.length;
  if (avgWords >= 15 && avgWords <= 25) { score += 2; } else if (avgWords >= 10 && avgWords <= 30) { score += 1; } else { notes.push("Longueur de phrases à ajuster (15-25 mots idéal)"); }
  if (longSentences === 0) { score += 1; } else { notes.push(`${longSentences} phrase(s) trop longue(s) (>35 mots)`); }

  // Paragraph breaks exist
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);
  if (paragraphs.length >= 2) { score += 1; } else { notes.push("Ajoutez des sauts de paragraphe pour aérer le texte"); }
  if (paragraphs.length >= 4) score += 1;

  return { score: Math.min(10, score), notes };
}

function scoreCredibility(ctx: CheckContext): { score: number; notes: string[] } {
  const { text } = ctx;
  const notes: string[] = [];
  let score = 10;

  // Check for risky patterns
  let riskyFound = 0;
  for (const r of RISKY_PATTERNS) {
    if (r.pattern.test(text)) riskyFound++;
  }
  const deduct = Math.min(6, riskyFound);
  score -= deduct;
  if (riskyFound > 0) notes.push(`${riskyFound} élément(s) potentiellement non vérifiable(s)`);

  // Superlatives
  const superMatches = text.match(/(?:toujours|jamais|parfait|excellent|exceptionnel|remarquable|incroyable|le meilleur|le premier|le seul)/gi);
  if (superMatches && superMatches.length > 0) {
    score = Math.max(0, score - Math.min(3, superMatches.length));
    notes.push(`${superMatches.length} superlatif(s) absolu(s) — préférez des faits mesurables`);
  }

  return { score: Math.max(0, score), notes };
}

function scorePersonalization(ctx: CheckContext): { score: number; notes: string[] } {
  const { text, offerTitle, offerCompany, candidateName, candidateTitle } = ctx;
  const notes: string[] = [];
  let score = 3;

  if (offerCompany && text.toLowerCase().includes(offerCompany.toLowerCase())) { score += 2; } else { notes.push("Mentionnez l'entreprise cible"); }
  if (offerTitle && text.toLowerCase().includes(offerTitle.toLowerCase())) { score += 2; } else { notes.push("Mentionnez le poste cible"); }
  if (candidateName && text.toLowerCase().includes(candidateName.toLowerCase())) { score += 1; } else { notes.push("Votre nom devrait apparaître"); }
  if (candidateTitle && text.toLowerCase().includes(candidateTitle.toLowerCase())) { score += 1; } else { notes.push("Votre titre actuel devrait apparaître"); }

  return { score: Math.min(10, score), notes };
}

function scoreProof(ctx: CheckContext): { score: number; notes: string[] } {
  const { text } = ctx;
  const notes: string[] = [];
  let score = 3;

  // Numbers (quantified results)
  const numberMatches = text.match(/\d+%|\d+[kKmM]€?|\d+ (millions|milliards|M€|k€)|€\d+|USD \d+|CHF \d+/g);
  const numCount = numberMatches ? numberMatches.length : 0;
  if (numCount >= 3) { score += 4; } else if (numCount >= 1) { score += 2; } else { notes.push("Ajoutez des résultats chiffrés (%, montants, tailles d'équipe)"); }

  // Achievement verbs
  const achievementCount = (text.match(/(?:généré|réalisé|atteint|dépassé|cru|augmenté|réduit|optimisé|négocié|décroché|obtenu|doublé|triplé|generated|achieved|delivered|increased|decreased|reduced|grew|negotiated|secured|doubled|tripled)/gi) || []).length;
  if (achievementCount >= 3) { score += 2; } else if (achievementCount >= 1) { score += 1; } else { notes.push("Utilisez des verbes d'accomplissement, pas de mission"); }

  // Percentages specifically
  const pctCount = (text.match(/\d{1,3}%/g) || []).length;
  if (pctCount >= 2) score += 1;

  return { score: Math.min(10, score), notes };
}

function scoreHumanTone(ctx: CheckContext): { score: number; notes: string[] } {
  const { text } = ctx;
  const notes: string[] = [];
  let score = 5;

  // Bureaucratic / impersonal language
  const bureauCount = (text.match(/(?:dans le cadre de|par la présente|veuillez trouver|ci-joint|ci-dessous|susmentionné|susdit|nonobstant|ledit|ladite)/gi) || []).length;
  if (bureauCount === 0) { score += 3; } else { score -= Math.min(4, bureauCount); notes.push(`${bureauCount} formule(s) administrative(s) à supprimer`); }

  // "Je" vs "nous" (FR) — personal is better
  const jeCount = (text.match(/\bje\b/gi) || []).length;
  const nousCount = (text.match(/\bnous\b/gi) || []).length;
  if (jeCount > nousCount) { score += 1; } else if (nousCount > 0) { notes.push("Préférez « je » à « nous » pour un ton plus personnel"); }

  // Natural connectors
  const naturalCount = (text.match(/(?:parce que|c'est pourquoi|concrètement|par exemple|en pratique|notamment|en clair)/gi) || []).length;
  if (naturalCount >= 1) score += 1;

  return { score: Math.max(0, Math.min(10, score)), notes };
}

function scoreAtsKeywords(ctx: CheckContext): { score: number; notes: string[] } {
  const { text } = ctx;
  const notes: string[] = [];
  let score = 3;

  let categoriesMatched = 0;
  for (const cat of ATS_CATEGORIES) {
    const matched = cat.keywords.some((k) => k.test(text));
    if (matched) categoriesMatched++;
  }

  score += categoriesMatched * 1.5;
  if (categoriesMatched < 2) notes.push("Couvrez plus de catégories ATS (management, commercial, stratégie, international)");

  // Keyword density (distinct keywords count)
  const allKeywords = ATS_CATEGORIES.flatMap((c) => c.keywords);
  let distinctMatches = 0;
  for (const k of allKeywords) {
    if (k.test(text)) distinctMatches++;
  }
  if (distinctMatches >= 8) { score += 1; } else { notes.push("Densité de mots-clés ATS insuffisante"); }
  if (distinctMatches >= 6) score += 0.5;

  return { score: Math.min(10, Math.round(score)), notes };
}

function scoreNoInventedGaps(ctx: CheckContext): { score: number; notes: string[] } {
  const { text } = ctx;
  const notes: string[] = [];
  let score = 7;

  // Check risky patterns (already counted in credibility but here we focus on fabrication)
  let fabricationRisks = 0;
  for (const r of RISKY_PATTERNS) {
    if (r.pattern.test(text)) fabricationRisks++;
  }
  const deduct = Math.min(5, fabricationRisks);
  score -= deduct;
  if (fabricationRisks > 2) notes.push("Trop d'éléments non vérifiables — les recruteurs détectent les inventions");

  // Mention of "Proof Vault" concept (awareness of verification)
  if (text.match(/(?:vérifié|validé|documenté|attesté|mesurable|démontré)/gi)) score += 1;

  return { score: Math.max(0, Math.min(10, score)), notes };
}

function scoreNoGenericPhrases(ctx: CheckContext): { score: number; notes: string[]; genericPhrases: { text: string; suggestion: string }[] } {
  const { text } = ctx;
  const phrases: { text: string; suggestion: string }[] = [];
  let score = 8;

  for (const g of GENERIC_PATTERNS) {
    const match = text.match(g.pattern);
    if (match) {
      phrases.push({ text: match[0], suggestion: g.suggestion });
    }
  }

  const deduct = Math.min(7, phrases.length);
  score -= deduct;
  const notes: string[] = phrases.length > 0
    ? [`${phrases.length} phrase(s) générique(s) détectée(s)`]
    : [];

  if (phrases.length === 0) {
    notes.push("Bon — pas de formule générique détectée");
  }

  return { score: Math.max(0, score), notes, genericPhrases: phrases };
}

function scoreExecutiveLevel(ctx: CheckContext): { score: number; notes: string[] } {
  const { text } = ctx;
  const notes: string[] = [];
  let score = 3;

  let execMatches = 0;
  for (const term of EXECUTIVE_TERMS) {
    if (term.test(text)) execMatches++;
  }

  score += Math.min(4, execMatches);
  if (execMatches < 3) notes.push("Renforcez le vocabulaire exécutif (P&L, stratégie, board, international, transformation)");

  // Check for operational-level language (should NOT appear in executive docs)
  const opsTerms = text.match(/(?:saisie|classement|classer|archivage|standard|conforme|procédure|reporting quotidien|tâches administratives|administrative tasks|filing|data entry)/gi);
  if (opsTerms && opsTerms.length > 0) {
    score -= Math.min(3, opsTerms.length);
    notes.push(`${opsTerms.length} terme(s) trop opérationnel(s) pour un poste exécutif`);
  }

  // Impact language
  const impactCount = (text.match(/(?:impact|résultat|transformation|levier|accélération|croissance|performance|valeur|rentabilité|efficacité|optimisation|synergie|alignement)/gi) || []).length;
  if (impactCount >= 3) score += 1;

  return { score: Math.max(0, Math.min(10, score)), notes };
}

function scoreAppropriateLength(ctx: CheckContext): { score: number; notes: string[] } {
  const { text } = ctx;
  const notes: string[] = [];
  const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;
  let score = 5;

  // CV: ideal 2500-4500 chars, 400-700 words
  // Cover letter: ideal 2000-3500 chars, 300-500 words
  // Email: ideal 600-1500 chars, 100-250 words
  // LinkedIn message: ideal 300-1000 chars, 50-150 words

  // We use a flexible approach based on document length
  if (wordCount <= 50) {
    score = 2;
    notes.push("Document trop court — développez davantage");
  } else if (wordCount > 50 && wordCount <= 120) {
    // Short doc (email, LinkedIn message) — OK range
    score = wordCount >= 80 ? 8 : 6;
    if (wordCount < 80) notes.push("Message un peu court — enrichissez avec un élément personnalisé");
  } else if (wordCount > 120 && wordCount <= 300) {
    // Cover letter range
    score = 7;
    if (wordCount < 180) notes.push("Lettre un peu courte — développez 2-3 réalisations");
    if (wordCount > 280) { score = 6; notes.push("Lettre un peu longue — resserrez sur l'essentiel"); }
  } else if (wordCount > 300) {
    // CV or long document range
    if (wordCount < 400) { score = 6; notes.push("CV un peu court — ajoutez des réalisations chiffrées"); }
    else if (wordCount <= 750) { score = 8; }
    else { score = 6; notes.push("Document long — le recruteur lit en diagonale, resserrez"); }
  }

  return { score, notes };
}

function detectRiskyPhrases(text: string): { text: string; reason: string }[] {
  const result: { text: string; reason: string }[] = [];
  for (const r of RISKY_PATTERNS) {
    const match = text.match(r.pattern);
    if (match) result.push({ text: match[0], reason: r.reason });
  }
  return result;
}

function generateRewriteRecommendations(
  scores: Record<QualityCriterion, number>,
  notes: Record<QualityCriterion, string[]>,
  genericPhrases: { text: string; suggestion: string }[],
): string[] {
  const recs: string[] = [];

  // Sort criteria by score (lowest first)
  const sorted = (Object.keys(scores) as QualityCriterion[]).sort((a, b) => scores[a] - scores[b]);
  const bottom3 = sorted.slice(0, 3);

  const labels: Record<QualityCriterion, string> = {
    clarity: "Clarté",
    credibility: "Crédibilité",
    personalization: "Personnalisation",
    proof: "Preuves chiffrées",
    humanTone: "Ton humain",
    atsKeywords: "Mots-clés ATS",
    noInventedGaps: "Absence d'inventions",
    noGenericPhrases: "Phrases spécifiques",
    executiveLevel: "Niveau exécutif",
    appropriateLength: "Longueur adaptée",
  };

  for (const crit of bottom3) {
    if (scores[crit] >= 7) continue; // Only recommend if below 7
    const label = labels[crit];
    const suggestion = notes[crit]?.[0] || `Améliorez le critère « ${label} »`;
    recs.push(`${label} (${scores[crit]}/10) : ${suggestion}`);
  }

  // If generic phrases are the main issue, prioritize that
  if (genericPhrases.length >= 3 && !recs.some((r) => r.includes("Phrases spécifiques"))) {
    recs.unshift(`Phrases génériques : ${genericPhrases.length} détectées — priorité au remplacement par des faits concrets`);
  }

  if (recs.length === 0) {
    recs.push("Document de bonne qualité — relisez une dernière fois avant envoi");
  }

  return recs;
}

export function evaluateDocumentQuality(params: {
  text: string;
  offerTitle?: string;
  offerCompany?: string;
  candidateName?: string;
  candidateTitle?: string;
}): QualityScore {
  const text = params.text.trim();

  // Guard: empty or near-empty text
  if (text.length < 30) {
    const zeroBreakdown: Record<QualityCriterion, number> = {
      clarity: 0, credibility: 0, personalization: 0, proof: 0,
      humanTone: 0, atsKeywords: 0, noInventedGaps: 0,
      noGenericPhrases: 0, executiveLevel: 0, appropriateLength: 0,
    };
    return {
      overall: 0,
      breakdown: zeroBreakdown,
      strengths: [],
      improvements: ["Document vide ou trop court — ajoutez du contenu"],
      genericPhrases: [],
      riskyPhrases: [],
      rewriteRecommendations: ["Rédigez un document d'au moins 30 caractères pour obtenir une évaluation"],
    };
  }

  const ctx: CheckContext = {
    text,
    offerTitle: params.offerTitle,
    offerCompany: params.offerCompany,
    candidateName: params.candidateName,
    candidateTitle: params.candidateTitle,
  };

  const clarity = scoreClarity(ctx);
  const credibility = scoreCredibility(ctx);
  const personalization = scorePersonalization(ctx);
  const proof = scoreProof(ctx);
  const humanTone = scoreHumanTone(ctx);
  const atsKeywords = scoreAtsKeywords(ctx);
  const noInventedGaps = scoreNoInventedGaps(ctx);
  const noGeneric = scoreNoGenericPhrases(ctx);
  const executiveLevel = scoreExecutiveLevel(ctx);
  const appropriateLength = scoreAppropriateLength(ctx);

  const breakdown: Record<QualityCriterion, number> = {
    clarity: clarity.score,
    credibility: credibility.score,
    personalization: personalization.score,
    proof: proof.score,
    humanTone: humanTone.score,
    atsKeywords: atsKeywords.score,
    noInventedGaps: noInventedGaps.score,
    noGenericPhrases: noGeneric.score,
    executiveLevel: executiveLevel.score,
    appropriateLength: appropriateLength.score,
  };

  // Overall: weighted average (each criterion 0-10, total 100)
  const overall = Math.round(
    Object.values(breakdown).reduce((sum, s) => sum + s, 0) * 10 / 10
  );

  // Collect strengths (score >= 8)
  const allNotes: Record<QualityCriterion, string[]> = {
    clarity: clarity.notes,
    credibility: credibility.notes,
    personalization: personalization.notes,
    proof: proof.notes,
    humanTone: humanTone.notes,
    atsKeywords: atsKeywords.notes,
    noInventedGaps: noInventedGaps.notes,
    noGenericPhrases: noGeneric.notes,
    executiveLevel: executiveLevel.notes,
    appropriateLength: appropriateLength.notes,
  };

  const strengths: string[] = [];
  const improvements: string[] = [];
  const labels: Record<QualityCriterion, string> = {
    clarity: "Clarté",
    credibility: "Crédibilité",
    personalization: "Personnalisation",
    proof: "Preuves chiffrées",
    humanTone: "Ton humain",
    atsKeywords: "Mots-clés ATS",
    noInventedGaps: "Absence d'inventions",
    noGenericPhrases: "Phrases spécifiques",
    executiveLevel: "Niveau exécutif",
    appropriateLength: "Longueur adaptée",
  };

  for (const [crit, score] of Object.entries(breakdown) as [QualityCriterion, number][]) {
    if (score >= 8) {
      strengths.push(`${labels[crit]} (${score}/10)`);
    } else if (score <= 5) {
      improvements.push(`${labels[crit]} (${score}/10)`);
    }
  }

  const genericPhrases = noGeneric.genericPhrases;
  const riskyPhrases = detectRiskyPhrases(params.text);
  const rewriteRecommendations = generateRewriteRecommendations(breakdown, allNotes, genericPhrases);

  return {
    overall,
    breakdown,
    strengths,
    improvements,
    genericPhrases,
    riskyPhrases,
    rewriteRecommendations,
  };
}
