"use client";

import { useState, useEffect } from "react";
import { Loader2, AlertTriangle, X, Check, Sparkles } from "lucide-react";
import { getSuggestions, type SuggestionTarget, type SuggestionItem } from "@/lib/ai/suggestions";
import { getFirstProfileId } from "@/lib/actions/profile-helper";

const SUPPORTED_TARGETS: SuggestionTarget[] = ["skills", "languages", "education", "certifications", "proofs"];

export type { SuggestionTarget };
export interface AIAssistantProps {
  profileId?: string;
  /** Callback when user applies a suggestion */
  onApply: (target: SuggestionTarget, item: SuggestionItem) => void;
  /** Which suggestion types to show (default: all) */
  targets?: SuggestionTarget[];
  /** Optional labels for each target */
  targetLabels?: Partial<Record<SuggestionTarget, string>>;
  /** Place where the panel renders */
  position?: "fixed" | "inline";
}

const DEFAULT_LABELS: Record<SuggestionTarget, string> = {
  skills: "Compétences",
  languages: "Langues",
  education: "Formations",
  certifications: "Certifications",
  proofs: "Preuves",
};

export default function AIAssistant({ profileId: propProfileId, onApply, targets, targetLabels, position = "fixed" }: AIAssistantProps) {
  const [profileId, setProfileId] = useState(propProfileId || null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTarget, setActiveTarget] = useState<SuggestionTarget | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Chargement auto du profileId — set-state-in-effect inévitable
    if (!profileId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoadingProfile(true);
      getFirstProfileId().then((id) => {
        setProfileId(id);
        setLoadingProfile(false);
      });
    }
  }, [profileId]);

  const activeTargets = (targets ?? SUPPORTED_TARGETS).filter((t): t is SuggestionTarget => SUPPORTED_TARGETS.includes(t));
  const labels = { ...DEFAULT_LABELS, ...targetLabels };

  const loadSuggestions = async (target: SuggestionTarget) => {
    if (!profileId) return;
    setActiveTarget(target);
    setLoading(true);
    setError(null);
    setIsOpen(true);

    try {
      const result = await getSuggestions(profileId, target);
      setSuggestions(result.suggestions);
      if (result.source === "no_key") {
        setError("DeepSeek non configuré — suggestions basées sur votre profil et CV");
      } else if (result.source === "local" && result.error) {
        setError(result.error);
      }
    } catch {
      setSuggestions([]);
      setError("Erreur lors de la génération des suggestions");
    }
    setLoading(false);
  };

  const handleApply = (item: SuggestionItem) => {
    if (activeTarget) {
      onApply(activeTarget, item);
    }
  };

  // Floating panel
  const panel = isOpen && (
    <div style={{
      position: position === "fixed" ? "fixed" : "relative",
      bottom: position === "fixed" ? 24 : undefined,
      right: position === "fixed" ? 24 : undefined,
      zIndex: 999,
      width: position === "fixed" ? 380 : undefined,
      maxHeight: "70vh",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    }}
      className={position === "fixed" ? "shadow-2xl" : ""}
    >
      <div className="rounded-lg border overflow-hidden" style={{
        background: "var(--fond-surface)",
        borderColor: "var(--or)",
      }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--bordure)", background: "var(--or-faible)" }}>
          <div className="flex items-center gap-2">
            <Sparkles size={14} style={{ color: "var(--or)" }} />
            <span className="text-xs font-bold" style={{ color: "var(--texte)" }}>Assistant IA</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-0.5 rounded" style={{ color: "var(--texte-tertiaire)" }}>
            <X size={14} />
          </button>
        </div>

        {loadingProfile ? (
          <div className="flex items-center gap-2 px-4 py-3 text-xs" style={{ color: "var(--texte-tertiaire)" }}>
            <Loader2 size={12} className="animate-spin" style={{ color: "var(--or)" }} />
            Chargement du profil...
          </div>
        ) : !profileId ? (
          <div className="px-4 py-6 text-xs text-center" style={{ color: "var(--texte-tertiaire)" }}>
            Créez d&apos;abord un profil exécutif pour utiliser les suggestions IA.
          </div>
        ) : !activeTarget && !loading ? (
          <div className="px-3 py-2">
            <p className="text-xs mb-2" style={{ color: "var(--texte-secondaire)" }}>
              Que souhaitez-vous enrichir ?
            </p>
            <div className="flex flex-wrap gap-1.5">
              {activeTargets.map((target) => (
                <button
                  key={target}
                  onClick={() => loadSuggestions(target)}
                  className="px-2.5 py-1.5 text-xs font-mono rounded-md transition-colors border"
                  style={{
                    background: "var(--fond)",
                    borderColor: "var(--bordure)",
                    color: "var(--texte-secondaire)",
                  }}
                >
                  {labels[target]}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-2 px-4 py-3 text-xs" style={{ color: "var(--texte-tertiaire)" }}>
            <Loader2 size={12} className="animate-spin" style={{ color: "var(--or)" }} />
            Analyse en cours...
          </div>
        )}

        {/* Results */}
        {!loading && activeTarget && (
          <div className="px-3 py-2 space-y-1.5 max-h-64 overflow-y-auto">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-mono uppercase" style={{ color: "var(--or)" }}>
                {labels[activeTarget]}
              </span>
              <button
                onClick={() => { setActiveTarget(null); setSuggestions([]); setError(null); }}
                className="text-xs font-mono" style={{ color: "var(--texte-tertiaire)" }}
              >
                ← Retour
              </button>
            </div>

            {error && (
              <p className="text-xs mb-1" style={{ color: "var(--avertissement)" }}>
                <AlertTriangle size={10} className="inline mr-1" />{error}
              </p>
            )}

            {suggestions.length === 0 && !loading && (
              <p className="text-xs py-4 text-center" style={{ color: "var(--texte-tertiaire)" }}>
                Aucune suggestion disponible
              </p>
            )}

            {suggestions.map((item, i) => (
              <div key={i}
                className="flex items-start justify-between p-2 rounded border text-xs"
                style={{ borderColor: "var(--bordure-douce)", background: "var(--fond)" }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span style={{ color: "var(--texte)" }}>{item.name}</span>
                    {item.category && (
                      <span className="px-1 py-0.5 rounded text-[9px] font-mono" style={{ background: "var(--or-faible)", color: "var(--or)" }}>
                        {item.category}
                      </span>
                    )}
                    {item.level && (
                      <span className="text-[10px]" style={{ color: "var(--texte-tertiaire)" }}>
                        {item.level}
                      </span>
                    )}
                    <span className="text-[10px] font-mono" style={{ color: item.confidence >= 70 ? "var(--succes)" : "var(--avertissement)" }}>
                      {item.confidence}%
                    </span>
                  </div>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--texte-tertiaire)" }}>
                    {item.reason}
                  </p>
                </div>
                <button
                  onClick={() => handleApply(item)}
                  className="flex-shrink-0 px-2 py-1 rounded text-[10px] font-mono ml-2 whitespace-nowrap"
                  style={{ background: "var(--or)", color: "#000" }}
                >
                  <Check size={10} className="inline mr-0.5" />Utiliser
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const trigger = !isOpen && (
    <button
      onClick={() => setIsOpen(true)}
      className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-mono shadow-lg border transition-all hover:scale-105"
      style={{
        position: position === "fixed" ? "fixed" : "relative",
        bottom: position === "fixed" ? 24 : undefined,
        right: position === "fixed" ? 24 : undefined,
        zIndex: 999,
        background: "var(--or)",
        color: "#000",
        borderColor: "var(--or)",
      }}
    >
      <Sparkles size={14} />
      Suggestions IA
    </button>
  );

  if (position === "inline") {
    return (
      <div className="space-y-1">
        {trigger}
        {panel}
      </div>
    );
  }

  return (
    <>
      {trigger}
      {panel}
    </>
  );
}
