import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = (body.email as string || "").trim();
    const name = (body.name as string || "").trim().slice(0, 100);
    const profile = (body.profile as string || "cadre").slice(0, 50);
    const message = (body.message as string || "").slice(0, 500);

    if (!email) {
      return NextResponse.json({ success: false, error: "Email requis" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: "Email invalide" }, { status: 400 });
    }

    await prisma.contactLead.create({
      data: { name, email, profile, message },
    });

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
