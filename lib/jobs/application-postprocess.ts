/**
 * Post-processing de cohérence IA — le profil est toujours la source de vérité.
 * Fonctions pures, testables.
 */

export interface CandidateProfile {
  languages: string | null;   // JSON array: ["Français", "Anglais", "Espagnol", "Portugais"]
  cvIncludeLinkedIn: boolean | null;
  targetSalary: string | null;
}

/* ─── Langues ────────────────────────────── */

/**
 * Extrait la liste des langues du profil (source de vérité).
 */
export function extractProfileLanguages(languagesRaw: string | null | undefined): string[] {
  if (!languagesRaw) return [];
  try {
    const parsed = JSON.parse(languagesRaw);
    if (Array.isArray(parsed)) {
      return parsed
        .map((l: unknown) => {
          const s = typeof l === "string" ? l : String(l);
          // Extraire le nom avant un niveau entre parenthèses
          const match = s.match(/^(.+?)(?:\s*[(\-–—]\s*.+?\s*[)\-–—]?\s*)?$/);
          const name = match?.[1]?.trim() || s.trim();
          return name;
        })
        .filter((l: string) => l.length > 1);
    }
  } catch { /* ignore */ }
  return [];
}

/**
 * Vérifie que toutes les langues du profil apparaissent dans un texte.
 * Si une langue manque dans la section LANGUES, elle est ajoutée.
 * Si aucune section LANGUES n'existe, une section est ajoutée.
 */
export function ensureProfileLanguagesInText(text: string, profileLanguages: string[]): string {
  if (!text || profileLanguages.length === 0) return text;

  const lowerText = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

  // Trouver la section LANGUES
  const langHeaderRegex = /\b(langues|languages)\b\s*\n/i;
  const match = text.match(langHeaderRegex);

  if (match) {
    const headerIndex = match.index!;
    const afterHeader = text.slice(headerIndex + match[0].length);

    // La section langues va jusqu'au prochain titre en majuscules
    const nextSection = afterHeader.search(/\n[A-ZÀ-Ÿ ]{2,}\n/);
    const sectionContent = nextSection >= 0 ? afterHeader.slice(0, nextSection) : afterHeader;
    const sectionEnd = nextSection >= 0
      ? headerIndex + match[0].length + nextSection
      : text.length;

    const sectionLower = sectionContent
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");

    const missing: string[] = [];
    for (const lang of profileLanguages) {
      const langLower = lang
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "");
      if (!sectionLower.includes(langLower)) {
        missing.push(lang);
      }
    }

    if (missing.length > 0) {
      const extraLines = missing.map((l) => `• ${l}`).join("\n");
      return text.slice(0, sectionEnd) + "\n" + extraLines + "\n" + text.slice(sectionEnd);
    }
  } else if (profileLanguages.length > 0 && text.length > 100) {
    // Aucune section LANGUES — on l'ajoute à la fin
    const langBlock = `\n\nLANGUES\n${profileLanguages.map((l) => `• ${l}`).join("\n")}`;
    return text.replace(/\n*$/, "") + langBlock;
  }

  return text;
}

/* ─── LinkedIn ───────────────────────────── */

/**
 * Supprime toute mention ou lien LinkedIn d'un texte
 * si l'utilisateur a cvIncludeLinkedIn = false.
 */
export function stripLinkedInFromText(text: string): string {
  if (!text) return text;
  // Supprimer les URLs linkedin
  let result = text.replace(/https?:\/\/(www\.)?linkedin\.com\/[^\s]+/gi, "");
  // Supprimer "linkedin.com/in/XXXX" mentionné sans URL
  result = result.replace(/linkedin\.com\/in\/[^\s,]+/gi, "");
  // Supprimer "LinkedIn : ..." sur une ligne
  result = result.replace(/^.*linkedIn\s*:.*$/gim, "");
  // Supprimer les lignes vides multiples
  result = result.replace(/\n{3,}/g, "\n\n");
  return result.trim();
}

/* ─── Rémunération ───────────────────────── */

/**
 * Supprime toute mention de rémunération d'un texte
 * si targetSalary est vide, invalide, ou non défini.
 */
export function stripSalaryFromText(text: string): string {
  if (!text) return text;
  // Supprimer les lignes mentionnant la rémunération
  return text
    .replace(/^.*(rémunération|salaire|package|compensation|remuneration).*$/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/* ─── Post-processing complet ────────────── */

export interface PostProcessInput {
  text: string;
  profileLanguages: string[];
  stripLinkedIn: boolean;
  stripSalary: boolean;
}

export interface PostProcessResult {
  text: string;
  changes: string[];
}

/**
 * Post-processeur principal : applique toutes les rgles de cohrence
 * aprs la gnration IA, avant sauvegarde.
 */
export function postProcessApplicationText(input: PostProcessInput): PostProcessResult {
  const changes: string[] = [];
  let text = input.text;

  // 1. Langues du profil
  if (input.profileLanguages.length > 0) {
    const before = text;
    text = ensureProfileLanguagesInText(text, input.profileLanguages);
    if (text !== before) {
      changes.push("langues: ajout des langues manquantes du profil");
    }
  }

  // 2. LinkedIn
  if (input.stripLinkedIn) {
    const before = text;
    text = stripLinkedInFromText(text);
    if (text !== before) {
      changes.push("linkedin: supprimé du texte (cvIncludeLinkedIn=false)");
    }
  }

  // 3. Rémunération
  if (input.stripSalary) {
    const before = text;
    text = stripSalaryFromText(text);
    if (text !== before) {
      changes.push("rémunération: supprimée du texte (targetSalary vide)");
    }
  }

  // 4. Tiret long (ChatGPT artifact) — toujours appliqué
  const beforeEmDash = text;
  text = stripEmDashesFromText(text);
  if (text !== beforeEmDash) {
    changes.push("tirets longs: remplacés par ponctuation standard");
  }

  return { text, changes };
}

/* ─── Tiret long ─────────────────────────── */

/**
 * Remplace les tirets longs (—, –) et autres artefacts ChatGPT
 * par la ponctuation française standard.
 */
export function stripEmDashesFromText(text: string): string {
  if (!text) return text;
  return text
    // Remplacer les tirets cadratins (em dash) et demi-cadratins (en dash)
    .replace(/[—–]/g, ", ")
    // Nettoyer les doubles virgules
    .replace(/,\s*,/g, ",")
    // Nettoyer les doubles espaces (laisse les sauts de ligne intacts)
    .replace(/ {2,}/g, " ")
    // Nettoyer les lignes qui deviendraient juste ", "
    .replace(/^,\s+/gm, "")
    // Remplacer "Objet : Candidature, " par "Objet : Candidature au poste de "
    .replace(/Objet\s*:\s*Candidature,\s*/gi, "Objet : Candidature au poste de ");
}