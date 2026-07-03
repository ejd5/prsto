import { NextResponse } from "next/server";
import { generateSearchUrls } from "@/lib/market-radar/active-scanner";

export async function GET() {
  try {
    const data = await generateSearchUrls();
    return NextResponse.json({ success: true, ...data });
  } catch (e: unknown) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
  }
}
