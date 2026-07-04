"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/EltonToast";
import {
  Loader2, Plus, Building2, Globe, Calendar,
  Target, FileText, Trash2, Sparkles, ChevronDown,
  Clock, CheckCircle2, PlayCircle, Star, Sparkle,
  BookOpen, Trophy, Award, ArrowUpRight, Compass,
  Shield, AlertTriangle, MessageSquare, Handshake,
  Zap, Settings, DollarSign
} from "lucide-react";
import { 
  getInterviews, deleteInterview, generateInterviewPreparation, 
  evaluateStarResponse, evaluateObjectionResponse, generateDynamicObjection,
  type StarEvaluation, type ObjectionEvaluation, type GeneratedObjection 
} from "@/lib/actions/interview";
import { getOpportunities } from "@/lib/actions/opportunity";
import AIAssistant from "@/components/ai-assistant";
import type { SuggestionItem } from "@/lib/ai/suggestions";

interface InterviewItem {
  id: string; opportunityId: string; preparation: string; status: string; createdAt: string; type: string | null;
  opportunity: { id: string; title: string; company: string; country: string | null; score: number | null; } | null;
}
interface OppItem { id: string; title: string; company: string; country: string | null; rawText: string; score: number | null; }

const STATUS_CONFIG = {
  brouillon: {
    label: "Brouillon", icon: Clock,
    gradient: "linear-gradient(135deg, #0e3a29, #082419)",
    border: "rgba(242,177,26,0.35)", dotBg: "rgba(242,177,26,0.12)", dotColor: "#F2B11A",
  },
  pret: {
    label: "Préparé", icon: CheckCircle2,
    gradient: "linear-gradient(135deg, #1f5b3e, #133a27)",
    border: "rgba(242,177,26,0.45)", dotBg: "rgba(242,177,26,0.15)", dotColor: "#F2B11A",
  },
  utilise: {
    label: "Archivé", icon: PlayCircle,
    gradient: "linear-gradient(135deg, #151F1B, #0b110e)",
    border: "rgba(255,255,255,0.1)", dotBg: "rgba(255,255,255,0.05)", dotColor: "#FAF6EF",
  },
} as const;

const TYPE_COLORS: Record<string, string> = {
  entretien: "#F2B11A",
  call_rh: "#60A5FA",
  test_technique: "#A78BFA",
  final: "#FAF6EF",
};

const OBJECTION_SCENARIOS = [
  {
    id: "transition",
    title: "1. L'Accident / Transition de Parcours",
    objection: "Pourquoi être resté seulement 5 mois chez Delta Cafés ? Cette rupture rapide est un signal d'alerte pour nous.",
    context: "Justifier une transition ou un départ de manière diplomatique sans dénigrer la structure précédente."
  },
  {
    id: "margin",
    title: "2. L'Objection Financière & EBITDA",
    objection: "Nous voyons sur votre bilan Xerox que la marge brute a fléchi de 2 points la deuxième année. Comment l'expliquez-vous ?",
    context: "Défendre un bilan chiffré devant le Board en assumant la responsabilité des arbitrages."
  },
  {
    id: "negotiation",
    title: "3. La Négociation Executive (Package)",
    objection: "Votre prétention salariale de 150K€ fixe + variable dépasse de 15% notre grille pour ce poste de direction.",
    context: "Défendre sa valeur et son package sans bloquer la discussion commerciale."
  },
  {
    id: "governance",
    title: "4. Le Conflit Politique / Gouvernance",
    objection: "Le Conseil d'Administration est très divisé sur l'externalisation de la production. Comment comptez-vous imposer votre vision sans braquer les actionnaires ?",
    context: "Démontrer sa posture politique et ses compétences de diplomatie executive."
  }
];

