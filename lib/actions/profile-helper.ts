"use server";

import { prisma } from "@/lib/prisma";

export async function getFirstProfileId(): Promise<string | null> {
  const profile = await prisma.profile.findFirst({ select: { id: true } });
  return profile?.id || null;
}
