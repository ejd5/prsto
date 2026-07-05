import { NextResponse } from "next/server";
import { getApplicationAnalytics } from "@/lib/jobs/application-analytics";
import { parseDemoMode } from "@/lib/jobs/demo-data";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    // safe-by-default: demo absent = false (exclut [DEMO])
    const demoMode = parseDemoMode(url.searchParams);
    const data = await getApplicationAnalytics({ demoMode });
    return NextResponse.json({ success: true, ...data });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
