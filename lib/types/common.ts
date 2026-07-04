// ─── Types partagés PRSTO ─────────────────────
// Types réutilisables dans les libs, actions, et composants.
// Évite les Record<string, unknown> éparpillés et les doublons.

import type { JsonObject } from "./json";

// ─── Erreur typée ────────────────────────────────
// Pattern standard pour les catch blocks : catch (e: unknown) + cast.

export interface TypedError extends Error {
  name: string;
  message: string;
  code?: string;
  statusCode?: number;
}

export function asError(e: unknown): TypedError {
  if (e instanceof Error) return e as TypedError;
  return new Error(String(e)) as TypedError;
}

// ─── Objet générique ─────────────────────────────
// Remplace Record<string, any> et Record<string, unknown>.

export type DataObject = JsonObject;

// ─── Résultat d'action serveur ───────────────────

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ─── Statuts communs ─────────────────────────────

export type Priority = "HIGH" | "MEDIUM" | "LOW" | "AVOID";

export type DocumentStatus = "DRAFT" | "REVIEWED" | "APPROVED" | "EXPORTED";

export type PipelineColumn = "a_postuler" | "en_attente" | "entretien" | "offre" | "ecarte";
