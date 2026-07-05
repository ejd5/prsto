/**
 * letter-engine.ts — Moteur de génération de lettres de motivation personnalisées
 *
 * Produit des lettres véritablement adaptées à chaque offre en :
 * 1. Analysant les enjeux spécifiques de l'offre (secteur, défis, positionnement)
 * 2. Sélectionnant les preuves du Proof Vault qui répondent directement aux exigences
 * 3. Expliquant POURQUOI chaque preuve est pertinente pour cette offre
 * 4. Variant la structure selon la richesse de l'analyse
 * 5. Adaptant le ton au type d'entreprise
 */

import { prisma } from "@/lib/prisma";
import {
  buildCandidateSnapshot,
  runFullAnalysis,
  type CandidateSnapshot,
  type AnalysisReport,
  type MatchResult,
} from "@/lib/analysis/engine";

// ─── Types ──────────────────────────────────────────────────

export interface LetterOptions {
  language: "fr" | "en";
  format: "long" | "short";
  useAI: boolean;
  styleId?: string;
}

export interface LetterResult {
  content: string;
  metadata: {
    proofsUsed: string[];
    matchScore: number;
    keyInsights: string[];
    adaptationLevel: "high" | "medium" | "low";
  };
  alerts: Array<{ type: string; reason: string; excerpt: string }>;
}

// ─── Analyse des enjeux spécifiques ─────────────────────────

interface OfferInsights {
  sector: string | null;
  companySize: "startup" | "pme" | "eti" | "grand_groupe" | null;
  challenges: string[];
  growthType: string | null;
  managementScope: string | null;
  internationalDimension: boolean;
  keyExpectations: string[];
  toneRecommendation: "formel" | "moderne" | "dynamique";
}

function extractOfferInsights(rawText: string, analysis: AnalysisReport): OfferInsights {
  const text = rawText.toLowerCase();

  // Taille entreprise
  let companySize: OfferInsights["companySize"] = null;
  if (/startup|early.?stage|scale.?up|jeune entreprise/i.test(rawText)) companySize = "startup";
  else if (/cac.?40|fortune.?500|groupe international|multinationale/i.test(rawText)) companySize = "grand_groupe";
  else if (/eti|entreprise de taille intermédiaire/i.test(rawText)) companySize = "eti";
  else if (/pme|petite.*moyenne/i.test(rawText)) companySize = "pme";

  // Défis identifiés
  const challenges: string[] = [];
  if (/croissance|growth|scale|développement|expansion/i.test(rawText)) challenges.push("croissance");
  if (/transformation|restructuration|réorganisation|change/i.test(rawText)) challenges.push("transformation");
  if (/digital|numérique|tech|innovation/i.test(rawText)) challenges.push("digitalisation");
  if (/international|export|multi.?pays|global/i.test(rawText)) challenges.push("internationalisation");
  if (/nouveau.*marché|lancement|go.?to.?market|créer/i.test(rawText)) challenges.push("lancement marché");
  if (/optimis|performance|productivité|efficac/i.test(rawText)) challenges.push("optimisation performance");

  // Type de croissance
  let growthType: string | null = null;
  if (/organique|organic/i.test(rawText)) growthType = "organique";
  else if (/externe|acquisition|m\&a|rachat/i.test(rawText)) growthType = "croissance externe";
  else if (/croissance|growth/i.test(rawText)) growthType = "croissance";

  // Scope management
  let managementScope: string | null = null;
  const teamMatch = rawText.match(/(\d+)\s*(?:personnes|collaborateurs|commerciaux|people|team|members)/i);
  if (teamMatch) managementScope = `${teamMatch[1]} personnes`;

  // Attentes clés
  const keyExpectations = analysis.requirements.mandatoryRequirements
    .slice(0, 4)
    .map(r => r.trim().slice(0, 120));

  // Ton recommandé
  let toneRecommendation: OfferInsights["toneRecommendation"] = "formel";
  if (companySize === "startup") toneRecommendation = "dynamique";
  else if (companySize === "pme") toneRecommendation = "moderne";

  return {
    sector: analysis.requirements.sector !== "Non spécifié" ? analysis.requirements.sector : null,
    companySize,
    challenges,
    growthType,
    managementScope,
    internationalDimension: analysis.requirements.internationalDimension,
    keyExpectations,
    toneRecommendation,
  };
}

