import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isStaleContent } from "@/lib/jobs/text-sanitizer";
import {
  buildApplicationDocumentFilename,
  buildApplicationZipFilename,
} from "@/lib/jobs/document-filenames";
import { withExtensionCors, createCorsPreflightResponse } from "@/lib/http/extension-cors";

function checkAuth(request: Request): boolean {
  if (process.env.NODE_ENV === "development") return true;
  const token = request.headers.get("x-api-token");
  return token === process.env.SOURCING_CRON_TOKEN;
}

function corsJson(data: Record<string, unknown>, request: Request, status = 200): Response {
  return withExtensionCors(NextResponse.json(data, { status }), request);
}

export async function OPTIONS(request: Request) {
  return createCorsPreflightResponse(request);
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAuth(request)) {
    return corsJson({ success: false, error: "Non autorisé." }, request, 401);
  }

  const { id } = await params;
  const draft = await prisma.applicationDraft.findUnique({
    where: { id },
    include: { job: { select: { title: true, company: true } } },
  });

  if (!draft) {
    return corsJson({ success: false, error: "Draft introuvable" }, request, 404);
  }

  const cvReady = !!draft.tailoredResumeContent && !isStaleContent(draft.tailoredResumeContent);
  const letterReady = !!draft.motivationLetterLong && !isStaleContent(draft.motivationLetterLong);

  // Extract name from profile for filenames
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

  const jobTitle = draft.job?.title || "";
  const company = draft.job?.company || "";

  const cvFilename = buildApplicationDocumentFilename(firstName, lastName, company, jobTitle, "CV");
  const letterFilename = buildApplicationDocumentFilename(firstName, lastName, company, jobTitle, "Lettre");
  const zipFilename = buildApplicationZipFilename(firstName, lastName, company, jobTitle);

  const base = `/api/application-drafts/${id}/documents`;

  // V2.8.4 — Annotate CV with template + quality metadata
  const cvUrl = cvReady ? `${base}/cv` : undefined;
  const letterUrl = letterReady ? `${base}/cover-letter` : undefined;

  return corsJson({
    success: true,
    draftId: id,
    jobTitle,
    company,
    documents: {
      cv: cvReady ? {
        available: true,
        template: "premium-leadership",
        quality: "premium",
        filename: cvFilename,
        url: cvUrl,
        downloadUrl: cvUrl,
      } : { available: false },
      coverLetter: letterReady ? {
        available: true,
        quality: "standard",
        filename: letterFilename,
        url: letterUrl,
        downloadUrl: letterUrl,
      } : { available: false },
      zip: (cvReady || letterReady) ? { available: true, filename: zipFilename, url: `${base}/zip` } : { available: false },
    },
  }, request);
}
