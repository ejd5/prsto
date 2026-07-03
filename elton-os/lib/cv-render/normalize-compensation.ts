/**
 * Normalize compensation target — fonction pure, sans DB, testable.
 * Nettoie les valeurs incohérentes ("800-180K€") et retourne un diagnostic.
 */

interface RawNumber {
  value: number;  // en k€ (après normalisation)
  hasK: boolean;  // le nombre original avait un suffixe k/K
}

/**
 * Extrait les nombres d'une chaîne en gérant les suffixes k/K et les symboles €/$.
 * "120K" → {value: 120, hasK: true}
 * "120000" → {value: 120, hasK: false}
 * "180" → {value: 180, hasK: false}
 */
function extractNumbers(val: string): RawNumber[] {
  // Séparer la chaîne en segments autour des tirets/espaces
  const segments = val.split(/[\s\-–]+/);
  const results: RawNumber[] = [];

  for (const seg of segments) {
    const s = seg.trim();
    if (!s) continue;

    // Ignorer les pourcentages (%)
    if (/%/.test(s)) continue;

    // Ignorer les segments purement texte
    if (!/\d/.test(s)) continue;

    // Ignorer les mots-clés non numériques
    if (/^(variable|bonus|commission|fixe|brut|net|selon|package|à|a|discuter|discutable)$/i.test(s)) continue;

    // Détecter si le segment contient k/K
    const hasK = /[kK]/.test(s);

    // Nettoyer : garder chiffres, point, virgule
    const cleaned = s.replace(/[^0-9.,]/g, "").replace(",", ".").trim();

    if (!cleaned) continue;

    const num = parseFloat(cleaned);
    if (isNaN(num) || num <= 0) continue;

    // Si le nombre a un K et est > 1000, c'est aberrant
    if (hasK && num > 1000) {
      // Marquer comme aberrant avec un flag spécial
      results.push({ value: num, hasK: true });
      continue;
    }

    // Si le nombre n'a pas de K et qu'il est > 1000, c'est probablement en €
    // (ex: "180000" → 180k€)
    const normalizedNum = (!hasK && num > 1000) ? Math.round(num / 1000) : num;

    results.push({ value: normalizedNum, hasK });
  }

  return results;
}

export interface NormalizedCompensation {
  raw: string;
  displayValue: string;
  isValid: boolean;
  warning?: string;
  min: number | null;
  max: number | null;
  currency: string;
  hasVariable: boolean;
}

/**
 * Parse une valeur de rémunération libre et retourne un diagnostic structuré.
 *
 * Accepte : "120-180K€", "120k", "120 000 - 150 000 €", "À discuter", ""
 * Rejette : "800-180K€" (min > max), valeurs aberrantes, formats incompréhensibles
 */
export function normalizeCompensationTarget(raw: string): NormalizedCompensation {
  const val = (raw || "").trim();

  // Vide
  if (!val) {
    return { raw: val, displayValue: "", isValid: true, min: null, max: null, currency: "EUR", hasVariable: false };
  }

  // Texte libre volontaire (ex: "À discuter selon package")
  if (/^(à discuter|selon package|confidentiel|competitive|selon profil|négociable|a discuter)/i.test(val)) {
    return { raw: val, displayValue: val, isValid: true, min: null, max: null, currency: "EUR", hasVariable: false };
  }

  // Détecter devise
  let currency = "EUR";
  if (/\$|USD/i.test(val)) currency = "USD";
  else if (/£|GBP/i.test(val)) currency = "GBP";

  // Détecter variable
  const hasVariable = /variable|bonus|commission|\+\s*\d+%/.test(val);

  // Extraire les nombres en respectant les suffixes k/K/€/$
  const rawNumbers = extractNumbers(val);

  if (rawNumbers.length === 0) {
    // Pas de nombres détectables → c'est peut-être volontaire
    return { raw: val, displayValue: val, isValid: true, min: null, max: null, currency: "EUR", hasVariable };
  }

  // Vérifier si les nombres sont cohérents
  // Un mélange k/non-k n'est incohérent que si un nombre sans k est > 500 (→ ce serait en €)
  // Ex: "120-180K€" : 120 (no K) et 180 (has K) → les deux sont plausibles en K → OK
  // Ex: "800-180K€" : 800 (no K, >500) → probablement en K (800K€), mais 180 (has K=180K€) → incohérent
  const hasSomeK = rawNumbers.some((n) => n.hasK);
  const hasLargeRaw = rawNumbers.some((n) => !n.hasK && n.value > 500);

  // Format mixte avec écart important : "800-180K€" → incohérent
  if (hasSomeK && hasLargeRaw && rawNumbers.length >= 2) {
    const kValues = rawNumbers.filter(n => n.hasK).map(n => n.value);
    const rawValues = rawNumbers.filter(n => !n.hasK && n.value > 500).map(n => n.value);
    if (kValues.length > 0 && rawValues.length > 0) {
      return {
        raw: val,
        displayValue: val,
        isValid: false,
        warning: `Format de rémunération incohérent : les nombres en K (${kValues.join(", ")}) et sans K (${rawValues.join(", ")}) sont mélangés. Utilisez un format homogène, ex: "120-180K€".`,
        min: null, max: null, currency, hasVariable,
      };
    }
  }

  const values = rawNumbers.map((n) => n.value);
  // Garder l'ordre original pour détecter "180-120K€" (premier > deuxième)
  const first = values[0];
  const second = values.length >= 2 ? values[1] : null;
  const min = second !== null ? Math.min(first, second) : first;
  const max = second !== null ? Math.max(first, second) : null;

  // Détection d'incohérence : le premier nombre (borne basse supposée) > deuxième (borne haute)
  if (second !== null && first > second) {
    return {
      raw: val,
      displayValue: val,
      isValid: false,
      warning: `Rémunération incohérente : le minimum (${min}) dépasse le maximum (${max}). Vérifiez votre saisie.`,
      min, max, currency, hasVariable,
    };
  }

  // Détection valeur aberrante (trop grande pour un salaire annuel k€)
  if (min > 2000 && rawNumbers.some((n) => n.hasK)) {
    return {
      raw: val,
      displayValue: val,
      isValid: false,
      warning: `Valeur de rémunération anormalement élevée (${min}k€). Vérifiez votre saisie.`,
      min, max, currency, hasVariable,
    };
  }

  // Format d'affichage
  let displayValue = val;
  if (max !== null && min < 1000 && max < 1000) {
    displayValue = `${min}-${max}K€`;
    if (hasVariable) displayValue += " + variable";
    if (currency !== "EUR") displayValue = `${min}-${max}K${currency === "USD" ? "$" : "£"}`;
  }

  return {
    raw: val,
    displayValue: displayValue || val,
    isValid: true,
    min,
    max,
    currency,
    hasVariable,
  };
}
