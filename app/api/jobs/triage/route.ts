import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const drafts = await prisma.applicationDraft.findMany({
      where: { pipelineStatus: "imported" },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
            sourceUrl: true,
            source: { select: { name: true, type: true } },
            contractType: true,
            status: true,
          },
        },
      },
      orderBy: { lastPipelineActionAt: "desc" },
    });

    const items = drafts.map((d) => ({
      draftId: d.id,
      jobId: d.jobId,
      title: d.job.title,
      company: d.job.company,
      location: d.job.location,
      sourceUrl: d.job.sourceUrl,
      sourceName: d.job.source?.name ?? null,
      sourceType: d.job.source?.type ?? null,
      contractType: d.job.contractType,
      jobStatus: d.job.status,
      importedAt: d.lastPipelineActionAt?.toISOString() ?? null,
    }));

    return NextResponse.json({ success: true, items, total: items.length });
  } catch (e: unknown) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
  }
}
