import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withExtensionCors, createCorsPreflightResponse } from "@/lib/http/extension-cors";
import { buildApplicationDocumentFilename } from "@/lib/jobs/document-filenames";

function checkAuth(request: Request): boolean {
  if (process.env.NODE_ENV === "development") return true;
  const token = request.headers.get("x-api-token");
  return token === process.env.SOURCING_CRON_TOKEN;
}

export async function OPTIONS(request: Request) {
  return createCorsPreflightResponse(request);
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAuth(request)) {
    return withExtensionCors(NextResponse.json({ error: "Non autorisé." }, { status: 401 }), request);
  }

  const { id } = await params;
  const draft = await prisma.applicationDraft.findUnique({
    where: { id },
    include: { job: { select: { title: true, company: true } } },
  });

  if (!draft) {
    return withExtensionCors(NextResponse.json({ error: "Draft introuvable" }, { status: 404 }), request);
  }

  const content = draft.motivationLetterLong;
  if (!content || content.trim().length < 10) {
    return withExtensionCors(NextResponse.json({ error: "Lettre non disponible" }, { status: 404 }), request);
  }

  let firstName = "";
  let lastName = "";
  try {
    const profile = await prisma.profile.findFirst({
      where: { id: draft.candidateProfileId || undefined },
      select: { fullName: true },
    });
    if (profile?.fullName) {
      const parts = profile.fullName.split(" ");
      firstName = parts[0] || "";
      lastName = parts.slice(1).join(" ") || parts[0] || "";
    }
  } catch { /* non-bloquant */ }

  const filename = buildApplicationDocumentFilename(
    firstName, lastName,
    draft.job?.company || "", draft.job?.title || "",
    "Lettre"
  );

  return withExtensionCors(NextResponse.json({
    success: true,
    content,
    filename,
  }), request);
}
