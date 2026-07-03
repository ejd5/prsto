#!/usr/bin/env node
/**
 * Migration SQLite → PostgreSQL
 * Lit SQLite directement et insère dans PostgreSQL via Prisma
 */

const { PrismaClient } = require('../app/generated/prisma');

// Forcer DATABASE_URL sur PostgreSQL pour ce script
process.env.DATABASE_URL = "postgresql://neondb_owner:npg_eD81irYCovjb@ep-dawn-star-ab2wpk8t.eu-west-2.aws.neon.tech/neondb?sslmode=require";

const pg = new PrismaClient();

// Lire SQLite avec le module sqlite3 natif
const Database = require('better-sqlite3');
const sqliteDb = new Database('./prisma/dev.db', { readonly: true });

async function migrate() {
  console.log('═══════════════════════════════════════════════');
  console.log('  MIGRATION SQLite → PostgreSQL');
  console.log('═══════════════════════════════════════════════\n');

  // Helper pour lire une table SQLite
  function readTable(name) {
    try {
      const rows = sqliteDb.prepare(`SELECT * FROM ${name}`).all();
      console.log(`  ${name}: ${rows.length} enregistrements`);
      return rows;
    } catch (e) {
      console.log(`  ${name}: table non trouvée ou vide`);
      return [];
    }
  }

  // 1. Lire toutes les données de SQLite
  console.log('📥 Lecture SQLite...\n');
  
  const users = readTable('User');
  const profiles = readTable('Profile');
  const skills = readTable('Skill');
  const experiences = readTable('Experience');
  const cvMaster = readTable('CVMaster');
  const proofEntries = readTable('ProofEntry');
  const opportunities = readTable('Opportunity');
  const jobs = readTable('Job');
  const jobScores = readTable('JobScore');
  const interviews = readTable('Interview');
  const documents = readTable('Document');
  const settings = readTable('Setting');
  const embeddings = readTable('Embedding');
  const safeJobSources = readTable('SafeJobSource');
  const jobSources = readTable('JobSource');
  const recruiterContacts = readTable('RecruiterContact');
  const companyTargets = readTable('CompanyTarget');
  const contactInteractions = readTable('ContactInteraction');
  const applicationDrafts = readTable('ApplicationDraft');
  const opportunityTodos = readTable('OpportunityTodo');
  const sessions = readTable('Session');

  console.log('\n📤 Insertion dans PostgreSQL...\n');

  // 2. Insérer dans PostgreSQL (ordre des dépendances)
  
  // Users
  if (users.length > 0) {
    await pg.user.createMany({ data: users.map(u => ({
      id: u.id, email: u.email, name: u.name, password: u.password,
      role: u.role, plan: u.plan, company: u.company, phone: u.phone,
      createdAt: new Date(u.createdAt), updatedAt: new Date(u.updatedAt),
    }))});
    console.log('  ✅ Users insérés');
  }

  // Sessions
  if (sessions.length > 0) {
    await pg.session.createMany({ data: sessions.map(s => ({
      id: s.id, userId: s.userId, token: s.token,
      expiresAt: new Date(s.expiresAt), createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
    }))});
    console.log('  ✅ Sessions insérées');
  }

  // Profiles
  if (profiles.length > 0) {
    await pg.profile.createMany({ data: profiles.map(p => ({
      id: p.id, fullName: p.fullName, title: p.title, sectors: p.sectors,
      functions: p.functions, languages: p.languages, yearsExp: p.yearsExp,
      linkedinUrl: p.linkedinUrl, phone: p.phone, location: p.location,
      bio: p.bio, summary: p.summary, headline: p.headline, currentCompany: p.currentCompany,
      currentRole: p.currentRole, targetSalary: p.targetSalary,
      targetRole: p.targetRole, targetLocation: p.targetLocation,
      createdAt: new Date(p.createdAt), updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
    }))});
    console.log('  ✅ Profiles insérés');
  }

  // Skills
  const validSkills = skills.filter(s => profiles.some(p => p.id === s.profileId));
  if (validSkills.length > 0) {
    await pg.skill.createMany({ data: validSkills.map(s => ({
      id: s.id, name: s.name, level: s.level, profileId: s.profileId, category: s.category, source: s.source, verifiedAt: s.verifiedAt ? new Date(s.verifiedAt) : null, createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
    }))});
    console.log('  ✅ Skills insérés');
  }

  // Experiences
  const validExps = experiences.filter(e => profiles.some(p => p.id === e.profileId));
  if (validExps.length > 0) {
    await pg.experience.createMany({ data: validExps.map(e => ({
      id: e.id, profileId: e.profileId, company: e.company, title: e.title, sector: e.sector, country: e.country,
      startDate: e.startDate || "",
      endDate: e.endDate || null,
      description: e.description, location: e.location,
    }))});
    console.log('  ✅ Experiences insérés');
  }

  // CVMaster
  if (cvMaster.length > 0) {
    await pg.cVMaster.createMany({ data: cvMaster.map(c => ({
      id: c.id, profileId: c.profileId, fileName: c.fileName,
      originalText: c.originalText, parsedJson: c.parsedJson,
      fileType: c.fileType, fileSize: c.fileSize, status: c.status,
      uploadedAt: new Date(c.uploadedAt),
    }))});
    console.log('  ✅ CVMaster insérés');
  }

  // ProofEntry
  if (proofEntries.length > 0) {
    await pg.proofEntry.createMany({ data: proofEntries.map(p => ({
      id: p.id, profileId: p.profileId, experienceId: p.experienceId,
      category: p.category, title: p.title, value: p.value,
      context: p.context, period: p.period, confidence: p.confidence,
      verifiable: !!p.verifiable, isConfidential: !!p.isConfidential,
      usableForCV: !!p.usableForCV, usableForLetter: !!p.usableForLetter,
      sendableToAI: !!p.sendableToAI, documentUrl: p.documentUrl,
      createdAt: new Date(p.createdAt), 
    }))});
    console.log('  ✅ ProofEntries insérés');
  }

  // JobSource — SKIP (schema mismatch)
  /*
    await pg.jobSource.createMany({ data: jobSources.map(j => ({
      id: j.id, name: j.name, type: j.type, url: j.url,
      isActive: !!j.isActive, config: j.config,
      createdAt: new Date(j.createdAt), updatedAt: j.updatedAt ? new Date(j.updatedAt) : new Date(),
    }))});
    */

  // SafeJobSource — SKIP (schema mismatch)
  /*
    await pg.safeJobSource.createMany({ data: safeJobSources.map(s => ({
      id: s.id, name: s.name, url: s.url, type: s.type,
      isActive: !!s.isActive, config: s.config,
      lastRunAt: s.lastRunAt ? new Date(s.lastRunAt) : null,
      createdAt: s.createdAt ? new Date(s.createdAt) : new Date(), updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date(),
    }))});
    */

  // Jobs
  if (jobs.length > 0) {
    for (const j of jobs) {
      try {
        await pg.job.create({
          data: {
            id: j.id, title: j.title, company: j.company, location: j.location,
            description: j.description, url: j.url, source: j.source,
            sourceUrl: j.sourceUrl, salaryMin: j.salaryMin, salaryMax: j.salaryMax,
            jobType: j.jobType, remote: j.remote, status: j.status,
            postedAt: j.postedAt ? new Date(j.postedAt) : null,
            firstSeenAt: new Date(j.firstSeenAt),
            jobSourceId: j.jobSourceId,
            createdAt: new Date(j.createdAt), updatedAt: j.updatedAt ? new Date(j.updatedAt) : new Date(),
          }
        });
      } catch (e) { /* skip duplicates */ }
    }
    console.log('  ✅ Jobs insérés');
  }

  // JobScore
  if (jobScores.length > 0) {
    for (const s of jobScores) {
      try {
        await pg.jobScore.create({
          data: {
            id: s.id, jobId: s.jobId, globalScore: s.globalScore,
            executiveScore: s.executiveScore, locationScore: s.locationScore,
            semanticScore: s.semanticScore, atsScore: s.atsScore,
            redFlagsScore: s.redFlagsScore, recommendation: s.recommendation,
            recommendedAction: s.recommendedAction, reasonsJson: s.reasonsJson,
            redFlagsJson: s.redFlagsJson, semanticConfidence: s.semanticConfidence,
            createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
          }
        });
      } catch (e) { /* skip */ }
    }
    console.log('  ✅ JobScores insérés');
  }

  // Opportunities
  if (opportunities.length > 0) {
    for (const o of opportunities) {
      try {
        await pg.opportunity.create({
          data: {
            id: o.id, title: o.title, company: o.company, location: o.location,
            country: o.country, sourceUrl: o.sourceUrl, sourceName: o.sourceName,
            jobSourceId: o.jobSourceId, rawText: o.rawText,
            salaryMin: o.salaryMin, salaryMax: o.salaryMax,
            salaryCurrency: o.salaryCurrency || 'EUR',
            contractType: o.contractType, remote: o.remote,
            status: o.status, score: o.score, priority: o.priority,
            notes: o.notes, appliedAt: o.appliedAt ? new Date(o.appliedAt) : null,
            createdAt: new Date(o.createdAt), updatedAt: o.updatedAt ? new Date(o.updatedAt) : new Date(),
          }
        });
      } catch (e) { /* skip duplicates */ }
    }
    console.log('  ✅ Opportunities insérées');
  }

  // Interviews
  if (interviews.length > 0) {
    await pg.interview.createMany({ data: interviews.map(i => ({
      id: i.id, opportunityId: i.opportunityId, jobId: i.jobId,
      type: i.type, date: i.date ? new Date(i.date) : null,
      interviewer: i.interviewer, notes: i.notes, questions: i.questions,
      strengths: i.strengths, weaknesses: i.weaknesses,
      nextSteps: i.nextSteps, preparation: i.preparation, sections: i.sections,
      status: i.status, createdAt: new Date(i.createdAt),
    }))});
    console.log('  ✅ Interviews insérés');
  }

  // Settings
  if (settings.length > 0) {
    for (const s of settings) {
      try {
        await pg.setting.create({
          data: {
            id: s.id, aiProvider: s.aiProvider, apiKey: s.apiKey,
            baseUrl: s.baseUrl, defaultModel: s.defaultModel,
            proModel: s.proModel, timeout: s.timeout, temperature: s.temperature,
            uxMode: s.uxMode, createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
            updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date(),
          }
        });
      } catch (e) { /* skip */ }
    }
    console.log('  ✅ Settings insérés');
  }

  // Embeddings
  if (embeddings.length > 0) {
    await pg.embedding.createMany({ data: embeddings.map(e => ({
      id: e.id, entityType: e.entityType, entityId: e.entityId,
      content: e.content, embedding: e.embedding, model: e.model,
      dimensions: e.dimensions,
      createdAt: new Date(e.createdAt), updatedAt: new Date(e.updatedAt),
    }))});
    console.log('  ✅ Embeddings insérés');
  }

  // RecruiterContact — SKIP for now
  /*
    await pg.recruiterContact.createMany({ data: recruiterContacts.map(r => ({
      id: r.id, name: r.name, company: r.company, email: r.email,
      phone: r.phone, linkedin: r.linkedin, notes: r.notes,
      lastContactAt: r.lastContactAt ? new Date(r.lastContactAt) : null,
      createdAt: new Date(r.createdAt), updatedAt: r.updatedAt ? new Date(r.updatedAt) : new Date(),
    }))});
    */

  // CompanyTarget — SKIP for now
  /*
    await pg.companyTarget.createMany({ data: companyTargets.map(c => ({
      id: c.id, name: c.name, sector: c.sector, url: c.url,
      notes: c.notes, status: c.status,
      createdAt: new Date(c.createdAt), updatedAt: c.updatedAt ? new Date(c.updatedAt) : new Date(),
    }))});
    */

  // ContactInteraction — SKIP for now
  /*
    await pg.contactInteraction.createMany({ data: contactInteractions.map(c => ({
      id: c.id, recruiterContactId: c.recruiterContactId,
      type: c.type, date: new Date(c.date), notes: c.notes,
      createdAt: new Date(c.createdAt),
    }))});
    */

  // ApplicationDraft — SKIP for now
  /*
    for (const a of applicationDrafts) {
      try {
        await pg.applicationDraft.create({
          data: {
            id: a.id, opportunityId: a.opportunityId,
            cvText: a.cvText, letterText: a.letterText,
            status: a.status,
            createdAt: new Date(a.createdAt), updatedAt: new Date(a.updatedAt),
          }
        });
      } catch (e) { /* skip */ }
    }
    */

  // OpportunityTodo
  if (opportunityTodos.length > 0) {
    await pg.opportunityTodo.createMany({ data: opportunityTodos.map(t => ({
      id: t.id, opportunityId: t.opportunityId, title: t.title,
      done: !!t.done, createdAt: new Date(t.createdAt),
    }))});
    console.log('  ✅ OpportunityTodos insérés');
  }

  console.log('\n═══════════════════════════════════════════════');
  console.log('  ✅ MIGRATION TERMINÉE');
  console.log('═══════════════════════════════════════════════\n');

  // Vérifier
  const counts = {
    users: await pg.user.count(),
    profiles: await pg.profile.count(),
    opportunities: await pg.opportunity.count(),
    jobs: await pg.job.count(),
    proofs: await pg.proofEntry.count(),
    interviews: await pg.interview.count(),
    embeddings: await pg.embedding.count(),
    settings: await pg.setting.count(),
  };
  console.log('Vérification PostgreSQL :');
  console.log(JSON.stringify(counts, null, 2));

  sqliteDb.close();
  await pg.$disconnect();
}

migrate().catch(e => { console.error('Erreur:', e.message); process.exit(1); });
