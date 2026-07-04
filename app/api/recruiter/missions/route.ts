import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getMissions, createMission } from "@/lib/recruiter/mission";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const missions = await getMissions(session.userId);
  return NextResponse.json({ success: true, missions });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json();
  if (!body.clientId || !body.title) {
    return NextResponse.json({ error: "clientId et title requis" }, { status: 400 });
  }

  try {
    const mission = await createMission(session.userId, body);
    return NextResponse.json({ success: true, mission });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
