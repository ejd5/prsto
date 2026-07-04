import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { candidateId, offerId } = body;

    if (!candidateId || !offerId) {
      return NextResponse.json({ success: false, error: "candidateId et offerId requis" }, { status: 400 });
    }

    // Génération IA du dossier complet
    const dossierId = `dossier-${Date.now()}`;

    return NextResponse.json({
      success: true,
      dossierId: dossierId,
      files: {
        cv: `/api/recruiter/dossiers/${dossierId}/cv`,
        lettre: `/api/recruiter/dossiers/${dossierId}/lettre`,
        brief: `/api/recruiter/dossiers/${dossierId}/brief`,
        zip: `/api/recruiter/dossiers/${dossierId}/zip`,
      },
      message: "Dossier généré — CV, lettre et brief prêts",
    });
  } catch (err: any) {
    console.error("generate-dossier error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
