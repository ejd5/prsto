import { NextResponse } from "next/server";
import { getApplicationDraft, updateApplicationDraft, markReadyToReview, approveDraft, markSent, rejectDraft, archiveDraft, regenerateDraftPart, exportDraftText, syncDocuments } from "@/lib/jobs/application-preparer";
import { isStaleContent } from "@/lib/jobs/text-sanitizer";
import { validateDraftConsistency } from "@/lib/jobs/validate-draft";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const draft = await getApplicationDraft(id);
  if (!draft) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  const validation = validateDraftConsistency(draft as Record<string, unknown>);
  const staleContent = isStaleContent(draft.tailoredResumeContent) || isStaleContent(draft.motivationLetterLong);
  return NextResponse.json({ draft, validation, staleContent });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const allowed = ["status", "jobSummary", "tailoredResumeContent", "motivationLetterLong", "motivationLetterShort",
    "applicationEmail", "recruiterMessage", "atsFormAnswers", "keyRequirements", "pipelineStatus", "excitement", "notes", "salaryMin", "salaryMax"];
  const update: Record<string, unknown> = {};
  for (const k of allowed) { if (body[k] !== undefined) update[k] = typeof body[k] === "object" ? JSON.stringify(body[k]) : body[k]; }
  if (Object.keys(update).length === 0) return NextResponse.json({ error: "Aucun champ" }, { status: 400 });
  await updateApplicationDraft(id, update);
  await syncDocuments(id);
  return NextResponse.json({ success: true });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const actions: Record<string, () => Promise<unknown>> = {
    mark_ready_to_review: () => markReadyToReview(id),
    approve: () => approveDraft(id),
    mark_sent: () => markSent(id),
    reject: () => rejectDraft(id),
    archive: () => archiveDraft(id),
  };
  if (body.action === "regenerate") {
    const r = await regenerateDraftPart(id, body.target || "all");
    await syncDocuments(id);
    return NextResponse.json(r);
  }
  if (body.action === "export") {
    const r = await exportDraftText(id, body.type || "full");
    return NextResponse.json(r ? { success: true, ...r } : { error: "Export impossible" });
  }
  if (body.action in actions) {
    const r = await actions[body.action]();
    return NextResponse.json(r as Record<string, unknown>);
  }
  return NextResponse.json({ error: "Action non reconnue" }, { status: 400 });
}
