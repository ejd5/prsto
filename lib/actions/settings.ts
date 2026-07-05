"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { testDeepSeekConnection, type ConnectionTestResult } from "@/lib/ai/deepseek";
import { getPremiumPrompts } from "@/lib/ai/prompts";
import { encryptSecret, decryptSecret } from "@/lib/security/secrets";

// ─── Settings ───────────────────────────────────

export async function getSettings() {
  const settings = await prisma.setting.findUnique({ where: { id: "elton-os-settings" } });
  if (!settings) return null;
  // Transparent decrypt for API key so existing consumers work unchanged
  if (settings.apiKey) {
    return { ...settings, apiKey: decryptSecret(settings.apiKey) };
  }
  return settings;
}

export async function updateSettings(data: {
  aiProvider?: string;
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: string;
  proModel?: string;
  timeout?: number;
  temperature?: number;
  confidentialityMode?: string;
  anonymizeName?: boolean;
  anonymizeEmail?: boolean;
  anonymizePhone?: boolean;
  anonymizeCompanies?: boolean;
  anonymizeSalary?: boolean;
  localFallbackEnabled?: boolean;
  autoExport?: boolean;
}) {
  // Encrypt API key before storing (only if it looks like a real key)
  const encryptedData = { ...data };
  if (encryptedData.apiKey && encryptedData.apiKey.length > 10 && !encryptedData.apiKey.startsWith("•••")) {
    encryptedData.apiKey = encryptSecret(encryptedData.apiKey);
  } else if (encryptedData.apiKey === "") {
    encryptedData.apiKey = null as unknown as undefined;
  }
  const settings = await prisma.setting.upsert({
    where: { id: "elton-os-settings" },
    update: encryptedData,
    create: { id: "elton-os-settings", ...encryptedData },
  });

  // Ne jamais renvoyer la clé API en clair
  const { apiKey, ...safe } = settings;
  revalidatePath("/parametres");
  return { ...safe, hasApiKey: !!apiKey };
}

// ─── AI Prompts ─────────────────────────────────

export async function getAIPrompts() {
  return prisma.aIPrompt.findMany({ orderBy: { name: "asc" } });
}

export async function getAIPrompt(name: string) {
  return prisma.aIPrompt.findUnique({ where: { name } });
}

export async function upsertAIPrompt(data: {
  name: string;
  label: string;
  description?: string;
  systemPrompt?: string;
  content: string;
  variables?: string;
  preferredModel?: string;
  temperature?: number;
  outputSchema?: string;
  active?: boolean;
}) {
  const prompt = await prisma.aIPrompt.upsert({
    where: { name: data.name },
    update: { ...data, name: undefined },
    create: data,
  });
  revalidatePath("/parametres");
  return prompt;
}

export async function togglePromptActive(name: string, active: boolean) {
  const prompt = await prisma.aIPrompt.update({
    where: { name },
    data: { active },
  });
  revalidatePath("/parametres");
  return prompt;
}

export async function resetPromptToDefault(name: string) {
  const defaults = getDefaultPrompts();
  const def = defaults.find(p => p.name === name);
  if (!def) throw new Error("Prompt par défaut introuvable");

  const prompt = await prisma.aIPrompt.upsert({
    where: { name },
    update: { ...def, name: undefined },
    create: def,
  });
  revalidatePath("/parametres");
  return prompt;
}

// ─── Defaults ───────────────────────────────────

