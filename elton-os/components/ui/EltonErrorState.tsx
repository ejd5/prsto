"use client";

import { AlertTriangle, RefreshCw, HelpCircle } from "lucide-react";

interface EltonErrorStateProps {
  /** What went wrong, in human language */
  title?: string;
  /** What the user can do next */
  message?: string;
  /** Called when user clicks "Réessayer" */
  onRetry?: () => void;
  /** Optional link to guide page */
  guideHref?: string;
}

export default function EltonErrorState({
  title = "Une erreur est survenue",
  message = "Vérifiez votre connexion ou réessayez plus tard.",
  onRetry,
  guideHref,
}: EltonErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center text-center py-8 px-4 rounded-xl border"
      style={{ borderColor: "rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.03)" }}
    >
      <AlertTriangle size={32} style={{ color: "#ef4444", marginBottom: 12 }} />
      <h3 className="text-base font-semibold mb-1" style={{ color: "var(--texte)" }}>
        {title}
      </h3>
      <p className="text-sm max-w-md mb-4" style={{ color: "var(--texte-secondaire)" }}>
        {message}
      </p>
      <div className="flex gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
            style={{ background: "var(--or)", color: "#000" }}
          >
            <RefreshCw size={14} />
            Réessayer
          </button>
        )}
        {guideHref && (
          <a
            href={guideHref}
            className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg border transition-colors"
            style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)" }}
          >
            <HelpCircle size={14} />
            Guide
          </a>
        )}
      </div>
    </div>
  );
}
