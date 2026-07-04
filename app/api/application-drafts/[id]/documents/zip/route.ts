import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isStaleContent } from "@/lib/jobs/text-sanitizer";
import { generateTextPdf } from "@/lib/jobs/document-pdf";
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

export async function OPTIONS(request: Request) {
  return createCorsPreflightResponse(request);
}

// Simple ZIP builder (no external dependency needed)
function buildZip(files: { name: string; data: Uint8Array }[]): Uint8Array {
  // Minimal ZIP builder — enough for 2 small PDFs
  const encoder = new TextEncoder();
  const localHeaders: Uint8Array[] = [];
  const centralDir: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const crc = crc32(file.data);
    const compressed = file.data; // store uncompressed for simplicity
    const dv = new DataView(new ArrayBuffer(30));

    // Local file header
    dv.setUint32(0, 0x04034b50, true); // signature
    dv.setUint16(4, 20, true); // version needed
    dv.setUint16(6, 0, true); // flags
    dv.setUint16(8, 0, true); // compression: stored
    dv.setUint16(10, 0, true); // mod time
    dv.setUint16(12, 0, true); // mod date
    dv.setUint32(14, crc, true);
    dv.setUint32(18, compressed.length, true);
    dv.setUint32(22, file.data.length, true);
    dv.setUint16(26, nameBytes.length, true);
    dv.setUint16(28, 0, true); // extra field length

    localHeaders.push(new Uint8Array(dv.buffer));
    localHeaders.push(nameBytes);
    localHeaders.push(compressed);

    // Central directory entry
    const cdDv = new DataView(new ArrayBuffer(46));
    cdDv.setUint32(0, 0x02014b50, true);
    cdDv.setUint16(4, 20, true); // version made by
    cdDv.setUint16(6, 20, true); // version needed
    cdDv.setUint16(8, 0, true); // flags
    cdDv.setUint16(10, 0, true); // compression
    cdDv.setUint16(12, 0, true); // mod time
    cdDv.setUint16(14, 0, true); // mod date
    cdDv.setUint32(16, crc, true);
    cdDv.setUint32(20, compressed.length, true);
    cdDv.setUint32(24, file.data.length, true);
    cdDv.setUint16(28, nameBytes.length, true);
    cdDv.setUint16(30, 0, true); // extra
    cdDv.setUint16(32, 0, true); // comment
    cdDv.setUint16(34, 0, true); // disk
    cdDv.setUint16(36, 0, true); // internal attrs
    cdDv.setUint32(38, 0, true); // external attrs
    cdDv.setUint32(42, offset, true);

    centralDir.push(new Uint8Array(cdDv.buffer));
    centralDir.push(nameBytes);

    offset += 30 + nameBytes.length + compressed.length;
  }

  // End of central directory
  const cdSize = centralDir.reduce((s, a) => s + a.length, 0);
  const eocd = new DataView(new ArrayBuffer(22));
  eocd.setUint32(0, 0x06054b50, true);
  eocd.setUint16(4, 0, true); // disk
  eocd.setUint16(6, 0, true); // start disk
  eocd.setUint16(8, files.length, true); // entries on disk
  eocd.setUint16(10, files.length, true); // total entries
  eocd.setUint32(12, cdSize, true);
  eocd.setUint32(16, offset, true);
  eocd.setUint16(20, 0, true); // comment length

  const parts = [...localHeaders, ...centralDir, new Uint8Array(eocd.buffer)];
  const total = parts.reduce((s, a) => s + a.length, 0);
  const out = new Uint8Array(total);
  let pos = 0;
  for (const p of parts) { out.set(p, pos); pos += p.length; }
  return out;
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const b of data) {
    crc ^= b;
    for (let i = 0; i < 8; i++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
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

  const cvReady = !!draft.tailoredResumeContent && !isStaleContent(draft.tailoredResumeContent);
  const letterReady = !!draft.motivationLetterLong && !isStaleContent(draft.motivationLetterLong);

  if (!cvReady && !letterReady) {
    return withExtensionCors(NextResponse.json({ error: "Aucun document disponible" }, { status: 404 }), request);
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

  const files: { name: string; data: Uint8Array }[] = [];
  const jobTitle = draft.job?.title || "";
  const company = draft.job?.company || "";

  if (cvReady) {
    const cvPdf = await generateTextPdf(draft.tailoredResumeContent!, `${jobTitle} — ${company}`);
    files.push({ name: buildApplicationDocumentFilename(firstName, lastName, company, jobTitle, "CV"), data: cvPdf });
  }
  if (letterReady) {
    const letterPdf = await generateTextPdf(draft.motivationLetterLong!, `Lettre — ${jobTitle} — ${company}`);
    files.push({ name: buildApplicationDocumentFilename(firstName, lastName, company, jobTitle, "Lettre"), data: letterPdf });
  }

  const zipFilename = buildApplicationZipFilename(firstName, lastName, company, jobTitle);
  const zipBytes = buildZip(files);

  try {
    const existing = draft.generationLogs ? JSON.parse(draft.generationLogs) : [];
    const logs = Array.isArray(existing) ? existing : [existing];
    logs.push({ type: "document_downloaded", documentType: "zip", filename: zipFilename, requestedByExtension: true, timestamp: new Date().toISOString() });
    if (logs.length > 100) logs.splice(0, logs.length - 100);
    await prisma.applicationDraft.update({ where: { id }, data: { generationLogs: JSON.stringify(logs) } });
  } catch { /* non-bloquant */ }

  const response = new NextResponse(Buffer.from(zipBytes), { status: 200 });
  response.headers.set("Content-Type", "application/zip");
  response.headers.set("Content-Disposition", `attachment; filename="${encodeURIComponent(zipFilename)}"`);
  return withExtensionCors(response, request);
}
