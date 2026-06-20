import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { prepareApplication } from "@/lib/jobs/application-preparer";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Vérifier que le job existe
  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) {
    return NextResponse.json({ error: "Offre introuvable" }, { status: 404 });
  }

  try {
    const result = await prepareApplication(id);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Échec de la génération" }, { status: 500 });
    }
    return NextResponse.json({ success: true, draftId: result.draftId });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}