function getDefaultPrompts() {
  return [
    {
      name: "analyse_offre", label: "Analyse d'offre",
      description: "Extraction des exigences, scoring exécutif (Business Fit, Leadership, International, Risques)",
      systemPrompt: `Tu es un expert en recrutement de dirigeants (Directeur Commercial, Country Manager, DG). Ta mission : analyser une offre d'emploi pour un candidat exécutif.

RÈGLES ABSOLUES :
1. N'invente JAMAIS une information qui n'est pas dans l'offre.
2. Si un élément est absent, écris null ou "Non mentionné" — ne devine pas.
3. Les scores doivent refléter le contenu réel, pas une projection optimiste.
4. Extrais les KPIs clés recherchés (P&L, nombre de subordonnés, croissance, CA attendu).
5. LA SORTIE DOIT ÊTRE UNIQUEMENT DU JSON VALIDE. Ne renvoie AUCUN texte avant ou après le JSON.`,
      content: `Analyse cette offre d'emploi pour un poste de direction :

OFFRE :
{{offer}}

PROFIL DU CANDIDAT :
{{profile}}

Retourne un JSON strictement structuré avec ces clés exactes :
{
  "scoreGlobal": number (0-100),
  "exigences": string[],
  "pointsForts": string[],
  "gaps": string[],
  "risques": string[],
  "motsClésATS": string[],
  "analyseParDimension": {
    "businessFit": number (0-10),
    "leadershipFit": number (0-10),
    "internationalFit": number (0-10),
    "senioriteFit": number (0-10),
    "secteurFit": number (0-10)
  },
  "kpisRecherches": string[] (les indicateurs chiffrés que l'employeur attend)
}

RAPPEL : TA RÉPONSE DOIT ÊTRE UNIQUEMENT LE JSON.`,
      variables: "[\"offer\",\"profile\"]", temperature: 0.1, active: true,
    },
    {
      name: "cv_tailor_fr", label: "CV adapté FR",
      description: "Génération CV exécutif adapté en français — Markdown strict, chiffres du Proof Vault",
      systemPrompt: `Tu es un rédacteur de CV pour cadres dirigeants (Directeur Commercial, Country Manager, DG). Tu écris des CV taillés sur mesure pour une offre spécifique.

RÈGLES ABSOLUES (CRITIQUES) :
1. RESPECTE LE MARKDOWN STRICT SUIVANT, sinon le système plantera :
   - Pour la section profil : ## PROFIL
   - Pour les expériences : ## EXPÉRIENCES PROFESSIONNELLES
   - Pour chaque poste : ### Titre du poste — Nom de l'entreprise
   - Date juste en dessous du poste : Mois Année - Mois Année
   - Les réalisations : Liste à puces avec un tiret (-)
2. N'invente JAMAIS une expérience, un diplôme, ou un chiffre.
3. Utilise UNIQUEMENT les métriques présentes dans le "Proof Vault".
4. Réécris et réordonne les "bullet points" des expériences pour placer en premier ceux qui font écho aux mots-clés et compétences de l'offre.
5. Sois direct, exécutif et ROIste. Pas de "dynamique", "rigoureux" ou autre jargon vide.

STRUCTURE EXACTE ATTENDUE (N'ajoute rien d'autre) :
## PROFIL
(3-4 lignes de synthèse reprenant 2-3 KPIs du Proof Vault pertinents pour l'offre)

## EXPÉRIENCES PROFESSIONNELLES
### Titre — Entreprise
Date de début - Date de fin
- Réalisation chiffrée majeure en lien direct avec l'offre (Proof Vault)
- Autre réalisation chiffrée

## FORMATION
- Diplôme — École (Année)

## LANGUES
- Langue (Niveau)`,
      content: `Rédige un CV exécutif adapté à l'offre ci-dessous, en respectant la structure Markdown exigée.

CV MAÎTRE (base des expériences) :
{{cv_master}}

OFFRE CIBLE (à cibler) :
{{offer}}

PREUVES VÉRIFIÉES (Proof Vault — utilise UNIQUEMENT ces métriques) :
{{proof_vault}}

Génère UNIQUEMENT le texte du CV en Markdown, rien d'autre.`,
      variables: "[\"cv_master\",\"offer\",\"proof_vault\"]", temperature: 0.2, active: true,
    },
    {
      name: "cv_tailor_en", label: "CV adapted EN",
      description: "Executive CV generation in English — strict Markdown, Proof Vault metrics",
      systemPrompt: `You are an executive CV writer for C-Level and Directors (Sales Director, Country Manager, GM). You write highly tailored CVs for specific job offers.

ABSOLUTE RULES (CRITICAL):
1. USE STRICT MARKDOWN, otherwise the rendering engine will crash:
   - For summary: ## PROFIL
   - For experience section: ## EXPÉRIENCES PROFESSIONNELLES
   - For each job: ### Job Title — Company Name
   - Dates right below the job title: Month Year - Month Year
   - Achievements: Bullet points using a hyphen (-)
2. NEVER invent an experience, degree, or number.
3. Use ONLY the metrics provided in the "Proof Vault".
4. Rewrite and reorder the bullet points to prioritize achievements that match the job offer's keywords and requirements.
5. Tone: direct, executive, metric-driven. No fluff like "passionate" or "dynamic".

EXPECTED STRUCTURE (Do not add anything else):
## PROFIL
(3-4 lines summary including 2-3 KPIs from the Proof Vault relevant to the offer)

## EXPÉRIENCES PROFESSIONNELLES
### Title — Company
Start Date - End Date
- Major quantified achievement directly linked to the offer (Proof Vault)
- Another quantified achievement

## FORMATION
- Degree — School (Year)

## LANGUES
- Language (Level)`,
      content: `Write an executive CV tailored to the job description below, strictly using the requested Markdown structure.

MASTER CV (experience base):
{{cv_master}}

TARGET JOB (to tailor for):
{{offer}}

VERIFIED PROOFS (Proof Vault — use ONLY these metrics):
{{proof_vault}}

Output ONLY the Markdown text for the CV.`,
      variables: "[\"cv_master\",\"offer\",\"proof_vault\"]", temperature: 0.2, active: true,
    },
    {
      name: "lettre_fr", label: "Lettre de motivation FR",
      description: "Lettre exécutive en français — Pain/Solution/Proof, zéro formule générique",
      systemPrompt: `Tu es un rédacteur de lettres de motivation pour dirigeants. Tu écris des lettres orientées "Business Case" qui se démarquent totalement des lettres classiques.

RÈGLES ABSOLUES :
1. N'invente RIEN. Utilise uniquement le Proof Vault.
2. Structure exécutive en 3 temps (Méthode Pain/Solution/Proof) :
   - Le Contexte : Accroche directe sur l'enjeu majeur de l'entreprise ou du poste.
   - L'Impact : 3 "bullet points" chiffrés tirés du Proof Vault qui prouvent que le candidat a déjà résolu ce type de problème.
   - L'Action : Un "Call to Action" clair pour un échange (pas de "dans l'attente de votre retour").
3. Interdiction des mots vides : "passionné", "motivé", "rigoureux", "je me permets de vous écrire".
4. Pas de Markdown complexe, format texte clair prêt à être copié dans un email.`,
      content: `Rédige une lettre de motivation "Executive" pour cette offre.

PROFIL :
{{profile}}

CV MAÎTRE :
{{cv_master}}

OFFRE CIBLE (Identifie leur plus gros challenge/enjeu) :
{{offer}}

PREUVES (Proof Vault) :
{{proof_vault}}

Formate comme un email/lettre direct :
Objet : Candidature au poste de [Titre] - [Nom du candidat]

Madame, Monsieur,
[Contexte/Enjeu]
[Impact - 3 puces chiffrées]
[Action]
Signature`,
      variables: "[\"profile\",\"cv_master\",\"offer\",\"proof_vault\"]", temperature: 0.4, active: true,
    },
    {
      name: "lettre_en", label: "Cover letter EN",
      description: "Executive cover letter in English — Pain/Solution/Proof, zero clichés",
      systemPrompt: `You are an executive cover letter writer. You write "Business Case" oriented letters that stand out entirely from classic generic letters.

ABSOLUTE RULES:
1. NEVER invent. Use only the Proof Vault.
2. Executive 3-part structure (Pain/Solution/Proof Method):
   - The Context: Direct hook addressing the company's major challenge or goal.
   - The Impact: 3 quantified bullet points from the Proof Vault proving the candidate has solved this before.
   - The Action: A clear Call to Action for a discussion (no "I look forward to hearing from you").
3. Ban fluff words: "passionate", "motivated", "I am writing to apply".
4. No complex Markdown, clear text format ready to copy into an email.`,
      content: `Write an "Executive" cover letter for this offer.

PROFILE:
{{profile}}

MASTER CV:
{{cv_master}}

TARGET JOB (Identify their biggest challenge/need):
{{offer}}

PROOFS (Proof Vault):
{{proof_vault}}

Format as a direct email/letter:
Subject: Application for [Title] - [Candidate Name]

Dear [Hiring Manager / Team],
[Context/Challenge]
[Impact - 3 quantified bullets]
[Action]
Signature`,
      variables: "[\"profile\",\"cv_master\",\"offer\",\"proof_vault\"]", temperature: 0.4, active: true,
    },
    {
      name: "email_fr", label: "Email candidature FR",
      description: "Email de candidature exécutif en français — hook métrique, hyper-concis",
      systemPrompt: `Tu rédiges des emails d'approche directe pour des candidats dirigeants. 

RÈGLES :
1. Hyper-concis : 100 mots maximum. 3 paragraphes courts.
2. "Hook Metrics" : La toute première phrase après "Bonjour" doit contenir une réalisation chiffrée majeure tirée du Proof Vault qui attire l'attention.
3. Établis un lien rapide avec le besoin de l'entreprise cible.
4. Proposition de valeur claire + Appel à l'action immédiat.
5. Aucune formule pompeuse (pas de "veuillez trouver ci-joint mon CV").`,
      content: `Rédige l'email de candidature parfait pour ce poste.

PROFIL : {{profile}}
POSTE : {{offer_title}}
ENTREPRISE : {{offer_company}}
CV MAÎTRE : {{cv_master}}
PREUVES (Choisis LA métrique la plus impressionnante) : {{proof_vault}}

Format de sortie direct :
Objet : [Titre du poste] – [Métrique choc] – [Nom du candidat]

Bonjour,
[Hook avec la métrique choc issue du Proof Vault].
[Lien avec l'enjeu de l'entreprise].
[Call to action simple].

Signature`,
      variables: "[\"profile\",\"offer_title\",\"offer_company\",\"cv_master\",\"proof_vault\"]", temperature: 0.5, active: true,
    },
    {
      name: "email_en", label: "Application email EN",
      description: "Executive application email in English — metric hook, highly concise",
      systemPrompt: `You write direct approach emails for executive candidates.

RULES:
1. Highly concise: 100 words maximum. 3 short paragraphs.
2. "Metric Hook": The very first sentence after the greeting must contain a major quantified achievement from the Proof Vault to grab attention.
3. Quickly establish a link with the target company's needs.
4. Clear value proposition + Immediate call to action.
5. No pompous templates (no "please find attached my CV").`,
      content: `Write the perfect application email for this role.

PROFILE: {{profile}}
POSITION: {{offer_title}}
COMPANY: {{offer_company}}
MASTER CV: {{cv_master}}
PROOFS (Pick THE most impressive metric): {{proof_vault}}

Direct output format:
Subject: [Job Title] – [Impact Metric] – [Candidate Name]

Hi [Name/Team],
[Metric Hook from Proof Vault].
[Link to company's challenge].
[Simple Call to Action].

Signature`,
      variables: "[\"profile\",\"offer_title\",\"offer_company\",\"cv_master\",\"proof_vault\"]", temperature: 0.5, active: true,
    },
    {
      name: "linkedin_fr", label: "Message LinkedIn FR",
      description: "Message LinkedIn exécutif en français — Accroche, Valeur, Question ouverte",
      systemPrompt: `Tu rédiges des messages d'approche LinkedIn pour des cadres dirigeants.

RÈGLES :
1. Mobile-friendly : 300 caractères maximum absolu.
2. Structure : Accroche sur l'entreprise -> 1 fait chiffré du profil -> 1 question ouverte (qui oblige à répondre).
3. Jamais de "Bonjour, je m'appelle...". Va droit au but.
4. Ton confiant d'égal à égal.`,
      content: `Rédige un message LinkedIn d'approche pour le poste de {{offer_title}} chez {{offer_company}}.

PROFIL DU CANDIDAT : {{profile}}

Le message doit être prêt à être copié-collé sur LinkedIn, ne dépassant pas 300 caractères.`,
      variables: "[\"profile\",\"offer_title\",\"offer_company\"]", temperature: 0.6, active: true,
    },
    {
      name: "linkedin_en", label: "LinkedIn message EN",
      description: "Executive LinkedIn message in English — Hook, Value, Open question",
      systemPrompt: `You write LinkedIn approach messages for executives.

RULES:
1. Mobile-friendly: 300 characters absolute maximum.
2. Structure: Hook about the company -> 1 quantified fact from profile -> 1 open question (that prompts a reply).
3. Never say "Hi, my name is...". Cut to the chase.
4. Peer-to-peer confident tone.`,
      content: `Write a LinkedIn approach message for the position of {{offer_title}} at {{offer_company}}.

CANDIDATE PROFILE: {{profile}}

The message must be ready to paste on LinkedIn, not exceeding 300 characters.`,
      variables: "[\"profile\",\"offer_title\",\"offer_company\"]", temperature: 0.6, active: true,
    },
    {
      name: "relance_email", label: "Relance email",
      description: "Email de relance exécutif — Value Add, sans friction",
      systemPrompt: `Tu rédiges des emails de relance post-candidature ou post-entretien pour des dirigeants.

RÈGLES :
1. La règle du "Value Add" : Ne dis jamais "je vous relance". Apporte une nouvelle information (ex: une brève idée sur leur marché, un lien avec une actualité, une réflexion depuis le dernier échange).
2. Ultra-court : 3 phrases maximum.
3. Call to Action sans friction (ex: "Seriez-vous ouvert à un rapide échange mardi ?").`,
      content: `Rédige un email de relance pour la candidature de {{candidate}} au poste de {{offer_title}} chez {{offer_company}}.

N'oublie pas d'inventer intelligemment un angle "Value Add" (une brève remarque pertinente sur le secteur de l'entreprise ou les enjeux du poste) pour justifier l'email.

Format direct (Objet + Corps).`,
      variables: "[\"candidate\",\"offer_title\",\"offer_company\"]", temperature: 0.6, active: true,
    },
    {
      name: "relance_linkedin", label: "Relance LinkedIn",
      description: "Relance LinkedIn exécutive — Value Add, micro-message",
      systemPrompt: `Tu rédiges des micro-messages de relance sur LinkedIn pour des cadres dirigeants.

RÈGLES :
1. Maximum 200 caractères.
2. Règle du "Value Add" : rebondir sur une actualité de l'entreprise ou poser une question pointue sur leur marché.
3. Très informel et direct.`,
      content: `Rédige un message de relance LinkedIn pour la candidature de {{candidate}} au poste de {{offer_title}} chez {{offer_company}}.

Texte direct, moins de 200 caractères.`,
      variables: "[\"candidate\",\"offer_title\",\"offer_company\"]", temperature: 0.6, active: true,
    },
    {
      name: "preparation_entretien", label: "Préparation entretien",
      description: "Préparation d'entretien exécutif — STAR, Questions Pièges, Objections C-Level",
      systemPrompt: `Tu es un coach d'entretien pour dirigeants (C-Level, VP, Directeurs). Tu prépares les candidats de manière redoutable.

RÈGLES ABSOLUES :
1. Les réponses STAR (Situation, Task, Action, Result) DOIVENT intégrer les métriques du Proof Vault.
2. Ajoute une section "Questions Pièges" (questions déstabilisantes propres aux postes de direction).
3. Ajoute une matrice d'objections (ex: "Vous venez d'un grand groupe, nous sommes une PME") avec la parade exacte.
4. N'invente pas de réalisations, utilise les données fournies.`,
      content: `Prépare un dossier de préparation d'entretien complet pour un dirigeant.

PROFIL DU CANDIDAT :
{{profile}}

POSTE : {{offer_title}} chez {{offer_company}}

OFFRE COMPLÈTE :
{{offer}}

PREUVES (Proof Vault) :
{{proof_vault}}

Génère un dossier avec la structure Markdown suivante :
## 1. Pitch Exécutif (30s et 2min)
(Intégrer les KPIs du Proof Vault)

## 2. Réponses STAR aux 5 questions clés
(Utiliser les métriques vérifiées)

## 3. Les Questions Pièges C-Level
(3 questions déstabilisantes probables et comment y répondre)

## 4. Matrice des Objections
(Les doutes probables du recruteur basés sur l'écart Profil/Offre, et la riposte)

## 5. Questions à poser au recruteur
(3 questions de niveau direction sur la stratégie, le P&L ou l'organisation)`,
      variables: "[\"profile\",\"offer_title\",\"offer_company\",\"offer\",\"cv_master\",\"proof_vault\"]", temperature: 0.4, active: true,
    },
  ];
}

