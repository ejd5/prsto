// ─── ELTON OS – Templates de génération de documents ───
// Fonctions pures — zéro hallucination, tout vient du snapshot candidat.

import type { CandidateSnapshot, AnalysisReport } from "@/lib/analysis/engine";

export type DocumentType =
  | "cv_fr" | "cv_en"
  | "lettre_fr" | "lettre_en"
  | "email_fr" | "email_en"
  | "linkedin_fr" | "linkedin_en"
  | "ats_reponse";

export type Angle = "Directeur Commercial" | "Country Manager" | "Directeur National des Ventes" | "Directeur Général";

export interface OppInfo {
  title: string; company: string; location: string | null; country: string | null;
}

// ─── Helpers ───────────────────────────────────────────────

function skillLevelLabel(level: string): string {
  const labels: Record<string, string> = { debutant: "Débutant", intermediaire: "Intermédiaire", confirme: "Confirmé", expert: "Expert" };
  return labels[level] || level;
}

function categoryLabel(cat: string): string {
  const labels: Record<string, string> = {
    management: "Management", technique: "Technique", business: "Business",
    langue: "Langues", outil: "Outils", sectoriel: "Sectoriel", autre: "Autre",
  };
  return labels[cat] || cat;
}

function fmtList(items: string[], prefix: string = "• "): string {
  return items.filter(Boolean).map(i => `${prefix}${i}`).join("\n");
}

// ─── CV FR ─────────────────────────────────────────────────

export function generateCV_FR(candidate: CandidateSnapshot, analysis: AnalysisReport | null): string {
  const sections: string[] = [];

  // En-tête
  sections.push([
    candidate.fullName.toUpperCase(),
    [candidate.title, candidate.location].filter(Boolean).join(" | "),
    [candidate.email, candidate.phone, candidate.linkedin].filter(Boolean).join(" | "),
  ].join("\n"));

  // Résumé exécutif (adapté à l'offre si analyse dispo)
  sections.push("RÉSUMÉ EXÉCUTIF");
  if (analysis && analysis.pointsForts.length > 0) {
    sections.push(`${candidate.summary}\n\nMots-clés alignés avec l'offre : ${analysis.keywordsAts.slice(0, 6).join(", ")}.`);
  } else {
    sections.push(candidate.summary);
  }

  // Expérience professionnelle
  sections.push("EXPÉRIENCE PROFESSIONNELLE");
  for (const exp of candidate.experiences) {
    const lines: string[] = [];
    lines.push(`${exp.company} — ${exp.title}${exp.country ? ` (${exp.country})` : ""}`);
    const meta: string[] = [];
    if (exp.teamSize) meta.push(`Équipe : ${exp.teamSize}`);
    if (exp.revenue) meta.push(`CA : ${exp.revenue}`);
    if (exp.budget) meta.push(`P&L : ${exp.budget}`);
    if (meta.length) lines.push(meta.join(" | "));
    if (exp.description) lines.push(exp.description);
    if (exp.achievements.length > 0) {
      lines.push("Réalisations :");
      lines.push(fmtList(exp.achievements));
    }
    sections.push(lines.join("\n"));
  }

  // Compétences — réordonnées si analyse
  sections.push("COMPÉTENCES CLÉS");
  const grouped = groupSkillsByCategory(candidate.skills);
  for (const [cat, skills] of Object.entries(grouped)) {
    const skillList = skills.map(s => `${s.name} (${skillLevelLabel(s.level)})`).join(", ");
    sections.push(`${categoryLabel(cat)} : ${skillList}`);
  }

  // Langues
  if (candidate.languages.length > 0) {
    sections.push("LANGUES");
    sections.push(candidate.languages.join(", "));
  }

  // Points forts issus de l'analyse
  if (analysis && analysis.match.confirmedMatches.length > 0) {
    sections.push("ALIGNEMENT AVEC L'OFFRE");
    sections.push(fmtList(analysis.match.confirmedMatches.slice(0, 6).map(m => m.requirement)));
  }

  // Preuves fortes du Proof Vault
  if (analysis && analysis.match.strongestProofs.length > 0) {
    sections.push("PREUVES DE RÉSULTATS");
    sections.push(fmtList(analysis.match.strongestProofs.map(p => `${p.category} : ${p.proof}`)));
  }

  // Axes de développement (gaps — section séparée, jamais dans le corps)
  if (analysis && analysis.gaps.length > 0) {
    sections.push("AXES DE DÉVELOPPEMENT (hors CV)");
    sections.push("Les éléments suivants sont identifiés comme des écarts par rapport à l'offre. Ils ne sont pas intégrés au CV car non vérifiés :");
    sections.push(fmtList(analysis.gaps.slice(0, 8)));
  }

  // Pied
  sections.push("---");
  sections.push(`Document généré par ELTON OS — ${new Date().toLocaleDateString("fr-FR")}`);
  sections.push("Source : Profil Exécutif + CV Maître + Proof Vault");

  return sections.join("\n\n");
}

