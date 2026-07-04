import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const FONT_SIZE = 11;
const LINE_HEIGHT = 15;
const MARGIN = 50;
const PAGE_WIDTH = 595; // A4
const PAGE_HEIGHT = 842;
const CHARS_PER_LINE = 85; // approximate for 11pt Courier at 50mm margins

function wrapText(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    if (paragraph.length === 0) {
      lines.push("");
      continue;
    }
    let remaining = paragraph;
    while (remaining.length > 0) {
      if (remaining.length <= maxChars) {
        lines.push(remaining);
        break;
      }
      // Try to break at space
      let cut = maxChars;
      while (cut > 0 && remaining[cut] !== " ") cut--;
      if (cut === 0) cut = maxChars; // no space found, force break
      lines.push(remaining.slice(0, cut).trimEnd());
      remaining = remaining.slice(cut).trimStart();
    }
  }
  return lines;
}

export async function generateTextPdf(content: string, title: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Courier);

  const lines = wrapText(content, CHARS_PER_LINE);

  let y = PAGE_HEIGHT - MARGIN;
  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  // Header
  page.drawText(title, { x: MARGIN, y, size: 14, font, color: rgb(0, 0, 0) });
  y -= LINE_HEIGHT + 6;

  // Separator line
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_WIDTH - MARGIN, y },
    thickness: 0.5,
    color: rgb(0.6, 0.6, 0.6),
  });
  y -= LINE_HEIGHT + 4;

  for (const line of lines) {
    if (y < MARGIN + LINE_HEIGHT) {
      page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
    page.drawText(line, { x: MARGIN, y, size: FONT_SIZE, font, color: rgb(0.1, 0.1, 0.1) });
    y -= LINE_HEIGHT;
  }

  return doc.save();
}
