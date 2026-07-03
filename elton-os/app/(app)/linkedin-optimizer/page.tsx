"use client";

import { useState, useEffect } from "react";
import {
  Globe, Loader2, AlertTriangle, CheckCircle2, XCircle,
  Lightbulb, ArrowUp, Flag, Star, RefreshCw, User, FileText,
  Target, ShieldCheck, Sparkles, Copy, TrendingUp, Zap,
  Clock, Layers, BarChart3, Image, Link2, ThumbsUp, Search,
  Eye, EyeOff, Wand2
} from "lucide-react";
import { runLinkedInAnalysis, getLinkedInStatus, matchKeywordsForProfile } from "@/lib/actions/linkedin-optimizer";
import type { LinkedInAnalysis, LinkedInSection, ProfileCompleteness, KeywordMatchResult } from "@/lib/jobs/linkedin-optimizer";
import { getScoreColor, getScoreBg } from "@/lib/score-colors";
import { useToast } from "@/components/ui/EltonToast";

const SECTION_ICONS: Record<string, React.ReactNode> = {
  Headline: <FileText size={12} />,
  Résumé: <Layers size={12} />,
  Expériences: <BarChart3 size={12} />,
  Compétences: <Target size={12} />,
  "Profil complété": <ShieldCheck size={12} />,
};

const PRIORITY_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  critical: { label: "Critique", icon: <AlertTriangle size={10} /> },
  high: { label: "Prioritaire", icon: <ArrowUp size={10} /> },
  medium: { label: "Utile", icon: <Lightbulb size={10} /> },
  low: { label: "Optionnel", icon: <Flag size={10} /> },
};

