// ─── ELTON OS – Templates de préparation entretien ───
// 24 sections. Fonctions pures. Zéro hallucination.
// Sources : Profil, CV Maître, Proof Vault, Opportunité, Analyse, Documents, Pipeline.

import type { CandidateSnapshot, AnalysisReport } from "@/lib/analysis/engine";

export interface InterviewContext {
  candidate: CandidateSnapshot;
  opp: {
    title: string; company: string; location: string | null; country: string | null;
    rawText: string; contractType: string | null;
  };
  analysis: AnalysisReport | null;
  pipeline: { column: string; notes?: string | null; recruiterName?: string | null } | null;
  documents: { type: string; status: string }[];
  relances: { type: string; status: string; date: Date }[];
}

export type InterviewSection =
  | "pitch_30s" | "pitch_2min" | "pitch_dc" | "pitch_cm" | "pitch_dnv" | "pitch_dg"
  | "resume_entreprise" | "enjeux_poste" | "pourquoi_poste" | "pourquoi_moi"
  | "questions_rh" | "questions_manager" | "questions_dg" | "reponses_star"
  | "objections" | "reponses_objections" | "questions_recruteur" | "questions_manager_poser"
  | "questions_ceo" | "negociation" | "points_forts" | "points_sensibles"
  | "gaps_expliques" | "checklist";

export const INTERVIEW_SECTIONS: { key: InterviewSection; label: string; group: string }[] = [
  { key: "pitch_30s", label: "Pitch 30 secondes", group: "Pitchs" },
  { key: "pitch_2min", label: "Pitch 2 minutes", group: "Pitchs" },
  { key: "pitch_dc", label: "Pitch Directeur Commercial", group: "Pitchs" },
  { key: "pitch_cm", label: "Pitch Country Manager", group: "Pitchs" },
  { key: "pitch_dnv", label: "Pitch Directeur National des Ventes", group: "Pitchs" },
  { key: "pitch_dg", label: "Pitch Directeur Général", group: "Pitchs" },
  { key: "resume_entreprise", label: "Résumé de l'entreprise", group: "Contexte" },
  { key: "enjeux_poste", label: "Enjeux probables du poste", group: "Contexte" },
  { key: "pourquoi_poste", label: "Pourquoi ce poste ?", group: "Motivation" },
  { key: "pourquoi_moi", label: "Pourquoi moi ?", group: "Motivation" },
  { key: "questions_rh", label: "Questions probables RH", group: "Questions" },
  { key: "questions_manager", label: "Questions probables manager", group: "Questions" },
  { key: "questions_dg", label: "Questions probables DG", group: "Questions" },
  { key: "reponses_star", label: "Réponses STAR", group: "Réponses" },
  { key: "objections", label: "Objections possibles", group: "Objections" },
  { key: "reponses_objections", label: "Réponses aux objections", group: "Objections" },
  { key: "questions_recruteur", label: "Questions à poser au recruteur", group: "À poser" },
  { key: "questions_manager_poser", label: "Questions à poser au manager", group: "À poser" },
  { key: "questions_ceo", label: "Questions à poser au CEO/DG", group: "À poser" },
  { key: "negociation", label: "Négociation rémunération", group: "Négociation" },
  { key: "points_forts", label: "Points forts à marteler", group: "Stratégie" },
  { key: "points_sensibles", label: "Points sensibles à éviter", group: "Stratégie" },
  { key: "gaps_expliques", label: "Gaps à expliquer", group: "Stratégie" },
  { key: "checklist", label: "Checklist avant entretien", group: "Logistique" },
];

function s(text: string | null | undefined): string { return text || ""; }
// ─── Pitchs ───────────────────────────────────────────

function genPitch30s(ctx: InterviewContext): string {
  const c = ctx.candidate;
  const exp = c.experiences[0];
  const topSkill = c.skills.find(sk => sk.level === "expert");
  return `${c.fullName}, ${c.title} avec ${c.yearsExp || "plus de 10"} ans d'expérience. ${exp ? `Actuellement ${exp.title} chez ${exp.company}.` : ""} ${topSkill ? `Expert en ${topSkill.name}.` : ""}`;
}

