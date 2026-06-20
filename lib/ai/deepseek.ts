// ─── DeepSeek Connector ───
// Robust API connector with automatic fallback to local templates
// DeepSeek is OPTIONAL — the app works fully without an API key
// No secrets are ever logged, stored in code, or exported

import { prisma } from "@/lib/prisma";

// ─── Types ────────────────────────────────────────

export interface DeepSeekConfig {
  apiKey: string;
  baseUrl: string;
  defaultModel: string;
  proModel: string;
  timeout: number;
  temperature: number;
}

export interface DeepSeekMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GenerateResult {
  success: boolean;
  content?: string;
  model?: string;
  responseTimeMs?: number;
  error?: string;
  errorType?: "no_key" | "network" | "timeout" | "model_unavailable" | "invalid_response" | "unknown";
  fallbackUsed: boolean;
}

export interface ConnectionTestResult {
  success: boolean;
  status: "connected" | "no_key" | "network_error" | "model_unavailable" | "timeout" | "invalid_response";
  model?: string;
  responseTimeMs?: number;
  error?: string;
  maskedKey?: string;
}

// ─── Configuration ────────────────────────────────

export async function getDeepSeekConfig(): Promise<DeepSeekConfig | null> {
  const settings = await prisma.setting.findFirst();
  if (!settings) return null;

  const apiKey = settings.apiKey;
  if (!apiKey || apiKey.trim() === "") return null;

  return {
    apiKey,
    baseUrl: settings.baseUrl || "https://api.deepseek.com",
    defaultModel: settings.defaultModel || "deepseek-v4-flash",
    proModel: settings.proModel || "deepseek-v4-pro",
    timeout: (settings.timeout || 25) * 1000,
    temperature: settings.temperature ?? 0.4,
  };
}

// ─── API Key masking ──────────────────────────────

export function maskApiKey(key: string | null | undefined): string {
  if (!key || key.trim().length < 8) return "clé absente";
  const visible = Math.min(4, Math.floor(key.length / 4));
  return key.slice(0, visible) + "•••" + key.slice(-visible);
}

// ─── Config validation ────────────────────────────

export function validateAiConfig(params: {
  apiKey?: string | null;
  baseUrl?: string;
  model?: string;
  timeout?: number;
  temperature?: number;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (params.apiKey !== undefined && (!params.apiKey || params.apiKey.trim() === "")) {
    errors.push("Clé API absente");
  }

  if (params.baseUrl) {
    try {
      new URL(params.baseUrl);
    } catch {
      errors.push("URL de base invalide");
    }
  }

  if (params.timeout !== undefined && (params.timeout < 5 || params.timeout > 120)) {
    errors.push("Timeout hors plage (5-120 secondes)");
  }

  if (params.temperature !== undefined && (params.temperature < 0 || params.temperature > 2)) {
    errors.push("Température hors plage (0-2)");
  }

  return { valid: errors.length === 0, errors };
}

// ─── Test connection ──────────────────────────────

export async function testDeepSeekConnection(): Promise<ConnectionTestResult> {
  const config = await getDeepSeekConfig();

  if (!config) {
    return {
      success: false,
      status: "no_key",
      error: "Aucune clé API configurée. DeepSeek est optionnel, ELTON OS fonctionne sans.",
    };
  }

  const controller = new AbortController();
  const timeoutMs = Math.min(config.timeout, 15000);
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const startTime = Date.now();

  try {
    const response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.defaultModel,
        messages: [{ role: "user", content: "Réponds uniquement \"ok\"." }],
        max_tokens: 5,
        temperature: 0,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseTimeMs = Date.now() - startTime;

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return { success: false, status: "no_key", error: "Clé API invalide ou expirée.", responseTimeMs, maskedKey: maskApiKey(config.apiKey) };
      }
      if (response.status === 404) {
        return { success: false, status: "model_unavailable", error: `Modèle "${config.defaultModel}" indisponible.`, responseTimeMs };
      }
      if (response.status === 429) {
        return { success: false, status: "network_error", error: "Rate limit atteint — réessayez plus tard.", responseTimeMs };
      }
      const body = await response.text().catch(() => "");
      return { success: false, status: "network_error", error: `Erreur API (${response.status}): ${body.slice(0, 200)}`, responseTimeMs };
    }

    const data = await response.json();
    const model = data.model || config.defaultModel;

    return {
      success: true,
      status: "connected",
      model,
      responseTimeMs,
      maskedKey: maskApiKey(config.apiKey),
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const responseTimeMs = Date.now() - startTime;
    const error = err as Error & { name?: string };

    if (error.name === "AbortError") {
      return { success: false, status: "timeout", error: `Timeout après ${timeoutMs / 1000}s. Vérifiez le réseau ou augmentez le timeout.`, responseTimeMs };
    }

    return { success: false, status: "network_error", error: `Erreur réseau : ${error.message || "inconnue"}.`, responseTimeMs };
  }
}

