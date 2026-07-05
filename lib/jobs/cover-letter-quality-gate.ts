/**
 * Cover Letter Quality Gate
 * Checks that generated cover letters meet minimum quality standards.
 */

export interface LetterQualityIssue {
  code: string;
  severity: "error" | "warning";
  message: string;
}

export interface LetterQualityResult {
  passed: boolean;
  errors: LetterQualityIssue[];
  warnings: LetterQualityIssue[];
  score: number;
}

const MIN_PARAGRAPHS = 3;
const MIN_WORDS = 180;
const MAX_WORDS = 500;

/**
 * Check cover letter quality.
 */
export function checkLetterQuality(letter: string, jobTitle: string, company: string): LetterQualityResult {
  const errors: LetterQualityIssue[] = [];
  const warnings: LetterQualityIssue[] = [];
  let score = 100;

  if (!letter || letter.trim().length < 50) {
    errors.push({ code: "TOO_SHORT", severity: "error", message: "Lettre trop courte (moins de 50 caractères)." });
    score -= 40;
  }

  // Word count
  const words = letter.split(/\s+/).filter(Boolean);
  if (words.length < MIN_WORDS) {
    errors.push({ code: "TOO_FEW_WORDS", severity: "error", message: `Lettre trop courte : ${words.length} mots (minimum ${MIN_WORDS}).` });
    score -= 25;
  }
  if (words.length > MAX_WORDS) {
    warnings.push({ code: "TOO_MANY_WORDS", severity: "warning", message: `Lettre longue : ${words.length} mots (maximum recommandé ${MAX_WORDS}).` });
    score -= 5;
  }

  // Paragraph count
  const paragraphs = letter.split(/\n\s*\n/).filter((p) => p.trim().length > 20);
  if (paragraphs.length < MIN_PARAGRAPHS) {
    errors.push({ code: "TOO_FEW_PARAGRAPHS", severity: "error", message: `Lettre : ${paragraphs.length} paragraphe(s) (minimum ${MIN_PARAGRAPHS}).` });
    score -= 20;
  }

  // Contains company name
  if (company && !letter.includes(company)) {
    warnings.push({ code: "MISSING_COMPANY", severity: "warning", message: "La lettre ne mentionne pas le nom de l'entreprise." });
    score -= 10;
  }

  // Contains job title
  if (jobTitle && !letter.includes(jobTitle)) {
    warnings.push({ code: "MISSING_JOB_TITLE", severity: "warning", message: "La lettre ne mentionne pas le titre du poste." });
    score -= 10;
  }

  // Contains generic placeholders
  if (/\[.*?\]/.test(letter)) {
    errors.push({ code: "PLACEHOLDER", severity: "error", message: "La lettre contient des placeholders. Corrigez avant envoi." });
    score -= 20;
  }

  // Checks for technical/audit text
  if (/POSTE TERMINÉ|sendableToAI|semanticScore|reasonCode|undefined|null/.test(letter)) {
    errors.push({ code: "TECHNICAL_TEXT", severity: "error", message: "Marqueurs techniques présents dans la lettre." });
    score -= 25;
  }

  // Excessive repetition detection
  const wordFreq: Record<string, number> = {};
  for (const word of words) {
    const lower = word.toLowerCase();
    if (lower.length > 4) {
      wordFreq[lower] = (wordFreq[lower] || 0) + 1;
    }
  }
  for (const [word, count] of Object.entries(wordFreq)) {
    if (count > words.length * 0.08 && count >= 4) {
      warnings.push({ code: "EXCESSIVE_REPETITION", severity: "warning", message: `Mot "${word}" répété ${count} fois.` });
      score -= 5;
      break;
    }
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
    score: Math.max(0, score),
  };
}

/**
 * Quick check if a letter is usable (non-blocking for UX).
 */
export function isLetterUsable(result: LetterQualityResult): boolean {
  return result.score >= 40;
}
