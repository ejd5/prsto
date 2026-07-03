import { NextResponse } from "next/server";
import { sessionExists, getSessionAge } from "@/lib/jobs/browser-agent/session-store";
import type { BrowserPlatform, BrowserSessionStatus } from "@/lib/jobs/browser-agent/types";

const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

async function getPlatformStatus(platform: BrowserPlatform): Promise<{
  platform: string;
  status: BrowserSessionStatus;
  sessionAgeHours: number | null;
  lastError: string | null;
}> {
  const exists = sessionExists(platform);
  if (!exists) {
    return { platform, status: "not_configured", sessionAgeHours: null, lastError: null };
  }
  const age = getSessionAge(platform);
  if (age && age > SESSION_MAX_AGE_MS) {
    return { platform, status: "needs_user_reauth", sessionAgeHours: Math.round(age / 3600000), lastError: "Session expirée (>24h)" };
  }
  return { platform, status: "connected", sessionAgeHours: age ? Math.round(age / 3600000) : null, lastError: null };
}

export async function GET() {
  const platforms: BrowserPlatform[] = ["linkedin", "indeed", "apec"];
  const statuses = await Promise.all(platforms.map(getPlatformStatus));

  return NextResponse.json({ platforms: statuses });
}
