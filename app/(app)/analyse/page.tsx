"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Zap, Target, AlertTriangle, CheckCircle2, XCircle,
  Search, Shield, Eye, Trash2,
  Loader2, ChevronDown, Star,
  Brain, Cpu, Sparkles, Info,
} from "lucide-react";
import { getOpportunities } from "@/lib/actions/opportunity";
import { getAnalyses, analyzeJobOffer, deleteAnalysis, getAnalysisStats } from "@/lib/actions/analysis";
import AIAssistant from "@/components/ai-assistant";
import type { SuggestionItem } from "@/lib/ai/suggestions";

interface AnalysisItem {
  id: string; opportunityId: string; scoreGlobal: number | null;
  keywordsAts: string; exigences: string; risks: string; gaps: string; pointsForts: string;
  matchDetails: string; rawResponse: string | null; aiModel: string | null; analysedAt: string;
  opportunity: { id: string; title: string; company: string; country: string | null; status: string };
}
interface OppItem { id: string; title: string; company: string; country: string | null; rawText: string; status: string; }
interface AnalysisStats { analysed: number; averageScore: number; highOpportunities: number; avoidOpportunities: number; toAnalyze: number; }
interface StrongestProof { category: string; proof: string; }
interface MatchDetails { businessFitScore?: number; salesLeadershipScore?: number; executiveSeniorityScore?: number; internationalFitScore?: number; languageFitScore?: number; sectorFitScore?: number; locationFitScore?: number; atsScore?: number; networkStrategyScore?: number; riskScore?: number; compensationFitScore?: number; strongestProofs?: StrongestProof[]; confirmedCount?: number; partialCount?: number; gapCount?: number; }

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: "var(--succes)",
  MEDIUM: "var(--or)",
  LOW: "var(--info)",
  AVOID: "var(--erreur)",
};

