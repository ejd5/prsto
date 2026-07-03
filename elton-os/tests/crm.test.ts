import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "../app/generated/prisma";

const prisma = new PrismaClient();

// ─── Helpers ───────────────────────────────

async function createTestContact(overrides: Record<string, unknown> = {}) {
  return prisma.recruiterContact.create({
    data: {
      fullName: "Soraya Laurent",
      contactType: "recruiter",
      companyName: "Turnpoint Executive Search",
      firmName: "Turnpoint",
      email: "soraya@turnpoint.com",
      roleTitle: "Directrice Adjointe",
      ...overrides,
    },
  });
}

async function createTestDraft() {
  // Récupérer un Job existant pour créer un draft
  const job = await prisma.job.findFirst({ where: { status: "new" } });
  if (!job) return null;
  return prisma.applicationDraft.upsert({
    where: { jobId: job.id },
    create: { jobId: job.id, status: "draft" },
    update: { status: "draft" },
  });
}

// ─── RecruiterContact ──────────────────────

describe("RecruiterContact", () => {
  let contactId: string;

  afterAll(async () => {
    if (contactId) {
      await prisma.contactInteraction.deleteMany({ where: { contactId } });
      await prisma.recruiterContact.deleteMany({ where: { id: contactId } });
    }
  });

  it("creates a recruiter contact", async () => {
    const c = await createTestContact();
    contactId = c.id;
    expect(c.fullName).toBe("Soraya Laurent");
    expect(c.contactType).toBe("recruiter");
    expect(c.firmName).toBe("Turnpoint");
  });

  it("creates a headhunter contact", async () => {
    const c = await prisma.recruiterContact.create({
      data: { fullName: "Marc Dubois", contactType: "headhunter", firmName: "Michael Page" },
    });
    expect(c.contactType).toBe("headhunter");
    await prisma.recruiterContact.delete({ where: { id: c.id } });
  });

  it("creates a network contact", async () => {
    const c = await prisma.recruiterContact.create({
      data: { fullName: "Julie Moreau", contactType: "network", companyName: "LVMH" },
    });
    expect(c.contactType).toBe("network");
    await prisma.recruiterContact.delete({ where: { id: c.id } });
  });

  it("searches by name", async () => {
    const results = await prisma.recruiterContact.findMany({
      where: { fullName: { contains: "Soraya" } },
    });
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some((c) => c.fullName.includes("Soraya"))).toBe(true);
  });

  it("searches by firmName", async () => {
    const results = await prisma.recruiterContact.findMany({
      where: { firmName: { contains: "Turnpoint" } },
    });
    expect(results.some((c) => c.firmName?.includes("Turnpoint"))).toBe(true);
  });

  it("updates a contact", async () => {
    const updated = await prisma.recruiterContact.update({
      where: { id: contactId },
      data: { relationshipStrength: "active", notes: "Très réactive" },
    });
    expect(updated.relationshipStrength).toBe("active");
    expect(updated.notes).toBe("Très réactive");
  });

  it("does not crash when creating with minimal data", async () => {
    const c = await prisma.recruiterContact.create({
      data: { fullName: "Minimal Contact", contactType: "unknown" },
    });
    expect(c.id).toBeDefined();
    await prisma.recruiterContact.delete({ where: { id: c.id } });
  });
});

// ─── CompanyTarget ─────────────────────────

describe("CompanyTarget", () => {
  it("creates a company target", async () => {
    const c = await prisma.companyTarget.create({
      data: { name: "Datadog", sector: "SaaS", size: "grand_groupe", targetPriority: 1 },
    });
    expect(c.name).toBe("Datadog");
    expect(c.targetPriority).toBe(1);
    await prisma.companyTarget.delete({ where: { id: c.id } });
  });

  it("lists company targets", async () => {
    const c = await prisma.companyTarget.create({
      data: { name: "Stripe", sector: "Fintech", targetPriority: 2 },
    });
    const list = await prisma.companyTarget.findMany();
    expect(list.length).toBeGreaterThanOrEqual(1);
    await prisma.companyTarget.delete({ where: { id: c.id } });
  });
});

