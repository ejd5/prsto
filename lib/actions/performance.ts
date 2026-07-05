"use server";

import { prisma } from "@/lib/prisma";
import {
  computeGlobalPerformance,
  computeSourcePerformance,
  computeRolePerformance,
  computeCountryPerformance,
  computeDailyActions,
  findBlockedOpportunities,
  type GlobalPerformance,
  type SourcePerformance,
  type RolePerformance,
  type PaysPerformance,
  type BlockedOpportunity,
  type ActionItem,
  type RawOpportunity,
  type RawPriorityRole,
} from "@/lib/performance/engine";
import { generateWeeklyRecommendations, type WeeklyRecommendation } from "@/lib/performance/recommendations";

export interface FullPerformanceData {
  global: GlobalPerformance;
  sourcePerformance: SourcePerformance[];
  rolePerformance: RolePerformance[];
  countryPerformance: PaysPerformance[];
  blocked: BlockedOpportunity[];
  actions: ActionItem[];
  recommendations: WeeklyRecommendation[];
}

export async function getPerformanceData(): Promise<FullPerformanceData> {
  const [opportunities, priorityRoles] = await Promise.all([
    prisma.opportunity.findMany({
      include: {
        analysis: { select: { scoreGlobal: true } },
        documents: { select: { id: true, type: true, status: true } },
        pipelineTask: { select: { column: true, lastStatusChange: true } },
        relances: { select: { type: true, status: true, scheduledDate: true } },
        interviews: { select: { status: true, date: true } },
      },
    }),
    prisma.priorityRole.findMany({ where: { active: true } }),
  ]);

  const rawOpps: RawOpportunity[] = opportunities.map(o => ({
    id: o.id,
    title: o.title,
    company: o.company,
    country: o.country || null,
    sourceName: o.sourceName || null,
    status: o.status,
    score: o.score || null,
    priority: o.priority,
    duplicateStatus: o.duplicateStatus,
    analysis: o.analysis ? { scoreGlobal: o.analysis.scoreGlobal || null } : null,
    documents: o.documents,
    pipelineTask: o.pipelineTask ? {
      column: o.pipelineTask.column,
      lastStatusChange: o.pipelineTask.lastStatusChange?.toISOString() || null,
    } : null,
    relances: o.relances.map(r => ({
      type: r.type,
      status: r.status,
      scheduledDate: r.scheduledDate?.toISOString().slice(0, 10) || null,
    })),
    interviews: o.interviews.map(i => ({
      status: i.status,
      date: i.date?.toISOString().slice(0, 10) || null,
    })),
  }));

  const rawRoles: RawPriorityRole[] = priorityRoles.map(r => ({ name: r.name }));

  const global = computeGlobalPerformance(rawOpps);
  const sourcePerformance = computeSourcePerformance(rawOpps);
  const rolePerformance = computeRolePerformance(rawOpps, rawRoles);
  const countryPerformance = computeCountryPerformance(rawOpps);
  const blocked = findBlockedOpportunities(rawOpps);
  const actions = computeDailyActions(rawOpps);
  const recommendations = generateWeeklyRecommendations({
    global, sourcePerformance, rolePerformance, countryPerformance, blocked, actions,
  });

  return {
    global,
    sourcePerformance,
    rolePerformance,
    countryPerformance,
    blocked,
    actions,
    recommendations,
  };
}

// Lighter version for dashboard enrichment — only global KPIs + top alerts
export async function getDashboardPerformance(): Promise<{
  global: GlobalPerformance;
  topActions: ActionItem[];
  topAlerts: WeeklyRecommendation[];
}> {
  const data = await getPerformanceData();
  const topActions = data.actions.slice(0, 3);
  const topAlerts = data.recommendations.filter(r => r.type === "alerte").slice(0, 2);
  return { global: data.global, topActions, topAlerts };
}
