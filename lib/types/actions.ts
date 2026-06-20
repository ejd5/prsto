// ─── Types d'actions serveur ELTON OS ─────────────
// Types standardisés pour les retours de server actions,
// les fonctions d'export, et les handlers de formulaire.

import type { JsonObject } from "./json";

// ─── Résultat d'export ───────────────────────────

export interface ExportSuccess {
  success: true;
  filename: string;
  content?: string;
  base64?: string;
  html?: string;
}

export interface ExportFailure {
  success: false;
  error: string;
}

export type ExportResult = ExportSuccess | ExportFailure;

// ─── Résultat de suppression ─────────────────────

export interface DeleteResult {
  success: boolean;
  error?: string;
}

// ─── Résultat d'IA génération ────────────────────

export interface GenerateResult {
  success: boolean;
  content?: string;
  model?: string;
  responseTimeMs?: number;
  error?: string;
  errorType?: "no_key" | "network" | "timeout" | "model_unavailable" | "invalid_response" | "unknown";
  fallbackUsed: boolean;
}

// ─── Données exportables (JSON-safe) ─────────────

export type ExportableRecord = JsonObject | null;

// ─── Pagination ──────────────────────────────────

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
