import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getCommissions, createCommission, updateCommissionStatus, getComptaStats } from "@/lib/recruiter/compta";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const [commissions, stats] = await Promise.all([
    getCommissions(session.userId),
    getComptaStats(session.userId),
  ]);

  return NextResponse.json({ success: true, commissions, stats });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json();
  const { action } = body;

  try {
    if (action === "create") {
      const commission = await createCommission(session.userId, body);
      return NextResponse.json({ success: true, commission });
    }
    if (action === "update-status") {
      await updateCommissionStatus(session.userId, body.id, body.status);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
