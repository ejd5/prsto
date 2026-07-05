import { NextResponse } from "next/server";
import { scanAllSources } from "@/lib/actions/source-scanner";

export async function POST() {
  try {
    const result = await scanAllSources();
    return NextResponse.json(result);
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
