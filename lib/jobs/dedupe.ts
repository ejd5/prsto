function normalizeTitle(t: string): string {
  return t.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

function normalizeCompany(c: string): string {
  return c.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

export function computeChecksum(title: string, company: string, location: string): string {
  const parts = [normalizeTitle(title), normalizeCompany(company || ""), (location || "").toLowerCase().replace(/[^a-z]/g, "")];
  return parts.filter(Boolean).join("::");
}

export type DedupResult = "new" | "duplicate_external" | "duplicate_url" | "duplicate_checksum" | "duplicate_similar";

export async function checkDuplicate(
  externalId: string | undefined,
  sourceUrl: string | undefined,
  title: string,
  company: string | undefined,
  location: string | undefined
): Promise<{ status: DedupResult; existingId?: string }> {
  const { prisma } = await import("@/lib/prisma");

  // Priorité 1: externalId (globalement unique, ex: "francetravail::123")
  if (externalId) {
    const existing = await prisma.job.findFirst({
      where: { externalId },
    });
    if (existing) return { status: "duplicate_external", existingId: existing.id };
  }

  // Priorité 2: canonicalUrl
  if (sourceUrl) {
    const existing = await prisma.job.findFirst({
      where: { sourceUrl },
    });
    if (existing) return { status: "duplicate_url", existingId: existing.id };
  }

  // Priorité 3: checksum
  const checksum = computeChecksum(title, company || "", location || "");
  const existing = await prisma.job.findFirst({
    where: { checksum },
  });
  if (existing) return { status: "duplicate_checksum", existingId: existing.id };

  return { status: "new" };
}
