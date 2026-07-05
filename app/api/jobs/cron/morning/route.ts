import { NextResponse } from "next/server";
import { runScheduledJobImport } from "@/lib/jobs/reports";
import { sendJobReportNotification } from "@/lib/jobs/notifications";

function checkAuth(request: Request): "ok" | "missing" | "invalid" {
  if (process.env.NODE_ENV !== "production") return "ok";
  const token = request.headers.get("x-api-token");
  const expected = process.env.SOURCING_CRON_TOKEN;
  if (!expected) return "ok"; // pas de token configuré en prod = pas de protection
  if (!token) return "missing";
  return token === expected ? "ok" : "invalid";
}

// GET : statut uniquement, jamais d'import
export async function GET() {
  return NextResponse.json({
    endpoint: "Rapport matin PRSTO",
    method: "POST pour déclencher l'import et le rapport",
    status: "ok",
    auth: process.env.SOURCING_CRON_TOKEN ? "Token configuré" : "Token non configuré",
    env: process.env.NODE_ENV || "development",
  });
}

// POST : lance import + rapport + notification
export async function POST(request: Request) {
  const auth = checkAuth(request);
  if (auth !== "ok") {
    const msg = auth === "missing" ? "Token manquant" : "Token invalide";
    return NextResponse.json({ error: msg }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  try {
    const report = await runScheduledJobImport("morning", {
      maxPages: body.maxPages ?? 2,
      maxJobsPerRun: body.maxJobsPerRun ?? 250,
    });

    // Notification
    const notification = await sendJobReportNotification(report);

    return NextResponse.json({
      success: true,
      report,
      notificationSent: notification.sent,
      notificationChannels: notification.channels,
      notificationErrors: notification.errors,
    });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
