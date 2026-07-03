/**
 * Application Readiness Check
 * Verifies that a draft is ready to be sent to a recruiter.
 */

export interface ReadinessCheck {
  code: string;
  label: string;
  passed: boolean;
  detail?: string;
}

export interface ReadinessResult {
  score: number;
  status: "not_ready" | "needs_review" | "ready";
  checks: ReadinessCheck[];
}

/**
 * Check if rendered CV content contains internal markers.
 */
function hasInternalMarkers(text: string): boolean {
  return /POSTE TERMINÉ|POSTE ACTIF|sendableToAI|semanticScore|reasonCode/.test(text || "");
}

/**
 * Check if JSON array formatting leaked into text.
 */
function hasJsonResidue(text: string): boolean {
  return /^\[".*"\]$|^\[".*"\]\s/.test(text?.trim() || "");
}

/**
 * Check for PRSTO footer text.
 */
function hasEltonOsFooter(text: string): boolean {
  return /CV généré par PRSTO|Document confidentiel/.test(text || "");
}

/**
 * Run readiness checks on a draft.
 */
export function checkApplicationReadiness(params: {
  cvContent?: string | null;
  letterContent?: string | null;
  jobTitle: string;
  company: string;
}): ReadinessResult {
  const checks: ReadinessCheck[] = [];
  let score = 100;

  // 1. Job title present
  const titleOk = params.jobTitle && params.jobTitle.length > 3;
  checks.push({ code: "job_title", label: "Titre du poste", passed: !!titleOk });
  if (!titleOk) score -= 20;

  // 2. Company present
  const companyOk = params.company && params.company.length > 2;
  checks.push({ code: "company", label: "Entreprise", passed: !!companyOk });
  if (!companyOk) score -= 15;

  // 3. CV content exists
  const hasCv = !!params.cvContent && params.cvContent.length > 100;
  checks.push({ code: "cv_content", label: "CV adapté", passed: !!hasCv });
  if (!hasCv) score -= 20;

  // 4. No internal markers in CV
  const cleanCv = params.cvContent ? !hasInternalMarkers(params.cvContent) : true;
  checks.push({ code: "cv_no_markers", label: "CV sans marqueurs techniques", passed: cleanCv });
  if (!cleanCv) { score -= 15; }

  // 5. No PRSTO footer
  const noFooter = params.cvContent ? !hasEltonOsFooter(params.cvContent) : true;
  checks.push({ code: "cv_no_footer", label: "CV sans footer PRSTO", passed: noFooter });
  if (!noFooter) score -= 15;

  // 6. No JSON residue in CV
  const noJson = params.cvContent ? !hasJsonResidue(params.cvContent) : true;
  checks.push({ code: "cv_no_json", label: "CV sans JSON brut", passed: noJson });
  if (!noJson) score -= 10;

  // 7. Letter exists
  const hasLetter = !!params.letterContent && params.letterContent.length > 100;
  checks.push({ code: "letter_content", label: "Lettre de motivation", passed: !!hasLetter });
  if (!hasLetter) score -= 10;

  // 8. No internal markers in letter
  const cleanLetter = params.letterContent ? !hasInternalMarkers(params.letterContent) : true;
  checks.push({ code: "letter_clean", label: "Lettre sans marqueurs", passed: cleanLetter });
  if (!cleanLetter) score -= 10;

  const status = score >= 80 ? "ready" : score >= 50 ? "needs_review" : "not_ready";

  return { score: Math.max(0, score), status, checks };
}
