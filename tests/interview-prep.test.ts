import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { PrismaClient } from "../app/generated/prisma";

// Mock revalidatePath — vitest n'a pas le runtime Next.js
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const prisma = new PrismaClient();

// ─── Setup / Teardown global ────────────────────────

beforeAll(async () => {
  // Créer la source d'import requise pour Job
  await prisma.importSource.upsert({
    where: { id: "test-source-ip" },
    create: { id: "test-source-ip", name: "Test Source IP", type: "api" },
    update: {},
  });

  // Créer les données de base
  await prisma.profile.upsert({
    where: { id: "test-profile-ip" },
    create: {
      id: "test-profile-ip",
      fullName: "Élton Duarte",
      title: "Directeur Commercial",
      summary: "20+ ans d'expérience en direction commerciale, développement international et pilotage d'équipes multiculturelles.",
      email: "elton@example.com",
      phone: "06 00 00 00 00",
      linkedin: "linkedin.com/in/eltond",
      location: "Nice, France",
      yearsExp: 20,
      targetSalary: "100000-140000",
      cvIncludeLinkedIn: true,
      cvIncludePhoto: true,
      experiences: {
        create: [
          { company: "GlobalSales Corp", title: "Directeur Commercial", startDate: "2020-01", endDate: "2024-12", description: "Pilotage d'une équipe de 50 commerciaux en Europe." },
          { company: "TechTrade", title: "Country Manager France", startDate: "2016-03", endDate: "2019-12", description: "Lancement et développement du marché français." },
        ],
      },
    },
    update: { fullName: "Élton Duarte" },
  });

  await prisma.job.upsert({
    where: { id: "test-job-ip" },
    create: {
      id: "test-job-ip",
      sourceId: "test-source-ip",
      title: "Directeur Commercial Europe",
      company: "TechGlobal SA",
      location: "Paris, France",
      description: "Recherche Directeur Commercial pour piloter la stratégie Europe. SaaS B2B.",
      status: "new",
    },
    update: { title: "Directeur Commercial Europe" },
  });

  await prisma.recruiterContact.upsert({
    where: { id: "test-contact-ip" },
    create: {
      id: "test-contact-ip",
      fullName: "Marie Recruteur",
      contactType: "recruiter",
      email: "marie@techglobal.com",
      companyName: "TechGlobal SA",
    },
    update: { fullName: "Marie Recruteur" },
  });
});

// ─── V2.5.2 Anti-duplication ────────────────────────

describe("InterviewPrep — V2.5.2 Anti-duplication", () => {
  beforeAll(async () => {
    await prisma.interviewPrep.deleteMany({ where: { jobId: "test-job-ip" } });
    await prisma.contactInteraction.deleteMany({ where: { jobId: "test-job-ip" } });
    await prisma.applicationDraft.upsert({
      where: { jobId: "test-job-ip" },
      create: { id: "test-draft-ip", jobId: "test-job-ip", contactId: null, status: "draft" },
      update: { contactId: null },
    });
  });

  it("double appel createInterviewPrepFromDraft ne crée pas de doublon actif", async () => {
    const { createInterviewPrepFromDraft } = await import("@/lib/jobs/interview-prep");
    const r1 = await createInterviewPrepFromDraft("test-draft-ip");
    expect(r1).toHaveProperty("success", true);
    const r2 = await createInterviewPrepFromDraft("test-draft-ip");
    expect(r2).toHaveProperty("success", true);
    if ("existed" in r2) expect(r2.existed).toBe(true);
    expect((r1 as { prepId?: string }).prepId).toBe((r2 as { prepId?: string }).prepId);
    const count = await prisma.interviewPrep.count({
      where: { applicationDraftId: "test-draft-ip", prepStatus: { in: ["draft", "ready_to_review", "approved"] } },
    });
    expect(count).toBe(1);
  });

  it("retourne la prep existante avec existed:true au deuxième appel", async () => {
    const { createInterviewPrepFromDraft } = await import("@/lib/jobs/interview-prep");
    const r = await createInterviewPrepFromDraft("test-draft-ip");
    expect(r).toHaveProperty("success", true);
    expect(r).toHaveProperty("existed", true);
  });
});

