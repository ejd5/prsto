import { NextResponse } from "next/server";
import { importRadarCandidateToOpportunity, ignoreRadarCandidate, markRadarCandidateDuplicate } from "@/lib/actions/market-radar";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const id = body.id as string;
    const action = body.action as string;
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

    switch (action) {
      case "import": return NextResponse.json(await importRadarCandidateToOpportunity(id));
      case "ignore": return NextResponse.json(await ignoreRadarCandidate(id));
      case "duplicate": return NextResponse.json(await markRadarCandidateDuplicate(id, body.duplicateOfId));
      default: return NextResponse.json({ error: `Action inconnue: ${action}` }, { status: 400 });
    }
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
