"use server";

import { prisma } from "@/lib/prisma";
import { generateJsonWithDeepSeek, generateWithDeepSeek } from "@/lib/ai/deepseek";
import { sanitizeExperienceLine, normalizeDateRangeForCv } from "@/lib/jobs/cv-content-sanitizer";
import { normalizeLanguages, renderLanguages } from "@/lib/jobs/languages-normalizer";
import { cleanGeneratedApplicationText, isCabinetRecrutement } from "@/lib/jobs/text-sanitizer";
import { chooseSummarySectionTitle, sanitizeExecutiveSummary } from "@/lib/jobs/cv-summary-builder";
import { revalidatePath } from "next/cache";

/* ─── Types ─────────────────────────────── */

export interface CandidateSummary {
  profileId: string;
  fullName: string; title: string; summary: string; location: string | null;
  email: string | null; phone: string | null;
  sectors: string | null; functions: string | null; yearsExp: number | null;
  languages: string | null; education: string | null; certifications: string | null;
  cvText: string | null;
  skills: { name: string; category: string; level: string }[];
  experiences: { title: string; company: string; sector: string | null; startDate: string; endDate: string | null; description: string | null; achievements: string | null }[];
  proofEntries: { category: string; title: string; value: string }[];
}

interface PrepareOutput {
  matchScore: number; jobSummary: string; keyRequirements: string[];
  atsKeywords: string[]; confirmedMatches: string[]; gaps: string[];
  risks: string[]; applicationEmail: string; recruiterMessage: string;
  atsFormAnswers: { question: string; answer: string }[];
}

/* ─── Helpers ───────────────────────────── */

async function getCandidate(): Promise<CandidateSummary | null> {
  const p = await prisma.profile.findFirst({ include: { skills: true, experiences: { orderBy: { startDate: "desc" }, take: 10 }, cvMaster: true, proofEntries: { take: 10 } } });
  if (!p) return null;
  const proofs = await prisma.proofEntry.findMany({ where: { profileId: p.id }, take: 10 });
  return {
    fullName: p.fullName, title: p.title, summary: p.summary, location: p.location,
    email: p.email || null, phone: p.phone || null,
    sectors: p.sectors, functions: p.functions, yearsExp: p.yearsExp,
    languages: p.languages, education: p.education, certifications: p.certifications,
    cvText: p.cvMaster?.originalText?.slice(0, 8000) || null,
    profileId: p.id,
    skills: p.skills.map(s => ({ name: s.name, category: s.category, level: s.level })),
    experiences: p.experiences.map(e => ({ title: e.title, company: e.company, sector: e.sector, startDate: e.startDate, endDate: e.endDate, description: e.description, achievements: e.achievements })),
    proofEntries: proofs.map(x => ({ category: x.category, title: x.title, value: x.value })),
  };
}

function buildJobText(job: { title: string; company: string | null; location: string | null; contractType: string | null; salaryMin: number | null; salaryMax: number | null; description: string | null }): string {
  return `Titre : ${job.title}\nEntreprise : ${job.company || "N/A"}\nLocalisation : ${job.location || "N/A"}\nContrat : ${job.contractType || "N/A"}\nSalaire : ${job.salaryMin || "?"} - ${job.salaryMax || "?"} €\nDescription : ${(job.description || "").slice(0, 3000)}`;
}

function buildCandidateText(c: CandidateSummary): string {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

  // Parse profile languages pour les injecter dans le prompt
  let languageList = "";
  try {
    const parsed = JSON.parse(c.languages || "[]");
    if (Array.isArray(parsed) && parsed.length > 0) {
      languageList = `\nLangues (source de vérité — TOUTES doivent apparaître) : ${parsed.join(", ")}`;
    }
  } catch {
    if (c.languages) languageList = `\nLangues : ${c.languages}`;
  }

  return `Nom : ${c.fullName}\nTitre : ${c.title}\n${c.summary ? `Résumé : ${c.summary.slice(0, 1000)}\n` : ""}\nCompétences :\n${c.skills.map(s => `  - ${s.name} (${s.category}, ${s.level})`).join("\n")}${languageList}\n\nExpériences :\n${c.experiences.map(e => {
    const hasRealEnd = e.endDate && e.endDate.trim() !== "";
    const isEnded = hasRealEnd && e.endDate! <= now.toISOString().slice(0, 7);
    const statusLabel = isEnded ? " (POSTE TERMINÉ)" : (hasRealEnd ? "" : " (poste actuel)");
    return `  - ${e.title} chez ${e.company} (${e.startDate} - ${e.endDate || "présent"})${statusLabel}\n    ${(e.description || "").slice(0, 300)}\n    Réalisations : ${(e.achievements || "").slice(0, 300)}`;
  }).join("\n")}\n\nPreuves :\n${c.proofEntries.map(p => `  - ${p.category}: ${p.title} = ${p.value}`).join("\n")}\n\nCV Maître : ${c.cvText || "N/A"}`;
}

function buildChangelog(draftId: string, parts: string[]): string {
  const now = new Date().toISOString();
  return JSON.stringify(parts.map(p => ({
    timestamp: now, type: "regenerate_all", field: p,
    summary: "Generation initiale du dossier de candidature",
    actor: "ai",
  })));
}

/* ─── Générations ───────────────────────── */

