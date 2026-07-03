// ─── AI Connector ───
// Supports multiple providers: DeepSeek, OpenRouter, or any OpenAI-compatible API
// All API keys are stored encrypted via lib/security/secrets.ts

import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/security/secrets";

// ─── Types ────────────────────────────────────────

export interface DeepSeekConfig {
  apiKey: string;
  baseUrl: string;
  defaultModel: string;
  proModel: string;
  timeout: number;
  temperature: number;
  provider: "deepseek" | "openrouter" | "nim";
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

// ─── Provider presets ─────────────────────────────

const PROVIDER_DEFAULTS: Record<string, { baseUrl: string; defaultModel: string; proModel: string }> = {
  deepseek: {
    baseUrl: "https://api.deepseek.com",
    defaultModel: "deepseek-chat",
    proModel: "deepseek-chat",
  },
  openrouter: {
    baseUrl: "https://openrouter.ai/api",
    defaultModel: "google/gemma-4-26b-a4b-it:free",
    proModel: "google/gemma-4-31b-it:free",
  },
  nim: {
    baseUrl: "https://integrate.api.nvidia.com",
    defaultModel: "deepseek-ai/deepseek-v4-pro",
    proModel: "z-ai/glm-5.1",
  },
};

// ─── Configuration ────────────────────────────────

export async function getDeepSeekConfig(): Promise<DeepSeekConfig | null> {
  const settings = await prisma.setting.findFirst();
  if (!settings) return null;

  const provider = (settings.aiProvider || "none") as "deepseek" | "openrouter" | "nim";

  if (provider === "nim") {
    const apiKey = process.env.NVIDIA_NIM_API_KEY || null;
    if (!apiKey || apiKey.trim() === "") return null;
    const preset = PROVIDER_DEFAULTS.nim;
    return {
      apiKey,
      baseUrl: preset.baseUrl,
      defaultModel: preset.defaultModel,
      proModel: preset.proModel,
      timeout: 60000,
      temperature: 0.4,
      provider: "nim",
    };
  }

  const apiKey = settings.apiKey ? decryptSecret(settings.apiKey) : null;
  if (!apiKey || apiKey.trim() === "") return null;

  const preset = PROVIDER_DEFAULTS[provider] || PROVIDER_DEFAULTS.deepseek;

  return {
    apiKey,
    baseUrl: settings.baseUrl || preset.baseUrl,
    defaultModel: settings.defaultModel || preset.defaultModel,
    proModel: settings.proModel || preset.proModel,
    timeout: (settings.timeout || 25) * 1000,
    temperature: settings.temperature ?? 0.4,
    provider,
  };
}

export function getProviderName(provider: string): string {
  if (provider === "openrouter") return "OpenRouter";
  if (provider === "nim") return "NVIDIA NIM";
  return "DeepSeek";
}

export function getProviderPresets() {
  return PROVIDER_DEFAULTS;
}

// ─── OpenRouter fallback models ──────────────────
// Si le premier modèle échoue (rate limit, indisponible...), on essaie les suivants
const OPENROUTER_FALLBACK_MODELS = [
  "google/gemma-4-26b-a4b-it:free",      // Google Gemma 4 26B — prioritaire
  "qwen/qwen3-next-80b-a3b-instruct:free", // Qwen3 Next 80B
  "nvidia/nemotron-3-ultra-550b-a55b:free", // Nemotron 3 Ultra 550B
  "meta-llama/llama-3.3-70b-instruct:free",  // Llama 3.3 70B
  "openai/gpt-oss-120b:free",                // GPT-OSS 120B
  "nousresearch/hermes-3-llama-3.1-405b:free", // Hermes 3 405B
];

async function tryWithFallback(
  config: DeepSeekConfig,
  body: Record<string, unknown>,
  signal: AbortSignal,
): Promise<{ ok: boolean; status: number; body: unknown }> {
  // Construit la liste : modèle configuré en premier, puis fallbacks
  const configuredModel = (body.model as string) || config.defaultModel;
  const modelsToTry = [configuredModel];
  if (config.provider === "openrouter") {
    for (const m of OPENROUTER_FALLBACK_MODELS) {
      if (!modelsToTry.includes(m)) modelsToTry.push(m);
    }
  }

  let lastError: { status: number; body: unknown } = { status: 0, body: null };

  for (const model of modelsToTry) {
    const fetchBody = { ...body, model };
    const response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: getProviderHeaders(config),
      body: JSON.stringify(fetchBody),
      signal,
    });

    if (response.ok) {
      const data = await response.json();
      return { ok: true, status: 200, body: data };
    }

    // 429 = rate limit, 404/400 = model unavailable → on essaie le suivant
    // 401/403 = auth error → pas de fallback
    if (response.status === 401 || response.status === 403) {
      const bodyText = await response.text().catch(() => "");
      return { ok: false, status: response.status, body: bodyText };
    }

    const bodyText = await response.text().catch(() => "");
    lastError = { status: response.status, body: bodyText };

    // Pour les autres erreurs (429, 404, 503...), on continue avec le modèle suivant
    if (modelsToTry.length > 1) {
      // Petit délai pour éviter de spammer
      await new Promise(r => setTimeout(r, 200));
    }
  }

  return { ok: false, ...lastError };
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

// ─── Provider-specific headers ─────────────────────

