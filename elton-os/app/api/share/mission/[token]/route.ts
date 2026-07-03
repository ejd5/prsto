import { NextRequest, NextResponse } from "next/server";
import { getMissionByShareToken } from "@/lib/recruiter/share";

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const link = await getMissionByShareToken(token);
  if (!link) {
    return NextResponse.json({ success: false, error: "Lien invalide ou expiré" }, { status: 404 });
  }

  const { mission } = link;
  return NextResponse.json({
    success: true,
    data: {
      mission: {
        id: mission.id,
        title: mission.title,
        location: mission.location,
        contractType: mission.contractType,
        salary: mission.salary,
        description: mission.description,
        status: mission.status,
        client: mission.client,
        candidates: mission.candidates.map(c => ({
          id: c.id,
          status: c.status,
          proposedAt: c.proposedAt,
          candidate: { id: c.candidate.id, name: c.candidate.name, cvOptimized: c.candidate.cvOptimized },
        })),
      },
    },
  });
}
