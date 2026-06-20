"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  normalizeJobTitle, normalizeCompanyName, normalizeLocation,
  createDescriptionFingerprint, detectDuplicates, calculateOpportunitySimilarity,
} from "@/lib/dedup/engine";

// ─── Auto-normalize + fingerprint on create/update ──

export async function normalizeOpportunity(id: string) {
  const opp = await prisma.opportunity.findUnique({ where: { id } });
  if (!opp) return null;

  const update: Record<string, unknown> = {};
  if (!opp.normalizedTitle) update.normalizedTitle = normalizeJobTitle(opp.title);
  if (!opp.normalizedCompany) update.normalizedCompany = normalizeCompanyName(opp.company);
  if (opp.location && !opp.normalizedLocation) {
    update.normalizedLocation = normalizeLocation(opp.location);
  }
  if (!opp.descriptionFingerprint) {
    update.descriptionFingerprint = createDescriptionFingerprint(opp.rawText || "");
  }

  if (Object.keys(update).length > 0) {
    await prisma.opportunity.update({ where: { id }, data: update as unknown as Record<string, unknown> });
  }

  return prisma.opportunity.findUnique({ where: { id } });
}

// ─── Scan complet de détection de doublons ──────

export async function scanForDuplicates(opportunityId: string) {
  const opp = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    include: { analysis: true },
  });
  if (!opp) throw new Error("Opportunité introuvable");

  // Ensure normalized fields
  const normTitle = opp.normalizedTitle || normalizeJobTitle(opp.title);
  const normCompany = opp.normalizedCompany || normalizeCompanyName(opp.company);
  const normLocation = opp.normalizedLocation || normalizeLocation(opp.location || "");
  const fingerprint = opp.descriptionFingerprint || createDescriptionFingerprint(opp.rawText || "");

  // Update if missing
  await prisma.opportunity.update({
    where: { id: opportunityId },
    data: {
      normalizedTitle: normTitle,
      normalizedCompany: normCompany,
      normalizedLocation: normLocation || null,
      descriptionFingerprint: fingerprint,
    } as unknown as Record<string, unknown>,
  });

  // Get all other opportunities
  const allOpps = await prisma.opportunity.findMany({
    where: { id: { not: opportunityId } },
    include: { analysis: true },
  });

  const existing = allOpps.map(o => ({
    id: o.id,
    title: o.title,
    company: o.company,
    normalizedTitle: o.normalizedTitle || normalizeJobTitle(o.title),
    normalizedCompany: o.normalizedCompany || normalizeCompanyName(o.company),
    normalizedLocation: o.normalizedLocation || normalizeLocation(o.location || ""),
    descriptionFingerprint: o.descriptionFingerprint || createDescriptionFingerprint(o.rawText || ""),
    keywords: o.analysis?.keywordsAts || undefined,
    contractType: o.contractType,
    duplicateStatus: o.duplicateStatus,
  }));

  const { matches, highestScore, highestStatus } = detectDuplicates(
    {
      id: opp.id,
      title: opp.title,
      company: opp.company,
      normalizedTitle: normTitle,
      normalizedCompany: normCompany,
      normalizedLocation: normLocation,
      descriptionFingerprint: fingerprint,
      keywords: opp.analysis?.keywordsAts || undefined,
      contractType: opp.contractType,
      duplicateStatus: opp.duplicateStatus,
    },
    existing
  );

  // Update the opportunity with dedup results
  const bestMatch = matches[0];
  await prisma.opportunity.update({
    where: { id: opportunityId },
    data: {
      duplicateScore: highestScore || null,
      duplicateStatus: highestStatus,
      duplicateGroupId: bestMatch?.opp.duplicateGroupId || (matches.length > 0 ? opportunityId : null),
    } as unknown as Record<string, unknown>,
  });

  revalidatePath("/opportunites");
  revalidatePath(`/opportunites/${opportunityId}`);
  return { matches, highestScore, highestStatus };
}

// ─── Scan toutes les offres ──────────────────────

