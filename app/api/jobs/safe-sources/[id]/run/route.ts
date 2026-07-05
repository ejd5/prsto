import { NextResponse } from "next/server";
import { runSafeJobSource } from "@/lib/jobs/safe-source-runner";

function checkAuth(request: Request): "ok" | "missing" | "invalid" {
  if (process.env.NODE_ENV !== "production") return "ok";
  const token = request.headers.get("x-api-token");
  const expected = process.env.SOURCING_CRON_TOKEN;
  if (!expected) return "ok";
  if (!token) return "missing";
  return token === expected ? "ok" : "invalid";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = checkAuth(request);
  if (auth !== "ok") {
    return NextResponse.json({ error: auth === "missing" ? "Token manquant" : "Token invalide" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const action = body.action === "preview" ? "preview" : "import";
    const result = await runSafeJobSource(id, { action });
    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    const safeMsg = msg.replace(/fc-[a-zA-Z0-9]+/g, "***");
    return NextResponse.json({ success: false, error: safeMsg }, { status: 500 });
  }
}
