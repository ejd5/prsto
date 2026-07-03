"use client";

import type { BoardroomData } from "@/lib/actions/boardroom-dashboard";

interface ExecutiveNarrativeProps {
  narrative: BoardroomData["narrative"];
  pipeline: BoardroomData["pipeline"];
}

export default function ExecutiveNarrative({ narrative, pipeline }: ExecutiveNarrativeProps) {
  const points = [
    narrative.provenTrackRecord || narrative.strategicInitiatives > 0
      ? `Track record established — ${narrative.strategicInitiatives} strategic initiative(s) in your pipeline drive your executive profile.`
      : "Building a track record — add more opportunities to your pipeline.",
    narrative.strategicInitiatives > 0
      ? `${narrative.strategicInitiatives} strategic initiative(s) active with measurable outcomes.`
      : "No strategic initiatives logged yet. Import or track an opportunity to begin.",
    narrative.teamBuilder
      ? "Leadership profile indicates team building and partnership execution capabilities."
      : "Interview preparation will strengthen your executive narrative.",
  ];

  return (
    <div className="widget-card flex flex-col h-full">
      {/* Header */}
      <div className="mb-3">
        <span className="section-label">EXECUTIVE NARRATIVE</span>
        <div
          className="text-xs font-medium mt-2"
          style={{ color: "var(--texte-secondaire)" }}
        >
          AI-Generated Talking Points
        </div>
      </div>

      {/* Points */}
      <div className="flex-1 space-y-3">
        {points.map((point, i) => (
          <div key={i} className="flex items-start gap-2">
            <div
              className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5"
              style={{ background: "rgba(200,166,78,0.15)", fontSize: 9, color: "var(--or)", fontWeight: 700 }}
            >
              {i + 1}
            </div>
            <p style={{ fontSize: 11.5, color: "var(--texte-secondaire)", lineHeight: 1.5 }}>
              {point}
            </p>
          </div>
        ))}
      </div>

      {/* Pipeline mini stats */}
      {(pipeline.sent > 0 || pipeline.interview > 0) && (
        <div
          className="mt-4 grid grid-cols-3 gap-2 p-2 rounded-lg"
          style={{ background: "rgba(200,166,78,0.04)", border: "1px solid rgba(200,166,78,0.1)" }}
        >
          {[
            { label: "Sent", value: pipeline.sent, color: "var(--succes)" },
            { label: "Interview", value: pipeline.interview, color: "var(--info)" },
            { label: "Offer", value: pipeline.offer, color: "var(--or)" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 9, color: "var(--texte-tertiaire)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <button
        className="mt-3 text-xs flex items-center gap-1 hover:opacity-80 transition-opacity"
        style={{ color: "var(--or)" }}
      >
        Customize Narrative →
      </button>
    </div>
  );
}
