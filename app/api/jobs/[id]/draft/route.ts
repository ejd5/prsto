import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  // Créer un brouillon de candidature
  const draft = await prisma.applicationDraft.upsert({
    where: { jobId: id },
    create: { jobId: id, status: "draft" },
    update: {},
  });

  return NextResponse.json({ success: true, draft });
}
