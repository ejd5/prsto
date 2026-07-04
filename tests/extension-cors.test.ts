/* ─── CORS tests for Chrome Extension Import Assisté Pro ── */

process.env.NODE_ENV = "development";

import { describe, it, expect, beforeEach } from "vitest";
import {
  isAllowedExtensionOrigin,
  withExtensionCors,
  createCorsPreflightResponse,
  getAllowedExtensionOrigins,
} from "@/lib/http/extension-cors";

const ALLOWED_ID = "akkfmbjfjjklnlkmobadmgeogopakkkd";
const OTHER_ID = "bcdefghijklmnopqrstuvwxyzabcdefg";
const ALLOWED_ORIGIN = `chrome-extension://${ALLOWED_ID}`;
const OTHER_ORIGIN = `chrome-extension://${OTHER_ID}`;

function reqWithOrigin(origin: string, method = "GET"): Request {
  return new Request("http://localhost:3000/api/health", {
    method,
    headers: { origin },
  });
}

function reqWithoutOrigin(): Request {
  return new Request("http://localhost:3000/api/health", { method: "GET" });
}

beforeEach(() => {
  delete process.env.ELTON_EXTENSION_ALLOWED_ORIGINS;
});

/* ─── Category 9: CORS pure functions ───── */

describe("isAllowedExtensionOrigin", () => {
  it("returns true for valid chrome-extension:// origin in dev mode", () => {
    expect(isAllowedExtensionOrigin(ALLOWED_ORIGIN)).toBe(true);
  });

  it("returns true for another valid chrome-extension:// origin in dev mode", () => {
    expect(isAllowedExtensionOrigin(OTHER_ORIGIN)).toBe(true);
  });

  it("returns false for null origin", () => {
    expect(isAllowedExtensionOrigin(null)).toBe(false);
  });

  it("returns false for empty origin", () => {
    expect(isAllowedExtensionOrigin("")).toBe(false);
  });

  it("returns false for http origin", () => {
    expect(isAllowedExtensionOrigin("http://localhost:3000")).toBe(false);
  });

  it("returns false for invalid chrome-extension:// format", () => {
    expect(isAllowedExtensionOrigin("chrome-extension://too-short")).toBe(false);
  });

  it("when ELTON_EXTENSION_ALLOWED_ORIGINS is set in dev mode, all valid chrome-extension origins are still accepted", () => {
    process.env.ELTON_EXTENSION_ALLOWED_ORIGINS = ALLOWED_ORIGIN;
    // Dev mode (NODE_ENV=development at top of file) always accepts any valid extension origin,
    // regardless of env var — env var is only restrictive in production.
    expect(isAllowedExtensionOrigin(ALLOWED_ORIGIN)).toBe(true);
    expect(isAllowedExtensionOrigin(OTHER_ORIGIN)).toBe(true);
  });

  it("when ELTON_EXTENSION_ALLOWED_ORIGINS is set in production, only exact matches are allowed", () => {
    process.env.NODE_ENV = "production";
    process.env.ELTON_EXTENSION_ALLOWED_ORIGINS = ALLOWED_ORIGIN;
    expect(isAllowedExtensionOrigin(ALLOWED_ORIGIN)).toBe(true);
    expect(isAllowedExtensionOrigin(OTHER_ORIGIN)).toBe(false);
    process.env.NODE_ENV = "development"; // restore
  });

  it("supports multiple allowed origins in production mode", () => {
    process.env.NODE_ENV = "production";
    process.env.ELTON_EXTENSION_ALLOWED_ORIGINS = `${ALLOWED_ORIGIN}, ${OTHER_ORIGIN}`;
    expect(isAllowedExtensionOrigin(ALLOWED_ORIGIN)).toBe(true);
    expect(isAllowedExtensionOrigin(OTHER_ORIGIN)).toBe(true);
    expect(isAllowedExtensionOrigin("chrome-extension://yetanotherdifferentone123")).toBe(false);
    process.env.NODE_ENV = "development"; // restore
  });
});

/* ─── Category 10: CORS preflight (OPTIONS) ── */

