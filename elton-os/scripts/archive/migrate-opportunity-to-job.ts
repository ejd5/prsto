import { PrismaClient } from "../app/generated/prisma";
const prisma = new PrismaClient();

async function main() {
  console.log("Migration Opportunity → Job");
  console.log("============================");

  const opps = await prisma.opportunity.findMany({
    include: { analysis: true },
  });
  console.log(`Found ${opps.length} opportunities to migrate`);

  let created = 0;
  let skipped = 0;

  for (const opp of opps) {
    const existing = await prisma.job.findFirst({
      where: { sourceUrl: opp.sourceUrl, title: opp.title },
    });
    if (existing) {
      skipped++;
      continue;
    }

    const source = opp.jobSourceId
      ? await prisma.jobSource.findUnique({ where: { id: opp.jobSourceId } })
      : null;

    const importSource = source
      ? await prisma.importSource.findFirst({ where: { name: source.name } })
      : null;

    await prisma.job.create({
      data: {
        sourceId: importSource?.id ?? (await ensureDefaultSource()),
        title: opp.title,
        company: opp.company,
        location: opp.location,
        country: opp.country,
        sourceUrl: opp.sourceUrl,
        externalId: opp.externalId,
        sourceName: opp.sourceName,
        description: opp.rawText,
        rawText: opp.rawText,
        contractType: opp.contractType,
        remote: opp.remote,
        remotePolicy: opp.remote,
        salaryMin: opp.salaryMin,
        salaryMax: opp.salaryMax,
        salaryCurrency: opp.salaryCurrency,
        currency: opp.salaryCurrency,
        notes: opp.notes,
        priority: opp.priority,
        status: mapStatus(opp.status),
        appliedAt: opp.appliedAt,
        isNew: opp.isNew,
        sourceType: opp.sourceType,
        geoScore: opp.geoScore,
        geoPriority: opp.geoPriority,
        roleScore: opp.roleScore,
        globalScore: opp.globalScore,
        matchedRoles: opp.matchedRoles,
        matchedCity: opp.matchedCity,
        duplicateGroupId: opp.duplicateGroupId,
        duplicateScore: opp.duplicateScore,
        duplicateStatus: opp.duplicateStatus,
        canonicalOpportunityId: opp.canonicalOpportunityId,
        firstSeenAt: opp.firstSeenAt ?? opp.createdAt,
        lastSeenAt: opp.lastSeenAt ?? opp.createdAt,
        createdAt: opp.createdAt,
        updatedAt: opp.updatedAt,
        score: opp.analysis
          ? {
              create: {
                executiveScore: opp.score,
                matchScore: opp.analysis.scoreGlobal,
                globalScore: opp.globalScore,
                reasonsJson: opp.analysis.matchDetails,
                redFlagsJson: opp.analysis.risks,
              },
            }
          : undefined,
      },
    });
    created++;
  }

  console.log(`Created: ${created}, Skipped (already exists): ${skipped}`);
  console.log("Migration complete!");
  await prisma.$disconnect();
}

async function ensureDefaultSource(): Promise<string> {
  const existing = await prisma.importSource.findFirst({ where: { name: "Migrated from Opportunity" } });
  if (existing) return existing.id;

  const created = await prisma.importSource.create({
    data: { name: "Migrated from Opportunity", type: "api" },
  });
  return created.id;
}

function mapStatus(oppStatus: string): string {
  const map: Record<string, string> = {
    nouveau: "new",
    analyse: "enriched",
    postule: "applied",
    entretien: "applied",
    offre: "applied",
    refus: "rejected",
    archive: "expired",
  };
  return map[oppStatus] ?? "new";
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