export default function InterviewsPage() {
  const router = useRouter();
  const toast = useToast();
  const [interviews, setInterviews] = useState<InterviewItem[]>([]);
  const [opps, setOpps] = useState<OppItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGen, setShowGen] = useState(false);
  const [selOpp, setSelOpp] = useState("");
  const [generating, setGenerating] = useState(false);

  // Navigation state
  const [activeTab, setActiveTab] = useState<"briefs" | "star" | "objections">("briefs");
  
  // STAR Simulator States
  const [starQuestion, setStarQuestion] = useState("Décrivez une situation complexe où vous avez dû restructurer un département commercial sous-performant.");
  const [starS, setStarS] = useState("");
  const [starT, setStarT] = useState("");
  const [starA, setStarA] = useState("");
  const [starR, setStarR] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [starEvaluation, setStarEvaluation] = useState<StarEvaluation | null>(null);

  // Objection Studio States
  const [selObjectionScenario, setSelObjectionScenario] = useState(OBJECTION_SCENARIOS[0]);
  const [objectionResponseInput, setObjectionResponseInput] = useState("");
  const [evaluatingObjection, setEvaluatingObjection] = useState(false);
  const [objectionEvaluation, setObjectionEvaluation] = useState<ObjectionEvaluation | null>(null);

  // Dynamic Challenge Generator States
  const [targetRoleInput, setTargetRoleInput] = useState("Directeur Commercial");
  const [objectionThemeInput, setObjectionThemeInput] = useState("performance");
  const [generatingDynamic, setGeneratingDynamic] = useState(false);

  // Subscription Limit States (Premium business model control)
  const [objectionCredits, setObjectionCredits] = useState(5); // 5 credits default for demo

  const load = useCallback(async () => {
    const [ivs, ops] = await Promise.all([getInterviews(), getOpportunities()]);
    setInterviews(ivs as unknown as InterviewItem[]);
    setOpps(ops as unknown as OppItem[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleGenerate = async () => {
    if (!selOpp) return;
    setGenerating(true);
    try {
      const result = await generateInterviewPreparation(selOpp);
      router.push(`/entretiens/${result.id}`);
    } catch { setGenerating(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce brief ?")) return;
    await deleteInterview(id);
    await load();
  };

  const handleAISuggestion = (_target: string, _item: SuggestionItem) => {
    toast.info(`Suggestion : ${_item.name} — ${_item.reason}`);
  };

  const handleEvaluateStar = async () => {
    if (!starS || !starT || !starA || !starR) {
      toast.error("Veuillez remplir toutes les étapes S, T, A, R.");
      return;
    }
    setEvaluating(true);
    setStarEvaluation(null);
    try {
      const result = await evaluateStarResponse({
        question: starQuestion,
        situation: starS,
        task: starT,
        action: starA,
        result: starR,
      });
      if (result) {
        setStarEvaluation(result);
        toast.success("Évaluation STAR générée avec succès !");
      } else {
        toast.error("Échec de l'évaluation par l'IA.");
      }
    } catch (e) {
      toast.error("Erreur lors de l'appel à l'IA.");
    } finally {
      setEvaluating(false);
    }
  };

  const handleEvaluateObjection = async () => {
    if (!objectionResponseInput) {
      toast.error("Veuillez formuler votre réponse avant de lancer l'analyse.");
      return;
    }
    setEvaluatingObjection(true);
    setObjectionEvaluation(null);
    try {
      const result = await evaluateObjectionResponse({
        scenario: selObjectionScenario.title,
        objection: selObjectionScenario.objection,
        response: objectionResponseInput,
      });
      if (result) {
        setObjectionEvaluation(result);
        toast.success("Analyse d'objection générée !");
      } else {
        toast.error("Échec de l'évaluation.");
      }
    } catch (e) {
      toast.error("Erreur d'appel IA.");
    } finally {
      setEvaluatingObjection(false);
    }
  };

  const handleGenerateCustomObjection = async () => {
    if (objectionCredits <= 0) {
      toast.error("Votre solde de crédits de simulation est épuisé.");
      return;
    }
    setGeneratingDynamic(true);
    try {
      const customObjection = await generateDynamicObjection({
        targetRole: targetRoleInput,
        theme: objectionThemeInput
      });

      if (customObjection) {
        setSelObjectionScenario({
          id: "custom_" + Date.now(),
          title: customObjection.scenarioTitle,
          objection: customObjection.objectionText,
          context: customObjection.contextAdvice
        });
        setObjectionResponseInput("");
        setObjectionEvaluation(null);
        setObjectionCredits(prev => prev - 1);
        toast.success("Défi généré ! -1 crédit de simulation");
      } else {
        toast.error("Échec de la génération.");
      }
    } catch (e) {
      toast.error("Erreur de génération.");
    } finally {
      setGeneratingDynamic(false);
    }
  };

  const buyCreditsSimulation = () => {
    setObjectionCredits(prev => prev + 10);
    toast.success("+10 crédits ajoutés à votre compte (Démonstration de paiement)");
  };

  const grouped = [
    { key: "brouillon", label: "En cours de préparation", icon: Clock, items: interviews.filter(iv => iv.status === "brouillon") },
    { key: "pret", label: "Prêts pour l'entretien", icon: CheckCircle2, items: interviews.filter(iv => iv.status === "pret") },
    { key: "utilise", label: "Dossiers Archivés", icon: PlayCircle, items: interviews.filter(iv => iv.status === "utilise") },
  ] as const;

  return (
    <>
    {/* Outer container: color set to #0E3A29 (Dark Forest) to be readable on cream background */}
    <div className="p-8 max-w-7xl mx-auto space-y-8" style={{ fontFamily: "Satoshi, Inter, sans-serif", color: "#0E3A29" }}>
      
      {/* Brand Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b" style={{ borderColor: "rgba(14,58,41,0.15)" }}>
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#E3A316] mb-1 block">
            PRSTO • EXCELLENCE & IMPACT
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#0E3A29]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Briefs d'Entretiens Stratégiques
          </h1>
          <p className="text-xs text-[#0E3A29]/70 mt-1 max-w-2xl leading-relaxed">
            Consolidez vos opportunités et préparez vos questions stratégiques de niveau Comité de Direction (Comex).
          </p>
        </div>

        {/* C-Suite Premium Tab Navigation (Top-Right) */}
        <div className="mt-4 md:mt-0 flex gap-2 p-1 rounded-xl bg-white border" style={{ borderColor: "rgba(14,58,41,0.12)" }}>
          <button
            onClick={() => setActiveTab("briefs")}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-200"
            style={{
              background: activeTab === "briefs" ? "#0E3A29" : "transparent",
              color: activeTab === "briefs" ? "#F2B11A" : "#0E3A29",
            }}
          >
            📂 Dossier de Briefs
          </button>
          <button
            onClick={() => setActiveTab("star")}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-200"
            style={{
              background: activeTab === "star" ? "#0E3A29" : "transparent",
              color: activeTab === "star" ? "#F2B11A" : "#0E3A29",
            }}
          >
            🧠 STAR Simulator
          </button>
          <button
            onClick={() => setActiveTab("objections")}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-200"
            style={{
              background: activeTab === "objections" ? "#0E3A29" : "transparent",
              color: activeTab === "objections" ? "#F2B11A" : "#0E3A29",
            }}
          >
            🛡️ Boardroom Objections
          </button>
        </div>
      </div>

      {activeTab === "briefs" ? (
        <div className="space-y-6">
          
          {/* Methodological Guide Block for Briefs: Forest Green background layout with Ivory/Gold text */}
          <div className="p-6 rounded-2xl border space-y-4 shadow-xl text-[#FAF6EF]" style={{ background: "#0E3A29", borderColor: "rgba(242,177,26,0.3)" }}>
            <h3 className="text-sm font-bold flex items-center gap-2 text-[#F2B11A]">
              <Compass className="w-4 h-4 text-[#F2B11A]" />
              Comment fonctionnent les Briefs d'Entretiens C-Suite ?
            </h3>
            <p className="text-xs leading-relaxed text-[#FAF6EF]/85">
              Un brief d'entretien PRSTO est un dossier complet de <strong>24 sections stratégiques</strong> conçu pour vous éviter d'être pris au dépourvu par un chasseur de têtes ou un membre de Board. 
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 text-[11px] leading-relaxed">
              <div className="space-y-1">
                <span className="font-bold text-[#F2B11A] block">1. Fusion d'Informations :</span>
                <span className="text-[#FAF6EF]/80">L'IA croise le descriptif de poste cible avec vos réalisations validées dans le <strong>Proof Vault</strong> et votre <strong>CV Maître</strong>.</span>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-[#F2B11A] block">2. Analyse Prédictive :</span>
                <span className="text-[#FAF6EF]/80">Il formule 6 pitchs d'introduction sur-mesure et anticipe les questions délicates sur votre rémunération, vos mobilités ou vos transitions.</span>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-[#F2B11A] block">3. Simulation d'Objections :</span>
                <span className="text-[#FAF6EF]/80">Il vous fournit les arguments clés pour défendre vos bilans et structurer vos réponses financières de gouvernance.</span>
              </div>
            </div>
          </div>

          {/* Quick Actions & Generator Drawer Trigger in Forest Green */}
          <div className="flex items-center justify-between bg-[#0E3A29] p-4 rounded-xl border" style={{ borderColor: "rgba(242,177,26,0.2)" }}>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F2B11A]" />
              <span className="text-xs font-bold text-[#FAF6EF]">
                {interviews.length} dossier{interviews.length !== 1 ? "s" : ""} actif{interviews.length !== 1 ? "s" : ""} dans votre espace
              </span>
            </div>
            
            <button onClick={() => setShowGen(!showGen)}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-lg transition-all duration-200 hover:opacity-90 active:scale-95"
              style={{ background: "#F2B11A", color: "#0E1210" }}>
              {showGen ? <ChevronDown size={14} /> : <Plus size={14} />}
              {showGen ? "Fermer" : "Nouveau Brief Exécutif"}
            </button>
          </div>

          {/* Generator Drawer */}
          {showGen && (
            <div className="rounded-2xl border p-6 space-y-4 transition-all duration-300 shadow-2xl relative overflow-hidden text-[#FAF6EF]"
              style={{ background: "#1F5B3E", borderColor: "rgba(242,177,26,0.3)" }}>
              <div className="flex items-center gap-2">
                <Sparkles size={16} style={{ color: "#F2B11A" }} />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Générer une Préparation C-Suite
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-[#FAF6EF]/80 max-w-3xl">
                Notre intelligence artificielle analyse le descriptif de poste cible, puis s'appuie sur les données clés de votre <strong>CV Maître</strong> et de votre <strong>Proof Vault</strong> pour générer un dossier complet de 24 sections stratégiques.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <select value={selOpp} onChange={e => setSelOpp(e.target.value)}
                  className="w-full md:col-span-2 px-4 py-3 text-xs font-sans rounded-lg border appearance-none cursor-pointer outline-none bg-[#0E1210] focus:border-[#F2B11A]"
                  style={{ color: "#FAF6EF", borderColor: selOpp ? "#F2B11A" : "rgba(255,255,255,0.15)" }}>
                  <option value="">Sélectionnez l'opportunité cible...</option>
                  {opps.filter(o => o.rawText).map(o => (
                    <option key={o.id} value={o.id}>{o.title} — {o.company}</option>
                  ))}
                </select>

                <div className="flex gap-2">
                  <button onClick={handleGenerate} disabled={!selOpp || generating}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold rounded-lg transition-all duration-200 disabled:opacity-30"
                    style={{ background: selOpp ? "#F2B11A" : "rgba(255,255,255,0.06)", color: selOpp ? "#0E1210" : "rgba(255,255,255,0.4)" }}>
                    {generating ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                    {generating ? "Analyse en cours..." : "Lancer le Brief IA"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Kanban Board */}
          {loading ? (
            <div className="flex items-center justify-center p-24">
              <Loader2 size={32} className="animate-spin text-[#F2B11A]" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {grouped.map(col => {
                const cfg = STATUS_CONFIG[col.key];
                return (
                  <div key={col.key} className="flex flex-col space-y-4">
                    
                    {/* Column Header */}
                    <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "rgba(14,58,41,0.15)" }}>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: cfg.dotColor }} />
                        <span className="text-xs font-bold uppercase tracking-wider text-[#0E3A29]" style={{ color: "#0E3A29" }}>
                          {col.label}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono text-[#F2B11A] bg-[#0E3A29] border border-[#F2B11A]/20" style={{ color: "#F2B11A" }}>
                        {col.items.length}
                      </span>
                    </div>

                    {/* Column Cards Container */}
                    <div className="space-y-4 flex-1 min-h-[360px]">
                      {col.items.length === 0 ? (
                        <div className="py-16 text-center rounded-2xl border border-dashed bg-white/40"
                          style={{ borderColor: "rgba(14,58,41,0.12)" }}>
                            <p className="text-xs font-semibold text-[#0E3A29]/50" style={{ color: "rgba(14,58,41,0.5)" }}>
                              Aucun dossier dans cette colonne
                            </p>
                        </div>
                      ) : col.items.map(iv => {
                        const opp = iv.opportunity;
                        const typeColor = TYPE_COLORS[iv.type || ""] || "#FAF6EF";
                        const isUtilise = iv.status === "utilise";
                        return (
                          <div key={iv.id}
                            onClick={() => router.push(`/entretiens/${iv.id}`)}
                            className="group relative rounded-2xl border p-6 cursor-pointer transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)]"
                            style={{
                              background: cfg.gradient,
                              borderColor: cfg.border,
                            }}>
                            
                            {/* Card Badges & Delete */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[9px] font-extrabold uppercase rounded"
                                  style={{ background: cfg.dotBg, color: cfg.dotColor }}>
                                  <cfg.icon size={10} />
                                  {cfg.label}
                                </span>
                                {iv.type && (
                                  <span className="text-[9px] font-extrabold uppercase px-3 py-1 rounded"
                                    style={{ background: "rgba(255,255,255,0.08)", color: "#FAF6EF" }}>
                                    {iv.type === "entretien" ? "Entretien" : iv.type === "call_rh" ? "Call RH" : iv.type === "test_technique" ? "Test Tech" : "Final"}
                                  </span>
                                )}
                              </div>
                              {!isUtilise && (
                                <button onClick={e => { e.stopPropagation(); handleDelete(iv.id); }}
                                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded transition-all duration-200 hover:bg-white/10"
                                  style={{ color: "#FAF6EF" }}>
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>

                            {/* Job Title */}
                            <h3 className="text-base font-bold leading-snug mb-1 text-white group-hover:text-[#F2B11A] transition-colors"
                              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                              {opp?.title || "Opportunité privée"}
                            </h3>

                            {/* Company */}
                            <div className="text-xs font-semibold mb-4 flex items-center gap-1.5 text-white/60">
                              <Building2 size={13} className="text-[#F2B11A]" /> {opp?.company}
                            </div>

                            {/* Score & Country Badges */}
                            <div className="flex flex-wrap gap-2 mb-4 pt-1">
                              {opp?.country && (
                                <span className="flex items-center gap-1 text-[9.5px] px-2 py-0.5 rounded bg-white/10 text-white/80">
                                  <Globe size={10} /> {opp.country}
                                </span>
                              )}
                              {opp?.score && (
                                <span className="flex items-center gap-1 text-[9.5px] px-2.5 py-0.5 rounded font-extrabold"
                                  style={{ background: "rgba(242,177,26,0.15)", color: "#F2B11A" }}>
                                  <Target size={10} /> Adéquation : {opp.score}%
                                </span>
                              )}
                            </div>

                            {/* Card Footer */}
                            <div className="flex items-center justify-between pt-4 border-t"
                              style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                              <span className="flex items-center gap-1 text-[9px] font-mono text-white/55">
                                <Calendar size={10} />
                                Créé le {new Date(iv.createdAt).toLocaleDateString("fr-FR")}
                              </span>
                              <span className="flex items-center gap-1 text-[10px] font-bold text-[#F2B11A] group-hover:underline">
                                Voir le Brief <ArrowUpRight size={11} />
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : activeTab === "star" ? (
        /* STAR PITCH SIMULATOR TAB */
        <div className="space-y-6 animate-fade-in-up">
          
          {/* Methodological Guide Block */}
          <div className="p-6 rounded-2xl border space-y-4 shadow-xl text-[#FAF6EF]" style={{ background: "#0E3A29", borderColor: "rgba(242,177,26,0.3)" }}>
            <h3 className="text-sm font-bold flex items-center gap-2 text-[#F2B11A]" style={{ color: "#F2B11A" }}>
              <BookOpen className="w-4 h-4 text-[#F2B11A]" />
              Méthodologie STAR pour Cadres Dirigeants & C-Suite
            </h3>
            <p className="text-xs leading-relaxed text-[#FAF6EF]/90">
              Les chasseurs de têtes et conseils d'administration n'évaluent pas un dirigeant sur ses tâches quotidiennes, mais sur sa capacité à <strong>conduire le changement</strong>, à assumer la <strong>responsabilité d'un P&L (Budget)</strong>, et à <strong>fédérer des équipes (N-1)</strong>.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 text-[11px] leading-relaxed">
              <div className="space-y-1">
                <span className="font-bold text-[#F2B11A] block">S — Situation :</span>
                <span className="text-[#FAF6EF]/85">Cadrez l'envergure. Indiquez la taille de l'entité, le CA menacé, ou le contexte de crise.</span>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-[#F2B11A] block">T — Tâche :</span>
                <span className="text-[#FAF6EF]/85">Votre mandat. Définissez la feuille de route stratégique confiée par le Board ou le CEO.</span>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-[#F2B11A] block">A — Action :</span>
                <span className="text-[#FAF6EF]/85">Le levier décisionnel. Détaillez vos arbitrages, votre gouvernance et la conduite du changement.</span>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-[#F2B11A] block">R — Résultat :</span>
                <span className="text-[#FAF6EF]/85">L'impact P&L. Donnez des chiffres précis sur l'EBITDA, la croissance, ou la réduction des OPEX/CAPEX.</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Inputs Section (Left Column) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="p-4 rounded-xl border space-y-3 bg-white" style={{ borderColor: "rgba(14,58,41,0.15)" }}>
                <span className="text-[10px] font-bold text-[#E3A316] flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkle size={12} className="fill-current" /> Question ciblée de niveau Comité de Direction (Comex)
                </span>
                <input
                  type="text"
                  value={starQuestion}
                  onChange={(e) => setStarQuestion(e.target.value)}
                  placeholder="Saisissez la question de l'entretien (ex: Décrivez une restructuration...)"
                  className="w-full px-3 py-2.5 text-xs font-sans rounded-lg border outline-none bg-white text-[#0E3A29]"
                  style={{ borderColor: "rgba(14,58,41,0.15)" }}
                />
              </div>

              {/* S-T-A-R Boxes */}
              <div className="space-y-3">
                {[
                  { title: "S - Situation (Cadrez l'envergure du contexte)", state: starS, setter: setStarS, placeholder: "Ex: À mon arrivée chez Delta Cafés, la division B2B (15M€ de CA) enregistrait une baisse historique de rentabilité de 14% due à la désorganisation du réseau..." },
                  { title: "T - Tâche (Votre mandat exécutif)", state: starT, setter: setStarT, placeholder: "Ex: Redéfinir la feuille de route stratégique commerciale à 12 mois, validée par le Conseil, pour redresser l'EBITDA sans recrutement supplémentaire..." },
                  { title: "A - Action (Votre leadership & arbitrages opérationnels)", state: starA, setter: setStarA, placeholder: "Ex: Audit de la force de vente, restructuration des portefeuilles clients, déploiement d'un nouveau CRM et mise en place d'indicateurs de marge hebdomadaires..." },
                  { title: "R - Résultat (Chiffres financiers & humains)", state: starR, setter: setStarR, placeholder: "Ex: Redressement du P&L en 12 mois, croissance de +18% du CA premium, marge brute préservée à 36% et stabilisation de l'équipe (zéro départ)..." },
                ].map((step, idx) => (
                  <div key={idx} className="p-4 rounded-xl border space-y-2 bg-white" style={{ borderColor: "rgba(14,58,41,0.15)" }}>
                    <label className="text-[11px] font-bold text-[#0E3A29] uppercase tracking-wider block">{step.title}</label>
                    <textarea
                      value={step.state}
                      onChange={(e) => step.setter(e.target.value)}
                      placeholder={step.placeholder}
                      rows={4}
                      className="w-full px-3 py-2.5 text-xs font-sans rounded-lg border outline-none resize-none bg-white text-[#0E3A29] focus:border-[#F2B11A]"
                      style={{ borderColor: "rgba(14,58,41,0.15)" }}
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={handleEvaluateStar}
                disabled={evaluating}
                className="w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 hover:opacity-90 active:scale-98"
                style={{ background: "#0E3A29", color: "#F2B11A" }}
              >
                {evaluating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {evaluating ? "Analyse en cours..." : "Évaluer mon pitch STAR (IA)"}
              </button>
            </div>

            {/* AI Feedback & Score (Right Column) */}
            <div className="lg:col-span-6 space-y-4">
              {starEvaluation ? (
                <div className="p-6 rounded-2xl border space-y-6" style={{ background: "#0A2218", borderColor: "#1F4A34" }}>
                  
                  {/* Score block */}
                  <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-green-400" />
                        Score d'Impact Exécutif
                      </h3>
                      <p className="text-[10px] text-white/60">Évaluation méthodologique niveau Comité de Direction</p>
                    </div>
                    <div className="text-4xl font-black text-green-400">
                      {starEvaluation.score}%
                    </div>
                  </div>

                  {/* Posture Advice */}
                  <div className="p-4 rounded-xl border" style={{ background: "#151F1B", borderColor: "#1F4A34" }}>
                    <p className="text-[10.5px] font-bold uppercase tracking-wider text-yellow-500 mb-1 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5" />
                      Conseil de Posture & Charisme
                    </p>
                    <p className="text-xs leading-relaxed text-white/90 italic">« {starEvaluation.generalPostureAdvice} »</p>
                  </div>

                  {/* C-Suite Specific Evaluations */}
                  <div className="space-y-4 pt-2">
                    <h4 className="text-xs font-bold text-white/80 uppercase tracking-widest border-b pb-1.5" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                      Filtres Exécutifs C-Suite
                    </h4>
                    
                    <div className="space-y-3.5">
                      {[
                        { label: "Analyse Impact Financier & P&L", val: starEvaluation.financialImpactAnalysis, color: "#86efac" },
                        { label: "Management Stratégique & Équipe N-1", val: starEvaluation.leadershipScaleAnalysis, color: "#93c5fd" },
                        { label: "Positionnement Conseil d'Administration / Board", val: starEvaluation.boardAlignmentAnalysis, color: "#c084fc" },
                      ].map((item, i) => (
                        <div key={i} className="text-xs leading-relaxed space-y-1">
                          <span className="font-bold block" style={{ color: item.color }}>• {item.label}</span>
                          <p className="text-white/80 pl-2.5">{item.val}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Detailed Feedbacks */}
                  <div className="space-y-4 pt-2">
                    <h4 className="text-xs font-bold text-white/80 uppercase tracking-widest border-b pb-1.5" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                      Analyse de la Structure STAR
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {[
                        { label: "Situation", val: starEvaluation.situationFeedback },
                        { label: "Tâche", val: starEvaluation.taskFeedback },
                        { label: "Action", val: starEvaluation.actionFeedback },
                        { label: "Résultat", val: starEvaluation.resultFeedback },
                      ].map((f, i) => (
                        <div key={i} className="text-xs leading-relaxed p-2.5 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                          <span className="font-bold text-yellow-500 block mb-0.5">{f.label}</span>
                          <span className="text-white/80">{f.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Suggested Pitch bullet points */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold text-white/80 uppercase tracking-widest">
                      Reformulations pour votre Pitch / CV
                    </h4>
                    <ul className="space-y-2 text-xs text-white/95">
                      {starEvaluation.suggestedBulletPoints.map((bp, i) => (
                        <li key={i} className="p-3 rounded-lg border leading-relaxed" style={{ background: "rgba(255,255,255,0.03)", borderColor: "#1F4A34" }}>
                          🎯 {bp}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border text-center flex flex-col items-center justify-center min-h-[360px] relative overflow-hidden"
                  style={{
                    borderColor: "rgba(14,58,41,0.15)",
                    backgroundImage: "url('/blocpeclair.png')",
                    backgroundSize: "100% 100%",
                    backgroundRepeat: "no-repeat",
                  }}>
                  <div className="relative z-10 flex flex-col items-center p-12">
                    <Star size={24} className="text-texte-tertiaire/40 mb-3" />
                    <p className="text-sm font-semibold" style={{ color: "#0E3A29" }}>Simulateur STAR inactif</p>
                    <p className="text-xs mt-1 max-w-[260px] mx-auto leading-relaxed" style={{ color: "#0E3A29" }}>
                      Renseignez vos éléments Situation, Tâche, Action, Résultat à gauche, puis cliquez sur <strong>Évaluer</strong> pour obtenir votre diagnostic exécutif.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* BOARDROOM OBJECTIONS STUDIO TAB */
        <div className="space-y-6 animate-fade-in-up">
          
          {/* Methodological Guide Block for Objections */}
          <div className="p-6 rounded-2xl border space-y-4 shadow-xl text-[#FAF6EF]" style={{ background: "#0E3A29", borderColor: "rgba(242,177,26,0.3)" }}>
            <h3 className="text-sm font-bold flex items-center gap-2 text-[#F2B11A]" style={{ color: "#F2B11A" }}>
              <Shield className="w-4 h-4 text-[#F2B11A]" />
              Boardroom Objection Studio : L'art de la rhétorique politique
            </h3>
            <p className="text-xs leading-relaxed text-[#FAF6EF]/90">
              En entretien C-Suite, les questions déstabilisantes testent votre <strong>capacité de rebond politique</strong> et votre self-control. Ne justifiez pas : recadrez l'objection sous l'angle de la performance collective.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Scenarios and response Input (Left Column) */}
            <div className="lg:col-span-6 space-y-4">
              
              {/* Dynamic Custom Objection Generator Panel (Premium Boardroom Challenge Generator) */}
              <div className="p-5 rounded-2xl border bg-white space-y-4" style={{ borderColor: "rgba(14,58,41,0.25)" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#E3A316]">
                    <Zap size={16} className="fill-current" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Boardroom Challenge Generator (Générateur Infini)
                    </span>
                  </div>
                  
                  {/* Credits counter badge */}
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-[#0E3A29] text-[#F2B11A] border border-[#F2B11A]/20">
                    <span>{objectionCredits} crédits restants</span>
                  </div>
                </div>

                {objectionCredits > 0 ? (
                  <p className="text-[11px] text-[#0E3A29]/70 leading-relaxed">
                    Générez des objections réalistes à la demande basées sur votre rôle de direction et la thématique de votre choix. <strong>Chaque génération consomme 1 crédit.</strong>
                  </p>
                ) : (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-3">
                    <p className="text-xs text-red-800 leading-relaxed font-semibold">
                      💎 Vous avez épuisé votre quota de simulations pour ce mois.
                    </p>
                    <p className="text-[10px] text-red-700 leading-relaxed">
                      Passez à l'abonnement <strong>PRSTO Executive Comex</strong> pour obtenir des simulations illimitées ou rechargez instantanément votre compte.
                    </p>
                    <button
                      onClick={buyCreditsSimulation}
                      className="px-4 py-2 text-[10px] font-extrabold uppercase rounded bg-[#0E3A29] text-[#F2B11A] hover:bg-[#134934] transition flex items-center gap-1 shadow-sm"
                    >
                      <DollarSign size={11} /> Recharger +10 Crédits (Abonnement Démo)
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#0E3A29] uppercase tracking-wider block">Rôle cible</label>
                    <input
                      type="text"
                      value={targetRoleInput}
                      onChange={(e) => setTargetRoleInput(e.target.value)}
                      placeholder="Ex: Directeur Général, VP Sales..."
                      className="w-full px-3 py-2 text-xs font-sans rounded-lg border outline-none bg-fond text-[#0E3A29]"
                      style={{ borderColor: "rgba(14,58,41,0.15)" }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#0E3A29] uppercase tracking-wider block">Thématique critique</label>
                    <select
                      value={objectionThemeInput}
                      onChange={(e) => setObjectionThemeInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-sans rounded-lg border outline-none bg-white text-[#0E3A29]"
                      style={{ borderColor: "rgba(14,58,41,0.15)" }}
                    >
                      <option value="performance">Arbitrages financiers & EBITDA</option>
                      <option value="fusion">Conduite du changement & M&A</option>
                      <option value="conflit">Gouvernance & Dissensions Board</option>
                      <option value="general">Maturité de Leadership stratégique</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleGenerateCustomObjection}
                  disabled={generatingDynamic || objectionCredits <= 0}
                  className="w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition hover:opacity-90 disabled:opacity-50"
                  style={{ background: "#0E3A29", color: "#F2B11A" }}
                >
                  {generatingDynamic ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                  {generatingDynamic ? "Génération du défi..." : "Générer un défi Boardroom sur-mesure (IA)"}
                </button>
              </div>

              {/* Scenarios selector */}
              <div className="p-4 rounded-xl border space-y-3 bg-white" style={{ borderColor: "rgba(14,58,41,0.15)" }}>
                <span className="text-[10px] font-bold text-[#E3A316] uppercase tracking-wider block">
                  Scénarios d'Entraînement Standards
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {OBJECTION_SCENARIOS.map(sc => (
                    <button
                      key={sc.id}
                      onClick={() => {
                        setSelObjectionScenario(sc);
                        setObjectionResponseInput("");
                        setObjectionEvaluation(null);
                      }}
                      className="px-4 py-3 text-xs font-bold text-left rounded-lg transition-all duration-200 border flex items-center justify-between"
                      style={{
                        background: selObjectionScenario.id === sc.id ? "#0E3A29" : "transparent",
                        color: selObjectionScenario.id === sc.id ? "#F2B11A" : "#0E3A29",
                        borderColor: selObjectionScenario.id === sc.id ? "#0E3A29" : "rgba(14,58,41,0.15)"
                      }}
                    >
                      <span>{sc.title}</span>
                      <span className="text-[9px] opacity-60 font-medium hidden sm:inline">{sc.context}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question card */}
              <div className="p-5 rounded-xl border text-[#FAF6EF] space-y-2.5 relative overflow-hidden" style={{ background: "#0E3A29", borderColor: "rgba(242,177,26,0.3)" }}>
                <div className="absolute top-0 right-0 p-3 text-white/5 pointer-events-none">
                  <MessageSquare size={80} />
                </div>
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#F2B11A]">Scénario Stratégique Actif</span>
                <h4 className="text-xs font-bold text-[#FAF6EF]">{selObjectionScenario.title}</h4>
                <p className="text-sm font-bold italic leading-relaxed pt-1">
                  « {selObjectionScenario.objection} »
                </p>
                <p className="text-[10px] text-[#FAF6EF]/75 pt-1 border-t border-[#FAF6EF]/10">
                  🎯 Focus : {selObjectionScenario.context}
                </p>
              </div>

              {/* Response Textarea */}
              <div className="p-4 rounded-xl border space-y-2 bg-white" style={{ borderColor: "rgba(14,58,41,0.15)" }}>
                <label className="text-[11px] font-bold text-[#0E3A29] uppercase tracking-wider block">Votre réponse de dirigeant</label>
                <textarea
                  value={objectionResponseInput}
                  onChange={(e) => setObjectionResponseInput(e.target.value)}
                  placeholder="Formulez votre réponse pour convaincre le Board et désamorcer la question..."
                  rows={6}
                  className="w-full px-3 py-2.5 text-xs font-sans rounded-lg border outline-none resize-none bg-white text-[#0E3A29] focus:border-[#F2B11A]"
                  style={{ borderColor: "rgba(14,58,41,0.15)" }}
                />
              </div>

              <button
                onClick={handleEvaluateObjection}
                disabled={evaluatingObjection}
                className="w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 hover:opacity-90 active:scale-98"
                style={{ background: "#0E3A29", color: "#F2B11A" }}
              >
                {evaluatingObjection ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
                {evaluatingObjection ? "Analyse de la posture..." : "Évaluer ma défense d'objection (IA)"}
              </button>
            </div>

            {/* Objection evaluation result (Right Column) */}
            <div className="lg:col-span-6 space-y-4">
              {objectionEvaluation ? (
                <div className="p-6 rounded-2xl border space-y-6 text-[#FAF6EF]" style={{ background: "#0E3A29", borderColor: "rgba(242,177,26,0.3)" }}>
                  
                  {/* Risk Score */}
                  <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                    <div>
                      <h3 className="text-sm font-bold text-[#F2B11A] uppercase tracking-wider flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        Score de Risque Politique
                      </h3>
                      <p className="text-[10px] text-white/60">Risque de rupture ou de perte de crédibilité face au Board</p>
                    </div>
                    <div className="text-4xl font-black" style={{ color: objectionEvaluation.riskScore > 50 ? "#ef4444" : "#4ade80" }}>
                      {objectionEvaluation.riskScore}%
                    </div>
                  </div>

                  {/* Diplomacy Analysis */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-[#F2B11A] uppercase tracking-widest block">• Analyse Diplomatique</span>
                    <p className="text-xs leading-relaxed text-white/90">{objectionEvaluation.diplomacyAnalysis}</p>
                  </div>

                  {/* Financial justification */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-[#F2B11A] uppercase tracking-widest block">• Solidité de la justification financière</span>
                    <p className="text-xs leading-relaxed text-white/90">{objectionEvaluation.financialDefenseStrength}</p>
                  </div>

                  {/* Red flags */}
                  {objectionEvaluation.redFlagsDetected.length > 0 && (
                    <div className="space-y-2 p-4 rounded-xl border border-red-500/20 bg-red-500/5">
                      <span className="text-xs font-bold text-red-400 uppercase tracking-widest block flex items-center gap-1.5">
                        <AlertTriangle size={13} /> Signaux d'Alerte Détectés
                      </span>
                      <ul className="list-disc pl-4 text-xs text-red-200/90 space-y-1">
                        {objectionEvaluation.redFlagsDetected.map((red, idx) => (
                          <li key={idx}>{red}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Suggested phrasing C-Suite approved */}
                  <div className="space-y-3 pt-2">
                    <span className="text-xs font-bold text-[#F2B11A] uppercase tracking-widest block flex items-center gap-1.5">
                      <Handshake size={14} /> Reformulation C-Suite Validée
                    </span>
                    <div className="p-4 rounded-xl border italic leading-relaxed text-xs text-white bg-white/5" style={{ borderColor: "rgba(242,177,26,0.25)" }}>
                      « {objectionEvaluation.suggestedExecutivePhrasing} »
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border text-center flex flex-col items-center justify-center min-h-[360px] relative overflow-hidden"
                  style={{
                    borderColor: "rgba(14,58,41,0.15)",
                    backgroundImage: "url('/blocpeclair.png')",
                    backgroundSize: "100% 100%",
                    backgroundRepeat: "no-repeat",
                  }}>
                  <div className="relative z-10 flex flex-col items-center p-12">
                    <Shield size={24} className="text-texte-tertiaire/40 mb-3" />
                    <p className="text-sm font-semibold" style={{ color: "#0E3A29" }}>Cabinet d'Objections Inactif</p>
                    <p className="text-xs mt-1 max-w-[260px] mx-auto leading-relaxed" style={{ color: "#0E3A29" }}>
                      Sélectionnez ou générez un scénario à gauche, rédigez votre défense stratégique et cliquez sur <strong>Évaluer</strong>.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    <AIAssistant onApply={handleAISuggestion} />
    </>
  );
}
