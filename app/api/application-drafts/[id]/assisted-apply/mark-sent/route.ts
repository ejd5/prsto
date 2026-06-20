import { NextResponse } from "next/server";
import { markAsSent } from "@/lib/jobs/assisted-apply";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const result = await markAsSent(id);
    if (!result.success) return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result);
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