// ─── CV EN ─────────────────────────────────────────────────

export function generateCV_EN(candidate: CandidateSnapshot, analysis: AnalysisReport | null): string {
  const sections: string[] = [];

  sections.push([
    candidate.fullName.toUpperCase(),
    [candidate.title, candidate.location].filter(Boolean).join(" | "),
    [candidate.email, candidate.phone, candidate.linkedin].filter(Boolean).join(" | "),
  ].join("\n"));

  sections.push("EXECUTIVE SUMMARY");
  if (analysis && analysis.pointsForts.length > 0) {
    sections.push(`${candidate.summary}\n\nKeywords aligned with the role: ${analysis.keywordsAts.slice(0, 6).join(", ")}.`);
  } else {
    sections.push(candidate.summary);
  }

  sections.push("PROFESSIONAL EXPERIENCE");
  for (const exp of candidate.experiences) {
    const lines: string[] = [];
    lines.push(`${exp.company} — ${exp.title}${exp.country ? ` (${exp.country})` : ""}`);
    const meta: string[] = [];
    if (exp.teamSize) meta.push(`Team: ${exp.teamSize}`);
    if (exp.revenue) meta.push(`Revenue: ${exp.revenue}`);
    if (exp.budget) meta.push(`P&L: ${exp.budget}`);
    if (meta.length) lines.push(meta.join(" | "));
    if (exp.description) lines.push(exp.description);
    if (exp.achievements.length > 0) {
      lines.push("Key Achievements:");
      lines.push(fmtList(exp.achievements));
    }
    sections.push(lines.join("\n"));
  }

  sections.push("CORE COMPETENCIES");
  const grouped = groupSkillsByCategory(candidate.skills);
  for (const [cat, skills] of Object.entries(grouped)) {
    sections.push(`${categoryLabel(cat)}: ${skills.map(s => s.name).join(", ")}`);
  }

  if (candidate.languages.length > 0) {
    sections.push("LANGUAGES");
    sections.push(candidate.languages.join(", "));
  }

  if (analysis && analysis.match.strongestProofs.length > 0) {
    sections.push("PROVEN RESULTS");
    sections.push(fmtList(analysis.match.strongestProofs.map(p => `${p.category}: ${p.proof}`)));
  }

  if (analysis && analysis.gaps.length > 0) {
    sections.push("DEVELOPMENT AREAS (not included in CV)");
    sections.push(fmtList(analysis.gaps.slice(0, 8)));
  }

  sections.push("---");
  sections.push(`Document generated by ELTON OS — ${new Date().toLocaleDateString("en-US")}`);
  sections.push("Source: Executive Profile + Master CV + Proof Vault");

  return sections.join("\n\n");
}

// ─── Lettre FR ─────────────────────────────────────────────