function getProviderHeaders(config: DeepSeekConfig): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${config.apiKey}`,
  };
  if (config.provider === "openrouter") {
    headers["HTTP-Referer"] = "http://localhost:3000";
    headers["X-Title"] = "PRSTO";
  }
  return headers;
}

// ─── Test connection ──────────────────────────────

export async function testDeepSeekConnection(): Promise<ConnectionTestResult> {
  const config = await getDeepSeekConfig();

  if (!config) {
    return {
      success: false,
      status: "no_key",
      error: "Aucune clé API configurée. DeepSeek est optionnel, PRSTO fonctionne sans.",
    };
  }

  const controller = new AbortController();
  const timeoutMs = Math.min(config.timeout, 15000);
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const startTime = Date.now();

  try {
    const result = await tryWithFallback(
      config,
      {
        model: config.defaultModel,
        messages: [{ role: "user", content: "Réponds uniquement \"ok\"." }],
        max_tokens: 5,
        temperature: 0,
      },
      controller.signal,
    );

    clearTimeout(timeoutId);
    const responseTimeMs = Date.now() - startTime;

    if (result.ok) {
      const data = result.body as { model?: string };
      return {
        success: true,
        status: "connected",
        model: data.model || config.defaultModel,
        responseTimeMs,
        maskedKey: maskApiKey(config.apiKey),
      };
    }

    if (result.status === 401 || result.status === 403) {
      return { success: false, status: "no_key", error: "Clé API invalide ou expirée.", responseTimeMs, maskedKey: maskApiKey(config.apiKey) };
    }
    if (result.status === 404) {
      return { success: false, status: "model_unavailable", error: `Modèle "${config.defaultModel}" indisponible.`, responseTimeMs };
    }
    if (result.status === 429) {
      return { success: false, status: "network_error", error: "Rate limit atteint — réessayez plus tard.", responseTimeMs };
    }
    const bodyText = typeof result.body === "string" ? result.body : JSON.stringify(result.body || {});
    return { success: false, status: "network_error", error: `Erreur API (${result.status}): ${bodyText.slice(0, 200)}`, responseTimeMs };
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
  timeout?: number;
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
  const timeoutMs = params.timeout ?? Math.min(Math.max(config.timeout, 30000), 120000);
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

    const result = await tryWithFallback(config, body, controller.signal);

    clearTimeout(timeoutId);
    const responseTimeMs = Date.now() - startTime;

    if (result.ok) {
      const data = result.body as { choices?: Array<{ message?: { content?: string } }>; model?: string };
      const content = data.choices?.[0]?.message?.content?.trim();

      if (!content) {
        return { success: false, error: "Réponse vide du modèle", errorType: "invalid_response", fallbackUsed: false, responseTimeMs };
      }

      return {
        success: true,
        content,
        model: data.model || model,
        responseTimeMs,
        fallbackUsed: (data.model || "") !== model,
      };
    } else {
      const errorType = result.status === 401 || result.status === 403 ? "no_key"
        : result.status === 404 ? "model_unavailable"
        : result.status === 429 ? "timeout"
        : "unknown";
      const bodyText = typeof result.body === "string" ? result.body : JSON.stringify(result.body || {});
      return { success: false, error: `API error ${result.status}: ${bodyText.slice(0, 200)}`, errorType, fallbackUsed: false, responseTimeMs };
    }
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

// ─── Streaming (SSE) — pour éviter les timeouts ALB ───────────────
// Renvoie un ReadableStream de chunks texte (pas un objet GenerateResult).
// En cas d'erreur, le chunk final contiendra un message d'erreur préfixé par [ERROR].

export async function streamWithDeepSeek(params: {
  systemPrompt?: string;
  userPrompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}): Promise<{
  stream: ReadableStream<Uint8Array> | null;
  error?: string;
  errorType?: "no_key" | "network" | "timeout" | "model_unavailable" | "unknown";
}> {
  const config = await getDeepSeekConfig();
  if (!config) {
    return { stream: null, error: "IA non configurée", errorType: "no_key" };
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
  const timeoutMs = params.timeout ?? 180000; // stream : on peut se permettre plus long
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: getProviderHeaders(config),
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        stream: true,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    const aborted = err instanceof Error && err.name === "AbortError";
    return {
      stream: null,
      error: aborted ? "Timeout" : "Erreur réseau",
      errorType: aborted ? "timeout" : "network",
    };
  }

  if (!response.ok || !response.body) {
    clearTimeout(timeoutId);
    return {
      stream: null,
      error: `Réponse HTTP ${response.status}`,
      errorType: response.status === 401 || response.status === 403 ? "no_key" : "model_unavailable",
    };
  }

  // Transformer le SSE de l'API en un flux de texte simple
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const upstream = response.body;
  let sseBuffer = "";

  const stream = new ReadableStream<Uint8Array>({
    async start(streamController) {
      const reader = upstream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          sseBuffer += decoder.decode(value, { stream: true });

          // Parser les lignes SSE : data: {...}\n\n
          const lines = sseBuffer.split("\n");
          sseBuffer = lines.pop() || "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data:")) continue;
            const payload = trimmed.slice(5).trim();
            if (payload === "[DONE]") {
              streamController.close();
              clearTimeout(timeoutId);
              return;
            }
            try {
              const obj = JSON.parse(payload);
              const delta = obj?.choices?.[0]?.delta?.content;
              if (typeof delta === "string" && delta.length > 0) {
                streamController.enqueue(encoder.encode(delta));
              }
            } catch {
              // ignore parse errors on partial chunks
            }
          }
        }
        streamController.close();
      } catch (err) {
        const aborted = err instanceof Error && err.name === "AbortError";
        streamController.enqueue(
          encoder.encode(
            aborted
              ? "\n\n[TIMEOUT — la génération a dépassé 3 minutes. Reformulez ou découpez votre demande.]"
              : "\n\n[Erreur pendant la génération. Réessayez.]"
          )
        );
        streamController.close();
      } finally {
        clearTimeout(timeoutId);
      }
    },
    cancel() {
      clearTimeout(timeoutId);
      controller.abort();
    },
  });

  return { stream };
}