// ─── Sélection contextuelle des preuves ─────────────────────

interface ContextualProof {
  fact: string;
  relevance: string; // POURQUOI cette preuve est pertinente
  source: string;
}

function selectContextualProofs(
  candidate: CandidateSnapshot,
  analysis: AnalysisReport,
  insights: OfferInsights,
  language: "fr" | "en",
  maxProofs: number = 3
): ContextualProof[] {
  const proofs: (ContextualProof & { score: number })[] = [];

  // Proofs du Proof Vault
  for (const proof of candidate.proofEntries) {
    let score = 0;
    const combined = `${proof.category} ${proof.title} ${proof.value}`.toLowerCase();

    // Score basé sur les requirements de l'offre
    for (const req of analysis.requirements.mandatoryRequirements) {
      if (combined.includes(req.toLowerCase().slice(0, 20))) score += 10;
    }
    for (const kw of analysis.keywordsAts) {
      if (combined.includes(kw.toLowerCase())) score += 8;
    }
    // Bonus pour les chiffres
    if (/\d+[%kK€M]|\d{2,}/.test(proof.value)) score += 5;
    // Bonus si le challenge de l'offre matche
    for (const challenge of insights.challenges) {
      if (combined.includes(challenge.slice(0, 10))) score += 7;
    }

    // Construire le "pourquoi" contextuel
    let relevance = "";
    if (language === "fr") {
      if (insights.challenges.includes("croissance") && /croissance|ca|revenue|chiffre/i.test(combined)) {
        relevance = `directement lié à vos enjeux de croissance`;
      } else if (insights.challenges.includes("transformation") && /transform|restructur|réorganis/i.test(combined)) {
        relevance = `en phase avec la transformation que vous envisagez`;
      } else if (insights.challenges.includes("internationalisation") && /international|export|pays/i.test(combined)) {
        relevance = `pertinent pour votre dimension internationale`;
      } else if (/équipe|team|management/i.test(combined)) {
        relevance = `démontrant ma capacité de management`;
      } else {
        relevance = `illustrant mon expertise opérationnelle`;
      }
    } else {
      if (insights.challenges.includes("croissance") && /growth|revenue|turnover/i.test(combined)) {
        relevance = `directly relevant to your growth objectives`;
      } else if (insights.challenges.includes("transformation") && /transform|restructur|reorgani/i.test(combined)) {
        relevance = `aligned with the transformation you envision`;
      } else if (insights.challenges.includes("internationalisation") && /international|export|countr/i.test(combined)) {
        relevance = `relevant to your international dimension`;
      } else if (/team|management/i.test(combined)) {
        relevance = `demonstrating my leadership capabilities`;
      } else {
        relevance = `showcasing my operational expertise`;
      }
    }

    proofs.push({
      fact: `${proof.title}: ${proof.value}`,
      relevance,
      source: "proof_vault",
      score,
    });
  }

  // Preuves issues des achievements des expériences
  for (const exp of candidate.experiences.slice(0, 2)) {
    for (const ach of exp.achievements.slice(0, 3)) {
      let score = 0;
      const norm = ach.toLowerCase();
      for (const kw of analysis.keywordsAts) {
        if (norm.includes(kw.toLowerCase())) score += 6;
      }
      if (/\d+[%kK€M]|\d{2,}/.test(ach)) score += 4;

      const relevance = language === "fr"
        ? `réalisé chez ${exp.company}`
        : `achieved at ${exp.company}`;

      proofs.push({
        fact: ach,
        relevance,
        source: `experience_${exp.company}`,
        score,
      });
    }
  }

  // Trier par pertinence et dédupliquer
  proofs.sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  const selected: ContextualProof[] = [];
  for (const p of proofs) {
    const key = p.fact.slice(0, 50);
    if (!seen.has(key) && selected.length < maxProofs) {
      seen.add(key);
      selected.push({ fact: p.fact, relevance: p.relevance, source: p.source });
    }
  }

  return selected;
}

