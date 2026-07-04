import { NextResponse } from "next/server";

function getEnv(key: string): string {
  if (typeof process !== "undefined" && process.env) {
    return process.env[key] || "";
  }
  return "";
}

export async function GET() {
  const enabled = getEnv("FIRECRAWL_ENABLED") === "true";
  const apiKey = getEnv("FIRECRAWL_API_KEY");
  const configured = enabled && apiKey.trim().length > 0;
  const maxPagesPerRun = parseInt(getEnv("FIRECRAWL_MAX_PAGES_PER_RUN"), 10) || 10;
  const timeoutMs = parseInt(getEnv("FIRECRAWL_TIMEOUT_MS"), 10) || 30000;

  return NextResponse.json({
    enabled,
    configured,
    maxPagesPerRun,
    timeoutMs,
    // Ne jamais exposer la clé API
  });
}
