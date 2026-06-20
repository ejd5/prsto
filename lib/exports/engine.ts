// ─── Export Engine ───
// Pure functions — no AI, no network, no side effects
// Generates TXT, ATS text, print-optimized HTML, and ZIP structures

export type ExportFormat = "pdf" | "docx" | "txt" | "ats";
export type DocumentType =
  | "cv_fr" | "cv_en"
  | "lettre_fr" | "lettre_en"
  | "email_fr" | "email_en"
  | "linkedin_fr" | "linkedin_en"
  | "ats_reponse";

const DOC_LABELS: Record<string, string> = {
  cv_fr: "CV_FR", cv_en: "CV_EN",
  lettre_fr: "Lettre_FR", lettre_en: "Lettre_EN",
  email_fr: "Email_FR", email_en: "Email_EN",
  linkedin_fr: "LinkedIn_FR", linkedin_en: "LinkedIn_EN",
  ats_reponse: "ATS_Reponses",
};

// ─── Status checking ────────────────────────────

export function isExportable(status: string): boolean {
  return status === "APPROVED";
}

export function getExportBlockedMessage(status: string): string {
  if (status === "APPROVED") return "";
  if (status === "DRAFT") return "Export final bloqué — le document doit être approuvé avant export.";
  if (status === "NEEDS_REVIEW") return "Export final bloqué — validez humainement le document avant export.";
  if (status === "REJECTED") return "Export final bloqué — document rejeté.";
  return "Export final bloqué — statut inconnu.";
}

// ─── Filenames ───────────────────────────────────

function safe(s: string): string {
  return s
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9 _-]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 40)
    .replace(/_+$/, "");
}

export function generateExportFilename(
  type: string, company: string | null, title: string | null, format: string,
): string {
  const parts: string[] = [];
  parts.push(DOC_LABELS[type] || type.replace(/_/g, "_"));
  if (company?.trim()) parts.push(safe(company.trim()));
  if (title?.trim()) parts.push(safe(title.trim()));
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  parts.push(date);
  return `${parts.join("_")}.${format}`;
}

export function generateDossierZipName(company: string | null, title: string | null): string {
  const parts = ["ELTON_OS_Candidature"];
  if (company?.trim()) parts.push(safe(company.trim()));
  if (title?.trim()) parts.push(safe(title.trim()));
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  parts.push(date);
  return `${parts.join("_")}.zip`;
}

// ─── TXT export ──────────────────────────────────

export function renderTxtExport(content: string, type: string, opts?: { watermark?: boolean }): string {
  const header = `ELTON OS — ${DOC_LABELS[type] || type}\nGénéré le ${new Date().toLocaleDateString("fr-FR")}\n\n`;
  let result = header + content;

  if (opts?.watermark) {
    result = `[ BROUILLON — Ne pas envoyer — Validé le ${new Date().toLocaleDateString("fr-FR")} ]\n\n` + result;
  }

  return result;
}

// ─── ATS TXT export ─────────────────────────────

