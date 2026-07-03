import { NextResponse } from "next/server";
import { generateReport } from "@/lib/actions/sourcing-report";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const expectedToken = process.env.SOURCING_CRON_TOKEN;

  if (expectedToken && token !== expectedToken) {
    return NextResponse.json({ error: "Token invalide" }, { status: 401 });
  }

  try {
    const result = await generateReport("morning");
    return NextResponse.json({ success: true, content: result.content });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
