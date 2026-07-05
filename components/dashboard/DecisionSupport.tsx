"use client";

import { useRouter } from "next/navigation";
import type { BoardroomData } from "@/lib/actions/boardroom-dashboard";

interface DecisionSupportProps {
  decision: BoardroomData["decision"];
}

const CONFIDENCE_COLOR = {
  HIGH: "var(--succes)",
  MEDIUM: "var(--warning)",
  LOW: "var(--erreur)",
};

const CONFIDENCE_BG = {
  HIGH: "rgba(74,222,128,0.12)",
  MEDIUM: "rgba(245,158,11,0.12)",
  LOW: "rgba(239,68,68,0.12)",
};

const ACTION_COLOR = {
  Pursue: "var(--succes)",
  Hold: "var(--warning)",
  Skip: "var(--erreur)",
};

export default function DecisionSupport({ decision }: DecisionSupportProps) {
  const router = useRouter();

  if (!decision) {
    return (
      <div className="widget-card flex flex-col h-full justify-center items-center text-center">
        <span className="section-label mb-2">DECISION SUPPORT</span>
        <p style={{ fontSize: 12, color: "var(--texte-tertiaire)" }}>
          Add opportunities and run analyses to unlock AI recommendations.
        </p>
      </div>
    );
  }

  const actionColor = ACTION_COLOR[decision.action] ?? "var(--succes)";
  const confColor = CONFIDENCE_COLOR[decision.confidence];
  const confBg = CONFIDENCE_BG[decision.confidence];

  // Route to the appropriate optimizer tool based on the decision
  const handleQuickOptimize = () => {
    // Save target opportunity info in session storage to pre-fill the optimizer forms
    sessionStorage.setItem("prsto-quick-target", JSON.stringify({
      title: decision.targetTitle,
      company: decision.targetCompany
    }));
    router.push("/ai-optimize");
  };

  return (
    <div className="widget-card flex flex-col h-full justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="section-label">DECISION SUPPORT</span>
          <span
            style={{ fontSize: 9, color: "var(--texte-tertiaire)", letterSpacing: "0.06em" }}
          >
            AI Recommendation
          </span>
        </div>

        {/* Main Card */}
        <div
          className="rounded-xl p-4 flex flex-col gap-3"
          style={{
            background: "linear-gradient(135deg, rgba(74,222,128,0.06) 0%, rgba(0,0,0,0) 100%)",
            border: "1px solid rgba(74,222,128,0.15)",
          }}
        >
          {/* Action badge */}
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center font-bold"
              style={{ background: `${actionColor}20`, color: actionColor, fontSize: 13 }}
            >
              {decision.action === "Pursue" ? "↑" : decision.action === "Hold" ? "◎" : "✕"}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: actionColor }}>
                {decision.action}
              </div>
              <div style={{ fontSize: 9.5, color: "var(--texte-tertiaire)" }}>
                Primary Recommendation
              </div>
            </div>
          </div>

          {/* Opportunity info */}
          <div
            className="rounded-lg p-3"
            style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div style={{ fontSize: 12.5, color: "var(--texte)", fontWeight: 600 }}>
              {decision.targetTitle}
            </div>
            <div style={{ fontSize: 11, color: "var(--texte-secondaire)", marginTop: 2 }}>
              {decision.targetCompany}
            </div>

            {/* Confidence */}
            <div
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded mt-2"
              style={{ background: confBg, border: `1px solid ${confColor}30` }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: confColor }}
              />
              <span style={{ fontSize: 9.5, color: confColor, fontWeight: 600, letterSpacing: "0.05em" }}>
                {decision.confidence} CONFIDENCE
              </span>
            </div>
          </div>

          {/* Rationale */}
          <p style={{ fontSize: 11, color: "var(--texte-secondaire)", lineHeight: 1.5 }}>
            Rationale: {decision.rationale}
          </p>
        </div>
      </div>

      <div className="mt-3 flex justify-between items-center gap-2">
        <button
          className="text-xs hover:opacity-80 transition-opacity"
          style={{ color: "var(--texte-tertiaire)" }}
          onClick={() => router.push("/opportunites")}
        >
          View Analysis →
        </button>

        {decision.action === "Pursue" && (
          <button
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, var(--or), #C8A64E)",
              color: "#0B1F18",
              boxShadow: "0 4px 12px rgba(200,166,78,0.2)",
            }}
            onClick={handleQuickOptimize}
          >
            ⚡ Préparer ma candidature
          </button>
        )}
      </div>
    </div>
  );
}
