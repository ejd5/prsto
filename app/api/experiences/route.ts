import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const profileId = new URL(request.url).searchParams.get("profileId");
  if (!profileId) return NextResponse.json([]);
  const exps = await prisma.experience.findMany({
    where: { profileId },
    orderBy: { startDate: "desc" },
  });
  return NextResponse.json(exps);
}
