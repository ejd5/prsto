import { NextResponse } from "next/server";
import { listAllSourcesWithCapabilities } from "@/lib/actions/source-scanner";

export async function GET() {
  try {
    const sources = await listAllSourcesWithCapabilities();
    return NextResponse.json({ sources });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
