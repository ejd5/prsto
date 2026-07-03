import { NextResponse } from "next/server";
import { getCrmContact, upsertCrmContact, deleteCrmContact } from "@/lib/actions/crm";

function checkAuth(request: Request): "ok" | "missing" | "invalid" {
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
  const contact = await getCrmContact(id);
  if (!contact) return NextResponse.json({ error: "Contact introuvable" }, { status: 404 });
  return NextResponse.json({ contact });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = checkAuth(request);
  if (auth !== "ok") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const contact = await upsertCrmContact(body, id);
  return NextResponse.json({ contact });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = checkAuth(request);
  if (auth !== "ok") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  await deleteCrmContact(id);
  return NextResponse.json({ success: true });
}
