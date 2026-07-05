import { NextResponse } from "next/server";
import { listCrmContacts, upsertCrmContact, checkContactDuplicate } from "@/lib/actions/crm";

function isLocalRequest(request: Request): boolean {
  const host = request.headers.get("host") || "";
  if (/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host)) return true;
  if (host.endsWith(".local")) return true;
  return false;
}

function checkAuth(request: Request): "ok" | "missing" | "invalid" {
  if (process.env.NODE_ENV !== "production" && isLocalRequest(request)) return "ok";
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
  const q = searchParams.get("q") || undefined;
  const contacts = await listCrmContacts(q);
  return NextResponse.json({ contacts });
}

export async function POST(request: Request) {
  const auth = checkAuth(request);
  if (auth !== "ok") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  // Dedup check
  if (body.email || body.linkedinUrl) {
    const dup = await checkContactDuplicate(body.email, body.linkedinUrl, body.fullName, body.companyName);
    if (dup.isDuplicate) return NextResponse.json({ error: "Un contact avec cet email ou LinkedIn existe déjà.", existingId: dup.existingId }, { status: 409 });
  }
  const contact = await upsertCrmContact(body, body.id);
  return NextResponse.json({ contact });
}
