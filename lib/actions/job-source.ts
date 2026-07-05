"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type JobSourceData = {
  name: string;
  url: string;
  region: string;
  type: string;
  priority: number;
  active: boolean;
  notes: string;
};

export async function getJobSources() {
  return prisma.jobSource.findMany({
    orderBy: [{ priority: "desc" }, { name: "asc" }],
    include: { _count: { select: { opportunities: true, marketRadars: true } } },
  });
}

export async function addJobSource(data: JobSourceData) {
  const src = await prisma.jobSource.create({ data });
  revalidatePath("/sources");
  return src;
}

export async function updateJobSource(id: string, data: Partial<JobSourceData>) {
  const src = await prisma.jobSource.update({ where: { id }, data });
  revalidatePath("/sources");
  return src;
}

export async function toggleJobSource(id: string, active: boolean) {
  const src = await prisma.jobSource.update({ where: { id }, data: { active } });
  revalidatePath("/sources");
  return src;
}

export async function deleteJobSource(id: string) {
  await prisma.jobSource.delete({ where: { id } });
  revalidatePath("/sources");
}

export async function getJobSourceStats() {
  const [total, actives, prioritaires] = await Promise.all([
    prisma.jobSource.count(),
    prisma.jobSource.count({ where: { active: true } }),
    prisma.jobSource.count({ where: { priority: 1 } }),
  ]);
  return { total, actives, prioritaires };
}