describe("createCorsPreflightResponse", () => {
  it("returns 204 with exact Allow-Origin for allowed origin", () => {
    const res = createCorsPreflightResponse(reqWithOrigin(ALLOWED_ORIGIN, "OPTIONS"));
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(ALLOWED_ORIGIN);
    expect(res.headers.get("Access-Control-Allow-Methods")).toBe("GET, POST, OPTIONS");
    expect(res.headers.get("Access-Control-Allow-Headers")).toBe("Content-Type, Authorization, x-api-token");
    expect(res.headers.get("Access-Control-Allow-Credentials")).toBe("true");
  });

  it("returns 204 WITHOUT Allow-Origin for disallowed origin (production mode)", () => {
    process.env.NODE_ENV = "production";
    process.env.ELTON_EXTENSION_ALLOWED_ORIGINS = ALLOWED_ORIGIN;
    const res = createCorsPreflightResponse(reqWithOrigin(OTHER_ORIGIN, "OPTIONS"));
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
    expect(res.headers.get("Access-Control-Allow-Credentials")).toBeNull();
    process.env.NODE_ENV = "development"; // restore
  });

  it("returns 204 WITHOUT Allow-Origin for null origin", () => {
    const res = createCorsPreflightResponse(reqWithoutOrigin());
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("includes Vary: Origin on all responses", () => {
    const allowed = createCorsPreflightResponse(reqWithOrigin(ALLOWED_ORIGIN, "OPTIONS"));
    expect(allowed.headers.get("Vary")).toBe("Origin");

    // Test with http origin (disallowed) in dev mode
    const denied = createCorsPreflightResponse(reqWithOrigin("http://evil.com", "OPTIONS"));
    expect(denied.headers.get("Vary")).toBe("Origin");

    const noOrigin = createCorsPreflightResponse(reqWithoutOrigin());
    expect(noOrigin.headers.get("Vary")).toBe("Origin");
  });

  it("includes Access-Control-Max-Age for allowed origins", () => {
    const res = createCorsPreflightResponse(reqWithOrigin(ALLOWED_ORIGIN, "OPTIONS"));
    expect(res.headers.get("Access-Control-Max-Age")).toBe("86400");
  });

  it("does NOT include Access-Control-Max-Age for disallowed origins (production mode)", () => {
    process.env.NODE_ENV = "production";
    process.env.ELTON_EXTENSION_ALLOWED_ORIGINS = ALLOWED_ORIGIN;
    const res = createCorsPreflightResponse(reqWithOrigin(OTHER_ORIGIN, "OPTIONS"));
    expect(res.headers.get("Access-Control-Max-Age")).toBeNull();
    process.env.NODE_ENV = "development"; // restore
  });
});

/* ─── Category 11: CORS response wrapping ── */

describe("withExtensionCors", () => {
  it("wraps a plain Response with CORS headers for allowed origin", () => {
    const plain = new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
    const wrapped = withExtensionCors(plain, reqWithOrigin(ALLOWED_ORIGIN));
    expect(wrapped.headers.get("Access-Control-Allow-Origin")).toBe(ALLOWED_ORIGIN);
    expect(wrapped.headers.get("Access-Control-Allow-Credentials")).toBe("true");
  });

  it("preserves existing body", async () => {
    const plain = new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
    const wrapped = withExtensionCors(plain, reqWithOrigin(ALLOWED_ORIGIN));
    const body = await wrapped.json();
    expect(body.ok).toBe(true);
  });

  it("preserves status code", () => {
    const plain = new Response(JSON.stringify({ error: "bad" }), { status: 400 });
    const wrapped = withExtensionCors(plain, reqWithOrigin(ALLOWED_ORIGIN));
    expect(wrapped.status).toBe(400);
  });

  it("does NOT add CORS headers for disallowed origin (production mode)", () => {
    process.env.NODE_ENV = "production";
    process.env.ELTON_EXTENSION_ALLOWED_ORIGINS = ALLOWED_ORIGIN;
    const plain = new Response(JSON.stringify({ ok: true }));
    const wrapped = withExtensionCors(plain, reqWithOrigin(OTHER_ORIGIN));
    expect(wrapped.headers.get("Access-Control-Allow-Origin")).toBeNull();
    expect(wrapped.headers.get("Access-Control-Allow-Credentials")).toBeNull();
    process.env.NODE_ENV = "development"; // restore
  });

  it("does NOT add CORS headers for non-extension origin in dev mode", () => {
    const plain = new Response(JSON.stringify({ ok: true }));
    const wrapped = withExtensionCors(plain, reqWithOrigin("http://evil.com"));
    expect(wrapped.headers.get("Access-Control-Allow-Origin")).toBeNull();
    expect(wrapped.headers.get("Access-Control-Allow-Credentials")).toBeNull();
  });

  it("always includes Vary: Origin", () => {
    const plain = new Response("ok");
    const wrapped = withExtensionCors(plain, reqWithOrigin(ALLOWED_ORIGIN));
    expect(wrapped.headers.get("Vary")).toBe("Origin");
  });

  it("does NOT double-wrap if headers already present", () => {
    const plain = new Response("ok", {
      headers: { "Access-Control-Allow-Origin": "chrome-extension://already-there" },
    });
    const wrapped = withExtensionCors(plain, reqWithOrigin(ALLOWED_ORIGIN));
    expect(wrapped.headers.get("Access-Control-Allow-Origin")).toBe("chrome-extension://already-there");
  });

  it("does NOT use wildcard with credentials", () => {
    // This test verifies the invariant: never Access-Control-Allow-Origin: * with credentials
    const plain = new Response("ok");
    const wrapped = withExtensionCors(plain, reqWithOrigin(ALLOWED_ORIGIN));
    const acao = wrapped.headers.get("Access-Control-Allow-Origin");
    const acac = wrapped.headers.get("Access-Control-Allow-Credentials");

    // Allowed origin: should get exact origin + credentials
    expect(acao).toBe(ALLOWED_ORIGIN);
    expect(acac).toBe("true");

    // Disallowed (non-extension) origin: should get NEITHER wildcard NOR credentials
    const denied = withExtensionCors(plain, reqWithOrigin("http://evil.com"));
    const deniedAcao = denied.headers.get("Access-Control-Allow-Origin");
    const deniedAcac = denied.headers.get("Access-Control-Allow-Credentials");
    expect(deniedAcao).toBeNull();
    expect(deniedAcac).toBeNull();
  });

  it("error responses (4xx, 5xx) also get CORS headers for allowed origin", () => {
    const errRes = new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
    const wrapped = withExtensionCors(errRes, reqWithOrigin(ALLOWED_ORIGIN));
    expect(wrapped.status).toBe(401);
    expect(wrapped.headers.get("Access-Control-Allow-Origin")).toBe(ALLOWED_ORIGIN);
    expect(wrapped.headers.get("Access-Control-Allow-Credentials")).toBe("true");
  });
});

/* ─── Category 12: getAllowedExtensionOrigins parsing ── */

describe("getAllowedExtensionOrigins", () => {
  it("returns empty array when env var is not set", () => {
    expect(getAllowedExtensionOrigins()).toEqual([]);
  });

  it("returns empty array when env var is empty", () => {
    process.env.ELTON_EXTENSION_ALLOWED_ORIGINS = "";
    expect(getAllowedExtensionOrigins()).toEqual([]);
  });

  it("parses single origin", () => {
    process.env.ELTON_EXTENSION_ALLOWED_ORIGINS = ALLOWED_ORIGIN;
    expect(getAllowedExtensionOrigins()).toEqual([ALLOWED_ORIGIN]);
  });

  it("parses multiple comma-separated origins", () => {
    process.env.ELTON_EXTENSION_ALLOWED_ORIGINS = `${ALLOWED_ORIGIN},${OTHER_ORIGIN}`;
    expect(getAllowedExtensionOrigins()).toEqual([ALLOWED_ORIGIN, OTHER_ORIGIN]);
  });

  it("filters out invalid formats", () => {
    process.env.ELTON_EXTENSION_ALLOWED_ORIGINS = `${ALLOWED_ORIGIN}, http://evil.com, *, ${OTHER_ORIGIN}`;
    expect(getAllowedExtensionOrigins()).toEqual([ALLOWED_ORIGIN, OTHER_ORIGIN]);
  });

  it("trims whitespace around origins", () => {
    process.env.ELTON_EXTENSION_ALLOWED_ORIGINS = `  ${ALLOWED_ORIGIN} , ${OTHER_ORIGIN}  `;
    expect(getAllowedExtensionOrigins()).toEqual([ALLOWED_ORIGIN, OTHER_ORIGIN]);
  });
});
