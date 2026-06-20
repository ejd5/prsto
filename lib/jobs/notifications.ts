import { prisma } from "@/lib/prisma";
import type { JobReport } from "./reports";

export interface NotificationResult {
  sent: boolean;
  channels: string[];
  errors: string[];
}

function textSummary(report: JobReport): string {
  const lines: string[] = [];
  lines.push(`Rapport ${report.mode} — ${new Date(report.generatedAt).toLocaleDateString("fr-FR")}`);
  lines.push(`Nouvelles offres : ${report.newJobsCount} · Doublons : ${report.duplicateCount}`);
  if (report.lastRun) lines.push(`Trouvées : ${report.lastRun.fetchedCount}`);
  if (report.topPACA.length) lines.push(`PACA : ${report.topPACA.map(j => `${j.title} — ${j.company} (${j.score})`).join(" | ")}`);
  if (report.topIDF.length) lines.push(`IDF : ${report.topIDF.map(j => `${j.title} — ${j.company} (${j.score})`).join(" | ")}`);
  if (report.sourcesInError.length) lines.push(`Sources en erreur : ${report.sourcesInError.join(", ")}`);
  return lines.join("\n");
}

async function sendWebhook(report: JobReport): Promise<string | null> {
  const webhookUrl = process.env.JOB_REPORT_WEBHOOK_URL;
  if (!webhookUrl) return null;

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "sourcing_report",
        mode: report.mode,
        summary: textSummary(report),
        data: {
          newJobs: report.newJobsCount,
          duplicates: report.duplicateCount,
          topPACA: report.topPACA.slice(0, 5),
          topIDF: report.topIDF.slice(0, 5),
          sourcesInError: report.sourcesInError,
          recommendations: report.recommendations,
        },
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return `Webhook HTTP ${res.status}`;
    return null;
  } catch (e: unknown) {
    const err = e as Error;
    return `Webhook: ${err.message?.slice(0, 100) || "erreur"}`;
  }
}

/**
 * Envoie une notification après la génération d'un rapport.
 * V1 : webhook uniquement (SMTP nécessite nodemailer — non installé).
 * Retourne toujours un résultat structuré, ne jette jamais d'exception.
 */
export async function sendJobReportNotification(report: JobReport): Promise<NotificationResult> {
  const errors: string[] = [];

  // Webhook (seul canal V1)
  const webhookErr = await sendWebhook(report);
  const channels: string[] = [];
  if (webhookErr === null && process.env.JOB_REPORT_WEBHOOK_URL) {
    channels.push("webhook");
  } else if (webhookErr) {
    errors.push(webhookErr);
  }

  // Persister le statut dans le run (si runId disponible)
  if (report.id && report.id !== "no-run") {
    try {
      const existing = await prisma.jobSearchRun.findUnique({ where: { id: report.id } });
      if (existing) {
        const existingLogs = existing.logsJson ? JSON.parse(existing.logsJson) : {};
        await prisma.jobSearchRun.update({
          where: { id: report.id },
          data: {
            logsJson: JSON.stringify({
              ...existingLogs,
              notification: {
                sent: channels.length > 0,
                channels,
                errors: errors.length > 0 ? errors : undefined,
                sentAt: new Date().toISOString(),
              },
            }),
          },
        });
      }
    } catch { /* persist non bloquante */ }
  }

  return { sent: channels.length > 0, channels, errors };
}