const PRIORITY_SCORE: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export default function LinkedInOptimizerPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [analysis, setAnalysis] = useState<LinkedInAnalysis | null>(null);
  const [status, setStatus] = useState<{ hasProfile: boolean; fullName: string; title: string; linkedin: string } | null>(null);
  const [error, setError] = useState("");
  const [jobText, setJobText] = useState("");
  const [keywordMatch, setKeywordMatch] = useState<KeywordMatchResult | null>(null);
  const [matchingKeywords, setMatchingKeywords] = useState(false);
  const [showHeadline, setShowHeadline] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    getLinkedInStatus().then(setStatus);
    handleAnalyze();
  }, []);

  async function handleAnalyze() {
    setGenerating(true);
    setError("");
    setShowHeadline(false);
    setShowSummary(false);
    try {
      const res = await runLinkedInAnalysis();
      setAnalysis(res);
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'analyse.");
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  }

  async function handleMatchKeywords() {
    if (!jobText.trim()) return;
    setMatchingKeywords(true);
    try {
      const res = await matchKeywordsForProfile(jobText);
      setKeywordMatch(res);
    } catch { toast.error("Erreur lors du matching"); }
    setMatchingKeywords(false);
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text).then(
      () => toast.success("Copié dans le presse-papier"),
      () => toast.error("Erreur lors de la copie")
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--fond)" }}>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center"
            style={{ background: "var(--or-faible)", border: "1px solid var(--or)" }}>
            <Loader2 size={28} className="animate-spin" style={{ color: "var(--or)" }} />
          </div>
          <p className="text-sm font-mono" style={{ color: "var(--texte-secondaire)" }}>Analyse du profil candidat LinkedIn en cours...</p>
        </div>
      </div>
    );
  }

  const score = analysis?.overallScore ?? 0;
  const scoreC = getScoreColor(score);
  const suggestions = analysis?.suggestions ?? [];
  const quickWins = suggestions.filter(s => s.priority === "critical" || s.priority === "high").slice(0, 3);
  const remaining = suggestions.filter(s => !quickWins.includes(s));
  const sectionsComplete = analysis?.sections?.filter(s => s.status === "good").length ?? 0;
  const sectionsTotal = analysis?.sections?.length ?? 5;
  const pc = analysis?.profileCompleteness;

  return (
    <div className="min-h-screen p-6" style={{ background: "var(--fond)" }}>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── Header premium ── */}
        <div className="space-y-4">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: "var(--texte-tertiaire)" }}>
                <Globe size={11} style={{ color: "var(--or)" }} />
                <span>Espace de travail · LinkedIn Optimizer</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--texte)" }}>Audit LinkedIn Candidat</h1>
              <p className="text-sm mt-1.5 max-w-2xl" style={{ color: "var(--texte-secondaire)" }}>
                Auditez le profil LinkedIn de votre candidat, détectez les axes d&apos;amélioration, générez un headline et un résumé optimisés, et comparez avec des offres cibles.
              </p>
            </div>
            {status && (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: "var(--texte)" }}>{status.fullName}</p>
                  <p className="text-[11px]" style={{ color: "var(--texte-secondaire)" }}>{status.title}</p>
                  {status.linkedin && (
                    <a href={status.linkedin} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-1 text-[10px] font-mono px-2.5 py-1 rounded-full border transition-colors"
                      style={{ borderColor: "var(--or)", color: "var(--or)", textDecoration: "none" }}>
                      <Globe size={9} />Voir profil
                    </a>
                  )}
                </div>
                <ScoreRing score={score} size={68} />
              </div>
            )}
          </div>

          {/* KPI mini-cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            <KpiMini label="Headline" score={analysis?.sections?.find(s => s.name === "Headline")?.score ?? 0} />
            <KpiMini label="Résumé" score={analysis?.sections?.find(s => s.name === "Résumé")?.score ?? 0} />
            <KpiMini label="Expériences" score={analysis?.sections?.find(s => s.name === "Expériences")?.score ?? 0} />
            <KpiMini label="Compétences" score={analysis?.sections?.find(s => s.name === "Compétences")?.score ?? 0} />
            <KpiMini label="Complétude" score={analysis?.sections?.find(s => s.name === "Profil complété")?.score ?? 0} />
          </div>

          {/* Complétude globale + checklist */}
          <div className="p-4 rounded-xl border space-y-3" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest flex-shrink-0" style={{ color: "var(--texte-tertiaire)" }}>
                <ShieldCheck size={12} style={{ color: "var(--or)" }} />
                Complétude profil
              </div>
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--fond-eleve)" }}>
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(sectionsComplete / sectionsTotal) * 100}%`, background: scoreC }} />
              </div>
              <span className="text-xs font-mono font-bold flex-shrink-0" style={{ color: scoreC }}>{sectionsComplete}/{sectionsTotal} sections OK</span>
            </div>

            {pc && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <CheckItem icon={<Image size={11} />} label="Photo" ok={pc.hasPhoto} />
                <CheckItem icon={<Image size={11} />} label="Banner" ok={pc.hasBanner} />
                <CheckItem icon={<Link2 size={11} />} label="URL perso" ok={pc.hasCustomUrl} />
                <CheckItem icon={<ThumbsUp size={11} />} label="Recommandations" ok={pc.hasRecommendations} />
                <CheckItem icon={<MapPin2 size={11} />} label="Localisation" ok={pc.hasLocation} />
                <CheckItem icon={<FileText size={11} />} label="Formation" ok={pc.hasEducation} />
                <CheckItem icon={<AwardIcon size={11} />} label="Certifications" ok={pc.hasCertifications} />
                <CheckItem icon={<Globe size={11} />} label="Langues" ok={pc.hasLanguages} />
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl border text-sm flex items-center gap-2"
            style={{ background: "rgba(220,38,38,0.08)", borderColor: "rgba(220,38,38,0.3)", color: "#fca5a5" }}>
            <AlertTriangle size={14} />{error}
          </div>
        )}

        {/* ── Quick wins ── */}
        {quickWins.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: scoreC }} />
              <h2 className="text-sm font-bold" style={{ color: "var(--texte)" }}>Quick wins — actions à fort impact</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: getScoreBg(score, 0.15), color: scoreC }}>
                {quickWins.length}
              </span>
            </div>
            <div className="space-y-2">
              {quickWins.map((s) => (
                <SuggestionCard key={s.id} suggestion={s} onCopy={handleCopy} />
              ))}
            </div>
          </div>
        )}

        {/* ── Génération headline + résumé ── */}
        {(analysis?.optimizedHeadline || analysis?.optimizedSummary) && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Wand2 size={14} style={{ color: "var(--or)" }} />
              <h2 className="text-sm font-bold" style={{ color: "var(--texte)" }}>Contenu généré par PRSTO</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: "var(--or-faible)", color: "var(--or)" }}>
                Prêt à copier
              </span>
            </div>

            {/* Headline générée */}
            {analysis.optimizedHeadline && (
              <div className="p-4 rounded-xl border space-y-2" style={{ background: "var(--fond-surface)", borderColor: "rgba(34,197,94,0.25)" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span style={{ color: "#22c55e" }}><FileText size={13} /></span>
                    <span className="text-xs font-semibold" style={{ color: "var(--texte)" }}>Headline optimisée</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>
                      220 car. max
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setShowHeadline(!showHeadline)} title="Afficher/masquer la headline"
                      className="p-1.5 rounded border transition-colors" style={{ borderColor: "var(--bordure)", color: "var(--texte-tertiaire)" }}>
                      {showHeadline ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                    <button onClick={() => handleCopy(analysis.optimizedHeadline!)} title="Copier la headline"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[10px] font-mono border transition-colors"
                      style={{ borderColor: "#22c55e", color: "#22c55e" }}>
                      <Copy size={10} />Copier
                    </button>
                  </div>
                </div>
                {showHeadline && (
                  <p className="text-sm leading-relaxed p-3 rounded-lg font-medium"
                    style={{ background: "var(--fond)", color: "var(--texte)", border: "1px solid var(--bordure-douce)" }}>
                    {analysis.optimizedHeadline}
                  </p>
                )}
              </div>
            )}

            {/* Résumé généré */}
            {analysis.optimizedSummary && (
              <div className="p-4 rounded-xl border space-y-2" style={{ background: "var(--fond-surface)", borderColor: "rgba(139,92,246,0.25)" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span style={{ color: "#8b5cf6" }}><User size={13} /></span>
                    <span className="text-xs font-semibold" style={{ color: "var(--texte)" }}>Résumé optimisé</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(139,92,246,0.1)", color: "#8b5cf6" }}>
                      2600 car. max
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setShowSummary(!showSummary)} title="Afficher/masquer le résumé"
                      className="p-1.5 rounded border transition-colors" style={{ borderColor: "var(--bordure)", color: "var(--texte-tertiaire)" }}>
                      {showSummary ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                    <button onClick={() => handleCopy(analysis.optimizedSummary!)} title="Copier le résumé"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[10px] font-mono border transition-colors"
                      style={{ borderColor: "#8b5cf6", color: "#8b5cf6" }}>
                      <Copy size={10} />Copier
                    </button>
                  </div>
                </div>
                {showSummary && (
                  <div className="text-xs leading-relaxed p-3 rounded-lg max-h-[40vh] overflow-auto"
                    style={{ background: "var(--fond)", color: "var(--texte)", border: "1px solid var(--bordure-douce)", whiteSpace: "pre-wrap" }}>
                    {analysis.optimizedSummary}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Matching mots-clés avec offres ── */}
        <div className="p-4 rounded-xl border space-y-3" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
          <div className="flex items-center gap-2">
            <Search size={14} style={{ color: "var(--or)" }} />
            <h2 className="text-sm font-bold" style={{ color: "var(--texte)" }}>Matching avec une offre d&apos;emploi</h2>
          </div>
          <p className="text-xs" style={{ color: "var(--texte-secondaire)" }}>
            Collez le texte d&apos;une offre pour voir quels mots-clés sont présents ou absents du profil candidat.
          </p>
          <textarea value={jobText} onChange={e => setJobText(e.target.value)}
            placeholder="Colle ici le texte de l'offre d'emploi (LinkedIn, Indeed, APEC...)"
            rows={4} className="w-full p-3 rounded-lg border text-xs resize-y"
            style={{ background: "var(--fond)", borderColor: "var(--bordure)", color: "var(--texte)" }} />
          <button onClick={handleMatchKeywords} disabled={matchingKeywords || !jobText.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-colors"
            style={{ background: "var(--or)", color: "#000", opacity: matchingKeywords || !jobText.trim() ? 0.5 : 1 }}>
            {matchingKeywords ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
            {matchingKeywords ? "Analyse en cours..." : "Analyser le matching"}
          </button>

          {keywordMatch && (
            <div className="space-y-3 pt-3 border-t" style={{ borderColor: "var(--bordure-douce)" }}>
              {/* Coverage */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--texte-tertiaire)" }}>Taux de couverture</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--fond-eleve)" }}>
                  <div className="h-full rounded-full" style={{ width: `${keywordMatch.coveragePercent}%`, background: getScoreColor(keywordMatch.coveragePercent) }} />
                </div>
                <span className="text-xs font-mono font-bold" style={{ color: getScoreColor(keywordMatch.coveragePercent) }}>{keywordMatch.coveragePercent}%</span>
              </div>

              {/* Matched */}
              {keywordMatch.matched.length > 0 && (
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider mb-1.5" style={{ color: "#22c55e" }}>✓ Présents dans le profil candidat ({keywordMatch.matched.length})</div>
                  <div className="flex flex-wrap gap-1">
                    {keywordMatch.matched.map((k, i) => (
                      <span key={i} className="px-2 py-0.5 rounded text-[10px] font-mono border"
                        style={{ background: "rgba(34,197,94,0.06)", borderColor: "rgba(34,197,94,0.15)", color: "#22c55e" }}>{k}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing */}
              {keywordMatch.missing.length > 0 && (
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider mb-1.5" style={{ color: "var(--erreur)" }}>✗ Absents du profil candidat ({keywordMatch.missing.length})</div>
                  <div className="flex flex-wrap gap-1">
                    {keywordMatch.missing.map((k, i) => (
                      <span key={i} className="px-2 py-0.5 rounded text-[10px] font-mono border"
                        style={{ background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.15)", color: "var(--erreur)" }}>{k}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions d'ajout */}
              {keywordMatch.suggestions.length > 0 && (
                <div className="p-2.5 rounded-lg" style={{ background: "var(--or-faible)", border: "1px solid var(--bordure-douce)" }}>
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--or)" }}>
                    <Sparkles size={9} className="inline mr-1" />Suggestions
                  </div>
                  {keywordMatch.suggestions.map((s, i) => (
                    <p key={i} className="text-xs" style={{ color: "var(--texte-secondaire)" }}>{s}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Sections détaillées ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap size={14} style={{ color: "var(--or)" }} />
            <h2 className="text-sm font-bold" style={{ color: "var(--texte)" }}>Analyse détaillée par section</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(analysis?.sections ?? []).map((s) => {
              const sColor = getScoreColor(s.score);
              const statusColor = s.status === "good" ? "#22c55e" : s.status === "needs-work" ? "var(--or)" : "var(--erreur)";
              return (
                <div key={s.name} className="p-4 rounded-xl border space-y-2.5"
                  style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span style={{ color: "var(--or)" }}>{SECTION_ICONS[s.name] || <Target size={12} />}</span>
                      <span className="text-xs font-semibold truncate" style={{ color: "var(--texte)" }}>{s.name}</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full"
                      style={{ background: `${statusColor}15`, color: statusColor }}>
                      {s.status === "good" ? "OK" : s.status === "needs-work" ? "À revoir" : "Manquant"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xl font-bold" style={{ color: sColor, minWidth: 42 }}>{s.score}%</div>
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--fond-eleve)" }}>
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${s.score}%`, background: sColor }} />
                    </div>
                  </div>
                  <p className="text-[11px] leading-relaxed" style={{ color: "var(--texte-secondaire)" }}>{s.details}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Strengths ── */}
        {(analysis?.strengths?.length ?? 0) > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} style={{ color: "#22c55e" }} />
              <h2 className="text-sm font-bold" style={{ color: "var(--texte)" }}>Points forts</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>
                {analysis!.strengths.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {analysis!.strengths.map((s, i) => (
                <span key={i} className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border"
                  style={{ background: "rgba(34,197,94,0.06)", borderColor: "rgba(34,197,94,0.15)", color: "#22c55e" }}>
                  <CheckCircle2 size={11} />{s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Autres suggestions ── */}
        {remaining.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb size={14} style={{ color: "var(--or)" }} />
              <h2 className="text-sm font-bold" style={{ color: "var(--texte)" }}>Autres suggestions</h2>
            </div>
            <div className="space-y-2">
              {[...remaining].sort((a, b) => (PRIORITY_SCORE[a.priority] ?? 99) - (PRIORITY_SCORE[b.priority] ?? 99)).map((s) => (
                <SuggestionCard key={s.id} suggestion={s} onCopy={handleCopy} />
              ))}
            </div>
          </div>
        )}

        {/* ── Re-scan ── */}
        <button onClick={handleAnalyze} disabled={generating}
          className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
          style={{ background: "var(--or)", color: "#000" }}
          title="Relancer l'analyse complète du profil LinkedIn du candidat">
          {generating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          {generating ? "Scan en cours..." : "Re-scanner le profil candidat"}
        </button>
      </div>
    </div>
  );
}

/* ── Composants ── */

function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const safe = Math.max(0, Math.min(100, score));
  const r = (size - 5) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (safe / 100) * c;
  const color = getScoreColor(safe);
  return (
    <div className="flex flex-col items-center" title={`Score LinkedIn : ${safe}%`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--fond-eleve)" strokeWidth="4" />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 0.8s" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold leading-none" style={{ color }}>{safe}</span>
          <span className="text-[8px] font-mono" style={{ color: "var(--texte-tertiaire)" }}>/ 100</span>
        </div>
      </div>
    </div>
  );
}

function KpiMini({ label, score }: { label: string; score: number }) {
  const color = getScoreColor(score);
  const statusText = score >= 60 ? "OK" : score >= 30 ? "..." : "À faire";
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg border" title={`${label} : ${score}%`}
      style={{ background: "var(--fond-surface)", borderColor: score >= 60 ? "rgba(34,197,94,0.2)" : "var(--bordure-douce)" }}>
      <div className="flex-shrink-0" style={{ color }}>
        {score >= 60 ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[9px] font-mono uppercase tracking-wider truncate" style={{ color: "var(--texte-tertiaire)" }}>{label}</div>
        <div className="text-[11px] font-bold" style={{ color }}>{score}% <span className="font-normal text-[9px]" style={{ color: "var(--texte-tertiaire)" }}>{statusText}</span></div>
      </div>
    </div>
  );
}

function CheckItem({ icon, label, ok }: { icon: React.ReactNode; label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-1.5 text-xs" style={{ color: ok ? "#22c55e" : "var(--texte-tertiaire)" }}>
      {ok ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
      <span style={{ color: "var(--texte-secondary)" }}>{icon}</span>
      <span style={{ color: ok ? "var(--texte)" : "var(--texte-tertiaire)" }}>{label}</span>
    </div>
  );
}

function MapPin2({ size }: { size?: number }) {
  return <svg width={size || 14} height={size || 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3"/></svg>;
}

function AwardIcon({ size }: { size?: number }) {
  return <svg width={size || 14} height={size || 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>;
}

function SuggestionCard({ suggestion, onCopy }: {
  suggestion: LinkedInAnalysis["suggestions"][0];
  onCopy: (text: string) => void;
}) {
  const prio = PRIORITY_LABELS[suggestion.priority] ?? PRIORITY_LABELS.medium;
  const isCritical = suggestion.priority === "critical";
  const isHigh = suggestion.priority === "high";
  const accent = isCritical ? "var(--erreur)" : isHigh ? "var(--or)" : "var(--texte-tertiaire)";
  const bgAccent = isCritical ? "rgba(197,75,60,0.05)" : isHigh ? "var(--or-faible)" : "var(--fond-eleve)";
  const borderAccent = isCritical ? "rgba(197,75,60,0.2)" : isHigh ? "rgba(228,177,24,0.15)" : "var(--bordure)";

  return (
    <div className="p-4 rounded-xl border space-y-2.5"
      style={{ background: "var(--fond-surface)", borderColor: borderAccent }}>
      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded-lg flex-shrink-0" style={{ background: bgAccent, color: accent, border: `1px solid ${borderAccent}` }}>
          {prio.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" title="Section concernée"
              style={{ background: "var(--fond-eleve)", color: "var(--texte-tertiaire)" }}>
              {suggestion.section}
            </span>
            <span className="text-[10px] font-mono font-semibold" style={{ color: accent }}>{prio.label}</span>
          </div>
          <h4 className="text-sm font-semibold leading-snug" style={{ color: "var(--texte)" }}>{suggestion.title}</h4>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--texte-secondaire)" }}>{suggestion.description}</p>
        </div>
      </div>

      <div className="p-3 rounded-lg border space-y-2" style={{ background: "var(--fond)", borderColor: "var(--bordure-douce)" }}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider" style={{ color: "var(--or)" }}>
            <Sparkles size={10} className="inline mr-1" />Action recommandée
          </span>
          <button onClick={() => onCopy(suggestion.suggestedAction)} title="Copier cette suggestion"
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono border transition-colors"
            style={{ borderColor: "var(--bordure)", color: "var(--texte-tertiaire)" }}>
            <Copy size={10} />Copier
          </button>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: "var(--texte)" }}>{suggestion.suggestedAction}</p>
      </div>
    </div>
  );
}
