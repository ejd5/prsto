import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const EMAIL_REGEX = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

function maskEmail(text: string): string {
  return text.replace(EMAIL_REGEX, (match) => {
    const [user, domain] = match.split("@");
    if (user.length <= 2) return "***@" + domain;
    return user[0] + "***@" + domain;
  });
}

// Helper: trouver ou créer une Opportunity correspondant au Job
async function findOrCreateOpportunity(job: {
  id: string;
  title: string;
  company: string | null;
  location: string | null;
  sourceUrl: string | null;
  sourceName?: string | null;
}): Promise<string | null> {
  const existing = await prisma.opportunity.findFirst({
    where: { title: job.title, company: job.company || "" },
    select: { id: true },
  });
  if (existing) return existing.id;

  try {
    const created = await prisma.opportunity.create({
      data: {
        title: job.title,
        company: job.company || "",
        location: job.location || null,
        sourceUrl: job.sourceUrl || null,
        sourceName: job.sourceName || "import_manuel",
        rawText: "", // requis par le schéma
        status: "postule",
      },
    });
    return created.id;
  } catch {
    return null;
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const body = await request.json().catch(() => ({}));
  const { platform, confirmationUrl, confirmationText, submittedAt, source, confidence } = body;

  if (!platform || !confirmationUrl || !confidence) {
    return NextResponse.json({ error: "Champs requis : platform, confirmationUrl, confidence" }, { status: 400 });
  }

  const draft = await prisma.applicationDraft.findUnique({ where: { id } });
  if (!draft) {
    return NextResponse.json({ error: "Draft introuvable" }, { status: 404 });
  }

  // Idempotent : ne pas recréer si déjà submitted
  const existingLogs = draft.generationLogs ? JSON.parse(draft.generationLogs) : [];
  const alreadySubmitted = Array.isArray(existingLogs)
    ? existingLogs.some((l: { type?: string }) => l.type === "application_submitted")
    : false;

  if (!alreadySubmitted) {
    // Nettoyer le texte de confirmation
    const cleanText = maskEmail(confirmationText || "").slice(0, 500);

    // Mettre à jour le statut
    await prisma.applicationDraft.update({
      where: { id },
      data: {
        status: "sent",
        sentAt: new Date(submittedAt || new Date().toISOString()),
        pipelineStatus: "sent",
      },
    });

    // Créer une relance J+7
    try {
      const job = await prisma.job.findUnique({ where: { id: draft.jobId } });
      if (job) {
        const opportunityId = await findOrCreateOpportunity(job);
        if (opportunityId) {
          const followUpDate = new Date();
          followUpDate.setDate(followUpDate.getDate() + 7);
          await prisma.relance.create({
            data: {
              opportunityId,
              type: "email",
              status: "a_envoyer",
              date: followUpDate,
              scheduledDate: followUpDate,
              notes: `Relance candidature — envoyée via ${platform} le ${new Date(submittedAt || Date.now()).toLocaleDateString("fr-FR")}`,
            },
          });
        }
      }
    } catch { /* relance non-bloquante */ }

    // Ajouter au changelog
    const changelog = draft.changeLogJson ? JSON.parse(draft.changeLogJson) : [];
    changelog.push({
      timestamp: new Date().toISOString(),
      type: "application_submitted",
      summary: `Candidature soumise via ${platform} (détection post-apply). ${cleanText}`,
      actor: "chrome_extension",
      source,
      confidence,
    });
    if (changelog.length > 50) changelog.splice(0, changelog.length - 50);
    await prisma.applicationDraft.update({
      where: { id },
      data: { changeLogJson: JSON.stringify(changelog), followUpDueAt: new Date(Date.now() + 7 * 86400000).toISOString() },
    });
  } // fin !alreadySubmitted

  // Mettre à jour le log de détection (toujours, même si déjà submitted)
  const postApplyLog = {
    type: "post_apply_detection",
    platform,
    confirmationUrl,
    confirmationText: maskEmail(confirmationText || ""),
    detectedAt: new Date().toISOString(),
    source: source || "chrome_extension",
    confidence,
  };

  const genLogs = draft.generationLogs ? JSON.parse(draft.generationLogs) : [];
  const logs = Array.isArray(genLogs) ? genLogs : [genLogs];
  logs.push(postApplyLog);
  if (logs.length > 100) logs.splice(0, logs.length - 100);
  await prisma.applicationDraft.update({
    where: { id },
    data: { generationLogs: JSON.stringify(logs) },
  });

  return NextResponse.json({
    success: true,
    alreadySubmitted,
    submittedAt: draft.sentAt || new Date().toISOString(),
    platform,
  });
}