async function generateResume(offer: string, candidate: string, gaps: string[] = [], atsKw: string[] = [], confirmed: string[] = [], cvAngle?: string, c?: CandidateSummary): Promise<string> {
  const angleHint = cvAngle ? `\nANGLE DE CANDIDATURE SUGGÉRÉ : ${cvAngle}\nAdapte le CV pour mettre en avant ces angles sans rien inventer.\n` : "";
  
  // Fetch custom prompt from settings
  const aiPrompt = await prisma.aIPrompt.findUnique({ where: { name: "cv_tailor_fr" } });
  
  // Combine the DB prompt with dynamic context
  const systemPrompt = aiPrompt?.systemPrompt 
    ? `${aiPrompt.systemPrompt}\n\n${angleHint}\n\nCompétences matching: ${confirmed.join(", ")}.\nGaps: ${gaps.join(", ")}.\nMots-clés ATS: ${atsKw.join(", ")}.`
    : `Tu es un rédacteur CV expert pour cadres dirigeants. Génère un CV adapté COMPLET pour cette offre.\n${angleHint}\nCompétences matching: ${confirmed.join(", ")}.\nGaps: ${gaps.join(", ")}.\nMots-clés ATS: ${atsKw.join(", ")}.`;

  const userPromptTemplate = aiPrompt?.content || `Offre : {{offer}}\n\nProfil complet : {{profile}}`;
  
  // Mock proofVault for now by taking verified skills/proofs
  const proofVaultStr = c ? c.proofEntries.map(p => `- ${p.category}: ${p.title} = ${p.value}`).join("\n") : candidate.slice(0, 2000);
  
  const offerTitleMatch = offer.match(/Titre\s*:\s*(.+)/i);
  const offerCompanyMatch = offer.match(/Entreprise\s*:\s*(.+)/i);

  const userPrompt = userPromptTemplate
    .replace(/\{\{cv_master\}\}/g, candidate)
    .replace(/\{\{profile\}\}/g, candidate)
    .replace(/\{\{offer\}\}/g, offer.slice(0, 1500))
    .replace(/\{\{proof_vault\}\}/g, proofVaultStr)
    // Nouveaux marqueurs Premium
    .replace(/\{\{proofVaultData\}\}/g, proofVaultStr)
    .replace(/\{\{offerTitle\}\}/g, offerTitleMatch ? offerTitleMatch[1] : "Poste cible")
    .replace(/\{\{offerCompany\}\}/g, offerCompanyMatch ? offerCompanyMatch[1] : "L'entreprise")
    .replace(/\{\{candidateName\}\}/g, c?.fullName || "Candidat")
    .replace(/\{\{candidateTitle\}\}/g, c?.title || "Directeur")
    .replace(/\{\{candidateYearsExp\}\}/g, String(c?.yearsExp || 15))
    .replace(/\{\{candidateSectors\}\}/g, c?.sectors || "Secteurs variés")
    .replace(/\{\{candidateFunctions\}\}/g, c?.functions || "Direction")
    .replace(/\{\{candidateLanguages\}\}/g, c?.languages || "Non spécifié")
    .replace(/\{\{candidateEducation\}\}/g, c?.education || "Non spécifié")
    .replace(/\{\{candidateCertifications\}\}/g, c?.certifications || "Aucune")
    .replace(/\{\{candidateExperiences\}\}/g, c ? c.experiences.map(e => `- ${e.title} chez ${e.company} (${e.startDate} - ${e.endDate || "présent"})`).join("\n") : "")
    .replace(/\{\{candidateSkills\}\}/g, c ? c.skills.map(s => `- ${s.name}`).join("\n") : "")
    .replace(/\{\{candidateGaps\}\}/g, gaps.length > 0 ? gaps.join(", ") : "Aucun")
    .replace(/\{\{styleTone\}\}/g, "exécutif, direct, stratégique")
    .replace(/\{\{styleVocabulaire\}\}/g, "orienté résultats, P&L, croissance")
    .replace(/\{\{styleFormalite\}\}/g, "très formel, niveau board")
    .replace(/\{\{styleAngleBusiness\}\}/g, cvAngle || "Croissance et transformation");

  const r = await generateWithDeepSeek({
    systemPrompt,
    userPrompt,
    temperature: aiPrompt?.temperature ?? 0.3, 
    maxTokens: 5000,
  });
  if (r.success && r.content) return r.content;

  // Local fallback: build a basic CV from profile data
  return await buildLocalResume(candidate, offer);
}

