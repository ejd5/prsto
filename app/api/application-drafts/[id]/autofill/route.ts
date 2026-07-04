import { NextResponse } from "next/server";
import { mapDraftToFormFields } from "@/lib/actions/autofill";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await mapDraftToFormFields(id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.error.includes("envoyé") ? 403 : 404 });
  }
  return NextResponse.json(result);
}
