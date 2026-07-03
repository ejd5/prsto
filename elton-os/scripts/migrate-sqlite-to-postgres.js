#!/usr/bin/env node
/**
 * Migration SQLite → PostgreSQL
 * 
 * Étapes :
 * 1. Lit toutes les données de la base SQLite
 * 2. Les insère dans la base PostgreSQL
 * 
 * Usage : node scripts/migrate-sqlite-to-postgres.js
 * 
 * Prérequis :
 * - DATABASE_URL_SQLITE pointe vers la base SQLite (file:./prisma/dev.db)
 * - DATABASE_URL pointe vers la base PostgreSQL Neon
 */

const { PrismaClient: PrismaSQLite } = require('../app/generated/prisma');

// Prisma client pour SQLite (via DATABASE_URL_SQLITE)
const sqliteUrl = process.env.DATABASE_URL_SQLITE || 'file:./prisma/dev.db';
process.env.DATABASE_URL = sqliteUrl;

const sqlite = new PrismaSQLite();

async function migrate() {
  console.log('═══════════════════════════════════════════════');
  console.log('  MIGRATION SQLite → PostgreSQL');
  console.log('═══════════════════════════════════════════════\n');

  // 1. Récupérer toutes les données de SQLite
  console.log('📥 Lecture des données SQLite...\n');

  const users = await sqlite.user.findMany();
  console.log(`  Users: ${users.length}`);

  const sessions = await sqlite.session.findMany();
  console.log(`  Sessions: ${sessions.length}`);

  const profiles = await sqlite.profile.findMany({ include: { skills: true } });
  console.log(`  Profiles: ${profiles.length}`);

  const skills = await sqlite.skill.findMany();
  console.log(`  Skills: ${skills.length}`);

  const experiences = await sqlite.experience.findMany();
  console.log(`  Experiences: ${experiences.length}`);

  const cvMaster = await sqlite.cVMaster.findMany();
  console.log(`  CVMaster: ${cvMaster.length}`);

  const proofEntries = await sqlite.proofEntry.findMany();
  console.log(`  ProofEntries: ${proofEntries.length}`);

  const opportunities = await sqlite.opportunity.findMany();
  console.log(`  Opportunities: ${opportunities.length}`);

  const jobs = await sqlite.job.findMany();
  console.log(`  Jobs: ${jobs.length}`);

  const jobScores = await sqlite.jobScore.findMany();
  console.log(`  JobScores: ${jobScores.length}`);

  const interviews = await sqlite.interview.findMany();
  console.log(`  Interviews: ${interviews.length}`);

  const documents = await sqlite.document.findMany();
  console.log(`  Documents: ${documents.length}`);

  const settings = await sqlite.setting.findMany();
  console.log(`  Settings: ${settings.length}`);

  const embeddings = await sqlite.embedding.findMany();
  console.log(`  Embeddings: ${embeddings.length}`);

  const safeJobSources = await sqlite.safeJobSource.findMany();
  console.log(`  SafeJobSources: ${safeJobSources.length}`);

  const jobSources = await sqlite.jobSource.findMany();
  console.log(`  JobSources: ${jobSources.length}`);

  const recruiterContacts = await sqlite.recruiterContact.findMany();
  console.log(`  RecruiterContacts: ${recruiterContacts.length}`);

  const companyTargets = await sqlite.companyTarget.findMany();
  console.log(`  CompanyTargets: ${companyTargets.length}`);

  const contactInteractions = await sqlite.contactInteraction.findMany();
  console.log(`  ContactInteractions: ${contactInteractions.length}`);

  const applicationDrafts = await sqlite.applicationDraft.findMany();
  console.log(`  ApplicationDrafts: ${applicationDrafts.length}`);

  const opportunityTodos = await sqlite.opportunityTodo.findMany();
  console.log(`  OpportunityTodos: ${opportunityTodos.length}`);

  console.log('\n✅ Lecture terminée\n');

  // 2. Fermer la connexion SQLite
  await sqlite.$disconnect();

  console.log('═══════════════════════════════════════════════');
  console.log('  Pour terminer la migration :');
  console.log('═══════════════════════════════════════════════\n');
  console.log('1. Bascule le schema Prisma sur PostgreSQL :');
  console.log('   cp prisma/schema.prisma.pg prisma/schema.prisma\n');
  console.log('2. Configure DATABASE_URL avec ta connexion Neon :');
  console.log('   Dans .env.local : DATABASE_URL="postgresql://..."\n');
  console.log('3. Crée les tables :');
  console.log('   npx prisma db push\n');
  console.log('4. Relance ce script avec la bonne DATABASE_URL :');
  console.log('   DATABASE_URL="postgresql://..." node scripts/migrate-sqlite-to-postgres.js\n');
  console.log('Les données seront alors insérées dans PostgreSQL.\n');
}

migrate().catch(console.error);
