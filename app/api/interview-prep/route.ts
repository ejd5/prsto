import { NextResponse } from "next/server";
import { listInterviewPreps, createInterviewPrepFromDraft } from "@/lib/jobs/interview-prep";

function checkAuth(request: Request) {
  const host = request.headers.get("host") || "";
  if (/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host)) return "ok";
  if (process.env.NODE_ENV !== "production") return "ok";
  const token = request.headers.get("x-api-token");
  const expected = process.env.SOURCING_CRON_TOKEN;
  if (!expected) return "missing";
  if (!token) return "missing";
  return token === expected ? "ok" : "invalid";
}

export async function GET(request: Request) {
  const auth = checkAuth(request);
  if (auth !== "ok") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const preps = await listInterviewPreps();
  return NextResponse.json({ preps });
}

export async function POST(request: Request) {
  const auth = checkAuth(request);
  if (auth !== "ok") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  if (body.draftId) {
    const r = await createInterviewPrepFromDraft(body.draftId, body.stage);
    if ("error" in r) return NextResponse.json(r, { status: 400 });
    return NextResponse.json(r);
  }
  return NextResponse.json({ error: "draftId requis" }, { status: 400 });
}
