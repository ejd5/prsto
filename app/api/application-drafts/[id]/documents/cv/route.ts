import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildApplicationDocumentFilename } from "@/lib/jobs/document-filenames";
import { extractPremiumCvData, getCvPdfGenerator } from "@/lib/jobs/cv-pdf-premium";
import { isStaleContent } from "@/lib/jobs/text-sanitizer";
import { withExtensionCors, createCorsPreflightResponse } from "@/lib/http/extension-cors";

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

  const url = new URL(request.url);
  const requestedTemplate = url.searchParams.get("template");
  const resolvedTemplate = resolveCvTemplate(requestedTemplate);
  const isMasterMode = url.searchParams.get("mode") === "master";

  if (!isMasterMode && (!draft.tailoredResumeContent || isStaleContent(draft.tailoredResumeContent))) {
    return withExtensionCors(NextResponse.json({ error: "CV non disponible" }, { status: 404 }), request);
  }

  // Build filename
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

  const baseFilename = buildApplicationDocumentFilename(firstName, lastName, draft.job?.company || "", draft.job?.title || "", "CV");
  const filename = isMasterMode ? baseFilename.replace(/\.pdf$/i, "_Maitre.pdf") : baseFilename;

  let pdfBytes: Uint8Array;
  let templateUsed = resolvedTemplate;
  let renderer = "pdf-lib";

  // Primary: pdf-lib generators (works without Playwright)
  // Optional: if NEXT_PUBLIC_CV_HTML_PDF=true, try HTML-to-PDF first
  if (process.env.NEXT_PUBLIC_CV_HTML_PDF === "true") {
    try {
      const { generateSendableCvPdf } = await import("@/lib/jobs/cv-html-pdf-service");
      const result = await generateSendableCvPdf({ 
        draftId: id, 
        templateId: resolvedTemplate, 
        source: "dashboard",
        mode: isMasterMode ? "master" : "adapted"
      });
      pdfBytes = result.pdfBytes;
      templateUsed = result.templateUsed;
      renderer = result.renderer;
    } catch {
      // Fallback to pdf-lib
      try {
        const cvData = await extractPremiumCvData(id, isMasterMode);
        const { generator, templateUsed: tpl } = getCvPdfGenerator(resolvedTemplate);
        pdfBytes = await generator(cvData);
        templateUsed = tpl;
        renderer = "pdf-lib";
      } catch (e) {
        return withExtensionCors(NextResponse.json({ error: "Échec de la génération du CV." }, { status: 500 }), request);
      }
    }
  } else {
    // Direct pdf-lib (no Playwright needed)
    try {
      const cvData = await extractPremiumCvData(id, isMasterMode);
      const { generator, templateUsed: tpl } = getCvPdfGenerator(resolvedTemplate);
      pdfBytes = await generator(cvData);
      templateUsed = tpl;
    } catch {
      return withExtensionCors(NextResponse.json({ error: "Échec de la génération du CV." }, { status: 500 }), request);
    }
  }

  // Audit log
  try {
    const existing = draft.generationLogs ? JSON.parse(draft.generationLogs) : [];
    const logs = Array.isArray(existing) ? existing : [existing];
    logs.push({ type: "document_downloaded", documentType: "cv", filename, template: templateUsed, renderer, timestamp: new Date().toISOString() });
    if (logs.length > 100) logs.splice(0, logs.length - 100);
    await prisma.applicationDraft.update({ where: { id }, data: { generationLogs: JSON.stringify(logs) } });
  } catch { /* non-bloquant */ }

  const response = new NextResponse(Buffer.from(pdfBytes), { status: 200 });
  response.headers.set("Content-Type", "application/pdf");
  response.headers.set("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
  response.headers.set("X-PRSTO-Cv-Renderer", renderer);
  response.headers.set("X-PRSTO-Cv-Template", templateUsed);
  return withExtensionCors(response, request);
}

/** Normalize template ID, fallback to premium_leadership for unknown */
function resolveCvTemplate(templateId?: string | null): string {
  if (!templateId) return "premium_leadership";
  const clean = templateId.replace(/[-\s]/g, "_").toLowerCase();
  const valid = ["ats_classic", "modern_executive", "premium_leadership", "executive_bordeaux", "strategic_blue", "minimal_luxe"];
  for (const v of valid) {
    if (clean === v) return v;
    if (clean.replace(/_/g, "") === v.replace(/_/g, "")) return v;
  }
  return "premium_leadership";
}
