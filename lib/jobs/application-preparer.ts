"use server";

import { prisma } from "@/lib/prisma";
import { generateJsonWithDeepSeek, generateWithDeepSeek } from "@/lib/ai/deepseek";
import { cleanGeneratedApplicationText, isCabinetRecrutement } from "@/lib/jobs/text-sanitizer";
import { revalidatePath } from "next/cache";

/* ─── Types ─────────────────────────────── */

interface CandidateSummary {
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
  const p = await prisma.profile.findFirst({ include: { skills: true, experiences: { orderBy: { startDate: "desc" }, take: 10 }, cvMaster: true } });
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

  return `Nom : ${c.fullName}\nTitre : ${c.title}\n${c.summary ? `Résumé : ${c.summary.slice(0, 1000)}\n` : ""}\nCompétences :\n${c.skills.map(s => `  - ${s.name} (${s.category}, ${s.level})`).join("\n")}\n\nExpériences :\n${c.experiences.map(e => {
    const hasRealEnd = e.endDate && e.endDate.trim() !== "";
    // Si endDate existe et est dans le passé → poste TERMINÉ
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

async function generateResume(offer: string, candidate: string, gaps: string[] = [], atsKw: string[] = [], confirmed: string[] = []): Promise<string> {
  const r = await generateWithDeepSeek({
    systemPrompt: `Tu es un rédacteur CV expert. Génère un CV adapté COMPLET pour cette offre.

RÈGLES ABSOLUES — si tu les violes, le CV est inutilisable :

1. N'invente JAMAIS une expérience, un diplôme, une certification, une compétence ou un chiffre.
2. Respecte STRICTEMENT les dates de début et de FIN de chaque expérience. Si une expérience a une date de fin dans le passé, n'écris JAMAIS "actuellement", "en poste", "depuis" ou quoi que ce soit qui suggère que la personne y travaille encore. Écris les dates exactes et utilise le passé.
3. Si une section n'a AUCUNE donnée réelle (pas de formation, pas de certification, pas de langue), SUPPRIME complètement la section. N'écris JAMAIS "Non renseigné", "Aucune certification mentionnée", "N/A" ou tout autre texte d'absence. Une section vide = elle disparaît du CV.
4. Conserve TOUTES les expériences importantes du CV maître. Ne supprime pas d'expérience.
5. Reformule les expériences pour matcher l'offre, mais reste FIDÈLE aux faits.

Compétences matching: ${confirmed.join(", ")}.
Gaps à NE PAS inventer: ${gaps.join(", ")}.
Mots-clés ATS à intégrer naturellement (si vrais): ${atsKw.join(", ")}.

STRUCTURE (sans Markdown, sans **, sans ---) :

NOM PRÉNOM
Titre professionnel
Coordonnées si disponibles

RÉSUMÉ EXÉCUTIF
[3-5 lignes adaptées au poste — utilise le PASSÉ pour les expériences terminées]

EXPÉRIENCE PROFESSIONNELLE
[Pour chaque expérience :]
Entreprise — Dates exactes (AAAA-MM à AAAA-MM ou AAAA-MM à présent si poste actuel)
Titre du poste
[2-4 lignes de responsabilités et réalisations — au PASSÉ si le poste est terminé, au PRÉSENT si en cours]

COMPÉTENCES CLÉS
[• liste à puces, uniquement les compétences réelles]

FORMATION
[Diplômes réels uniquement. Si aucune formation dans le profil, SUPPRIMER cette section entièrement.]

LANGUES
[Langues réelles uniquement. Si pas de données, SUPPRIMER.]

CERTIFICATIONS
[Certifications réelles uniquement. Si aucune, SUPPRIMER.]`,
    userPrompt: `Offre : ${offer.slice(0, 1500)}\n\nProfil complet : ${candidate.slice(0, 6000)}`,
    temperature: 0.3, maxTokens: 5000,
  });
  return r.success && r.content ? r.content : "Échec génération CV";
}

async function generateLetters(offerTitle: string, company: string, c: CandidateSummary, confirmed: string[] = [], isCabinet = false): Promise<{ long: string; short: string }> {
  const safe = (confirmed || []);
  const cabinetNote = isCabinet
    ? `ATTENTION : L'annonce semble publiée par un cabinet de recrutement. Utilise "le poste que vous accompagnez", "votre client", "cette opportunité" plutôt que "votre entreprise". Ne présuppose pas le nom de l'employeur final.`
    : "";

  const [l, s] = await Promise.all([
    generateWithDeepSeek({
      systemPrompt: `Génère une lettre de motivation personnalisée pour ${c.fullName} — ${offerTitle}.

Entreprise: ${company}.
${cabinetNote}

RÈGLES :
- N'invente JAMAIS une expérience, un diplôme, une certification ou un chiffre.
- Points forts réels à mentionner : ${safe.join(", ")}.
- Si le secteur n'est pas couvert par le CV, utilise des formulations de transférabilité ("mon expérience est transférable à...", "mon parcours m'a habitué à...").
- Structure : 3-4 paragraphes. Pas de Markdown, pas de **, pas de ---.
- Format : Objet, Madame/Monsieur, corps, formule de politesse, signature.
- Texte propre, prêt à envoyer.`,
      userPrompt: `Profil : ${(c.summary || "").slice(0, 800)}\n\nExpériences clés : ${c.experiences.slice(0, 4).map((e) => `${e.title} chez ${e.company}`).join(", ")}`,
      temperature: 0.3, maxTokens: 3000,
    }),
    generateWithDeepSeek({
      systemPrompt: `Génère UN paragraphe de motivation (3-5 lignes) pour ${c.fullName} — ${offerTitle} chez ${company}. Court, percutant, pas de Markdown.`,
      userPrompt: "", temperature: 0.3, maxTokens: 1000,
    }),
  ]);
  return { long: l.success && l.content ? l.content : "Échec", short: s.success && s.content ? s.content : "" };
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
    applicationEmail: `Objet : Candidature — ${job.title}\n\nMadame, Monsieur,\n\nJe vous adresse ma candidature pour le poste de ${job.title}${job.company ? ` au sein de ${job.company}` : ""}.\n\nFort de ${c.yearsExp || "plus de 15"} ans d'expérience en ${c.functions || "direction commerciale"}, j'ai piloté des équipes et des budgets significatifs, avec des résultats mesurables en croissance, rentabilité et développement de nouveaux marchés.\n\nLes responsabilités décrites dans votre annonce correspondent à mon parcours et à mes réalisations professionnelles.\n\nJe suis disponible pour un échange à votre convenance afin de détailler ma candidature.\n\nCordialement,\n${c.fullName}\n${c.location || ""}\n${c.phone || ""}`,
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

  const resume = await generateResume(offerText, candidateText, gaps, atsKw, confirmed);
  const letters = await generateLetters(job.title, job.company || "", c, confirmed, cabinetDetected);
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
  const gaps = draft.gaps ? JSON.parse(draft.gaps) : [];
  const atsKw = draft.atsKeywords ? JSON.parse(draft.atsKeywords) : [];
  const confirmed = draft.confirmedMatches ? JSON.parse(draft.confirmedMatches) : [];
  const changes: string[] = [];

  if (target === "resume" || target === "all") {
    const resume = await generateResume(offerText, "", gaps, atsKw, confirmed);
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
    include: { job: { include: { score: true, source: { select: { name: true } } } } },
  });
}

export async function updateApplicationDraft(draftId: string, data: Record<string, unknown>) {
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
