"use server";

import { prisma } from "@/lib/prisma";
import {
  isExportable,
  getExportBlockedMessage,
  generateExportFilename,
  generateDossierZipName,
  renderTxtExport,
  renderAtsExport,
  renderPrintHtml,
  renderMarkdownExport,
  buildDossierFiles,
} from "@/lib/exports/engine";
import JSZip from "jszip";

// ─── TXT Export ──────────────────────────────────

export async function exportTxt(id: string): Promise<{
  success: true; filename: string; content: string;
} | {
  success: false; error: string;
}> {
  const doc = await prisma.document.findUnique({
    where: { id },
    include: { opportunity: { select: { title: true, company: true } } },
  });
  if (!doc) return { success: false, error: "Document introuvable" };

  const filename = generateExportFilename(doc.type, doc.opportunity?.company || null, doc.opportunity?.title || null, "txt");
  const watermark = !isExportable(doc.status);
  const content = renderTxtExport(doc.content, doc.type, { watermark });

  await prisma.document.update({
    where: { id },
    data: { exportedAt: new Date(), exportFormat: "txt" },
  });

  return { success: true, filename, content };
}

// ─── ATS TXT Export ──────────────────────────────

export async function exportAtsTxt(id: string): Promise<{
  success: true; filename: string; content: string;
} | {
  success: false; error: string;
}> {
  const doc = await prisma.document.findUnique({
    where: { id },
    include: { opportunity: { select: { title: true, company: true } } },
  });
  if (!doc) return { success: false, error: "Document introuvable" };

  const content = renderAtsExport(doc.content);
  const filename = generateExportFilename(doc.type, doc.opportunity?.company || null, doc.opportunity?.title || null, "txt").replace(".txt", "_ATS.txt");

  return { success: true, filename, content };
}

// ─── Print HTML (for PDF via browser) ────────────

export async function exportPrintHtml(id: string): Promise<{
  success: true; filename: string; html: string;
} | {
  success: false; error: string;
}> {
  const doc = await prisma.document.findUnique({
    where: { id },
    include: {
      opportunity: { select: { title: true, company: true } },
    },
  });
  if (!doc) return { success: false, error: "Document introuvable" };

  if (!isExportable(doc.status)) {
    return { success: false, error: getExportBlockedMessage(doc.status) };
  }

  // Get candidate info for header
  const profile = await prisma.profile.findFirst();

  const html = renderPrintHtml({
    content: doc.content,
    type: doc.type,
    candidateName: profile?.fullName || undefined,
    offerTitle: doc.opportunity?.title || undefined,
    offerCompany: doc.opportunity?.company || undefined,
  });

  const filename = generateExportFilename(doc.type, doc.opportunity?.company || null, doc.opportunity?.title || null, "pdf");

  await prisma.document.update({
    where: { id },
    data: { exportedAt: new Date(), exportFormat: "pdf" },
  });

  return { success: true, filename, html };
}

// ─── Markdown Export ─────────────────────────────

export async function exportMarkdown(id: string): Promise<{
  success: true; filename: string; content: string;
} | {
  success: false; error: string;
}> {
  const doc = await prisma.document.findUnique({
    where: { id },
    include: { opportunity: { select: { title: true, company: true } } },
  });
  if (!doc) return { success: false, error: "Document introuvable" };

  const content = renderMarkdownExport(doc.content, doc.type);
  const filename = generateExportFilename(doc.type, doc.opportunity?.company || null, doc.opportunity?.title || null, "md");

  return { success: true, filename, content };
}

// ─── DOCX Export ─────────────────────────────────

