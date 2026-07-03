"use client";

import type { BoardroomData } from "@/lib/actions/boardroom-dashboard";

interface HeroCardProps {
  data: BoardroomData;
}

function MetricPill({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div
      className="flex flex-col gap-1 px-4 py-3 rounded-lg"
      style={{
        background: "rgba(0,0,0,0.25)",
        border: "1px solid rgba(200,166,78,0.12)",
        minWidth: 110,
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="flex items-center gap-1.5">
        <span style={{ color: "var(--or)", opacity: 0.7, fontSize: 13 }}>{icon}</span>
        <span style={{ fontSize: 9.5, color: "rgba(237,232,223,0.5)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span style={{ fontSize: 22, fontWeight: 700, color: "var(--texte)", lineHeight: 1 }}>
          {value}
        </span>
        {sub && (
          <span style={{ fontSize: 10, color: "var(--succes)", fontWeight: 500 }}>{sub}</span>
        )}
      </div>
    </div>
  );
}

// ── Animated Gold Orb (the logo circle) ──
function GoldOrb({ confidenceScore }: { confidenceScore: number }) {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: 160, height: 160, flexShrink: 0 }}
    >
      {/* Outer glow rings */}
      <div
        className="absolute inset-0 rounded-full animate-glow-ring"
        style={{
          background: "radial-gradient(circle, rgba(200,166,78,0.08) 0%, transparent 70%)",
          animation: "glow-ring 4s ease-in-out infinite",
        }}
      />
      {/* Ring 3 */}
      <div
        className="absolute rounded-full border"
        style={{
          inset: "10px",
          borderColor: "rgba(200,166,78,0.12)",
          borderWidth: 1,
          animation: "spin-slow 20s linear infinite reverse",
        }}
      />
      {/* Ring 2 */}
      <div
        className="absolute rounded-full border"
        style={{
          inset: "22px",
          borderColor: "rgba(200,166,78,0.22)",
          borderWidth: 1,
          animation: "spin-slow 14s linear infinite",
        }}
      />
      {/* Ring 1 */}
      <div
        className="absolute rounded-full border"
        style={{
          inset: "36px",
          borderColor: "rgba(200,166,78,0.35)",
          borderWidth: 1.5,
        }}
      />
      {/* Center logo */}
      <div
        className="absolute rounded-full flex flex-col items-center justify-center"
        style={{
          inset: "48px",
          background: "radial-gradient(circle at 40% 35%, rgba(200,166,78,0.25), rgba(200,166,78,0.06))",
          border: "1.5px solid rgba(200,166,78,0.5)",
          boxShadow: "0 0 20px rgba(200,166,78,0.2), inset 0 0 15px rgba(200,166,78,0.06)",
        }}
      >
        <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
          <polygon points="20,2 36,11 36,29 20,38 4,29 4,11" stroke="#C8A64E" strokeWidth="1.5" fill="none" opacity="0.9" />
          <polygon points="20,8 31,14.5 31,25.5 20,32 9,25.5 9,14.5" stroke="#C8A64E" strokeWidth="1" fill="rgba(200,166,78,0.08)" opacity="0.8" />
          <text x="20" y="26" textAnchor="middle" fill="#C8A64E" fontSize="14" fontWeight="700" fontFamily="serif">E</text>
        </svg>
        <div style={{ fontSize: 8, color: "var(--or)", opacity: 0.7, letterSpacing: "0.08em", marginTop: 2 }}>
          {confidenceScore}%
        </div>
      </div>
    </div>
  );
}

export default function HeroCard({ data }: HeroCardProps) {
  const { metrics, confidenceScore } = data;

  return (
    <div
      className="relative overflow-hidden rounded-xl"
      style={{
        background: "linear-gradient(135deg, #0D2B1A 0%, #081A0E 35%, #050D08 60%, #080705 100%)",
        border: "1px solid rgba(74,222,128,0.12)",
        minHeight: 200,
      }}
    >
      {/* Banner image background */}
      <img
        src="/branding/BANNER PRSTO.png"
        alt=""
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
      />

      {/* Section label */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <span
          className="section-label"
          style={{ fontSize: 9, letterSpacing: "0.15em", color: "rgba(74,222,128,0.7)" }}
        >
          ✦ EXECUTIVE DAILY BRIEFING
        </span>
      </div>

      <div className="relative flex items-center gap-6 px-5 pt-16 pb-5">
        {/* Left: Title */}
        <div className="flex-1 min-w-0">
          <h1
            className="leading-tight font-bold"
            style={{
              fontSize: 26,
              background: "linear-gradient(135deg, #F4EFE7 0%, #C8A64E 70%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              lineHeight: 1.15,
              maxWidth: 420,
            }}
          >
            Your AI Executive Briefing.
            <br />
            Insights. Signals. Impact.
          </h1>
          <p
            className="mt-2 text-sm leading-relaxed"
            style={{ color: "rgba(237,232,223,0.5)", maxWidth: 360, fontSize: 12 }}
          >
            AI-curated intelligence on markets, opportunities, and people —<br />
            so you can decide with clarity and lead with confidence.
          </p>

          {/* Metrics pills row */}
          <div className="flex flex-wrap gap-2 mt-4">
            <MetricPill
              icon="↑"
              label="Top Opportunities"
              value={metrics.topOpportunities}
              sub={metrics.topOpportunities > 10 ? "Strong Pipeline" : metrics.topOpportunities > 0 ? "Growing" : undefined}
            />
            <MetricPill
              icon="◉"
              label="Market Momentum"
              value={metrics.marketMomentum}
              sub={metrics.marketMomentum > 20 ? "Bullish" : "Neutral"}
            />
            <MetricPill
              icon="◈"
              label="Role Fit Score"
              value={`${metrics.roleFitScore}%`}
              sub={metrics.roleFitScore >= 90 ? "Exceptional" : metrics.roleFitScore >= 70 ? "High" : metrics.roleFitScore >= 40 ? "Good" : undefined}
            />
            <MetricPill
              icon="⊛"
              label="Investor Probability"
              value={`${metrics.investorProbability}%`}
              sub={metrics.investorProbability >= 80 ? "Strong" : metrics.investorProbability >= 50 ? "Moderate" : undefined}
            />
            <MetricPill
              icon="⌬"
              label="Network Signals"
              value={metrics.networkSignals}
              sub={metrics.networkSignals > 5 ? "Active" : undefined}
            />
          </div>
        </div>

        {/* Right: Orb + Outlook */}
        <div className="flex flex-col items-center gap-3 flex-shrink-0">
          {/* Outlook */}
          <div
            className="rounded-lg px-4 py-3 text-center"
            style={{
              background: "rgba(0,0,0,0.3)",
              border: "1px solid rgba(200,166,78,0.15)",
              backdropFilter: "blur(8px)",
              minWidth: 140,
            }}
          >
            <div style={{ fontSize: 9, color: "rgba(237,232,223,0.45)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
              TODAY&apos;S OUTLOOK
            </div>
            <div className="flex items-center justify-center gap-1.5" style={{ color: "var(--succes)" }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>{confidenceScore >= 80 ? "Positive" : confidenceScore >= 50 ? "Stable" : "Developing"}</span>
              <span style={{ fontSize: 14 }}>{confidenceScore >= 80 ? "↗" : "→"}</span>
            </div>
            <div style={{ fontSize: 9, color: "rgba(237,232,223,0.35)", marginTop: 6, letterSpacing: "0.06em" }}>
              Confidence Score
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--texte)", marginTop: 2 }}>
              {confidenceScore}%
            </div>
            {/* Progress bar */}
            <div
              className="mt-2 rounded-full overflow-hidden"
              style={{ height: 2, background: "rgba(255,255,255,0.1)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${confidenceScore}%`,
                  background: "linear-gradient(90deg, var(--or), var(--succes))",
                  transition: "width 1s ease",
                }}
              />
            </div>
          </div>

          {/* Gold Orb */}
          <GoldOrb confidenceScore={confidenceScore} />
        </div>
      </div>
    </div>
  );
}
