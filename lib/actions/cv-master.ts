"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type CVMasterData = {
  fileName: string;
  originalText: string;
  fileType: string;
  status: string;
};

export async function getCVMaster(profileId: string) {
  return prisma.cVMaster.findUnique({ where: { profileId } });
}

export async function upsertCVMaster(profileId: string, data: CVMasterData) {
  const existing = await prisma.cVMaster.findUnique({ where: { profileId } });
  let cv;
  if (existing) {
    cv = await prisma.cVMaster.update({ where: { profileId }, data: { ...data, fileSize: data.originalText.length } });
  } else {
    cv = await prisma.cVMaster.create({ data: { ...data, profileId, fileSize: data.originalText.length } });
  }
  revalidatePath("/cv-maitre");
  return cv;
}

export async function updateCVMasterStatus(profileId: string, status: string) {
  const cv = await prisma.cVMaster.update({ where: { profileId }, data: { status } });
  revalidatePath("/cv-maitre");
  return cv;
}

export async function deleteCVMaster(profileId: string) {
  await prisma.cVMaster.delete({ where: { profileId } });
  revalidatePath("/cv-maitre");
}
