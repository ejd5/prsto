"use client";

import { useRouter } from "next/navigation";
import type { BoardroomData } from "@/lib/actions/boardroom-dashboard";
import { getScoreColor } from "@/lib/score-colors";

interface PredictiveOpportunitiesProps {
  opportunities: BoardroomData["opportunities"];
}

function ScoreRing({ score }: { score: number | null | undefined }) {
  const safe = Math.max(0, Math.min(100, score ?? 0));
  const size = 44;
  const r = 18;
  const circ = 2 * Math.PI * r;
  const fill = (safe / 100) * circ;
  const color = getScoreColor(safe);

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="2.5"
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ fontSize: 10, fontWeight: 700, color, lineHeight: 1 }}>
        {score}
        <span style={{ fontSize: 7.5, fontWeight: 400, color: "var(--texte-tertiaire)" }}>Match</span>
      </div>
    </div>
  );
}

export default function PredictiveOpportunities({ opportunities }: PredictiveOpportunitiesProps) {
  const router = useRouter();

  if (opportunities.length === 0) {
    return (
      <div className="widget-card flex flex-col h-full">
        <div className="flex items-center justify-between mb-3">
          <span className="section-label">PREDICTIVE OPPORTUNITIES</span>
          <button className="text-xs hover:opacity-80 transition-opacity" style={{ color: "var(--or)" }}
            onClick={() => router.push("/opportunites")}>View All</button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(200,166,78,0.08)" }}>
            <span style={{ fontSize: 18, opacity: 0.5 }}>📊</span>
          </div>
          <div>
            <p className="text-xs font-semibold" style={{ color: "var(--texte)" }}>Aucune opportunité prédite</p>
            <p className="text-[10px] mt-1" style={{ color: "var(--texte-tertiaire)" }}>Ajoute tes premières offres pour que PRSTO identifie les meilleures opportunités.</p>
          </div>
          <button onClick={() => router.push("/market-radar")}
            className="text-[10px] font-mono px-3 py-1.5 rounded-lg border transition-colors"
            style={{ borderColor: "var(--or)", color: "var(--or)" }}>Ouvrir le Market Radar →</button>
        </div>
      </div>
    );
  }

  return (
    <div className="widget-card flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <span className="section-label">PREDICTIVE OPPORTUNITIES</span>
        <button className="text-xs hover:opacity-80 transition-opacity" style={{ color: "var(--or)" }}
          onClick={() => router.push("/opportunites")}>View All</button>
      </div>

      <div className="flex-1 space-y-2">
        {opportunities.slice(0, 4).map((opp) => {
          const scoreColor = getScoreColor(opp.matchScore);
          return (
            <div
              key={opp.id}
              className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all duration-150"
              style={{ background: "var(--fond-widget)", border: "1px solid var(--bordure-douce)" }}
              onClick={() => router.push(`/opportunites/${opp.id}`)}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(200,166,78,0.2)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--bordure-douce)"; }}
            >
              <ScoreRing score={opp.matchScore} />
              <div className="flex-1 min-w-0">
                <div style={{ fontSize: 11.5, color: "var(--texte)", fontWeight: 500, lineHeight: 1.3 }}>{opp.title}</div>
                <div style={{ fontSize: 10.5, color: "var(--texte-tertiaire)", marginTop: 1 }}>{opp.company}</div>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span className="badge" style={{ background: `${scoreColor}18`, color: scoreColor, border: `1px solid ${scoreColor}30`, fontSize: 9 }}>
                    {opp.matchScore}% FIT
                  </span>
                  {opp.tags.slice(1).map((tag) => (
                    <span key={tag} className="badge badge-info" style={{ fontSize: 9 }}>{tag}</span>
                  ))}
                  {opp.salaryRange !== "NC" && (
                    <span style={{ fontSize: 10, color: "var(--texte-tertiaire)" }}>{opp.salaryRange}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button className="mt-3 text-xs flex items-center gap-1 hover:opacity-80 transition-opacity" style={{ color: "var(--or)" }}
        onClick={() => router.push("/opportunites")}>Explore Opportunities →</button>
    </div>
  );
}
