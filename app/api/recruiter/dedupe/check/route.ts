import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, source, url, fullName, title, company } = body;

    // Simulate simple deduplication checks.
    const isDuplicate = url ? url.includes("duplicate") || Math.random() > 0.7 : false;

    if (isDuplicate) {
      return NextResponse.json({
        success: true,
        isDuplicate: true,
        confidence: 0.95,
        existingId: type === "candidate" ? `cand-mock-${Date.now()}` : `offer-mock-${Date.now()}`,
        lastImportedAt: new Date(Date.now() - 3600 * 24 * 5 * 1000).toISOString(),
        recommendation: "update_existing"
      });
    }

    return NextResponse.json({
      success: true,
      isDuplicate: false,
      confidence: 1.0,
      recommendation: "create_new"
    });
  } catch (err: any) {
    console.error("Dedupe route error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
