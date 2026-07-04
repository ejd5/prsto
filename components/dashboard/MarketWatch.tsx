"use client";

import type { BoardroomData } from "@/lib/actions/boardroom-dashboard";

interface MarketWatchProps {
  market: BoardroomData["market"];
}

// ── Sparkline SVG chart ──
function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const w = 280;
  const h = 48;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = w / (points.length - 1);

  const coords = points.map((p, i) => ({
    x: i * step,
    y: h - ((p - min) / range) * (h - 8) - 4,
  }));

  const pathD = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(" ");

  // Area fill
  const areaD = `${pathD} L ${(points.length - 1) * step} ${h} L 0 ${h} Z`;

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(74,222,128,0.25)" />
          <stop offset="100%" stopColor="rgba(74,222,128,0)" />
        </linearGradient>
      </defs>
      {/* Area */}
      <path d={areaD} fill="url(#spark-fill)" />
      {/* Line */}
      <path
        d={pathD}
        fill="none"
        stroke="rgba(74,222,128,0.7)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

const TREND_COLOR: Record<string, string> = {
  Bullish: "var(--succes)",
  Neutral: "var(--texte-tertiaire)",
  Bearish: "var(--erreur)",
};

export default function MarketWatch({ market }: MarketWatchProps) {
  return (
    <div className="widget-card flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <span className="section-label">MARKET WATCH</span>
        <span style={{ fontSize: 10, color: "var(--texte-tertiaire)" }}>This Week ↓</span>
      </div>
      <div
        className="text-xs mb-3"
        style={{ color: "var(--texte-secondaire)", fontWeight: 500 }}
      >
        AI Sector Sentiment
      </div>

      {/* Sparkline chart */}
      <div
        className="rounded-lg overflow-hidden mb-4"
        style={{ background: "var(--fond-widget)", padding: "8px 12px 4px", border: "1px solid var(--bordure-douce)" }}
      >
        <Sparkline points={market.sentimentPoints} />
      </div>

      {/* Sector grid */}
      <div className="grid grid-cols-2 gap-2 flex-1">
        {market.sectors.map((sector) => {
          const color = TREND_COLOR[sector.trend] ?? "var(--texte-secondaire)";
          const isPositive = sector.change.startsWith("+");
          return (
            <div
              key={sector.name}
              className="flex flex-col gap-0.5 p-2 rounded-lg"
              style={{ background: "var(--fond-widget)", border: "1px solid var(--bordure-douce)" }}
            >
              <span style={{ fontSize: 10.5, color: "var(--texte)", fontWeight: 500 }}>
                {sector.name}
              </span>
              <div className="flex items-center justify-between">
                <span style={{ fontSize: 9.5, color }}>
                  {sector.trend}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: isPositive ? "var(--succes)" : "var(--erreur)",
                  }}
                >
                  {sector.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
