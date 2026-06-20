import { NextResponse } from "next/server";
import { getApplicationPipeline } from "@/lib/jobs/application-pipeline";
import { parseDemoMode } from "@/lib/jobs/demo-data";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    // safe-by-default: demo absent = false (exclut [DEMO])
    const demoMode = parseDemoMode(url.searchParams);
    const data = await getApplicationPipeline({ demoMode });
    return NextResponse.json({ success: true, ...data });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
