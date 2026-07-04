import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, company, location, description, platform, sourceUrl } = body;

    if (!title || !description) {
      return NextResponse.json({ success: false, error: "Titre et description requis" }, { status: 400 });
    }

    const offerId = `offer-${Date.now()}`;

    return NextResponse.json({
      success: true,
      offerId: offerId,
      title: title,
      message: "Offre client importée avec succès",
    });
  } catch (err: any) {
    console.error("import-offer error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
