#!/usr/bin/env npx tsx
/**
 * Backfill semantic matching scores for all existing jobs.
 * Idempotent — can be re-run safely.
 *
 * Usage:
 *   npx tsx scripts/backfill-semantic-scores.ts           # live run
 *   npx tsx scripts/backfill-semantic-scores.ts --dry      # dry run (no DB writes)
 */

import { PrismaClient } from "../app/generated/prisma";
import { analyzeJobFit, serializeAnalysis } from "../lib/jobs/semantic-matcher";
import type { JobInput, ProfileInput } from "../lib/jobs/semantic-matcher";

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes("--dry");

interface BackfillResult {
  jobId: string;
  title: string;
  company: string | null;
  overallScore: number;
  recommendation: string;
  confidence: number;
  error?: string;
}

function pad(s: string, len: number): string {
  return s.length > len ? s.slice(0, len - 1) + "…" : s.padEnd(len, " ");
}

async function main() {
  console.log("=== Backfill Scoring Sémantique ===\n");
  if (DRY_RUN) console.log("[DRY RUN] Aucune écriture en base.\n");

  // Récupérer le profil principal
  const profile = await prisma.profile.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!profile) {
    console.log("❌ Aucun profil trouvé. Impossible de backfiller.");
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log(`Profil : ${profile.fullName} (${profile.title})\n`);

  // Récupérer tous les jobs avec leur score
  const jobs = await prisma.job.findMany({
    include: { score: true },
    orderBy: { firstSeenAt: "desc" },
  });

  console.log(`${jobs.length} offres à analyser.\n`);

  const results: BackfillResult[] = [];
  let updated = 0;
  const skipped = 0;
  let errors = 0;

  const profileInput: ProfileInput = {
    fullName: profile.fullName,
    title: profile.title,
    summary: null,
    location: profile.location,
    mobility: profile.mobility,
    languages: "languages" in profile ? (profile as Record<string, unknown>).languages as string ?? null : null,
    yearsExp: profile.yearsExp as number | null,
    sectors: profile.sectors,
    functions: "functions" in profile ? (profile as Record<string, unknown>).functions as string ?? null : null,
    remotePreference: "remotePreference" in profile ? (profile as Record<string, unknown>).remotePreference as string ?? null : null,
    targetSalary: "targetSalary" in profile ? (profile as Record<string, unknown>).targetSalary as string ?? null : null,
    constraints: "constraints" in profile ? (profile as Record<string, unknown>).constraints as string ?? null : null,
  };

  for (const job of jobs) {
    try {
      const j = job as unknown as Record<string, unknown>;
      const jobInput: JobInput = {
        title: job.title,
        company: job.company,
        location: job.location,
        locationPriority: job.locationPriority,
        countryScope: (j.countryScope as string) ?? null,
        remotePolicy: job.remotePolicy,
        contractType: job.contractType,
        salaryMin: job.salaryMin as number | null,
        salaryMax: job.salaryMax as number | null,
        seniority: (j.seniority as string) ?? null,
        functionArea: (j.functionArea as string) ?? null,
        sector: (j.sector as string) ?? null,
        description: job.description,
      };

      const analysis = analyzeJobFit(jobInput, profileInput);
      const serialized = serializeAnalysis(analysis);

      if (!DRY_RUN) {
        await prisma.jobScore.update({
          where: { jobId: job.id },
          data: {
            semanticScore: analysis.overallScore,
            semanticConfidence: analysis.confidence,
            semanticAnalysisJson: JSON.stringify(serialized),
            recommendation: analysis.recommendation,
          },
        });
        updated++;
      }

      results.push({
        jobId: job.id,
        title: job.title,
        company: job.company,
        overallScore: analysis.overallScore,
        recommendation: analysis.recommendation,
        confidence: analysis.confidence,
      });
    } catch (e: unknown) {
      errors++;
      const msg = e instanceof Error ? e.message : String(e);
      results.push({
        jobId: job.id,
        title: job.title,
        company: job.company,
        overallScore: 0,
        recommendation: "error",
        confidence: 0,
        error: msg,
      });
    }
  }

  // Affichage
  console.log(`${"Titre".padEnd(40)} ${"Entreprise".padEnd(20)} Score  Recommandation            Conf.\n`);
  console.log("─".repeat(100));

  for (const r of results) {
    const scoreColor = r.overallScore >= 75 ? "+" : r.overallScore >= 55 ? " " : r.overallScore >= 35 ? "-" : "!";
    const recLabel = r.recommendation === "highly_recommended" ? "⭐ Hautement recommandé" :
      r.recommendation === "recommended" ? "✅ Recommandé" :
      r.recommendation === "possible" ? "🔶 Possible" :
      r.recommendation === "low_priority" ? "⚠️ Priorité basse" :
      r.recommendation === "reject" ? "❌ Rejeté" :
      r.recommendation === "error" ? "💥 Erreur" : r.recommendation;
    const errStr = r.error ? ` [${r.error.slice(0, 30)}]` : "";
    console.log(
      `${scoreColor} ${pad(r.title, 39)} ${pad(r.company || "—", 19)} ${String(r.overallScore).padStart(3)}  ${pad(recLabel, 25)} ${String(r.confidence).padStart(3)}%${errStr}`,
    );
  }

  // Stats
  console.log("\n" + "─".repeat(100));
  const highlyRec = results.filter(r => r.recommendation === "highly_recommended").length;
  const recommended = results.filter(r => r.recommendation === "recommended").length;
  const possible = results.filter(r => r.recommendation === "possible").length;
  const lowPrio = results.filter(r => r.recommendation === "low_priority").length;
  const rejected = results.filter(r => r.recommendation === "reject").length;

  console.log(`\nRésumé :`);
  console.log(`  ⭐ Hautement recommandé : ${highlyRec}`);
  console.log(`  ✅ Recommandé           : ${recommended}`);
  console.log(`  🔶 Possible              : ${possible}`);
  console.log(`  ⚠️ Priorité basse        : ${lowPrio}`);
  console.log(`  ❌ Rejeté                : ${rejected}`);
  console.log(`  💥 Erreurs               : ${errors}`);

  if (DRY_RUN) {
    console.log(`\n[DRY RUN] ${results.length} offres analysées. Rien n'a été écrit.`);
    console.log(`Relancez sans --dry pour appliquer.`);
  } else {
    console.log(`\n✅ ${updated} offres backfillées, ${skipped} ignorées, ${errors} erreurs.`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
