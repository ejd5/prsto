import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getCandidateNotes, addCandidateNote, deleteCandidateNote } from "@/lib/recruiter/dossier";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const { id } = await params;

  const notes = await getCandidateNotes(session.userId, id);
  return NextResponse.json({ success: true, notes });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const { id } = await params;

  const { content, category } = await req.json();
  if (!content) return NextResponse.json({ error: "Contenu requis" }, { status: 400 });

  const note = await addCandidateNote(session.userId, id, content, category);
  return NextResponse.json({ success: true, note });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const noteId = searchParams.get("noteId");
  if (!noteId) return NextResponse.json({ error: "noteId requis" }, { status: 400 });

  await deleteCandidateNote(session.userId, noteId);
  return NextResponse.json({ success: true });
}
