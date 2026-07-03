import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { platform, sourceUrl, name, title, location, about, experiences, skills } = body;

    if (!name || !title) {
      return NextResponse.json({ success: false, error: "Nom et titre requis" }, { status: 400 });
    }

    // Stockage temporaire — sera persisté côté app avec le profil recruteur
    const candidateId = `cand-${Date.now()}`;
    const rawText = [
      `Nom: ${name}`,
      `Titre: ${title}`,
      `Localisation: ${location || ""}`,
      `Plateforme: ${platform}`,
      `URL: ${sourceUrl}`,
      ``,
      about || "",
      ``,
      (experiences || []).map((e: any) => `${e.title} chez ${e.company} (${e.dates})`).join("\n"),
      ``,
      "Compétences: " + (skills || []).join(", "),
    ].join("\n");

    return NextResponse.json({
      success: true,
      candidateId: candidateId,
      name: name,
      rawText: rawText,
      message: "Candidat importé avec succès — prêt à être enregistré",
    });
  } catch (err: any) {
    console.error("import-candidate error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