// ─── V2.5.2 updateInterviewPrep date ────────────────

describe("InterviewPrep — V2.5.2 updateInterviewPrep date", () => {
  let prepId: string;

  beforeAll(async () => {
    const prep = await prisma.interviewPrep.findFirstOrThrow({ where: { jobId: "test-job-ip" } });
    prepId = prep.id;
  });

  it("accepte string ISO valide et convertit en Date", async () => {
    const { updateInterviewPrep } = await import("@/lib/jobs/interview-prep");
    const r = await updateInterviewPrep(prepId, { interviewDate: "2026-07-15T10:00:00.000Z" });
    expect(r).toHaveProperty("success", true);
    const prep = await prisma.interviewPrep.findUniqueOrThrow({ where: { id: prepId } });
    expect(prep.interviewDate).toBeDefined();
    expect(prep.interviewDate instanceof Date).toBe(true);
    expect(prep.interviewDate?.getFullYear()).toBe(2026);
  });

  it("accepte string HTML input (YYYY-MM-DD) et convertit en Date", async () => {
    const { updateInterviewPrep } = await import("@/lib/jobs/interview-prep");
    const r = await updateInterviewPrep(prepId, { interviewDate: "2026-08-20" });
    expect(r).toHaveProperty("success", true);
    const prep = await prisma.interviewPrep.findUniqueOrThrow({ where: { id: prepId } });
    expect(prep.interviewDate?.getMonth()).toBe(7); // Août
  });

  it("ne crashe pas avec une date invalide, ignore silencieusement", async () => {
    const { updateInterviewPrep } = await import("@/lib/jobs/interview-prep");
    const r = await updateInterviewPrep(prepId, { interviewDate: "demain matin" });
    expect(r).toHaveProperty("success", true);
  });
});

// ─── V2.5.2 PipelineItem contient InterviewPrep ─────

describe("InterviewPrep — V2.5.2 Pipeline data", () => {
  it("getApplicationPipeline ne crashe pas (inclut hasInterviewPrep)", async () => {
    const { getApplicationPipeline } = await import("@/lib/jobs/application-pipeline");
    const result = await getApplicationPipeline();
    expect(result).toHaveProperty("items");
    expect(result.items.length).toBeGreaterThanOrEqual(0);
    // Chaque item doit avoir les champs V2.5.2
    for (const item of result.items.slice(0, 5)) {
      expect(item).toHaveProperty("hasInterviewPrep");
    }
  });

  it("getApplicationPipeline ne crashe pas sans InterviewPrep sur un item", async () => {
    await prisma.job.upsert({
      where: { id: "tmp-job-no-prep" },
      create: { id: "tmp-job-no-prep", sourceId: "test-source-ip", title: "No Prep Job", company: "N/A", description: "N/A", status: "new" },
      update: {},
    });
    await prisma.applicationDraft.upsert({
      where: { jobId: "tmp-job-no-prep" },
      create: { id: "tmp-draft-no-prep", jobId: "tmp-job-no-prep", status: "draft", pipelineStatus: "sent" },
      update: { pipelineStatus: "sent" },
    });
    const { getApplicationPipeline } = await import("@/lib/jobs/application-pipeline");
    const result = await getApplicationPipeline();
    expect(result).toHaveProperty("items");
    await prisma.applicationDraft.deleteMany({ where: { jobId: "tmp-job-no-prep" } });
    await prisma.job.deleteMany({ where: { id: "tmp-job-no-prep" } });
  });
});

