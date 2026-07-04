"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, AlertTriangle, XCircle, Crown, ScanLine } from "lucide-react";

interface CheckpointResult {
  id: string;
  category: "format" | "structure" | "content" | "executive" | "ats";
  label: string;
  status: "pass" | "warn" | "fail";
  score: number;
  message: string;
  recommendation?: string;
  weight: number;
}

interface AnalysisResult {
  score: number;
  grade: string;
  checkpoints: CheckpointResult[];
  byCategory: Record<string, { score: number; passed: number; warned: number; failed: number }>;
  detectedLanguage: string;
  detectedIndustries: string[];
  aiRecommendations: Array<{ priority: string; title: string; rationale: string; action: string }>;
  aiExecutiveSummary?: string;
  aiCompetitiveVsPeers?: string;
  reziComparison: { reziPoints: number; prstoPoints: number; extras: string[] };
  analyzedAt: string;
}

const CATEGORY_META: Record<string, { label: string; icon: typeof Crown; color: string }> = {
  format: { label: "Format", icon: ScanLine, color: "#3B82F6" },
  structure: { label: "Structure", icon: ScanLine, color: "#8B5CF6" },
  content: { label: "Contenu", icon: ScanLine, color: "#10B981" },
  executive: { label: "Signaux exécutifs", icon: Crown, color: "#F59E0B" },
  ats: { label: "Compatibilité ATS", icon: ScanLine, color: "#EF4444" },
};

