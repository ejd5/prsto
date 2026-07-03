const { PrismaClient } = require('../app/generated/prisma');
process.env.DATABASE_URL = "postgresql://neondb_owner:npg_eD81irYCovjb@ep-dawn-star-ab2wpk8t.eu-west-2.aws.neon.tech/neondb?sslmode=require";
const pg = new PrismaClient();
const Database = require('better-sqlite3');
const db = new Database('./prisma/dev.db', { readonly: true });

function read(name) {
  try { return db.prepare(`SELECT * FROM "${name}"`).all(); }
  catch { return []; }
}

async function run() {
  console.log('📥 Lecture SQLite...');
  const users = read('User'); console.log(`  Users: ${users.length}`);
  const profiles = read('Profile'); console.log(`  Profiles: ${profiles.length}`);
  const skills = read('Skill').filter(s => profiles.some(p => p.id === s.profileId)); console.log(`  Skills (valid): ${skills.length}`);
  const cvMaster = read('CVMaster'); console.log(`  CVMaster: ${cvMaster.length}`);
  const proofs = read('ProofEntry'); console.log(`  ProofEntries: ${proofs.length}`);
  const opportunities = read('Opportunity'); console.log(`  Opportunities: ${opportunities.length}`);
  const interviews = read('Interview'); console.log(`  Interviews: ${interviews.length}`);
  const settings = read('Setting'); console.log(`  Settings: ${settings.length}`);
  const embeddings = read('Embedding'); console.log(`  Embeddings: ${embeddings.length}`);

  console.log('\n📤 Insertion PostgreSQL...');

  // Users
  for (const u of users) {
    await pg.user.upsert({ where: { id: u.id }, create: {
      id: u.id, email: u.email, name: u.name, password: u.password,
      role: u.role, plan: u.plan, company: u.company, phone: u.phone,
      createdAt: new Date(u.createdAt), updatedAt: new Date(u.updatedAt),
    }, update: {} });
  }
  console.log('  ✅ Users');

  // Profiles
  for (const p of profiles) {
    await pg.profile.upsert({ where: { id: p.id }, create: {
      id: p.id, fullName: p.fullName, title: p.title, summary: p.summary || '',
      sectors: p.sectors, functions: p.functions, languages: p.languages,
      yearsExp: p.yearsExp, phone: p.phone, location: p.location,
      targetSalary: p.targetSalary,
      createdAt: new Date(p.createdAt), updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
    }, update: {} });
  }
  console.log('  ✅ Profiles');

  // Skills
  for (const s of skills) {
    await pg.skill.upsert({ where: { id: s.id }, create: {
      id: s.id, profileId: s.profileId, name: s.name, level: s.level,
      category: s.category, source: s.source,
      createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
    }, update: {} });
  }
  console.log('  ✅ Skills');

  // CVMaster
  for (const c of cvMaster) {
    await pg.cVMaster.upsert({ where: { id: c.id }, create: {
      id: c.id, profileId: c.profileId, fileName: c.fileName,
      originalText: c.originalText, parsedJson: c.parsedJson,
      fileType: c.fileType, fileSize: c.fileSize, status: c.status,
      uploadedAt: new Date(c.uploadedAt),
    }, update: {} });
  }
  console.log('  ✅ CVMaster');

  // ProofEntry
  for (const p of proofs) {
    await pg.proofEntry.upsert({ where: { id: p.id }, create: {
      id: p.id, profileId: p.profileId, experienceId: p.experienceId,
      category: p.category, title: p.title, value: p.value,
      context: p.context, period: p.period, confidence: p.confidence,
      verifiable: !!p.verifiable, isConfidential: !!p.isConfidential,
      usableForCV: !!p.usableForCV, usableForLetter: !!p.usableForLetter,
      sendableToAI: !!p.sendableToAI, documentUrl: p.documentUrl,
      createdAt: new Date(p.createdAt),
    }, update: {} });
  }
  console.log('  ✅ ProofEntries');

  // Opportunities
  for (const o of opportunities) {
    try { await pg.opportunity.upsert({ where: { id: o.id }, create: {
      id: o.id, title: o.title, company: o.company, location: o.location,
      country: o.country, sourceUrl: o.sourceUrl, sourceName: o.sourceName,
      rawText: o.rawText, salaryMin: o.salaryMin, salaryMax: o.salaryMax,
      salaryCurrency: o.salaryCurrency || 'EUR', contractType: o.contractType,
      remote: o.remote, status: o.status, score: o.score, priority: o.priority,
      notes: o.notes, appliedAt: o.appliedAt ? new Date(o.appliedAt) : null,
      createdAt: new Date(o.createdAt), updatedAt: o.updatedAt ? new Date(o.updatedAt) : new Date(),
    }, update: {} });
    } catch (e) {}
  }
  console.log('  ✅ Opportunities');

  // Interviews
  for (const i of interviews) {
    await pg.interview.upsert({ where: { id: i.id }, create: {
      id: i.id, type: i.type, date: i.date ? new Date(i.date) : null,
      interviewer: i.interviewer, notes: i.notes, questions: i.questions,
      strengths: i.strengths, weaknesses: i.weaknesses, nextSteps: i.nextSteps,
      preparation: i.preparation, sections: i.sections, status: i.status,
      createdAt: new Date(i.createdAt),
    }, update: {} });
  }
  console.log('  ✅ Interviews');

  // Settings
  for (const s of settings) {
    await pg.setting.upsert({ where: { id: s.id }, create: {
      id: s.id, aiProvider: s.aiProvider, apiKey: s.apiKey,
      baseUrl: s.baseUrl, defaultModel: s.defaultModel, proModel: s.proModel,
      timeout: s.timeout, temperature: s.temperature,
      createdAt: new Date(s.createdAt), updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date(),
    }, update: {} });
  }
  console.log('  ✅ Settings');

  // Embeddings
  for (const e of embeddings) {
    await pg.embedding.upsert({ where: { id: e.id }, create: {
      id: e.id, entityType: e.entityType, entityId: e.entityId,
      content: e.content, embedding: e.embedding, model: e.model,
      dimensions: e.dimensions,
      createdAt: new Date(e.createdAt), updatedAt: new Date(e.updatedAt),
    }, update: {} });
  }
  console.log('  ✅ Embeddings');

  console.log('\n✅ MIGRATION TERMINÉE');
  const counts = {
    users: await pg.user.count(),
    profiles: await pg.profile.count(),
    opportunities: await pg.opportunity.count(),
    proofs: await pg.proofEntry.count(),
    embeddings: await pg.embedding.count(),
    settings: await pg.setting.count(),
  };
  console.log('Vérification:', JSON.stringify(counts, null, 2));
  db.close();
  await pg.$disconnect();
}
run().catch(e => console.error('Erreur:', e.message));
