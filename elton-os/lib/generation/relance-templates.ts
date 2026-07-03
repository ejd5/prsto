// ─── PRSTO – Templates de relance (email, LinkedIn, cabinet) ───
// Fonctions pures — zéro envoi automatique. L'utilisateur copie et envoie lui-même.

export type RelanceTemplate = "j5_fr" | "j10_fr" | "linkedin_fr" | "cabinet_fr" | "remerciement_fr"
  | "j5_en" | "j10_en" | "linkedin_en" | "cabinet_en" | "remerciement_en";

export interface RelanceContext {
  candidateName: string;
  candidateTitle: string;
  oppTitle: string;
  oppCompany: string;
  oppLocation: string;
  oppCountry: string;
  score: number | null;
  strategy: string;
  recruiterName?: string;
  recruiterTitle?: string;
  cabinetName?: string;
  hasApprovedDoc: boolean;
}

// ─── Relance J+5 FR ──────────────────────────────────────

export function generateRelanceJ5_FR(ctx: RelanceContext): string {
  const recruteur = ctx.recruiterName || "Madame, Monsieur";
  const lines: string[] = [];
  lines.push(`Objet : Suivi candidature — ${ctx.oppTitle} — ${ctx.candidateName}`);
  lines.push("");
  lines.push(`Bonjour ${recruteur},`);
  lines.push("");
  lines.push(`Je fais suite à ma candidature pour le poste de ${ctx.oppTitle} au sein de ${ctx.oppCompany}, envoyée il y a quelques jours.`);
  lines.push("");
  lines.push(`Mon profil de ${ctx.candidateTitle} avec ${ctx.score ? `une forte adéquation (score ${ctx.score}/100)` : "une expérience solide en direction commerciale"} correspond aux enjeux de ce poste${ctx.oppLocation || ctx.oppCountry ? `, notamment sur le périmètre ${ctx.oppLocation || ctx.oppCountry}` : ""}.`);
  lines.push("");
  if (ctx.hasApprovedDoc) {
    lines.push(`Mon CV détaillé est prêt. Je peux vous le transmettre à nouveau si nécessaire.`);
    lines.push("");
  }
  lines.push(`Je reste à votre disposition pour un échange.`);
  lines.push("");
  lines.push(`Cordialement,`);
  lines.push(ctx.candidateName);
  return lines.join("\n");
}

// ─── Relance J+10 FR ─────────────────────────────────────

