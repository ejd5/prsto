import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });
    }

    const name = file.name.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());

    let text = "";

    if (name.endsWith(".pdf")) {
      const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
      const data = await pdfParse(buffer);
      text = data.text;
    } else if (name.endsWith(".docx") || name.endsWith(".doc")) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (name.endsWith(".txt") || name.endsWith(".md") || file.type.startsWith("text/")) {
      text = buffer.toString("utf-8");
    } else {
      return NextResponse.json({ error: `Format non supporté: ${file.type || name.split(".").pop()}` }, { status: 400 });
    }

    if (!text || text.trim().length < 20) {
      return NextResponse.json({ error: "Impossible d'extraire le texte de ce fichier. Vérifiez qu'il contient du texte lisible." }, { status: 422 });
    }

    return NextResponse.json({ text: text.trim(), fileName: file.name });
  } catch (err: any) {
    console.error("extract-cv error:", err);
    return NextResponse.json({ error: err.message || "Erreur extraction" }, { status: 500 });
  }
}