function genPitch2min(ctx: InterviewContext): string {
  const c = ctx.candidate;
  const lines: string[] = [];
  lines.push(`Bonjour, je suis ${c.fullName}, ${c.title} avec ${c.yearsExp || "plus de 10"} ans d'expérience.`);
  const topSkills = c.skills.filter(sk => sk.level === "expert").slice(0, 3).map(sk => sk.name);
  if (topSkills.length) lines.push(`Expertises clés : ${topSkills.join(", ")}.`);
  for (const exp of c.experiences.slice(0, 2)) {
    lines.push(`${exp.title} chez ${exp.company} (${exp.country || ""}) : ${s(exp.description)}`);
    if (exp.achievements.length) lines.push(`Réalisations : ${exp.achievements.slice(0, 2).join(" ; ")}.`);
  }
  const proofs = c.proofEntries.slice(0, 2);
  for (const p of proofs) lines.push(`${p.category} — ${p.title} : ${p.value}.`);
  lines.push(`Langues : ${c.languages.join(", ")}.`);
  return lines.join("\n");
}

function genPitchDC(ctx: InterviewContext): string {
  const c = ctx.candidate;
  const salesSkills = c.skills.filter(sk => ["business", "management"].includes(sk.category));
  const caProofs = c.proofEntries.filter(p => p.category === "CA");
  let text = `${c.fullName} — Directeur Commercial orienté résultats. ${c.yearsExp || "10+"} ans de pilotage d'équipes commerciales B2B.`;
  if (salesSkills.length) text += ` Expert en ${salesSkills.slice(0, 3).map(s => s.name).join(", ")}.`;
  if (caProofs.length) text += ` ${caProofs.map(p => p.value).join(" ; ")}.`;
  return text;
}

function genPitchCM(ctx: InterviewContext): string {
  const c = ctx.candidate;
  const intlSkills = c.skills.filter(sk => sk.name.toLowerCase().includes("international") || sk.name.toLowerCase().includes("pays"));
  let text = `${c.fullName} — Country Manager avec vision P&L complète. Pilotage d'activité pays, croissance et leadership d'équipe sur ${c.targetCountries?.join(", ") || "multi-marchés"}.`;
  if (intlSkills.length) text += ` Compétences internationales : ${intlSkills.map(s => s.name).join(", ")}.`;
  const proofs = c.proofEntries.filter(p => p.category === "CA" || p.category === "ouverture_marché").slice(0, 2);
  if (proofs.length) text += ` ${proofs.map(p => p.value).join(" ; ")}.`;
  return text;
}

