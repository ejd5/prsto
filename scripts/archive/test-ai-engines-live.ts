/**
 * Live test of AI-powered engines with OpenRouter.
 * Run: npx tsx scripts/test-ai-engines-live.ts
 *
 * This script requires:
 * 1. OpenRouter API key stored in DB (configured via /parametres)
 * 2. A running dev server is NOT required — it uses Prisma directly
 */
import { prisma } from "../lib/prisma";
import { scanResume } from "../lib/jobs/ats-resume-scanner";
import { optimizeCv } from "../lib/jobs/ai-cv-optimizer";
import { generateSummary, adaptForJob } from "../lib/jobs/resume-summary-generator";
import { generateBulletPoints } from "../lib/jobs/bullet-point-generator";
import { analyzeLinkedInProfile } from "../lib/jobs/linkedin-optimizer";
import { analyzeSkillGaps } from "../lib/jobs/skills-database";

const MOCK_CV = `Directeur Commercial avec plus de 15 ans d'expérience dans l'industrie et le SaaS.
Expert en développement commercial, management d'équipes et pilotage de la performance.

EXPÉRIENCE PROFESSIONNELLE

Directeur Commercial – TechCorp (2018-présent)
• Pilotage d'une équipe de 25 personnes
• Chiffre d'affaires : 15M€
• Budget : 500K€
• Développé le portefeuille clients de 30% en 2 ans
• Mis en place une stratégie de transformation digitale

Country Manager – IndusGroup (2014-2018)
• Management d'une équipe de 50 personnes
• P&L complet, CA de 25M€
• Lancement de 3 nouvelles gammes de produits

FORMATION

MBA – HEC Paris (2008-2010)
Master – ESSEC (2005-2008)

COMPÉTENCES
Leadership, Management d'équipe, P&L, Développement commercial, Négociation,
Transformation digitale, Stratégie d'entreprise

LANGUES
Français : Langue maternelle | Anglais : Courant (C1)`;

const MOCK_JD = `Directeur Commercial – Secteur Industriel
Notre client, un leader de l'industrie manufacturière, recherche un Directeur Commercial.

Missions :
• Définir et exécuter la stratégie commerciale
• Manager une équipe de 15 commerciaux
• Piloter le P&L de la BU (CA 20M€)
• Développer le portefeuille clients grands comptes
• Accompagner la transformation digitale

Profil :
• 10+ ans en direction commerciale
• Expertise management d'équipe
• Maîtrise du P&L et CRM (Salesforce)
• Anglais courant impératif`;

function divider(label: string) {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`  ${label}`);
  console.log("=".repeat(70));
}

async function testAtsScanner() {
  divider("1. ATS Scanner");
  const start = Date.now();
  const result = await scanResume({
    cvText: MOCK_CV,
    jobTitle: "Directeur Commercial",
    jobDescription: MOCK_JD,
    company: "IndustrieLeader",
  });
  const ms = Date.now() - start;
  console.log(`  Time: ${ms}ms | Model: ${(result as any)._model || "heuristic"}`);
  console.log(`  Global Score: ${result.globalScore}`);
  console.log(`  Keyword Match: ${result.keywordMatch}`);
  console.log(`  Format Score: ${result.formatScore}`);
  console.log(`  Section Coverage: ${result.sectionCoverage}`);
  console.log(`  Suggestions (${result.suggestions.length}):`);
  result.suggestions.slice(0, 3).forEach((s) => console.log(`    • ${s}`));
  console.log(`  Matched Keywords: ${result.matchedKeywords.length}`);
  console.log(`  Missing Keywords: ${result.missingKeywords.length}`);
  return { success: true, engine: "ATS Scanner", ai: ms > 500 };
}

async function testCvOptimizer() {
  divider("2. CV Optimizer");
  const start = Date.now();
  const result = await optimizeCv({
    cvText: MOCK_CV,
    jobTitle: "Directeur Commercial",
    jobDescription: MOCK_JD,
    profile: {
      fullName: "Jean Dupont",
      title: "Directeur Commercial",
      summary: "Directeur Commercial avec 15 ans d'expérience",
      sectors: "Industrie, SaaS",
    },
    experiences: [{
      company: "TechCorp",
      title: "Directeur Commercial",
      startDate: "2018-01-01",
      revenue: "15M€",
      teamSize: "25",
      budget: "500K€",
      achievements: "Développé le portefeuille clients de 30%",
    }],
    skills: [
      { name: "Leadership", category: "leadership", level: "expert" },
      { name: "P&L Management", category: "finance", level: "expert" },
    ],
  });
  const ms = Date.now() - start;
  console.log(`  Time: ${ms}ms`);
  console.log(`  Score: ${result.summary.originalScore} → ${result.summary.improvedScore}`);
  console.log(`  Suggestions: ${result.summary.totalSuggestions}`);
  result.suggestions.slice(0, 3).forEach((s) => console.log(`  [${s.priority}] ${s.title}`));
  return { success: true, engine: "CV Optimizer", ai: ms > 500 };
}

