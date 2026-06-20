"use client";

import { useState } from "react";
import { ClipboardPaste, CheckCircle2, AlertTriangle, Lightbulb, Zap, BarChart3, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { evaluateDocumentQuality, type QualityCriterion, type QualityScore } from "@/lib/quality-check/engine";
import { qualityCheckWithIA } from "@/lib/actions/document";
import AIAssistant from "@/components/ai-assistant";
import type { SuggestionItem } from "@/lib/ai/suggestions";

const CRITERION_LABELS: Record<QualityCriterion, string> = {
  clarity: "Clarté",
  credibility: "Crédibilité",
  personalization: "Personnalisation",
  proof: "Preuves chiffrées",
  humanTone: "Ton humain",
  atsKeywords: "Mots-clés ATS",
  noInventedGaps: "Absence d'inventions",
  noGenericPhrases: "Phrases spécifiques",
  executiveLevel: "Niveau exécutif",
  appropriateLength: "Longueur adaptée",
};

function scoreColor(s: number): string {
  if (s >= 70) return "var(--succes)";
  if (s >= 50) return "var(--or)";
  if (s >= 30) return "var(--warning)";
  return "var(--erreur)";
}

function scoreBg(s: number): string {
  if (s >= 70) return "rgba(74,222,128,0.12)";
  if (s >= 50) return "rgba(245,158,11,0.12)";
  if (s >= 30) return "rgba(239,68,68,0.10)";
  return "rgba(239,68,68,0.06)";
}

function scoreLabel(s: number): string {
  if (s >= 85) return "Excellent";
  if (s >= 70) return "Bon";
  if (s >= 50) return "Moyen";
  if (s >= 30) return "À améliorer";
  return "Insuffisant";
}

export default function QualityCheckPage() {
  const [text, setText] = useState("");
  const [offerTitle, setOfferTitle] = useState("");
  const [offerCompany, setOfferCompany] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [candidateTitle, setCandidateTitle] = useState("");
  const [result, setResult] = useState<QualityScore | null>(null);
  const [showContext, setShowContext] = useState(false);
  const [iaResult, setIaResult] = useState<{
    localScore: number; iaScore: number;
    iaAxes: Array<{ nom: string; note: number; pointFort: string; suggestion: string }>;
    iaForces: string[]; iaAmeliorations: string[]; iaVerdict: string;
    divergences: string[];
  } | null>(null);
  const [runningIA, setRunningIA] = useState(false);

  const handleAnalyze = () => {
    if (text.trim().length < 30) return;
    const r = evaluateDocumentQuality({
      text: text.trim(),
      offerTitle: offerTitle.trim() || undefined,
      offerCompany: offerCompany.trim() || undefined,
      candidateName: candidateName.trim() || undefined,
      candidateTitle: candidateTitle.trim() || undefined,
    });
    setResult(r);
  };

  const handleIAAnalysis = async () => {
    if (text.trim().length < 30) return;
    setRunningIA(true);
    try {
      const r = await qualityCheckWithIA({
        documentContent: text.trim(),
        offerTitle: offerTitle.trim() || undefined,
      });
      if (r.success) {
        setIaResult(r);
      } else {
        setIaResult({ localScore: 0, iaScore: 0, iaAxes: [], iaForces: [], iaAmeliorations: [], iaVerdict: "Erreur", divergences: [r.error || "Échec"] });
      }
    } catch {
      setIaResult({ localScore: 0, iaScore: 0, iaAxes: [], iaForces: [], iaAmeliorations: [], iaVerdict: "Erreur", divergences: ["Erreur de connexion IA. L'analyse locale reste disponible."] });
    }
    setRunningIA(false);
  };

  const handlePaste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) setText(clip);
    } catch {
      // clipboard not available
    }
  };

  const handleAISuggestion = (_target: string, item: SuggestionItem) => {
    setText(prev => prev ? prev + "\n" + item.name : item.name);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--texte)" }}>
          Assistant qualité candidature
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--texte-secondaire)" }}>
          Évaluez la qualité d&apos;un document (CV, lettre, email, LinkedIn) avant de l&apos;envoyer.
          Collez le texte et obtenez un score sur 100.
        </p>
      </div>

      {/* Avertissement */}
      <div className="px-3 py-2 rounded-md text-xs font-mono border flex items-center gap-2"
        style={{ background: "var(--fond-eleve)", borderColor: "var(--bordure-douce)", color: "var(--texte-tertiaire)" }}>
        <AlertTriangle size={12} style={{ color: "var(--or)" }} />
        L&apos;évaluation locale est automatique et sans IA. Option DeepSeek Premium disponible pour une seconde opinion.
      </div>

      {/* Input */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <button onClick={handlePaste}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-mono"
            style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)" }}>
            <ClipboardPaste size={13} /> Coller depuis le presse-papier
          </button>
          <button onClick={() => setShowContext(!showContext)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-mono"
            style={{ borderColor: "var(--bordure)", color: showContext ? "var(--or)" : "var(--texte-tertiaire)" }}>
            {showContext ? "Masquer contexte" : "Ajouter contexte"}
          </button>
        </div>

        {showContext && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input type="text" placeholder="Votre nom" value={candidateName}
              onChange={e => setCandidateName(e.target.value)}
              className="input-elton text-xs" />
            <input type="text" placeholder="Votre titre" value={candidateTitle}
              onChange={e => setCandidateTitle(e.target.value)}
              className="input-elton text-xs" />
            <input type="text" placeholder="Poste cible" value={offerTitle}
              onChange={e => setOfferTitle(e.target.value)}
              className="input-elton text-xs" />
            <input type="text" placeholder="Entreprise cible" value={offerCompany}
              onChange={e => setOfferCompany(e.target.value)}
              className="input-elton text-xs" />
          </div>
        )}

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Collez ici le texte de votre document (CV, lettre de motivation, email, message LinkedIn)..."
          className="w-full rounded-md border p-4 text-xs font-mono resize-y"
          style={{
            minHeight: 200,
            background: "var(--fond-surface)",
            borderColor: "var(--bordure)",
            color: "var(--texte)",
          }}
        />

        <div className="flex flex-wrap gap-2">
          <button onClick={handleAnalyze}
            disabled={text.trim().length < 30}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-mono transition-opacity"
            style={{
              background: text.trim().length >= 30 ? "var(--or)" : "var(--bordure)",
              color: text.trim().length >= 30 ? "var(--fond)" : "var(--texte-tertiaire)",
              cursor: text.trim().length >= 30 ? "pointer" : "not-allowed",
              opacity: text.trim().length >= 30 ? 1 : 0.5,
            }}>
            <Zap size={14} /> Analyse locale
          </button>

          <button onClick={handleIAAnalysis}
            disabled={text.trim().length < 30 || runningIA}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-mono transition-opacity border"
            style={{
              borderColor: text.trim().length >= 30 ? "var(--info)" : "var(--bordure)",
              color: text.trim().length >= 30 ? "var(--info)" : "var(--texte-tertiaire)",
              background: "transparent",
              cursor: text.trim().length >= 30 ? "pointer" : "not-allowed",
              opacity: text.trim().length >= 30 ? 1 : 0.5,
            }}>
            {runningIA ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            DeepSeek Premium
          </button>
        </div>
      </div>

      {/* Résultats */}
      {result && (
        <div className="space-y-5">
          {/* Score global */}
          <div className="flex items-center gap-4 p-4 rounded-lg border"
            style={{ borderColor: scoreColor(result.overall), background: scoreBg(result.overall) }}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center border-2 flex-shrink-0"
              style={{ borderColor: scoreColor(result.overall), background: "var(--fond)" }}>
              <div className="text-center">
                <div className="text-xl font-bold" style={{ color: scoreColor(result.overall) }}>{result.overall}</div>
                <div className="text-[9px] font-mono" style={{ color: "var(--texte-tertiaire)" }}>/100</div>
              </div>
            </div>
            <div>
              <p className="text-lg font-bold" style={{ color: scoreColor(result.overall) }}>
                {scoreLabel(result.overall)}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--texte-secondaire)" }}>
                {result.overall >= 70
                  ? "Document prêt à l'envoi. Relisez une dernière fois."
                  : result.overall >= 50
                  ? "Document utilisable mais améliorable. Suivez les recommandations."
                  : "Document à retravailler avant envoi."}
              </p>
            </div>
          </div>

          {/* Grille des critères */}
          <div>
            <h3 className="text-sm font-bold mb-2 flex items-center gap-2" style={{ color: "var(--texte)" }}>
              <BarChart3 size={14} style={{ color: "var(--or)" }} /> Détail par critère
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {(Object.keys(result.breakdown) as QualityCriterion[]).map((crit) => {
                const s = result.breakdown[crit];
                return (
                  <div key={crit} className="p-2.5 rounded-md border text-center"
                    style={{ borderColor: s >= 7 ? "rgba(74,222,128,0.3)" : s >= 5 ? "rgba(245,158,11,0.3)" : "rgba(239,68,68,0.2)", background: "var(--fond-surface)" }}>
                    <div className="text-lg font-bold" style={{ color: scoreColor(s * 10) }}>{s}</div>
                    <div className="text-[10px] font-mono leading-tight mt-0.5" style={{ color: "var(--texte-tertiaire)" }}>
                      {CRITERION_LABELS[crit]}
                    </div>
                    <div className="w-full h-1 rounded-full mt-1.5" style={{ background: "var(--fond-eleve)" }}>
                      <div className="h-1 rounded-full transition-all" style={{
                        width: `${s * 10}%`,
                        background: s >= 7 ? "var(--succes)" : s >= 5 ? "var(--or)" : "var(--erreur)",
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Points forts */}
          {result.strengths.length > 0 && (
            <div>
              <h3 className="text-sm font-bold mb-2 flex items-center gap-2" style={{ color: "var(--succes)" }}>
                <CheckCircle2 size={14} /> Points forts
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                {result.strengths.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded text-xs"
                    style={{ background: "rgba(74,222,128,0.08)", color: "var(--texte-secondaire)" }}>
                    <CheckCircle2 size={11} style={{ color: "var(--succes)" }} /> {s}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Points à améliorer */}
          {result.improvements.length > 0 && (
            <div>
              <h3 className="text-sm font-bold mb-2 flex items-center gap-2" style={{ color: "var(--warning)" }}>
                <AlertTriangle size={14} /> Points à améliorer
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                {result.improvements.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded text-xs"
                    style={{ background: "rgba(245,158,11,0.08)", color: "var(--texte-secondaire)" }}>
                    <AlertTriangle size={11} style={{ color: "var(--warning)" }} /> {s}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Phrases génériques */}
          {result.genericPhrases.length > 0 && (
            <div>
              <h3 className="text-sm font-bold mb-2 flex items-center gap-2" style={{ color: "var(--or)" }}>
                <Zap size={14} /> Phrases trop génériques ({result.genericPhrases.length})
              </h3>
              <div className="space-y-1.5">
                {result.genericPhrases.map((p, i) => (
                  <div key={i} className="flex items-start gap-3 p-2.5 rounded border text-xs"
                    style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
                    <div className="flex-1">
                      <p className="font-mono line-through" style={{ color: "var(--texte-tertiaire)" }}>{p.text}</p>
                      <p className="mt-0.5 flex items-center gap-1" style={{ color: "var(--or)" }}>
                        <ArrowRight size={10} /> {p.suggestion}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Phrases risquées */}
          {result.riskyPhrases.length > 0 && (
            <div>
              <h3 className="text-sm font-bold mb-2 flex items-center gap-2" style={{ color: "var(--erreur)" }}>
                <AlertTriangle size={14} /> Phrases risquées ({result.riskyPhrases.length})
              </h3>
              <div className="space-y-1.5">
                {result.riskyPhrases.map((p, i) => (
                  <div key={i} className="flex items-start gap-3 p-2.5 rounded border text-xs"
                    style={{ borderColor: "rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.04)" }}>
                    <div className="flex-1">
                      <p className="font-mono" style={{ color: "var(--erreur)" }}>{p.text}</p>
                      <p className="mt-0.5" style={{ color: "var(--texte-tertiaire)" }}>{p.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommandations */}
          {result.rewriteRecommendations.length > 0 && (
            <div>
              <h3 className="text-sm font-bold mb-2 flex items-center gap-2" style={{ color: "var(--info)" }}>
                <Lightbulb size={14} /> Recommandations de réécriture
              </h3>
              <div className="space-y-1.5">
                {result.rewriteRecommendations.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 px-3 py-2 rounded border text-xs"
                    style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
                    <span className="font-mono flex-shrink-0" style={{ color: "var(--or)" }}>{i + 1}.</span>
                    <span style={{ color: "var(--texte-secondaire)" }}>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* IA Results */}
      {iaResult && (
        <div className="space-y-4 p-4 rounded-lg border"
          style={{ borderColor: "rgba(99,102,241,0.3)", background: "var(--fond-surface)" }}>
          <div className="flex items-center gap-2">
            <Sparkles size={14} style={{ color: "var(--info)" }} />
            <h3 className="text-sm font-bold" style={{ color: "var(--texte)" }}>Analyse DeepSeek Premium</h3>
          </div>

          {/* Score comparison */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-md text-center" style={{ background: "var(--fond)" }}>
              <div className="text-[10px] font-mono uppercase mb-1" style={{ color: "var(--texte-tertiaire)" }}>Score local</div>
              <div className="text-2xl font-bold" style={{ color: scoreColor(iaResult.localScore) }}>{iaResult.localScore}</div>
              <div className="text-[9px] font-mono" style={{ color: "var(--texte-tertiaire)" }}>/100</div>
            </div>
            <div className="p-3 rounded-md text-center" style={{ background: "var(--fond)" }}>
              <div className="text-[10px] font-mono uppercase mb-1" style={{ color: "var(--info)" }}>Score IA</div>
              <div className="text-2xl font-bold" style={{ color: scoreColor(iaResult.iaScore) }}>{iaResult.iaScore}</div>
              <div className="text-[9px] font-mono" style={{ color: "var(--texte-tertiaire)" }}>/100</div>
            </div>
          </div>

          {/* Verdict */}
          <div className="p-2 rounded text-center text-xs font-mono"
            style={{ background: "rgba(99,102,241,0.08)", color: "var(--info)" }}>
            Verdict IA : {iaResult.iaVerdict.replace(/_/g, " ")}
          </div>

          {/* IA Axes detail */}
          {iaResult.iaAxes.length > 0 && (
            <div>
              <h4 className="text-xs font-bold mb-2" style={{ color: "var(--texte)" }}>Détail par axe (IA)</h4>
              <div className="space-y-1.5">
                {iaResult.iaAxes.map((axe, i) => (
                  <div key={i} className="p-2 rounded border text-xs"
                    style={{ borderColor: "var(--bordure-douce)", background: "var(--fond)" }}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-mono" style={{ color: "var(--texte)" }}>{axe.nom}</span>
                      <span className="font-bold" style={{ color: scoreColor(axe.note * 5) }}>{axe.note}/20</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px]" style={{ color: "var(--texte-tertiaire)" }}>
                      <div>
                        <CheckCircle2 size={9} className="inline" style={{ color: "var(--succes)" }} /> {axe.pointFort}
                      </div>
                      <div>
                        <ArrowRight size={9} className="inline" style={{ color: "var(--or)" }} /> {axe.suggestion}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* IA Strengths & Improvements */}
          {iaResult.iaForces.length > 0 && (
            <div>
              <h4 className="text-xs font-bold mb-1" style={{ color: "var(--succes)" }}>Forces (IA)</h4>
              {iaResult.iaForces.map((f, i) => (
                <div key={i} className="text-xs flex items-center gap-1" style={{ color: "var(--texte-secondaire)" }}>
                  <CheckCircle2 size={10} style={{ color: "var(--succes)" }} /> {f}
                </div>
              ))}
            </div>
          )}
          {iaResult.iaAmeliorations.length > 0 && (
            <div>
              <h4 className="text-xs font-bold mb-1" style={{ color: "var(--warning)" }}>Améliorations (IA)</h4>
              {iaResult.iaAmeliorations.map((a, i) => (
                <div key={i} className="text-xs flex items-center gap-1" style={{ color: "var(--texte-secondaire)" }}>
                  <AlertTriangle size={10} style={{ color: "var(--warning)" }} /> {a}
                </div>
              ))}
            </div>
          )}

          {/* Divergences */}
          {iaResult.divergences.length > 0 && (
            <div className="p-3 rounded-md border"
              style={{ borderColor: "rgba(234,179,8,0.3)", background: "rgba(234,179,8,0.05)" }}>
              <h4 className="text-xs font-bold mb-1 flex items-center gap-1" style={{ color: "var(--avertissement)" }}>
                <AlertTriangle size={11} /> Divergences local vs IA
              </h4>
              {iaResult.divergences.map((d, i) => (
                <p key={i} className="text-[10px] font-mono" style={{ color: "var(--avertissement)" }}>{d}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* État vide */}
      {!result && (
        <div className="p-8 rounded-lg border border-dashed text-center"
          style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
          <Zap size={28} style={{ color: "var(--texte-tertiaire)", margin: "0 auto" }} />
          <p className="text-sm mt-3" style={{ color: "var(--texte-secondaire)" }}>
            Collez un document et cliquez « Analyser la qualité »
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--texte-tertiaire)" }}>
            10 critères évalués : clarté, crédibilité, personnalisation, preuves, ton,
            mots-clés ATS, niveau exécutif, longueur, absence d&apos;inventions et de phrases génériques.
          </p>
        </div>
      )}
      <AIAssistant onApply={handleAISuggestion} />
    </div>
  );
}