afterAll(async () => {
  await prisma.interviewPrep.deleteMany({ where: { jobId: "test-job-ip" } });
  await prisma.interviewPrep.deleteMany({ where: { jobId: "tmp-job-nosalary" } });
  await prisma.interviewPrep.deleteMany({ where: { jobId: "test-job-crm" } });
  await prisma.contactInteraction.deleteMany({ where: { jobId: "test-job-ip" } });
  await prisma.contactInteraction.deleteMany({ where: { jobId: "tmp-job-nosalary" } });
  await prisma.contactInteraction.deleteMany({ where: { jobId: "test-job-crm" } });
  await prisma.applicationDraft.deleteMany({ where: { jobId: "test-job-ip" } });
  await prisma.applicationDraft.deleteMany({ where: { jobId: "tmp-job-nosalary" } });
  await prisma.applicationDraft.deleteMany({ where: { jobId: "test-job-crm" } });
  await prisma.applicationDraft.deleteMany({ where: { jobId: "tmp-job-no-prep" } });
  await prisma.job.deleteMany({ where: { id: "tmp-job-nosalary" } });
  await prisma.job.deleteMany({ where: { id: "test-job-crm" } });
  await prisma.job.deleteMany({ where: { id: "tmp-job-no-prep" } });
  await prisma.job.deleteMany({ where: { id: "test-job-ip" } });
  await prisma.recruiterContact.deleteMany({ where: { id: "test-contact-ip" } });
  await prisma.profile.deleteMany({ where: { id: "test-profile-ip" } });
  await prisma.profile.deleteMany({ where: { id: "tmp-nosalary" } });
  await prisma.importSource.deleteMany({ where: { id: "test-source-ip" } });
  await prisma.$disconnect();
});

// Helper : créer un draft pour le job partagé
async function ensureDraft(contactId?: string) {
  return prisma.applicationDraft.upsert({
    where: { jobId: "test-job-ip" },
    create: { id: "test-draft-ip", jobId: "test-job-ip", contactId: contactId || null, status: "draft" },
    update: { contactId: contactId || null },
  });
}

// ─── Création ────────────────────────────────────────

describe("InterviewPrep — Création", () => {
  beforeAll(async () => {
    await prisma.interviewPrep.deleteMany({ where: { jobId: "test-job-ip" } });
    await prisma.contactInteraction.deleteMany({ where: { jobId: "test-job-ip" } });
    await prisma.applicationDraft.deleteMany({ where: { jobId: "test-job-ip" } });
    await ensureDraft();
  });

  it("createInterviewPrepFromDraft crée une InterviewPrep", async () => {
    const { createInterviewPrepFromDraft } = await import("@/lib/jobs/interview-prep");
    const r = await createInterviewPrepFromDraft("test-draft-ip");
    expect(r).toHaveProperty("success", true);
    expect(r).toHaveProperty("prepId");
  });

  it("InterviewPrep est liée à ApplicationDraft", async () => {
    const prep = await prisma.interviewPrep.findFirstOrThrow({
      where: { jobId: "test-job-ip" },
      include: { applicationDraft: true },
    });
    expect(prep.applicationDraftId).toBe("test-draft-ip");
    expect(prep.applicationDraft).toBeDefined();
  });

  it("InterviewPrep est liée au Job", async () => {
    const prep = await prisma.interviewPrep.findFirstOrThrow({
      where: { jobId: "test-job-ip" },
      include: { job: true },
    });
    expect(prep.job).toBeDefined();
    expect(prep.job?.title).toBe("Directeur Commercial Europe");
  });

  it("InterviewPrep est liée au contact si ApplicationDraft.contactId existe", async () => {
    const { createInterviewPrepFromDraft } = await import("@/lib/jobs/interview-prep");
    // Mettre à jour le draft pour lier un contact
    await prisma.applicationDraft.update({ where: { id: "test-draft-ip" }, data: { contactId: "test-contact-ip" } });
    // Nettoyer et recréer
    await prisma.interviewPrep.deleteMany({ where: { jobId: "test-job-ip" } });
    await prisma.contactInteraction.deleteMany({ where: { jobId: "test-job-ip" } });
    const r = await createInterviewPrepFromDraft("test-draft-ip");
    expect(r).toHaveProperty("success", true);
    const prep = await prisma.interviewPrep.findFirstOrThrow({
      where: { jobId: "test-job-ip" },
      include: { contact: true },
    });
    expect(prep.contactId).toBe("test-contact-ip");
    expect(prep.contact?.fullName).toBe("Marie Recruteur");
  });

  it("companyName et roleTitle sont correctement renseignés", async () => {
    const prep = await prisma.interviewPrep.findFirstOrThrow({ where: { jobId: "test-job-ip" } });
    expect(prep.companyName).toBe("TechGlobal SA");
    expect(prep.roleTitle).toBe("Directeur Commercial Europe");
  });
});