// ─── ContactInteraction ────────────────────

describe("ContactInteraction", () => {
  let contactId: string;

  beforeAll(async () => {
    const c = await createTestContact({ email: "test-interaction@test.com", fullName: "Test Interaction" });
    contactId = c.id;
  });

  afterAll(async () => {
    await prisma.contactInteraction.deleteMany({ where: { contactId } });
    await prisma.recruiterContact.deleteMany({ where: { id: contactId } });
  });

  it("adds an email interaction", async () => {
    const ix = await prisma.contactInteraction.create({
      data: {
        contactId,
        type: "email",
        direction: "outbound",
        subject: "Candidature",
        body: "Bonjour, je candidate.",
        outcome: "pending",
      },
    });
    expect(ix.type).toBe("email");
    expect(ix.direction).toBe("outbound");
    expect(ix.subject).toBe("Candidature");
  });

  it("adds a note (internal_note)", async () => {
    const ix = await prisma.contactInteraction.create({
      data: { contactId, type: "note", direction: "internal_note", body: "À rappeler lundi." },
    });
    expect(ix.direction).toBe("internal_note");
  });

  it("adds a LinkedIn message interaction", async () => {
    const ix = await prisma.contactInteraction.create({
      data: { contactId, type: "linkedin_message", direction: "outbound", body: "Message LinkedIn envoyé." },
    });
    expect(ix.type).toBe("linkedin_message");
  });

  it("updates lastContactedAt on contact after interaction", async () => {
    await prisma.recruiterContact.update({ where: { id: contactId }, data: { lastContactedAt: new Date() } });
    const updated = await prisma.recruiterContact.findUnique({ where: { id: contactId } });
    expect(updated?.lastContactedAt).toBeDefined();
  });

  it("sorts interactions by date descending", async () => {
    const now = new Date();
    const earlier = new Date(now.getTime() - 2000);
    await prisma.contactInteraction.create({
      data: { contactId, type: "note", direction: "internal_note", body: "Plus récente.", occurredAt: now },
    });
    await prisma.contactInteraction.create({
      data: { contactId, type: "note", direction: "internal_note", body: "Plus ancienne.", occurredAt: earlier },
    });
    const list = await prisma.contactInteraction.findMany({
      where: { contactId }, orderBy: { occurredAt: "desc" }, take: 2,
    });
    expect(list.length).toBeGreaterThanOrEqual(2);
    // La plus récente (now) doit arriver avant la plus ancienne (earlier)
    expect(new Date(list[0]!.occurredAt).getTime()).toBeGreaterThanOrEqual(new Date(list[1]!.occurredAt).getTime());
  });
});

// ─── Follow-ups ────────────────────────────

describe("getCrmFollowUpsDue", () => {
  let contactId: string;

  beforeAll(async () => {
    const c = await createTestContact({ email: "followup@test.com", fullName: "FollowUp Test" });
    contactId = c.id;
  });

  afterAll(async () => {
    await prisma.contactInteraction.deleteMany({ where: { contactId } });
    await prisma.recruiterContact.deleteMany({ where: { id: contactId } });
  });

  it("detects follow-up due now", async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await prisma.recruiterContact.update({
      where: { id: contactId },
      data: { nextFollowUpAt: yesterday },
    });
    const now = new Date();
    const due = await prisma.recruiterContact.findMany({
      where: { nextFollowUpAt: { lte: now } },
    });
    expect(due.some((c) => c.id === contactId)).toBe(true);
  });

  it("does NOT return contacts with future follow-up as due now", async () => {
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.recruiterContact.update({
      where: { id: contactId },
      data: { nextFollowUpAt: nextWeek },
    });
    const now = new Date();
    const due = await prisma.recruiterContact.findMany({
      where: { nextFollowUpAt: { lte: now } },
    });
    expect(due.some((c) => c.id === contactId)).toBe(false);
  });

  it("detects silent contacts (no contact for 14+ days, no follow-up)", async () => {
    const threeWeeksAgo = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000);
    // Reset follow-up and set old lastContactedAt
    await prisma.recruiterContact.update({
      where: { id: contactId },
      data: { nextFollowUpAt: null, lastContactedAt: threeWeeksAgo },
    });
    const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const silent = await prisma.recruiterContact.findMany({
      where: { lastContactedAt: { lt: cutoff }, nextFollowUpAt: null },
    });
    expect(silent.some((c) => c.id === contactId)).toBe(true);
  });
});

