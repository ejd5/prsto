import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const profile = await prisma.profile.findFirst({
      select: {
        fullName: true, title: true, summary: true,
        phone: true, email: true, linkedin: true, location: true,
        photoUrl: true,
      },
    });
    return NextResponse.json({ profile: profile || null });
  } catch {
    return NextResponse.json({ profile: null }, { status: 500 });
  }
}
