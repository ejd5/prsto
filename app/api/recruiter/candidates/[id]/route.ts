import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;

  const candidate = await prisma.candidate.findFirst({
    where: { id, userId: session.userId },
  });

  if (!candidate) {
    return NextResponse.json({ error: "Candidat introuvable" }, { status: 404 });
  }

  return NextResponse.json({ success: true, candidate });
}