export default function AnalysePage() {
  const router = useRouter();
  const [analyses, setAnalyses] = useState<AnalysisItem[]>([]);
  const [opportunities, setOpportunities] = useState<OppItem[]>([]);
  const [stats, setStats] = useState<AnalysisStats>({ analysed: 0, averageScore: 0, highOpportunities: 0, avoidOpportunities: 0, toAnalyze: 0 });
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [useAI, setUseAI] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedOpp, setSelectedOpp] = useState("");

  const notify = (type: "ok" | "err", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const [a, opps, s] = await Promise.all([
      getAnalyses(),
      getOpportunities({ status: "nouveau" }),
      getAnalysisStats(),
    ]);
    setAnalyses(a as unknown as AnalysisItem[]);
    setOpportunities(opps as unknown as OppItem[]);
    setStats(s as unknown as AnalysisStats);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAnalyze = async (opportunityId: string) => {
    setAnalyzing(opportunityId);
    const result = await analyzeJobOffer(opportunityId, useAI);
    setAnalyzing(null);
    if (result.success) {
      notify("ok", `Analyse terminée — Score: ${result.analysis?.score.globalScore}/100 (${result.mode})`);
      await load();
    } else {
      notify("err", result.error || "Erreur");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette analyse ?")) return;
    await deleteAnalysis(id);
    await load();
    notify("ok", "Analyse supprimée");
  };

  const scoreColor = (score: number) => {
    if (score >= 75) return "var(--succes)";
    if (score >= 50) return "var(--or)";
    if (score >= 30) return "var(--avertissement)";
    return "var(--erreur)";
  };

  const scoreLabel = (score: number) => {
    if (score >= 75) return "Excellent";
    if (score >= 50) return "Bon";
    if (score >= 30) return "Moyen";
    return "Faible";
  };

  // Parse JSON array safely
  const parseArr = (s: string): string[] => {
    try { return JSON.parse(s || "[]"); } catch { return []; }
  };

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--or)" }} />
      </div>
    );
  }

  const handleAISuggestion = (_target: string, _item: SuggestionItem) => {
    alert(`Suggestion : ${_item.name} — ${_item.reason}`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--texte)" }}>Analyse</h1>
          <p className="text-xs mt-1 font-mono" style={{ color: "var(--texte-tertiaire)" }}>
            {stats.analysed} offre{stats.analysed !== 1 ? "s" : ""} analysée{stats.analysed !== 1 ? "s" : ""}
            {stats.averageScore > 0 && ` · Score moyen: ${stats.averageScore}/100`}
          </p>
        </div>
      </div>

      {msg && (
        <div className="px-4 py-2 rounded-md text-sm font-mono border"
          style={{ background: msg.type === "ok" ? "rgba(74,222,128,0.1)" : "rgba(239,68,68,0.1)", color: msg.type === "ok" ? "var(--succes)" : "var(--erreur)", borderColor: msg.type === "ok" ? "rgba(74,222,128,0.3)" : "rgba(239,68,68,0.3)" }}>
          {msg.text}
        </div>
      )}

      {/* Stats rapides */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatMini icon={Zap} label="Analysées" value={stats.analysed} color="var(--or)" />
        <StatMini icon={Target} label="Score moyen" value={`${stats.averageScore}/100`} color={scoreColor(stats.averageScore)} />
        <StatMini icon={Star} label="Score ≥ 70" value={stats.highOpportunities} color="var(--succes)" />
        <StatMini icon={AlertTriangle} label="À éviter" value={stats.avoidOpportunities} color="var(--erreur)" />
        <StatMini icon={Search} label="À analyser" value={stats.toAnalyze} color="var(--info)" />
      </div>

      {/* Analyse rapide d'une nouvelle offre */}
      <div className="p-5 rounded-lg border space-y-4" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
        <div className="flex items-center gap-3">
          <Brain size={16} style={{ color: "var(--or)" }} />
          <h2 className="text-sm font-mono uppercase tracking-wider" style={{ color: "var(--texte-secondaire)" }}>
            Analyser une offre
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select value={selectedOpp} onChange={e => setSelectedOpp(e.target.value)}
            className="input-elton flex-1 text-sm">
            <option value="">Sélectionner une opportunité à analyser...</option>
            {opportunities.map(o => (
              <option key={o.id} value={o.id}>{o.title} — {o.company} ({o.country || "?"})</option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-xs font-mono px-3 py-2 rounded border"
            style={{ borderColor: "var(--bordure)", color: useAI ? "var(--or)" : "var(--texte-tertiaire)", cursor: "pointer" }}>
            <input type="checkbox" checked={useAI} onChange={e => setUseAI(e.target.checked)}
              className="accent-[var(--or)]" />
            <Sparkles size={12} /> IA DeepSeek
          </label>

          <button onClick={() => selectedOpp && handleAnalyze(selectedOpp)}
            disabled={!selectedOpp || analyzing !== null}
            className="flex items-center gap-2 px-5 py-2 text-xs font-mono rounded-md"
            style={{ background: selectedOpp ? "var(--or)" : "var(--bordure-douce)", color: selectedOpp ? "var(--fond)" : "var(--texte-tertiaire)", opacity: analyzing ? 0.6 : 1 }}>
            {analyzing ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            Analyser
          </button>
        </div>

        <p className="text-xs font-mono" style={{ color: "var(--texte-tertiaire)" }}>
          {opportunities.filter(o => o.rawText).length} offre{opportunities.filter(o => o.rawText).length !== 1 ? "s" : ""} disponible{opportunities.filter(o => o.rawText).length !== 1 ? "s" : ""} pour analyse.
          {!useAI && " Mode heuristique local — score explicable, zéro hallucination."}
          {useAI && " Mode IA — l'analyse heuristique sera enrichie par DeepSeek si une clé est configurée."}
        </p>
      </div>

      {/* Liste des analyses */}
      <div className="space-y-3">
        {analyses.length === 0 && (
          <div className="p-12 text-center rounded-lg border" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)", borderStyle: "dashed" }}>
            <Brain size={28} className="mx-auto mb-3 opacity-25" style={{ color: "var(--or)" }} />
            <p className="text-sm font-mono" style={{ color: "var(--texte-tertiaire)" }}>
              Aucune analyse. Sélectionnez une offre ci-dessus et lancez l&apos;analyse.
            </p>
          </div>
        )}

        {analyses.map((analysis: AnalysisItem) => {
          const opp = analysis.opportunity;
          const isExpanded = expandedId === analysis.id;
          const attrs = parseArr(analysis.keywordsAts);
          const exigences = parseArr(analysis.exigences);
          const pointsForts = parseArr(analysis.pointsForts);
          const gaps = parseArr(analysis.gaps);
          const risksArr = parseArr(analysis.risks);
          const details = safeJsonParse<MatchDetails>(analysis.matchDetails, {});

          return (
            <div key={analysis.id} className="rounded-lg border overflow-hidden"
              style={{ background: "var(--fond-surface)", borderColor: isExpanded ? "var(--or)" : "var(--bordure)" }}>
              {/* Header */}
              <div className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : analysis.id)}>
                <div className="flex items-center gap-4 min-w-0">
                  {/* Score ring */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center"
                    style={{ borderColor: scoreColor(analysis.scoreGlobal || 0) }}>
                    <span className="text-sm font-bold" style={{ color: scoreColor(analysis.scoreGlobal || 0) }}>
                      {analysis.scoreGlobal ?? "—"}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium truncate" style={{ color: "var(--texte)" }}>
                        {opp?.title || "Offre inconnue"}
                      </span>
                      <span className="text-xs font-mono" style={{ color: "var(--texte-tertiaire)" }}>
                        {opp?.company}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded"
                        style={{ background: `${PRIORITY_COLORS[scoreToPriority(analysis.scoreGlobal)]}15`, color: PRIORITY_COLORS[scoreToPriority(analysis.scoreGlobal)] }}>
                        {scoreLabel(analysis.scoreGlobal || 0)}
                      </span>
                      {opp?.country && (
                        <span className="text-xs font-mono" style={{ color: "var(--texte-tertiaire)" }}>{opp.country}</span>
                      )}
                      <span className="text-xs font-mono opacity-50" style={{ color: "var(--texte-tertiaire)" }}>
                        {analysis.aiModel?.includes("Heuristic") && !analysis.aiModel?.includes("DeepSeek") ? (
                          <span className="flex items-center gap-1"><Cpu size={10} /> heuristique</span>
                        ) : (
                          <span className="flex items-center gap-1"><Sparkles size={10} /> IA</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={e => { e.stopPropagation(); if (opp) router.push(`/opportunites/${opp.id}`); }}
                    className="p-1.5 rounded" style={{ color: "var(--info)" }} title="Voir l'offre">
                    <Eye size={14} />
                  </button>
                  <button onClick={e => { e.stopPropagation(); handleDelete(analysis.id); }}
                    className="p-1.5 rounded" style={{ color: "var(--erreur)" }} title="Supprimer">
                    <Trash2 size={14} />
                  </button>
                  <ChevronDown size={16} style={{ color: "var(--texte-tertiaire)", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-4 pb-5 space-y-4 border-t" style={{ borderColor: "var(--bordure)" }}>
                  {/* Scores détaillés */}
                  <div className="pt-4">
                    <h4 className="text-xs font-mono uppercase tracking-wider mb-3" style={{ color: "var(--or)" }}>
                      Scores détaillés
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {[
                        ["Business Fit", details.businessFitScore || analysis.scoreGlobal],
                        ["Leadership", details.salesLeadershipScore || analysis.scoreGlobal],
                        ["Séniorité", details.executiveSeniorityScore || analysis.scoreGlobal],
                        ["International", details.internationalFitScore || analysis.scoreGlobal],
                        ["Langues", details.languageFitScore || analysis.scoreGlobal],
                        ["Secteur", details.sectorFitScore || analysis.scoreGlobal],
                        ["Localisation", details.locationFitScore || analysis.scoreGlobal],
                        ["ATS", details.atsScore || analysis.scoreGlobal],
                        ["Réseau/Preuves", details.networkStrategyScore || analysis.scoreGlobal],
                        ["Risques", details.riskScore || analysis.scoreGlobal],
                        ["Compensation", details.compensationFitScore || analysis.scoreGlobal],
                      ].map(([label, val]) => (
                        <div key={label as string} className="p-2 rounded text-center border"
                          style={{ background: "var(--fond)", borderColor: "var(--bordure-douce)" }}>
                          <div className="text-xs font-bold" style={{ color: scoreColor(val as number) }}>{val ?? "—"}</div>
                          <div className="text-xs font-mono mt-0.5" style={{ color: "var(--texte-tertiaire)" }}>{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mots-clés ATS */}
                  {attrs.length > 0 && (
                    <Section title="Mots-clés ATS" icon={<Target size={12} />} color="var(--info)">
                      <div className="flex flex-wrap gap-1.5">
                        {attrs.map((kw: string, i: number) => (
                          <span key={i} className="text-xs font-mono px-2 py-1 rounded"
                            style={{ background: "rgba(59,130,246,0.1)", color: "var(--info)", border: "1px solid rgba(59,130,246,0.2)" }}>
                            {kw}
                          </span>
                        ))}
                      </div>
                    </Section>
                  )}

                  {/* Exigences */}
                  {exigences.length > 0 && (
                    <Section title="Exigences détectées" icon={<Shield size={12} />} color="var(--texte-secondaire)">
                      <ul className="space-y-1">
                        {exigences.map((e: string, i: number) => (
                          <li key={i} className="text-xs" style={{ color: "var(--texte-secondaire)" }}>• {e}</li>
                        ))}
                      </ul>
                    </Section>
                  )}

                  {/* Points forts */}
                  {pointsForts.length > 0 && (
                    <Section title="Points forts" icon={<CheckCircle2 size={12} />} color="var(--succes)">
                      <ul className="space-y-1">
                        {pointsForts.map((p: string, i: number) => (
                          <li key={i} className="text-xs flex items-start gap-2" style={{ color: "var(--succes)" }}>
                            <CheckCircle2 size={10} className="mt-0.5 flex-shrink-0" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </Section>
                  )}

                  {/* Gaps */}
                  {gaps.length > 0 && (
                    <Section title="Compétences à développer" icon={<AlertTriangle size={12} />} color="var(--avertissement)">
                      <ul className="space-y-1">
                        {gaps.map((g: string, i: number) => (
                          <li key={i} className="text-xs flex items-start gap-2" style={{ color: "var(--avertissement)" }}>
                            <AlertTriangle size={10} className="mt-0.5 flex-shrink-0" />
                            {g}
                          </li>
                        ))}
                      </ul>
                    </Section>
                  )}

                  {/* Risques */}
                  {risksArr.length > 0 && (
                    <Section title="Points de vigilance" icon={<XCircle size={12} />} color="var(--erreur)">
                      <ul className="space-y-1">
                        {risksArr.map((r: string, i: number) => (
                          <li key={i} className="text-xs flex items-start gap-2" style={{ color: "var(--erreur)" }}>
                            <XCircle size={10} className="mt-0.5 flex-shrink-0" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </Section>
                  )}

                  {/* Stratégie */}
                  {(details.strongestProofs?.length ?? 0) > 0 && (
                    <Section title="Preuves fortes (Proof Vault)" icon={<Star size={12} />} color="var(--or)">
                      <ul className="space-y-1">
                        {details.strongestProofs?.map((p: StrongestProof, i: number) => (
                          <li key={i} className="text-xs" style={{ color: "var(--or)" }}>
                            • {p.category}: {p.proof}
                          </li>
                        ))}
                      </ul>
                    </Section>
                  )}

                  {/* Matches */}
                  <div className="flex flex-wrap gap-3 text-xs font-mono">
                    <span style={{ color: "var(--succes)" }}>✓ {details.confirmedCount || 0} matches</span>
                    <span style={{ color: "var(--avertissement)" }}>≈ {details.partialCount || 0} partiels</span>
                    <span style={{ color: "var(--erreur)" }}>✗ {details.gapCount || 0} gaps</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono" style={{ color: "var(--texte-tertiaire)" }}>
                    <Info size={10} />
                    Modèle: {analysis.aiModel || "Heuristic"}
                    · {new Date(analysis.analysedAt).toLocaleDateString("fr-FR")}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
        <AIAssistant onApply={handleAISuggestion} />
    </div>
  );
}

function scoreToPriority(score: number | null): string {
  if (!score) return "LOW";
  if (score >= 75) return "HIGH";
  if (score >= 50) return "MEDIUM";
  if (score >= 30) return "LOW";
  return "AVOID";
}

function safeJsonParse<T>(s: string, fallback: T): T {
  try { return JSON.parse(s || "{}") as T; } catch { return fallback; }
}

function StatMini({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>; label: string; value: string | number; color: string;
}) {
  return (
    <div className="p-3 rounded-lg border text-center" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
      <div className="flex justify-center mb-1">
        <Icon size={14} style={{ color }} />
      </div>
      <div className="text-lg font-bold" style={{ color: "var(--texte)" }}>{value}</div>
      <div className="text-xs font-mono mt-0.5" style={{ color: "var(--texte-tertiaire)" }}>{label}</div>
    </div>
  );
}

function Section({ title, icon, color, children }: {
  title: string; icon: React.ReactNode; color: string; children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span style={{ color }}>{icon}</span>
        <span className="text-xs font-mono uppercase" style={{ color }}>{title}</span>
      </div>
      {children}
    </div>
  );
}
