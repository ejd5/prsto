import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/auth";
import { createSession } from "@/lib/auth/session";

export async function GET() {
  const userCount = await prisma.user.count();
  return NextResponse.json({ needsSetup: userCount === 0 });
}

export async function POST(request: Request) {
  try {
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      return NextResponse.json({ error: "Un compte existe déjà" }, { status: 400 });
    }

    const { email, password, name } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "8 caractères minimum" }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, password: passwordHash, name: name || email.split("@")[0], role: "admin" },
    });

    await createSession(user.id, user.email, user.role);

    return NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
