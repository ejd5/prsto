"use client";

import { useState, useEffect } from "react";
import {
  Target, Shield, Lightbulb, Award, TrendingUp, AlertTriangle,
  CheckCircle2, XCircle, Zap, Brain, Loader2, ChevronRight,
  Swords, MessageSquare, Eye, MapPin, Briefcase, DollarSign, Building2,
  Globe, Languages, BarChart3, Sparkles, Download,
} from "lucide-react";
import { getScoreColor } from "@/lib/score-colors";

interface SemScores {
  roleFit?: number; seniorityFit?: number; locationFit?: number;
  sectorFit?: number; languageFit?: number; compensationFit?: number;
  companyFit?: number; applicationReadiness?: number; risk?: number;
}

interface ExecAnalysis {
  type: string;
  generatedAt?: string;
  angleAttaque?: string;
  leviersNegociation?: string[];
  questionsEntretien?: string[];
  piegesEviter?: string[];
  positionnementMarche?: string;
  resumeExecutif?: string;
}

interface Props {
  draftId: string;
  jobTitle: string;
  jobCompany: string | null;
  jobLocation: string | null;
  contractType: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  globalScore: number | null;
  semanticScore: number | null;
  semanticConfidence: number | null;
  semanticAnalysisJson: string | null;
  confirmedMatches: string | null;
  gaps: string | null;
  risks: string | null;
}

// ─── Radar Chart SVG ───────────────────────────

