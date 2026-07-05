import { NextResponse } from "next/server";
import { listInteractions, addInteraction } from "@/lib/actions/crm";

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

export async function GET(request: Request) {
  const auth = checkAuth(request);
  if (auth !== "ok") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const contactId = searchParams.get("contactId") || undefined;
  const draftId = searchParams.get("draftId") || undefined;
  const result = await listInteractions(contactId, draftId);
  return NextResponse.json({ interactions: result });
}

export async function POST(request: Request) {
  const auth = checkAuth(request);
  if (auth !== "ok") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const result = await addInteraction(body);
  return NextResponse.json({ interaction: result });
}
