import { NextResponse } from "next/server";
import { getDemoDataStatus, createDemoData, deleteDemoData } from "@/lib/actions/demo";

export async function GET() {
  try {
    const status = await getDemoDataStatus();
    return NextResponse.json({ success: true, ...status });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action as string;

    if (action === "create") {
      const result = await createDemoData();
      if (!result.success) return NextResponse.json(result, { status: 400 });
      return NextResponse.json(result);
    }

    if (action === "delete") {
      const result = await deleteDemoData();
      if (!result.success) return NextResponse.json(result, { status: 400 });
      return NextResponse.json(result);
    }

    return NextResponse.json({ success: false, error: `Action inconnue : ${action}` }, { status: 400 });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
