/**
 * Utilitaires Autofill — fonctions pures, pas de "use server".
 * Importables depuis des composants client.
 */
import type { AutofillField, AutofillFormData } from "./autofill";

/**
 * Exporte les données d'autofill en format clé-valeur simple
 * pour injection dans un formulaire.
 */
export function fieldsToMap(fields: AutofillField[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const f of fields) {
    if (!f.blocked && f.value) map[f.key] = f.value;
  }
  return map;
}

/**
 * Retourne la liste des champs bloqués par l'utilisateur.
 */
export function getBlockedFieldKeys(fields: AutofillField[]): string[] {
  return fields.filter((f) => f.blocked).map((f) => f.key);
}

/**
 * Compte les champs qui seront effectivement remplis.
 */
export function countAutofillableFields(fields: AutofillField[]): number {
  return fields.filter((f) => !f.blocked && f.value).length;
}