// ─── Génération de contenu ──────────────────────────

describe("InterviewPrep — Génération de contenu", () => {
  beforeAll(async () => {
    // Recreate draft sans contact pour cette section
    await prisma.interviewPrep.deleteMany({ where: { jobId: "test-job-ip" } });
    await prisma.contactInteraction.deleteMany({ where: { jobId: "test-job-ip" } });
    await prisma.applicationDraft.update({ where: { id: "test-draft-ip" }, data: { contactId: null } });
    const { createInterviewPrepFromDraft } = await import("@/lib/jobs/interview-prep");
    await createInterviewPrepFromDraft("test-draft-ip");
  });

  it("pitch court non vide", async () => {
    const prep = await prisma.interviewPrep.findFirstOrThrow({ where: { jobId: "test-job-ip" } });
    expect(prep.candidatePitchShort).toBeTruthy();
    expect((prep.candidatePitchShort || "").length).toBeGreaterThan(30);
  });

  it("pitch long non vide", async () => {
    const prep = await prisma.interviewPrep.findFirstOrThrow({ where: { jobId: "test-job-ip" } });
    expect(prep.candidatePitchLong).toBeTruthy();
    expect((prep.candidatePitchLong || "").length).toBeGreaterThan(100);
  });

  it("companyBrief contient le nom de l'entreprise", async () => {
    const prep = await prisma.interviewPrep.findFirstOrThrow({ where: { jobId: "test-job-ip" } });
    expect(prep.companyBrief).toContain("TechGlobal");
  });

  it("likelyQuestionsJson contient au moins 10 questions", async () => {
    const prep = await prisma.interviewPrep.findFirstOrThrow({ where: { jobId: "test-job-ip" } });
    const q = JSON.parse(prep.likelyQuestionsJson || "[]");
    expect(q.length).toBeGreaterThanOrEqual(10);
    expect(q[0]).toHaveProperty("question");
    expect(q[0]).toHaveProperty("category");
  });

  it("starAnswersJson contient des réponses STAR structurées", async () => {
    const prep = await prisma.interviewPrep.findFirstOrThrow({ where: { jobId: "test-job-ip" } });
    const stars = JSON.parse(prep.starAnswersJson || "[]");
    expect(stars.length).toBeGreaterThanOrEqual(1);
    expect(stars[0]).toHaveProperty("situation");
    expect(stars[0]).toHaveProperty("task");
    expect(stars[0]).toHaveProperty("action");
    expect(stars[0]).toHaveProperty("result");
  });

  it("objectionsJson contient au moins 5 objections", async () => {
    const prep = await prisma.interviewPrep.findFirstOrThrow({ where: { jobId: "test-job-ip" } });
    const obj = JSON.parse(prep.objectionsJson || "[]");
    expect(obj.length).toBeGreaterThanOrEqual(5);
    expect(obj[0]).toHaveProperty("objection");
    expect(obj[0]).toHaveProperty("response");
  });

  it("questionsToAskJson contient au moins 8 questions", async () => {
    const prep = await prisma.interviewPrep.findFirstOrThrow({ where: { jobId: "test-job-ip" } });
    const q = JSON.parse(prep.questionsToAskJson || "[]");
    expect(q.length).toBeGreaterThanOrEqual(8);
  });

  it("thirtySixtyNinetyPlan contient 30, 60 et 90", async () => {
    const prep = await prisma.interviewPrep.findFirstOrThrow({ where: { jobId: "test-job-ip" } });
    const plan = prep.thirtySixtyNinetyPlan || "";
    expect(plan).toContain("30");
    expect(plan).toContain("60");
    expect(plan).toContain("90");
  });

  it("followUpEmail non vide et contient le nom du poste", async () => {
    const prep = await prisma.interviewPrep.findFirstOrThrow({ where: { jobId: "test-job-ip" } });
    expect(prep.followUpEmail).toBeTruthy();
    expect((prep.followUpEmail || "").length).toBeGreaterThan(100);
    expect(prep.followUpEmail).toContain("Directeur Commercial");
  });

  it("compensationStrategy non vide", async () => {
    const prep = await prisma.interviewPrep.findFirstOrThrow({ where: { jobId: "test-job-ip" } });
    expect(prep.compensationStrategy).toBeTruthy();
  });
});

