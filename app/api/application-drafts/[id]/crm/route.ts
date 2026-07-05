import { NextResponse } from "next/server";
import { getDraftInteractions, addInteractionFromDraft, createContactFromDraft, linkContactToDraft } from "@/lib/actions/crm";

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
  const interactions = await getDraftInteractions(id);
  return NextResponse.json({ interactions });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = checkAuth(request);
  if (auth !== "ok") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  if (body.action === "create-contact") {
    const result = await createContactFromDraft(id, body.overrides);
    return NextResponse.json(result);
  }
  if (body.action === "link-contact") {
    const result = await linkContactToDraft(body.contactId, id);
    return NextResponse.json(result);
  }
  // Default: add interaction
  const result = await addInteractionFromDraft(id, body);
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json(result);
}
