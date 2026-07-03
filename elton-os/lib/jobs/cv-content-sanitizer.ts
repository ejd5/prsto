/**
 * CV Content Sanitizer
 * Removes internal markers, technical labels, and audit data from CV output.
 * Ensures the CV looks like a professional candidate document, never a DB export.
 */

const INTERNAL_MARKERS = [
  /POSTE TERMINÉ/gi,
  /POSTE ACTIF/gi,
  /poste terminé/gi,
  /poste actif/gi,
  /\(POSTE TERMINÉ\)/gi,
  /\(POSTE ACTIF\)/gi,
  /\bconfirmed\b/gi,
  /\bunconfirmed\b/gi,
  /\binternal\b/gi,
  /source\s*:\s*\w+/gi,
  /confidence\s*:\s*\w+/gi,
  /sendableToAI/gi,
  /semanticScore/gi,
  /semanticConfidence/gi,
  /reasonCode/gi,
  /recommendedAction/gi,
  /executiveScore/gi,
  /locationScore/gi,
  /globalScore/gi,
  /redFlagsJson/gi,
  /reasonsJson/gi,
];

/**
 * Remove all internal/technical markers from CV text.
 */
export function sanitizeCvText(text: string): string {
  if (!text) return "";
  let result = text;
  for (const pattern of INTERNAL_MARKERS) {
    result = result.replace(pattern, "");
  }
  // Clean up empty parentheses left behind
  result = result.replace(/\(\s*\)/g, "");
  // Clean up double spaces, double newlines
  result = result.replace(/ {2,}/g, " ");
  result = result.replace(/\n{3,}/g, "\n\n");
  return result.trim();
}

/**
 * Sanitize a single experience line — strip internal date markers.
 */
export function sanitizeExperienceLine(line: string): string {
  return line
    .replace(/\(POSTE TERMINÉ\)/gi, "")
    .replace(/\(POSTE ACTIF\)/gi, "")
    .replace(/\(poste terminé\)/gi, "")
    .replace(/\(poste actif\)/gi, "")
    .replace(/ {2,}/g, " ")
    .trim();
}

/**
 * Clean a section title for display.
 */
export function sanitizeSectionTitle(title: string): string {
  return title
    .replace(/^#{1,3}\s*/gm, "")
    .replace(/\*{2}/g, "")
    .replace(/_{2,}/g, "")
    .replace(/[-]{2,}/g, "")
    .trim();
}

/**
 * Normalize date ranges for CV display.
 */
export function normalizeDateRangeForCv(startDate: string, endDate: string | null): string {
  if (!startDate) return "";
  const fmt = (d: string) => {
    const [y, m] = d.split("-");
    const months = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
    ];
    return m ? `${months[parseInt(m) - 1] || m} ${y}` : y;
  };
  const start = fmt(startDate);
  const end = endDate && endDate.trim() ? fmt(endDate) : "À ce jour";
  return `${start} — ${end}`;
}
