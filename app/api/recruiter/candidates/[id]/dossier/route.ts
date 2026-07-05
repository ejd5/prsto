import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getCandidateDossiers, createCandidateDossierVersion } from "@/lib/recruiter/dossier";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const { id } = await params;

  const dossiers = await getCandidateDossiers(session.userId, id);
  return NextResponse.json({ success: true, dossiers });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const { id } = await params;

  const body = await req.json();
  const dossier = await createCandidateDossierVersion(session.userId, id, body);
  return NextResponse.json({ success: true, dossier });
}