async function generateLetters(offerTitle: string, company: string, c: CandidateSummary, confirmed: string[] = [], isCabinet = false, letterAngle?: string): Promise<{ long: string; short: string }> {
  const safe = (confirmed || []);
  const cabinetNote = isCabinet
    ? `ATTENTION : L'annonce semble publiée par un cabinet de recrutement. Utilise "le poste que vous accompagnez", "votre client", "cette opportunité" plutôt que "votre entreprise". Ne présuppose pas le nom de l'employeur final.`
    : "";
  const angleHint = letterAngle ? `ANGLE DE LETTRE SUGGÉRÉ : ${letterAngle}\n` : "";

  const aiLetter = await prisma.aIPrompt.findUnique({ where: { name: "lettre_fr" } });
  const aiEmail = await prisma.aIPrompt.findUnique({ where: { name: "email_fr" } });

  const realExperiencesStr = c.experiences.slice(0, 6).map(e => 
    `- ${e.title} chez ${e.company} (du ${e.startDate} au ${e.endDate || "Présent"}) : ${e.description || ""}`
  ).join("\n");

  const antiHallucinationSystemInstruction = `
CONSIGNE ANTI-HALLUCINATION CRITIQUE :
1. Tu ne dois JAMAIS mentionner d'entreprises où le candidat n'a pas travaillé. Les seules entreprises autorisées dans son parcours sont : ${c.experiences.map(e => e.company).join(", ")}.
2. Tu ne devez pas inventer de chiffres, de pourcentages ou de budgets (par exemple ne mentionne pas "+35% de croissance", "4.2 millions d'euros", "portefeuille de 15 clients" ou "équipe de 45 personnes" sauf si ces chiffres exacts sont explicitement listés dans ses expériences réelles fournies ci-dessous).
3. Reste strictement fidèle aux faits fournis. Si aucun chiffre n'est présent pour une expérience, parle des missions de manière qualitative (ex: restructuration commerciale, management d'équipes, négociation d'accords nationaux, pilotage de P&L) sans ajouter de métrique inventée.
`;

  const letterSystem = (aiLetter?.systemPrompt 
    ? `${aiLetter.systemPrompt}\n\nEntreprise: ${company}.\n${cabinetNote}\n${angleHint}\nPoints forts réels : ${safe.join(", ")}.`
    : `Génère une lettre de motivation personnalisée pour ${c.fullName} — ${offerTitle}.\nEntreprise: ${company}.\n${cabinetNote}\n${angleHint}`) + antiHallucinationSystemInstruction;

  const proofVaultTop3 = [
    "EXPÉRIENCES RÉELLES DU CANDIDAT (Ne cite ou n'utilise aucun autre employeur, chiffre ou projet) :",
    realExperiencesStr,
    "",
    "Preuves spécifiques additionnelles :",
    safe.length > 0 ? safe.join("\n") : "Aucune."
  ].join("\n");
  const proofVaultTop2 = proofVaultTop3;
  const roleFit = `Le candidat est un ${c.title || "cadre dirigeant"} expérimenté avec une expertise en ${c.functions || "direction commerciale/marketing"}. Son profil correspond aux exigences du poste de ${offerTitle}.`;

  const letterUser = (aiLetter?.content || `Profil : {{profile}}`)
    .replace(/\{\{profile\}\}/g, (c.summary || "").slice(0, 800))
    .replace(/\{\{cv_master\}\}/g, c.experiences.slice(0, 4).map((e) => `${e.title} chez ${e.company}`).join(", "))
    .replace(/\{\{offer\}\}/g, offerTitle)
    .replace(/\{\{offerTitle\}\}/g, offerTitle)
    .replace(/\{\{offerCompany\}\}/g, company)
    .replace(/\{\{candidateName\}\}/g, c.fullName || "Candidat")
    .replace(/\{\{candidateTitle\}\}/g, c.title || "Directeur")
    .replace(/\{\{candidateYearsExp\}\}/g, String(c.yearsExp || 15))
    .replace(/\{\{proofVaultTop3\}\}/g, proofVaultTop3)
    .replace(/\{\{proof_vault\}\}/g, safe.join(", "))
    .replace(/\{\{roleFit\}\}/g, roleFit)
    .replace(/\{\{candidateGaps\}\}/g, "Aucun écart critique identifié.")
    .replace(/\{\{styleTone\}\}/g, "exécutif, direct, stratégique")
    .replace(/\{\{styleFormalite\}\}/g, "très formel, niveau board")
    .replace(/\{\{styleAngleBusiness\}\}/g, letterAngle || "Croissance et transformation");

  const emailSystem = (aiEmail?.systemPrompt 
    ? `${aiEmail.systemPrompt}\n\nEntreprise: ${company}.`
    : `Génère UN paragraphe de motivation (3-5 lignes) pour ${c.fullName} — ${offerTitle} chez ${company}.`) + antiHallucinationSystemInstruction;
  const emailUser = (aiEmail?.content || `Profil : {{profile}}`)
    .replace(/\{\{profile\}\}/g, (c.summary || "").slice(0, 800))
    .replace(/\{\{cv_master\}\}/g, "")
    .replace(/\{\{offer_title\}\}/g, offerTitle)
    .replace(/\{\{offerTitle\}\}/g, offerTitle)
    .replace(/\{\{offer_company\}\}/g, company)
    .replace(/\{\{offerCompany\}\}/g, company)
    .replace(/\{\{candidateName\}\}/g, c.fullName || "Candidat")
    .replace(/\{\{candidateTitle\}\}/g, c.title || "Directeur")
    .replace(/\{\{candidateYearsExp\}\}/g, String(c.yearsExp || 15))
    .replace(/\{\{proofVaultTop2\}\}/g, proofVaultTop2)
    .replace(/\{\{proof_vault\}\}/g, safe.join(", "))
    .replace(/\{\{styleTone\}\}/g, "exécutif, direct, stratégique")
    .replace(/\{\{styleFormalite\}\}/g, "très formel, niveau board");

  const [l, s] = await Promise.all([
    generateWithDeepSeek({
      systemPrompt: letterSystem,
      userPrompt: letterUser,
      temperature: aiLetter?.temperature ?? 0.3, maxTokens: 3000,
    }),
    generateWithDeepSeek({
      systemPrompt: emailSystem,
      userPrompt: emailUser,
      temperature: aiEmail?.temperature ?? 0.3, maxTokens: 1000,
    }),
  ]);
  const long = l.success && l.content ? l.content : await buildLocalLetter(c, offerTitle, company, "long");
  const short = s.success && s.content ? s.content : await buildLocalLetter(c, offerTitle, company, "short");
  return { long, short };
}