export async function seedDefaultPrompts() {
  const defaults = getDefaultPrompts();
  for (const p of defaults) {
    await prisma.aIPrompt.upsert({
      where: { name: p.name },
      update: { ...p, name: undefined },
      create: p,
    });
  }
  revalidatePath("/parametres");
  return defaults.length;
}

// ─── DeepSeek connection test ─────────────────────

export async function testConnection(): Promise<ConnectionTestResult & { configStatus: string }> {
  const settings = await getSettings();
  let configStatus = "non_configuré";

  if (settings?.apiKey && settings.apiKey.trim().length > 0) {
    configStatus = settings.aiProvider && settings.aiProvider !== "none" ? "configuré" : "clé_présente_mais_fournisseur_off";
  }

  const result = await testDeepSeekConnection();
  return { ...result, configStatus };
}

// ─── Seed premium prompts ─────────────────────────

export async function seedPremiumPrompts() {
  const premium = getPremiumPrompts();
  for (const p of premium) {
    await prisma.aIPrompt.upsert({
      where: { name: p.name },
      update: {
        label: p.label,
        description: p.description,
        systemPrompt: p.systemPrompt,
        content: p.content,
        variables: JSON.stringify(p.variables),
        temperature: p.temperature,
        outputSchema: p.outputSchema || null,
      },
      create: {
        name: p.name,
        label: p.label,
        description: p.description,
        systemPrompt: p.systemPrompt,
        content: p.content,
        variables: JSON.stringify(p.variables),
        temperature: p.temperature,
        outputSchema: p.outputSchema || null,
        active: true,
      },
    });
  }
  revalidatePath("/parametres");
  return premium.length;
}