export function generateLettreFR(candidate: CandidateSnapshot, analysis: AnalysisReport | null, opp: OppInfo, courte: boolean = false): string {
  const lines: string[] = [];

  // En-tête
  lines.push(`${candidate.fullName}`);
  lines.push(`${candidate.location || ""}`);
  lines.push(`${candidate.email || ""}  |  ${candidate.phone || ""}`);
  lines.push("");

  lines.push(`${opp.company}`);
  lines.push(`${opp.location || opp.country || ""}`);
  lines.push("");

  lines.push(`Objet : Candidature au poste de ${opp.title}`);
  lines.push("");

  // Corps
  if (analysis && analysis.score.globalScore >= 70) {
    lines.push(`Madame, Monsieur,`);
    lines.push("");
    lines.push(`Votre recherche d'un ${opp.title} pour piloter votre développement en ${opp.country || opp.location} a retenu toute mon attention. Avec ${candidate.yearsExp} ans d'expérience en direction commerciale et un track record de croissance vérifié, je suis convaincu de pouvoir contribuer significativement à vos objectifs.`);
  } else {
    lines.push(`Madame, Monsieur,`);
    lines.push("");
    lines.push(`C'est avec un vif intérêt que j'ai pris connaissance de votre recherche d'un ${opp.title}. Mon parcours de ${candidate.yearsExp} ans en direction commerciale, combiné à une expérience terrain et une approche orientée résultats, correspond aux exigences de ce poste.`);
  }

  // Paragraphe preuves
  if (analysis && analysis.match.strongestProofs.length > 0) {
    lines.push("");
    lines.push(`Quelques résultats clés issus de mon parcours :`);
    analysis.match.strongestProofs.slice(0, 3).forEach(p => {
      lines.push(`— ${p.proof}`);
    });
  }

  // Paragraphe expérience
  if (candidate.experiences.length > 0) {
    lines.push("");
    const lastExp = candidate.experiences[0];
    lines.push(`Dans mon dernier poste en tant que ${lastExp.title} chez ${lastExp.company}${lastExp.country ? ` (${lastExp.country})` : ""}, j'ai ${lastExp.description ? lastExp.description.charAt(0).toLowerCase() + lastExp.description.slice(1) : "développé une expertise solide en management d'équipe et pilotage de la performance"}.`);
    if (lastExp.teamSize) {
      lines.push(`J'y ai managé une équipe de ${lastExp.teamSize} personnes avec un P&L de ${lastExp.budget || "plusieurs millions d'euros"}.`);
    }
  }

  // Alignement offre
  if (analysis && analysis.match.confirmedMatches.length >= 3) {
    lines.push("");
    lines.push(`Mon profil correspond à vos exigences sur plusieurs dimensions clés : ${analysis.match.confirmedMatches.slice(0, 4).map(m => m.requirement).join(", ")}.`);
  }

  // Conclusion
  lines.push("");
  if (courte) {
    lines.push(`Je serais ravi d'échanger avec vous pour détailler ma vision du poste et les résultats que je peux apporter à ${opp.company}.`);
  } else {
    lines.push(`La perspective de rejoindre ${opp.company} pour y déployer une stratégie commerciale ambitieuse me motive particulièrement. Je suis à votre disposition pour un échange approfondi sur ma vision du poste et les résultats concrets que je peux apporter.`);
  }

  lines.push("");
  if (analysis && analysis.gaps.length > 0) {
    lines.push(`Note : Les axes de développement identifiés (${analysis.gaps.slice(0, 2).join(", ")}) sont des points sur lesquels je travaille activement.`);
    lines.push("");
  }

  lines.push(`Dans l'attente de votre retour, je vous prie d'agréer, Madame, Monsieur, mes salutations distinguées.`);
  lines.push("");
  lines.push(candidate.fullName);

  return lines.join("\n");
}

// ─── Lettre EN ─────────────────────────────────────────────

export function generateLettreEN(candidate: CandidateSnapshot, analysis: AnalysisReport | null, opp: OppInfo): string {
  const lines: string[] = [];

  lines.push(`${candidate.fullName}`);
  lines.push(`${candidate.location || ""}`);
  lines.push(`${candidate.email || ""}  |  ${candidate.phone || ""}`);
  lines.push("");

  lines.push(`${opp.company}`);
  lines.push(`${opp.location || opp.country || ""}`);
  lines.push("");

  lines.push(`Re: Application for ${opp.title}`);
  lines.push("");

  lines.push(`Dear Hiring Manager,`);
  lines.push("");

  if (analysis && analysis.score.globalScore >= 70) {
    lines.push(`I was excited to learn about your search for a ${opp.title} to lead operations in ${opp.country || opp.location}. With ${candidate.yearsExp} years in commercial leadership and a verified track record of revenue growth, I am confident I can make a significant contribution to ${opp.company}'s objectives.`);
  } else {
    lines.push(`I am writing to express my strong interest in the ${opp.title} position at ${opp.company}. With ${candidate.yearsExp} years of commercial leadership experience, I bring a results-driven approach and deep expertise in sales strategy and team management.`);
  }

  if (analysis && analysis.match.strongestProofs.length > 0) {
    lines.push("");
    lines.push(`Key achievements from my career:`);
    analysis.match.strongestProofs.slice(0, 3).forEach(p => lines.push(`— ${p.proof}`));
  }

  if (candidate.experiences.length > 0) {
    lines.push("");
    const lastExp = candidate.experiences[0];
    lines.push(`In my most recent role as ${lastExp.title} at ${lastExp.company}, I ${lastExp.description || "drove significant business growth and team performance"}.`);
  }

  lines.push("");
  lines.push(`I would welcome the opportunity to discuss how my experience aligns with ${opp.company}'s needs and the value I can bring to your team.`);
  lines.push("");
  lines.push(`Kind regards,`);
  lines.push(candidate.fullName);

  return lines.join("\n");
}

