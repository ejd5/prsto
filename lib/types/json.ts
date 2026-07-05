// ─── Types JSON partagés ─────────────────────────
// Un seul endroit pour les types liés au JSON, utilisable
// dans tout le projet sans recréer des alias locaux.

export type JsonPrimitive = string | number | boolean | null;

export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

export interface JsonObject {
  [key: string]: JsonValue;
}

export type JsonArray = Array<JsonValue>;
