import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const title = (body.title as string || "").trim();
    const company = (body.company as string || "").trim();
    const location = (body.location as string || "").trim();
    const salary = (body.salary as string || "").trim();
    const contractType = (body.contractType as string || "").trim();
    const description = (body.description as string || "").trim().slice(0, 10000);
    const sourceUrl = (body.sourceUrl as string || "").trim();
    const sourceName = (body.sourceName as string || "Import Express").trim();

    if (!title || !company) {
      return NextResponse.json({ success: false, error: "Titre et entreprise requis" }, { status: 400 });
    }

    // Trouver ou créer la source d'import
    let source = await prisma.importSource.findFirst({
      where: { name: sourceName },
    });
    if (!source) {
      source = await prisma.importSource.create({
        data: { name: sourceName, type: "browser", enabled: true },
      });
    }

    // Extraire salaire min/max
    let salaryMin: number | null = null;
    let salaryMax: number | null = null;
    if (salary) {
      const nums = salary.match(/(\d{2,3}(?:\s?\d{3})?)/g);
      if (nums && nums.length >= 2) {
        salaryMin = parseInt(nums[0].replace(/\s/g, ""));
        salaryMax = parseInt(nums[1].replace(/\s/g, ""));
      } else if (nums && nums.length === 1) {
        salaryMin = parseInt(nums[0].replace(/\s/g, ""));
      }
    }

    const job = await prisma.job.create({
      data: {
        title: title.slice(0, 200),
        company: company.slice(0, 200),
        location: location.slice(0, 200),
        sourceUrl: sourceUrl.slice(0, 500),
        description: description.slice(0, 5000),
        contractType: contractType || null,
        salaryMin: salaryMin,
        salaryMax: salaryMax,
        sourceId: source.id,
        externalId: `importer::${Buffer.from(title + company).toString("base64").slice(0, 40)}`,
        status: "new",
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, jobId: job.id });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
