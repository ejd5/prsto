import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { candidateId, offerId } = body;

    if (!candidateId || !offerId) {
      return NextResponse.json({ success: false, error: "candidateId et offerId requis" }, { status: 400 });
    }

    // IA matching sera implémenté ici
    // Pour l'instant: score simulé basé sur la présence de données
    const score = Math.floor(Math.random() * 30) + 65; // 65-95%

    return NextResponse.json({
      success: true,
      score: score,
      recommendation: score >= 85 ? "Envoyer" : score >= 70 ? "À retravailler" : "Ne pas envoyer",
      matching: {
        global: score,
        role: Math.floor(Math.random() * 20) + 70,
        seniority: Math.floor(Math.random() * 25) + 65,
        location_score: Math.floor(Math.random() * 20) + 75,
        sector: Math.floor(Math.random() * 15) + 80,
        atsCompatibility: Math.floor(Math.random() * 20) + 75,
      },
      forts: ["Compétences techniques alignées", "Localisation compatible", "Niveau de séniorité adéquat"],
      gaps: ["Un mot-clé ATS manquant dans le CV"],
      risques: [],
    });
  } catch (err: any) {
    console.error("match error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