/* ─── Fallbacks locaux (si DeepSeek indisponible) ── */

export async function buildLocalResume(candidateText: string, offerText: string): Promise<string> {
  // Parse key info from candidate text
  const getName = () => {
    const m = candidateText.match(/^Nom : (.+)$/m);
    return m ? m[1].trim() : "Candidat";
  };
  const getTitle = () => {
    const m = candidateText.match(/^Titre : (.+)$/m);
    return m ? m[1].trim() : "";
  };
  const getLocation = () => {
    const m = candidateText.match(/Localisation : (.+)/);
    return m ? m[1].trim() : "";
  };
  const getLanguages = () => {
    const m = candidateText.match(/Langues[^:]*: (.+)$/m);
    return m ? m[1].trim() : "";
  };
  const getJobTitle = () => {
    const m = offerText.match(/^Titre : (.+)$/m);
    return m ? m[1].trim() : "ce poste";
  };

  const name = getName();
  const title = getTitle();
  const loc = getLocation();
  const langs = getLanguages();
  const jobTitle = getJobTitle();

  // Extract experience blocks
  const expMatch = candidateText.match(/Expériences :\n([\s\S]*?)(?:\n\nPreuves|\n\nCV|\n\nCompétences|\n*$)/);
  const expLines = expMatch ? expMatch[1].trim().split("\n").filter((l) => l.trim().startsWith("-")) : [];

  // Extract skills
  const skillsMatch = candidateText.match(/Compétences :\n([\s\S]*?)(?:\n\n|\n*$)/);
  const skillLines = skillsMatch ? skillsMatch[1].trim().split("\n").filter((l) => l.trim().startsWith("-")) : [];

  let resume = `${name}\n${title}\n${loc ? loc + "\n" : ""}`;
  const sectionTitle = getResumeSectionTitle(jobTitle);
  resume += `\n${sectionTitle}\n${title} avec ${getYearsExp(candidateText)} d'experience, candidat pour le poste de ${jobTitle}. Parcours aligné avec les exigences du poste : expertise en management, croissance et transformation commerciale.\n`;
  resume += `\nEXPÉRIENCES PROFESSIONNELLES\n`;
  if (expLines.length > 0) {
    for (const line of expLines.slice(0, 6)) resume += line.trim() + "\n";
  } else {
    resume += `${title} : Expérience professionnelle détaillée dans le CV maître.\n`;
  }
  // Savoir-faire stratégique section
  resume += `\nSAVOIR-FAIRE STRATÉGIQUE\n`;
  if (skillLines.length > 0) {
    const skills = skillLines.slice(0, 12).map(l => l.replace(/^[•\-]\s*/, "").replace(/\(.*?\)/g, "").trim()).filter(Boolean);
    const grouped: Record<string, string[]> = {};
    for (const s of skills) {
      const cat = /management|direction|pilotage|leadership|équipe|equipe/i.test(s) ? "Management & Leadership" :
                  /négociation|nego|vente|commercial|business|client|account/i.test(s) ? "Commercial & Business" :
                  /crm|salesforce|pipeline|forecast|kpi|reporting|data/i.test(s) ? "CRM & Pilotage" :
                  /international|export|global|pays|country|region/i.test(s) ? "International" :
                  /stratégie|strategie|go-to-market|gtm|plan/i.test(s) ? "Stratégie" : "Expertise";
      if (!grouped[cat]) grouped[cat] = [];
      if (!grouped[cat].includes(s)) grouped[cat].push(s);
    }
    for (const [cat, items] of Object.entries(grouped)) {
      resume += `• ${cat} : ${items.slice(0, 4).join(", ")}\n`;
    }
  } else {
    resume += "• Expertise professionnelle détaillée dans le CV maître\n";
  }
  // Savoir-être section
  resume += `\nSAVOIR-ÊTRE EXÉCUTIF\n• Leadership d'équipes commerciales\n• Culture du résultat et de la performance\n• Décision et priorisation en contexte exigeant\n`;

  // Deduplicate languages
  if (langs) {
    
    try {
      const items = langs.split(",").map(s => s.trim()).filter(Boolean);
      const parsed = normalizeLanguages(items);
      if (parsed.length > 0) resume += `\nLANGUES\n${renderLanguages(parsed)}\n`;
    } catch {
      resume += `\nLANGUES\n${langs}\n`;
    }
  }

  return resume;
}

function getResumeSectionTitle(jobTitle: string): string {
  return chooseSummarySectionTitle(jobTitle);
}

function getYearsExp(text: string): string {
  const m = text.match(/(\d+)\s*ans/);
  return m ? `${m[1]} ans` : "plusieurs années";
}

