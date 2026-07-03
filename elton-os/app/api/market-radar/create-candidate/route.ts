import { NextResponse } from "next/server";
import { createCandidateFromManualText } from "@/lib/actions/market-radar";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const result = await createCandidateFromManualText(body.text || "", body.sourceUrl || undefined);
    return NextResponse.json(result);
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
