"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  buildCandidateSnapshot,
  runFullAnalysis,
} from "@/lib/analysis/engine";
import type { AnalysisReport } from "@/lib/analysis/engine";
import { runAIAnalysis } from "@/lib/analysis/ai-service";

export async function getAnalyses() {
  return prisma.analysis.findMany({
    include: {
      opportunity: {
        select: { id: true, title: true, company: true, country: true, status: true },
      },
    },
    orderBy: { analysedAt: "desc" },
  });
}

export async function getAnalysis(id: string) {
  return prisma.analysis.findUnique({
    where: { id },
    include: {
      opportunity: {
        select: { id: true, title: true, company: true, country: true, status: true, rawText: true },
      },
    },
  });
}

export async function getAnalysisByOpportunity(opportunityId: string) {
  return prisma.analysis.findUnique({
    where: { opportunityId },
    include: {
      opportunity: {
        select: { id: true, title: true, company: true, country: true, status: true },
      },
    },
  });
}

export async function analyzeJobOffer(opportunityId: string, useAI: boolean = false): Promise<{
  success: boolean;
  analysis?: AnalysisReport;
  error?: string;
  mode: string;
}> {
  try {
    // Récupérer l'opportunité
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
    });
    if (!opportunity || !opportunity.rawText) {
      return { success: false, error: "Opportunité introuvable ou sans description texte.", mode: "error" };
    }

    // Construire le snapshot candidat
    const candidate = await buildCandidateSnapshot();
    if (!candidate) {
      return { success: false, error: "Profil candidat non configuré. Remplissez votre profil d'abord.", mode: "error" };
    }

    // Analyse heuristique locale (toujours)
    const heuristicReport = runFullAnalysis(opportunity.rawText, candidate);
    heuristicReport.opportunityId = opportunityId;

    // Optionnellement enrichir avec l'IA
    let finalReport: AnalysisReport;
    let mode: string;

    if (useAI) {
      finalReport = await runAIAnalysis(opportunity.rawText, heuristicReport);
      mode = finalReport.aiModel.includes("Heuristic") && !finalReport.aiModel.includes("DeepSeek")
        ? "heuristic (fallback)"
        : "ai+heuristic";
    } else {
      finalReport = heuristicReport;
      mode = "heuristic";
    }

    // Sauvegarder dans la base
    const analysisData = {
      opportunityId,
      scoreGlobal: finalReport.score.globalScore,
      keywordsAts: JSON.stringify(finalReport.keywordsAts),
      exigences: JSON.stringify(finalReport.exigences),
      risks: JSON.stringify(finalReport.risks),
      gaps: JSON.stringify(finalReport.gaps),
      pointsForts: JSON.stringify(finalReport.pointsForts),
      matchDetails: JSON.stringify(finalReport.matchDetails),
      rawResponse: null,
      aiModel: finalReport.aiModel,
    };

    // Upsert (une seule analyse par opportunité)
    const existing = await prisma.analysis.findUnique({ where: { opportunityId } });
    if (existing) {
      await prisma.analysis.update({ where: { opportunityId }, data: analysisData });
    } else {
      await prisma.analysis.create({ data: analysisData });
    }

    // Mettre à jour le statut de l'opportunité
    await prisma.opportunity.update({
      where: { id: opportunityId },
      data: { status: "analyse", priority: finalReport.priority === "HIGH" ? 1 : finalReport.priority === "AVOID" ? 0 : 0 },
    });

    // Mettre à jour le score
    if (finalReport.score.globalScore > 0) {
      await prisma.opportunity.update({
        where: { id: opportunityId },
        data: { score: finalReport.score.globalScore },
      });
    }

    revalidatePath("/analyse");
    revalidatePath(`/opportunites/${opportunityId}`);
    revalidatePath("/opportunites");

    return { success: true, analysis: finalReport, mode };
  } catch (e: unknown) {
    const err = e as Error;
    console.error("analyzeJobOffer error:", err);
    return { success: false, error: err.message || "Erreur d'analyse", mode: "error" };
  }
}

export async function deleteAnalysis(id: string) {
  await prisma.analysis.delete({ where: { id } });
  revalidatePath("/analyse");
}

export async function getAnalysisStats() {
  const [total, scoreMoyen, highPriority, avoid] = await Promise.all([
    prisma.analysis.count(),
    prisma.analysis.aggregate({ _avg: { scoreGlobal: true } }),
    prisma.opportunity.count({ where: { score: { gte: 70 } } }),
    prisma.opportunity.count({ where: { score: { lte: 30, gt: 0 } } }),
  ]);

  return {
    analysed: total,
    averageScore: Math.round(total > 0 ? (scoreMoyen._avg.scoreGlobal || 0) : 0),
    highOpportunities: highPriority,
    avoidOpportunities: avoid,
    toAnalyze: await prisma.opportunity.count({ where: { status: "nouveau", rawText: { not: "" } } }),
  };
}
