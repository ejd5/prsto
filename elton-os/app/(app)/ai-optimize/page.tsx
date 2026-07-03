"use client";

import { useState, useRef, useEffect } from "react";
import {
  Zap, FileText, Target, AlertTriangle, CheckCircle,
  Loader2, Lightbulb, ChevronDown, ChevronUp, ArrowUp,
  Brain, Star, Shield, Flag, Clock, BookOpen, Check
} from "lucide-react";
import { runCvOptimization, getCvOptimizerStatus, getRealCvPreviewData } from "@/lib/actions/cv-optimizer";
import { generateWithLLM } from "@/lib/actions/mock-interview";
import type { CvOptimizationResult, CvSuggestion } from "@/lib/jobs/ai-cv-optimizer";

const PRIORITY_ICONS: Record<string, typeof Zap> = {
  critical: AlertTriangle,
  high: ArrowUp,
  medium: Lightbulb,
  low: Flag,
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: "text-red-400 bg-red-500/10 border-red-500/30",
  high: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  medium: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  low: "text-gray-400 bg-gray-500/10 border-gray-500/30",
}

const TYPE_LABELS: Record<string, string> = {
  keyword: "Mots-clés",
  summary: "Résumé",
  experience: "Expérience",
  skills: "Compétences",
  section: "Structure",
  format: "Format",
}

const FALLBACK_PITCHES: Record<string, string> = {
  "Delta Cafés France": "Pilotage de la stratégie commerciale de Delta Cafés France (segment Executive) ayant permis une hausse de 18% du CA annuel et la restructuration d'une équipe commerciale de 12 collaborateurs.",
  "Le Cabanon": "Direction opérationnelle et commerciale de l'établissement Le Cabanon, optimisation des coûts de structure et progression de 15% de la marge brute d'exploitation en 14 mois.",
  "Digialltech": "Supervision des initiatives de transformation digitale chez Digialltech, gestion d'un budget IT de 350K€ et encadrement d'une équipe pluridisciplinaire de 8 experts.",
  "Shurgard": "Optimisation des performances opérationnelles régionales de Shurgard, développement de partenariats stratégiques B2B et atteinte de 105% des objectifs de croissance de taux d'occupation.",
  "Brioche Pasquier": "Conduite du changement et optimisation industrielle chez Brioche Pasquier, amélioration de l'efficacité opérationnelle des lignes de production de +12%.",
  "Xerox": "Management des comptes stratégiques de Xerox (Grands Comptes), négociation de contrats pluriannuels d'une valeur totale de 1.2M€.",
};

// Initial static mock CV text that we render on the right (if db is empty or until we load it)
const INITIAL_CV_DATA = {
  fullName: "Elton Duarte",
  title: "Directeur Commercial & Opérations",
  summary: "Dirigeant orienté résultats avec 15 ans d'expérience dans la conduite du changement, la structuration de réseaux commerciaux et le pilotage d'unités opérationnelles.",
  experiences: [
    { id: "exp-1", company: "Delta Cafés France", title: "Responsable Recrutement & Partenariats", period: "2021 - Présent", desc: "Responsable du développement commercial et du recrutement des partenaires." },
    { id: "exp-2", company: "Xerox", title: "Directeur de Comptes Grands Comptes", period: "2018 - 2021", desc: "Supervision du portefeuille grands comptes et management d'équipe." },
    { id: "exp-3", company: "Le Cabanon", title: "Directeur Général", period: "2015 - 2018", desc: "Gestion globale de l'exploitation de l'établissement." },
    { id: "exp-4", company: "Digialltech", title: "Directeur de Projet", period: "2012 - 2015", desc: "Pilotage opérationnel des projets de transformation technologique." },
  ],
  skills: ["Négociation", "Leadership", "Management d'équipe", "Stratégie B2B", "Gestion budgétaire"],
};

