"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function getMarketRadars() {
  return prisma.marketRadar.findMany({
    include: { jobSource: { select: { name: true, url: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function generateMarketRadar(
  jobSourceId: string,
  role: string,
  country: string,
  searchUrl: string
) {
  const entry = await prisma.marketRadar.create({
    data: { jobSourceId, role, country, searchUrl },
  });
  revalidatePath("/sources");
  return entry;
}

export async function deleteMarketRadar(id: string) {
  await prisma.marketRadar.delete({ where: { id } });
  revalidatePath("/sources");
}
