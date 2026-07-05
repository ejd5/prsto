/**
 * CORS helper for PRSTO Chrome Extension.
 *
 * Only chrome-extension:// origins listed in PRSTO_EXTENSION_ALLOWED_ORIGINS
 * are permitted. Never wildcard * with credentials.
 */

const ALLOWED_METHODS = "GET, POST, OPTIONS";
const ALLOWED_HEADERS = "Content-Type, Authorization, x-api-token";

export function getAllowedExtensionOrigins(): string[] {
  const raw = process.env.ELTON_EXTENSION_ALLOWED_ORIGINS || "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^chrome-extension:\/\/[a-z]{32}$/.test(s));
}

export function isAllowedExtensionOrigin(origin: string | null): boolean {
  if (!origin) return false;
  // In dev mode, accept any valid chrome-extension:// origin
  // regardless of whether PRSTO_EXTENSION_ALLOWED_ORIGINS is set.
  if (process.env.NODE_ENV === "development" && /^chrome-extension:\/\/[a-z]{32}$/.test(origin)) {
    return true;
  }
  const allowed = getAllowedExtensionOrigins();
  if (allowed.length > 0) return allowed.includes(origin);
  return false;
}

function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin");
  if (!origin || !isAllowedExtensionOrigin(origin)) {
    return { "Vary": "Origin" };
  }
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": ALLOWED_METHODS,
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin",
  };
}

export function withExtensionCors(response: Response, request: Request): Response {
  const existing = response.headers.get("Access-Control-Allow-Origin");
  if (existing) return response;

  const headers = corsHeaders(request);
  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
  for (const [k, v] of Object.entries(headers)) {
    newResponse.headers.set(k, v);
  }
  return newResponse;
}

export function createCorsPreflightResponse(request: Request): Response {
  const origin = request.headers.get("origin");
  if (!origin || !isAllowedExtensionOrigin(origin)) {
    return new Response(null, {
      status: 204,
      headers: { "Vary": "Origin" },
    });
  }
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": ALLOWED_METHODS,
      "Access-Control-Allow-Headers": ALLOWED_HEADERS,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin",
    },
  });
}
