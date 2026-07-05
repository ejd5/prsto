import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const profileId = new URL(request.url).searchParams.get("profileId");
  if (!profileId) return NextResponse.json([]);
  const skills = await prisma.skill.findMany({ where: { profileId } });
  return NextResponse.json(skills);
}