export async function scanAllForDuplicates() {
  const allOpps = await prisma.opportunity.findMany({
    include: { analysis: true },
  });

  const normalized = allOpps.map(o => ({
    id: o.id,
    title: o.title,
    company: o.company,
    normalizedTitle: o.normalizedTitle || normalizeJobTitle(o.title),
    normalizedCompany: o.normalizedCompany || normalizeCompanyName(o.company),
    normalizedLocation: o.normalizedLocation || normalizeLocation(o.location || ""),
    descriptionFingerprint: o.descriptionFingerprint || createDescriptionFingerprint(o.rawText || ""),
    keywords: o.analysis?.keywordsAts || undefined,
    contractType: o.contractType,
    duplicateStatus: o.duplicateStatus,
  }));

  let groupsFound = 0;

  for (const opp of normalized) {
    if (opp.duplicateStatus === "IGNORED") continue;
    const others = normalized.filter(o => o.id !== opp.id && o.duplicateStatus !== "IGNORED");
    const { matches, highestScore, highestStatus } = detectDuplicates(opp, others);

    const bestMatch = matches[0];
    await prisma.opportunity.update({
      where: { id: opp.id },
      data: {
        duplicateScore: highestScore || null,
        duplicateStatus: highestStatus,
        duplicateGroupId: bestMatch ? bestMatch.opp.duplicateGroupId || opp.id : null,
      } as unknown as Record<string, unknown>,
    });

    if (matches.length > 0 && highestScore >= 75) {
      groupsFound++;
      // Create or update DuplicateGroup
      const memberIds = [opp.id, ...matches.slice(0, 1).map(m => m.opp.id)];
      const existingGroup = await prisma.duplicateGroup.findFirst({
        where: { canonicalId: opp.id },
      });
      if (!existingGroup) {
        await prisma.duplicateGroup.create({
          data: {
            canonicalId: opp.id,
            memberIds: JSON.stringify(memberIds),
            averageScore: highestScore,
            status: "PENDING",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
        });
      }
    }
  }

  revalidatePath("/opportunites");
  return { scanned: normalized.length, groupsFound };
}

// ─── Marquer / démarquer ────────────────────────

export async function markAsDuplicate(opportunityId: string, canonicalId: string) {
  await prisma.opportunity.update({
    where: { id: opportunityId },
    data: {
      duplicateStatus: "CONFIRMED_DUPLICATE",
      canonicalOpportunityId: canonicalId,
      duplicateGroupId: canonicalId,
    } as unknown as Record<string, unknown>,
  });

  // Update group
  const group = await prisma.duplicateGroup.findFirst({ where: { canonicalId } });
  if (group) {
    const members: string[] = JSON.parse(group.memberIds);
    if (!members.includes(opportunityId)) {
      members.push(opportunityId);
      await prisma.duplicateGroup.update({
        where: { id: group.id },
        data: { memberIds: JSON.stringify(members), status: "CONFIRMED" } as unknown as Record<string, unknown>,
      });
    }
  } else {
    await prisma.duplicateGroup.create({
      data: {
        canonicalId,
        memberIds: JSON.stringify([opportunityId]),
        averageScore: 100,
        status: "CONFIRMED",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    });
  }

  revalidatePath("/opportunites");
  revalidatePath(`/opportunites/${opportunityId}`);
}

export async function markAsDistinct(opportunityId: string) {
  await prisma.opportunity.update({
    where: { id: opportunityId },
    data: {
      duplicateStatus: "IGNORED",
      duplicateScore: null,
      duplicateGroupId: null,
      canonicalOpportunityId: null,
    } as unknown as Record<string, unknown>,
  });

  revalidatePath("/opportunites");
  revalidatePath(`/opportunites/${opportunityId}`);
}

// ─── Comparaison détaillée ──────────────────────

export async function getComparisonData(idA: string, idB: string) {
  const [a, b] = await Promise.all([
    prisma.opportunity.findUnique({ where: { id: idA }, include: { analysis: true, pipelineTask: true } }),
    prisma.opportunity.findUnique({ where: { id: idB }, include: { analysis: true, pipelineTask: true } }),
  ]);
  if (!a || !b) return null;

  const result = calculateOpportunitySimilarity(
    {
      normalizedTitle: a.normalizedTitle || normalizeJobTitle(a.title),
      normalizedCompany: a.normalizedCompany || normalizeCompanyName(a.company),
      normalizedLocation: a.normalizedLocation || normalizeLocation(a.location || ""),
      descriptionFingerprint: a.descriptionFingerprint || createDescriptionFingerprint(a.rawText || ""),
      keywords: a.analysis?.keywordsAts || undefined,
      contractType: a.contractType,
    },
    {
      normalizedTitle: b.normalizedTitle || normalizeJobTitle(b.title),
      normalizedCompany: b.normalizedCompany || normalizeCompanyName(b.company),
      normalizedLocation: b.normalizedLocation || normalizeLocation(b.location || ""),
      descriptionFingerprint: b.descriptionFingerprint || createDescriptionFingerprint(b.rawText || ""),
      keywords: b.analysis?.keywordsAts || undefined,
      contractType: b.contractType,
    }
  );

  return {
    a: { id: a.id, title: a.title, company: a.company, location: a.location, sourceName: a.sourceName, contractType: a.contractType, hasPipeline: !!a.pipelineTask, duplicateStatus: a.duplicateStatus },
    b: { id: b.id, title: b.title, company: b.company, location: b.location, sourceName: b.sourceName, contractType: b.contractType, hasPipeline: !!b.pipelineTask, duplicateStatus: b.duplicateStatus },
    result,
  };
}

// ─── Vérification candidature existante ──────────

export async function checkPipelineConflict(opportunityId: string) {
  const opp = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    select: { duplicateGroupId: true, duplicateStatus: true },
  });

  if (!opp?.duplicateGroupId || opp.duplicateStatus === "IGNORED") return null;

  // Find all opportunities in the same group
  const siblings = await prisma.opportunity.findMany({
    where: { duplicateGroupId: opp.duplicateGroupId, id: { not: opportunityId } },
    include: { pipelineTask: true },
  });

  const withPipeline = siblings.filter(s => s.pipelineTask);
  if (withPipeline.length === 0) return null;

  return {
    conflictOpportunities: withPipeline.map(s => ({
      id: s.id,
      title: s.title,
      company: s.company,
      column: s.pipelineTask?.column,
      sourceName: s.sourceName,
    })),
  };
}