export default function ATSCheckerPage() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (resumeText.trim().length < 50) {
      setError("Collez au moins 50 caractères de votre CV");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/tools/resume-checker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription: jobDescription || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur d'analyse");
        return;
      }
      setResult(data);
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4" style={{ background: "var(--prsto-ivory)" }}>
      <div className="max-w-5xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4" style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B" }}>
            <Crown size={14} />
            <span className="text-xs font-mono uppercase tracking-wide">35 points · Executive-grade</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl mb-3" style={{ color: "var(--prsto-forest)" }}>
            ATS Resume Checker
          </h1>
          <p className="text-base max-w-2xl mx-auto" style={{ color: "var(--texte-secondaire)" }}>
            Analyse 35 critères ATS dont <strong>12 signaux exécutifs</strong> que les autres checkers ignorent (gouvernance, P&L, portée internationale, M&A…)
          </p>
          <p className="text-xs mt-3" style={{ color: "var(--texte-tertiaire)" }}>
            Rezi en analyse 23. Nous en analysons 35 — pensés pour les cadres dirigeants.
          </p>
        </div>

        {/* Input form */}
        {!result && (
          <div className="rounded-2xl p-6 md:p-8 mb-8" style={{ background: "#FFF", border: "1px solid #E5E7EB" }}>
            <div className="mb-5">
              <label className="block text-xs font-mono mb-2 uppercase tracking-wide" style={{ color: "var(--texte-secondaire)" }}>
                Collez votre CV (texte)
              </label>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Collez ici le contenu intégral de votre CV en texte…"
                rows={10}
                className="w-full p-4 rounded-lg text-sm font-mono outline-none resize-y"
                style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", color: "var(--texte)" }}
              />
              <div className="text-xs mt-1 flex justify-between" style={{ color: "var(--texte-tertiaire)" }}>
                <span>{resumeText.length} caractères</span>
                <span>Min. 50 caractères</span>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-mono mb-2 uppercase tracking-wide" style={{ color: "var(--texte-secondaire)" }}>
                Offre visée (optionnel — améliore la pertinence)
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Collez l'offre d'emploi à laquelle vous postulez…"
                rows={4}
                className="w-full p-4 rounded-lg text-sm outline-none resize-y"
                style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", color: "var(--texte)" }}
              />
            </div>

            {error && (
              <div className="text-sm p-3 rounded mb-4" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                {error}
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full py-3 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: "var(--prsto-forest)", color: "#FFF" }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Analyse des 35 points en cours…
                </>
              ) : (
                <>
                  <ScanLine size={16} />
                  Analyser mon CV
                </>
              )}
            </button>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Score card */}
            <div className="rounded-2xl p-8 text-center" style={{ background: "#FFF", border: "1px solid #E5E7EB" }}>
              <div className="text-xs font-mono uppercase tracking-wide mb-3" style={{ color: "var(--texte-tertiaire)" }}>
                Score global PRSTO
              </div>
              <div className="flex items-baseline justify-center gap-3 mb-3">
                <span className="font-serif text-7xl" style={{ color: result.score >= 70 ? "#10B981" : result.score >= 50 ? "#F59E0B" : "#EF4444" }}>
                  {result.score}
                </span>
                <span className="text-2xl" style={{ color: "var(--texte-tertiaire)" }}>/100</span>
                <span className="text-3xl font-bold ml-3" style={{ color: "var(--prsto-forest)" }}>·{result.grade}</span>
              </div>
              <div className="flex justify-center gap-4 text-xs flex-wrap">
                {Object.entries(result.byCategory).map(([cat, data]) => {
                  const meta = CATEGORY_META[cat];
                  const Icon = meta?.icon || ScanLine;
                  return (
                    <div key={cat} className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "#F9FAFB" }}>
                      <Icon size={12} style={{ color: meta?.color }} />
                      <span style={{ color: "var(--texte-secondaire)" }}>{meta?.label}</span>
                      <span className="font-bold" style={{ color: meta?.color }}>{data.score}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Executive Summary */}
            {result.aiExecutiveSummary && (
              <div className="rounded-2xl p-6" style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Crown size={16} style={{ color: "#F59E0B" }} />
                  <span className="text-xs font-mono uppercase tracking-wide" style={{ color: "#92400E" }}>
                    Diagnostic exécutif IA
                  </span>
                </div>
                <p className="text-sm mb-3" style={{ color: "var(--texte)" }}>{result.aiExecutiveSummary}</p>
                {result.aiCompetitiveVsPeers && (
                  <div className="text-xs p-3 rounded-lg" style={{ background: "#FFF", color: "var(--texte-secondaire)" }}>
                    <strong>vs pairs:</strong> {result.aiCompetitiveVsPeers}
                  </div>
                )}
                {result.detectedIndustries.length > 0 && (
                  <div className="text-xs mt-2" style={{ color: "var(--texte-tertiaire)" }}>
                    Secteur(x) détecté(s): {result.detectedIndustries.join(", ")} · Langue: {result.detectedLanguage.toUpperCase()}
                  </div>
                )}
              </div>
            )}

            {/* AI Recommendations */}
            {result.aiRecommendations.length > 0 && (
              <div className="rounded-2xl p-6" style={{ background: "#FFF", border: "1px solid #E5E7EB" }}>
                <h3 className="text-sm font-mono uppercase tracking-wide mb-4" style={{ color: "var(--texte-secondaire)" }}>
                  Recommandations stratégiques IA
                </h3>
                <div className="space-y-3">
                  {result.aiRecommendations.map((rec, i) => (
                    <div key={i} className="p-4 rounded-lg" style={{ background: "#F9FAFB" }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase ${
                          rec.priority === "haute" ? "bg-red-100 text-red-700" :
                          rec.priority === "moyenne" ? "bg-orange-100 text-orange-700" :
                          "bg-blue-100 text-blue-700"
                        }`}>
                          {rec.priority}
                        </span>
                        <span className="text-sm font-semibold" style={{ color: "var(--texte)" }}>{rec.title}</span>
                      </div>
                      <p className="text-xs mb-2" style={{ color: "var(--texte-secondaire)" }}>{rec.rationale}</p>
                      <p className="text-xs" style={{ color: "var(--prsto-forest)" }}>
                        <strong>Action:</strong> {rec.action}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed checkpoints by category */}
            <div className="rounded-2xl p-6" style={{ background: "#FFF", border: "1px solid #E5E7EB" }}>
              <h3 className="text-sm font-mono uppercase tracking-wide mb-4" style={{ color: "var(--texte-secondaire)" }}>
                Détail des 35 points analysés
              </h3>
              <div className="space-y-6">
                {Object.entries(result.byCategory).map(([cat, data]) => {
                  const meta = CATEGORY_META[cat];
                  const Icon = meta?.icon || ScanLine;
                  const catResults = result.checkpoints.filter((c) => c.category === cat);
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-3 pb-2 border-b">
                        <div className="flex items-center gap-2">
                          <Icon size={16} style={{ color: meta?.color }} />
                          <span className="text-sm font-semibold" style={{ color: "var(--texte)" }}>{meta?.label}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="flex items-center gap-1" style={{ color: "#10B981" }}>
                            <CheckCircle2 size={12} /> {data.passed}
                          </span>
                          <span className="flex items-center gap-1" style={{ color: "#F59E0B" }}>
                            <AlertTriangle size={12} /> {data.warned}
                          </span>
                          <span className="flex items-center gap-1" style={{ color: "#EF4444" }}>
                            <XCircle size={12} /> {data.failed}
                          </span>
                          <span className="font-bold ml-2" style={{ color: meta?.color }}>{data.score}/100</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {catResults.map((c) => {
                          const Icon = c.status === "pass" ? CheckCircle2 : c.status === "warn" ? AlertTriangle : XCircle;
                          const color = c.status === "pass" ? "#10B981" : c.status === "warn" ? "#F59E0B" : "#EF4444";
                          return (
                            <div key={c.id} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: "#F9FAFB" }}>
                              <Icon size={16} style={{ color, flexShrink: 0, marginTop: 2 }} />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium" style={{ color: "var(--texte)" }}>{c.label}</div>
                                <div className="text-xs mt-0.5" style={{ color: "var(--texte-secondaire)" }}>{c.message}</div>
                                {c.recommendation && (
                                  <div className="text-xs mt-1 italic" style={{ color: "var(--prsto-forest)" }}>
                                    → {c.recommendation}
                                  </div>
                                )}
                              </div>
                              <span className="text-xs font-mono font-bold" style={{ color }}>{c.score}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rezi comparison */}
            <div className="rounded-2xl p-6" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.05), rgba(59,130,246,0.05))", border: "1px solid #E5E7EB" }}>
              <h3 className="text-sm font-mono uppercase tracking-wide mb-3" style={{ color: "var(--texte-secondaire)" }}>
                Pourquoi 35 points et pas 23 ?
              </h3>
              <p className="text-xs mb-4" style={{ color: "var(--texte-secondaire)" }}>
                Rezi et les autres checkers analysent 23 critères génériques. PRSTO en ajoute 12 spécifiques aux cadres dirigeants :
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {result.reziComparison.extras.map((extra, i) => (
                  <div key={i} className="text-xs flex items-center gap-2 p-2 rounded" style={{ background: "#FFF" }}>
                    <Crown size={12} style={{ color: "#F59E0B" }} />
                    <span style={{ color: "var(--texte)" }}>{extra}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Restart */}
            <div className="text-center pt-4">
              <button
                onClick={() => {
                  setResult(null);
                  setResumeText("");
                  setJobDescription("");
                }}
                className="text-sm px-6 py-2 rounded-lg"
                style={{ background: "#FFF", border: "1px solid #E5E7EB", color: "var(--texte)" }}
              >
                Analyser un autre CV
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
