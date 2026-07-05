import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma";

const prisma = new PrismaClient();

// ─── 29 Sources d'emploi ──────────────────────────────────
const JOB_SOURCES = [
  // Généralistes FR
  { name: "LinkedIn", url: "https://www.linkedin.com/jobs/", region: "FR", type: "generalist", priority: 1 },
  { name: "Indeed", url: "https://fr.indeed.com/", region: "FR", type: "generalist", priority: 1 },
  { name: "APEC", url: "https://www.apec.fr/", region: "FR", type: "generalist", priority: 1 },
  { name: "Cadremploi", url: "https://www.cadremploi.fr/", region: "FR", type: "generalist", priority: 1 },
  { name: "Welcome to the Jungle", url: "https://www.welcometothejungle.com/", region: "FR", type: "generalist", priority: 0 },
  { name: "Glassdoor", url: "https://www.glassdoor.fr/", region: "FR", type: "generalist", priority: 1 },
  { name: "Monster", url: "https://www.monster.fr/", region: "FR", type: "generalist", priority: 0 },
  { name: "HelloWork", url: "https://www.hellowork.com/", region: "FR", type: "generalist", priority: 0 },
  { name: "Meteojob", url: "https://www.meteojob.com/", region: "FR", type: "generalist", priority: 0 },
  { name: "Jobijoba", url: "https://www.jobijoba.com/", region: "FR", type: "generalist", priority: 0 },

  // Cabinets exécutifs
  { name: "Michael Page", url: "https://www.michaelpage.fr/", region: "FR", type: "executive", priority: 1 },
  { name: "Page Executive", url: "https://www.pageexecutive.com/", region: "FR", type: "executive", priority: 1 },
  { name: "Hays", url: "https://www.hays.fr/", region: "FR", type: "executive", priority: 1 },
  { name: "Robert Walters", url: "https://www.robertwalters.fr/", region: "FR", type: "executive", priority: 0 },
  { name: "Morgan Philips", url: "https://www.morganphilips.com/", region: "FR", type: "executive", priority: 0 },
  { name: "LHH", url: "https://www.lhh.com/fr/", region: "FR", type: "executive", priority: 0 },
  { name: "Robert Half", url: "https://www.roberthalf.fr/", region: "FR", type: "executive", priority: 0 },

  // Executive search international
  { name: "Korn Ferry", url: "https://www.kornferry.com/", region: "INTL", type: "executive", priority: 1 },
  { name: "Boyden", url: "https://www.boyden.com/", region: "INTL", type: "executive", priority: 0 },
  { name: "Keller Executive Search", url: "https://www.kellerexecutivesearch.com/", region: "INTL", type: "executive", priority: 0 },
  { name: "CEO Worldwide", url: "https://www.ceo-worldwide.com/", region: "INTL", type: "executive", priority: 0 },
  { name: "ExecuNet", url: "https://www.execunet.com/", region: "US", type: "executive", priority: 0 },
  { name: "The Ladders", url: "https://www.theladders.com/", region: "US", type: "executive", priority: 0 },
  { name: "Aruba Exec", url: "https://www.arubaexec.com/", region: "EU", type: "executive", priority: 0 },
  { name: "Top of Minds", url: "https://www.topofminds.com/", region: "EU", type: "executive", priority: 0 },

  // Startup / Remote
  { name: "Otta", url: "https://otta.com/", region: "INTL", type: "startup", priority: 0 },
  { name: "Remote Rocketship", url: "https://remoterocketship.com/", region: "INTL", type: "startup", priority: 0 },
  { name: "Himalayas", url: "https://himalayas.app/", region: "INTL", type: "startup", priority: 0 },
  { name: "Wellfound", url: "https://wellfound.com/", region: "INTL", type: "startup", priority: 0 },
  { name: "EU-Startups Jobs", url: "https://www.eu-startups.com/jobs/", region: "EU", type: "startup", priority: 0 },
  { name: "Startup.jobs", url: "https://startup.jobs/", region: "INTL", type: "startup", priority: 0 },
];

// ─── 4 Rôles prioritaires ─────────────────────────────────
const PRIORITY_ROLES = [
  { name: "Directeur Commercial", rank: 1 },
  { name: "Country Manager", rank: 2 },
  { name: "Directeur National des Ventes", rank: 3 },
  { name: "Directeur Général", rank: 4 },
];

// ─── 12 Pays cibles ───────────────────────────────────────
const TARGET_COUNTRIES = [
  { name: "France", code: "FR", region: "Europe", priority: 1 },
  { name: "Suisse", code: "CH", region: "Europe", priority: 1 },
  { name: "Belgique", code: "BE", region: "Europe", priority: 1 },
  { name: "Luxembourg", code: "LU", region: "Europe", priority: 1 },
  { name: "Monaco", code: "MC", region: "Europe", priority: 0 },
  { name: "Espagne", code: "ES", region: "Europe", priority: 0 },
  { name: "Portugal", code: "PT", region: "Europe", priority: 0 },
  { name: "Allemagne", code: "DE", region: "Europe", priority: 0 },
  { name: "Italie", code: "IT", region: "Europe", priority: 0 },
  { name: "Royaume-Uni", code: "GB", region: "Europe", priority: 0 },
  { name: "USA", code: "US", region: "Amériques", priority: 0 },
  { name: "International", code: "INTL", region: "Monde", priority: 0 },
];