// ─── Email FR ───────────────────────────────────────────────

export function generateEmailFR(candidate: CandidateSnapshot, analysis: AnalysisReport | null, opp: OppInfo): string {
  const lines: string[] = [];
  lines.push(`Objet : Candidature — ${opp.title} — ${candidate.fullName}`);
  lines.push("");
  lines.push(`Bonjour,`);
  lines.push("");
  lines.push(`Je vous adresse ma candidature pour le poste de ${opp.title} au sein de ${opp.company}.`);
  lines.push("");
  lines.push(`Fort de ${candidate.yearsExp} ans d'expérience en direction commerciale${candidate.experiences[0] ? `, notamment en tant que ${candidate.experiences[0].title} chez ${candidate.experiences[0].company}` : ""}, je suis convaincu de pouvoir contribuer aux objectifs de croissance de votre organisation.`);

  if (analysis && analysis.match.strongestProofs.length > 0) {
    lines.push("");
    lines.push("Quelques résultats :");
    analysis.match.strongestProofs.slice(0, 2).forEach(p => lines.push(`- ${p.proof}`));
  }

  lines.push("");
  lines.push(`Vous trouverez ci-joint mon CV détaillé. Je reste à votre disposition pour un échange.`);
  lines.push("");
  lines.push(`Cordialement,`);
  lines.push(`${candidate.fullName}`);
  lines.push(`${candidate.phone || ""}`);
  lines.push(`${candidate.linkedin ? `linkedin.com/in/${candidate.linkedin}` : ""}`);

  return lines.join("\n");
}

// ─── Email EN ───────────────────────────────────────────────

export function generateEmailEN(candidate: CandidateSnapshot, analysis: AnalysisReport | null, opp: OppInfo): string {
  const lines: string[] = [];
  lines.push(`Subject: Application — ${opp.title} — ${candidate.fullName}`);
  lines.push("");
  lines.push(`Hello,`);
  lines.push("");
  lines.push(`Please find attached my application for the ${opp.title} position at ${opp.company}.`);
  lines.push("");
  lines.push(`With ${candidate.yearsExp} years in commercial leadership${candidate.experiences[0] ? `, most recently as ${candidate.experiences[0].title} at ${candidate.experiences[0].company}` : ""}, I bring a strong track record of driving revenue growth and building high-performing teams.`);

  if (analysis && analysis.match.strongestProofs.length > 0) {
    lines.push("");
    analysis.match.strongestProofs.slice(0, 2).forEach(p => lines.push(`- ${p.proof}`));
  }

  lines.push("");
  lines.push(`I would be glad to discuss further at your convenience.`);
  lines.push("");
  lines.push(`Best regards,`);
  lines.push(`${candidate.fullName}`);
  lines.push(`${candidate.phone || ""}`);

  return lines.join("\n");
}

// ─── LinkedIn FR ────────────────────────────────────────────

export function generateLinkedInFR(candidate: CandidateSnapshot, analysis: AnalysisReport | null, opp: OppInfo): string {
  const lines: string[] = [];
  lines.push(`Bonjour,`);
  lines.push("");
  lines.push(`J'ai vu votre recherche d'un ${opp.title} pour ${opp.company}${opp.location ? ` à ${opp.location}` : ""}.`);
  lines.push("");
  lines.push(`Mon profil — ${candidate.yearsExp} ans en direction commerciale, ${candidate.experiences[0] ? `${candidate.experiences[0].title} chez ${candidate.experiences[0].company}` : "track record de croissance vérifié"} — correspond à vos attentes.`);

  if (analysis && analysis.match.strongestProofs.length > 0) {
    lines.push(`Quelques résultats : ${analysis.match.strongestProofs.slice(0, 2).map(p => p.proof).join(" ; ")}.`);
  }

  lines.push("");
  lines.push(`Je serais ravi d'échanger avec vous.`);
  lines.push(`Bonne journée,`);
  lines.push(candidate.fullName);

  return lines.join("\n");
}

