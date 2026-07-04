import { NextResponse } from "next/server";
import { listRadarCandidates } from "@/lib/actions/market-radar";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status") || undefined;
    const priority = url.searchParams.get("priority") || undefined;
    const candidates = await listRadarCandidates({ status, priority });
    return NextResponse.json({ candidates });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
