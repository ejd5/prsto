import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/jobs/[id]/triage
 * Actions de triage sur une offre importée.
 * Body: { action: "keep" | "delete" }
 *
 * - keep: marque le job comme "shortlisted" et enlève le draft du pipeline
 * - delete: supprime le job ET son ApplicationDraft (cascade)
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const body = await request.json().catch(() => ({}));
    const action = (body.action as string || "").trim();

    if (action === "delete") {
      // Vérifier que le job existe
      const job = await prisma.job.findUnique({ where: { id } });
      if (!job) return NextResponse.json({ success: false, error: "Offre introuvable" }, { status: 404 });

      // Le draft sera supprimé en cascade (onDelete: Cascade sur ApplicationDraft.jobId)
      await prisma.job.delete({ where: { id } });

      return NextResponse.json({ success: true, action: "deleted" });
    }

    if (action === "keep") {
      const job = await prisma.job.findUnique({ where: { id } });
      if (!job) return NextResponse.json({ success: false, error: "Offre introuvable" }, { status: 404 });

      // Marquer le job comme shortlisted
      await prisma.job.update({ where: { id }, data: { status: "shortlisted" } });

      // Sortir le draft du pipeline (pipelineStatus = null)
      const draft = await prisma.applicationDraft.findUnique({ where: { jobId: id } });
      if (draft) {
        await prisma.applicationDraft.update({
          where: { id: draft.id },
          data: { pipelineStatus: null },
        });
      }

      return NextResponse.json({ success: true, action: "kept" });
    }

    return NextResponse.json({ success: false, error: "Action inconnue. Utiliser 'keep' ou 'delete'." }, { status: 400 });
  } catch (e: unknown) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
  }
}