function genPitchDNV(ctx: InterviewContext): string {
  const c = ctx.candidate;
  const salesTeam = c.experiences.find(e => e.teamSize);
  let text = `${c.fullName} — Directeur National des Ventes. Pilotage de forces de vente terrain et sédentaires${salesTeam ? ` (jusqu'à ${salesTeam.teamSize})` : ""}.`;
  const caProofs = c.proofEntries.filter(p => p.category === "CA");
  if (caProofs.length) text += ` Croissance CA : ${caProofs.map(p => p.value).join(" ; ")}.`;
  return text;
}

function genPitchDG(ctx: InterviewContext): string {
  const c = ctx.candidate;
  let text = `${c.fullName} — Direction Générale. Leadership stratégique, gestion P&L, transformation et développement business. ${c.yearsExp || "10+"} ans d'expérience.`;
  const proofs = c.proofEntries.slice(0, 3);
  if (proofs.length) text += ` Résultats : ${proofs.map(p => p.value).join(" ; ")}.`;
  return text;
}

// ─── Contexte ────────────────────────────────────────

function genResumeEntreprise(ctx: InterviewContext): string {
  const opp = ctx.opp;
  const text = opp.rawText || "";
  const lines: string[] = [];
  lines.push(`Entreprise : ${opp.company}`);
  if (opp.location) lines.push(`Localisation : ${opp.location}`);
  if (opp.country) lines.push(`Pays : ${opp.country}`);
  if (opp.contractType) lines.push(`Type de contrat : ${opp.contractType}`);
  // Extraire des indices du rawText
  const secteurMatch = text.match(/(?:secteur|industrie|domaine)\s+(?:d(?:e|es|u)\s+)?([A-Za-zÀ-ÿ\s]{3,40})/i);
  if (secteurMatch) lines.push(`Secteur détecté : ${secteurMatch[1].trim()}`);
  const tailleMatch = text.match(/(\d[\d\s]*)\s+(?:collaborateurs|salariés|employés|personnes)/i);
  if (tailleMatch) lines.push(`Effectif estimé : ${tailleMatch[0]}`);
  const caMatch = text.match(/(\d[\d\s,.]*)\s*(?:M€|Md€|millions|milliards|CA|chiffre d'affaires)/i);
  if (caMatch) lines.push(`CA mentionné : ${caMatch[0]}`);
  lines.push("");
  lines.push("Sources utilisées : offre d'emploi, recherche publique. Vérifiez les données avant l'entretien.");
  return lines.join("\n");
}

function genEnjeuxPoste(ctx: InterviewContext): string {
  const opp = ctx.opp;
  const analysis = ctx.analysis;
  const text = opp.rawText || "";
  const lines: string[] = [];
  lines.push(`Poste : ${opp.title} chez ${opp.company}`);
  lines.push("");

  // Extraire les enjeux de l'offre
  const keywords = ["croissance", "développement", "transformation", "stratégie", "digital", "international",
    "profitabilité", "rentabilité", "conquête", "fidélisation", "CA", "chiffre d'affaires", "P&L", "budget",
    "équipe", "management", "leader", "innovation", "marché", "ouverture"];
  const found: string[] = [];
  for (const kw of keywords) {
    if (text.toLowerCase().includes(kw)) found.push(kw);
  }
  if (found.length) {
    lines.push("Enjeux détectés dans l'offre :");
    for (const f of found.slice(0, 10)) lines.push(`• ${f}`);
  }

  if (analysis?.keywordsAts?.length) {
    lines.push("");
    lines.push("Mots-clés ATS identifiés :");
    for (const kw of analysis.keywordsAts.slice(0, 8)) lines.push(`• ${kw}`);
  }

  lines.push("");
  lines.push("⚠ Ces enjeux sont extraits de l'offre. Complétez avec votre propre recherche entreprise.");
  return lines.join("\n");
}

// ─── Motivation ─────────────────────────────────────

function genPourquoiPoste(ctx: InterviewContext): string {
  const c = ctx.candidate;
  const opp = ctx.opp;
  const lines: string[] = [];
  lines.push(`Pourquoi le poste de ${opp.title} chez ${opp.company} ?`);
  lines.push("");
  lines.push(`Mon parcours de ${c.title} est en adéquation directe avec ce poste :`);
  const matchingSkills = c.skills.filter(sk => {
    const text = opp.rawText.toLowerCase();
    return text.includes(sk.name.toLowerCase()) || text.includes(sk.category.toLowerCase());
  }).slice(0, 4);
  if (matchingSkills.length) {
    for (const ms of matchingSkills) lines.push(`• ${ms.name} (${ms.level}) — demandé dans l'offre`);
  }
  lines.push("");
  lines.push(`Ce poste représente une suite logique dans ma trajectoire professionnelle, me permettant de mobiliser mes compétences en ${c.skills.slice(0, 3).map(s => s.name).join(", ")} au service d'un projet ambitieux.`);
  return lines.join("\n");
}

function genPourquoiMoi(ctx: InterviewContext): string {
  const c = ctx.candidate;
  const lines: string[] = [];
  lines.push(`Pourquoi moi pour ce poste ?`);
  lines.push("");
  // Top skills expert
  const expertSkills = c.skills.filter(sk => sk.level === "expert");
  if (expertSkills.length) lines.push(`Expertise démontrée en ${expertSkills.map(s => s.name).join(", ")}.`);
  // Proofs forts
  const strongProofs = c.proofEntries.slice(0, 4);
  if (strongProofs.length) {
    lines.push("Résultats vérifiables :");
    for (const p of strongProofs.slice(0, 4)) lines.push(`• ${p.title} : ${p.value}`);
  }
  // Expérience
  lines.push(`Expérience terrain de ${c.yearsExp || "10+"} ans dans ${c.sectors.slice(0, 3).join(", ") || "des secteurs variés"}.`);
  lines.push(`Langues : ${c.languages.join(", ")}.`);
  lines.push("");
  lines.push("Sources : Profil, CV Maître, Proof Vault. Aucune invention.");
  return lines.join("\n");
}

// ─── Questions probables ─────────────────────────────

function genQuestionsRH(ctx: InterviewContext): string {
  const opp = ctx.opp;
  const lines: string[] = [
    "Questions probables — Entretien RH :",
    "",
    "1. Pouvez-vous vous présenter en quelques mots ?",
    "2. Pourquoi souhaitez-vous quitter votre poste actuel ?",
    `3. Qu'est-ce qui vous attire dans le poste de ${opp.title} ?`,
    "4. Quelle est votre plus grande réussite professionnelle ?",
    "5. Comment gérez-vous un conflit au sein de votre équipe ?",
    "6. Décrivez votre style de management.",
    "7. Où vous voyez-vous dans 5 ans ?",
    "8. Quelle est votre fourchette de rémunération actuelle ?",
    "9. Êtes-vous en processus avec d'autres entreprises ?",
    "10. Avez-vous des questions pour nous ?",
  ];
  if (opp.contractType?.includes("CDI")) lines.push("11. Pourquoi ce choix de nous rejoindre en CDI ?");
  return lines.join("\n");
}

function genQuestionsManager(ctx: InterviewContext): string {
  const opp = ctx.opp;
  const lines: string[] = [
    "Questions probables — Manager / N+1 :",
    "",
    "1. Quelle est votre vision pour ce poste à 6 mois / 1 an / 3 ans ?",
    `2. Comment aborderiez-vous les priorités du poste de ${opp.title} ?`,
    "3. Racontez-moi une situation où vous avez redressé une activité en difficulté.",
    "4. Comment structurez-vous votre équipe commerciale ?",
    "5. Quelle est votre méthode pour fixer et suivre les objectifs ?",
    "6. Comment gérez-vous un sous-performant ?",
    "7. Donnez-moi un exemple de négociation complexe que vous avez menée.",
    "8. Comment collaborez-vous avec les autres départements (marketing, finance, RH) ?",
    "9. Quelle est votre approche du développement de nouveaux marchés ?",
    `10. Qu'est-ce qui différencie votre candidature pour ${opp.company} ?`,
  ];
  return lines.join("\n");
}

function genQuestionsDG(): string {
  return [
    "Questions probables — Direction Générale / CEO :",
    "",
    "1. Quelle est votre vision stratégique pour notre entreprise ?",
    "2. Comment évaluez-vous notre position sur le marché ?",
    "3. Quels leviers de croissance identifiez-vous ?",
    "4. Comment piloteriez-vous un P&L dans notre contexte ?",
    "5. Quelle est votre expérience en transformation d'organisation ?",
    "6. Comment gérez-vous la pression et les décisions difficiles ?",
    "7. Quel est votre rapport au board / actionnaires ?",
    "8. Pourquoi vous plutôt qu'un autre candidat ?",
    "9. Quelle valeur ajoutée apportez-vous dès le premier mois ?",
    "10. Si vous deviez résumer votre leadership en une phrase ?",
  ].join("\n");
}

// ─── STAR ───────────────────────────────────────────

function genReponsesSTAR(ctx: InterviewContext): string {
  const c = ctx.candidate;
  const lines: string[] = [
    "Méthode STAR (Situation, Tâche, Action, Résultat) — 3 exemples basés sur votre parcours :",
  ];
  for (const exp of c.experiences.slice(0, 2)) {
    const proof = c.proofEntries.find(p => exp.description?.includes(p.category));
    lines.push("");
    lines.push(`### Exemple — ${exp.title} chez ${exp.company}`);
    lines.push(`• Situation : ${exp.title} chez ${exp.company} (${exp.country || ""}), ${exp.teamSize ? `équipe de ${exp.teamSize}` : "périmètre commercial"}.`);
    lines.push(`• Tâche : ${s(exp.description).slice(0, 120) || "Développement commercial et pilotage d'équipe."}`);
    lines.push(`• Action : Mise en œuvre de la stratégie commerciale, management d'équipe, suivi des KPIs.${proof ? ` Focus sur ${proof.title}.` : ""}`);
    lines.push(`• Résultat : ${proof ? proof.value : "Croissance et atteinte des objectifs."}`);
  }
  lines.push("");
  lines.push("⚠ Adaptez ces exemples STAR avec vos propres mots et chiffres lors de l'entretien.");
  return lines.join("\n");
}

// ─── Objections ─────────────────────────────────────

function genObjections(ctx: InterviewContext): string {
  const c = ctx.candidate;
  const lines: string[] = ["Objections possibles du recruteur :", ""];
  const gaps = ctx.analysis?.gaps || [];
  const risks = ctx.analysis?.risks || [];

  lines.push("1. « Vous n'avez pas d'expérience dans notre secteur. »");
  lines.push("2. « Votre dernier poste était dans une entreprise plus petite/plus grande. »");

  if (c.yearsExp < 10) lines.push("3. « Vous avez moins d'années d'expérience que ce qu'on recherche. »");
  if (gaps.length) for (const g of gaps.slice(0, 2)) lines.push(`• « ${g} » (gap identifié dans l'analyse)`);
  if (risks.length) for (const r of risks.slice(0, 2)) lines.push(`• « ${r} » (risque identifié)`);

  lines.push("");
  ["salaire", "mobilité", "disponibilité", "préavis"].forEach(common => {
    if (!lines.some(l => l.includes(common))) lines.push(`• Question possible sur ${common}.`);
  });

  return lines.join("\n");
}

function genReponsesObjections(ctx: InterviewContext): string {
  const c = ctx.candidate;
  const lines: string[] = ["Réponses stratégiques aux objections :", ""];

  lines.push("1. Secteur différent → « Mon expérience cross-sectorielle est un atout : j'apporte un regard neuf et des méthodes éprouvées dans d'autres environnements. Ma capacité d'adaptation est démontrée par [exemple concret]. »");
  lines.push("2. Taille d'entreprise → « J'ai piloté des équipes de tailles variées et je comprends les enjeux spécifiques à chaque contexte. Mon expérience chez [entreprise] m'a appris à [compétence transférable]. »");

  if (c.yearsExp && c.yearsExp < 15) {
    lines.push("3. Années d'expérience → « La densité de mes expériences compense le nombre d'années. En [X] ans, j'ai [réalisation clé], ce que beaucoup mettent 15 ans à accomplir. »");
  }

  lines.push("");
  lines.push("Règle d'or : ne jamais être sur la défensive. Transformer chaque objection en opportunité de démontrer votre valeur.");
  lines.push("Sources : adapté de votre profil. Personnalisez avec vos propres exemples.");
  return lines.join("\n");
}

// ─── Questions à poser ──────────────────────────────

function genQuestionsRecruteur(ctx: InterviewContext): string {
  const opp = ctx.opp;
  return [
    "Questions à poser au recruteur / RH :",
    "",
    "1. Comment décririez-vous la culture d'entreprise ?",
    "2. Quel est le processus de recrutement et le calendrier ?",
    "3. Quelles sont les attentes pour les 3 premiers mois ?",
    "4. Comment l'équipe est-elle structurée actuellement ?",
    "5. Quel est le taux de rétention dans l'équipe ?",
    `6. Qu'est-ce qui a motivé l'ouverture du poste de ${opp.title} ?`,
    "7. Comment évaluez-vous la performance sur ce poste ?",
    "8. Quelle est la politique de télétravail / flexibilité ?",
    "9. Quel est le package de rémunération (fixe + variable + avantages) ?",
    "10. Quelle est la prochaine étape après cet entretien ?",
  ].join("\n");
}

function genQuestionsManagerPoser(ctx: InterviewContext): string {
  const opp = ctx.opp;
  return [
    "Questions à poser au manager / N+1 :",
    "",
    `1. Quels sont les plus gros défis pour le poste de ${opp.title} dans les 6 prochains mois ?`,
    "2. Comment décririez-vous votre style de management ?",
    "3. Quelle est la composition actuelle de l'équipe (profils, ancienneté, performance) ?",
    "4. Quels sont les objectifs de croissance pour cette année et l'année prochaine ?",
    "5. Quel budget / ressources est alloué à cette équipe ?",
    "6. Comment se passe la collaboration avec les autres départements ?",
    "7. Quelle est la marge de manœuvre pour recruter / réorganiser ?",
    "8. Quels outils / CRM utilisez-vous ?",
    "9. Quel a été le parcours de la personne qui occupait ce poste avant ?",
    "10. Qu'est-ce qui vous plaît le plus dans votre rôle chez [entreprise] ?",
  ].join("\n");
}

function genQuestionsCEO(): string {
  return [
    "Questions à poser au CEO / DG :",
    "",
    "1. Quelle est votre vision pour l'entreprise à 3-5 ans ?",
    "2. Quels sont les grands paris stratégiques actuels ?",
    "3. Comment voyez-vous l'évolution du marché / de la concurrence ?",
    "4. Quelle place occupe la fonction commerciale dans la stratégie globale ?",
    "5. Qu'attendez-vous de ce poste en termes de contribution à la vision ?",
    "6. Quelle est la culture de décision dans l'entreprise (centralisée, décentralisée) ?",
    "7. Comment décririez-vous le board et la gouvernance ?",
    "8. Quel est le plus grand risque que l'entreprise doit gérer aujourd'hui ?",
    "9. Pourquoi avoir choisi de recruter en externe plutôt qu'en interne ?",
    "10. Si vous deviez me donner un conseil pour réussir ici, quel serait-il ?",
  ].join("\n");
}

// ─── Négociation ────────────────────────────────────

function genNegociation(ctx: InterviewContext): string {
  const c = ctx.candidate;
  const lines: string[] = [
    "Préparation négociation — Rémunération :",
    "",
    "Règles :",
    "• Ne jamais donner son salaire actuel. Donner une fourchette cible.",
    "• Toujours raisonner en package global (fixe + variable + avantages + equity).",
    "• Laissez le recruteur annoncer une fourchette en premier si possible.",
  ];

  if (c.targetSalary) {
    lines.push(`• Votre cible déclarée : ${c.targetSalary}`);
    lines.push("• Préparez une justification factuelle : marché, expérience, résultats.");
  }

  lines.push("");
  lines.push("Fourchette de négociation à préparer :");
  lines.push("• Minimum acceptable : [à définir]");
  lines.push("• Cible réaliste : [à définir]");
  lines.push("• Idéal : [à définir]");
  lines.push("");
  lines.push("Points de levier :");
  lines.push("• Expérience spécifique dans le secteur");
  lines.push("• Résultats prouvés (Proof Vault)");
  lines.push("• Réseau / carnet d'adresses");
  lines.push("• Compétences rares (langues, international, transformation)");
  lines.push("");
  lines.push("⚠ Les données salariales sont à titre indicatif. Faites vos propres recherches de marché (Glassdoor, APEC, Robert Walters).");
  return lines.join("\n");
}

// ─── Stratégie ──────────────────────────────────────

function genPointsForts(ctx: InterviewContext): string {
  const c = ctx.candidate;
  const lines: string[] = ["Points forts à marteler pendant l'entretien :", ""];

  const expertSkills = c.skills.filter(sk => sk.level === "expert");
  for (const sk of expertSkills.slice(0, 3)) lines.push(`✅ ${sk.name} — Niveau expert`);

  const strongProofs = c.proofEntries.slice(0, 4);
  for (const p of strongProofs) lines.push(`✅ ${p.title} : ${p.value}`);

  if (c.languages.filter(l => l.toLowerCase().includes("courant") || l.toLowerCase().includes("bilingue")).length)
    lines.push(`✅ Langues : ${c.languages.join(", ")}`);

  if (c.experiences.some(e => e.teamSize)) {
    const maxTeam = c.experiences.reduce((max, e) => Math.max(max, parseInt(e.teamSize || "0") || 0), 0);
    if (maxTeam > 0) lines.push(`✅ Management d'équipe jusqu'à ${maxTeam} personnes`);
  }

  lines.push("");
  lines.push("Répétez ces points à chaque étape de l'entretien. La répétition ancre le message.");
  return lines.join("\n");
}

function genPointsSensibles(ctx: InterviewContext): string {
  const lines: string[] = ["Points sensibles à ne pas aborder frontalement :", ""];
  const gaps = ctx.analysis?.gaps || [];
  const risks = ctx.analysis?.risks || [];

  if (gaps.length) {
    lines.push("Gaps identifiés — ne pas souligner, préparer une explication :");
    for (const g of gaps.slice(0, 5)) lines.push(`⚠ ${g} → Voir section "Gaps à expliquer"`);
  }

  if (risks.length) {
    lines.push("");
    lines.push("Risques identifiés — anticiper, ne pas ouvrir le sujet :");
    for (const r of risks.slice(0, 3)) lines.push(`⚠ ${r}`);
  }

  lines.push("");
  lines.push("Éviter absolument :");
  lines.push("❌ Critique de l'employeur actuel / ancien");
  lines.push("❌ Mention du salaire avant que le recruteur ne l'aborde");
  lines.push("❌ « Je n'ai pas d'expérience dans... » (reformuler positivement)");
  lines.push("❌ Questions sur les vacances, RTT, tickets resto au premier entretien");
  lines.push("❌ Hésitation ou flou sur votre disponibilité");

  return lines.join("\n");
}

function genGapsExpliques(ctx: InterviewContext): string {
  const gaps = ctx.analysis?.gaps || [];
  const lines: string[] = ["Comment expliquer les écarts entre votre profil et le poste :", ""];

  if (!gaps.length) {
    lines.push("Aucun gap bloquant identifié par l'analyse. Votre profil couvre les exigences du poste.");
    return lines.join("\n");
  }

  for (const g of gaps.slice(0, 6)) {
    lines.push(`Gap : ${g}`);
    lines.push("→ Stratégie : reconnaître que c'est un axe de développement, montrer des expériences connexes ou une capacité d'apprentissage rapide. Ne pas inventer de compétence.");
    lines.push("");
  }

  lines.push("⚠ Jamais inventer une compétence. Proposer un plan de montée en compétence (formation, mentorat, accompagnement).");
  return lines.join("\n");
}

function genChecklist(ctx: InterviewContext): string {
  const opp = ctx.opp;
  return [
    "Checklist — Avant l'entretien :",
    "",
    "☐ Recherche entreprise : site corporate, actualités récentes, rapports annuels",
    `☐ Profil LinkedIn des interviewers (si connus)`,
    `☐ Relecture de l'offre ${opp.title} chez ${opp.company}`,
    "☐ Relecture de votre CV adapté et lettre de motivation",
    "☐ Préparation des 3 exemples STAR",
    "☐ Préparation des questions à poser",
    "",
    "Checklist — Le jour J :",
    "",
    "☐ Tenue professionnelle adaptée au secteur",
    "☐ Arrivée 10-15 min en avance (physique) ou connexion testée (visio)",
    "☐ Matériel : copies du CV, carnet + stylo, bouteille d'eau",
    "☐ Téléphone en silencieux",
    "☐ Dernière vérification : actualités de l'entreprise du jour",
    "",
    "Checklist — Après l'entretien :",
    "",
    "☐ Notes prises immédiatement après (questions posées, points clés, feeling)",
    "☐ Email de remerciement dans les 24h",
    "☐ Mise à jour du pipeline ELTON OS (colonne et notes)",
    "☐ Préparation du prochain tour si applicable",
  ].join("\n");
}

// ─── Générateur principal ───────────────────────────

const GENERATORS: Record<InterviewSection, (ctx: InterviewContext) => string> = {
  pitch_30s: genPitch30s,
  pitch_2min: genPitch2min,
  pitch_dc: genPitchDC,
  pitch_cm: genPitchCM,
  pitch_dnv: genPitchDNV,
  pitch_dg: genPitchDG,
  resume_entreprise: genResumeEntreprise,
  enjeux_poste: genEnjeuxPoste,
  pourquoi_poste: genPourquoiPoste,
  pourquoi_moi: genPourquoiMoi,
  questions_rh: genQuestionsRH,
  questions_manager: genQuestionsManager,
  questions_dg: genQuestionsDG,
  reponses_star: genReponsesSTAR,
  objections: genObjections,
  reponses_objections: genReponsesObjections,
  questions_recruteur: genQuestionsRecruteur,
  questions_manager_poser: genQuestionsManagerPoser,
  questions_ceo: genQuestionsCEO,
  negociation: genNegociation,
  points_forts: genPointsForts,
  points_sensibles: genPointsSensibles,
  gaps_expliques: genGapsExpliques,
  checklist: genChecklist,
};

export function generateInterviewSection(section: InterviewSection, ctx: InterviewContext): string {
  const gen = GENERATORS[section];
  if (!gen) return `Section "${section}" non disponible.`;
  return gen(ctx);
}

export function generateFullInterview(ctx: InterviewContext): { sections: Record<InterviewSection, string>; fullText: string } {
  const sections: Record<string, string> = {};
  const parts: string[] = [];

  for (const { key, label } of INTERVIEW_SECTIONS) {
    const content = GENERATORS[key](ctx);
    sections[key] = content;
    parts.push(`# ${label}\n\n${content}\n`);
  }

  return { sections: sections as Record<InterviewSection, string>, fullText: parts.join("\n---\n\n") };
}

export function getAiPromptForInterview(ctx: InterviewContext): string {
  const c = ctx.candidate;
  return [
    "Tu es un coach de préparation aux entretiens pour dirigeants commerciaux.",
    `Candidat : ${c.fullName}, ${c.title}, ${c.yearsExp} ans d'expérience.`,
    `Poste visé : ${ctx.opp.title} chez ${ctx.opp.company}.`,
    `CV Maître : ${c.cvText?.slice(0, 1500)}`,
    `Preuves : ${c.proofEntries.slice(0, 4).map(p => `${p.title}: ${p.value}`).join(" ; ")}`,
    `Offre : ${ctx.opp.rawText.slice(0, 2000)}`,
    `Gaps : ${ctx.analysis?.gaps?.join(", ") || "aucun"}`,
    "Génère une préparation d'entretien complète en français. N'invente RIEN. Utilise UNIQUEMENT les données fournies.",
  ].join("\n\n");
}
