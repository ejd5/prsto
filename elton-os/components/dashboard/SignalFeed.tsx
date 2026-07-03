"use client";

import { useRouter } from "next/navigation";
import type { BoardroomData } from "@/lib/actions/boardroom-dashboard";

interface SignalFeedProps {
  signals: BoardroomData["signals"];
}

const TYPE_CONFIG = {
  opportunity: { icon: "⬆", color: "var(--succes)", label: "New Opportunity" },
  analysis: { icon: "◈", color: "var(--info)", label: "Analysis Ready" },
  interview: { icon: "🎙", color: "#a78bfa", label: "Interview" },
  contact: { icon: "✦", color: "var(--or)", label: "Recruiter Outreach" },
};

export default function SignalFeed({ signals }: SignalFeedProps) {
  const router = useRouter();

  if (signals.length === 0) {
    return (
      <div className="widget-card flex flex-col h-full">
        <div className="flex items-center justify-between mb-3">
          <span className="section-label">SIGNAL FEED</span>
          <div className="flex items-center gap-1.5">
            <span className="live-dot" />
            <span style={{ fontSize: 9.5, color: "var(--succes)" }}>Live</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(200,166,78,0.08)" }}>
            <span style={{ fontSize: 18, opacity: 0.5 }}>⚡</span>
          </div>
          <div>
            <p className="text-xs font-semibold" style={{ color: "var(--texte)" }}>Aucun signal pour le moment</p>
            <p className="text-[10px] mt-1" style={{ color: "var(--texte-tertiaire)" }}>Scanne le marché ou importe des offres pour activer les signaux.</p>
          </div>
          <button onClick={() => router.push("/market-radar")} className="text-[10px] font-mono px-3 py-1.5 rounded-lg border transition-colors" style={{ borderColor: "var(--or)", color: "var(--or)" }}>
            Ouvrir le Market Radar →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="widget-card flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <span className="section-label">SIGNAL FEED</span>
        <div className="flex items-center gap-1.5">
          <span className="live-dot" />
          <span style={{ fontSize: 9.5, color: "var(--succes)" }}>Live</span>
        </div>
      </div>

      <div className="flex-1 space-y-2">
        {signals.slice(0, 4).map((signal) => {
          const config = TYPE_CONFIG[signal.type] ?? TYPE_CONFIG.opportunity;
          return (
            <div
              key={signal.id}
              className="flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-all duration-150"
              style={{ background: "var(--fond-widget)", border: "1px solid transparent" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "var(--bordure)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "transparent";
              }}
            >
              <div
                className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center mt-0.5"
                style={{ background: `${config.color}18`, fontSize: 11, color: config.color }}
              >
                {config.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1">
                  <span style={{ fontSize: 11.5, color: "var(--texte)", fontWeight: 500 }}>
                    {signal.title}
                  </span>
                  <span className="flex-shrink-0" style={{ fontSize: 9.5, color: "var(--texte-tertiaire)" }}>
                    {signal.timeAgo}
                  </span>
                </div>
                <p style={{ fontSize: 10.5, color: "var(--texte-secondaire)", marginTop: 1, lineHeight: 1.4 }}>
                  {signal.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <button
        className="mt-3 text-xs flex items-center gap-1 hover:opacity-80 transition-opacity"
        style={{ color: "var(--or)" }}
        onClick={() => router.push("/opportunites")}
      >
        View All Signals →
      </button>
    </div>
  );
}