// ─── Anti-hallucination ─────────────────────────────

describe("InterviewPrep — Anti-hallucination", () => {
  let prepTextFields: string[];

  beforeAll(async () => {
    const prep = await prisma.interviewPrep.findFirstOrThrow({ where: { jobId: "test-job-ip" } });
    prepTextFields = [
      prep.candidatePitchShort || "",
      prep.candidatePitchLong || "",
      prep.companyBrief || "",
      prep.compensationStrategy || "",
      prep.followUpEmail || "",
      prep.thirtySixtyNinetyPlan || "",
    ];
  });

  it("aucun Markdown dans les champs texte", () => {
    for (const field of prepTextFields) {
      expect(field).not.toContain("###");
      expect(field).not.toContain("**");
      expect(field).not.toContain("```");
    }
  });

  it("aucun placeholder type [Nom entreprise] ou [Votre nom]", () => {
    for (const field of prepTextFields) {
      expect(field).not.toMatch(/\[.*?\]/);
    }
  });

  it("aucun placeholder type {{company}} ou {{candidate}}", () => {
    for (const field of prepTextFields) {
      expect(field).not.toMatch(/\{\{.*?\}\}/);
    }
  });

  it("aucun diplôme/salaire/chiffre inventé dans le contenu", () => {
    const flat = prepTextFields.join(" ");
    expect(flat).not.toContain("HEC");
    expect(flat).not.toContain("INSEAD");
    expect(flat).not.toContain("MBA");
    expect(flat).not.toContain("Polytechnique");
    expect(flat).not.toContain("X+");
    expect(flat).not.toContain("M+");
  });

  it("contenu utilise le nom du candidat du profil (pas un placeholder)", () => {
    const text = prepTextFields[0] + prepTextFields[1];
    expect(text).toMatch(/Élton|ELTON/i);
    expect(text).not.toContain("[Candidat]");
    expect(text).not.toContain("[Votre nom]");
  });

  it("rémunération invalide → phrase neutre (targetSalary=null ou vide)", async () => {
    // Sauvegarder l'ancien targetSalary du profil principal
    const mainProfile = await prisma.profile.findFirstOrThrow();
    const originalSalary = mainProfile.targetSalary;
    // Mettre targetSalary à null pour tester le comportement sans salaire
    await prisma.profile.update({ where: { id: mainProfile.id }, data: { targetSalary: null } });
    // Nettoyer et recréer une prep
    const draft = await prisma.applicationDraft.findFirst({ where: { jobId: "test-job-ip" } });
    if (!draft) return;
    await prisma.interviewPrep.deleteMany({ where: { jobId: "test-job-ip" } });
    await prisma.contactInteraction.deleteMany({ where: { jobId: "test-job-ip" } });
    const { createInterviewPrepFromDraft } = await import("@/lib/jobs/interview-prep");
    const r = await createInterviewPrepFromDraft(draft.id);
    if ("success" in r && r.success) {
      const prep = await prisma.interviewPrep.findUnique({ where: { id: r.prepId } });
      const strat = prep?.compensationStrategy || "";
      expect(strat).toMatch(/préfère|valider|périmètre/);
    }
    // Restaurer le targetSalary original
    await prisma.profile.update({ where: { id: mainProfile.id }, data: { targetSalary: originalSalary } });
  });
});

