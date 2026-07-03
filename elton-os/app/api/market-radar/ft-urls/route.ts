import { NextResponse } from "next/server";
import { generateFranceTravailUrls } from "@/lib/market-radar/bulk-scanner";

export async function GET() {
  try {
    const urls = await generateFranceTravailUrls();
    return NextResponse.json({ success: true, urls });
  } catch (e: unknown) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
  }
}
