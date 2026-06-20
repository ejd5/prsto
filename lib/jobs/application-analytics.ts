"use server";

import { prisma } from "@/lib/prisma";
import { getDraftDemoFilter } from "@/lib/jobs/demo-data";

/* ─── Types ─────────────────────────────── */

export interface AnalyticsSummary {
  totalSent: number;
  sentThisWeek: number;
  toFollowUp: number;
  followedUp: number;
  recruiterReplied: number;
  interviews: number;
  offers: number;
  rejected: number;
  archived: number;
  responseRate: number;    // % ayant reçu une réponse (replied + interview + offer) / sent
  interviewRate: number;   // % entretiens / réponses
  offerRate: number;       // % offres / entretiens
  avgResponseDays: number | null; // délai moyen entre sentAt et recruiterRepliedAt
}

export interface BySource {
  source: string;
  sent: number;
  replied: number;
  interviews: number;
  offers: number;
  rejected: number;
  responseRate: number;
}

export interface ByScoreRange {
  range: string; // "0-24", "25-49", "50-74", "75-100"
  sent: number;
  replied: number;
  interviews: number;
  offers: number;
}

export interface WeeklyActivity {
  week: string;    // "2026-W25"
  sent: number;
  followedUp: number;
  replied: number;
}

export interface FollowUpDue {
  draftId: string;
  jobTitle: string;
  company: string;
  sentAt: string;
  followUpDueAt: string;
  daysOverdue: number;
  source: string;
  score: number | null;
}

export interface TopCompany {
  company: string;
  sent: number;
  replied: number;
  interviews: number;
  offers: number;
}

export interface HighScoreNoReply {
  draftId: string;
  jobTitle: string;
  company: string;
  score: number;
  sentAt: string;
  daysWaiting: number;
  source: string;
}

export interface ByLocationPriority {
  priority: string; // "PACA", "IDF", "France", "International"
  sent: number;
  replied: number;
  interviews: number;
  offers: number;
}

export interface ApplicationAnalytics {
  summary: AnalyticsSummary;
  bySource: BySource[];
  byScoreRange: ByScoreRange[];
  byLocationPriority: ByLocationPriority[];
  byPipelineStatus: { status: string; count: number }[];
  weeklyActivity: WeeklyActivity[];
  topCompanies: TopCompany[];
  followUpsDue: FollowUpDue[];
  highScoreNoReply: HighScoreNoReply[];
}

/* ─── Helpers ────────────────────────────── */

