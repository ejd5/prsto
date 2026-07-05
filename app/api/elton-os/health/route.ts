import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [
      profileCount,
      oppCount,
      draftCount,
      docCount,
      sourceCount,
      crmCount,
    ] = await Promise.all([
      prisma.profile.count(),
      prisma.opportunity.count(),
      prisma.applicationDraft.count().catch(() => 0),
      prisma.document.count(),
      prisma.jobSource.count().catch(() => 0),
      prisma.recruiterContact.count().catch(() => 0),
    ]);

    const settings = await prisma.setting.findUnique({ where: { id: "elton-os-settings" } });

    return NextResponse.json({
      status: "ok",
      version: "0.1.0",
      database: "sqlite",
      stats: {
        profiles: profileCount,
        opportunities: oppCount,
        drafts: draftCount,
        documents: docCount,
        sources: sourceCount,
        contacts: crmCount,
      },
      ai: {
        provider: settings?.aiProvider || "none",
        configured: !!(settings?.apiKey),
        // Never expose the key itself
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ status: "error", error: "Health check failed" }, { status: 500 });
  }
}
