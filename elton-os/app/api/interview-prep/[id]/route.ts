import { NextResponse } from "next/server";
import { getInterviewPrep, updateInterviewPrep, approveInterviewPrep, archiveInterviewPrep } from "@/lib/jobs/interview-prep";

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

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = checkAuth(request);
  if (auth !== "ok") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const prep = await getInterviewPrep(id);
  if (!prep) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json({ prep });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = checkAuth(request);
  if (auth !== "ok") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const r = await updateInterviewPrep(id, body);
  return NextResponse.json(r);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = checkAuth(request);
  if (auth !== "ok") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  if (body.action === "approve") { const r = await approveInterviewPrep(id); return NextResponse.json(r); }
  if (body.action === "archive") { const r = await archiveInterviewPrep(id); return NextResponse.json(r); }
  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