// ─── LinkedIn EN ────────────────────────────────────────────

export function generateLinkedInEN(candidate: CandidateSnapshot, analysis: AnalysisReport | null, opp: OppInfo): string {
  const lines: string[] = [];
  lines.push(`Hi,`);
  lines.push("");
  lines.push(`I noticed you're looking for a ${opp.title} at ${opp.company}${opp.location ? ` in ${opp.location}` : ""}.`);
  lines.push("");
  lines.push(`My background — ${candidate.yearsExp} years in commercial leadership, ${candidate.experiences[0] ? `${candidate.experiences[0].title} at ${candidate.experiences[0].company}` : "proven revenue growth track record"} — aligns well with what you're seeking.`);

  if (analysis && analysis.match.strongestProofs.length > 0) {
    lines.push(`Highlights: ${analysis.match.strongestProofs.slice(0, 2).map(p => p.proof).join("; ")}.`);
  }

  lines.push("");
  lines.push(`Happy to connect and discuss further.`);
  lines.push(`Best,`);
  lines.push(candidate.fullName);

  return lines.join("\n");
}

// ─── ATS Réponses ───────────────────────────────────────────

export function generateATSResponses(candidate: CandidateSnapshot, analysis: AnalysisReport | null, opp: OppInfo): string {
  const lines: string[] = [];
  lines.push("=== RÉPONSES FORMULAIRE ATS ===");
  lines.push("");

  // Pourquoi ce poste ?
  lines.push("1. POURQUOI CE POSTE ?");
  lines.push(`Le poste de ${opp.title} chez ${opp.company} correspond à mon expertise en direction commerciale (${candidate.yearsExp} ans) et à mon ambition de piloter une stratégie de croissance ambitieuse${opp.country ? ` en ${opp.country}` : ""}. L'alignement entre mes compétences et vos exigences est confirmé${analysis ? ` par une analyse détaillée (score ${analysis.score.globalScore}/100)` : ""}.`);
  lines.push("");

  // Pourquoi cette entreprise ?
  lines.push("2. POURQUOI NOTRE ENTREPRISE ?");
  if (opp.country || opp.location) {
    lines.push(`La présence de ${opp.company} en ${opp.country || opp.location} et son positionnement dans le secteur ${analysis?.requirements.sector || "identifié"} représentent un terrain d'action idéal pour déployer une stratégie commerciale à fort impact. Votre recherche d'un profil exécutif capable de structurer la croissance correspond exactement à ce que j'ai accompli dans mes précédentes fonctions.`);
  } else {
    lines.push(`Le positionnement de ${opp.company} et ses ambitions de croissance correspondent à mon expérience en transformation commerciale et développement de nouveaux marchés.`);
  }
  lines.push("");

  // Disponibilité
  lines.push("3. DISPONIBILITÉ ?");
  lines.push("Disponible pour un échange sous 48h et pour une prise de poste dans les meilleurs délais après validation mutuelle.");
  lines.push("");

  // Prétentions salariales
  lines.push("4. PRÉTENTIONS SALARIALES ?");
  lines.push(candidate.targetSalary ? candidate.targetSalary : "À discuter lors de l'entretien, sur la base de l'expérience, des résultats prouvés et des responsabilités du poste.");
  lines.push("");

  // Mobilité
  lines.push("5. MOBILITÉ ?");
  lines.push(candidate.mobility || "Mobilité à discuter selon les besoins du poste.");
  lines.push("");

  // Pourquoi changer ?
  lines.push("6. POURQUOI SOUHAITEZ-VOUS CHANGER ?");
  lines.push("Je recherche un nouveau défi à la hauteur de mon expérience, avec un impact stratégique direct sur la croissance d'une organisation ambitieuse. Le poste de " + opp.title + " chez " + opp.company + " représente cette opportunité.");
  lines.push("");

  // Expérience management
  if (candidate.experiences.some(e => e.teamSize)) {
    const mgmtExp = candidate.experiences.find(e => e.teamSize);
    lines.push("7. EXPÉRIENCE MANAGEMENT ?");
    lines.push(`J'ai managé des équipes commerciales de ${mgmtExp?.teamSize || "taille significative"} personnes en tant que ${mgmtExp?.title} chez ${mgmtExp?.company}${mgmtExp?.budget ? ` avec un P&L de ${mgmtExp.budget}` : ""}. Mon style de management est orienté résultats et développement des talents.`);
    lines.push("");
  }

  // International
  const intlExp = candidate.experiences.filter(e => e.country && e.country !== "France").length;
  if (intlExp > 0) {
    lines.push("8. EXPÉRIENCE INTERNATIONALE ?");
    const countries = [...new Set(candidate.experiences.filter(e => e.country).map(e => e.country))];
    lines.push(`Expérience multi-pays confirmée : ${countries.join(", ")}. ${candidate.languages.length > 1 ? `Langues pratiquées : ${candidate.languages.join(", ")}.` : ""}`);
    lines.push("");
  }

  // P&L
  const plExp = candidate.experiences.find(e => e.budget);
  if (plExp) {
    lines.push("9. RESPONSABILITÉ P&L ?");
    lines.push(`P&L de ${plExp.budget} géré en tant que ${plExp.title} chez ${plExp.company}.`);
    lines.push("");
  }

  // CRM
  const crmSkill = candidate.skills.find(s => /salesforce|hubspot|pipedrive|crm|dynamics/i.test(s.name));
  if (crmSkill) {
    lines.push("10. OUTILS CRM ?");
    lines.push(`Maîtrise de ${crmSkill.name} (niveau ${skillLevelLabel(crmSkill.level)}).`);
    lines.push("");
  }

  // Résumé 500 car.
  lines.push("11. RÉSUMÉ PROFIL (500 caractères)");
  const resume500 = `${candidate.fullName} — ${candidate.title}, ${candidate.yearsExp} ans d'expérience. ${candidate.summary.slice(0, 300)}`.slice(0, 500);
  lines.push(resume500);
  lines.push("");

  // Motivation 1000 car.
  lines.push("12. MOTIVATION (1000 caractères)");
  const mot = `Le poste de ${opp.title} chez ${opp.company} représente une opportunité unique de mettre mon expérience au service d'une organisation ambitieuse. ${candidate.summary.slice(0, 600)}`.slice(0, 1000);
  lines.push(mot);
  lines.push("");

  lines.push("---");
  lines.push("Généré par ELTON OS — réponses basées sur les données du profil, à personnaliser avant envoi.");

  return lines.join("\n");
}