export async function buildLocalLetter(_c: CandidateSummary, offerTitle: string, company: string, mode: "long" | "short"): Promise<string> {
  const name = _c.fullName || "Candidat";
  const title = _c.title || "";
  if (mode === "short") {
    return `Madame, Monsieur,\n\nVotre recherche d'un ${offerTitle}${company ? ` pour ${company}` : ""} a retenu mon attention. Mon parcours en ${title || "direction commerciale"} et mes réalisations correspondent aux exigences du poste. Je suis disponible pour un échange.\n\nCordialement,\n${name}`;
  }
  return `Objet : Candidature au poste de ${offerTitle}${company ? ` chez ${company}` : ""}\n\nMadame, Monsieur,\n\nLe poste de ${offerTitle}${company ? ` au sein de ${company}` : ""} correspond à mon expertise en ${title || "direction commerciale"} et à mes réalisations en matière de pilotage d'équipes, de croissance des revenus et de développement commercial.\n\nMon parcours de plusieurs années m'a permis de structurer des organisations commerciales performantes, d'ouvrir de nouveaux marchés et d'atteindre des objectifs de croissance ambitieux. Les résultats obtenus dans mes précédentes fonctions démontrent ma capacité à répondre aux exigences de ce poste.\n\nJe suis disponible pour vous rencontrer et vous détailler ma vision du poste ainsi que les résultats concrets que je peux apporter à votre organisation.\n\nCordialement,\n${name}\n${_c.location || ""}\n${_c.phone || ""}`;
}

/* ─── Génération email ──────────────────── */

async function generateApplicationEmail(offerTitle: string, company: string, c: CandidateSummary, confirmed: string[] = [], isCabinet = false): Promise<string> {
  const safe = confirmed || [];
  const cabinetNote = isCabinet
    ? `ATTENTION : L'annonce est publiée par un cabinet. Utilise "le poste que vous accompagnez", "votre client". Ne nomme pas l'employeur final.`
    : "";
  const r = await generateWithDeepSeek({
    systemPrompt: `Génère un email de candidature professionnel pour ${c.fullName} — ${offerTitle}${company ? ` chez ${company}` : ""}.

${cabinetNote}

RÈGLES :
- 3 à 5 phrases de corps d'email, pas plus.
- Format : Objet, Madame/Monsieur, 3-5 phrases, formule de politesse, signature (nom, titre, téléphone, email si dispo).
- Mentionne le poste, 1-2 points forts réels du profil, propose un échange.
- N'invente RIEN. Points forts réels : ${safe.join(", ")}.
- Pas de Markdown, pas de **, pas de ---.
- Ton professionnel, confiant, pas désespéré.`,
    userPrompt: `Profil : ${c.title}. ${(c.summary || "").slice(0, 400)}\nLocalisation: ${c.location || ""}\nTéléphone: ${c.phone || ""}\nEmail: ${c.email || ""}`,
    temperature: 0.3, maxTokens: 1500,
  });
  return r.success && r.content ? r.content : "";
}

/* ─── Fallback local analyse ─────────────── */

function buildLocalAnalysis(job: { title: string; company: string | null; description: string | null; contractType: string | null }, c: CandidateSummary): PrepareOutput {
  const desc = (job.description || "").toLowerCase();
  const skills = c.skills.map((s) => s.name.toLowerCase());
  const titles = c.experiences.map((e) => e.title.toLowerCase());
  const sectors = (c.sectors || "").toLowerCase().split(",").map((s) => s.trim());

  // Matching simple : quels skills apparaissent dans la description
  const matched = skills.filter((sk) => desc.includes(sk));
  const titleMatch = titles.filter((t) => desc.includes(t));
  const sectorMatch = sectors.filter((s) => s && desc.includes(s));

  const confirmedMatches = [...matched, ...titleMatch].filter(Boolean).slice(0, 8);
  if (sectorMatch.length > 0) confirmedMatches.push(...sectorMatch.filter(Boolean));
  const keyRequirements = desc.match(/(?:profil|recherché|qualité|compétence|expérience|formation|diplôme|langue|maîtrise|connaissance)[^.]*\.?/gi)?.slice(0, 5) ?? [];
  const wordMatches = desc.match(/\b[A-Za-zÀ-ÿ]{4,}\b/g)?.slice(0, 15) ?? [];
  const atsKeywords = [...new Set(wordMatches)];

  const matchScore = Math.min(95, Math.round(
    (matched.length / Math.max(skills.length, 1)) * 40 +
    (titleMatch.length / Math.max(titles.length, 1)) * 30 +
    (sectorMatch.length / Math.max(1, sectorMatch.length || 1)) * 15 +
    15 // base
  ));

  return {
    matchScore,
    jobSummary: `${job.title} chez ${job.company || "N/A"}. ${job.contractType || ""}. ${keyRequirements.length} prérequis détectés.`,
    keyRequirements: keyRequirements.map((r) => r.slice(0, 120)).filter(Boolean),
    atsKeywords: atsKeywords.slice(0, 15),
    confirmedMatches: confirmedMatches.slice(0, 8),
    gaps: skills.filter((sk) => !desc.includes(sk)).slice(0, 5).map((g) => `${g} (non détecté dans l'offre)`),
    risks: [],
    applicationEmail: `Objet : Candidature au poste de ${job.title}\n\nMadame, Monsieur,\n\nJe vous adresse ma candidature pour le poste de ${job.title}${job.company ? ` au sein de ${job.company}` : ""}.\n\nFort de ${c.yearsExp || "plus de 15"} ans d'expérience en ${c.functions || "direction commerciale"}, j'ai piloté des équipes et des budgets significatifs, avec des résultats mesurables en croissance, rentabilité et développement de nouveaux marchés.\n\nLes responsabilités décrites dans votre annonce correspondent à mon parcours et à mes réalisations professionnelles.\n\nJe suis disponible pour un échange à votre convenance afin de détailler ma candidature.\n\nCordialement,\n${c.fullName}\n${c.location || ""}\n${c.phone || ""}`,
    recruiterMessage: `Bonjour, je suis ${c.fullName}, ${c.title}. Votre offre de ${job.title} a retenu mon attention. Au plaisir d'échanger !`,
    atsFormAnswers: [
      { question: "Années d'expérience", answer: `${c.yearsExp || "10"}+ ans` },
      { question: "Poste actuel", answer: c.title },
    ],
  };
}