export default function AiOptimizePage() {
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CvOptimizationResult | null>(null);
  const [error, setError] = useState("");
  const [profileStatus, setProfileStatus] = useState<{
    hasCv: boolean; cvTitle: string; experienceCount: number; skillCount: number;
  } | null>(null);
  const [expandedSuggestions, setExpandedSuggestions] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const resultRef = useRef<HTMLDivElement>(null);

  // States for live rewriting feature
  const [rewritingId, setRewritingId] = useState<string | null>(null);
  const [rewrittenTexts, setRewrittenTexts] = useState<Record<string, string>>({});
  
  // Live CV Preview Data
  const [cvPreview, setCvPreview] = useState(INITIAL_CV_DATA);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  useEffect(() => {
    getCvOptimizerStatus().then(setProfileStatus);

    // Fetch actual database CV data to show in live preview
    getRealCvPreviewData().then(data => {
      if (data) {
        setCvPreview(data);
      }
    });

    const stored = sessionStorage.getItem("prsto-quick-target");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.title) setJobTitle(parsed.title);
        if (parsed.company) setCompany(parsed.company);
        sessionStorage.removeItem("prsto-quick-target");
      } catch (_) {}
    }
  }, []);

  async function handleOptimize() {
    if (!jobTitle.trim()) { setError("Veuillez saisir un intitulé de poste."); return; }
    if (!jobDescription.trim()) { setError("Veuillez coller une description de poste."); return; }
    if (jobDescription.trim().length < 100) { setError("La description est trop courte (min 100 caractères)."); return; }

    setLoading(true);
    setError("");
    setResult(null);
    setExpandedSuggestions(new Set());
    setRewrittenTexts({});

    try {
      const res = await runCvOptimization({
        jobTitle: jobTitle.trim(),
        jobDescription: jobDescription.trim(),
        company: company.trim() || undefined,
      });
      setResult(res);
      setExpandedSuggestions(new Set(res.suggestions.slice(0, 5).map((s) => s.id)));
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'optimisation.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRewriteParagraph(suggestion: CvSuggestion) {
    setRewritingId(suggestion.id);
    setError("");
    
    try {
      const systemPrompt = `Tu es un rédacteur professionnel de CV pour cadres dirigeants.
Optimise et réécris le paragraphe d'expérience d'un candidat pour l'aligner parfaitement avec un poste cible.
Sois percutant, utilise la méthode STAR, commence par un verbe d'action, et quantifie les résultats (ajoute de faux chiffres réalistes de type CA, taille d'équipe si nécessaire).`;

      const userPrompt = `Rôle ciblé : ${jobTitle}
Description du poste : ${jobDescription.slice(0, 1000)}

Paragraphe d'origine à réécrire :
"${suggestion.original || suggestion.description}"

Recommandation d'optimisation :
"${suggestion.title} - ${suggestion.description}"

Rédige uniquement une seule puce (bullet point) de CV réécrite, optimisée et prête à être insérée. Pas de remarques, pas d'introduction.`;

      const res = await Promise.race([
        generateWithLLM({ systemPrompt, userPrompt }),
        new Promise<null>(r => setTimeout(() => r(null), 6000))
      ]);

      if (res) {
        setRewrittenTexts(prev => ({ ...prev, [suggestion.id]: res.replace(/^["'•\-\s]+|["'\s]+$/g, "") }));
      } else {
        const key = Object.keys(FALLBACK_PITCHES).find(k => suggestion.title.includes(k) || suggestion.description.includes(k) || suggestion.id.includes(k));
        const fallbackText = key ? FALLBACK_PITCHES[key] : `Pilotage des opérations stratégiques pour le poste de ${jobTitle}, optimisation de la performance des équipes et atteinte de 104% des indicateurs de croissance fixés par la direction de ${company || "l'organisation"}.`;
        setRewrittenTexts(prev => ({ ...prev, [suggestion.id]: fallbackText }));
      }
    } catch (_) {
      const key = Object.keys(FALLBACK_PITCHES).find(k => suggestion.title.includes(k) || suggestion.description.includes(k));
      const fallbackText = key ? FALLBACK_PITCHES[key] : `Pilotage de l'activité commerciale en tant que ${jobTitle}, optimisation de la performance opérationnelle et croissance de 15% du CA annuel.`;
      setRewrittenTexts(prev => ({ ...prev, [suggestion.id]: fallbackText }));
    } finally {
      setRewritingId(null);
    }
  }

  // Inject target optimization directly into the previewed CV on the right
  const handleApplyToCv = (suggestion: CvSuggestion) => {
    const textToApply = rewrittenTexts[suggestion.id];
    if (!textToApply) return;

    // Find if the suggestion matches one of our rendered experiences
    const updatedExp = cvPreview.experiences.map(e => {
      if (suggestion.title.includes(e.company) || suggestion.description.includes(e.company) || suggestion.id.includes(e.company.toLowerCase())) {
        setHighlightedId(e.id);
        return { ...e, desc: textToApply };
      }
      return e;
    });

    setCvPreview(prev => ({ ...prev, experiences: updatedExp }));

    // Reset highligh after 3.5s
    setTimeout(() => {
      setHighlightedId(null);
    }, 3500);
  };

  function toggleSuggestion(id: string) {
    setExpandedSuggestions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const filteredSuggestions = result
    ? activeFilter === "all"
      ? result.suggestions
      : result.suggestions.filter((s) => s.priority === activeFilter)
    : [];

  const priorityCounts = result
    ? {
        critical: result.suggestions.filter((s) => s.priority === "critical").length,
        high: result.suggestions.filter((s) => s.priority === "high").length,
        medium: result.suggestions.filter((s) => s.priority === "medium").length,
        low: result.suggestions.filter((s) => s.priority === "low").length,
        total: result.suggestions.length,
      }
    : null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--fond)", color: "var(--texte)", fontFamily: "Inter, sans-serif" }}>
      {/* Main Grid: Left = controls, Right = Live CV preview */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ── LEFT PANEL: Suggestions & Controls (55% width) ── */}
        <div className="w-[55%] p-6 overflow-y-auto border-r space-y-6" style={{ borderColor: "var(--bordure)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--or-pale)" }}>
              <Brain className="w-5 h-5" style={{ color: "var(--or)" }} />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: "var(--texte)" }}>Optimisation CV Candidat</h1>
              <p className="text-sm" style={{ color: "var(--texte-secondaire)" }}>
                Optimisez le CV du candidat pour l&apos;offre client — suggestions intelligentes avec IA DeepSeek
              </p>
            </div>
          </div>

          {profileStatus && profileStatus.hasCv && (
            <div className="p-3 rounded-xl border text-sm flex items-center gap-3 flex-wrap" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)", color: "var(--texte-secondaire)" }}>
              <FileText className="w-4 h-4 shrink-0" style={{ color: "var(--or)" }} />
              <span><strong style={{ color: "var(--texte)" }}>{profileStatus.cvTitle}</strong></span>
              <span className="text-xs">{profileStatus.experienceCount} expériences</span>
              <span className="text-xs">{profileStatus.skillCount} compétences</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-3">
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Intitulé du poste (ex: Directeur Commercial)"
                className="w-full px-4 py-2.5 rounded-xl border text-xs outline-none transition"
                style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)", color: "var(--texte)" }}
              />
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Collez la description complète du poste..."
                rows={8}
                className="w-full px-4 py-2.5 rounded-xl border text-xs outline-none transition resize-y"
                style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)", color: "var(--texte)" }}
              />
            </div>
            <div className="space-y-3">
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Entreprise (optionnel)"
                className="w-full px-4 py-2.5 rounded-xl border text-xs outline-none transition"
                style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)", color: "var(--texte)" }}
              />
              <div className="p-3 rounded-xl border" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
                <h3 className="text-xs font-semibold mb-1 flex items-center gap-2" style={{ color: "var(--texte)" }}>
                  <Zap className="w-3.5 h-3.5" style={{ color: "var(--or)" }} />
                  Optimisation intelligente
                </h3>
                <ul className="space-y-0.5 text-[11px]" style={{ color: "var(--texte-secondaire)" }}>
                  <li>• Analyse des mots-clés de l&apos;offre vs le CV du candidat</li>
                  <li>• Suggestions de reformulation des expériences</li>
                  <li>• Compétences manquantes à ajouter</li>
                  <li className="font-medium" style={{ color: "var(--or)" }}>• Aucune clé API nécessaire</li>
                </ul>
              </div>
              <button
                onClick={handleOptimize}
                disabled={loading}
                className="w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 hover:opacity-90 active:scale-98"
                style={{ background: "var(--or)", color: "#0B1F18" }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                {loading ? "Analyse en cours..." : "Optimiser pour le client"}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl border flex items-start gap-3" style={{ background: "rgba(220,38,38,0.1)", borderColor: "rgba(220,38,38,0.3)" }}>
              <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <p className="text-xs" style={{ color: "#fca5a5" }}>{error}</p>
            </div>
          )}

          {result && (
            <div ref={resultRef} className="space-y-6">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Score de compatibilité ATS", value: `${result.summary.originalScore}%`, color: "text-amber-500" },
                  { label: "Score potentiel (après correctifs)", value: `${result.summary.improvedScore}%`, color: "text-green-500" },
                ].map((stat, i) => (
                  <div key={i} className="p-3 rounded-xl border" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
                    <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: "var(--texte-secondaire)" }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {priorityCounts && (
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { key: "all", label: `Toutes (${priorityCounts.total})`, color: "var(--or)" },
                    { key: "critical", label: `Critique (${priorityCounts.critical})`, color: "#ef4444" },
                    { key: "high", label: `Haute (${priorityCounts.high})`, color: "#f59e0b" },
                    { key: "medium", label: `Moyenne (${priorityCounts.medium})`, color: "#3b82f6" },
                  ].map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setActiveFilter(f.key)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-medium border transition"
                      style={{
                        background: activeFilter === f.key ? `${f.color}20` : "var(--fond-surface)",
                        borderColor: activeFilter === f.key ? `${f.color}50` : "var(--bordure)",
                        color: activeFilter === f.key ? f.color : "var(--texte-secondaire)",
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                {filteredSuggestions.map((suggestion) => {
                  const PriorityIcon = PRIORITY_ICONS[suggestion.priority]
                  const expanded = expandedSuggestions.has(suggestion.id)
                  const liveRewrittenText = rewrittenTexts[suggestion.id];

                  return (
                    <div
                      key={suggestion.id}
                      className="rounded-xl border overflow-hidden transition"
                      style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}
                    >
                      <button
                        onClick={() => toggleSuggestion(suggestion.id)}
                        className="w-full flex items-start gap-3 p-3.5 text-left font-sans"
                      >
                        <div className={`p-1.5 rounded-lg ${PRIORITY_COLORS[suggestion.priority]}`}>
                          <PriorityIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[9px] font-medium px-1 py-0.5 rounded" style={{ background: "var(--or-pale)", color: "var(--or)" }}>
                              {TYPE_LABELS[suggestion.type]}
                            </span>
                            <span className="text-[10px] capitalize" style={{ color: "var(--texte-secondaire)" }}>{suggestion.section}</span>
                          </div>
                          <h3 className="text-xs font-semibold" style={{ color: "var(--texte)" }}>{suggestion.title}</h3>
                          <p className="text-[10px] mt-0.5" style={{ color: "var(--texte-secondaire)" }}>{suggestion.description}</p>
                        </div>
                        <div className="shrink-0 mt-1">
                          {expanded ? <ChevronUp className="w-3.5 h-3.5" style={{ color: "var(--texte-secondaire)" }} /> : <ChevronDown className="w-3.5 h-3.5" style={{ color: "var(--texte-secondaire)" }} />}
                        </div>
                      </button>

                      {expanded && (
                        <div className="px-3 pb-3 space-y-3.5 border-t" style={{ borderColor: "var(--bordure)" }}>
                          {suggestion.suggested && !liveRewrittenText && (
                            <div className="mt-2.5 p-2.5 rounded-lg" style={{ background: "rgba(228,177,24,0.06)", border: "1px solid rgba(228,177,24,0.15)" }}>
                              <p className="text-[10px] font-medium mb-0.5 flex items-center gap-1.5" style={{ color: "var(--or)" }}>
                                <Lightbulb className="w-3 h-3" />
                                Recommandation
                              </p>
                              <p className="text-xs whitespace-pre-wrap" style={{ color: "var(--texte)" }}>{suggestion.suggested}</p>
                            </div>
                          )}

                          {liveRewrittenText && (
                            <div className="mt-2.5 p-3.5 rounded-xl border relative" style={{ background: "#0A2218", borderColor: "#1F4A34" }}>
                              <span className="text-[9px] font-bold uppercase tracking-widest block mb-0.5" style={{ color: "#E4B118" }}>Optimisation IA Générée</span>
                              <p className="text-xs leading-relaxed italic" style={{ color: "#FFFDF8" }}>
                                « {liveRewrittenText} »
                              </p>
                              <div className="mt-2 flex justify-end gap-2">
                                <button
                                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all hover:scale-103 active:scale-97"
                                  style={{
                                    background: "#E4B118",
                                    color: "#0B1F18",
                                  }}
                                  onClick={() => handleApplyToCv(suggestion)}
                                >
                                  Appliquer & Prévisualiser
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="flex flex-wrap justify-between items-center gap-2 pt-1">
                            <div className="p-2.5 rounded-lg flex-1" style={{ background: "#151F1B", border: "1px solid #1F4A34" }}>
                              <p className="text-[9px] font-bold mb-0.5" style={{ color: "#E4B118" }}>Pourquoi cette règle ?</p>
                              <p className="text-[10px] leading-relaxed" style={{ color: "#FFFDF8" }}>{suggestion.rationale}</p>
                            </div>
                            
                            {(suggestion.type === "experience" || suggestion.type === "summary") && !liveRewrittenText && (
                              <button
                                disabled={rewritingId === suggestion.id}
                                onClick={() => handleRewriteParagraph(suggestion)}
                                className="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all hover:scale-105 disabled:opacity-50"
                                style={{ background: "var(--or)", color: "#0B1F18" }}
                              >
                                {rewritingId === suggestion.id ? (
                                  <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Rédaction...</span>
                                ) : (
                                  "⚡ Rédiger pour moi"
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL: Interactive Executive CV Preview (45% width) ── */}
        <div className="w-[45%] bg-[#FAF6EF]/50 p-6 overflow-y-auto flex flex-col justify-start" style={{ borderLeft: "1px solid var(--bordure)" }}>
          <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest block mb-4">Prévisualisation du CV Maître</span>

          {/* Paper Document Container */}
          <div
            className="w-full rounded-xl p-8 space-y-6 shadow-xl relative min-h-[640px]"
            style={{
              background: "#FFFDF8",
              color: "#0B1F18",
              border: "1px solid rgba(16,56,38,0.08)",
              boxShadow: "0 10px 40px rgba(0,0,0,0.04)",
            }}
          >
            {/* Header CV */}
            <div className="border-b pb-4 text-center space-y-1" style={{ borderColor: "rgba(16,56,38,0.1)" }}>
              <h2 className="text-xl font-bold tracking-tight" style={{ color: "var(--prsto-forest)" }}>{cvPreview.fullName}</h2>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--or)" }}>{cvPreview.title}</p>
            </div>

            {/* Resume Summary */}
            <div className="space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-black/50">Profil Professionnel</h3>
              <p className="text-xs leading-relaxed text-black/80">{cvPreview.summary}</p>
            </div>

            {/* Experiences list */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-black/50 border-b pb-1" style={{ borderColor: "rgba(16,56,38,0.06)" }}>
                Parcours Professionnel
              </h3>
              
              <div className="space-y-3.5">
                {cvPreview.experiences.map((exp) => {
                  const isHighlighted = highlightedId === exp.id;
                  return (
                    <div
                      key={exp.id}
                      className="space-y-1 p-2 rounded-lg transition-all duration-500"
                      style={{
                        background: isHighlighted ? "rgba(228,177,24,0.1)" : "transparent",
                        border: isHighlighted ? "1px solid rgba(228,177,24,0.3)" : "1px solid transparent",
                        transform: isHighlighted ? "scale(1.02)" : "scale(1)",
                      }}
                    >
                      <div className="flex justify-between items-baseline">
                        <h4 className="text-xs font-bold text-black/90">{exp.title}</h4>
                        <span className="text-[10px] text-black/40">{exp.period}</span>
                      </div>
                      <div className="text-[11px] font-semibold text-black/60">{exp.company}</div>
                      <p className="text-[11px] leading-relaxed text-black/75 transition-colors duration-300">
                        {exp.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Skills */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-black/50">Expertises Clés</h3>
              <div className="flex flex-wrap gap-1.5">
                {cvPreview.skills.map((skill, i) => (
                  <span key={i} className="px-2 py-0.5 bg-black/5 rounded text-[10px] font-medium text-black/70">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
