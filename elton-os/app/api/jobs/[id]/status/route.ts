import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await _request.json();
  const { status } = body;

  const validStatuses = ["new", "enriched", "shortlisted", "rejected", "applied", "expired", "duplicate", "archived"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: `Statut invalide. Valides: ${validStatuses.join(", ")}` }, { status: 400 });
  }

  await prisma.job.update({ where: { id }, data: { status } });
  return NextResponse.json({ success: true, status });
}