/* ─── Préparation complète ───────────────── */

export async function prepareApplication(jobId: string): Promise<{ success: boolean; draftId?: string; error?: string; fallbackUsed?: boolean }> {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) return { success: false, error: "Offre introuvable" };
  const c = await getCandidate();
  if (!c) return { success: false, error: "Aucun profil." };
  const offerText = buildJobText(job);
  const candidateText = buildCandidateText(c);

  // Détection cabinet de recrutement
  const cabinetDetected = isCabinetRecrutement(offerText) || isCabinetRecrutement(job.description || "");

  const analysis = await generateJsonWithDeepSeek<PrepareOutput>({
    systemPrompt: `Tu prépares un dossier de candidature. RÈGLE: n'invente RIEN. Retourne UNIQUEMENT du JSON.`,
    userPrompt: `=== OFFRE ===\n${offerText}\n\n=== PROFIL ===\n${candidateText}`, temperature: 0.3,
  });

  // Si DeepSeek échoue ou retourne un JSON invalide → fallback local
  const d: PrepareOutput = (analysis.success && analysis.data) ? analysis.data : buildLocalAnalysis(job, c);
  const fallbackUsed = !(analysis.success && analysis.data);

  const confirmed = Array.isArray(d.confirmedMatches) ? d.confirmedMatches : [];
  const gaps = Array.isArray(d.gaps) ? d.gaps : [];
  const atsKw = Array.isArray(d.atsKeywords) ? d.atsKeywords : [];

  // Récupérer les angles sémantiques
  let cvAngle: string | undefined;
  let letterAngle: string | undefined;
  let interviewPrepAngle: string | undefined;
  try {
    const score = await prisma.jobScore.findUnique({ where: { jobId }, select: { semanticAnalysisJson: true } });
    if (score?.semanticAnalysisJson) {
      const sem = JSON.parse(score.semanticAnalysisJson);
      if (sem.suggestedCvAngle) cvAngle = sem.suggestedCvAngle;
      if (sem.suggestedCoverLetterAngle) letterAngle = sem.suggestedCoverLetterAngle;
      if (sem.interviewPrepAngle) interviewPrepAngle = sem.interviewPrepAngle;
    }
  } catch { /* non-bloquant */ }

  const resume = await generateResume(offerText, candidateText, gaps, atsKw, confirmed, cvAngle, c);
  const letters = await generateLetters(job.title, job.company || "", c, confirmed, cabinetDetected, letterAngle);
  const aiEmail = await generateApplicationEmail(job.title, job.company || "", c, confirmed, cabinetDetected);
  // Utiliser l'email IA s'il a été généré, sinon fallback
  const finalEmail = aiEmail || d.applicationEmail;

  // Sanitize all generated text — no Markdown, no placeholders
  const sanitizedResume = cleanGeneratedApplicationText(resume);
  const sanitizedLetterLong = cleanGeneratedApplicationText(letters.long);
  const sanitizedLetterShort = cleanGeneratedApplicationText(letters.short);
  const sanitizedEmail = cleanGeneratedApplicationText(finalEmail);
  const sanitizedMessage = cleanGeneratedApplicationText(d.recruiterMessage);
  const sanitizedSummary = cleanGeneratedApplicationText(d.jobSummary);

  const sanitizeLog = {
    resume: sanitizedResume.warnings,
    letterLong: sanitizedLetterLong.warnings,
    letterShort: sanitizedLetterShort.warnings,
    email: sanitizedEmail.warnings,
  };

  const draft = await prisma.applicationDraft.upsert({
    where: { jobId },
    create: { jobId, status: "draft", matchScore: d.matchScore, jobSummary: sanitizedSummary.text,
      keyRequirements: JSON.stringify(d.keyRequirements), atsKeywords: JSON.stringify(d.atsKeywords),
      confirmedMatches: JSON.stringify(confirmed), gaps: JSON.stringify(gaps), risks: JSON.stringify(d.risks || []),
      applicationEmail: sanitizedEmail.text, recruiterMessage: sanitizedMessage.text, atsFormAnswers: JSON.stringify(d.atsFormAnswers),
      tailoredResumeContent: sanitizedResume.text, motivationLetterLong: sanitizedLetterLong.text, motivationLetterShort: sanitizedLetterShort.text,
      changeLogJson: buildChangelog("new", ["professionalSummary", "experiences", "skills", "education", "languages"]),
      generationLogs: JSON.stringify({ generatedAt: new Date().toISOString(), success: true, fallbackUsed, cabinetDetected, sanitized: sanitizeLog }),
    },
    update: { status: "draft", matchScore: d.matchScore, jobSummary: sanitizedSummary.text,
      keyRequirements: JSON.stringify(d.keyRequirements), atsKeywords: JSON.stringify(d.atsKeywords),
      confirmedMatches: JSON.stringify(confirmed), gaps: JSON.stringify(gaps), risks: JSON.stringify(d.risks || []),
      applicationEmail: sanitizedEmail.text, recruiterMessage: sanitizedMessage.text, atsFormAnswers: JSON.stringify(d.atsFormAnswers),
      tailoredResumeContent: sanitizedResume.text, motivationLetterLong: sanitizedLetterLong.text, motivationLetterShort: sanitizedLetterShort.text,
      changeLogJson: buildChangelog("update", ["professionalSummary", "experiences", "skills", "education", "languages"]),
      generationLogs: JSON.stringify({ generatedAt: new Date().toISOString(), success: true, fallbackUsed, cabinetDetected, sanitized: sanitizeLog }),
    },
  });

  await syncDocuments(draft.id);
  revalidatePath(`/dashboard/jobs/applications/${draft.id}`);
  return { success: true, draftId: draft.id };
}

