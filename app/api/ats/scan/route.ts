import { NextResponse } from "next/server";
import { runAtsScan } from "@/lib/actions/ats-scanner";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { jobTitle, jobDescription, company } = body;

    if (!jobTitle || !jobDescription) {
      return NextResponse.json(
        { success: false, error: "Le titre et la description du poste sont requis." },
        { status: 400 },
      );
    }

    const result = await runAtsScan({ jobTitle, jobDescription, company });
    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Erreur lors de l'analyse ATS" },
      { status: 500 },
    );
  }
}
