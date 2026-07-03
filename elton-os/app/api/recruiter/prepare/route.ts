import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { scanResume } from "@/lib/jobs/ats-resume-scanner";
import { optimizeCv } from "@/lib/jobs/ai-cv-optimizer";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await req.json();
  const { cvText, offerText, offerTitle, company, candidateName } = body;

  if (!cvText || cvText.trim().length < 50) {
    return NextResponse.json({ error: "Texte CV trop court" }, { status: 400 });
  }
  if (!offerText || offerText.trim().length < 50) {
    return NextResponse.json({ error: "Texte offre trop court" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  const results: any = {
    candidateName: candidateName || "Candidat",
    offerTitle: offerTitle || "Offre",
    ats: null,
    cv: null,
    interview: {
      briefing: `Brief d'entretien pour le poste : ${offerTitle || "Poste"}\n\nCandidat : ${candidateName || "Candidat"}\n\nPoints clés à préparer :\n- Présentation de l'entreprise ${company || "(confidentiel)"}\n- Compétences techniques attendues : analyser l'offre ci-dessus\n- Soft skills à mettre en avant : adaptabilité, communication, leadership\n- Questions pièges probables : 3 ans, pourquoi nous, attentes salariales\n- Stratégie salariale : viser la médiane marché, justifier par l'expérience\n- Questions à poser en fin d'entretien : roadmap, équipe, culture`,
      questions: [
        "Pouvez-vous nous parler de votre parcours et de vos motivations pour ce poste ?",
        "Quelle est votre plus grande réussite professionnelle et quel a été votre rôle ?",
        "Comment géreriez-vous une situation de désaccord avec un manager client ?",
        "Où vous voyez-vous dans 3 ans ?",
        "Pourquoi avoir choisi le recrutement comme carrière ?",
      ],
    },
    errors: [] as string[],
  };

  try {
    results.ats = await scanResume({
      cvText,
      jobTitle: offerTitle || "Poste",
      jobDescription: offerText,
      company: company,
    });
  } catch (e: any) {
    results.errors.push(`ATS: ${e.message}`);
    results.ats = { globalScore: 0, matchedKeywords: [], missingKeywords: [], suggestions: [], warnings: [e.message] };
  }

  try {
    results.cv = await optimizeCv({
      cvText,
      jobTitle: offerTitle || "Poste",
      jobDescription: offerText,
      company: company,
    });
  } catch (e: any) {
    results.errors.push(`CV: ${e.message}`);
    results.cv = { optimizedText: cvText, coverLetter: "", suggestions: [] };
  }

  return NextResponse.json({
    success: true,
    results,
  });
}