/* ─── Sauvegarde Document ────────────────── */

export async function syncDocuments(draftId: string) {
  const draft = await prisma.applicationDraft.findUnique({ where: { id: draftId }, include: { job: true } });
  if (!draft || !draft.job) return;

  // Le contenu est déjà stocké dans ApplicationDraft (tailoredResumeContent, motivationLetterLong).
  // La synchro Document est optionnelle — elle ne fonctionne que si une Opportunity correspondante existe.
  // On ignore silencieusement les échecs pour ne pas bloquer la préparation de candidature.
  try {
    if (draft.tailoredResumeDocumentId) {
      await prisma.document.update({
        where: { id: draft.tailoredResumeDocumentId },
        data: { content: draft.tailoredResumeContent || "" },
      }).catch(() => {});
    }
    if (draft.motivationLetterDocumentId) {
      await prisma.document.update({
        where: { id: draft.motivationLetterDocumentId },
        data: { content: draft.motivationLetterLong || "" },
      }).catch(() => {});
    }
  } catch { /* Document sync is optional */ }
}

/* ─── Regénération ───────────────────────── */

export async function regenerateDraftPart(draftId: string, target: string): Promise<{ success: boolean; error?: string }> {
  const draft = await prisma.applicationDraft.findUnique({ where: { id: draftId }, include: { job: true } });
  if (!draft || !draft.job) return { success: false, error: "Introuvable" };
  const job = draft.job;
  const c = await getCandidate();
  if (!c) return { success: false, error: "Profil introuvable" };

  const offerText = buildJobText(job);
  const candidateText = buildCandidateText(c);
  const gaps = draft.gaps ? JSON.parse(draft.gaps) : [];
  const atsKw = draft.atsKeywords ? JSON.parse(draft.atsKeywords) : [];
  const confirmed = draft.confirmedMatches ? JSON.parse(draft.confirmedMatches) : [];
  const changes: string[] = [];

  if (target === "resume" || target === "all") {
    const resume = await generateResume(offerText, candidateText, gaps, atsKw, confirmed, undefined, c);
    const cleanedResume = cleanGeneratedApplicationText(resume);
    await prisma.applicationDraft.update({ where: { id: draftId }, data: { tailoredResumeContent: cleanedResume.text } });
    changes.push("resume");
  }
  if (target === "letter" || target === "all") {
    const cabinetDetected = isCabinetRecrutement(offerText) || isCabinetRecrutement(job.description || "");
    const letters = await generateLetters(job.title, job.company || "", c, confirmed, cabinetDetected);
    const cleanedLong = cleanGeneratedApplicationText(letters.long);
    const cleanedShort = cleanGeneratedApplicationText(letters.short);
    await prisma.applicationDraft.update({ where: { id: draftId }, data: { motivationLetterLong: cleanedLong.text, motivationLetterShort: cleanedShort.text } });
    changes.push("letter");
  }

  // Ajouter au changelog
  const now = new Date().toISOString();
  const existing = draft.changeLogJson ? JSON.parse(draft.changeLogJson) : [];
  existing.push({ timestamp: now, type: `regenerate_${target}`, field: changes.join(", "), summary: `Regeneration ${target} du contenu`, actor: "ai" });
  // Limiter le changelog a 50 entrees max
  if (existing.length > 50) existing.splice(0, existing.length - 50);
  await prisma.applicationDraft.update({ where: { id: draftId }, data: { changeLogJson: JSON.stringify(existing) } });

  revalidatePath(`/dashboard/jobs/applications/${draftId}`);
  return { success: true };
}

/* ─── Actions statut ─────────────────────── */

async function addLog(draftId: string, entry: Record<string, unknown>) {
  const draft = await prisma.applicationDraft.findUnique({ where: { id: draftId } });
  const existing = draft?.changeLogJson ? JSON.parse(draft.changeLogJson) : [];
  existing.push({ ...entry, timestamp: new Date().toISOString() });
  await prisma.applicationDraft.update({ where: { id: draftId }, data: { changeLogJson: JSON.stringify(existing) } });
}

export async function markReadyToReview(draftId: string) {
  const now = new Date().toISOString();
  await addLog(draftId, { timestamp: now, type: "status_change", field: "status", summary: "Marque comme pret a verifier", actor: "user" });
  await prisma.applicationDraft.update({ where: { id: draftId }, data: { status: "ready_to_review" } });
  return { success: true, status: "ready_to_review" };
}

