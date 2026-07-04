"use client";

import type { AuditOutput } from "@/lib/ai/prompts-mock-interview";
import { getScoreColor } from "@/lib/score-colors";

interface AuditReportProps {
  report: AuditOutput;
  onRestart: () => void;
}

function ScoreRing({ score, label }: { score: number; label: string }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 20) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="80" height="80" className="transform -rotate-90">
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="#10382610"
          strokeWidth="4"
        />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ stroke: getScoreColor(score * 5) }}
        />
      </svg>
      <span className="absolute mt-[18px] text-lg font-bold" style={{ color: getScoreColor(score * 5) }}>
        {score}
      </span>
      <span className="text-[10px] text-[#103826]/60 uppercase tracking-wider mt-1">
        {label}
      </span>
    </div>
  );
}

export function AuditReport({ report, onRestart }: AuditReportProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-[#103826]/10 p-8 text-center space-y-4">
        <h2 className="text-2xl font-bold text-[#103826]">
          Rapport d&apos;évaluation
        </h2>

        <div className="inline-flex flex-col items-center">
          <span className="text-6xl font-bold" style={{ color: getScoreColor(report.global_score) }}>
            {report.global_score}
          </span>
          <span className="text-sm text-[#103826]/60">/100</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="relative flex flex-col items-center bg-white/80 backdrop-blur-sm rounded-xl border border-[#103826]/10 p-4">
          <ScoreRing score={report.dimensions.structure.score} label="Structure" />
        </div>
        <div className="relative flex flex-col items-center bg-white/80 backdrop-blur-sm rounded-xl border border-[#103826]/10 p-4">
          <ScoreRing score={report.dimensions.concision.score} label="Concision" />
        </div>
        <div className="relative flex flex-col items-center bg-white/80 backdrop-blur-sm rounded-xl border border-[#103826]/10 p-4">
          <ScoreRing score={report.dimensions.impact.score} label="Impact" />
        </div>
        <div className="relative flex flex-col items-center bg-white/80 backdrop-blur-sm rounded-xl border border-[#103826]/10 p-4">
          <ScoreRing score={report.dimensions.posture.score} label="Posture" />
        </div>
        <div className="relative flex flex-col items-center bg-white/80 backdrop-blur-sm rounded-xl border border-[#103826]/10 p-4">
          <ScoreRing score={report.dimensions.aisance_orale.score} label="Aisance" />
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-[#103826]/10 p-6 space-y-4">
        <h3 className="font-semibold text-[#103826]">Synthèse</h3>
        <p className="text-sm text-[#103826]/70 leading-relaxed">
          {report.synthesis}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-green-200 p-6 space-y-3">
          <h3 className="font-semibold text-green-700">Points forts</h3>
          <ul className="space-y-2">
            {report.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[#103826]/80">
                <span className="text-green-500 mt-0.5">✓</span>
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-amber-200 p-6 space-y-3">
          <h3 className="font-semibold text-amber-700">Axes d&apos;amélioration</h3>
          <ul className="space-y-2">
            {report.improvements.map((im, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[#103826]/80">
                <span className="text-amber-500 mt-0.5">→</span>
                {im}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex justify-center pt-4">
        <button
          onClick={onRestart}
          className="px-8 py-3 rounded-xl bg-[#103826] text-white font-medium hover:bg-[#103826]/90 transition-all shadow-lg shadow-[#103826]/20"
        >
          🔄 Nouvel entretien
        </button>
      </div>
    </div>
  );
}
