import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import JSZip from "jszip";

export async function GET() {
  try {
    // 1. Fetch data
    const [profiles, opportunities, contacts, drafts] = await Promise.all([
      prisma.profile.findMany(),
      prisma.opportunity.findMany({ include: { analysis: true } }),
      prisma.recruiterContact.findMany({ include: { interactions: true } }),
      prisma.applicationDraft.findMany(),
    ]);

    // 2. Initialize ZIP
    const zip = new JSZip();

    // 3. Add JSON files
    zip.file("profile.json", JSON.stringify(profiles, null, 2));
    zip.file("opportunities.json", JSON.stringify(opportunities, null, 2));
    zip.file("contacts.json", JSON.stringify(contacts, null, 2));
    zip.file("drafts.json", JSON.stringify(drafts, null, 2));

    // 4. Generate buffer
    const content = await zip.generateAsync({ type: "uint8array" });

    // 5. Create headers
    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `prsto-export-${dateStr}.zip`;

    return new NextResponse(content as any, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, must-revalidate",
      },
    });
  } catch (e: unknown) {
    const err = e as Error;
    console.error("Export failed:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to generate export archive" },
      { status: 500 }
    );
  }
}
