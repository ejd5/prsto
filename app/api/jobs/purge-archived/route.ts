import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * DELETE /api/jobs/purge-archived
 * Supprime définitivement toutes les offres archivées et leurs données liées.
 */
export async function DELETE() {
  try {
    const archived = await prisma.job.findMany({
      where: { status: "archived" },
      select: { id: true },
    });

    const ids = archived.map((j) => j.id);
    if (ids.length === 0) {
      return NextResponse.json({ success: true, purged: 0 });
    }

    // 1. Supprimer les scores
    await prisma.jobScore.deleteMany({ where: { jobId: { in: ids } } });

    // 2. Supprimer les drafts liés
    await prisma.applicationDraft.deleteMany({ where: { jobId: { in: ids } } });

    // 3. Supprimer les jobs archivés
    await prisma.job.deleteMany({ where: { id: { in: ids } } });

    return NextResponse.json({ success: true, purged: ids.length });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 },
    );
  }
}
