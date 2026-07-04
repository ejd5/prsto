"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Building2, MapPin, Globe, Calendar, ExternalLink,
  Star, FileText, Copy, Loader2, AlertTriangle,
  CheckCircle2, Trash2, Link, Package,
  Briefcase, Banknote, Target, Zap, Shield, Gauge,
  Sliders, Settings, HelpCircle, Activity, Sparkles, Cpu, TrendingUp,
} from "lucide-react";
import { getOpportunity, updateOpportunity, deleteOpportunity } from "@/lib/actions/opportunity";
import { getScoreColor, getScoreBg } from "@/lib/score-colors";
import { analyzeJobOffer } from "@/lib/actions/analysis";
import { generateDocument } from "@/lib/actions/document";
import type { DocumentType } from "@/lib/generation/templates";
import { addToPipeline } from "@/lib/actions/pipeline";
import { exportCandidatureDossier } from "@/lib/actions/export-documents";
import { getTodos, addTodo, toggleTodo, deleteTodo } from "@/lib/actions/opportunity-todo";

const STATUS_OPTIONS = [
  { value: "nouveau", label: "Nouveau" },
  { value: "analyse", label: "À analyser" },
  { value: "postule", label: "Postulé" },
  { value: "relance", label: "Relance" },
  { value: "entretien", label: "Entretien" },
  { value: "offre", label: "Offre reçue" },
  { value: "refus", label: "Refus" },
  { value: "archive", label: "Archivé" },
];

interface OppDetail {
  id: string; title: string; company: string; location: string | null; country: string | null;
  sourceUrl: string | null; sourceName: string | null; contractType: string | null;
  remote: string | null; salaryMin: number | null; salaryMax: number | null; salaryCurrency: string;
  rawText: string; status: string; priority: number; notes: string | null; createdAt: string;
  analysis: { id: string; scoreGlobal: number | null; keywordsAts: string; exigences: string; risks: string; gaps: string; pointsForts: string; aiModel: string | null; analysedAt: string; } | null;
  pipelineTask: { column: string; nextStep: string | null; nextStepDate: string | null; recruiterName: string | null; recruiterEmail: string | null; recruiterLinkedin: string | null; recruiterTitle: string | null; cabinetName: string | null; } | null;
  documents: { id: string; type: string; validatedAt: string | null; }[];
}

