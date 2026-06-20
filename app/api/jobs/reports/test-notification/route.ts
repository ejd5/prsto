import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateJobReport } from "@/lib/jobs/reports";
import { sendJobReportNotification } from "@/lib/jobs/notifications";

function checkAuth(request: Request): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const token = request.headers.get("x-api-token");
  const expected = process.env.SOURCING_CRON_TOKEN;
  return !expected || token === expected;
}

export async function POST(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Token invalide" }, { status: 401 });
  }

  try {
    // Prendre le dernier run pour générer un rapport de test
    const lastRun = await prisma.jobSearchRun.findFirst({
      orderBy: { startedAt: "desc" },
    });

    if (!lastRun) {
      return NextResponse.json({
        success: true,
        notificationSent: false,
        notificationChannels: [],
        notificationErrors: ["Aucun run trouvé — lancez d'abord un import"],
        note: "Mode test — notification non envoyée faute de données",
      });
    }

    const report = await generateJobReport(lastRun.mode as "morning" | "evening" | "manual", lastRun.id);
    const notification = await sendJobReportNotification(report);

    return NextResponse.json({
      success: true,
      notificationSent: notification.sent,
      notificationChannels: notification.channels,
      notificationErrors: notification.errors.length > 0 ? notification.errors : undefined,
      note: notification.sent
        ? "Notification de test envoyée"
        : "Aucun canal configuré. Définissez JOB_REPORT_WEBHOOK_URL ou SMTP_HOST + JOB_REPORT_RECIPIENT_EMAIL.",
    });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