export function generateRelanceJ10_FR(ctx: RelanceContext): string {
  const recruteur = ctx.recruiterName || "Madame, Monsieur";
  const lines: string[] = [];
  lines.push(`Objet : Second suivi — ${ctx.oppTitle} — ${ctx.candidateName}`);
  lines.push("");
  lines.push(`Bonjour ${recruteur},`);
  lines.push("");
  lines.push(`Je me permets un second contact concernant ma candidature au poste de ${ctx.oppTitle} chez ${ctx.oppCompany}.`);
  lines.push("");
  lines.push(`Mon parcours de ${ctx.candidateTitle} est aligné avec les exigences du poste${ctx.score ? ` (score d'adéquation ${ctx.score}/100)` : ""}. Je suis convaincu de pouvoir contribuer concrètement aux objectifs de croissance de ${ctx.oppCompany}${ctx.oppCountry ? ` en ${ctx.oppCountry}` : ""}.`);
  lines.push("");
  lines.push(`Je comprends que le processus de recrutement prend du temps. Je reste pleinement intéressé et disponible pour échanger à votre convenance.`);
  lines.push("");
  lines.push(`Bien cordialement,`);
  lines.push(ctx.candidateName);
  return lines.join("\n");
}

// ─── Relance LinkedIn FR ─────────────────────────────────

export function generateRelanceLinkedIn_FR(ctx: RelanceContext): string {
  const lines: string[] = [];
  lines.push(`Bonjour ${ctx.recruiterName || ""},`);
  lines.push("");
  lines.push(`J'ai postulé récemment au poste de ${ctx.oppTitle} chez ${ctx.oppCompany}. Je souhaitais me présenter brièvement et vous confirmer mon vif intérêt pour cette opportunité.`);
  lines.push("");
  lines.push(`${ctx.candidateTitle} avec une expérience terrain ${ctx.score ? `(match ${ctx.score}/100 sur l'offre)` : "solide"}, je suis attentif aux enjeux de croissance de ${ctx.oppCompany}.`);
  lines.push("");
  lines.push(`Je serais ravi d'échanger avec vous sur cette opportunité.`);
  lines.push(`Excellente journée,`);
  lines.push(ctx.candidateName);
  return lines.join("\n");
}

// ─── Relance Cabinet FR ───────────────────────────────────

export function generateRelanceCabinet_FR(ctx: RelanceContext): string {
  const cabinet = ctx.cabinetName || "votre cabinet";
  const lines: string[] = [];
  lines.push(`Objet : Candidature ${ctx.oppTitle} — ${ctx.candidateName}`);
  lines.push("");
  lines.push(`Bonjour,`);
  lines.push("");
  lines.push(`Je fais suite à ma candidature pour le poste de ${ctx.oppTitle}${ctx.oppCompany ? ` chez ${ctx.oppCompany}` : ""}, transmise via ${cabinet}.`);
  lines.push("");
  lines.push(`Mon profil de ${ctx.candidateTitle}${ctx.score ? ` présente une adéquation de ${ctx.score}/100 avec les exigences du poste` : " correspond aux exigences du poste"}. Je suis disponible pour un échange approfondi avec le consultant en charge du dossier.`);
  lines.push("");
  lines.push(`Dans l'attente de votre retour,`);
  lines.push(`Cordialement,`);
  lines.push(ctx.candidateName);
  return lines.join("\n");
}

// ─── Remerciement après entretien FR ─────────────────────

export function generateRemerciement_FR(ctx: RelanceContext): string {
  const recruteur = ctx.recruiterName || "Madame, Monsieur";
  const lines: string[] = [];
  lines.push(`Objet : Remerciement — ${ctx.oppTitle}`);
  lines.push("");
  lines.push(`Bonjour ${recruteur},`);
  lines.push("");
  lines.push(`Je tenais à vous remercier pour l'entretien que vous m'avez accordé concernant le poste de ${ctx.oppTitle} chez ${ctx.oppCompany}.`);
  lines.push("");
  lines.push(`Nos échanges ont confirmé mon intérêt pour ce poste et renforcé ma conviction de pouvoir y apporter une contribution significative, notamment sur les dimensions de croissance commerciale et de pilotage d'équipe.`);
  lines.push("");
  lines.push(`Je reste à votre disposition pour toute information complémentaire.`);
  lines.push("");
  lines.push(`Cordialement,`);
  lines.push(ctx.candidateName);
  return lines.join("\n");
}

// ═══════════ ENGLISH ═════════════════════════════════════

// ─── Follow-up J+5 EN ────────────────────────────────────

export function generateRelanceJ5_EN(ctx: RelanceContext): string {
  const recruiter = ctx.recruiterName || "Dear Hiring Manager";
  const lines: string[] = [];
  lines.push(`Subject: Application follow-up — ${ctx.oppTitle} — ${ctx.candidateName}`);
  lines.push("");
  lines.push(`${recruiter},`);
  lines.push("");
  lines.push(`I wanted to follow up on my application for the ${ctx.oppTitle} position at ${ctx.oppCompany}, submitted a few days ago.`);
  lines.push("");
  lines.push(`My background as ${ctx.candidateTitle}${ctx.score ? ` (role match score: ${ctx.score}/100)` : ""} aligns closely with the requirements${ctx.oppLocation || ctx.oppCountry ? `, particularly for the ${ctx.oppLocation || ctx.oppCountry} scope` : ""}.`);
  lines.push("");
  if (ctx.hasApprovedDoc) {
    lines.push(`My tailored CV is ready — happy to resend it if needed.`);
    lines.push("");
  }
  lines.push(`I remain at your disposal for a conversation.`);
  lines.push("");
  lines.push(`Kind regards,`);
  lines.push(ctx.candidateName);
  return lines.join("\n");
}

// ─── Follow-up J+10 EN ───────────────────────────────────

export function generateRelanceJ10_EN(ctx: RelanceContext): string {
  const recruiter = ctx.recruiterName || "Dear Hiring Manager";
  const lines: string[] = [];
  lines.push(`Subject: Second follow-up — ${ctx.oppTitle} — ${ctx.candidateName}`);
  lines.push("");
  lines.push(`${recruiter},`);
  lines.push("");
  lines.push(`I'm reaching out once more regarding my application for the ${ctx.oppTitle} role at ${ctx.oppCompany}.`);
  lines.push("");
  lines.push(`I remain confident that my experience as ${ctx.candidateTitle}${ctx.score ? ` (match score: ${ctx.score}/100)` : ""} would allow me to make a meaningful contribution to ${ctx.oppCompany}'s growth${ctx.oppCountry ? ` in ${ctx.oppCountry}` : ""}.`);
  lines.push("");
  lines.push(`I understand the hiring process takes time and I appreciate your consideration. I would still welcome the opportunity to discuss further.`);
  lines.push("");
  lines.push(`Best regards,`);
  lines.push(ctx.candidateName);
  return lines.join("\n");
}

// ─── LinkedIn follow-up EN ───────────────────────────────

export function generateRelanceLinkedIn_EN(ctx: RelanceContext): string {
  const lines: string[] = [];
  lines.push(`Hi ${ctx.recruiterName || "there"},`);
  lines.push("");
  lines.push(`I recently applied for the ${ctx.oppTitle} position at ${ctx.oppCompany}. I wanted to briefly introduce myself and reaffirm my strong interest.`);
  lines.push("");
  lines.push(`As ${ctx.candidateTitle}${ctx.score ? ` (${ctx.score}/100 role match)` : " with a proven track record"}, I'm genuinely excited about what ${ctx.oppCompany} is building.`);
  lines.push("");
  lines.push(`Would love to connect and discuss further.`);
  lines.push(`Best,`);
  lines.push(ctx.candidateName);
  return lines.join("\n");
}

// ─── Executive search firm follow-up EN ──────────────────

export function generateRelanceCabinet_EN(ctx: RelanceContext): string {
  const cabinet = ctx.cabinetName || "your firm";
  const lines: string[] = [];
  lines.push(`Subject: Application ${ctx.oppTitle} — ${ctx.candidateName}`);
  lines.push("");
  lines.push(`Hello,`);
  lines.push("");
  lines.push(`I'm following up on my application for the ${ctx.oppTitle} position${ctx.oppCompany ? ` at ${ctx.oppCompany}` : ""}, submitted through ${cabinet}.`);
  lines.push("");
  lines.push(`My profile as ${ctx.candidateTitle}${ctx.score ? ` (${ctx.score}/100 role match)` : ""} meets the key requirements. I am available for a detailed discussion with the consultant handling this search.`);
  lines.push("");
  lines.push(`Looking forward to hearing from you.`);
  lines.push(`Best regards,`);
  lines.push(ctx.candidateName);
  return lines.join("\n");
}

// ─── Post-interview thank-you EN ─────────────────────────

export function generateRemerciement_EN(ctx: RelanceContext): string {
  const recruiter = ctx.recruiterName || "Dear Hiring Manager";
  const lines: string[] = [];
  lines.push(`Subject: Thank you — ${ctx.oppTitle}`);
  lines.push("");
  lines.push(`${recruiter},`);
  lines.push("");
  lines.push(`Thank you for taking the time to interview me for the ${ctx.oppTitle} position at ${ctx.oppCompany}.`);
  lines.push("");
  lines.push(`Our conversation reinforced my enthusiasm for the role and my conviction that I can make a significant contribution, especially in driving commercial growth and team leadership.`);
  lines.push("");
  lines.push(`Please don't hesitate to reach out if you need any additional information.`);
  lines.push("");
  lines.push(`Best regards,`);
  lines.push(ctx.candidateName);
  return lines.join("\n");
}

// ─── Mapping ─────────────────────────────────────────────

const TEMPLATES: Record<RelanceTemplate, (ctx: RelanceContext) => string> = {
  j5_fr: generateRelanceJ5_FR,
  j10_fr: generateRelanceJ10_FR,
  linkedin_fr: generateRelanceLinkedIn_FR,
  cabinet_fr: generateRelanceCabinet_FR,
  remerciement_fr: generateRemerciement_FR,
  j5_en: generateRelanceJ5_EN,
  j10_en: generateRelanceJ10_EN,
  linkedin_en: generateRelanceLinkedIn_EN,
  cabinet_en: generateRelanceCabinet_EN,
  remerciement_en: generateRemerciement_EN,
};

export function getRelanceTemplate(type: RelanceTemplate): (ctx: RelanceContext) => string {
  return TEMPLATES[type];
}

export function getRelanceLabel(type: RelanceTemplate): string {
  const labels: Record<RelanceTemplate, string> = {
    j5_fr: "Relance email J+5 — FR", j10_fr: "Relance email J+10 — FR",
    linkedin_fr: "Relance LinkedIn — FR", cabinet_fr: "Relance cabinet — FR",
    remerciement_fr: "Remerciement entretien — FR",
    j5_en: "Follow-up J+5 — EN", j10_en: "Follow-up J+10 — EN",
    linkedin_en: "LinkedIn follow-up — EN", cabinet_en: "Follow-up search firm — EN",
    remerciement_en: "Post-interview thank-you — EN",
  };
  return labels[type];
}

export const RELANCE_TEMPLATE_LIST: { value: RelanceTemplate; label: string; group: string }[] = [
  { value: "j5_fr", label: "Relance J+5 email", group: "Email FR" },
  { value: "j10_fr", label: "Relance J+10 email", group: "Email FR" },
  { value: "linkedin_fr", label: "Relance LinkedIn", group: "LinkedIn FR" },
  { value: "cabinet_fr", label: "Relance cabinet", group: "Cabinet FR" },
  { value: "remerciement_fr", label: "Remerciement entretien", group: "Entretien FR" },
  { value: "j5_en", label: "Follow-up J+5 email", group: "Email EN" },
  { value: "j10_en", label: "Follow-up J+10 email", group: "Email EN" },
  { value: "linkedin_en", label: "LinkedIn follow-up", group: "LinkedIn EN" },
  { value: "cabinet_en", label: "Search firm follow-up", group: "Search Firm EN" },
  { value: "remerciement_en", label: "Post-interview thank-you", group: "Interview EN" },
];
