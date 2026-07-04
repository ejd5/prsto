import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getClients, createClient } from "@/lib/recruiter/client";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const clients = await getClients(session.userId);
  return NextResponse.json({ success: true, clients });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json();
  if (!body.company) {
    return NextResponse.json({ error: "Nom de l'entreprise requis" }, { status: 400 });
  }

  try {
    const client = await createClient(session.userId, body);
    return NextResponse.json({ success: true, client });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