// ─── Update / Statut ────────────────────────────────

describe("InterviewPrep — Update et statut", () => {
  let prepId: string;

  beforeAll(async () => {
    const prep = await prisma.interviewPrep.findFirstOrThrow({ where: { jobId: "test-job-ip" } });
    prepId = prep.id;
  });

  it("updateInterviewPrep modifie notes", async () => {
    const { updateInterviewPrep } = await import("@/lib/jobs/interview-prep");
    const r = await updateInterviewPrep(prepId, { notes: "Préparer argumentaire pricing." });
    expect(r).toHaveProperty("success", true);
    const updated = await prisma.interviewPrep.findUniqueOrThrow({ where: { id: prepId } });
    expect(updated.notes).toBe("Préparer argumentaire pricing.");
  });

  it("updateInterviewPrep modifie interviewStage", async () => {
    const { updateInterviewPrep } = await import("@/lib/jobs/interview-prep");
    const r = await updateInterviewPrep(prepId, { interviewStage: "hiring_manager" });
    expect(r).toHaveProperty("success", true);
    const updated = await prisma.interviewPrep.findUniqueOrThrow({ where: { id: prepId } });
    expect(updated.interviewStage).toBe("hiring_manager");
  });

  it("approve passe prepStatus à approved", async () => {
    const { approveInterviewPrep } = await import("@/lib/jobs/interview-prep");
    const r = await approveInterviewPrep(prepId);
    expect(r).toHaveProperty("success", true);
    const updated = await prisma.interviewPrep.findUniqueOrThrow({ where: { id: prepId } });
    expect(updated.prepStatus).toBe("approved");
  });

  it("archive passe prepStatus à archived", async () => {
    const { archiveInterviewPrep } = await import("@/lib/jobs/interview-prep");
    const r = await archiveInterviewPrep(prepId);
    expect(r).toHaveProperty("success", true);
    const updated = await prisma.interviewPrep.findUniqueOrThrow({ where: { id: prepId } });
    expect(updated.prepStatus).toBe("archived");
  });
});

// ─── Sémantique CRM ─────────────────────────────────