async function testSummaryGenerator() {
  divider("3. Resume Summary Generator");
  const start = Date.now();
  const result = await generateSummary({
    fullName: "Jean Dupont",
    title: "Directeur Commercial",
    yearsExp: 15,
    sectors: JSON.stringify(["Industrie", "SaaS"]),
    location: "Paris",
  }, "formel");
  const ms = Date.now() - start;
  console.log(`  Time: ${ms}ms`);
  console.log(`  Tone: ${result.tone}`);
  console.log(`  Length: ${result.length} (${result.characters} chars)`);
  console.log(`  Text: ${result.text.slice(0, 300)}...`);
  return { success: true, engine: "Summary Generator", ai: ms > 500 };
}

async function testBulletPoints() {
  divider("4. Bullet Points Generator");
  const start = Date.now();
  const result = await generateBulletPoints({
    company: "TechCorp",
    title: "Directeur Commercial",
    startDate: "2018-01-01",
    description: "Pilotage de la stratégie commerciale et management d'équipe",
    achievements: JSON.stringify([
      "Augmenté le CA de 30% en 2 ans",
      "Signé un contrat cadre avec 3 nouveaux comptes stratégiques",
      "Mis en place un CRM Salesforce couvrant 100% de l'équipe",
    ]),
    revenue: "15M€",
    teamSize: "25",
    budget: "500K€",
  });
  const ms = Date.now() - start;
  console.log(`  Time: ${ms}ms`);
  console.log(`  Bullets: ${result.bullets.length}`);
  result.bullets.slice(0, 4).forEach((b) => console.log(`  [${b.style}] ${b.text.slice(0, 100)}`));
  return { success: true, engine: "Bullet Points", ai: ms > 500 };
}

async function testLinkedInOptimizer() {
  divider("5. LinkedIn Optimizer");
  const start = Date.now();
  const result = await analyzeLinkedInProfile({
    fullName: "Jean Dupont",
    title: "Directeur Commercial | Industrie & SaaS",
    summary: "Directeur Commercial avec 15 ans d'expérience dans l'industrie et le SaaS. Expert en développement commercial et transformation digitale. Résultats : croissance du CA de 30%, management d'équipes jusqu'à 50 personnes.",
    location: "Paris",
    experiences: [{
      company: "TechCorp",
      title: "Directeur Commercial",
      startDate: "2018-01-01",
      description: "Pilotage d'une équipe de 25 personnes, CA de 15M€",
    }],
    skills: [
      { name: "Leadership", category: "leadership", level: "expert" },
      { name: "P&L Management", category: "finance", level: "expert" },
      { name: "Négociation", category: "commercial", level: "expert" },
    ],
  });
  const ms = Date.now() - start;
  console.log(`  Time: ${ms}ms`);
  console.log(`  Overall Score: ${result.overallScore}`);
  result.sections.forEach((s) => console.log(`  ${s.name}: ${s.score} (${s.status})`));
  result.suggestions.slice(0, 2).forEach((s) => console.log(`  [${s.priority}] ${s.title}`));
  return { success: true, engine: "LinkedIn", ai: ms > 500 };
}

async function testSkillsDatabase() {
  divider("6. Skills Database");
  const start = Date.now();
  const result = await analyzeSkillGaps(
    [
      { name: "Leadership", category: "leadership", level: "expert" },
      { name: "P&L Management", category: "finance", level: "expert" },
      { name: "Développement commercial", category: "commercial", level: "expert" },
    ],
    "industrie",
    "direction"
  );
  const ms = Date.now() - start;
  console.log(`  Time: ${ms}ms`);
  console.log(`  Present: ${result.present.length}, Missing: ${result.missing.length}`);
  console.log(`  Strengths: ${result.strengths.slice(0, 3).join(", ")}`);
  result.missing.slice(0, 3).forEach((m) => console.log(`  [${m.importance}] ${m.name}: ${m.suggestedAction}`));
  return { success: true, engine: "Skills DB", ai: ms > 500 };
}

async function main() {
  console.log("ELTON OS — AI Engine Live Test Suite");
  console.log(`Started: ${new Date().toISOString()}`);
  console.log(`OpenRouter configured: checking...`);

  const settings = await prisma.setting.findFirst();
  const hasAi = settings?.apiKey && settings.apiKey.length > 20;
  console.log(`OpenRouter: ${hasAi ? "YES (key configured)" : "NO (will use heuristic fallback)"}`);

  const results = await Promise.allSettled([
    testAtsScanner(),
    testCvOptimizer(),
    testSummaryGenerator(),
    testBulletPoints(),
    testLinkedInOptimizer(),
    testSkillsDatabase(),
  ]);

  divider("SUMMARY");
  const passed = results.filter((r) => r.status === "fulfilled" && r.value.success).length;
  const withAi = results.filter((r) => r.status === "fulfilled" && r.value.ai).length;
  results.forEach((r, i) => {
    const names = ["ATS Scanner", "CV Optimizer", "Summary Generator", "Bullet Points", "LinkedIn", "Skills DB"];
    if (r.status === "fulfilled") {
      console.log(`  ✓ ${names[i]} (${r.value.ai ? "AI" : "heuristic"})`);
    } else {
      console.log(`  ✗ ${names[i]}: ${r.reason}`);
    }
  });
  console.log(`\n  ${passed}/6 passed | AI mode: ${withAi}/6`);

  await prisma.$disconnect();
}

main().catch(console.error);