export function renderAtsExport(content: string): string {
  // Strip formatting, keep clean sections
  return content
    .replace(/[—–─═▀▄█▌▐▐░▒▓■□▪▫●○◘◙☺☻☼♂♀♪♫☼►◄↕‼§▬↨↑↓→←∟↔▲▼]+/g, "-")
    .replace(/[•●○]/g, "-")
    .replace(/[”“"]/g, "\"")
    .replace(/[‘’']/g, "'")
    .replace(/[àáâãäå]/gi, "a")
    .replace(/[èéêë]/gi, "e")
    .replace(/[ìíîï]/gi, "i")
    .replace(/[òóôõö]/gi, "o")
    .replace(/[ùúûü]/gi, "u")
    .replace(/[ñ]/gi, "n")
    .replace(/[ç]/gi, "c")
    .replace(/\t/g, "  ")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // Ensure sections are separated by double newlines
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ─── Print-optimized HTML (for PDF via browser) ──

export function renderPrintHtml(params: {
  content: string;
  type: string;
  candidateName?: string;
  offerTitle?: string;
  offerCompany?: string;
}): string {
  const { content, type, candidateName, offerTitle, offerCompany } = params;
  const label = DOC_LABELS[type] || type;
  const safeContent = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>${label} — ${candidateName || "Export"}</title>
<style>
  @page { size: A4; margin: 20mm 18mm 20mm 18mm; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: none !important; }
  }
  * { box-sizing: border-box; }
  body {
    font-family: Arial, Helvetica, 'Segoe UI', sans-serif;
    font-size: 11pt;
    line-height: 1.5;
    color: #1a1a1a;
    max-width: 210mm;
    margin: 0 auto;
    padding: 20px;
    background: #fff;
  }
  .header {
    border-bottom: 2px solid #1a1a2e;
    padding-bottom: 10px;
    margin-bottom: 20px;
  }
  .header h1 { font-size: 14pt; color: #1a1a2e; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 1px; }
  .header .meta { font-size: 9pt; color: #666; }
  .content { white-space: pre-wrap; font-family: Arial, Helvetica, sans-serif; font-size: 11pt; }
  .watermark {
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg);
    font-size: 48pt; color: rgba(239,68,68,0.12); pointer-events: none; z-index: 1000;
    font-weight: bold; text-transform: uppercase; letter-spacing: 8px;
  }
  .banner {
    padding: 8px 12px; border: 1px solid #f59e0b; border-radius: 4px;
    background: rgba(245,158,11,0.08); color: #92400e; font-size: 9pt;
    margin-bottom: 16px;
  }
  .btn-print {
    display: inline-block; padding: 10px 24px; background: #1a1a2e; color: #fff;
    border: none; border-radius: 4px; font-size: 11pt; cursor: pointer;
    margin-bottom: 16px;
  }
  hr { border: none; border-top: 1px solid #ddd; margin: 12px 0; }
  h2 { font-size: 12pt; color: #1a1a2e; text-transform: uppercase; letter-spacing: 1px; margin: 16px 0 6px; }
  ul { padding-left: 20px; margin: 4px 0; }
  li { margin-bottom: 2px; }
</style>
</head>
<body>
  <div class="no-print banner">
    ⚠ Aperçu avant impression — utilisez Ctrl+P (Cmd+P) pour enregistrer en PDF.
    <button class="btn-print" onclick="window.print()" style="margin-left:12px;">Imprimer / Enregistrer PDF</button>
  </div>

  <div class="header">
    <h1>${label.replace(/_/g, " ")}</h1>
    ${candidateName ? `<p class="meta">Candidat : ${candidateName}</p>` : ""}
    ${offerTitle && offerCompany ? `<p class="meta">Poste : ${offerTitle} — ${offerCompany}</p>` : ""}
    <p class="meta">Exporté le ${new Date().toLocaleDateString("fr-FR")} via ELTON OS</p>
  </div>

  <div class="content">${safeContent.replace(/<br>/g, "\n")}</div>
</body>
</html>`;
}

// ─── Markdown export ─────────────────────────────

export function renderMarkdownExport(content: string, type: string): string {
  const label = DOC_LABELS[type] || type;
  return `# ${label.replace(/_/g, " ")}\n\n*Exporté le ${new Date().toLocaleDateString("fr-FR")} via ELTON OS*\n\n${content}`;
}

// ─── ZIP dossier structure ───────────────────────

export interface DossierFile {
  name: string;   // relative path inside ZIP, e.g. "CV/CV_FR.pdf"
  content: string | Uint8Array;
}

export function buildDossierFiles(params: {
  documents: Array<{
    id: string;
    type: string;
    content: string;
    status: string;
    opportunityTitle?: string | null;
    opportunityCompany?: string | null;
  }>;
  opportunityId: string;
  opportunityTitle: string;
  opportunityCompany: string | null;
  analysisText?: string | null;
}): DossierFile[] {
  const files: DossierFile[] = [];
  const { documents, opportunityTitle, opportunityCompany, analysisText } = params;

  // Strategy summary
  let strategy = `ELTON OS — Dossier de candidature\n`;
  strategy += `=================================\n`;
  strategy += `Poste : ${opportunityTitle}\n`;
  if (opportunityCompany) strategy += `Entreprise : ${opportunityCompany}\n`;
  strategy += `Date : ${new Date().toLocaleDateString("fr-FR")}\n`;
  strategy += `Documents : ${documents.length}\n`;
  strategy += `Approuvés : ${documents.filter(d => d.status === "APPROVED").length}\n`;
  strategy += `\n`;
  strategy += `Ce dossier a été généré par ELTON OS.\n`;
  strategy += `Tous les documents ont été relus et validés humainement avant export.\n`;
  strategy += `Aucune candidature n'a été envoyée automatiquement.\n`;

  files.push({ name: "00_Resume_strategie.txt", content: strategy });

  // Analysis
  if (analysisText) {
    files.push({ name: "01_Analyse_offre.txt", content: `ANALYSE DE L'OFFRE\n=================\n\n${analysisText}` });
  }

  // Documents grouped by type
  for (const doc of documents) {
    const isApproved = doc.status === "APPROVED";
    const content = isApproved
      ? doc.content
      : `[BROUILLON — Document ${doc.status} — à valider avant envoi]\n\n${doc.content}`;

    const ext = "txt";
    const folder = doc.type.startsWith("cv") ? "CV" :
      doc.type.startsWith("lettre") || doc.type.startsWith("cover") ? "Lettres" :
      doc.type.startsWith("email") ? "Emails" :
      doc.type.startsWith("linkedin") ? "LinkedIn" :
      "ATS";

    const prefix = isApproved ? "" : "BROUILLON_";
    const filename = generateExportFilename(doc.type, opportunityCompany, opportunityTitle, ext);
    files.push({ name: `${folder}/${prefix}${filename}`, content });
  }

  return files;
}
