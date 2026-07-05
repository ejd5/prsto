import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await req.json();
  const { name, offerTitle, company, cvText, offerText, atsData, cvOptimized, coverLetter, interviewBrief, interviewQuestions, linkedinOpts } = body;

  if (!name) {
    return NextResponse.json({ error: "Nom du candidat requis" }, { status: 400 });
  }

  try {
    const candidate = await prisma.candidate.create({
      data: {
        userId: session.userId,
        name,
        offerTitle: offerTitle || "",
        company: company || null,
        cvText: cvText || "",
        offerText: offerText || "",
        atsScore: atsData?.globalScore ?? atsData?.score ?? null,
        atsData: atsData ? JSON.stringify(atsData) : null,
        cvOptimized: cvOptimized || null,
        coverLetter: coverLetter || null,
        interviewBrief: interviewBrief || null,
        interviewQuestions: interviewQuestions ? JSON.stringify(interviewQuestions) : null,
        linkedinOpts: linkedinOpts ? JSON.stringify(linkedinOpts) : null,
      },
    });

    return NextResponse.json({
      success: true,
      candidate: { id: candidate.id, name, offerTitle, company, atsScore: candidate.atsScore, status: candidate.status },
    });
  } catch (err: any) {
    console.error("save-candidate error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "ID requis" }, { status: 400 });
  }

  try {
    await prisma.candidate.deleteMany({
      where: { id, userId: session.userId },
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
