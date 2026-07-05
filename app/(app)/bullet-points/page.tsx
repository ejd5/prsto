"use client";

import { useState, useEffect } from "react";
import {
  FileText, Loader2, Copy, Check, Sparkles,
  List, ListOrdered, Type, RefreshCw, Briefcase, Lightbulb
} from "lucide-react";
import { generateExperienceBullets, getBulletPointStatus } from "@/lib/actions/bullet-points";
import type { GeneratedBullets } from "@/lib/jobs/bullet-point-generator";

const STYLE_ICONS: Record<string, typeof List> = {
  star: Sparkles,
  concise: Type,
  numbered: ListOrdered,
}

const STYLE_LABELS: Record<string, string> = {
  star: "STAR",
  concise: "Concis",
  numbered: "Liste",
}

const CATEGORY_COLORS: Record<string, string> = {
  "Performance commerciale": "text-green-400 bg-green-500/10 border-green-500/30",
  "Management": "text-blue-400 bg-blue-500/10 border-blue-500/30",
  "Gestion budgétaire": "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  "Réalisation": "text-purple-400 bg-purple-500/10 border-purple-500/30",
  "Réalisation clé": "text-purple-400 bg-purple-500/10 border-purple-500/30",
  "Responsabilités": "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
  "Contexte": "text-gray-400 bg-gray-500/10 border-gray-500/30",
  "Général": "text-gray-400 bg-gray-500/10 border-gray-500/30",
}

export default function BulletPointsPage() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [experiences, setExperiences] = useState<GeneratedBullets[]>([]);
  const [activeExp, setActiveExp] = useState<string>("");
  const [activeStyle, setActiveStyle] = useState<string>("star");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<{ hasExperiences: boolean; experienceCount: number; companyNames: string[] } | null>(null);

  useEffect(() => {
    getBulletPointStatus().then(setStatus);
    handleGenerate();
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    setError("");
    try {
      const res = await generateExperienceBullets();
      setExperiences(res.experiences);
      if (res.experiences.length > 0 && !activeExp) {
        setActiveExp(res.experiences[0].experienceId);
      }
    } catch (err: any) {
      setError(err.message || "Erreur.");
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  }

  async function handleCopy(text: string, id: string) {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleCopyAll(bullets: { id: string; text: string }[]) {
    const all = bullets.map((b) => b.text).join("\n");
    await navigator.clipboard.writeText(all);
    setCopiedId("all");
    setTimeout(() => setCopiedId(null), 2000);
  }

  const currentExp = experiences.find((e) => e.experienceId === activeExp)
  const filteredBullets = currentExp?.bullets.filter((b) => b.style === activeStyle) || []
  const allCurrentBullets = currentExp?.bullets.filter((b) => b.style === activeStyle) || []

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--dark-card)" }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--accent)" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ background: "var(--dark-card)" }}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--accent-glass)" }}>
            <List className="w-5 h-5" style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Bullet Points Generator</h1>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Générez des puces d&apos;accomplissement percutantes pour chaque expérience
            </p>
          </div>
        </div>

        {status && !status.hasExperiences && (
          <div className="p-4 rounded-xl border" style={{ background: "rgba(245,158,11,0.1)", borderColor: "rgba(245,158,11,0.3)" }}>
            <p className="text-sm" style={{ color: "#f59e0b" }}>
              Aucune expérience trouvée. Ajoutez des expériences dans votre profil d&apos;abord.
            </p>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl border text-sm" style={{ background: "rgba(220,38,38,0.1)", borderColor: "rgba(220,38,38,0.3)", color: "#fca5a5" }}>
            {error}
          </div>
        )}

        {status?.hasExperiences && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex gap-2 flex-wrap">
                {experiences.map((exp) => (
                  <button
                    key={exp.experienceId}
                    onClick={() => setActiveExp(exp.experienceId)}
                    className="px-3 py-2 rounded-lg text-xs font-medium border transition flex items-center gap-1.5"
                    style={{
                      background: activeExp === exp.experienceId ? "var(--accent)" : "var(--bg-secondary)",
                      borderColor: activeExp === exp.experienceId ? "var(--accent)" : "var(--border)",
                      color: activeExp === exp.experienceId ? "#fff" : "var(--muted-foreground)",
                    }}
                  >
                    <Briefcase className="w-3 h-3" />
                    {exp.company}
                  </button>
                ))}
              </div>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                style={{ background: "var(--accent-glass)", color: "var(--accent)" }}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${generating ? "animate-spin" : ""}`} />
                Régénérer
              </button>
            </div>

            {currentExp && (
              <div className="p-4 rounded-xl border" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{currentExp.title}</h2>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{currentExp.company}</p>
                  </div>
                  <div className="flex gap-1">
                    {["star", "concise", "numbered"].map((style) => {
                      const Icon = STYLE_ICONS[style]
                      return (
                        <button
                          key={style}
                          onClick={() => setActiveStyle(style)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium border transition flex items-center gap-1"
                          style={{
                            background: activeStyle === style ? "var(--accent-glass)" : "transparent",
                            borderColor: activeStyle === style ? "var(--accent)" : "var(--border)",
                            color: activeStyle === style ? "var(--accent)" : "var(--muted-foreground)",
                          }}
                        >
                          <Icon className="w-3 h-3" />
                          {STYLE_LABELS[style]}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    {filteredBullets.length} puces générées
                  </p>
                  {filteredBullets.length > 0 && (
                    <button
                      onClick={() => handleCopyAll(allCurrentBullets)}
                      className="flex items-center gap-1 text-xs font-medium transition"
                      style={{ color: copiedId === "all" ? "#22c55e" : "var(--accent)" }}
                    >
                      {copiedId === "all" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedId === "all" ? "Copiées" : "Tout copier"}
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {filteredBullets.map((b) => (
                    <div
                      key={b.id}
                      className="p-3 rounded-xl border flex items-start justify-between gap-3 group"
                      style={{ background: "rgba(0,0,0,0.2)", borderColor: "var(--border)" }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-1.5 py-0.5 rounded border ${CATEGORY_COLORS[b.category] || "text-gray-400 bg-gray-500/10 border-gray-500/30"}`}>
                            {b.category}
                          </span>
                          {b.metrics && (
                            <span className="text-xs font-mono" style={{ color: "var(--accent)" }}>
                              {b.metrics}
                            </span>
                          )}
                        </div>
                        <p className="text-sm" style={{ color: "var(--foreground)" }}>{b.text}</p>
                      </div>
                      <button
                        onClick={() => handleCopy(b.text, b.id)}
                        className="shrink-0 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition"
                        style={{ color: copiedId === b.id ? "#22c55e" : "var(--accent)" }}
                      >
                        {copiedId === b.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>

                {currentExp.suggestions.length > 0 && (
                  <div className="mt-4 p-3 rounded-lg" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
                    <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: "#f59e0b" }}>
                      <Lightbulb className="w-3 h-3" />
                      Suggestions d&apos;amélioration
                    </h4>
                    <ul className="space-y-1">
                      {currentExp.suggestions.map((s, i) => (
                        <li key={i} className="text-xs" style={{ color: "var(--muted-foreground)" }}>• {s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