function weekLabel(d: Date): string {
  const start = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor((d.getTime() - start.getTime()) / 86400000);
  const week = Math.ceil((days + start.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function startOfWeek(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1; // lundi = début de semaine
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

/* ─── Analytics ──────────────────────────── */

export async function getApplicationAnalytics(opts?: { demoMode?: boolean }): Promise<ApplicationAnalytics> {
  // demoMode: true  → uniquement les drafts [DEMO]
  // demoMode: false ou undefined → exclut les drafts [DEMO] (safe-by-default)
  const demoMode = opts?.demoMode ?? false;
  const draftWhere: Record<string, unknown> = {
    pipelineStatus: { not: null },
    ...getDraftDemoFilter(demoMode),
  };

  const drafts = await prisma.applicationDraft.findMany({
    where: draftWhere,
    include: {
      job: {
        include: {
          source: { select: { name: true } },
          score: { select: { globalScore: true } },
        },
      },
    },
  });

  const now = new Date();
  const weekStart = startOfWeek();

  // ─── Summary ───
  // Tous les drafts retournés ont pipelineStatus non null (filtre Prisma)
  const sentThisWeek = drafts.filter((d) => d.sentAt && d.sentAt >= weekStart);
  const toFollowUp = drafts.filter(
    (d) => d.pipelineStatus === "sent" && d.followUpDueAt && d.followUpDueAt <= now
  );
  const followedUp = drafts.filter((d) => d.pipelineStatus === "followed_up");
  const replied = drafts.filter((d) => d.pipelineStatus === "recruiter_replied");
  const interviews = drafts.filter((d) => d.pipelineStatus === "interview");
  const offers = drafts.filter((d) => d.pipelineStatus === "offer");
  const rejected = drafts.filter((d) => d.pipelineStatus === "rejected");
  const archived = drafts.filter((d) => d.pipelineStatus === "archived");

  const repliedOrBetter = replied.length + interviews.length + offers.length;
  const responseRate = drafts.length > 0 ? Math.round((repliedOrBetter / drafts.length) * 100) : 0;
  const interviewRate = repliedOrBetter > 0 ? Math.round((interviews.length / repliedOrBetter) * 100) : 0;
  // offerRate : si offres reçues sans entretien enregistré, on compte quand même
  const offerRate = offers.length > 0
    ? (interviews.length > 0 ? Math.round((offers.length / interviews.length) * 100) : 100)
    : 0;

  // Délai moyen réponse
  let avgResponseDays: number | null = null;
  const withResponse = drafts.filter((d) => d.sentAt && d.recruiterRepliedAt);
  if (withResponse.length > 0) {
    const totalDays = withResponse.reduce((sum, d) => {
      return sum + daysBetween(new Date(d.sentAt!), new Date(d.recruiterRepliedAt!));
    }, 0);
    avgResponseDays = Math.round(totalDays / withResponse.length);
  }

  const summary: AnalyticsSummary = {
    totalSent: drafts.length,
    sentThisWeek: sentThisWeek.length,
    toFollowUp: toFollowUp.length,
    followedUp: followedUp.length,
    recruiterReplied: replied.length,
    interviews: interviews.length,
    offers: offers.length,
    rejected: rejected.length,
    archived: archived.length,
    responseRate,
    interviewRate,
    offerRate,
    avgResponseDays,
  };

  // ─── By Source ───
  const sourceMap = new Map<string, { sent: number; replied: number; interviews: number; offers: number; rejected: number }>();
  for (const d of drafts) {
    const src = d.job.source?.name || "Inconnue";
    if (!sourceMap.has(src)) sourceMap.set(src, { sent: 0, replied: 0, interviews: 0, offers: 0, rejected: 0 });
    const e = sourceMap.get(src)!;
    e.sent++;
    if (d.pipelineStatus === "recruiter_replied" || d.pipelineStatus === "interview" || d.pipelineStatus === "offer") e.replied++;
    if (d.pipelineStatus === "interview") e.interviews++;
    if (d.pipelineStatus === "offer") e.offers++;
    if (d.pipelineStatus === "rejected") e.rejected++;
  }
  const bySource: BySource[] = Array.from(sourceMap.entries())
    .map(([source, s]) => ({
      source,
      ...s,
      responseRate: s.sent > 0 ? Math.round((s.replied / s.sent) * 100) : 0,
    }))
    .sort((a, b) => b.sent - a.sent);

  // ─── By Score Range ───
  const scoreRanges = [
    { range: "0-24", min: 0, max: 24, sent: 0, replied: 0, interviews: 0, offers: 0 },
    { range: "25-49", min: 25, max: 49, sent: 0, replied: 0, interviews: 0, offers: 0 },
    { range: "50-74", min: 50, max: 74, sent: 0, replied: 0, interviews: 0, offers: 0 },
    { range: "75-100", min: 75, max: 100, sent: 0, replied: 0, interviews: 0, offers: 0 },
  ];
  for (const d of drafts) {
    const score = d.job.score?.globalScore ?? d.matchScore ?? 0;
    const r = scoreRanges.find((r) => score >= r.min && score <= r.max);
    if (!r) continue;
    r.sent++;
    if (d.pipelineStatus === "recruiter_replied" || d.pipelineStatus === "interview" || d.pipelineStatus === "offer") r.replied++;
    if (d.pipelineStatus === "interview") r.interviews++;
    if (d.pipelineStatus === "offer") r.offers++;
  }

  // ─── By Location Priority ───
  const LOC_PRIORITY_LABELS: Record<number, string> = { 1: "PACA", 2: "IDF", 3: "France", 4: "International" };
  const locMap = new Map<number, { sent: number; replied: number; interviews: number; offers: number }>();
  for (const d of drafts) {
    const prio = d.job.locationPriority ?? 0;
    if (!locMap.has(prio)) locMap.set(prio, { sent: 0, replied: 0, interviews: 0, offers: 0 });
    const e = locMap.get(prio)!;
    e.sent++;
    if (d.pipelineStatus === "recruiter_replied" || d.pipelineStatus === "interview" || d.pipelineStatus === "offer") e.replied++;
    if (d.pipelineStatus === "interview") e.interviews++;
    if (d.pipelineStatus === "offer") e.offers++;
  }
  const byLocationPriority: ByLocationPriority[] = Array.from(locMap.entries())
    .map(([prio, v]) => ({ priority: LOC_PRIORITY_LABELS[prio] || "Inconnue", ...v }))
    .sort((a, b) => b.sent - a.sent);

  // ─── By Pipeline Status ───
  const statusCounts: Record<string, number> = {};
  for (const d of drafts) {
    const s = d.pipelineStatus || "unknown";
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  }
  const byPipelineStatus = Object.entries(statusCounts)
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  // ─── Weekly Activity (8 dernières semaines) ───
  const weekMap = new Map<string, { sent: number; followedUp: number; replied: number }>();
  const eightWeeksAgo = new Date(now.getTime() - 8 * 7 * 86400000);
  for (const d of drafts) {
    if (d.sentAt && d.sentAt >= eightWeeksAgo) {
      const w = weekLabel(new Date(d.sentAt));
      if (!weekMap.has(w)) weekMap.set(w, { sent: 0, followedUp: 0, replied: 0 });
      weekMap.get(w)!.sent++;
    }
    if (d.followedUpAt && d.followedUpAt >= eightWeeksAgo) {
      const w = weekLabel(new Date(d.followedUpAt));
      if (!weekMap.has(w)) weekMap.set(w, { sent: 0, followedUp: 0, replied: 0 });
      weekMap.get(w)!.followedUp++;
    }
    if (d.recruiterRepliedAt && d.recruiterRepliedAt >= eightWeeksAgo) {
      const w = weekLabel(new Date(d.recruiterRepliedAt));
      if (!weekMap.has(w)) weekMap.set(w, { sent: 0, followedUp: 0, replied: 0 });
      weekMap.get(w)!.replied++;
    }
  }
  const weeklyActivity: WeeklyActivity[] = Array.from(weekMap.entries())
    .map(([week, v]) => ({ week, ...v }))
    .sort((a, b) => a.week.localeCompare(b.week));

  // ─── Top Companies ───
  const companyMap = new Map<string, { sent: number; replied: number; interviews: number; offers: number }>();
  for (const d of drafts) {
    const company = d.job.company || "Inconnue";
    if (!companyMap.has(company)) companyMap.set(company, { sent: 0, replied: 0, interviews: 0, offers: 0 });
    const e = companyMap.get(company)!;
    e.sent++;
    if (d.pipelineStatus === "recruiter_replied" || d.pipelineStatus === "interview" || d.pipelineStatus === "offer") e.replied++;
    if (d.pipelineStatus === "interview") e.interviews++;
    if (d.pipelineStatus === "offer") e.offers++;
  }
  const topCompanies: TopCompany[] = Array.from(companyMap.entries())
    .map(([company, v]) => ({ company, ...v }))
    .sort((a, b) => b.sent - a.sent)
    .slice(0, 10);

  // ─── Follow-ups Due ───
  const followUpsDue: FollowUpDue[] = toFollowUp
    .map((d) => ({
      draftId: d.id,
      jobTitle: d.job.title,
      company: d.job.company || "Inconnue",
      sentAt: d.sentAt?.toISOString() || "",
      followUpDueAt: d.followUpDueAt?.toISOString() || "",
      daysOverdue: d.followUpDueAt ? daysBetween(d.followUpDueAt, now) : 0,
      source: d.job.source?.name || "Inconnue",
      score: d.job.score?.globalScore ?? d.matchScore ?? null,
    }))
    .sort((a, b) => b.daysOverdue - a.daysOverdue);

  // ─── High Score No Reply ───
  const highScoreNoReply: HighScoreNoReply[] = drafts
    .filter((d) => {
      if (d.pipelineStatus !== "sent" && d.pipelineStatus !== "followed_up") return false;
      const score = d.job.score?.globalScore ?? d.matchScore ?? 0;
      return score >= 50;
    })
    .map((d) => ({
      draftId: d.id,
      jobTitle: d.job.title,
      company: d.job.company || "Inconnue",
      score: d.job.score?.globalScore ?? d.matchScore ?? 0,
      sentAt: d.sentAt?.toISOString() || "",
      daysWaiting: d.sentAt ? daysBetween(d.sentAt, now) : 0,
      source: d.job.source?.name || "Inconnue",
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 15);

  return {
    summary,
    bySource,
    byScoreRange: scoreRanges,
    byLocationPriority,
    byPipelineStatus,
    weeklyActivity,
    topCompanies,
    followUpsDue,
    highScoreNoReply,
  };
}