describe("InterviewPrep — Sémantique CRM", () => {
  let crmContactId: string;
  let crmDraftId: string;

  beforeAll(async () => {
    const crmContact = await prisma.recruiterContact.create({
      data: { fullName: "CRM Test Recruiter", contactType: "recruiter", email: "crm-test@example.com" },
    });
    crmContactId = crmContact.id;
    await prisma.job.upsert({
      where: { id: "test-job-crm" },
      create: { id: "test-job-crm", sourceId: "test-source-ip", title: "CRM Test Job", company: "CRM Co", description: "Test CRM", status: "new" },
      update: {},
    });
    const draft = await prisma.applicationDraft.upsert({
      where: { jobId: "test-job-crm" },
      create: { id: "test-draft-crm", jobId: "test-job-crm", contactId: crmContactId, status: "draft" },
      update: { contactId: crmContactId },
    });
    crmDraftId = draft.id;
  });

  afterAll(async () => {
    await prisma.interviewPrep.deleteMany({ where: { jobId: "test-job-crm" } });
    await prisma.contactInteraction.deleteMany({ where: { jobId: "test-job-crm" } });
    await prisma.applicationDraft.deleteMany({ where: { jobId: "test-job-crm" } });
    await prisma.recruiterContact.deleteMany({ where: { id: crmContactId } });
    await prisma.job.deleteMany({ where: { id: "test-job-crm" } });
  });

  it("la fonction createInterviewPrepFromDraft crée bien une prep pour un draft avec contact", async () => {
    const { createInterviewPrepFromDraft } = await import("@/lib/jobs/interview-prep");
    const r = await createInterviewPrepFromDraft(crmDraftId);
    // La prep doit être créée avec succès
    expect(r).toHaveProperty("success", true);
    expect(r).toHaveProperty("prepId");
    // Vérifier que la prep existe en base
    if ("success" in r && r.success) {
      const prep = await prisma.interviewPrep.findUnique({ where: { id: r.prepId } });
      expect(prep).toBeDefined();
      expect(prep?.contactId).toBe(crmContactId);
    }
  });

  it("toute interaction créée automatiquement est de type note (pas interview)", async () => {
    // Vérifier que si des interactions existent, elles sont de type note
    const interactions = await prisma.contactInteraction.findMany({
      where: { jobId: "test-job-crm" },
    });
    for (const ix of interactions) {
      expect(ix.type).toBe("note");
      expect(ix.direction).toBe("internal_note");
      expect(ix.subject || "").toContain("créée");
      expect(ix.subject || "").toContain("non encore réalisé");
      expect(ix.subject || "").not.toMatch(/entretien (effectué|réalisé|passé|eu lieu|complété)/i);
    }
  });

  it("un interaction de type 'interview' ne serait PAS appropriée pour une préparation", async () => {
    // Test d'intégrité : créer manuellement une interaction "interview" puis vérifier
    // que le code de production (createInterviewPrepFromDraft) utilise "note"
    const { createInterviewPrepFromDraft } = await import("@/lib/jobs/interview-prep");
    // Supprimer les anciennes interactions et preps
    await prisma.contactInteraction.deleteMany({ where: { jobId: "test-job-crm" } });
    await prisma.interviewPrep.deleteMany({ where: { jobId: "test-job-crm" } });
    // Recréer la prep
    await createInterviewPrepFromDraft(crmDraftId);
    // Vérifier toutes les interactions créées
    const allIx = await prisma.contactInteraction.findMany({
      where: { jobId: "test-job-crm" },
    });
    const interviewIx = allIx.filter((ix) => ix.type === "interview");
    // Aucune interaction de type "interview" ne doit être créée
    expect(interviewIx.length).toBe(0);
  });

  it("ne marque PAS automatiquement pipelineStatus=interview", async () => {
    const draft = await prisma.applicationDraft.findUnique({ where: { id: crmDraftId } });
    expect(draft?.pipelineStatus).not.toBe("interview");
  });
});

// ─── Requêtes CRUD ──────────────────────────────────

describe("InterviewPrep — CRUD", () => {
  it("getInterviewPrep retourne une prep avec ses relations job et applicationDraft", async () => {
    const { getInterviewPrep } = await import("@/lib/jobs/interview-prep");
    const prep = await prisma.interviewPrep.findFirst({ where: { jobId: "test-job-ip" } });
    if (!prep) throw new Error("Aucune InterviewPrep trouvée");
    const detail = await getInterviewPrep(prep.id);
    expect(detail).toBeDefined();
    expect(detail?.job).toBeDefined();
    expect(detail?.applicationDraft).toBeDefined();
  });

  it("listInterviewPreps retourne une liste avec au moins un élément", async () => {
    const { listInterviewPreps } = await import("@/lib/jobs/interview-prep");
    const list = await listInterviewPreps();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThanOrEqual(1);
    expect(list[0]?.job).toBeDefined();
  });

  it("retourne null pour un ID inexistant", async () => {
    const { getInterviewPrep } = await import("@/lib/jobs/interview-prep");
    const result = await getInterviewPrep("nonexistent-id-12345678");
    expect(result).toBeNull();
  });

  it("createInterviewPrepFromDraft échoue si draft introuvable", async () => {
    const { createInterviewPrepFromDraft } = await import("@/lib/jobs/interview-prep");
    const r = await createInterviewPrepFromDraft("nonexistent-draft-id");
    expect(r).toHaveProperty("error");
  });
});
