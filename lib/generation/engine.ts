// ─── ELTON OS – Moteur de génération de documents ───
// Assemble données + template ou IA → document + ChangeLog
// Anti-hallucination : tout est vérifié contre le snapshot candidat.

import { prisma } from "@/lib/prisma";
import { buildCandidateSnapshot, type CandidateSnapshot, type AnalysisReport } from "@/lib/analysis/engine";
import {
  getTemplateForType, getDocumentLabel,
  type DocumentType,
} from "@/lib/generation/templates";

export type ValidationMode = "STRICT" | "BALANCED" | "PERSUASIVE_BUT_SAFE";
export type ValidationStatus = "DRAFT" | "NEEDS_REVIEW" | "APPROVED" | "REJECTED";

export interface HallucinationAlert {
  type: "unsupported_claim" | "exaggeration" | "missing_skill" | "unverified_number" | "fake_credential" | "fake_company";
  excerpt: string;
  reason: string;
  severity: "critical" | "warning";
}

// ─── validateNoHallucination ────────────────────────────────

export function validateNoHallucination(
  content: string,
  candidate: CandidateSnapshot,
  mode: ValidationMode = "STRICT"
): { clean: boolean; alerts: HallucinationAlert[] } {
  const alerts: HallucinationAlert[] = [];

  // Construire l'ensemble des données vérifiées
  const verifiedSkills = candidate.skills.map(s => s.name.toLowerCase());
  const verifiedTitles = candidate.experiences.map(e => e.title.toLowerCase());
  const verifiedCompanies = candidate.experiences.map(e => e.company.toLowerCase());
  const verifiedCountries = candidate.experiences.map(e => e.country?.toLowerCase()).filter(Boolean);
  const verifiedProofValues = candidate.proofEntries.map(p => p.value.toLowerCase());
  const allVerifiedText = [
    candidate.fullName.toLowerCase(),
    candidate.title.toLowerCase(),
    ...verifiedSkills,
    ...verifiedCompanies,
    ...verifiedTitles,
    ...verifiedCountries,
    ...verifiedProofValues,
    ...candidate.languages.map(l => l.toLowerCase()),
    ...candidate.sectors.map(s => s.toLowerCase()),
  ].join(" ");

  // ─── Détection chiffres non prouvés (tous les modes) ───
  const numPatterns = [
    /(\d{1,3}[\s%]?(?:millions?|M€|k€|personnes|people|pays|countries|CA|chiffre d'affaires|revenue|billion|milliard))/gi,
    /(?:augmentation|hausse|croissance|growth|increase)[\s\w]+?(\d{1,3}[\s]?%)/gi,
    /(?:généré|généré|generated|produit)[\s\w]+?(\d{1,3}[\s]?(?:M€|k€|millions?))/gi,
  ];
  for (const pattern of numPatterns) {
    const numMatches = content.match(pattern);
    if (numMatches) {
      for (const num of numMatches) {
        const normNum = num.toLowerCase().replace(/\s+/g, " ");
        if (!allVerifiedText.includes(normNum) && !verifiedProofValues.some(v => v.includes(normNum.replace(/[^0-9]/g, "")))) {
          alerts.push({
            type: "unverified_number",
            excerpt: num,
            reason: `Chiffre non trouvé dans le Proof Vault ou les expériences vérifiées`,
            severity: "critical",
          });
        }
      }
    }
  }

  // ─── Détection compétences absentes ───
  if (mode === "STRICT") {
    const claimedSkills = content.match(/(?:maîtrise|expertise|compétence|expérience en|knowledge of|proficient in|skilled in|diplômé|diploma|certifié|certified|formé|trained)\s+([\w\s]+)/gi);
    if (claimedSkills) {
      for (const claim of claimedSkills) {
        const skillPart = claim.replace(/(?:maîtrise|expertise|compétence|expérience en|knowledge of|proficient in|skilled in|diplômé|diploma|certifié|certified|formé|trained)\s+/i, "").trim().toLowerCase();
        if (skillPart.length > 3 && !verifiedSkills.some(s => s.includes(skillPart) || skillPart.includes(s))) {
          const isKnown = allVerifiedText.includes(skillPart);
          if (!isKnown) {
            alerts.push({
              type: "missing_skill",
              excerpt: claim,
              reason: `"${skillPart}" n'est pas dans les compétences vérifiées du profil`,
              severity: "critical",
            });
          }
        }
      }
    }
  }

  // ─── Détection diplômes / certifications non prouvés ───
  const credentialPatterns = [
    /(?:MBA|Master|Bachelor|PhD|Doctorat|Licence|BTS|DUT|DU|diplôme|diploma|degree|certificat|certificate|certification)\s+(?:en|de|d'|in|of)?\s*([\w\s]{3,30})/gi,
    /(?:diplômé de|diplômé d'|graduated from|gradué de)\s+([\w\s]{3,40})/gi,
  ];
  for (const pattern of credentialPatterns) {
    const credMatches = content.match(pattern);
    if (credMatches) {
      for (const cred of credMatches) {
        const credLower = cred.toLowerCase();
        if (!allVerifiedText.includes(credLower) && !candidate.cvText?.toLowerCase().includes(credLower)) {
          alerts.push({
            type: "fake_credential",
            excerpt: cred,
            reason: `"${cred}" n'est pas documenté dans le Profil, CV Maître ou Proof Vault`,
            severity: "critical",
          });
        }
      }
    }
  }

  // ─── Détection entreprises inventées ───
  const companyMatches = content.match(/(?:chez|at|pour|for|rejoint|joined)\s+([A-Z][a-zàâéèêëîïôûùç]+(?:\s[A-Z][a-zàâéèêëîïôûùç]+){0,3})/g);
  if (companyMatches) {
    for (const m of companyMatches) {
      const companyName = m.replace(/(?:chez|at|pour|for|rejoint|joined)\s+/i, "").trim();
      const cnLower = companyName.toLowerCase();
      if (companyName.length > 3 && !allVerifiedText.includes(cnLower) && !candidate.experiences.some(e => e.company.toLowerCase().includes(cnLower))) {
        alerts.push({
          type: "fake_company",
          excerpt: companyName,
          reason: `"${companyName}" n'apparaît pas dans vos expériences vérifiées`,
          severity: "critical",
        });
      }
    }
  }

  // ─── Détection expériences / postes inventés ───
  const expMatches = content.match(/(?:en tant que|as a|comme)\s+([A-Z][\w\sàâéèêëîïôûùç]{5,40})/gi);
  if (expMatches) {
    for (const m of expMatches) {
      const role = m.replace(/(?:en tant que|as a|comme)\s+/i, "").trim();
      const roleLower = role.toLowerCase();
      if (role.length > 5 && !verifiedTitles.some(t => t.includes(roleLower) || roleLower.includes(t))) {
        if (!allVerifiedText.includes(roleLower)) {
          alerts.push({
            type: "fake_company",
            excerpt: role,
            reason: `"${role}" n'apparaît pas dans votre parcours vérifié`,
            severity: "critical",
          });
        }
      }
    }
  }

  // ─── Détection exagérations ───
  const exaggerationPatterns = [
    /(?:tous|toutes|chaque|tout le|toute la|all|every|each|always|jamais|never|aucun|aucune|none|sans exception)/gi,
    /(?:meilleur|best|numéro 1|#1|leader incontesté|top 1|n°1)/gi,
    /(?:seul|unique|only one|the one)/gi,
  ];
  for (const pattern of exaggerationPatterns) {
    const exagMatches = content.match(pattern);
    if (exagMatches && exagMatches.length >= 2) {
      for (const exag of exagMatches.slice(0, 3)) {
        alerts.push({
          type: "exaggeration",
          excerpt: exag,
          reason: `Langage superlatif/absolu détecté : "${exag}". Préférez des faits vérifiables.`,
          severity: "warning",
        });
      }
    }
  }

  const clean = alerts.filter(a => a.severity === "critical").length === 0;
  return { clean, alerts };
}

// ─── Génération avec IA (optionnelle) ───────────────────────

async function generateWithAI(
  candidate: CandidateSnapshot,
  analysis: AnalysisReport | null,
  opp: { title: string; company: string; location: string | null; country: string | null; rawText: string },
  type: DocumentType
): Promise<{ content: string; model: string }> {
  // Récupérer la config IA
  const settings = await prisma.setting.findFirst();
  if (!settings || settings.aiProvider === "none" || !settings.apiKey) {
    throw new Error("NO_API_KEY");
  }

  // Récupérer le prompt template
  const promptName = type.startsWith("cv") ? (type === "cv_fr" ? "cv_tailor_fr" : "cv_tailor_en") :
    type.startsWith("lettre") ? (type === "lettre_fr" ? "lettre_fr" : "lettre_en") :
    "analyse_offre";

  const aiPrompt = await prisma.aIPrompt.findUnique({ where: { name: promptName } });
  const promptTemplate = aiPrompt?.content || getDefaultPrompt(type);

  // Assembler les données
  const cvText = candidate.cvText || buildCompactCV(candidate);
  const offerText = settings.anonymizeBeforeCall ? anonymize(opp.rawText) : opp.rawText;
  const proofText = candidate.proofEntries
    .filter(p => p.category && p.value)
    .map(p => `${p.category}: ${p.title} — ${p.value}`)
    .join("\n");

  const finalPrompt = promptTemplate
    .replace(/\{\{cv_master\}\}/g, cvText)
    .replace(/\{\{offer\}\}/g, offerText.slice(0, 6000))
    .replace(/\{\{proof_vault\}\}/g, proofText)
    .replace(/\{\{profile\}\}/g, `${candidate.fullName}, ${candidate.title}, ${candidate.yearsExp} ans`)
    + `\n\nIMPORTANT: N'invente aucune expérience, compétence, chiffre ou résultat. Utilise UNIQUEMENT les données fournies ci-dessus.`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    const response = await fetch(`${settings.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify({
        model: settings.proModel || settings.defaultModel || "deepseek-v4-flash",
        messages: [
          { role: "system", content: "Tu es un assistant de rédaction de candidature pour dirigeants commerciaux. Réponds UNIQUEMENT avec le texte du document demandé, sans markdown, sans commentaires." },
          { role: "user", content: finalPrompt },
        ],
        temperature: 0.4,
        max_tokens: 4000,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    if (!response.ok) throw new Error(`API ${response.status}`);

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty response");

    return { content, model: `DeepSeek ${settings.proModel || settings.defaultModel}` };
  } catch (e: unknown) {
    const err = e as Error;
    throw new Error(`AI_ERROR: ${err.message}`);
  }
}

// ─── Génération complète ────────────────────────────────────

export async function generateDocumentContent(
  opportunityId: string,
  type: DocumentType,
  useAI: boolean = false
): Promise<{
  success: boolean;
  document?: Record<string, unknown>;
  alerts?: HallucinationAlert[];
  error?: string;
  mode: string;
}> {
  try {
    // Récupérer l'opportunité
    const opp = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
      include: { analysis: true },
    });
    if (!opp || !opp.rawText) {
      return { success: false, error: "Opportunité introuvable ou sans description.", mode: "error" };
    }

    // Construire le snapshot candidat
    const candidate = await buildCandidateSnapshot();
    if (!candidate) {
      return { success: false, error: "Profil candidat non configuré.", mode: "error" };
    }

    const analysis = opp.analysis as AnalysisReport | null;

    let content: string;
    let model = "ELTON-OS Template Engine v1.0";
    let mode = "template";

    if (useAI) {
      try {
        const aiResult = await generateWithAI(candidate, analysis, opp, type);
        content = aiResult.content;
        model = aiResult.model;
        mode = "ai";
      } catch (e: unknown) {
        // Fallback template
        const err = e as Error;
        console.warn(`AI generation failed: ${err.message}, using template`);
        const templateFn = getTemplateForType(type);
        content = templateFn(candidate, analysis, opp);
        mode = `template (fallback: ${err.message.slice(0, 40)})`;
      }
    } else {
      const templateFn = getTemplateForType(type);
      content = templateFn(candidate, analysis, opp);
    }

    // Validation anti-hallucination (STRICT pour CV, BALANCED pour lettre/email/linkedin)
    const validationMode: ValidationMode =
      type.startsWith("cv") ? "STRICT" :
      type.startsWith("lettre") ? "BALANCED" : "PERSUASIVE_BUT_SAFE";

    const { alerts } = validateNoHallucination(content, candidate, validationMode);

    // Déterminer le statut
    const docStatus: ValidationStatus = alerts.filter(a => a.severity === "critical").length > 0
      ? "NEEDS_REVIEW"
      : "DRAFT";

    // Sauvegarder le document
    const doc = await prisma.document.create({
      data: {
        opportunityId,
        type,
        content,
        status: docStatus,
        version: 1,
      },
    });

    // Créer ChangeLog
    await prisma.changeLog.create({
      data: {
        documentId: doc.id,
        section: "content",
        field: "content",
        newValue: content.slice(0, 500),
        reason: `Génération ${mode} — ${getDocumentLabel(type)}`,
        source: mode.startsWith("ai") ? "ai_suggestion" : "cv_master",
        risque: alerts.length > 0 ? `${alerts.length} alerte(s) d'hallucination détectée(s)` : null,
        statut: alerts.filter(a => a.severity === "critical").length > 0 ? "à_vérifier" : "accepté",
      },
    });

    // Mettre à jour le statut de l'opportunité
    await prisma.opportunity.update({
      where: { id: opportunityId },
      data: { status: opp.status === "nouveau" ? "analyse" : undefined },
    });

    return {
      success: true,
      document: { ...doc, alerts, aiModel: model },
      alerts: alerts.length > 0 ? alerts : undefined,
      mode,
    };
  } catch (e: unknown) {
    const err = e as Error;
    console.error("generateDocumentContent error:", e);
    return { success: false, error: err.message || "Erreur de génération", mode: "error" };
  }
}

// ─── Helpers ────────────────────────────────────────────────

function buildCompactCV(candidate: CandidateSnapshot): string {
  const lines: string[] = [];
  lines.push(`${candidate.fullName} — ${candidate.title}`);
  lines.push(`${candidate.summary}`);
  for (const exp of candidate.experiences) {
    lines.push(`${exp.title} chez ${exp.company} (${exp.country || ""}) : ${exp.description || ""}`);
    if (exp.achievements.length) lines.push(`Réalisations: ${exp.achievements.join("; ")}`);
  }
  lines.push(`Compétences: ${candidate.skills.map(s => s.name).join(", ")}`);
  lines.push(`Langues: ${candidate.languages.join(", ")}`);
  return lines.join("\n");
}

function anonymize(text: string): string {
  return text
    .replace(/[A-Z][a-z]+ [A-Z][a-z]+/g, "[NOM]")
    .replace(/\b[\w.-]+@[\w.-]+\.\w+\b/g, "[EMAIL]")
    .replace(/\b0[1-9][0-9]{8}\b/g, "[TEL]");
}

function getDefaultPrompt(type: DocumentType): string {
  if (type.startsWith("cv")) {
    return `Tu es un expert en recrutement de dirigeants commerciaux. À partir du CV maître ci-dessous et de l'offre d'emploi, rédige un CV adapté. N'invente RIEN. Utilise UNIQUEMENT les données fournies.\n\nCV MAÎTRE:\n{{cv_master}}\n\nOFFRE:\n{{offer}}\n\nPREUVES:\n{{proof_vault}}\n\nRédige le CV adapté :`;
  }
  return `Rédige une candidature professionnelle pour un dirigeant commercial. N'invente rien. Données fournies :\n\nPROFIL:\n{{profile}}\n\nCV:\n{{cv_master}}\n\nOFFRE:\n{{offer}}\n\nPREUVES:\n{{proof_vault}}`;
}