// ─── Génération de la lettre FR ─────────────────────────────

function generatePersonalizedLetterFR(
  candidate: CandidateSnapshot,
  analysis: AnalysisReport,
  insights: OfferInsights,
  proofs: ContextualProof[],
  opp: { title: string; company: string; location: string | null; country: string | null },
  format: "long" | "short"
): string {
  const lines: string[] = [];

  // En-tête
  lines.push(candidate.fullName);
  lines.push(candidate.title || "");
  lines.push(candidate.location || "");
  lines.push([candidate.email, candidate.phone].filter(Boolean).join("  |  "));
  lines.push("");
  lines.push(opp.company);
  lines.push(opp.location || opp.country || "");
  lines.push("");
  lines.push(`Objet : Candidature au poste de ${opp.title}`);
  lines.push("");
  lines.push("Madame, Monsieur,");
  lines.push("");

  // ─── Paragraphe 1 : Accroche personnalisée ─────────────
  const sectorMention = insights.sector ? ` dans le secteur ${insights.sector}` : "";
  const challengeMention = insights.challenges.length > 0
    ? `. Les enjeux de ${insights.challenges.slice(0, 2).join(" et de ")} que vous décrivez`
    : "";

  if (analysis.score.globalScore >= 70) {
    lines.push(
      `Le poste de ${opp.title} chez ${opp.company}${sectorMention} rejoint directement mon expérience et mes résultats en direction commerciale${challengeMention} résonnent avec mon parcours de ${candidate.yearsExp} ans : construire des organisations performantes, développer des marchés et transformer des résultats.`
    );
  } else {
    lines.push(
      `Votre recherche d'un ${opp.title} pour ${opp.company}${sectorMention} retient mon attention${challengeMention} correspondent à des situations que j'ai gérées avec succès au cours de mes ${candidate.yearsExp} ans de carrière en direction commerciale.`
    );
  }

  // ─── Paragraphe 2 : Preuves contextualisées ────────────
  if (proofs.length > 0) {
    lines.push("");
    lines.push("Mon parcours apporte des réponses concrètes à vos besoins :");
    for (const proof of proofs) {
      lines.push(`- ${proof.fact} (${proof.relevance})`);
    }
  }

  // ─── Paragraphe 3 : Expertise spécifique ───────────────
  if (candidate.experiences.length > 0) {
    lines.push("");
    const lastExp = candidate.experiences[0];

    // Construire un paragraphe qui lie l'expérience aux enjeux de l'offre
    const scopeParts: string[] = [];
    if (lastExp.teamSize) scopeParts.push(`une équipe de ${lastExp.teamSize} collaborateurs`);
    if (lastExp.budget) scopeParts.push(`un P&L de ${lastExp.budget}`);
    if (lastExp.revenue) scopeParts.push(`un CA de ${lastExp.revenue}`);

    let expParagraph = `En tant que ${lastExp.title} chez ${lastExp.company}`;
    if (lastExp.country && lastExp.country !== "France") {
      expParagraph += ` (${lastExp.country})`;
    }
    if (scopeParts.length > 0) {
      expParagraph += `, j'ai piloté ${scopeParts.join(" et ")}`;
    }

    // Lier aux challenges de l'offre
    if (insights.challenges.includes("croissance") && lastExp.revenue) {
      expParagraph += `. Cette expérience de développement commercial est directement transposable à vos objectifs de croissance`;
    } else if (insights.challenges.includes("transformation")) {
      expParagraph += `. J'ai conduit cette mission dans un contexte de transformation comparable à celui que vous décrivez`;
    } else if (insights.challenges.includes("internationalisation") && lastExp.country) {
      expParagraph += `. Cette dimension internationale correspond à la portée du poste que vous proposez`;
    }

    lines.push(expParagraph + ".");
  }

  // ─── Paragraphe 4 : Vision et valeur ajoutée ───────────
  lines.push("");
  if (format === "short") {
    lines.push(
      `Je souhaite mettre cette expertise au service de ${opp.company} et contribuer à vos objectifs. Je suis disponible pour un échange à votre convenance.`
    );
  } else {
    // Paragraphe vision basé sur les enjeux identifiés
    const visionParts: string[] = [];
    if (insights.growthType) {
      visionParts.push(`accélérer la ${insights.growthType}`);
    }
    if (insights.challenges.includes("digitalisation")) {
      visionParts.push("intégrer les leviers digitaux dans la stratégie commerciale");
    }
    if (insights.internationalDimension) {
      visionParts.push("structurer le développement international");
    }
    if (visionParts.length === 0) {
      visionParts.push("renforcer la performance commerciale");
    }

    lines.push(
      `Chez ${opp.company}, ma priorité serait de ${visionParts.join(", ")}. Mon approche combine rigueur analytique et proximité terrain : je crois que les résultats durables se construisent en alignant la stratégie avec la réalité opérationnelle des équipes.`
    );
  }

  // ─── Paragraphe 5 : Conclusion ─────────────────────────
  if (format === "long") {
    lines.push("");
    lines.push(
      `Je serais heureux d'approfondir ces points lors d'un échange. Ma disponibilité est immédiate pour un entretien.`
    );
  }

  // ─── Gaps (si pertinent, mentionnés avec honnêteté) ────
  if (analysis.gaps.length > 0 && analysis.gaps.length <= 2) {
    lines.push("");
    const gapTexts = analysis.gaps.slice(0, 2).map(g => {
      const match = g.match(/^(.+?)\s*\[/);
      return match ? match[1].trim() : g;
    });
    lines.push(`Je note que ${gapTexts.join(" et ")} ${gapTexts.length > 1 ? "font" : "fait"} partie de mes axes de progression, sur ${gapTexts.length > 1 ? "lesquels" : "lequel"} je travaille activement.`);
  }

  // Signature
  lines.push("");
  lines.push("Cordialement,");
  lines.push("");
  lines.push(candidate.fullName);
  if (candidate.phone) lines.push(candidate.phone);

  return lines.join("\n");
}

// ─── Génération de la lettre EN ─────────────────────────────

function generatePersonalizedLetterEN(
  candidate: CandidateSnapshot,
  analysis: AnalysisReport,
  insights: OfferInsights,
  proofs: ContextualProof[],
  opp: { title: string; company: string; location: string | null; country: string | null },
  format: "long" | "short"
): string {
  const lines: string[] = [];

  lines.push(candidate.fullName);
  lines.push(candidate.title || "");
  lines.push(candidate.location || "");
  lines.push([candidate.email, candidate.phone].filter(Boolean).join("  |  "));
  lines.push("");
  lines.push(opp.company);
  lines.push(opp.location || opp.country || "");
  lines.push("");
  lines.push(`Re: Application for ${opp.title}`);
  lines.push("");
  lines.push("Dear Hiring Manager,");
  lines.push("");

  // Paragraph 1: Personalized hook
  const sectorMention = insights.sector ? ` in the ${insights.sector} sector` : "";
  const challengeMention = insights.challenges.length > 0
    ? `. The ${insights.challenges.slice(0, 2).join(" and ")} challenges you outline`
    : "";

  if (analysis.score.globalScore >= 70) {
    lines.push(
      `The ${opp.title} role at ${opp.company}${sectorMention} directly aligns with my expertise and results in commercial leadership${challengeMention} resonate with my ${candidate.yearsExp}-year track record of building high-performing organisations, developing markets, and delivering measurable outcomes.`
    );
  } else {
    lines.push(
      `Your search for a ${opp.title} at ${opp.company}${sectorMention} has captured my interest${challengeMention} mirror situations I have successfully navigated over ${candidate.yearsExp} years in commercial leadership.`
    );
  }

  // Paragraph 2: Contextualized proofs
  if (proofs.length > 0) {
    lines.push("");
    lines.push("My track record provides concrete responses to your needs:");
    for (const proof of proofs) {
      lines.push(`- ${proof.fact} (${proof.relevance})`);
    }
  }

  // Paragraph 3: Specific expertise
  if (candidate.experiences.length > 0) {
    lines.push("");
    const lastExp = candidate.experiences[0];
    const scopeParts: string[] = [];
    if (lastExp.teamSize) scopeParts.push(`a team of ${lastExp.teamSize}`);
    if (lastExp.budget) scopeParts.push(`a P&L of ${lastExp.budget}`);
    if (lastExp.revenue) scopeParts.push(`revenue of ${lastExp.revenue}`);

    let expParagraph = `As ${lastExp.title} at ${lastExp.company}`;
    if (lastExp.country) expParagraph += ` (${lastExp.country})`;
    if (scopeParts.length > 0) {
      expParagraph += `, I led ${scopeParts.join(" and ")}`;
    }

    if (insights.challenges.includes("croissance") && lastExp.revenue) {
      expParagraph += `. This growth experience is directly transferable to your objectives`;
    } else if (insights.challenges.includes("transformation")) {
      expParagraph += `. I delivered this in a transformation context similar to yours`;
    }

    lines.push(expParagraph + ".");
  }

  // Paragraph 4: Vision
  lines.push("");
  if (format === "short") {
    lines.push(
      `I am keen to bring this expertise to ${opp.company} and contribute to your objectives. I am available for a conversation at your convenience.`
    );
  } else {
    const visionParts: string[] = [];
    if (insights.growthType) visionParts.push(`accelerate ${insights.growthType}`);
    if (insights.internationalDimension) visionParts.push("structure international expansion");
    if (visionParts.length === 0) visionParts.push("strengthen commercial performance");

    lines.push(
      `At ${opp.company}, my priority would be to ${visionParts.join(", ")}. I combine analytical rigour with hands-on field presence, believing sustainable results come from aligning strategy with operational reality.`
    );
    lines.push("");
    lines.push("I would welcome the opportunity to discuss these points further. I am available immediately for a conversation.");
  }

  // Signature
  lines.push("");
  lines.push("Kind regards,");
  lines.push("");
  lines.push(candidate.fullName);
  if (candidate.phone) lines.push(candidate.phone);

  return lines.join("\n");
}

// ─── API Principale ─────────────────────────────────────────

export async function generateTailoredLetter(
  opportunityId: string,
  options: LetterOptions
): Promise<LetterResult> {
  // 1. Charger l'opportunité
  const opp = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
  });
  if (!opp || !opp.rawText) {
    throw new Error("Opportunité introuvable ou sans description.");
  }

  // 2. Charger le profil candidat
  const candidate = await buildCandidateSnapshot();
  if (!candidate) {
    throw new Error("Profil candidat non configuré.");
  }

  // 3. Analyse
  const analysis = runFullAnalysis(opp.rawText, candidate);

  // 4. Extraire les insights spécifiques de l'offre
  const insights = extractOfferInsights(opp.rawText, analysis);

  // 5. Sélectionner les preuves contextuelles
  const proofs = selectContextualProofs(
    candidate,
    analysis,
    insights,
    options.language,
    options.format === "short" ? 2 : 3
  );

  // 6. Générer la lettre
  const oppInfo = {
    title: opp.title,
    company: opp.company,
    location: opp.location,
    country: opp.country,
  };

  const content = options.language === "fr"
    ? generatePersonalizedLetterFR(candidate, analysis, insights, proofs, oppInfo, options.format)
    : generatePersonalizedLetterEN(candidate, analysis, insights, proofs, oppInfo, options.format);

  // 7. Déterminer le niveau d'adaptation
  let adaptationLevel: "high" | "medium" | "low" = "low";
  if (insights.challenges.length >= 2 && proofs.length >= 3) adaptationLevel = "high";
  else if (insights.challenges.length >= 1 || proofs.length >= 2) adaptationLevel = "medium";

  return {
    content,
    metadata: {
      proofsUsed: proofs.map(p => p.fact),
      matchScore: analysis.score.globalScore,
      keyInsights: [
        ...insights.challenges.map(c => `Enjeu: ${c}`),
        ...(insights.sector ? [`Secteur: ${insights.sector}`] : []),
        ...(insights.companySize ? [`Type: ${insights.companySize}`] : []),
        ...(insights.growthType ? [`Croissance: ${insights.growthType}`] : []),
      ],
      adaptationLevel,
    },
    alerts: [],
  };
}