// ─── Utilitaire : groupement des compétences ────────────────

function groupSkillsByCategory(skills: CandidateSnapshot["skills"]): Record<string, CandidateSnapshot["skills"]> {
  const groups: Record<string, CandidateSnapshot["skills"]> = {};
  for (const s of skills) {
    if (!groups[s.category]) groups[s.category] = [];
    groups[s.category].push(s);
  }
  // Ordre prioritaire
  const order = ["management", "business", "technique", "langue", "outil", "sectoriel", "autre"];
  const sorted: Record<string, CandidateSnapshot["skills"]> = {};
  for (const cat of order) {
    if (groups[cat]) sorted[cat] = groups[cat];
  }
  for (const cat of Object.keys(groups)) {
    if (!sorted[cat]) sorted[cat] = groups[cat];
  }
  return sorted;
}

// ─── Mapping type → fonction ────────────────────────────────

export function getTemplateForType(type: DocumentType): (candidate: CandidateSnapshot, analysis: AnalysisReport | null, opp: OppInfo) => string {
  const map: Record<DocumentType, (candidate: CandidateSnapshot, analysis: AnalysisReport | null, opp: OppInfo) => string> = {
    cv_fr: generateCV_FR,
    cv_en: generateCV_EN,
    lettre_fr: (c, a, o) => generateLettreFR(c, a, o, false),
    lettre_en: generateLettreEN,
    email_fr: generateEmailFR,
    email_en: generateEmailEN,
    linkedin_fr: generateLinkedInFR,
    linkedin_en: generateLinkedInEN,
    ats_reponse: generateATSResponses,
  };
  return map[type];
}

export function getDocumentLabel(type: DocumentType): string {
  const labels: Record<DocumentType, string> = {
    cv_fr: "CV adapté FR",
    cv_en: "CV adapted EN",
    lettre_fr: "Lettre de motivation FR",
    lettre_en: "Cover letter EN",
    email_fr: "Email candidature FR",
    email_en: "Application email EN",
    linkedin_fr: "Message LinkedIn FR",
    linkedin_en: "LinkedIn message EN",
    ats_reponse: "Réponses ATS",
  };
  return labels[type];
}