function RadarChart({ scores }: { scores: SemScores }) {
  const dims = [
    { key: "roleFit", label: "Rôle", max: 100 },
    { key: "seniorityFit", label: "Séniorité", max: 100 },
    { key: "locationFit", label: "Localisation", max: 100 },
    { key: "sectorFit", label: "Secteur", max: 100 },
    { key: "languageFit", label: "Langues", max: 100 },
    { key: "compensationFit", label: "Salaire", max: 100 },
    { key: "companyFit", label: "Entreprise", max: 100 },
    { key: "applicationReadiness", label: "Annonce", max: 100 },
    { key: "risk", label: "Risque↓", max: 100 },
  ];

  const cx = 150, cy = 150, r = 110;
  const n = dims.length;

  const points = dims.map((d, i) => {
    const val = (scores[d.key as keyof SemScores] ?? 50) / 100;
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return { x: cx + r * val * Math.cos(angle), y: cy + r * val * Math.sin(angle), val, label: d.label, score: scores[d.key as keyof SemScores] };
  });

  const polygon = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + "Z";

  const levels = [0.25, 0.5, 0.75, 1];
  const gridPolygons = levels.map(lvl => {
    return dims.map((_, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      return `${cx + r * lvl * Math.cos(angle)},${cy + r * lvl * Math.sin(angle)}`;
    }).join(" ");
  });

  return (
    <svg viewBox="0 0 300 300" className="w-full max-w-[280px] mx-auto">
      {/* Grid */}
      {gridPolygons.map((gp, i) => (
        <polygon key={i} points={gp} fill="none" stroke="var(--bordure-douce)" strokeWidth="0.5" />
      ))}
      {/* Axes */}
      {dims.map((_, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        return <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(angle)} y2={cy + r * Math.sin(angle)} stroke="var(--bordure-douce)" strokeWidth="0.5" />;
      })}
      {/* Data polygon */}
      <polygon points={polygon} fill="rgba(59,130,246,0.15)" stroke="#3b82f6" strokeWidth="1.5" />
      {/* Points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#3b82f6" />
      ))}
      {/* Labels */}
      {points.map((p, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const lx = cx + (r + 22) * Math.cos(angle);
        const ly = cy + (r + 22) * Math.sin(angle);
        return (
          <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="central"
            className="text-[8px] font-mono" fill="var(--texte-tertiaire)">
            {p.label}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Barre progression ────────────────────────

function ScoreBar({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const color = getScoreColor(pct);
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-xs font-mono">
        <span style={{ color: "var(--texte-secondaire)" }}>{label}</span>
        <span style={{ color }}>{value}%</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: "var(--fond-eleve)" }}>
        <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// ─── Carte section ────────────────────────────

function SectionCard({ icon, title, color, children }: { icon: React.ReactNode; title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-5 space-y-3" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
      <div className="flex items-center gap-2">
        <span style={{ color }}>{icon}</span>
        <h3 className="text-sm font-bold font-mono" style={{ color }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ─── Composant principal ──────────────────────

export default function ExecutiveAnalysis(props: Props) {
  const [execData, setExecData] = useState<ExecAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Parser le semanticAnalysisJson
  let semScores: SemScores = {};
  let semForces: string[] = [];
  let semRisques: string[] = [];
  let semManques: string[] = [];
  let semExplication = "";
  let semCvAngle = "";
  let semLetterAngle = "";
  let semInterviewAngle = "";

  if (props.semanticAnalysisJson) {
    try {
      const sem = JSON.parse(props.semanticAnalysisJson);
      semScores = sem.scores || {};
      semForces = sem.positiveSignals || [];
      semRisques = sem.riskSignals || [];
      semManques = sem.missingSignals || [];
      semExplication = sem.explanation || "";
      semCvAngle = sem.suggestedCvAngle || "";
      semLetterAngle = sem.suggestedCoverLetterAngle || "";
      semInterviewAngle = sem.interviewPrepAngle || "";
    } catch { /* ignore */ }
  }

  const confirmed = props.confirmedMatches ? (() => { try { return JSON.parse(props.confirmedMatches); } catch { return []; } })() : [];
  const gapList = props.gaps ? (() => { try { return JSON.parse(props.gaps); } catch { return []; } })() : [];
  const riskList = props.risks ? (() => { try { return JSON.parse(props.risks); } catch { return []; } })() : [];

  const score = props.semanticScore ?? props.globalScore ?? 0;
  const confidence = props.semanticConfidence ?? 70;

  const recommendationLabel = (() => {
    const c = getScoreColor(score);
    if (score >= 75) return { text: "Candidature prioritaire", stars: "★★★", color: c };
    if (score >= 55) return { text: "Intéressant", stars: "★★", color: c };
    if (score >= 35) return { text: "À surveiller", stars: "★", color: c };
    return { text: "Déconseillé", stars: "✗", color: c };
  })();

  const loadExecutive = async () => {
    setLoading(true);
    setError("");
    try {
      // Check cache first
      const getRes = await fetch(`/api/application-drafts/${props.draftId}/executive-analysis`);
      const getData = await getRes.json();
      if (getData.cached) { setExecData(getData.cached); setLoading(false); return; }

      // Generate
      const postRes = await fetch(`/api/application-drafts/${props.draftId}/executive-analysis`, { method: "POST" });
      const postData = await postRes.json();
      if (postData.success && postData.analysis) {
        setExecData(postData.analysis);
      } else {
        setError(postData.error || "Erreur inconnue");
      }
    } catch { setError("Erreur de connexion"); }
    setLoading(false);
  };

  useEffect(() => { loadExecutive(); }, []); // eslint-disable-line

  return (
    <div className="space-y-6">
      {/* ─── Section 1 : Score Global ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard icon={<Award size={16} />} title="Score & Adéquation Globale" color="var(--or)">
          <div className="flex items-center gap-6">
            {/* Score ring */}
            <div className="relative flex-shrink-0">
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="var(--fond-eleve)" strokeWidth="8" />
                <circle cx="50" cy="50" r="42" fill="none" stroke={recommendationLabel.color} strokeWidth="8"
                  strokeDasharray={`${score * 2.64} 264`} strokeLinecap="round"
                  transform="rotate(-90 50 50)" style={{ transition: "stroke-dasharray 1s ease" }} />
                <text x="50" y="45" textAnchor="middle" className="text-xl font-bold" fill="var(--texte)">{score}</text>
                <text x="50" y="62" textAnchor="middle" className="text-[9px] font-mono" fill="var(--texte-tertiaire)">/100</text>
              </svg>
            </div>
            <div className="space-y-2">
              <div>
                <span className="text-lg font-bold" style={{ color: recommendationLabel.color }}>{recommendationLabel.stars}</span>
                <span className="text-sm ml-1" style={{ color: recommendationLabel.color }}>{recommendationLabel.text}</span>
              </div>
              <div className="text-xs space-y-0.5" style={{ color: "var(--texte-secondaire)" }}>
                <p>Score sémantique : <span className="font-mono font-bold">{score}%</span></p>
                <p>Confiance : <span className="font-mono">{confidence}%</span></p>
                {semExplication && <p className="text-xs mt-1 italic" style={{ color: "var(--texte-tertiaire)" }}>{semExplication}</p>}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Radar */}
        <SectionCard icon={<BarChart3 size={16} />} title="Profil Multidimensionnel" color="#3b82f6">
          <RadarChart scores={semScores} />
        </SectionCard>
      </div>

      {/* Scores détaillés */}
      <SectionCard icon={<TrendingUp size={16} />} title="Scores par Dimension" color="var(--or)">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { k: "roleFit", label: "Adéquation Rôle" },
            { k: "seniorityFit", label: "Séniorité" },
            { k: "locationFit", label: "Localisation" },
            { k: "sectorFit", label: "Secteur" },
            { k: "languageFit", label: "Langues" },
            { k: "compensationFit", label: "Rémunération" },
            { k: "companyFit", label: "Entreprise" },
            { k: "applicationReadiness", label: "Qualité annonce" },
            { k: "risk", label: "Risque (inversé)" },
          ].map(d => (
            <ScoreBar key={d.k} label={d.label} value={semScores[d.k as keyof SemScores] ?? 0} />
          ))}
        </div>
      </SectionCard>

      {/* ─── Section 2 : Forces ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard icon={<Zap size={16} />} title="Forces & Atouts Différenciants" color="#22c55e">
          <div className="space-y-3">
            {semForces.length > 0 && (
              <div>
                <p className="text-xs font-bold mb-1.5" style={{ color: "var(--texte)" }}>Signaux positifs</p>
                <div className="space-y-1">
                  {semForces.map((f, i) => <p key={i} className="text-xs flex items-start gap-1.5" style={{ color: "var(--texte-secondaire)" }}><CheckCircle2 size={10} style={{ color: "#22c55e", marginTop: 2, flexShrink: 0 }} />{f}</p>)}
                </div>
              </div>
            )}
            {confirmed.length > 0 && (
              <div>
                <p className="text-xs font-bold mb-1.5" style={{ color: "var(--texte)" }}>Compétences confirmées</p>
                <div className="flex flex-wrap gap-1">
                  {confirmed.map((m: any, i: number) => <span key={i} className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>{m.requirement || m}</span>)}
                </div>
              </div>
            )}
            {semCvAngle && (
              <div>
                <p className="text-xs font-bold mb-1" style={{ color: "var(--texte)" }}>🎯 Angle CV recommandé</p>
                <p className="text-xs italic" style={{ color: "var(--texte-secondaire)" }}>{semCvAngle}</p>
              </div>
            )}
            {semLetterAngle && (
              <div>
                <p className="text-xs font-bold mb-1" style={{ color: "var(--texte)" }}>✉️ Angle lettre recommandé</p>
                <p className="text-xs italic" style={{ color: "var(--texte-secondaire)" }}>{semLetterAngle}</p>
              </div>
            )}
          </div>
        </SectionCard>

        {/* ─── Section 3 : Risques ─── */}
        <SectionCard icon={<AlertTriangle size={16} />} title="Points de Vigilance & Risques" color="#ef4444">
          <div className="space-y-3">
            {semRisques.length > 0 && (
              <div>
                <p className="text-xs font-bold mb-1.5" style={{ color: "var(--texte)" }}>Signaux de risque</p>
                <div className="space-y-1">
                  {semRisques.map((r, i) => <p key={i} className="text-xs flex items-start gap-1.5" style={{ color: "var(--texte-secondaire)" }}><XCircle size={10} style={{ color: "#ef4444", marginTop: 2, flexShrink: 0 }} />{r}</p>)}
                </div>
              </div>
            )}
            {gapList.length > 0 && (
              <div>
                <p className="text-xs font-bold mb-1.5" style={{ color: "var(--texte)" }}>Gaps de compétences</p>
                <div className="space-y-1">
                  {gapList.map((g: any, i: number) => <p key={i} className="text-xs flex items-start gap-1.5" style={{ color: "var(--texte-secondaire)" }}><AlertTriangle size={10} style={{ color: "#f59e0b", marginTop: 2, flexShrink: 0 }} />{g.requirement || g.gap || g}</p>)}
                </div>
              </div>
            )}
            {semManques.length > 0 && (
              <div>
                <p className="text-xs font-bold mb-1.5" style={{ color: "var(--texte)" }}>Signaux manquants dans l&apos;annonce</p>
                <div className="space-y-1">
                  {semManques.map((m, i) => <p key={i} className="text-xs flex items-start gap-1.5" style={{ color: "var(--texte-tertiaire)" }}><Eye size={10} style={{ color: "var(--texte-tertiaire)", marginTop: 2, flexShrink: 0 }} />{m}</p>)}
                </div>
              </div>
            )}
            {riskList.length > 0 && (
              <div>
                <p className="text-xs font-bold mb-1.5" style={{ color: "var(--texte)" }}>Risques identifiés</p>
                <div className="space-y-1">
                  {riskList.map((r: any, i: number) => <p key={i} className="text-xs flex items-start gap-1.5" style={{ color: "var(--texte-secondaire)" }}><XCircle size={10} style={{ color: "#ef4444", marginTop: 2, flexShrink: 0 }} />{r.risk || r}</p>)}
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      {/* ─── Section 4 : Stratégie (DeepSeek) ─── */}
      <SectionCard icon={<Swords size={16} />} title="Stratégie de Candidature" color="#8b5cf6">
        {loading && (
          <div className="flex items-center gap-3 py-4">
            <Loader2 size={16} className="animate-spin" style={{ color: "#8b5cf6" }} />
            <span className="text-xs" style={{ color: "var(--texte-secondaire)" }}>Génération de l&apos;analyse stratégique via DeepSeek...</span>
          </div>
        )}
        {error && (
          <div className="p-3 rounded border" style={{ borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.06)" }}>
            <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>
            <button onClick={loadExecutive} className="mt-2 text-xs font-mono underline" style={{ color: "var(--texte-secondaire)" }}>Réessayer</button>
          </div>
        )}
        {!loading && !error && !execData && (
          <button onClick={loadExecutive}
            className="flex items-center gap-2 px-4 py-2 rounded text-xs font-mono border transition-colors"
            style={{ borderColor: "#8b5cf6", color: "#8b5cf6" }}>
            <Brain size={12} /> Générer l&apos;analyse stratégique
          </button>
        )}
        {execData && (
          <div className="space-y-4">
            {/* Angle d'attaque */}
            {execData.angleAttaque && (
              <div className="p-4 rounded-lg" style={{ background: "rgba(139,92,246,0.06)", borderLeft: "3px solid #8b5cf6" }}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Target size={12} style={{ color: "#8b5cf6" }} />
                  <p className="text-xs font-bold font-mono" style={{ color: "#8b5cf6" }}>Angle d&apos;attaque</p>
                </div>
                <p className="text-sm" style={{ color: "var(--texte)" }}>{execData.angleAttaque}</p>
              </div>
            )}

            {/* Leviers + Questions + Pièges */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {execData.leviersNegociation && execData.leviersNegociation.length > 0 && (
                <div className="p-3 rounded-lg" style={{ background: "rgba(34,197,94,0.04)", borderLeft: "3px solid #22c55e" }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <DollarSign size={12} style={{ color: "#22c55e" }} />
                    <p className="text-xs font-bold font-mono" style={{ color: "#22c55e" }}>Leviers de négociation</p>
                  </div>
                  <ul className="space-y-1.5">
                    {execData.leviersNegociation.map((l, i) => (
                      <li key={i} className="text-xs flex items-start gap-1" style={{ color: "var(--texte-secondaire)" }}>
                        <ChevronRight size={10} style={{ color: "#22c55e", marginTop: 2, flexShrink: 0 }} />{l}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {execData.questionsEntretien && execData.questionsEntretien.length > 0 && (
                <div className="p-3 rounded-lg" style={{ background: "rgba(59,130,246,0.04)", borderLeft: "3px solid #3b82f6" }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <MessageSquare size={12} style={{ color: "#3b82f6" }} />
                    <p className="text-xs font-bold font-mono" style={{ color: "#3b82f6" }}>Questions à poser</p>
                  </div>
                  <ul className="space-y-1.5">
                    {execData.questionsEntretien.map((q, i) => (
                      <li key={i} className="text-xs flex items-start gap-1" style={{ color: "var(--texte-secondaire)" }}>
                        <ChevronRight size={10} style={{ color: "#3b82f6", marginTop: 2, flexShrink: 0 }} />{q}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {execData.piegesEviter && execData.piegesEviter.length > 0 && (
                <div className="p-3 rounded-lg" style={{ background: "rgba(239,68,68,0.04)", borderLeft: "3px solid #ef4444" }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <AlertTriangle size={12} style={{ color: "#ef4444" }} />
                    <p className="text-xs font-bold font-mono" style={{ color: "#ef4444" }}>Pièges à éviter</p>
                  </div>
                  <ul className="space-y-1.5">
                    {execData.piegesEviter.map((p, i) => (
                      <li key={i} className="text-xs flex items-start gap-1" style={{ color: "var(--texte-secondaire)" }}>
                        <XCircle size={10} style={{ color: "#ef4444", marginTop: 2, flexShrink: 0 }} />{p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Positionnement marché */}
            {execData.positionnementMarche && (
              <div className="p-3 rounded-lg" style={{ background: "rgba(245,158,11,0.04)", borderLeft: "3px solid #f59e0b" }}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <MapPin size={12} style={{ color: "#f59e0b" }} />
                  <p className="text-xs font-bold font-mono" style={{ color: "#f59e0b" }}>Positionnement marché</p>
                </div>
                <p className="text-sm" style={{ color: "var(--texte)" }}>{execData.positionnementMarche}</p>
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {/* ─── Section 5 : Résumé Exécutif ─── */}
      {execData?.resumeExecutif && (
        <SectionCard icon={<Sparkles size={16} />} title="Résumé Exécutif" color="var(--or)">
          <div className="p-4 rounded-lg" style={{ background: "rgba(184,134,11,0.06)", borderLeft: "3px solid var(--or)" }}>
            <p className="text-sm leading-relaxed" style={{ color: "var(--texte)" }}>{execData.resumeExecutif}</p>
          </div>
          <p className="text-[10px] font-mono mt-2" style={{ color: "var(--texte-tertiaire)" }}>
            {execData.generatedAt ? `Généré le ${new Date(execData.generatedAt).toLocaleDateString("fr-FR")} via DeepSeek` : "Analyse générée via DeepSeek"}
          </p>
        </SectionCard>
      )}

      {/* ─── Infos complémentaires ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        {props.jobCompany && (
          <div className="p-3 rounded-lg border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond)" }}>
            <Building2 size={12} className="mb-1" style={{ color: "var(--texte-tertiaire)" }} />
            <p className="font-mono font-bold" style={{ color: "var(--texte)" }}>{props.jobCompany}</p>
            <p style={{ color: "var(--texte-tertiaire)" }}>Entreprise</p>
          </div>
        )}
        {props.jobLocation && (
          <div className="p-3 rounded-lg border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond)" }}>
            <MapPin size={12} className="mb-1" style={{ color: "var(--texte-tertiaire)" }} />
            <p className="font-mono font-bold" style={{ color: "var(--texte)" }}>{props.jobLocation}</p>
            <p style={{ color: "var(--texte-tertiaire)" }}>Localisation</p>
          </div>
        )}
        {props.contractType && (
          <div className="p-3 rounded-lg border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond)" }}>
            <Briefcase size={12} className="mb-1" style={{ color: "var(--texte-tertiaire)" }} />
            <p className="font-mono font-bold" style={{ color: "var(--texte)" }}>{props.contractType}</p>
            <p style={{ color: "var(--texte-tertiaire)" }}>Contrat</p>
          </div>
        )}
        {(props.salaryMin || props.salaryMax) && (
          <div className="p-3 rounded-lg border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond)" }}>
            <DollarSign size={12} className="mb-1" style={{ color: "var(--texte-tertiaire)" }} />
            <p className="font-mono font-bold" style={{ color: "var(--texte)" }}>
              {props.salaryMin ? `${props.salaryMin}€` : ""}{props.salaryMin && props.salaryMax ? " – " : ""}{props.salaryMax ? `${props.salaryMax}€` : ""}
            </p>
            <p style={{ color: "var(--texte-tertiaire)" }}>Salaire</p>
          </div>
        )}
      </div>
    </div>
  );
}