// ─── Generate with DeepSeek ───────────────────────

export async function generateWithDeepSeek(params: {
  systemPrompt?: string;
  userPrompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseSchema?: object;
}): Promise<GenerateResult> {
  const config = await getDeepSeekConfig();

  if (!config) {
    return { success: false, error: "DeepSeek non configuré", errorType: "no_key", fallbackUsed: false };
  }

  const model = params.model || config.defaultModel;
  const temperature = params.temperature ?? config.temperature;
  const maxTokens = params.maxTokens || 4000;

  const messages: DeepSeekMessage[] = [];
  if (params.systemPrompt) {
    messages.push({ role: "system", content: params.systemPrompt });
  }
  messages.push({ role: "user", content: params.userPrompt });

  const controller = new AbortController();
  const timeoutMs = Math.min(config.timeout, 60000);
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const startTime = Date.now();

  try {
    const body: Record<string, unknown> = {
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
    };

    if (params.responseSchema) {
      body.response_format = { type: "json_object" };
    }

    const response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseTimeMs = Date.now() - startTime;

    if (!response.ok) {
      const errorType = response.status === 401 || response.status === 403 ? "no_key"
        : response.status === 404 ? "model_unavailable"
        : "unknown";
      const bodyText = await response.text().catch(() => "");
      return { success: false, error: `API error ${response.status}: ${bodyText.slice(0, 200)}`, errorType, fallbackUsed: false };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return { success: false, error: "Réponse vide du modèle", errorType: "invalid_response", fallbackUsed: false, responseTimeMs };
    }

    return {
      success: true,
      content,
      model: data.model || model,
      responseTimeMs,
      fallbackUsed: false,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const responseTimeMs = Date.now() - startTime;
    const error = err as Error & { name?: string };
    const errorType = error.name === "AbortError" ? "timeout" : "network";

    return {
      success: false,
      error: error.name === "AbortError" ? `Timeout après ${timeoutMs / 1000}s` : `Erreur réseau : ${error.message || "inconnue"}`,
      errorType,
      fallbackUsed: false,
      responseTimeMs,
    };
  }
}

// ─── Generate JSON with DeepSeek ──────────────────

export async function generateJsonWithDeepSeek<T = unknown>(params: {
  systemPrompt?: string;
  userPrompt: string;
  model?: string;
  temperature?: number;
}): Promise<GenerateResult & { data?: T }> {
  const result = await generateWithDeepSeek({
    systemPrompt: params.systemPrompt,
    userPrompt: `${params.userPrompt}\n\nRéponds UNIQUEMENT avec un objet JSON valide. Pas de markdown, pas de commentaires.`,
    model: params.model,
    temperature: Math.min(params.temperature ?? 0.3, 0.3),
    maxTokens: 2000,
  });

  if (!result.success || !result.content) {
    return result;
  }

  try {
    // Clean possible markdown fences
    let jsonStr = result.content.trim();
    if (jsonStr.startsWith("```json")) jsonStr = jsonStr.slice(7);
    if (jsonStr.startsWith("```")) jsonStr = jsonStr.slice(3);
    if (jsonStr.endsWith("```")) jsonStr = jsonStr.slice(0, -3);
    jsonStr = jsonStr.trim();

    const data = JSON.parse(jsonStr) as T;
    return { ...result, data };
  } catch {
    return { ...result, success: false, error: "JSON invalide retourné par le modèle", errorType: "invalid_response" };
  }
}