// ─── Prompts IA par défaut ────────────────────────────────
const DEFAULT_PROMPTS = [
  {
    name: "cv_tailor_fr",
    label: "CV Tailor FR",
    content: `Tu es un expert en recrutement exécutif. Adapte le CV maître du candidat pour l'offre ci-dessous.

RÈGLES CRITIQUES :
- Ne JAMAIS inventer une expérience, compétence, diplôme, certification, entreprise, chiffre ou résultat.
- Chaque affirmation doit venir du CV maître ou du Proof Vault.
- Les compétences absentes vont dans les GAPS, jamais dans le CV adapté.
- Conserve la structure chronologique inverse.
- Adapte le vocabulaire aux mots-clés de l'offre sans mentir.

CV MAÎTRE :
{{cv_master}}

OFFRE :
{{offer}}

Proof Vault :
{{proof_vault}}

Génère le CV adapté en français.`,
    variables: JSON.stringify(["cv_master", "offer", "proof_vault"]),
  },
  {
    name: "cv_tailor_en",
    label: "CV Tailor EN",
    content: `You are an executive recruitment expert. Adapt the candidate's master CV for the job offer below.

CRITICAL RULES:
- NEVER invent any experience, skill, degree, certification, company, number or result.
- Every claim must come from the master CV or Proof Vault.
- Missing skills go in the GAPS section, never in the adapted CV.
- Keep reverse chronological order.
- Adapt vocabulary to offer keywords without lying.

MASTER CV:
{{cv_master}}

OFFER:
{{offer}}

PROOF VAULT:
{{proof_vault}}

Generate the adapted CV in English.`,
    variables: JSON.stringify(["cv_master", "offer", "proof_vault"]),
  },
  {
    name: "lettre_fr",
    label: "Lettre de motivation FR",
    content: `Rédige une lettre de motivation exécutive en français.

RÈGLES :
- Ne rien inventer.
- S'appuyer uniquement sur le CV maître et le Proof Vault.
- Ton : dirigeant, stratégique, orienté résultats.
- 3 paragraphes maximum.

CV MAÎTRE : {{cv_master}}
OFFRE : {{offer}}
PROOF VAULT : {{proof_vault}}`,
    variables: JSON.stringify(["cv_master", "offer", "proof_vault"]),
  },
  {
    name: "lettre_en",
    label: "Lettre de motivation EN",
    content: `Write an executive cover letter in English. Same rules as the French version.`,
    variables: JSON.stringify(["cv_master", "offer", "proof_vault"]),
  },
  {
    name: "analyse_offre",
    label: "Analyse d'offre",
    content: `Analyse cette offre d'emploi pour un dirigeant commercial.

Extrais et structure :
1. Titre exact et entreprise
2. Exigences clés (hard skills, soft skills, expérience)
3. Mots-clés ATS (liste)
4. Risques / drapeaux rouges
5. Score estimé de compatibilité (0-100) basé sur le profil ci-dessous
6. GAPS : compétences ou expériences absentes du profil

PROFIL : {{profile}}
OFFRE : {{offer}}`,
    variables: JSON.stringify(["profile", "offer"]),
  },
];

async function seed() {
  console.log("🌱 Seed ELTON OS...\n");

  // Sources d'emploi
  console.log(`📡 Insertion ${JOB_SOURCES.length} sources d'emploi...`);
  for (const src of JOB_SOURCES) {
    await prisma.jobSource.upsert({
      where: { name: src.name },
      create: src,
      update: { url: src.url, region: src.region, type: src.type, priority: src.priority },
    });
  }

  // Rôles prioritaires
  console.log(`🎯 Insertion ${PRIORITY_ROLES.length} rôles prioritaires...`);
  for (const role of PRIORITY_ROLES) {
    await prisma.priorityRole.upsert({
      where: { name: role.name },
      create: role,
      update: { rank: role.rank },
    });
  }

  // Pays cibles
  console.log(`🌍 Insertion ${TARGET_COUNTRIES.length} pays cibles...`);
  for (const country of TARGET_COUNTRIES) {
    await prisma.targetCountry.upsert({
      where: { code: country.code },
      create: country,
      update: { name: country.name, region: country.region, priority: country.priority },
    });
  }

  // Prompts IA par défaut
  console.log(`🤖 Insertion ${DEFAULT_PROMPTS.length} prompts IA...`);
  for (const prompt of DEFAULT_PROMPTS) {
    await prisma.aIPrompt.upsert({
      where: { name: prompt.name },
      create: prompt,
      update: { content: prompt.content, variables: prompt.variables },
    });
  }

  // Paramètres par défaut
  console.log("⚙️  Insertion paramètres...");
  await prisma.setting.upsert({
    where: { id: "elton-os-settings" },
    create: { id: "elton-os-settings" },
    update: {},
  });

  console.log("\n✅ Seed terminé !");
  console.log(`   - ${JOB_SOURCES.length} sources d'emploi`);
  console.log(`   - ${PRIORITY_ROLES.length} rôles prioritaires`);
  console.log(`   - ${TARGET_COUNTRIES.length} pays cibles`);
  console.log(`   - ${DEFAULT_PROMPTS.length} prompts IA`);
  console.log("   - Paramètres ELTON OS");
}

seed()
  .catch((e) => {
    console.error("❌ Erreur seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