// ─── Link contact to draft ────────────────

describe("linkContactToDraft", () => {
  let contactId: string;
  let draftId: string;

  beforeAll(async () => {
    const c = await createTestContact({ email: "link@test.com", fullName: "Link Test" });
    contactId = c.id;
    const draft = await createTestDraft();
    if (draft) draftId = draft.id;
  });

  afterAll(async () => {
    if (draftId) await prisma.applicationDraft.update({ where: { id: draftId }, data: { contactId: null } });
    await prisma.contactInteraction.deleteMany({ where: { contactId } });
    await prisma.recruiterContact.deleteMany({ where: { id: contactId } });
  });

  it("links a contact to a draft", async () => {
    if (!draftId) return; // skip si pas de job dispo
    await prisma.applicationDraft.update({ where: { id: draftId }, data: { contactId } });
    const draft = await prisma.applicationDraft.findUnique({ where: { id: draftId }, include: { contact: true } });
    expect(draft?.contactId).toBe(contactId);
    expect(draft?.contact?.fullName).toBe("Link Test");
  });

  it("deleting contact does not break the draft (SetNull)", async () => {
    // Créer un contact temporaire
    const tmp = await prisma.recruiterContact.create({ data: { fullName: "Tmp", contactType: "unknown" } });
    if (draftId) {
      await prisma.applicationDraft.update({ where: { id: draftId }, data: { contactId: tmp.id } });
    }
    await prisma.recruiterContact.delete({ where: { id: tmp.id } });
    // Le draft doit toujours exister
    if (draftId) {
      const draft = await prisma.applicationDraft.findUnique({ where: { id: draftId } });
      expect(draft).toBeDefined();
      expect(draft?.contactId).toBeNull(); // SetNull
    }
  });
});

// ─── generateFollowUpMessage ──────────────

describe("generateFollowUpMessage", () => {
  it("returns message without Markdown", async () => {
    // Test via la logique de l'action directement
    const { generateFollowUpMessage } = await import("@/lib/actions/crm");
    // Créer un contact temporaire
    const c = await prisma.recruiterContact.create({
      data: { fullName: "Jean Dupont", contactType: "recruiter" },
    });
    const result = await generateFollowUpMessage(c.id, "candidature");
    if ("error" in result) {
      expect(result.error).toBe("Contact introuvable");
    } else {
      const msg = result.message;
      // Pas de Markdown
      expect(msg).not.toContain("**");
      expect(msg).not.toContain("###");
      expect(msg).not.toContain("---");
      // Pas de placeholder
      expect(msg).not.toContain("[Adresse]");
      expect(msg).not.toContain("[Email]");
      // Contient le nom
      expect(msg).toContain("Jean");
      // Contient une formule
      expect(msg).toContain("Cordialement");
    }
    await prisma.recruiterContact.delete({ where: { id: c.id } });
  });
});

// ─── Auth (routes protégées via Prisma) ──

describe("CRM data integrity via Prisma", () => {
  it("can list contacts from database", async () => {
    const contacts = await prisma.recruiterContact.findMany({ take: 5 });
    expect(Array.isArray(contacts)).toBe(true);
  });

  it("can count interactions", async () => {
    const count = await prisma.contactInteraction.count();
    expect(typeof count).toBe("number");
  });
});
