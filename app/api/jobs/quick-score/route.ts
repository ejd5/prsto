import { NextResponse } from "next/server";
import { quickScoreAll, quickScoreAllForce } from "@/lib/jobs/quick-score";

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";
    const result = force ? await quickScoreAllForce() : await quickScoreAll();
    return NextResponse.json(result);
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