export async function exportDocx(id: string): Promise<{
  success: true; filename: string; base64: string;
} | {
  success: false; error: string;
}> {
  const doc = await prisma.document.findUnique({
    where: { id },
    include: {
      opportunity: { select: { title: true, company: true } },
    },
  });
  if (!doc) return { success: false, error: "Document introuvable" };

  if (!isExportable(doc.status)) {
    return { success: false, error: getExportBlockedMessage(doc.status) };
  }

  try {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import("docx");

    const profile = await prisma.profile.findFirst();
    const label = doc.type.replace(/_/g, " ").toUpperCase();

    const paragraphs = doc.content.split("\n").map(line => {
      const trimmed = line.trim();
      if (!trimmed) return new Paragraph({ spacing: { after: 80 } });

      // Detect section headers (ALL CAPS lines)
      if (trimmed === trimmed.toUpperCase() && trimmed.length > 2 && trimmed.length < 60 && !trimmed.startsWith("•") && !trimmed.startsWith("-")) {
        return new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: trimmed, bold: true, size: 26 })],
          spacing: { before: 240, after: 80 },
        });
      }

      // Bullet points
      if (trimmed.startsWith("•") || trimmed.startsWith("-")) {
        return new Paragraph({
          children: [new TextRun({ text: trimmed, size: 22 })],
          spacing: { after: 40 },
          indent: { left: 720 },
        });
      }

      return new Paragraph({
        children: [new TextRun({ text: trimmed, size: 22 })],
        spacing: { after: 40 },
      });
    });

    const docx = new Document({
      creator: profile?.fullName || "ELTON OS",
      title: `${label} — ${doc.opportunity?.title || ""}`,
      description: `Généré par ELTON OS le ${new Date().toLocaleDateString("fr-FR")}`,
      sections: [{
        properties: {
          page: {
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 },
          },
        },
        children: [
          // Header
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: label, bold: true, size: 32 })],
            spacing: { after: 120 },
          }),
          new Paragraph({
            children: [new TextRun({ text: profile?.fullName || "", size: 22, color: "666666" })],
            spacing: { after: 40 },
          }),
          new Paragraph({
            children: [new TextRun({
              text: `Poste : ${doc.opportunity?.title || "—"} — ${doc.opportunity?.company || "—"}`,
              size: 20,
              color: "888888",
            })],
            spacing: { after: 40 },
          }),
          new Paragraph({
            children: [new TextRun({ text: `Exporté le ${new Date().toLocaleDateString("fr-FR")} via ELTON OS`, size: 18, color: "aaaaaa" })],
            spacing: { after: 200 },
          }),
          ...paragraphs,
        ],
      }],
    });

    const buffer = await Packer.toBuffer(docx);
    const base64 = Buffer.from(buffer).toString("base64");

    const filename = generateExportFilename(doc.type, doc.opportunity?.company || null, doc.opportunity?.title || null, "docx");

    await prisma.document.update({
      where: { id },
      data: { exportedAt: new Date(), exportFormat: "docx" },
    });

    return { success: true, filename, base64 };
  } catch (e: unknown) {
    const err = e as Error;
    return { success: false, error: `Erreur génération DOCX : ${err.message || "inconnue"}` };
  }
}

// ─── Dossier candidature ZIP ─────────────────────

export async function exportCandidatureDossier(opportunityId: string): Promise<{
  success: true; filename: string; base64: string;
} | {
  success: false; error: string;
}> {
  const opp = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    include: {
      documents: true,
      analysis: true,
    },
  });
  if (!opp) return { success: false, error: "Opportunité introuvable" };

  const documents = opp.documents || [];
  if (documents.length === 0) {
    return { success: false, error: "Aucun document à exporter — générez d'abord des documents." };
  }

  const files = buildDossierFiles({
    documents: documents.map(d => ({
      id: d.id,
      type: d.type,
      content: d.content,
      status: d.status,
      opportunityTitle: opp.title,
      opportunityCompany: opp.company,
    })),
    opportunityId: opp.id,
    opportunityTitle: opp.title,
    opportunityCompany: opp.company,
    analysisText: opp.analysis ? JSON.stringify(opp.analysis, null, 2) : null,
  });

  try {
    const zip = new JSZip();

    for (const file of files) {
      zip.file(file.name, file.content);
    }

    // Also add approved documents as DOCX-like txt in /Approuves/
    const approved = documents.filter(d => d.status === "APPROVED");
    if (approved.length > 0) {
      for (const doc of approved) {
        const filename = generateExportFilename(doc.type, opp.company, opp.title, "txt");
        zip.file(`Approuves/${filename}`, doc.content);
      }
    }

    const buffer = await zip.generateAsync({ type: "nodebuffer" });
    const base64 = Buffer.from(buffer).toString("base64");

    const zipName = generateDossierZipName(opp.company, opp.title);

    return { success: true, filename: zipName, base64 };
  } catch (e: unknown) {
    const err = e as Error;
    return { success: false, error: `Erreur création ZIP : ${err.message || "inconnue"}` };
  }
}

// ─── Document metadata for export UI ─────────────

export async function getDocumentExportInfo(id: string): Promise<{
  id: string;
  type: string;
  status: string;
  isExportable: boolean;
  blockedMessage: string;
  hasExportedBefore: boolean;
  lastExportedAt: string | null;
  lastExportFormat: string | null;
  opportunityTitle: string | null;
  opportunityCompany: string | null;
}> {
  const doc = await prisma.document.findUnique({
    where: { id },
    include: { opportunity: { select: { title: true, company: true } } },
  });
  if (!doc) throw new Error("Document introuvable");

  return {
    id: doc.id,
    type: doc.type,
    status: doc.status,
    isExportable: isExportable(doc.status),
    blockedMessage: getExportBlockedMessage(doc.status),
    hasExportedBefore: !!doc.exportedAt,
    lastExportedAt: doc.exportedAt?.toISOString() || null,
    lastExportFormat: doc.exportFormat || null,
    opportunityTitle: doc.opportunity?.title || null,
    opportunityCompany: doc.opportunity?.company || null,
  };
}
