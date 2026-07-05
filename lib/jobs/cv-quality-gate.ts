/**
 * CV Quality Gate
 * Quality checks before CV display/export.
 * Returns warnings (non-blocking) and errors (blocking).
 */

export interface QualityGateResult {
  passed: boolean;
  warnings: QualityIssue[];
  errors: QualityIssue[];
  score: number;
}

export interface QualityIssue {
  code: string;
  severity: "error" | "warning";
  message: string;
  field?: string;
}

const INTERNAL_MARKERS = [
  "POSTE TERMINÉ", "POSTE ACTIF", "sendableToAI", "semanticScore",
  "reasonCode", "globalScore", "redFlagsJson",
];

/**
 * Run quality gate on generated CV content.
 */
export function checkCvQuality(content: string): QualityGateResult {
  const warnings: QualityIssue[] = [];
  const errors: QualityIssue[] = [];
  let score = 100;

  // 1. Check for internal markers (errors)
  for (const marker of INTERNAL_MARKERS) {
    const regex = new RegExp(marker, "gi");
    if (regex.test(content)) {
      errors.push({ code: "INTERNAL_MARKER", severity: "error", message: `Marqueur technique "${marker}" présent dans le CV.`, field: "content" });
      score -= 20;
    }
  }

  // 2. Check for "undefined" / "null" / "N/A" text (errors)
  if (/undefined|null|NaN/.test(content)) {
    errors.push({ code: "UNDEFINED_TEXT", severity: "error", message: "Texte 'undefined' ou 'null' présent dans le CV.", field: "content" });
    score -= 15;
  }

  if (/^(N\/A|Non renseigné|Aucune|Sans objet)$/im.test(content)) {
    warnings.push({ code: "PLACEHOLDER_TEXT", severity: "warning", message: "Texte de placeholder présent dans le CV.", field: "content" });
    score -= 5;
  }

  // 3. Check content length
  if (content.length < 300) {
    errors.push({ code: "TOO_SHORT", severity: "error", message: "CV trop court (moins de 300 caractères).", field: "content" });
    score -= 20;
  }

  // 4. Check for duplicate language listings
  const langMatches = content.match(/(Français|Anglais|Espagnol|Portugais|Allemand|Italien)/gi);
  if (langMatches) {
    const unique = new Set(langMatches.map((l) => l.toLowerCase()));
    if (langMatches.length > unique.size * 1.5) {
      warnings.push({ code: "DUPLICATE_LANGUAGES", severity: "warning", message: "Langues potentiellement dupliquées.", field: "languages" });
      score -= 10;
    }
  }

  // 5. Check for duplicate skills
  const skillLines = content.match(/^• .+$/gm);
  if (skillLines) {
    const seen = new Set<string>();
    const skills = skillLines.map((s) => s.replace(/^• /, "").toLowerCase().trim());
    for (const skill of skills) {
      const key = skill.replace(/\(.*?\)/g, "").trim();
      if (seen.has(key)) {
        warnings.push({ code: "DUPLICATE_SKILLS", severity: "warning", message: `Compétence dupliquée : "${key}".`, field: "skills" });
        score -= 5;
        break;
      }
      seen.add(key);
    }
  }

  // 6. Check for technical JSON residue
  if (/"[a-zA-Z]+"\s*:\s*"/.test(content)) {
    warnings.push({ code: "JSON_RESIDUE", severity: "warning", message: "Résidu JSON présent dans le texte.", field: "content" });
    score -= 10;
  }

  return {
    passed: errors.length === 0,
    warnings,
    errors,
    score: Math.max(0, score),
  };
}
