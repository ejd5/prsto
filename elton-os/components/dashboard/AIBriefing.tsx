"use client";

import type { BoardroomData } from "@/lib/actions/boardroom-dashboard";

interface AIBriefingProps {
  briefing: BoardroomData["briefing"];
}

export default function AIBriefing({ briefing }: AIBriefingProps) {
  const bullets = [
    briefing.highFitOpportunities > 0
      ? `${briefing.highFitOpportunities} high-fit opportunities match your background and goals.`
      : "No high-fit opportunities yet — expand your sources.",
    briefing.compensationTrend
      ? `Compensation trends are up ${briefing.compensationTrend}K avg in your target market.`
      : "Compensation data insufficient — add salary info to opportunities.",
    briefing.recruitersToContact > 0
      ? `AI recommends connecting with ${briefing.recruitersToContact} senior leaders this week.`
      : "All known recruiters have been recently contacted.",
  ];

  const icons = ["⬆", "◈", "✦"];
  const colors = ["var(--or)", "var(--info)", "#a78bfa"];

  return (
    <div className="widget-card flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="section-label">AI BRIEFING</span>
      </div>

      <div
        className="text-xs font-medium mb-3"
        style={{ color: "var(--texte-secondaire)" }}
      >
        Today&apos;s Executive Summary
      </div>

      {/* Bullets */}
      <div className="flex-1 space-y-2.5">
        {bullets.map((bullet, i) => (
          <div key={i} className="flex items-start gap-2">
            <span
              className="flex-shrink-0 mt-0.5"
              style={{ fontSize: 11, color: colors[i] }}
            >
              {icons[i]}
            </span>
            <p style={{ fontSize: 11.5, color: "var(--texte-secondaire)", lineHeight: 1.5 }}>
              {bullet}
            </p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <button
        className="mt-4 text-xs flex items-center gap-1 transition-opacity hover:opacity-80"
        style={{ color: "var(--or)" }}
      >
        View Full Briefing →
      </button>
    </div>
  );
}
