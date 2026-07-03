const { PrismaClient } = require("../app/generated/prisma");
const p = new PrismaClient();

(async () => {
  try {
    const jobs = await p.job.findMany({ select: { id: true, title: true, company: true, status: true } });
    console.log("Total jobs:", jobs.length);
    let missing = 0;
    for (const j of jobs) {
      const draft = await p.applicationDraft.findUnique({ where: { jobId: j.id } });
      if (!draft) { missing++; console.log("NO DRAFT:", j.id.slice(0,8), j.status, j.title?.slice(0,60), j.company); }
    }
    console.log("Jobs sans draft:", missing);

    if (missing > 0) {
      console.log("\n--- Backfill ---");
      let created = 0;
      for (const j of jobs) {
        const draft = await p.applicationDraft.findUnique({ where: { jobId: j.id } });
        if (!draft) {
          await p.applicationDraft.create({
            data: {
              jobId: j.id,
              status: "draft",
              pipelineStatus: "imported",
              lastPipelineActionAt: new Date(),
            },
          });
          created++;
          console.log("OK:", j.title?.slice(0,50));
        }
      }
      console.log(`\nCréés: ${created} drafts`);
    }
  } finally {
    await p.$disconnect();
  }
})();
