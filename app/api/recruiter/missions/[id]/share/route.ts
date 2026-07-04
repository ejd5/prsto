import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getShareLinks, createShareLink, deactivateShareLink } from "@/lib/recruiter/share";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const { id } = await params;

  const links = await getShareLinks(session.userId, id);
  return NextResponse.json({ success: true, links });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const { id } = await params;

  const { action, expiresInDays } = await req.json();

  try {
    if (action === "create") {
      const link = await createShareLink(session.userId, id, expiresInDays);
      return NextResponse.json({ success: true, link });
    }
    if (action === "deactivate") {
      await deactivateShareLink(session.userId, id);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