export default function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [opp, setOpp] = useState<OppDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [exportingDossier, setExportingDossier] = useState(false);
  const [todos, setTodos] = useState<any[]>([]);
  const [newTodoTitle, setNewTodoTitle] = useState("");

  // Spott Pitch states
  const [pitch, setPitch] = useState("");
  const [generatingPitch, setGeneratingPitch] = useState(false);

  // Interactive Match Center states
  const [activeTab, setActiveTab] = useState<"overview" | "details" | "simulator" | "cv_optimization">("overview");
  const [strictLocation, setStrictLocation] = useState(false);
  const [excludeJunior, setExcludeJunior] = useState(true);
  const [minExperience, setMinExperience] = useState(12);
  const [weights, setWeights] = useState({
    role: 25,
    seniority: 20,
    location: 15,
    ats: 15,
    sector: 10,
    languages: 10,
    compensation: 5,
  });
  const [customKeywords, setCustomKeywords] = useState("");

  const notify = (type: "ok" | "err", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleGeneratePitch = async () => {
    setGeneratingPitch(true);
    try {
      const res = await fetch(`/api/opportunites/${id}/spott-pitch`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Impossible de générer la présentation");
      setPitch(data.pitch);
      notify("ok", "Présentation Spott AI générée !");
    } catch (e: any) {
      notify("err", e.message || "Erreur lors de la génération");
    } finally {
      setGeneratingPitch(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    notify("ok", "Présentation copiée dans le presse-papiers !");
  };

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getOpportunity(id);
    setOpp(data as OppDetail | null);
    setEditNotes(data?.notes || "");
    const todoList = await getTodos(id);
    setTodos(todoList);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const triggerBase64Download = (filename: string, base64: string, mimeType: string) => {
    const byteChars = atob(base64);
    const bytes = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
    const blob = new Blob([bytes], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportDossier = async () => {
    setExportingDossier(true);
    const r = await exportCandidatureDossier(id);
    setExportingDossier(false);
    if (!r.success) { notify("err", r.error); return; }
    triggerBase64Download(r.filename, r.base64, "application/zip");
    notify("ok", `Dossier téléchargé : ${r.filename}`);
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    const result = await analyzeJobOffer(id, false);
    setAnalyzing(false);
    if (result.success) {
      notify("ok", `Analyse terminée — Score: ${result.analysis?.score.globalScore}/100`);
      await load();
    } else {
      notify("err", result.error || "Erreur d'analyse");
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    notify("ok", "Copié !");
  };

  const handleStatusChange = async (status: string) => {
    if (!opp) return;
    setSaving(true);
    await updateOpportunity(id, { status });
    setOpp({ ...opp, status } as OppDetail);
    setSaving(false);
    notify("ok", "Statut mis à jour");
  };

  const handlePriorityToggle = async () => {
    if (!opp) return;
    const newP = opp.priority === 1 ? 0 : 1;
    await updateOpportunity(id, { priority: newP });
    setOpp({ ...opp, priority: newP } as OppDetail);
  };

  const handleSaveNotes = async () => {
    if (!opp) return;
    setSaving(true);
    try {
      await updateOpportunity(id, { notes: editNotes });
      setOpp({ ...opp, notes: editNotes } as OppDetail);
      setShowNotes(false);
      notify("ok", "Notes sauvegardées");
    } catch { notify("err", "Erreur"); }
    setSaving(false);
  };

  const handleAddTodo = async () => {
    if (!newTodoTitle.trim()) return;
    const res = await addTodo(id, newTodoTitle);
    if (res) {
      setTodos(prev => [...prev, res]);
      setNewTodoTitle("");
      notify("ok", "Tâche ajoutée");
    } else {
      notify("err", "Erreur lors de la création de la tâche");
    }
  };

  const handleToggleTodo = async (todoId: string, done: boolean) => {
    const success = await toggleTodo(todoId, done, id);
    if (success) {
      setTodos(prev => prev.map(t => t.id === todoId ? { ...t, done } : t));
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    const success = await deleteTodo(todoId, id);
    if (success) {
      setTodos(prev => prev.filter(t => t.id !== todoId));
      notify("ok", "Tâche supprimée");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Supprimer définitivement cette opportunité ?")) return;
    await deleteOpportunity(id);
    router.push("/opportunites");
  };

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--or)" }} />
      </div>
    );
  }

  if (!opp) {
    return (
      <div className="p-12 text-center" style={{ color: "var(--texte-tertiaire)" }}>
        <p className="text-sm font-mono">Opportunité introuvable</p>
        <button onClick={() => router.push("/opportunites")}
          className="mt-4 text-xs font-mono underline" style={{ color: "var(--or)" }}>
          Retour à la liste
        </button>
      </div>
    );
  }

  // Extraire un label de rôle depuis le titre
  const detectRoleLabel = (title: string): string => {
    const t = title.toLowerCase();
    if (t.match(/cto|vp\s*engineer|directeur\s*technique|head\s*of\s*engineering|lead\s*tech|chief\s*technology/)) return "Direction Technique";
    if (t.match(/cpo|head\s*of\s*product|directeur\s*produit|vp\s*product|lead\s*product/)) return "Direction Produit";
    if (t.match(/head\s*of\s*sales|vp\s*sales|directeur\s*commercial|sales\s*director/)) return "Direction Commerciale";
    if (t.match(/cmo|head\s*of\s*marketing|directeur\s*marketing|vp\s*marketing|marketing\s*director/)) return "Direction Marketing";
    if (t.match(/cfo|directeur\s*financier|head\s*of\s*finance|vp\s*finance/)) return "Direction Financière";
    if (t.match(/ceo|directeur\s*général|president|managing\s*director/)) return "Direction Générale";
    if (t.match(/senior|lead|principal|staff|manager/)) return "Cadre Supérieur";
    if (t.match(/engineer|dev|backe?nd|frontend|full.?stack|développeur|software/)) return "Ingénierie";
    if (t.match(/product\s*manager|chef\s*de\s*produit/)) return "Produit";
    if (t.match(/data\s*scientist|data\s*engineer|ml|machine\s*learning|ai/)) return "Data & IA";
    if (t.match(/consultant|consulting/)) return "Consulting";
    if (t.match(/commercial|account\s*executive|business\s*development|sales/)) return "Commercial";
    if (t.match(/marketing|growth|seo|content/)) return "Marketing";
    return "Opportunité";
  };

  const roleLabel = detectRoleLabel(opp.title);

  // getScoreColor importé depuis @/lib/score-colors

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      {/* Bandeau navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.push("/opportunites")}
          className="flex items-center gap-2 text-xs font-mono transition-colors"
          style={{ color: "var(--texte-tertiaire)" }}
          onMouseEnter={e => { e.currentTarget.style.color = "var(--or)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "var(--texte-tertiaire)"; }}>
          <ArrowLeft size={14} /> Retour aux opportunités
        </button>
        <div className="flex items-center gap-2">
          <button onClick={handlePriorityToggle}
            className="p-2 rounded-md border transition-colors"
            style={{ borderColor: opp.priority === 1 ? "var(--or)" : "var(--bordure)", color: opp.priority === 1 ? "var(--or)" : "var(--texte-tertiaire)" }}
            title={opp.priority === 1 ? "Retirer priorité" : "Marquer prioritaire"}>
            <Star size={15} fill={opp.priority === 1 ? "currentColor" : "none"} />
          </button>
          <button onClick={handleDelete}
            className="p-2 rounded-md border" style={{ borderColor: "var(--bordure)", color: "var(--erreur)" }}
            title="Supprimer">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {msg && (
        <div className="px-4 py-2 rounded-md text-sm font-mono border"
          style={{ background: msg.type === "ok" ? "rgba(74,222,128,0.1)" : "rgba(239,68,68,0.1)", color: msg.type === "ok" ? "var(--succes)" : "var(--erreur)", borderColor: msg.type === "ok" ? "rgba(74,222,128,0.3)" : "rgba(239,68,68,0.3)" }}>
          {msg.text}
        </div>
      )}

      {/* En-tête opportunité */}
      <div className="p-6 rounded-lg border space-y-4" style={{ background: "var(--fond-surface)", borderColor: opp.priority === 1 ? "rgba(198,166,78,0.4)" : "var(--bordure)" }}>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold uppercase tracking-wider"
                style={{ background: "rgba(34,197,94,0.15)", color: "rgb(34,197,94)", border: "1px solid rgba(34,197,94,0.3)" }}>
                <Briefcase size={12} /> {roleLabel}
              </span>
              {opp.contractType && (
                <span className="inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-full"
                  style={{ background: "var(--fond)", color: "var(--texte-secondaire)", border: "1px solid var(--bordure-douce)" }}>
                  {opp.contractType}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--texte)" }}>{opp.title}</h1>
            <div className="flex items-center gap-3 text-sm flex-wrap" style={{ color: "var(--texte-secondaire)" }}>
              <span className="flex items-center gap-1.5"><Building2 size={14} /> {opp.company}</span>
              {opp.location && <span className="flex items-center gap-1.5"><MapPin size={14} /> {opp.location}</span>}
              {opp.country && <span className="flex items-center gap-1.5"><Globe size={14} /> {opp.country}</span>}
            </div>
          </div>
          {/* Status selector */}
          <div className="flex flex-col items-end gap-2">
            <select value={opp.status} onChange={e => handleStatusChange(e.target.value)}
              className="input-prsto text-xs w-36">
              {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            {saving && <Loader2 size={12} className="animate-spin" style={{ color: "var(--or)" }} />}
          </div>
        </div>

        {/* Metadata pills */}
        <div className="flex flex-wrap items-center gap-2">
          {opp.contractType && (
            <span className="flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-full"
              style={{ background: "var(--fond)", color: "var(--texte-secondaire)", border: "1px solid var(--bordure-douce)" }}>
              <Briefcase size={11} /> {opp.contractType}
            </span>
          )}
          {opp.remote && opp.remote !== "tous" && (
            <span className="flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-full"
              style={{ background: "var(--fond)", color: "var(--texte-secondaire)", border: "1px solid var(--bordure-douce)" }}>
              <Globe size={11} /> {opp.remote}
            </span>
          )}
          {opp.salaryMin || opp.salaryMax ? (
            <span className="flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-full"
              style={{ background: "var(--fond)", color: "var(--texte-secondaire)", border: "1px solid var(--bordure-douce)" }}>
              <Banknote size={11} /> {opp.salaryMin && `${opp.salaryMin / 1000}k`}
              {opp.salaryMin && opp.salaryMax ? " - " : ""}
              {opp.salaryMax && `${opp.salaryMax / 1000}k`} {opp.salaryCurrency}
            </span>
          ) : null}
          {opp.sourceUrl && (
            <a href={opp.sourceUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-full transition-colors"
              style={{ background: "var(--fond)", color: "var(--info)", border: "1px solid var(--bordure-douce)" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--info)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--bordure-douce)"; }}>
              <ExternalLink size={11} /> Voir l&apos;offre originale
            </a>
          )}
          {opp.sourceName && (
            <span className="flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-full"
              style={{ background: "var(--fond)", color: "var(--texte-tertiaire)", border: "1px solid var(--bordure-douce)" }}>
              <Link size={11} /> via {opp.sourceName}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-full"
            style={{ background: "var(--fond)", color: "var(--texte-tertiaire)", border: "1px solid var(--bordure-douce)" }}>
            <Calendar size={11} /> {new Date(opp.createdAt).toLocaleDateString("fr-FR")}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Colonne gauche — contenu */}
        <div className="lg:col-span-2 space-y-5">
          {/* Description / texte brut */}
          {opp.rawText && (
            <div className="p-5 rounded-lg border space-y-4" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 rounded-full" style={{ background: "var(--or)" }} />
                  <h3 className="text-sm font-mono uppercase tracking-wider" style={{ color: "var(--or)" }}>
                    Description de l&apos;offre
                  </h3>
                </div>
                <button onClick={() => copyText(opp.rawText)}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded border transition-colors"
                  style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--or)"; e.currentTarget.style.color = "var(--or)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--bordure)"; e.currentTarget.style.color = "var(--texte-secondaire)"; }}>
                  <Copy size={11} /> Copier
                </button>
              </div>
              <div className="text-xs leading-relaxed whitespace-pre-wrap font-sans p-4 rounded-md"
                style={{ color: "var(--texte-secondaire)", background: "var(--fond)", maxHeight: 480, overflowY: "auto", border: "1px solid var(--bordure-douce)" }}>
                {opp.rawText.slice(0, 15000)}
                {opp.rawText.length > 15000 && (
                  <span className="block mt-2 text-xs font-mono" style={{ color: "var(--or)" }}>
                    ⚡ Affichage tronqué à 15 000 caractères
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono" style={{ color: "var(--texte-tertiaire)" }}>
                <FileText size={11} />
                <span>{opp.rawText.length.toLocaleString("fr-FR")} caractères</span>
              </div>
            </div>
          )}

          {/* Analyse interactive (si existe) */}
          {opp.analysis && (() => {
            const parsedKeywords: any[] = [];
            const parsedGaps: any[] = [];
            const parsedRisks: any[] = [];
            const parsedForts: any[] = [];
            const parsedExigences: any[] = [];
            
            try { parsedKeywords.push(...JSON.parse(opp.analysis.keywordsAts || "[]")); } catch {}
            try { parsedGaps.push(...JSON.parse(opp.analysis.gaps || "[]")); } catch {}
            try { parsedRisks.push(...JSON.parse(opp.analysis.risks || "[]")); } catch {}
            try { parsedForts.push(...JSON.parse(opp.analysis.pointsForts || "[]")); } catch {}
            try { parsedExigences.push(...JSON.parse(opp.analysis.exigences || "[]")); } catch {}

            // Dynamic score calculation
            const getSimulatedScores = () => {
              let roleScore = 88;
              if (parsedRisks.some(r => /junior|stage|alternance|sdr|bdr/i.test(r))) roleScore = 25;
              else if (excludeJunior && opp.title.toLowerCase().match(/junior|stage|alternance|sdr|bdr/)) roleScore = 15;

              let seniorityScore = 80;
              const matchExp = opp.rawText.match(/(\d+)\s*(?:ans?|years?)/i);
              const reqYears = matchExp ? parseInt(matchExp[1]) : 8;
              if (minExperience < reqYears) {
                seniorityScore = Math.max(30, 80 - (reqYears - minExperience) * 10);
              } else {
                seniorityScore = Math.min(100, 80 + (minExperience - reqYears) * 5);
              }

              let locationScore = 85;
              if (parsedRisks.some(r => /localisation|geographique|remote/i.test(r))) {
                locationScore = strictLocation ? 20 : 55;
              }

              let languagesScore = 90;
              if (parsedGaps.some(g => /anglais|english|langue/i.test(g))) {
                languagesScore = 40;
              }

              const totalKeywords = parsedKeywords.length || 1;
              const missingKeywords = parsedGaps.filter(g => parsedKeywords.some(k => g.toLowerCase().includes(k.toLowerCase()))).length;
              const atsScore = Math.round(((totalKeywords - missingKeywords) / totalKeywords) * 100);

              let sectorScore = 80;
              if (parsedGaps.some(g => /secteur/i.test(g))) sectorScore = 45;

              let compensationScore = 80;
              if (parsedRisks.some(r => /salaire|remuneration/i.test(r))) compensationScore = 50;

              // Apply custom keyword simulation
              let customBonus = 0;
              if (customKeywords.trim()) {
                const words = customKeywords.toLowerCase().split(/[\s,]+/).filter(Boolean);
                const matched = words.filter(w => opp.rawText.toLowerCase().includes(w)).length;
                if (words.length > 0) {
                  customBonus = Math.round((matched / words.length) * 10);
                }
              }

              const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
              const weightedSum = 
                (roleScore * weights.role) + 
                (seniorityScore * weights.seniority) + 
                (locationScore * weights.location) + 
                (atsScore * weights.ats) + 
                (sectorScore * weights.sector) + 
                (languagesScore * weights.languages) + 
                (compensationScore * weights.compensation);
              
              let finalScore = Math.round(weightedSum / totalWeight) + customBonus;
              if (excludeJunior && parsedRisks.some(r => /junior|stage|alternance|sdr|bdr/i.test(r))) {
                finalScore = Math.min(finalScore, 30);
              }
              if (strictLocation && parsedRisks.some(r => /localisation|geographique/i.test(r))) {
                finalScore = Math.min(finalScore, 20);
              }

              return {
                global: Math.min(100, Math.max(0, finalScore)),
                role: roleScore,
                seniority: seniorityScore,
                location: locationScore,
                languages: languagesScore,
                ats: atsScore,
                sector: sectorScore,
                compensation: compensationScore
              };
            };

            const sim = getSimulatedScores();
            const originalScore = opp.analysis.scoreGlobal || 0;

            const getRecommendationLabel = (score: number) => {
              if (score >= 90) return { label: "Match Parfait", color: getScoreColor(score), bg: getScoreBg(score, 0.12) };
              if (score >= 75) return { label: "Très Bon Match", color: getScoreColor(score), bg: getScoreBg(score, 0.1) };
              if (score >= 60) return { label: "Bon Match", color: getScoreColor(score), bg: getScoreBg(score, 0.1) };
              if (score >= 45) return { label: "Match Moyen", color: getScoreColor(score), bg: getScoreBg(score, 0.1) };
              if (score >= 30) return { label: "Match Faible", color: getScoreColor(score), bg: getScoreBg(score, 0.1) };
              return { label: "Incompatible", color: getScoreColor(score), bg: getScoreBg(score, 0.12) };
            };

            const rec = getRecommendationLabel(sim.global);

            // CV Tailoring Generator suggestions
            const getCvTailorSuggestions = () => {
              const suggestions = [];
              if (parsedGaps.length === 0) {
                return [{ kw: "Aucun gap majeur", text: "Votre profil correspond parfaitement. Mettez en avant vos chiffres de performance clés." }];
              }
              for (const gap of parsedGaps) {
                const cleanGap = gap.replace(/\[.*?\]/, "").trim();
                let suggestionText = "";
                if (cleanGap.toLowerCase().includes("langue") || cleanGap.toLowerCase().includes("anglais")) {
                  suggestionText = "Ajouter dans l'en-tête du profil : 'Négociation et présentations stratégiques courantes en Anglais (contexte multinational)'.";
                } else if (cleanGap.toLowerCase().includes("salesforce") || cleanGap.toLowerCase().includes("crm")) {
                  suggestionText = "Décrire dans votre dernière expérience : 'Pilotage du pipeline de vente et prévisions commerciales via Salesforce'.";
                } else if (cleanGap.toLowerCase().includes("p&l") || cleanGap.toLowerCase().includes("budget")) {
                  suggestionText = "Préciser sous vos expériences : 'Responsable de la performance commerciale et gestion du budget de fonctionnement annuel ($M)'.";
                } else if (cleanGap.toLowerCase().includes("secteur") || cleanGap.toLowerCase().includes("saas")) {
                  suggestionText = "Ajouter au résumé du CV : 'Expertise commerciale transverse appliquée avec succès à de nouveaux secteurs (SaaS, Services, Industrie)'.";
                } else {
                  suggestionText = `Formuler une réalisation clé : 'Mise en œuvre opérationnelle et structuration des processus liés à : ${cleanGap}'.`;
                }
                suggestions.push({ kw: cleanGap, text: suggestionText });
              }
              return suggestions;
            };

            return (
              <div className="p-6 rounded-lg border space-y-6" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
                {/* Header Widget */}
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b gap-4" style={{ borderColor: "var(--bordure-douce)" }}>
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-5 rounded-full" style={{ background: "var(--or)" }} />
                      <h3 className="text-sm font-mono uppercase tracking-wider font-bold" style={{ color: "var(--or)" }}>
                        Centre de Matching & Simulateur
                      </h3>
                    </div>
                    <p className="text-xs font-mono mt-1.5" style={{ color: "var(--texte-tertiaire)" }}>
                      Propulsé par PRSTO Engine v2.0 — Ajustez les critères en temps réel
                    </p>
                  </div>

                  {/* Tabs Selectors */}
                  <div className="flex border rounded-md overflow-hidden flex-wrap" style={{ borderColor: "var(--bordure)" }}>
                    {[
                      { id: "overview", label: "Vue d'ensemble" },
                      { id: "details", label: "Mots-clés ATS" },
                      { id: "simulator", label: "Simulateur" },
                      { id: "cv_optimization", label: "Ajustement CV" },
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className="px-4 py-2 text-xs font-mono transition-colors whitespace-nowrap flex-1 min-w-fit"
                        style={{
                          background: activeTab === tab.id ? "var(--or-faible)" : "transparent",
                          color: activeTab === tab.id ? "var(--or)" : "var(--texte-secondaire)",
                          borderLeft: tab.id !== "overview" ? "1px solid var(--bordure)" : "none",
                          fontWeight: activeTab === tab.id ? 700 : 400,
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* TAB 1: OVERVIEW — min-h pour éviter l'écrasement */}
                {activeTab === "overview" && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center min-h-[280px]">
                    {/* Ring gauge */}
                    <div className="md:col-span-4 flex flex-col items-center justify-center text-center">
                      <div className="relative w-32 h-32 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="40" stroke="var(--bordure-douce)" strokeWidth="6" fill="transparent" />
                          <circle cx="50" cy="50" r="40" stroke={getScoreColor(sim.global)} strokeWidth="6" fill="transparent"
                            strokeDasharray={251.2}
                            strokeDashoffset={251.2 - (251.2 * sim.global) / 100}
                            style={{ transition: "stroke-dashoffset 0.5s ease" }}
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                          <span className="text-3xl font-extrabold" style={{ color: getScoreColor(sim.global) }}>
                            {sim.global}%
                          </span>
                          <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--texte-tertiaire)" }}>
                            Simulé
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 px-3 py-1 rounded text-xs font-mono font-bold" style={{ color: rec.color, background: rec.bg }}>
                        {rec.label}
                      </div>
                    </div>

                    {/* Quick Stats & Recommendation text */}
                    <div className="md:col-span-8 space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--texte-tertiaire)" }}>Compatibilité Globale</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ background: "var(--fond)", color: "var(--texte-tertiaire)", border: "1px solid var(--bordure-douce)" }}>
                            Score pondéré
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: "var(--texte-secondaire)" }}>
                          L'analyse initiale de l'offre attribuait un score de <strong style={{ color: getScoreColor(originalScore) }}>{originalScore}%</strong> d'adéquation avec votre profil.
                          {sim.global !== originalScore ? (
                            <span> Après application de vos réglages personnalisés (filtres, pondérations, simulation de compétences), le score ajusté est de <strong style={{ color: getScoreColor(sim.global) }}>{sim.global}%</strong>.</span>
                          ) : (
                            <span> Ce score reflète l'adéquation calculée entre votre CV Maître et les exigences de l'offre, selon les critères PRSTO.</span>
                          )}
                        </p>
                        <div className="flex items-center gap-3 text-[10px] font-mono p-2 rounded-md" style={{ background: "var(--fond)", border: "1px solid var(--bordure-douce)" }}>
                          <HelpCircle size={11} style={{ color: "var(--texte-tertiaire)" }} />
                          <span style={{ color: "var(--texte-tertiaire)" }}>
                            Ajustez les critères dans l'onglet <strong style={{ color: "var(--or)" }}>Simulateur</strong> pour tester différents scénarios
                          </span>
                        </div>
                      </div>

                      {/* Dimensions Mini Progress Bars */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 pt-2">
                        {[
                          { label: "Rôle Fit", val: sim.role },
                          { label: "Séniorité", val: sim.seniority },
                          { label: "Localisation", val: sim.location },
                          { label: "Langues", val: sim.languages },
                          { label: "ATS Keywords", val: sim.ats },
                          { label: "Secteur", val: sim.sector },
                        ].map(dim => (
                          <div key={dim.label} className="space-y-1">
                            <div className="flex justify-between text-[10px] font-mono" style={{ color: "var(--texte-tertiaire)" }}>
                              <span>{dim.label}</span>
                              <span style={{ color: sim.global >= 50 ? "var(--texte)" : "var(--texte-secondaire)" }}>{dim.val}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-[var(--bordure-douce)] rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${dim.val}%`,
                                  background: getScoreColor(dim.val)
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: ATS HEATMAP & GAPS */}
                {activeTab === "details" && (
                  <div className="space-y-4 min-h-[280px]">
                    <div className="space-y-1">
                      <h4 className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--texte-secondaire)" }}>
                        Visualiseur de Mots-Clés & Heatmap
                      </h4>
                      <p className="text-[11px] font-mono" style={{ color: "var(--texte-tertiaire)" }}>
                        Ci-dessous la correspondance exacte entre les exigences de l'offre et votre CV.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {parsedKeywords.map((kw, i) => {
                        const isGap = parsedGaps.some(g => g.toLowerCase().includes(kw.toLowerCase()));
                        const isFort = parsedForts.some(f => f.toLowerCase().includes(kw.toLowerCase()));
                        
                        let badgeBg = "rgba(239,68,68,0.1)";
                        let badgeColor = "var(--erreur)";
                        let badgeBorder = "rgba(239,68,68,0.2)";
                        let label = "Gap";

                        if (isFort) {
                          badgeBg = "rgba(34,197,94,0.1)";
                          badgeColor = "var(--succes)";
                          badgeBorder = "rgba(34,197,94,0.2)";
                          label = "Requis validé";
                        } else if (!isGap) {
                          badgeBg = "rgba(212,175,55,0.1)";
                          badgeColor = "var(--or)";
                          badgeBorder = "rgba(212,175,55,0.2)";
                          label = "Partiel / Connexe";
                        }

                        return (
                          <div key={i} className="p-2.5 rounded border flex flex-col justify-between"
                            style={{ background: badgeBg, borderColor: badgeBorder }}>
                            <span className="text-xs font-mono font-bold truncate" style={{ color: badgeColor }}>
                              {kw}
                            </span>
                            <span className="text-[9px] font-mono uppercase mt-1 opacity-70" style={{ color: badgeColor }}>
                              {label}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Additional signals */}
                    {parsedRisks.length > 0 && (
                      <div className="p-3 rounded border border-red-950/20 bg-red-950/5 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-mono font-bold" style={{ color: "var(--erreur)" }}>
                          <AlertTriangle size={12} /> Points de vigilance détectés
                        </div>
                        <ul className="list-disc pl-4 space-y-0.5">
                          {parsedRisks.map((r, i) => (
                            <li key={i} className="text-xs" style={{ color: "var(--texte-secondaire)" }}>
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: SIMULATOR */}
                {activeTab === "simulator" && (
                  <div className="space-y-5 min-h-[280px]">
                    <div className="p-3 rounded border font-mono text-xs flex justify-between items-center" style={{ background: "var(--fond)", borderColor: "var(--bordure-douce)" }}>
                      <span style={{ color: "var(--texte-secondaire)" }}>Score simulé en direct :</span>
                      <span className="text-lg font-bold" style={{ color: rec.color }}>{sim.global}%</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left: Toggles */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--or)" }}>
                          Contraintes & Filtres
                        </h4>

                        <label className="flex items-center justify-between p-2.5 rounded border cursor-pointer hover:bg-prsto-faible transition-colors"
                          style={{ borderColor: "var(--bordure)", background: "var(--fond)" }}>
                          <div className="space-y-0.5">
                            <span className="text-xs font-mono" style={{ color: "var(--texte)" }}>Filtrer strictement la géographie</span>
                            <p className="text-[10px]" style={{ color: "var(--texte-tertiaire)" }}>Sanctionne l'écart géographique</p>
                          </div>
                          <input type="checkbox" checked={strictLocation} onChange={e => setStrictLocation(e.target.checked)} className="accent-[var(--or)]" />
                        </label>

                        <label className="flex items-center justify-between p-2.5 rounded border cursor-pointer hover:bg-prsto-faible transition-colors"
                          style={{ borderColor: "var(--bordure)", background: "var(--fond)" }}>
                          <div className="space-y-0.5">
                            <span className="text-xs font-mono" style={{ color: "var(--texte)" }}>Exclure les postes Juniors/SDR</span>
                            <p className="text-[10px]" style={{ color: "var(--texte-tertiaire)" }}>Écarte d'office le middle/junior management</p>
                          </div>
                          <input type="checkbox" checked={excludeJunior} onChange={e => setExcludeJunior(e.target.checked)} className="accent-[var(--or)]" />
                        </label>

                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-mono" style={{ color: "var(--texte-secondaire)" }}>
                            <span>Années d'expérience exigées</span>
                            <span style={{ color: "var(--or)" }}>{minExperience} ans</span>
                          </div>
                          <input type="range" min="3" max="25" value={minExperience} onChange={e => setMinExperience(parseInt(e.target.value))}
                            className="w-full accent-[var(--or)]" />
                        </div>
                      </div>

                      {/* Right: Weights */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--or)" }}>
                          Pondération des critères
                        </h4>

                        {[
                          { id: "role", label: "Adéquation Rôle & Titre" },
                          { id: "seniority", label: "Alignement Séniorité" },
                          { id: "location", label: "Localisation & Mobilité" },
                          { id: "ats", label: "Densité Mots-Clés ATS" },
                          { id: "sector", label: "Expertise Sectorielle" },
                        ].map(crit => (
                          <div key={crit.id} className="space-y-1.5">
                            <div className="flex justify-between text-[11px] font-mono" style={{ color: "var(--texte-tertiaire)" }}>
                              <span>{crit.label}</span>
                              <span>{(weights as any)[crit.id]} pts</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="50"
                              value={(weights as any)[crit.id]}
                              onChange={e => setWeights(prev => ({ ...prev, [crit.id]: parseInt(e.target.value) }))}
                              className="w-full accent-[var(--or)] h-1"
                            />
                          </div>
                        ))}

                        {/* Keyword test simulation */}
                        <div className="pt-2 space-y-1.5">
                          <span className="text-[11px] font-mono" style={{ color: "var(--texte-secondaire)" }}>Simuler d'autres compétences (mots-clés)</span>
                          <input type="text" value={customKeywords} onChange={e => setCustomKeywords(e.target.value)}
                            placeholder="ex: SaaS, International, Management" className="input-prsto text-xs py-1" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: CV OPTIMIZATION */}
                {activeTab === "cv_optimization" && (
                  <div className="space-y-4 min-h-[280px]">
                    <div className="space-y-1">
                      <h4 className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--or)" }}>
                        Moteur d'Adaptation & Alignement CV
                      </h4>
                      <p className="text-[11px]" style={{ color: "var(--texte-tertiaire)" }}>
                        Voici comment corriger vos points faibles ou compétences manquantes pour maximiser le matching sémantique.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {getCvTailorSuggestions().map((sug, i) => (
                        <div key={i} className="p-3.5 rounded border space-y-2 bg-[var(--fond)]" style={{ borderColor: "var(--bordure-douce)" }}>
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--or)]" />
                            <span className="text-xs font-mono font-bold" style={{ color: "var(--or)" }}>
                              {sug.kw}
                            </span>
                          </div>
                          <p className="text-xs italic" style={{ color: "var(--texte-secondaire)" }}>
                            &ldquo;{sug.text}&rdquo;
                          </p>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(sug.text);
                              notify("ok", "Suggestion copiée !");
                            }}
                            className="text-[10px] font-mono hover:underline transition-all" style={{ color: "var(--info)" }}>
                            Copier la suggestion pour le CV
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {!opp.analysis && (
            <div className="p-8 rounded-lg border text-center space-y-3"
              style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)", borderStyle: "dashed" }}>
              <Target size={24} className="mx-auto opacity-30" style={{ color: "var(--or)" }} />
              <p className="text-xs font-mono" style={{ color: "var(--texte-tertiaire)" }}>
                Pas encore d&apos;analyse pour cette offre
              </p>
              <button onClick={handleAnalyze} disabled={analyzing || !opp.rawText}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono rounded-md border transition-colors"
                style={{
                  borderColor: opp.rawText ? "var(--or)" : "var(--bordure)",
                  color: opp.rawText ? "var(--or)" : "var(--texte-tertiaire)",
                  opacity: analyzing ? 0.6 : 1,
                }}>
                {analyzing ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                {analyzing ? "Analyse en cours..." : opp.rawText ? "Analyser l'offre" : "Ajoutez le texte de l'offre pour analyser"}
              </button>
            </div>
          )}
        </div>

        {/* Colonne droite — actions / meta */}
        <div className="space-y-4">
          {/* Actions */}
          <div className="p-4 rounded-lg border space-y-3" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
            <h3 className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--texte-secondaire)" }}>
              Actions
            </h3>
            <button onClick={() => copyText(opp.rawText || "")}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-mono rounded-md border transition-colors"
              style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--or)"; e.currentTarget.style.color = "var(--or)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--bordure)"; e.currentTarget.style.color = "var(--texte-secondaire)"; }}>
              <Copy size={13} /> Copier la description
            </button>
            <PrepareApplicationButton opp={opp} router={router} />
            <button onClick={handleExportDossier} disabled={exportingDossier}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-mono rounded-md border transition-colors"
              style={{ borderColor: "var(--or)", color: "var(--or)", background: "transparent" }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--or-faible)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
              {exportingDossier ? <Loader2 size={13} className="animate-spin" /> : <Package size={13} />}
              Exporter dossier candidature (.zip)
            </button>
            {opp.sourceUrl && (
              <a href={opp.sourceUrl} target="_blank" rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-mono rounded-md border transition-colors"
                style={{ borderColor: "var(--bordure)", color: "var(--info)" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--info)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--bordure)"; }}>
                <ExternalLink size={13} /> Ouvrir l&apos;offre originale
              </a>
            )}
          </div>

          {/* Notes */}
          <div className="p-4 rounded-lg border space-y-3" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--texte-secondaire)" }}>
                Notes
              </h3>
              <button onClick={() => { setEditNotes(opp.notes || ""); setShowNotes(!showNotes); }}
                className="text-xs font-mono" style={{ color: "var(--or)" }}>
                {showNotes ? "Annuler" : opp.notes ? "Modifier" : "Ajouter"}
              </button>
            </div>
            {showNotes ? (
              <div className="space-y-2">
                <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)}
                  rows={4} className="input-prsto text-xs"
                  placeholder="Notes personnelles sur cette offre..." />
                <button onClick={handleSaveNotes}
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-md"
                  style={{ background: "var(--or)", color: "var(--fond)" }}>
                  Sauvegarder
                </button>
              </div>
            ) : opp.notes ? (
              <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: "var(--texte-secondaire)" }}>
                {opp.notes}
              </p>
            ) : (
              <p className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>
                Aucune note
              </p>
            )}
          </div>

          {/* Checklist Tâches */}
          <div className="p-4 rounded-lg border space-y-3" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
            <h3 className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--texte-secondaire)" }}>
              Checklist Tâches
            </h3>
            
            {/* Input d'ajout */}
            <div className="flex gap-1.5">
              <input
                type="text"
                value={newTodoTitle}
                onChange={e => setNewTodoTitle(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleAddTodo(); }}
                placeholder="Nouvelle tâche..."
                className="flex-1 input-prsto text-xs px-2.5 py-1.5"
              />
              <button
                onClick={handleAddTodo}
                className="px-3 py-1.5 text-xs font-mono rounded border cursor-pointer"
                style={{ borderColor: "var(--or)", color: "var(--or)" }}
              >
                +
              </button>
            </div>

            {/* Liste des tâches */}
            {todos.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>
                Aucune tâche à faire.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {todos.map(todo => (
                  <div key={todo.id} className="flex items-center justify-between gap-2 p-1.5 rounded transition-colors" style={{ background: "var(--fond)" }}>
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={todo.done}
                        onChange={e => handleToggleTodo(todo.id, e.target.checked)}
                        className="cursor-pointer"
                      />
                      <span
                        className="text-xs truncate"
                        style={{
                          color: todo.done ? "var(--texte-tertiaire)" : "var(--texte-secondaire)",
                          textDecoration: todo.done ? "line-through" : "none",
                        }}
                      >
                        {todo.title}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteTodo(todo.id)}
                      className="p-1 text-xs hover:text-red-500 cursor-pointer"
                      style={{ color: "var(--texte-tertiaire)" }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Présentation Spott AI */}
          <div className="p-4 rounded-lg border space-y-3" style={{ background: "var(--fond-surface)", borderColor: "var(--or)" }}>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--or)" }}>
                ⚡ Présentation Candidat (Spott AI)
              </h3>
              <span className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ background: "rgba(200, 166, 78, 0.1)", color: "var(--or)" }}>
                Premium
              </span>
            </div>
            
            <p className="text-[11px]" style={{ color: "var(--texte-secondaire)" }}>
              Générez une fiche d'adéquation et un pitch d'approche LinkedIn/Email basé sur le CV Maître et les exigences de l'offre.
            </p>

            {pitch ? (
              <div className="space-y-3">
                <pre className="p-3 rounded text-[11px] leading-relaxed whitespace-pre-wrap font-mono max-h-60 overflow-y-auto" 
                     style={{ background: "var(--fond)", border: "1px solid var(--bordure-douce)", color: "var(--texte)" }}>
                  {pitch}
                </pre>
                <div className="flex gap-2">
                  <button onClick={handleGeneratePitch} disabled={generatingPitch}
                    className="px-3 py-1.5 text-xs font-mono rounded border cursor-pointer flex items-center gap-1.5"
                    style={{ borderColor: "var(--or)", color: "var(--or)" }}>
                    {generatingPitch ? <Loader2 size={10} className="animate-spin" /> : "Mettre à jour"}
                  </button>
                  <button onClick={() => copyToClipboard(pitch)}
                    className="px-3 py-1.5 text-xs font-mono rounded cursor-pointer text-black"
                    style={{ background: "var(--or)" }}>
                    Copier le pitch
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={handleGeneratePitch} disabled={generatingPitch}
                className="w-full py-2 text-xs font-mono font-bold rounded cursor-pointer text-black flex items-center justify-center gap-2"
                style={{ background: "var(--or)" }}>
                {generatingPitch ? <Loader2 size={12} className="animate-spin" /> : "Générer la Présentation"}
              </button>
            )}
          </div>

          {/* Pipeline info */}
          <PipelineSection opp={opp} router={router} />

          {/* Documents liés */}
          {opp.documents?.length > 0 && (
            <div className="p-4 rounded-lg border space-y-2" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
              <h3 className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--texte-secondaire)" }}>
                Documents ({opp.documents.length})
              </h3>
              <div className="space-y-1">
                {opp.documents.map((doc: OppDetail["documents"][number]) => (
                  <div key={doc.id} className="flex items-center gap-2 text-xs" style={{ color: "var(--texte-secondaire)" }}>
                    <FileText size={11} style={{ color: "var(--texte-tertiaire)" }} />
                    <span className="font-mono">{doc.type}</span>
                    {doc.validatedAt && <CheckCircle2 size={10} style={{ color: "var(--succes)" }} />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Bouton Préparer candidature ─── */
function PrepareApplicationButton({ opp, router }: { opp: OppDetail; router: ReturnType<typeof useRouter> }) {
  const [showTypes, setShowTypes] = useState(false);
  const [docType, setDocType] = useState<DocumentType>("cv_fr");
  const [generating, setGenerating] = useState(false);

  const hasRawText = !!opp.rawText;

  const handleGenerate = async () => {
    setGenerating(true);
    const result = await generateDocument(opp.id, docType, false);
    setGenerating(false);
    if (result.success && result.document) {
      router.push(`/documents/${result.document.id}`);
    }
  };

  if (!showTypes) {
    return (
      <button onClick={() => hasRawText ? setShowTypes(true) : null}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-mono rounded-md border transition-colors"
        style={{
          borderColor: hasRawText ? "var(--or)" : "var(--bordure)",
          color: hasRawText ? "var(--or)" : "var(--texte-tertiaire)",
          opacity: hasRawText ? 1 : 0.5,
          cursor: hasRawText ? "pointer" : "not-allowed",
        }}>
        <FileText size={13} /> {hasRawText ? "Préparer candidature" : "Ajoutez le texte de l'offre"}
      </button>
    );
  }

  return (
    <div className="space-y-2 p-3 rounded-md border" style={{ borderColor: "var(--or)", background: "var(--fond)" }}>
      <select value={docType} onChange={e => setDocType(e.target.value as DocumentType)}
        className="input-prsto text-xs w-full">
        <option value="cv_fr">CV adapté — Français</option>
        <option value="cv_en">CV adapted — English</option>
        <option value="lettre_fr">Lettre de motivation — Français</option>
        <option value="lettre_en">Cover letter — English</option>
        <option value="email_fr">Email candidature — Français</option>
        <option value="email_en">Application email — English</option>
        <option value="linkedin_fr">Message LinkedIn — Français</option>
        <option value="linkedin_en">LinkedIn message — English</option>
        <option value="ats_reponse">Réponses ATS</option>
      </select>
      <div className="flex gap-2">
        <button onClick={handleGenerate} disabled={generating}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md"
          style={{ background: "var(--or)", color: "var(--fond)" }}>
          {generating ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
          Générer
        </button>
        <button onClick={() => setShowTypes(false)}
          className="px-3 py-1.5 text-xs font-mono rounded-md border"
          style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)" }}>
          Annuler
        </button>
      </div>
    </div>
  );
}

/* ─── Section Pipeline ─── */
function PipelineSection({ opp, router }: { opp: OppDetail; router: ReturnType<typeof useRouter> }) {
  const [adding, setAdding] = useState(false);

  const handleAddToPipeline = async () => {
    setAdding(true);
    try {
      await addToPipeline(opp.id);
      // Recharger la page
      window.location.reload();
    } catch {
      setAdding(false);
    }
  };

  if (opp.pipelineTask) {
    const pt = opp.pipelineTask;
    return (
      <div className="p-4 rounded-lg border space-y-3" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--texte-secondaire)" }}>
            Pipeline
          </h3>
          <button onClick={() => router.push("/dashboard/jobs/pipeline")}
            className="text-xs font-mono underline" style={{ color: "var(--or)" }}>
            Voir le Kanban →
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: "var(--or-faible)", color: "var(--or)" }}>
            {pt.column}
          </span>
          {pt.nextStep && (
            <span className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>
              → {pt.nextStep}
              {pt.nextStepDate ? ` (${new Date(pt.nextStepDate).toLocaleDateString("fr-FR")})` : ""}
            </span>
          )}
        </div>
        {(pt.recruiterName || pt.recruiterEmail || pt.recruiterLinkedin) && (
          <div className="space-y-1 pt-1 border-t" style={{ borderColor: "var(--bordure-douce)" }}>
            <span className="text-xs font-mono" style={{ color: "var(--texte-tertiaire)" }}>Contact recruteur</span>
            {pt.recruiterName && <p className="text-xs" style={{ color: "var(--texte-secondaire)" }}>{pt.recruiterName}{pt.recruiterTitle ? ` — ${pt.recruiterTitle}` : ""}</p>}
            {pt.recruiterEmail && <p className="text-xs font-mono" style={{ color: "var(--info)" }}>{pt.recruiterEmail}</p>}
            {pt.recruiterLinkedin && <p className="text-xs font-mono" style={{ color: "var(--info)" }}>{pt.recruiterLinkedin}</p>}
            {pt.cabinetName && <p className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>Cabinet: {pt.cabinetName}</p>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg border space-y-2" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
      <h3 className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--texte-secondaire)" }}>
        Pipeline
      </h3>
      <p className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>
        Cette opportunité n&apos;est pas encore dans le pipeline.
      </p>
      <button onClick={handleAddToPipeline} disabled={adding}
        className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-mono rounded-md border transition-colors"
        style={{ borderColor: "var(--or)", color: "var(--or)" }}>
        {adding ? <Loader2 size={12} className="animate-spin" /> : null}
        Ajouter au pipeline
      </button>
    </div>
  );
}

/* ─── Section Analyse ─── */
function AnalysisSection({ title, icon, items, color }: {
  title: string; icon: React.ReactNode; items: string; color?: string;
}) {
  let parsed: string[] = [];
  try { parsed = JSON.parse(items || "[]"); } catch { parsed = []; }
  if (!parsed.length) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span style={{ color: color || "var(--texte-secondaire)" }}>{icon}</span>
        <span className="text-xs font-mono uppercase" style={{ color: color || "var(--texte-secondaire)" }}>
          {title} ({parsed.length})
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {parsed.map((item, i) => (
          <span key={i} className="text-xs font-mono px-2 py-1 rounded"
            style={{ background: `${color || "var(--texte-secondaire)"}15`, color: color || "var(--texte-secondaire)" }}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