export async function approveDraft(draftId: string) {
  const now = new Date().toISOString();
  await addLog(draftId, { timestamp: now, type: "status_change", field: "status", summary: "Dossier approuve", actor: "user" });
  await prisma.applicationDraft.update({ where: { id: draftId }, data: { status: "approved" } });
  return { success: true, status: "approved" };
}

export async function markSent(draftId: string) {
  const draft = await prisma.applicationDraft.findUnique({ where: { id: draftId }, select: { status: true } });
  if (draft?.status !== "approved") {
    return { success: false, error: "Le dossier doit etre approuve avant de pouvoir le marquer comme envoye." };
  }
  const now = new Date();
  const followUpDue = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  await addLog(draftId, { type: "status_change", field: "status", to: "sent", author: "user" });
  await addLog(draftId, { type: "pipeline", field: "pipelineStatus", to: "sent", summary: "Entree dans le pipeline", author: "user" });
  await prisma.applicationDraft.update({
    where: { id: draftId },
    data: {
      status: "sent",
      pipelineStatus: "sent",
      sentAt: now,
      followUpDueAt: followUpDue,
      lastPipelineActionAt: now,
    },
  });
  revalidatePath("/dashboard/jobs/pipeline");
  return { success: true, status: "sent" };
}

export async function rejectDraft(draftId: string) {
  await addLog(draftId, { type: "status_change", field: "status", to: "rejected", author: "user" });
  await prisma.applicationDraft.update({ where: { id: draftId }, data: { status: "rejected" } });
  return { success: true, status: "rejected" };
}

export async function archiveDraft(draftId: string) {
  await addLog(draftId, { type: "status_change", field: "status", to: "archived", author: "user" });
  await prisma.applicationDraft.update({ where: { id: draftId }, data: { status: "archived" } });
  return { success: true, status: "archived" };
}

/* ─── CRUD ───────────────────────────────── */

export async function getApplicationDraft(draftId: string) {
  return prisma.applicationDraft.findUnique({
    where: { id: draftId },
    include: {
      job: { include: { score: true, source: { select: { name: true } } } },
      contact: { select: { id: true, fullName: true, contactType: true, companyName: true, firmName: true, nextFollowUpAt: true } },
    },
  });
}

export async function updateApplicationDraft(draftId: string, data: Record<string, unknown>) {
  // Intercepter les champs du Job
  const salaryMin = data.salaryMin !== undefined ? (data.salaryMin === null ? null : Number(data.salaryMin)) : undefined;
  const salaryMax = data.salaryMax !== undefined ? (data.salaryMax === null ? null : Number(data.salaryMax)) : undefined;
  delete data.salaryMin;
  delete data.salaryMax;

  if (salaryMin !== undefined || salaryMax !== undefined) {
    const draft = await prisma.applicationDraft.findUnique({ where: { id: draftId }, select: { jobId: true } });
    if (draft?.jobId) {
      await prisma.job.update({
        where: { id: draft.jobId },
        data: {
          ...(salaryMin !== undefined ? { salaryMin } : {}),
          ...(salaryMax !== undefined ? { salaryMax } : {}),
        }
      });
    }
  }

  // Intercepter l'excitement s'il est envoyé en string
  if (data.excitement !== undefined && data.excitement !== null) {
    data.excitement = Number(data.excitement);
  }

  // Ajouter une trace changelog pour les éditions manuelles
  const changes: string[] = [];
  for (const key of Object.keys(data)) {
    if (key !== "status" && key !== "changeLogJson") changes.push(key);
  }
  if (changes.length > 0) {
    const draft = await prisma.applicationDraft.findUnique({ where: { id: draftId } });
    const existing = draft?.changeLogJson ? JSON.parse(draft.changeLogJson) : [];
    existing.push({ section: changes.join(", "), reason: "Édition manuelle", timestamp: new Date().toISOString(), author: "user" });
    data.changeLogJson = JSON.stringify(existing);
  }
  return prisma.applicationDraft.update({ where: { id: draftId }, data });
}

/* ─── Export texte ───────────────────────── */

export async function exportDraftText(draftId: string, type: string): Promise<{ content: string; filename: string } | null> {
  const draft = await getApplicationDraft(draftId);
  if (!draft || !draft.job) return null;
  const job = draft.job;
  const base = `${job.company || "inconnu"}_${job.title.replace(/\s+/g, "_")}`;
  if (type === "resume") return { content: draft.tailoredResumeContent || "", filename: `CV_${base}.txt` };
  if (type === "letter") return { content: draft.motivationLetterLong || "", filename: `Lettre_${base}.txt` };
  if (type === "email") return { content: draft.applicationEmail || "", filename: `Email_${base}.txt` };
  if (type === "full") {
    const parts = [
      `=== DOSSIER DE CANDIDATURE ===\nPoste : ${job.title}\nEntreprise : ${job.company}\nScore : ${draft.matchScore}/100\n`,
      `\n--- CV ---\n${draft.tailoredResumeContent || ""}`,
      `\n--- LETTRE ---\n${draft.motivationLetterLong || ""}`,
      `\n--- EMAIL ---\n${draft.applicationEmail || ""}`,
      `\n--- MESSAGE RECRUTEUR ---\n${draft.recruiterMessage || ""}`,
    ];
    return { content: parts.join("\n\n"), filename: `Candidature_${base}.txt` };
  }
  return null;
}
