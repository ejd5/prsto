import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { addCandidateToMission, updateCandidateStatus, removeCandidateFromMission } from "@/lib/recruiter/pipeline";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json();
  const { action } = body;

  try {
    if (action === "add-candidate") {
      const entry = await addCandidateToMission(session.userId, body);
      return NextResponse.json({ success: true, entry });
    }

    if (action === "update-status") {
      const entry = await updateCandidateStatus(session.userId, body.missionCandidateId, body.status);
      return NextResponse.json({ success: true, entry });
    }

    if (action === "remove-candidate") {
      await removeCandidateFromMission(session.userId, body.missionCandidateId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
